import { loadRoomState } from './storage';
import { CADObject, CursorState, RoomOperation, RoomState, RoomUser } from './types';

export interface LiveRoom {
  state: RoomState;
  sockets: Set<unknown>;
}

const rooms = new Map<string, LiveRoom>();

function emptyRoom(roomId: string): RoomState {
  return {
    roomId,
    objects: [],
    users: [],
    cursors: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function getOrCreateRoom(roomId: string) {
  const existing = rooms.get(roomId);
  if (existing) {
    return existing;
  }

  const persisted = await loadRoomState(roomId);
  const room: LiveRoom = {
    state: persisted ?? emptyRoom(roomId),
    sockets: new Set(),
  };
  rooms.set(roomId, room);
  return room;
}

export function removeSocket(roomId: string, socket: unknown) {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  room.sockets.delete(socket);
}

export function upsertUser(room: LiveRoom, user: RoomUser) {
  const users = room.state.users.filter((existing) => existing.userId !== user.userId);
  users.push(user);
  room.state.users = users.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}

export function removeUser(room: LiveRoom, userId: string) {
  room.state.users = room.state.users.filter((user) => user.userId !== userId);
  room.state.cursors = room.state.cursors.filter((cursor) => cursor.userId !== userId);
}

export function upsertCursor(room: LiveRoom, cursor: CursorState) {
  const next = room.state.cursors.filter((item) => item.userId !== cursor.userId);
  next.push(cursor);
  room.state.cursors = next;
}

function replaceObject(objects: CADObject[], target: CADObject) {
  const filtered = objects.filter((item) => item.id !== target.id);
  filtered.push(target);
  return filtered;
}

export function applyOperation(room: LiveRoom, operation: RoomOperation) {
  const { payload, type } = operation;

  // Conflict strategy for this MVP: last write wins based on the latest received update.
  if (type === 'add' || type === 'update') {
    const object = payload.object as CADObject | undefined;
    if (object) {
      room.state.objects = replaceObject(room.state.objects, object);
    }
  }

  if (type === 'delete') {
    const objectId = payload.objectId as string | undefined;
    if (objectId) {
      room.state.objects = room.state.objects.filter((item) => item.id !== objectId);
    }
  }

  if (type === 'replace-state') {
    const objects = payload.objects as CADObject[] | undefined;
    if (objects) {
      room.state.objects = objects;
    }
  }

  room.state.updatedAt = operation.timestamp;
}

export function updateRoomState(room: LiveRoom, state: RoomState) {
  room.state = {
    ...state,
    users: room.state.users,
    cursors: room.state.cursors,
  };
}
