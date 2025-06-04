from collections import defaultdict
from pathlib import Path
import os
import matplotlib.pyplot as plt
import numpy as np

from pathlib import Path
import json

from utils import run_game


GAMES_DIR = Path(__file__).parent / "results" / "gen_game_topdown"

METHOD_NAME = "simple_prompt_with_resampling"
MODEL_NAME = "claude-3-7-sonnet-20250219"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem


def get_game_key(game_genre, method, model, concept_id, sample_id):
    return f"{game_genre}_{method}_{model}_{concept_id}_{sample_id}"



def code_from_dir(code_dir: Path, return_str: bool = False) -> dict:
    code_dict = {}
    for file_path in code_dir.rglob("*.html"):
        with open(file_path, "r", encoding="utf-8") as f:
            code_dict[str(file_path.relative_to(code_dir))] = f.read()
    for file_path in code_dir.rglob("*.js"):
        with open(file_path, "r", encoding="utf-8") as f:
            code_dict[str(file_path.relative_to(code_dir))] = f.read()

    if return_str:
        code_str = ""
        for relative_path, code in code_dict.items():
            code_str += f"<code filename=\"{relative_path}\">{code}</code>\n\n"
        return code_dict, code_str
    else:
        return code_dict


def count_tokens(msg: str) -> int:
    import anthropic

    client = anthropic.Anthropic()

    response = client.messages.count_tokens(
        model="claude-3-7-sonnet-20250219",
        messages=[{
            "role": "user",
            "content": msg
        }],
    )
    return response.input_tokens


if __name__ == "__main__":

    results = defaultdict(list)

    if not (save_dir / "results.json").exists():
        for genre_dir in GAMES_DIR.iterdir():
            genre_name = genre_dir.name
            genre_dir = genre_dir / "run1_claude-3-7-sonnet-20250219" / "no_thinking" / "games"

            theme_dirs = sorted(genre_dir.iterdir(), key=lambda d: int(d.name.split("_")[-1]))
            for theme_dir in theme_dirs:
                theme_name = theme_dir.name

                sample_dirs = sorted(theme_dir.iterdir(), key=lambda d: int(d.name.split("_")[-1]))
                for sample_dir in sample_dirs:
                    if not sample_dir.is_dir():
                        continue
                    sample_id = sample_dir.name

                    with open(sample_dir / "run_check.json", "r", encoding="utf-8") as f:
                        run_check = json.load(f)

                    code_dict, code_str = code_from_dir(sample_dir / "code_original", return_str=True)
                    tokens = count_tokens(code_str)
                    print(f"Tokens: {tokens}")
                    print(sample_dir / "code_original")

                    errors = run_game(code_dict, total_test_time=5000, headless=True)
                    print(f"Errors: {errors}")

                    if len(errors) == 0:
                        if "success" not in run_check:
                            breakpoint()
                        # assert "success" in run_check and run_check["success"] is True, f"Success not in run_check for {game_key}"
                        results["does_run"].append(True)
                    else:
                        if "error" not in run_check:
                            breakpoint()
                        # assert "error" in run_check, f"No error in run_check for {game_key}"
                        results["does_run"].append(False)

                    results["num_tokens"].append(tokens)
                    results["errors"].append(errors)
                    results["model"].append(MODEL_NAME)
                    results["method"].append(METHOD_NAME)
                    results["genre"].append(genre_name)
                    results["theme"].append(theme_name)
                    results["sample"].append(sample_id)

        save_dir.mkdir(parents=True, exist_ok=True)
        with open(save_dir / "results.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=4)
    else:
        with open(save_dir / "results.json", "r", encoding="utf-8") as f:
            results = json.load(f)


    p_running = sum(results["does_run"]) / len(results["does_run"])
    print(f"P(running) = {p_running}")


    plt.figure(figsize=(4, 3), dpi=150)
    plt.hist(results["num_tokens"], bins=10, color='cornflowerblue', edgecolor='white')
    plt.xlabel("Number of tokens")
    plt.ylabel("Count")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "tokens_hist.png", dpi=300)
    
    # Plot p(does run) as a bar plot
    plt.figure(figsize=(2, 3), dpi=150)
    p_run = np.mean(results["does_run"])
    plt.bar(["P(running)"], [p_run], color='mediumorchid')
    plt.ylim(0, 1)
    plt.ylabel("Probability")
    for i, v in enumerate([p_run]):
        plt.text(i, v + 0.03, f"{v:.2f}", ha='center', va='bottom', fontsize=10)
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "p_running_bar.png", dpi=300)

    plt.figure(figsize=(4, 3), dpi=150)
    x = np.array(results["num_tokens"])
    y = np.array(results["does_run"])
    plt.scatter(x, y, color='mediumseagreen', alpha=0.7)
    plt.xlabel("Number of tokens")
    plt.ylabel("Does run (1=True, 0=False)")
    plt.yticks([0, 1], ["No", "Yes"])
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "tokens_vs_running.png", dpi=300)
