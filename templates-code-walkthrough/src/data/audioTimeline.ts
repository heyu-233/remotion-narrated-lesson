import {TRANSCRIPT_DURATION, TRANSCRIPT_SEGMENTS} from './transcript.generated';

export const FPS = 30;
export const VOICEOVER_FILE = 'audio/voiceover.m4a';
export const TOTAL_SECONDS = TRANSCRIPT_DURATION;
export const TOTAL_FRAMES = Math.ceil(TOTAL_SECONDS * FPS);

export type SegmentRange = {
  segStart: number;
  segEnd: number;
};

export const secondsToFrames = (seconds: number) => {
  return Math.floor(seconds * FPS);
};

export const segmentStart = (id: number) => {
  const segment = TRANSCRIPT_SEGMENTS.find((candidate) => candidate.id === id);
  if (!segment) {
    throw new Error(`segment ${id} not found`);
  }
  return segment.start;
};

export const segmentEnd = (id: number) => {
  const segment = TRANSCRIPT_SEGMENTS.find((candidate) => candidate.id === id);
  if (!segment) {
    throw new Error(`segment ${id} not found`);
  }
  return segment.end;
};

export const segmentRangeStart = (range: SegmentRange) => {
  return segmentStart(range.segStart);
};

export const segmentRangeEnd = (range: SegmentRange) => {
  return segmentEnd(range.segEnd);
};

export const segmentRangeFrames = (range: SegmentRange) => {
  return {
    start: secondsToFrames(segmentRangeStart(range)),
    end: Math.max(secondsToFrames(segmentRangeEnd(range)), secondsToFrames(segmentRangeStart(range)) + 1),
  };
};

export const findSegmentForFrame = (frame: number) => {
  const seconds = frame / FPS;
  return TRANSCRIPT_SEGMENTS.find((segment) => seconds >= segment.start && seconds < segment.end) ?? null;
};
