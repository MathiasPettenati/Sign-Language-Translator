import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

const TRANSITION_MS = 1_050;

type EntryExperienceProps = {
  reducedMotion: boolean;
  onEnter: () => void;
};

type Point = [number, number, number];

export function EntryExperience({ reducedMotion, onEnter }: EntryExperienceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasRendererRef = useRef(false);
  const launchStartedRef = useRef(false);
  const launchStartMsRef = useRef(0);
  const completionQueuedRef = useRef(false);
  const completedRef = useRef(false);
  const baseScaleRef = useRef(1);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [isLaunching, setIsLaunching] = useState(false);

  const finish = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    onEnter();
  }, [onEnter]);

  const activate = useCallback(() => {
    if (launchStartedRef.current) {
      return;
    }

    launchStartedRef.current = true;
    launchStartMsRef.current = performance.now();
    setIsLaunching(true);

    if (!completionQueuedRef.current) {
      completionQueuedRef.current = true;
      const delay = reducedMotion || !hasRendererRef.current ? 0 : TRANSITION_MS;
      window.setTimeout(finish, delay);
    }
  }, [finish, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const hasWebGlApi =
      typeof WebGLRenderingContext !== "undefined" ||
      typeof WebGL2RenderingContext !== "undefined";

    if (!hasWebGlApi) {
      hasRendererRef.current = false;
      return;
    }

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      });
    } catch {
      hasRendererRef.current = false;
      return;
    }

    hasRendererRef.current = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.04, 6);

    const glasses = createGlasses();
    scene.add(glasses);
    scene.add(createAtmosphere());

    const ambient = new THREE.AmbientLight(0xffffff, 0.62);
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(-2.8, 4, 5);
    const rim = new THREE.PointLight(0xffffff, 3.6, 10);
    rim.position.set(2.8, 1.5, 2.8);
    scene.add(ambient, key, rim);

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      baseScaleRef.current = width < 480 ? 0.38 : width < 760 ? 0.62 : 1;

      if (!launchStartedRef.current) {
        glasses.scale.setScalar(baseScaleRef.current);
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    window.addEventListener("pointermove", handlePointerMove);

    let frameId = 0;

    const render = (timeMs: number) => {
      const pointer = pointerRef.current;

      if (launchStartedRef.current && !reducedMotion) {
        const progress = Math.min(1, (timeMs - launchStartMsRef.current) / TRANSITION_MS);
        const eased = 1 - Math.pow(1 - progress, 3);
        const scale = baseScaleRef.current * (1 + eased * 3.1);

        glasses.scale.setScalar(scale);
        glasses.position.z = eased * 4.9;
        glasses.position.y = eased * 0.1;
        glasses.rotation.x += (-0.02 - glasses.rotation.x) * 0.08;
        glasses.rotation.y += (-0.04 - glasses.rotation.y) * 0.08;
      } else {
        glasses.scale.setScalar(baseScaleRef.current);
        glasses.position.y = Math.sin(timeMs * 0.001) * 0.045;
        glasses.rotation.x += (pointer.y * -0.12 - glasses.rotation.x) * 0.06;
        glasses.rotation.y += (pointer.x * 0.22 - glasses.rotation.y) * 0.06;
        glasses.rotation.z = Math.sin(timeMs * 0.0007) * 0.018;
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      resizeObserver.disconnect();
      disposeObject(scene);
      renderer.dispose();
      hasRendererRef.current = false;
    };
  }, [finish, reducedMotion]);

  return (
    <main className={`entry-screen ${isLaunching ? "is-launching" : ""}`}>
      <canvas
        ref={canvasRef}
        className="entry-canvas"
        aria-label="Interactive AR glasses"
      />
      <div className="entry-copy" aria-hidden="true">
        <p className="entry-kicker">Handspeak</p>
        <h1>Sign language, heard clearly.</h1>
        <p>Optical translation interface</p>
      </div>
      <div className="entry-status" aria-hidden="true">
        <span />
        Interpreter ready
      </div>
      <button
        type="button"
        className="entry-activate"
        onClick={activate}
        aria-label="Enter Handspeak translator"
      />
    </main>
  );
}

