import os
import streamlit as st
# Must be the first Streamlit command
st.set_page_config(layout="wide")

import streamlit.components.v1 as components
from pathlib import Path
import json
import random
import numpy as np
import math
from datetime import datetime
import uuid
from datasets import load_dataset, Dataset
from scheduler import ParquetScheduler

from st_bridge import bridge


HF_TOKEN = os.environ.get("HF_TOKEN")


# Elo rating parameters
K_FACTOR = 32
INITIAL_RATING = 1500
SCALE = 400
BASE = 10

PREFERENCE_DATASET = "nacloos/gen-games-preferences-test"
GAMES_DATASET = "nacloos/gen-games"


@st.cache_resource
def get_scheduler():
    """Initialize and cache schedulers."""
    preferences_scheduler = ParquetScheduler(
        repo_id=PREFERENCE_DATASET,
        private=True,
        every=15,  # Upload every 15 minutes
        token=HF_TOKEN
    )
    return preferences_scheduler


def compute_ratings_from_preferences(preferences):
    """Compute all Elo ratings from scratch using the preferences dataset."""
    # Initialize ratings dictionary
    ratings = {}

    # Sort preferences by timestamp to replay them in order
    preferences_list = sorted(preferences, key=lambda x: x["timestamp"])
    
    # Replay all preferences and update ratings
    for pref in preferences_list:
        # Initialize ratings for games if they don't exist
        if pref["game_a_id"] not in ratings:
            ratings[pref["game_a_id"]] = INITIAL_RATING
        if pref["game_b_id"] not in ratings:
            ratings[pref["game_b_id"]] = INITIAL_RATING
        
        # Update ratings based on preference
        if pref["winner"] != "tie":  # Skip ties as they don't affect Elo
            winner = "A" if pref["winner"] == "game_a" else "B"
            new_rating_a, new_rating_b = update_elo(
                ratings[pref["game_a_id"]],
                ratings[pref["game_b_id"]],
                winner
            )
            ratings[pref["game_a_id"]] = new_rating_a
            ratings[pref["game_b_id"]] = new_rating_b
    
    return ratings


def load_datasets():
    """Load datasets."""
    with st.spinner('Loading datasets...'):
        games_dataset = load_dataset(GAMES_DATASET, split="train", token=HF_TOKEN)
        preferences = load_dataset(PREFERENCE_DATASET, split="train", token=HF_TOKEN)

        initial_ratings = compute_ratings_from_preferences(preferences)
        
        # Get unique game descriptions from dataset
        game_descriptions = []
        seen_indices = []
        for item in games_dataset:
            idx = item["game_description_index"]
            if idx not in seen_indices:
                game_descriptions.append(item["game_description"])
                seen_indices.append(idx)
        # Sort game descriptions based on their original indices
        game_descriptions = [x for _, x in sorted(zip(seen_indices, game_descriptions))]
        
        return games_dataset, initial_ratings, game_descriptions


def get_game_samples(games_dataset, game_idx):
    """Get list of available samples for a given game from the dataset."""
    samples = []
    for i, item in enumerate(games_dataset):
        if item["game_description_index"] == game_idx:
            samples.append(item)
    return samples


