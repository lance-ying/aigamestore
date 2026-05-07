import argparse
from typing import Dict, Optional

from evaluators.basic_test.core.basic_test import test_game


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description="Basic testing: load/start/random action deltas")
    parser.add_argument("game_path")
    parser.add_argument("--duration", type=int, default=15)
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args(argv)
    res = test_game(args.game_path, args.duration, args.timeout, debug=args.debug)
    print(res)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


