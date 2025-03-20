from pathlib import Path
import os
import re
import random
from typing import Tuple, Optional, Dict, List
from dataclasses import dataclass
from prompt import GAME_PROMPT_NO_ECS, GAME_PROMPT_ECS, GAME_REVIEW_PROMPT
import argparse
import json
import time
import datetime


VALID_GENRES = [
    "action", "arcade", "platformer", "sports",
    "stealth", "strategy", "puzzle", "shooting",
    "racing", "adventure"
]


@dataclass
class ModelConfig:
    """Model configuration data class"""
    model_name: str
    
    @property
    def model_id(self) -> str:
        """Get the actual model ID for API calls"""
        MODEL_MAPPING = {
            "o3-mini": "o3-mini",
            "gpt-4o": "gpt-4o",
            "claude-3.7": "claude-3-7-sonnet-20250219",
            "gemini-2.0": "gemini-2.0-flash-exp",
        }
        return MODEL_MAPPING.get(self.model_name, self.model_name)



class SimpleCodeGenerator:
    """Simple code generator that supports multiple AI models"""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        self._init_client()
    
    def _init_client(self):
        """Initialize API clients for different models"""
        if self.config.model_name.startswith("gpt") or self.config.model_name.startswith("o3"):
            try:
                from openai import OpenAI
                if not os.environ.get("OPENAI_API_KEY"):
                    raise RuntimeError("OPENAI_API_KEY environment variable is not set")
                self.client = OpenAI()
            except ImportError:
                raise RuntimeError("OpenAI Python package is not installed")
                
        elif self.config.model_name.startswith("claude"):
            try:
                from anthropic import Anthropic
                if not os.environ.get("ANTHROPIC_API_KEY"):
                    raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")
                self.client = Anthropic()
            except ImportError:
                raise RuntimeError("Anthropic Python package is not installed")
                
        elif self.config.model_name.startswith("gemini"):
            try:
                import google.generativeai as genai
                if not os.environ.get("GOOGLE_API_KEY"):
                    raise RuntimeError("GOOGLE_API_KEY environment variable is not set")
                genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
                self.client = genai
            except ImportError:
                raise RuntimeError("Google GenerativeAI Python package is not installed")
        else:
            raise ValueError(f"Unsupported model: {self.config.model_name}")

    def generate_response(self, prompt: str) -> str:
        """Generate response using the specified model"""
        try:
            if self.config.model_name.startswith(("gpt", "o3")):
                response = self.client.chat.completions.create(
                    model=self.config.model_id,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.choices[0].message.content

            elif self.config.model_name.startswith("claude"):
                response = self.client.messages.create(
                    model=self.config.model_id,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text

            elif self.config.model_name.startswith("gemini"):
                model = self.client.GenerativeModel(self.config.model_id)
                response = model.generate_content(prompt)
                # Handle Gemini's response properly
                if hasattr(response, 'text'):
                    return str(response.text)
                elif hasattr(response, 'parts'):
                    return str(response.parts[0].text)
                else:
                    return str(response)
        except Exception as e:
            print(f"Error in generate_response: {str(e)}")
            return ""

    def parse_code_blocks(self, response_text: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract code blocks from the response"""
        # Look for code blocks with specific language tags
        code_blocks = {}
        languages = ['python', 'javascript', 'html', 'css']
        
        for lang in languages:
            pattern = f"```{lang}\s*(.*?)```"
            matches = re.findall(pattern, response_text, re.DOTALL)
            if matches:
                code_blocks[lang] = [match.strip() for match in matches]
        
        return code_blocks

    def generate_game(self, genre: str, num_players: int, use_ecs: bool = False) -> Dict[str, any]:
        """
        Generate a game based on genre and number of players
        Returns a dictionary containing the response, parsed code blocks, and generation info
        """
        if genre.lower() not in VALID_GENRES:
            raise ValueError(f"Invalid genre. Must be one of: {', '.join(VALID_GENRES)}")
        
        if not isinstance(num_players, int) or num_players < 1:
            raise ValueError("Number of players must be a positive integer")
        
        # Select appropriate prompt template
        prompt_template = GAME_PROMPT_ECS if use_ecs else GAME_PROMPT_NO_ECS
        
        # Format the prompt with the given parameters
        prompt = prompt_template.format(
            genre=genre,
            num_players=num_players
        )
        
        # Generate response
        response = self.generate_response(prompt)

        #print prompt in green, response in yellow
        print(f"\033[92m{prompt}\033[0m")
        print(f"\033[93m{response}\033[0m")
        import pdb; pdb.set_trace()
        
        # Parse the response
        code_blocks = self.parse_code_blocks(response)
        description = self._extract_description(response)
        title = self._extract_title(response)
        
        # Add generation info
        from datetime import datetime
        meta_data = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
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
            "raw_response": response,
            "meta_data": meta_data
        }

    def review_game(self, code: str) -> str:
        """Review a game's code using the review prompt"""
        prompt = GAME_REVIEW_PROMPT.format(code=code)
        return self.generate_response(prompt)

    def _extract_description(self, response_text: str) -> Optional[str]:
        """Extract description from the response"""
        desc_match = re.search(r"```description\s*(.*?)```", response_text, re.DOTALL)
        return desc_match.group(1).strip() if desc_match else None

    def _extract_title(self, response_text: str) -> str:
        """Extract game title from the response"""
        title_match = re.search(r"GAME TITLE:\s*(.*?)(?:\n|$)", response_text, re.IGNORECASE)
        return title_match.group(1).strip() if title_match else "Untitled Game"

def parse_args():
    parser = argparse.ArgumentParser(description="Generate a game using AI")
    parser.add_argument("--model", type=str, default="o3-mini", help="Model to use (o3-mini, gpt-4, claude-3, gemini-pro)")
    parser.add_argument("--use-ecs", action="store_true", help="Use ECS architecture")
    parser.add_argument("--genre", type=str, default="arcade", help="Genre of the game")
    parser.add_argument("--num-players", type=int, default=2, help="Number of players")
    parser.add_argument("--output-dir", type=str, default="games", help="Output directory")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    try:
        # Initialize the generator
        config = ModelConfig(model_name=args.model)
        generator = SimpleCodeGenerator(config)

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