def create_game_html(html_content, game_id):    
    # Add event listener to prevent arrow keys from scrolling
    # prevent_scroll_js = """
    # <script>
    # window.addEventListener("keydown", function(e) {
    #     if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
    #         e.preventDefault();
    #     }
    # }, false);
    # """

    # Add event listener for when the window loses focus
    focus_event_js = f"""
    <script>
    // Add event buffering and focus/blur handling
    const eventBuffer = [];
    const focusState = {{
      isFocused: document.hasFocus(),
      lastFocusTime: Date.now(),
      p5Ready: false    // Track whether p5.js sketch is initialized
    }};
    
    // Function to record events to the buffer
    function recordAction(eventType, data) {{
        if (focusState.isFocused && focusState.p5Ready) {{
            eventBuffer.push({{
                type: eventType,
                timestamp: Date.now(),
                framecount: frameCount,
                ...data
            }});
        }}
    }}
    
    // Function to send buffered events
    function sendBufferedEvents() {{
        if (eventBuffer.length > 0) {{
            events = eventBuffer.slice();
            // Clear the buffer before sending
            console.log('length of eventBuffer before clearing', eventBuffer.length);
            eventBuffer.length = 0;
            console.log('length of eventBuffer after clearing', eventBuffer.length);

            window.parent.stBridges.send('bridge-{game_id}', {{
                type: 'buffered_events',
                timestamp: Date.now(),
                events: events // Send a copy of the buffer
            }});

            console.log('length of eventBuffer after sending', eventBuffer.length);
        }}
    }}

    // Minimal p5.js setup function detection
    const wrappedSetup = function() {{
        // Store original setup if it exists
        const originalSetup = window.setup;
        
        // Create new setup wrapper
        window.setup = function() {{
            // Call original setup
            const result = originalSetup.apply(this, arguments);
            
            // Mark as ready
            focusState.p5Ready = true;

            // Clear the buffer
            eventBuffer.length = 0;
            
            // window.parent.stBridges.send('focus-{game_id}', {{
            //     type: 'p5_ready',
            //     timestamp: Date.now()
            // }});
            recordAction('p5_ready', {{}});
            return result;
        }};
    }};
    
    wrappedSetup();


    // Focus/blur event handling
    window.addEventListener('blur', function() {{
        // Only act if we were previously focused and loaded
        if (focusState.isFocused && focusState.p5Ready) {{
            focusState.isFocused = false;
            const focusTime = Date.now() - focusState.lastFocusTime;
            
            // Send focus event
            // window.parent.stBridges.send('focus-{game_id}', {{
            //     type: 'blur',
            //     timestamp: Date.now(),
            //     timeFocused: focusTime
            // }});

            recordAction('blur', {{
                timeFocused: focusTime
            }});
            
            // Send all buffered events when lose focus
            sendBufferedEvents();
        }}
    }});

    window.addEventListener('focus', function() {{
        // Only act if we were previously blurred and loaded
        if (!focusState.isFocused && focusState.p5Ready) {{
            focusState.isFocused = true;
            focusState.lastFocusTime = Date.now();
            // window.parent.stBridges.send('focus-{game_id}', {{
            //    type: 'focus',
            //    timestamp: Date.now()
            // }});

            recordAction('focus', {{}});
        }}
    }});
    
    // Add key event listeners
    window.addEventListener("keydown", function(e) {{
        // Record all key presses
        recordAction('keydown', {{
            keyCode: e.keyCode,
            key: e.key
        }});
        
        // Prevent default for navigation keys
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {{
            e.preventDefault();
        }}
    }}, false);
    
    // Add keyup event listener
    window.addEventListener("keyup", function(e) {{
        // Record all key releases
        recordAction('keyup', {{
            keyCode: e.keyCode,
            key: e.key
        }});
    }}, false);
    
    // Mouse movement tracking
    let lastX = null;
    let lastY = null;
    let lastMoveTime = 0;
    
    document.addEventListener('mousemove', function(e) {{
        const now = Date.now();
        // Only record if position changed AND at 60 FPS
        if ((lastX !== e.clientX || lastY !== e.clientY) && now - lastMoveTime > 16.66) {{
            recordAction('mousemove', {{
                x: e.clientX,
                y: e.clientY
            }});
            lastX = e.clientX;
            lastY = e.clientY;
            lastMoveTime = now;
        }}
    }});
    
    // Mouse clicks
    document.addEventListener('click', function(e) {{
        recordAction('click', {{
            x: e.clientX,
            y: e.clientY,
            button: e.button
        }});
    }});
    
    // Mouse down/up
    document.addEventListener('mousedown', function(e) {{
        recordAction('mousedown', {{
            x: e.clientX,
            y: e.clientY,
            button: e.button
        }});
    }});
    
    document.addEventListener('mouseup', function(e) {{
        recordAction('mouseup', {{
            x: e.clientX,
            y: e.clientY,
            button: e.button
        }});
    }});
    
    // Track when mouse enters/leaves the game area
    document.addEventListener('mouseenter', function(e) {{
        recordAction('mouseenter', {{
            x: e.clientX,
            y: e.clientY
        }});
    }});
    
    document.addEventListener('mouseleave', function(e) {{
        recordAction('mouseleave', {{
            x: e.clientX,
            y: e.clientY
        }});
    }});
    </script>
    """
    
    # Insert event handlers before the closing </body> tag
    # html_content = html_content.replace("</body>", f"{prevent_scroll_js}{focus_event_js}</body>")
    html_content = html_content.replace("</body>", f"{focus_event_js}</body>")
    
    return html_content


