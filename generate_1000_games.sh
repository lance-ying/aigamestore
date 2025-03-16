#!/bin/bash

# Script to generate 100 games for each genre using the o3-mini model
# Usage: ./generate_1000_games.sh

# Define the genres
GENRES=("action" "arcade" "platformer" "sports" "stealth" "strategy" "puzzle" "shooting" "racing" "adventure")

# Set the number of games to generate per genre
GAMES_PER_GENRE=100

echo "Starting to generate $GAMES_PER_GENRE games for each of the 10 genres using o3-mini model..."

# Loop through each genre
for GENRE in "${GENRES[@]}"
do
    echo "Starting generation for genre: $GENRE"
    
    # Initialize counter for this genre
    COUNTER=1
    
    # Loop until we've generated all games for this genre
    while [ $COUNTER -le $GAMES_PER_GENRE ]
    do
        echo "Generating $GENRE game $COUNTER of $GAMES_PER_GENRE..."
        
        # Run the Python script with the o3-mini model and specified genre
        python generate_game_simple_prompt.py --model o3-mini --genre "$GENRE"
        
        # Check if the command was successful
        if [ $? -eq 0 ]; then
            echo "$GENRE game $COUNTER successfully generated."
            # Increment counter only if the generation was successful
            COUNTER=$((COUNTER+1))
        else
            echo "Error generating $GENRE game $COUNTER. Retrying..."
            # Sleep for a moment before retrying to avoid API rate limits
            sleep 5
        fi
        
        # Add a small delay between requests to avoid overwhelming the API
        sleep 2
    done
    
    echo "Completed generation of $GAMES_PER_GENRE games for genre: $GENRE"
done

echo "All games have been generated successfully! Total: $((${#GENRES[@]} * $GAMES_PER_GENRE)) games" 