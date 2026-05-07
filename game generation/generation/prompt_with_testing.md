Build a polished but compact {library_name} browser game based on the source context below.

<game_context>
{game_context}
</game_context>

Requirements:
- Use {library_name}.
- {library_prompt_notes}
- Output a middle-ground scaffold, not a single giant file and not an overengineered project.
- Aim for these files: `index.html`, `game.js`, `state.js`, `ui.js`.
- Keep modules small and readable. Add one or two helper files only if they clearly help.
- The game must be playable with keyboard input only.
- Include a start screen, active gameplay, pause state, and restart flow.
- No external assets, no audio, no images, no fonts. Draw everything in code.
- Keep the game concept recognizable, but simplify freely where needed to make the game fun and achievable.
- Prefer one strong core loop over many systems.

Use this HTML shape as a reference:

<example_html>
{example_html}
</example_html>

Return only the following blocks:

<game_title>
Short title
</game_title>

<game_description>
One short paragraph describing the goal and feel of the game.
</game_description>

<game_controls>
- Key: action
</game_controls>

<automated_testing>
Up to 5 tests that exercise core gameplay. Each test names a behavior, the
keypresses that trigger it, and what the game state should look like afterwards.
The test driver presses ENTER to start the game and then sends randomized
gameplay keys; tests should describe outcomes that hold under that style of play.

<TEST_1>
<test_description>What is being tested and why.</test_description>
<strategy_description>Which keys to press and in what order.</strategy_description>
<expected_outcome>What state change or visual change indicates success.</expected_outcome>
</TEST_1>
<TEST_2>
...
</TEST_2>
</automated_testing>

<code filename="state.js">
// state module
</code>

<code filename="ui.js">
// ui module
</code>

<code filename="game.js">
// main game module
</code>

<code filename="index.html">
<!-- final html -->
</code>

Do not add commentary outside those tags.
