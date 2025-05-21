import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let objects = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const clock = new THREE.Clock();

const bullets = [];
const enemies = [];

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcccccc);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.y = 10; // 眼睛高度

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const loader = new THREE.TextureLoader();

  // 地面
  const groundTexture = loader.load('assets/textures/ground.jpg');
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(25, 25);

  const floorGeometry = new THREE.PlaneGeometry(500, 500);
  const floorMaterial = new THREE.MeshPhongMaterial({ map: groundTexture });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  objects.push(floor);

  // 墙壁
  const wallTexture = loader.load('assets/textures/wall.jpg');
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(5, 2);

  const wallHeight = 20;
  const wallLength = 200;
  const wallGeometry = new THREE.PlaneGeometry(wallLength, wallHeight);
  const wallMaterial = new THREE.MeshPhongMaterial({ map: wallTexture });

  // 四面墙
  const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall1.position.set(0, wallHeight / 2, -wallLength / 2);
  scene.add(wall1);
  objects.push(wall1);

  const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall2.position.set(0, wallHeight / 2, wallLength / 2);
  wall2.rotation.y = Math.PI;
  scene.add(wall2);
  objects.push(wall2);

  const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall3.position.set(-wallLength / 2, wallHeight / 2, 0);
  wall3.rotation.y = Math.PI / 2;
  scene.add(wall3);
  objects.push(wall3);

  const wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall4.position.set(wallLength / 2, wallHeight / 2, 0);
  wall4.rotation.y = -Math.PI / 2;
  scene.add(wall4);
  objects.push(wall4);

  // 光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  // PointerLockControls
  controls = new PointerLockControls(camera, document.body);

  // 这里需要你html里有id为blocker的元素，控制锁定状态
  const blocker = document.getElementById('blocker');
  blocker.addEventListener('click', () => {
    controls.lock();
  });

  controls.addEventListener('lock', () => {
    blocker.style.display = 'none';
  });

  controls.addEventListener('unlock', () => {
    blocker.style.display = 'flex';
  });

  scene.add(controls.getObject()); // 这句可以保留，controls会自动添加摄像机

  // 监听键盘事件
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  window.addEventListener('resize', onWindowResize);

  // 你原来的子弹和敌人初始化代码放这里
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
  switch(event.code) {
    case 'KeyW': moveForward = true; break;
    case 'KeyS': moveBackward = true; break;
    case 'KeyA': moveLeft = true; break;
    case 'KeyD': moveRight = true; break;
  }
}

function onKeyUp(event) {
  switch(event.code) {
    case 'KeyW': moveForward = false; break;
    case 'KeyS': moveBackward = false; break;
    case 'KeyA': moveLeft = false; break;
    case 'KeyD': moveRight = false; break;
  }
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const speed = 400.0;

  // 减速
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  // 方向
  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  // 加速度更新
  if(moveForward || moveBackward) velocity.z += direction.z * speed * delta;  // 改动，之前是减号，这里改成加号
  if(moveLeft || moveRight) velocity.x += direction.x * speed * delta;

  controls.moveRight(velocity.x * delta);
  controls.moveForward(velocity.z * delta);

  // 你原来的子弹、敌人更新和碰撞检测代码
  // updateBullets();
  // updateEnemies();
  // checkCollisions();

  renderer.render(scene, camera);
}
