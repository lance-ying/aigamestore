from pathlib import Path
import random
from tkinter.font import names
from flask import Flask, render_template_string, request, jsonify, Response, session, redirect, url_for
import os
import json
import datetime
from datasets import load_dataset
import uuid
from scheduler import ParquetScheduler
import re
from huggingface_hub import HfApi


# Hugging Face configuration
HF_TOKEN = os.environ.get("HF_TOKEN")


games_version = "v9"
run_name = "pilot1"

GAMES_DATASET = f"generative-games/gen-games-{games_version}"
PREFERENCES_DATASET = f"generative-games/gen-games-{games_version}-absolute-rating-{run_name}"  # Dataset to save ratings
VIDEO_DATASET = f"generative-games/gen-games-{games_version}-video-{run_name}"  # Dataset to save videos
FEEDBACK_DATASET = f"generative-games/gen-games-{games_version}-feedback-{run_name}"  # Dataset to save feedback

COMPLETION_CODE = "CH1OQ9N6"

NUM_CALIBRATION_GAMES = 2  # Number of games to show during calibration
NUM_GAMES_TO_RATE = 15
PUSH_EVERY_N_RATINGS = 1
SAVE_LOCALLY = False
SAVE_HF = True

# Calibration game IDs
CALIBRATION_GAME_BAD_ID = "33f1577ab08d982c056d9e7e7f76a8b9f2bd68c73c0410aad9eadb14f7fd1ab7"
CALIBRATION_GAME_GOOD_ID = "5876551c2749a58a1cd6ef80632ddbce31579e622c9f7ffb6cb52cad4fa92d32"

RESULTS_DIR = Path(__file__).parent / "results" / f"games_{games_version}"

# Create results directory if it doesn't exist
RESULTS_DIR.mkdir(exist_ok=True, parents=True)

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Store game events in memory
game_events = {}
# Store rated games per user persistently on the server
rated_games_by_user = {}

# Track which games have been viewed in calibration phase
calibration_games_by_user = {}

def get_rated_games():
    user_id = session.get('user_id')
    if not user_id:
        return set() # Should not happen if routes are protected, but return empty set
    # Get the set for the user, creating it if it doesn't exist
    return rated_games_by_user.setdefault(user_id, set())

def get_calibration_games():
    user_id = session.get('user_id')
    if not user_id:
        return set()
    return calibration_games_by_user.setdefault(user_id, set())

def add_calibration_game(game_id):
    user_id = session.get('user_id')
    if not user_id:
        return
    user_calibration_set = calibration_games_by_user.setdefault(user_id, set())
    user_calibration_set.add(game_id)

def add_rated_game(game_id):
    user_id = session.get('user_id')
    if not user_id:
        return # Cannot add if no user is logged in
    # Get the set for the user (creates if needed) and add the game ID
    user_rated_set = rated_games_by_user.setdefault(user_id, set())
    user_rated_set.add(game_id)
    # Optionally print for debugging
    # print(f"[DEBUG] Rated games for user {user_id}: {sorted(user_rated_set)}")


# Initialize HF scheduler
preferences_scheduler = ParquetScheduler(
    repo_id=PREFERENCES_DATASET,
    private=True,
    every=15,  # TODO: doesn't seem to work when app is deployed (use PUSH_EVERY_N_RATINGS instead)
    token=HF_TOKEN
)
print("Scheduler initialized")

# Counter for ratings
ratings_counter = 0

# Initialize HF API
hf_api = HfApi()

# Create dataset repository if it doesn't exist
try:
    hf_api.create_repo(
        repo_id=VIDEO_DATASET,
        repo_type="dataset",
        token=HF_TOKEN,
        exist_ok=True
    )
    print(f"Created/verified dataset repository: {VIDEO_DATASET}")
except Exception as e:
    print(f"Error creating dataset repository: {e}")

def load_games_dataset():
    """Load the games dataset from Hugging Face"""
    try:
        dataset = load_dataset(GAMES_DATASET, split="train", token=HF_TOKEN)
        print(f"Loaded dataset with {len(dataset)} games")
        return dataset
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return None

# Load dataset at startup
GAMES_DATASET = load_games_dataset()

def get_random_game(for_calibration=False):
    """Get a random game from the dataset and generate a unique rating_id, per user"""
    rating_id = str(uuid.uuid4())

    if for_calibration:
        calibration_games = get_calibration_games()
        # Check if the user has already seen enough calibration games
        if len(calibration_games) >= NUM_CALIBRATION_GAMES:
            return None, None

        # hand pick games for calibration
        assert NUM_CALIBRATION_GAMES == 2
        GAME_BAD = GAMES_DATASET.filter(lambda x: x["id"] == CALIBRATION_GAME_BAD_ID)[0]
        GAME_GOOD = GAMES_DATASET.filter(lambda x: x["id"] == CALIBRATION_GAME_GOOD_ID)[0]
        games_to_show = [GAME_BAD, GAME_GOOD]
        assert len(calibration_games) < len(games_to_show)
        game = games_to_show[len(calibration_games)]

        return game, rating_id

    else:
        rated_games = get_rated_games()
        # Check if the user has already rated the target number of games
        if len(rated_games) >= NUM_GAMES_TO_RATE:
            return None, None

        # For rating, choose from games not already rated (but could include calibration games)
        available_games = [game for game in GAMES_DATASET if game["id"] not in rated_games]
    
        if not available_games:
            return None, None # Should not happen if NUM_GAMES_TO_RATE is less than dataset size, but good practice
        
        game = random.choice(available_games)
        return game, rating_id

