// === Reusable Cold Open / Stage 0 Snippet ===
// "混乱堆叠 → 整理到两个区域 → 执行" 的开篇动画模板
//
// Usage:
//   import { ColdOpen, type ColdOpenItem } from "./ColdOpen";
//
//   const items: ColdOpenItem[] = [
//     { label: "函数", color: "#33c2ff", targetZone: "A" },
//     { label: "变量", color: "#ff9d4d", targetZone: "B" },
//     ...
//   ];
//
//   <ColdOpen
//     seconds={seconds}
//     startSec={0}
//     revealSec={8.5}      // when organizers appear
//     organizedSec={19}    // when organization completes
//     endSec={26}
//     zoneALabel="FLASH"
//     zoneAColor="#33c2ff"
//     zoneBLabel="RAM"
//     zoneBColor="#ff9d4d"
//     items={items}
//     organizerA={{ label: "启动文件", color: "#7dbf32" }}
//     organizerB={{ label: "链接脚本", color: "#a48bff" }}
//   />
// =============================================

import type { FC } from "react";
import { Easing, interpolate } from "remotion";

// ─── configurable types ────────────────────────────────────────

export type ColdOpenItem = {
  /** Display text (use "\n" for line break) */
  label: string;
  /** CSS color for card border / text */
  color: string;
  /** Which zone the card flies to: "A" (left) or "B" (right) */
  targetZone: "A" | "B";
};

export type ColdOpenOrganizer = {
  label: string;
  color: string;
};

type ColdOpenProps = {
  /** Current seconds (from Composition.tsx) */
  seconds: number;
  /** Chapter start time in seconds */
  startSec: number;
  /** When organizers fly in (~"你或许听说过…" line) */
  revealSec: number;
  /** When chaos→organized transition completes */
  organizedSec: number;
  /** Chapter end time in seconds */
  endSec: number;
  /** Items that start in chaos pile and fly to zones */
  items: ColdOpenItem[];
  /** Left zone label and color */
  zoneALabel: string;
  zoneAColor: string;
  /** Right zone label and color */
  zoneBLabel: string;
  zoneBColor: string;
  /** Organizer card that appears at revealSec */
  organizerA: ColdOpenOrganizer;
  /** Organizer card that appears at revealSec + 0.5 */
  organizerB: ColdOpenOrganizer;
  /** Background hue override */
  hue?: "neutral" | "warm" | "cool";
};

// ─── layout constants (1920×1080, centered) ────────────────────

const CARD_W = 170;
const CARD_H = 100;
const CPU_X = 1540;
const CPU_Y = 380;
const CPU_SIZE = 130;
const ZONE_A_X = 140, ZONE_A_Y = 160, ZONE_A_W = 600, ZONE_A_H = 540;
const ZONE_B_X = 820, ZONE_B_Y = 160, ZONE_B_W = 600, ZONE_B_H = 540;

// ─── internal helpers ──────────────────────────────────────────

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Deterministic pseudo-random for seeding chaos positions */
const seededRand = (seed: number) => {
  const x = Math.sin(seed * 9173.31) * 43758.5453;
  return x - Math.floor(x);
};

/** Generate chaos positions from item index — deterministic, no Math.random() */
const chaosPos = (i: number, total: number) => {
  const angle = (i / total) * Math.PI * 2 + seededRand(i * 7) * 1.2;
  const radius = 180 + seededRand(i * 13) * 160;
  return {
    chaosX: 780 + Math.cos(angle) * radius,
    chaosY: 380 + Math.sin(angle) * radius * 0.7,
    chaosRot: (seededRand(i * 3) - 0.5) * 50,
  };
};

/** Target positions inside zone A (left) */
const zoneATarget = (i: number, totalInZone: number) => {
  const cols = 2;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const spacingX = ZONE_A_W / (cols + 1);
  const spacingY = ZONE_A_H / (Math.ceil(totalInZone / cols) + 1);
  return {
    targetX: ZONE_A_X + spacingX * (col + 1),
    targetY: ZONE_A_Y + spacingY * (row + 1),
  };
};

/** Target positions inside zone B (right) */
const zoneBTarget = (i: number, totalInZone: number) => {
  const cols = 2;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const spacingX = ZONE_B_W / (cols + 1);
  const spacingY = ZONE_B_H / (Math.ceil(totalInZone / cols) + 1);
  return {
    targetX: ZONE_B_X + spacingX * (col + 1),
    targetY: ZONE_B_Y + spacingY * (row + 1),
  };
};

// ─── sub-components ────────────────────────────────────────────

const palette = {
  bgTop: "#0a1426", bgBottom: "#050a14", ink: "#0a1220",
  panel: "#101e35", text: "#e8efff", soft: "#8aa0c0", mute: "#5e7393",
  cyan: "#33c2ff", orange: "#ff9d4d", violet: "#a48bff",
  lime: "#7dbf32", red: "#ff5566", amber: "#ffc04d",
  emerald: "#28e0a8", pink: "#ff7ab8",
};

