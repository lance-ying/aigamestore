#! /bin/bash
NUM_GAMES=5

for i in {1..$NUM_GAMES}
do
    python main.py --method simple_prompt --debug
done