# HTML template for Prolific ID login
LOGIN_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Enter Prolific ID</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f8f8f8; display: flex; justify-content: center; align-items: center; height: 100vh; }
        .login-box { background: #fff; padding: 32px 40px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        h2 { margin-top: 0; }
        label { font-weight: bold; }
        input[type="text"] { width: 100%; padding: 8px; margin: 10px 0 20px 0; border-radius: 4px; border: 1px solid #ccc; font-size: 16px; }
        button { background: #3498db; color: #fff; border: none; border-radius: 4px; padding: 10px 24px; font-size: 16px; cursor: pointer; }
        button:hover { background: #2980b9; }
    </style>
</head>
<body>
    <form class="login-box" method="post">
        <h2>Enter Your Prolific ID</h2>
        <label for="prolific_id">Prolific ID:</label>
        <input type="text" id="prolific_id" name="prolific_id" required maxlength="32" autocomplete="off">
        <button type="submit">Continue</button>
    </form>
</body>
</html>
'''

@app.route('/consent', methods=['GET', 'POST'])
def consent():
    consent_text = '''
    <html>
    <head>
        <title>Consent Form</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; background: #f8f8f8; padding: 24px; border-radius: 8px; }
            h2 { color: #2c3e50; }
            .consent-box { background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
            .checkbox-group { margin: 18px 0; }
            label { display: block; margin-bottom: 10px; font-size: 16px; }
            button { padding: 10px 24px; font-size: 16px; background: #3498db; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
            button:disabled { background: #ccc; cursor: not-allowed; }
        </style>
    </head>
    <body>
        <div class="consent-box">
            <h2>Welcome to our study!</h2>
            <p>By completing this study, you are participating in research conducted by researchers from the Massachusetts Institute of Technology (MIT). The purpose of this research is to study how people evaluate and interact with newly generated video games. The results will inform research in artificial intelligence and cognitive science.</p>
            <ul>
                <li><b>Eligibility:</b> You must be at least 18 years old to participate.</li>
                <li><b>Risks & Benefits:</b> There are no specific benefits or anticipated risks associated with participation in this study.</li>
                <li><b>Voluntary Participation:</b> Your participation is completely voluntary. You may withdraw at any time by simply exiting the study. You may decline to answer any or all questions. Choosing not to participate or withdrawing will result in no penalty.</li>
                <li><b>Anonymity & Data Use:</b> Your anonymity is assured; the researchers will not receive any personal information about you. We may release anonymized gameplay data as part of open-source research. Please do not participate unless you are comfortable with your gameplay traces being shared in this way.</li>
                <li><b>Contact:</b> If you have questions about this research, please contact the researchers at <a href="mailto:katiemc@mit.edu">katiemc@mit.edu</a>. For questions regarding your rights as a participant, or if problems arise which you do not feel you can discuss with the researchers, please contact the MIT Committee on the Use of Humans as Experimental Subjects (COUHES).</li>
                <li><b>Records:</b> You may print a copy of this consent form for your records.</li>
            </ul>
            <form method="post" id="consent-form">
                <div class="checkbox-group">
                    <label><input type="checkbox" id="age" name="age"> I am age 18 or older</label>
                    <label><input type="checkbox" id="read" name="read"> I have read and understand the information above</label>
                    <label><input type="checkbox" id="participate" name="participate"> I want to participate in this research and continue with the experiment</label>
                </div>
                <button type="submit" id="start-btn" disabled>Start Experiment</button>
                <button type="button" onclick="window.print()" style="background:#eee;color:#333;margin-left:10px;">Print Consent Form</button>
            </form>
        </div>
        <script>
            const form = document.getElementById('consent-form');
            const btn = document.getElementById('start-btn');
            const boxes = ['age', 'read', 'participate'].map(id => document.getElementById(id));
            boxes.forEach(box => box.addEventListener('change', () => {
                btn.disabled = !boxes.every(b => b.checked);
            }));
        </script>
    </body>
    </html>
    '''
    if request.method == 'POST':
        # Check all boxes are checked
        if all(request.form.get(box) == 'on' for box in ['age', 'read', 'participate']):
            session['consented'] = True
            return redirect(url_for('login')) # Redirect to login after consent
        # If not all checked, reload page (button should prevent this)
    return consent_text

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Check for consent before allowing login
    if not session.get('consented'):
        return redirect(url_for('consent'))

    if request.method == 'POST':
        prolific_id = request.form.get('prolific_id', '').strip()
        if prolific_id:
            # Just set the user_id in the session. 
            # The rated games list is managed server-side in rated_games_by_user.
            session['user_id'] = prolific_id
            # No longer reset session['rated_games'] here
            return redirect(url_for('index'))
    return render_template_string(LOGIN_TEMPLATE)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/')
def index():
    # Check for consent first
    if not session.get('consented'):
        return redirect(url_for('consent'))

    # Then check for user_id (login)
    if 'user_id' not in session:
        return redirect(url_for('login'))

    # Check if user has seen instructions
    if not session.get('seen_instructions'):
        return redirect(url_for('show_instructions'))

    # Check if calibration phase is complete
    calibration_games = get_calibration_games()
    if len(calibration_games) < NUM_CALIBRATION_GAMES:
        # Still in calibration phase
        game, rating_id = get_random_game(for_calibration=True)
        if game is None:
            # This should not happen normally, but just in case
            return redirect(url_for('start_rating_phase'))
        
        game_path = f'rating_{rating_id}/game_{game["id"]}/index.html'
        return render_template_string(CALIBRATION_TEMPLATE, 
                                    game_path=game_path, 
                                    rating_id=rating_id, 
                                    game_id=game["id"], 
                                    games_seen=len(calibration_games), 
                                    total_calibration_games=NUM_CALIBRATION_GAMES)
    else:
        # Calibration complete, proceed to rating phase
        game, rating_id = get_random_game(for_calibration=False)
        if game is None:
            # No more games left for this user
            # Redirect to feedback form instead of showing completion directly
            return redirect(url_for('feedback_form'))
        
        game_path = f'rating_{rating_id}/game_{game["id"]}/index.html'
        return render_template_string(HTML_TEMPLATE, 
                                    game_path=game_path, 
                                    rating_id=rating_id, 
                                    game_id=game["id"], 
                                    completion_code=None)

@app.route('/calibration-complete', methods=['POST'])
def calibration_complete():
    """Record that the user has viewed a calibration game"""
    data = request.json
    game_id = data.get('game_id', '')
    
    if game_id:
        add_calibration_game(game_id)
    
    # Check if calibration is complete
    calibration_games = get_calibration_games()
    is_complete = len(calibration_games) >= NUM_CALIBRATION_GAMES
    
    return jsonify({
        "status": "success", 
        "is_complete": is_complete,
        "games_seen": len(calibration_games),
        "total_games": NUM_CALIBRATION_GAMES
    })

@app.route('/start-rating-phase')
def start_rating_phase():
    """Transition page from calibration to rating phase"""
    return render_template_string(TRANSITION_TEMPLATE)

@app.route('/get-games-left')
def get_games_left():
    if 'user_id' not in session:
        # If user_id not in session, assume 0 games rated, show total needed
        return jsonify({'games_left': NUM_GAMES_TO_RATE, 'total_games': NUM_GAMES_TO_RATE})
    rated_games = get_rated_games()
    games_rated_count = len(rated_games)
    games_left = max(0, NUM_GAMES_TO_RATE - games_rated_count)
    return jsonify({
        'games_left': games_left,
        'total_games': NUM_GAMES_TO_RATE
    })

@app.route('/submit-ratings', methods=['POST'])
def submit_ratings():
    global ratings_counter
    if 'user_id' not in session:
        return jsonify({'status': 'error', 'message': 'Not logged in'}), 401
    data = request.json
    ratings = data.get('ratings', {})
    logs = data.get('logs', {})
    rating_id = data.get('rating_id', 'unknown')
    game_id = data.get('game_id', 'local')
    user_id = session['user_id']

    # Mark game as rated for this user
    add_rated_game(game_id)

    # Add events data to ratings
    event_key = (rating_id, game_id)
    if event_key in game_events:
        events = game_events[event_key]  # This is already a list of events
        del game_events[event_key]
    else:
        events = []

    if SAVE_LOCALLY:
        save_dir = RESULTS_DIR / f"rating_{rating_id}_game_{game_id}"
        save_dir.mkdir(parents=True, exist_ok=True)
        with open(save_dir / "ratings.json", 'w') as f:
            json.dump(ratings, f, indent=4)
        with open(save_dir / "logs.json", 'w') as f:
            json.dump(logs, f, indent=4)
        with open(save_dir / "user_id.txt", 'w') as f:
            f.write(user_id)

    print(f"Saved ratings for rating_id {rating_id} (user {user_id})")

    if SAVE_HF:
        try:
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            rating_entry = {
                "id": rating_id,
                "game_id": game_id,
                "user_id": user_id,
                "timestamp": timestamp,
                "ratings": {
                    "fun": ratings.get('fun'),
                    "playability": ratings.get('playability')
                },
                "explanation": data.get('explanation', ''),
                "logs": json.dumps(logs),
                "events": json.dumps(events)
            }
            preferences_scheduler.append(rating_entry)
            print(f"Added rating to HF dataset queue: {rating_entry['id']}")
            ratings_counter += 1
            print(f"Ratings counter: {ratings_counter}")
            if ratings_counter >= PUSH_EVERY_N_RATINGS:
                print(f"Reached {PUSH_EVERY_N_RATINGS} ratings, pushing to HuggingFace...")

                # check if the repo id exists, if not create it
                hf_api.create_repo(
                    repo_id=PREFERENCES_DATASET,
                    repo_type="dataset",
                    token=HF_TOKEN,
                    exist_ok=True
                )

                preferences_scheduler.push_to_hub()
                ratings_counter = 0
        except Exception as e:
            print(f"Error saving to HF dataset: {e}")
    return jsonify({"status": "success"})

# HTML template for the main page
HTML_TEMPLATE = '''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    <title>Game Evaluation</title>
        <style>
        html, body {
            overscroll-behavior: none; /* Prevent pull-to-refresh and overscrolling */
            height: 100%;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: Arial, sans-serif;
            max-width: 1300px;
            margin: 0 auto;
            padding: 10px;
            display: flex;
            flex-direction: column;
            height: 100vh;
            background-color: #f8f8f8;
            box-sizing: border-box;
            justify-content: center;
        }
        /* Game counter badge in top right */
        .game-counter-badge {
            position: fixed;
            top: 24px;
            right: 32px;
            z-index: 1200;
            background: #3498db;
            color: #fff;
            font-weight: bold;
            font-size: 16px;
            padding: 10px 14px;
            border-radius: 24px 24px 24px 24px;
            box-shadow: 0 2px 8px rgba(52,152,219,0.10);
            letter-spacing: 0.5px;
            transition: background 0.2s;
            border: 1.5px solid #2980b9;
            min-width: 120px;
            text-align: center;
            user-select: none;
        }
        .game-counter-badge span {
            font-size: 15px;
            font-weight: 500;
        }
        .main-content {
            display: flex;
            flex-direction: column;
            flex: 1;
            justify-content: center;
            max-height: 100vh;
        }
        .game-container {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 0px;
        }
        .game-box {
            flex: 1;
            border: none;
            padding: 10px;
            background: transparent;
            display: flex;
            flex-direction: column;
            height: auto;
            max-width: 1000px;
            margin: 0 auto;
        }
        .game-frame {
            width: 600px;
            height: 400px;
            border: none;
            background: #222;
            overflow: hidden; /* Prevent scrolling within iframe */
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .rating-sliders {
            margin-top: 10px;
            background: white;
            padding: 16px;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            max-width: 600px;
            margin: 10px auto;
        }
        .rating-item {
            margin-bottom: 8px;
        }
        .rating-item:last-child {
            margin-bottom: 0;
        }
        label {
            display: block;
            margin-bottom: 2px;
            font-weight: bold;
            font-size: 14px;
            color: #444;
        }
        .actions {
            text-align: center;
            padding: 0;
            margin-top: 10px;
        }
        button {
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            margin: 0 5px;
            transition: background-color 0.2s, transform 0.1s;
        }
        button#submit-ratings {
            background-color: #3498db;
            color: white;
        }
        button#submit-ratings:disabled {
            background-color: #cccccc;
            color: #888888;
            cursor: not-allowed;
        }
        button#show-instructions {
            background-color: #f1f1f1;
            color: #555;
        }
        button:hover:not(:disabled) {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        button:active:not(:disabled) {
            transform: translateY(1px);
        }
        .slider-container {
            display: flex;
            align-items: center;
            position: relative;
        }
        .slider-value {
            margin-left: 10px;
            min-width: 30px;
            font-size: 15px;
            color: #333;
            font-weight: bold;
            text-align: center;
            background: transparent;
            padding: 4px;
            border-radius: 0;
            display: inline-block;
            box-shadow: none;
        }
        .scale-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 2px;
            font-size: 10px;
            color: #888;
        }
        .game-label {
            text-align: center;
            margin-bottom: 5px;
            font-weight: bold;
            font-size: 20px;
            color: #333;
        }
        .rating-description {
            font-size: 12px;
            color: #666;
            margin-bottom: 3px;
            font-style: italic;
        }
        /* Make sliders more compact and minimal */
        .range__field {
            border: 0;
            margin: 0;
            padding: 0;
            width: 100%;
        }
        input.range {
            -webkit-appearance: none;
            bottom: -5px;
            position: relative;
            width: 100%;
            margin: 0;
            padding: 0;
            border: 0;
            background: transparent;
        }
        input.range:focus {
            outline: 0;
        }
        input.range::-moz-focus-outer {
            border: 0;
        }
        input.range::-webkit-slider-thumb {
            box-shadow: 1px 1px 1px black, 0px 0px 1px black;
            border: 0;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            -webkit-appearance: none;
            margin-top: -5.5px;
        }
        input.range::-moz-range-thumb {
            box-shadow: 1px 1px 1px black, 0px 0px 1px black;
            border: 0;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
        }
        input.range::-ms-thumb {
            box-shadow: 1px 1px 1px black, 0px 0px 1px black;
            border: 0;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            height: 5px;
        }
        input.range::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            cursor: pointer;
            box-shadow: 1px 1px 1px rgba(0, 0, 0, 0), 0px 0px 1px rgba(13, 13, 13, 0);
            background: #3498db;
            border-radius: 20px;
            border: 0;
        }
        input.range::-moz-range-track {
            width: 100%;
            height: 4px;
            cursor: pointer;
            box-shadow: 1px 1px 1px rgba(0, 0, 0, 0), 0px 0px 1px rgba(13, 13, 13, 0);
            background: #3498db;
            border-radius: 20px;
            border: 0;
        }
        input.range::-ms-track {
            width: 100%;
            height: 4px;
            cursor: pointer;
            background: transparent;
            border-color: transparent;
            color: transparent;
        }
        input.range::-ms-fill-lower,
        input.range::-ms-fill-upper {
            background: #3498db;
            border: 0;
            border-radius: 40px;
            box-shadow: 1px 1px 1px rgba(0, 0, 0, 0), 0px 0px 1px rgba(13, 13, 13, 0);
        }
        .range__point {
            font-size: 11px;
            fill: #666;
        }
        
        /* Modal styles */
        .modal {
            display: none; /* Hidden by default */
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            justify-content: center;
            align-items: center;
        }
        .modal-content {
            background-color: #fff;
            padding: 30px;
            border: none;
            border-radius: 8px;
            width: 80%;
            max-width: 800px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            position: relative;
        }
        .modal-content h2 {
            margin-top: 0;
            margin-bottom: 10px;
        }
        .modal-content h3 {
            margin-top: 15px;
            margin-bottom: 5px;
        }
        .modal-content h4 {
            margin-top: 10px;
            margin-bottom: 3px;
        }
        .modal-content p {
            margin-top: 0;
            margin-bottom: 10px;
        }
        .modal-content ul {
            margin-top: 5px;
            margin-bottom: 10px;
        }
        .modal-content li {
            margin-bottom: 3px;
        }
        .close {
            color: #bbb;
            position: absolute;
            right: 20px;
            top: 15px;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .close:hover {
            color: #555;
        }
        #startButton {
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 12px 24px;
            cursor: pointer;
            transition: background-color 0.2s;
            font-size: 16px;
            margin-top: 20px;
        }
        #startButton:hover {
            background-color: #2980b9;
        }
        .completion-message {
            text-align: center;
            margin: 20px;
            padding: 20px;
            background-color: #4CAF50;
            color: white;
            border-radius: 5px;
        }
        /* Timer styling */
        .timer-container {
            position: fixed;
            top: 90px;
            right: 32px;
            z-index: 1200;
            background: #f1f1f1;
            border: 1.5px solid #ddd;
            color: #555;
            font-weight: bold;
            font-size: 16px;
            padding: 10px 14px;
            border-radius: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s;
        }
        .timer-container.time-complete {
            background: #4CAF50;
            color: white;
            border-color: #388E3C;
        }
        </style>
    </head>
    <body>
    {% if game_id %}
    <!-- Game Counter Badge -->
    <div class="game-counter-badge">
        <span id="games-left">Loading...</span>
    </div>
    {% endif %}
    <!-- Loading Overlay -->
    <div id="loading-overlay" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,255,255,0.85); z-index:2000; justify-content:center; align-items:center; flex-direction:column;">
        <div style="margin-bottom:20px;">
            <svg width="60" height="60" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#3498db" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
        </div>
        <div style="font-size:20px; color:#3498db; font-weight:bold;">Loading...</div>
    </div>
    <!-- Instructions Modal -->
    <div id="instructionsModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>How to rate the game</h2>
            <p>Your task is to evaluate a series of basic 2D games. You will be shown a total of ''' + str(NUM_GAMES_TO_RATE) + ''' games to rate. These games may contain issues. You should take these issues into account when rating the games.</p>
            <h3>Please follow these steps to provide your rating:</h3>
            <ol>
                <li><b>Please play each game for about 1 minute</b> to get a good feel for it. If the game appears broken or has issues, please still try your best to interact with it for the full minute.</li>
                <li><b>Rate the playability of the game on a scale from 0 to 100:</b><br>
                    - 0: Completely unplayable or broken<br>
                    - 50: Average controls and interaction<br>
                    - 100: Excellent, intuitive controls and interaction
                </li>
                <li><b>Rate how fun the game is on a scale from 0 to 100:</b><br>
                    - 0: Not fun at all<br>
                    - 50: Somewhat enjoyable<br>
                    - 100: Extremely fun (for a basic 2D game)
                </li>
                <li><b>Provide a brief explanation for your ratings.</b></li>
            </ol>
            <h3>Important Notes:</h3>
            <ul style="padding-left: 25px;">
                <li>We record your interactions with the game to understand how people play it.</li>
                <li>Please take this seriously; we use this data for research.</li>
                <li>There are no right or wrong answers—please give your honest opinion.</li>
                <li>If you are not serious about the evaluation, we will not be able to compensate you.</li>
                <li>The game window may lose focus. If this happens, please click on the game window to focus it.</li>
            </ul>
            <button id="startButton">Play</button>
        </div>
    </div>
        
    <div class="main-content">
        {% if game_id %}
        <div class="game-container">
        <div class="game-box">
            <iframe class="game-frame" src="/game/{{ game_path }}"></iframe>
            <div class="rating-sliders">
                <div class="timer-container" id="timer-display">
                    Please play for: 0:30
                </div>
                <div id="play-instruction" style="text-align: center; padding: 30px; color: #555; font-size: 16px;">
                    <p>Please try playing the game for at least 30 seconds even if it has issues. Then you will be asked to rate the game</p>
                    <p style="font-size: 14px; margin-top: 10px;"><i>Note: Some games may have audio</i></p>
                </div>
                <div id="rating-panel" style="display: none;">
                <div class="rating-item">
                    <label>Playability: How easy is it to control and interact with the game?</label>
                    <div class="rating-description">0=Unplayable/broken, 50=Average controls, 100=Excellent/intuitive controls</div>
                    <div class="slider-container">
                        <fieldset class="range__field" style="flex-grow: 1;">
                            <input class="range" type="range" min="0" max="100" step="1" value="50" id="playability-1">
                            <svg role="presentation" width="100%" height="14" xmlns="http://www.w3.org/2000/svg">
                                <text class="range__point" x="0%" y="14" text-anchor="start">0</text>
                                <text class="range__point" x="10%" y="14" text-anchor="middle">10</text>
                                <text class="range__point" x="20%" y="14" text-anchor="middle">20</text>
                                <text class="range__point" x="30%" y="14" text-anchor="middle">30</text>
                                <text class="range__point" x="40%" y="14" text-anchor="middle">40</text>
                                <text class="range__point" x="50%" y="14" text-anchor="middle">50</text>
                                <text class="range__point" x="60%" y="14" text-anchor="middle">60</text>
                                <text class="range__point" x="70%" y="14" text-anchor="middle">70</text>
                                <text class="range__point" x="80%" y="14" text-anchor="middle">80</text>
                                <text class="range__point" x="90%" y="14" text-anchor="middle">90</text>
                                <text class="range__point" x="100%" y="14" text-anchor="end">100</text>
                            </svg>
                        </fieldset>
                        <span class="slider-value" id="playability-value">50/100</span>
                    </div>
                </div>
                <div class="rating-item">
                    <label>Fun: How enjoyable is the game to play?</label>
                    <div class="rating-description">0=Not fun at all, 50=Somewhat enjoyable, 100=Extremely fun (for a basic 2D game)</div>
                    <div class="slider-container">
                        <fieldset class="range__field" style="flex-grow: 1;">
                            <input class="range" type="range" min="0" max="100" step="1" value="50" id="fun-1">
                            <svg role="presentation" width="100%" height="14" xmlns="http://www.w3.org/2000/svg">
                                <text class="range__point" x="0%" y="14" text-anchor="start">0</text>
                                <text class="range__point" x="10%" y="14" text-anchor="middle">10</text>
                                <text class="range__point" x="20%" y="14" text-anchor="middle">20</text>
                                <text class="range__point" x="30%" y="14" text-anchor="middle">30</text>
                                <text class="range__point" x="40%" y="14" text-anchor="middle">40</text>
                                <text class="range__point" x="50%" y="14" text-anchor="middle">50</text>
                                <text class="range__point" x="60%" y="14" text-anchor="middle">60</text>
                                <text class="range__point" x="70%" y="14" text-anchor="middle">70</text>
                                <text class="range__point" x="80%" y="14" text-anchor="middle">80</text>
                                <text class="range__point" x="90%" y="14" text-anchor="middle">90</text>
                                <text class="range__point" x="100%" y="14" text-anchor="end">100</text>
                            </svg>
                        </fieldset>
                        <span class="slider-value" id="fun-value">50/100</span>
                    </div>
                </div>
                <div class="rating-item">
                    <label>Please explain your ratings:</label>
                    <input type="text" id="rating-explanation" placeholder="Please provide a brief explanation for your ratings..." style="width: calc(100% - 16px); padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin: 5px 8px 8px 0;">
                </div>
                </div>
            </div>
        </div>
        </div>
        <div class="actions">
            <button id="submit-ratings">Submit Ratings</button>
            <button id="show-instructions">Instructions</button>
        </div>
        {% else %}
        <div class="completion-message">
            <h2>Congratulations! 🎉</h2>
            <p>You have rated all available games. Thank you for your participation!</p>
            <p>Please copy the following completion code and enter it into Prolific:</p>
            <p style="font-weight: bold; font-size: 1.2em; color: #000; background: #eee; padding: 10px; border-radius: 4px; display: inline-block;">{{ completion_code }}</p>
        </div>
        {% endif %}
    </div>

    <script>
        // Modal functionality
        const modal = document.getElementById("instructionsModal");
        const closeBtn = document.getElementsByClassName("close")[0];
        const startBtn = document.getElementById("startButton");
        const showInstructionsBtn = document.getElementById("show-instructions");
        const submitBtn = document.getElementById("submit-ratings");
        
        // Timer functionality
        let timeLeft = 30; // 30 seconds
        let timerInterval;
        let timerComplete = false;
        const timerDisplay = document.getElementById("timer-display");
        
        // Disable submit button initially
        submitBtn.disabled = true;
        
        // Function to start the timer
        function startTimer() {
            timerInterval = setInterval(function() {
                timeLeft--;
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    timerComplete = true;
                    timerDisplay.textContent = "Rating enabled!";
                    timerDisplay.classList.add("time-complete");
                    submitBtn.disabled = false;
                    
                    // Show rating panel and hide instruction
                    document.getElementById('play-instruction').style.display = "none";
                    document.getElementById('rating-panel').style.display = "block";
                } else {
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    timerDisplay.textContent = `Please play for: 0:${seconds < 10 ? '0' : ''}${seconds}`;
                }
            }, 1000);
        }
        
        // Start timer when iframe loads
        document.querySelector('.game-frame').addEventListener('load', function() {
            this.focus();
            startTimer();
        });
        
        // Check for consent first
        if (!localStorage.getItem("gameArenaVisited")) {
            // First visit, show modal
            modal.style.display = "flex";
            localStorage.setItem("gameArenaVisited", "true");
        } else {
            // Not first visit, hide modal
            modal.style.display = "none";
        }
        
        // Function to reset all sliders to default value
        function resetAllSliders() {
            document.querySelectorAll('input[type="range"]').forEach(slider => {
                slider.value = 50;
                // Update the corresponding value display
                const id = slider.id;
                const displayId = id.replace('-1', '-value');
                document.getElementById(displayId).textContent = '50/100';
            });
        }
        
        // Close modal when clicking close button
        closeBtn.onclick = function() {
            modal.style.display = "none";
        }
        
        // Close modal when clicking Start button
        startBtn.onclick = function() {
            modal.style.display = "none";
        }
        
        // Show instructions when clicking Instructions button
        showInstructionsBtn.onclick = function() {
            modal.style.display = "flex";
        }
        
        // Close modal when clicking outside of it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
        
        // Prevent scrolling with keyboard
        window.addEventListener("keydown", function(e) {
            // Check if the target is the explanation text input
            if (e.target.id !== 'rating-explanation') {
                // Only prevent default for navigation keys (space, arrow keys) if not in the text input
                if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                    e.preventDefault();
                }
            }
        }, false);
        
        // Prevent scrolling with mouse wheel when over iframes
        document.querySelectorAll('.game-frame').forEach(iframe => {
            iframe.addEventListener('mouseover', function() {
                document.body.style.overflow = 'hidden';
            });
            
            iframe.addEventListener('mouseout', function() {
                document.body.style.overflow = 'auto';
            });
        });
        
        // Update the displayed values as sliders change
        document.querySelectorAll('.range').forEach(slider => {
            slider.addEventListener('input', function() {
                const value = parseInt(this.value);
                // Update the corresponding value display
                const id = this.id;
                const displayId = id.replace('-1', '-value');
                document.getElementById(displayId).textContent = value + '/100';
            });
        });
        
        // Reset all sliders to default value (50) when page loads
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('input[type="range"]').forEach(slider => {
                slider.value = 50;
                // Update the corresponding value display
                const id = slider.id;
                const displayId = id.replace('-1', '-value');
                document.getElementById(displayId).textContent = '50/100';
            });
        });
        
        // Submit ratings
        document.getElementById('submit-ratings').addEventListener('click', function() {
            // Only allow submission if timer is complete
            if (!timerComplete) {
                alert("Please play the game for at least 30 seconds before submitting ratings.");
                return;
            }
            
            // Show loading overlay
            document.getElementById('loading-overlay').style.display = 'flex';
            // Tell all game iframes to stop recording before submitting ratings
            document.querySelectorAll('.game-frame').forEach(iframe => {
                iframe.contentWindow.postMessage({ action: "stopRecording" }, "*");
            });
            
            // Get logs from the game iframe
            const iframe = document.querySelector('.game-frame');
            let logs = [];
            try {
                logs = iframe.contentWindow.gameInstance && iframe.contentWindow.gameInstance.logs ? iframe.contentWindow.gameInstance.logs : [];
            } catch (e) {
                console.error('Error getting logs:', e);
            }
            
            // Check if video recording started in the iframe
            let videoStarted = false;
            try {
                videoStarted = !!iframe.contentWindow._videoRecordingStarted;
            } catch (e) {}
            
            function submitRatings() {
                let dataToSend;
                try {
                    const data = {
                        ratings: {
                            fun: parseFloat(document.getElementById('fun-1').value),
                            playability: parseFloat(document.getElementById('playability-1').value)
                        },
                        explanation: document.getElementById('rating-explanation').value,
                        logs: logs,
                        rating_id: '{{ rating_id }}',
                        game_id: '{{ game_id }}'
                    };
                    dataToSend = JSON.stringify(data);
                } catch (error) {
                    console.error('Error stringifying data:', error);
                    // If we hit a circular reference or other JSON error, send a simplified version
                    const fallbackData = {
                        ratings: {
                            fun: parseFloat(document.getElementById('fun-1').value),
                            playability: parseFloat(document.getElementById('playability-1').value)
                        },
                        explanation: document.getElementById('rating-explanation').value,
                        logs: [], // Skip the problematic logs
                        rating_id: '{{ rating_id }}',
                        game_id: '{{ game_id }}'
                    };
                    dataToSend = JSON.stringify(fallbackData);
                }
                
                fetch('/submit-ratings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: dataToSend,
                })
                .then(response => response.json())
                .then(data => {
                    updateGamesLeft();
                    // Hide loading overlay
                    document.getElementById('loading-overlay').style.display = 'none';
                    // Redirect to root to load the next game cleanly
                    window.location.href = '/'; 
                })
                .catch((error) => {
                    // Hide loading overlay
                    document.getElementById('loading-overlay').style.display = 'none';
                    console.error('Error:', error);
                    alert('Error submitting ratings');
                });
            }
            
            if (videoStarted) {
                // Wait for video upload to complete, but add a timeout fallback
                window._pendingVideoUploads = 1;
                
                // Show video upload progress bar
                const uploadProgressContainer = document.createElement('div');
                uploadProgressContainer.className = 'upload-progress-container';
                uploadProgressContainer.innerHTML = `
                    <div class="upload-progress-overlay">
                        <div class="upload-progress-box">
                            <div class="upload-progress-title">Uploading rating...</div>
                            <div class="upload-progress-bar-container">
                                <div class="upload-progress-bar" id="videoUploadProgressBar"></div>
                            </div>
                            <div class="upload-progress-text">This may take up to 1 minute</div>
                        </div>
                    </div>
                `;
                document.body.appendChild(uploadProgressContainer);
                
                // Style for video upload progress
                const uploadProgressStyle = document.createElement('style');
                uploadProgressStyle.textContent = `
                    .upload-progress-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 9999;
                    }
                    .upload-progress-box {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        width: 80%;
                        max-width: 400px;
                        text-align: center;
                    }
                    .upload-progress-title {
                        font-size: 18px;
                        margin-bottom: 15px;
                        font-weight: bold;
                    }
                    .upload-progress-bar-container {
                        height: 20px;
                        background: #eee;
                        border-radius: 10px;
                        overflow: hidden;
                        margin-bottom: 10px;
                    }
                    .upload-progress-bar {
                        height: 100%;
                        background: #3498db;
                        width: 0%;
                        transition: width 0.5s ease;
                    }
                    .upload-progress-text {
                        font-size: 14px;
                        color: #666;
                    }
                `;
                document.head.appendChild(uploadProgressStyle);
                
                // Animate the progress bar
                const progressBar = document.getElementById('videoUploadProgressBar');
                let startTime = Date.now();
                let timeoutDuration = 60000; // 60 seconds (1 minute)
                
                let progressInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / timeoutDuration * 100, 99); // Max 99% until complete
                    progressBar.style.width = `${progress}%`;
                }, 100);
                
                let timeoutId = setTimeout(() => {
                    clearInterval(progressInterval);
                    progressBar.style.width = '100%';
                    window.removeEventListener('message', window._videoUploadCompleteHandler);
                    submitRatings();
                    document.body.removeChild(uploadProgressContainer);
                }, 60000); // 60 seconds timeout
                
                window._videoUploadCompleteHandler = function(event) {
                    if (event.data && event.data.action === "videoUploadComplete") {
                        window._pendingVideoUploads--;
                        if (window._pendingVideoUploads <= 0) {
                            clearTimeout(timeoutId);
                            clearInterval(progressInterval);
                            progressBar.style.width = '100%';
                            // Give a moment to show 100% before removing
                            setTimeout(() => {
                                window.removeEventListener('message', window._videoUploadCompleteHandler);
                                document.body.removeChild(uploadProgressContainer);
                                submitRatings();
                            }, 500);
                        }
                    }
                };
                window.addEventListener('message', window._videoUploadCompleteHandler);
            } else {
                // No video, just submit
                submitRatings();
            }
        });
        
        // Update games left counter
        function updateGamesLeft() {
            fetch('/get-games-left')
                .then(response => response.json())
                .then(data => {
                    const gamesLeft = data.games_left;
                    const totalGames = data.total_games;
                    document.getElementById('games-left').textContent = 
                        `Games left: ${gamesLeft} / ${totalGames}`;
                });
        }
        
        // Update counter when page loads and after submitting ratings
        document.addEventListener('DOMContentLoaded', updateGamesLeft);
        
        // Focus game iframe when it loads
        document.querySelector('.game-frame').addEventListener('load', function() {
            this.focus();
        });
    </script>
    </body>
    </html>
