import Editor, {loader, type OnMount} from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import {useEffect, useMemo, useRef, useState} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {findSegmentForFrame, FPS, TOTAL_SECONDS, VOICEOVER_FILE} from './data/audioTimeline';
import {lessonCodeStates, lessonFiles, type FocusRange} from './data/lesson';
import {findNarrationCue} from './data/narrationTruth';
import {findSubtitleSegment} from './data/subtitleTruth';

type MonacoEditor = Parameters<OnMount>[0];
type Monaco = Parameters<OnMount>[1];

loader.config({monaco});

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const typedLength = (frame: number, start: number, end: number, total: number) => {
  const progress = clamp((frame - start) / Math.max(end - start, 1), 0, 1);
  const eased = 1 - Math.pow(1 - progress, 2.2);
  return Math.floor(eased * total);
};

type ActiveFocus = {
  focusRange: FocusRange;
  highlightLines: number[];
  startFrame: number;
};

const BASE_FONT_SIZE = 24;
const BASE_LINE_HEIGHT = 34;
const DEFAULT_CAMERA_LINES = 18;
const MAX_CAMERA_LINES = 24;
const CAMERA_STEP_LINES = 6;

const getFocusLineCount = (range: FocusRange) => {
  return range.endLine - range.startLine + 1;
};

const getStableCameraRange = (focusRange: FocusRange, totalLines: number): FocusRange => {
  const focusLineCount = getFocusLineCount(focusRange);
  const cameraLineCount =
    focusLineCount > DEFAULT_CAMERA_LINES
      ? Math.min(focusLineCount + 4, MAX_CAMERA_LINES)
      : DEFAULT_CAMERA_LINES;
  const focusCenter = (focusRange.startLine + focusRange.endLine) / 2;
  const unclampedTop = Math.round(focusCenter - cameraLineCount / 2);
  const maxTop = Math.max(1, totalLines - cameraLineCount + 1);
  const chunkedTop =
    focusLineCount > DEFAULT_CAMERA_LINES
      ? unclampedTop
      : 1 + Math.floor(Math.max(0, unclampedTop - 1) / CAMERA_STEP_LINES) * CAMERA_STEP_LINES;
  const topLine = clamp(chunkedTop, 1, maxTop);
  return {
    startLine: topLine,
    endLine: Math.min(totalLines, topLine + cameraLineCount - 1),
  };
};

const getEditorMetrics = (cameraRange: FocusRange) => {
  const lineCount = getFocusLineCount(cameraRange);
  const density = clamp(DEFAULT_CAMERA_LINES / lineCount, 0.78, 1);
  return {
    fontSize: Math.max(18, Math.round(BASE_FONT_SIZE * density)),
    lineHeight: Math.max(26, Math.round(BASE_LINE_HEIGHT * density)),
  };
};

