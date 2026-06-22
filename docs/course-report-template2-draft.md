# 《基于云架构的协同式机械 CAD 设计系统》模板 2 适配版报告草稿

> 说明：本稿按照老师新发的 [课程设计报告模板2.docx](/Users/cathy/Downloads/课程设计报告模板2.docx) 的章节骨架重排，内容严格对应当前已完成的课程设计 MVP。凡未落地的工业级能力，统一写为“扩展预留”或“后续演进方向”。

## 摘要

随着云计算、Web 图形渲染和多人协同技术的发展，传统单机机械 CAD 软件在跨终端访问、实时协作和轻量部署方面逐渐暴露出局限性。针对课程设计“基于云架构的协同式机械 CAD 设计系统”这一题目，本文设计并实现了一个面向本地稳定演示与课程答辩的最小可交付系统（MVP）。

系统前端基于 React、TypeScript 和 Vite 构建，采用 Three.js 完成三维图形渲染，以 Zustand 管理建模状态；后端基于 Node.js、Express 与 WebSocket 提供房间协同、操作广播和项目持久化能力；存储层采用本地 JSON 文件和版本快照目录保存房间模型状态。系统实现了 Box、Cylinder、Sphere 等基础实体建模，支持 Line、Circle、Rectangle 草图表达，并支持基于 Rectangle 和 Circle 的 Extrude 操作。同时，系统支持房间协同、在线用户显示、远端光标同步、Save/Load、版本快照、Undo/Redo 等能力。

为了兼顾课程设计要求与工程可交付性，本文采用“前端重计算、后端轻协同”的总体方案，并在文档和代码结构中预留了 OpenCASCADE/Wasm、PostgreSQL、对象存储和 AI 辅助设计的扩展接口。实验结果表明，该系统已经能够在本地环境下稳定完成核心功能演示，具有结构清晰、讲解顺畅、后续扩展路径明确等特点。

关键词：协同 CAD；Three.js；WebSocket；版本管理；课程设计；Wasm 扩展

## 1 绪论

### 1.1 课题背景与意义

机械 CAD 系统长期服务于零件建模、结构设计与制造准备等工程场景。传统 CAD 软件通常以单机桌面模式为主，虽然建模能力强，但在多人实时协同、浏览器访问和轻量部署方面存在明显局限。随着 WebGL、WebSocket 和前端工程体系的发展，将 CAD 能力迁移到浏览器端、通过后端维护协同状态，已经成为工业软件与云化设计平台的重要发展方向。

对课程设计而言，直接实现完整工业级几何内核和全套云原生平台代价过高，不利于在限定时间内完成一个稳定、可演示、可讲解的系统。因此，本课题以“实现核心闭环”为目标，重点完成参数化基础建模、协同编辑、保存加载和版本快照等能力，同时为更工业化的几何内核和云端数据服务预留扩展空间。

### 1.2 开源技术基础

本系统的当前实现主要依赖以下开源技术：

- React + TypeScript：用于构建组件化 CAD 界面，提升前端代码组织能力。
- Vite：用于本地快速开发与打包构建。
- Three.js：用于完成三维场景管理、网格渲染和相机交互。
- Zustand：用于集中维护对象状态、选择状态、历史记录和协同会话状态。
- Node.js + Express：用于提供 HTTP API。
- ws：用于实现 WebSocket 房间通信与操作广播。
- 本地 JSON 文件：用于完成项目保存和版本快照。

在扩展设计层面，系统预留了 OpenCASCADE/Wasm、PostgreSQL、对象存储和 AI 辅助设计接口，但这些内容在本次课程设计中不作为已完成实现进行宣称，而是作为系统演进方向。

### 1.3 设计目标

本课题的设计目标如下：

1. 构建一个能够在本地稳定运行的协同机械 CAD MVP。
2. 实现基础建模、草图表达、拉伸生成、多人协同、保存加载和版本管理的完整演示闭环。
3. 保证系统结构清晰，便于课程答辩时从界面、数据流和后端模块三个层次进行说明。
4. 在不过度增加工程复杂度的前提下，体现一定创新性，并为后续接入工业级几何内核和云端存储保留扩展位。

### 1.4 报告整体章节安排

