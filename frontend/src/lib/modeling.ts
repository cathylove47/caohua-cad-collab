import { v4 as uuidv4 } from 'uuid';
import type { CADObject, CADObjectType, SessionInfo } from '../types';

const defaultsByType: Record<CADObjectType, Record<string, number | string | boolean | null>> = {
  box: { width: 2, height: 1.5, depth: 2 },
  cylinder: { radius: 1, height: 2 },
  sphere: { radius: 1.2 },
  'sketch-line': { x1: -1, z1: 0, x2: 1, z2: 0 },
  'sketch-circle': { radius: 1.2 },
  'sketch-rectangle': { width: 2.5, height: 1.8 },
  extrude: { depth: 2 },
  cut: { width: 1.2, height: 1.2, depth: 1.2 },
};

export function cloneObjects<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nextName(type: CADObjectType, objects: CADObject[]) {
  const prefixMap: Record<CADObjectType, string> = {
    box: 'Box',
    cylinder: 'Cylinder',
    sphere: 'Sphere',
    'sketch-line': 'Line',
    'sketch-circle': 'Circle',
    'sketch-rectangle': 'Rectangle',
    extrude: 'Extrude',
    cut: 'Cut',
  };
  const prefix = prefixMap[type];
  const count = objects.filter((item) => item.type === type).length + 1;
  return `${prefix}${count}`;
}

export function createPrimitive(type: CADObjectType, session: SessionInfo, objects: CADObject[]): CADObject {
  const timestamp = new Date().toISOString();
  return {
    id: uuidv4(),
    name: nextName(type, objects),
    type,
    createdBy: session.username,
    createdAt: timestamp,
    updatedAt: timestamp,
    position: { x: 0, y: type.startsWith('sketch') ? 0 : 0.75, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    color: session.color,
    params: cloneObjects(defaultsByType[type]),
  };
}

export function createExtrudeFromSketch(sketch: CADObject, session: SessionInfo, objects: CADObject[]): CADObject {
  const extrude = createPrimitive('extrude', session, objects);
  extrude.position = { ...sketch.position, y: 0 };
  extrude.rotation = { ...sketch.rotation };
  extrude.sourceSketchId = sketch.id;
  extrude.note = `Generated from ${sketch.name}`;
  return extrude;
}

export function createCutMarker(target: CADObject, session: SessionInfo, objects: CADObject[]): CADObject {
  const cut = createPrimitive('cut', session, objects);
  cut.position = { ...target.position };
  cut.position.x += 0.6;
  cut.targetId = target.id;
  cut.note = 'Simplified cut marker. MVP uses visual subtraction hint instead of full solid boolean.';
  return cut;
}
