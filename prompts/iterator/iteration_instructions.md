{hard_constraints}

<instructions>
<task>
Use the FEEDBACK to improve the existing game by updating exactly one source file. Your update must be the minimal coherent change that addresses the FEEDBACK while preserving existing features and style. You must return the complete contents of the single updated file and nothing else.

Rules:
- Do not invent new files. Update only one file that already exists unless the FEEDBACK explicitly requires creating a new file; in that case, you may create it, but still output only one <updated_code> block.
- Apply changes surgically and keep behavior consistent with the current code architecture.
- Maintain ES6 modules and imports. Avoid dynamic requires.
- Ensure the game still starts with ENTER, supports PAUSE and RESTART if already implemented, and remains playable after your change.
</task>

{code_instructions}

<context_format>
- You will receive the current game files in this format:
  <current_files>
    <file name="RELATIVE_PATH">
    ```javascript
    // file contents
    ```
    </file>
    ...
  </current_files>
- You will also receive:
  <feedback>
  ...
  </feedback>
</context_format>

<what_to_return>
Follow these output instructions exactly. Do not include explanations unless explicitly requested inside the tags.
Refer to the iterator output instructions loaded in the prompt.
</what_to_return>

</instructions>