本文首先给出系统需求分析，然后介绍系统总体架构设计与技术选型；接着分别说明前端与后端的详细实现；最后通过功能演示、测试结果和总结展望，说明本系统在课程设计范围内的完成情况与扩展价值。

## 2 系统需求分析

### 2.1 功能性需求

根据课题要求与课程演示场景，系统的核心功能需求包括：

1. 提供典型 CAD 工作界面，包括顶部工具栏、左侧特征树、中间三维视图区、右侧属性面板以及底部协同状态区域。
2. 支持 Box、Cylinder、Sphere 等基础三维实体创建。
3. 支持 Line、Circle、Rectangle 等二维草图对象表达，并能够在视图中显示。
4. 支持将 Rectangle 和 Circle 草图转为三维实体，完成基础 Extrude 操作。
5. 支持简化 Cut 操作，以满足课程演示中的“切除”效果展示。
6. 支持基于房间号的多人协同，能够广播新增、修改、删除、状态替换与光标消息。
7. 支持 Save、Load、版本快照、版本恢复和 Undo/Redo。

### 2.2 非功能性需求

除功能需求外，系统还需满足以下非功能目标：

- 本地可运行，不依赖 Docker 和远程部署。
- 在 macOS 上安装步骤清晰、启动成本低。
- 前后端结构清楚，适合课程答辩时进行模块化讲解。
- 协同过程稳定，双窗口演示时同步行为清晰可见。
- 为后续演进到 OpenCASCADE/Wasm、数据库和云存储预留接口。

## 3 系统总体架构设计

### 3.1 架构总体方案：云协同 MVP + Wasm 几何内核预留架构

老师模板中的该节标题偏向完整工业云 CAD 方案。结合本项目实际实现，本文将其具体化为“云协同 MVP + Wasm 几何内核预留架构”。也就是说，当前系统已经完成浏览器端建模、后端房间协同和本地持久化三部分闭环，而工业级几何求解与云端数据底座则作为后续扩展方向。

系统总体由三层组成：

1. 前端 CAD 客户端：负责界面交互、对象参数编辑、三维渲染、草图表达和局部历史管理。
2. 协同服务端：负责房间状态维护、WebSocket 消息广播、在线用户管理以及保存加载接口。
3. 文件持久化层：负责以 JSON 文件保存当前房间状态，并为每次保存生成版本快照。

配图建议：使用 [architecture-overview.svg](/Users/cathy/code/caohua/cad-collab/docs/images/architecture-overview.svg)。

### 3.2 三层分层架构整体逻辑

系统采用“前端重计算、后端轻逻辑”的三层协作模式：

- 表现层：负责 Ribbon 工具栏、特征树、属性面板、状态栏和登录页。
- 领域层：负责对象模型、参数编辑、建模历史、Undo/Redo、草图与 Extrude 逻辑。
- 服务层：负责 HTTP 接口、WebSocket 广播、房间管理和持久化读写。

该设计的优势在于：

- 减少后端复杂度，便于课程版快速落地。
- 前端对建模对象具备完全控制权，方便演示参数修改和对象重建。
- 后端只保存房间状态和广播操作，便于后续替换存储方式或增加数据库支持。

### 3.3 全局技术栈选型总表

| 层次 | 技术选型 | 技术作用 |
| --- | --- | --- |
| 前端 UI 框架 | React + TypeScript | 构建组件化 CAD 交互界面 |
| 前端构建工具 | Vite | 提供快速开发与构建能力 |
| 3D 渲染引擎 | Three.js | 完成几何体渲染、相机与场景管理 |
| 前端状态管理 | Zustand | 管理对象状态、选择状态、历史与协同状态 |
| 后端服务框架 | Node.js + Express | 提供 HTTP API 与服务入口 |
| 实时协同通信 | WebSocket + ws | 完成房间广播、在线用户与远端光标同步 |
| 数据持久化 | 本地 JSON 文件 | 保存房间模型与版本快照 |
| 几何内核扩展 | OpenCASCADE/Wasm（预留） | 作为后续工业级几何计算扩展方向 |

## 4 前端系统详细设计

### 4.1 前端整体分层结构

前端系统主要分为四个层次：

1. 页面与布局层：负责登录页、工作台布局和区域划分。
2. 交互组件层：负责工具栏、特征树、属性面板和协同状态面板。
3. 场景渲染层：负责 Three.js 场景初始化、对象网格渲染、相机控制和远端光标显示。
4. 状态与建模层：负责对象数据、建模操作、历史栈和协同消息处理。