'''

@app.route('/game/<path:game_path>')
def serve_game(game_path):
    """Serve game HTML files and other assets"""
    rating_id = game_path.split('/')[0].replace('rating_', '')
    game_id = game_path.split('/')[1].replace('game_', '')
    
    # Find game in dataset
    game = GAMES_DATASET.filter(lambda x: x["id"] == game_id)[0]

    if game is None:
        return "Game not found", 404
    
    # Handle different file types
    if game_path.endswith('.js'):
        # Return JavaScript file
        # remove game id from path
        js_file = '/'.join(game_path.split('/')[2:])
        if js_file in game["game_file_paths"]:
            js_file_content = game["game_file_contents"][game["game_file_paths"].index(js_file)]
            return js_file_content, 200, {'Content-Type': 'application/javascript'}
        return "JavaScript file not found", 404
    
    elif game_path.endswith('index.html'):
        # Return HTML file
        html = game["game_file_contents"][game["game_file_paths"].index("index.html")]

        # Inject p5.capture and event tracking scripts before </body>
        p5capture_injection = '''
<script src="https://cdn.jsdelivr.net/npm/p5.capture@1.5.0/dist/p5.capture.umd.min.js"></script>
<script>
    window.P5Capture.setDefaultOptions({ disableUi: true });
</script>
'''
        # Use regex to find any p5.js script tag and inject p5.capture after it
        p5_script_pattern = r'<script[^>]*src=[^>]*p5[^>]*\.js[^>]*></script>'
        html = re.sub(p5_script_pattern, lambda m: m.group(0) + p5capture_injection, html, count=1)

        # Inject centering styles
        centering_styles = '''
