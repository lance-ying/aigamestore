PATH_TO_GAME="./games/2prompt_desc_code/ecs/arcade/1_neon_odyssey"

python metrics/run_all_metrics.py $PATH_TO_GAME --output $PATH_TO_GAME/metrics

python test_playability.py ./games/2prompt_desc_code/ecs/arcade/2_neon_specter --duration 1

python metrics/run_all_metrics.py ./games/2prompt_desc_code/ecs/arcade/2_neon_specter