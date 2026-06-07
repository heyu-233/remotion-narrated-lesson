---
name: remotion-narrated-lesson
description: |
  把"用户预先写好的口播稿 + 用户预先录好的旁白录音"做成一支带动画的类 PPT 教学视频，工程基于 Remotion，时间线由 whisper 转写出的 segment 时间戳驱动。专门服务于"录音先行、动画后做、动画必须严格对齐录音"的工作流，适用于编程、系统、数据库、AI、嵌入式等计算机类教学视频。
  触发词：
  - "做计算机教学视频"、"做编程视频"、"做教学视频"、"基于口播稿做视频"
  - "对齐录音 / 对齐时间戳 / 对齐 whisper"
  - "Remotion 教学视频"、"类 PPT 视频"
  - "/remotion-narrated-lesson"
  典型输入：script.md（口播稿） + voiceover.m4a/mp3（用户录的旁白）
  典型输出：可 `npm run dev` 预览、`npm run build` 渲染的 Remotion 项目
---

# Remotion Narrated Lesson

把口播稿和旁白录音变成"看起来不像 PPT 但本质是 PPT"的教学视频。**录音是真理来源，动画追随录音**。

适用：编程、系统、数据库、AI、嵌入式等计算机类中文教程视频，5–10 分钟一集，1920×1080@30fps，B 站/视频号/YouTube 录屏发布。

## 当前工作流的根设计

> **一句话**：Whisper 转写出的 segment 是唯一时间真理，所有动画时间锚点都用 `segmentRangeStart(id)` / `segmentRangeEnd(id)` 绑定到 segment id，**不允许写死秒数**。
>
> **后果**：重新录音、重跑 whisper 后，整片动画自动重新对齐到新时间戳，无需手工改秒数。**前提**：script 结构不变，segment id 编号保持稳定。

输入输出一图：

```
script.md  ─┐                                   ┌─> Composition.tsx
            │                                   │   ├─ Chapter1.tsx (FC<{seconds}>)
voiceover ──┼──> faster-whisper ──> transcript ─┤   ├─ Chapter2.tsx
.m4a/.mp3   │       │   │             .json     │   ├─ ...
            │       └─> SRT/VTT 备查            │   └─ Chapter8.tsx
outline.md ─┘                                   ├─> shared.tsx (palette/fadeIn/CodeBlock)
                                                ├─> transcript.ts (SEGMENTS, segmentRangeStart)
                                                ├─> timings.ts (TOTAL_FRAMES, SUBTITLES)
                                                └─> Root.tsx
```

## 协作铁律（先看这条）

> **永远不要替用户揣测视觉效果**。
>
> 用户提供的输入永远只有两样：`script.md`（口播稿） 和 `voiceover.*`（录音）。这两份东西**不包含**对画面的指示。"这一段该用代码窗 + 行高亮"还是"该画一张时序图"是**用户的审美决策**，不是 AI 的推理任务。
>
> 因此任何章节在动手写 `ChapterN.tsx` 之前，必须先做"章节视觉访谈"（见 Step 7.0），用 `AskUserQuestion` 明确问清楚这一章想要什么效果。不要为了"高效"跳过访谈。**用户的反馈成本远低于推倒重做的成本**。
>
> 同理，整片开头如果要做 Stage 0 / 开篇小动画，也必须先做一次更轻量的"开篇动画访谈"（见 Step 6）。它不一定复杂，但必须由用户确认冲击力方向。

## 启动一支新视频的固定步骤

跟着这 8 步走，每步都不要跳。前 3 步在和用户对齐，第 4 步是技术拐点，5–8 步是迭代。

### Step 1 — 摸清输入

读用户给的 `script.md`，确认：
- 是否已经定稿（如果还在改，等定稿再开工，否则 segment id 锚点会作废）
- 是否已经录音（路径、格式、时长）
- 上一支同类型视频是否存在可参考工程（计算机教学视频高度相似，**强烈建议先 read 上一支项目的 `shared.tsx` / `Composition.tsx` / 一个 Chapter 的实现**，再开始本支）

### Step 2 — 写 outline（一次产出，一次对齐）

