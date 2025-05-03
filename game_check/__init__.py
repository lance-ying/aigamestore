"""
Game testing module for analyzing game playability and visual state changes.
"""

from .tests.load_test import check_game_loads, report_load_test
from .tests.interaction_test import test_game_interaction, report_interaction_test
from .tests.restart_test import test_game_restart, report_restart_test 