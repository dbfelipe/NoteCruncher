# YouTube Audio Processing Notes

## Why we use `yt-dlp` instead of `ytdl-core`
- `ytdl-core` breaks frequently due to YouTube changes
- `yt-dlp` is more stable and supports audio extraction directly

## How audio is downloaded
- We generate a UUID for the filename
- Use `%(ext)s` in the output template to preserve format
- Final path is: `/uploads/<uuid>.mp3`

## Gotchas
- Must install `yt-dlp` CLI tool
- Always create `uploads/` folder first
- Multer is required even for URL form submission