参照 [`web-video-presentation`](../web-video-presentation/SKILL.md) 的"5 件事一次对齐"思路，但本 skill 多出来的是录音约束。一次产出 `outline.md`，包含：

- **章节切分**：按口播叙事拐点切，每章 30–80 秒。**章节边界必须落在 script 的段落分隔处**，因为 segment id 只在段落级有意义。
- 每章的"信息池"和"step 列表"（每个 step 大致几秒、要传达什么）
- 每章的素材清单
- **不在 outline 里规划具体动画**，动画在每章开发时即兴设计（继承 web-video-presentation 的 outline-vs-animation 分工原则）

然后**一次性**和用户对齐这 5 件事（注意：**这一轮只问全局方向，不问每章具体画面**——具体画面留到 Step 6.0 每章动手前再问）：
1. outline 的章节划分对不对
2. script 是否需要微调（在录音之前的最后窗口）
3. 主题色 / 字体 / 整体气质（暗色 vs 亮色，参考上一支项目）
4. 视觉模板池：从下方"计算机教学视觉模板库"里**整片大概会用到哪些**（圈池子，不绑定到具体章节）
5. 章节并行 vs 顺序开发

> 边界提醒：Step 2 不要替用户决定"第 3 章用代码窗、第 5 章用时序图"。那是 Step 6.0 的事。这一轮只确认"整片大方向上认可这些视觉手段"。

### Step 3 — 录音

用户自录。skill 不介入这步。等用户拿到 `.m4a` / `.mp3` / `.wav` 后进入下一步。

### Step 4 — Whisper 强制对齐（关键拐点）

这是整条流水线的命门。生成 `transcript.json`，里面要有 `duration` 和带 `id/start/end/text` 的 `segments` 数组。

推荐用 `faster-whisper`（CTranslate2 后端，Windows 友好，比 openai-whisper 快 4×）：

```bash
# 安装（一次性）
pip install faster-whisper

# 转写脚本（写成 transcribe.py 放在项目根）
python -c "
from faster_whisper import WhisperModel
import json
model = WhisperModel('large-v3', device='cuda', compute_type='float16')  # 或 cpu/int8
segments, info = model.transcribe('public/audio/voiceover.m4a', language='zh', vad_filter=True)
data = {
  'language': info.language,
  'language_probability': info.language_probability,
  'duration': info.duration,
  'segments': [
    {'id': i+1, 'start': s.start, 'end': s.end, 'text': s.text, 'words': []}
    for i, s in enumerate(segments)
  ],
}
json.dump(data, open('public/audio/transcript.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
"
```

输出 JSON 格式必须长这样（和 `templates/src/transcript.ts` 配套）：

```json
{
  "language": "zh",
  "language_probability": 1.0,
  "duration": 424.4053125,
  "segments": [
    { "id": 1, "start": 0.08, "end": 1.68, "text": "...", "words": [] },
    { "id": 2, "start": 1.68, "end": 5.08, "text": "...", "words": [] }
  ]
}
```

**对齐质量校验**（必做，否则后面动画全错）：
- 抽查 5–10 个 segment：手听一下录音对应位置，看 text 和 start/end 是否吻合
- 中文容易把句子断错。如果断点不理想，调高 `vad_filter=True` 的 `vad_parameters={'min_silence_duration_ms': 500}` 或换 `language='zh'` 显式指定
- 如果某些专有名词（"head"、"tail"、"FIFO"）被听成中文谐音，记下来，后面手工修 transcript.json 即可（id/start/end 不动，只改 text）

### Step 5 — 搭工程骨架

直接复制 `templates/` 整个目录到目标项目。结构：

```
presentation/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── public/
│   └── audio/
│       ├── voiceover.m4a       (用户的录音, 名字写进 timings.ts 的 VOICEOVER_FILE)
│       └── transcript.json     (whisper 产出)
└── src/
    ├── Root.tsx                (注册 Composition)
    ├── Composition.tsx         (顶层调度: 渲染当前章节 + Audio + 字幕条)
    ├── shared.tsx              (palette/fonts/ease/fadeIn/fadeWindow/CodeBlock)
    ├── transcript.ts           (导入 transcript.json, 暴露 SEGMENTS / segmentRangeStart / CHAPTERS)
    ├── timings.ts              (FPS, TOTAL_FRAMES, SUBTITLE_SEGMENTS)
    └── Chapter1.tsx ... Chapter8.tsx
```

