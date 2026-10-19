# Bootable USB Drive Classroom Lesson

A minimal, clean, human-designed classroom video lesson website. Features a native HTML5 video player streaming directly from Cloudflare R2 on the right, paired with a **Spotify-lyrics-style live synchronized timestamp stream** on the left.

---

## 🌟 Key Features

1. **Direct Cloudflare R2 Streaming**:
   - Streams directly from:
     `https://pub-f66d430043214809bbc226d0d6a0fda9.r2.dev/2026-10-18%2021-15-53.mp4`
   - Uses a clean, native HTML5 `<video controls preload="metadata">` element.
   - Preserves original 16:9 aspect ratio without distortion or cropping.
   - No Google Drive embeds, no external iframe sandboxes, and no third-party APIs.

2. **Spotify-Style Live Synchronized Timestamps**:
   - The steps list acts as a live interactive transcript following the video in real time.
   - As the video plays, the active instruction highlights in bright white and smoothly centers in the list.
   - Steps above and below fade gracefully based on their distance from the active step, complemented by top and bottom gradient masks.
   - Clicking any step immediately jumps the video to that exact timestamp.

3. **Simple, Human-Crafted Minimalist Design**:
   - Deep neutral dark background (`#0b0d11`) with restrained typography.
   - Removed all unnecessary AI-dashboard elements: badges, progress rings, safety warnings, and status indicators.
   - Responsive layout: side-by-side on desktop (steps on left, video on right), single-column stacked layout on mobile.

---

## ✏️ How to Edit Lesson Timestamps

All lesson timestamps and step descriptions are stored in `script.js` in the `LESSON_STEPS` array (lines 14–48):

```javascript
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
```

To adjust timestamps or add new steps:
1. Open `script.js` in any text editor.
2. Edit the `time` (in `"mm:ss"` format) and `text` properties.
3. Save the file and commit to GitHub. The changes will update immediately.

---

## 🌐 Deploying to GitHub Pages (Free Hosting)

1. **Commit and push files**:
   ```bash
   git add index.html style.css script.js README.md
   git commit -m "Update lesson to Cloudflare R2 video and Spotify-style timestamps"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** > **Pages**.
   - Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main**, Folder to **/(root)**.
   - Click **Save**.

Your lesson will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.