const getCursorPosition = (codeBeforeCursor: string) => {
  const lines = codeBeforeCursor.split('\n');
  return {
    lineNumber: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
};

const FileIcon = () => (
  <svg className="tree-icon file-svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 3.75h7.15L19 8.6v11.65H7z" />
    <path d="M14 3.75V9h5" />
  </svg>
);

const FolderIcon = () => (
  <svg className="tree-icon folder-svg" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.75 6.5h6.15l1.8 2.2h8.55v10.8H3.75z" />
  </svg>
);

export const CodeWalkthrough = () => {
  const frame = useCurrentFrame();
  const previousFrame = Math.max(frame - 1, 0);
  const currentSegment = useMemo(() => findSegmentForFrame(frame), [frame]);
  const currentCue = useMemo(() => findNarrationCue(frame), [frame]);
  const previousCue = useMemo(() => findNarrationCue(previousFrame), [previousFrame]);
  const subtitleSegment = useMemo(
    () => findSubtitleSegment(currentSegment?.id),
    [currentSegment?.id]
  );
  const subtitleMeta = subtitleSegment
    ? `${subtitleSegment.start.toFixed(2)}s - ${subtitleSegment.end.toFixed(2)}s`
    : '';
  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const [editorReady, setEditorReady] = useState(false);

  const frameCode = useMemo(() => {
    const file =
      lessonFiles.find((candidate) => candidate.path === currentCue.activeFile) ??
      lessonFiles[0];
    const code = lessonCodeStates[currentCue.codeState];
    return {
      code,
      typedCode: code,
      file,
    };
  }, [currentCue]);
  const activeFile = frameCode.file;
  const totalCodeLines = useMemo(() => frameCode.code.split('\n').length, [frameCode.code]);
  const currentSeconds = frame / FPS;
  const progressPercent = Math.min((currentSeconds / TOTAL_SECONDS) * 100, 100);
  const currentFocus = useMemo(
    () => ({
      focusRange: currentCue.focusRange,
      highlightLines: currentCue.highlightLines,
      startFrame: currentCue.start,
    }),
    [currentCue]
  );
  const previousFocus = useMemo(
    () => ({
      focusRange: previousCue.focusRange,
      highlightLines: previousCue.highlightLines,
      startFrame: previousCue.start,
    }),
    [previousCue]
  );
  const currentCameraRange = useMemo(
    () => getStableCameraRange(currentCue.focusRange, totalCodeLines),
    [currentCue.focusRange, totalCodeLines]
  );
  const previousCameraRange = useMemo(
    () => getStableCameraRange(previousCue.focusRange, totalCodeLines),
    [previousCue.focusRange, totalCodeLines]
  );

  const cameraProgress = interpolate(frame - currentFocus.startFrame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const easedCameraProgress = 1 - Math.pow(1 - cameraProgress, 3);
  const previousMetrics = getEditorMetrics(previousCameraRange);
  const currentMetrics = getEditorMetrics(currentCameraRange);
  const editorFontSize = interpolate(
    easedCameraProgress,
    [0, 1],
    [previousMetrics.fontSize, currentMetrics.fontSize]
  );
  const editorLineHeight = interpolate(
    easedCameraProgress,
    [0, 1],
    [previousMetrics.lineHeight, currentMetrics.lineHeight]
  );

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monacoApi = monacoRef.current;
    if (!editor || !monacoApi || !editorReady) {
      return;
    }

    const focusLines = new Set<number>();
    const decorations = [];

    for (
      let lineNumber = currentFocus.focusRange.startLine;
      lineNumber <= currentFocus.focusRange.endLine;
      lineNumber += 1
    ) {
      focusLines.add(lineNumber);
      const classNames = ['focus-block-line'];
      if (lineNumber === currentFocus.focusRange.startLine) {
        classNames.push('focus-block-start');
      }
      if (lineNumber === currentFocus.focusRange.endLine) {
        classNames.push('focus-block-end');
      }

      decorations.push({
        range: new monacoApi.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: classNames.join(' '),
        },
      });
    }

    currentFocus.highlightLines.forEach((lineNumber) => {
      if (focusLines.has(lineNumber)) {
        return;
      }

      decorations.push({
        range: new monacoApi.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'line-accent',
        },
      });
    });

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      decorations
    );

    editor.updateOptions({
      fontSize: editorFontSize,
      lineHeight: editorLineHeight,
    });
    editor.layout();

    const viewportHeight = editor.getLayoutInfo().height;
    const getScrollTopForRange = (
      range: {startLine: number; endLine: number},
      lineHeight: number
    ) => {
      const visibleLines = Math.max(8, Math.floor(viewportHeight / lineHeight) - 1);
      const focusLineCount = range.endLine - range.startLine + 1;
      const blockCenter = range.startLine + focusLineCount / 2;
      const topLine = Math.max(1, blockCenter - visibleLines / 2);
      return Math.max(0, (topLine - 1) * lineHeight);
    };

    const fromScrollTop = getScrollTopForRange(
      previousCameraRange,
      previousMetrics.lineHeight
    );
    const toScrollTop = getScrollTopForRange(
      currentCameraRange,
      currentMetrics.lineHeight
    );
    editor.setScrollTop(
      fromScrollTop + (toScrollTop - fromScrollTop) * easedCameraProgress
    );

    editor.setPosition(getCursorPosition(frameCode.typedCode));
  }, [
    activeFile.path,
    currentCameraRange,
    currentFocus,
    currentMetrics.lineHeight,
    currentMetrics.fontSize,
    editorReady,
    editorFontSize,
    editorLineHeight,
    frameCode.typedCode,
    previousCameraRange,
    previousFocus,
    previousMetrics.lineHeight,
    previousMetrics.fontSize,
    easedCameraProgress,
  ]);

  return (
    <AbsoluteFill className="stage">
      <Audio src={staticFile(VOICEOVER_FILE)} />
      <div className="window">
        <div className="timeline-strip">
          <div className="timeline-progress" style={{width: `${progressPercent}%`}} />
        </div>
        <header className="menubar">
          <div className="menu-item">File</div>
          <div className="menu-item">Edit</div>
          <div className="menu-item">View</div>
          <div className="menu-item">Help</div>
          <div className="status-pill">{currentCue.title}</div>
        </header>

        <div className="workspace">
          <aside className="sidebar">
            <div className="project-row">
              <span className="chevron">v</span>
              <span className="project-name">EPISODE05_CORNER_PERSPECTI...</span>
              <span className="refresh">*</span>
            </div>
            <div className="folder-row">
              <span className="chevron">&gt;</span>
              <FolderIcon />
              <span>__pycache__</span>
            </div>
            {lessonFiles.map((file) => (
              <div
                className={`file ${file.path === activeFile.path ? 'active' : ''}`}
                key={file.path}
              >
                <FileIcon />
                {file.path}
              </div>
            ))}
          </aside>

          <main className="editor-shell">
            <div className="tabbar">
              <div className="tab">
                <FileIcon />
                app.yaml
              </div>
              <div className="tab active">
                <FileIcon />
                {activeFile.path}
                <span className="close">x</span>
              </div>
            </div>
            <div className="editor-frame">
              <div
                className="editor-camera"
              >
                <Editor
                  height="100%"
                  language={activeFile.language}
                  value={frameCode.code}
                  theme="vs-dark"
                  onMount={onMount}
                  options={{
                    contextmenu: false,
                    cursorBlinking: 'solid',
                    cursorSmoothCaretAnimation: 'on',
                    fontFamily: "'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
                    fontLigatures: true,
                    fontSize: BASE_FONT_SIZE,
                    glyphMargin: false,
                    lineHeight: BASE_LINE_HEIGHT,
                    lineNumbers: 'on',
                    minimap: {enabled: false},
                    padding: {top: 18, bottom: 28},
                    readOnly: true,
                    renderLineHighlight: 'none',
                    scrollBeyondLastLine: false,
                    scrollbar: {
                      vertical: 'visible',
                      horizontal: 'auto',
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                    },
                    smoothScrolling: true,
                    wordWrap: 'off',
                  }}
                />
              </div>
            </div>
          </main>
        </div>
        <div className="subtitle-bar">
          <div className="subtitle-label">Narration</div>
          <div className="subtitle-text">{subtitleSegment?.text ?? ''}</div>
          <div className="subtitle-meta">{subtitleMeta}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