然后：

```bash
cd presentation && npm install && npm run dev
```

### Step 6 — 开篇小动画 / Stage 0（先轻访谈，再实现）

开篇前 5–8 秒决定完播率，默认要考虑做一个有冲击力的开篇小动画。它可以叫 Stage 0、Cold Open、Hook Overlay，但**不要默认单独占用时长**：优先让它覆盖 / 替换第一章开头原本较静止的几秒，并和已有 voiceover / transcript 的前几句对齐。除非用户明确要求"先静默几秒再进正片"，否则不要延后音频、不要增加 `TOTAL_FRAMES`、不要要求重录。

#### Step 7.0 — 开篇动画访谈（轻量但必做）

动手做开篇动画前，必须用 `AskUserQuestion` 单独问用户想要哪种冲击力方向。这个访谈比章节访谈轻，只问 2–3 个问题即可：

1. **「开篇钩子是什么感觉」**（header: 开篇）
   给 3 个候选方向，例如：
   - 大字冲击 / 标题砸入（适合概念强、问题明确的开场）
   - bug / glitch / 红光报警（适合从错误现象切入）
   - 快速结构图 / 箭头汇聚（适合先建立问题框架）

2. **「是否占用额外时长」**（header: 时间）
   - 覆盖原开头（推荐）：和前几句口播同步，不增加总时长
   - 独立冷开场：先静默或少字幕播放几秒，再进入录音；只有用户明确选这个才改总时长

3. **「有没有特别想出现的元素」**（header: 元素）
   提供 2–3 个和开头脚本相关的元素，例如代码窗、终端输出、共享变量、时序箭头、错误结果，也允许用户选 Other 自填。

#### Step 7.1 — 实现原则

- 开篇小动画不必复杂，关键是前几秒有明显动态：大字 pop-in、镜头推进、glitch、代码 / 输出 mismatch、红光闪、箭头快速汇聚、卡片撞入都可以。
- 动画内容必须贴合 `script.md` 和 transcript 前几条 segment，不要为了炫技做和口播无关的效果。
- 若采用覆盖式 Stage 0，推荐做成 `ColdOpen: FC<{seconds: number}>`，在 `Composition.tsx` 里用 `{seconds < COLDOPEN_SECONDS ? <ColdOpen seconds={seconds} /> : null}` 叠在 Chapter1 上方；`Audio` 和 `SubtitleBar` 仍从 0 秒正常播放。
- 字幕条应保持可见，开篇动画不能挡住用户理解口播。

### Step 7 — 章节开发（每章先访谈，再写码）

每章一个文件，导出 `ChapterN: FC<{seconds: number}>` 和 `CHAPTERN_END` 常量。**章节内不再调用 `useCurrentFrame`**，`seconds` 由 `Composition.tsx` 顶层算好后透传。

每章按 7.0 → 7.5 顺序走，**7.0 永远不能跳**。

#### Step 7.0 — 章节视觉访谈（动手前的强制步骤）

进入章节实现前，先用 `AskUserQuestion` 工具问用户这一章想要什么效果。**不允许靠"看 script 推测"开始写**。访谈要在**每一章开发前都重新做一次**，因为不同章节的视觉策略往往不同（一章可能是代码讲解为主，下一章可能是时序图为主）。

每次访谈固定问下面 4 个问题（一次性发 4 个 questions，不要拆成 4 轮）：

1. **「核心画面是什么」**（header: 主视觉）
   选项基于"计算机教学视觉模板库"列出 3 个最契合本章 script 内容的候选，例如：
   - 代码窗 + 行高亮（讲代码细节为主）
   - 状态/数据结构动画（讲机制流转为主）
   - 时序图 / 时间轴（讲时间先后为主）
   每个选项都要给一句话描述，让用户秒懂。

