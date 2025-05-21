// main.js (ES Modules方式加载three.js)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
const objects = [];

init();
animate();

function init() {
  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // 场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);

  // 相机
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.y = 1.6; // 眼睛高度

  // 控制器：第一人称视角
  controls = new PointerLockControls(camera, document.body);

  // 点击页面时启用鼠标锁定
  document.body.addEventListener('click', () => {
    controls.lock();
  });

  // 灯光
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  // 贴图加载器
  const loader = new THREE.TextureLoader();

  // 地面
  const groundTexture = loader.load('assets/ground.jpg');
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(10, 10);

  const groundMaterial = new THREE.MeshPhongMaterial({ map: groundTexture });
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = - Math.PI / 2;
  scene.add(ground);

  // 墙壁
  const wallTexture = loader.load('assets/wall.jpg');
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(1, 1);

  const wallMaterial = new THREE.MeshPhongMaterial({ map: wallTexture });
  const wallGeometry = new THREE.BoxGeometry(10, 5, 0.5);
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(0, 2.5, -5);
  scene.add(wall);
  objects.push(wall);

  // 监听窗口变化
  window.addEventListener('resize', onWindowResize);

  // 移动相关变量和监听键盘
  setupMovement();
}

function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const move = { forward: false, backward: false, left: false, right: false };
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

function setupMovement() {
  document.addEventListener('keydown', function(e) {
    switch(e.code) {
      case 'ArrowUp':
      case 'KeyW': move.forward = true; break;
      case 'ArrowDown':
      case 'KeyS': move.backward = true; break;
      case 'ArrowLeft':
      case 'KeyA': move.left = true; break;
      case 'ArrowRight':
      case 'KeyD': move.right = true; break;
    }
  });

  document.addEventListener('keyup', function(e) {
    switch(e.code) {
      case 'ArrowUp':
      case 'KeyW': move.forward = false; break;
      case 'ArrowDown':
      case 'KeyS': move.backward = false; break;
      case 'ArrowLeft':
      case 'KeyA': move.left = false; break;
      case 'ArrowRight':
      case 'KeyD': move.right = false; break;
    }
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked === true) {
    const delta = 0.1; // 速度调节

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(move.forward) - Number(move.backward);
    direction.x = Number(move.right) - Number(move.left);
    direction.normalize();

    if (move.forward || move.backward) velocity.z -= direction.z * 400.0 * delta;
    if (move.left || move.right) velocity.x -= direction.x * 400.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  }

  renderer.render(scene, camera);
}