def display_game_pair(game_a, game_b):
    """Display two games side by side."""
    # Custom CSS for the game containers
    st.markdown("""
        <style>
        .game-title {
            text-align: center;
            margin: 5px 0;
            font-size: 1.2em;
            font-weight: bold;
        }
        .stButton button {
            width: 100%;
            margin: 5px 0;
        }
        div[data-testid="column"] {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        div.element-container {
            display: flex;
            justify-content: center;
            width: 100%;
        }
        iframe {
            width: 400px !important;
            height: 400px !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            background: transparent !important;
        }
        /* Hide bridge components completely */
        iframe.stCustomComponentV1[title="st_bridge.bridge.bridge"] {
            position: absolute !important;
            width: 0 !important;
            height: 0 !important;
            border: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
            display: block !important;
            visibility: hidden !important;
        }
        </style>
    """, unsafe_allow_html=True)
    
    # Create two columns with equal width
    col1, col2 = st.columns([1, 1])
    
    # Display games
    with col1:
        st.markdown('<p class="game-title">Game A</p>', unsafe_allow_html=True)
        html_a = create_game_html(game_a["game_code"], "A")
        components.html(html_a, height=400, scrolling=False)
    
    with col2:
        st.markdown('<p class="game-title">Game B</p>', unsafe_allow_html=True)
        html_b = create_game_html(game_b["game_code"], "B")
        components.html(html_b, height=400, scrolling=False)

    # Store player actions in session state
    if "game_a_actions" not in st.session_state:
        st.session_state.game_a_actions = []
    if "game_b_actions" not in st.session_state:
        st.session_state.game_b_actions = []
    # if "game_a_focus_events" not in st.session_state:
    #     st.session_state.game_a_focus_events = []
    # if "game_b_focus_events" not in st.session_state:
    #     st.session_state.game_b_focus_events = []
    # Store processed timestamps in session state
    if "processed_timestamps_a" not in st.session_state:
        st.session_state.processed_timestamps_a = set()
    if "processed_timestamps_b" not in st.session_state:
        st.session_state.processed_timestamps_b = set()
    # if "processed_focus_timestamps_a" not in st.session_state:
    #     st.session_state.processed_focus_timestamps_a = set()
    # if "processed_focus_timestamps_b" not in st.session_state:
    #     st.session_state.processed_focus_timestamps_b = set()
    
    # Get latest event data using bridges with height=0
    event_a = bridge("bridge-A", default=None)
    event_b = bridge("bridge-B", default=None)

    server_time = datetime.now().isoformat()
    # Process new events if available
    if event_a is not None:
        # Only add events with timestamps we haven't seen before
        new_events = []
        for event in event_a["events"]:
            timestamp = event.get("timestamp")
            if timestamp and timestamp not in st.session_state.processed_timestamps_a:
                event["server_timestamp"] = server_time
                st.session_state.game_a_actions.append(event)
                st.session_state.processed_timestamps_a.add(timestamp)
                new_events.append(event)
        
        if new_events:
            st.write(f"Received {len(new_events)} new buffered events from Game A")

    if event_b is not None:
        # Only add events with timestamps we haven't seen before
        new_events = []
        for event in event_b["events"]:
            timestamp = event.get("timestamp")
            if timestamp and timestamp not in st.session_state.processed_timestamps_b:
                event["server_timestamp"] = server_time
                st.session_state.game_b_actions.append(event)
                st.session_state.processed_timestamps_b.add(timestamp)
                new_events.append(event)
        
        if new_events:
            st.write(f"Received {len(new_events)} new buffered events from Game B")

    
    # Get focus/blur events
    # focus_event_a = bridge("focus-A", default=None)
    # focus_event_b = bridge("focus-B", default=None)
    
    # Process focus events if available
    # if focus_event_a is not None:
    #     timestamp = focus_event_a.get("timestamp")
    #     if timestamp and timestamp not in st.session_state.processed_focus_timestamps_a:
    #         focus_event_a["server_timestamp"] = datetime.now().isoformat()
    #         st.session_state.game_a_focus_events.append(focus_event_a)
    #         st.session_state.processed_focus_timestamps_a.add(timestamp)
    
    # if focus_event_b is not None:
    #     timestamp = focus_event_b.get("timestamp")
    #     if timestamp and timestamp not in st.session_state.processed_focus_timestamps_b:
    #         focus_event_b["server_timestamp"] = datetime.now().isoformat()
    #         st.session_state.game_b_focus_events.append(focus_event_b)
    #         st.session_state.processed_focus_timestamps_b.add(timestamp)
    
    # Display summary of recorded actions
    col1, col2 = st.columns(2)
    
    def count_events_by_type(actions):
        event_counts = {}
        for action in actions:
            if isinstance(action, dict) and "type" in action:
                event_type = action["type"]
                event_counts[event_type] = event_counts.get(event_type, 0) + 1
        return event_counts
    
    # Display event summaries
    with col1:
        st.write("### Game A actions")
        event_counts_a = count_events_by_type(st.session_state.game_a_actions)
        for event_type, count in event_counts_a.items():
            st.write(f"- {event_type}: {count}")
        st.write(f"Total: {len(st.session_state.game_a_actions)} events")

        # Display focus events
        # st.write("### Game A focus events")
        # for focus_event in st.session_state.game_a_focus_events:
        #     event_type = focus_event.get('type', 'unknown')
        #     if event_type == 'blur' and 'timeFocused' in focus_event:
        #         focus_time_sec = focus_event['timeFocused'] / 1000
        #         st.write(f"- {event_type} after {focus_time_sec:.1f} seconds of focus")
        #     elif event_type in ['p5_ready', 'p5_ready_fallback', 'ready_fallback']:
        #         st.write(f"- {event_type} at {focus_event.get('timestamp', 'unknown')}")
        #     else:
        #         st.write(f"- {event_type} at {focus_event.get('timestamp', 'unknown')}")

    
    with col2:
        st.write("### Game B actions")
        event_counts_b = count_events_by_type(st.session_state.game_b_actions)
        for event_type, count in event_counts_b.items():
            st.write(f"- {event_type}: {count}")
        st.write(f"Total: {len(st.session_state.game_b_actions)} events")

        # Display focus events
        # st.write("### Game B focus events")
        # for focus_event in st.session_state.game_b_focus_events:
        #     event_type = focus_event.get('type', 'unknown')
        #     if event_type == 'blur' and 'timeFocused' in focus_event:
        #         focus_time_sec = focus_event['timeFocused'] / 1000
        #         st.write(f"- {event_type} after {focus_time_sec:.1f} seconds of focus")
        #     elif event_type in ['p5_ready', 'p5_ready_fallback', 'ready_fallback']:
        #         st.write(f"- {event_type} at {focus_event.get('timestamp', 'unknown')}")
        #     else:
        #         st.write(f"- {event_type} at {focus_event.get('timestamp', 'unknown')}")


