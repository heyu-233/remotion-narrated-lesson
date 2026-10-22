# Series engine contract

The configured engine is a long-lived application. Shared behavior belongs in the engine; episode-specific content belongs in episode packages.

## Ownership

`series/series.config.json` owns frame size, frame rate, theme tokens, and recurring motion cadence.

`src/engine/` owns:

- timeline and caption resolution;
- reusable stage, subtitle, evidence, code, diagram, and transition components;
- animation primitives and shared scene grammar;
- composition rendering behavior.

`episodes/<id>/` owns metadata, the semantic timeline, storyboard, keyframe prompt and review, animation plan, release review state, and other authored production records.

`src/episodes/<id>/` owns custom React scene implementation for that episode.

`public/episodes/<id>/` owns its audio, evidence, footage, images, and other runtime assets.

`src/generated/episode-registry.tsx` is generated. Never edit it by hand.

## Commands

Run from the engine root:

```powershell
npm run doctor
npm run episode:new -- ep01 --title "Episode title" --mode hybrid
npm run episode:validate -- ep01 --phase draft
npm run episode:validate -- ep01 --phase keyframes
npm run episode:validate -- ep01 --phase preview
npm run dev
npm run render -- EpisodeEp01 out/ep01.mp4
```

All `@remotion/*` packages must exactly match the installed `remotion` version. The lockfile is part of the engine contract.

## Episode boundaries

An episode ID is a lowercase kebab-case directory name. Its `compositionId` is a stable Remotion identifier. Never rename either casually after publishing automation or render commands depend on them.

Create a new shared primitive only when at least two episodes need the behavior or the behavior defines series identity. Keep a one-off hero scene inside its episode.

## Capability boundary

V5 skill guidance and the foley adapter do not automatically upgrade an installed V4 engine. Inspect types, audio composition and validators before claiming native soundEvents, audio-mode or preproduction-route support. Batch migration details and regression cases are in [batch-production.md](batch-production.md). Preserve honest phase results when a legacy validator does not represent an authorized preview route.
