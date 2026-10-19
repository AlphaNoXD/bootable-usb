/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Classroom Lesson Website
 * Native HTML5 Cloudflare R2 Video & Spotify-Style Live Synchronized Timestamps
 */

// =========================================================================
// 1. LESSON TIMESTAMPS & STEP INSTRUCTIONS (EASY TO EDIT)
// Add, edit, or adjust your lesson steps below.
// Use "mm:ss" format for timestamps (e.g., "01:25") or total seconds.
// =========================================================================
export const LESSON_STEPS = [
  {
    time: "00:00",
    text: "Prepare the USB flash drive and ensure all personal files are backed up."
  },
  {
    time: "00:35",
    text: "Download and launch the bootable USB creation tool (e.g. Rufus or BalenaEtcher)."
  },
  {
    time: "01:10",
    text: "Select the target USB drive and load the operating system ISO file."
  },
  {
    time: "01:50",
    text: "Configure the partition scheme (GPT for modern UEFI, MBR for legacy BIOS)."
  },
  {
    time: "02:30",
    text: "Confirm the format warning and start writing the image to the drive."
  },
  {
    time: "03:15",
    text: "Wait for the file extraction and block writing progress to complete."
  },
  {
    time: "03:50",
    text: "Safely eject the finished bootable USB drive and test booting on your PC."
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

// DOM Elements
const videoEl = document.getElementById("lessonVideo");
const stepsContainerEl = document.getElementById("stepsListContainer");
const activeIndicatorEl = document.getElementById("activeStepIndicator");
const videoErrorEl = document.getElementById("videoErrorMessage");

// =========================================================================
// 4. INITIALIZATION
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  renderStepsList();
  setupVideoListeners();
  setupScrollInteractionListener();
  
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
  videoEl.addEventListener("seeked", onVideoTimeUpdate);

  // Update status when play/pause changes
  videoEl.addEventListener("play", () => {
    updateIndicatorStatus();
  });

  videoEl.addEventListener("pause", () => {
    updateIndicatorStatus();
  });

  videoEl.addEventListener("ended", () => {
    updateIndicatorStatus();
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
    userInteractionTimeout = setTimeout(() => {
      isUserInteracting = false;
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
// 7. UTILITY FUNCTIONS
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