2. **「和上一章的关系」**（header: 视觉连贯）
   - 强延续（沿用相同舞台/主元素，做平滑过渡）
   - 过场后重启（黑场或镜头拉远，开新场景）
   - 半延续（保留主舞台但换聚焦区）

3. **「节奏偏好」**（header: 节奏）
   - 紧凑（每个 segment 都换画面，信息密度高）
   - 留白（关键句停顿数秒，让画面呼吸）
   - 戏剧化（某个 beat 上做大动作 / 爆炸 / 镜头剧烈推拉）

4. **「有没有这一章特别的画面想法」**（header: 自由发挥, multiSelect: false, 但通过 "Other" 让用户自由输入）
   提供 2-3 个该章 script 里能联想到的具体画面，最后用户多半会选 "Other" 自填。

**访谈记录归档**：把用户的回答以注释形式写到该 Chapter 文件最顶部：

```tsx
// === Chapter 3 Visual Interview ===
// 主视觉: 代码窗 + 行高亮（重点讲 ring buffer 的取模操作）
// 视觉连贯: 半延续 — 保留队列板，但聚焦移到 head 指针
// 节奏: 留白 — "为什么 head==tail 不能区分空和满" 这句要静止 2s 让用户消化
// 特别想法: 用户希望在判满时给空位画一个红色"禁止"标记
```

这段注释之后所有的实现都按它来。**如果开发到一半发现访谈没覆盖某个决策，停下来再问，不要自作主张**。

#### Step 7.1 — 通读这一章的 transcript

打开 `transcript.json`，看本章 segment id 区间内每条的 text 和 start/end。不要只看 script.md，因为 whisper 出来的断句和 script 的段落断点**不一定一致**，对动画来说真理是 transcript。

#### Step 7.2 — 把 outline 的 step 映射到 segment id

例如 outline 写"step 14 (~18s) - 从初始空队列开始，连续写入三个事件"，到 transcript 里找对应的 segment 区间（比如 id 45–48），把这个映射写到章节文件顶部：

```tsx
// step 14: 入队动画起点  → seg 45 ~ 48 (152.08s ~ 167.78s)
// step 15: 反推空队列条件 → seg 49 ~ 52 (167.78s ~ 188.48s)
```

#### Step 7.3 — 用 shared.tsx 原子件搭骨架

先用 `Heading` / `CodeBlock` / `ChapterBackground` 把每个 step 的"占位画面"摆好，时间锚点用 `segmentRangeStart(id)`。能跑能预览了再做下一步。

#### Step 7.4 — 加场景特化可视化

按 6.0 访谈结论，实现专属的可视化（代码窗、终端窗、流程图、队列板、寄存器位图、时序图、栈帧、录屏标注……）。如果是"计算机教学视觉模板库"里已有的模板，**先去 read 上一支同类型视频里的实现**，再决定是直接复制改改还是重写。第二次复用时再考虑上提到 shared.tsx。

#### Step 7.5 — 预览抽检

`npm run dev` 拖时间轴，跳到每个 segment 边界看画面切换是否合理：

- 每个 segment 必须产生**可见**画面变化（颜色变 / 高亮变 / 元素进出 / 镜头平移）—— **节拍法则**，从 `web-video-presentation` 继承
- 没有变化的 segment 必须合并或被吸收进相邻动画里
- 别让屏幕"空转 3 秒等下一句口播"
- 关键拐点（章节开头、戏剧化 beat、章节结尾）截图发给用户确认

#### 时间锚点写法（强制）

章节内部时间锚点 **只能** 是这种写法：

```tsx
const T_TITLE_IN   = segmentRangeStart(1);   // ← segment id, 不是秒
const T_DUMP_BEGIN = segmentRangeStart(9);
const T_BOX_BREAK  = 30.5;                   // ← 个别峰值动画允许写死, 但要靠近 segment 边界
const T_AFTERMATH  = segmentRangeStart(12);
const T_END        = segmentRangeEnd(13);
```

### Step 8 — 渲染 & 出片

```bash
npm run build                                    # 输出 out/EventQueueEpisode.mp4
# 或:
npx remotion render EventQueueEpisode out/lesson.mp4
```