配图建议：使用 [module-uml.svg](/Users/cathy/code/caohua/cad-collab/docs/images/module-uml.svg)。

### 4.2 UI 交互层模块设计

前端 UI 交互层采用典型 CAD 工具布局，主要模块包括：

- 登录页：输入 `username` 和 `roomId`。
- Ribbon 工具栏：提供 Box、Cylinder、Sphere、Sketch、Extrude、Cut、Save、Load、Undo、Redo 等入口。
- Feature Tree：显示建模历史项，如 `Box1`、`Cylinder1`、`Extrude1`、`Cut1`。
- 属性面板：支持编辑对象尺寸、半径、高度、位置等参数。
- 状态栏：显示当前房间号、在线用户和连接状态。

该界面布局与传统 CAD 交互方式一致，有助于用户快速理解系统结构，也有利于答辩时按区域解释功能。

配图建议：使用 [cad-workspace-demo.png](/Users/cathy/code/caohua/cad-collab/docs/images/cad-workspace-demo.png)。

### 4.3 3D 渲染引擎模块设计

三维视图基于 Three.js 实现，主要职责包括：

- 创建场景、相机、灯光和辅助网格。
- 根据对象类型生成对应网格。
- 根据参数变化重建对象几何体。
- 以不同颜色或标记显示当前选中对象。
- 在视图中绘制远端用户光标标记。

基础实体建模采用 Three.js 标准几何体：

- Box 对应 `BoxGeometry`
- Cylinder 对应 `CylinderGeometry`
- Sphere 对应 `SphereGeometry`

草图对象以简化线框或平面轮廓表达，用于可视化二维建模意图，并为 Extrude 操作提供输入。

### 4.4 Wasm 几何内核（OCCT）计算模块设计

这一节在老师模板中默认偏向“已实现的工业级几何内核”，但在本项目中应明确写为“扩展预留模块设计”。

当前系统的几何计算主要依赖 Three.js 提供的几何构造能力，能够满足课程版基础建模、草图和拉伸演示需求。对于复杂布尔运算、边界表达（B-Rep）、高精度拓扑检查等工业级功能，本项目尚未完整接入 OpenCASCADE/Wasm。

不过在系统架构上，已经预留出几何内核替换路径：未来可以将复杂求解逻辑下沉到 Wasm 模块，并通过统一的前端建模命令接口与当前对象数据结构对接。

配图建议：使用 [wasm-bridge.svg](/Users/cathy/code/caohua/cad-collab/docs/images/wasm-bridge.svg)。

### 4.5 草图与拉伸功能设计

系统支持以下草图对象：

- Line
- Circle
- Rectangle

其中 Rectangle 和 Circle 可以作为 Extrude 的输入。实现过程为：

1. 根据草图参数生成 `THREE.Shape`。
2. 调用 `THREE.ExtrudeGeometry` 生成三维几何。
3. 将生成结果加入建模历史，并在三维视图中显示。

为了保证演示稳定，Cut 操作采用简化实现，即通过“切除区域可视化标记”来表达差集效果，而不是完整工业级实体布尔运算。

配图建议：使用 [extrude-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/extrude-proof.png)。

### 4.6 前端协同同步客户端模块

协同客户端模块负责：

- 与服务端建立 WebSocket 连接。
- 发送 `join-room`、`cursor` 和操作类消息。
- 接收远端 `add`、`update`、`delete`、`replace-state` 等广播。
- 维护在线用户列表与连接状态。

考虑课程设计的可交付性，系统采用“最后写入优先”的冲突处理策略。该策略实现简单、演示明确，虽然不具备 CRDT 的精细冲突合并能力，但足以满足当前双窗口协同场景。

配图建议：使用 [collab-sync-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/collab-sync-proof.png) 和 [collab-dataflow.svg](/Users/cathy/code/caohua/cad-collab/docs/images/collab-dataflow.svg)。

## 5 后端系统详细设计

### 5.1 后端微服务功能实现

虽然老师模板标题写作“微服务”，但当前课程版实现采用的是单体后端服务。该服务由 Node.js + Express + ws 构成，内部按职责划分为多个模块，包含：

