import os
import json
import argparse
import sys
from pathlib import Path
from typing import Dict, Any, Optional

from gamegen_methods.baseline import BaselineGenerator
from gamegen_methods.simple_prompt_generator import SimplePromptGenerator
from gamegen_methods.template_based_generator import TemplateBasedGenerator
from gamegen_methods.template_based_form_generator import TemplateBasedFormGenerator
from game_check.run_all_tests import run_all_tests


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Generate games from concepts using LLMs")
    
    parser.add_argument(
        "--concept_path",
        type=str,
        help="Path to the JSON file containing the game concept",
        required=True,
    )
    
    parser.add_argument(
        "--model",
        type=str,
        default="anthropic:claude-3.7-sonnet",
        help="LLM model to use (e.g., 'openai:gpt-4o', 'anthropic:claude-3.5-sonnet')",
    )
    
    parser.add_argument(
        "--method",
        type=str,
        default="simple_prompt",
        choices=["baseline", "simple_prompt", "template_based", "template_based_form"], # TODO: "guide_complexity", "template", "template_character_driven", "template_with_critic", "template_with_play"],
        help="Game generation method to use",
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output",
    )
    
    parser.add_argument(
        "--allow_resample",
        type=int,
        default=3,
        help="Number of automatic resamples allowed if tests fail (0 means ask for confirmation)",
    )

    parser.add_argument(
        "--no_ecs",
        action="store_true",
        help="Use non-ECS architecture for game generation",
    )
    
    return parser.parse_args()


def load_concept(concept_path: str) -> Dict[str, Any]:
    """Load game concept from JSON file"""
    if not os.path.exists(concept_path):
        raise FileNotFoundError(f"Concept file not found: {concept_path}")
    
    with open(concept_path, "r") as f:
        concept_data = json.load(f)
    
    if "concept" not in concept_data:
        raise ValueError(f"Concept file must contain a 'concept' field: {concept_path}")
    
    return concept_data


def get_user_confirmation(message: str) -> bool:
    """Get user confirmation with y/n prompt"""
    response = input(f"{message} (y/n): ").lower().strip()
    return response == 'y'


def test_game(game_dir: str, verbose: bool) -> bool:
    """Run tests on the generated game and return result"""
    if verbose:
        print(f"Running tests on game in directory: {game_dir}")
    
    try:
        results = run_all_tests(game_dir)
        return results["overall_result"]
    except Exception as e:
        print(f"Error running tests: {type(e).__name__}: {str(e)}")
        if verbose:
            import traceback
            traceback.print_exc()
        return False


def main():
    """Main function to generate games from concepts"""
    args = parse_args()
    
    try:
        # Load the game concept
        concept_data = load_concept(args.concept_path)
        game_concept = concept_data["concept"]
        
        if args.verbose:
            print(f"Loaded game concept: {game_concept[:100]}...")
            print(f"Using method: {args.method}")
            print(f"Using model: {args.model}")
        
        # Initialize the appropriate generator based on the method
        if args.method == "baseline":
            generator = BaselineGenerator(
                model_name=args.model,
                verbose=args.verbose,
            )
        elif args.method == "simple_prompt":
            generator = SimplePromptGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
            )
        elif args.method == "template_based":
            # Will be implemented in the future
            generator = TemplateBasedGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
            )
        elif args.method == "template_based_form":
            generator = TemplateBasedFormGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
            )
        elif args.method == "template_with_critic":
            # Will be implemented in the future
            raise NotImplementedError("Template with critic method not yet implemented")
        elif args.method == "template_with_play":
            # Will be implemented in the future
            raise NotImplementedError("Template with play method not yet implemented")
        else:
            raise ValueError(f"Unknown method: {args.method}")
        
        # Generate and test the game, with resampling if needed
        max_attempts = 3  # Maximum number of generation attempts
        attempt = 1
        game_passed = False
        
        while attempt <= max_attempts and not game_passed:
            if attempt > 1:
                print(f"\nAttempting game generation again (attempt {attempt}/{max_attempts})...")
            
            # Generate the game
            result = generator.generate_game(
                game_concept=game_concept,
                concept_path=args.concept_path,
            )
            
            print(f"Game generated successfully: {result['title']}")
            print(f"Saved to: {result['game_dir']}")
            
            # Test the game
            print("\nTesting game functionality...")
            game_passed = test_game(result['game_dir'], args.verbose)
            
            if game_passed:
                print("\n✅ Game passed all tests!")
            else:
                print("\n❌ Game failed some tests.")
                
                # Check if we should resample
                if attempt < max_attempts:
                    if args.allow_resample > 0 and attempt <= args.allow_resample:
                        print(f"Auto-resampling enabled ({args.allow_resample} allowed). Generating new game...")
                    else:
                        if not get_user_confirmation("Do you want to generate a new game?"):
                            print("User chose not to resample. Keeping the current game.")
                            break
                else:
                    print(f"Reached maximum attempts ({max_attempts}). Keeping the last generated game.")
            
            attempt += 1
        
        # Final outcome
        if game_passed:
            print(f"\nFinal game generation successful after {attempt-1} attempt(s)!")
        else:
            print(f"\nWarning: Final game did not pass all tests after {attempt-1} attempt(s).")
        
        print(f"Game title: {result['title']}")
        print(f"Game location: {result['game_dir']}")
        
    except Exception as e:
        print(f"Error generating game: {type(e).__name__}: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