type InternalItem = ColdOpenItem & { chaosX: number; chaosY: number; chaosRot: number; targetX: number; targetY: number };

const Background: FC<{ hue: "neutral" | "warm" | "cool" }> = ({ hue }) => {
  const accent = hue === "warm" ? "rgba(255,160,80,0.10)" : hue === "cool" ? "rgba(80,180,255,0.10)" : "rgba(120,160,200,0.06)";
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${palette.bgTop} 0%, ${palette.bgBottom} 100%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 40%, ${accent}, transparent 50%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
        {Array.from({ length: 20 }).map((_, i) => <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={1080} stroke="#fff" strokeWidth="1" />)}
        {Array.from({ length: 12 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 100} x2={1920} y2={i * 100} stroke="#fff" strokeWidth="1" />)}
      </svg>
    </>
  );
};

const Card: FC<{ seconds: number; item: InternalItem; revealSec: number; organizedSec: number; startSec: number }> =
  ({ seconds, item, revealSec, organizedSec, startSec }) => {
    const org = clamp01(interpolate(seconds, [revealSec, organizedSec], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));
    const x = item.chaosX + (item.targetX - item.chaosX) * org;
    const y = item.chaosY + (item.targetY - item.chaosY) * org;
    const rot = item.chaosRot * (1 - org);
    const op = interpolate(seconds, [startSec, startSec + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
    const scale = 1 - org * 0.25;
    return (
      <div style={{
        position: "absolute", left: x - CARD_W * scale / 2, top: y - CARD_H * scale / 2,
        width: CARD_W * scale, height: CARD_H * scale,
        background: `linear-gradient(135deg, ${item.color}22, ${item.color}0d)`,
        border: `3px solid ${item.color}55`, borderRadius: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: `rotate(${rot}deg)`, opacity: op,
        boxShadow: `0 12px 36px ${item.color}18`,
        fontFamily: '"HarmonyOS Sans SC", "Source Han Sans SC", "Microsoft YaHei UI", sans-serif',
        fontSize: 26 * scale, fontWeight: 600, color: item.color,
        textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.3,
      }}>{item.label}</div>
    );
  };

const CpuIcon: FC<{ seconds: number; organizedSec: number; startSec: number }> = ({ seconds, organizedSec, startSec }) => {
  const op = interpolate(seconds, [startSec + 0.3, startSec + 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bob = Math.sin(seconds * 3) * 8;
  const happy = clamp01(interpolate(seconds, [organizedSec - 1, organizedSec + 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));
  const monoFont = '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace';
  return (
    <div style={{ position: "absolute", left: CPU_X, top: CPU_Y + bob * (1 - happy), opacity: op }}>
      <div style={{ width: CPU_SIZE, height: CPU_SIZE, background: `linear-gradient(135deg, ${palette.panel}, ${palette.ink})`, border: `3px solid ${happy > 0.5 ? palette.emerald : palette.red}88`, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 50px ${happy > 0.5 ? palette.emerald : palette.red}22` }}>
        <div style={{ fontSize: 50, lineHeight: 1 }}>{happy > 0.7 ? "😊" : happy > 0.3 ? "🤔" : "😵"}</div>
      </div>
      <div style={{ textAlign: "center", marginTop: 12, fontFamily: monoFont, fontSize: 20, color: happy > 0.7 ? palette.emerald : palette.soft, letterSpacing: 3 }}>CPU</div>
      {happy < 0.3 && <>
        <div style={{ position: "absolute", top: -50, right: -15, fontSize: 38, color: palette.amber, opacity: 1 - happy * 3 }}>?</div>
        <div style={{ position: "absolute", top: -90, right: 25, fontSize: 28, color: palette.amber, opacity: (1 - happy * 3) * 0.6 }}>?</div>
      </>}
    </div>
  );
};

const ZoneBox: FC<{ seconds: number; x: number; y: number; w: number; h: number; label: string; color: string; revealSec: number }> =
  ({ seconds, x, y, w, h, label, color, revealSec }) => {
    const op = clamp01(interpolate(seconds, [revealSec, revealSec + 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));
    const monoFont = '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace';
    return (
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, border: `3px dashed ${color}44`, borderRadius: 24, opacity: op * 0.7, background: `${color}05` }}>
        <div style={{ position: "absolute", top: -20, left: 20, fontFamily: monoFont, fontSize: 20, color: `${color}88`, letterSpacing: 3 }}>{label}</div>
      </div>
    );
  };

const ZoneTitle: FC<{ seconds: number; label: string; x: number; y: number; color: string; revealSec: number }> =
  ({ seconds, label, x, y, color, revealSec }) => {
    const op = clamp01(interpolate(seconds, [revealSec + 1, revealSec + 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));
    return <div style={{ position: "absolute", left: x, top: y, opacity: op, fontFamily: '"HarmonyOS Sans SC", "Source Han Sans SC", "Microsoft YaHei UI", sans-serif', fontSize: 22, fontWeight: 700, color, letterSpacing: 4, background: `${color}11`, border: `1px solid ${color}33`, borderRadius: 10, padding: "6px 20px" }}>{label}</div>;
  };

const Organizer: FC<{ seconds: number; label: string; appearSec: number; x: number; y: number; color: string; fromRight?: boolean }> =
  ({ seconds, label, appearSec, x, y, color, fromRight }) => {
    const startX = fromRight ? 2200 : -250;
    const flyX = interpolate(seconds, [appearSec, appearSec + 0.8], [startX, x], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
    const op = clamp01(interpolate(seconds, [appearSec, appearSec + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    const pulse = 1 + Math.sin(seconds * 6) * 0.03;
    return (
      <div style={{ position: "absolute", left: flyX - 110, top: y - 45, width: 220, height: 90, background: `linear-gradient(135deg, ${color}33, ${color}11)`, border: `3px solid ${color}88`, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: op, transform: `scale(${pulse})`, fontFamily: '"HarmonyOS Sans SC", "Source Han Sans SC", "Microsoft YaHei UI", sans-serif', fontSize: 28, fontWeight: 700, color, letterSpacing: 3, boxShadow: `0 0 50px ${color}22`, backdropFilter: "blur(10px)" }}>{label}</div>
    );
  };

const Arrows: FC<{ seconds: number; organizedSec: number; zoneAColor: string; zoneBColor: string }> =
  ({ seconds, organizedSec, zoneAColor, zoneBColor }) => {
    const op = clamp01(interpolate(seconds, [organizedSec, organizedSec + 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));
    return (
      <svg style={{ position: "absolute", inset: 0, opacity: op, pointerEvents: "none" }} width={1920} height={1080}>
        <line x1={CPU_X - 40} y1={CPU_Y + 40} x2={ZONE_A_X + ZONE_A_W - 40} y2={ZONE_A_Y + ZONE_A_H - 40} stroke={zoneAColor} strokeWidth="2" strokeDasharray="10 5" opacity={0.5} />
        <line x1={CPU_X - 40} y1={CPU_Y + 80} x2={ZONE_B_X + 40} y2={ZONE_B_Y + ZONE_B_H - 40} stroke={zoneBColor} strokeWidth="2" strokeDasharray="10 5" opacity={0.5} />
      </svg>
    );
  };

// ─── main export ───────────────────────────────────────────────

export const ColdOpen: FC<ColdOpenProps> = ({
  seconds, startSec, revealSec, organizedSec, endSec,
  items, zoneALabel, zoneAColor, zoneBLabel, zoneBColor,
  organizerA, organizerB, hue = "cool",
}) => {
  // Partition items into zones and assign deterministic positions
  const zoneAItems = items.filter(it => it.targetZone === "A");
  const zoneBItems = items.filter(it => it.targetZone === "B");

  const internalItems: InternalItem[] = [
    ...zoneAItems.map((it, i) => ({ ...it, ...chaosPos(items.indexOf(it), items.length), ...zoneATarget(i, zoneAItems.length) })),
    ...zoneBItems.map((it, i) => ({ ...it, ...chaosPos(items.indexOf(it), items.length), ...zoneBTarget(i, zoneBItems.length) })),
  ];

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Background hue={hue} />

      <ZoneBox seconds={seconds} x={ZONE_A_X} y={ZONE_A_Y} w={ZONE_A_W} h={ZONE_A_H} label={zoneALabel} color={zoneAColor} revealSec={revealSec} />
      <ZoneTitle seconds={seconds} label={zoneALabel} x={ZONE_A_X + 240} y={ZONE_A_Y + 16} color={zoneAColor} revealSec={revealSec} />

      <ZoneBox seconds={seconds} x={ZONE_B_X} y={ZONE_B_Y} w={ZONE_B_W} h={ZONE_B_H} label={zoneBLabel} color={zoneBColor} revealSec={revealSec} />
      <ZoneTitle seconds={seconds} label={zoneBLabel} x={ZONE_B_X + 250} y={ZONE_B_Y + 16} color={zoneBColor} revealSec={revealSec} />

      {internalItems.map(it => <Card key={it.label} seconds={seconds} item={it} revealSec={revealSec} organizedSec={organizedSec} startSec={startSec} />)}

      <Organizer seconds={seconds} label={organizerA.label} appearSec={revealSec} x={620} y={760} color={organizerA.color} />
      <Organizer seconds={seconds} label={organizerB.label} appearSec={revealSec + 0.5} x={960} y={760} color={organizerB.color} fromRight />

      <Arrows seconds={seconds} organizedSec={organizedSec} zoneAColor={zoneAColor} zoneBColor={zoneBColor} />
      <CpuIcon seconds={seconds} organizedSec={organizedSec} startSec={startSec} />
    </div>
  );
};

export default ColdOpen;