- HTTP API 模块：提供健康检查、房间加载、保存、版本列表和版本恢复接口。
- WebSocket Hub 模块：处理连接建立、房间加入、消息分发与在线用户维护。
- Room State Manager：维护房间内对象集合、用户列表和会话状态。
- Persistence 模块：负责读写 JSON 主文件与版本快照。

这种设计避免了微服务部署复杂度，但在代码结构上仍然保留了未来拆分服务的空间。

### 5.2 文件与版本控制服务模块

项目持久化采用本地 JSON 文件方案：

- 当前房间状态保存到 `backend/data/projects/{roomId}.json`
- 每次 Save 生成一个版本快照：
  - `backend/data/projects/{roomId}/versions/{timestamp}.json`

这种方式具备以下优点：

- 本地易运行，课程演示准备成本低。
- 版本快照可直接查看，便于答辩展示。
- 后续可平滑迁移到 PostgreSQL 和对象存储。

配图建议：使用 [version-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/version-proof.png)。

### 5.3 格式转换 Worker 服务模块

这一节在老师模板中更多是完整工业软件平台的预留位。当前课程设计版本并未实现 STEP、IGES、DWG、DXF、glTF 等格式转换 Worker，也未接入异步任务队列。

因此本节建议在最终报告中写为“扩展设计说明”，主要阐述后续思路：

- 通过独立 Worker 处理格式导入导出与重计算任务。
- 通过任务队列减少主协同服务压力。
- 为未来接入工业几何内核与复杂格式解析做准备。

### 5.4 协同房间状态管理模块

房间状态管理模块是后端的核心之一，负责：

- 根据 `roomId` 隔离不同项目空间。
- 维护当前房间对象状态。
- 维护在线用户列表。
- 处理保存前的状态聚合与替换。

前端发起的新增、修改、删除等操作，会被服务端更新到当前房间状态，并广播给同房间其他客户端，实现多人协同可见。

### 5.5 Undo/Redo 与冲突策略说明

Undo/Redo 由前端本地历史栈维护，后端不承担复杂操作回放责任。该方案的优势是前端实现直接、交互即时，适合课程设计规模。

协同冲突处理采用最后写入优先（Last Write Wins）策略，即当多个客户端短时间内修改同一对象时，以最新广播到达的状态覆盖旧状态。该策略虽然简化，但在本地教学演示环境下具有足够稳定性。

配图建议：使用 [undo-redo-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/undo-redo-proof.png)。

### 5.6 协同消息推送服务模块

WebSocket 服务负责广播以下类型的消息：

- `join-room`
- `room-state`
- `operation`
- `cursor`
- `presence`
- `save-result`

其中 `operation` 消息中包含 `add`、`update`、`delete`、`replace-state` 等具体操作类型。该消息模型足够支撑当前协同功能，也为未来扩展更细粒度协同协议提供了基础。

### 5.7 智能辅助建模服务预留设计

为了在课程设计中体现一定创新性，系统已经实现了一个轻量级 Smart Assist 入口。用户可以输入简单自然语言命令，例如创建带有尺寸参数的 Box，系统会通过规则解析器转换为对象创建动作。

当前该功能不依赖外部 AI 服务，因此部署简单、可控性高。未来可以在此基础上接入大语言模型，实现更复杂的参数推荐、命令纠错、特征链建议等功能。

配图建议：使用 [smart-assist-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/smart-assist-proof.png)。

### 5.8 数据库与缓存详细设计

当前课程版系统未接入 PostgreSQL、Redis 或对象存储，而是使用本地 JSON 文件完成持久化。为保证报告完整性，本节建议采用“当前实现 + 扩展方向”的写法：

- 当前实现：
  - JSON 主文件保存当前状态
  - 版本快照目录保存历史记录
- 扩展方向：
  - PostgreSQL 存储项目元数据与对象索引
  - Redis 存储在线房间会话和热点协同状态
  - OBS/S3 类对象存储保存大模型文件与导出文件

## 6 系统测试与运行验证

### 6.1 本地运行验证

系统要求 Node.js 18 及以上。前后端运行方式如下：

- 后端：`npm install && npm run dev`
- 前端：`npm install && npm run dev`

