#! /bin/bash
NUM_GAMES=3
NUM_NARRATIVES=10

METHODS=(
    "simple_prompt" 
    "instruction_simple_prompt"
)

for i in $(seq -f "%04g" 0 $(($NUM_NARRATIVES - 1)))
do
    narrative_path="generative_games/new_games/google_gemini-2.0-flash/game_${i}.json"
    for method in "${METHODS[@]}"
    do
        for j in $(seq 1 $NUM_GAMES)
        do
            python main.py --method "$method" --debug --narrative "$narrative_path"
        done
    done
done
