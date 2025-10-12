from pathlib import Path
import random
from flask import Flask, render_template_string, request, jsonify
import os
import glob
import json
import datetime
from datasets import load_dataset
import uuid

# Hugging Face configuration
HF_TOKEN = os.environ.get("HF_TOKEN")
GAMES_DATASET = "generative-games/gen-games-v2"

# folder structure in game dir: {method} / {model} / {genre} / {name} / index.html
GAME_DIR = Path(__file__).parent / "games"
RESULTS_DIR = Path(__file__).parent / "results"
RATINGS_FILE = RESULTS_DIR / "all_ratings.json"

# Create results directory if it doesn't exist
RESULTS_DIR.mkdir(exist_ok=True)

app = Flask(__name__)

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
    if GAMES_DATASET is None:
        return []
    
    # Get all games
    all_games = list(GAMES_DATASET)
    
    if len(all_games) < num_games:
        return all_games
    
    return random.sample(all_games, num_games)

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
            min-height: 100%;
            background-color: #f8f8f8;
        }
        .game-container {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 10px;
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
            width: 600px;
            height: 380px;
            border: none;
            background: #222;
            overflow: hidden; /* Prevent scrolling within iframe */
            margin: 0 auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .rating-sliders {
            margin-top: 8px;
            background: white;
            padding: 8px;
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
            margin-top: 0;
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
        input[type="range"] {
            height: 6px;
            -webkit-appearance: none;
            width: 100%;
            background: #e0e0e0;
            border-radius: 3px;
            outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: #3498db;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: #3498db;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        /* Modal styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        .modal-content {
            background-color: #fff;
            margin: 15% auto;
            padding: 20px;
            border: none;
            border-radius: 5px;
            width: 60%;
            max-width: 500px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .close {
            color: #bbb;
            float: right;
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
            padding: 8px 16px;
            cursor: pointer;
            transition: background-color 0.2s;
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
            margin: 10px auto;
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
            <h2>Game Evaluation</h2>
            <p>Play and rate these two randomly selected games.</p>
            <p>For each game, you'll rate:</p>
            <ul>
                <li><strong>Fun Factor</strong> - How enjoyable was the game?</li>
                <li><strong>Difficulty</strong> - How challenging was the game?</li>
                <li><strong>Controls</strong> - How intuitive were the controls?</li>
            </ul>
            <p>Finally, you'll be asked to choose which game you think is <strong>better overall</strong>.</p>
            <p>Click "Submit Ratings" when you're done to save your ratings and load new games.</p>
            <button id="startButton" style="margin-top: 10px;">Start Playing</button>
        </div>
    </div>
        
        <div class="game-container">
        {% for game in games %}
        <div class="game-box">
            <div class="game-label">Game {% if loop.index == 1 %}A{% else %}B{% endif %}</div>
            <iframe class="game-frame" src="/game/{{ game.path }}"></iframe>
            
            <div class="rating-sliders">
                <div class="rating-item">
                    <label>Fun: How enjoyable was the game to play?</label>
                    <div class="slider-container">
                        <input type="range" min="1" max="10" value="5" class="slider" id="fun-{{ loop.index }}">
                        <span class="slider-value" id="fun-value-{{ loop.index }}">5</span>
                    </div>
                    <div class="scale-labels">
                        <span>Not fun</span>
                        <span>Very fun</span>
                    </div>
                </div>
                
                <div class="rating-item">
                    <label>Difficulty: How challenging was the game to play?</label>
                    <div class="slider-container">
                        <input type="range" min="1" max="10" value="5" class="slider" id="difficulty-{{ loop.index }}">
                        <span class="slider-value" id="difficulty-value-{{ loop.index }}">5</span>
                    </div>
                    <div class="scale-labels">
                        <span>Too easy</span>
                        <span>Very challenging</span>
                    </div>
                </div>
                
                <div class="rating-item">
                    <label>Controls: How intuitive and responsive were the controls?</label>
                    <div class="slider-container">
                        <input type="range" min="1" max="10" value="5" class="slider" id="controls-{{ loop.index }}">
                        <span class="slider-value" id="controls-value-{{ loop.index }}">5</span>
                    </div>
                    <div class="scale-labels">
                        <span>Confusing</span>
                        <span>Intuitive</span>
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

    <script>
        // Modal functionality
        const modal = document.getElementById("instructionsModal");
        const closeBtn = document.getElementsByClassName("close")[0];
        const startBtn = document.getElementById("startButton");
        const showInstructionsBtn = document.getElementById("show-instructions");
        
        // Check if this is the first visit
        if (!localStorage.getItem("gameArenaVisited")) {
            // First visit, show modal
            modal.style.display = "block";
            localStorage.setItem("gameArenaVisited", "true");
        }
        
        // Function to reset all sliders to default value
        function resetAllSliders() {
            document.querySelectorAll('input[type="range"]').forEach(slider => {
                slider.value = 5;
                const valueId = slider.id.replace(slider.id.split('-')[0], slider.id.split('-')[0] + '-value');
                document.getElementById(valueId).textContent = '5';
                document.getElementById(valueId).style.color = '#3498db'; // Reset to blue (average)
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
            modal.style.display = "block";
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
        document.querySelectorAll('.slider').forEach(slider => {
            slider.addEventListener('input', function() {
                const valueId = this.id.replace(this.id.split('-')[0], this.id.split('-')[0] + '-value');
                const value = this.value;
                document.getElementById(valueId).textContent = value;
                
                // Update qualitative description based on value
                const valueSpan = document.getElementById(valueId);
                if (value >= 9) {
                    valueSpan.style.color = '#27ae60'; // Green for excellent
                } else if (value >= 7) {
                    valueSpan.style.color = '#2ecc71'; // Light green for good
                } else if (value >= 5) {
                    valueSpan.style.color = '#3498db'; // Blue for average
                } else if (value >= 3) {
                    valueSpan.style.color = '#e67e22'; // Orange for below average
                } else {
                    valueSpan.style.color = '#e74c3c'; // Red for poor
                }
            });
            
            // Trigger once to set initial colors
            slider.dispatchEvent(new Event('input'));
        });
        
        // Make sure the comparison radio buttons are unchecked when the page loads
        window.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('input[name="better-game"]').forEach(radio => {
                radio.checked = false;
            });
        });
        
        // Submit ratings
        document.getElementById('submit-ratings').addEventListener('click', function() {
            // Check if a game has been selected for comparison
            const selectedGame = document.querySelector('input[name="better-game"]:checked');
            if (!selectedGame) {
                alert('Please select which game you think is better overall before submitting');
                return;
            }
            
            const ratings = {};
            
            // Add games with more descriptive keys
            {% for game in games %}
            ratings['game_{{ loop.index }}'] = {
                url: '{{ game.path }}',
                fun: document.getElementById('fun-{{ loop.index }}').value,
                difficulty: document.getElementById('difficulty-{{ loop.index }}').value,
                controls: document.getElementById('controls-{{ loop.index }}').value
            };
            {% endfor %}
            
            // Get which game was selected as better overall
            const betterGameValue = selectedGame.value;
            ratings['comparison'] = {
                better_game: 'game_' + betterGameValue
            };
            
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
                window.location.reload(); // Reload page to get new games
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Error submitting ratings');
            });
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
            "name": game["game_name"],
            "genre": game["genre"],
            "model": game["model"],
            "method": game["method"]
        })
    
    return render_template_string(HTML_TEMPLATE, games=formatted_games)

@app.route('/game/<path:game_path>')
def serve_game(game_path):
    """Serve game HTML files and other assets"""
    # Extract game ID from path
    game_id = game_path.split('/')[0]
    
    # Find game in dataset
    game = None
    for item in GAMES_DATASET:
        if item["id"] == game_id:
            game = item
            break
    
    if game is None:
        return "Game not found", 404
    
    # Handle different file types
    if game_path.endswith('.js'):
        # Return JavaScript file
        js_file = game_path.split('/')[-1]
        if js_file in game["js_files"]:
            return game["js_files"][js_file], 200, {'Content-Type': 'application/javascript'}
        return "JavaScript file not found", 404
    
    elif game_path.endswith('.html'):
        # Return HTML file
        html = game["html"]
        
        # Anti-scrolling JavaScript
        prevent_scroll_js = """
        <script>
        // Prevent scrolling with keyboard
        window.addEventListener("keydown", function(e) {
            // Prevent default for navigation keys (space, arrow keys)
            if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }
        }, false);
        
        // Prevent scrolling with wheel
        document.addEventListener('wheel', function(e) {
            if (e.target.closest('canvas')) {
                e.preventDefault();
            }
        }, { passive: false });
        </script>
        """
        
        # Insert the script before the closing </body> tag
        if "</body>" in html:
            html = html.replace("</body>", prevent_scroll_js + "</body>")
        else:
            # If no body tag, append to the end
            html += prevent_scroll_js
        
        return html, 200, {'Content-Type': 'text/html'}
    
    else:
        # For other file types, return 404
        return "File type not supported", 404

@app.route('/submit-ratings', methods=['POST'])
def submit_ratings():
    """Handle game ratings submission"""
    ratings = request.json
    
    # Print ratings to console for debugging
    print("Received ratings:", ratings)
    
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
    
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True)
