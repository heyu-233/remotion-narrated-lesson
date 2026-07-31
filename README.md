# Remotion Narrated Lesson

把“口播稿 + 真实旁白录音”做成一支时间轴严格对齐的 Remotion 教学视频。

这个 skill 现在不再假定只有一种开发方式，而是分成 3 条开发路径：

- `章节课件流`
  适合类 PPT / 类课程章节视频。每章都可能有不同视觉舞台。
- `代码讲解流`
  适合单代码工作区、单编辑器视图、字幕驱动高亮和稳定视窗的 walkthrough。
- `混合叙事流`
  适合前半段代码讲解、后半段切图示或章节动画的项目。

## 两个模板入口怎么选

### 1. `templates/`

这是 **章节课件流** 的基础模板。

适合你要做：

- `Chapter1.tsx ~ ChapterN.tsx`
- 每章单独设计画面
- 以 `outline.md` 和章节切分为主
- 大量使用 `shared.tsx`、`Heading`、`CodeBlock`、`ChapterBackground`

复制它的时机：

- 你已经明确这是一支章节化教学视频
- 你打算按章逐个开发
- 你接受“先 Chapter、后细节画面”的结构

### 2. `templates-code-walkthrough/`

这是 **代码讲解流** 的基础模板。

适合你要做：

- 单一编辑器主视图
- 字幕、代码高亮、稳定大视窗
- 同一个文件里边讲边滚动
- 强调“高亮变、镜头尽量稳”

复制它的时机：

- 你已经有代码工程或代码片段
- 你已经录好音频
- 你要先把字幕和代码讲解对齐
- 你不想一开始就拆成 `Chapter1.tsx ~ ChapterN.tsx`

## 两个模板的本质区别

| 模板 | 核心组织方式 | 真正优先级 |
|---|---|---|
| `templates/` | Chapter 组件组织 | 章节结构、每章画面设计 |
| `templates-code-walkthrough/` | 单编辑器视图 + cue sheet 组织 | 字幕真值、代码高亮、稳定视窗 |

一句话记忆：

- 想做“分章讲课”，用 `templates/`
- 想做“代码讲解”，用 `templates-code-walkthrough/`

## 代码讲解流的硬约束

如果你走 `templates-code-walkthrough/`，必须记住：

- `subtitleTruth.ts` 才是屏幕字幕修正层
- `script.md` 只能用来核对明显错词，不是屏幕字幕真值
- 字幕未命中时必须空白
- cue 未命中时必须保持上一镜头
- 字幕停顿只清空字幕，画面和高亮继承最近有效锚点
- 未知场景或首个视觉锚点之前必须返回空画面，禁止默认回退动画
- 高亮范围不能直接等于镜头范围
- 想显示更多代码时，优先缩代码内容，不缩整个代码框

## 目录结构

```text
remotion-narrated-lesson/
├── SKILL.md
├── README.md
├── guides/
│   └── recording-and-motion.md
├── snippets/
│   └── screen-recording/
├── templates/
│   ├── package.json
│   ├── remotion.config.ts
│   ├── scripts/
│   └── src/
└── templates-code-walkthrough/
    ├── package.json
    ├── remotion.config.ts
    ├── public/audio/
    ├── scripts/
    └── src/
```

## 推荐使用顺序

1. 先判断项目属于哪条开发路径。
2. 再选模板，不要反过来。
3. 如果是代码讲解项目，优先从 `templates-code-walkthrough/` 起步。
4. 如果后面又要补章节动画，再扩成 `混合叙事流`。

## 进一步说明

完整工作流、约束、反模式、避坑记录，请看：

- [SKILL.md](./SKILL.md)
- [录屏与动画检查表](./guides/recording-and-motion.md)
