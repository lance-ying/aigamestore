import os
import json
from pathlib import Path
import argparse

def find_games(root_dir):
    """
    Recursively find all games in the given directory structure.
    
    Args:
        root_dir (str): The root directory to search in
        
    Returns:
        list: A list of dictionaries containing game information
    """
    games = []
    
    # Walk through the directory structure
    for model_name in os.listdir(root_dir):
        model_path = os.path.join(root_dir, model_name)
        
        # Skip non-directories and hidden directories
        if not os.path.isdir(model_path) or model_name.startswith('.'):
            continue
            
        for genre in os.listdir(model_path):
            genre_path = os.path.join(model_path, genre)
            
            # Skip non-directories and hidden directories
            if not os.path.isdir(genre_path) or genre.startswith('.'):
                continue
                
            for game_dir in os.listdir(genre_path):
                game_path = os.path.join(genre_path, game_dir)
                
                # Skip non-directories and hidden directories
                if not os.path.isdir(game_path) or game_dir.startswith('.'):
                    continue
                    
                # Check if metadata.json exists
                metadata_path = os.path.join(game_path, 'metadata.json')
                if os.path.exists(metadata_path):
                    try:
                        with open(metadata_path, 'r') as f:
                            metadata = json.load(f)
                            
                        # Check if index.html exists
                        index_path = os.path.join(game_path, 'index.html')
                        if os.path.exists(index_path):
                            # Create relative path from root to game
                            rel_path = os.path.relpath(game_path, root_dir)
                            game_url = os.path.join(model_path, genre, game_dir, 'index.html')
                            
                            # Extract required information
                            game_info = {
                                'model': model_name,
                                'genre': metadata.get('genre', ''),
                                'num_players': metadata.get('num_players', ''),
                                'game_title': metadata.get('game_title', '').strip('"'),
                                'url': game_url.replace('\\', '/'),  # Ensure forward slashes for URLs
                                'game_index': metadata.get('game_index', '')
                            }
                            
                            games.append(game_info)
                    except Exception as e:
                        print(f"Error processing {metadata_path}: {e}")
    
    # Sort games by model, genre, and game_index
    games.sort(key=lambda x: (x['model'], x['genre'], x['game_index']))
    return games