验证结果表明，前端可在 `http://localhost:5173` 启动，后端可在 `http://localhost:3001` 启动，WebSocket 可在 `ws://localhost:3001/ws` 正常建立连接。

### 6.2 核心功能测试项

本项目重点验证以下功能：

1. 双窗口进入同一房间后，新增 Box/Cylinder 可实时同步。
2. 对对象尺寸和位置的修改可实时同步。
3. Save 后可生成项目 JSON 与历史版本快照。
4. 刷新后可 Load 房间状态。
5. Undo/Redo 可完成本地历史回退与重做。
6. Extrude、Cut 和 Smart Assist 可完成演示级功能展示。

### 6.3 测试结果分析

测试表明，本系统已经形成较完整的课程设计交付闭环，主要体现在：

- 系统能稳定运行并顺利完成演示。
- 协同功能清晰直观，适合现场讲解。
- 存储与版本管理证据明确，便于展示工程完整性。
- 代码和文档结构清晰，有利于课程报告撰写。

系统当前不足主要包括：

- 未接入工业级几何内核。
- Cut 为简化实现。
- 冲突处理策略较简单。
- 未实现完整格式转换与数据库部署。

## 7 创新性与工程取舍分析

### 7.1 创新性体现

本项目的创新性主要体现在以下几个方面：

1. 在课程设计可控范围内完成了“协同 CAD + 版本管理 + 基础智能入口”的完整演示闭环。
2. 采用前端重计算、后端轻协同的方案，有效平衡了实现复杂度与展示效果。
3. 增加了 Smart Assist 自然语言辅助建模入口，增强了系统的人机交互特色。
4. 在文档与代码结构中预留了 OpenCASCADE/Wasm 与云端数据服务扩展接口，为进一步演进提供依据。

### 7.2 工程取舍说明

为了优先保证可交付性和演示稳定性，系统作出了以下工程取舍：

- 未追求工业级 B-Rep 内核与高精度布尔运算，而以 Three.js 几何体和简化 Cut 完成 MVP。
- 未引入 PostgreSQL、Redis、Docker 和远程部署，而采用本地 JSON 持久化。
- 未接入外部大模型 API，而采用本地规则解析完成 Smart Assist 演示。

这些取舍使系统更适合课程设计周期与本地答辩环境，也便于清楚说明“当前实现”和“未来扩展”的边界。

## 8 总结与展望

本文设计并实现了一个基于云协同思想的机械 CAD 系统 MVP。系统完成了基础建模、草图表达、拉伸生成、实时协同、保存加载、版本快照、Undo/Redo 和轻量智能辅助建模等功能，达到了课程设计对“可运行、可演示、可说明”的核心要求。

后续可以从以下方向继续扩展：

1. 接入 OpenCASCADE/Wasm，增强工业级几何求解能力。
2. 引入 PostgreSQL、Redis 与对象存储，提升项目管理和数据持久化能力。
3. 增强格式导入导出能力，支持更丰富的 CAD 数据互操作。
4. 引入更强的 AI 辅助设计能力，实现命令理解、参数推荐和约束提示。

总体来看，本系统在课程设计范围内实现了较好的工程完整性、展示可用性与扩展可讲解性，为后续进一步演进为更完整的协同 CAD 平台打下了基础。

## 10 系统成果演示

这一章可以直接使用现有截图材料组织：

1. 主界面展示：使用 [cad-workspace-demo.png](/Users/cathy/code/caohua/cad-collab/docs/images/cad-workspace-demo.png) 展示完整 CAD 工作区。
2. 双窗口协同展示：使用 [collab-sync-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/collab-sync-proof.png) 展示同房间实时同步。
3. 拉伸建模展示：使用 [extrude-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/extrude-proof.png) 展示草图到三维实体的生成过程。
4. 版本管理展示：使用 [version-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/version-proof.png) 展示 Save 与版本快照。
5. 撤销重做展示：使用 [undo-redo-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/undo-redo-proof.png) 展示操作历史控制。
6. 智能辅助展示：使用 [smart-assist-proof.png](/Users/cathy/code/caohua/cad-collab/docs/images/smart-assist-proof.png) 展示自然语言辅助建模入口。

建议在 Word 最终稿中按“功能描述 + 截图说明 + 结果总结”的三行结构逐项排版，这样最贴近老师模板的演示章节要求。
