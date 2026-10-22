#!/usr/bin/env node

/**
 * Deterministic, package-free event-anchored foley generator for Remotion
 * episode timelines.
 *
 * The timeline remains the only timing authority.  `build` resolves every
 * sound event against an anchor, writes PCM16 stereo 48 kHz stems and a
 * master foley.wav, and records enough provenance to make `verify` useful.
 * `verify` regenerates the expected schedule and audio bytes in memory, so a
 * changed anchor, gain, kind, phase, or a tampered output cannot hide behind
 * an unchanged duration or event count.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SAMPLE_RATE = 48_000;
export const CHANNELS = 2;
export const SAMPLE_WIDTH_BITS = 16;
export const SEED = 20261022;
export const DEFAULT_PEAK_DBFS = -10.5;
export const SUPPORTED_KINDS = ["ready", "target", "drive", "settle", "load", "close"];

const VERSION = 1;
const WAV_HEADER_BYTES = 44;
const PATH_SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;

class FoleyError extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = "FoleyError";
    this.details = details;
  }
}

function fail(message, details = undefined) {
  throw new FoleyError(message, details);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function number(value, label) {
  if (!isFiniteNumber(value)) {
    fail(`${label} must be a finite number; received ${String(value)}`);
  }
  return value;
}

function nonNegativeNumber(value, label) {
  const resolved = number(value, label);
  if (resolved < 0) fail(`${label} must be >= 0; received ${resolved}`);
  return resolved;
}

function assertAbsolute(filePath, label) {
  if (!path.isAbsolute(filePath)) {
    fail(`${label} must be an absolute path; received ${filePath}`);
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function sha256(value) {
  const hash = crypto.createHash("sha256");
  hash.update(value);
  return hash.digest("hex");
}

function sha256File(filePath) {
  return sha256(fs.readFileSync(filePath));
}

function semanticTimeline(timeline) {
  return {
    version: timeline.version ?? null,
    fps: timeline.fps ?? null,
    durationSeconds: timeline.durationSeconds,
    anchors: timeline.anchors.map((anchor) => ({
      id: anchor.id,
      start: anchor.start,
      end: anchor.end,
    })),
    soundEvents: timeline.soundEvents.map((event) => ({
      id: event.id,
      anchor: event.anchor,
      offset: event.offset ?? 0,
      phase: event.phase ?? "start",
      kind: event.kind,
      gain: event.gain,
      ...(event.pan === undefined ? {} : { pan: event.pan }),
    })),
  };
}

export function semanticFingerprint(timeline) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(semanticTimeline(timeline))), "utf8"));
}

function readJson(filePath, label) {
  let text;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    fail(`Unable to read ${label} ${filePath}: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${label} ${filePath}: ${error.message}`);
  }
}

function validateId(id, label) {
  if (typeof id !== "string" || !PATH_SAFE_ID.test(id) || id.includes("..")) {
    fail(`${label} must be a path-safe identifier matching ${PATH_SAFE_ID}; received ${String(id)}`);
  }
  if (["foley", ".", ".."].includes(id.toLowerCase()) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(id) || id.endsWith(".")) {
    fail(`${label} is reserved; received ${id}`);
  }
}

function validateTimeline(rawTimeline, timelinePath = "timeline") {
  if (!rawTimeline || typeof rawTimeline !== "object" || Array.isArray(rawTimeline)) {
    fail(`${timelinePath} must contain a JSON object`);
  }
  const timeline = rawTimeline;
  const durationSeconds = nonNegativeNumber(timeline.durationSeconds, "timeline.durationSeconds");
  if (durationSeconds <= 0) fail("timeline.durationSeconds must be > 0");
  if (!Array.isArray(timeline.anchors)) fail("timeline.anchors must be an array");
  if (!Object.prototype.hasOwnProperty.call(timeline, "soundEvents")) {
    fail("timeline.soundEvents is required; use an explicit [] when this episode has no foley events");
  }
  if (!Array.isArray(timeline.soundEvents)) fail("timeline.soundEvents must be an array");

  const anchors = [];
  const anchorMap = new Map();
  for (let index = 0; index < timeline.anchors.length; index += 1) {
    const anchor = timeline.anchors[index];
    const label = `timeline.anchors[${index}]`;
    if (!anchor || typeof anchor !== "object" || Array.isArray(anchor)) fail(`${label} must be an object`);
    validateId(anchor.id, `${label}.id`);
    if (anchorMap.has(anchor.id)) fail(`Duplicate anchor id ${anchor.id}`);
    const start = nonNegativeNumber(anchor.start, `${label}.start`);
    const end = nonNegativeNumber(anchor.end, `${label}.end`);
    if (start > end) fail(`${label}.start must be <= end`);
    if (end > durationSeconds) fail(`${label}.end ${end} exceeds timeline duration ${durationSeconds}`);
    const normalized = { id: anchor.id, start, end };
    anchors.push(normalized);
    anchorMap.set(anchor.id, normalized);
  }

  const events = [];
  const eventIds = new Set();
  for (let index = 0; index < timeline.soundEvents.length; index += 1) {
    const event = timeline.soundEvents[index];
    const label = `timeline.soundEvents[${index}]`;
    if (!event || typeof event !== "object" || Array.isArray(event)) fail(`${label} must be an object`);
    validateId(event.id, `${label}.id`);
    if (eventIds.has(event.id.toLowerCase())) fail(`Duplicate sound event id ${event.id} (case-insensitive filenames)`);
    eventIds.add(event.id.toLowerCase());
    if (typeof event.anchor !== "string" || !anchorMap.has(event.anchor)) {
      fail(`${label}.anchor ${String(event.anchor)} does not reference a declared anchor`);
    }
    if (typeof event.kind !== "string" || !SUPPORTED_KINDS.includes(event.kind)) {
      fail(`${label}.kind ${String(event.kind)} is unsupported; choose one of ${SUPPORTED_KINDS.join(", ")}`);
    }
    const offset = event.offset === undefined ? 0 : number(event.offset, `${label}.offset`);
    const phase = event.phase === undefined ? "start" : event.phase;
    if (phase !== "start" && phase !== "end") fail(`${label}.phase must be "start" or "end"`);
    const gain = event.gain === undefined ? 1 : number(event.gain, `${label}.gain`);
    if (gain < 0) fail(`${label}.gain must be >= 0`);
    const pan = event.pan === undefined ? null : number(event.pan, `${label}.pan`);
    if (pan !== null && (pan < -1 || pan > 1)) fail(`${label}.pan must be in [-1, 1]`);
    events.push({
      id: event.id,
      anchor: event.anchor,
      offset,
      phase,
      kind: event.kind,
      gain,
      pan,
    });
  }

  const normalizedTimeline = {
    ...timeline,
    durationSeconds,
    anchors,
    soundEvents: events,
  };
  const durationFrames = Math.round(durationSeconds * SAMPLE_RATE);
  const schedule = events.map((event) => {
    const anchor = anchorMap.get(event.anchor);
    const anchorTimeSeconds = event.phase === "end" ? anchor.end : anchor.start;
    const declaredStartSeconds = anchorTimeSeconds + event.offset;
    const startFrame = Math.round(declaredStartSeconds * SAMPLE_RATE);
    const cue = cueInfo(event.kind);
    if (startFrame < 0 || startFrame >= durationFrames) {
      fail(
        `Sound event ${event.id} resolves to frame ${startFrame} (${declaredStartSeconds}s), outside the ${durationFrames}-frame timeline`,
      );
    }
    if (startFrame + cue.frames > durationFrames) {
      fail(
        `Sound event ${event.id} (${event.kind}, ${cue.durationSeconds.toFixed(3)}s) runs past the timeline at ${declaredStartSeconds}s; move its anchor/offset earlier`,
      );
    }
    return {
      ...event,
      anchorTimeSeconds,
      declaredStartSeconds,
      startFrame,
      actualStartSeconds: startFrame / SAMPLE_RATE,
      startErrorSeconds: startFrame / SAMPLE_RATE - declaredStartSeconds,
      cueDurationSeconds: cue.durationSeconds,
      cueFrames: cue.frames,
      defaultPan: cue.defaultPan,
    };
  });
  return {
    timeline: normalizedTimeline,
    durationSeconds,
    durationFrames,
    anchors,
    events,
    schedule,
    semanticFingerprint: semanticFingerprint(normalizedTimeline),
  };
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function fadeEnvelope(t, duration, attack, release) {
  if (t < 0 || t >= duration) return 0;
  const attackPart = Math.min(1, t / Math.max(attack, 1e-6));
  const releasePart = Math.min(1, (duration - t) / Math.max(release, 1e-6));
  return attackPart * releasePart;
}

function cueInfo(kind) {
  const durations = { ready: 0.27, target: 0.36, drive: 0.31, settle: 0.31, load: 0.43, close: 0.44 };
  const defaultPans = { ready: 0, target: -0.24, drive: -0.08, settle: 0.08, load: 0.28, close: 0.04 };
  const durationSeconds = durations[kind];
  return { durationSeconds, frames: Math.max(1, Math.round(durationSeconds * SAMPLE_RATE)), defaultPan: defaultPans[kind] };
}

function synthMono(kind, random) {
  const { durationSeconds, frames } = cueInfo(kind);
  const samples = new Float64Array(frames);
  for (let index = 0; index < frames; index += 1) {
    const t = index / SAMPLE_RATE;
    let value = 0;
    if (kind === "ready") {
      const env = fadeEnvelope(t, durationSeconds, 0.0015, 0.08) * Math.exp(-5 * t);
      const click = 0.3 * Math.exp(-120 * t) * Math.sin(2 * Math.PI * 1650 * t);
      const ping = 0.26 * Math.sin(2 * Math.PI * 980 * t) * Math.exp(-18 * t);
      value = env * (click + ping);
    } else if (kind === "target") {
      const notes = [[0, 0.135, 525], [0.145, 0.17, 760]];
      for (const [start, noteDuration, frequency] of notes) {
        const local = t - start;
        if (local >= 0 && local < noteDuration) {
          const env = fadeEnvelope(local, noteDuration, 0.006, 0.085);
          const glide = frequency + (16 * local) / noteDuration;
          value += env * (0.27 * Math.sin(2 * Math.PI * glide * local) + 0.055 * Math.sin(2 * Math.PI * glide * 2 * local));
        }
      }
    } else if (kind === "drive") {
      const env = fadeEnvelope(t, durationSeconds, 0.004, 0.14) * Math.exp(-3.6 * t);
      const carrier = 0.21 * Math.sin(2 * Math.PI * (172 + 24 * t) * t) + 0.095 * Math.sin(2 * Math.PI * (306 + 14 * t) * t);
      value = env * (carrier + 0.055 * (random() * 2 - 1));
    } else if (kind === "settle") {
      const notes = [[0, 0.12, 465], [0.125, 0.165, 650]];
      for (const [start, noteDuration, frequency] of notes) {
        const local = t - start;
        if (local >= 0 && local < noteDuration) {
          const env = fadeEnvelope(local, noteDuration, 0.008, 0.095);
          value += env * (0.2 * Math.sin(2 * Math.PI * frequency * local) + 0.035 * Math.sin(2 * Math.PI * frequency * 2 * local));
        }
      }
    } else if (kind === "load") {
      const env = fadeEnvelope(t, durationSeconds, 0.002, 0.25) * Math.exp(-3.2 * t);
      const thump = 0.36 * Math.sin(2 * Math.PI * (84 - 22 * t) * t);
      const scrape = Math.max(0, Math.min(1, (t - 0.035) / 0.025)) * Math.max(0, Math.min(1, (0.19 - t) / 0.08));
      value = env * thump + 0.055 * scrape * (random() * 2 - 1);
    } else if (kind === "close") {
      const env = fadeEnvelope(t, durationSeconds, 0.012, 0.19) * Math.exp(-2 * t);
      const frequency = 650 - 210 * (t / durationSeconds);
      value = env * (0.2 * Math.sin(2 * Math.PI * frequency * t) + 0.03 * Math.sin(2 * Math.PI * frequency * 2 * t));
    }
    samples[index] = value;
  }
  return samples;
}

function equalPower(value, pan) {
  const angle = ((pan + 1) * Math.PI) / 4;
  return [value * Math.cos(angle), value * Math.sin(angle)];
}

function renderEvent(event, random) {
  const mono = synthMono(event.kind, random);
  const pan = event.pan === null ? event.defaultPan : event.pan;
  const left = new Float64Array(mono.length);
  const right = new Float64Array(mono.length);
  let peak = 0;
  for (let index = 0; index < mono.length; index += 1) {
    const [leftValue, rightValue] = equalPower(mono[index] * event.gain, pan);
    left[index] = leftValue;
    right[index] = rightValue;
    peak = Math.max(peak, Math.abs(leftValue), Math.abs(rightValue));
  }
  if (peak > 1) fail(`Sound event ${event.id} exceeds PCM range at gain ${event.gain}; reduce its gain below ${event.gain}`);
  return { left, right, peak, pan };
}

function dbfs(value) {
  return value <= 0 ? null : 20 * Math.log10(value);
}

function pcm16(value) {
  const clipped = Math.max(-1, Math.min(1, value));
  return Math.round(clipped * 32767);
}

function wavBuffer(left, right, scale = 1) {
  const frames = left.length;
  const buffer = Buffer.alloc(WAV_HEADER_BYTES + frames * CHANNELS * 2);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * 2, 28);
  buffer.writeUInt16LE(CHANNELS * 2, 32);
  buffer.writeUInt16LE(SAMPLE_WIDTH_BITS, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(frames * CHANNELS * 2, 40);
  for (let index = 0, offset = WAV_HEADER_BYTES; index < frames; index += 1, offset += 4) {
    buffer.writeInt16LE(pcm16(left[index] * scale), offset);
    buffer.writeInt16LE(pcm16(right[index] * scale), offset + 2);
  }
  return buffer;
}

function readWavInfo(filePath) {
  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (error) {
    fail(`Missing audio file ${filePath}: ${error.message}`);
  }
  if (buffer.length < WAV_HEADER_BYTES || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    fail(`Invalid WAV header in ${filePath}; expected RIFF/WAVE PCM16`);
  }
  const channels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const sampleWidthBits = buffer.readUInt16LE(34);
  const dataBytes = buffer.readUInt32LE(40);
  const expectedBytes = buffer.length - WAV_HEADER_BYTES;
  if (channels !== CHANNELS || sampleRate !== SAMPLE_RATE || sampleWidthBits !== SAMPLE_WIDTH_BITS || dataBytes !== expectedBytes || dataBytes % (CHANNELS * 2) !== 0) {
    fail(`WAV metadata mismatch in ${filePath}; expected stereo PCM16 ${SAMPLE_RATE} Hz`);
  }
  let peak = 0;
  for (let offset = WAV_HEADER_BYTES; offset < buffer.length; offset += 2) {
    peak = Math.max(peak, Math.abs(buffer.readInt16LE(offset)) / 32768);
  }
  return {
    path: filePath,
    channels,
    sampleRate,
    sampleWidthBits,
    frames: dataBytes / (CHANNELS * 2),
    durationSeconds: dataBytes / (CHANNELS * 2 * SAMPLE_RATE),
    peakDbfs: dbfs(peak),
    clipped: peak >= 1,
    sha256: sha256(buffer),
    bytes: buffer.length,
  };
}

function prepareAudio(schedule, peakDbfs) {
  const random = mulberry32(SEED);
  const masterLeft = new Float64Array(schedule.durationFrames);
  const masterRight = new Float64Array(schedule.durationFrames);
  const rendered = [];
  for (const event of schedule.schedule) {
    const audio = renderEvent(event, random);
    rendered.push({ event, audio });
    for (let index = 0; index < audio.left.length; index += 1) {
      masterLeft[event.startFrame + index] += audio.left[index];
      masterRight[event.startFrame + index] += audio.right[index];
    }
  }
  let rawPeak = 0;
  for (let index = 0; index < masterLeft.length; index += 1) {
    rawPeak = Math.max(rawPeak, Math.abs(masterLeft[index]), Math.abs(masterRight[index]));
  }
  const ceiling = 10 ** (peakDbfs / 20);
  const masterScale = rawPeak > ceiling && rawPeak > 0 ? ceiling / rawPeak : 1;
  const masterBuffer = wavBuffer(masterLeft, masterRight, masterScale);
  const stems = rendered.map(({ event, audio }) => ({
    event,
    audio,
    buffer: wavBuffer(audio.left, audio.right),
  }));
  return { stems, masterBuffer, rawPeak, masterScale, peakDbfs: dbfs(rawPeak * masterScale) };
}

function manifestFor(schedule, audio, timelinePath, peakDbfs) {
  const events = audio.stems.map(({ event, audio: eventAudio, buffer }) => ({
    id: event.id,
    kind: event.kind,
    anchor: event.anchor,
    phase: event.phase,
    offsetSeconds: event.offset,
    anchorTimeSeconds: event.anchorTimeSeconds,
    declaredStartSeconds: event.declaredStartSeconds,
    resolvedStartFrame: event.startFrame,
    resolvedStartSeconds: event.actualStartSeconds,
    startErrorSeconds: event.startErrorSeconds,
    durationSeconds: event.cueDurationSeconds,
    frames: event.cueFrames,
    gain: event.gain,
    pan: event.pan === null ? event.defaultPan : event.pan,
    file: `${event.id}.wav`,
    sha256: sha256(buffer),
    bytes: buffer.length,
    peakDbfs: dbfs(eventAudio.peak),
  }));
  const masterFile = "foley.wav";
  return {
    version: VERSION,
    tool: "remotion-narrated-lesson/scripts/foley.mjs",
    seed: SEED,
    sourceTimeline: path.resolve(timelinePath),
    sourceSemanticFingerprint: schedule.semanticFingerprint,
    sampleRate: SAMPLE_RATE,
    channels: CHANNELS,
    sampleWidthBits: SAMPLE_WIDTH_BITS,
    durationSeconds: schedule.durationSeconds,
    durationFrames: schedule.durationFrames,
    peakDbfsCeiling: peakDbfs,
    masterFile,
    master: {
      file: masterFile,
      sha256: sha256(audio.masterBuffer),
      bytes: audio.masterBuffer.length,
      frames: schedule.durationFrames,
      durationSeconds: schedule.durationSeconds,
      peakDbfs: audio.peakDbfs,
      masterScale: audio.masterScale,
      ceilingOnly: true,
    },
    events,
    checks: {
      eventCountMatchesTimeline: events.length === schedule.schedule.length,
      allEventsInsideTimeline: schedule.schedule.every((event) => event.startFrame + event.cueFrames <= schedule.durationFrames),
      eventStartErrorMaxSeconds: Math.max(...schedule.schedule.map((event) => Math.abs(event.startErrorSeconds)), 0),
      noClipping: !readPeakFromWavBuffer(audio.masterBuffer).clipped,
    },
  };
}

function readPeakFromWavBuffer(buffer) {
  let peak = 0;
  for (let offset = WAV_HEADER_BYTES; offset < buffer.length; offset += 2) peak = Math.max(peak, Math.abs(buffer.readInt16LE(offset)) / 32768);
  return { peak, clipped: peak >= 1, peakDbfs: dbfs(peak) };
}

function compareNumbers(actual, expected, label) {
  if (typeof actual !== "number" || !Number.isFinite(actual) || Math.abs(actual - expected) > 1e-9) {
    fail(`Manifest ${label} mismatch: expected ${expected}, found ${String(actual)}`);
  }
}

function compareNullableNumber(actual, expected, label) {
  if (expected === null) {
    if (actual !== null) fail(`Manifest ${label} mismatch: expected null, found ${String(actual)}`);
    return;
  }
  compareNumbers(actual, expected, label);
}

function compareStrings(actual, expected, label) {
  if (actual !== expected) fail(`Manifest ${label} mismatch: expected ${expected}, found ${String(actual)}`);
}

function ensureManifestMatches(manifest, schedule, audio, timelinePath, outputDir, manifestPath, peakDbfs) {
  if (!manifest || typeof manifest !== "object") fail("Manifest must contain a JSON object");
  const expectedManifest = manifestFor(schedule, audio, timelinePath, peakDbfs);
  compareNumbers(manifest.version, expectedManifest.version, "version");
  compareNumbers(manifest.seed, expectedManifest.seed, "seed");
  compareStrings(manifest.tool, expectedManifest.tool, "tool");
  compareStrings(manifest.sourceSemanticFingerprint, schedule.semanticFingerprint, "sourceSemanticFingerprint");
  compareNumbers(manifest.durationSeconds, schedule.durationSeconds, "durationSeconds");
  compareNumbers(manifest.durationFrames, schedule.durationFrames, "durationFrames");
  compareNumbers(manifest.sampleRate, SAMPLE_RATE, "sampleRate");
  compareNumbers(manifest.channels, CHANNELS, "channels");
  compareNumbers(manifest.sampleWidthBits, SAMPLE_WIDTH_BITS, "sampleWidthBits");
  compareNumbers(manifest.peakDbfsCeiling, peakDbfs, "peakDbfsCeiling");
  compareStrings(manifest.masterFile, expectedManifest.masterFile, "masterFile");
  compareStrings(manifest.master?.file, expectedManifest.master.file, "master.file");
  compareNumbers(manifest.master?.bytes, expectedManifest.master.bytes, "master.bytes");
  compareNumbers(manifest.master?.frames, expectedManifest.master.frames, "master.frames");
  compareNumbers(manifest.master?.durationSeconds, expectedManifest.master.durationSeconds, "master.durationSeconds");
  compareNumbers(manifest.master?.masterScale, expectedManifest.master.masterScale, "master.masterScale");
  if (manifest.master?.ceilingOnly !== true) fail("Manifest master.ceilingOnly must be true");
  if (!manifest.checks || typeof manifest.checks !== "object") fail("Manifest checks are missing or invalid");
  if (manifest.checks.eventCountMatchesTimeline !== expectedManifest.checks.eventCountMatchesTimeline) fail("Manifest checks.eventCountMatchesTimeline was tampered");
  if (manifest.checks.allEventsInsideTimeline !== expectedManifest.checks.allEventsInsideTimeline) fail("Manifest checks.allEventsInsideTimeline was tampered");
  compareNumbers(manifest.checks.eventStartErrorMaxSeconds, expectedManifest.checks.eventStartErrorMaxSeconds, "checks.eventStartErrorMaxSeconds");
  if (manifest.checks.noClipping !== expectedManifest.checks.noClipping) fail("Manifest checks.noClipping was tampered");
  if (!Array.isArray(manifest.events) || manifest.events.length !== schedule.schedule.length) fail(`Manifest event count mismatch: expected ${schedule.schedule.length}, found ${String(manifest.events?.length)}`);
  const manifestIds = new Set();
  for (let index = 0; index < schedule.schedule.length; index += 1) {
    const expected = schedule.schedule[index];
    const actual = manifest.events[index];
    if (!actual || typeof actual !== "object") fail(`Manifest events[${index}] is missing or invalid`);
    if (manifestIds.has(actual.id)) fail(`Manifest contains duplicate event id ${actual.id}`);
    manifestIds.add(actual.id);
    compareStrings(actual.id, expected.id, `events[${index}].id`);
    compareStrings(actual.kind, expected.kind, `events[${index}].kind`);
    compareStrings(actual.anchor, expected.anchor, `events[${index}].anchor`);
    compareStrings(actual.phase, expected.phase, `events[${index}].phase`);
    compareNumbers(actual.offsetSeconds, expected.offset, `events[${index}].offsetSeconds`);
    compareNumbers(actual.anchorTimeSeconds, expected.anchorTimeSeconds, `events[${index}].anchorTimeSeconds`);
    compareNumbers(actual.declaredStartSeconds, expected.declaredStartSeconds, `events[${index}].declaredStartSeconds`);
    compareNumbers(actual.resolvedStartFrame, expected.startFrame, `events[${index}].resolvedStartFrame`);
    compareNumbers(actual.resolvedStartSeconds, expected.actualStartSeconds, `events[${index}].resolvedStartSeconds`);
    compareNumbers(actual.startErrorSeconds, expected.startErrorSeconds, `events[${index}].startErrorSeconds`);
    compareNumbers(actual.durationSeconds, expected.cueDurationSeconds, `events[${index}].durationSeconds`);
    compareNumbers(actual.frames, expected.cueFrames, `events[${index}].frames`);
    compareNumbers(actual.gain, expected.gain, `events[${index}].gain`);
    compareNumbers(actual.pan, expected.pan === null ? expected.defaultPan : expected.pan, `events[${index}].pan`);
    const expectedFile = `${expected.id}.wav`;
    compareStrings(actual.file, expectedFile, `events[${index}].file`);
    compareNumbers(actual.bytes, expectedManifest.events[index].bytes, `events[${index}].bytes`);
    compareNullableNumber(actual.peakDbfs, expectedManifest.events[index].peakDbfs, `events[${index}].peakDbfs`);
  }

  const expectedMaster = audio.masterBuffer;
  const masterPath = path.join(outputDir, "foley.wav");
  const masterInfo = readWavInfo(masterPath);
  const expectedMasterHash = sha256(expectedMaster);
  compareStrings(masterInfo.sha256, expectedMasterHash, "foley.wav sha256");
  compareStrings(manifest.master?.sha256, expectedMasterHash, "master.sha256");
  compareNullableNumber(manifest.master?.peakDbfs, expectedManifest.master.peakDbfs, "master.peakDbfs");
  compareNumbers(masterInfo.frames, schedule.durationFrames, "foley.wav frames");
  if (masterInfo.clipped) fail("foley.wav is clipped; rebuild with a lower peak ceiling or lower event gains");

  for (const stem of audio.stems) {
    const stemPath = path.join(outputDir, stem.event.id + ".wav");
    const info = readWavInfo(stemPath);
    const expectedHash = sha256(stem.buffer);
    compareStrings(info.sha256, expectedHash, `${stem.event.id}.wav sha256`);
    const actualManifest = manifest.events.find((event) => event.id === stem.event.id);
    compareStrings(actualManifest.sha256, expectedHash, `events[${stem.event.id}].sha256`);
    compareNumbers(info.frames, stem.event.cueFrames, `${stem.event.id}.wav frames`);
    if (info.clipped) fail(`${stem.event.id}.wav is clipped; lower its gain`);
  }
  return { ok: true, master: masterInfo, eventCount: audio.stems.length, sourceTimeline: path.resolve(timelinePath), manifest: path.resolve(manifestPath) };
}

export function build({ timelinePath, outputDir, manifestPath, peakDbfs = DEFAULT_PEAK_DBFS }) {
  assertAbsolute(timelinePath, "--timeline");
  assertAbsolute(outputDir, "--output-dir");
  assertAbsolute(manifestPath, "--manifest");
  number(peakDbfs, "--peak-dbfs");
  if (peakDbfs > 0) fail("--peak-dbfs must be <= 0 because it is a ceiling in dBFS");
  const rawTimeline = readJson(timelinePath, "timeline");
  const schedule = validateTimeline(rawTimeline, timelinePath);
  const pathKey = (filePath) => {
    const resolved = path.resolve(filePath);
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  };
  const audioPaths = ["foley.wav", ...schedule.events.map((event) => `${event.id}.wav`)]
    .map((file) => pathKey(path.join(outputDir, file)));
  if (pathKey(manifestPath) === pathKey(timelinePath) || audioPaths.includes(pathKey(timelinePath)) || audioPaths.includes(pathKey(manifestPath))) {
    fail("Timeline, manifest and generated audio must use distinct file paths");
  }
  const audio = prepareAudio(schedule, peakDbfs);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  for (const stem of audio.stems) fs.writeFileSync(path.join(outputDir, stem.event.id + ".wav"), stem.buffer);
  fs.writeFileSync(path.join(outputDir, "foley.wav"), audio.masterBuffer);
  const manifest = manifestFor(schedule, audio, timelinePath, peakDbfs);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + os.EOL, "utf8");
  return { ok: true, manifest: manifestPath, master: path.join(outputDir, "foley.wav"), eventCount: audio.stems.length, durationSeconds: schedule.durationSeconds, masterPeakDbfs: audio.peakDbfs, masterScale: audio.masterScale };
}

export function verify({ timelinePath, outputDir, manifestPath, peakDbfs = DEFAULT_PEAK_DBFS }) {
  assertAbsolute(timelinePath, "--timeline");
  assertAbsolute(outputDir, "--output-dir");
  assertAbsolute(manifestPath, "--manifest");
  number(peakDbfs, "--peak-dbfs");
  if (peakDbfs > 0) fail("--peak-dbfs must be <= 0 because it is a ceiling in dBFS");
  const rawTimeline = readJson(timelinePath, "timeline");
  const schedule = validateTimeline(rawTimeline, timelinePath);
  const manifest = readJson(manifestPath, "manifest");
  const audio = prepareAudio(schedule, peakDbfs);
  return ensureManifestMatches(manifest, schedule, audio, timelinePath, outputDir, manifestPath, peakDbfs);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    return { help: true };
  }
  if (command !== "build" && command !== "verify") fail(`Unknown command ${command}; use build or verify`);
  const values = { command, peakDbfs: DEFAULT_PEAK_DBFS };
  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    if (flag === "--peak-dbfs") {
      const value = rest[++index];
      if (value === undefined) fail("--peak-dbfs requires a value");
      values.peakDbfs = Number(value);
      continue;
    }
    if (!["--timeline", "--output-dir", "--manifest"].includes(flag)) fail(`Unknown option ${flag}`);
    const value = rest[++index];
    if (value === undefined) fail(`${flag} requires a value`);
    values[flag.slice(2).replaceAll("-", "_")] = value;
  }
  for (const key of ["timeline", "output_dir", "manifest"]) if (!values[key]) fail(`Missing --${key.replaceAll("_", "-")}`);
  return values;
}

function usage() {
  return [
    "Usage:",
    "  node foley.mjs build  --timeline ABS --output-dir ABS --manifest ABS [--peak-dbfs -10.5]",
    "  node foley.mjs verify --timeline ABS --output-dir ABS --manifest ABS [--peak-dbfs -10.5]",
    "",
    "The master ceiling attenuates only when the mixed peak exceeds --peak-dbfs; it never normalizes quiet mixes upward.",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(usage());
    } else if (args.command === "build") {
      console.log(JSON.stringify(build({ timelinePath: args.timeline, outputDir: args.output_dir, manifestPath: args.manifest, peakDbfs: args.peakDbfs }), null, 2));
    } else {
      console.log(JSON.stringify(verify({ timelinePath: args.timeline, outputDir: args.output_dir, manifestPath: args.manifest, peakDbfs: args.peakDbfs }), null, 2));
    }
  } catch (error) {
    console.error(`[foley] error: ${error.message}`);
    process.exitCode = 1;
  }
}