def generate_html(games, output_file):
    """
    Generate an HTML index page for the games.
    
    Args:
        games (list): A list of dictionaries containing game information
        output_file (str): The path to the output HTML file
    """
    # Extract unique models and genres for filters
    models = sorted(list(set(game['model'] for game in games)))
    genres = sorted(list(set(game['genre'] for game in games)))
    
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Collection Index</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 20px;
        }
        .filter-container {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            padding: 15px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .filter-group {
            display: flex;
            flex-direction: column;
            min-width: 200px;
        }
        .filter-label {
            font-weight: bold;
            margin-bottom: 5px;
            color: #2c3e50;
        }
        select {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: white;
            font-size: 16px;
        }
        button {
            padding: 8px 15px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        button:hover {
            background-color: #2980b9;
        }
        .games-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .game-card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            padding: 15px;
            transition: transform 0.3s ease;
        }
        .game-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .game-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        .game-info {
            margin-bottom: 5px;
            color: #555;
        }
        .game-link {
            display: inline-block;
            margin-top: 10px;
            padding: 8px 15px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.3s ease;
        }
        .game-link:hover {
            background-color: #2980b9;
        }
        .random-button {
            background-color: #27ae60;
        }
        .random-button:hover {
            background-color: #219653;
        }
        .model-section {
            margin-bottom: 30px;
        }
        .model-title {
            font-size: 24px;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 2px solid #3498db;
            color: #2c3e50;
        }
        .genre-section {
            margin-bottom: 20px;
        }
        .genre-title {
            font-size: 20px;
            margin-bottom: 10px;
            color: #34495e;
        }
        .hidden {
            display: none !important;
        }
        .no-games-message {
            text-align: center;
            font-size: 18px;
            color: #7f8c8d;
            margin: 50px 0;
        }
    </style>
</head>
<body>
    <h1>Game Collection Index</h1>
    
    <div class="filter-container">
        <div class="filter-group">
            <label class="filter-label" for="model-filter">Filter by Model:</label>
            <select id="model-filter">
                <option value="all">All Models</option>
"""

    # Add model options
    for model in models:
        html += f'                <option value="{model}">{model}</option>\n'

    html += """
            </select>
        </div>
        
        <div class="filter-group">
            <label class="filter-label" for="genre-filter">Filter by Genre:</label>
            <select id="genre-filter">
                <option value="all">All Genres</option>
"""

    # Add genre options
    for genre in genres:
        html += f'                <option value="{genre}">{genre.capitalize()}</option>\n'

    html += """
            </select>
        </div>
        
        <div class="filter-group" style="justify-content: flex-end;">
            <button id="reset-filters">Reset Filters</button>
        </div>
        
        <div class="filter-group" style="justify-content: flex-end;">
            <button id="random-game" class="random-button">Play Random Game</button>
        </div>
    </div>
    
    <div id="games-display">
"""

    # Group games by model and genre
    models_dict = {}
    for game in games:
        model = game['model']
        genre = game['genre']
        
        if model not in models_dict:
            models_dict[model] = {}
            
        if genre not in models_dict[model]:
            models_dict[model][genre] = []
            
        models_dict[model][genre].append(game)
    
    # Generate HTML for each model and genre
    for model, genres_dict in models_dict.items():
        html += f"""
        <div class="model-section" data-model="{model}">
            <h2 class="model-title">{model}</h2>
"""
        
        for genre, genre_games in genres_dict.items():
            html += f"""
            <div class="genre-section" data-genre="{genre}">
                <h3 class="genre-title">{genre.capitalize()} Games</h3>
                <div class="games-container">
"""
            
            for game in genre_games:
                html += f"""
                    <div class="game-card" data-model="{game['model']}" data-genre="{game['genre']}">
                        <div class="game-title">{game['game_title']}</div>
                        <div class="game-info"><strong>Genre:</strong> {game['genre'].capitalize()}</div>
                        <div class="game-info"><strong>Players:</strong> {game['num_players']}</div>
                        <div class="game-info"><strong>Model:</strong> {game['model']}</div>
                        <a href="{game['url']}" class="game-link">Play Game</a>
                    </div>
"""
            
            html += """
                </div>
            </div>
"""
        
        html += """
        </div>
"""
    
    html += """
        <div id="no-games-message" class="no-games-message hidden">
            No games match the selected filters.
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const modelFilter = document.getElementById('model-filter');
            const genreFilter = document.getElementById('genre-filter');
            const resetButton = document.getElementById('reset-filters');
            const randomButton = document.getElementById('random-game');
            const noGamesMessage = document.getElementById('no-games-message');
            
            // Function to apply filters
            function applyFilters() {
                const selectedModel = modelFilter.value;
                const selectedGenre = genreFilter.value;
                
                // Get all model sections and game cards
                const modelSections = document.querySelectorAll('.model-section');
                const genreSections = document.querySelectorAll('.genre-section');
                const gameCards = document.querySelectorAll('.game-card');
                
                let visibleGames = 0;
                
                // First hide all model and genre sections
                modelSections.forEach(section => {
                    section.classList.add('hidden');
                });
                
                genreSections.forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Show model sections that match the filter
                if (selectedModel === 'all') {
                    modelSections.forEach(section => {
                        section.classList.remove('hidden');
                    });
                } else {
                    document.querySelectorAll(`.model-section[data-model="${selectedModel}"]`).forEach(section => {
                        section.classList.remove('hidden');
                    });
                }
                
                // Show genre sections that match the filter
                if (selectedGenre === 'all') {
                    genreSections.forEach(section => {
                        section.classList.remove('hidden');
                    });
                } else {
                    document.querySelectorAll(`.genre-section[data-genre="${selectedGenre}"]`).forEach(section => {
                        section.classList.remove('hidden');
                    });
                }
                
                // Show or hide individual game cards based on both filters
                gameCards.forEach(card => {
                    const cardModel = card.getAttribute('data-model');
                    const cardGenre = card.getAttribute('data-genre');
                    
                    const modelMatch = selectedModel === 'all' || cardModel === selectedModel;
                    const genreMatch = selectedGenre === 'all' || cardGenre === selectedGenre;
                    
                    if (modelMatch && genreMatch) {
                        card.classList.remove('hidden');
                        visibleGames++;
                    } else {
                        card.classList.add('hidden');
                    }
                });
                
                // Show or hide the "No games" message
                if (visibleGames === 0) {
                    noGamesMessage.classList.remove('hidden');
                } else {
                    noGamesMessage.classList.add('hidden');
                }
                
                // Hide empty genre sections
                genreSections.forEach(section => {
                    if (!section.classList.contains('hidden')) {
                        const visibleCards = section.querySelectorAll('.game-card:not(.hidden)');
                        if (visibleCards.length === 0) {
                            section.classList.add('hidden');
                        }
                    }
                });
                
                // Hide empty model sections
                modelSections.forEach(section => {
                    if (!section.classList.contains('hidden')) {
                        const visibleGenreSections = section.querySelectorAll('.genre-section:not(.hidden)');
                        if (visibleGenreSections.length === 0) {
                            section.classList.add('hidden');
                        }
                    }
                });
            }
            
            // Add event listeners
            modelFilter.addEventListener('change', applyFilters);
            genreFilter.addEventListener('change', applyFilters);
            
            // Reset filters
            resetButton.addEventListener('click', function() {
                modelFilter.value = 'all';
                genreFilter.value = 'all';
                applyFilters();
            });
            
            // Play a random game based on current filters
            randomButton.addEventListener('click', function() {
                const visibleCards = document.querySelectorAll('.game-card:not(.hidden)');
                
                if (visibleCards.length > 0) {
                    // Select a random game from the visible ones
                    const randomIndex = Math.floor(Math.random() * visibleCards.length);
                    const randomGame = visibleCards[randomIndex];
                    
                    // Get the game link and navigate to it
                    const gameLink = randomGame.querySelector('.game-link');
                    if (gameLink) {
                        window.location.href = gameLink.href;
                    }
                } else {
                    alert('No games available with the current filters.');
                }
            });
        });
    </script>
</body>
</html>
"""
    
    with open(output_file, 'w') as f:
        f.write(html)
    
    print(f"Index generated successfully: {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Generate a master index for games')
    parser.add_argument('--games_dir', type=str, default='games', 
                        help='Directory containing the games (default: games)')
    parser.add_argument('--output', type=str, default='index.html',
                        help='Output HTML file (default: index.html)')
    
    args = parser.parse_args()
    
    # Find all games
    games = find_games(args.games_dir)
    
    # Generate HTML index
    generate_html(games, args.output)
    
    print(f"Found {len(games)} games")

if __name__ == "__main__":
    main()
