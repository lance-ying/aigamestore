#!/bin/bash
# Evaluate and auto-fix games in new_batch_110325
# Usage: ./evaluate_and_fix_batch.sh [--duration 10] [--max-games 5]

set -e

# Default values
DURATION=10
MAX_GAMES=""
GAMES_DIR="public/new_batch_110325"
OUTPUT_FILE="evaluation_results_$(date +%Y%m%d_%H%M%S).json"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --duration)
            DURATION=$2
            shift 2
            ;;
        --max-games)
            MAX_GAMES="--max-games $2"
            shift 2
            ;;
        --games-dir)
            GAMES_DIR=$2
            shift 2
            ;;
        --output)
            OUTPUT_FILE=$2
            shift 2
            ;;
        *)
            echo "Unknown argument: $1"
            exit 1
            ;;
    esac
done

echo "=========================================="
echo "Game Evaluation & Auto-Fix Tool"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  Games directory: $GAMES_DIR"
echo "  Duration per test: ${DURATION}s"
echo "  Max games: ${MAX_GAMES:-unlimited}"
echo "  Output file: $OUTPUT_FILE"
echo "  Auto-fix: ENABLED"
echo ""
echo "Starting evaluation and auto-fix..."
echo ""

# Run the evaluation with auto-fix
python scripts/batch/evaluate.py \
    --games-dir "$GAMES_DIR" \
    --duration "$DURATION" \
    --auto-fix \
    --output "$OUTPUT_FILE" \
    $MAX_GAMES

echo ""
echo "=========================================="
echo "Evaluation complete!"
echo "Results saved to: $OUTPUT_FILE"
echo "==========================================="







