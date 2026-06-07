import type { CSSProperties, FC } from "react";
import { Easing, interpolate } from "remotion";

export const STAGE_W = 1920;
export const STAGE_H = 1080;

export const palette = {
  bgTop: "#0a1426",
  bgBottom: "#050a14",
  ink: "#0a1220",
  panel: "#101e35",
  panelLine: "rgba(255,255,255,0.08)",
  text: "#e8efff",
  soft: "#8aa0c0",
  mute: "#5e7393",
  cyan: "#33c2ff",
  orange: "#ff9d4d",
  violet: "#a48bff",
  lime: "#7dbf32",
  red: "#ff5566",
  amber: "#ffc04d",
  emerald: "#28e0a8",
  pink: "#ff7ab8",
};

export const monoFont =
  '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace';
export const displayFont =
  '"HarmonyOS Sans SC", "Source Han Sans SC", "Microsoft YaHei UI", sans-serif';

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// deterministic pseudo-random for an integer seed
export const rand = (seed: number) => {
  const x = Math.sin(seed * 9173.31) * 43758.5453;
  return x - Math.floor(x);
};

export const fadeIn = (
  seconds: number,
  start: number,
  duration = 0.6,
): number =>
  interpolate(seconds, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

export const fadeWindow = (
  seconds: number,
  start: number,
  end: number,
  inDur = 0.5,
  outDur = 0.5,
): number => {
  const a = interpolate(seconds, [start, start + inDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const b = interpolate(seconds, [end - outDur, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return Math.min(a, b);
};

export const popIn = (seconds: number, start: number, dur = 0.4): number => {
  const t = clamp01((seconds - start) / dur);
  return 1 - Math.pow(1 - t, 3);
};

export const ChapterBackground: FC<{
  hue?: "neutral" | "warm" | "cool";
  pulse?: number;
}> = ({ hue = "neutral", pulse = 0 }) => {
  const accent =
    hue === "warm" ? "rgba(255,160,80,0.10)"
    : hue === "cool" ? "rgba(80,180,255,0.10)"
    : "rgba(120,160,200,0.06)";
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${palette.bgTop} 0%, ${palette.bgBottom} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 40%, ${accent}, transparent 50%)`,
          opacity: 1 + pulse * 0.5,
        }}
      />
      <svg
        width={STAGE_W}
        height={STAGE_H}
        style={{ position: "absolute", inset: 0, opacity: 0.05 }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 100}
            y1={0}
            x2={i * 100}
            y2={STAGE_H}
            stroke="#fff"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * 100}
            x2={STAGE_W}
            y2={i * 100}
            stroke="#fff"
            strokeWidth="1"
          />
        ))}
      </svg>
    </>
  );
};

export const Heading: FC<{
  seconds: number;
  start: number;
  end?: number;
  text: string;
  sub?: string;
  align?: "center" | "left";
  top?: number;
}> = ({ seconds, start, end, text, sub, align = "center", top = 90 }) => {
  const op =
    end != null
      ? fadeWindow(seconds, start, end, 0.4, 0.4)
      : fadeIn(seconds, start);
  const dy = interpolate(seconds, [start, start + 0.6], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        textAlign: align,
        paddingLeft: align === "left" ? 80 : 0,
        opacity: op,
        transform: `translateY(${dy}px)`,
      }}
    >
      <div
        style={{
          fontSize: 52,
          fontWeight: 700,
          color: palette.text,
          letterSpacing: 2,
          fontFamily: displayFont,
        }}
      >
        {text}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 24,
            color: palette.soft,
            letterSpacing: 3,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

export type CodeHighlight = {
  from: number; // seconds
  to: number;
  lines: number[]; // 0-indexed
  color?: string;
};

export const CodeBlock: FC<{
  seconds: number;
  appearAt: number;
  code: string;
  highlights?: CodeHighlight[];
  width?: number;
  left?: number;
  top?: number;
  fontSize?: number;
  title?: string;
  typeLines?: boolean;
  perLineSeconds?: number;
}> = ({
  seconds,
  appearAt,
  code,
  highlights = [],
  width = 900,
  left = 80,
  top = 240,
  fontSize = 26,
  title,
  typeLines = true,
  perLineSeconds = 0.12,
}) => {
  const lines = code.split("\n");
  const containerOp = fadeIn(seconds, appearAt, 0.4);
  const visibleLines = typeLines
    ? Math.min(
        lines.length,
        Math.max(0, Math.floor((seconds - appearAt) / perLineSeconds) + 1),
      )
    : lines.length;

  const lineHighlightFor = (idx: number): string | null => {
    for (const h of highlights) {
      if (seconds >= h.from && seconds < h.to && h.lines.includes(idx)) {
        return h.color ?? palette.amber;
      }
    }
    return null;
  };

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        opacity: containerOp,
        background: "rgba(13,22,40,0.92)",
        border: `1px solid ${palette.panelLine}`,
        borderRadius: 18,
        boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 38,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          background: "rgba(255,255,255,0.03)",
          borderBottom: `1px solid ${palette.panelLine}`,
        }}
      >
        <span style={{ width: 12, height: 12, borderRadius: 6, background: "#ff6058" }} />
        <span style={{ width: 12, height: 12, borderRadius: 6, background: "#ffbe2e" }} />
        <span style={{ width: 12, height: 12, borderRadius: 6, background: "#27c93f" }} />
        {title ? (
          <span
            style={{
              marginLeft: 18,
              color: palette.soft,
              fontFamily: monoFont,
              fontSize: 16,
            }}
          >
            {title}
          </span>
        ) : null}
      </div>
      <div
        style={{
          padding: "16px 18px",
          fontFamily: monoFont,
          fontSize,
          lineHeight: 1.55,
          color: palette.text,
        }}
      >
        {lines.map((line, idx) => {
          const hl = lineHighlightFor(idx);
          const visible = idx < visibleLines;
          const lineStyle: CSSProperties = {
            position: "relative",
            padding: "0 8px",
            margin: "0 -8px",
            borderRadius: 6,
            color: hl ? "#ffffff" : line.trim().startsWith("//") ? palette.mute : palette.text,
            background: hl ? `${hl}22` : "transparent",
            borderLeft: hl ? `3px solid ${hl}` : "3px solid transparent",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-8px)",
            transition: "all 0.18s ease-out",
            whiteSpace: "pre",
            minHeight: fontSize * 1.55,
          };
          return (
            <div key={idx} style={lineStyle}>
              <span
                style={{
                  display: "inline-block",
                  width: 36,
                  color: palette.mute,
                  userSelect: "none",
                }}
              >
                {idx + 1}
              </span>
              {line || " "}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SubtitleBar: FC<{
  text: string;
  seconds: number;
  segmentStart: number;
  segmentEnd: number;
}> = ({ text, seconds, segmentStart, segmentEnd }) => {
  const local = seconds - segmentStart;
  const remaining = segmentEnd - seconds;
  const opacityIn = interpolate(local, [0, 0.16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacityOut = interpolate(remaining, [0, 0.14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 28,
        display: "flex",
        justifyContent: "center",
        opacity: Math.min(opacityIn, opacityOut),
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          padding: "14px 22px",
          borderRadius: 18,
          background: "rgba(10, 18, 31, 0.84)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 38px rgba(13, 22, 35, 0.24)",
          color: "#f6fbff",
          fontSize: 28,
          lineHeight: 1.45,
          textAlign: "center",
          fontFamily: displayFont,
        }}
      >
        {text}
      </div>
    </div>
  );
};
