import os
import streamlit as st
import random
from pathlib import Path
import json
import datetime
from datasets import load_dataset
import uuid

# Hugging Face configuration
HF_TOKEN = os.environ.get("HF_TOKEN")
GAMES_DATASET = "generative-games/gen-games-v2"

# Must be the first Streamlit command
st.set_page_config(layout="wide")

def load_games_dataset():
    """Load the games dataset from Hugging Face"""
    try:
        dataset = load_dataset(GAMES_DATASET, split="train", token=HF_TOKEN)
        print(f"Loaded dataset with {len(dataset)} games")
        return dataset
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return None

# Load dataset at startup
GAMES_DATASET = load_games_dataset()

def get_random_games(num_games=2):
    """Get random games from the dataset"""
    if GAMES_DATASET is None:
        return []
    
    # Get all games
    all_games = list(GAMES_DATASET)
    
    if len(all_games) < num_games:
        return all_games
    
    return random.sample(all_games, num_games)

def main():
    # Show instructions on first visit
    if "instructions_shown" not in st.session_state:
        st.title("Game Evaluation")
        st.write("Play and rate these two randomly selected games.")
        st.write("For each game, you'll rate:")
        st.write("- **Fun Factor** - How enjoyable was the game?")
        st.write("- **Difficulty** - How challenging was the game?")
        st.write("- **Controls** - How intuitive were the controls?")
        st.write("Finally, you'll be asked to choose which game you think is **better overall**.")
        st.write("Click 'Submit Ratings' when you're done to save your ratings and load new games.")
        
        if st.button("Start Playing"):
            st.session_state.instructions_shown = True
            st.rerun()
        return
    
    # Get random games
    games = get_random_games(2)
    if not games:
        st.error("No games available")
        return
    
    # Create two columns for games
    col1, col2 = st.columns(2)
    
    # Game A
    with col1:
        st.markdown("### Game A")
        st.components.v1.html(games[0]["html"], height=380, scrolling=False)
        
        st.markdown("#### Ratings")
        fun_a = st.slider("Fun: How enjoyable was the game to play?", 1, 10, 5, key="fun_a")
        difficulty_a = st.slider("Difficulty: How challenging was the game to play?", 1, 10, 5, key="difficulty_a")
        controls_a = st.slider("Controls: How intuitive and responsive were the controls?", 1, 10, 5, key="controls_a")
    
    # Game B
    with col2:
        st.markdown("### Game B")
        st.components.v1.html(games[1]["html"], height=380, scrolling=False)
        
        st.markdown("#### Ratings")
        fun_b = st.slider("Fun: How enjoyable was the game to play?", 1, 10, 5, key="fun_b")
        difficulty_b = st.slider("Difficulty: How challenging was the game to play?", 1, 10, 5, key="difficulty_b")
        controls_b = st.slider("Controls: How intuitive and responsive were the controls?", 1, 10, 5, key="controls_b")
    
    # Overall comparison
    st.markdown("### Which game is better overall?")
    better_game = st.radio("", ["Game A", "Game B"], horizontal=True)
    
    # Submit button
    if st.button("Submit Ratings"):
        # Prepare ratings data
        ratings = {
            "game_1": {
                "url": f"{games[0]['id']}/index.html",
                "fun": fun_a,
                "difficulty": difficulty_a,
                "controls": controls_a
            },
            "game_2": {
                "url": f"{games[1]['id']}/index.html",
                "fun": fun_b,
                "difficulty": difficulty_b,
                "controls": controls_b
            },
            "comparison": {
                "better_game": "game_1" if better_game == "Game A" else "game_2"
            }
        }
        
        # Save ratings (you can implement your own saving logic here)
        print("Received ratings:", ratings)
        
        # Clear session state to show new games
        del st.session_state.instructions_shown
        st.rerun()

if __name__ == "__main__":
    main()
