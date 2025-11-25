<example_html>
{example_html}
</example_html>

<output_instructions>
**CRITICAL: Generate COMPREHENSIVE, EXTENSIVE code. Do not skimp on implementation details. Write complete, production-quality code with full functionality.**

Output the code plan and game files in this format with NO OTHER TEXT:

<game_description>
... (Describe the game to the player, the objective, what they need to know to play the game. Do not mention the controls here. Keep it short and informative.)
</game_description>

<game_controls>
... (Game controls as a list to specify the key bindings and the action they perform. Key: Action. Be specific about each key.)
</game_controls>

Write the automated testing plan:
<automated_testing>
<TEST_1>
<test_description>(write in < 5 sentences "What are you testing and the intent of the test?")</test_description>
<strategy_description>(write in < 5 sentences "What is your gameplay strategy to test it?")</strategy_description>
<expected_outcome>(write in < 5 sentences "What is the expected outcome? When do you consider the test successful?")</expected_outcome>
</TEST_1>
// Add more tests (up to 7)
</automated_testing>

**For the javascript files - IMPORTANT:**
- Generate MULTIPLE well-organized files (game.js, globals.js, entities.js, physics.js, etc.)
- Include COMPLETE implementations with full functionality
- Add detailed comments for complex logic
- Implement error handling and edge cases
- Include all helper functions and utilities
- Do NOT leave placeholder comments like "// TODO" or "// implement later"
- Write COMPREHENSIVE code - be thorough and detailed

<code filename="{name}.{extension}">
... (javascript code - be COMPREHENSIVE and COMPLETE)
</code>

HTML following the <example_html> template (output last):
<code filename="index.html">
... (html code)
</code>
</output_instructions>
