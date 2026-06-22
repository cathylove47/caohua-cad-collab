import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { USER_COLORS, WS_URL } from '../config';
import { parseSmartCommand } from '../lib/command-parser';
import { cloneObjects, createCutMarker, createExtrudeFromSketch, createPrimitive } from '../lib/modeling';
import { fetchPersistedRoomState, fetchRoomState, fetchRoomVersions, restoreRoomVersion, saveCurrentRoomState } from '../services/api';
import type {
  CADObject,
  CADObjectType,
  CursorState,
  ProjectVersion,
  RoomOperation,
  RoomState,
  RoomUser,
  ServerMessage,
  SessionInfo,
  TransformMode,
} from '../types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface LoginForm {
  username: string;
  roomId: string;
}

interface CadStore {
  session: SessionInfo | null;
  loginForm: LoginForm;
  connectionStatus: ConnectionStatus;
  transformMode: TransformMode;
  objects: CADObject[];
  users: RoomUser[];
  cursors: CursorState[];
  selectedId: string | null;
  versions: ProjectVersion[];
  notice: string;
  historyPast: CADObject[][];
  historyFuture: CADObject[][];
  smartCommand: string;
  setLoginForm: (patch: Partial<LoginForm>) => void;
  setSmartCommand: (value: string) => void;
  setTransformMode: (mode: TransformMode) => void;
  connectSession: () => Promise<void>;
  disconnectSession: () => void;
  addObject: (type: CADObjectType) => void;
  extrudeSelected: () => void;
  cutSelected: () => void;
  selectObject: (id: string | null, broadcast?: boolean) => void;
  updateSelectedProperty: (scope: 'position' | 'rotation' | 'scale' | 'params', key: string, value: number | string) => void;
  commitViewportTransform: (objectId: string, transform: Pick<CADObject, 'position' | 'rotation' | 'scale'>) => void;
  deleteSelected: () => void;
  saveProject: () => Promise<void>;
  loadProject: () => Promise<void>;
  loadVersions: () => Promise<void>;
  restoreProjectVersion: (versionId: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
  sendCursor: (x: number, y: number) => void;
  runSmartCommand: () => void;
}

let socket: WebSocket | null = null;

function buildSession(form: LoginForm): SessionInfo {
  const base = `${form.username.trim()}-${form.roomId.trim()}`;
  const color = USER_COLORS[Math.abs(base.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % USER_COLORS.length];
  return {
    userId: uuidv4(),
    username: form.username.trim(),
    roomId: form.roomId.trim(),
    color,
  };
}

function makeOperation(session: SessionInfo, type: RoomOperation['type'], payload: Record<string, unknown>): RoomOperation {
  return {
    type,
    roomId: session.roomId,
    actorId: session.userId,
    actorName: session.username,
    timestamp: new Date().toISOString(),
    payload,
  };
}

function persistSession(session: SessionInfo | null) {
  if (session) {
    localStorage.setItem(
      'cad-collab-login-form',
      JSON.stringify({ username: session.username, roomId: session.roomId } satisfies LoginForm),
    );
  }
}

function readPersistedLoginForm() {
  const raw = localStorage.getItem('cad-collab-login-form');
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LoginForm;
  } catch (_error) {
    return null;
  }
}

function replaceObject(objects: CADObject[], nextObject: CADObject) {
  const filtered = objects.filter((item) => item.id !== nextObject.id);
  filtered.push(nextObject);
  return filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function withNormalizedScale(object: CADObject): CADObject {
  return {
    ...object,
    scale: object.scale ?? { x: 1, y: 1, z: 1 },
  };
}

function normalizeObjects(objects: CADObject[]) {
  return objects.map(withNormalizedScale);
}

function upsertCursor(cursors: CursorState[], cursor: CursorState) {
  const filtered = cursors.filter((item) => item.userId !== cursor.userId);
  filtered.push(cursor);
  return filtered;
}

function upsertUser(users: RoomUser[], user: RoomUser) {
  const filtered = users.filter((item) => item.userId !== user.userId);
  filtered.push(user);
  return filtered;
}

function sendMessage(message: unknown) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

const persisted = readPersistedLoginForm();

export const useCadStore = create<CadStore>((set, get) => ({
  session: null,
  loginForm: {
    username: persisted?.username ?? 'demo-user',
    roomId: persisted?.roomId ?? 'room-101',
  },
  connectionStatus: 'disconnected',
  transformMode: 'translate',
  objects: [],
  users: [],
  cursors: [],
  selectedId: null,
  versions: [],
  notice: 'Conflict policy: last write wins in the latest received operation.',
  historyPast: [],
  historyFuture: [],
  smartCommand: '创建 box width 4 height 2 depth 3',

  setLoginForm: (patch) => {
    set((state) => ({ loginForm: { ...state.loginForm, ...patch } }));
  },

  setSmartCommand: (value) => {
    set({ smartCommand: value });
  },

  setTransformMode: (mode) => {
    set({ transformMode: mode, notice: `Transform mode switched to ${mode}.` });
  },

  connectSession: async () => {
    const active = get().session ?? buildSession(get().loginForm);
    if (!active.username || !active.roomId) {
      set({ notice: '请输入用户名和房间号。' });
      return;
    }

    persistSession(active);
    set({ session: active, connectionStatus: 'connecting', notice: 'Connecting to collaborative room...' });
    const state = await fetchRoomState(active.roomId);
    set({
      objects: normalizeObjects(state.objects),
      users: state.users,
      cursors: state.cursors.filter((item) => item.userId !== active.userId),
      selectedId: null,
      historyPast: [],
      historyFuture: [],
    });

    socket?.close();
    socket = new WebSocket(WS_URL);

    socket.addEventListener('open', () => {
      set({ connectionStatus: 'connected', notice: `Connected to ${active.roomId}.` });
      sendMessage({
        type: 'join',
        payload: {
          roomId: active.roomId,
          userId: active.userId,
          username: active.username,
          color: active.color,
        },
      });
      sendMessage({
        type: 'cursor',
        payload: {
          roomId: active.roomId,
          userId: active.userId,
          username: active.username,
          color: active.color,
          x: 0.5,
          y: 0.5,
        },
      });
    });

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data) as ServerMessage;
      const current = get().session;
      if (message.type === 'room-state') {
        set({
          objects: normalizeObjects(message.payload.objects),
          users: message.payload.users,
          cursors: message.payload.cursors.filter((item) => item.userId !== current?.userId),
        });
      }
      if (message.type === 'presence') {
        set({ users: message.payload.users });
      }
      if (message.type === 'cursor' && message.payload.userId !== current?.userId) {
        set({
          cursors: upsertCursor(get().cursors, message.payload),
          users: upsertUser(get().users, {
            userId: message.payload.userId,
            username: message.payload.username,
            color: message.payload.color,
            joinedAt: message.payload.updatedAt,
          }),
        });
      }
      if (message.type === 'operation') {
        const currentObjects = cloneObjects(get().objects);
        if (message.payload.type === 'add' || message.payload.type === 'update') {
          const object = withNormalizedScale(message.payload.payload.object as CADObject);
          set({ objects: replaceObject(currentObjects, object) });
        }
        if (message.payload.type === 'delete') {
          const objectId = message.payload.payload.objectId as string;
          set({ objects: currentObjects.filter((item) => item.id !== objectId) });
        }
        if (message.payload.type === 'replace-state') {
          const nextObjects = normalizeObjects(message.payload.payload.objects as CADObject[]);
          set({ objects: nextObjects, selectedId: null });
        }
      }
      if (message.type === 'error') {
        set({ connectionStatus: 'error', notice: message.payload.message });
      }
    });

    socket.addEventListener('close', () => {
      set({ connectionStatus: 'disconnected' });
    });

    socket.addEventListener('error', () => {
      set({ connectionStatus: 'error', notice: 'WebSocket connection error.' });
    });

    await get().loadVersions();
  },

  disconnectSession: () => {
    socket?.close();
    socket = null;
    set({
      session: null,
      connectionStatus: 'disconnected',
      objects: [],
      users: [],
      cursors: [],
      selectedId: null,
      versions: [],
      historyPast: [],
      historyFuture: [],
      transformMode: 'translate',
      notice: 'Session cleared.',
    });
  },

  addObject: (type) => {
    const session = get().session;
    if (!session) {
      return;
    }
    const object = createPrimitive(type, session, get().objects);
    const previous = cloneObjects(get().objects);
    const nextObjects = replaceObject(previous, object);
    set({
      objects: nextObjects,
      selectedId: object.id,
      historyPast: [...get().historyPast, previous],
      historyFuture: [],
    });
    sendMessage({ type: 'operation', payload: makeOperation(session, 'add', { object }) });
  },

  extrudeSelected: () => {
    const session = get().session;
    const selected = get().objects.find((item) => item.id === get().selectedId);
    if (!session || !selected || !['sketch-rectangle', 'sketch-circle'].includes(selected.type)) {
      set({ notice: '请选择 Rectangle 或 Circle 草图后再执行 Extrude。' });
      return;
    }
    const object = createExtrudeFromSketch(selected, session, get().objects);
    const previous = cloneObjects(get().objects);
    const nextObjects = replaceObject(previous, object);
    set({
      objects: nextObjects,
      selectedId: object.id,
      historyPast: [...get().historyPast, previous],
      historyFuture: [],
      notice: `Extrude created from ${selected.name}.`,
    });
    sendMessage({ type: 'operation', payload: makeOperation(session, 'add', { object }) });
  },

  cutSelected: () => {
    const session = get().session;
    const selected = get().objects.find((item) => item.id === get().selectedId);
    if (!session || !selected || selected.type.startsWith('sketch')) {
      set({ notice: '请选择一个 3D 实体后再执行 Cut。' });
      return;
    }
    const object = createCutMarker(selected, session, get().objects);
    const previous = cloneObjects(get().objects);
    const nextObjects = replaceObject(previous, object);
    set({
      objects: nextObjects,
      selectedId: object.id,
      historyPast: [...get().historyPast, previous],
      historyFuture: [],
      notice: 'Cut is implemented as a simplified visual marker for demo stability.',
    });
    sendMessage({ type: 'operation', payload: makeOperation(session, 'add', { object }) });
  },

  selectObject: (id, broadcast = true) => {
    set({ selectedId: id });
    const session = get().session;
    if (broadcast && session && id) {
      sendMessage({ type: 'operation', payload: makeOperation(session, 'select', { objectId: id }) });
    }
  },

  updateSelectedProperty: (scope, key, value) => {
    const session = get().session;
    const selected = get().objects.find((item) => item.id === get().selectedId);
    if (!session || !selected) {
      return;
    }
    const previous = cloneObjects(get().objects);
    const updated: CADObject = {
      ...selected,
      updatedAt: new Date().toISOString(),
      [scope]: {
        ...(scope === 'scale' ? selected.scale ?? { x: 1, y: 1, z: 1 } : selected[scope]),
        [key]: typeof value === 'string' && value !== '' && !Number.isNaN(Number(value)) ? Number(value) : value,
      },
    };
    const nextObjects = replaceObject(previous, updated);
    set({
      objects: nextObjects,
      historyPast: [...get().historyPast, previous],
      historyFuture: [],
    });
    sendMessage({ type: 'operation', payload: makeOperation(session, 'update', { object: updated }) });
  },

  commitViewportTransform: (objectId, transform) => {
    const session = get().session;
    const selected = get().objects.find((item) => item.id === objectId);
    if (!session || !selected) {
      return;
    }
    const previous = cloneObjects(get().objects);
    const updated: CADObject = {
      ...selected,
      updatedAt: new Date().toISOString(),
      position: transform.position,
      rotation: transform.rotation,
      scale: transform.scale ?? selected.scale ?? { x: 1, y: 1, z: 1 },
    };
    const nextObjects = replaceObject(previous, updated);
    set({
      objects: nextObjects,
      historyPast: [...get().historyPast, previous],
      historyFuture: [],
      notice: `${updated.name} transform updated in ${get().transformMode} mode.`,
    });
    sendMessage({ type: 'operation', payload: makeOperation(session, 'update', { object: updated }) });
  },

  deleteSelected: () => {
    const session = get().session;
    const selectedId = get().selectedId;
    if (!session || !selectedId) {
      return;
    }
    const previous = cloneObjects(get().objects);
    set({
      objects: previous.filter((item) => item.id !== selectedId),
      selectedId: null,
      historyPast: [...get().historyPast, previous],
      historyFuture: [],
    });
    sendMessage({ type: 'operation', payload: makeOperation(session, 'delete', { objectId: selectedId }) });
  },

  saveProject: async () => {
    const session = get().session;
    if (!session) {
      return;
    }
    const payload: RoomState = {
      roomId: session.roomId,
      objects: get().objects,
      users: get().users,
      cursors: get().cursors,
      updatedAt: new Date().toISOString(),
    };
    await saveCurrentRoomState(session.roomId, payload);
    await get().loadVersions();
    set({ notice: 'Project state saved with a version snapshot.' });
  },

  loadProject: async () => {
    const session = get().session;
    if (!session) {
      return;
    }
    const state = await fetchRoomState(session.roomId);
    const persisted = await fetchPersistedRoomState(session.roomId);
    // "Load" intentionally restores the last saved snapshot rather than transient room memory.
    set({
      objects: normalizeObjects(persisted.objects),
      users: state.users,
      cursors: state.cursors.filter((item) => item.userId !== session.userId),
      selectedId: null,
      notice: 'Project state loaded from saved backend JSON.',
    });
  },

  loadVersions: async () => {
    const session = get().session;
    if (!session) {
      return;
    }
    const versions = await fetchRoomVersions(session.roomId);
    set({ versions });
  },

  restoreProjectVersion: async (versionId) => {
    const session = get().session;
    if (!session) {
      return;
    }
    const state = await restoreRoomVersion(session.roomId, versionId);
    set({
      objects: normalizeObjects(state.objects),
      selectedId: null,
      notice: `Restored version ${versionId}.`,
    });
    await get().loadVersions();
  },

  undo: () => {
    const session = get().session;
    const past = get().historyPast;
    if (!session || past.length === 0) {
      return;
    }
    const previous = past[past.length - 1];
    const current = cloneObjects(get().objects);
    set({
      objects: previous,
      selectedId: null,
      historyPast: past.slice(0, -1),
      historyFuture: [current, ...get().historyFuture],
      notice: 'Undo applied locally and broadcast as room snapshot.',
    });
    sendMessage({ type: 'operation', payload: makeOperation(session, 'replace-state', { objects: previous }) });
  },

  redo: () => {
    const session = get().session;
    const future = get().historyFuture;
    if (!session || future.length === 0) {
      return;
    }
    const next = future[0];
    const current = cloneObjects(get().objects);
    set({
      objects: next,
      selectedId: null,
      historyPast: [...get().historyPast, current],
      historyFuture: future.slice(1),
      notice: 'Redo applied locally and broadcast as room snapshot.',
    });
    sendMessage({ type: 'operation', payload: makeOperation(session, 'replace-state', { objects: next }) });
  },

  sendCursor: (x, y) => {
    const session = get().session;
    if (!session) {
      return;
    }
    sendMessage({
      type: 'cursor',
      payload: {
        roomId: session.roomId,
        userId: session.userId,
        username: session.username,
        color: session.color,
        x,
        y,
      },
    });
  },

  runSmartCommand: () => {
    const session = get().session;
    if (!session) {
      return;
    }

    const result = parseSmartCommand(get().smartCommand, session, get().objects);
    if (result.kind === 'error') {
      set({ notice: result.message });
      return;
    }

    const previous = cloneObjects(get().objects);
    const nextObjects = replaceObject(previous, result.object);
    set({
      objects: nextObjects,
      selectedId: result.object.id,
      historyPast: [...get().historyPast, previous],
      historyFuture: [],
      notice: `${result.message} This is a lightweight AI-inspired command parser for demo innovation.`,
    });
    sendMessage({ type: 'operation', payload: makeOperation(session, 'add', { object: result.object }) });
  },
}));
