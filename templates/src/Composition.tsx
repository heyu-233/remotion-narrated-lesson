import type { FC } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { FPS, VOICEOVER_FILE } from "./timings";
import { SUBTITLE_SEGMENTS } from "./timings";
import { displayFont, SubtitleBar } from "./shared";
import { Chapter1, CHAPTER1_END } from "./Chapter1";
// import { Chapter2, CHAPTER2_END } from "./Chapter2";
// ... add more chapters as the script grows

const subtitleAt = (seconds: number) =>
  SUBTITLE_SEGMENTS.find(
    (segment) => seconds >= segment.start && seconds < segment.end + 0.08,
  ) ?? SUBTITLE_SEGMENTS[SUBTITLE_SEGMENTS.length - 1];

export const Lesson: FC = () => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;
  const subtitle = subtitleAt(seconds);

  // Route to the active chapter. Each Chapter is a pure FC<{seconds}>.
  // Add more branches as you split the script into chapters.
  const chapter = (() => {
    if (seconds < CHAPTER1_END) return <Chapter1 seconds={seconds} />;
    // if (seconds < CHAPTER2_END) return <Chapter2 seconds={seconds} />;
    return <Chapter1 seconds={seconds} />;
  })();

  return (
    <AbsoluteFill style={{ fontFamily: displayFont }}>
      <Audio src={staticFile(VOICEOVER_FILE)} />
      {chapter}
      <SubtitleBar
        text={subtitle.text}
        seconds={seconds}
        segmentStart={subtitle.start}
        segmentEnd={subtitle.end}
      />
    </AbsoluteFill>
  );
};
