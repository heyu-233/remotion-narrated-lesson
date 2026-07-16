import generated from "../timeline.json";

export type ResolvedAnchor = {
  id: string;
  start: number;
  end: number;
  segmentIds: number[];
  confidence: number;
};

const anchors = generated.anchors as ResolvedAnchor[];

const anchor = (id: string): ResolvedAnchor => {
  const item = anchors.find((candidate) => candidate.id === id);
  if (!item || item.confidence < 0.75) {
    throw new Error(`Missing or low-confidence narration anchor: ${id}`);
  }
  return item;
};

export const anchorStart = (id: string) => anchor(id).start;
export const anchorEnd = (id: string) => anchor(id).end;