function createGlasses(): THREE.Group {
  const group = new THREE.Group();

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8dcdf,
    metalness: 0.9,
    roughness: 0.24,
  });
  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0b0c0d,
    metalness: 0.08,
    roughness: 0.12,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
  });
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xf6f7f8,
    transparent: true,
    opacity: 0.36,
  });

  const leftFrame = createLensFrame(-0.68, frameMaterial);
  const rightFrame = createLensFrame(0.68, frameMaterial);
  const leftLens = createLens(-0.68, lensMaterial);
  const rightLens = createLens(0.68, lensMaterial);

  group.add(leftFrame, rightFrame, leftLens, rightLens);
  group.add(createCylinder([-0.14, 0.06, 0.01], [0.14, 0.06, 0.01], 0.035, frameMaterial));
  group.add(createCylinder([-1.28, 0.08, -0.02], [-2.05, 0.12, -0.92], 0.035, frameMaterial));
  group.add(createCylinder([1.28, 0.08, -0.02], [2.05, 0.12, -0.92], 0.035, frameMaterial));
  group.add(createCylinder([-2.05, 0.12, -0.92], [-2.24, -0.18, -1.42], 0.028, frameMaterial));
  group.add(createCylinder([2.05, 0.12, -0.92], [2.24, -0.18, -1.42], 0.028, frameMaterial));

  const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 12), frameMaterial);
  sensor.position.set(0, 0.17, 0.05);
  group.add(sensor);

  group.add(createHudLines(-0.68, lineMaterial), createHudLines(0.68, lineMaterial));
  group.rotation.x = -0.03;

  return group;
}

function createLensFrame(centerX: number, material: THREE.Material): THREE.Mesh {
  const shape = createRoundedRectShape(1.14, 0.62, 0.16);
  shape.holes.push(createRoundedRectPath(0.92, 0.43, 0.11));

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.018,
    bevelThickness: 0.018,
  });
  geometry.center();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(centerX, 0, 0);
  return mesh;
}

function createLens(centerX: number, material: THREE.Material): THREE.Mesh {
  const geometry = new THREE.ShapeGeometry(createRoundedRectShape(0.92, 0.43, 0.11));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(centerX, 0, -0.045);
  return mesh;
}

function createHudLines(centerX: number, material: THREE.Material): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    centerX - 0.28,
    0.06,
    0.01,
    centerX + 0.18,
    0.06,
    0.01,
    centerX - 0.18,
    -0.06,
    0.01,
    centerX + 0.3,
    -0.06,
    0.01,
    centerX + 0.34,
    0.13,
    0.01,
    centerX + 0.42,
    0.13,
    0.01,
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  return new THREE.LineSegments(geometry, material);
}

function createCylinder(start: Point, end: Point, radius: number, material: THREE.Material): THREE.Mesh {
  const startVector = new THREE.Vector3(...start);
  const endVector = new THREE.Vector3(...end);
  const midpoint = startVector.clone().add(endVector).multiplyScalar(0.5);
  const direction = endVector.clone().sub(startVector);
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 24);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

  return mesh;
}

function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

function createRoundedRectPath(width: number, height: number, radius: number): THREE.Path {
  const path = new THREE.Path();
  const x = -width / 2;
  const y = -height / 2;

  path.moveTo(x + radius, y);
  path.lineTo(x + width - radius, y);
  path.quadraticCurveTo(x + width, y, x + width, y + radius);
  path.lineTo(x + width, y + height - radius);
  path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  path.lineTo(x + radius, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - radius);
  path.lineTo(x, y + radius);
  path.quadraticCurveTo(x, y, x + radius, y);

  return path;
}

function createAtmosphere(): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];

  for (let index = 0; index < 180; index += 1) {
    const angle = index * 1.618;
    const radius = 1.2 + (index % 36) * 0.08;
    vertices.push(
      Math.cos(angle) * radius,
      Math.sin(angle * 0.7) * radius * 0.42,
      -2.5 - (index % 45) * 0.08,
    );
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.018,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Points) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}
