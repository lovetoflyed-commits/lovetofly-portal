# Local Server Setup Guide

## Quick Start

### 1. Clean, Build & Run
```bash
cd /Users/edsonassumpcao/Desktop/lovetofly-portal
rm -rf .next
npm run build
npm run dev
```

### 2. Access Locally

**Localhost (your machine only):**
```
http://localhost:3000
```

**Local Network IP (from any device on your network):**
```
http://192.168.0.6:3000
```

---

## How to Find Your Local IP

Run this command in terminal:
```bash
ipconfig getifaddr en0 || ipconfig getifaddr en1
```

This returns your macOS local IP (example: `192.168.0.6`)

---

## Access from Other Devices

### Same WiFi Network
Use the local IP from another device (phone, tablet, another computer):
```
http://192.168.0.6:3000
```

### From Mobile (iOS/Android)
1. Connect to same WiFi as your Mac
2. Open Safari/Chrome
3. Go to: `http://192.168.0.6:3000`

---

## Browser Setup for Visual Editing

### Safari (Built-in - No Setup Needed)
1. Go to http://localhost:3000
2. Right-click → **Inspect Element**
3. Edit colors/spacing visually in the inspector

### Chrome/Edge (File Syncing)
1. Install **Edge DevTools** extension in VS Code
2. Can edit visually AND save to files automatically

---

## Keep Server Running

The dev server runs in the background terminal.

**To check if it's running:**
```bash
curl http://localhost:3000
```

**To stop it:**
Press `Ctrl` + `C` in the terminal

**To restart:**
```bash
npm run dev
```

---

## Troubleshooting

### Port 3000 Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Can't access from local IP
1. Check firewall allows port 3000
2. Verify both devices on same WiFi
3. Use `ifconfig` to confirm IP

### DevTools not saving files
- Make sure you added workspace folder in DevTools
- Confirm read/write permissions on project folder

---

**Status:** ✅ Server running on http://localhost:3000 and http://192.168.0.6:3000
