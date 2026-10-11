import * as THREE from "three";

/**
 * A tiny procedural photo studio: a dark warm room with a few emissive
 * softboxes. Baked once into a PMREM texture it gives ceramic and steel the
 * long, soft, window-like highlights that make a product shot read as real.
 */
export function buildStudioEnvironment(gl: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0907);

  const panel = (
    w: number,
    h: number,
    pos: [number, number, number],
    intensity: number,
    tint: string
  ) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(tint).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };

  panel(7, 5, [-6, 5, 6], 7, "#fff3e2"); // key softbox, upper left front
  panel(1.6, 8, [7, 2.5, 2], 5, "#ffe9cf"); // tall strip, right
  panel(5, 5, [0, 8, -1], 3.2, "#ffffff"); // overhead
  panel(6, 2.5, [0, 3, -8], 2.2, "#cfdcff"); // cool back rim
  panel(8, 8, [0, -6, 2], 0.5, "#8a5a36"); // warm floor bounce

  const pmrem = new THREE.PMREMGenerator(gl);
  const target = pmrem.fromScene(scene, 0.02);
  pmrem.dispose();

  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return target.texture;
}
