#!/bin/bash

# Pipeline script to generate game ideas and then create games for each idea
# Usage: ./run_pipeline.sh <save_path> [num_games]

set -e  # Exit on any error

if [ $# -lt 1 ]; then
    echo "Usage: $0 <save_path> [num_games]"
    echo "  save_path: Directory where ideas and games will be saved"
    echo "  num_games: Number of game ideas to generate (default: 10)"
    exit 1
fi

SAVE_PATH="$1"
NUM_GAMES="${2:-10}"

echo "Starting game generation pipeline..."
echo "Save path: $SAVE_PATH"
echo "Number of games: $NUM_GAMES"

# Create save directory
mkdir -p "$SAVE_PATH"

# Step 1: Generate game ideas
echo ""
echo "Step 1: Generating $NUM_GAMES game ideas..."
IDEAS_FILE="$SAVE_PATH/ideas.json"

uv run gen_game_ideas.py --count "$NUM_GAMES" --output "$IDEAS_FILE"

if [ ! -f "$IDEAS_FILE" ]; then
    echo "Error: Failed to generate game ideas"
    exit 1
fi

echo "Game ideas saved to: $IDEAS_FILE"

# Step 2: Generate games for each idea
echo ""
echo "Step 2: Generating games for each idea..."

GAMES_DIR="$SAVE_PATH/games"
IDEAS_DIR="$SAVE_PATH/ideas"
VERIFICATION_DIR="$SAVE_PATH/verification"
mkdir -p "$GAMES_DIR" "$VERIFICATION_DIR"

# Process each individual idea file
for idea_file in "$IDEAS_DIR"/game_*.json; do
    if [ -f "$idea_file" ]; then
        # Extract game ID from filename
        game_id=$(basename "$idea_file" .json)
        game_dir="$GAMES_DIR/$game_id"
        verify_dir="$VERIFICATION_DIR/$game_id"
        
        echo "Generating game: $game_id"
        echo "  Using idea from: $idea_file"
        echo "  Command: uv run gen_game.py '$idea_file' --save-dir '$game_dir'"
        
        # Call gen_game.py for this idea
        if uv run gen_game.py "$idea_file" --save-dir "$game_dir"; then
            echo "  Game generated successfully"
            
            # Step 3: Verify the generated game
            echo "  Verifying game: $game_id"
            if uv run verify_game.py "$game_dir" --save-dir "$verify_dir"; then
                echo "  ✓ Game verification completed"
            else
                echo "  ✗ Game verification failed"
            fi
        else
            echo "  Failed to generate game"
        fi
        
        echo ""
    fi
done

echo "Pipeline completed!"
echo "Game ideas saved to: $IDEAS_FILE"
echo "Games saved to: $GAMES_DIR"
echo "Verification results saved to: $VERIFICATION_DIR"