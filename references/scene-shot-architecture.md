# Semantic timing and scene architecture

```ts
type NarrationAnchor = { id: string; text: string };
type ResolvedAnchor = { id: string; start: number; end: number; segmentIds: number[]; confidence: number };
type BeatSpec = { id: string; fromAnchor: string; toAnchor: string; intent: string; visualChange: string };
type ShotSpec = { id: string; fromBeat: string; toBeat: string; scene: string; camera: "static" | "push" | "pan" | "cut"; continuity: { keep: string[]; add: string[]; remove: string[] } };
```

Use anchors for timing and beats for semantic changes. Chapters are narrative labels only. Scenes own a stable visual stage; shots describe 1.5–5 second compositions. Make shot rendering a pure function of time and unified model state.

For systems, declare a single state object first (for example CPU owner, saved context owner, ready queue, registers, and emphasis). All visual elements must derive from it. Avoid independent time predicates that can contradict each other.
