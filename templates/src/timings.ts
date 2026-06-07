import { TRANSCRIPT_DURATION, SEGMENTS } from "./transcript";

export const FPS = 30;

export const VOICEOVER_SECONDS = TRANSCRIPT_DURATION;
export const TOTAL_FRAMES = Math.ceil(FPS * VOICEOVER_SECONDS);

// Change to match the audio file you put under public/audio/
export const VOICEOVER_FILE = "audio/voiceover.m4a";

export const toFrames = (seconds: number) => Math.round(seconds * FPS);

export type SubtitleSegment = {
  start: number;
  end: number;
  text: string;
};

// Subtitle stream is the transcript itself - one source of truth.
export const SUBTITLE_SEGMENTS: SubtitleSegment[] = SEGMENTS.map((s) => ({
  start: s.start,
  end: s.end,
  text: s.text,
}));

export const subtitleAtSeconds = (seconds: number): SubtitleSegment => {
  for (const seg of SUBTITLE_SEGMENTS) {
    if (seconds >= seg.start && seconds < seg.end + 0.08) {
      return seg;
    }
  }
  return SUBTITLE_SEGMENTS[SUBTITLE_SEGMENTS.length - 1];
};
