"""
Test modules for checking game playability and visual state changes.
"""

from .load_test import check_game_loads, report_load_test
from .interaction_test import test_game_interaction, report_interaction_test
from .restart_test import test_game_restart, report_restart_test 