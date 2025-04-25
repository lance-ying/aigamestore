from collections import defaultdict
import json
from pathlib import Path
from datasets import load_dataset
from huggingface_hub import hf_hub_download
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


games_version = "v5"
GAMES_DATASET = f"generative-games/gen-games-{games_version}"
RATING_DATASET = f"generative-games/gen-games-{games_version}-absolute-rating-test"
VIDEO_DATASET = f"generative-games/gen-games-{games_version}-video-test"
STATIC_ANALYSIS_DATASET = f"generative-games/gen-games-{games_version}-static-analysis"


save_dir = Path(__file__).parent / "results" / Path(__file__).stem

def analyze_logs(logs, save_dir=None):
    movements_by_type = defaultdict(list)
    for event in logs["movements"]:
        movements_by_type[event["movement_type"]].append(event)

    interactions_by_type = defaultdict(list)
    for event in logs["interactions"]:
        interactions_by_type[event["interaction_type"]].append(event)

    inputs_by_type = defaultdict(list)
    for event in logs["inputs"]:
        inputs_by_type[event["input_type"]].append(event)

    if save_dir is not None:
        save_dir.mkdir(exist_ok=True, parents=True)

        plt.figure()
        for mvt_type, events in movements_by_type.items():
            print(mvt_type, len(events))
            plt.bar(mvt_type, len(events))
        plt.savefig(save_dir / "movements_counts.png")

        # bar plot of interaction type counts
        plt.figure()
        for interaction_type, events in interactions_by_type.items():
            print(interaction_type, len(events))
            plt.bar(interaction_type, len(events))
        plt.savefig(save_dir / "interactions_counts.png")


    results = {
        "interactions": interactions_by_type,
        "movements": movements_by_type,
        "interaction_counts": {k: len(v) for k, v in interactions_by_type.items() if len(v) > 0},
        "movement_counts": {k: len(v) for k, v in movements_by_type.items() if len(v) > 0},
        "interaction_types": [k for k, v in interactions_by_type.items() if len(v) > 0],
        "movement_types": [k for k, v in movements_by_type.items() if len(v) > 0]
    }
    return results


