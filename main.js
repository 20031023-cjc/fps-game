import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let prevTime = performance.now();

init();
animate();

function init() {
  // 场景和相机
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

  // 渲染器绑定canvas
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // 控制器
  controls = new PointerLockControls(camera, document.body);
  controls.getObject().position.set(0, 10, 50);
  scene.add(controls.getObject());

  // 光源：环境光 + 方向光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 200, 100);
  scene.add(directionalLight);

  // 地面
  const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
  floorGeometry.rotateX(-Math.PI / 2);
  const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x303030 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  scene.add(floor);

  // 点击提示绑定事件
  const instructions = document.getElementById('instructions');
  instructions.addEventListener('click', () => {
    controls.lock();
  });

  // 控制器锁定状态控制提示显示
  controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
  });
  controls.addEventListener('unlock', () => {
    instructions.style.display = '';
  });

  // 键盘事件监听
  document.addEventListener('keydown', (event) => {
    switch(event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;
    }
  });

  document.addEventListener('keyup', (event) => {
    switch(event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;
    }
  });

  // 窗口大小变化时调整相机和渲染器尺寸
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  // 摩擦力模拟减速
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  // 方向判断
  const direction = new THREE.Vector3();
  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  // 速度叠加
  if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

  // 控制器移动
  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  // 渲染场景
  renderer.render(scene, camera);

  prevTime = time;
}

}, 1000);

animate();
