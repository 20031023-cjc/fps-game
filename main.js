let camera, scene, renderer, controls;
let objects = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

const clock = new THREE.Clock();

const bullets = [];
const enemies = [];

init();
animate();

function init() {
  // 场景和相机
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // 控制器，确保PointerLockControls已正确引入
  controls = new PointerLockControls(camera, document.body);

  // 设置点击锁定鼠标
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

  // 把控制器的对象加入场景，控制相机移动
  scene.add(controls.getObject());

  // 加载纹理
  const loader = new THREE.TextureLoader();
  const wallTexture = loader.load('assets/textures/wall.jpg');
  const groundTexture = loader.load('assets/textures/ground.jpg');
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(10, 10);

  // 地面
  const floorGeometry = new THREE.PlaneGeometry(200, 200);
  const floorMaterial = new THREE.MeshBasicMaterial({ map: groundTexture });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // 墙壁参数
  const wallHeight = 10;
  const wallThickness = 1;
  const wallLength = 200;

  const wallGeometry = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
  const wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture });

  // 创建四堵墙
  const walls = [];

  const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall1.position.set(0, wallHeight / 2, -wallLength / 2);
  scene.add(wall1);
  walls.push(wall1);

  const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall2.position.set(0, wallHeight / 2, wallLength / 2);
  scene.add(wall2);
  walls.push(wall2);

  const wallSideGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);

  const wall3 = new THREE.Mesh(wallSideGeometry, wallMaterial);
  wall3.position.set(-wallLength / 2, wallHeight / 2, 0);
  scene.add(wall3);
  walls.push(wall3);

  const wall4 = new THREE.Mesh(wallSideGeometry, wallMaterial);
  wall4.position.set(wallLength / 2, wallHeight / 2, 0);
  scene.add(wall4);
  walls.push(wall4);

  // 添加墙壁到碰撞物体数组
  walls.forEach(wall => objects.push(wall));

  // 简单光源
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1);
  scene.add(light);

  // 键盘事件监听
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // 鼠标点击射击
  document.addEventListener('click', shoot);

  // 生成初始敌人
  for(let i=0; i<5; i++) {
    spawnEnemy();
  }

  window.addEventListener('resize', onWindowResize);
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
}

function onKeyUp(event) {
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
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  updateBullets(delta);
  updateEnemies(delta);

  renderer.render(scene, camera);
}

function shoot() {
  const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

  bullet.position.copy(controls.getObject().position);

  // 子弹速度方向，摄像头方向前方
  const vector = new THREE.Vector3(0, 0, -1);
  vector.applyQuaternion(camera.quaternion);
  bullet.userData.velocity = vector.multiplyScalar(50);

  scene.add(bullet);
  bullets.push(bullet);
}

function updateBullets(delta) {
  for(let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.addScaledVector(b.userData.velocity, delta);

    if (b.position.length() > 200) {
      scene.remove(b);
      bullets.splice(i, 1);
      continue;
    }

    for(let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (b.position.distanceTo(enemy.position) < 1) {
        scene.remove(enemy);
        enemies.splice(j, 1);

        scene.remove(b);
        bullets.splice(i, 1);
        break;
      }
    }
  }
}

function spawnEnemy() {
  const enemyGeometry = new THREE.BoxGeometry(1, 2, 1);
  const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

  const dist = 80;
  const angle = Math.random() * Math.PI * 2;
  enemy.position.set(Math.cos(angle)*dist, 1, Math.sin(angle)*dist);

  scene.add(enemy);
  enemies.push(enemy);
}

function updateEnemies(delta) {
  const speed = 10;
  enemies.forEach(enemy => {
    // 敌人向玩家方向移动
    const dir = new THREE.Vector3();
    dir.subVectors(controls.getObject().position, enemy.position).normalize();
    enemy.position.addScaledVector(dir, speed * delta);
  });
}
