import fs from 'node:fs/promises';
import path from 'node:path';
import { ProjectVersion, RoomState } from './types';

const dataRoot = path.resolve(process.cwd(), 'data', 'projects');

async function ensureRoomDirs(roomId: string) {
  const roomDir = path.join(dataRoot, roomId);
  const versionDir = path.join(roomDir, 'versions');
  await fs.mkdir(versionDir, { recursive: true });
  return { roomDir, versionDir };
}

function roomFile(roomId: string) {
  return path.join(dataRoot, `${roomId}.json`);
}

export async function loadRoomState(roomId: string): Promise<RoomState | null> {
  try {
    const raw = await fs.readFile(roomFile(roomId), 'utf8');
    const parsed = JSON.parse(raw) as RoomState;
    return {
      ...parsed,
      users: [],
      cursors: [],
    };
  } catch (error) {
    return null;
  }
}

export async function loadPersistedRoomState(roomId: string): Promise<RoomState | null> {
  return loadRoomState(roomId);
}

export async function saveRoomState(state: RoomState) {
  const timestamp = new Date().toISOString();
  const stateWithSave = {
    ...state,
    users: [],
    cursors: [],
    savedAt: timestamp,
    updatedAt: timestamp,
  };
  const { versionDir } = await ensureRoomDirs(state.roomId);
  await fs.mkdir(dataRoot, { recursive: true });
  await fs.writeFile(roomFile(state.roomId), JSON.stringify(stateWithSave, null, 2), 'utf8');
  await fs.writeFile(
    path.join(versionDir, `${timestamp.replaceAll(':', '-')}.json`),
    JSON.stringify(stateWithSave, null, 2),
    'utf8',
  );
  return stateWithSave;
}

export async function listVersions(roomId: string): Promise<ProjectVersion[]> {
  const { versionDir } = await ensureRoomDirs(roomId);
  const entries = await fs.readdir(versionDir);
  const versions = await Promise.all(
    entries
      .filter((entry) => entry.endsWith('.json'))
      .map(async (entry) => {
        const raw = await fs.readFile(path.join(versionDir, entry), 'utf8');
        const parsed = JSON.parse(raw) as RoomState;
        return {
          id: entry.replace(/\.json$/, ''),
          createdAt: parsed.savedAt ?? parsed.updatedAt,
          roomId,
          objectCount: parsed.objects.length,
        } satisfies ProjectVersion;
      }),
  );

  return versions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
}

export async function restoreVersion(roomId: string, versionId: string): Promise<RoomState> {
  const versionPath = path.join(dataRoot, roomId, 'versions', `${versionId}.json`);
  const raw = await fs.readFile(versionPath, 'utf8');
  const state = JSON.parse(raw) as RoomState;
  const restored = {
    ...state,
    users: [],
    cursors: [],
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(roomFile(roomId), JSON.stringify(restored, null, 2), 'utf8');
  return restored;
}
