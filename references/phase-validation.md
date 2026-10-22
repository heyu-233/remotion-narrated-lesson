# Phase- and mode-aware validation

Run the checks appropriate to the actual episode and installed engine. The skill describes the production intent; inspect the validator implementation before claiming that an added JSON field enables a new mode.

## Structural draft

`npm run episode:validate -- <id> --phase draft` checks the installed engine's contract: episode identity, required files, anchor ranges, references, captions and registration. Keep this passing when creating or editing an episode. Do not rename IDs or weaken valid structural errors as a workaround.

## Preproduction

Use the selected route from keyframe-preproduction.md. Image-reference review, rendered programmatic samples and an explicitly authorized direct preview have different evidence. Record the route and actual approval/waiver without conflating them.

A legacy `--phase keyframes` check may require every frame image and explicit approval regardless of route. When this conflicts with an authorized programmatic/direct-preview task, report the exact incompatibility, preserve honest approval fields, and run applicable code, model and frame inspections separately. Do not claim the legacy command passed.

## Preview

Applicable preview checks include:

- valid timeline, assets and episode code;
- lint/type checking and a successful real render/bundle;
- reviewed visible technical text and readable critical states;
- caption alignment when narration/captions exist;
- foley event resolution, freshness, asset integrity and mix checks when sound effects exist;
- correct media metadata and decode for an exported playable preview.

Foley-only and silent studies do not require invented narration or captions. The installed V4 validator currently requires narration anchors and external keyframe approval at preview. Explicitly distinguish those mode/route incompatibilities from real failures such as missing assets, invalid timing or a broken render. Use the successful component checks as evidence for the requested preview, not as a fabricated all-green phase result.

## Release

Apply final media inspection and the user's actual review/export instructions. Do not claim release or publication approval from a successful preview or automated test. A silent episode need not contain a dummy WAV; a foley-only episode need not contain dummy speech. If the installed release contract cannot represent the intended production mode, migrate it when that engine work is authorized rather than suppressing its errors.

When upgrading the engine, give audio modes and preproduction routes explicit typed validation, retain compatibility with existing narrated episodes, and test both accepted alternate routes and invalid inputs. Until then, document the gap in the episode review.
