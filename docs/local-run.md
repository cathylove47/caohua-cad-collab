# 本地运行说明

## 1. 环境要求

- macOS
- Node.js 18 或以上
- npm 可用

建议先检查：

```bash
node -v
npm -v
```

## 2. 前端环境变量

文件：

- [frontend/.env.example](/Users/cathy/code/caohua/cad-collab/frontend/.env.example)

默认值：

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
```

如果需要自定义，可复制为 `.env.local` 后修改。

## 3. 后端环境变量

文件：

- [backend/.env.example](/Users/cathy/code/caohua/cad-collab/backend/.env.example)

默认值：

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## 4. 安装与启动

### 4.1 启动后端

```bash
cd /Users/cathy/code/caohua/cad-collab/backend
npm install
npm run dev
```

默认监听：

- `http://localhost:3001`

### 4.2 启动前端

```bash
cd /Users/cathy/code/caohua/cad-collab/frontend
npm install
npm run dev
```

默认地址：

- `http://localhost:5173`

## 5. 演示建议流程

1. 启动后端
2. 启动前端
3. 打开两个浏览器窗口访问前端地址
4. 分别输入两个用户名和同一个房间号
5. 演示建模、修改、光标、保存、恢复版本

## 6. 常见问题

### 6.1 端口被占用

表现：

- 前端或后端启动时报端口冲突

处理：

- 关闭占用进程
- 或者修改端口并同步修改前端环境变量

### 6.2 页面打不开

检查：

- 后端是否已启动
- 前端是否已启动
- 浏览器是否访问 `http://localhost:5173`

### 6.3 协同不同步

检查：

- 两个窗口是否使用同一 `roomId`
- 浏览器控制台是否有 WebSocket 报错
- 后端终端是否正常运行

### 6.4 Save 后刷新没有内容

检查：

- 是否先点击过 `Save`
- 刷新后是否重新进入同一个房间
- 是否点击 `Load`

### 6.5 版本列表为空

原因：

- 没有执行过保存

处理：

- 先点击 `Save`
- 再点击右侧 `Refresh Versions`

## 7. 本项目的边界

当前版本是课程设计 MVP：

- 不依赖 Docker
- 不依赖数据库
- 不依赖 OpenCASCADE/Wasm
- 重点保证本地稳定运行与功能可演示

后续如需扩展，可继续对接：

- OpenCASCADE/Wasm
- PostgreSQL
- OBS
- JWT
- 华为云部署
