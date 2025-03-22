from pathlib import Path
import os
import re
import random
from typing import Tuple, Optional, Dict, List
from dataclasses import dataclass
from prompt import (
    GAME_DESCRIPTION_PROMPT,
    GAME_CODE_PROMPT_NO_ECS,
    GAME_CODE_PROMPT_ECS,
)
import argparse
import json
import time
import datetime
from code_generator import SimpleCodeGenerator, ModelConfig, VALID_GENRES, parse_args


class TwoStepCodeGenerator(SimpleCodeGenerator):
    """Code generator that generates description and code in two separate steps"""

    def generate_game_variants(self, genre: str, num_players: int) -> Dict[str, any]:
        """
        Generate both ECS and non-ECS versions of the same game:
        1. Generate game description and title once
        2. Generate ECS version code
        3. Generate non-ECS version code
        """
        if genre.lower() not in VALID_GENRES:
            raise ValueError(
                f"Invalid genre. Must be one of: {', '.join(VALID_GENRES)}"
            )

        if not isinstance(num_players, int) or num_players < 1:
            raise ValueError("Number of players must be a positive integer")

        print("\nStep 1: Generating game description...")
        description_prompt = GAME_DESCRIPTION_PROMPT.format(
            genre=genre, num_players=num_players
        )

        print(f"\033[92m{description_prompt}\033[0m")
        description_response = self.generate_response(description_prompt)
        print(f"\033[93m{description_response}\033[0m")

        title = self._extract_title(description_response)
        description = self._extract_description(description_response)

        if not description:
            raise ValueError("Failed to generate game description")

        variants = {}

        # Generate both ECS and non-ECS versions
        for use_ecs in [True, False]:
            print(f"\nGenerating {'ECS' if use_ecs else 'non-ECS'} version...")
            code_prompt = (
                GAME_CODE_PROMPT_ECS if use_ecs else GAME_CODE_PROMPT_NO_ECS
            ).format(
                genre=genre,
                num_players=num_players,
                title=title,
                description=description,
            )

            print(f"\033[92m{code_prompt}\033[0m")
            code_response = self.generate_response(code_prompt)
            print(f"\033[93m{code_response}\033[0m")

            code_blocks = self.parse_code_blocks(code_response)

            meta_data = {
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "model": self.config.model_name,
                "model_id": self.config.model_id,
                "genre": genre,
                "num_players": num_players,
                "use_ecs": use_ecs,
            }

            variant_key = "ecs" if use_ecs else "no_ecs"
            variants[variant_key] = {
                "title": title,
                "description": f"Game Name: {title}\n{description}",
                "code_blocks": code_blocks,
                "raw_response": {
                    "description": description_response,
                    "code": code_response,
                },
                "meta_data": meta_data,
            }

        return variants


if __name__ == "__main__":
    args = parse_args()
    try:
        config = ModelConfig(model_name=args.model)
        generator = TwoStepCodeGenerator(config)

        results = generator.generate_game_variants(
            genre=args.genre, num_players=args.num_players
        )

        safe_title = re.sub(
            r"[^a-zA-Z0-9_]", "", results["ecs"]["title"].replace(" ", "_")
        ).lower()
        games_dir = Path(args.output_dir)
        games_dir.mkdir(parents=True, exist_ok=True)

        # Save both variants
        for variant, result in results.items():
            game_dir = games_dir / variant / args.genre / safe_title
            game_dir.mkdir(parents=True, exist_ok=True)

            if result["code_blocks"].get("html"):
                with open(game_dir / "index.html", "w", encoding="utf-8") as f:
                    f.write(result["code_blocks"]["html"][0])

            if result["code_blocks"].get("javascript"):
                with open(game_dir / "game.js", "w", encoding="utf-8") as f:
                    f.write(result["code_blocks"]["javascript"][0])

            with open(game_dir / "description.txt", "w", encoding="utf-8") as f:
                f.write(result["description"])

            with open(game_dir / "metadata.json", "w", encoding="utf-8") as f:
                json.dump(result["meta_data"], f, indent=2)

            print(f"\n{variant.upper()} version generated:")
            print(f"Saved in: {game_dir}")
            print("Files generated:")
            for file in game_dir.glob("*"):
                print(f"- {file.name}")

    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)
