from pathlib import Path
import os
import re
import random
from typing import Tuple, Optional, Dict, List
from dataclasses import dataclass
from prompt import GAME_DESCRIPTION_PROMPT, GAME_CODE_PROMPT_NO_ECS, GAME_CODE_PROMPT_ECS
import argparse
import json
import time
import datetime
from code_generator import SimpleCodeGenerator, ModelConfig, VALID_GENRES, parse_args

class TwoStepCodeGenerator(SimpleCodeGenerator):
    """Code generator that generates description and code in two separate steps"""
    
    def generate_game(self, genre: str, num_players: int, use_ecs: bool = False) -> Dict[str, any]:
        """
        Generate a game in two steps:
        1. Generate game description and title
        2. Generate game code based on the description
        """
        if genre.lower() not in VALID_GENRES:
            raise ValueError(f"Invalid genre. Must be one of: {', '.join(VALID_GENRES)}")
        
        if not isinstance(num_players, int) or num_players < 1:
            raise ValueError("Number of players must be a positive integer")
        
        print("\nStep 1: Generating game description...")
        # First prompt for description
        description_prompt = GAME_DESCRIPTION_PROMPT.format(
            genre=genre,
            num_players=num_players
        )
        
        #print prompt in green, response in yellow
        print(f"\033[92m{description_prompt}\033[0m")
        description_response = self.generate_response(description_prompt)
        print(f"\033[93m{description_response}\033[0m")
        
        # Extract title and description
        title = self._extract_title(description_response)
        description = self._extract_description(description_response)
        
        if not description:
            raise ValueError("Failed to generate game description")
        
        print("\nStep 2: Generating game code...")
        # Second prompt for code, including the description
        if use_ecs:
            code_prompt = GAME_CODE_PROMPT_ECS.format(
                genre=genre,
                num_players=num_players,
                title=title,
                description=description,
                use_ecs=use_ecs
            )
        else:
            code_prompt = GAME_CODE_PROMPT_NO_ECS.format(
                genre=genre,
                num_players=num_players,
                title=title,
                description=description,
                use_ecs=use_ecs
            )
        
        #print prompt in green, response in yellow
        print(f"\033[92m{code_prompt}\033[0m")
        code_response = self.generate_response(code_prompt)
        print(f"\033[93m{code_response}\033[0m")
        
        # Parse code blocks
        code_blocks = self.parse_code_blocks(code_response)
        
        # Add generation info
        meta_data = {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "model": self.config.model_name,
            "model_id": self.config.model_id,
            "genre": genre,
            "num_players": num_players,
            "use_ecs": use_ecs
        }
        
        return {
            "title": title,
            "description": description,
            "code_blocks": code_blocks,
            "raw_response": {
                "description": description_response,
                "code": code_response
            },
            "meta_data": meta_data
        }

if __name__ == "__main__":
    args = parse_args()
    try:
        # Initialize the generator
        config = ModelConfig(model_name=args.model)
        generator = TwoStepCodeGenerator(config)

        # Generate a game
        result = generator.generate_game(
            genre=args.genre,
            num_players=args.num_players,
            use_ecs=args.use_ecs
        )
        
        # Create safe title for directory name (replace spaces with underscores and remove special chars)
        safe_title = re.sub(r'[^a-zA-Z0-9_]', '', result['title'].replace(' ', '_')).lower()
        
        # Create games directory if it doesn't exist
        games_dir = Path(args.output_dir)
        games_dir.mkdir(parents=True, exist_ok=True)
        
        # Create game directory
        if args.use_ecs:
            game_dir = games_dir / "ecs" / args.genre / safe_title
        else:
            game_dir = games_dir / "no_ecs" / args.genre / safe_title
        game_dir.mkdir(parents=True, exist_ok=True)
        
        # Save files
        if result['code_blocks'].get('html'):
            with open(game_dir / "index.html", "w", encoding='utf-8') as f:
                f.write(result['code_blocks']['html'][0])
                
        if result['code_blocks'].get('javascript'):
            with open(game_dir / "game.js", "w", encoding='utf-8') as f:
                f.write(result['code_blocks']['javascript'][0])
        
        # Save description
        if result['description']:
            with open(game_dir / "description.txt", "w", encoding='utf-8') as f:
                f.write(result['description'])
        
        # Save metadata
        if result['meta_data']:
            with open(game_dir / "metadata.json", "w", encoding='utf-8') as f:
                json.dump(result['meta_data'], f, indent=2)
        
        # Print results
        print(f"\nGame generated successfully!")
        print(f"Title: {result['title']}")
        print(f"Saved in: {game_dir}")
        print("\nFiles generated:")
        for file in game_dir.glob("*"):
            print(f"- {file.name}")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)