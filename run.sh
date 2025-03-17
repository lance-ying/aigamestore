#!/bin/bash

# Set common variables
MODEL="o3-mini"
WORK_DIR="outputs"
DEVICE="cuda:0"
GENRE="arcade"
NUM_ITERATIONS=10
NUM_EPOCHS=50
BATCH_SIZE=8
NUM_GAMES=3

# 1. Generate initial game
echo "Generating initial game..."
python main.py \
    --mode generate \
    --model $MODEL \
    --genre $GENRE \
    --work_dir $WORK_DIR \
    --device $DEVICE \
    --num_games $NUM_GAMES

python main.py --mode generate --model o3-mini --genre platformer,action,sports --work_dir trial --num_games 3

# 2. Improve the game
echo "Improving the game..."
python main.py \
    --mode improve \
    --model $MODEL \
    --num_iterations $NUM_ITERATIONS \
    --work_dir $WORK_DIR \
    --device $DEVICE

python main.py --mode improve --model o3-mini --work_dir trial --num_iterations 10 


# 3. Train reward model
echo "Training reward model..."
python main.py \
    --mode train_reward \
    --model $MODEL \
    --work_dir $WORK_DIR \
    --device $DEVICE \
    --batch_size $BATCH_SIZE \
    --num_epochs $NUM_EPOCHS

python main.py --mode train_reward --work_dir trial --batch_size 8 --num_epochs 50


# 4. Finetune the model
echo "Fine-tuning the model..."
python main.py \
    --mode finetune \
    --model $MODEL \
    --work_dir $WORK_DIR \
    --device $DEVICE \
    --batch_size $BATCH_SIZE \
    --num_epochs $NUM_EPOCHS

# Alternatively, run the full pipeline
echo "Or run the full pipeline with:"
echo "python main.py \\"
echo "    --mode full \\"
echo "    --model $MODEL \\"
echo "    --genre $GENRE \\"
echo "    --num_iterations $NUM_ITERATIONS \\"
echo "    --train_reward \\"
echo "    --finetune \\"
echo "    --num_epochs $NUM_EPOCHS \\"
echo "    --work_dir $WORK_DIR \\"
echo "    --device $DEVICE"