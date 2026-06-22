export type CADObjectType =
  | 'box'
  | 'cylinder'
  | 'sphere'
  | 'sketch-line'
  | 'sketch-circle'
  | 'sketch-rectangle'
  | 'extrude'
  | 'cut';

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface CADObject {
  id: string;
  name: string;
  type: CADObjectType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  position: Vector3Like;
  rotation: Vector3Like;
  color: string;
  params: Record<string, number | string | boolean | null>;
  sourceSketchId?: string;
  targetId?: string;
  note?: string;
}

export interface RoomUser {
  userId: string;
  username: string;
  color: string;
  joinedAt: string;
}

export interface CursorState {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
  updatedAt: string;
}

export interface RoomState {
  roomId: string;
  objects: CADObject[];
  users: RoomUser[];
  cursors: CursorState[];
  updatedAt: string;
  savedAt?: string;
}

export interface ProjectVersion {
  id: string;
  createdAt: string;
  roomId: string;
  objectCount: number;
}

export interface SessionInfo {
  userId: string;
  username: string;
  roomId: string;
  color: string;
}

export interface RoomOperation {
  type: 'add' | 'update' | 'delete' | 'select' | 'cursor' | 'replace-state';
  roomId: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export type ServerMessage =
  | { type: 'joined'; payload: { roomId: string; userId: string } }
  | { type: 'room-state'; payload: RoomState }
  | { type: 'operation'; payload: RoomOperation }
  | { type: 'presence'; payload: { roomId: string; users: RoomUser[] } }
  | { type: 'cursor'; payload: CursorState }
  | { type: 'error'; payload: { message: string } };
