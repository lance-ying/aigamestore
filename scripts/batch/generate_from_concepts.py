#!/usr/bin/env python3
"""
Smart batch game generator that chooses between matter.js and p5.js
based on the 'price' field in the concepts JSON file.

Reads the 'price' field from each game concept:
- "matter", "matterjs" -> uses matter.js generator
- "p5js", "p5" -> uses p5.js generator
- Falls back to auto-detection if price field is missing/invalid
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Optional, TYPE_CHECKING
import re
import os

# Add project root to Python path so we can import llm_interface
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parent.parent  # Go up from scripts/batch/ to project root
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Load environment variables from .env file if it exists
def load_env_file() -> None:
    env_file = project_root / ".env"
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    value = value.strip()
                    # Remove surrounding quotes if present
                    if value and value[0] in ('"', "'") and value[-1] in ('"', "'"):
                        value = value[1:-1]
                    os.environ[key.strip()] = value

load_env_file()

# Try to import LLM interface
if TYPE_CHECKING:
    from llm_interface.model_api import ModelAPI

try:
    from llm_interface.model_api import ModelAPI
    LLM_AVAILABLE = True
except ImportError as e:
    LLM_AVAILABLE = False
    ModelAPI = None  # type: ignore
    print(f"Warning: LLM interface not available ({e}). Will use keyword-based detection only.")
except Exception as e:
    LLM_AVAILABLE = False
    ModelAPI = None  # type: ignore
    print(f"Warning: LLM interface error ({type(e).__name__}: {e}). Will use keyword-based detection only.")


# Keywords that strongly suggest physics engine requirements
PHYSICS_KEYWORDS = [
    # Core physics concepts
    "physics", "gravity", "bounce", "bouncing", "fall", "falling", "collision",
    "swing", "swinging", "roll", "rolling", "throw", "throwing", "drop", "dropping",
    
    # Weight and force
    "weight", "weighted", "trajectory", "pull", "pulling", "push", "pushing",
    "force", "tumble", "tumbling", "topple", "toppling", "knock", "knocking",
    
    # Physics-related verbs
    "retract", "retracting", "accelerate", "decelerate", "slide", "sliding",
    "spin", "spinning", "rotate", "rotating",
    
    # Physics objects
    "pendulum", "projectile", "ballistic", "momentum", "inertia",
    
    # Specific game mechanics
    "claw", "hook", "slingshot", "catapult", "cannon ball",
    "chain reaction", "domino", "stack", "balance",
]

# Keywords that suggest simple 2D is sufficient
SIMPLE_2D_KEYWORDS = [
    "lane", "runner", "endless runner", "side-scroll", "platformer",
    "timing", "tap to", "swipe", "drag", "match",
    "collect", "avoid", "navigate", "steer",
]


def analyze_physics_requirement_llm(
    concept: str,
    name: str,
    model_api: Optional[Any] = None  # ModelAPI when available
) -> Dict[str, Any]:
    """
    Use LLM to analyze if matter.js is needed for complex physics.
    Conservative approach: only recommend matter.js for games that truly need it
    (like Angry Birds with complex physics interactions).
    
    Args:
        concept: Game concept description
        name: Game name
        model_api: Optional ModelAPI instance (will create one if None)
        
    Returns:
        Dict with 'needs_physics' bool, 'reason', and 'confidence'
    """
    if not LLM_AVAILABLE:
        return {
            "needs_physics": False,
            "reason": "LLM not available",
            "confidence": 0.0,
            "source": "llm_unavailable"
        }
    
    if model_api is None:
        if not LLM_AVAILABLE or ModelAPI is None:
            return {
                "needs_physics": False,
                "reason": "LLM not available",
                "confidence": 0.0,
                "source": "llm_unavailable"
            }
        # Use a fast, cheap model for this analysis
        model_name = os.getenv("PHYSICS_DETECTION_MODEL", "google:gemini-2.5-flash")
        model_api = ModelAPI(model_name)
    
    system_prompt = """You are a game development expert. Analyze if a game needs a physics engine (matter.js) or simple 2D graphics (p5.js).

Be CONSERVATIVE - only recommend matter.js for complex physics like Angry Birds.

Use matter.js ONLY for: complex physics simulations, realistic gravity/collisions, destructible environments, chain reactions.

Use p5.js for: platformers, puzzles, turn-based games, card games, simple movement.

