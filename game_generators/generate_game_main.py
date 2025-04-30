import os
import json
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

from game_generators.gamegen_methods.simple_prompt_generator import SimplePromptGenerator


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
        default="anthropic:claude-3.5-sonnet",
        help="LLM model to use (e.g., 'openai:gpt-4o', 'anthropic:claude-3.5-sonnet')",
    )
    
    parser.add_argument(
        "--method",
        type=str,
        default="simple_prompt",
        choices=["simple_prompt"], # TODO: "guide_complexity", "template", "template_character_driven", "template_with_critic", "template_with_play"],
        help="Game generation method to use",
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output",
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
        if args.method == "simple_prompt":
            generator = SimplePromptGenerator(
                model_name=args.model,
                verbose=args.verbose,
            )
        elif args.method == "template":
            # Will be implemented in the future
            raise NotImplementedError("Template method not yet implemented")
        elif args.method == "template_with_critic":
            # Will be implemented in the future
            raise NotImplementedError("Template with critic method not yet implemented")
        elif args.method == "template_with_play":
            # Will be implemented in the future
            raise NotImplementedError("Template with play method not yet implemented")
        else:
            raise ValueError(f"Unknown method: {args.method}")
        
        # Generate the game
        result = generator.generate_game(
            game_concept=game_concept,
            concept_path=args.concept_path,
        )
        
        print(f"Game generated successfully: {result['title']}")
        print(f"Saved to: {result['game_dir']}")
        
    except Exception as e:
        print(f"Error generating game: {type(e).__name__}: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
