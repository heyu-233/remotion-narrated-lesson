// Chapter template — copy this file as Chapter2.tsx, Chapter3.tsx, ... and fill in.
//
// MANDATORY: Before writing any code in a new chapter, run the Step 6.0
// "Chapter Visual Interview" with the user (see SKILL.md). Record the answers
// in the block below. NEVER skip this step — visual decisions belong to the
// user, not the AI.
//
// === Chapter N Visual Interview ===
// 主视觉:        [fill in after asking the user]
// 视觉连贯:      [fill in after asking the user]
// 节奏:          [fill in after asking the user]
// 特别想法:      [fill in after asking the user]
// ===================================
//
// Rules of thumb:
//   1. Time anchors come from segment ids, not raw seconds.
//   2. This component is a pure function of `seconds` — never call useCurrentFrame here.
//   3. Export a *_END constant so Composition.tsx knows when to switch.
//   4. Build the scene from shared.tsx atoms first; only invent new visuals when needed.

import type { FC } from "react";
import { segmentRangeEnd, segmentRangeStart } from "./transcript";
import {
  ChapterBackground,
  CodeBlock,
  Heading,
  fadeIn,
  fadeWindow,
  palette,
} from "./shared";

// ---------- segment-id-bound time anchors ----------

const T_TITLE_IN = segmentRangeStart(1);
const T_TITLE_HOLD = segmentRangeStart(3);
const T_CODE_IN = segmentRangeStart(5);
const T_CODE_HIGHLIGHT = segmentRangeStart(7);
const T_END = segmentRangeEnd(10); // last segment of this chapter

export const CHAPTER1_END = T_END;

const sampleCode = `// fill in your real snippet
int example(int x) {
    return x + 1;
}`;

export const Chapter1: FC<{ seconds: number }> = ({ seconds }) => {
  return (
    <>
      <ChapterBackground hue="cool" />

      <Heading
        seconds={seconds}
        start={T_TITLE_IN}
        end={T_CODE_IN}
        text="第一章标题"
        sub="副标题 / 一句话引子"
      />

      <CodeBlock
        seconds={seconds}
        appearAt={T_CODE_IN}
        title="example.c"
        code={sampleCode}
        highlights={[
          { from: T_CODE_HIGHLIGHT, to: T_END, lines: [1, 2], color: palette.amber },
        ]}
        left={460}
        top={300}
        width={1000}
      />

      {/*
        Outro fade lets Composition crossfade into the next chapter cleanly.
        Adjust the 0.6s window if your transitions feel abrupt or sluggish.
      */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: palette.bgBottom,
          opacity: fadeWindow(seconds, T_END - 0.6, T_END, 0, 0.6),
          pointerEvents: "none",
        }}
      />

      {/* Suppress unused-import lints in stub state */}
      <div style={{ display: "none" }}>{fadeIn(seconds, T_TITLE_HOLD)}</div>
    </>
  );
};