Respond with JSON only:
{
  "needs_matter_js": true or false,
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}"""

    user_prompt = f"""Game: {name}

{concept}

Does this need matter.js physics engine or can it use simple p5.js? Be conservative - only matter.js if physics is truly complex."""

    try:
        # Add timeout and retry logic
        max_retries = 2
        retry_delay = 2  # seconds
        
        for attempt in range(max_retries):
            try:
                response = model_api.call(
                    user_prompt=user_prompt,
                    system_prompt=system_prompt,
                    temperature=0.3,  # Lower temperature for more consistent decisions
                    max_tokens=500,
                    verbose=False  # Don't print streaming output
                )
                break  # Success, exit retry loop
            except Exception as e:
                error_str = str(e)
                # Check if it's a rate limit or timeout issue
                if "timeout" in error_str.lower() or "rate" in error_str.lower() or "429" in error_str:
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (attempt + 1)
                        print(f"    ⏳ Rate limit/timeout, waiting {wait_time}s before retry...")
                        time.sleep(wait_time)
                        continue
                # For other errors or final attempt, raise
                raise
        
        # Handle dict response (when thinking=True) or string response
        if isinstance(response, dict):
            response_text = response.get("response", "")
        else:
            response_text = response
        
        # Try to parse JSON from response
        # First, try to extract JSON from markdown code blocks (```json ... ```)
        json_in_code_block = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_in_code_block:
            try:
                json_str = json_in_code_block.group(1).strip()
                result = json.loads(json_str)
                return {
                    "needs_physics": result.get("needs_matter_js", False),
                    "reason": result.get("reasoning", "LLM analysis"),
                    "confidence": result.get("confidence", 0.5),
                    "source": "llm",
                    "raw_response": response_text[:200]
                }
            except (json.JSONDecodeError, AttributeError):
                pass
        
        # Try to find JSON object with needs_matter_js field
        # Use a more robust approach to extract complete JSON
        json_start = response_text.find('{')
        if json_start != -1:
            # Find matching closing brace
            brace_count = 0
            json_end = -1
            for i in range(json_start, len(response_text)):
                if response_text[i] == '{':
                    brace_count += 1
                elif response_text[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        json_end = i + 1
                        break
            
            if json_end > json_start:
                try:
                    json_str = response_text[json_start:json_end]
                    result = json.loads(json_str)
                    if "needs_matter_js" in result:
                        return {
                            "needs_physics": result.get("needs_matter_js", False),
                            "reason": result.get("reasoning", "LLM analysis"),
                            "confidence": result.get("confidence", 0.5),
                            "source": "llm",
                            "raw_response": response_text[:200]
                        }
                except json.JSONDecodeError:
                    pass
        else:
            # Fallback: try to infer from response text
            response_lower = response_text.lower()
            if "matter" in response_lower and ("yes" in response_lower or "true" in response_lower or "needs" in response_lower):
                needs_physics = True
            elif "p5" in response_lower and ("no" in response_lower or "false" in response_lower or "simple" in response_lower):
                needs_physics = False
            else:
                # Default to p5.js if unclear (conservative)
                needs_physics = False
            
            return {
                "needs_physics": needs_physics,
                "reason": f"LLM analysis (parsed from text): {response_text[:100]}",
                "confidence": 0.6,
                "source": "llm_fallback",
                "raw_response": response_text[:200]
            }
            
    except Exception as e:
        error_str = str(e)
        # Check for specific error types
        if "finish_reason" in error_str and "2" in error_str:
            # Content was blocked by safety filters
            return {
                "needs_physics": False,
                "reason": "LLM response blocked by safety filter",
                "confidence": 0.0,
                "source": "llm_blocked",
                "error": "Content blocked (finish_reason: 2)"
            }
        elif "timeout" in error_str.lower():
            return {
                "needs_physics": False,
                "reason": "LLM request timed out",
                "confidence": 0.0,
                "source": "llm_timeout",
                "error": error_str
            }
        else:
            return {
                "needs_physics": False,
                "reason": f"LLM error: {error_str[:100]}",
                "confidence": 0.0,
                "source": "llm_error",
                "error": error_str
            }


def analyze_physics_requirement(concept: str) -> Dict[str, Any]:
    """
    Analyze a game concept to determine if it needs matter.js physics.
    
    Returns:
        Dict with 'needs_physics' bool and 'reason' string
    """
    concept_lower = concept.lower()
    
    # Count physics-related keywords
    physics_score = 0
    found_physics_keywords = []
    
    for keyword in PHYSICS_KEYWORDS:
        if keyword in concept_lower:
            # Weight based on importance
            if keyword in ["physics", "gravity", "bounce", "collision"]:
                physics_score += 3
            else:
                physics_score += 1
            found_physics_keywords.append(keyword)
    
    # Count simple 2D keywords
    simple_score = 0
    found_simple_keywords = []
    
    for keyword in SIMPLE_2D_KEYWORDS:
        if keyword in concept_lower:
            simple_score += 1
            found_simple_keywords.append(keyword)
    
    # Specific patterns that strongly indicate physics
    physics_patterns = [
        r"fall.*gravity",
        r"bounce.*surface",
        r"knock.*over",
        r"chain reaction",
        r"topple.*stack",
        r"physics[-\s]based",
        r"retract.*speed",
        r"trajectory.*arc",
    ]
    
    for pattern in physics_patterns:
        if re.search(pattern, concept_lower):
            physics_score += 5
            found_physics_keywords.append(f"pattern:{pattern}")
    
    # Decision logic
    needs_physics = physics_score >= 3 or (physics_score > 0 and simple_score == 0)
    
    reason = f"Physics score: {physics_score} (keywords: {', '.join(found_physics_keywords[:3])}) | "
    reason += f"Simple score: {simple_score} (keywords: {', '.join(found_simple_keywords[:3])})"
    
    return {
        "needs_physics": needs_physics,
        "physics_score": physics_score,
        "simple_score": simple_score,
        "reason": reason,
        "physics_keywords": found_physics_keywords,
        "simple_keywords": found_simple_keywords,
    }


def generate_game(
    concept: str,
    game_index: int,
    use_matter: bool,
    name: str = None,
    dry_run: bool = False,
    output_folder: str = None
) -> Dict[str, Any]:
    """
    Generate a single game using the appropriate config.
    
    Args:
        concept: Game concept description
        game_index: Index for the game
        use_matter: Whether to use matter.js physics
        name: Game name (optional, for display)
        dry_run: If True, just print command without executing
        output_folder: Custom output folder name under games/
        
    Returns:
        Dict with generation result
    """
    config_file = "configs/generators/matter_gen.yaml" if use_matter else "configs/generators/p5_gen.yaml"
    library = "matter.js" if use_matter else "p5.js"
    
    # Create a temporary concept file
    temp_concept_file = Path(f"temp_concept_{game_index}.txt")
    temp_concept_file.write_text(concept, encoding="utf-8")
    
    cmd = [
        "uv", "run", "python", "generate_game.py",
        "--config", config_file,
        "--concept", str(temp_concept_file),
        "--game_index", str(game_index)
    ]
    
    # Add custom output folder if specified
    if output_folder:
        cmd.extend(["--output_folder", output_folder])
    
    print(f"\n{'='*80}")
    print(f"Game #{game_index}: {name or 'Unnamed'}")
    print(f"Library: {library}")
    print(f"Concept preview: {concept[:100]}...")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*80}\n")
    
    if dry_run:
        temp_concept_file.unlink()
        return {
            "game_index": game_index,
            "name": name,
            "library": library,
            "status": "dry_run",
        }
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout
        )
        
        # Clean up temp file
        temp_concept_file.unlink()
        
        if result.returncode == 0:
            output_dir = result.stdout.strip().split('\n')[-1]
            print(f"✓ Successfully generated: {output_dir}")
            return {
                "game_index": game_index,
                "name": name,
                "library": library,
                "status": "success",
                "output_dir": output_dir,
            }
        else:
            print(f"✗ Failed to generate game #{game_index}")
            print(f"Error: {result.stderr}")
            return {
                "game_index": game_index,
                "name": name,
                "library": library,
                "status": "failed",
                "error": result.stderr,
            }
    except subprocess.TimeoutExpired:
        temp_concept_file.unlink()
        print(f"✗ Timeout generating game #{game_index}")
        return {
            "game_index": game_index,
            "name": name,
            "library": library,
            "status": "timeout",
        }
    except Exception as e:
        if temp_concept_file.exists():
            temp_concept_file.unlink()
        print(f"✗ Exception generating game #{game_index}: {e}")
        return {
            "game_index": game_index,
            "name": name,
            "library": library,
            "status": "exception",
            "error": str(e),
        }


def main():
    parser = argparse.ArgumentParser(
        description="Smart batch game generator with automatic physics library selection"
    )
    parser.add_argument(
        "--concepts",
        type=str,
        default="game_concepts.json",
        help="Path to game concepts JSON file"
    )
    parser.add_argument(
        "--start-index",
        type=int,
        default=0,
        help="Starting game index - skips to this index in concepts file AND uses it for game numbering (e.g., 15 starts at concept #15, creates game_0015)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of games to generate after start-index"
    )
    parser.add_argument(
        "--skip",
        type=int,
        default=0,
        help="DEPRECATED: Use --start-index instead. Skip first N games in the concepts file"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Analyze concepts and show commands without executing"
    )
    parser.add_argument(
        "--analyze-only",
        action="store_true",
        help="Only analyze physics requirements, don't generate"
    )
    parser.add_argument(
        "--force-matter",
        action="store_true",
        help="Force all games to use matter.js"
    )
    parser.add_argument(
        "--force-p5",
        action="store_true",
        help="Force all games to use p5.js only"
    )
    parser.add_argument(
        "--output-analysis",
        type=str,
        help="Save physics analysis to JSON file"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        help="Custom output directory name under games/ (e.g., 'ios_games', 'public_platform')"
    )
    parser.add_argument(
        "--use-llm",
        action="store_true",
        help="Use LLM to analyze physics requirements (more accurate, slower)"
    )
    parser.add_argument(
        "--llm-model",
        type=str,
        default="google:gemini-2.5-flash",
        help="LLM model to use for physics detection (default: google:gemini-2.5-flash)"
    )
    parser.add_argument(
        "--llm-delay",
        type=float,
        default=2.0,
        help="Delay in seconds between LLM API calls to avoid rate limiting (default: 2.0)"
    )
    
    args = parser.parse_args()
    
    # Load concepts
    concepts_path = Path(args.concepts)
    if not concepts_path.exists():
        print(f"Error: Concepts file not found: {args.concepts}")
        return 1
    
    with open(concepts_path, "r", encoding="utf-8") as f:
        concepts_data = json.load(f)
    
    total_concepts = len(concepts_data)
    
    # Apply start-index (skip to that index and use it for numbering)
    # Also support legacy --skip parameter
    skip_count = max(args.start_index, args.skip)
    if skip_count > 0:
        if skip_count >= total_concepts:
            print(f"Error: Start index {skip_count} is beyond the total concepts ({total_concepts})")
            return 1
        concepts_data = concepts_data[skip_count:]
        print(f"Skipping to index {skip_count} (skipped {skip_count} concepts)")
    
    # Apply limit
    if args.limit:
        concepts_data = concepts_data[:args.limit]
    
    print(f"Loaded {len(concepts_data)} game concepts (from total of {total_concepts})")
    if skip_count > 0:
        print(f"Starting from index {skip_count}, generating games {skip_count} to {skip_count + len(concepts_data) - 1}")
    
    # Initialize LLM if requested
    model_api = None
    if args.use_llm:
        if not LLM_AVAILABLE:
            print("Error: LLM interface not available. Install required packages or use --no-use-llm")
            return 1
        print(f"Using LLM for physics detection: {args.llm_model}")
        model_api = ModelAPI(args.llm_model)
    
    # Analyze all concepts
    analysis_results = []
    generation_results = []
    
    for i, game_data in enumerate(concepts_data):
        # game_index reflects actual position in original file (after skipping)
        game_index = skip_count + i
        concept = game_data.get("concept", "")
        name = game_data.get("name", f"Game {game_index}")
        price_field = game_data.get("price", "").lower()
        
        # Analyze physics requirements
        # First do keyword-based analysis (for reference)
        keyword_analysis = analyze_physics_requirement(concept)
        
        # Then do LLM analysis if requested
        llm_analysis = None
        if args.use_llm and model_api:
            print(f"  🤖 Analyzing with LLM...")
            llm_analysis = analyze_physics_requirement_llm(concept, name, model_api)
            # Add a delay between LLM calls to avoid rate limiting
            # Longer delay if we got a blocked response
            if llm_analysis and llm_analysis.get("source") == "llm_blocked":
                delay = args.llm_delay * 1.5  # Longer delay after blocked content
            else:
                delay = args.llm_delay  # Use configured delay
            if i < len(concepts_data) - 1:  # Don't delay after last item
                time.sleep(delay)
        
        # Combine analyses
        analysis = {
            "game_index": game_index,
            "name": name,
            "price_field": price_field,
            "keyword_analysis": keyword_analysis,
        }
        if llm_analysis:
            analysis["llm_analysis"] = llm_analysis
        
        # Determine library choice (priority order)
        if args.force_matter:
            use_matter = True
            analysis["override"] = "forced matter.js"
            analysis["source"] = "force-matter flag"
        elif args.force_p5:
            use_matter = False
            analysis["override"] = "forced p5.js"
            analysis["source"] = "force-p5 flag"
        else:
            # Priority 1: Check price field for explicit override
            if price_field in ["matter", "matterjs", "matter.js"]:
                use_matter = True
                analysis["source"] = "price field (matter)"
            elif price_field in ["p5js", "p5", "p5.js"]:
                use_matter = False
                analysis["source"] = "price field (p5js)"
            # Priority 2: Use LLM analysis if available
            elif args.use_llm and llm_analysis:
                llm_source = llm_analysis.get("source", "")
                if llm_source not in ["llm_error", "llm_unavailable", "llm_blocked", "llm_timeout"]:
                    use_matter = llm_analysis.get("needs_physics", False)
                    confidence = llm_analysis.get("confidence", 0.5)
                    analysis["source"] = f"LLM (confidence: {confidence:.2f})"
                    analysis["llm_reason"] = llm_analysis.get("reason", "")
                else:
                    # LLM failed, fall back to keyword-based
                    use_matter = keyword_analysis["needs_physics"]
                    source_desc = llm_source.replace("llm_", "")
                    analysis["source"] = f"keyword-based (LLM {source_desc})"
            # Priority 3: Fallback to keyword-based detection
            else:
                use_matter = keyword_analysis["needs_physics"]
                analysis["source"] = "keyword-based (fallback)"
        
        analysis["selected_library"] = "matter.js" if use_matter else "p5.js"
        analysis_results.append(analysis)
        
        # Print analysis
        print(f"\n[{game_index}] {name}")
        print(f"  Price Field: {price_field}")
        print(f"  Source: {analysis.get('source', 'N/A')}")
        if 'llm_reason' in analysis:
            print(f"  LLM Reasoning: {analysis['llm_reason'][:100]}...")
        if 'llm_analysis' in analysis and 'error' in analysis['llm_analysis']:
            print(f"  ⚠️  LLM Error: {analysis['llm_analysis']['error']}")
        print(f"  Decision: {'🔬 matter.js' if use_matter else '🎨 p5.js'}")
        if 'override' in analysis:
            print(f"  Override: {analysis['override']}")
        
        # Generate if not analyze-only
        if not args.analyze_only:
            result = generate_game(
                concept=concept,
                game_index=game_index,
                use_matter=use_matter,
                name=name,
                dry_run=args.dry_run,
                output_folder=args.output_dir
            )
            generation_results.append(result)
    
    # Save analysis if requested
    if args.output_analysis:
        output_path = Path(args.output_analysis)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(analysis_results, f, indent=2)
        print(f"\n✓ Analysis saved to: {output_path}")
    
    # Summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    print(f"Total concepts in file: {total_concepts}")
    print(f"Concepts processed: {len(analysis_results)}")
    if skip_count > 0:
        print(f"Started from index: {skip_count}")
        print(f"Game indices: {skip_count} to {skip_count + len(analysis_results) - 1}")
    if args.output_dir:
        print(f"Output directory: games/{args.output_dir}")
    
    matter_count = sum(1 for a in analysis_results if a["selected_library"] == "matter.js")
    p5_count = sum(1 for a in analysis_results if a["selected_library"] == "p5.js")
    
    print(f"Matter.js games: {matter_count}")
    print(f"P5.js games: {p5_count}")
    
    if generation_results and not args.analyze_only:
        success_count = sum(1 for r in generation_results if r["status"] == "success")
        failed_count = sum(1 for r in generation_results if r["status"] == "failed")
        timeout_count = sum(1 for r in generation_results if r["status"] == "timeout")
        
        print(f"\nGeneration Results:")
        print(f"  ✓ Success: {success_count}")
        print(f"  ✗ Failed: {failed_count}")
        print(f"  ⏱ Timeout: {timeout_count}")
    
    print(f"{'='*80}\n")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