如果 `npm run build` 跑的是 `remotion bundle`（仅打包不渲染），改 `package.json`：
```json
"build": "remotion render EventQueueEpisode out/lesson.mp4"
```

## Remotion 代码规则（强制）

Remotion 不是普通交互式 React 应用，而是逐帧渲染视频。所有组件都必须遵守确定性原则：同一个 frame / props 输入，必须得到同一张画面。

- **动画由 frame/seconds 驱动**：使用 `useCurrentFrame()`、顶层传入的 `seconds`、`interpolate()`、`spring()` 或封装后的 `snippets/effects/*`。
- **不要用 CSS transition**：`transition: "all 0.2s"` 依赖浏览器时间流，跳帧/seek/离线渲染时不可靠。
- **不要用 `useEffect` 做动画**：不要用定时器、订阅、DOM 生命周期推进画面状态；动画状态应能从当前 frame 直接算出来。
- **不要用 `Math.random()`**：需要随机感时，用 Remotion 的 `random(seed)` 或项目内确定性 `rand(seed)`，seed 必须稳定。
- **不要写交互逻辑**：Remotion 组件不处理点击、hover、输入框、拖拽；如果需要展示交互，只把交互结果画出来。
- **素材用 Remotion 组件承载**：本地静态资源走 `staticFile()`；图片用 `Img`；录屏/视频素材优先用 `OffthreadVideo`；音频用 `Audio`。

## 录屏剪辑型视频支持

这个 skill 也可以服务“录屏 + 旁白 + 包装”的计算机教学视频，不只做类 PPT 动画。适合编程实操、IDE 演示、命令行教程、网页/工具使用教程。

常用 Remotion 组件：

- `OffthreadVideo`：导入录屏素材，支持 `startFrom` / `endAt` / `volume`，适合本地 `public/recordings/*.mp4`。
- `Audio`：导入旁白、音乐或系统声音，支持裁剪和音量控制。
- `Sequence`：把标题卡、局部放大、标注、字幕、录屏片段放到指定 frame 开始。
- `Series`：顺序拼接多个片段，比手写绝对 frame 更适合线性剪辑。
- `TransitionSeries`：给多个片段之间加 `fade` / `wipe` 等转场，适合章节切换或录屏段落切换。
- `AbsoluteFill`：叠加录屏、字幕、箭头、局部高亮、遮罩、标题条。

录屏剪辑的默认思路：

```tsx
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from "remotion";

export const ScreenRecordingComposition = () => (
  <AbsoluteFill style={{ background: "#050a14" }}>
    <OffthreadVideo src={staticFile("recordings/screen.mp4")} startFrom={90} endAt={1800} volume={0} />
    <Audio src={staticFile("audio/voiceover.m4a")} />
    <Sequence from={240} durationInFrames={120}>
      <div>这里强调关键操作</div>
    </Sequence>
  </AbsoluteFill>
);
```

后续遇到录屏型项目时，单独沉淀：
- `ScreenRecordingComposition`：录屏 + 旁白 + 字幕 + 标注的完整骨架。
- `ClipSequence`：声明式拼接多个录屏片段，统一处理 `startFrom` / `endAt` / `from` / `durationInFrames`。
- `ZoomCallout`：局部放大、鼠标附近聚焦、代码区域框选。
- `CursorHint`：鼠标位置提示、点击强调，但必须由 frame/seconds 驱动，不能依赖真实 DOM 事件。

## 三层时间体系

理解这个就理解了整套架构：

| 层 | 单位 | 用途 | 例 |
|---|---|---|---|
| Acts（幕） | 秒 | 顶层镜头/调色/标题切换 | `{ id: "problem", start: 0, end: 86.58 }` |
| Chapters（章） | segment id 区间 | 渲染哪个章节组件 | `{ id: 1, segStart: 1, segEnd: 13 }` |
| Beats（节拍） | segment id + 小偏移 | 章节内具体动画锚点 | `T_EXPLODE = segmentRangeStart(11) + 2.32` |

**Acts 用秒**是为了便于设计运镜节奏；**Chapters 用 segment id** 保证重对齐稳定；**Beats 用 segment id 派生**，必要时 `+ 偏移` 微调。

## shared.tsx 原子件清单

