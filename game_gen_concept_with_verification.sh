num_games=5
existing_num_games=$(ls -d games/baseline_concept_game/game_* | wc -l | awk '{print $1}')

echo "Existing number of games: $existing_num_games"

for i in $(seq 0 $((num_games - 1))); do
    echo "Generating game $i"
    python game_generators/generate_game_main.py --method baseline_concept_code --no_ecs --verbose --thinking --thinking_budget 5000 --model anthropic:claude-3.7-sonnet
done

for i in $(seq 0 $((num_games - 1))); do
    echo "Verifying game $i"
    python game_generators/code_verifier_improver.py --game_path games/baseline_concept_game/"game_$(printf "%04d" $i)/sample_0/" --mode basic_test --temperature 0.5
    echo "Game $i verified"
done