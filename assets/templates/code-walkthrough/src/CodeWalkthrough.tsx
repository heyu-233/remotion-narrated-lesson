import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, TOTAL_SECONDS, VOICEOVER_FILE} from './data/audioTimeline';
import {lessonCodeStates, lessonFiles} from './data/lesson';
import {findNarrationCue} from './data/narrationTruth';

const lineStyle = (active: boolean, focused: boolean) => ({
  background: focused ? 'rgba(69, 190, 255, .12)' : active ? 'rgba(255, 193, 84, .14)' : 'transparent',
  borderLeft: `3px solid ${active ? '#ffc154' : focused ? '#45beff' : 'transparent'}`,
  color: active ? '#fff' : '#c9d6e8', minHeight: 30, paddingLeft: 12, whiteSpace: 'pre',
});

export const CodeWalkthrough = () => {
  const frame = useCurrentFrame();
  const cue = findNarrationCue(frame);
  if (!cue) return null;
  const file = lessonFiles.find((candidate) => candidate.path === cue.activeFile) ?? lessonFiles[0];
  const code = lessonCodeStates[cue.codeState].split('\n');
  const percent = Math.min(100, (frame / FPS / TOTAL_SECONDS) * 100);
  return <AbsoluteFill className="stage">
    <Audio src={staticFile(VOICEOVER_FILE)} />
    <div className="window">
      <div className="timeline-strip"><div className="timeline-progress" style={{width: `${percent}%`}} /></div>
      <header className="menubar"><span className="menu-item">CODE WALKTHROUGH</span><span className="status-pill">{cue.title}</span></header>
      <div className="workspace">
        <aside className="sidebar">{lessonFiles.map((item) => <div className={`file ${item.path === file.path ? 'active' : ''}`} key={item.path}>{item.path}</div>)}</aside>
        <main className="editor-shell"><div className="tabbar"><div className="tab active">{file.path}</div></div><div className="editor-frame"><div className="static-code">
          {code.map((line, index) => { const number = index + 1; return <div key={number} style={lineStyle(cue.highlightLines.includes(number), number >= cue.focusRange.startLine && number <= cue.focusRange.endLine)}><span className="line-number">{number}</span>{line || ' '}</div>; })}
        </div></div></main>
      </div>
      <div className="subtitle-bar"><div className="subtitle-label">Narration</div><div className="subtitle-text">{cue.text}</div></div>
    </div>
  </AbsoluteFill>;
};
