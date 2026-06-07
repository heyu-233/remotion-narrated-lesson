import { Composition } from "remotion";
import { Lesson } from "./Composition";
import { TOTAL_FRAMES, FPS } from "./timings";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Lesson"
        component={Lesson}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
