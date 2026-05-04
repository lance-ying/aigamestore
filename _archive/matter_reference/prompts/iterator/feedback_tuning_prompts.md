# Feedback Tuning Generator Prompts

This document describes the prompt templates used for tuning existing games based on human feedback.

## Overview

The feedback tuning generator supports two modes:
1. **Planning Mode** (`use_planning=True`): LLM analyzes the issue first, then provides fixes
2. **Direct Mode** (`use_planning=False`): LLM directly outputs updated files

## Output Format Instructions

### Planning Mode Output Format

When `use_planning=True`, the LLM must follow this structure:

```xml
<output_instructions>
IMPORTANT: Your response must have TWO sections in this exact order:

1. First, output your analysis in <analysis> tags:
<analysis>
- Issue identified: [clear description of the root cause]
- Files affected: [list the specific files that need changes]
- Changes needed: [brief summary of what fixes to apply]
</analysis>

2. Then, output ONLY the updated files in this format:
<code filename="{name}.{extension}">
... (complete file contents with fixes applied)
</code>

Only output files that are being changed. Do not include commentary outside these tags.
If you change HTML, include the full updated index.html.
Keep the game playable and preserve the existing physics engine (p5.js or Matter.js).
</output_instructions>
```

### Direct Mode Output Format

When `use_planning=False`, the LLM must follow this structure:

```xml
<output_instructions>
You must output ONLY updated files in this format. If a file is unchanged, you may re-output
its original content verbatim. Do not include commentary outside these tags.

For each updated or unchanged file:
<code filename="{name}.{extension}">
... (file contents)
</code>

If you change HTML, include the full updated index.html in a final <code filename="index.html"> block.
Keep the game playable and preserve p5.js or Matter.js usage if present.
</output_instructions>
```

## Task Template

The task section provides context about the game and feedback:

```xml
<task>
You are improving an existing browser game. Apply the human feedback precisely while preserving
existing working features. Only modify what is necessary to achieve the requested changes, and
ensure the result remains playable. Avoid regressions.

<human_feedback>
{feedback_text}
</human_feedback>

<existing_files>
{files_blob}
</existing_files>
</task>
```

Where:
- `{feedback_text}`: The human-provided feedback or instructions
- `{files_blob}`: All existing game files wrapped in `<file name="...">` tags

## System Prompts

### Planning Mode System Prompt

When `use_planning=True`:

```
You are a precise game debugger and code editor. Always:
1. First analyze the issue carefully to identify the root cause
2. Plan which files need changes and what fixes to apply
3. Then output the corrected code

Apply changes to meet feedback, maintain playability, and preserve existing architecture.
```

### Direct Mode System Prompt

When `use_planning=False`:

```
You are a precise code editor for web-based games. Apply changes to meet feedback, 
maintain playability, and output files using <code filename="..."> blocks only.
```

## Instructions Template

The instructions section provides general guidance:

```
You are a senior game developer focused on safe, minimal, high-impact edits. 
Prefer small, surgical changes over rewrites. Keep file names and structure stable. 
Maintain consistent coding style and avoid introducing external dependencies.
```

## Complete Prompt Structure

The final prompt is constructed as:

```
{instructions}

{task}

{output_format}
```

Where:
- `{instructions}`: The general instructions template
- `{task}`: The task template with feedback and files
- `{output_format}`: Either the planning or direct mode output format

## Key Principles

1. **Minimal Changes**: Only modify what's necessary to address the feedback
2. **Preserve Functionality**: Keep existing working features intact
3. **Maintain Playability**: Ensure the game remains playable after changes
4. **Preserve Architecture**: Don't change physics engine (p5.js or Matter.js) unless explicitly requested
5. **Avoid Regressions**: Don't break existing functionality while fixing issues



