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


def analyze_token_efficiency(games_dir, save_dir, sample_dir_name=None):
    if not (save_dir / "results.csv").exists():
        results = []
        all_issues = []

        theme_dirs = sorted(games_dir.iterdir(), key=lambda d: int(d.name.split("_")[-1]))
        for theme_dir in theme_dirs:
            theme_name = theme_dir.name

            if sample_dir_name is not None:
                theme_dir = theme_dir / sample_dir_name

            sample_dirs = sorted(theme_dir.iterdir(), key=lambda d: int(d.name.split("_")[-1]))
            for sample_dir in sample_dirs:
                sample_id = sample_dir.name
                code_dict, code_str = code_from_dir(sample_dir, return_str=True)
                tokens = count_tokens(code_str)

                print(sample_dir)
                print(f"Tokens: {tokens}")
                with open(sample_dir / "run_check.json", "r", encoding="utf-8") as f:
                    run_check = json.load(f)

                issue_counts = {
                    "stuck": 0,
                    "die_immediately": 0,
                }
                for issue in run_check["issues"]:
                    category = categorize_issue(issue)
                    assert "at time " in issue, f"Unknown issue: {issue}"
                    timestamp = int(issue.split("at time ")[-1].split("ms")[0])
                    print(f"Category: {category}, Timestamp: {timestamp}")

                    issue_counts[category] += 1

                    all_issues.append({
                        "category": category,
                        "timestamp": timestamp,
                        "sample": sample_id,
                        "theme": theme_name,
                    })

                results.append({
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

        # Save all issues
        with open(save_dir / "all_issues.json", "w", encoding="utf-8") as f:
            json.dump(all_issues, f, indent=2)
        
    else:
        results = pd.read_csv(save_dir / "results.csv")

        with open(save_dir / "all_issues.json", "r", encoding="utf-8") as f:
            all_issues = json.load(f)

    results["no_errors_and_no_issues"] = results["no_errors"] * results["no_issues"]
    results["game_prompt_id"] = results["theme"].str.split("_").str[1]
    
    results_first_sample = results[results["sample"] == "sample_0"]
    
    p_accept = np.mean(results_first_sample["no_errors_and_no_issues"])

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
    plt.figure(figsize=(3, 3), dpi=150)
    p_runtime_error = 1 - np.mean(results_first_sample["no_errors"])
    p_stuck = np.mean(results_first_sample["stuck"] > 0)
    p_die_immediately = np.mean(results_first_sample["die_immediately"] > 0)
    
    # Create a dictionary of labels and values, then sort by values
    error_data = {
        "P(runtime error)": p_runtime_error,
        "P(stuck)": p_stuck,
        "P(die immediately)": p_die_immediately
    }
    
    # Sort by values in descending order
    sorted_data = dict(sorted(error_data.items(), key=lambda item: item[1], reverse=True))
    
    bars = list(sorted_data.keys())
    values = list(sorted_data.values())
    colors = ['mediumorchid', 'orange', 'gold']
    
    plt.bar(bars, values, color=colors)
    plt.ylim(0, 1)
    plt.ylabel("Probability")
    plt.xticks(rotation=35, ha='right')
    
    for i, v in enumerate(values):
        plt.text(i, v + 0.03, f"{v:.2f}", ha='center', va='bottom', fontsize=9)
    
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "p_no_errors_bar.png", dpi=300)

    # Plot histogram of samples per game_prompt_id
    plt.figure(figsize=(6, 4), dpi=150)
    samples_per_prompt = results.groupby("game_prompt_id").size()
    
    # Convert to probability distribution
    total_prompts = len(samples_per_prompt)
    
    plt.hist(samples_per_prompt.values, bins=range(1, max(samples_per_prompt.values) + 2), 
             color='cornflowerblue', edgecolor='white', align='left', density=True)
    
    # Add a vertical line for the mean
    mean_samples = samples_per_prompt.mean()
    plt.axvline(mean_samples, color='black', linestyle='dashed', linewidth=1)
    plt.text(mean_samples + 0.1, plt.ylim()[1] * 0.9, f'Mean: {mean_samples:.2f}', 
             color='black', fontsize=9)
    plt.text(mean_samples + 0.1, plt.ylim()[1] * 0.8, f'P(accept): {p_accept:.2f}', 
             color='black', fontsize=9)
    
    plt.xlabel("Number of samples per game prompt")
    plt.ylabel("Probability")
    plt.xticks(range(1, max(samples_per_prompt.values) + 1))
    
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "samples_per_prompt_hist.png", dpi=300)

    # Plot histogram of total tokens per game_prompt_id
    plt.figure(figsize=(6, 4), dpi=150)
    total_tokens_per_prompt = results.groupby("game_prompt_id")["tokens"].sum()
    
    plt.hist(total_tokens_per_prompt.values, bins=10, 
             color='cornflowerblue', edgecolor='white', density=False)
    
    # Add a vertical line for the mean
    mean_tokens = total_tokens_per_prompt.mean()
    plt.axvline(mean_tokens, color='black', linestyle='dashed', linewidth=1)
    plt.text(mean_tokens + total_tokens_per_prompt.max()*0.02, plt.ylim()[1] * 0.9, 
             f'Mean: {mean_tokens:.0f}', color='black', fontsize=9)
    
    plt.xlabel("Total tokens per game prompt")
    plt.ylabel("Probability")
    
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "total_tokens_per_prompt_hist.png", dpi=300)

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

    # Plot histogram of issue timestamps
    plt.figure(figsize=(6, 4), dpi=150)
    timestamps = [issue["timestamp"] / 1000 for issue in all_issues]
    plt.hist(timestamps, bins=20, color='cornflowerblue', edgecolor='white')
    plt.xlabel("Time (s)")
    plt.ylabel("Number of issues")
    
    # Add mean line
    mean_time = np.mean(timestamps)
    plt.axvline(mean_time, color='black', linestyle='dashed', linewidth=1)
    plt.text(mean_time + max(timestamps)*0.02, plt.ylim()[1] * 0.9, 
             f'Mean: {mean_time:.0f}s', color='black', fontsize=9)
    
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "issue_timestamps_hist.png", dpi=300)


if __name__ == "__main__":
    base_games = Path(__file__).parent / "results" / "gen_minigame_batch_new_prompts" / "run1" / "claude-3-7-sonnet-20250219" / "no_thinking"
    revised_games = Path(__file__).parent / "results" / "gen_minigame_improve_batch_new_prompts" / "run1" / "claude-3-7-sonnet-20250219" / "thinking"


    analyze_token_efficiency(base_games, save_dir / "base_games")
    analyze_token_efficiency(revised_games, save_dir / "revised_games", sample_dir_name="improve_iter1")