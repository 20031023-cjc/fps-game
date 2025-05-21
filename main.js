let camera, scene, renderer, controls;
let objects = [];
const bullets = [];

init();
animate();

function init() {
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth,
