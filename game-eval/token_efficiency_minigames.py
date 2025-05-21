from collections import defaultdict
from pathlib import Path
import os
import matplotlib.pyplot as plt
import numpy as np

from pathlib import Path
import json

import pandas as pd

from utils import run_game


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


def categorize_issue(issue):
    if "Player appears to be stuck" in issue or "Player doesn't move with any of the arrow keys" in issue:
        return "stuck"
    if "Player dies without any player input" in issue or "Player dies shortly after game reset without any input" in issue:
        return "die_immediately"
    raise ValueError(f"Unknown issue: {issue}")


if __name__ == "__main__":
    base_games = Path(__file__).parent / "results" / "gen_minigame_batch" / "run1" / "claude-3-7-sonnet-20250219" / "no_thinking"

    if not (save_dir / "results.csv").exists():
        results = []

        for genre_dir in base_games.iterdir():
            theme_dirs = sorted(genre_dir.iterdir(), key=lambda d: int(d.name.split("_")[-1]))
            for theme_dir in theme_dirs:
                theme_name = theme_dir.name

                sample_dirs = sorted(theme_dir.iterdir(), key=lambda d: int(d.name.split("_")[-1]))
                for sample_dir in sample_dirs:
                    sample_id = sample_dir.name
                    code_dict, code_str = code_from_dir(sample_dir, return_str=True)
                    tokens = count_tokens(code_str)

                    # TODO: count token in answer.txt
                    print(sample_dir)
                    print(f"Tokens: {tokens}")
                    with open(sample_dir / "run_check.json", "r", encoding="utf-8") as f:
                        run_check = json.load(f)


                    issue_counts = {
                        "stuck": 0,
                        "die_immediately": 0,
                    }
                    for issue in run_check["issues"]:
                        issue_counts[categorize_issue(issue)] += 1

                    results.append({
                        "genre": genre_dir.name,
                        "theme": theme_name,
                        "sample": sample_id,
                        "tokens": tokens,
                        "model": "claude-3-7-sonnet-20250219",
                        "no_errors": len(run_check["errors"]) == 0,
                        "no_issues": len(run_check["issues"]) == 0,
                        **issue_counts,
                    })

        results = pd.DataFrame(results)
        save_dir.mkdir(parents=True, exist_ok=True)
        results.to_csv(save_dir / "results.csv", index=False)
    else:
        results = pd.read_csv(save_dir / "results.csv")

    results["no_errors_and_no_issues"] = results["no_errors"] * results["no_issues"]
    results_first_sample = results[results["sample"] == "sample_0"]
    
    # number of themes that have more than 1 sample
    themes_sample_counts = results.groupby("theme")["sample"].nunique()
    num_themes_more_than_one_sample = (themes_sample_counts > 1).sum()
    num_themes_more_than_one_sample_ratio = num_themes_more_than_one_sample / len(themes_sample_counts)
    print(f"Number of themes with more than 1 sample: {num_themes_more_than_one_sample} / {len(themes_sample_counts)} ({num_themes_more_than_one_sample_ratio:.2%})")

    plt.figure(figsize=(4, 3), dpi=150)
    plt.hist(results_first_sample["tokens"], bins=10, color='cornflowerblue', edgecolor='white')
    plt.xlabel("Number of tokens")
    plt.ylabel("Count")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "tokens_hist.png", dpi=300)
    
    # Plot p(does run) as a bar plot
    plt.figure(figsize=(6, 3), dpi=150)
    p_runtime_error = 1 - np.mean(results_first_sample["no_errors"])
    p_stuck = np.mean(results_first_sample["stuck"] > 0)
    p_die_immediately = np.mean(results_first_sample["die_immediately"] > 0)
    
    bars = ["P(runtime error)", "P(stuck)", "P(die immediately)"]
    values = [p_runtime_error, p_stuck, p_die_immediately]
    colors = ['mediumorchid', 'orange', 'gold']
    
    plt.bar(bars, values, color=colors)
    # plt.ylim(0, 1)
    plt.ylabel("Probability")
    plt.xticks(rotation=15, ha='right')
    
    # for i, v in enumerate(values):
    #     plt.text(i, v + 0.03, f"{v:.2f}", ha='center', va='bottom', fontsize=9)
    
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "p_no_errors_bar.png", dpi=300)

    plt.figure(figsize=(4, 3), dpi=150)
    x = np.array(results_first_sample["tokens"])
    y = np.array(results_first_sample["no_errors"])
    plt.scatter(x, y, color='mediumseagreen', alpha=0.7)
    plt.xlabel("Number of tokens")
    plt.ylabel("No errors (1=True, 0=False)")
    plt.yticks([0, 1], ["Yes", "No"])
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "tokens_vs_errors.png", dpi=300)
