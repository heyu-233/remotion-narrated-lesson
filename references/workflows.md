# Episode production workflow

Use the existing series engine. Do not copy the full application for each episode.

## Choose the starting condition and audio mode

Narration-first, visual-first and evidence-first starts remain valid. Use final audio when supplied; otherwise temporary timing can support a requested preview. State whether audio is narrated, foley-only or silent. Do not invent narration anchors, captions or approval records to satisfy a validator for a different mode.

## Produce or revise

1. Run the engine doctor; inspect the accepted series baseline and relevant user corrections. Reuse an existing episode when revising it.
2. Define the teaching conclusion, domain facts, actor roles, relationships and critical state changes. For mechanism work, use mechanism-storytelling.md before deciding camera moves.
3. Author the timeline: meaningful anchors, disclosure boundaries, optional captions, shots and sound events. Distinguish semantic beats from camera changes.
4. Choose a preproduction route using keyframe-preproduction.md. For accepted programmatic styles, inspect rendered start/action/settled frames or a playable slice. Use image references when they materially resolve visual direction. Respect requested review gates and explicit waivers already given in the conversation.
5. Implement with one domain state model and timeline-driven presentation. Keep a causal stage stable where possible; retain the context needed to understand each new relationship.
6. Generate and verify foley using sound-design.md when requested. Keep stems so narration can later be mixed without manually rescheduling cues.
7. Run applicable structural, code, model, audio and visual checks. Report legacy-validator incompatibilities precisely using phase-validation.md; do not label failed checks as passed.
8. Provide the requested playable preview or export within existing authorization. Final media checks apply to the actual encoded file. Release/publication approval is separate from an exploratory preview.

For batch production, establish one representative slice before propagation and use batch-production.md. Update the final storyboard/review so the current implementation is easy to find; historical revisions should not obscure which output is current.

Ask only for missing information or a meaningful creative/authorization decision that the existing request does not resolve. An internal planning artifact is not automatically a user approval gate.
