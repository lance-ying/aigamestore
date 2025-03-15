#!/bin/bash

# Script to generate 1000 games using the o3-mini model
# Usage: ./generate_1000_games.sh

# Set the total number of games to generate
TOTAL_GAMES=1000

# Initialize counter
COUNTER=1

echo "Starting to generate $TOTAL_GAMES games using o3-mini model..."

# Loop until we've generated all games
while [ $COUNTER -le $TOTAL_GAMES ]
do
    echo "Generating game $COUNTER of $TOTAL_GAMES..."
    
    # Run the Python script with the o3-mini model
    python generate_game_simple_prompt.py --model o3-mini
    
    # Check if the command was successful
    if [ $? -eq 0 ]; then
        echo "Game $COUNTER successfully generated."
        # Increment counter only if the generation was successful
        COUNTER=$((COUNTER+1))
    else
        echo "Error generating game $COUNTER. Retrying..."
        # Sleep for a moment before retrying to avoid API rate limits
        sleep 5
    fi
    
    # Add a small delay between requests to avoid overwhelming the API
    sleep 2
done

echo "All $TOTAL_GAMES games have been generated successfully!" 