import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
const objects = [];

const move = { forward: false, backward: false, left: false, right: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let prevTime = performance.now();

init();
animate();

function init() {
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x88ccee);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

  // Controls
  controls = new PointerLockControls(camera, document.body);

  const instructions = document.getElementById('instructions');
  instructions.addEventListener('click', () => {
    controls.lock();
  });

  controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
  });

  controls.addEventListener('unlock', () => {
    instructions.style.display = '';
  });

  scene.add(controls.getObject());

  // Light
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1);
  scene.add(light);

  // Textures
  const loader = new THREE.TextureLoader();

  const groundTexture = loader.load('ground.jpg');
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(10, 10);

  const wallTexture = loader.load('wall.jpg');
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(1, 1);

  // Ground
  const groundMaterial = new THREE.MeshPhongMaterial({ map: groundTexture });
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  objects.push(ground);

  // Walls (简单四面墙)
  const wallHeight = 10;
  const wallThickness = 1;
  const wallLength = 200;

  const wallMaterial = new THREE.MeshPhongMaterial({ map: wallTexture });

  // 四个墙壁，分别放置
  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(wallLength, wallHeight, wallThickness), wallMaterial);
  wall1.position.set(0, wallHeight/2, -wallLength/2);
  scene.add(wall1);
  objects.push(wall1);

  const wall2 = new THREE.Mesh(new THREE.BoxGeometry(wallLength, wallHeight, wallThickness), wallMaterial);
  wall2.position.set(0, wallHeight/2, wallLength/2);
  scene.add(wall2);
  objects.push(wall2);

  const wall3 = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, wallLength), wallMaterial);
  wall3.position.set(-wallLength/2, wallHeight/2, 0);
  scene.add(wall3);
  objects.push(wall3);

  const wall4 = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, wallLength), wallMaterial);
  wall4.position.set(wallLength/2, wallHeight/2, 0);
  scene.add(wall4);
  objects.push(wall4);

  // 监听窗口大小变化
  window.addEventListener('resize', onWindowResize);

  // 键盘事件
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}

function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
  switch(event.code) {
    case 'ArrowUp':
    case 'KeyW':
      move.forward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      move.left = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      move.backward = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      move.right = true;
      break;
  }
}

function onKeyUp(event) {
  switch(event.code) {
    case 'ArrowUp':
    case 'KeyW':
      move.forward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      move.left = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      move.backward = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      move.right = false;
      break;
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked === true) {
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(move.forward) - Number(move.backward);
    direction.x = Number(move.right) - Number(move.left);
    direction.normalize();

    const speed = 400.0;

    if (move.forward || move.backward) velocity.z -= direction.z * speed * delta;
    if (move.left || move.right) velocity.x -= direction.x * speed * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    prevTime = time;
  }

  renderer.render(scene, camera);
}
