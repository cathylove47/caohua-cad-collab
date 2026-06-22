# API 与消息协议

## 1. HTTP API

后端默认地址：

- `http://localhost:3001`

### 1.1 健康检查

- `GET /api/health`

响应示例：

```json
{
  "ok": true,
  "service": "cad-collab-backend"
}
```

### 1.2 获取房间状态

- `GET /api/rooms/:roomId/state`

说明：

- 获取当前房间的实时内存状态
- 主要用于协同房间初始化和多人同步

### 1.3 获取已保存状态

- `GET /api/rooms/:roomId/persisted`

说明：

- 获取磁盘上最近一次 `Save` 的 JSON 状态
- 前端 `Load` 按钮使用该接口恢复已保存版本

### 1.4 保存房间状态

- `POST /api/rooms/:roomId/save`

请求体示例：

```json
{
  "roomId": "room-101",
  "objects": [],
  "users": [],
  "cursors": [],
  "updatedAt": "2026-06-22T10:00:00.000Z"
}
```

效果：

- 保存当前房间 JSON
- 生成时间戳版本快照

### 1.5 获取版本列表

- `GET /api/rooms/:roomId/versions`

响应示例：

```json
{
  "versions": [
    {
      "id": "2026-06-22T10-00-00.000Z",
      "createdAt": "2026-06-22T10:00:00.000Z",
      "roomId": "room-101",
      "objectCount": 4
    }
  ]
}
```

### 1.6 恢复版本

- `POST /api/rooms/:roomId/restore/:versionId`

效果：

- 用指定版本覆盖当前房间 JSON
- 广播最新 `room-state`

## 2. WebSocket

默认地址：

- `ws://localhost:3001/ws`

## 3. Client -> Server 消息

### 3.1 join

```json
{
  "type": "join",
  "payload": {
    "roomId": "room-101",
    "userId": "uuid",
    "username": "alice",
    "color": "#0ea5e9"
  }
}
```

### 3.2 operation

```json
{
  "type": "operation",
  "payload": {
    "type": "add",
    "roomId": "room-101",
    "actorId": "uuid",
    "actorName": "alice",
    "timestamp": "2026-06-22T10:00:00.000Z",
    "payload": {
      "object": {}
    }
  }
}
```

支持的 `operation.type`：

- `add`
- `update`
- `delete`
- `select`
- `cursor`
- `replace-state`

### 3.3 cursor

```json
{
  "type": "cursor",
  "payload": {
    "roomId": "room-101",
    "userId": "uuid",
    "username": "alice",
    "color": "#0ea5e9",
    "x": 0.43,
    "y": 0.28
  }
}
```

## 4. Server -> Client 消息

### 4.1 joined

```json
{
  "type": "joined",
  "payload": {
    "roomId": "room-101",
    "userId": "uuid"
  }
}
```

### 4.2 room-state

```json
{
  "type": "room-state",
  "payload": {
    "roomId": "room-101",
    "objects": [],
    "users": [],
    "cursors": [],
    "updatedAt": "2026-06-22T10:00:00.000Z"
  }
}
```

### 4.3 presence

```json
{
  "type": "presence",
  "payload": {
    "roomId": "room-101",
    "users": [
      {
        "userId": "uuid",
        "username": "alice",
        "color": "#0ea5e9",
        "joinedAt": "2026-06-22T10:00:00.000Z"
      }
    ]
  }
}
```

### 4.4 operation

```json
{
  "type": "operation",
  "payload": {
    "type": "update",
    "roomId": "room-101",
    "actorId": "uuid",
    "actorName": "alice",
    "timestamp": "2026-06-22T10:00:00.000Z",
    "payload": {
      "object": {}
    }
  }
}
```

### 4.5 cursor

```json
{
  "type": "cursor",
  "payload": {
    "userId": "uuid",
    "username": "bob",
    "color": "#f97316",
    "x": 0.54,
    "y": 0.47,
    "updatedAt": "2026-06-22T10:00:00.000Z"
  }
}
```

### 4.6 error

```json
{
  "type": "error",
  "payload": {
    "message": "Join a room first."
  }
}
```

## 5. 数据一致性策略

本 MVP 采用：

- 最后写入优先

原因：

- 协同链路简单
- 便于课程设计演示
- 减少并发控制复杂度

## 6. 扩展建议

- 使用操作序列号和服务器确认机制增强一致性
- 引入 OT / CRDT 改进多人编辑冲突处理
- 将房间和版本元数据迁移到 PostgreSQL
- 将模型资源与大文件迁移到 OBS
