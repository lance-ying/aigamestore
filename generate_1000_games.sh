#!/bin/bash

# Script to generate games in parallel batches, with one game from each genre per batch
# Usage: ./generate_1000_games.sh

# Define the genres
GENRES=("action" "arcade" "platformer" "sports" "stealth" "strategy" "puzzle" "shooting" "racing" "adventure")

# Set the number of games to generate per genre
GAMES_PER_GENRE=100

echo "Starting to generate $GAMES_PER_GENRE games for each of the ${#GENRES[@]} genres using o3-mini model..."
echo "Running in parallel batches (one game per genre in each batch)"

# Function to generate a single game for a specific genre
generate_single_game() {
    local genre=$1
    local game_number=$2
    
    echo "Generating $genre game $game_number of $GAMES_PER_GENRE..."
    
    # Run the Python script with the o3-mini model and specified genre
    python generate_game_simple_prompt.py --model o3-mini --genre "$genre"
    
    # Check if the command was successful
    if [ $? -eq 0 ]; then
        echo "$genre game $game_number successfully generated."
        return 0
    else
        echo "Error generating $genre game $game_number."
        return 1
    fi
}

# Loop through each batch (1 to GAMES_PER_GENRE)
for ((batch=1; batch<=GAMES_PER_GENRE; batch++)); do
    echo "Starting batch $batch of $GAMES_PER_GENRE..."
    
    # Run one game for each genre in parallel
    for ((i=0; i<${#GENRES[@]}-1; i++)); do
        generate_single_game "${GENRES[$i]}" $batch &
    done
    
    # Run the last genre in the foreground
    generate_single_game "${GENRES[${#GENRES[@]}-1]}" $batch
    
    # Wait for all background processes in this batch to complete
    wait
    
    echo "Completed batch $batch of $GAMES_PER_GENRE"
    
    # Add a small delay between batches to avoid overwhelming the API
    sleep 2
done

echo "All games have been generated successfully! Total: $((${#GENRES[@]} * $GAMES_PER_GENRE)) games" 