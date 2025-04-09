#!/bin/bash

# Define arrays
VALID_GENRES=(
    # "action"
    "arcade"
    # "platformer"
    # "sports"
    # "stealth"
    # "strategy"
    # "puzzle"
    "shooting"
    # "racing"
    # "adventure"
)

VALID_METHODS=(
    # "simple_prompt"
    # "guide_complexity"
    "conversation"
    # "judge_conversation"
    # "character_driven"
)

NUM_PLAYERS=(
    1
    # 2
    # 3
    # 4
    # 5
)

NUM_GAMES_PER_GENRE=5

# Loop through all combinations
for method in "${VALID_METHODS[@]}"; do
    for genre in "${VALID_GENRES[@]}"; do
        for ((i=1; i<=$NUM_GAMES_PER_GENRE; i++)); do
            for num_players in "${NUM_PLAYERS[@]}"; do
                echo "Generating $genre game ($i of $NUM_GAMES_PER_GENRE) with $num_players player(s) using $method method..."
                python main.py --method "$method" --genre "$genre" --num_players "$num_players"
            done
        done
    done
done