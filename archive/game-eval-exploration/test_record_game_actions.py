from flask import Flask, request, send_from_directory, jsonify
from pathlib import Path
import os
import json

app = Flask(__name__)

# Path to the local game directory
# GAME_DIR = Path(__file__).parent / "games_v3/claude-3.7-sonnet/instruction_simple_prompt/game_0000/cloudy_with_a_chance"
# GAME_ID = "cloudy_with_a_chance"

# GAME_DIR = Path(__file__).parent / "games/games_test/claude-3.7-sonnet/complexity_guide/concept_0020/simple_p5_game"
GAME_DIR = Path(__file__).parent / "games/games_v4/claude-3.7-sonnet/judge/concept_0001/sample_0"
GAME_ID = "sample_0"

game_events = []

@app.route("/")
def index():
    # Read the HTML file
    html_path = GAME_DIR / "index.html"
    with open(html_path, "r") as f:
        html = f.read()

    # Inject event tracking JS before </body>
    tracking_js = f"""
    <script>
    // Event tracking
    const eventBuffer = [];
    let isFocused = true;
    let lastFocusTime = Date.now();
    let lastX = null;
    let lastY = null;
    let lastMoveTime = 0;

    function recordAction(eventType, data) {{
        if (isFocused) {{
            eventBuffer.push({{
                type: eventType,
                timestamp: Date.now(),
                framecount: window.gameInstance.frameCount,
                ...data
            }});
        }}
    }}

    function sendBufferedEvents() {{
        if (eventBuffer.length > 0) {{
            const events = eventBuffer.slice();
            eventBuffer.length = 0;
            fetch('/record-events', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{
                    gameId: '{GAME_ID}',
                    events: events
                }})
            }});
        }}
    }}

    window.addEventListener("keydown", function(e) {{
        recordAction('keydown', {{ keyCode: e.keyCode, key: e.key }});
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {{ e.preventDefault(); }}
    }}, false);
    window.addEventListener('keyup', (e) => {{ recordAction('keyup', {{ keyCode: e.keyCode, key: e.key }}); }});
    document.addEventListener('mousemove', (e) => {{
        const now = Date.now();
        if ((lastX !== e.clientX || lastY !== e.clientY) && now - lastMoveTime > 16.66) {{
            recordAction('mousemove', {{ x: e.clientX, y: e.clientY }});
            lastX = e.clientX; lastY = e.clientY; lastMoveTime = now;
        }}
    }});
    document.addEventListener('click', (e) => {{ recordAction('click', {{ x: e.clientX, y: e.clientY, button: e.button }}); }});
    document.addEventListener('mousedown', (e) => {{ recordAction('mousedown', {{ x: e.clientX, y: e.clientY, button: e.button }}); }});
    document.addEventListener('mouseup', (e) => {{ recordAction('mouseup', {{ x: e.clientX, y: e.clientY, button: e.button }}); }});
    document.addEventListener('mouseenter', (e) => {{ recordAction('mouseenter', {{ x: e.clientX, y: e.clientY }}); }});
    document.addEventListener('mouseleave', (e) => {{ recordAction('mouseleave', {{ x: e.clientX, y: e.clientY }}); }});
    window.addEventListener('blur', () => {{
        isFocused = false;
        const focusTime = Date.now() - lastFocusTime;
        recordAction('blur', {{ timeFocused: focusTime }});
        sendBufferedEvents();
    }});
    window.addEventListener('focus', () => {{
        isFocused = true;
        lastFocusTime = Date.now();
        recordAction('focus', {{}});
    }});
    setInterval(sendBufferedEvents, 5000);
    window.addEventListener('beforeunload', sendBufferedEvents);
    </script>
    """
    if "</body>" in html:
        html = html.replace("</body>", tracking_js + "</body>")
    else:
        html += tracking_js
    return html

@app.route("/record-events", methods=["POST"])
def record_events():
    event_data = request.json
    print("Received events:", event_data)
    new_events = event_data.get('events', [])
    game_events.extend(new_events)

    # Save to file in GAME_DIR
    events_file = GAME_DIR / 'recorded_events.json'
    if events_file.exists():
        try:
            with open(events_file, 'r') as f:
                existing = json.load(f)
        except Exception:
            existing = []
    else:
        existing = []
    existing.extend(new_events)
    with open(events_file, 'w') as f:
        json.dump(existing, f, indent=2)

    return jsonify({"status": "success"})

@app.route("/<path:filename>")
def serve_static(filename):
    # Serve static files from the game directory
    return send_from_directory(GAME_DIR, filename)

if __name__ == "__main__":
    app.run(debug=True) 