def get_display_name(sample):
    """Get formatted display name for a sample."""
    model_short = sample["model"].split('/')[-1]  # Get last part of model name
    return f"{model_short} - sample {sample['sample_index']}"


def update_elo(rating_a, rating_b, winner):
    """Update Elo ratings based on game outcome."""
    expected_a = 1.0 / (1.0 + math.pow(BASE, (rating_b - rating_a) / SCALE))
    actual_a = 1.0 if winner == "A" else 0.0
    
    # Update ratings
    rating_change = K_FACTOR * (actual_a - expected_a)
    new_rating_a = rating_a + rating_change
    new_rating_b = rating_b - rating_change
    
    return new_rating_a, new_rating_b


def display_leaderboard(samples):
    """Display the leaderboard in a formatted way."""
    # Add CSS for leaderboard buttons
    st.markdown("""
        <style>
        /* Make buttons show ellipsis when text overflows */
        .leaderboard-button {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
        }
        </style>
    """, unsafe_allow_html=True)
    
    st.write("### Game Rankings")
    
    # Sort samples by rating
    ranked_samples = sorted(
        [(sample, st.session_state.ratings.get(sample["id"], INITIAL_RATING)) for sample in samples],
        key=lambda x: x[1],
        reverse=True
    )
    
    # Create two columns: rankings and game preview
    col1, col2 = st.columns([1, 1])
    
    with col1:
        # Create table header with adjusted column widths
        cols = st.columns([0.5, 2.5, 1])
        with cols[0]:
            st.write("**#**")
        with cols[1]:
            st.write("**Sample**")
        with cols[2]:
            st.write("**Rating**")
        
        # Add table rows with clickable buttons
        for i, (sample, rating) in enumerate(ranked_samples, 1):
            cols = st.columns([0.5, 2.5, 1])
            with cols[0]:
                st.write(f"#{i}")
            with cols[1]:
                display_name = get_display_name(sample)
                if st.button(display_name, key=f"game_{i}", use_container_width=True, type="secondary"):
                    st.session_state.selected_game = sample
            with cols[2]:
                st.write(f"{rating:.0f}")
    
    with col2:
        st.write("### Game Preview")
        # Display selected game if any
        if "selected_game" in st.session_state:
            html = create_game_html(st.session_state.selected_game["game_code"], "leaderboard_preview")
            components.html(html, height=400, scrolling=False)
            st.write(f"Model: {st.session_state.selected_game['model']}")
        else:
            st.write("Click on a game to preview it")


