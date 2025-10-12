import json
import argparse
import subprocess
import tempfile
import shutil
from pathlib import Path

from coding_agent import CodingAgent

prompt_game_api = """Fully examine the code in the current working directory.

1. Modify the game to expose a game API and implement a logging system.
- Expose player actions
- Expose ALL the game entities (read-only)
- Prevent modifying the game state directly
- Implement a separate function to play randomly
- You are not allowed to modify anything else in the game code!
- Make sure the game API exposes all the information needed to play the game

2. Test the game API using the play_game.js script. 
- Check that the script runs without errors and the logs are correctly saved
- Playwright is already installed. Run the script with `node play_game.js`

Set random seed for reproducibility.

<logging_system>
Log all the game entities when they are created (not in the constructors). Be detailed in the role that the entity has (the same type of entity can have different roles).
Format: "game_time=12 event=entity_creation id=entity_id role=entity_role data=..."
Where game_time is the elapsed time in seconds since the game start.

Log the interactions between entities.
Throttle high-frequency events to prevent spamming the logs (1 Hz)
Format (example interaction between two entities): "game_time=12 event=entity_interaction type=interaction_type entity_ids=... data=..."

Log the user inputs.
Format: "game_time=12 event=user_input type=press_key_A"

Log changes in game status.
Format: "game_time=12 event=game_status_change status=win"
where status is "start", "reset", "win", or "fail".

Include position and geometry information to the logs.
Logs array is read-only. Don't reset the logs array when the game is reset.

Describe the log schema in a file log_schema.md.
</logging_system>
"""


prompt_policy = """Fully examine the code in the current working directory.

Implement a policy to win the game.
Use the game API to play the game.
Use the game logs as feedback to improve the policy (print the raw logs to the console).
Keep iterating until the policy reaches the win state.
Modify the existing win_game.js.
Save result.json, video.webm, and logs.txt in "results/win-policy".
"""


model = "claude-sonnet-4-20250514"


def run_coding_agent(prompt, code_dict, save_dir, model):
    """Run CodingAgent with a prompt and return the generated files."""
    save_dir.mkdir(parents=True, exist_ok=True)
    
    # Create temp directory
    temp_dir = tempfile.mkdtemp(prefix="game_verify_")
    temp_path = Path(temp_dir)
    print(f"Using temp directory: {temp_path}")

    try:
        # Write existing files to temp directory
        for file_path, file_content in code_dict.items():
            file_full_path = temp_path / file_path
            file_full_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_full_path, "w") as f:
                f.write(file_content)

        # Use CodingAgent with temp directory as cwd
        agent = CodingAgent(model=model, verbose=True, cwd=str(temp_dir))
        result = agent.chat(prompt)
        
        # Copy generated files back
        shutil.copytree(temp_dir, save_dir / "code", dirs_exist_ok=True)

        return True
    except Exception as e:
        print(f"Error running coding agent: {e}")
        return False
    finally:
        # Clean up temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)

def verify_game(game_path, save_dir, model=model):
    """Add game API and logging system, then generate a winning policy."""
    game_path = Path(game_path)
    save_dir = Path(save_dir)
    template_dir = Path(__file__).parent / "template"
    
    # Load existing game code
    index_html = game_path / "code" / "index.html"
    if not index_html.exists():
        print(f"Error: Game file not found at {index_html}")
        return False
    
    code_dict = {"index.html": index_html.read_text()}
    
    # Step 1: Add game API and logging system
    api_dir = save_dir / "game_api"
    if not (api_dir / "code").exists():
        api_dir.mkdir(parents=True, exist_ok=True)
        
        # Create initial files for API generation
        init_dir = api_dir / "init"
        init_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy game file
        shutil.copy(index_html, init_dir / "index.html")
        
        # Copy template files for API step
        template_files = ["play_game.js", "package.json"]
        for template_file in template_files:
            template_path = template_dir / template_file
            if template_path.exists():
                shutil.copy(template_path, init_dir / template_file)
            else:
                print(f"Warning: Template file {template_file} not found")
        
        # Create code dict with all files
        api_code_dict = {}
        for file_path in init_dir.rglob("*"):
            if file_path.is_file():
                api_code_dict[str(file_path.relative_to(init_dir))] = file_path.read_text()
        
        # Save prompt
        with open(api_dir / "prompt.txt", "w") as f:
            f.write(prompt_game_api)
        
        # Add game API using CodingAgent
        success = run_coding_agent(prompt_game_api, api_code_dict, api_dir, model)
        if not success:
            print("Failed to add game API")
            return False
    
    # Test the game API
    api_code_dir = api_dir / "code"
    if (api_code_dir / "play_game.js").exists():
        print("Running play_game.js to test API...")
        result = subprocess.run(["node", "play_game.js"], cwd=api_code_dir, capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ Game API test passed")
        else:
            print(f"✗ Game API test failed: {result.stderr}")
    
    # Step 2: Generate winning policy
    policy_dir = save_dir / "winning_policy"
    if not (policy_dir / "code").exists():
        print("Generating winning policy...")
        
        # Create initial files for policy generation
        init_dir = policy_dir / "init"
        init_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy game files from API step
        if (api_code_dir / "index.html").exists():
            shutil.copy(api_code_dir / "index.html", init_dir / "index.html")
        
        # Copy template files
        template_files = ["play_game.js", "win_game.js", "package.json"]
        for template_file in template_files:
            template_path = template_dir / template_file
            if template_path.exists():
                shutil.copy(template_path, init_dir / template_file)
            else:
                print(f"Warning: Template file {template_file} not found")
        
        # Create code dict for policy generation
        policy_code_dict = {}
        for file_path in init_dir.rglob("*"):
            if file_path.is_file():
                policy_code_dict[str(file_path.relative_to(init_dir))] = file_path.read_text()
        
        # Save policy prompt
        with open(policy_dir / "prompt.txt", "w") as f:
            f.write(prompt_policy)
        
        # Generate policy using CodingAgent
        success = run_coding_agent(prompt_policy, policy_code_dict, policy_dir, model)
        if not success:
            print("Failed to generate winning policy")
            return False
    
    # Test the winning policy
    policy_code_dir = policy_dir / "code"
    if (policy_code_dir / "win_game.js").exists():
        print("Testing winning policy...")
        # Install dependencies first
        subprocess.run(["npm", "install"], cwd=policy_code_dir, capture_output=True)
        
        result = subprocess.run(["node", "win_game.js"], cwd=policy_code_dir, capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ Winning policy executed successfully")
        else:
            print(f"✗ Winning policy failed: {result.stderr}")
    
    print(f"Game verification completed. Results saved to {save_dir}")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify a generated game by adding API and logging")
    parser.add_argument("game_path", help="Path to the generated game directory")
    parser.add_argument("--save-dir", required=True, help="Directory to save verification results")
    parser.add_argument("--model", default=model, help="Model to use")
    
    args = parser.parse_args()
    
    success = verify_game(args.game_path, args.save_dir, args.model)
    if not success:
        exit(1)
