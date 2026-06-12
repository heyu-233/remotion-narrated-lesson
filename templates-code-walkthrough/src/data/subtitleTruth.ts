import {TRANSCRIPT_SEGMENTS, type TranscriptSegment} from './transcript.generated';

// Only patch obvious ASR mistakes here.
// Subtitle timing always follows the original audio transcript segments.
const subtitleOverrides: Partial<Record<number, string>> = {};

export const SUBTITLE_SEGMENTS: TranscriptSegment[] = TRANSCRIPT_SEGMENTS.map((segment) => ({
  ...segment,
  text: subtitleOverrides[segment.id] ?? segment.text,
}));

export const findSubtitleSegment = (id: number | undefined) => {
  if (!id) {
    return null;
  }
  return SUBTITLE_SEGMENTS.find((segment) => segment.id === id) ?? null;
};
