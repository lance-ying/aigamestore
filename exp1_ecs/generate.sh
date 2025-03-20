#!/bin/bash

# Models to use
MODEL="o3-mini"

# Number of games per genre and architecture type
GAMES_PER_TYPE=5

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

# Function to generate games
generate_games() {
    local genre=$1
    local use_ecs=$2
    local count=$3
    
    echo "Generating ${count} games for genre: ${genre} (ECS: ${use_ecs})"
    
    for ((i=1; i<=$count; i++)); do
        echo "Generating game ${i}/${count}..."
        
        if [ "$use_ecs" = true ]; then
            python code_generator.py \
                --model ${MODEL} \
                --genre ${genre} \
                --num-players 2 \
                --use-ecs
        else
            python code_generator.py \
                --model ${MODEL} \
                --genre ${genre} \
                --num-players 2
        fi
        
        # Add a small delay between generations to avoid rate limiting
        sleep 10
    done
}

# Main execution
echo "Starting game generation process..."
echo "Will generate ${GAMES_PER_TYPE} games per genre for both ECS and non-ECS architectures"

for genre in "${GENRES[@]}"; do
    echo "Processing genre: ${genre}"
    
    # Generate ECS games
    generate_games "${genre}" true ${GAMES_PER_TYPE}
    
    # Generate non-ECS games
    generate_games "${genre}" false ${GAMES_PER_TYPE}
    
    # Add a longer delay between genres
    echo "Completed genre: ${genre}"
    sleep 5
done

echo "Game generation complete!"
echo "Games have been saved in the games directory"