def analyze_consistency(gameplay_results, static_results, save_dir):
    save_dir.mkdir(exist_ok=True, parents=True)

    # compute scores by comparing static vs gameplay analysis
    interactions_by_type = defaultdict(list)
    for game_name, res in gameplay_results.items():
        for interaction_type in res["interaction_types"]:
            interactions_by_type[interaction_type].append(f"{game_name},")

    movements_by_type = defaultdict(list)
    for game_name, res in gameplay_results.items():
        for movement_type in res["movement_types"]:
            movements_by_type[movement_type].append(f"{game_name},")
    
    interaction_counts = {k: len(v) for k, v in interactions_by_type.items()}
    movement_counts = {k: len(v) for k, v in movements_by_type.items()}

    static_interaction_counts = static_results["interaction_type_counts"]
    static_movement_counts = static_results["movement_type_counts"]

    # TODO: HF dataset adds None to dicts (could just recompute the counts here instead of storing them in dataset)
    static_interaction_counts = {k: v for k, v in static_interaction_counts.items() if v is not None}
    static_movement_counts = {k: v for k, v in static_movement_counts.items() if v is not None}

    sorted_static_movement = sorted(static_movement_counts.items(), key=lambda x: x[1], reverse=True)
    sorted_static_interaction = sorted(static_interaction_counts.items(), key=lambda x: x[1], reverse=True)

    sorted_interaction = sorted(interaction_counts.items(), key=lambda x: static_interaction_counts[x[0]], reverse=True)
    sorted_movement = sorted(movement_counts.items(), key=lambda x: static_movement_counts[x[0]], reverse=True)

    # plot counts for movement types
    plt.figure(figsize=(8, 5))
    movement_data = pd.DataFrame({
        'type': [x[0] for x in sorted_static_movement] + [x[0] for x in sorted_movement],
        'count': [x[1] for x in sorted_static_movement] + [x[1] for x in sorted_movement],
        'source': ['static'] * len(sorted_static_movement) + ['gameplay'] * len(sorted_movement)
    })
    sns.barplot(data=movement_data, x='type', y='count', hue='source')
    plt.xticks(rotation=90)
    plt.xlabel('')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(title='')
    plt.tight_layout()
    plt.savefig(save_dir / "movement_counts.png")

    # plot counts for interaction types
    plt.figure(figsize=(8, 5))
    interaction_data = pd.DataFrame({
        'type': [x[0] for x in sorted_static_interaction] + [x[0] for x in sorted_interaction],
        'count': [x[1] for x in sorted_static_interaction] + [x[1] for x in sorted_interaction],
        'source': ['static'] * len(sorted_static_interaction) + ['gameplay'] * len(sorted_interaction)
    })
    sns.barplot(data=interaction_data, x='type', y='count', hue='source')
    plt.xticks(rotation=90)
    plt.xlabel('')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(title='')
    plt.tight_layout()
    plt.savefig(save_dir / "interaction_counts.png")

    num_interactions = sum([count for count in interaction_counts.values()])
    num_interactions_static = sum([count for count in static_interaction_counts.values()])
    interaction_score = num_interactions / num_interactions_static

    num_movements = sum([count for count in movement_counts.values()])
    num_movements_static = sum([count for count in static_movement_counts.values()])
    movement_score = num_movements / num_movements_static

    print(f"Interaction score: {interaction_score*100}%")
    print(f"Movement score: {movement_score*100}%")

    with open(save_dir / "scores.json", "w") as f:
        json.dump({
            "interaction_score": interaction_score*100,
            "movement_score": movement_score*100
        }, f, indent=4)

    # compute movement and interaction scores per game
    game_scores = {}
    for game_concept, game_res in gameplay_results.items():
        gameplay_interactions = game_res["interaction_types"]
        static_interactions = static_results["interaction_types"][game_concept]

        gameplay_movements = game_res["movement_types"]
        static_movements = static_results["movement_types"][game_concept]

        interaction_score = 0
        for interaction in static_interactions:
            if interaction in gameplay_interactions:
                interaction_score += 1
        interaction_avg_score = interaction_score / len(static_interactions)

        # compute movement score
        movement_score = 0
        for movement in static_movements:
            if movement in gameplay_movements:
                movement_score += 1
        movement_avg_score = movement_score / len(static_movements)

        # score when concatenate interaction and movement types
        joint_score = (interaction_score + movement_score) / (len(static_interactions) + len(static_movements))

        print(f"Game concept: {game_concept}")
        print(f"Interaction score: {interaction_avg_score*100}%")
        print(f"Movement score: {movement_avg_score*100}%")
        print(f"Joint score: {joint_score*100}%")
        print("Static interactions: ", static_interactions)
        print("Gameplay interactions: ", gameplay_interactions)
        print("Static movements: ", static_movements)
        print("Gameplay movements: ", gameplay_movements)
        print("-"*100)

        game_scores[game_concept] = {
            "interaction_score": interaction_avg_score*100,
            "movement_score": movement_avg_score*100,
            "joint_score": joint_score*100
        }


    with open(save_dir / "game_scores.json", "w") as f:
        json.dump(game_scores, f, indent=4)

    # plot score vs game
    interaction_scores = [v["interaction_score"] for v in game_scores.values()]
    movement_scores = [v["movement_score"] for v in game_scores.values()]
    game_concepts = list(game_scores.keys())
    plt.figure()
    plt.scatter(game_concepts, interaction_scores)
    plt.xlabel("Game concept")
    plt.ylabel("Interaction score")
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.savefig(save_dir / "interaction_score_vs_game.png")

    plt.figure()
    plt.scatter(game_concepts, movement_scores)
    plt.xlabel("Game concept")
    plt.ylabel("Movement score")
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.savefig(save_dir / "movement_score_vs_game.png")

    return game_scores


