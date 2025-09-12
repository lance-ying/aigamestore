import shutil
import tempfile
import json
import argparse
from pathlib import Path

from coding_agent import CodingAgent


prompt_template = """Implement a complete game based on the following prompt:
<prompt>
{prompt}
</prompt>

Make sure the game is winnable in a few minutes.

Preferred framework for 2D games: p5.js
- Canvas size 600x400
- All UI elements drawn on the canvas, no elements outside the canvas (just white background)
- Clear instructions on how to play the game
- Clear win/lose condition and win/lose screens
- Score system
- Option to restart the game
- Set random seed for reproducibility

Game graphics:
- Polished graphics
- Use noStroke() before drawing text
- Don't draw elements randomly sampled a each frame (it creates flickering)
- No icons

Implement the game in a single index.html file.
"""

model = "claude-sonnet-4-20250514"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a single game from a game idea")
    parser.add_argument("game_idea", help="JSON string or file path containing game idea")
    parser.add_argument("--save-dir", required=True, help="Directory to save the generated game")
    parser.add_argument("--model", default=model, help="Model to use")
    
    args = parser.parse_args()
    
    # Parse game idea (JSON string or file path)
    try:
        game_idea = json.loads(args.game_idea)
    except json.JSONDecodeError:
        # Try as file path
        with open(args.game_idea, 'r') as f:
            game_idea = json.load(f)
    
    # Format the prompt with game idea details
    prompt = prompt_template.format(
        prompt=f"Genre: {game_idea['genre']}, Subgenre: {game_idea['subgenre']}, Theme: {game_idea['theme']}"
    )
    
    save_dir = Path(args.save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    if not (save_dir / "code" / "index.html").exists():
        # save prompt
        with open(save_dir / "prompt.txt", "w") as f:
            f.write(prompt)

        # save sample
        with open(save_dir / "game_prompt.json", "w") as f:
            json.dump(game_idea, f, indent=4)

        # Create temp directory
        temp_dir = tempfile.mkdtemp(prefix="game_gen_")
        temp_path = Path(temp_dir)
        print(f"Using temp directory: {temp_path}")

        # Use CodingAgent with temp directory as cwd
        agent = CodingAgent(model=args.model, verbose=True, cwd=temp_dir)
        result = agent.chat(prompt)
        
        # Copy generated files back
        shutil.copytree(temp_dir, save_dir / "code", dirs_exist_ok=True)

    print(f"Game generated and saved to {save_dir}")
