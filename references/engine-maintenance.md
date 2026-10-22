# Engine maintenance

Use this reference only when changing shared engine code, schemas, dependencies, or build tools.

## Change discipline

1. Run `npm run doctor` and `npm run lint` before editing when the current state is expected to be healthy.
2. Preserve episode data and user assets. Do not rename episode IDs, composition IDs, or public paths as a side effect of refactoring.
3. Put stable repeated behavior in `src/engine/`. Keep episode meaning in `src/episodes/<id>/`.
4. Treat generated files as outputs; change their generator instead.
5. Keep Remotion ecosystem versions exact and identical.
6. Prefer Node-based validation and generation because Node is already required by Remotion. Keep Python as an optional adapter for workloads such as local Whisper transcription.
7. Make validators phase-aware and mode-aware. Screenshot, 3D, audio, and approval requirements apply only when the episode or phase actually needs them.

## Acceptance checks

After a shared change:

1. regenerate the episode registry;
2. run engine doctor;
3. validate all episodes at draft phase;
4. run ESLint and TypeScript;
5. bundle the application;
6. render or inspect the representative engine demo when runtime behavior changed.

Check a newly generated episode: draft validation should pass without manual repair. Test later-phase requirements against the selected audio mode and preproduction route. An unfinished image-reference route should fail for its missing required artifacts; an authorized programmatic or direct-preview route must not require fabricated images, narration or approvals. When migrating the legacy validator, retain real missing-asset, invalid-timing and unapproved-review failures for routes where they apply.
