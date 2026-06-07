import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const easeOut = Easing.out(Easing.cubic);

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

type TimedStyle = CSSProperties;

export const slideFade = (
  seconds: number,
  start: number,
  options: {
    duration?: number;
    fromX?: number;
    fromY?: number;
  } = {},
): TimedStyle => {
  const { duration = 0.45, fromX = 0, fromY = 24 } = options;
  const opacity = interpolate(seconds, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const x = interpolate(seconds, [start, start + duration], [fromX, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const y = interpolate(seconds, [start, start + duration], [fromY, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return { opacity, transform: `translate(${x}px, ${y}px)` };
};

export const softPop = (
  seconds: number,
  start: number,
  options: {
    duration?: number;
    fromScale?: number;
    toScale?: number;
  } = {},
): TimedStyle => {
  const { duration = 0.38, fromScale = 0.96, toScale = 1 } = options;
  const opacity = interpolate(seconds, [start, start + duration * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const scale = interpolate(seconds, [start, start + duration], [fromScale, toScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return { opacity, transform: `scale(${scale})` };
};

export const typewriterLine = (
  text: string,
  seconds: number,
  start: number,
  charsPerSecond = 24,
): string => {
  const visibleChars = Math.floor(Math.max(0, seconds - start) * charsPerSecond);
  return text.slice(0, Math.min(text.length, visibleChars));
};

export const semanticPulse = (
  seconds: number,
  start: number,
  options: {
    duration?: number;
    strength?: number;
    color?: string;
  } = {},
): TimedStyle => {
  const { duration = 0.65, strength = 1, color = "rgba(255,192,77,0.45)" } = options;
  const t = clamp01((seconds - start) / duration);
  const emphasis = Math.sin(t * Math.PI) * strength;
  return {
    boxShadow: `0 0 ${Math.round(26 * emphasis)}px ${color}`,
    borderColor: color,
  };
};

export const revealProgress = (
  seconds: number,
  start: number,
  duration = 0.8,
): number =>
  interpolate(seconds, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