<style>
    body { 
        margin: 0; 
        overflow: hidden; 
        background-color: #000; 
        display: flex; 
        justify-content: center; 
        align-items: center; 
        height: 100vh; 
        width: 100vw;
    }
    canvas { 
        display: block; 
    }
</style>
'''
        # Inject styles after the head tag
        html = re.sub(r'<head>', '<head>' + centering_styles, html)

        tracking_js = """
<script>
const ratingId = '""" + rating_id + """';
const gameId = '""" + game_id + """';

// Add CSS to center p5.js canvas
const style = document.createElement('style');
style.textContent = `
    canvas {
        display: block;
        margin: auto;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }
`;
document.head.appendChild(style);

// Event tracking
const eventBuffer = [];
let isFocused = true;
let lastFocusTime = Date.now();
let lastX = null;
let lastY = null;
let lastMoveTime = 0;

function recordAction(eventType, data) {
    if (isFocused) {
        eventBuffer.push({
            type: eventType,
            timestamp: Date.now(),
            framecount: typeof window.gameInstance !== 'undefined' ? window.gameInstance.frameCount : null,
            ...data
        });
    }
}
function sendBufferedEvents() {
    if (eventBuffer.length > 0) {
        const events = eventBuffer.slice();
        eventBuffer.length = 0;
        fetch('/record-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId: gameId,
                ratingId: ratingId,
                events: events
            }),
        });
    }
}
window.addEventListener("keydown", function(e) {
    recordAction('keydown', { keyCode: e.keyCode, key: e.key });
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) { e.preventDefault(); }
}, false);
window.addEventListener('keyup', (e) => {
    recordAction('keyup', { keyCode: e.keyCode, key: e.key });
});
document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if ((lastX !== e.clientX || lastY !== e.clientY) && now - lastMoveTime > 16.66) {
        recordAction('mousemove', { x: e.clientX, y: e.clientY });
        lastX = e.clientX;
        lastY = e.clientY;
        lastMoveTime = now;
    }
});
document.addEventListener('click', (e) => {
    recordAction('click', { x: e.clientX, y: e.clientY, button: e.button });
});
document.addEventListener('mousedown', (e) => {
    recordAction('mousedown', { x: e.clientX, y: e.clientY, button: e.button });
});
document.addEventListener('mouseup', (e) => {
    recordAction('mouseup', { x: e.clientX, y: e.clientY, button: e.button });
});
document.addEventListener('mouseenter', (e) => {
    recordAction('mouseenter', { x: e.clientX, y: e.clientY });
});
document.addEventListener('mouseleave', (e) => {
    recordAction('mouseleave', { x: e.clientX, y: e.clientY });
});
window.addEventListener('blur', () => {
    isFocused = false;
    const focusTime = Date.now() - lastFocusTime;
    recordAction('blur', { timeFocused: focusTime });
    sendBufferedEvents();
});
window.addEventListener('focus', () => {
    isFocused = true;
    lastFocusTime = Date.now();
    recordAction('focus', {});
});
setInterval(sendBufferedEvents, 5000);
window.addEventListener('beforeunload', sendBufferedEvents);

// Video recording monkey-patch
(function() {
    function patch() {
    const inst = window.gameInstance;
    if (inst && inst.draw && !inst._capturePatched) {
        const origDraw = inst.draw;
        let started = false;
        let capture;

        // Video parameters
        let fps = 60;
        let quality = 0.8;
        // let width = 600;
        // let height = 400;
        let width = 300;
        let height = 200;

        inst.draw = function() {
        if (!started) {
            console.log('starting video recording at frame', inst.frameCount);
            capture = window.P5Capture.getInstance();
            capture.start({
                format: 'mp4',
                verbose: true,
                framerate: fps,
                quality: quality,
                width: width,
                height: height,
                beforeDownload(blob, ctx, next) {
                    const formData = new FormData();
                    formData.append('video', blob, ctx.filename);
                    formData.append('game_id', '""" + game_id + """');
                    formData.append('rating_id', '""" + rating_id + """');
                    formData.append('video_start_framecount', video_start_framecount);
                    formData.append('fps', fps);
                    formData.append('quality', quality);
                    formData.append('width', width);
                    formData.append('height', height);

                    // Add retry mechanism for video uploads
                    const uploadWithRetry = (attempt = 1, maxAttempts = 3) => {
                        console.log(`Attempting to upload video (attempt ${attempt}/${maxAttempts})...`);
                        
                        fetch('/upload-video', {
                            method: 'POST',
                            body: formData
                        })
                        .then(res => res.json())
                        .then(data => {
                            console.log('Video upload successful');
                            window.parent.postMessage({ 
                                action: "videoUploadComplete", 
                                gameId: gameId, 
                                ratingId: ratingId
                            }, "*");
                        })
                        .catch(err => {
                            console.error('Error uploading video:', err);
                            if (attempt < maxAttempts) {
                                console.log(`Retrying upload in 2 seconds...`);
                                setTimeout(() => uploadWithRetry(attempt + 1, maxAttempts), 2000);
                            } else {
                                console.error('Maximum upload attempts reached. Proceeding anyway.');
                                // Still notify parent we're done, even if upload failed
                                window.parent.postMessage({ 
                                    action: "videoUploadComplete", 
                                    gameId: gameId, 
                                    ratingId: ratingId,
                                    error: true
                                }, "*");
                            }
                        });
                    };
                    
                    uploadWithRetry();
                }
            });
            window._videoRecordingStarted = true;
            started = true;
            video_start_framecount = inst.frameCount;
            recordAction('video_recording_started', {});
        }
        return origDraw.apply(this, arguments);
        };
        inst._capturePatched = true;
        window.addEventListener('message', e => {
        if (e.data.action === 'stopRecording' && capture && capture.state === 'capturing') {
            capture.stop();
        }
        });
    } else {
        setTimeout(patch, 100);
    }
    }
    patch();
})();

</script>
"""
        if "</body>" in html:
            html = html.replace("</body>", tracking_js + "</body>")
        else:
            html += tracking_js
        return Response(html, mimetype='text/html')    
    else:
        # For other file types, return 404
        return "File type not supported", 404


@app.route('/upload-video', methods=['POST'])
def upload_video():
    video = request.files['video']
    game_id = request.form.get('game_id', 'local')
    rating_id = request.form.get('rating_id', 'unknown')
    video_start_framecount = request.form.get('video_start_framecount', -1)
    fps = request.form.get('fps', -1)
    quality = request.form.get('quality', -1)
    width = request.form.get('width', -1)
    height = request.form.get('height', -1)
    
    # Generate filename
    filename = f"rating_{rating_id}_game_{game_id}.mp4"
    
    # Save locally if enabled
    if SAVE_LOCALLY:
        save_dir = RESULTS_DIR / f"rating_{rating_id}_game_{game_id}"
        save_dir.mkdir(parents=True, exist_ok=True)
        save_path = save_dir / "video.mp4"
        video.save(save_path)
        
        # save metadata
        metadata = {
            "filename": filename,
            "game_id": game_id,
            "rating_id": rating_id,
            "video_start_framecount": video_start_framecount,
            "fps": fps,
            "quality": quality,
            "width": width,
            "height": height
        }
        with open(save_dir / "metadata.json", 'w') as f:
            json.dump(metadata, f, indent=4)
        print(f"Saved video locally for game {game_id} (rating {rating_id}) at {save_path}")
    
    if SAVE_HF:
        try:
            # Reset stream position and ensure binary mode
            video.stream.seek(0)

            # Make sure the repo exists
            hf_api.create_repo(
                repo_id=VIDEO_DATASET,
                repo_type="dataset",
                token=HF_TOKEN,
                exist_ok=True
            )

            # Upload to HuggingFace in the background
            hf_api.upload_file(
                path_or_fileobj=video.stream.read(),
                path_in_repo=filename,
                repo_id=VIDEO_DATASET,
                repo_type="dataset",
                token=HF_TOKEN,
                run_as_future=True
            )
            print(f"Started background upload of video {filename} to {VIDEO_DATASET}")        
            return jsonify({"status": "success", "filename": filename})
        except Exception as e:
            print(f"Error starting video upload: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    return jsonify({"status": "success", "filename": filename})


@app.route('/record-events', methods=['POST'])
def record_events():
    """Handle events from games"""
    event_data = request.json
    game_id = event_data.get('gameId')
    rating_id = event_data.get('ratingId')
    key = (rating_id, game_id)
    if key not in game_events:
        game_events[key] = []
    # check if event is video_recording_started
    for event in event_data.get('events', []):
        if event['type'] == 'video_recording_started':
            print("Video recording started")
    game_events[key].extend(event_data.get('events', []))
    
    # Save locally if enabled
    if SAVE_LOCALLY:
        save_dir = RESULTS_DIR / f"rating_{rating_id}_game_{game_id}"
        save_dir.mkdir(parents=True, exist_ok=True)
        save_path = save_dir / "events.json"
        with open(save_path, 'w') as f:
            json.dump(game_events[key], f, indent=4)
        print(f"Saved events for game {game_id} (rating {rating_id}) at {save_path}")
    
    return jsonify({"status": "success"})

@app.route('/feedback', methods=['GET', 'POST'])
def feedback_form():
    # Check if user is logged in
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        # Process submitted feedback
        user_id = session.get('user_id')
        
        # Collect all feedback fields from the form
        feedback_data = {
            "user_id": user_id,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "issues": request.form.get('issues', ''),
            "confusing": request.form.get('confusing', ''),
            "suggestions": request.form.get('suggestions', ''),
            "fun_criteria": request.form.get('fun_criteria', ''),
            "age": request.form.get('age', ''),
            "gender": request.form.get('gender', ''),
            "gaming_frequency": request.form.get('gaming_frequency', ''),
            "gaming_experience": request.form.get('gaming_experience', '')
        }
        
        # Generate a unique filename for the feedback
        feedback_filename = f"feedback_{user_id}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        
        # Save locally if enabled
        if SAVE_LOCALLY:
            save_dir = RESULTS_DIR / f"feedback_{user_id}"
            save_dir.mkdir(parents=True, exist_ok=True)
            with open(save_dir / "feedback.json", 'w') as f:
                json.dump(feedback_data, f, indent=4)
            print(f"Saved feedback for user {user_id}")
        
        # Save to HuggingFace dataset
        if SAVE_HF:
            try:
                # Make sure the repo exists
                hf_api.create_repo(
                    repo_id=FEEDBACK_DATASET,
                    repo_type="dataset",
                    token=HF_TOKEN,
                    exist_ok=True
                )
                
                # Convert feedback data to JSON string
                feedback_json = json.dumps(feedback_data, indent=4)
                
                # Upload to HuggingFace
                hf_api.upload_file(
                    path_or_fileobj=feedback_json.encode('utf-8'),
                    path_in_repo=feedback_filename,
                    repo_id=FEEDBACK_DATASET,
                    repo_type="dataset",
                    token=HF_TOKEN
                )
                print(f"Uploaded feedback to HuggingFace: {feedback_filename}")
            except Exception as e:
                print(f"Error uploading feedback: {e}")
        
        # Show completion page with code
        return render_template_string(COMPLETION_TEMPLATE, completion_code=COMPLETION_CODE)
    
    # Display feedback form
    return render_template_string(FEEDBACK_TEMPLATE)

# Template for the completion page
COMPLETION_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Study Completed</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f8f8;
            text-align: center;
        }
        .completion-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-top: 50px;
        }
        h1 {
            color: #4CAF50;
        }
        .code-box {
            background: #f1f1f1;
            padding: 15px;
            border-radius: 4px;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            display: inline-block;
        }
        p {
            color: #666;
            line-height: 1.5;
        }
        .emoji {
            font-size: 48px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="completion-container">
        <div class="emoji">🎉</div>
        <h1>Study Completed!</h1>
        <p>Thank you for participating in our research. Your contributions are invaluable.</p>
        <p>Please copy the following completion code and enter it into Prolific:</p>
        <div class="code-box">{{ completion_code }}</div>
        <p>You may now close this window.</p>
    </div>
</body>
</html>
'''

