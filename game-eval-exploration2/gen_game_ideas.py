#!/usr/bin/env python3
"""
Minimal game idea generator for short-session concepts.

Outputs only: genre, subgenre, theme.

Usage examples:
  - Text: python generate_ideas.py -n 3
  - Deterministic: python generate_ideas.py -n 3 --seed 42
  - JSON: python generate_ideas.py -n 10 --json
"""

import argparse
import json
from pathlib import Path
import random


# Refined, micro-session friendly mapping
GENRE_SUBGENRES = {
    "Arcade": [
        "Time Attack",
        "One-Button",
        "Avoider",
        "Tapper",
        "Lane Switch",
        "Chain Combo",
    ],
    "Action": [
        "Dodge and Collect",
        "Dash Attack",
        "Arena Micro",
        "Boss Rush Mini",
        "Reaction Gauntlet",
    ],
    "Adventure": [
        "Room Escape",
        "Fetch and Return",
        "Point-and-Click Micro",
        "Exploration Vignette",
    ],
    "Puzzle": [
        "Match-3 Micro",
        "Sokoban Lite",
        "Sliding Mini",
        "Logic Micro",
        "Pipe Connect",
        "Nonogram Bite",
    ],
    "Puzzle Platformer": [
        "Switch Flip",
        "Crate Micro",
        "Gravity Toggle",
        "Portal Lite",
        "Color Swap",
    ],
    "Platformer": [
        "Auto-Runner",
        "Precision Micro",
        "Vertical Climb",
        "Single Screen",
        "Bounce Jump",
    ],
    "Shooter": [
        "Twin-Stick Micro",
        "Gallery",
        "Bullet Hell Micro",
        "Lightgun Style",
        "Lock-On Dash",
    ],
    "Racing": [
        "Time Trial",
        "Drift Mini",
        "Obstacle Dash",
        "Drag Sprint",
        "Gate Slalom",
    ],
    "Strategy": [
        "Tower Defense Micro",
        "Auto-Battler Micro",
        "Micro RTS",
        "Lane Control",
        "Area Capture",
    ],
    "Tactics": [
        "One Squad",
        "Lane Skirmish",
        "Grid Duel",
        "King of the Hill Micro",
        "Capture and Hold",
    ],
    "Stealth": [
        "Line-of-Sight Micro",
        "Sneak and Grab",
        "Shadow Hop",
    ],
    "Sports": [
        "Penalty Shootout",
        "Free Throw",
        "Mini Golf Hole",
        "Table Rally",
        "Target Practice",
    ],
    "Fighting": [
        "1v1 Strike",
        "Platform Fighter Micro",
        "Arena Tag-In",
        "Combo Trial",
    ],
    "Beat 'em Up": [
        "Side-Scroll Micro",
        "Wave Clear",
        "Boss Room",
        "Crowd Control",
    ],
    "Horror": [
        "Escape the Room",
        "Chase Micro",
        "Light Resource Panic",
    ],
    "Survival": [
        "Wave Endurance",
        "Resource Juggle",
        "Shelter Micro",
        "Quick Craft and Last",
    ],
    "Simulation": [
        "Cooking Quickfire",
        "Bartending Blitz",
        "Repair Rush",
        "Checkout Dash",
    ],
    "Management": [
        "Queue Manager",
        "Line Cooking",
        "Airport Desk",
        "Hospital Triage",
        "Factory Timing",
    ],
    "Roguelite": [
        "One Room",
        "Single Floor",
        "Boss Rush Micro",
        "Draft and Dash",
    ],
    "Narrative": [
        "Dialog Puzzle",
        "Micro Mystery",
        "Deduction Flash",
        "Moral Snap-Choice",
    ],
    "Party": [
        "Microgame",
        "Reflex Duel",
        "Hot Potato",
        "Button Mash Relay",
    ],
    
    "Trivia": [
        "Rapid Fire",
        "Multiple Choice Sprint",
        "Picture Quiz",
        "Speed True/False",
    ],
    
    
    "Physics": [
        "Ragdoll Toss",
        "Angle and Power",
        "Domino Setup",
        "Stack Builder",
        "Rope Swing",
    ],
    
    "Hidden Object": [
        "Find 5",
        "Spot the Difference",
        "Silhouette Hunt",
        "Timed Scavenger",
    ],
    "Pinball": [
        "Single Table Challenge",
        "Target Rush",
        "Multiball Micro",
        "Ramp Combo",
    ],
}


THEMES = [
    "Sci-Fi",
    "Fantasy",
    "Cyberpunk",
    "Medieval",
    "Underwater",
    "Outer Space",
    "Post-Apocalyptic",
    "Prehistoric",
    "Haunted",
    "Pirate",
    "Steampunk",
    "Western",
    "High School",
    "Kitchen",
    "Office",
    "Garden",
    "Insect World",
    "Microbe Scale",
    "Time Travel",
    "Candyland",
    "Sushi Bar",
    "Cats",
    "Dogs",
    "Robots",
    "Aliens",
    "Ninjas",
    "Wizards",
    "Vampires",
    "Zombies",
    "Ancient Ruins",
    "Lava Caves",
]


def count_subgenres(genre: str | None = None, mapping: dict[str, list[str]] | None = None) -> int:
    """Count the number of subgenres.

    If genre is provided, returns the number of subgenres under that genre.
    Otherwise, returns the total number of subgenres across all genres.

    The optional mapping parameter allows overriding the source dictionary.
    """
    dictionary: dict[str, list[str]] = mapping if mapping is not None else GENRE_SUBGENRES
    if genre is None:
        return sum(len(subgenres) for subgenres in dictionary.values())
    return len(dictionary.get(genre, []))


def generate_idea(rng: random.Random) -> dict[str, str]:
    genre: str = rng.choice(list(GENRE_SUBGENRES.keys()))
    subgenre: str = rng.choice(GENRE_SUBGENRES[genre])
    theme: str = rng.choice(THEMES)
    return {"genre": genre, "subgenre": subgenre, "theme": theme}


def generate_unique_ideas(rng: random.Random, count: int) -> list[dict[str, str]]:
    """Generate unique (genre, subgenre, theme) ideas without replacement.

    Builds all possible combinations and randomly samples up to 'count'.
    """
    all_combinations: list[dict[str, str]] = []
    for genre, subgenres in GENRE_SUBGENRES.items():
        for sub in subgenres:
            for theme in THEMES:
                all_combinations.append({"genre": genre, "subgenre": sub, "theme": theme})

    if count >= len(all_combinations):
        # Shuffle deterministically using provided RNG and return all
        all_combinations_copy = list(all_combinations)
        rng.shuffle(all_combinations_copy)
        return all_combinations_copy

    return rng.sample(all_combinations, count)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate game ideas")
    parser.add_argument("--count", type=int, default=10, help="Number of ideas to generate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--output", type=str, default="ideas.json", help="Output file path")
    
    args = parser.parse_args()
    
    rng = random.Random(args.seed)
    ideas = generate_unique_ideas(rng, args.count)

    output_path = args.output if args.output else "all_ideas.json"
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(ideas, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(ideas)} ideas to {output_path}")
    
    # Also save individual idea files for easier processing
    if args.output:
        ideas_dir = output_path.parent / "ideas"
        ideas_dir.mkdir(exist_ok=True)
        for i, idea in enumerate(ideas):
            idea_file = ideas_dir / f"game_{i:04d}.json"
            with open(idea_file, "w", encoding="utf-8") as f:
                json.dump(idea, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()


