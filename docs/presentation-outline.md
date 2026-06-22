# 答辩 PPT 提纲

## 第 1 页：封面

- 题目：基于云的协同机械 CAD 系统设计与实现
- 姓名 / 学号 / 专业 / 指导教师
- 可配图：
  - [cad-workspace-demo.png](/Users/cathy/code/caohua/cad-collab/docs/images/cad-workspace-demo.png)
  - [report-cover.svg](/Users/cathy/code/caohua/cad-collab/docs/images/report-cover.svg)

## 第 2 页：课题背景与意义

- 传统单机 CAD 的局限
- 云协同设计的需求
- 课程设计目标：可运行、可演示、可扩展的 MVP

讲述重点：

- 不追求工业级内核
- 重点是系统设计闭环

## 第 3 页：需求分析

- 前端 CAD 界面
- 基础建模
- 实时协同
- 保存、加载、版本管理
- 本地稳定运行要求

讲述重点：

- 明确这是“最小可交付”而非“大而全”

## 第 4 页：总体架构

- 放总体架构图
- 前端 / 后端 / 存储分层

讲述重点：

- 前端重计算
- 后端轻协同

## 第 5 页：关键模块设计

- Toolbar
- Feature Tree
- CanvasViewport
- InspectorPanel
- CadStore
- Backend Room Manager

讲述重点：

- 各模块职责分离清晰

## 第 6 页：数据流与协同机制

- 放数据流图
- 说明 join / operation / cursor / save / restore

讲述重点：

- WebSocket 广播增量
- 最后写入优先

## 第 7 页：核心功能演示

- Box / Cylinder / Sphere
- 草图对象
- Extrude
- 简化 Cut

讲述重点：

- 展示建模闭环

## 第 8 页：协同与版本管理

- 双窗口同步
- 在线用户
- Save / Load
- 版本快照 / Restore
- Undo / Redo

讲述重点：

- 这是系统价值最强的一页

## 第 9 页：创新点

- Smart Assist 自然语言建模入口
- Wasm / OpenCASCADE 预留扩展
- AI 辅助设计扩展方向

讲述重点：

- 讲“轻量创新”
- 不夸大当前实现

## 第 10 页：测试结果与考核项对应

- 放考核标准对照图
- 列出：
  - 架构文档
  - 核心功能
  - 代码质量
  - 创新性
  - 演示与答辩

讲述重点：

- 主动告诉老师“每一项我都对应到了”

## 第 11 页：不足与后续优化

- Cut 为简化实现
- 无工业级几何内核
- 冲突处理较简单
- 无正式鉴权

后续方向：

- OpenCASCADE/Wasm
- PostgreSQL
- OBS
- JWT
- LLM 辅助建模

## 第 12 页：总结

- 本项目完成了协同 CAD 的 MVP 设计与实现
- 满足可运行、可演示、可说明要求
- 具备后续扩展基础

## 现场讲法建议

推荐节奏：

1. 先讲背景和目标
2. 再讲架构
3. 然后快速演示
4. 最后讲创新点和不足

推荐总时长：

- 8~12 分钟
