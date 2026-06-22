import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { useCadStore } from '../store/useCadStore';
import type { CADObject } from '../types';

function buildRenderable(object: CADObject, objects: CADObject[]) {
  const material = new THREE.MeshStandardMaterial({
    color: object.type === 'cut' ? '#ef4444' : object.color,
    transparent: object.type === 'cut',
    opacity: object.type === 'cut' ? 0.35 : 0.95,
  });

  if (object.type === 'box') {
    return new THREE.Mesh(
      new THREE.BoxGeometry(
        Number(object.params.width ?? 1),
        Number(object.params.height ?? 1),
        Number(object.params.depth ?? 1),
      ),
      material,
    );
  }

  if (object.type === 'cylinder') {
    return new THREE.Mesh(
      new THREE.CylinderGeometry(
        Number(object.params.radius ?? 1),
        Number(object.params.radius ?? 1),
        Number(object.params.height ?? 1),
        Number(object.params.radialSegments ?? 32),
      ),
      material,
    );
  }

  if (object.type === 'cone') {
    return new THREE.Mesh(
      new THREE.ConeGeometry(
        Number(object.params.radius ?? 1),
        Number(object.params.height ?? 1),
        Number(object.params.radialSegments ?? 32),
      ),
      material,
    );
  }

  if (object.type === 'sphere') {
    return new THREE.Mesh(new THREE.SphereGeometry(Number(object.params.radius ?? 1), 32, 24), material);
  }

  if (object.type === 'extrude') {
    const source = objects.find((item) => item.id === object.sourceSketchId);
    const depth = Number(object.params.depth ?? 1.5);
    const shape = new THREE.Shape();
    if (source?.type === 'sketch-rectangle') {
      const width = Number(source.params.width ?? 2);
      const height = Number(source.params.height ?? 2);
      shape.moveTo(-width / 2, -height / 2);
      shape.lineTo(width / 2, -height / 2);
      shape.lineTo(width / 2, height / 2);
      shape.lineTo(-width / 2, height / 2);
      shape.lineTo(-width / 2, -height / 2);
    } else {
      const radius = Number(source?.params.radius ?? 1);
      shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    }
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, depth / 2, 0);
    return new THREE.Mesh(geometry, material);
  }

  if (object.type === 'cut') {
    return new THREE.Mesh(
      new THREE.BoxGeometry(
        Number(object.params.width ?? 1),
        Number(object.params.height ?? 1),
        Number(object.params.depth ?? 1),
      ),
      material,
    );
  }

  const lineMaterial = new THREE.LineBasicMaterial({ color: object.color });
  if (object.type === 'sketch-line') {
    const points = [
      new THREE.Vector3(Number(object.params.x1 ?? -1), 0, Number(object.params.z1 ?? 0)),
      new THREE.Vector3(Number(object.params.x2 ?? 1), 0, Number(object.params.z2 ?? 0)),
    ];
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial);
  }

  if (object.type === 'sketch-circle') {
    const radius = Number(object.params.radius ?? 1);
    const points = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0)
      .getPoints(64)
      .map((point) => new THREE.Vector3(point.x, 0, point.y));
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), lineMaterial);
  }

  const width = Number(object.params.width ?? 2);
  const height = Number(object.params.height ?? 2);
  const rect = [
    new THREE.Vector3(-width / 2, 0, -height / 2),
    new THREE.Vector3(width / 2, 0, -height / 2),
    new THREE.Vector3(width / 2, 0, height / 2),
    new THREE.Vector3(-width / 2, 0, height / 2),
  ];
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(rect), lineMaterial);
}

