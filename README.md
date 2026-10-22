# Remotion Series Production V5

在可复用的 Remotion 系列引擎中制作技术视频：口播课程、代码讲解、真实证据画面、机制动画，以及带事件音效的无配音预览。

当前入口是 [SKILL.md](SKILL.md)。每期内容、素材和语义时间线独立维护；运行依赖、字幕、通用视觉组件和渲染由已配置的系列引擎负责。本仓库提供 skill、参考说明与辅助工具，不包含完整系列引擎。

## V5 的主要改进

- 先明确机制角色、关系和状态，再设计动作。保留理解关系所需的多个对象，按讲解顺序逐步引入。
- 在稳定舞台中完成相关操作。语义步骤与镜头变化分开，镜头服务可读性和因果解释。
- 区分模型事实、对象可见、讲解引入和状态激活，避免开场提前亮出尚未介绍的结果。
- 支持图片参考、程序化关键帧和已获授权的直接可播放预览，保留真实的用户审查要求与豁免。
- 用同一语义时间线驱动动画和轻量音效；检测重排后失效的旧音轨。
- 批量复用经过验证的讲解模式和工具，根据题材选择布局和表现方式。

## 安装与引擎配置

将本仓库放入 Codex 的 skills 目录，或更新已有的同名 skill。首次安装到空目录时可运行：

```powershell
git clone https://github.com/heyu-233/remotion-narrated-lesson.git "$env:USERPROFILE\.codex\skills\remotion-narrated-lesson"
```

提供已有系列引擎的绝对路径，或在 skill 目录中复制配置示例：

```powershell
Copy-Item .\engine.config.example.json .\engine.config.json
```

把 `defaultEngineRoot` 改为实际引擎目录；该本机配置已被 Git 忽略。开始制作前，在引擎目录运行 `npm run doctor`。引擎约定见 [engine-contract.md](references/engine-contract.md)。没有引擎时应先确定其位置和创建范围。

## 选择制作路线

| 任务 | 说明入口 |
| --- | --- |
| 新一期或修改已有视频 | [制作流程](references/workflows.md)、[预制作路线](references/keyframe-preproduction.md) |
| 数据结构、任务切换、控制回路等机制动画 | [机制叙事](references/mechanism-storytelling.md)、[工程动画模式](references/engineering-animation-patterns.md) |
| 代码讲解 | [代码讲解](references/code-walkthrough.md) |
| 截图、终端和录屏证据 | [录屏与运动规则](references/recording-and-motion.md) |
| 自动音效 | [音效设计](references/sound-design.md) |
| 批量制作与成功案例复用 | [批量制作](references/batch-production.md) |
| 引擎维护和验证 | [引擎维护](references/engine-maintenance.md)、[阶段校验](references/phase-validation.md)、[质量检查](references/quality-gates.md) |

制作可从最终旁白、视觉设计或真实证据开始。每期只维护一个 `episodes/<id>/timeline.json`，由语义锚点控制字幕、画面和声音。最终旁白存在时以录音为准；无配音试作明确记录为 foley-only 或 silent。

## 自动音效工具

`scripts/foley.mjs` 使用 Node 内置模块，提供六种确定性短音效、48kHz 双声道 PCM16 stems、音效母带和清单。事件引用锚点的开始或结束边界，支持增益与声像。

```json
{
  "soundEvents": [
    {
      "id": "context-saved",
      "anchor": "save-context",
      "phase": "end",
      "offset": 0,
      "kind": "ready",
      "gain": 0.4,
      "pan": 0
    }
  ]
}
```

使用绝对路径执行构建和校验：

```text
node scripts/foley.mjs build --timeline ABS_TIMELINE --output-dir ABS_AUDIO_DIR --manifest ABS_MANIFEST
node scripts/foley.mjs verify --timeline ABS_TIMELINE --output-dir ABS_AUDIO_DIR --manifest ABS_MANIFEST
node scripts/test_foley.mjs
```

校验重新解析时间线并检查音频哈希，可发现同长度重排、音量/音色变更和文件损坏。测试默认使用临时自包含样例；配置引擎含电机与 RTOS 试作时，可给测试增加 `--engine-root ABS_ENGINE_ROOT`。

工具不包含旁白合成、旁白混音或自动 ducking。默认峰值上限 −10.5dBFS 仅向下衰减，接入旁白后仍需试听并检查语音可懂度。详见 [音效设计](references/sound-design.md)。

## 引擎兼容性

Skill V5 不会自动升级已安装的引擎。当前适配器可生成音效母带；原生多轨音频、音频模式、程序化预制作路线和批量渲染仍需检查对应引擎的类型、组合组件及验证器。

旧验证器若强制要求无配音预览具有旁白或外部图片审批，应报告实际兼容性问题并运行适用检查。不得补造旁白、图片或审批记录来宣称全部通过。

## 保留的历史模板

`templates/`、`templates-code-walkthrough/`、`snippets/` 和部分 Python 脚本保留供已有独立项目维护；`assets/` 包含打包后的模板与片段。当前新一期优先复用配置的系列引擎，不为每期复制整套应用。历史模板与旧校验器不等于已经实现 V5 的所有能力。
