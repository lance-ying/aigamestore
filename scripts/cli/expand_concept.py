#!/usr/bin/env python3
"""
Concept Expansion CLI Tool

Expands vague game concepts into detailed YAML specifications using LLM.

Usage:
    uv run python expand_concept.py --concept "puzzle game with blocks" --output expanded_concepts/block_puzzle.yaml
    uv run python expand_concept.py --config configs/generators/concept_expander.yaml --concept "space shooter"
"""

import argparse
import sys
from pathlib import Path
from typing import Optional

import yaml

from generators.concept_expander import ConceptExpanderGenerator


def load_config(config_path: str) -> dict:
    """Load configuration from YAML file."""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading config file: {e}")
        sys.exit(1)


def expand_concept_cli(
    concept: str,
    output_path: str,
    config_path: Optional[str] = None,
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    thinking: Optional[bool] = None,
    thinking_budget: Optional[int] = None,
    verbose: bool = False,
    include_metadata: bool = True,
) -> None:
    """
    Expand a concept and save to file.

    Args:
        concept: Vague game concept to expand
        output_path: Path to save expanded YAML
        config_path: Optional config file path
        model: Model name (overrides config)
        temperature: Temperature (overrides config)
        thinking: Enable thinking mode (overrides config)
        thinking_budget: Thinking budget (overrides config)
        verbose: Enable verbose output
        include_metadata: Include generation metadata in output
    """
    # Load config if provided
    config = {}
    if config_path:
        config = load_config(config_path)

    # Override with CLI args
    model_name = model or config.get("model", "anthropic:claude-4.5-sonnet")
    temp = temperature if temperature is not None else config.get("temperature", 0.8)
    think = thinking if thinking is not None else config.get("thinking", True)
    think_budget = thinking_budget or config.get("thinking_budget", 8000)

    # Create generator
    generator = ConceptExpanderGenerator(
        model_name=model_name,
        temperature=temp,
        thinking=think,
        thinking_budget=think_budget,
        verbose=verbose,
    )

    print(f"Expanding concept: {concept}")
    print(f"Model: {model_name}")
    print(f"Temperature: {temp}")
    print(f"Thinking: {think}")
    if think:
        print(f"Thinking budget: {think_budget}")
    print()

    # Expand concept
    try:
        result = generator.expand_concept(concept)
    except Exception as e:
        print(f"Error during concept expansion: {e}")
        if verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

    # Check for parse errors
    expanded = result.get("expanded_concept", {})
    if "parse_error" in expanded:
        print(f"Warning: Failed to parse YAML from response")
        print(f"Error: {expanded['parse_error']}")
        print(f"\nRaw YAML content:")
        print(expanded.get("raw_yaml", ""))
        print(f"\nSaving raw response to: {output_path}")

    # Save to file
    try:
        output_file = generator.save_expanded_concept(
            result,
            output_path,
            include_metadata=include_metadata
        )
        print(f"\n✓ Expanded concept saved to: {output_file}")
    except Exception as e:
        print(f"Error saving expanded concept: {e}")
        if verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

    # Print summary
    print("\n" + "="*60)
    print("EXPANSION SUMMARY")
    print("="*60)

    if "parse_error" not in expanded:
        concept_info = expanded.get("concept", {})
        print(f"Game Name: {concept_info.get('name', 'N/A')}")
        print(f"Core Mechanic: {concept_info.get('core_mechanic', 'N/A')}")
        print(f"Genre: {concept_info.get('genre', 'N/A')}")
        print(f"Difficulty: {concept_info.get('target_difficulty', 'N/A')}")

        # Show some key details
        visual = expanded.get("visual_design", {})
        if visual:
            print(f"\nArt Style: {visual.get('art_style', 'N/A')}")

        mechanics = expanded.get("mechanics", {})
        if mechanics and "entities" in mechanics:
            entity_count = len(mechanics["entities"])
            print(f"\nEntity Types: {entity_count}")

        controls = expanded.get("controls", {})
        if controls and "gameplay" in controls:
            control_count = len(controls["gameplay"])
            print(f"Gameplay Controls: {control_count} keys mapped")

    print("\n" + "="*60)

    if verbose and result.get("thinking"):
        print("\nTHINKING PROCESS:")
        print("-"*60)
        print(result["thinking"])
        print("-"*60)


def main():
    parser = argparse.ArgumentParser(
        description="Expand vague game concepts into detailed YAML specifications",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage
  python expand_concept.py --concept "puzzle game with blocks" --output expanded_concepts/block_puzzle.yaml

  # With config file
  python expand_concept.py --config configs/generators/concept_expander.yaml --concept "space shooter"

  # Override model and temperature
  python expand_concept.py --concept "racing game" --output racing.yaml --model anthropic:claude-sonnet-4 --temperature 1.0

  # Without metadata in output
  python expand_concept.py --concept "platformer" --output platformer.yaml --no-metadata

  # Verbose mode with thinking
  python expand_concept.py --concept "tower defense" --output td.yaml --verbose --thinking
        """
    )

    parser.add_argument(
        "--concept",
        type=str,
        required=True,
        help="Vague game concept to expand (e.g., 'puzzle game with blocks')"
    )

    parser.add_argument(
        "--output",
        type=str,
        default="expanded_concepts/expanded_concept.yaml",
        help="Output path for expanded YAML (default: expanded_concepts/expanded_concept.yaml)"
    )

    parser.add_argument(
        "--config",
        type=str,
        help="Path to config YAML file (e.g., configs/generators/concept_expander.yaml)"
    )

    parser.add_argument(
        "--model",
        type=str,
        help="Model name (overrides config). Examples: anthropic:claude-4.5-sonnet, anthropic:claude-sonnet-4"
    )

    parser.add_argument(
        "--temperature",
        type=float,
        help="Temperature for generation (0.0-1.0, overrides config)"
    )

    parser.add_argument(
        "--thinking",
        action="store_true",
        help="Enable extended thinking mode (overrides config)"
    )

    parser.add_argument(
        "--no-thinking",
        action="store_true",
        help="Disable extended thinking mode (overrides config)"
    )

    parser.add_argument(
        "--thinking-budget",
        type=int,
        help="Thinking budget in tokens (overrides config)"
    )

    parser.add_argument(
        "--no-metadata",
        action="store_true",
        help="Exclude generation metadata from output file"
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output"
    )

    args = parser.parse_args()

    # Handle thinking flags
    thinking = None
    if args.thinking:
        thinking = True
    elif args.no_thinking:
        thinking = False

    # Expand concept
    expand_concept_cli(
        concept=args.concept,
        output_path=args.output,
        config_path=args.config,
        model=args.model,
        temperature=args.temperature,
        thinking=thinking,
        thinking_budget=args.thinking_budget,
        verbose=args.verbose,
        include_metadata=not args.no_metadata,
    )


if __name__ == "__main__":
    main()
