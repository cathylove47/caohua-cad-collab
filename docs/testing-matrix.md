# 测试矩阵与考核映射

## 1. 测试目标

本测试矩阵用于证明系统已经覆盖课程设计中的核心考核点，并给出每项功能的验证方式、预期结果和答辩展示建议。

## 2. 测试矩阵

| 测试编号 | 测试项 | 操作步骤 | 预期结果 | 对应考核项 |
| --- | --- | --- | --- | --- |
| T1 | 前后端启动 | 启动 backend 和 frontend | 两端均可正常运行 | 核心功能实现、代码质量 |
| T2 | 登录房间 | 输入 username 和 roomId 进入系统 | 成功进入 CAD 主界面 | 核心功能实现 |
| T3 | Box 建模 | 点击 `Box` | 左侧出现 `Box1`，场景中出现立方体 | 核心功能实现 |
| T4 | Cylinder 建模 | 点击 `Cylinder` | 左侧出现 `Cylinder1`，场景中出现圆柱 | 核心功能实现 |
| T5 | 草图创建 | 点击 `Rectangle` 或 `Circle` | Feature Tree 出现草图对象 | 核心功能实现 |
| T6 | Extrude | 选中 Rectangle/Circle 草图并点击 `Extrude` | 生成对应三维实体 | 核心功能实现 |
| T7 | 参数编辑 | 修改右侧 width / height / position | 三维对象立即变化 | 核心功能实现 |
| T8 | 双窗口协同 | 两窗口进入同一 room，A 建模 | B 实时看到同步结果 | 核心功能实现、演示与答辩 |
| T9 | 光标同步 | A 在视图区移动鼠标 | B 看到彩色远端光标标记 | 核心功能实现 |
| T10 | Save | 点击 `Save` | 生成主 JSON 与版本快照 | 核心功能实现 |
| T11 | Load | 点击 `Load` | 恢复最近一次保存状态 | 核心功能实现 |
| T12 | Version Restore | 选择版本点击 `Restore` | 恢复指定历史版本 | 核心功能实现 |
| T13 | Undo / Redo | 删除对象后执行 `Undo/Redo` | 对象状态正确回退和重做 | 核心功能实现 |
| T14 | Smart Assist | 输入命令并点击 `Run` | 自动创建对应对象 | 创新性 |
| T15 | 架构文档审阅 | 打开 architecture.md | 能看到架构图、UML、数据流图、Wasm 说明 | 架构设计文档 |
| T16 | GitHub 仓库检查 | 打开 GitHub 仓库 | 代码、文档、图片可访问 | 代码质量 |

## 3. 已有验证证据

- 前端构建通过：`npm run build`
- 后端类型检查通过：`npm run typecheck`
- 已生成项目截图：
  - [cad-workspace-demo.png](/Users/cathy/code/caohua/cad-collab/docs/images/cad-workspace-demo.png)
- 已生成考核对照图：
  - [evaluation-scorecard.svg](/Users/cathy/code/caohua/cad-collab/docs/images/evaluation-scorecard.svg)
- 已有 GitHub 仓库：
  - [caohua-cad-collab](https://github.com/cathylove47/caohua-cad-collab)

## 4. 现场演示建议

答辩时建议优先展示以下测试链路：

1. T2 登录房间
2. T3 Box 建模
3. T7 参数编辑
4. T8 双窗口协同
5. T6 Extrude
6. T14 Smart Assist
7. T10 Save
8. T12 Version Restore
9. T13 Undo / Redo

这样可以在较短时间内覆盖最多的考核项。
