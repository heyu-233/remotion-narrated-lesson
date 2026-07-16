import generated from "../../../timeline.json";

type Anchor = {id: string; start: number; end: number; confidence: number};
const anchors = generated.anchors as Anchor[];
const get = (id: string) => {
  const anchor = anchors.find((item) => item.id === id);
  if (!anchor || anchor.confidence < 0.75) throw new Error(`Invalid narration anchor: ${id}`);
  return anchor;
};
export const anchorStart = (id: string) => get(id).start;
export const anchorEnd = (id: string) => get(id).end;
