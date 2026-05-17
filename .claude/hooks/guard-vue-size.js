// .claude/hooks/guard-vue-size.js
// PreToolUse hook: blocks .vue file writes exceeding 400 lines.
// Reads tool-use JSON from stdin, checks file_path ends with .vue,
// counts lines in content, blocks if > MAX_LINES.

const MAX_LINES = 400

let input = ''
process.stdin.on('data', chunk => (input += chunk))
process.stdin.on('end', () => {
  try {
    const toolUse = JSON.parse(input)
    const filePath = toolUse?.tool_input?.file_path || ''
    const content = toolUse?.tool_input?.content || ''

    if (!filePath.endsWith('.vue')) {
      process.stdout.write(input)
      process.exit(0)
      return
    }

    const lines = content.split('\n').length

    if (lines > MAX_LINES) {
      const fileName = filePath.split('/').pop()
      console.error(
        [
          `[dev-guard] BLOCKED: ${fileName} 超出 ${MAX_LINES} 行限制（${lines} 行）`,
          `[dev-guard] 本项目要求 .vue 文件 ≤ ${MAX_LINES} 行。请先提取子组件再继续。`,
          `[dev-guard]`,
          `[dev-guard] 修复步骤:`,
          `[dev-guard]   1. 识别文件中可独立成组件的 UI 子区块`,
          `[dev-guard]   2. 在 components/ 下创建 PascalCase.vue 子组件`,
          `[dev-guard]   3. 将子区块的 template/script/style 迁移到子组件`,
          `[dev-guard]   4. 在原页面中 import 并使用子组件，减少行数`,
          `[dev-guard]`,
          `[dev-guard] 已有组件: BoardGrid, BottomDock, CircleProgressDialog,`,
          `[dev-guard]   GameAppBar, IconSprite, SidebarDrawer`,
        ].join('\n')
      )
      process.exit(2)
    }

    process.stdout.write(input)
    process.exit(0)
  } catch (err) {
    console.error('[dev-guard] WARNING: guard-vue-size 解析失败，已放行:', err.message)
    process.stdout.write(input)
    process.exit(0)
  }
})
