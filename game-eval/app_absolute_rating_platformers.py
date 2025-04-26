from pathlib import Path
import random
from flask import Flask, render_template_string, request, jsonify, Response, redirect, url_for, session
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


games_version = "v5"
GAMES_DATASET = f"generative-games/gen-games-{games_version}"
PREFERENCES_DATASET = f"generative-games/gen-games-{games_version}-absolute-rating-test2"  # Dataset to save ratings
VIDEO_DATASET = f"generative-games/gen-games-{games_version}-video-test2"  # Dataset to save videos


PUSH_EVERY_N_RATINGS = 10
SAVE_LOCALLY = True
SAVE_HF = False

RESULTS_DIR = Path(__file__).parent / "results" / f"games_{games_version}"

# Create results directory if it doesn't exist
RESULTS_DIR.mkdir(exist_ok=True, parents=True)

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Store game events in memory
game_events = {}
rated_games = set()  # Track which games have been rated

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

def get_random_game():
    """Get a random game from the dataset and generate a unique rating_id"""
    # Filter out already rated games
    unrated_games = [game for game in GAMES_DATASET if game["id"] not in rated_games]
    if not unrated_games:
        return None, None

    # TODO: sometimes index.html is missing (skip the game and add it to the rated games set)
    # valid_games = [game for game in unrated_games if "index.html" in game["game_file_paths"]]
    # if not valid_games:
    #     return None, None

    game = random.choice(unrated_games)
    rating_id = str(uuid.uuid4())
    return game, rating_id

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
            width: 1000px;
            height: 600px;
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
        button#show-instructions {
            background-color: #f1f1f1;
            color: #555;
        }
        button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        button:active {
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
            color: #3498db;
            font-weight: bold;
            text-align: center;
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
            font-size: 11px;
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
        </style>
    </head>
    <body>
    <!-- Game Counter Badge -->
    <div class="game-counter-badge">
        <span id="games-left">Loading...</span>
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
        <div style="font-size:20px; color:#3498db; font-weight:bold;">Submitting your rating, please wait...</div>
    </div>
    <!-- Instructions Modal -->
    <div id="instructionsModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>How to Evaluate the Game</h2>
            <p>Your task is to evaluate a series of games. You will be shown a total of 30 games to rate.</p>
            <h3>Please follow these steps to provide your rating:</h3>
            <ol>
                <li><b>Please play each game for about 1 minute</b> to get a good feel for it. If the game is broken or unplayable, you may stop earlier.</li>
                <li><b>Rate how fun the game is on a scale from 0 to 10:</b><br>
                    - 0: Not fun at all<br>
                    - 5: Somewhat enjoyable<br>
                    - 10: Extremely fun and engaging (like a free mobile game you'd play multiple times)
                </li>
            </ol>
            <h3>Important Notes:</h3>
            <ul style="padding-left: 25px;">
                <li>We record your interactions with the game to understand how people play it.</li>
                <li>Please take this seriously; we use this data for research.</li>
                <li>There are no right or wrong answers—please give your honest opinion.</li>
                <li>If you are not serious about the evaluation, we will not be able to compensate you.</li>
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
                <div class="rating-item">
                    <label>Fun: How enjoyable is the game to play?</label>
                    <div class="rating-description" style="font-size:12px; color:#666; margin-bottom:4px;">
                        0: Not fun at all &nbsp;|&nbsp; 5: Somewhat enjoyable &nbsp;|&nbsp; 10: Extremely fun and engaging
                    </div>
                    <fieldset class="range__field">
                        <input class="range" type="range" min="0" max="10" value="5" id="fun-1">
                        <svg role="presentation" width="100%" height="14" xmlns="http://www.w3.org/2000/svg">
                            <text class="range__point" x="0%" y="14" text-anchor="start">0</text>
                            <text class="range__point" x="10%" y="14" text-anchor="middle">1</text>
                            <text class="range__point" x="20%" y="14" text-anchor="middle">2</text>
                            <text class="range__point" x="30%" y="14" text-anchor="middle">3</text>
                            <text class="range__point" x="40%" y="14" text-anchor="middle">4</text>
                            <text class="range__point" x="50%" y="14" text-anchor="middle">5</text>
                            <text class="range__point" x="60%" y="14" text-anchor="middle">6</text>
                            <text class="range__point" x="70%" y="14" text-anchor="middle">7</text>
                            <text class="range__point" x="80%" y="14" text-anchor="middle">8</text>
                            <text class="range__point" x="90%" y="14" text-anchor="middle">9</text>
                            <text class="range__point" x="100%" y="14" text-anchor="end">10</text>
                        </svg>
                    </fieldset>
                    <!--
                    <div class="scale-labels">
                        <span>Not fun</span>
                        <span>Very fun</span>
                    </div>
                    -->
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
        </div>
        {% endif %}
    </div>

    <script>
        // Modal functionality
        const modal = document.getElementById("instructionsModal");
        const closeBtn = document.getElementsByClassName("close")[0];
        const startBtn = document.getElementById("startButton");
        const showInstructionsBtn = document.getElementById("show-instructions");
        
        // Check if this is the first visit
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
                slider.value = 5;
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
            // Prevent default for navigation keys (space, arrow keys)
            if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
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
                // Just keep track of the value, without updating display elements
                const value = this.value;
                // No need to update non-existent elements
            });
        });
        
        // Reset all sliders to default value (5) when page loads
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('input[type="range"]').forEach(slider => {
                slider.value = 5;
            });
        });
        
        // Submit ratings
        document.getElementById('submit-ratings').addEventListener('click', function() {
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
                const data = {
                    ratings: {
                        fun: document.getElementById('fun-1').value
                    },
                    logs: logs,
                    rating_id: '{{ rating_id }}',
                    game_id: '{{ game_id }}'
                };
                fetch('/submit-ratings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                })
                .then(response => response.json())
                .then(data => {
                    updateGamesLeft();
                    // Hide loading overlay
                    document.getElementById('loading-overlay').style.display = 'none';
                    window.location.reload();
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
                let timeoutId = setTimeout(() => {
                    window.removeEventListener('message', window._videoUploadCompleteHandler);
                    submitRatings();
                }, 10000); // 10 seconds
                window._videoUploadCompleteHandler = function(event) {
                    if (event.data && event.data.action === "videoUploadComplete") {
                        window._pendingVideoUploads--;
                        if (window._pendingVideoUploads <= 0) {
                            clearTimeout(timeoutId);
                            window.removeEventListener('message', window._videoUploadCompleteHandler);
                            submitRatings();
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
    </script>
    </body>
    </html>
'''

@app.route('/get-games-left')
def get_games_left():
    """Return the number of games left to rate"""
    total_games = len(GAMES_DATASET)
    games_left = total_games - len(rated_games)
    return jsonify({
        'games_left': games_left,
        'total_games': total_games
    })

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
                <li><b>Contact:</b> If you have questions about this research, please contact the researchers at <a href="mailto:email@mit.edu">email@mit.edu</a>. For questions regarding your rights as a participant, or if problems arise which you do not feel you can discuss with the researchers, please contact the MIT Committee on the Use of Humans as Experimental Subjects (COUHES).</li>
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
            return redirect(url_for('index'))
        # If not all checked, reload page (button should prevent this)
    return consent_text

@app.route('/')
def index():
    # Require consent before proceeding
    if not session.get('consented'):
        return redirect(url_for('consent'))
    game, rating_id = get_random_game()
    if game is None:
        return render_template_string(HTML_TEMPLATE, game_id=None)
    game_path = f'rating_{rating_id}/game_{game["id"]}/index.html'
    return render_template_string(HTML_TEMPLATE, game_path=game_path, rating_id=rating_id, game_id=game["id"])

@app.route('/game/<path:game_path>')
def serve_game(game_path):
    """Serve game HTML files and other assets"""
    rating_id = game_path.split('/')[0].replace('rating_', '')
    game_id = game_path.split('/')[1].replace('game_', '')
    
    # Find game in dataset
    game = GAMES_DATASET.filter(lambda x: x["id"] == game_id)[0]


    print("Serve game:", game["game_concept"], game["model"])

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

                    fetch('/upload-video', {
                        method: 'POST',
                        body: formData
                    })
                    .then(res => res.json())
                    .then(data => {
                        window.parent.postMessage({ 
                            action: "videoUploadComplete", 
                            gameId: gameId, 
                            ratingId: ratingId
                        }, "*");
                    })
                    .catch(err => {
                        console.error('Error uploading video:', err);
                    });
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


@app.route('/submit-ratings', methods=['POST'])
def submit_ratings():
    """Handle game ratings submission"""
    global ratings_counter
    data = request.json
    ratings = data.get('ratings', {})
    logs = data.get('logs', {})
    rating_id = data.get('rating_id', 'unknown')
    game_id = data.get('game_id', 'local')

    # Mark game as rated
    rated_games.add(game_id)

    # Add events data to ratings
    event_key = (rating_id, game_id)
    if event_key in game_events:
        events = game_events[event_key]  # This is already a list of events
        del game_events[event_key]
    else:
        events = []

    if SAVE_LOCALLY:
        # Save to local files
        save_dir = RESULTS_DIR / f"rating_{rating_id}_game_{game_id}"
        save_dir.mkdir(parents=True, exist_ok=True)
        with open(save_dir / "ratings.json", 'w') as f:
            json.dump(ratings, f, indent=4)
        with open(save_dir / "logs.json", 'w') as f:
            json.dump(logs, f, indent=4)

    print(f"Saved ratings for rating_id {rating_id}")

    # Save to HuggingFace dataset
    if SAVE_HF:
        try:
            # Create rating entry for HF dataset
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            rating_entry = {
                "id": rating_id,
                "game_id": game_id,
                "judge": request.remote_addr,  # Use IP as anonymous identifier
                "timestamp": timestamp,
                "ratings": {
                    "fun": ratings.get('fun')
                },
                "logs": json.dumps(logs),
                "events": json.dumps(events)
            }
            
            # Add to scheduler
            preferences_scheduler.append(rating_entry)
            print(f"Added rating to HF dataset queue: {rating_entry['id']}")
            
            # Increment counter and check if we should push
            ratings_counter += 1
            print(f"Ratings counter: {ratings_counter}")
            if ratings_counter >= PUSH_EVERY_N_RATINGS:
                print(f"Reached {PUSH_EVERY_N_RATINGS} ratings, pushing to HuggingFace...")
                preferences_scheduler.push_to_hub()
                ratings_counter = 0  # Reset counter
                
        except Exception as e:
            print(f"Error saving to HF dataset: {e}")
    
    return jsonify({"status": "success"})

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
    print("Received events")
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

if __name__ == '__main__':
    app.run(debug=True)
