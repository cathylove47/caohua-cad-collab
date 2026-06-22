# 新版课程报告模板适配说明

## 1. 结论

老师新发的 [课程设计报告模板2.docx](/Users/cathy/Downloads/课程设计报告模板2.docx) 需要适配，但不需要推倒重写。

当前判断：

- **版式层面**：需要改
  - 新模板是 Word 封面 + 指定章节骨架
  - 原来做的 LaTeX 报告内容可以继续复用，但最终提交版如果老师明确要求 Word 模板，最好迁移到这个新模板里
- **内容层面**：可以复用大部分
  - 现有报告中关于背景、需求、架构、协同、版本管理、测试与截图证据的内容都可以直接迁移
- **表述层面**：必须收敛
  - 新模板里默认写了很多“更工业级、更完整版”的能力，如 OCCT 实算、Yjs/CRDT、K8s、PostgreSQL、Redis、对象存储、STEP/DWG 导入导出、装配、工程图、FEA 等
  - 这些内容**不能直接照抄**，否则会和当前实际实现不符

## 2. 新模板的核心特点

从页面和结构上看，这个模板更像“**教师给出的章节骨架 + 占位提示稿**”，不是已经定稿的正式排版模板。

明显特征：

- 封面已固定为：
  - `工业软件开发技术课程设计报告`
  - 题目是 `基于云架构的协同式机械 CAD 设计系统`
- 正文采用固定大纲
- 中间有多处红字提示，例如：
  - `配图`
  - `功能设计说明`
  - `（如用AI生成，要显示提示词）`
  - `可用图展示`
- 模板里自带了一些“参考性目标/技术栈”文本，但这些并不等于你必须按它原样宣称已经实现

## 3. 与当前项目的主要冲突点

### 3.1 技术栈冲突

模板默认写法偏“完整版云 CAD”：

- OpenCascade 工业几何内核
- WebAssembly 几何计算
- Yjs / CRDT 协同库
- PostgreSQL
- K8s 容器部署
- Redis
- 对象存储

而我们当前实际交付是：

- 前端：React + TypeScript + Vite
- 三维：Three.js
- 状态管理：Zustand
- 后端：Node.js + Express + ws
- 存储：本地 JSON
- OCCT/Wasm：**预留架构，不是已完整落地**

因此这里必须改写成：

- **当前已实现**
- **后续预留扩展**

不能混写。

### 3.2 功能目标冲突

模板默认目标里写了：

- 3D 参数化实体建模
- Git 式版本快照
- WebSocket + CRDT 实时协同
- STEP / STL / glTF / DWG 导入导出
- 装配
- 工程图
- FEA 仿真

我们当前真实情况是：

- 已实现：基础实体建模、草图、Extrude、简化 Cut、多人协同、在线用户、远端光标、Save / Load、版本快照、Undo / Redo、Smart Assist
- 未实现但可写为扩展方向：OCCT 真布尔差、格式互操作、装配、工程图、FEA

### 3.3 部署与存储冲突

模板默认后端部分偏“云原生微服务平台”：

- 微服务拆分
- 格式转换 Worker
- PostgreSQL
- Redis
- 对象存储
- Docker / K8s

我们当前课程版是：

- 单 Node.js 服务
- WebSocket 房间协同
- 本地 JSON 持久化
- 版本快照目录

因此模板第 5 章必须改成：

- **当前实现的后端模块**
- **未来可扩展的云端模块**

## 4. 哪些内容可以直接复用

现有报告里以下内容几乎可以直接迁移：

- 研究背景
- 课程设计目标
- 功能需求 / 非功能需求
- 前端重计算 + 后端轻协同架构思想
- WebSocket 协同流程
- 保存、加载、版本快照
- 冲突策略
- 测试矩阵
- 真实验收截图
- 总结与展望

已经能直接复用的图片：

