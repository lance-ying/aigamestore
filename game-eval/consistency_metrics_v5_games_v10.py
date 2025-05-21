from collections import defaultdict
import json
from pathlib import Path
import shutil
from datasets import load_dataset
from huggingface_hub import hf_hub_download
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from scipy import stats


games_version = "v10"

# run_name = "test"
# run_name = "test3"
run_name = "pilot1"

GAMES_DATASET = f"generative-games/gen-games-{games_version}"
RATING_DATASET = f"generative-games/gen-games-{games_version}-absolute-rating-{run_name}"
VIDEO_DATASET = f"generative-games/gen-games-{games_version}-video-{run_name}"
STATIC_ANALYSIS_DATASET = f"generative-games/gen-games-{games_version}-static-analysis"


# save_dir = Path(__file__).parent / "results" / Path(__file__).stem / games_version
save_dir = Path(__file__).parent / "results" / Path(__file__).stem / (games_version + "_" + run_name)


if __name__ == "__main__":
    save_dir.mkdir(exist_ok=True, parents=True)

    game_dataset = load_dataset(GAMES_DATASET, split="train")
    rating_dataset = load_dataset(RATING_DATASET, split="train")
    # breakpoint()
    print(rating_dataset)

    # number of entries in rating dataset for each user
    print("Number of entries in rating dataset for each user:")
    for user_id in np.unique(rating_dataset["user_id"]):
        print(f"{user_id}: {len(rating_dataset.filter(lambda x: x['user_id'] == user_id))}")


    # remove test users (any user with "test" in their id)
    rating_dataset = rating_dataset.filter(lambda x: "test" not in x["user_id"])
    print(f"After removing test users: {rating_dataset}")

    if not (save_dir / "results.csv").exists():
        results = defaultdict(list)

        for entry in rating_dataset:
            rating_id = entry["id"]
            game_id = entry["game_id"]

            _res_dir = save_dir / "results_by_user" / f"user_{entry['user_id']}" / f"game_{game_id}"
            _res_dir.mkdir(exist_ok=True, parents=True)


            # find matching game 
            game = game_dataset.filter(lambda x: x["id"] == game_id)
            assert len(game) == 1, f"Found {len(game)} games with id {game_id}"
            game = game[0]

            model = game["model"]
            method = game["method"]

            _res_dir_by_game = save_dir / "results_by_game" / f"method_{method}" / f"game_{game_id}" / f"user_{entry['user_id']}"
            _res_dir_by_game.mkdir(exist_ok=True, parents=True)

            # retrieve corresponding video
            key = f"rating_{rating_id}_game_{game_id}"
            video_filename = f"{key}.mp4"

            try:
                video_path = hf_hub_download(
                    repo_id=VIDEO_DATASET,
                    filename=video_filename,
                    repo_type="dataset",
                )
                if not (_res_dir / "video.mp4").exists():
                    shutil.copy(video_path, _res_dir / "video.mp4")

                if not (_res_dir_by_game / "video.mp4").exists():
                    shutil.copy(video_path, _res_dir_by_game / "video.mp4")

            except Exception as e:
                print(f"Error downloading video {video_filename}: {e}")
                # continue
                video_path = None

            events = json.loads(entry["events"])
            # count the number of key input events
            key_inputs = [event for event in events if event["type"] == "keydown"]
            results["num_key_presses"].append(len(key_inputs))
            # breakpoint()

            # estimate time spent as time between first and last key press
            if len(key_inputs) > 0:
                time_spent = key_inputs[-1]["timestamp"] - key_inputs[0]["timestamp"]
                # convert to seconds
                time_spent = time_spent / 1000
                results["time_spent"].append(time_spent)
                print(f"Number of key inputs: {len(key_inputs)}, time spent: {time_spent}")
            else:
                results["time_spent"].append(0)

            results["model"].append(model)
            results["method"].append(method)
            # results["gameplay_analysis"].append(res)
            results["rating_fun"].append(int(entry["ratings"]["fun"]))
            results["rating_playability"].append(int(entry["ratings"]["playability"]))

            results["game_id"].append(game_id)
            results["rating_id"].append(rating_id)
            results["game_prompt_id"].append(game["prompt_id"])
            results["game_concept_id"].append(game["game_concept_id"])
            # results["game_genre"].append(game["game_genre"])
            results["game_sample_id"].append(game["game_sample_id"])
            results["user_id"].append(entry["user_id"])
            results["video_path"].append(video_path)
            results["events"].append(entry["events"])
            results["explanation"].append(entry["explanation"])
            # check if pressed enter
            events_list = json.loads(entry["events"])
            pressed_enter = False
            for event in events_list:
                if event["type"] == "keydown" and event["key"] == "Enter":
                    pressed_enter = True
                    break
            results["pressed_enter"].append(pressed_enter)

            # save ratings
            with open(_res_dir / "ratings.json", "w") as f:
                ratings = entry["ratings"]
                ratings["explanation"] = entry["explanation"]
                json.dump(ratings, f, indent=4)

            # save ratings by game
            with open(_res_dir_by_game / "ratings.json", "w") as f:
                ratings = entry["ratings"]
                ratings["explanation"] = entry["explanation"]
                json.dump(ratings, f, indent=4)

            # save metadata
            with open(_res_dir / "metadata.json", "w") as f:
                json.dump({
                    "model": model,
                    "method": method,
                    "game_concept_id": game["game_concept_id"],
                    "game_sample_id": game["game_sample_id"],
                    "game_id": game_id,
                    "rating_id": rating_id,
                    "user_id": entry["user_id"]
                }, f, indent=4)

            # save events
            with open(_res_dir / "events.json", "w") as f:
                events = json.loads(entry["events"])
                json.dump(events, f, indent=4)

        results = pd.DataFrame(results)

        results.to_csv(save_dir / "results.csv", index=False)
    else:
        results = pd.read_csv(save_dir / "results.csv")
 
    _save_dir = save_dir / "sanity_checks"
    _save_dir.mkdir(exist_ok=True, parents=True)

    # count the number of ratings for each user
    print("Number of ratings per user:")
    print(results["user_id"].value_counts())
    # bar plot showing number of ratings per user (user ids on y-axis)
    plt.figure()
    sns.barplot(y=results["user_id"].value_counts().index, x=results["user_id"].value_counts().values, orient="h")
    plt.ylabel("User ID")
    plt.xlabel("Number of ratings")
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(_save_dir / "ratings_per_user.png")

    # count the number of videos for each user (video_path is not None)
    print("Number of videos per user:")
    print(results[results["video_path"].notna()]["user_id"].value_counts())
    # bar plot showing number of videos per user (user ids on y-axis)
    plt.figure()
    video_counts = results[results["video_path"].notna()]["user_id"].value_counts()
    sns.barplot(y=video_counts.index, x=video_counts.values, orient="h")
    plt.ylabel("User ID")
    plt.xlabel("Number of videos")
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(_save_dir / "videos_per_user.png")

    # plot average number of key presses per user
    plt.figure()
    sns.barplot(y=results["user_id"], x=results["num_key_presses"])
    plt.ylabel("User ID")
    plt.xlabel("Number of key presses")
    plt.tight_layout()
    plt.savefig(_save_dir / "key_presses_per_user_avg.png")

    # plot average time spent per user
    plt.figure()
    sns.barplot(y=results["user_id"], x=results["time_spent"])
    plt.ylabel("User ID")
    plt.xlabel("Time spent (seconds)")
    plt.tight_layout()
    plt.savefig(_save_dir / "time_spent_per_user_avg.png")

    plt.figure()
    sns.stripplot(y="user_id", x="num_key_presses", data=results, jitter=True, alpha=0.7)
    plt.ylabel("User ID")
    plt.xlabel("Number of key presses")
    plt.tight_layout()
    plt.savefig(_save_dir / "key_presses_per_user.png")

    # plot time spent per user (showing individual points)
    plt.figure()
    sns.stripplot(y="user_id", x="time_spent", data=results, jitter=True, alpha=0.7)
    plt.ylabel("User ID")
    plt.xlabel("Time spent (seconds)")
    plt.tight_layout()
    plt.savefig(_save_dir / "time_spent_per_user.png")

    # print number of users that never pressed enter
    print("Number of users that never pressed enter:")
    print(len(results[results["pressed_enter"] == False]))
    for _, entry in results[results["pressed_enter"] == False].iterrows():
        print(entry["user_id"])
        print(entry["game_id"])
        print('-'*100)

    print("Before removing users that never pressed enter:")
    print(len(results[results["num_key_presses"] < 5]))
    results = results[results["pressed_enter"]]
    # # remove all rating entries where the user didn't press enter or pressed less than 10 keys
    print("After removing users that never pressed enter:")
    print(len(results[results["num_key_presses"] < 5]))
    # results = results[results["num_key_presses"] >= 10]
    # results = results[results["pressed_enter"]]
    # breakpoint()    
    results = results[results["num_key_presses"] >= 5]



    # Compute r2 for the relationship
    slope, intercept, r_value, p_value, std_err = stats.linregress(results["rating_playability"], results["rating_fun"])
    r2 = r_value**2
    
    plt.figure()
    sns.scatterplot(data=results, y="rating_fun", x="rating_playability", alpha=0.2)
    
    # Add regression line
    x = np.array([results["rating_playability"].min(), results["rating_playability"].max()])
    y = slope * x + intercept
    plt.plot(x, y, color='black', linewidth=2)
    
    plt.xlabel('Playability rating')
    plt.ylabel('Fun rating')
    # Move R² from title to top left corner
    plt.text(0.05, 0.95, f'R² = {r2:.3f}', transform=plt.gca().transAxes, 
             fontsize=10, verticalalignment='top')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "fun_rating_vs_playability_rating.png")

    plt.figure()
    sns.barplot(data=results, y="rating_fun", x="rating_playability")
    plt.xlabel('Playability rating')
    plt.ylabel('Fun rating')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "fun_rating_vs_playability_rating_barplot.png")
    plt.close('all')



    plt.figure()
    sns.barplot(data=results, y="rating_fun", x="method")
    plt.xlabel("Method")
    plt.ylabel("Fun rating")
    plt.tight_layout()
    plt.savefig(save_dir / "fun_rating_vs_method.png")
    plt.close('all')

    plt.figure()
    sns.barplot(data=results, y="rating_playability", x="method")
    plt.xlabel("Method")
    plt.ylabel("Playability rating")
    plt.tight_layout()
    plt.savefig(save_dir / "playability_rating_vs_method.png")
    plt.close('all')

    averaged_results = results.groupby(["method", "game_prompt_id"]).agg({
        "rating_fun": "mean",
        "rating_playability": "mean"
    }).reset_index()
    plt.figure()
    sns.barplot(data=averaged_results, y="rating_fun", x="method")
    plt.xlabel("Method")
    plt.ylabel("Fun rating")
    plt.tight_layout()
    plt.savefig(save_dir / "fun_rating_vs_method_averaged.png")
    plt.close('all')

    plt.figure()
    sns.barplot(data=averaged_results, y="rating_playability", x="method")
    plt.xlabel("Method")
    plt.ylabel("Playability rating")
    plt.tight_layout()
    plt.savefig(save_dir / "playability_rating_vs_method_averaged.png")
    plt.close('all')




    # average ratings across participants for each game sample
    num_ratings_per_game = {}

    avg_results = defaultdict(list)

    for game_concept_id in results["game_concept_id"].unique():
        res = results[results["game_concept_id"] == game_concept_id]
        for method in res["method"].unique():
            game_ratings = res[res["method"] == method]

            # assert game ids are all the same
            assert len(game_ratings["game_id"].unique()) == 1
            game_id = game_ratings["game_id"].unique()[0]

            fun_ratings = game_ratings["rating_fun"].values
            playability_ratings = game_ratings["rating_playability"].values

            avg_fun_rating = fun_ratings.mean()
            avg_playability_rating = playability_ratings.mean()

            avg_results["game_concept_id"].append(game_concept_id)
            avg_results["game_id"].append(game_id)
            avg_results["avg_fun_rating"].append(avg_fun_rating)
            avg_results["avg_playability_rating"].append(avg_playability_rating)
            avg_results["std_fun_rating"].append(fun_ratings.std())
            avg_results["std_playability_rating"].append(playability_ratings.std())
            # unique game prompt id combining genre and concept id (makes it easier to match methods)
            avg_results["game_prompt_id"].append(game_concept_id)

            num_ratings_per_game[game_id] = len(game_ratings)
            avg_results["method"].append(method)

    avg_results = pd.DataFrame(avg_results)

    # plot number of ratings per game
    plt.figure(figsize=(6, 4))
    plt.bar(range(len(num_ratings_per_game)), list(num_ratings_per_game.values()))
    plt.xlabel("Game")
    plt.ylabel("Number of ratings")
    plt.tight_layout()
    plt.savefig(save_dir / "num_ratings_per_game.png")
    plt.close()


    # bar plot of avg rating for each game (with std) ordered by avg rating
    plt.figure(figsize=(6, 4))
    # Sort by average fun rating in descending order
    sorted_indices = avg_results["avg_fun_rating"].argsort()[::-1]  # descending order
    sorted_game_ids = avg_results["game_id"].iloc[sorted_indices]
    sorted_fun_ratings = avg_results["avg_fun_rating"].iloc[sorted_indices]
    sorted_fun_std = avg_results["std_fun_rating"].iloc[sorted_indices]
    
    plt.bar(range(len(sorted_game_ids)), sorted_fun_ratings, yerr=sorted_fun_std, alpha=0.7, color='mediumseagreen')
    plt.xlabel("Game")
    plt.ylabel("Average fun rating")
    plt.xticks(range(len(sorted_game_ids)), [""] * len(sorted_game_ids))
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "avg_fun_rating_vs_game.png")
    plt.close()

    # bar plot of avg playability rating for each game (with std) ordered by avg playability rating
    plt.figure(figsize=(6, 4))
    # Sort by average playability rating in descending order
    sorted_indices = avg_results["avg_playability_rating"].argsort()[::-1]  # descending order
    sorted_game_ids = avg_results["game_id"].iloc[sorted_indices]
    sorted_playability_ratings = avg_results["avg_playability_rating"].iloc[sorted_indices]
    sorted_playability_std = avg_results["std_playability_rating"].iloc[sorted_indices]
    
    plt.bar(range(len(sorted_game_ids)), sorted_playability_ratings, yerr=sorted_playability_std, alpha=0.7, color='mediumpurple')
    plt.xlabel("Game")
    plt.ylabel("Average playability rating")
    plt.xticks(range(len(sorted_game_ids)), [""] * len(sorted_game_ids))
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "avg_playability_rating_vs_game.png")
    plt.close()

    # method_names = {
    #     "simple_prompt_with_resampling": "tuned + consistency",
    #     "simple_prompt_with_resampling_then_improve": "tuned + consistency + improve",
    #     "minigame": "minigame"
    # }
    methods_unique = avg_results["method"].unique()
    method_names = {method: method for method in methods_unique}


    # Plot avg fun rating vs method
    plt.figure(figsize=(6, 4))
    plt.scatter(avg_results["method"], avg_results["avg_fun_rating"], alpha=0.2)
    plt.xlabel("Method")
    plt.ylabel("Average fun rating")
    plt.xticks(range(len(avg_results["method"])), [method_names[method] for method in avg_results["method"]])
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "avg_fun_rating_vs_method_scatter.png")
    plt.close()

    # Plot avg playability rating vs method
    plt.figure(figsize=(6, 4))
    plt.scatter(avg_results["method"], avg_results["avg_playability_rating"], alpha=0.2, color='orange')
    plt.xlabel("Method")
    plt.ylabel("Average playability rating")
    plt.xticks(range(len(avg_results["method"])), [method_names[method] for method in avg_results["method"]])
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "avg_playability_rating_vs_method_scatter.png")
    plt.close()

    # Plot delta of ratings between methods
    # breakpoint()
    m1 = "simple_prompt_with_resampling"
    m2 = "minigame"
    games_with_both_methods = set(avg_results[avg_results["method"] == m1]["game_prompt_id"]).intersection(
        set(avg_results[avg_results["method"] == m2]["game_prompt_id"])
    )
    
    # Filter to only games that have both methods
    filtered_results = avg_results[avg_results["game_prompt_id"].isin(games_with_both_methods)]
    
    # Calculate deltas for games with both methods
    method1_df = filtered_results[filtered_results["method"] == m1].sort_values("game_prompt_id")
    method2_df = filtered_results[filtered_results["method"] == m2].sort_values("game_prompt_id")
    
    delta_fun = method2_df["avg_fun_rating"].values - method1_df["avg_fun_rating"].values
    delta_playability = method2_df["avg_playability_rating"].values - method1_df["avg_playability_rating"].values

    # Plot histogram for delta fun ratings
    plt.figure(figsize=(5, 4))
    plt.hist(delta_fun, bins=10, alpha=0.7, color='skyblue')
    plt.axvline(x=0, color='black', linestyle='--', alpha=0.7)
    plt.xlabel('Delta fun rating new method - old method')
    plt.ylabel('Frequency')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "delta_fun_histogram.png")
    plt.close()

    # Plot histogram for delta playability ratings
    plt.figure(figsize=(5, 4))
    plt.hist(delta_playability, bins=10, alpha=0.7, color='lightcoral')
    plt.axvline(x=0, color='black', linestyle='--', alpha=0.7)
    plt.xlabel('Delta playability rating new method - old method')
    plt.ylabel('Frequency')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "delta_playability_histogram.png")
    plt.close()

    # Calculate aggregated statistics for method comparison
    method1_fun_values = []
    method1_playability_values = []
    method2_fun_values = []
    method2_playability_values = []
    
    # Get the actual method names
    methods = avg_results["method"].unique()
    method1_name = methods[0]
    method2_name = methods[1]

    # Collect data safely by matching genre and concept
    for game_concept_id in avg_results["game_concept_id"].unique():
        # Get samples for this concept/genre combination
        method1_data = avg_results[(avg_results["game_concept_id"] == game_concept_id) & 
                                    (avg_results["method"] == method1_name)]
        method2_data = avg_results[(avg_results["game_concept_id"] == game_concept_id) & 
                                    (avg_results["method"] == method2_name)]
        
        # Only include if we have data for both methods
        if not method1_data.empty and not method2_data.empty:
            method1_fun_values.append(float(method1_data["avg_fun_rating"].values[0]))
            method1_playability_values.append(float(method1_data["avg_playability_rating"].values[0]))
            method2_fun_values.append(float(method2_data["avg_fun_rating"].values[0]))
            method2_playability_values.append(float(method2_data["avg_playability_rating"].values[0]))

    # Create a DataFrame for plotting with actual method names
    comparison_df = pd.DataFrame({
        f'{method1_name} - Fun': method1_fun_values,
        f'{method2_name} - Fun': method2_fun_values,
        f'{method1_name} - Playability': method1_playability_values,
        f'{method2_name} - Playability': method2_playability_values,
    })
    
    # Calculate means and standard errors
    means = comparison_df.mean()
    std_errors = comparison_df.std() / np.sqrt(len(comparison_df))
    
    bar_width = 0.35
    r1 = np.arange(2)
    r2 = [x + bar_width for x in r1]
    
    plt.figure(figsize=(6, 4))
    plt.bar(r1, [means[f'{method1_name} - Fun'], means[f'{method1_name} - Playability']], 
            width=bar_width, label=method1_name, color='skyblue',
            yerr=[std_errors[f'{method1_name} - Fun'], std_errors[f'{method1_name} - Playability']], capsize=5)
    
    plt.bar(r2, [means[f'{method2_name} - Fun'], means[f'{method2_name} - Playability']], 
            width=bar_width, label=method2_name, color='lightcoral',
            yerr=[std_errors[f'{method2_name} - Fun'], std_errors[f'{method2_name} - Playability']], capsize=5)
    
    plt.xlabel('Rating criteria')
    plt.ylabel('Average human rating')
    plt.xticks([r + bar_width/2 for r in r1], ['Fun', 'Playability'])
    plt.legend()
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "method_comparison_ratings.png")
    plt.close()

    # Create a figure showing individual points with connecting lines
    plt.figure(figsize=(5, 4))
    
    # Fun ratings comparison
    plt.subplot(1, 2, 1)
    # Use game_concept_id and game_genre as unique identifiers instead of iterating over DataFrames
    for game_concept_id in avg_results["game_concept_id"].unique():
        # Get samples for methods for this concept/genre combination
        method1_data = avg_results[(avg_results["game_concept_id"] == game_concept_id) & 
                                    (avg_results["method"] == method1_name)]
        method2_data = avg_results[(avg_results["game_concept_id"] == game_concept_id) & 
                                    (avg_results["method"] == method2_name)]
        
        # Only plot if we have data for both methods
        if not method1_data.empty and not method2_data.empty:
            # Extract the values directly
            method1_fun = float(method1_data["avg_fun_rating"].values[0])
            method2_fun = float(method2_data["avg_fun_rating"].values[0])
            plt.plot([0, 1], [method1_fun, method2_fun], 'o-', color='skyblue', alpha=0.7, markersize=5)
    
    plt.ylabel('Fun rating')
    plt.xticks([0, 1], [method_names[method1_name], method_names[method2_name]])
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    # orientation of xticks
    plt.xticks(rotation=45, ha='right', fontsize=7)
    
    # Playability ratings comparison
    plt.subplot(1, 2, 2)
    for game_concept_id in avg_results["game_concept_id"].unique():
        # Get samples for methods for this concept/genre combination
        method1_data = avg_results[(avg_results["game_concept_id"] == game_concept_id) & 
                                    (avg_results["method"] == method1_name)]
        method2_data = avg_results[(avg_results["game_concept_id"] == game_concept_id) & 
                                    (avg_results["method"] == method2_name)]
        
        # Only plot if we have data for both methods
        if not method1_data.empty and not method2_data.empty:
            # Extract the values directly
            method1_playability = float(method1_data["avg_playability_rating"].values[0])
            method2_playability = float(method2_data["avg_playability_rating"].values[0])
            plt.plot([0, 1], [method1_playability, method2_playability], 'o-', color='lightcoral', alpha=0.7, markersize=5)
    
    plt.ylabel('Playability rating')
    plt.xticks([0, 1], [method_names[method1_name], method_names[method2_name]])
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    # orientation of xticks
    plt.xticks(rotation=45, ha='right', fontsize=7)
    plt.tight_layout()
    plt.savefig(save_dir / "method_comparison_individual.png")
    plt.close()
