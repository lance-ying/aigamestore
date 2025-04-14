#!/bin/bash

# Define arrays
VALID_GENRES=(
    "action"
    "arcade"
    "platformer"
    "sports"
    "stealth"
    "strategy"
    "puzzle"
    "shooting"
    "racing"
    "adventure"
)

VALID_METHODS=(
    "simple_prompt"
    "complexity_guide"
    "conversation"
    "judge"
    "template"
    "character_driven"
)

MODELS=(
    "openai:gpt-4o"
    "openai:o3-mini"
    "anthropic:claude-3.5-haiku"
    "anthropic:claude-3.7-sonnet"
    "google:gemini-2.0-flash"
)

NUM_PLAYERS=(
    1
    # 2
    # 3
    # 4
    # 5
)

NUM_GAMES_PER_GENRE=3

# Loop through all combinations
for method in "${VALID_METHODS[@]}"; do
    for model in "${MODELS[@]}"; do
        for genre in "${VALID_GENRES[@]}"; do
            for ((i=1; i<=$NUM_GAMES_PER_GENRE; i++)); do
                for num_players in "${NUM_PLAYERS[@]}"; do
                    echo "Generating $genre game ($i of $NUM_GAMES_PER_GENRE) with $num_players player(s) using $method method..."
                    python generate_games.py --method "$method" --genre "$genre" --players "$num_players" --model "$model"
                done
            done
        done
    done
done