export function CanvasViewport() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cursorTickRef = useRef(0);
  const sceneState = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    transformControls: TransformControls;
    dynamicGroup: THREE.Group;
    resizeObserver: ResizeObserver;
  } | null>(null);
  const activeTransformIdRef = useRef<string | null>(null);
  const isTransformDraggingRef = useRef(false);

  const objects = useCadStore((state) => state.objects);
  const selectedId = useCadStore((state) => state.selectedId);
  const cursors = useCadStore((state) => state.cursors);
  const transformMode = useCadStore((state) => state.transformMode);
  const selectObject = useCadStore((state) => state.selectObject);
  const sendCursor = useCadStore((state) => state.sendCursor);
  const commitViewportTransform = useCadStore((state) => state.commitViewportTransform);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f4efe5');

    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(8, 8, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;

    scene.add(new THREE.GridHelper(24, 24, '#9ca3af', '#d6d3d1'));
    scene.add(new THREE.AxesHelper(4));
    scene.add(new THREE.AmbientLight('#ffffff', 1.4));
    const directional = new THREE.DirectionalLight('#ffffff', 1.2);
    directional.position.set(8, 10, 6);
    scene.add(directional);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setSize(0.85);
    scene.add(transformControls.getHelper());

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line = { threshold: 0.3 };
    const pointer = new THREE.Vector2();

    const resizeObserver = new ResizeObserver(() => {
      if (!mountRef.current) {
        return;
      }
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    });
    resizeObserver.observe(mount);

    const onClick = (event: MouseEvent) => {
      if (isTransformDraggingRef.current) {
        return;
      }
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(dynamicGroup.children, true);
      const hit = hits.find((item) => item.object.userData.objectId || item.object.parent?.userData.objectId);
      const objectId = (hit?.object.userData.objectId ?? hit?.object.parent?.userData.objectId) as string | undefined;
      selectObject(objectId ?? null);
    };

    const onMove = (event: MouseEvent) => {
      const now = Date.now();
      if (now - cursorTickRef.current < 80) {
        return;
      }
      cursorTickRef.current = now;
      const bounds = renderer.domElement.getBoundingClientRect();
      sendCursor((event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height);
    };

    const commitActiveTransform = () => {
      const objectId = activeTransformIdRef.current;
      const attached = transformControls.object;
      if (!objectId || !attached) {
        return;
      }
      commitViewportTransform(objectId, {
        position: { x: attached.position.x, y: attached.position.y, z: attached.position.z },
        rotation: { x: attached.rotation.x, y: attached.rotation.y, z: attached.rotation.z },
        scale: { x: attached.scale.x, y: attached.scale.y, z: attached.scale.z },
      });
    };

    transformControls.addEventListener('dragging-changed', (event) => {
      const dragging = Boolean(event.value);
      isTransformDraggingRef.current = dragging;
      controls.enabled = !dragging;
      if (!dragging) {
        commitActiveTransform();
      }
    });

    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('mousemove', onMove);

    sceneState.current = { scene, camera, renderer, controls, transformControls, dynamicGroup, resizeObserver };

    let active = true;
    const animate = () => {
      if (!active) {
        return;
      }
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      active = false;
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('mousemove', onMove);
      transformControls.detach();
      transformControls.dispose();
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [commitViewportTransform, selectObject, sendCursor]);

  useEffect(() => {
    const state = sceneState.current;
    if (!state) {
      return;
    }
    while (state.dynamicGroup.children.length > 0) {
      state.dynamicGroup.remove(state.dynamicGroup.children[0]);
    }
    objects.forEach((object) => {
      const renderable = buildRenderable(object, objects);
      renderable.position.set(object.position.x, object.position.y, object.position.z);
      renderable.rotation.set(object.rotation.x, object.rotation.y, object.rotation.z);
      renderable.scale.set(object.scale?.x ?? 1, object.scale?.y ?? 1, object.scale?.z ?? 1);
      renderable.userData.objectId = object.id;
      if ('material' in renderable && renderable.material && object.id === selectedId) {
        const mesh = renderable as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => {
            if ('emissive' in material) {
              material.emissive = new THREE.Color('#f59e0b');
            }
          });
        } else if ('emissive' in mesh.material) {
          mesh.material.emissive = new THREE.Color('#f59e0b');
        }
      }
      state.dynamicGroup.add(renderable);
    });
  }, [objects, selectedId]);

  useEffect(() => {
    const state = sceneState.current;
    if (!state) {
      return;
    }
    state.transformControls.setMode(transformMode);
    const selectedObject = state.dynamicGroup.children.find((child) => child.userData.objectId === selectedId);
    if (selectedObject) {
      state.transformControls.attach(selectedObject);
      activeTransformIdRef.current = selectedId;
      return;
    }

    activeTransformIdRef.current = null;
    state.transformControls.detach();
  }, [objects, selectedId, transformMode]);

  return (
    <div className="viewport-shell">
      <div className="viewport-header">
        <div className="viewport-meta">
          <strong>3D Workspace</strong>
          <span>Three.js scene + collaborative cursors + transform gizmo</span>
        </div>
        <div className="viewport-transform-mode">Mode: {transformMode}</div>
      </div>
      <div className="viewport-canvas" ref={mountRef} />
      <div className="cursor-layer">
        {cursors.map((cursor) => (
          <div
            key={cursor.userId}
            className="remote-cursor"
            style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%`, color: cursor.color }}
          >
            <span className="remote-cursor-dot" style={{ backgroundColor: cursor.color }} />
            <span className="remote-cursor-label">{cursor.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
