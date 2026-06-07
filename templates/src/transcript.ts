import raw from "../public/audio/transcript.json";

export type Segment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

type RawTranscript = {
  language: string;
  language_probability: number;
  duration: number;
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    words?: unknown;
  }>;
};

const data = raw as RawTranscript;

export const TRANSCRIPT_DURATION: number = data.duration;

export const SEGMENTS: Segment[] = data.segments.map((s) => ({
  id: s.id,
  start: s.start,
  end: s.end,
  text: s.text,
}));

export const segmentById = (id: number): Segment | undefined =>
  SEGMENTS.find((s) => s.id === id);

export const segmentAt = (seconds: number): Segment => {
  for (const seg of SEGMENTS) {
    if (seconds >= seg.start && seconds < seg.end + 0.05) {
      return seg;
    }
  }
  return SEGMENTS[SEGMENTS.length - 1];
};

export const segmentRangeStart = (idStart: number): number => {
  const seg = segmentById(idStart);
  return seg ? seg.start : 0;
};

export const segmentRangeEnd = (idEnd: number): number => {
  const seg = segmentById(idEnd);
  return seg ? seg.end : TRANSCRIPT_DURATION;
};

// Edit this to match your script's natural chapter cuts.
// segStart / segEnd are inclusive segment ids.
export const CHAPTERS = [
  { id: 1, label: "章节 1", segStart: 1, segEnd: 1 },
] as const;

export type ChapterRef = (typeof CHAPTERS)[number];

export const chapterBounds = (c: ChapterRef) => ({
  start: segmentRangeStart(c.segStart),
  end: segmentRangeEnd(c.segEnd),
});

export const chapterAt = (seconds: number): ChapterRef => {
  for (let i = CHAPTERS.length - 1; i >= 0; i -= 1) {
    const c = CHAPTERS[i];
    if (seconds >= segmentRangeStart(c.segStart)) {
      return c;
    }
  }
  return CHAPTERS[0];
};
