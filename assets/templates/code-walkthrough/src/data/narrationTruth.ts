import {type FocusRange} from './lesson';
import {type CodeStateKey} from './types';
import {anchorEnd, anchorStart} from './timeline';

export type NarrationCue = {
  id: string; title: string; text: string; fromAnchor: string; toAnchor: string;
  codeState: CodeStateKey; activeFile: string; highlightLines: number[]; focusRange: FocusRange;
  start: number; end: number;
};

const definitions: Omit<NarrationCue, 'start' | 'end'>[] = [
  {id: 'opening', title: 'Opening', text: 'Replace with narration cue text.', fromAnchor: 'lesson.hook', toAnchor: 'lesson.hook', codeState: 'monolithicPipeline', activeFile: 'pipeline.py', highlightLines: [1], focusRange: {startLine: 1, endLine: 8}},
];

export const narrationCues = definitions.map((cue) => ({...cue, start: Math.floor(anchorStart(cue.fromAnchor) * 30), end: Math.ceil(anchorEnd(cue.toAnchor) * 30)}));

export const findNarrationCue = (frame: number) => narrationCues.find((cue) => frame >= cue.start && frame < cue.end) ?? null;
