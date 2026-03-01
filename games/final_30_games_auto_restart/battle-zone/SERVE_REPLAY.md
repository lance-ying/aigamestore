# How to Run the Replay System

## The Problem

Opening `replay.html` directly in a browser (using `file:///` protocol) causes CORS errors because:
- ES6 modules (`import`/`export`) require HTTP/HTTPS protocol
- Browsers block cross-origin requests from `file:///` for security

## Solution: Run a Local Web Server

### Option 1: Python HTTP Server (Simplest)

1. Open terminal in the `frontend` directory:
   ```bash
   cd /Users/heyodogo/code/gamestore-exp/frontend
   ```

2. Start a simple HTTP server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open in browser:
   ```
   http://localhost:8000/public/games_pilot/battle-zone/replay.html
   ```

### Option 2: Next.js Dev Server (If you have the frontend set up)

1. In the `frontend` directory:
   ```bash
   npm install  # if not already done
   npm run dev
   ```

2. Open in browser:
   ```
   http://localhost:3000/games_pilot/battle-zone/replay.html
   ```

### Option 3: Node.js HTTP Server

1. Install `http-server` globally (optional):
   ```bash
   npm install -g http-server
   ```

2. In the `frontend` directory:
   ```bash
   http-server -p 8000
   ```

3. Open in browser:
   ```
   http://localhost:8000/public/games_pilot/battle-zone/replay.html
   ```

## Loading Replay Data

Once the server is running, you can load replays in three ways:

### 1. File Input (Works with server)
- Click "Choose File" for both inputs.json and logs.json
- Select files from your downloads directory
- Click "Load Replay"

### 2. Session Path (Quick)
- Enter path like: `downloads/storage/games/games_pilot/battle-zone/user_sessions/5d23cee7771223001647e8c7/session_20251204T202609_qefsyqt`
- Click "Load from Path"

### 3. URL Parameters
- Add to URL: `?replay_inputs=../../downloads/.../inputs.json&replay_logs=../../downloads/.../logs.json`

## Troubleshooting

**Error: "Access to script blocked by CORS policy"**
- You're using `file:///` protocol
- Solution: Use one of the web server options above

**Error: "Cannot access iframe content"**
- CORS issue with iframe
- Solution: Make sure you're using `http://localhost` not `file:///`

**Error: "dev_mode.js not found"**
- This file is optional and may not exist
- The game should still work without it


