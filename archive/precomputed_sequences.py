import os
import numpy as np

num_methods = 6
num_participants = 100 # number of participants
sequence_length = 15 # number of games per participant
min_ratings_per_game = 5 # minimum number of ratings
min_methods_per_game_idx = 1  # each sequence must have one game ID for which there are min_methods_per_game_idx methods for that game index
max_methods_per_game_idx = 1 # At max, someone can have all 6 method outputs for a game in their sequence
calibration_repeats = 1  # Number of games from the same method to include for calibration

game_methods = [f"method_{i}" for i in range(num_methods)]

game_paths = {}

for gm in game_methods:
    game_paths[gm] = []
    for game_idx in range(50):
        game_paths[gm].append(f"{gm}/game_{str(game_idx).zfill(4)}")

# Create a list of all game indices
all_game_indices = list(range(50))

# Precompute game sequences for each participant
precomputed_game_sequences = []

# Track ratings for each game
game_ratings_count = {game: 0 for method_games in game_paths.values() for game in method_games}

for participant_id in range(num_participants):
    # First, select one game index that will have multiple methods
    multi_method_game_idx = np.random.choice(all_game_indices)
    
    # Select min_methods_per_game_idx different methods for this game index
    # Use a power law distribution that heavily favors min_methods_per_game_idx and min_methods_per_game_idx+1
    # Generate a random number from a power law distribution between 0 and 1
    power_law_exponent = 3  # Higher value makes lower numbers more likely
    random_val = 1 - np.random.power(power_law_exponent)
    # Scale to our range and round to integer
    num_methods_for_same_game_id = min_methods_per_game_idx + int(random_val * (max_methods_per_game_idx - min_methods_per_game_idx + 1))
    # Ensure we're within bounds
    num_methods_for_same_game_id = max(min_methods_per_game_idx, min(max_methods_per_game_idx, num_methods_for_same_game_id))
    selected_methods = np.random.choice(game_methods, min_methods_per_game_idx, replace=False)
    
    # Add these games to the sequence
    sequence = [f"{method}/game_{str(multi_method_game_idx).zfill(4)}" for method in selected_methods]
    
    # Ensure we have at least one game from each method
    # First, identify which methods are not yet in the sequence
    methods_in_sequence = set(game.split('/')[0] for game in sequence)
    missing_methods = [method for method in game_methods if method not in methods_in_sequence]
    
    # Add one game from each missing method
    for method in missing_methods:
        # Select a random game index for this method
        available_indices = [idx for idx in all_game_indices if idx != multi_method_game_idx]
        game_idx = np.random.choice(available_indices)
        sequence.append(f"{method}/game_{str(game_idx).zfill(4)}")
    
    # Select one game concept from a random method for calibration (repeated game)
    calibration_method = np.random.choice(game_methods)
    
    # Select different game indices for this method (for calibration)
    # We can use the multi_method_game_idx as one of the calibration games if the calibration method
    # is one of the selected methods
    available_indices = [idx for idx in all_game_indices if idx != multi_method_game_idx]
    calibration_indices = np.random.choice(available_indices, calibration_repeats, replace=False)
    
    # Add calibration games to the sequence
    for idx in calibration_indices:
        sequence.append(f"{calibration_method}/game_{str(idx).zfill(4)}")
    
    # Fill the rest of the sequence with random games, ensuring no more repeats of methods
    remaining_slots = sequence_length - len(sequence)
    
    if remaining_slots > 0:
        # Create a pool of all possible games
        all_games = [game for method_games in game_paths.values() for game in method_games]
        
        # Remove already selected games from the pool
        remaining_games = [game for game in all_games if game not in sequence]
        
        # Also remove games that would create additional method repeats beyond what's necessary
        used_methods = {}
        for game in sequence:
            method = game.split('/')[0]
            if method in used_methods:
                used_methods[method] += 1
            else:
                used_methods[method] = 1
        
        # Filter out games from methods that already have calibration_repeats+1 entries
        # (+1 accounts for the multi-method game that might use the same method)
        filtered_remaining_games = []
        for game in remaining_games:
            method = game.split('/')[0]
            if method not in used_methods or used_methods[method] < calibration_repeats + 1:
                filtered_remaining_games.append(game)
        
        # Randomly select remaining games
        additional_games = list(np.random.choice(filtered_remaining_games, remaining_slots, replace=False))
        
        # Combine all games
        sequence += additional_games
    
    # Shuffle the final sequence
    np.random.shuffle(sequence)
    
    precomputed_game_sequences.append(sequence)
    
    # Update ratings count
    for game in sequence:
        game_ratings_count[game] += 1

# Check if any game has fewer than min_ratings_per_game ratings
games_needing_more_ratings = [game for game, count in game_ratings_count.items() if count < min_ratings_per_game]

# If any game has fewer than min_ratings_per_game, adjust sequences
while games_needing_more_ratings:
    # Process one game at a time
    game = games_needing_more_ratings[0]
    ratings_needed = min_ratings_per_game - game_ratings_count[game]
    
    for i in range(ratings_needed):
        # Find a random participant
        participant_idx = np.random.randint(0, num_participants)
        
        # Find a game in their sequence that has more than min_ratings_per_game
        replaceable_games = [g for g in precomputed_game_sequences[participant_idx] 
                           if g in game_ratings_count and game_ratings_count[g] > min_ratings_per_game]
        
        if replaceable_games:
            # Choose a random game to replace
            game_to_replace = np.random.choice(replaceable_games)
            replace_idx = precomputed_game_sequences[participant_idx].index(game_to_replace)
            
            # Replace it with the game needing more ratings
            precomputed_game_sequences[participant_idx][replace_idx] = game
            
            # Update counts
            game_ratings_count[game] += 1
            game_ratings_count[game_to_replace] -= 1
    
    # Update the list of games needing more ratings
    games_needing_more_ratings = [game for game, count in game_ratings_count.items() if count < min_ratings_per_game]

# Verify all games have at least min_ratings_per_game ratings
assert all(count >= min_ratings_per_game for count in game_ratings_count.values()), "Some games still have fewer than minimum ratings"