# def preprocess_actions_for_storage(actions):
#     """Convert complex action data to a format suitable for Parquet storage."""
#     processed_actions = []
    
#     for action in actions:
#         if not isinstance(action, dict):
#             continue

#         # Create a flat structure with all essential information
#         processed_action = {
#             "type": action.get("type", "unknown"),
#             "client_timestamp": action.get("timestamp"),
#             "server_timestamp": action.get("server_timestamp"),
#             "framecount": action.get("framecount")
#         }
        
#         # Add coordinates for mouse/touch events
#         if "x" in action and "y" in action:
#             processed_action["x"] = action["x"]
#             processed_action["y"] = action["y"]
        
#         # Add key information for keyboard events
#         if "key" in action:
#             processed_action["key"] = action["key"]
#             processed_action["keyCode"] = action.get("keyCode")
#             processed_action["isShift"] = action.get("isShift", False)
#             processed_action["isCtrl"] = action.get("isCtrl", False)
#             processed_action["isAlt"] = action.get("isAlt", False)
        
#         # Add button information for mouse events
#         if "button" in action:
#             processed_action["button"] = action["button"]
            
#         processed_actions.append(processed_action)
    
#     return processed_actions


def save_preference(preferences_scheduler, game_a, game_b, winner):
    """Save user preference using ParquetScheduler."""
    # Process actions for storage
    # processed_game_a_actions = preprocess_actions_for_storage(st.session_state.game_a_actions)
    # processed_game_b_actions = preprocess_actions_for_storage(st.session_state.game_b_actions)
    
    # # Process focus events for storage
    # processed_game_a_focus = preprocess_actions_for_storage(st.session_state.game_a_focus_events)
    # processed_game_b_focus = preprocess_actions_for_storage(st.session_state.game_b_focus_events)
    
    # st.write(processed_game_a_focus)
    # st.write(processed_game_b_focus)
    # st.write(processed_game_a_actions)
    # st.write(processed_game_b_actions)
    # st.stop()

    # Create preference entry
    preference = {
        "id": str(uuid.uuid4()),
        "model_a": game_a["model"],
        "model_b": game_b["model"],
        "game_a": game_a["game_code"],
        "game_b": game_b["game_code"],
        "game_a_id": game_a["id"],
        "game_b_id": game_b["id"],
        "winner": f"game_{winner.lower()}" if winner in ["A", "B"] else "tie",
        "judge": st.session_state.username,
        "timestamp": datetime.now().isoformat(),
        "game_description_index": st.session_state.game_idx,
        
        # Add processed player action data to the preference entry
        # "actions_a": json.dumps(processed_game_a_actions),
        # "actions_b": json.dumps(processed_game_b_actions)
        "actions_a": json.dumps(st.session_state.game_a_actions),
        "actions_b": json.dumps(st.session_state.game_b_actions)
    }
    
    # Add to scheduler
    preferences_scheduler.append(preference)
    
    # Clear the action lists
    st.session_state.game_a_actions = []
    st.session_state.game_b_actions = []
    # st.session_state.game_a_focus_events = []
    # st.session_state.game_b_focus_events = []
    # Don't clear the processed timestamps (used to make sure actions sent from the bridge are not saved twice when the app is rerun)


