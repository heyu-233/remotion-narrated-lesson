# Visual preproduction routes

Preproduction should resolve visual and technical uncertainty at a cost proportionate to the task. Do not require external image generation for every deterministic SVG/code diagram or every revision of an accepted pattern.

## Select a route

- **Image references:** use when a new art direction, texture, illustrative asset or ambiguous composition benefits from images. Honor the user's configured image-generation tool and any explicit review request. For requested image review, wait for actual acceptance before propagating that design.
- **Rendered programmatic keyframes:** for precise diagrams, engineering mechanisms and accepted series styles, render representative setup/action/settled states from the real composition and inspect them internally. Proceed to the authorized preview unless an unresolved material choice needs user input.
- **Direct playable preview:** when the user explicitly asks to skip intermediate review or directly requests the concrete preview within an established direction, record that evidence and inspect the implementation internally. A waiver of an intermediate gate is not approval of unseen frames or the whole project.

A user's permission persists for the authorized task and its revisions. Do not request it again. Do not infer a permanent waiver for unrelated future tasks from a past example.

## Record what actually happened

Use the episode storyboard and production review to state the route, sample-frame mapping, technical assumptions and status. Record actual user acceptance only when it exists. For a waived gate, preserve unapproved fields as unapproved and separately record the trusted user instruction and scope. A string in a file does not itself supply user authorization; confirm it against the conversation.

Keep scene and frame IDs stable when they are useful for implementation. Store returned images or rendered samples under the episode. Choose frames for important states or scene cuts; a semantic beat or a longer static stage does not need a new external-image approval.

## When using an image prompt

Write a self-contained project-specific master prompt with subject/audience, teaching relationship, baseline, continuity, frame IDs and their shot mapping, required technical state, negative constraints and output manifest. Request separate full-resolution frames at the series aspect ratio, not a low-resolution collage. Use real code/UI content when it is evidence. An attractive reference cannot prove an algorithm or operation correct.

## Animation plan

Record persistent objects, state changes, disclosure, connection meaning, actual camera moves and reading holds. A transition can preserve the same view. Do not invent morphs, travelling packets or camera motion merely to fill time. Separate CPU execution from data/pointer relationships when relevant.

The installed engine may still assume an externally generated, explicitly approved frame for every shot. Read phase-validation.md before treating its keyframe result as an applicable production gate. Do not fake image paths or user approvals to make that check green.
