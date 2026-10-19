/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Classroom Lesson Website
 * Native HTML5 Cloudflare R2 Video & Spotify-Style Live Synchronized Timestamps
 * With Custom Fullscreen Lesson Mode & Auto-Fading Overlay
 */

// =========================================================================
// 1. LESSON TIMESTAMPS & STEP INSTRUCTIONS (EASY TO EDIT)
// Add, edit, or adjust your lesson steps below.
// Use "mm:ss" format for timestamps (e.g., "01:25") or total seconds.
// =========================================================================
export const LESSON_STEPS = [
  {
    time: "00:00",
    text: "Plug in the usb flash drive."
  },
  {
    time: "00:15",
    text: "Backup your important USB files to your computer."
  },
  {
    time: "01:05",
    text: "Locate where your rufus is downloaded and launch it."
  },
  {
    time: "01:15",
    text: "Set-up Rufus according to the video.\n  (Breakdown):\n   Image option: Disk or ISO img\n   Click on Select and locate your iso file.\n   Partition scheme: MBR\n   Target System: BIOS\n   Else is set to default."
  },
  {
    time: "01:52",
    text: "Wait until Rufus finish the extraction."
  },
  {
    time: "03:01",
    text: "Verify if the flash drive has the files inside."
  },
  {
    time: "03:25",
    text: "Copy the backed up folder from your computer back to your flash drive."
  }
];

// Exact Cloudflare R2 direct streaming video URL
export const VIDEO_SOURCE_URL = "https://pub-f66d430043214809bbc226d0d6a0fda9.r2.dev/2026-10-18%2021-15-53.mp4";

// =========================================================================
// 2. PARSED & SORTED DATA
// =========================================================================
const parsedSteps = LESSON_STEPS.map((step, index) => {
  const seconds = parseTimeToSeconds(step.time);
  return {
    index,
    time: formatSecondsToMmSs(seconds),
    seconds,
    text: step.text
  };
}).sort((a, b) => a.seconds - b.seconds);

// =========================================================================
// 3. APPLICATION STATE
// =========================================================================
let currentActiveIndex = -1;
let isUserInteracting = false;
let userInteractionTimeout = null;

// Fullscreen & Overlay State
let isFullscreen = false;
let isOverlayPinned = false;
let autoHideTimer = null;

// DOM Elements
const videoEl = document.getElementById("lessonVideo");
const workspaceEl = document.getElementById("lessonWorkspace");
const transcriptSectionEl = document.getElementById("transcriptSection");
const stepsContainerEl = document.getElementById("stepsListContainer");
const activeIndicatorEl = document.getElementById("activeStepIndicator");
const videoErrorEl = document.getElementById("videoErrorMessage");

// Fullscreen Controls
const fullscreenBtn = document.getElementById("lessonFullscreenBtn");
const fullscreenBtnText = document.getElementById("fullscreenBtnText");
const iconEnterFullscreen = fullscreenBtn?.querySelector(".icon-enter-fullscreen");
const iconExitFullscreen = fullscreenBtn?.querySelector(".icon-exit-fullscreen");
const pinOverlayBtn = document.getElementById("pinOverlayBtn");
const pinBtnLabel = document.getElementById("pinBtnLabel");

// =========================================================================
// 4. INITIALIZATION
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  renderStepsList();
  setupVideoListeners();
  setupScrollInteractionListener();
  setupFullscreenManager();
  
  // Set initial active step at 0s
  updateActiveStep(0, false);
});

// =========================================================================
// 5. RENDER STEPS LIST (SPOTIFY-STYLE LYRICS LAYOUT)
// =========================================================================
function renderStepsList() {
  if (!stepsContainerEl) return;
  stepsContainerEl.innerHTML = "";

  parsedSteps.forEach((step, idx) => {
    const item = document.createElement("div");
    item.className = "step-item";
    item.id = `step-item-${idx}`;
    item.dataset.index = idx;
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", `Jump to ${step.time}: ${step.text}`);

    item.innerHTML = `
      <span class="step-time">${step.time}</span>
      <span class="step-text">${escapeHtml(step.text)}</span>
    `;

    // Click to seek video directly
    item.addEventListener("click", () => {
      seekToStep(idx);
    });

    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        seekToStep(idx);
      }
    });

    stepsContainerEl.appendChild(item);
  });
}

