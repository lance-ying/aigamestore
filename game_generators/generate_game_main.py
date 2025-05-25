import os
import json
import argparse
import sys
import shutil
from pathlib import Path
from typing import Dict, Any, Optional

from gamegen_methods.baseline import BaselineGenerator
from gamegen_methods.simple_prompt_generator import SimplePromptGenerator
from gamegen_methods.simple_prompt_generator_exp import SimplePromptEXPGenerator
from gamegen_methods.simple_prompt_generator_xml import SimplePromptXMLGenerator
from gamegen_methods.two_step_generator_xml import TwoStepXMLGenerator
from gamegen_methods.multipass_generator_xml import MultiPassXMLGenerator
from gamegen_methods.template_based_generator import TemplateBasedGenerator
from gamegen_methods.template_based_form_generator import TemplateBasedFormGenerator
from game_check.run_all_tests import run_all_tests


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Generate games from concepts using LLMs"
    )

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
        choices=["baseline", "simple_prompt_basic", "simple_prompt", "simple_prompt_exp", "simple_prompt_xml", "two_step_xml", "template_based", "template_based_form", "multi_step_xml"], # TODO: "guide_complexity", "template", "template_character_driven", "template_with_critic", "template_with_play"],
        help="Game generation method to use",
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output",
    )

    parser.add_argument(
        "--no_ecs",
        action="store_true",
        help="Use non-ECS architecture for game generation",
    )

    parser.add_argument(
        "--generate_with_ai",
        action="store_true",
        help="Generate game with AI",
    )

    parser.add_argument(
        "--baseline",
        action="store_true",
        help="Use baseline architecture for game generation",
    )
    
    parser.add_argument(
        "--num_passes",
        type=int,
        default=4,
        help="Number of passes to use for multi-step game generation",
    )

    parser.add_argument(
        "--temperature",
        type=float,
        default=1.0,
        help="Temperature for the LLM",
    )

    parser.add_argument(
        "--top_p",
        type=float,
        default=0.9,
        help="Top P for the LLM",
    )

    parser.add_argument(
        "--thinking",
        action="store_true",
        help="Enable thinking mode for supported models",
    )

    parser.add_argument(
        "--thinking_budget",
        type=int,
        default=10000,
        help="Number of tokens to allocate for thinking (default: 10000)",
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
    return response == "y"


def test_game(game_dir: str, verbose: bool) -> bool:
    """Run tests on the generated game and return result"""
    if verbose:
        print(f"Running tests on game in directory: {game_dir}")

    try:
        results = run_all_tests(game_dir)
        return results["overall_result"]
    except KeyError as e:
        # Handle the case where 'interaction_test' key doesn't have the expected nested structure
        if verbose:
            print(f"Warning: KeyError when processing test results: {e}")
            import traceback
            traceback.print_exc()
        
        # If we have partial results, extract what we can
        if isinstance(results, dict):
            # Check if load test passed
            load_test_passed = results.get("load_test", {}).get("test_result", False)
            
            # Check if interaction test has a simple result
            interaction_test_passed = results.get("interaction_test", {}).get("test_result", False)
            
            # Return overall result (both tests must pass)
            return load_test_passed and interaction_test_passed
        return False
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
            generator = SimplePromptXMLGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
                use_baseline=True,
                thinking=args.thinking,
                thinking_budget=args.thinking_budget,
            )
        elif args.method == "simple_prompt_basic":
            generator = SimplePromptXMLGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
                use_basic=True,
                temperature=args.temperature if args.temperature else 1.0,
                top_p=args.top_p if args.top_p else 0.9,
                thinking=args.thinking,
                thinking_budget=args.thinking_budget,
            )
        elif args.method == "simple_prompt":
            generator = SimplePromptGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
                generate_with_ai=args.generate_with_ai,
                thinking=args.thinking,
                thinking_budget=args.thinking_budget,
            )
        elif args.method == "simple_prompt_exp":
            generator = SimplePromptEXPGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
                thinking=args.thinking,
                thinking_budget=args.thinking_budget,
            )
        elif args.method == "simple_prompt_xml":
            generator = SimplePromptXMLGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
                use_baseline=args.baseline,
                thinking=args.thinking,
                thinking_budget=args.thinking_budget,
            )
        elif args.method == "template_based":
            # Will be implemented in the future
            generator = TemplateBasedGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
                thinking=args.thinking,
                thinking_budget=args.thinking_budget,
            )
        elif args.method == "two_step_xml":
            generator = TwoStepXMLGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
                thinking=args.thinking,
                thinking_budget=args.thinking_budget,
            )
        elif args.method == "multi_step_xml":
            generator = MultiPassXMLGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
                num_passes=args.num_passes,
                thinking=args.thinking,
                thinking_budget=args.thinking_budget,
            )
        elif args.method == "template_based_form":
            generator = TemplateBasedFormGenerator(
                model_name=args.model,
                verbose=args.verbose,
                use_ecs=not args.no_ecs,
                thinking=args.thinking,
                thinking_budget=args.thinking_budget,
            )
        elif args.method == "template_with_critic":
            # Will be implemented in the future
            raise NotImplementedError("Template with critic method not yet implemented")
        elif args.method == "template_with_play":
            # Will be implemented in the future
            raise NotImplementedError("Template with play method not yet implemented")
        else:
            raise ValueError(f"Unknown method: {args.method}")

        # Generate the game with resampling for failed tests
        max_attempts = 3  # Maximum number of attempts to generate a passing game
        attempt = 1
        game_passed = False
        result = None

        while attempt <= max_attempts and not game_passed:
            if attempt > 1:
                print(f"\nAttempt {attempt}/{max_attempts} to generate a passing game...")
            
            # Generate the game
            result = generator.generate_game(
                game_concept=game_concept,
                concept_path=args.concept_path,
            )

            print(f"Game generated successfully: {result['title']}")
            print(f"Saved to: {result['game_dir']}")

            # Test the game
            print("\nTesting game functionality...")
            game_passed = test_game(result["game_dir"], args.verbose)

            if game_passed:
                print("\nGame passed all tests!")
            else:
                print("\nGame failed some tests.")
                
                if attempt < max_attempts:
                    print(f"Moving failed game and resampling...")
                    
                    # Move the failed game directory instead of deleting it
                    try:
                        # Determine the parent directory and create the failed attempt path
                        game_dir_path = Path(result["game_dir"])
                        parent_dir = game_dir_path.parent
                        failed_dir = parent_dir / f"failed_attempt_{attempt}"
                        
                        # remove the game_dir/game_check_results/screenshots
                        game_check_results_dir = game_dir_path / "game_check_results/screenshots"
                        if game_check_results_dir.exists():
                            shutil.rmtree(game_check_results_dir)

                        # Move the directory
                        shutil.move(str(game_dir_path), str(failed_dir))
                        print(f"Moved failed game from {result['game_dir']} to {failed_dir}")
                    except Exception as e:
                        print(f"Warning: Failed to move directory: {e}")
                
                attempt += 1

        # Final outcome
        if result:
            print(f"\nGame title: {result['title']}")
            print(f"Game location: {result['game_dir']}")
            if not game_passed:
                print(f"Warning: Could not generate a passing game after {max_attempts} attempts.")
        

    except Exception as e:
        print(f"Error generating game: {type(e).__name__}: {str(e)}")
        if args.verbose:
            import traceback

            traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