`templates/src/shared.tsx` 提供这些不要重写的工具：

- `palette` — 调色板（cyan/orange/violet/lime/red/amber/emerald/pink + bg/ink/text/soft/mute）
- `monoFont` / `displayFont` — 字体栈（HarmonyOS Sans SC + JetBrains Mono）
- `ease` / `easeOut` / `easeInOut` — 三种 Easing
- `fadeIn(seconds, start, dur=0.6)` — 单向淡入
- `fadeWindow(seconds, start, end, inDur, outDur)` — 进出窗口
- `popIn(seconds, start, dur=0.4)` — 带回弹的弹入
- `snippets/effects/remotionEffects.ts` — 可复制的 Remotion-native 动效函数，包含 `slideFade` / `softPop` / `typewriterLine` / `semanticPulse` / `revealProgress`
- `Heading` — 中央/左对齐的标题 + 副标题，带渐入位移
- `CodeBlock` — macOS 风格代码窗，支持逐行打字、行高亮区间 `CodeHighlight[]`
- `ChapterBackground` — 渐变 + 网格 + 高光，参 `hue: "warm"|"cool"|"neutral"`
- `clamp01` / `lerp` / `rand`（确定性伪随机）

复杂复用（队列板、源节点、状态机卡片、流线箭头）**不放进 shared.tsx**，留在各 Chapter 内或 `Composition.tsx`。第二支视频要复用时再上提。

## 计算机教学视觉模板库（按需挑选）

针对计算机类教学的常见画面，沉淀如下模板；嵌入式、中断、临界区只是其中一个专题方向：

| 模板 | 何时用 | 典型来源 / 适用专题 |
|---|---|---|
| **代码窗 + 行高亮** | 讲任何代码片段必用 | 通用编程 / Web / 系统 / 嵌入式 |
| **终端窗口 + 命令输出** | 讲 CLI、构建、测试、部署 | Linux / DevOps / 工具教程 |
| **录屏画面 + 标注层** | 讲 IDE、网页、工具实操 | 录屏剪辑型视频，配 `OffthreadVideo` |
| **流程图 / 状态机卡片** | 讲系统流程、协议、任务状态 | 操作系统 / 网络 / 后端 / 状态机 |
| **线性/环形槽位板** | 队列、缓冲区、数组、缓存 | 数据结构 / 嵌入式 / 并发 |
| **游标/指针气泡** | 任何"位置移动"概念 | head/tail、读写指针、文件偏移 |
| **数据流箭头** | 数据流、调用流、请求链路 | 网络 / 后端 / 编译器；必须有明确语义 |
| **内存布局** | 栈、堆、全局变量、对象布局 | C/C++ / OS / Runtime / 嵌入式 |
| **时序图 / 时间轴** | 讲时间先后、并发交错、请求生命周期 | 并发 / 网络 / 中断 / 分布式 |
| **顶部命令面板 / 时间码** | 整片框架感或演示环境提示 | 通用包装层 |
| **底部字幕条** | 永远开 | 通用包装层 |

**专题模板候选**：
- 嵌入式 / OS：寄存器位图、内存布局、时序图、栈帧、向量表。
- Web / 后端：请求链路、数据库查询、缓存命中、队列消费、服务拓扑。
- 数据库：B+ 树页结构、索引查找路径、事务时间线、锁等待图。
- AI / ML：张量形状流、模型层级、训练循环、数据管道。
- 工具 / 录屏：`ScreenRecordingComposition`、`ClipSequence`、局部放大、鼠标/命令标注。
- 通用代码讲解：代码 diff 高亮（before/after 同窗对比）、终端输出、错误堆栈定位。

做新视频遇到这些，**第一次实现写在该 Chapter 里，第二次复用时再上提到 shared.tsx**。两次原则避免过早抽象。

## 三支视频后的复用沉淀

三支 Remotion 教学视频之后，复用对象应分成两层：**同风格项目模板** 和 **可复制视觉片段**。不要把整章动画打包成固定模板，否则会和每集口播节奏、用户视觉访谈结果冲突。

推荐把 skill 内部长期维护成这种结构：

