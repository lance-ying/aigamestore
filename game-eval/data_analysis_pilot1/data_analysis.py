from collections import defaultdict
from pathlib import Path
import json
import numpy as np
import matplotlib.pyplot as plt
from torch import t

data_dir = Path(__file__).parent / "data"

save_dir = Path(__file__).parent / "results" / Path(__file__).stem
save_dir.mkdir(parents=True, exist_ok=True)


# list of info for each game
game_info = json.load(open(data_dir / "game_info.json"))

# user x game matrix of playability ratings
playability_ratings = np.load(data_dir / "playability_ratings.npy")

# user x game matrix of fun ratings
fun_ratings = np.load(data_dir / "fun_ratings.npy")

# list of consistency scores (LLM policy) for each game
consistency_scores_policy = np.load(data_dir / "consistency_scores_policy.npy")

num_prompts = len(set([info['prompt'] for info in game_info]))
num_users = playability_ratings.shape[0]
# list the samples generated for each game prompt (variable number of samples per prompt)
prompt_samples = [[] for _ in range(num_prompts)]
sample_scores = [[] for _ in range(num_prompts)]
sample_game_idx = [[] for _ in range(num_prompts)]  # keep track of game idx to get ratings later

for i, info in enumerate(game_info):
    prompt_samples[info['prompt']].append(info['sample'])
    sample_scores[info['prompt']].append(float(consistency_scores_policy[i]))
    sample_game_idx[info['prompt']].append(i)


num_samples_before_threshold = []
for i in range(num_prompts):
    samples = prompt_samples[i]
    scores = sample_scores[i]
    if (np.array(scores) >= 70).any():
        num_samples_before_threshold.append(len(samples))

p_accept = 0.6
N_mean = 1/p_accept
N_var = (1-p_accept) / p_accept**2
print(num_samples_before_threshold)
print(N_mean, N_var)
print(np.mean(num_samples_before_threshold), np.var(num_samples_before_threshold))

# plot histogram of num_samples_before_threshold
from scipy.stats import geom

plt.figure()
# Plot normalized histogram of empirical data, with centered bars
bins = np.arange(0.5, np.max(num_samples_before_threshold)+1.5, 1)
counts, _, _ = plt.hist(num_samples_before_threshold, bins=bins, alpha=0.6, label='Empirical', align='mid', density=True)

# Plot geometric distribution for comparison

x = np.arange(1, np.max(num_samples_before_threshold)+1)
p = p_accept
pmf = geom.pmf(x, p)
plt.plot(x, pmf, 'o-', color='red', label=f'Geometric(p={p:.2f})')

plt.xlabel('Number of samples to reach threshold')
plt.ylabel('Probability')
plt.legend()
plt.tight_layout()
plt.savefig(save_dir / "num_samples_before_threshold.png")


# collect all the user ratings for first and best samples for each game prompt
first_fun_ratings = np.full((num_prompts, num_users), np.nan)
first_playability_ratings = np.full((num_prompts, num_users), np.nan)
best_fun_ratings = np.full((num_prompts, num_users), np.nan)
best_playability_ratings = np.full((num_prompts, num_users), np.nan)

for i in range(num_prompts):
    # for each game prompt, get the first sample (lowest index) and the best sample (highest consistency score)
    samples = prompt_samples[i]
    first_idx = np.argmin(samples)
    best_idx = np.argmax(sample_scores[i])
    first_game_idx = sample_game_idx[i][first_idx]
    best_game_idx = sample_game_idx[i][best_idx]

    first_fun_ratings[i, :] = fun_ratings[:, first_game_idx]
    first_playability_ratings[i, :] = playability_ratings[:, first_game_idx]
    best_fun_ratings[i, :] = fun_ratings[:, best_game_idx]
    best_playability_ratings[i, :] = playability_ratings[:, best_game_idx]


plt.figure()
plt.scatter(playability_ratings.reshape(-1), fun_ratings.reshape(-1), alpha=0.1)
plt.xlabel("Playability rating")
plt.ylabel("Fun rating")
plt.tight_layout()
plt.savefig(save_dir / "playability_fun_ratings.png")


plt.figure()
plt.bar(0, np.nanmean(first_fun_ratings), yerr=np.nanstd(first_fun_ratings), label='First sample')
plt.bar(1, np.nanmean(best_fun_ratings), yerr=np.nanstd(best_fun_ratings), label='Best sample')
plt.xlabel('Sampling method')
plt.ylabel('Fun rating')
plt.legend()
plt.tight_layout()
plt.savefig(save_dir / "first_best_fun_ratings.png")

plt.figure()
plt.bar(0, np.nanmean(first_playability_ratings), yerr=np.nanstd(first_playability_ratings), label='First sample')
plt.bar(1, np.nanmean(best_playability_ratings), yerr=np.nanstd(best_playability_ratings), label='Best sample')
plt.xlabel('Sampling method')
plt.ylabel('Playability rating')
plt.legend()
plt.tight_layout()
plt.savefig(save_dir / "first_best_playability_ratings.png")


# for i in range(num_prompts):
#     plt.figure()
#     plt.bar(0, np.nanmean(first_fun_ratings[i, :]), yerr=np.nanstd(first_fun_ratings[i, :]), label='First sample')
#     plt.bar(1, np.nanmean(best_fun_ratings[i, :]), yerr=np.nanstd(best_fun_ratings[i, :]), label='Best sample')
#     plt.xlabel('Sampling method')
#     plt.ylabel('Fun rating')
#     plt.legend()
#     plt.tight_layout()

#     plt.figure()
#     plt.bar(0, np.nanmean(first_playability_ratings[i, :]), yerr=np.nanstd(first_playability_ratings[i, :]), label='First sample')
#     plt.bar(1, np.nanmean(best_playability_ratings[i, :]), yerr=np.nanstd(best_playability_ratings[i, :]), label='Best sample')
#     plt.xlabel('Sampling method')
#     plt.ylabel('Playability rating')
#     plt.legend()
#     plt.tight_layout()

#     plt.show()

from scipy.stats import t
def plot_ci(arr, color, ylabel, save_path):
    m = np.nanmean(arr, axis=0)
    s = np.nanstd(arr, axis=0, ddof=1)
    n = np.sum(~np.isnan(arr), axis=0)
    ci = t.ppf(0.975, n-1) * s/np.sqrt(n)
    o = np.argsort(m)[::-1]
    plt.figure(figsize=(6,4))
    plt.bar(np.arange(len(m)), m[o], yerr=ci[o], alpha=0.7, color=color)
    plt.xticks([], [])
    plt.xlabel("Game"); plt.ylabel(f"{ylabel}\n(95% CI)")
    ax = plt.gca(); ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()

# TODO: smaple size too small?
plot_ci(fun_ratings, "mediumseagreen", "Average fun rating", save_dir / "avg_fun_rating_CI.png")
plot_ci(playability_ratings, "mediumpurple", "Average playability rating", save_dir / "avg_playability_rating_CI.png")
