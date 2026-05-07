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