// Seek video to step timestamp
function seekToStep(index) {
  if (!videoEl || index < 0 || index >= parsedSteps.length) return;
  const targetTime = parsedSteps[index].seconds;
  
  videoEl.currentTime = targetTime;
  if (videoEl.paused) {
    videoEl.play().catch(() => {});
  }
  
  updateActiveStep(index, true);

  // If in fullscreen, show overlay and reset auto-hide timer
  if (isFullscreen) {
    showOverlayAndResetTimer();
  }
}

// =========================================================================
// 6. VIDEO PLAYBACK & SYNCHRONIZATION
// =========================================================================
function setupVideoListeners() {
  if (!videoEl) return;

  // Real-time synchronization during playback
  videoEl.addEventListener("timeupdate", onVideoTimeUpdate);

  // Synchronize immediately on seek
  videoEl.addEventListener("seeking", onVideoTimeUpdate);
  videoEl.addEventListener("seeked", () => {
    onVideoTimeUpdate();
    if (isFullscreen) showOverlayAndResetTimer();
  });

  // Update status when play/pause changes
  videoEl.addEventListener("play", () => {
    updateIndicatorStatus();
    if (isFullscreen) showOverlayAndResetTimer();
  });

  videoEl.addEventListener("pause", () => {
    updateIndicatorStatus();
    // Keep instruction visible when paused
    if (isFullscreen) {
      transcriptSectionEl?.classList.remove("overlay-faded");
      clearTimeout(autoHideTimer);
    }
  });

  videoEl.addEventListener("ended", () => {
    updateIndicatorStatus();
    if (isFullscreen) {
      transcriptSectionEl?.classList.remove("overlay-faded");
    }
  });

  // Handle loading errors gracefully
  videoEl.addEventListener("error", (e) => {
    console.error("Video load error:", e);
    if (videoErrorEl) {
      videoErrorEl.style.display = "block";
    }
  });
}

// Read current time and determine active step
function onVideoTimeUpdate() {
  if (!videoEl) return;
  const currentTime = videoEl.currentTime;

  // Find latest step where step.seconds <= currentTime
  let activeIdx = 0;
  for (let i = 0; i < parsedSteps.length; i++) {
    if (currentTime >= parsedSteps[i].seconds) {
      activeIdx = i;
    } else {
      break;
    }
  }

  if (activeIdx !== currentActiveIndex) {
    updateActiveStep(activeIdx, true);
  }
}

// Update DOM classes and center the active step
function updateActiveStep(newIndex, shouldScroll = true) {
  const isNewStep = newIndex !== currentActiveIndex;
  currentActiveIndex = newIndex;

  const items = stepsContainerEl.querySelectorAll(".step-item");
  items.forEach((item, idx) => {
    const dist = Math.abs(idx - newIndex);
    
    // Reset all distance and active classes
    item.className = "step-item";

    if (dist === 0) {
      item.classList.add("active");
    } else if (dist === 1) {
      item.classList.add("dist-1");
    } else if (dist === 2) {
      item.classList.add("dist-2");
    } else if (dist === 3) {
      item.classList.add("dist-3");
    } else {
      item.classList.add("dist-far");
    }
  });

  // Center active step in visible list (unless user is actively manual-scrolling)
  if (shouldScroll && !isUserInteracting) {
    centerActiveStep(newIndex);
  }

  updateIndicatorStatus();

  // In fullscreen mode: when reaching a new timestamp, show overlay so learner can read it!
  if (isFullscreen && isNewStep) {
    showOverlayAndResetTimer();
  }
}

