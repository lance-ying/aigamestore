"""
Meta-Evaluator: Generates custom evaluation strategies based on game concepts.

This module analyzes game concepts and creates tailored evaluation criteria,
test scenarios, and prompts for each specific game type.
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Optional
import os

try:
    from google import genai
    from google.genai import types
except Exception:
    genai = None
    types = None


class MetaEvaluator:
    """Generates custom evaluation strategies for games based on their concepts."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY required")
        if genai is None:
            raise ImportError("google-genai required")
        
        self.client = genai.Client(api_key=self.api_key)
        self.model = model
    
    def load_game_concept(self, game_path: str) -> Optional[Dict]:
        """Load game concept from metadata.json."""
        metadata_path = Path(game_path) / "metadata.json"
        if not metadata_path.exists():
            return None
        
        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            concept = metadata.get('game_info', {}).get('concept')
            if isinstance(concept, str):
                return json.loads(concept)
            return concept
        except Exception as e:
            print(f"Warning: Could not load concept: {e}")
            return None
    
    def generate_test_strategy(self, game_concept: Dict) -> Dict[str, Any]:
        """Generate custom evaluation strategy based on game concept."""
        
        game_name = game_concept.get('game_name', 'Unknown Game')
        genre = game_concept.get('genre', 'Unknown')
        mechanics = game_concept.get('core_mechanics', '')
        controls = game_concept.get('control_scheme', '')
        win_conditions = game_concept.get('win_conditions', '')
        lose_conditions = game_concept.get('lose_conditions', '')
        
        prompt = f"""You are a game QA expert. Analyze this game and create a comprehensive evaluation strategy.

Game: {game_name}
Genre: {genre}

Core Mechanics: {mechanics}
Controls: {controls}
Win Conditions: {win_conditions}
Lose Conditions: {lose_conditions}

Generate a JSON evaluation strategy with:

1. **test_scenarios**: List 3-5 specific things to test (e.g., "piece movement", "collision detection", "scoring")
   - Each with: name, description, expected_behavior, key_presses (array of keys to simulate)

2. **critical_checks**: What MUST work for this game type (e.g., for puzzle: "pieces must move", for shooter: "bullets must fire")

3. **evaluation_focus**: What to prioritize when watching gameplay videos (2-3 sentences)

4. **genre_specific_tests**: Special tests for this genre (e.g., match-3: check match detection, platformer: check jump physics)

5. **video_recording_duration**: Recommended seconds (5-20) based on game complexity

Format as JSON:
{{
  "game_name": "{game_name}",
  "genre": "{genre}",
  "test_scenarios": [
    {{
      "name": "test_name",
      "description": "What this tests",
      "expected_behavior": "What should happen",
      "key_presses": ["ArrowUp", "Space", "ArrowLeft"]
    }}
  ],
  "critical_checks": ["Check 1", "Check 2", "Check 3"],
  "evaluation_focus": "When evaluating, focus on...",
  "genre_specific_tests": ["Genre-specific test 1", "Genre-specific test 2"],
  "video_recording_duration": 10
}}

Respond ONLY with valid JSON, no markdown formatting."""
        
        try:
            contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt)])]
            cfg = types.GenerateContentConfig(response_mime_type="text/plain")
            resp = self.client.models.generate_content(model=self.model, contents=contents, config=cfg)
            
            response_text = resp.text.strip()
            
            # Clean up markdown formatting if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            strategy = json.loads(response_text.strip())
            return strategy
            
        except Exception as e:
            print(f"Error generating test strategy: {e}")
            return self._default_strategy(game_name, genre)
    
    def _default_strategy(self, game_name: str, genre: str) -> Dict[str, Any]:
        """Fallback strategy if AI generation fails."""
        return {
            "game_name": game_name,
            "genre": genre,
            "test_scenarios": [
                {
                    "name": "basic_interaction",
                    "description": "Test basic player input",
                    "expected_behavior": "Game should respond to keyboard inputs",
                    "key_presses": ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]
                }
            ],
            "critical_checks": [
                "Game loads without errors",
                "Player can start playing",
                "Controls are responsive"
            ],
            "evaluation_focus": "Check if the game loads, starts, and responds to basic inputs.",
            "genre_specific_tests": ["Test core gameplay loop"],
            "video_recording_duration": 10
        }
    
    def create_custom_evaluation_prompt(self, strategy: Dict[str, Any], test_scenario: Dict[str, str]) -> str:
        """Create a custom evaluation prompt based on the test strategy."""
        
        game_name = strategy.get('game_name', 'Unknown')
        evaluation_focus = strategy.get('evaluation_focus', '')
        critical_checks = strategy.get('critical_checks', [])
        
        test_name = test_scenario.get('name', 'test')
        test_description = test_scenario.get('description', '')
        expected_behavior = test_scenario.get('expected_behavior', '')
        
        prompt = f"""You are evaluating the gameplay of: {game_name}

Test Scenario: {test_name}
Description: {test_description}
Expected Behavior: {expected_behavior}

{evaluation_focus}

Critical Requirements (MUST work):
{chr(10).join(f"- {check}" for check in critical_checks)}

Watch the gameplay video and evaluate:

1. **Does the game load and render properly?**
   - Score: PASS / FAIL
   - Details: What you observe

2. **Do the controls work as expected?**
   - Score: PASS / PARTIAL / FAIL
   - Details: Which inputs work, which don't

3. **Does this specific test scenario work?**
   - Expected: {expected_behavior}
   - Actual: What happened in the video
   - Score: PASS / PARTIAL / FAIL

4. **Are there any bugs or issues?**
   - Visual glitches?
   - Logic errors?
   - Performance problems?

5. **Overall Assessment**
   - Can a player actually play this game?
   - Does it meet the critical requirements above?
   - Final verdict: PASS / NEEDS_WORK / BROKEN

Provide specific, actionable feedback based on what you see in the video."""
        
        return prompt
    
    def save_strategy(self, game_path: str, strategy: Dict[str, Any]) -> None:
        """Save the generated strategy to the game's evaluation directory."""
        eval_dir = Path(game_path) / "evaluations" / "vlm_evaluations"
        eval_dir.mkdir(parents=True, exist_ok=True)
        
        strategy_file = eval_dir / "test_strategy.json"
        with open(strategy_file, 'w') as f:
            json.dump(strategy, f, indent=2)
        
        print(f"  ✓ Saved test strategy to {strategy_file}")


def generate_evaluation_strategy(game_path: str, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Convenience function to generate evaluation strategy for a game.
    
    Args:
        game_path: Path to game directory
        api_key: Optional Gemini API key (uses env var if not provided)
    
    Returns:
        Generated test strategy dict, or None if failed
    """
    try:
        meta_eval = MetaEvaluator(api_key=api_key)
        
        # Load game concept
        concept = meta_eval.load_game_concept(game_path)
        if not concept:
            print(f"  Warning: No concept found for {game_path}, using default strategy")
            return None
        
        # Generate strategy
        print(f"  Generating custom evaluation strategy...")
        strategy = meta_eval.generate_test_strategy(concept)
        
        # Save strategy
        meta_eval.save_strategy(game_path, strategy)
        
        return strategy
        
    except Exception as e:
        print(f"  Error in meta-evaluator: {e}")
        return None


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python meta_evaluator.py <game_path>")
        sys.exit(1)
    
    game_path = sys.argv[1]
    strategy = generate_evaluation_strategy(game_path)
    
    if strategy:
        print("\nGenerated Strategy:")
        print(json.dumps(strategy, indent=2))
    else:
        print("Failed to generate strategy")

