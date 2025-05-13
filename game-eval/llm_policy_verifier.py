from pathlib import Path
import matplotlib.pyplot as plt



if __name__ == "__main__":
    games_dir = Path(__file__).parent / "results" / "gen_minigame_batch_new_prompts" / "run1" / "claude-3-7-sonnet-20250219" / "no_thinking"

    themes_dir = sorted(games_dir.glob("theme_*"), key=lambda x: int(x.stem.split("_")[-1]))
    sample_counts = []
    for theme_dir in themes_dir:
        samples_dir = sorted(theme_dir.glob("sample_*"), key=lambda x: int(x.stem.split("_")[-1]))
        sample_count = len(samples_dir)
        sample_counts.append(sample_count)
        print(f"Theme {theme_dir.stem}: {sample_count} samples")
    
    # Create histogram
    plt.figure(figsize=(10, 6))
    plt.hist(sample_counts, bins=max(5, min(20, len(set(sample_counts)))), edgecolor='black')
    plt.xlabel('Number of Samples')
    plt.ylabel('Count of Theme Directories')
    plt.title('Histogram of Sample Counts per Theme Directory')
    plt.grid(alpha=0.3)
    plt.savefig('sample_count_histogram.png')
    plt.show()
