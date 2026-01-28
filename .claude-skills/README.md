# Claude Skills for This Project

这个目录包含自定义的Claude技能指令，用于快速执行常见的开发任务。

## 已有技能

### 1. Browser Zoom Compensation (浏览器缩放补偿)

**用途**: 为HTML5游戏添加浏览器缩放补偿功能，使界面在Ctrl+/-缩放时保持物理尺寸不变。

**触发命令**:
```
为这个项目添加浏览器缩放补偿功能
```

**相关文件**:
- `browser-zoom-compensation.md` - 详细文档和技术说明
- `browser-zoom-compensation.prompt` - 快速执行模板

**适用场景**:
- Phaser 游戏
- Canvas 应用
- 包含广告的Web应用
- 任何需要固定尺寸的Web项目

---

## 如何使用这些Skills

### 方法1: 直接告诉Claude

在Claude对话中直接说：
```
为这个项目添加浏览器缩放补偿功能
```

或者更具体地：
```
参考 .claude-skills/browser-zoom-compensation.prompt，
为我的项目实现浏览器缩放补偿
```

### 方法2: 引用具体文件

```
按照 .claude-skills/browser-zoom-compensation.md 中的步骤，
为我的项目添加缩放补偿功能
```

### 方法3: 复制到其他项目

将 `.claude-skills` 目录复制到其他项目，然后使用同样的命令：

```bash
cp -r /path/to/SheepGame/.claude-skills /path/to/new-project/
```

---

## 创建新的Skill

### 1. 创建文档文件

创建 `.claude-skills/your-skill-name.md`，包含：
- 技术原理
- 详细步骤
- 代码示例
- 常见问题

### 2. 创建Prompt文件

创建 `.claude-skills/your-skill-name.prompt`，包含：
- 触发命令
- 执行步骤
- 关键代码模板
- 成功标准

### 3. 更新README

在本文件中添加你的新skill说明。

---

## 最佳实践

### ✅ DO (推荐)
- 在对话开始时引用skill文件
- 使用清晰简洁的触发命令
- 在skill文档中包含真实代码示例
- 记录skill的局限性和注意事项

### ❌ DON'T (不推荐)
- 过于复杂的skill（拆分成多个小skill）
- 缺少测试步骤的skill
- 依赖过多外部工具的skill
- 没有错误处理的skill

---

## Skill模板

复制以下模板创建新skill：

### Prompt模板 (your-skill.prompt)
```markdown
# Skill: Your Skill Name

## Quick Start Command
"触发命令"

## What This Skill Does
简短描述

## Execution Steps
1. 步骤1
2. 步骤2
3. 步骤3

## Key Code Template
\`\`\`javascript
// 核心代码
\`\`\`

## Success Criteria
- [ ] 标准1
- [ ] 标准2
```

### 文档模板 (your-skill.md)
```markdown
# Your Skill Name

## 描述
详细描述

## 适用场景
- 场景1
- 场景2

## 实现步骤
### 1. 第一步
...

## 技术原理
...

## 测试方法
...

## 常见问题
...
```

---

## 贡献

如果你创建了有用的skill，欢迎：
1. 提交到项目仓库
2. 分享给团队成员
3. 改进现有skill

---

## 版本历史

### v1.0.0 (2026-01-28)
- ✅ 创建 Browser Zoom Compensation skill
- ✅ 建立skill目录结构
- ✅ 编写使用文档

---

## 联系方式

有问题或建议？欢迎通过以下方式联系：
- GitHub Issues
- 项目讨论区