```text
remotion-narrated-lesson/
├── templates/          # 可直接复制的新项目骨架
├── snippets/           # 可按需复制的视觉组件片段
├── scripts/            # 转写、关键帧导出、渲染脚本
└── docs/               # workflow / commands / pitfalls / visual-principles
```

### 可复用模块分层

1. **项目骨架（稳定复用）**
   - `Root.tsx`：注册 Composition，保持 1920×1080@30fps。
   - `Composition.tsx`：统一挂载 `Audio`、字幕条、当前章节调度、开篇覆盖层。
   - `transcript.ts`：导入 `transcript.json`，暴露 `SEGMENTS` / `segmentRangeStart` / `segmentRangeEnd` / `CHAPTERS`。
   - `timings.ts`：由 transcript 派生 `TOTAL_FRAMES` 和 `SUBTITLE_SEGMENTS`。
   - `shared.tsx`：只放跨视频稳定原子件，避免塞入大型章节专属组件。

2. **同风格视觉原子（稳定复用）**
   - `palette`：暗色教学视频统一色板。
   - `monoFont` / `displayFont`：中文展示字体 + 等宽代码字体。
   - `fadeIn` / `fadeWindow` / `popIn`：Remotion frame-driven 动画工具。
   - `snippets/effects/remotionEffects.ts`：把常见网页动效改写成由 `seconds` 驱动的可复制函数，避免 CSS transition 和 DOM 生命周期依赖。
   - `ChapterBackground` / `Heading` / `CodeBlock` / `SubtitleBar`：几乎每支视频都会用。
   - `TitleCover`：当开篇没有明确戏剧钩子时，默认用克制标题封面，不强行做抽象小动画。

3. **教学视觉片段（按需复制，不急着上提）**
   - `StackFrame`：栈帧、push/pop、返回地址 / PC 高亮。
   - `SpPointer`：SP 指针必须指向当前有效栈顶，不能指空白区域。
   - `VectorTable`：中断号 → Handler 的查表过程。
   - `TimelineSteps`：保存现场 → 查表 → 跳转 ISR → 恢复现场这类顺序流程。
   - `RegisterFrame`：寄存器位图、自动压栈 8 个寄存器。
   - `MemoryLayout`：Flash / RAM / `.text` / `.data` / stack / heap 的布局。
   - `ScreenRecordingComposition` / `ClipSequence`：录屏剪辑型视频的骨架和片段拼接工具。

### 常用命令清单

```bash
cd presentation
npm install
npm run dev
npm run lint
npm run build
npx remotion still src/index.ts InterruptEpisode out/check.png --frame=900
```

使用原则：
- `npm run dev` 用于拖时间轴检查 segment 边界和连续动画。
- `npm run lint` 至少覆盖 ESLint + TypeScript。
- `npm run build` 必须真正 render MP4，不要只 bundle。
- `remotion still` 只能抽查关键帧，不能替代连续预览；动画节奏、黑场、遮罩问题必须看视频或 Studio 时间轴。

### 已踩坑记录

- **黑屏遮罩**：`fadeWindow(seconds, start, end, 0, outDur)` 不能在 `seconds < start` 时返回 1，否则章节结尾黑场会从章节开头就盖住全屏。
- **CSS transition**：Remotion 动画应由 `seconds/frame` 纯函数决定，不要在代码行、卡片或布局上依赖 CSS `transition`。
- **装饰性缩放/脉冲**：文字框频繁 scale / pulse 会显得廉价并干扰注意力，教学视频应优先用语义高亮。
- **无意义曲线小圆点**：如果曲线和移动点不能解释真实数据流、控制流或时间流，就不要加。
- **交互式 React 思维**：不要用 `useEffect`、DOM 生命周期、hover/click 状态来推进视频画面；所有状态应由 frame/seconds 直接计算。
- **随机数不确定**：不要用 `Math.random()`；随机装饰或粒子必须用固定 seed。
- **录屏素材组件选错**：录屏/视频素材优先用 `OffthreadVideo`，再叠加字幕、标注和局部放大层。
- **SP 指针漂浮**：栈动画里 SP 必须绑定当前有效栈顶，随着 push/pop 变化。
- **开篇抽象动画**：如果用户没有明确要 bug/glitch/报警感，优先用标题封面，不要做意义不明的方块飞行动画。
- **只看关键帧不够**：still frame 能查布局，但不能发现整段黑屏、节奏生硬、动画过密或字幕遮挡。

