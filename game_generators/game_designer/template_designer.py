from typing import Dict, Any, Optional, List, Tuple
import re
from game_generators.utils import ModelAPI, GREEN, YELLOW, RED, BLUE, RESET
from game_generators.prompts import GAME_DESIGN_SYSTEM_PROMPT


class TemplateDesigner:
    """Designer that creates games through template-based, coarse-to-fine specification"""

    def __init__(self, model_api: ModelAPI, system_prompt: str = None):
        self.model_api = model_api
        self.system_prompt = system_prompt or GAME_DESIGN_SYSTEM_PROMPT

        # Template components to be specified
        self.design_components = {
            "environment": {
                "theme": "Overall visual and gameplay theme",
                "global_state": "Game-wide state variables",
                "components": "Independent environmental elements",
            },
            "mechanics": {
                "core_loop": "Primary gameplay loop",
                "progression": "How gameplay evolves over time",
                "interactions": "How elements interact",
            },
            "entities": {
                "player": "Player character capabilities",
                "ai_agents": "AI-controlled characters",
                "objects": "Interactive game objects",
            },
        }

    def design_game(
        self,
        genre: str,
        num_players: int,
        narratives: Optional[str] = None,
        debug: bool = False,
    ) -> Dict[str, Any]:
        """Create game design through template-based specification"""
        try:
            if debug:
                print(f"\n{BLUE}Starting template-based design process...{RESET}")

            num_ai = num_players - 1

            # Step 1: Generate initial templates
            template_prompt = f"""Hey! Let's create a really cool {genre} game together! I'm thinking of something where one player goes up against {num_ai} AI opponents.

{narratives if narratives else "We can come up with a fun story that fits!"}

First, let's figure out what makes this game special:

Tell me about the world:
- What's the coolest thing about how it looks and feels?
- What kind of crazy stuff happens in the environment?
- What are 3-5 things in the world that do interesting things on their own?

Now the characters:
For the player:
- What makes them super fun to control?
- What cool moves can they do?
- How do they get even cooler as you play?

For each AI opponent:
- What's their unique personality quirk?
- How do they surprise the player?
- What makes them different from typical game AI?

And here's the fun part - how does everything interact?
- What happens when abilities combine?
- How does the environment create crazy moments?
- What kind of "wow, I can't believe that worked!" moments can happen?

Just brainstorm freely - we can refine it later!"""

            templates = self._call_model_api(template_prompt, debug=debug)

            # Step 2: Generate core design
            design_prompt = f"""Awesome ideas! Now let's turn this into a real game design.

Looking at what we have:
{templates}

Let's think about how it all works together:

The basics:
- How do simple controls lead to cool results?
- What secrets can players discover?
- How does the environment react to chaos?

The fun stuff:
- What kind of power-ups or transformations happen?
- How do the {num_ai} AIs create interesting situations?
- What unexpected strategies might players discover?

The technical side:
- How do we make all these wild interactions work?
- How do we keep it fun but not totally broken?
- What systems need to track all this chaos?

Remember, we want players to have those "That was amazing!" moments while keeping the game playable!"""

            core_design = self._call_model_api(design_prompt, debug=debug)

            # Step 3: Create final design with guidance
            final_prompt = f"""Great! Let's wrap this up with the final details.

Based on everything we've discussed:
{templates}

{core_design}

We need these exact sections with their markers:

1. The Title:
```title
[Your catchy title here]
```

2. The Description:
```description
[Write 2-3 sentences that explain what makes your game awesome and gets players excited to try it!]
```

3. The Start Screen (Example below):
```guidance
Welcome to [Game Name]!

[Write a fun welcome message here]

Controls:
- Arrow keys or WASD: Move around
- Space: [Primary action]
- Shift: [Special ability]

Meet your opponents:
[Introduce the {num_ai} AI characters and their quirks]

Pro tip: [Hint at some cool secret or strategy]
```

4. Technical Notes:
```technical
[Any important implementation details]
```

Make each section exciting - especially the description and start screen!"""

            final_design = f"""=== Templates ===
{templates}

=== Core Design ===
{core_design}

=== Final Specification ===
{self._call_model_api(final_prompt, debug=debug)}"""

            # Generate fuzzy code and continue as before...
            fuzzy_code = self._generate_fuzzy_code(final_design, debug)
            complete_design = self._format_complete_design(final_design, fuzzy_code)

            if debug:
                print(f"\n{BLUE}Final Design Components:{RESET}")
                print(f"Title: {self._extract_title(final_design)}")
                print(f"Description: {self._extract_description(final_design)}")
                print(f"\n{YELLOW}Generated Code Structure:{RESET}")
                print(fuzzy_code)

            return {
                "title": self._extract_title(final_design),
                "description": self._extract_description(final_design),
                "game_design_text": complete_design,
                "game_guidance": self._extract_guidance(final_design),
                "full_response": final_design,
            }

        except Exception as e:
            if debug:
                print(f"\n{RED}Error in game design:{RESET}")
                print(f"Error type: {type(e).__name__}")
                print(f"Error message: {str(e)}")
                import traceback

                traceback.print_exc()
            raise

    def _generate_high_level_design(
        self, genre: str, num_players: int, narratives: Optional[str], debug: bool
    ) -> str:
        """Generate high-level game concept"""
        prompt = f"""Create an innovative {genre} game concept for {num_players} players (1 human + {num_players-1} AI).

Narrative Context:
{narratives if narratives else 'Create an engaging story that fits the genre'}

Focus on three key aspects:
1. Core Innovation:
- What's the unique twist that makes this game special?
- How does it stand out in the {genre} genre?

2. Evolution Points:
- How will the game surprise players over time?
- What new elements are introduced as players progress?

3. Dynamic World:
- What makes the game environment feel alive?
- How do environmental elements create interesting situations?

Provide a high-level overview of:
1. Game Title: [Catchy title]
2. Core Concept: [Main gameplay idea]
3. Key Features: [List 3-5 standout features]
4. Evolution Path: [How the game grows in complexity]"""

        return self._call_model_api(prompt, debug=debug)

    def _specify_environment(self, high_level: str, debug: bool) -> str:
        """Specify detailed environment design"""
        prompt = f"""Based on this high-level design:
{high_level}

Design a dynamic game environment with independent components that create emergent gameplay.

Specify:
1. Environment Theme:
- Visual style
- Atmosphere
- Time/space setting

2. Global State:
- Score system
- Resource management
- Time/progression tracking

3. Independent Components (at least 3):
For each component, define:
- Name and purpose
- Autonomous behavior pattern
- Interaction rules
- Evolution over time

4. Environmental Events:
- Regular occurrences
- Random events
- Progressive challenges

Make sure each component operates independently and creates interesting situations!"""

        return self._call_model_api(prompt, debug=debug)

    def _design_progression(self, environment: str, debug: bool) -> str:
        """Design the progression system"""
        prompt = f"""Using this environment design:
{environment}

Create an engaging progression system that constantly introduces new elements and challenges.

Detail:
1. Level Structure:
- Starting mechanics
- Introduction points for new elements
- Difficulty curve
- Peak challenges

2. Mechanical Layers:
- Basic mechanics
- Advanced techniques
- Hidden combinations
- Master-level skills

3. Discovery Points:
- Tutorial revelations
- Surprise mechanics
- Environmental changes
- Special events

4. Challenge Evolution:
- How basic challenges evolve
- New obstacle combinations
- Environmental hazards
- Ultimate tests

Make each stage introduce something new or combine existing elements in surprising ways!"""

        return self._call_model_api(prompt, debug=debug)

    def _define_entities(self, progression: str, debug: bool) -> str:
        """Define detailed entity behaviors"""
        prompt = f"""Based on this progression system:
{progression}

Design the entities that will populate the game world, focusing on dynamic behaviors and interactions.

Define:
1. Player Character:
- Basic abilities
- Unlockable skills
- Advanced techniques
- Strategic options

2. AI Agents:
- Unique personalities
- Individual behaviors
- Learning patterns
- Interaction styles

3. Interactive Objects:
- Basic objects
- Special items
- Power-ups
- Environmental tools

4. Interaction Rules:
- Entity relationships
- Combination effects
- Chain reactions
- Emergent behaviors

Ensure each entity adds depth to the gameplay and creates interesting situations!"""

        return self._call_model_api(prompt, debug=debug)

    def _create_final_design(self, components: Dict[str, str], debug: bool) -> str:
        """Create final detailed design"""
        prompt = f"""Based on all these components:

High-Level Design:
{components['high_level']}

Environment:
{components['environment']}

Progression:
{components['progression']}

Entities:
{components['entities']}

Create a complete, implementation-ready game design that includes:

1. Game Title:
[Final title]

2. Game Description:
[Polished description of core concept and features]

3. Game Guidance:
```guidance
[Write an engaging start screen message that:
- Welcomes players
- Explains basic controls
- Hints at deeper mechanics
- Teases future surprises]
```

4. Technical Design:
- Complete mechanics specification
- Entity behavior definitions
- Progression system details
- Interaction rules

5. Implementation Notes:
- Core systems
- State management
- Physics/collision handling
- Visual requirements

Remember: The game should constantly surprise players with new mechanics, combinations, and challenges!"""

        return self._call_model_api(prompt, debug=debug)

    def _format_complete_design(self, final_design: str, fuzzy_code: str) -> str:
        """Format the complete design document with fuzzy code structure"""
        return f"""=== Complete Game Design Document ===

{final_design}

=== Code Structure Guide ===
The following code structure outlines the key dynamic elements and their interactions:

```javascript
{fuzzy_code}
```

This structure shows:
- Core state management and progression
- Entity relationships and behaviors
- Dynamic element evolution points
- Interaction patterns and combinations
Use this as a guide for implementation while maintaining the dynamic and surprising nature of the game."""

    def _extract_title(self, text: str) -> str:
        """Extract game title from text"""
        pattern = r"```title\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return "Untitled Game"

    def _extract_description(self, text: str) -> str:
        """Extract game description from text"""
        pattern = r"```description\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            description = match.group(1).strip()
            if len(description) > 10:  # Basic validation
                return description
        if debug:
            print(f"{YELLOW}Warning: No valid description found in text{RESET}")
        return "No description provided."

    def _extract_guidance(self, text: str) -> str:
        """Extract game guidance from text"""
        pattern = r"```guidance\s*(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if not match:
            raise ValueError(
                "No guidance block found in the final design. This is required for the start screen."
            )
        return match.group(1).strip()

    def _call_model_api(self, prompt: str, debug: bool = False) -> str:
        """Call the model API with proper prompts"""
        return self.model_api.call(
            user_prompt=prompt, system_prompt=self.system_prompt, debug=debug
        )

    def _generate_fuzzy_code(self, final_design: str, debug: bool) -> str:
        """Generate a rough code structure using ECS pattern"""
        prompt = f"""Based on this final design:
{final_design}

Create a JavaScript code structure that enables rich character-driven gameplay. Focus on:

1. Environment Components:
```javascript
/**
 * Define independent environmental elements that create dynamic situations
 * Each component should have:
 * - Autonomous behavior patterns
 * - State evolution over time
 * - Interaction rules with other elements
 */
class EnvironmentComponent extends Component {{
    constructor(type, behavior) {{
        this.type = type;
        this.behaviorPattern = behavior;
        this.state = new Map();  // Track component-specific state
        this.evolutionStage = 0;
    }}

    // Show how this component evolves and interacts
    update(deltaTime, worldState) {{...}}
}}
```

2. Character Behaviors:
```javascript
/**
 * Define character behavior patterns that create emergent gameplay
 * Each character should have:
 * - Unique personality traits affecting decisions
 * - Memory of past interactions
 * - Ability to learn and adapt
 */
class BehaviorComponent extends Component {{
    constructor(personality) {{
        this.traits = personality;
        this.memory = new Map();
        this.learningRate = 0.1;
    }}

    // Show how behavior adapts based on experience
    decideAction(worldState, otherEntities) {{...}}
}}
```

3. Interaction Systems:
```javascript
/**
 * Define systems that handle rich interactions between:
 * - Characters and environment
 * - Characters with each other
 * - Chain reactions and emergent effects
 */
class InteractionSystem extends System {{
    constructor() {{
        this.reactions = new Map();
        this.chainEffects = [];
    }}

    // Show how different elements interact
    processInteractions(entities, environment) {{...}}
}}
```

4. Game State Evolution:
```javascript
/**
 * Track how the game state evolves through:
 * - Character learning and adaptation
 * - Environmental changes
 * - Emergent behaviors
 */
class GameState {{
    constructor() {{
        this.characterStates = new Map();
        this.environmentState = new Map();
        this.emergentEffects = [];
    }}

    // Show how the game evolves over time
    evolve(deltaTime) {{...}}
}}
```

Create a structure that enables:
- Rich autonomous behaviors
- Character learning and adaptation
- Environmental chain reactions
- Emergent gameplay moments

Your response MUST be wrapped in a ```javascript code block and include detailed docstrings explaining behavior patterns."""

        fuzzy_code = self._call_model_api(prompt, debug=debug)

        # First try to extract code block
        pattern = r"```javascript\s*(.*?)```"
        match = re.search(pattern, fuzzy_code, re.DOTALL)

        if match:
            return match.group(1).strip()

        # If no code block found, provide a character-driven structure
        if debug:
            print(
                f"{YELLOW}No valid code block found, generating character-driven structure...{RESET}"
            )

        return """/**
 * Core component for autonomous behavior
 * @property {string} type - Component type identifier
 * @property {Object} state - Current state variables
 * @property {Function} behaviorPattern - Update function for autonomous behavior
 */
class BehaviorComponent extends Component {
    constructor(type, behaviorPattern) {
        super(type);
        this.state = new Map();
        this.behaviorPattern = behaviorPattern;
        this.memory = new Map();
        this.evolutionStage = 0;
    }

    /**
     * Update this component's state and behavior
     * @param {number} deltaTime - Time since last update
     * @param {Object} worldState - Current game state
     * @param {Array<Entity>} entities - All game entities
     */
    update(deltaTime, worldState, entities) {
        // Execute behavior pattern
        this.behaviorPattern(this, worldState, entities);
        
        // Learn from interactions
        this._evolvePattern();
        
        // Update state based on memory
        this._updateState();
    }
}

/**
 * System for processing character and environment interactions
 */
class InteractionSystem {
    constructor() {
        this.reactionHandlers = new Map();
        this.chainEffects = [];
    }

    /**
     * Register a new type of interaction
     * @param {string} trigger - What triggers this interaction
     * @param {Function} handler - How to handle the interaction
     * @param {Array<string>} chainEffects - What other effects might trigger
     */
    registerInteraction(trigger, handler, chainEffects = []) {
        this.reactionHandlers.set(trigger, {
            handler,
            chainEffects
        });
    }

    /**
     * Process all pending interactions
     * @param {Array<Entity>} entities - All game entities
     * @param {Object} worldState - Current game state
     */
    update(entities, worldState) {
        // Process direct interactions
        this._handleDirectInteractions(entities);
        
        // Process chain reactions
        this._processChainEffects(worldState);
        
        // Update world state based on interactions
        this._evolveWorld(worldState);
    }
}

/**
 * Game state manager that tracks evolution and emergence
 */
class GameState {
    constructor() {
        this.entityStates = new Map();
        this.environmentState = new Map();
        this.emergentEffects = [];
        this.learningHistory = new Map();
    }

    /**
     * Update game state and process emergent effects
     * @param {number} deltaTime - Time since last update
     */
    evolve(deltaTime) {
        // Update entity states
        this._updateEntities(deltaTime);
        
        // Process environmental changes
        this._evolveEnvironment(deltaTime);
        
        // Handle emergent behaviors
        this._processEmergentEffects();
        
        // Update learning and adaptation
        this._updateLearning();
    }
}

/**
 * Main game loop with character-driven updates
 * @param {number} timestamp - Current timestamp
 */
function gameLoop(timestamp) {
    const deltaTime = calculateDeltaTime(timestamp);
    
    // Update autonomous behaviors
    updateBehaviors(deltaTime);
    
    // Process interactions and chain reactions
    processInteractions();
    
    // Evolve game state
    gameState.evolve(deltaTime);
    
    // Handle emergent effects
    processEmergentEffects();
    
    requestAnimationFrame(gameLoop);
}"""
