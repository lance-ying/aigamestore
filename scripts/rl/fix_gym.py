#!/usr/bin/env python3
"""
Fix broken gym implementations using error logs and iterative LLM refinement.

This tool reads gym_config.json and gym_api.js, takes error messages as input,
and uses an LLM to fix issues like state shape mismatches, undefined errors, etc.

Usage:
    python fix_gym.py <game_dir> --error "ValueError: shape mismatch..."
    python fix_gym.py <game_dir> --error-file error.txt
    python fix_gym.py <game_dir> --test-first

Examples:
    python fix_gym.py public/games/some-game --error "Could not broadcast shape (12,) into (18,)"
    python fix_gym.py public/games/some-game --error-file debug.log --max-iterations 5
"""

import argparse
import sys
from pathlib import Path
from typing import Dict, Any

from llm_interface.model_api import ModelAPI


def load_env_file() -> None:
    """Load environment variables from .env file if it exists."""
    env_file = Path(".env")
    if env_file.exists():
        import os
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    if value and value[0] in ('"', "'") and value[-1] in ('"', "'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value


load_env_file()


def read_game_files(game_dir: Path) -> Dict[str, str]:
    """Read relevant gym files from game directory."""
    files = {}
    
    if (game_dir / "gym_config.json").exists():
        files["gym_config.json"] = (game_dir / "gym_config.json").read_text()
    
    if (game_dir / "gym_api.js").exists():
        files["gym_api.js"] = (game_dir / "gym_api.js").read_text()
    
    if (game_dir / "game.js").exists():
        files["game.js"] = (game_dir / "game.js").read_text()
    
    # Also read globals.js if it exists
    if (game_dir / "globals.js").exists():
        files["globals.js"] = (game_dir / "globals.js").read_text()
    
    return files


def test_gym_implementation(game_dir: Path) -> tuple[bool, str]:
    """
    Quick test of gym implementation by creating env and running a few steps.
    Returns (success, error_message)
    """
    try:
        from gym_wrapper_true import P5GameEnv
        
        print(f"   Testing gym wrapper...")
        env = P5GameEnv(
            game_name=game_dir.name,
            games_dir=str(game_dir.parent),
            headless=True,
            observation_type="state"
        )
        
        # Try reset
        obs, info = env.reset()
        print(f"   ✓ Reset successful, obs shape: {obs.shape}")
        
        # Try a few steps
        for i in range(5):
            action = env.action_space.sample()
            obs, reward, terminated, truncated, info = env.step(action)
            
        print(f"   ✓ Steps successful")
        
        env.close()
        return True, ""
        
    except Exception as e:
        import traceback
        error_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        return False, error_msg


def fix_gym_implementation(
    game_dir: Path,
    files: Dict[str, str],
    error_message: str,
    model: str = "anthropic:claude-4.5-sonnet",
    max_iterations: int = 3,
) -> Dict[str, Any]:
    """
    Use LLM to fix gym implementation based on error message.
    
    Returns dict with fixed files and success status.
    """
    api = ModelAPI(model)
    
    # Load snake-io as reference
    snake_io_gym_api = Path(__file__).parent / "public" / "games" / "snake-io" / "gym_api.js"
    if snake_io_gym_api.exists():
        reference_impl = snake_io_gym_api.read_text()
    else:
        reference_impl = "// Not available"
    
    snake_io_config = Path(__file__).parent / "public" / "games" / "snake-io" / "gym_config.json"
    if snake_io_config.exists():
        reference_config = snake_io_config.read_text()
    else:
        reference_config = "{}"
    
    files_blob = "\n\n".join([f"<file name=\"{name}\">\n{content}\n</file>" 
                              for name, content in files.items()])
    
    user_prompt = f"""
You are fixing a broken Gym API implementation for a p5.js game.

<current_files>
{files_blob}
</current_files>

<error_message>
{error_message}
</error_message>

<reference_working_implementation>
Here is the working snake-io implementation for reference:

gym_config.json:
{reference_config}

gym_api.js (key patterns):
{reference_impl[:3000]}
...

KEY PATTERNS THAT WORK:
1. getPlayerState() ALWAYS returns object with same fields, never null
2. findNearest() ALWAYS returns {{x, y, distance}}, never null
3. validateState() ensures consistent shape
4. Defensive checks everywhere (|| [], try-catch)
5. Observation shape in config MUST match actual flattened state length
</reference_working_implementation>

<task>
Analyze the error and fix the broken implementation:

Common Issues:
1. State shape mismatch - config says X but getState() returns Y
   Fix: Update gym_config.json observation_space.shape OR fix getState() to match
   
2. Undefined/null values - getState() returns null/undefined
   Fix: Add default values like snake-io does
   
3. Missing imports - gym_api.js can't find game variables
   Fix: Add proper imports from globals.js or game.js
   
4. Array access errors - trying to access undefined arrays
   Fix: Add defensive checks (gameState.pellets || [])

Provide fixed files that will resolve the error.
</task>

<output_format>
For each file you need to fix, output:

<file name="filename">
// Complete fixed content
</file>

Output ALL files that need changes, even if only one has the error.
Include a brief explanation of what you fixed.
</output_format>
"""
    
    system_prompt = (
        "You are an expert at debugging Gym API implementations. "
        "You fix errors carefully while preserving working code. "
        "You follow the patterns from working implementations like snake-io."
    )
    
    print(f"\n🔧 Analyzing error and generating fix...")
    
    response = api.call(
        user_prompt=user_prompt,
        system_prompt=system_prompt,
        temperature=0.3,
        thinking=True,
        thinking_budget=10000,
    )
    
    if isinstance(response, dict):
        response_text = response.get("response", "")
    else:
        response_text = response
    
    # Extract fixed files
    import re
    fixed_files = {}
    
    for match in re.finditer(r'<file name="([^"]+)">(.*?)</file>', response_text, re.DOTALL):
        filename = match.group(1)
        content = match.group(2).strip()
        fixed_files[filename] = content
    
    return {
        "fixed_files": fixed_files,
        "response": response_text,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Fix broken gym implementations using error logs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        "game_dir",
        help="Path to the game directory"
    )
    
    parser.add_argument(
        "--error",
        help="Error message to fix"
    )
    
    parser.add_argument(
        "--error-file",
        help="File containing error message"
    )
    
    parser.add_argument(
        "--test-first",
        action="store_true",
        help="Test the implementation first to get error message"
    )
    
    parser.add_argument(
        "--model",
        default="anthropic:claude-4.5-sonnet",
        help="Model to use (default: anthropic:claude-4.5-sonnet)"
    )
    
    parser.add_argument(
        "--max-iterations",
        type=int,
        default=3,
        help="Maximum fix iterations (default: 3)"
    )
    
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Automatically apply fixes (otherwise just show them)"
    )
    
    args = parser.parse_args()
    
    game_dir = Path(args.game_dir).resolve()  # Resolve to absolute path
    if not game_dir.exists():
        print(f"❌ Error: Game directory not found: {game_dir}")
        sys.exit(1)
    
    print(f"\n🎮 Gym Implementation Fixer")
    print(f"{'=' * 60}\n")
    print(f"Game: {game_dir.name}")
    print(f"Directory: {game_dir}\n")
    
    # Check required files exist
    if not (game_dir / "gym_config.json").exists():
        print(f"❌ Error: gym_config.json not found")
        print(f"   Run: python scripts/rl/add_gym_api.py {game_dir}")
        sys.exit(1)
    
    if not (game_dir / "gym_api.js").exists():
        print(f"❌ Error: gym_api.js not found")
        print(f"   Run: python scripts/rl/add_gym_api.py {game_dir}")
        sys.exit(1)
    
    # Get error message
    error_message = None
    
    if args.test_first:
        print(f"🧪 Testing implementation to capture error...")
        success, error_message = test_gym_implementation(game_dir)
        if success:
            print(f"\n✅ Implementation works! No fixes needed.")
            return
        print(f"\n❌ Test failed with error:")
        print(f"{error_message}\n")
    elif args.error:
        error_message = args.error
    elif args.error_file:
        error_file = Path(args.error_file)
        if not error_file.exists():
            print(f"❌ Error file not found: {error_file}")
            sys.exit(1)
        error_message = error_file.read_text()
    else:
        print(f"❌ Error: Must provide --error, --error-file, or --test-first")
        sys.exit(1)
    
    # Iterative fixing
    for iteration in range(args.max_iterations):
        print(f"\n{'=' * 60}")
        print(f"Fix Iteration {iteration + 1}/{args.max_iterations}")
        print(f"{'=' * 60}\n")
        
        # Read current files
        files = read_game_files(game_dir)
        
        # Generate fix
        result = fix_gym_implementation(
            game_dir=game_dir,
            files=files,
            error_message=error_message,
            model=args.model,
            max_iterations=args.max_iterations,
        )
        
        fixed_files = result["fixed_files"]
        
        if not fixed_files:
            print(f"⚠️  No fixes generated")
            break
        
        print(f"\n📝 Proposed fixes:")
        for filename in fixed_files:
            print(f"   • {filename}")
        
        # Apply or show fixes
        if args.apply:
            print(f"\n✍️  Applying fixes...")
            for filename, content in fixed_files.items():
                file_path = game_dir / filename
                file_path.write_text(content)
                print(f"   ✓ Updated {filename}")
            
            # Test again
            print(f"\n🧪 Testing fixed implementation...")
            success, new_error = test_gym_implementation(game_dir)
            
            if success:
                print(f"\n✅ Fix successful! Implementation now works.")
                break
            else:
                print(f"\n❌ Still has errors:")
                print(f"{new_error}")
                error_message = new_error
                
                if iteration < args.max_iterations - 1:
                    print(f"\n🔄 Trying again...")
        else:
            print(f"\n📄 Fixed file previews (use --apply to save):")
            for filename, content in fixed_files.items():
                print(f"\n{'─' * 60}")
                print(f"{filename}:")
                print(f"{'─' * 60}")
                print(content[:500] + "..." if len(content) > 500 else content)
            break
    
    print(f"\n{'=' * 60}")
    print(f"Done!")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()