# Add new template for the feedback form
FEEDBACK_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Study Feedback</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f8f8;
        }
        .feedback-container {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-top: 0;
        }
        p {
            color: #666;
            line-height: 1.5;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #444;
        }
        textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            min-height: 80px;
            resize: vertical;
        }
        input[type="text"], select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #2980b9;
        }
        .description {
            font-size: 14px;
            color: #777;
            margin-top: 4px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="feedback-container">
        <h1>Thank You for Participating!</h1>
        <p>Before we finish, we'd appreciate your feedback on this experience. Your responses will help us improve our research.</p>
        
        <form method="post" action="/feedback">
            <div class="form-group">
                <label for="issues">Did you encounter any technical issues during the study?</label>
                <textarea id="issues" name="issues" placeholder="Please describe any technical issues you faced..."></textarea>
            </div>
            
            <div class="form-group">
                <label for="confusing">Was any part of the experiment confusing?</label>
                <textarea id="confusing" name="confusing" placeholder="Please tell us what was confusing or unclear..."></textarea>
            </div>
            
            <div class="form-group">
                <label for="suggestions">Do you have any suggestions or feedback to improve the study?</label>
                <textarea id="suggestions" name="suggestions" placeholder="Your suggestions will help us improve these basic 2D games..."></textarea>
            </div>
            
            <div class="form-group">
                <label for="fun_criteria">How did you decide whether a game was fun or not?</label>
                <textarea id="fun_criteria" name="fun_criteria" placeholder="What criteria did you use to evaluate the games?"></textarea>
            </div>
            
            <h2>Demographics</h2>
            <p class="description">This information helps us understand our participant pool better. All responses are anonymous.</p>
            
            <div class="form-group">
                <label for="age">Age</label>
                <select id="age" name="age">
                    <option value="">Prefer not to say</option>
                    <option value="18-24">18-24</option>
                    <option value="25-34">25-34</option>
                    <option value="35-44">35-44</option>
                    <option value="45-54">45-54</option>
                    <option value="55-64">55-64</option>
                    <option value="65+">65+</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="gender">Gender</label>
                <select id="gender" name="gender">
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="gaming_frequency">How often do you play video games?</label>
                <select id="gaming_frequency" name="gaming_frequency">
                    <option value="">Prefer not to say</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Rarely">Rarely</option>
                    <option value="Never">Never</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="gaming_experience">How would you rate your experience with video games?</label>
                <select id="gaming_experience" name="gaming_experience">
                    <option value="">Prefer not to say</option>
                    <option value="Novice">Novice</option>
                    <option value="Casual">Casual</option>
                    <option value="Experienced">Experienced</option>
                    <option value="Expert">Expert</option>
                </select>
            </div>
            
            <button type="submit">Submit Feedback & Complete Study</button>
        </form>
    </div>
</body>
</html>
'''

# Template for the calibration phase
CALIBRATION_TEMPLATE = '''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Game Calibration Phase</title>
        <style>
        html, body {
            overscroll-behavior: none;
            height: 100%;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: Arial, sans-serif;
            max-width: 1300px;
            margin: 0 auto;
            padding: 10px;
            display: flex;
            flex-direction: column;
            height: 100vh;
            background-color: #f8f8f8;
            box-sizing: border-box;
            justify-content: center;
        }
        .game-counter-badge {
            position: fixed;
            top: 24px;
            right: 32px;
            z-index: 1200;
            background: #3498db;
            color: #fff;
            font-weight: bold;
            font-size: 16px;
            padding: 10px 14px;
            border-radius: 24px;
            box-shadow: 0 2px 8px rgba(52,152,219,0.10);
            letter-spacing: 0.5px;
            border: 1.5px solid #2980b9;
            min-width: 120px;
            text-align: center;
            user-select: none;
        }
        .main-content {
            display: flex;
            flex-direction: column;
            flex: 1;
            justify-content: center;
            max-height: 100vh;
        }
        .game-container {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 0px;
        }
        .game-box {
            flex: 1;
            border: none;
            padding: 10px;
            background: transparent;
            display: flex;
            flex-direction: column;
            height: auto;
            max-width: 1000px;
            margin: 0 auto;
        }
        .game-frame {
            width: 600px;
            height: 400px;
            border: none;
            background: #222;
            overflow: hidden;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .calibration-info {
            text-align: center;
            padding: 15px 0;
            color: #555;
            font-size: 16px;
        }
        .actions {
            text-align: center;
            padding: 10px;
        }
        button {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            background-color: #3498db;
            color: white;
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: #2980b9;
        }
        </style>
    </head>
    <body>
    <!-- Game Counter Badge -->
    <div class="game-counter-badge">
        <span>Example: {{ games_seen + 1 }}/{{ total_calibration_games }}</span>
    </div>
    
    <!-- Loading Overlay -->
    <div id="loading-overlay" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,255,255,0.85); z-index:2000; justify-content:center; align-items:center; flex-direction:column;">
        <div style="margin-bottom:20px;">
            <svg width="60" height="60" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#3498db" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
        </div>
        <div style="font-size:20px; color:#3498db; font-weight:bold;">Loading...</div>
    </div>
    
    <div class="main-content">
        <div class="calibration-info">
            These are example game people have really liked and really disliked.
        </div>
        <div class="game-container">
            <div class="game-box">
                <iframe class="game-frame" src="/game/{{ game_path }}"></iframe>
            </div>
        </div>
        <div class="actions">
            <button id="next-game">Continue</button>
        </div>
    </div>

    <script>
        // Start by focusing on the game iframe
        document.querySelector('.game-frame').addEventListener('load', function() {
            this.focus();
        });
        
        // Handle continue button
        document.getElementById('next-game').addEventListener('click', function() {
            // Show loading overlay
            document.getElementById('loading-overlay').style.display = 'flex';
            
            // Record that this calibration game was viewed
            fetch('/calibration-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_id: '{{ game_id }}'
                }),
            })
            .then(response => response.json())
            .then(data => {
                // Redirect based on whether calibration is complete
                if (data.is_complete) {
                    window.location.href = '/start-rating-phase';
                } else {
                    window.location.href = '/'; // Load the next calibration game
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('loading-overlay').style.display = 'none';
                alert('Error submitting data');
            });
        });
        
        // Prevent scrolling with keyboard
        window.addEventListener("keydown", function(e) {
            // Check if the target is not an input or textarea
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                // Prevent default for navigation keys (space, arrow keys)
                if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                    e.preventDefault();
                }
            }
        }, false);
        
        // Prevent scrolling with mouse wheel when over iframes
        document.querySelectorAll('.game-frame').forEach(iframe => {
            iframe.addEventListener('mouseover', function() {
                document.body.style.overflow = 'hidden';
            });
            
            iframe.addEventListener('mouseout', function() {
                document.body.style.overflow = 'auto';
            });
        });
    </script>
    </body>
    </html>