### 视觉原则

- 动效服务理解，不服务炫技。
- 优先使用代码行高亮、栈单元出现/消失、指针移动、状态变色、步骤推进。
- 少用全局 zoom、呼吸光、漂浮粒子、无语义 flow line。
- 每个 segment 最好有可见变化，但变化应贴合口播含义，而不是为了动而动。
- 用户反馈某种视觉风格有效后，应沉淀为偏好；用户指出某种动效干扰后，应写进避坑记录。

## 字幕条与 transcript 的解耦

`SUBTITLE_SEGMENTS` 直接由 `SEGMENTS.map(...)` 派生（见 `timings.ts`），单一来源，**永远不要手写 SRT 再导**。如果某个 segment 的 text 听错了或想重写，直接改 `transcript.json`，不动 start/end 就不会破坏动画时间线。

## 反模式（这些事别做）

- ❌ **章节内调 `useCurrentFrame()`**：每章应该是纯函数 `({seconds}) => ReactNode`，方便预览 / 测试 / 跳帧
- ❌ **写死秒数**：`if (seconds > 142.5) ...` → 改成 `if (seconds > segmentRangeStart(37))`
- ❌ **手写 SRT 字幕**：从 transcript 派生
- ❌ **outline 阶段过早设计动画**：outline 只规划信息密度和镜头节奏
- ❌ **把队列板这种巨型组件抽进 shared.tsx**：第一次出现写在章节里，第二次再上提
- ❌ **章节互相 import**：每章对其他章节无知，只通过 `seconds` 和 `Composition.tsx` 沟通
- ❌ **重新对齐时改 outline / Chapter 代码**：只改 `transcript.json`，编号不动则一切自动重对齐
- ❌ **跳过 Step 7.0 章节访谈直接动手**：哪怕"这章看起来很简单"也要问。视觉决策属于用户，AI 只负责落地
- ❌ **跳过 Step 6.0 开篇动画访谈直接做 Cold Open**：开篇冲击力方向必须单独问用户，不能靠 AI 自己猜
- ❌ **一次访谈跨多章问完**：每章动手前单独问。前一章的访谈结果不能预设后一章的偏好
- ❌ **访谈选项里塞太多自创方案**：选项基于"计算机教学视觉模板库"和该章 script 内容，不要拍脑袋编方案让用户挑
- ❌ **用 CSS transition / useEffect / Math.random 推动画面**：Remotion 逐帧渲染必须确定性，动画只能由 frame/seconds 派生
- ❌ **把录屏当普通网页视频随便嵌**：录屏剪辑优先用 `OffthreadVideo` + `Sequence` / `Series` / `TransitionSeries` 管理时间线

## 模板文件

具体可复制的代码在：
- `templates/package.json`
- `templates/tsconfig.json`
- `templates/remotion.config.ts`
- `templates/src/Root.tsx`
- `templates/src/transcript.ts`
- `templates/src/timings.ts`
- `templates/src/shared.tsx`
- `templates/src/Composition.tsx`（最小骨架，留 Chapter 钩子）
- `templates/src/Chapter.template.tsx`（单章模板）
- `snippets/effects/remotionEffects.ts`（Remotion-native 动效函数片段）
- `snippets/screen-recording/ScreenRecordingComposition.tsx`（录屏剪辑型视频骨架与 ClipSequence）

复制时用 `cp -r ~/.claude/skills/remotion-narrated-lesson/templates/ <target>/presentation/`，然后改 `package.json` 的 name，改 `Root.tsx` 的 Composition id，改 `timings.ts` 的 `VOICEOVER_FILE` 文件名。

## 引用

- 同源相关 skill：`web-video-presentation`（点击驱动网页演示，方法论一脉相承，但目标产物不同）
- 参考实现：`D:\codex_project\embedded_tutorial\video\event_queue_video\presentation\` —— 嵌入式系列第一支正片，完整跑通本流程
