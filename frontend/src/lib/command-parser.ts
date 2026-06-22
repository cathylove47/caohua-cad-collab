import type { CADObject, CADObjectType, SessionInfo } from '../types';
import { createPrimitive } from './modeling';

type CommandResult =
  | { kind: 'create'; object: CADObject; message: string }
  | { kind: 'error'; message: string };

function setNumericParams(object: CADObject, overrides: Record<string, number>) {
  object.params = {
    ...object.params,
    ...overrides,
  };
}

function normalizeInput(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[，,]/g, ' ')
    .replace(/[：:]/g, ' ')
    .replace(/\s+/g, ' ');
}

function readNumber(normalized: string, labels: string[]) {
  for (const label of labels) {
    const match = normalized.match(new RegExp(`${label}\\s*(-?\\d+(?:\\.\\d+)?)`));
    if (match) {
      return Number(match[1]);
    }
  }
  return null;
}

function detectType(normalized: string): CADObjectType | null {
  if (/(box|立方体|长方体|方块)/.test(normalized)) {
    return 'box';
  }
  if (/(cylinder|圆柱)/.test(normalized)) {
    return 'cylinder';
  }
  if (/(cone|圆锥|锥体)/.test(normalized)) {
    return 'cone';
  }
  if (/(sphere|球体|球)/.test(normalized)) {
    return 'sphere';
  }
  if (/(rectangle|矩形|草图矩形)/.test(normalized)) {
    return 'sketch-rectangle';
  }
  if (/(circle|圆|草图圆)/.test(normalized)) {
    return 'sketch-circle';
  }
  if (/(line|直线|线段)/.test(normalized)) {
    return 'sketch-line';
  }
  return null;
}

export function parseSmartCommand(input: string, session: SessionInfo, objects: CADObject[]): CommandResult {
  const normalized = normalizeInput(input);
  if (!normalized) {
    return { kind: 'error', message: '请输入建模命令，例如 “创建 box width 4 height 2 depth 3”。' };
  }

  const type = detectType(normalized);
  if (!type) {
    return {
      kind: 'error',
      message: '暂未识别该命令。可尝试 box、cylinder、cone、sphere、rectangle、circle、line。',
    };
  }

  const object = createPrimitive(type, session, objects);

  if (type === 'box') {
    const width = readNumber(normalized, ['width', '长', '宽']);
    const height = readNumber(normalized, ['height', '高']);
    const depth = readNumber(normalized, ['depth', '深']);
    setNumericParams(object, {
      width: width ?? Number(object.params.width),
      height: height ?? Number(object.params.height),
      depth: depth ?? Number(object.params.depth),
    });
  }

  if (type === 'cylinder') {
    const radius = readNumber(normalized, ['radius', '半径']);
    const height = readNumber(normalized, ['height', '高']);
    setNumericParams(object, {
      radius: radius ?? Number(object.params.radius),
      height: height ?? Number(object.params.height),
    });
  }

  if (type === 'cone') {
    const radius = readNumber(normalized, ['radius', '底面半径', '半径']);
    const height = readNumber(normalized, ['height', '高']);
    const radialSegments = readNumber(normalized, ['segments', '边数', '分段']);
    setNumericParams(object, {
      radius: radius ?? Number(object.params.radius),
      height: height ?? Number(object.params.height),
      radialSegments: radialSegments ?? Number(object.params.radialSegments),
    });
  }

  if (type === 'sphere') {
    const radius = readNumber(normalized, ['radius', '半径']);
    setNumericParams(object, {
      radius: radius ?? Number(object.params.radius),
    });
  }

  if (type === 'sketch-rectangle') {
    const width = readNumber(normalized, ['width', '宽']);
    const height = readNumber(normalized, ['height', '高']);
    setNumericParams(object, {
      width: width ?? Number(object.params.width),
      height: height ?? Number(object.params.height),
    });
  }

  if (type === 'sketch-circle') {
    const radius = readNumber(normalized, ['radius', '半径']);
    setNumericParams(object, {
      radius: radius ?? Number(object.params.radius),
    });
  }

  return {
    kind: 'create',
    object,
    message: `Smart command created ${object.name}.`,
  };
}