'''

# Template for the transition from calibration to rating phase
TRANSITION_TEMPLATE = '''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Start Rating Phase</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f8f8f8;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                padding: 0;
            }
            .modal-content {
                background-color: #fff;
                padding: 30px;
                border: none;
                border-radius: 8px;
                width: 80%;
                max-width: 800px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                position: relative;
            }
            .modal-content h2 {
                margin-top: 0;
                margin-bottom: 10px;
            }
            .modal-content p {
                margin-top: 0;
                margin-bottom: 10px;
                color: #555;
                line-height: 1.5;
            }
            .highlight-box {
                background-color: #f1f8fe;
                border-left: 4px solid #3498db;
                padding: 15px;
                margin: 15px 0;
                border-radius: 0 4px 4px 0;
            }
            button {
                background-color: #3498db;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 12px 24px;
                cursor: pointer;
                transition: background-color 0.2s;
                font-size: 16px;
                margin-top: 20px;
            }
            button:hover {
                background-color: #2980b9;
            }
        </style>
    </head>
    <body>
        <div class="modal-content">
            <h2>Begin the rating phase</h2>
            <p>Based on the example games you just saw, <strong>please use the full range of the rating scales (0-100) to reflect the differences between games</strong>.</p>
            
            <button onclick="window.location.href='/'">Start rating</button>
        </div>
    </body>
    </html>
