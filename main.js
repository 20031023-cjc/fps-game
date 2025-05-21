import * as THREE from 'three';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
const objects = [];
const bullets = [];
const enemies = [];
const clock = new THREE.Clock();

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.y = 1.6;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new PointerLockControls(camera, document.body);
  const instructions = document.getElementById('instructions');
  instructions.addEventListener('click', () => controls.lock());
  controls.addEventListener('lock', () => instructions.style.display = 'none');
  controls.addEventListener('unlock', () => instructions.style.display = '');

  scene.add(controls.getObject());

  // Lights
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(0, 20, 10);
  scene.add(dirLight);

  // Floor
  const floorTexture = new THREE.TextureLoader().load('assets/ground.jpg');
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
  const floorGeometry = new THREE.PlaneGeometry(200, 200);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Walls
  const wallTexture = new THREE.TextureLoader().load('assets/wall.jpg');
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(1, 1);
  const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });

  const boxGeometry = new THREE.BoxGeometry(2, 2, 0.2);
  for(let i = -4; i <= 4; i++) {
    const wall = new THREE.Mesh(boxGeometry, wallMaterial);
    wall.position.set(i * 3, 1, -10);
    scene.add(wall);
    objects.push(wall);
  }

  // 简单敌人
  createEnemy(new THREE.Vector3(0, 1, -5));
  createEnemy(new THREE.Vector3(6, 1, -8));

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousedown', onMouseDown);

  window.addEventListener('resize', onWindowResize);
}

function createEnemy(position) {
  const enemyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
  enemy.position.copy(position);
  enemy.userData = { 
    direction: 1, // 用于简单往返移动
    speed: 1,
    alive: true,
  };
  scene.add(enemy);
  enemies.push(enemy);
}

function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
  switch(event.code) {
    case 'ArrowUp':
    case 'KeyW': moveForward = true; break;
    case 'ArrowLeft':
    case 'KeyA': moveLeft = true; break;
    case 'ArrowDown':
    case 'KeyS': moveBackward = true; break;
    case 'ArrowRight':
    case 'KeyD': moveRight = true; break;
  }
}

function onKeyUp(event) {
  switch(event.code) {
    case 'ArrowUp':
    case 'KeyW': moveForward = false; break;
    case 'ArrowLeft':
    case 'KeyA': moveLeft = false; break;
    case 'ArrowDown':
    case 'KeyS': moveBackward = false; break;
    case 'ArrowRight':
    case 'KeyD': moveRight = false; break;
  }
}

function onMouseDown(event) {
  if (event.button === 0 && controls.isLocked) { // 左键
    shoot();
  }
}

function shoot() {
  const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

  const playerPos = controls.getObject().position.clone();
  const playerDir = new THREE.Vector3();
  camera.getWorldDirection(playerDir);

  bullet.position.copy(playerPos);
  bullet.position.y -= 0.3; // 从眼睛稍低点发射
  bullet.userData = {
    velocity: playerDir.multiplyScalar(50),
    aliveTime: 0,
  };

  scene.add(bullet);
  bullets.push(bullet);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (controls.isLocked) {
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if(moveForward || moveBackward) velocity.z -= direction.z * 50.0 * delta;
    if(moveLeft || moveRight) velocity.x -= direction.x * 50.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
  }

  updateBullets(delta);
  updateEnemies(delta);

  renderer.render(scene, camera);
}

function updateBullets(delta) {
  for (let i = bullets.length -1; i >=0; i--) {
    const bullet = bullets[i];
    bullet.position.addScaledVector(bullet.userData.velocity, delta);
    bullet.userData.aliveTime += delta;

    // 子弹最大存活3秒，超时删除
    if (bullet.userData.aliveTime > 3) {
      scene.remove(bullet);
      bullets.splice(i, 1);
      continue;
    }

    // 碰撞检测：和敌人距离小于0.5则击中
    for(let j = enemies.length -1; j >= 0; j--) {
      const enemy = enemies[j];
      if (!enemy.userData.alive) continue;

      const dist = bullet.position.distanceTo(enemy.position);
      if (dist < 0.5) {
        enemy.userData.alive = false;
        scene.remove(enemy);
        enemies.splice(j, 1);

        scene.remove(bullet);
        bullets.splice(i, 1);
        break;
      }
    }
  }
}

function updateEnemies(delta) {
  enemies.forEach(enemy => {
    if (!enemy.userData.alive) return;

    // 简单左右往返走动
    enemy.position.x += enemy.userData.speed * enemy.userData.direction * delta;

    // 走到某范围换方向
    if (enemy.position.x > 8) enemy.userData.direction = -1;
    else if (enemy.position.x < -8) enemy.userData.direction = 1;
  });
}
