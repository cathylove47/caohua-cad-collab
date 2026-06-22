import { API_BASE_URL } from '../config';
import type { ProjectVersion, RoomState } from '../types';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchRoomState(roomId: string) {
  return parseJson<RoomState>(await fetch(`${API_BASE_URL}/api/rooms/${roomId}/state`));
}

export async function fetchPersistedRoomState(roomId: string) {
  return parseJson<RoomState>(await fetch(`${API_BASE_URL}/api/rooms/${roomId}/persisted`));
}

export async function saveCurrentRoomState(roomId: string, state: RoomState) {
  return parseJson<RoomState>(
    await fetch(`${API_BASE_URL}/api/rooms/${roomId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }),
  );
}

export async function fetchRoomVersions(roomId: string) {
  const result = await parseJson<{ versions: ProjectVersion[] }>(
    await fetch(`${API_BASE_URL}/api/rooms/${roomId}/versions`),
  );
  return result.versions;
}

export async function restoreRoomVersion(roomId: string, versionId: string) {
  return parseJson<RoomState>(
    await fetch(`${API_BASE_URL}/api/rooms/${roomId}/restore/${versionId}`, { method: 'POST' }),
  );
}
