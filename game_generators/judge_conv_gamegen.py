import os
import re
import random
from typing import Tuple, List, Optional, Dict, Any, Literal
from openai import OpenAI
from langchain.prompts import PromptTemplate
import datetime

from game_generators.base_game_generator import BaseGameGenerator

# Import additional clients based on model type
try:
    import anthropic
except ImportError:
    anthropic = None

try:
    from google import genai
except ImportError:
    genai = None

from game_generators.utils import GREEN, YELLOW, BLUE, RED, RESET


class JudgeConvGameGen(BaseGameGenerator):
    """
    Simple game generator that uses a single-shot prompt to generate games
    based on the approach in generate_game_singleshot.py
    """

    method_name = "judge_conversation"

    def __init__(
        self,
        config_path: str = "config/gamegen/base_prompt.yaml",
        model_name: str = "openai:o3-mini",
    ):
        """
        Initialize the simple prompt generator

        Args:
            config_path: Path to the configuration YAML file
            model_name: Name of the AI model to use with provider prefix
                        Format: "provider:model" (e.g., "openai:o3-mini", "claude:claude-3-haiku", "gemini:gemini-1.5-flash")
        """
        super().__init__(config_path)
        # Parse model provider and name
        self.model_provider, self.model = self._parse_model_name(model_name)
        # Initialize appropriate client based on model provider
        self.client = self._initialize_client()

    def _parse_model_name(self, model_name: str) -> Tuple[str, str]:
        """
        Parse the model name string to extract provider and model name

        Args:
            model_name: String in format "provider:model"

        Returns:
            Tuple of (provider, model)
        """
        if ":" in model_name:
            provider, model = model_name.split(":", 1)
            return provider.lower(), model
        else:
            # Default to OpenAI if no provider specified
            return "openai", model_name

    def _initialize_client(self):
        """
        Initialize the appropriate client based on the model provider

        Returns:
            Initialized client for the selected model provider
        """
        if self.model_provider == "openai":
            return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        elif self.model_provider == "claude":
            if anthropic is None:
                raise ImportError(
                    "The 'anthropic' package is required to use Claude models. Install it with 'pip install anthropic'."
                )
            return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        elif self.model_provider == "gemini":
            if genai is None:
                raise ImportError(
                    "The 'google-generativeai' package is required to use Gemini models. Install it with 'pip install google-generativeai'."
                )
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            return genai

        else:
            raise ValueError(
                f"Unsupported model provider: {self.model_provider}. Supported providers are 'openai', 'claude', and 'gemini'."
            )

    def generate_prompt(self, genre: str, num_players: int) -> str:
        """
        Generate the game creation prompt using LangChain's PromptTemplate
        Reused from SimplePromptGen
        """
        # Fixed actions for each agent, matching the original implementation
        actions = "arrow keys, shift, space bar, w, a, s, d"

        template = (
            "Generate a interesting engaging continual {genre} game with intelligent{num_agents} agents using p5.js. "
            "The game must be playable on a basic HTML webpage.\n"
            "Game details:\n"
            "- Genre: {genre}\n"
            "- Total number of agents: {num_agents}\n"
            "- Number of controllable agents: 1\n"
            "- Actions available for each controllable agent: {actions}\n"
            "- Decide the state of the game and the state of each agent with variables and their types ranges.\n"
            "- Decide the objectives for success and failure conditions and the rewards for each agent.\n"
            "- Decide the random initial conditions of the game and the initial state of each agent for each restart of the game.\n"
            "- On success or failure, the game should be over with a message to the human player in the game window.\n"
            "- The gameplay should be engaging and interesting and should look aesthetically pleasing.\n"
            "- Mention the name of the game and the actions in the html above the game canvas.\n"
            "- No audio should be used.\n"
        )

        prompt_template = PromptTemplate(
            input_variables=["genre", "num_agents", "actions"],
            template=template,
        )

        return prompt_template.format(
            genre=genre, num_agents=num_players, actions=actions
        )

    def generate_instructions(self) -> str:
        """
        Generate instructions based on configuration requirements

        Returns:
            str: Instructions string
        """
        requirements = self.config.get("requirements", {})
        allowed_libraries = requirements.get(
            "allowed_libraries",
            {"p5.js": "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"},
        )

        instructions = "Your generated game should follow these requirements:\n"

        if allowed_libraries:
            instructions += "- You can use these libraries:\n"
            for lib, url in allowed_libraries.items():
                instructions += f"  * {lib}: {url}\n"

        if not requirements.get("audio", False):
            instructions += "- Do not use audio in the game\n"

        if requirements.get("start_end_screen", True):
            instructions += "- Include a start screen and a game over screen\n"

        return instructions

    def generate_game(
        self, genre: str, num_players: int
    ) -> Tuple[str, List[Tuple[str, str]], str, str, str]:
        """
        Generate game through conversation and code generation phases,
        following the simpler approach from conv_gamegen.py
        """
        # Validate genre
        if genre not in self.valid_genres:
            genre = random.choice(self.valid_genres)

        # Phase 1: Conversational Planning
        plan = self._conversational_planning(genre, num_players)

        # Phase 2: Code Generation
        code_prompt = self._create_code_gen_prompt(plan, genre, num_players)
        print(f"\n{GREEN}Code Generation Prompt:\n{code_prompt['user']}")

        if self.model_provider == "openai":
            code_response = (
                self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": code_prompt["system"]},
                        {"role": "user", "content": code_prompt["user"]},
                    ],
                    max_completion_tokens=10000,
                )
                .choices[0]
                .message.content
            )
        else:
            # For non-OpenAI models, combine system and user messages
            combined_prompt = f"{code_prompt['system']}\n\n{code_prompt['user']}"
            code_response = self._call_model_api(combined_prompt)

        print(f"\n{YELLOW}Code Generation:\n{code_response}{RESET}")

        # Parse HTML and JavaScript from the response
        html_code, js_code = self._parse_html_js_blocks(code_response)

        # Create js_files list format
        js_files = [("game.js", js_code)] if js_code else []

        # Combine all responses for the conversation log
        full_response = f"""Planning Phase Discussion:
{plan['full_plan']}

Generated Code:
{code_response}"""

        # Save files to disk
        self._save_generated_files(
            genre=genre,
            title=plan.get("title", f"A {genre} Game"),
            html_code=html_code,
            js_files=js_files,
            description=plan.get(
                "description", f"A {genre} game with {num_players} agents"
            ),
            full_response=full_response,
            num_players=num_players,
        )

        return (
            html_code,
            js_files,
            plan.get("title", f"A {genre} Game"),
            plan.get("description", f"A {genre} game with {num_players} agents"),
            full_response,
        )

    def _parse_html_js_blocks(self, response_text: str) -> Tuple[str, str]:
        """
        Extract HTML and JavaScript code blocks from the response

        Args:
            response_text: Full response text from the model

        Returns:
            Tuple of (html_code, js_code)
        """
        html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
        js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)

        html_code = html_match.group(1).strip() if html_match else ""
        js_code = js_match.group(1).strip() if js_match else ""

        return html_code, js_code

    def _save_generated_files(
        self,
        genre: str,
        title: str,
        html_code: str,
        js_files: List[Tuple[str, str]],
        description: str,
        full_response: str,
        num_players: int,
    ):
        """
        Save all generated files to disk with proper validation
        """
        from pathlib import Path
        import json
        import re

        # Create safe title for directory name
        safe_title = (
            "".join(c for c in title if c.isalnum() or c in (" ", "_"))
            .replace(" ", "_")
            .lower()
        )

        # Create game directory
        game_dir = Path("games") / self.method_name / self.model / genre / safe_title
        game_dir.mkdir(parents=True, exist_ok=True)

        # Validate and extract code if not provided directly
        if not html_code or not js_files:
            print("\nAttempting to extract code from full response...")
            # Look for code blocks with markdown formatting
            code_blocks = self._parse_code_blocks(full_response)

            if not html_code and code_blocks.get("html"):
                html_code = code_blocks["html"][0]
                print("Extracted HTML code from response")

            if not js_files and code_blocks.get("javascript"):
                js_code = code_blocks["javascript"][0]
                js_files = [("game.js", js_code)]
                print("Extracted JavaScript code from response")

        # Validate HTML code
        if html_code:
            if not html_code.strip().startswith(("<!DOCTYPE", "<html")):
                print("Warning: Invalid HTML code format")
            else:
                with open(game_dir / "index.html", "w", encoding="utf-8") as f:
                    f.write(html_code)
                    print(f"Saved index.html")

        # Validate and save JavaScript files
        for filename, content in js_files:
            # Basic validation of JavaScript content
            if content.strip().startswith(("<!DOCTYPE", "<html")):
                print(f"Warning: {filename} contains HTML instead of JavaScript")
                continue

            if not any(
                keyword in content for keyword in ["function", "let", "var", "const"]
            ):
                print(f"Warning: {filename} may not contain valid JavaScript code")
                continue

            with open(game_dir / filename, "w", encoding="utf-8") as f:
                f.write(content)
                print(f"Saved {filename}")

        # Save description
        with open(game_dir / "description.txt", "w", encoding="utf-8") as f:
            f.write(f"Title: {title}\n\n{description}")
            print(f"Saved description.txt")

        # Save conversation log
        with open(game_dir / "conversation_log.txt", "w", encoding="utf-8") as f:
            f.write(full_response)
            print(f"Saved conversation_log.txt")

        # Save metadata
        metadata = {
            "game_name": title,
            "game_description": description,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "model": f"{self.model_provider}:{self.model}",
            "genre": genre,
            "num_players": num_players,
        }

        with open(game_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
            print(f"Saved metadata.json")

        print(f"\nAll files saved in: {game_dir}")

    def _conversational_planning(self, genre: str, num_players: int) -> dict:
        """
        Conduct a creative-focused conversation with critical evaluation
        """

        context = {
            "genre": genre,
            "num_players": num_players,
            "conversation_history": [],
            "key_points": set(),
            "ready_for_code": False,
            "evaluation_score": 0,
        }

        print(f"\n{BLUE}Starting creative game design session...{RESET}")

        while not context["ready_for_code"]:
            if not context["conversation_history"]:
                # Initial creative spark
                current_prompt = f"""Let's create something really unique! I'm thinking of a {genre} game, but with an unexpected twist.
What's the most interesting and unique game mechanic we could introduce that would make players go "Wow, I've never seen that in a {genre} game before!"?

Don't worry about implementation yet - let's focus on making it creative and fun!"""
            else:
                # Evaluate current ideas and decide next step
                evaluation = self._evaluate_current_plan(context)

                if evaluation["ready_for_code"]:
                    context["ready_for_code"] = True
                    break

                current_prompt = self._generate_next_prompt(evaluation)

            # Get AI response
            print(f"\n{GREEN}{current_prompt}{RESET}")
            response = self._call_model_api(current_prompt)
            context["conversation_history"].append(("AI", response))
            print(f"\n{YELLOW}{response}{RESET}")

            # Update key points
            self._update_key_points(response, context)

        # Create final game plan
        final_plan = self._create_final_creative_plan(context)
        return {
            "title": self._extract_title(final_plan),
            "description": self._extract_description(final_plan),
            "full_plan": final_plan,
            "conversation_history": context["conversation_history"],
        }

    def _evaluate_current_plan(self, context: dict) -> dict:
        """
        Critically evaluate the current game plan and decide if it's ready for implementation
        """
        # Initialize tracking variables if not present
        if "previous_ratings" not in context:
            context["previous_ratings"] = {}
            context["improvement_count"] = 0
            context["stagnant_rounds"] = 0  # Track rounds without improvement
            context["total_rounds"] = 0  # Track total conversation rounds

        evaluation_prompt = f"""Let's evaluate our current game idea for this {context['genre']} game.
Rate each aspect from 1-5 (5 being excellent):

Previous discussion summary:
{self._summarize_conversation(context['conversation_history'])}

Key elements identified:
{self._format_key_points(context['key_points'])}

Please evaluate:
1. Uniqueness: How original is our core mechanic? 
2. Fun Factor: Will this be genuinely enjoyable to play?
3. Feasibility: Can we implement this with p5.js?
4. Clarity: Is the game concept clear enough to implement?
5. Completeness: Do we have all necessary details?

Respond in a structured format:
RATINGS: (list each score with /5 at the end)
STRENGTHS: (key strong points, keep it short)
WEAKNESSES: (areas needing work, emphasize the need for improvement)
RECOMMENDATION: (continue or ready for code)
FOCUS: (what to focus on next)"""

        evaluation_response = self._call_model_api(evaluation_prompt)
        print(f"\n{BLUE}Evaluation:{RESET}\n{evaluation_response}")

        # Parse evaluation response
        current_ratings = self._parse_ratings(evaluation_response)
        focus = self._extract_focus(evaluation_response)

        # Count improvements and high scores
        improvements = 0
        good_scores = 0
        context["total_rounds"] += 1

        for aspect, score in current_ratings.items():
            # Count scores of 4 or 5 as good
            if score >= 4:
                good_scores += 1

            # Check for improvements from previous ratings
            prev_score = context["previous_ratings"].get(aspect, 0)
            if score > prev_score:
                improvements += 1

        # Update improvement tracking
        if improvements > 0:
            context["improvement_count"] += 1
            context["stagnant_rounds"] = (
                0  # Reset stagnant rounds when we see improvement
            )
        else:
            context["stagnant_rounds"] += 1

        # Store current ratings for next comparison
        context["previous_ratings"] = current_ratings

        # Decision criteria:
        # 1. Most scores are good (4 or 5)
        # 2. OR we've reached the maximum number of rounds
        # 3. OR we've been stagnant for too long
        ready_for_code = (
            good_scores >= 3  # At least 3 out of 5 aspects are good
            or context["stagnant_rounds"] >= 1  # No improvements for 1 rounds
            or context["total_rounds"] >= 3  # Maximum rounds reached
        )

        if ready_for_code:
            reason = (
                "excellent scores"
                if good_scores >= 3
                else (
                    "no recent improvements"
                    if context["stagnant_rounds"] >= 1
                    else "maximum rounds reached"
                )
            )
            print(f"\n{BLUE}Ready to generate code ({reason}){RESET}")

        return {
            "ratings": current_ratings,
            "ready_for_code": ready_for_code,
            "focus": focus,
            "full_evaluation": evaluation_response,
            "improvements": improvements,
            "good_scores": good_scores,
            "stagnant_rounds": context["stagnant_rounds"],
            "total_rounds": context["total_rounds"],
        }

    def _generate_next_prompt(self, evaluation: dict) -> str:
        """
        Generate the next conversation prompt based on evaluation
        """
        if evaluation["ratings"].get("Uniqueness", 0) < 4:
            return """Let's make this more unique! What if we:
- Combined unexpected game elements?
- Reversed a typical genre convention?
- Added a surprising twist to the core mechanic?

What's the boldest, most creative idea we could try?"""

        elif evaluation["ratings"].get("Fun Factor", 0) < 4:
            return """The concept is unique, but let's make it more fun! Consider:
- What would make players smile while playing?
- How could we add more satisfying moments?
- What would make players want "just one more try"?

How could we amp up the enjoyment factor?"""

        elif evaluation["ratings"].get("Feasibility", 0) < 4:
            return """Let's make this more implementable while keeping the fun:
- Which core mechanics are most essential?
- How could we simplify while maintaining the fun?
- What's the minimum viable version that's still exciting?

How should we refine the concept?"""

        else:
            return f"""Let's focus on {evaluation['focus']}:
- How could we improve this aspect?
- What details are we missing?
- What would make this element stronger?

Share your thoughts on making this even better!"""

    def _parse_ratings(self, evaluation: str) -> dict:
        """
        Parse numerical ratings from evaluation response
        """
        ratings = {}
        rating_patterns = {
            "Uniqueness": r"Uniqueness:\s*(\d+)",
            "Fun Factor": r"Fun Factor:\s*(\d+)",
            "Feasibility": r"Feasibility:\s*(\d+)",
            "Clarity": r"Clarity:\s*(\d+)",
            "Completeness": r"Completeness:\s*(\d+)",
        }

        for aspect, pattern in rating_patterns.items():
            match = re.search(pattern, evaluation, re.IGNORECASE)
            if match:
                ratings[aspect] = int(match.group(1))

        return ratings

    def _extract_focus(self, evaluation: str) -> str:
        """
        Extract the recommended focus area from evaluation
        """
        focus_match = re.search(r"FOCUS:\s*(.*?)(?:\n|$)", evaluation, re.IGNORECASE)
        return focus_match.group(1).strip() if focus_match else "core mechanics"

    def _format_key_points(self, key_points: set) -> str:
        """
        Format key points for evaluation
        """
        return "\n".join(f"- {point}" for point in key_points)

    def _update_key_points(self, response: str, context: dict) -> None:
        """
        Extract and track key points from the conversation
        """
        # Look for key phrases that indicate important points
        key_phrases = [
            r"(?:could|should|might|would)\s+(?:have|include|feature|add)\s+(.*?)(?:\.|\?|!)",
            r"(?:imagine|think about|consider)\s+(.*?)(?:\.|\?|!)",
            r"(?:what if|how about)\s+(.*?)(?:\.|\?|!)",
            r"(?:important|key|crucial|essential)\s+(?:aspect|feature|part|element)\s+(?:is|would be)\s+(.*?)(?:\.|\?|!)",
        ]

        for phrase in key_phrases:
            matches = re.finditer(phrase, response, re.IGNORECASE)
            for match in matches:
                point = match.group(1).strip()
                if len(point) > 10:  # Ignore very short matches
                    context["key_points"].add(point)

    def _check_ready_for_implementation(self, context: dict) -> bool:
        """
        Check if we have enough detail to implement the game
        """
        required_aspects = {
            "mechanics": ["gameplay", "control", "action", "movement"],
            "objectives": ["goal", "win", "lose", "score", "objective"],
            "progression": ["difficulty", "level", "challenge", "progress"],
            "interaction": ["player", "interact", "multiplayer", "cooperation"],
        }

        covered_aspects = {aspect: False for aspect in required_aspects}

        # Check if key points cover all required aspects
        for point in context["key_points"]:
            for aspect, keywords in required_aspects.items():
                if any(keyword in point.lower() for keyword in keywords):
                    covered_aspects[aspect] = True

        # Need at least 5 key points and all aspects covered
        return len(context["key_points"]) >= 5 and all(covered_aspects.values())

    def _create_summary_prompt(self, context: dict) -> str:
        """
        Create a prompt to summarize the conversation into a final plan
        """
        return f"""Great! Let's summarize our discussion about this {context['genre']} game into a clear plan.
Based on our conversation:

{self._summarize_conversation(context['conversation_history'])}

Please provide a structured summary including:
1. Title: A catchy name for the game
2. Description: A brief, exciting overview of the gameplay
3. Core Mechanics: The key gameplay elements we discussed
4. Player Experience: How the game engages and challenges players
5. Technical Considerations: Key implementation details to keep in mind

Keep the tone enthusiastic but make sure all important technical details are included for implementation."""

    def _summarize_conversation(self, history: list) -> str:
        """
        Create a brief summary of the conversation history
        """
        if not history:
            return "We're just getting started!"

        # Extract main points from each exchange
        summary_points = []
        for role, message in history[-3:]:  # Focus on recent messages
            # Extract sentences that seem to contain key information
            sentences = re.split(r"[.!?]+", message)
            for sentence in sentences:
                if re.search(
                    r"\b(would|could|should|must|will|can|idea|suggest|think|consider)\b",
                    sentence,
                    re.IGNORECASE,
                ):
                    summary_points.append(sentence.strip())

        return " ".join(summary_points)

    def _parse_code_blocks(self, response_text: str) -> dict:
        """
        Parse the response text to extract HTML and JavaScript code blocks

        Args:
            response_text: Full response text from the model

        Returns:
            dict containing HTML and JavaScript code blocks
        """
        code_blocks = {}
        html_match = re.search(r"```html\s*(.*?)```", response_text, re.DOTALL)
        js_match = re.search(r"```javascript\s*(.*?)```", response_text, re.DOTALL)

        if html_match:
            code_blocks["html"] = [html_match.group(1).strip()]
        if js_match:
            code_blocks["javascript"] = [js_match.group(1).strip()]

        return code_blocks

    def _create_code_gen_prompt(self, plan: dict, genre: str, num_players: int) -> dict:
        """`
        Create a code generation prompt following conv_gamegen.py's approach,
        with system and user messages for OpenAI
        """
        # Get HTML template and p5.js URL from config
        html_template = self.config.get("templates", {}).get("html", "")
        p5js_url = (
            self.config.get("requirements", {})
            .get("allowed_libraries", {})
            .get("p5.js", "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js")
        )

        # Format the HTML template with title and p5.js URL
        formatted_html = (
            html_template.format(title=plan.get("title", "Game"), p5js_url=p5js_url)
            if html_template
            else ""
        )

        # Get control scheme from config
        controls = self.config.get("constraints", {}).get("controls", [])
        control_info = "Controls available:\n"
        for control in controls:
            if isinstance(control, dict):
                for key, value in control.items():
                    if key == "arrow_keys":
                        control_info += f"- Arrow keys (LEFT: {value['left']}, UP: {value['up']}, RIGHT: {value['right']}, DOWN: {value['down']})\n"
                    elif key == "wasd_keys":
                        control_info += f"- WASD keys (W: {value['w']}, A: {value['a']}, S: {value['s']}, D: {value['d']})\n"
            else:
                if control == "space_bar":
                    control_info += "- Space bar (keyCode 32)\n"
                elif control == "shift_key":
                    control_info += "- Shift key (keyCode 16)\n"

        # Get library requirements
        libraries = self.config.get("requirements", {}).get("allowed_libraries", {})
        library_info = "Required libraries:\n"
        for lib, url in libraries.items():
            library_info += f"- {lib}: {url}\n"

        # Create system message with implementation requirements
        system_message = f"""You are a game developer who creates p5.js games. Follow these implementation requirements:
{control_info}
{library_info}
- The game must be playable on a basic HTML webpage
- Include start and game over screens with clear instructions
- No audio should be used
- The game should be visually appealing
- Canvas size should be 800x600 pixels
- All code must be provided in properly formatted markdown code blocks
- HTML code must be wrapped in ```html tags
- JavaScript code must be wrapped in ```javascript tags"""

        # Create user message with game details
        user_message = f"""Generate a p5.js game based on this creative design:
Title: {plan.get('title', 'Game')}
Genre: {genre}
Players: {num_players}

Game Plan:
{plan.get('full_plan', '')}

Please output your code in exactly two Markdown code blocks:
1. First block of HTML code following the given format:
```html
{formatted_html}
```

2. Second block of JavaScript code based on the plan and given requirements:
```javascript
// Game implementation here
```
"""
        return {"system": system_message, "user": user_message}

    def _call_model_api(self, prompt: str) -> str:
        """
        Call the appropriate model API based on the provider
        """
        try:
            if self.model_provider == "openai":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    max_completion_tokens=6000,
                )
                return response.choices[0].message.content

            elif self.model_provider == "claude":
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=6000,
                    messages=[{"role": "user", "content": prompt}],
                )
                return response.content[0].text

            elif self.model_provider == "gemini":
                model = self.client.GenerativeModel(model_name=self.model)
                response = model.generate_content(prompt)
                return response.text

        except Exception as e:
            print(f"\n{RED}Error in API call: {str(e)}{RESET}")
            return ""

    def _analyze_conversation_coverage(self, context: dict) -> set:
        """
        Analyze the conversation history to determine which topics have been covered

        Args:
            context: Dictionary containing conversation history and other context

        Returns:
            Set of covered topic areas
        """
        covered_topics = set()

        # Topic keywords mapping
        topic_keywords = {
            "core_mechanics": [
                "gameplay",
                "mechanic",
                "control",
                "move",
                "action",
                "play",
            ],
            "player_interaction": [
                "interact",
                "player",
                "multiplayer",
                "cooperation",
                "versus",
            ],
            "challenge_progression": [
                "difficulty",
                "progress",
                "level",
                "challenge",
                "harder",
            ],
            "fun_factor": ["fun", "enjoy", "exciting", "engaging", "interest"],
            "unique_features": [
                "unique",
                "special",
                "innovative",
                "different",
                "twist",
            ],
        }

        # Check conversation history for topic coverage
        for _, message in context["conversation_history"]:
            message_lower = message.lower()
            for topic, keywords in topic_keywords.items():
                if any(keyword in message_lower for keyword in keywords):
                    covered_topics.add(topic)

        # Also check key points for topic coverage
        for point in context["key_points"]:
            point_lower = point.lower()
            for topic, keywords in topic_keywords.items():
                if any(keyword in point_lower for keyword in keywords):
                    covered_topics.add(topic)

        return covered_topics

    def _create_final_creative_plan(self, context: dict) -> str:
        """
        Create a final plan focusing on the most creative and interesting aspects
        """
        # Get the best-rated aspects from our last evaluation
        if "previous_ratings" in context:
            strongest_aspects = [
                aspect
                for aspect, score in context["previous_ratings"].items()
                if score >= 4
            ]
        else:
            strongest_aspects = []

        # Get the most interesting key points
        key_mechanics = sorted(
            list(context["key_points"]), key=lambda x: len(x), reverse=True
        )[:3]

        # Create an enthusiastic summary
        summary = f"""FINAL GAME CONCEPT

Title: {self._generate_creative_title(context)}

Description:
A unique {context['genre']} game that {"stands out with " + ", ".join(strongest_aspects).lower() if strongest_aspects else "features innovative gameplay"}. 
{key_mechanics[0] if key_mechanics else ""}

Core Mechanics:
{self._format_mechanics(key_mechanics)}

Player Experience:
- Players will enjoy {self._extract_fun_elements(context)}
- Challenge comes from {self._extract_challenge_elements(context)}
- Progression feels rewarding through {self._extract_progression_elements(context)}

Technical Implementation:
- Core game loop focuses on {key_mechanics[0] if key_mechanics else "main gameplay mechanics"}
- Uses {context['num_players']} agents for {self._describe_player_interaction(context)}
- Visual style emphasizes the {context['genre']} elements while maintaining clarity
"""
        return summary

    def _generate_creative_title(self, context: dict) -> str:
        """Generate a creative title based on the game's unique elements"""
        # Extract interesting words from conversation
        key_words = set()
        for _, message in context["conversation_history"]:
            # Look for interesting adjectives and nouns
            words = re.findall(r"\b[A-Z][a-z]{3,}\b", message)
            key_words.update(words)

        # Add genre-specific words
        genre_words = {
            "arcade": ["Arena", "Nexus", "Pulse", "Vector", "Quantum"],
            "puzzle": ["Enigma", "Cipher", "Logic", "Mind", "Prism"],
            "platformer": ["Realm", "Quest", "Journey", "Voyage", "Path"],
            # Add more genres as needed
        }

        if context["genre"] in genre_words:
            key_words.update(genre_words[context["genre"]])

        # Generate title
        if len(key_words) >= 2:
            main_word = random.choice(list(key_words))
            subtitle = random.choice(list(key_words - {main_word}))
            return f"{main_word}: {subtitle}"
        else:
            return f"The {context['genre'].title()} Master"

    def _format_mechanics(self, mechanics: list) -> str:
        """Format the core mechanics in a readable way"""
        if not mechanics:
            return "- Standard genre mechanics with unique twists"
        return "\n".join(f"- {mech}" for mech in mechanics)

    def _extract_fun_elements(self, context: dict) -> str:
        """Extract what makes the game fun from the conversation"""
        fun_keywords = ["exciting", "enjoyable", "satisfying", "engaging", "fun"]
        for _, message in context["conversation_history"]:
            for keyword in fun_keywords:
                match = re.search(f".*{keyword}.*?(?:\.|\n|$)", message, re.IGNORECASE)
                if match:
                    return match.group(0).strip()
        return "unique gameplay mechanics and engaging challenges"

    def _extract_challenge_elements(self, context: dict) -> str:
        """Extract the main challenge elements from the conversation"""
        challenge_keywords = ["challenge", "difficult", "skill", "master"]
        for _, message in context["conversation_history"]:
            for keyword in challenge_keywords:
                match = re.search(f".*{keyword}.*?(?:\.|\n|$)", message, re.IGNORECASE)
                if match:
                    return match.group(0).strip()
        return "progressively harder challenges and strategic decision-making"

    def _extract_progression_elements(self, context: dict) -> str:
        """Extract progression mechanics from the conversation"""
        progression_keywords = ["progress", "advance", "improve", "unlock"]
        for _, message in context["conversation_history"]:
            for keyword in progression_keywords:
                match = re.search(f".*{keyword}.*?(?:\.|\n|$)", message, re.IGNORECASE)
                if match:
                    return match.group(0).strip()
        return "increasing complexity and player skill development"

    def _describe_player_interaction(self, context: dict) -> str:
        """Describe how players/agents interact"""
        if context["num_players"] > 1:
            return "competitive and cooperative gameplay elements"
        return "dynamic challenge and engagement"

    def _extract_title(self, final_plan: str) -> str:
        """
        Extract the title from the final game plan

        Args:
            final_plan: The complete final game plan string

        Returns:
            str: The game title, or a default if not found
        """
        # Look for title in the final plan
        title_match = re.search(r"Title:\s*(.*?)(?:\n|$)", final_plan, re.IGNORECASE)
        if title_match:
            return title_match.group(1).strip()

        # Default title if nothing found
        return f"The {self.model} {random.choice(['Adventure', 'Challenge', 'Game'])}"

    def _extract_description(self, final_plan: str) -> str:
        """
        Extract the game description from the final plan

        Args:
            final_plan: The complete final game plan string

        Returns:
            str: The game description, or a default if not found
        """
        # Look for description section in final plan
        desc_match = re.search(
            r"Description:\s*(.*?)(?:\n\n|\Z)", final_plan, re.IGNORECASE | re.DOTALL
        )
        if desc_match:
            return desc_match.group(1).strip()

        # Try to construct description from core mechanics
        mechanics_match = re.search(
            r"Core Mechanics:\s*(.*?)(?:\n\n|\Z)", final_plan, re.IGNORECASE | re.DOTALL
        )
        if mechanics_match:
            mechanics = mechanics_match.group(1).strip()
            return mechanics

        # Default description
        return "An innovative game with unique mechanics and engaging gameplay"
