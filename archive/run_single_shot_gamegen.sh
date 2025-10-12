#!/bin/bash
N=10

for i in $(seq 1 $((N - 1))); do
    echo "Generating game $i"
    python game_generators/generate_game_main.py --concept_path ./game_prompts/generative_games/concept_and_games/"game_$(printf "%04d" $i).json" --method simple_prompt_xml --verbose --generate_with_ai --no_ecs &
    sleep 5
done