#!/bin/bash

# Models to use
MODEL="o3-mini"

# Number of games per genre
GAMES_PER_GENRE=3

# Number of players
NUM_PLAYERS=1

# Valid genres
GENRES=(
    "action"
    "arcade"
    "platformer"
    "puzzle"
    "shooting"
    # "sports"
    # "stealth"
    # "strategy"
    # "racing"
    # "adventure"
)

# Function to generate game variants
generate_game_variants() {
    local genre=$1
    local count=$2
    
    echo "Generating ${count} games for genre: ${genre} (both ECS and non-ECS versions)"
    
    for ((i=1; i<=$count; i++)); do
        echo "Generating game ${i}/${count}..."
        
        python code_generator_two_prompt.py \
            --model ${MODEL} \
            --genre ${genre} \
            --num-players ${NUM_PLAYERS}
        
        # Add a small delay between generations to avoid rate limiting
        sleep 10
    done
}

# Main execution
echo "Starting game generation process..."
echo "Will generate ${GAMES_PER_GENRE} games per genre (each with both ECS and non-ECS versions)"

for genre in "${GENRES[@]}"; do
    echo "Processing genre: ${genre}"
    
    # Generate both ECS and non-ECS versions in one go
    generate_game_variants "${genre}" ${GAMES_PER_GENRE}
    
    # Add a longer delay between genres
    echo "Completed genre: ${genre}"
    sleep 5
done

echo "Game generation complete!"
echo "Games have been saved in the games directory"