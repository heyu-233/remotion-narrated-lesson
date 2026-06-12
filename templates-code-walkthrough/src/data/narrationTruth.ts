import {segmentRangeFrames, type SegmentRange} from './audioTimeline';
import {type FocusRange} from './lesson';
import {type CodeStateKey} from './types';

export type NarrationCue = {
  id: string;
  title: string;
  text: string;
  segmentRange: SegmentRange;
  codeState: CodeStateKey;
  activeFile: string;
  highlightLines: number[];
  focusRange: FocusRange;
  zoom?: number;
  start: number;
  end: number;
};

const rawNarrationCues: Omit<NarrationCue, 'start' | 'end'>[] = [
  {
    id: 'opening-problem',
    title: '当前问题',
    text: '先说明当前这段代码还是有点臃肿。',
    segmentRange: {segStart: 1, segEnd: 1},
    codeState: 'monolithicPipeline',
    activeFile: 'pipeline.py',
    highlightLines: [1, 2, 3, 5, 12, 13, 14, 15],
    focusRange: {startLine: 1, endLine: 18},
  },
  {
    id: 'entry-main',
    title: '入口文件',
    text: '入口文件 main.py 通常还是很轻，只负责调用主流程。',
    segmentRange: {segStart: 2, segEnd: 2},
    codeState: 'mainPy',
    activeFile: 'main.py',
    highlightLines: [1, 4],
    focusRange: {startLine: 1, endLine: 4},
  },
  {
    id: 'extract-helper',
    title: '抽出检测函数',
    text: '接着把检测逻辑抽成一个独立函数。',
    segmentRange: {segStart: 3, segEnd: 3},
    codeState: 'extractedDetector',
    activeFile: 'pipeline.py',
    highlightLines: [1, 2, 4, 10, 18],
    focusRange: {startLine: 1, endLine: 18},
  },
  {
    id: 'normalize-points',
    title: '补一层规范化',
    text: '然后增加点位规范化步骤，让后续处理更稳定。',
    segmentRange: {segStart: 4, segEnd: 4},
    codeState: 'normalizedPipeline',
    activeFile: 'pipeline.py',
    highlightLines: [13, 14, 15, 24, 25],
    focusRange: {startLine: 13, endLine: 25},
  },
  {
    id: 'run-loop-light',
    title: '主循环变轻',
    text: '这时候主循环就只剩读图、调用和画结果。',
    segmentRange: {segStart: 5, segEnd: 5},
    codeState: 'normalizedPipeline',
    activeFile: 'pipeline.py',
    highlightLines: [18, 19, 20, 22, 23, 24, 25, 26],
    focusRange: {startLine: 18, endLine: 26},
  },
  {
    id: 'final-lines',
    title: '逐行解释',
    text: '后面可以逐行讲最后整合后的关键代码。',
    segmentRange: {segStart: 6, segEnd: 6},
    codeState: 'finalPipeline',
    activeFile: 'pipeline.py',
    highlightLines: [26, 27, 28, 29, 30, 31, 32, 34],
    focusRange: {startLine: 26, endLine: 34},
  },
  {
    id: 'stable-camera',
    title: '镜头稳定',
    text: '这里可以看到高亮在变化，但镜头应尽量保持稳定。',
    segmentRange: {segStart: 7, segEnd: 7},
    codeState: 'finalPipeline',
    activeFile: 'pipeline.py',
    highlightLines: [27],
    focusRange: {startLine: 26, endLine: 34},
  },
  {
    id: 'outro',
    title: '收尾',
    text: '最后收尾，并把话题引到下一步开发。',
    segmentRange: {segStart: 8, segEnd: 8},
    codeState: 'finalPipeline',
    activeFile: 'pipeline.py',
    highlightLines: [13, 18, 26, 34],
    focusRange: {startLine: 1, endLine: 34},
  },
];

export const narrationCues: NarrationCue[] = rawNarrationCues.map((cue) => {
  const frames = segmentRangeFrames(cue.segmentRange);
  return {
    ...cue,
    start: frames.start,
    end: frames.end,
  };
});

export const findNarrationCue = (frame: number) => {
  const activeCue = narrationCues.find((cue) => frame >= cue.start && frame < cue.end);
  if (activeCue) {
    return activeCue;
  }

  const previousCue = [...narrationCues]
    .reverse()
    .find((cue) => frame >= cue.start);
  return previousCue ?? narrationCues[0];
};
