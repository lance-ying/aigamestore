#!/usr/bin/env python3
"""
Smart batch game generator that automatically chooses between matter.js and p5.js
based on the game concept's physics requirements.
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Any
import re


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
    dry_run: bool = False
) -> Dict[str, Any]:
    """
    Generate a single game using the appropriate config.
    
    Args:
        concept: Game concept description
        game_index: Index for the game
        use_matter: Whether to use matter.js physics
        name: Game name (optional, for display)
        dry_run: If True, just print command without executing
        
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
        help="Starting game index (for game numbering)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of games to generate"
    )
    parser.add_argument(
        "--skip",
        type=int,
        default=0,
        help="Skip first N games in the concepts file"
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
    
    args = parser.parse_args()
    
    # Load concepts
    concepts_path = Path(args.concepts)
    if not concepts_path.exists():
        print(f"Error: Concepts file not found: {args.concepts}")
        return 1
    
    with open(concepts_path, "r", encoding="utf-8") as f:
        concepts_data = json.load(f)
    
    # Apply skip and limit
    if args.skip > 0:
        concepts_data = concepts_data[args.skip:]
    if args.limit:
        concepts_data = concepts_data[:args.limit]
    
    print(f"Loaded {len(concepts_data)} game concepts")
    
    # Analyze all concepts
    analysis_results = []
    generation_results = []
    
    for i, game_data in enumerate(concepts_data):
        game_index = args.start_index + i
        concept = game_data.get("concept", "")
        name = game_data.get("name", f"Game {game_index}")
        
        # Analyze physics requirements
        analysis = analyze_physics_requirement(concept)
        analysis["game_index"] = game_index
        analysis["name"] = name
        
        # Determine library choice
        if args.force_matter:
            use_matter = True
            analysis["override"] = "forced matter.js"
        elif args.force_p5:
            use_matter = False
            analysis["override"] = "forced p5.js"
        else:
            use_matter = analysis["needs_physics"]
        
        analysis["selected_library"] = "matter.js" if use_matter else "p5.js"
        analysis_results.append(analysis)
        
        # Print analysis
        print(f"\n[{game_index}] {name}")
        print(f"  Physics Score: {analysis['physics_score']} | Simple Score: {analysis['simple_score']}")
        print(f"  Decision: {'🔬 matter.js' if use_matter else '🎨 p5.js'}")
        print(f"  Reason: {analysis['reason']}")
        
        # Generate if not analyze-only
        if not args.analyze_only:
            result = generate_game(
                concept=concept,
                game_index=game_index,
                use_matter=use_matter,
                name=name,
                dry_run=args.dry_run
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
    print(f"Total concepts analyzed: {len(analysis_results)}")
    
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

