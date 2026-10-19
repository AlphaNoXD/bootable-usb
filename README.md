# Bootable USB Drive Classroom Lesson

A minimal, clean, human-designed classroom video lesson website. Features a native HTML5 video player streaming directly from Cloudflare R2 on the right, paired with a **Spotify-lyrics-style live synchronized timestamp stream** on the left and a dedicated **Fullscreen Lesson Mode**.

---

## 🌟 Key Features

1. **Direct Cloudflare R2 Streaming**:
   - Streams directly from:
     `https://pub-f66d430043214809bbc226d0d6a0fda9.r2.dev/2026-10-18%2021-15-53.mp4`
   - Uses a clean, native HTML5 `<video controls preload="metadata">` element.
   - Preserves original 16:9 aspect ratio without distortion or cropping.

2. **Spotify-Style Live Synchronized Timestamps**:
   - The steps list acts as a live interactive transcript following the video in real time.
   - As the video plays, the active instruction highlights in bright white and smoothly centers in the list.
   - Steps above and below fade gracefully based on their distance from the active step, complemented by top and bottom gradient masks.
   - Clicking any step immediately jumps the video to that exact timestamp.

3. **Fullscreen Lesson Mode (Entire Interface)**:
   - Expanding fullscreen expands the **entire lesson player** rather than just the video.
   - **Translucent Spotify Overlay**: In fullscreen mode, the timestamp instructions float as a sleek, translucent panel on the left side of the screen over the video.
   - **Auto-Hide (4-Second Timer)**: Overlay automatically fades out after 4 seconds of inactivity so the video remains unobstructed.
   - **Smart Wake-Up**: When playback reaches a new lesson timestamp, the overlay automatically fades back in for 4 seconds so the learner can read the new instruction. Moving the mouse, tapping the screen, or interacting also brings it back.
   - **Keep Steps Visible (Pin Toggle)**: Click the "Keep visible" / "Auto-hide" toggle inside the overlay header to lock the timestamps on-screen permanently during fullscreen.
   - **Keyboard Shortcut**: Press <kbd>F</kbd> anytime to toggle fullscreen lesson mode (or press <kbd>Esc</kbd> to exit).

4. **Mobile & Landscape Responsive**:
   - On phones and tablets, the fullscreen mode displays cleanly in landscape and portrait without forcing rotation.
   - In landscape fullscreen, the compact translucent timestamp panel sits on the left with native video controls fully accessible at the bottom.

---

## ✏️ How to Edit Lesson Timestamps

All lesson timestamps and step descriptions are stored in `script.js` in the `LESSON_STEPS` array:

```javascript
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
   git commit -m "Add fullscreen lesson mode with Spotify-style timestamp overlay"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** > **Pages**.
   - Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main**, Folder to **/(root)**.
   - Click **Save**.

Your lesson will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.
