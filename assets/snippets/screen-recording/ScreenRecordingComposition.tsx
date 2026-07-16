import type { FC, ReactNode } from "react";
import { AbsoluteFill, Audio, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";

type ScreenRecordingCompositionProps = {
  recordingFile: string;
  voiceoverFile: string;
  recordingStartFrom?: number;
  recordingEndAt?: number;
  recordingVolume?: number;
  children?: ReactNode;
};

export const ScreenRecordingComposition: FC<ScreenRecordingCompositionProps> = ({
  recordingFile,
  voiceoverFile,
  recordingStartFrom = 0,
  recordingEndAt,
  recordingVolume = 0,
  children,
}) => (
  <AbsoluteFill style={{ background: "#050a14" }}>
    <OffthreadVideo
      src={staticFile(recordingFile)}
      startFrom={recordingStartFrom}
      endAt={recordingEndAt}
      volume={recordingVolume}
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
    <Audio src={staticFile(voiceoverFile)} />
    {children}
  </AbsoluteFill>
);

type Clip = {
  file: string;
  from: number;
  durationInFrames: number;
  startFrom?: number;
  endAt?: number;
  volume?: number;
  overlay?: ReactNode;
};

export const ClipSequence: FC<{ clips: Clip[] }> = ({ clips }) => (
  <AbsoluteFill style={{ background: "#050a14" }}>
    {clips.map((clip, index) => (
      <Sequence key={`${clip.file}-${index}`} from={clip.from} durationInFrames={clip.durationInFrames}>
        <OffthreadVideo
          src={staticFile(clip.file)}
          startFrom={clip.startFrom ?? 0}
          endAt={clip.endAt}
          volume={clip.volume ?? 0}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
        {clip.overlay}
      </Sequence>
    ))}
  </AbsoluteFill>
);

type CameraFreezeClipProps = {
  file: string;
  freezeAtFrame: number;
  zoomFrames: number;
  zoomScale?: number;
  transformOrigin?: string;
  volume?: number;
};

// Render this component inside a Sequence so video time starts at the shot's first frame.
const CameraFreezeClip: FC<CameraFreezeClipProps> = ({
  file,
  freezeAtFrame,
  zoomFrames,
  zoomScale = 1.14,
  transformOrigin = "50% 50%",
  volume = 0,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(
    frame,
    [freezeAtFrame, freezeAtFrame + zoomFrames],
    [1, zoomScale],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const video = <OffthreadVideo src={staticFile(file)} volume={volume} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin }}>
        {frame >= freezeAtFrame ? <Freeze frame={freezeAtFrame}>{video}</Freeze> : video}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type TimedCameraFreezeRecordingProps = CameraFreezeClipProps & {
  from: number;
  durationInFrames: number;
};

export const TimedCameraFreezeRecording: FC<TimedCameraFreezeRecordingProps> = ({ from, durationInFrames, ...clip }) => (
  <Sequence from={from} durationInFrames={durationInFrames}>
    <CameraFreezeClip {...clip} />
  </Sequence>
);