if __name__ == "__main__":
    save_dir.mkdir(exist_ok=True, parents=True)

    game_dataset = load_dataset(GAMES_DATASET, split="train")
    rating_dataset = load_dataset(RATING_DATASET, split="train")
    static_analysis_dataset = load_dataset(STATIC_ANALYSIS_DATASET, split="train")
    # torchvision error
    # video_dataset = load_dataset(VIDEO_DATASET, split="train")
    print(rating_dataset)
    print(static_analysis_dataset)

    results = defaultdict(list)
    gameplay_results = defaultdict(lambda: defaultdict(dict))
    for entry in rating_dataset:
        rating_id = entry["id"]
        game_id = entry["game_id"]

        # find matching game 
        game = game_dataset.filter(lambda x: x["id"] == game_id)
        assert len(game) == 1
        game = game[0]

        model = game["model"]
        method = game["method"]

        # retrieve corresponding video
        key = f"rating_{rating_id}_game_{game_id}"
        video_filename = f"{key}.mp4"

        _save_dir = save_dir / key 

        # try:
        #     video_path = hf_hub_download(
        #         repo_id=VIDEO_DATASET,
        #         filename=video_filename,
        #         repo_type="dataset"
        #     )
        # except Exception as e:
        #     print(f"Error downloading video {video_filename}: {e}")
        #     continue
        
        # TODO: save logs in HF dataset as string?
        logs = json.loads(entry["logs"])
        # TODO
        if len(logs) == 0:
            continue

        res = analyze_logs(logs)

        results["model"].append(model)
        results["method"].append(method)
        # results["gameplay_analysis"].append(res)
        results["rating"].append(entry["ratings"])
        results["game_id"].append(game_id)
        results["rating_id"].append(rating_id)
        results["game_concept"].append(game["game_concept"])

        gameplay_results[model][method].update(
            {
                game["game_concept"]: res
            }
        )
    
    results = pd.DataFrame(results)
    # TODO: aggregate ratings across games
    results["fun_rating"] = results["rating"].apply(lambda x: x["fun"]).astype(int)

    plt.figure()
    sns.scatterplot(data=results, y="fun_rating", x="game_concept", hue="model")
    plt.xticks(rotation=90)
    plt.xlabel('')
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.legend(title='')
    plt.tight_layout()
    plt.savefig(save_dir / "fun_rating_vs_game.png")

    game_scores = defaultdict(list)
    for model in results["model"].unique():
        for method in results["method"].unique():
            _save_dir = save_dir / f"{model}_{method}"

            # res = results[results["model"] == model][results["method"] == method]
            gameplay_res = gameplay_results[model][method]

            static_analysis_res = static_analysis_dataset.filter(lambda x: x["model"] == model and x["method"] == method)
            assert len(static_analysis_res) == 1, f"Found {len(static_analysis_res)} static analysis results for {model} {method}"
            static_analysis_res = static_analysis_res[0]

            _game_scores = analyze_consistency(gameplay_res, static_analysis_res, _save_dir)
            for game_concept, scores in _game_scores.items():
                game_scores["model"].append(model)
                game_scores["method"].append(method)
                game_scores["game_concept"].append(game_concept)
                game_scores["interaction_score"].append(scores["interaction_score"])
                game_scores["movement_score"].append(scores["movement_score"])
                game_scores["joint_score"].append(scores["joint_score"])


                mask = (
                    (results["model"] == model) &
                    (results["method"] == method) &
                    (results["game_concept"] == game_concept)
                )
                fun_rating = results[mask]["fun_rating"].values
                # TODO: handle multiple ratings for same model, method, game_concept
                assert len(fun_rating) == 1, f"Found {len(fun_rating)} fun ratings for {model} {method} {game_concept}"
                fun_rating = fun_rating[0]
                game_scores["fun_rating"].append(fun_rating)


    game_scores = pd.DataFrame(game_scores)

    # average score
    game_scores["average_score"] = (game_scores["interaction_score"] + game_scores["movement_score"]) / 2

    game_scores.to_csv(save_dir / "game_scores.csv", index=False)

    # plot average score vs fun rating
    plt.figure()
    sns.scatterplot(data=game_scores, y="fun_rating", x="average_score")
    plt.savefig(save_dir / "fun_rating_vs_average_score.png")

    # plot interaction score vs fun rating
    plt.figure()
    sns.scatterplot(data=game_scores, y="fun_rating", x="interaction_score")
    plt.savefig(save_dir / "fun_rating_vs_interaction_score.png")

    # plot movement score vs fun rating
    plt.figure()
    sns.scatterplot(data=game_scores, y="fun_rating", x="movement_score")
    plt.savefig(save_dir / "fun_rating_vs_movement_score.png")

    # plot joint score vs fun rating
    plt.figure(figsize=(4, 3), dpi=150)
    # sns.scatterplot(data=game_scores, y="fun_rating", x="joint_score")
    # add regression line
    sns.regplot(data=game_scores, y="fun_rating", x="joint_score", marker=".")
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(save_dir / "fun_rating_vs_joint_score.png")
