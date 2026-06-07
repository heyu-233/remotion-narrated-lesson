# Remotion Narrated Lesson

> 把口播稿 + 旁白录音 → 做成一支持有动画的教学视频，基于 [Remotion](https://remotion.dev)，时间线由 Whisper 转写的 segment 时间戳驱动。

专门服务 **"录音先行、动画后做、动画严格对齐口播"** 的计算机教学视频工作流。

## 适用场景

- 编程 / 系统 / 数据库 / AI / 嵌入式 等计算机类中文教程
- 5–15 分钟一集，1920×1080 @ 30fps
- B 站 / 视频号 / YouTube 录屏发布
- 也支持录屏 + 旁白 + 标注包装的剪辑型视频

## 核心设计

```
script.md  ─┐                                   ┌─> Composition.tsx
voiceover ──┼──> faster-whisper ──> transcript ──┤   ├─ Chapter1.tsx
.m4a/.mp3   │       │   │             .json      │   ├─ Chapter2.tsx …
            │       └─> SRT/VTT 备查            │   └─ Chapter8.tsx
outline.md ─┘                                   ├─> shared.tsx
                                                ├─> transcript.ts
                                                ├─> timings.ts
                                                └─> Root.tsx
```

**时间锚点绑定 segment id，不写死秒数。** 重新录音、重跑 whisper 后整片自动重对齐。

## 快速开始

```bash
# 1. 准备输入
#    script.md   — 定稿的口播稿
#    voiceover.* — 录好的旁白 (.m4a/.mp3/.wav)

# 2. 复制模板
cp -r ~/.claude/skills/remotion-narrated-lesson/templates/ my-video/presentation/

# 3. Whisper 转写（强制对齐）
cd my-video/presentation
python scripts/transcribe.py public/audio/voiceover.m4a

# 4. 启动开发
npm install --registry https://registry.npmmirror.com
npm run dev          # → http://localhost:3000

# 5. 渲染出片
npm run build        # → out/lesson.mp4
```

## 目录结构

```
remotion-narrated-lesson/
├── SKILL.md                  # 完整工作流文档（8 步流程 + 设计原则 + 避坑记录）
├── templates/                # 可直接复制的新项目骨架
│   ├── src/
│   │   ├── Root.tsx          # Composition 注册
│   │   ├── Composition.tsx   # 顶层调度（Audio + 章节路由 + 字幕）
│   │   ├── transcript.ts     # JSON 导入 + segment 查询 + CHAPTERS
│   │   ├── timings.ts        # FPS / TOTAL_FRAMES / SUBTITLE_SEGMENTS
│   │   ├── shared.tsx        # 色板 / 字体 / 动效 / Heading / CodeBlock / SubtitleBar
│   │   └── Chapter1.tsx      # 单章模板（复制 → ChapterN.tsx）
│   └── scripts/
│       └── transcribe.py     # faster-whisper 强制对齐
├── snippets/
│   ├── effects/
│   │   └── remotionEffects.ts    # 可复制的 Remotion 动效函数
│   └── screen-recording/
│       └── ScreenRecordingComposition.tsx  # 录屏剪辑型视频骨架
└── README.md
```

## 布局网格

1920×1080 画布上的推荐布局（详见 `SKILL.md`）：

| 区域 | y 范围 | 字号底线 |
|------|--------|----------|
| 标题区 | 60–120 | ≥ 28px |
| 主内容区 | 180–700 | ≥ 18px |
| 底部注释 | 700–850 | ≥ 15px |

## 开发原则

- **每章开发前先做视觉访谈**：不能靠 AI 推测画面，必须用 `AskUserQuestion` 问用户
- **时间锚点只绑 segment id**：`segmentRangeStart(45)` 而非 `142.5`
- **动画由 frame/seconds 驱动**：不用 CSS transition / useEffect / Math.random
- **字幕单一来源**：transcript.json → timings.ts → SubtitleBar，不手写 SRT
- **章节组件纯函数**：`FC<{ seconds: number }>`，不内部调用 `useCurrentFrame()`

## 参考

- 完整流程文档：[SKILL.md](SKILL.md)
- 参考实现：嵌入式事件队列视频 (`event_queue_video/presentation/`)
- 同源 skill：`web-video-presentation`（点击驱动网页演示）

## License

UNLICENSED — 个人技能项目，非开源许可。