def sample_new_pair():
    """Sample a new pair of games different from current ones."""
    current_pair = st.session_state.current_pair
    
    # Reset action tracking for new pair
    st.session_state.game_a_actions = []
    st.session_state.game_b_actions = []
    # st.session_state.game_a_focus_events = []
    # st.session_state.game_b_focus_events = []

    # If random game mode is active, potentially select a new game
    if st.session_state.random_game_mode:
        # Randomly select a game index
        new_game_idx = random.randint(0, len(st.session_state.game_descriptions) - 1)
        if new_game_idx != st.session_state.game_idx:
            st.session_state.game_idx = new_game_idx
            new_samples = get_game_samples(st.session_state.games_dataset, st.session_state.game_idx)
            if len(new_samples) >= 2:
                return random.sample(new_samples, 2)
    
    # Original logic for sampling from current game
    samples = get_game_samples(st.session_state.games_dataset, st.session_state.game_idx)
    while True:
        new_pair = random.sample(samples, 2)
        # Only accept if both games are different from current ones
        if new_pair[0]["id"] != current_pair[0]["id"] and new_pair[1]["id"] != current_pair[1]["id"]:
            return new_pair


def main():
    # Initialize cached resources
    preferences_scheduler = get_scheduler()
    
    # Load datasets only if not already in session state
    if "games_dataset" not in st.session_state:
        games_dataset, initial_ratings, game_descriptions = load_datasets()
        st.session_state.games_dataset = games_dataset
        st.session_state.initial_ratings = initial_ratings
        st.session_state.game_descriptions = game_descriptions
    
    # Initialize ratings in session state if not already present
    if "ratings" not in st.session_state:
        st.session_state.ratings = st.session_state.initial_ratings.copy()
    
    # Add CSS for sidebar text wrapping
    st.markdown("""
        <style>
        .stSelectbox div div div {
            white-space: normal !important;
            line-height: normal !important;
        }
        div[data-baseweb="select"] > div {
            min-height: fit-content !important;
            max-height: none !important;
        }
        div[data-baseweb="select"] span {
            white-space: normal !important;
            line-height: normal !important;
        }
        </style>
    """, unsafe_allow_html=True)
    
    # User authentication
    if "username" not in st.session_state:
        st.title("Welcome to Game Evaluation")
        
        # Add username to session state when submitted
        def set_username():
            if st.session_state.username_input:
                st.session_state.username = st.session_state.username_input
        
        username = st.text_input(
            "Please enter your username:",
            key="username_input",
            on_change=set_username
        )
        
        if st.button("Start"):
            if username:
                st.session_state.username = username
            else:
                st.error("Please enter a username")
        return
    
    # Rest of the main function
    st.sidebar.title(f"Welcome, {st.session_state.username}!")
    
    # Add logout button in sidebar
    if st.sidebar.button("Logout"):
        del st.session_state.username
        st.rerun()
    
    # Sidebar for game selection
    st.sidebar.title("Game Selection")
    game_options = [f"Game {i}: {desc}" for i, desc in enumerate(st.session_state.game_descriptions)]
    
    # Random game mode checkbox
    if "random_game_mode" not in st.session_state:
        st.session_state.random_game_mode = True
    
    st.session_state.random_game_mode = st.sidebar.checkbox("Randomly select games", value=st.session_state.random_game_mode)
    
    # Initialize or update game index in session state
    if "game_idx" not in st.session_state:
        st.session_state.game_idx = 0
    
    # Initialize leaderboard game index
    if "leaderboard_game_idx" not in st.session_state:
        st.session_state.leaderboard_game_idx = st.session_state.game_idx
    
    # Show game selection dropdown (disabled if in random mode)
    selected_idx = st.sidebar.selectbox(
        "Select Game to Evaluate" if not st.session_state.random_game_mode else "Current Game (disabled in random mode)",
        range(len(game_options)),
        format_func=lambda x: game_options[x],
        index=st.session_state.game_idx,
        disabled=st.session_state.random_game_mode
    )
    
    # If game changed through dropdown and not in random mode, update game_idx
    if selected_idx != st.session_state.game_idx and not st.session_state.random_game_mode:
        st.session_state.game_idx = selected_idx
        st.session_state.leaderboard_game_idx = selected_idx
        if "current_pair" in st.session_state:
            del st.session_state.current_pair
        if "selected_game" in st.session_state:
            del st.session_state.selected_game
        st.rerun()
    
    # Get available samples for current game from dataset
    samples = get_game_samples(st.session_state.games_dataset, st.session_state.game_idx)
    if len(samples) < 2:
        st.error(f"Not enough samples available for Game {st.session_state.game_idx}.")
        return
    
    # Initialize ratings for new samples
    for sample in samples:
        if sample["id"] not in st.session_state.ratings:
            st.session_state.ratings[sample["id"]] = INITIAL_RATING
    
    # Create tabs for comparison and leaderboard
    tab1, tab2 = st.tabs(["Compare Games", "Leaderboard"])
    
    with tab1:
        st.write(st.session_state.game_descriptions[st.session_state.game_idx])
        st.write("Play both games and choose which one is better.")
        
        # Select two random samples
        if "current_pair" not in st.session_state:
            st.session_state.current_pair = random.sample(samples, 2)
        
        # Display the games
        display_game_pair(st.session_state.current_pair[0], st.session_state.current_pair[1])
        
        # Voting interface with three columns
        col1, col2, col3 = st.columns([1, 1, 1])
        
        with col1:
            if st.button("Game A is Better", use_container_width=True):
                new_rating_a, new_rating_b = update_elo(
                    st.session_state.ratings[st.session_state.current_pair[0]["id"]],
                    st.session_state.ratings[st.session_state.current_pair[1]["id"]],
                    "A"
                )
                st.session_state.ratings[st.session_state.current_pair[0]["id"]] = new_rating_a
                st.session_state.ratings[st.session_state.current_pair[1]["id"]] = new_rating_b
                save_preference(preferences_scheduler, st.session_state.current_pair[0], st.session_state.current_pair[1], "A")
                st.session_state.current_pair = sample_new_pair()
                st.rerun()
        
        with col2:
            if st.button("Equal", use_container_width=True):
                save_preference(preferences_scheduler, st.session_state.current_pair[0], st.session_state.current_pair[1], "tie")
                st.session_state.current_pair = sample_new_pair()
                st.rerun()
        
        with col3:
            if st.button("Game B is Better", use_container_width=True):
                new_rating_a, new_rating_b = update_elo(
                    st.session_state.ratings[st.session_state.current_pair[0]["id"]],
                    st.session_state.ratings[st.session_state.current_pair[1]["id"]],
                    "B"
                )
                st.session_state.ratings[st.session_state.current_pair[0]["id"]] = new_rating_a
                st.session_state.ratings[st.session_state.current_pair[1]["id"]] = new_rating_b
                save_preference(preferences_scheduler, st.session_state.current_pair[0], st.session_state.current_pair[1], "B")
                st.session_state.current_pair = sample_new_pair()
                st.rerun()
    
    with tab2:
        # Add separate game selector for leaderboard when in random mode
        if st.session_state.random_game_mode:
            leaderboard_selected_idx = st.selectbox(
                "Select Game Leaderboard to View",
                range(len(game_options)),
                format_func=lambda x: game_options[x],
                index=st.session_state.leaderboard_game_idx
            )
            
            if leaderboard_selected_idx != st.session_state.leaderboard_game_idx:
                st.session_state.leaderboard_game_idx = leaderboard_selected_idx
                if "selected_game" in st.session_state:
                    del st.session_state.selected_game
                st.rerun()
                
            # Get samples for leaderboard-specific game
            leaderboard_samples = get_game_samples(st.session_state.games_dataset, st.session_state.leaderboard_game_idx)
            display_leaderboard(leaderboard_samples)
        else:
            # Original behavior - leaderboard matches comparison game
            display_leaderboard(samples)

if __name__ == "__main__":
    main() 