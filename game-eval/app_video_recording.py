from pathlib import Path
import random
from flask import Flask, render_template_string, request, jsonify
import os
import glob
import json
import datetime
from datasets import load_dataset
import uuid
from flask import session
from scheduler import ParquetScheduler

# Hugging Face configuration
HF_TOKEN = os.environ.get("HF_TOKEN")
GAMES_DATASET = "generative-games/gen-games-v4"
PREFERENCES_DATASET = "generative-games/gen-games-v4-preferences-test"  # Dataset to save ratings

PUSH_EVERY_N_RATINGS = 10

RESULTS_DIR = Path(__file__).parent / "results"
RATINGS_FILE = RESULTS_DIR / "all_ratings.json"

# Create results directory if it doesn't exist
RESULTS_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Store game events in memory
game_events = {}

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


def get_random_games(num_games=2):
    """Get random games from the dataset"""
    # 1) sample a game concept
    # 2) sample two different methods
    # 3) sample a game for each method
    concept_ids = GAMES_DATASET.unique("game_concept_id")
    concept_id = random.choice(concept_ids)
    games = GAMES_DATASET.filter(lambda x: x["game_concept_id"] == concept_id)
    methods = games.unique("method")
    method_a = random.choice(methods)
    method_b = random.choice(methods)
    while method_b == method_a:
        method_b = random.choice(methods)
    games_a = games.filter(lambda x: x["method"] == method_a)
    games_b = games.filter(lambda x: x["method"] == method_b)
    game_a = random.choice(games_a)
    game_b = random.choice(games_b)
    return [game_a, game_b]


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
        .main-content {
            display: flex;
            flex-direction: column;
            flex: 1;
            justify-content: center;
            max-height: 100vh;
        }
        .game-container {
            display: flex;
            justify-content: space-between;
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
        }
        .game-frame {
            width: 100%;
            max-width: 600px;
            height: 400px;
            border: none;
            background: #222;
            overflow: hidden; /* Prevent scrolling within iframe */
            margin: 0 auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .rating-sliders {
            margin-top: 10px;
            background: white;
            padding: 16px;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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
        .overall-comparison {
            background: white;
            padding: 10px;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            text-align: center;
            max-width: 500px;
            margin: 2px auto;
        }
        .overall-comparison h3 {
            display: inline-block;
            margin: 0 10px 0 0;
            color: #444;
            font-size: 16px;
            vertical-align: middle;
        }
        .comparison-options {
            display: inline-block;
            vertical-align: middle;
        }
        .comparison-options label {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            margin: 0 10px;
        }
        .comparison-options input[type="radio"] {
            margin: 0;
            width: 18px;
            height: 18px;
        }
                
        </style>
    </head>
    <body>
    <!-- Instructions Modal -->
    <div id="instructionsModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Game Evaluation Study</h2>
            <p>Thank you for participating in our game evaluation study! Your feedback will help us understand what makes games engaging and fun.</p>
            
            <h3>How to Evaluate the Games</h3>
            <p >You'll be shown two games side by side. For each game, please:</p>
            
            <div>
                <h4>1. Play for about 1 minute to get a good feel for it. You can stop earlier if the game is broken and is impossible to play.</h4>
                <h4>2. Rate the game on three aspects:</h4>
                
                <div style="margin-left: 15px; ">
                    <h4>Controls (0-10)</h4>
                    <p style="margin-left: 10px; ">
                        - 0: Controls are completely confusing and unresponsive<br>
                        - 5: Controls are somewhat intuitive but could be improved<br>
                        - 10: Controls are perfectly intuitive and responsive
                    </p>
                    
                    <h4>Difficulty (0-10)</h4>
                    <p style="margin-left: 10px; ">
                        - 0: Game is too easy and has no challenge at all<br>
                        - 5: Game has a good balance of challenge<br>
                        - 10: Game is extremely difficult
                    </p>
                    
                    <h4>Fun Factor (0-10)</h4>
                    <p style="margin-left: 10px; ">
                        - 0: Game is not enjoyable at all<br>
                        - 5: Game is somewhat enjoyable (like a basic mobile game you'd play once)<br>
                        - 10: Game is extremely fun and engaging
                    </p>
                </div>
                
                <h4>3. Finally, choose which game you think an average person would choose to play</h4>
            </div>
            
            <h3>Important Notes</h3>
            <ul style="padding-left: 25px;">
                <li>We record your interactions with the games to understand how people play them</li>
                <li>Please take this seriously - we use this data for research</li>
                <li>There are no right or wrong answers - we want your honest opinion</li>
                <li>If you're not serious about the evaluation, we won't be able to compensate you</li>
            </ul>
            
            <p>Ready to start? Click the button below to begin!</p>
            
            <button id="startButton">Start Playing</button>
        </div>
    </div>
        
    <div class="main-content">
        <div class="game-container">
        {% for game in games %}
        <div class="game-box">
            <div class="game-label">Game {% if loop.index == 1 %}A{% else %}B{% endif %}</div>
            <iframe class="game-frame" src="/game/{{ game.path }}"></iframe>
            
            <div class="rating-sliders">
                <div class="rating-item">
                    <label>Controls: How intuitive and responsive were the controls?</label>
                    <fieldset class="range__field">
                        <input class="range" type="range" min="0" max="10" value="5" id="controls-{{ loop.index }}">
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
                    <div class="scale-labels">
                        <span>Confusing</span>
                        <span>Intuitive</span>
                    </div>
                </div>
                
                <div class="rating-item">
                    <label>Difficulty: How challenging was the game to play?</label>
                    <fieldset class="range__field">
                        <input class="range" type="range" min="0" max="10" value="5" id="difficulty-{{ loop.index }}">
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
                    <div class="scale-labels">
                        <span>Too easy</span>
                        <span>Very challenging</span>
                    </div>
                </div>
                
                <div class="rating-item">
                    <label>Fun: How enjoyable was the game to play?</label>
                    <fieldset class="range__field">
                        <input class="range" type="range" min="0" max="10" value="5" id="fun-{{ loop.index }}">
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
                    <div class="scale-labels">
                        <span>Not fun</span>
                        <span>Very fun</span>
                    </div>
                </div>
            </div>
        </div>
        {% endfor %}
    </div>
    
    <div class="overall-comparison">
        <h3>Which game is better overall?</h3>
        <div class="comparison-options">
            <label>
                <input type="radio" name="better-game" value="1"> Game A
            </label>
            <label>
                <input type="radio" name="better-game" value="2"> Game B
            </label>
        </div>
    </div>
    
    <div class="actions">
        <button id="submit-ratings">Submit Ratings</button>
        <button id="show-instructions">Instructions</button>
    </div>
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
            
            // Also reset the final comparison radio buttons
            document.querySelectorAll('input[name="better-game"]').forEach(radio => {
                radio.checked = false;
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
        
        // Make sure the comparison radio buttons are unchecked when the page loads
        window.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('input[name="better-game"]').forEach(radio => {
                radio.checked = false;
            });
        });
        
        // Submit ratings
        document.getElementById('submit-ratings').addEventListener('click', function() {
            // Tell all game iframes to stop recording before submitting ratings
            // This ensures p5.capture stops and finalizes the video in each game
            document.querySelectorAll('.game-frame').forEach(iframe => {
                iframe.contentWindow.postMessage({ action: "stopRecording" }, "*");
            });
            
            // Check if a game has been selected for comparison
            const selectedGame = document.querySelector('input[name="better-game"]:checked');
            if (!selectedGame) {
                alert('Please select which game you think is better overall before submitting');
                return;
            }
            
            const ratings = {};
            
            // Add games with more descriptive keys
            {% for game in games %}
            ratings['game_{% if loop.index == 1 %}a{% else %}b{% endif %}'] = {
                url: '{{ game.path }}',
                fun: document.getElementById('fun-{{ loop.index }}').value,
                difficulty: document.getElementById('difficulty-{{ loop.index }}').value,
                controls: document.getElementById('controls-{{ loop.index }}').value
            };
            {% endfor %}
            
            // Get which game was selected as better overall
            const betterGameValue = selectedGame.value;
            ratings['comparison'] = {
                better_game: 'game_' + (betterGameValue == 1 ? 'a' : 'b')
            };
            
            // Wait for all video uploads to complete before reloading
            window._pendingVideoUploads = document.querySelectorAll('.game-frame').length;
            window._videoUploadCompleteHandler = function(event) {
                if (event.data && event.data.action === "videoUploadComplete") {
                    window._pendingVideoUploads--;
                    if (window._pendingVideoUploads <= 0) {
                        window.removeEventListener('message', window._videoUploadCompleteHandler);
                        fetch('/submit-ratings', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(ratings),
                        })
                        .then(response => response.json())
                        .then(data => {
                            resetAllSliders(); // Reset sliders before reloading
                            
                            // Store that instructions have been seen to prevent showing again after reload
                            localStorage.setItem("gameArenaVisited", "true");
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                            alert('Error submitting ratings');
                        });
                    }
                }
            };
            window.addEventListener('message', window._videoUploadCompleteHandler);
        });
    </script>
    </body>
    </html>
'''

@app.route('/')
def index():
    """Main page that displays random games and rating interface"""
    games = get_random_games(2)
    
    # Format games for template
    formatted_games = []
    for game in games:
        formatted_games.append({
            "path": f"{game['id']}/index.html",  # Use game ID in path
            "name": game["game_title"],
            "concept": game["game_concept"],
            "model": game["model"],
            "method": game["method"]
        })

        print(formatted_games)
    
    return render_template_string(HTML_TEMPLATE, games=formatted_games)

@app.route('/game/<path:game_path>')
def serve_game(game_path):
    """Serve game HTML files and other assets"""
    # Extract game ID from path
    game_id = game_path.split('/')[0]
    
    # Find game in dataset
    # game = None
    # for item in GAMES_DATASET:
    #     if item["id"] == game_id:
    #         game = item
    #         break
    game = GAMES_DATASET.filter(lambda x: x["id"] == game_id)[0]
    
    if game is None:
        return "Game not found", 404
    
    # Handle different file types
    if game_path.endswith('.js'):
        # Return JavaScript file
        # remove game id from path
        js_file = '/'.join(game_path.split('/')[1:])
        if js_file in game["game_file_paths"]:
            js_file_content = game["game_file_contents"][game["game_file_paths"].index(js_file)]
            return js_file_content, 200, {'Content-Type': 'application/javascript'}
        return "JavaScript file not found", 404
    
    elif game_path.endswith('index.html'):
        # Return HTML file
        html = game["game_file_contents"][game["game_file_paths"].index("index.html")]

        # Inject p5.capture and disable UI immediately after p5.js script tag
        # This must be done before the p5 instance is created to ensure the UI is hidden
        p5capture_injection = '''
<script src="https://cdn.jsdelivr.net/npm/p5.capture@1.5.0/dist/p5.capture.umd.min.js"></script>
<script>
  window.P5Capture && window.P5Capture.setDefaultOptions && window.P5Capture.setDefaultOptions({ disableUi: true });
</script>
'''
        html = html.replace(
            '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>',
            '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>' + p5capture_injection,
            1
        )

        # Anti-scrolling and event tracking JavaScript
        tracking_js = """
        <script>
        // Event tracking
        const eventBuffer = [];
        let isFocused = true;
        let lastFocusTime = Date.now();
        let lastX = null;
        let lastY = null;
        let lastMoveTime = 0;

        // Record action to buffer
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

        // Send buffered events to server
        function sendBufferedEvents() {
            if (eventBuffer.length > 0) {
                const events = eventBuffer.slice();
                eventBuffer.length = 0;
                
                fetch('/record-events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        gameId: '""" + game_id + """',
                        events: events
                    }),
                });
            }
        }

        // Prevent scrolling with keyboard
        window.addEventListener("keydown", function(e) {
            // Record keydown event
            recordAction('keydown', {
                keyCode: e.keyCode,
                key: e.key
            });
            
            // Prevent default for navigation keys
            if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }
        }, false);
        
        // More event listeners
        window.addEventListener('keyup', (e) => {
            recordAction('keyup', {
                keyCode: e.keyCode,
                key: e.key
            });
        });

        // Mouse movement tracking
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            // Only record if position changed AND at 60 FPS
            if ((lastX !== e.clientX || lastY !== e.clientY) && now - lastMoveTime > 16.66) {
                recordAction('mousemove', {
                    x: e.clientX,
                    y: e.clientY
                });
                lastX = e.clientX;
                lastY = e.clientY;
                lastMoveTime = now;
            }
        });
        
        // Mouse clicks
        document.addEventListener('click', (e) => {
            recordAction('click', {
                x: e.clientX,
                y: e.clientY,
                button: e.button
            });
        });
        
        // Mouse down/up
        document.addEventListener('mousedown', (e) => {
            recordAction('mousedown', {
                x: e.clientX,
                y: e.clientY,
                button: e.button
            });
        });
        
        document.addEventListener('mouseup', (e) => {
            recordAction('mouseup', {
                x: e.clientX,
                y: e.clientY,
                button: e.button
            });
        });
        
        // Track when mouse enters/leaves the game area
        document.addEventListener('mouseenter', (e) => {
            recordAction('mouseenter', {
                x: e.clientX,
                y: e.clientY
            });
        });
        
        document.addEventListener('mouseleave', (e) => {
            recordAction('mouseleave', {
                x: e.clientX,
                y: e.clientY
            });
        });

        // Focus/blur events
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

        // Send events periodically and when page unloads
        setInterval(sendBufferedEvents, 5000);
        window.addEventListener('beforeunload', sendBufferedEvents);
        </script>
        """
        
        # Inject p5.capture monkey-patch script
        p5capture_patch_js = """
        <script>
        (function() {
          function patch() {
            const inst = window.gameInstance;
            if (inst && inst.draw && !inst._capturePatched) {
              console.log('[p5capture] Patching gameInstance.draw for auto-recording');
              const origDraw = inst.draw;
              let started = false;
              let capture;
              inst.draw = function() {
                if (!started) {
                  // Mark the sync point for video and actions
                  console.log('[p5capture] Starting capture (first draw call)');
                  capture = window.P5Capture.getInstance();
                  capture.start({
                    format: 'mp4',
                    verbose: true,
                    framerate: 30,
                    quality: 0.8,
                    width: 300,
                    height: 200,
                    beforeDownload(blob, ctx, next) {
                      // Upload video to backend with correct game_id
                      console.log('[p5capture] beforeDownload: video ready', ctx.filename, 'size:', blob.size);
                      const gameId = '""" + game_id + """';
                      const formData = new FormData();
                      formData.append('video', blob, ctx.filename);
                      formData.append('game_id', gameId);
                      fetch('/upload-video', {
                        method: 'POST',
                        body: formData
                      })
                      .then(res => res.json())
                      .then(data => {
                        console.log('[p5capture] Video uploaded:', data);
                        // Notify parent that upload is complete
                        window.parent.postMessage({ action: "videoUploadComplete", gameId: gameId }, "*");
                        next();
                      })
                      .catch(err => {
                        console.error('[p5capture] Upload failed:', err);
                        next();
                      });
                    }
                  });
                  started = true;
                  recordAction('video_recording_started', {});
                }
                return origDraw.apply(this, arguments);
              };
              inst._capturePatched = true;
              window.addEventListener('message', e => {
                if (e.data.action === 'stopRecording' && capture && capture.state === 'capturing') {
                  console.log('[p5capture] Received stopRecording message, stopping capture');
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
        # Insert both scripts before </body>
        if "</body>" in html:
            html = html.replace("</body>", tracking_js + p5capture_patch_js + "</body>")
        else:
            html += tracking_js + p5capture_patch_js
        return html, 200, {'Content-Type': 'text/html'}
    
    else:
        # For other file types, return 404
        return "File type not supported", 404

@app.route('/record-events', methods=['POST'])
def record_events():
    """Handle events from games"""
    print("Received events")
    event_data = request.json
    game_id = event_data.get('gameId')
    
    if game_id not in game_events:
        game_events[game_id] = []
    
    # check if event is video_recording_started
    for event in event_data.get('events', []):
        if event['type'] == 'video_recording_started':
            print("Video recording started")
    
    game_events[game_id].extend(event_data.get('events', []))
    return jsonify({"status": "success"})


@app.route('/submit-ratings', methods=['POST'])
def submit_ratings():
    """Handle game ratings submission"""
    global ratings_counter
    ratings = request.json
    
    # Print ratings to console for debugging
    print("Received ratings:", ratings)
    
    # Add events data to ratings
    for key in ['game_a', 'game_b']:
        game_id = ratings.get(key, {}).get('url', '').split('/')[0]
        if game_id in game_events:
            ratings[key]['events'] = game_events[game_id]
            # Clear events after storing them
            del game_events[game_id]
    
    # Create a timestamp for this pair of ratings
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Prepare entry for this pair
    rating_entry = {
        "timestamp": timestamp,
        "ratings": ratings
    }
    
    # Load existing ratings or create new file
    all_ratings = []
    if RATINGS_FILE.exists():
        try:
            with open(RATINGS_FILE, 'r') as f:
                all_ratings = json.load(f)
        except json.JSONDecodeError:
            # If file is corrupted, start fresh
            all_ratings = []
    
    # Add new ratings
    all_ratings.append(rating_entry)
    
    # Save all ratings back to file
    with open(RATINGS_FILE, 'w') as f:
        json.dump(all_ratings, f, indent=4)
    
    # Save to HuggingFace dataset
    try:
        # Create preference entry for HF dataset
        game_a = ratings['game_a']
        game_b = ratings['game_b']
        winner = ratings['comparison']['better_game']
        
        # Format rating data for HF
        # TODO: more general game_a_ratings dict field
        preference = {
            "id": str(uuid.uuid4()),
            "game_a_id": game_a['url'].split('/')[0],
            "game_b_id": game_b['url'].split('/')[0],
            "winner": winner,
            "judge": request.remote_addr,  # Use IP as anonymous identifier
            "timestamp": timestamp,
            "game_a_rating": {
                "fun": game_a['fun'],
                "difficulty": game_a['difficulty'],
                "controls": game_a['controls']
            },
            "game_b_rating": {
                "fun": game_b['fun'],
                "difficulty": game_b['difficulty'],
                "controls": game_b['controls']
            },
            "actions_a": json.dumps(game_a.get('events', [])),
            "actions_b": json.dumps(game_b.get('events', []))
        }
        
        # Add to scheduler
        preferences_scheduler.append(preference)
        print(f"Added preference to HF dataset queue: {preference['id']}")
        
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
    """Handle video upload from the browser and save it to disk."""
    video = request.files['video']
    filename = video.filename
    game_id = request.form.get('game_id', 'unknown')
    # Save the video in the results directory, in a subfolder by game_id
    save_dir = RESULTS_DIR / game_id
    save_dir.mkdir(parents=True, exist_ok=True)
    save_path = save_dir / filename
    video.save(save_path)
    print(f"Saved video for game {game_id} at {save_path}")
    return jsonify({"status": "success", "filename": str(save_path)})

if __name__ == '__main__':
    app.run(debug=True)