- [cad-workspace-demo.png](/Users/cathy/code/caohua/cad-collab/docs/images/cad-workspace-demo.png)
- [collab-sync-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/collab-sync-proof.png)
- [version-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/version-proof.png)
- [extrude-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/extrude-proof.png)
- [undo-redo-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/undo-redo-proof.png)
- [smart-assist-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/smart-assist-proof.png)
- [architecture-overview.svg](/Users/cathy/code/caohua/cad-collab/docs/images/architecture-overview.svg)
- [module-uml.svg](/Users/cathy/code/caohua/cad-collab/docs/images/module-uml.svg)
- [collab-dataflow.svg](/Users/cathy/code/caohua/cad-collab/docs/images/collab-dataflow.svg)
- [wasm-bridge.svg](/Users/cathy/code/caohua/cad-collab/docs/images/wasm-bridge.svg)

## 5. 需要重点改写的章节

### 5.1 第一章“开源技术基础”

模板写法太“满”，建议改为：

- 当前实际采用：React / TypeScript / Three.js / Node.js / Express / ws / Zustand / JSON
- 扩展预留：OpenCASCADE/Wasm / PostgreSQL / OBS / AI 辅助设计

### 5.2 第一章“设计目标”

不要再写：

- 完整云原生三层架构
- STEP / DWG 导入导出已实现
- CRDT 已实现

应改为：

- 面向课程设计的本地可演示协同 CAD MVP
- 支持基础建模、协同、版本管理闭环
- 为 OCCT/Wasm 与云端部署预留接口

### 5.3 第三章“总体架构”

模板标题可以保留，但正文要改成：

- 当前实现：前端重计算 + 后端轻协同 + 本地 JSON
- 后续演进：Wasm 几何内核 + 云端数据库 / 对象存储

### 5.4 第四章“前端系统详细设计”

这一章和我们现有材料最匹配，可以直接展开写：

- UI 交互层
- Feature Tree
- 3D 渲染引擎
- 协同客户端
- Smart Assist

其中 `4.4 Wasm 几何内核（OCCT）计算模块设计` 建议明确写成：

- **预留模块设计**
- 当前未完整落地

### 5.5 第五章“后端系统详细设计”

要避免把模板里的 Worker、PostgreSQL、Redis、对象存储写成“已完成实现”。

更安全的写法：

- 当前已实现：
  - Express API
  - WebSocket Room Hub
  - Room State Manager
  - JSON Persistence
- 未来扩展：
  - 格式转换 Worker
  - PostgreSQL
  - Redis
  - 对象存储

### 5.6 第十章“系统成果演示”

这一章非常适合我们当前材料，基本可以直接套用：

- 主界面截图
- 双浏览器协同截图
- 版本管理截图
- Extrude / Undo / Smart Assist 截图

## 6. 建议处理方式

### 方案 A：继续保留 LaTeX 版作为主报告，不推荐单独提交

适合情况：

- 老师只是“参考模板”
- 没有强制必须交 Word

风险：

- 版式可能不符合老师新模板偏好

### 方案 B：把现有内容迁移进这个新 Word 模板，推荐

适合情况：

- 老师新发模板大概率就是最终提交模板

优点：

- 格式更贴合老师要求
- 我们现有内容和图片已经够丰富，迁移成本可控

## 7. 我的判断

我的建议是：

- **内容不需要推倒重写**
- **结构和措辞需要按新模板重排**
- **最终提交版最好切换到这个 Word 模板**

最关键的一点不是“换模板”，而是：

- 不能沿用模板里那些超出当前实现范围的默认表述
- 必须把“当前已实现”与“后续扩展方向”明确分开

## 8. 下一步建议

如果你决定采用这个新模板，下一步我建议直接做：

1. 基于这个 Word 模板生成一份新的最终报告
2. 复用我们现在已有的正文、图和测试证据
3. 对超出当前实现的章节统一改成“扩展设计 / 预留模块 / 后续工作”

这样是最快、也最稳的路线。
