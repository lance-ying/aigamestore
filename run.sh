#! /bin/bash
NUM_GAMES=5
NUM_NARRATIVES=10

for i in $(seq -f "%04g" 0 $(($NUM_NARRATIVES - 1)))
do
    narrative_path="generative_games/new_games/gemini_gemini-2.0-flash/game_${i}.json"
    for j in $(seq 1 $NUM_GAMES)
    do
        python main.py --method simple_prompt --debug --narrative "$narrative_path"
    done
done
