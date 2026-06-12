import {Composition} from 'remotion';
import {CodeWalkthrough} from './CodeWalkthrough';
import {FPS, TOTAL_FRAMES} from './data/audioTimeline';

export const Root = () => {
  return (
    <Composition
      id="code-walkthrough"
      component={CodeWalkthrough}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