'''

@app.route('/instructions')
def show_instructions():
    """Show instructions about the rating task"""
    return render_template_string(INSTRUCTIONS_TEMPLATE)

@app.route('/instructions-complete')
def instructions_complete():
    """Mark that the user has seen the instructions"""
    session['seen_instructions'] = True
    return redirect(url_for('index'))

# Template for the initial instructions
INSTRUCTIONS_TEMPLATE = '''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Game Rating Instructions</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f8f8f8;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                padding: 0;
            }
            .modal-content {
                background-color: #fff;
                padding: 30px;
                border: none;
                border-radius: 8px;
                width: 80%;
                max-width: 800px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                position: relative;
            }
            .modal-content h2 {
                margin-top: 0;
                margin-bottom: 10px;
            }
            .modal-content h3 {
                margin-top: 15px;
                margin-bottom: 5px;
            }
            .modal-content p {
                margin-top: 0;
                margin-bottom: 10px;
            }
            .modal-content ul {
                margin-top: 5px;
                margin-bottom: 10px;
            }
            .modal-content li {
                margin-bottom: 3px;
            }
            button {
                background-color: #3498db;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 12px 24px;
                cursor: pointer;
                transition: background-color 0.2s;
                font-size: 16px;
                margin-top: 20px;
            }
            button:hover {
                background-color: #2980b9;
            }
        </style>
    </head>
    <body>
        <div class="modal-content">
            <h2>How to rate the games</h2>
            <p>Your task is to evaluate a series of basic 2D games. You will be shown a total of ''' + str(NUM_GAMES_TO_RATE) + ''' games to rate. These games may contain issues. You should take these issues into account when rating the games.</p>
            <h3>Please follow these steps to provide your rating:</h3>
            <ol>
                <li><b>Please play each game for at least 30 seconds</b> to get a good feel for it. If the game appears broken or has issues, please still try your best to interact with it for the full time.</li>
                <li><b>Rate the playability of the game on a scale from 0 to 100:</b><br>
                    - 0: Completely unplayable or broken<br>
                    - 50: Average controls and interaction<br>
                    - 100: Excellent, intuitive controls and interaction
                </li>
                <li><b>Rate how fun the game is on a scale from 0 to 100:</b><br>
                    - 0: Not fun at all<br>
                    - 50: Somewhat enjoyable<br>
                    - 100: Extremely fun (for a basic 2D game)
                </li>
                <li><b>Provide a brief explanation for your ratings.</b></li>
            </ol>
            <h3>Important Notes:</h3>
            <ul style="padding-left: 25px;">
                <li>We record your interactions with the game to understand how people play it.</li>
                <li>Please take this seriously; we use this data for research.</li>
                <li>There are no right or wrong answers—please give your honest opinion.</li>
                <li>If you are not serious about the evaluation, we will not be able to compensate you.</li>
                <li>The game window may lose focus. If this happens, please click on the game window to focus it.</li>
            </ul>
            <p>Before you start rating, you will see example games. Briefly interact with them to get a feel for the range of games you will be rating. </p>
            <button onclick="window.location.href='/instructions-complete'">Start</button>
        </div>
    </body>
    </html>
'''

if __name__ == '__main__':
    app.run(debug=True)
