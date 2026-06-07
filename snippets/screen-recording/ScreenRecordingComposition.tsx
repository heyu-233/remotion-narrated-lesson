import type { FC, ReactNode } from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from "remotion";

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