// Smoothly centers the active step element in the container viewport
function centerActiveStep(index) {
  const activeEl = document.getElementById(`step-item-${index}`);
  if (!activeEl || !stepsContainerEl) return;

  const containerRect = stepsContainerEl.getBoundingClientRect();
  const itemRect = activeEl.getBoundingClientRect();

  // Calculate distance from center of active item to center of container
  const itemCenter = itemRect.top + itemRect.height / 2;
  const containerCenter = containerRect.top + containerRect.height / 2;
  const delta = itemCenter - containerCenter;

  stepsContainerEl.scrollBy({
    top: delta,
    behavior: "smooth"
  });
}

// Prevent auto-scrolling fight when user is actively scrolling the transcript
function setupScrollInteractionListener() {
  if (!stepsContainerEl) return;

  const onUserScroll = () => {
    isUserInteracting = true;
    clearTimeout(userInteractionTimeout);
    
    // Keep overlay visible while actively interacting
    if (isFullscreen) {
      transcriptSectionEl?.classList.remove("overlay-faded");
      clearTimeout(autoHideTimer);
    }

    userInteractionTimeout = setTimeout(() => {
      isUserInteracting = false;
      if (isFullscreen) {
        showOverlayAndResetTimer();
      }
    }, 2800);
  };

  stepsContainerEl.addEventListener("wheel", onUserScroll, { passive: true });
  stepsContainerEl.addEventListener("touchmove", onUserScroll, { passive: true });
}

function updateIndicatorStatus() {
  if (!activeIndicatorEl) return;
  const activeStep = parsedSteps[currentActiveIndex];
  if (!activeStep) {
    activeIndicatorEl.textContent = "Click a step to jump";
    return;
  }

  if (videoEl && !videoEl.paused && !videoEl.ended) {
    activeIndicatorEl.textContent = `Playing • Step ${currentActiveIndex + 1} of ${parsedSteps.length} (${activeStep.time})`;
  } else if (videoEl && videoEl.ended) {
    activeIndicatorEl.textContent = `Lesson completed`;
  } else {
    activeIndicatorEl.textContent = `Step ${currentActiveIndex + 1} of ${parsedSteps.length} (${activeStep.time})`;
  }
}

// =========================================================================
// 7. FULLSCREEN LESSON MODE & AUTO-HIDE OVERLAY MANAGER
// =========================================================================
function setupFullscreenManager() {
  if (!fullscreenBtn || !workspaceEl) return;

  // Toggle fullscreen button click
  fullscreenBtn.addEventListener("click", toggleLessonFullscreen);

  // Pin overlay button click ("Keep steps visible")
  if (pinOverlayBtn) {
    pinOverlayBtn.addEventListener("click", () => {
      isOverlayPinned = !isOverlayPinned;
      pinOverlayBtn.setAttribute("aria-pressed", isOverlayPinned ? "true" : "false");
      
      if (isOverlayPinned) {
        pinOverlayBtn.classList.add("active");
        if (pinBtnLabel) pinBtnLabel.textContent = "Always visible";
        transcriptSectionEl?.classList.add("is-pinned");
        transcriptSectionEl?.classList.remove("overlay-faded");
        clearTimeout(autoHideTimer);
      } else {
        pinOverlayBtn.classList.remove("active");
        if (pinBtnLabel) pinBtnLabel.textContent = "Auto-hide";
        transcriptSectionEl?.classList.remove("is-pinned");
        if (isFullscreen) {
          showOverlayAndResetTimer();
        }
      }
    });
  }

  // User activity listeners to wake up overlay in fullscreen
  const onUserActivity = () => {
    if (!isFullscreen) return;
    showOverlayAndResetTimer();
  };

  workspaceEl.addEventListener("mousemove", onUserActivity);
  workspaceEl.addEventListener("touchstart", onUserActivity, { passive: true });
  workspaceEl.addEventListener("click", onUserActivity);

  // Sync state on native fullscreenchange & webkitfullscreenchange
  document.addEventListener("fullscreenchange", handleFullscreenStateChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenStateChange);

  // Keyboard shortcut: 'f' or 'F' toggles fullscreen
  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea") return;

    if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      toggleLessonFullscreen();
    }
  });
}

