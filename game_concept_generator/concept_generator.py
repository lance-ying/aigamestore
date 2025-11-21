"""AI-powered game concept generator using Gemini 2.5 Flash."""

import requests
from .config import GEMINI_URL


def generate_mechanic_focused_concepts(games_batch):
    """Generate mechanic-focused game concepts using Gemini 2.5 Flash.
    
    Args:
        games_batch: List of game data dictionaries
        
    Returns:
        dict: Map of game index (1-based) to concept string
    """
    
    # Build detailed prompt with game information
    games_text = ""
    for i, game_data in enumerate(games_batch, 1):
        desc = game_data['description'][:3500]
        games_text += f"{i}. {game_data['name']}\n"
        games_text += f"   Developer: {game_data['developer']}\n"
        games_text += f"   Genre: {game_data['genre']}\n"
        
        if game_data.get('rating', 0) > 0:
            games_text += f"   Rating: {game_data['rating']:.2f}/5.0 ({game_data['rating_count']:,} reviews)\n"
        
        games_text += f"   App Store Description: {desc}\n\n"
    
    prompt = f"""You are a professional game designer creating technical design documentation. For each of these {len(games_batch)} iOS games, create a comprehensive game concept (4-6 sentences) that explains EXACTLY how the game mechanics work.

CRITICAL REQUIREMENTS - GAME MECHANICS FOCUS:
- Each description MUST be 4-6 complete sentences
- MUST explain SPECIFIC gameplay mechanics with CONCRETE details (not generic statements)
- MUST describe the EXACT user interface and control scheme (swipe left/right, tap to jump, etc.)
- MUST explain progression mechanics, unlock systems, and how difficulty scales
- MUST include NUMERICAL details where applicable (number of lanes, time limits, health points, spawn rates, speeds, etc.)
- MUST explain core game loops and how systems interact
- Focus EXCLUSIVELY on game design and mechanics - DO NOT discuss monetization, marketing, or business aspects

WHAT TO INCLUDE FOR EACH GAME:
1. CORE MECHANICS: Precise player actions and immediate game responses
   - Example: "Players swipe left/right to move between 3 lanes" NOT "Players control a character"
   
2. GAME SYSTEMS: How elements interact with specific details
   - Example: "Obstacles spawn every 2 seconds at increasing speeds" NOT "Obstacles appear"
   
3. PROGRESSION: Exact unlock and advancement mechanics
   - Example: "Collect 100 coins to unlock new skins" NOT "Players can unlock content"
   
4. CONTROLS & UI: Specific interaction methods
   - Example: "Tap anywhere to jump, swipe up for double jump" NOT "Simple touch controls"
   
5. WIN/LOSS CONDITIONS: Exact goals and failure states
   - Example: "Run ends when hitting 3 obstacles; goal is to reach the highest distance" NOT "Try to survive"

6. NUMERICAL DETAILS: Include specific numbers
   - Example: "Player has 3 lives, speed increases 10% every 30 seconds" NOT "Game gets harder over time"

Games to analyze:
{games_text}

QUALITY EXAMPLES (FOLLOW THIS STYLE):

- Subway Surfers: An endless running game where players control a character running on three parallel train tracks, swiping left or right to change lanes, up to jump over obstacles, and down to slide under barriers. The game continuously scrolls forward at increasing speeds, spawning trains, barriers, and collectible coins at predetermined intervals that become more frequent and challenging over time. Players collect coins during runs which can be spent on character skins, hoverboards that provide temporary protection, and power-ups like coin magnets and speed boosts that activate for limited durations. Daily missions present specific objectives like collecting a certain number of coins or using particular power-ups, while the main progression revolves around achieving higher distances and unlocking new subway environments with different visual themes.

- Traffic Run: A timing-based arcade game where players tap the screen to make a vehicle accelerate forward across a busy multi-lane highway with perpendicular traffic flowing continuously. The objective is to cross each intersection without colliding with passing vehicles, requiring players to time their taps precisely as gaps appear in the traffic stream. The game features an endless progression where successfully crossed intersections award points and occasionally spawn collectible coins, with traffic density and vehicle speeds increasing gradually to raise difficulty. Players can unlock new vehicle types using collected coins, each with different visual appearances but identical gameplay mechanics, and the run ends immediately upon any collision with another vehicle.

- Worms Zone: A multiplayer snake game where players control a worm that continuously moves forward, using directional swipes or tilt controls to steer around a large 2D arena filled with other player-controlled worms. The core mechanic involves consuming colored food pellets scattered across the map to grow longer, with mass also gained by colliding with and consuming the remains of eliminated worms that break into collectible segments. Players can activate a limited speed boost by double-tapping or holding the screen, which drains a portion of their accumulated mass but allows for quick escapes or aggressive plays to cut off opponents. The game features an elimination mechanic where any collision of a worm's head with another worm's body results in immediate death, transforming the worm into collectible food, with the primary objective being to grow to the largest size possible and climb the live leaderboard displayed in the corner.

OUTPUT FORMAT:
Respond with EXACTLY {len(games_batch)} concepts numbered 1-{len(games_batch)}.
Format: "NUMBER. CONCEPT"
Each concept must be 4-6 sentences with specific mechanical details.

Concepts:"""

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 20000
        }
    }

    try:
        response = requests.post(GEMINI_URL, json=payload, timeout=240)
        
        if response.status_code == 200:
            result = response.json()
            
            if 'candidates' in result and result['candidates']:
                candidate = result['candidates'][0]
                
                if candidate.get('finishReason') == 'SAFETY':
                    print(f"  ⚠️  WARNING: Content blocked by safety filters")
                    return {}
                
                if 'content' in candidate and 'parts' in candidate['content']:
                    response_text = candidate['content']['parts'][0]['text'].strip()
                    return parse_concepts(response_text)
                    
    except Exception as e:
        print(f"  ❌ Error generating concepts: {e}")
    
    return {}


def parse_concepts(response_text):
    """Parse AI response text to extract numbered concepts.
    
    Args:
        response_text: Raw response text from AI
        
    Returns:
        dict: Map of concept number to concept text
    """
    concepts = {}
    lines = response_text.split('\n')
    current_num = None
    current_concept = []
    
    for line in lines:
        line = line.strip()
        if line and line[0].isdigit() and '.' in line:
            # Save previous concept if exists
            if current_num is not None and current_concept:
                concepts[current_num] = ' '.join(current_concept)
            
            # Start new concept
            parts = line.split('.', 1)
            if len(parts) == 2:
                try:
                    current_num = int(parts[0].strip())
                    current_concept = [parts[1].strip()]
                except ValueError:
                    continue
        elif current_num is not None and line:
            # Continue multi-line concept
            current_concept.append(line)
    
    # Save last concept
    if current_num is not None and current_concept:
        concepts[current_num] = ' '.join(current_concept)
    
    return concepts

