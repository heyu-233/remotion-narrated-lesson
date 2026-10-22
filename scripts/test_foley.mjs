#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "foley.mjs");
const engineRootOption = process.argv.indexOf("--engine-root");
const engineRoot = engineRootOption === -1 ? null : process.argv[engineRootOption + 1];
if (engineRootOption !== -1 && (!engineRoot || !path.isAbsolute(engineRoot))) {
  throw new Error("--engine-root requires an absolute engine directory");
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function tempRoot(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `remotion-foley-${label}-`));
}

function run(command, timelinePath, outputDir, manifestPath, extra = []) {
  return execFileSync(process.execPath, [SCRIPT, command, "--timeline", timelinePath, "--output-dir", outputDir, "--manifest", manifestPath, ...extra], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function build(timelinePath, outputDir, manifestPath, extra = []) {
  const result = JSON.parse(run("build", timelinePath, outputDir, manifestPath, extra));
  assert.equal(result.ok, true);
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function verify(timelinePath, outputDir, manifestPath, extra = []) {
  const result = JSON.parse(run("verify", timelinePath, outputDir, manifestPath, extra));
  assert.equal(result.ok, true);
  return result;
}

function timelineCopy(root, label, sourcePath, mutate) {
  const timeline = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  mutate?.(timeline);
  const filePath = path.join(root, `${label}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(timeline, null, 2)}\n`, "utf8");
  return filePath;
}

function expectFailure(fn, pattern, label) {
  assert.throws(fn, (error) => {
    const text = `${error.stderr ?? ""}${error.message ?? ""}`;
    return pattern.test(text);
  }, label);
}

function testDeterministicTimelines(root, timelines) {
  for (const [label, sourcePath] of timelines) {
    const first = path.join(root, `${label}-a`);
    const second = path.join(root, `${label}-b`);
    fs.mkdirSync(first);
    fs.mkdirSync(second);
    const firstManifestPath = path.join(first, "manifest.json");
    const secondManifestPath = path.join(second, "manifest.json");
    const firstManifest = build(sourcePath, first, firstManifestPath);
    const secondManifest = build(sourcePath, second, secondManifestPath);
    assert.equal(fs.readFileSync(firstManifestPath, "utf8"), fs.readFileSync(secondManifestPath, "utf8"), `${label}: manifest is deterministic`);
    assert.equal(sha256(path.join(first, "foley.wav")), sha256(path.join(second, "foley.wav")), `${label}: master is deterministic`);
    for (const event of firstManifest.events) {
      assert.equal(sha256(path.join(first, event.file)), sha256(path.join(second, event.file)), `${label}: stem ${event.id} is deterministic`);
    }
    verify(sourcePath, first, firstManifestPath);
  }
}

function testEndAnchorAndTimelineDrift(root, fixture) {
  const baseTimeline = timelineCopy(root, "end-anchor-base", fixture, (timeline) => {
    timeline.durationSeconds = 3;
    timeline.anchors = [{ id: "cue", start: 0.5, end: 1.25 }];
    timeline.soundEvents = [{ id: "end-cue", anchor: "cue", phase: "end", offset: 0, kind: "ready", gain: 0.5 }];
  });
  const outputDir = path.join(root, "end-anchor-output");
  fs.mkdirSync(outputDir);
  const manifestPath = path.join(outputDir, "manifest.json");
  const manifest = build(baseTimeline, outputDir, manifestPath);
  assert.equal(manifest.events[0].phase, "end");
  assert.equal(manifest.events[0].anchorTimeSeconds, 1.25);
  assert.equal(manifest.events[0].resolvedStartSeconds, 1.25);
  verify(baseTimeline, outputDir, manifestPath);

  const retimedTimeline = timelineCopy(root, "end-anchor-retimed", baseTimeline, (timeline) => {
    timeline.anchors[0].end = 1.5;
  });
  expectFailure(() => verify(retimedTimeline, outputDir, manifestPath), /sourceSemanticFingerprint|anchorTimeSeconds|resolvedStartFrame/, "end-anchor retime is detected");

  const gainTimeline = timelineCopy(root, "gain-drift", baseTimeline, (timeline) => {
    timeline.soundEvents[0].gain = 0.4;
  });
  expectFailure(() => verify(gainTimeline, outputDir, manifestPath), /sourceSemanticFingerprint|events\[0\]\.gain/, "gain drift is detected");

  const kindTimeline = timelineCopy(root, "kind-drift", baseTimeline, (timeline) => {
    timeline.soundEvents[0].kind = "close";
  });
  expectFailure(() => verify(kindTimeline, outputDir, manifestPath), /sourceSemanticFingerprint|events\[0\]\.kind/, "kind drift is detected");

  const phaseTimeline = timelineCopy(root, "phase-drift", baseTimeline, (timeline) => {
    timeline.soundEvents[0].phase = "start";
  });
  expectFailure(() => verify(phaseTimeline, outputDir, manifestPath), /sourceSemanticFingerprint|events\[0\]\.phase/, "phase drift is detected");
}

function testTamperingAndValidation(root, fixture) {
  const sourceTimeline = timelineCopy(root, "tamper-source", fixture, (timeline) => {
    timeline.durationSeconds = 4;
    timeline.anchors = [{ id: "cue", start: 0, end: 1 }];
    timeline.soundEvents = [{ id: "cue", anchor: "cue", kind: "ready", gain: 0.8 }];
  });
  const outputDir = path.join(root, "tamper-output");
  fs.mkdirSync(outputDir);
  const manifestPath = path.join(outputDir, "manifest.json");
  build(sourceTimeline, outputDir, manifestPath);
  const stemPath = path.join(outputDir, "cue.wav");
  const stem = fs.readFileSync(stemPath);
  stem[stem.length - 1] ^= 0x01;
  fs.writeFileSync(stemPath, stem);
  expectFailure(() => verify(sourceTimeline, outputDir, manifestPath), /sha256|tampered|cue\.wav/, "tampered stem is detected");

  build(sourceTimeline, outputDir, manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.events[0].gain = 0.2;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  expectFailure(() => verify(sourceTimeline, outputDir, manifestPath), /gain|sourceSemanticFingerprint/, "tampered manifest is detected");

  const invalidAnchor = timelineCopy(root, "invalid-anchor", sourceTimeline, (timeline) => {
    timeline.soundEvents[0].anchor = "missing";
  });
  expectFailure(() => build(invalidAnchor, path.join(root, "invalid-anchor-output"), path.join(root, "invalid-anchor-output", "manifest.json")), /does not reference a declared anchor/, "missing anchor is rejected");

  for (const id of ["FOLEY", "CON", "../escape"]) {
    const invalidId = timelineCopy(root, `invalid-id-${id === "../escape" ? "path" : id}`, sourceTimeline, (timeline) => {
      timeline.soundEvents[0].id = id;
    });
    expectFailure(() => build(invalidId, outputDir, manifestPath), /reserved|path-safe/, `unsafe filename ${id} is rejected`);
  }
  const duplicateId = timelineCopy(root, "duplicate-id", sourceTimeline, (timeline) => {
    timeline.soundEvents.push({ ...timeline.soundEvents[0], id: "CUE" });
  });
  expectFailure(() => build(duplicateId, outputDir, manifestPath), /Duplicate sound event id/, "case-insensitive filename collision is rejected");
  const originalTimelineHash = sha256(sourceTimeline);
  expectFailure(() => build(sourceTimeline, outputDir, sourceTimeline), /distinct file paths/, "manifest cannot overwrite the timeline");
  assert.equal(sha256(sourceTimeline), originalTimelineHash);
  expectFailure(() => build(sourceTimeline, outputDir, path.join(outputDir, "foley.wav")), /distinct file paths/, "manifest cannot overwrite the master");

  const outOfBounds = timelineCopy(root, "out-of-bounds", sourceTimeline, (timeline) => {
    timeline.anchors[0].start = 3.9;
    timeline.anchors[0].end = 4;
  });
  expectFailure(() => build(outOfBounds, path.join(root, "out-of-bounds-output"), path.join(root, "out-of-bounds-output", "manifest.json")), /outside the|runs past the timeline/, "truncated cue is rejected");

  const missingEvents = timelineCopy(root, "missing-events", sourceTimeline, (timeline) => {
    delete timeline.soundEvents;
  });
  expectFailure(() => build(missingEvents, path.join(root, "missing-events-output"), path.join(root, "missing-events-output", "manifest.json")), /soundEvents is required/, "missing soundEvents declaration is rejected");

  const emptyEvents = timelineCopy(root, "empty-events", sourceTimeline, (timeline) => {
    timeline.soundEvents = [];
  });
  const emptyOutput = path.join(root, "empty-output");
  fs.mkdirSync(emptyOutput);
  const emptyManifest = path.join(emptyOutput, "manifest.json");
  const empty = build(emptyEvents, emptyOutput, emptyManifest);
  assert.equal(empty.events.length, 0);
  assert.equal(empty.master.peakDbfs, null, "explicitly empty events render silence");
  verify(emptyEvents, emptyOutput, emptyManifest);
}

function testGainCeiling(root, fixture) {
  const lowTimeline = timelineCopy(root, "gain-low", fixture, (timeline) => {
    timeline.durationSeconds = 2;
    timeline.anchors = [{ id: "cue", start: 0, end: 1 }];
    timeline.soundEvents = [{ id: "cue", anchor: "cue", kind: "load", gain: 0.2 }];
  });
  const highTimeline = timelineCopy(root, "gain-high", lowTimeline, (timeline) => {
    timeline.soundEvents[0].gain = 0.8;
  });
  const lowOutput = path.join(root, "gain-low-output");
  const highOutput = path.join(root, "gain-high-output");
  fs.mkdirSync(lowOutput);
  fs.mkdirSync(highOutput);
  const lowManifest = build(lowTimeline, lowOutput, path.join(lowOutput, "manifest.json"));
  const highManifest = build(highTimeline, highOutput, path.join(highOutput, "manifest.json"));
  assert.ok(lowManifest.master.peakDbfs < highManifest.master.peakDbfs, "lower event gain must lower the master peak");
  assert.equal(lowManifest.master.masterScale, 1, "quiet mix is not normalized upward");
  const customOutput = path.join(root, "gain-custom-output");
  const customManifest = path.join(customOutput, "manifest.json");
  const custom = build(highTimeline, customOutput, customManifest, ["--peak-dbfs", "-24"]);
  assert.equal(custom.peakDbfsCeiling, -24);
  assert.ok(custom.master.peakDbfs <= -24 + 1e-9, "custom peak ceiling is applied");
  verify(highTimeline, customOutput, customManifest, ["--peak-dbfs", "-24"]);
}

function main() {
  const root = tempRoot("tests");
  try {
    const fixture = path.join(root, "fixture.json");
    fs.writeFileSync(fixture, JSON.stringify({
      version: 1,
      fps: 30,
      durationSeconds: 5,
      anchors: [{ id: "start", start: 0.25, end: 0.5 }, { id: "change", start: 2, end: 3 }],
      soundEvents: [
        { id: "arrive", anchor: "start", kind: "ready", gain: 0.4, pan: -0.25 },
        { id: "changed", anchor: "change", phase: "end", kind: "settle", gain: 0.3, pan: 0.25 },
      ],
    }), "utf8");
    testDeterministicTimelines(root, [["fixture", fixture]]);
    testEndAnchorAndTimelineDrift(root, fixture);
    testTamperingAndValidation(root, fixture);
    testGainCeiling(root, fixture);
    if (engineRoot) {
      testDeterministicTimelines(root, ["motor-feedback-study", "rtos-scheduling-study"].map((id) =>
        [id, path.join(engineRoot, "episodes", id, "timeline.json")],
      ));
    }
    console.log(JSON.stringify({ ok: true, tests: 4, pilotTimelines: engineRoot ? 2 : 0 }, null, 2));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

main();
