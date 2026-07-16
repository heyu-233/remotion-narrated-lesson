import type { FC } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { FPS, VOICEOVER_FILE } from "./timings";
import { subtitleAtSeconds } from "./timings";
import { displayFont, SubtitleBar } from "./shared";
import { Chapter1, CHAPTER1_END } from "./Chapter1";
// import { Chapter2, CHAPTER2_END } from "./Chapter2";
// ... add more chapters as the script grows

export const Lesson: FC = () => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;
  const subtitle = subtitleAtSeconds(seconds);

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
      {subtitle ? <SubtitleBar text={subtitle.text} seconds={seconds} segmentStart={subtitle.start} segmentEnd={subtitle.end} /> : null}
    </AbsoluteFill>
  );
};
