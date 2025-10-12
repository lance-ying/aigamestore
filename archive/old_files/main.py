#!/usr/bin/env python3
import argparse
from pathlib import Path
import logging
from typing import Dict, Any, List
import json
import torch
from datetime import datetime
import random
import shutil
from tqdm import tqdm

from models.code_generator import CodeGenerator, GameConfig
from models.code_improver import CodeImprover
from models.reward_model import RewardModel
from training.reward_trainer import RewardTrainer
from training.model_finetuner import ModelFinetuner

def setup_logging(log_dir: Path) -> None:
    """Setup logging configuration"""
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_dir / f"run_{timestamp}.log"),
            logging.StreamHandler(),
        ],
    )


def parse_args() -> argparse.Namespace:
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="Game Code Generation and Improvement Pipeline"
    )

    # Add mode argument
    parser.add_argument(
        "--mode",
        type=str,
        required=True,
        choices=["generate", "improve", "train_reward", "finetune", "full"],
        help="Pipeline mode to run",
    )

    # Basic settings
    parser.add_argument(
        "--work_dir",
        type=Path,
        default=Path("."),
        help="Directory for all outputs",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="o3-mini",
        help="Model to use for code generation",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="cuda" if torch.cuda.is_available() else "cpu",
        help="Device to run on",
    )

    # Game generation settings
    parser.add_argument(
        "--genre",
        type=str,
        help="Game genre(s) to generate. Use comma for multiple or 'all' for all genres",
    )
    parser.add_argument(
        "--num_players", type=int, default=1, help="Number of players in the game"
    )
    parser.add_argument(
        "--num_games", type=int, default=1, help="Number of games to generate"
    )

    # Improvement pipeline settings
    parser.add_argument(
        "--num_iterations",
        type=int,
        default=3,
        help="Number of improvement iterations",
    )
    parser.add_argument(
        "--is_global_improvement",
        action="store_true",
        help="Whether to perform global improvement",
    )

    parser.add_argument(
        "--save_all_versions", action="store_true", help="Save all improvement versions"
    )

    # Training settings
    parser.add_argument(
        "--train_reward", action="store_true", help="Train the reward model"
    )
    parser.add_argument(
        "--finetune", action="store_true", help="Finetune the model using PPO"
    )
    parser.add_argument(
        "--batch_size", type=int, default=8, help="Batch size for training"
    )
    parser.add_argument(
        "--num_epochs", type=int, default=50, help="Number of training epochs"
    )

    return parser.parse_args()


def setup_directories(base_dir: Path) -> Dict[str, Path]:
    """Setup directory structure"""
    dirs = {
        "base": base_dir,
        "games": base_dir / "games",
        # "improvements": base_dir / "improvements",
        "checkpoints": base_dir / "checkpoints",
        "logs": base_dir / "logs",
    }

    for dir_path in dirs.values():
        dir_path.mkdir(parents=True, exist_ok=True)

    return dirs


def save_config(config: Dict[str, Any], save_path: Path) -> None:
    """Save configuration to file"""
    with open(save_path, "w") as f:
        json.dump(config, f, indent=2, default=str)


def find_all_games(games_dir: Path) -> List[Path]:
    """
    Find all game folders in the directory structure
    games/MODEL_NAME/GENRE/game_*/
    """
    game_paths = []
    # Look for all game_* folders in any subdirectory
    for game_dir in games_dir.glob("**/game_*"):
        if game_dir.is_dir():
            game_paths.append(game_dir)
    return game_paths


def main():
    """Main execution function"""
    args = parse_args()
    dirs = setup_directories(args.work_dir)
    setup_logging(dirs["logs"])
    logging.info(f"Starting run with arguments: {args}")

    try:
        if args.mode in ["generate", "full"]:
            # Handle genre selection
            if args.genre == "all":
                selected_genres = CodeGenerator.VALID_GENRES
            else:
                selected_genres = [g.strip().lower() for g in args.genre.split(",")]
                # Validate genres
                invalid_genres = [
                    g for g in selected_genres if g not in CodeGenerator.VALID_GENRES
                ]
                if invalid_genres:
                    raise ValueError(
                        f"Invalid genres: {invalid_genres}. Valid genres are: {CodeGenerator.VALID_GENRES}"
                    )

            # 1. Generate initial games for each genre
            logging.info("Generating initial game code...")
            for genre in selected_genres:
                logging.info(f"Generating games for genre: {genre}")
                game_config = GameConfig(
                    genre=genre,
                    num_players=args.num_players,
                    model_name=args.model,
                )

                generator = CodeGenerator(config=game_config)

                for _ in range(args.num_games):
                    html_code, js_code, game_title, description, full_response = (
                        generator.generate_game()
                    )
                    game_folder, game_index = generator.save_game(
                        html_code,
                        js_code,
                        game_title,
                        description,
                        full_response,
                        dirs["games"],
                    )
                    logging.info(
                        f"Initial game '{game_title}' ({genre}) generated and saved at {game_folder}."
                    )

        if args.mode in ["improve", "full"]:
            # 2. Run improvement pipeline
            logging.info("Running code improvements...")
            improver = CodeImprover(model_name=args.model)

            # Find all games to improve
            game_paths = find_all_games(dirs["games"])
            if not game_paths:
                raise FileNotFoundError("No games found to improve")

            logging.info(f"Found {len(game_paths)} games to improve")

            # Improve each game
            for game_path in tqdm(game_paths, desc="Improving games"):
                logging.info(f"Improving game in {game_path}")
                try:
                    improvement_records = improver.improve_game(
                        game_path=game_path, num_iterations=args.num_iterations
                    )
                    if improvement_records:
                        logging.info(f"Successfully improved game at {game_path}")
                except Exception as e:
                    logging.error(f"Failed to improve game at {game_path}: {e}")
                    continue

        if args.mode in ["train_reward", "full"]:
            # 3. Train reward model
            logging.info("Training reward model...")
            reward_model = RewardModel(
                vocab_size=50000,
                d_model=512,
                nhead=8,
                num_encoder_layers=6,
                dim_feedforward=2048,
                dropout=0.1,
                max_seq_length=1024,
                max_score=10.0,  # For 0-10 scoring range
            )
            trainer = RewardTrainer(
                model=reward_model,
                train_data_dir=dirs["games"],
                checkpoint_dir=dirs["checkpoints"],
                batch_size=args.batch_size,
                num_epochs=args.num_epochs,
            )
            trainer.train()
            logging.info("Reward model training completed")

        if args.mode in ["finetune", "full"]:
            # 4. Finetune model using PPO
            logging.info("Starting PPO fine-tuning...")
            finetuner = ModelFinetuner(
                base_model_name=args.model,
                reward_model_path=dirs["checkpoints"] / "reward_model.pt",
                device=args.device,
            )

            # Load improvement records
            improvements_dir = dirs["improvements"]
            training_data = []
            for game_dir in improvements_dir.glob("**/improvement_history.json"):
                with open(game_dir) as f:
                    records = json.load(f)
                    training_data.extend(records.get("records", []))

            finetuner.finetune(
                training_data=training_data,
                num_epochs=args.num_epochs,
                batch_size=args.batch_size,
                checkpoint_dir=dirs["checkpoints"],
            )
            logging.info("Fine-tuning completed")

        logging.info(f"Mode '{args.mode}' completed successfully")

    except Exception as e:
        logging.error(f"Error during execution: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
