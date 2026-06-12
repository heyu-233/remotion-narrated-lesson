# Remotion Code Walkthrough Template

这是 `remotion-narrated-lesson` 的 **模式 B：代码讲解演示模式** 模板。

它适用于这类项目：

- 用户已经有代码工作区
- 用户已经录好音频
- 视频主画面是单一代码编辑器视图
- 重点是“字幕、代码高亮、稳定视窗、少跳动”

## 模板里保留了什么

- `src/CodeWalkthrough.tsx`
  用 Monaco 编辑器做主画面，支持字幕、高亮、稳定大视窗和代码内容级缩放。
- `src/data/transcript.generated.ts`
  占位 transcript，保证模板复制后先能跑。
- `src/data/subtitleTruth.ts`
  字幕真值修正层。只修文本，不改时间轴。
- `src/data/narrationTruth.ts`
  cue sheet。控制当前讲哪个文件、哪几行、哪一块代码需要高亮。
- `src/data/lesson.ts`
  示例代码工作区数据。复制后按你的项目替换。
- `scripts/transcribe.py`
  用 `faster-whisper` 生成 `public/audio/transcript.json`，并同步刷新 `src/data/transcript.generated.ts`。

## 模板里已经清理掉的东西

- 用户真实音频
- 用户真实 transcript
- `node_modules/`
- `out/`
- 本期专属的 `script.md`、`outline.md`
- 本期专属的案例代码和复盘文档

## 使用步骤

1. 复制整个模板目录到你的新项目目录。
2. 执行 `npm install`。
3. 把真实旁白音频放到 `public/audio/voiceover.m4a`。
4. 执行 `npm run transcribe`，生成真实 transcript。
5. 按你的项目替换：
   - `src/data/lesson.ts`
   - `src/data/narrationTruth.ts`
   - `src/data/subtitleTruth.ts`
6. 执行 `npm run dev` 预览。
7. 执行 `npm run build` 导出视频。

## 模式 B 的硬约束

- 字幕未命中时必须空白。
- cue 未命中时必须保持上一镜头。
- `script.md` 不是屏幕字幕真值。
- 高亮范围不能直接等于镜头范围。
- 想显示更多代码时，优先缩代码内容，不缩整个代码框。