// Toggles Fullscreen on the entire lesson workspace
async function toggleLessonFullscreen() {
  const isCurrentlyFs = checkIsFullscreen();

  if (!isCurrentlyFs) {
    try {
      if (workspaceEl.requestFullscreen) {
        await workspaceEl.requestFullscreen();
      } else if (workspaceEl.webkitRequestFullscreen) {
        await workspaceEl.webkitRequestFullscreen();
      } else {
        // Fallback for mobile / browsers without element requestFullscreen
        enterSimulatedFullscreen();
      }
    } catch (err) {
      console.warn("Element fullscreen not permitted, activating simulated fallback:", err);
      enterSimulatedFullscreen();
    }
  } else {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen().catch(() => {});
      }
    }
    exitSimulatedFullscreen();
  }
}

function checkIsFullscreen() {
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    workspaceEl?.classList.contains("is-fullscreen")
  );
}

function handleFullscreenStateChange() {
  const fsActive = checkIsFullscreen();
  isFullscreen = fsActive;

  if (fsActive) {
    workspaceEl.classList.add("is-fullscreen");
    document.body.classList.add("fullscreen-active");
    if (iconEnterFullscreen) iconEnterFullscreen.style.display = "none";
    if (iconExitFullscreen) iconExitFullscreen.style.display = "inline-block";
    if (fullscreenBtnText) fullscreenBtnText.textContent = "Exit Fullscreen";
    
    // Show overlay immediately on entering fullscreen
    showOverlayAndResetTimer();

    // Re-center active step for new fullscreen dimensions
    setTimeout(() => {
      centerActiveStep(currentActiveIndex);
    }, 150);
  } else {
    workspaceEl.classList.remove("is-fullscreen");
    document.body.classList.remove("fullscreen-active");
    if (iconEnterFullscreen) iconEnterFullscreen.style.display = "inline-block";
    if (iconExitFullscreen) iconExitFullscreen.style.display = "none";
    if (fullscreenBtnText) fullscreenBtnText.textContent = "Fullscreen Lesson";
    
    // Reset overlay visibility
    transcriptSectionEl?.classList.remove("overlay-faded");
    clearTimeout(autoHideTimer);

    // Re-center active step for normal layout
    setTimeout(() => {
      centerActiveStep(currentActiveIndex);
    }, 150);
  }
}

// Simulated fallback for mobile devices (e.g. iOS Safari)
function enterSimulatedFullscreen() {
  workspaceEl.classList.add("is-fullscreen");
  document.body.classList.add("fullscreen-active");
  handleFullscreenStateChange();
}

function exitSimulatedFullscreen() {
  workspaceEl.classList.remove("is-fullscreen");
  document.body.classList.remove("fullscreen-active");
  handleFullscreenStateChange();
}

// Shows the overlay and fades out after 4 seconds of inactivity
function showOverlayAndResetTimer() {
  if (!isFullscreen || !transcriptSectionEl) return;

  // Make visible
  transcriptSectionEl.classList.remove("overlay-faded");
  clearTimeout(autoHideTimer);

  // If pinned, do not set fade timer
  if (isOverlayPinned) return;

  // Fade out after 4 seconds if video is playing and user is not scrolling
  autoHideTimer = setTimeout(() => {
    if (!isFullscreen || isOverlayPinned) return;
    if (isUserInteracting) return;
    // Keep instruction visible if video is paused
    if (videoEl && videoEl.paused) return;

    transcriptSectionEl.classList.add("overlay-faded");
  }, 4000);
}

// =========================================================================
// 8. UTILITY FUNCTIONS
// =========================================================================
function parseTimeToSeconds(timeVal) {
  if (typeof timeVal === "number") return timeVal;
  if (!timeVal || typeof timeVal !== "string") return 0;

  const parts = timeVal.trim().split(":").map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function formatSecondsToMmSs(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor(totalSeconds / 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
