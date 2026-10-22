import * as THREE from 'three';
import './style.css';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ======== SCENE ========
const scene = new THREE.Scene();
scene.background = new THREE.Color('#211b2e');

// ======== CAMERA & RENDERER ========
// https://threejs.org/docs/?q=renderer#WebGLRenderer
// Renderers draw what the camera sees onto the page's canvas.
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#scene'),
  // Smoothing works by color blending and sub-pixel averaging. 
  // Instead of making an edge pixel a harsh solid color, 
  // the rendering engine calculates how much of that pixel is actually 
  // covered by the object versus the background, and then 
  // blends intermediate shades of color along the boundary. 
  // This tricks the human eye into perceiving a straight, continuous smooth line.
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// https://threejs.org/docs/?q=camera#PerspectiveCamera
// This projection mode is designed to mimic the way the human eye sees. 
// It is the most common projection mode used for rendering a 3D scene.
const camera = new THREE.PerspectiveCamera(
  70, // field of view (angle in degrees)
  window.innerWidth / window.innerHeight, // aspect ratio (width:height proportion)
  0.1, // near plane (closest point to a camera where 3D objects are still visible)
  100, // far plane
);
camera.position.y = 3;
camera.position.z = 2;

// https://threejs.org/docs/#OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target = new THREE.Vector3(0, 0, 0);

// ======== LIGHTING ========
// https://threejs.org/docs/?q=ambient#AmbientLight
// This light globally illuminates all objects in the scene equally.
scene.add(new THREE.AmbientLight('#ffffff'));

// https://threejs.org/docs/?q=direc#DirectionalLight
// A light that gets emitted in a specific direction. 
// This light will behave as though it is infinitely far away 
// and the rays produced from it are all parallel.
const light = new THREE.DirectionalLight('#ffffff', 3);
light.position.set(3, 4, 5);
scene.add(light);

// ======== MAIN ========

// Cauldron 🍯
const points = [
  // ===== OUTSIDE =====
  [0, -1], // connects the floor
  [0.55, -1], // floor
  [0.85, -0.8], // first edge from the bottom
  [1, -0.35], // second edge from the bottom
  [1, 0.2], // third edge from the bottom
  [0.78, 0.7], // top edge
  [0.78, 0.85], // short vertical rim

  // Crosses the rim to connect the outside and inside
  [0.65, 0.85],

  // ===== INSIDE =====
  // Similar to how the outside was constructed, but with smaller radiuses
  [0.65, 0.7],
  [0.86, 0.2],
  [0.86, -0.35],
  [0.7, -0.65],
  [0.45, -0.8],
  [0, -0.8],
].map(([radius, height]) => new THREE.Vector2(radius, height));
const cauldron = new THREE.Mesh(
  new THREE.LatheGeometry(points, 48 /*segments*/),
  new THREE.MeshStandardMaterial({color: '#222123', roughness: 0.85}),
);
scene.add(cauldron);

// Stew 🌈

// The vertex shader runs per vertex.
// A vertex is a point used to build triangles.
// Our circle is made of triangles. See: https://threejs.org/docs/#CircleGeometry
// Model view projection: https://jsantell.com/model-view-projection/
const stewVertexShader = `
  uniform float u_time;
  varying vec2 vUv; // 'varying' indicates a value passed from the vertex shader to the fragment shader

  void main() {
    vUv = uv;

    // [local space] coordinate space local to your object, i.e. where your object begins
    //   position: vertex coordinates (relative to local origin)
    //
    // [world space] coordinate space relative to a game world; some global origin of the world
    //   model matrix: a transform matrix that translates/scales/rotates the object
    //   e.g. transforming a house by scaling it down (too large), etc.
    //
    // [view space] coordinate space relative to a camera/viewer's pov
    //   view matrix: a transform matrix that translates/scales/rotates the object from world to view space
    //
    // [clip space] coordinates used to determine what's visible to the camera
    //   projection matrix: transforms view-space coordinates into clip space, accounting for perspective and FOV
    //   "given where this point is relative to my camera, where should it appear on my screen?"
    //   i.e. perspective is interesting - things farther away appear closer to the center because of the 'conic FOV'
    //   this is what determines how a camera sees the world
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The fragment shader runs per fragment, and calculates a pixel's color.
const stewFragmentShader = `
  uniform float u_time;
  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(vUv.x, vUv.y, 0, 1.0);
  }
`;

const stewMaterial = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
  },
  vertexShader: stewVertexShader,
  fragmentShader: stewFragmentShader, 
});

// Look at the triangle cross-sections here - our circle is made of 64 triangles.
const stew = new THREE.Mesh(new THREE.CircleGeometry(0.64, 64), stewMaterial);

stew.rotation.x = -Math.PI / 2;
stew.position.y = 0.75;
cauldron.add(stew);

// ======== ANIMATION LOOP ========
// This function runs every frame, and time is a timestamp in ms.
function animate(time) {
  controls.update();
  stewMaterial.uniforms.u_time.value = (time / 1000) * 2;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

// ======== MISC ========
// Keep the picture proportional when the browser window changes size.
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
