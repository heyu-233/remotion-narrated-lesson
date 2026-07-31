import generated from "../../../timeline.json";

type Anchor = {id: string; start: number; end: number; confidence: number};
const anchors = generated.anchors as Anchor[];
const stateAnchorsDescending = [...anchors].sort((a, b) => b.start - a.start);
const get = (id: string) => {
  const anchor = anchors.find((item) => item.id === id);
  if (!anchor || anchor.confidence < 0.75) throw new Error(`Invalid narration anchor: ${id}`);
  return anchor;
};
export const anchorStart = (id: string) => get(id).start;
export const anchorEnd = (id: string) => get(id).end;

// Caption lookup should remain interval-based and may return no caption in a
// spoken pause. Visual scenes and callouts instead inherit the latest anchor.
// Before the first anchor, return null so the composition keeps a clean default.
export const visualStateAnchorAt = (seconds: number) =>
  stateAnchorsDescending.find((anchor) => anchor.start <= seconds) ?? null;
