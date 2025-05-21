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
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // 贴图加载
  const loader = new THREE.TextureLoader();
  const wallTexture = loader.load('assets/wall.jpg');
  const groundTexture = loader.load('assets/ground.jpg');
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(10, 10);

  // 地面
  const floorGeometry = new THREE.PlaneGeometry(200, 200);
  const floorMaterial = new THREE.MeshBasicMaterial({ map: groundTexture });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // 墙壁
  const wallHeight = 10;
  const wallThickness = 1;
  const wallLength = 200;

  const wallGeometry = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
  const wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture });

  const walls = [];
  const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall1.position.set(0, wallHeight/2, -wallLength/2);
  scene.add(wall1);
  walls.push(wall1);

  const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall2.position.set(0, wallHeight/2, wallLength/2);
  scene.add(wall2);
  walls.push(wall2);

  const wallSideGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
  const wall3 = new THREE.Mesh(wallSideGeometry, wallMaterial);
  wall3.position.set(-wallLength/2, wallHeight/2, 0);
  scene.add(wall3);
  walls.push(wall3);

  const wall4 = new THREE.Mesh(wallSideGeometry, wallMaterial);
  wall4.position.set(wallLength/2, wallHeight/2, 0);
  scene.add(wall4);
  walls.push(wall4);

  walls.forEach(w => objects.push(w));

  // 灯光
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1);
  scene.add(light);

  // 控制器
  controls = new THREE.PointerLockControls(camera, document.body);

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

  scene.add(controls.getObject());

  // 键盘事件
  const onKeyDown = function (event) {
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
  };

  const onKeyUp = function(event) {
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
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // 鼠标点击射击
  document.addEventListener('click', shoot);

  // 添加简单敌人
  spawnEnemy();

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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

  // 子弹起点是相机位置
  bullet.position.copy(controls.getObject().position);

  // 子弹方向
  const vector = new THREE.Vector3(0, 0, -1);
  vector.applyQuaternion(camera.quaternion);
  bullet.userData = {
    velocity: vector.multiplyScalar(50)
  };

  scene.add(bullet);
  bullets.push(bullet);
}

function updateBullets(delta) {
  for(let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.addScaledVector(b.userData.velocity, delta);

    // 子弹飞出范围移除
    if (b.position.length() > 200) {
      scene.remove(b);
      bullets.splice(i, 1);
      continue;
    }

    // 检测和敌人碰撞
    for(let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (b.position.distanceTo(enemy.position) < 1) {
        // 碰撞，移除敌人和子弹
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

  // 随机生成在场地边缘
  const dist = 80;
  const angle = Math.random() * Math.PI * 2;
  enemy.position.set(Math.cos(angle) * dist, 1, Math.sin(angle) * dist);

  scene.add(enemy);
  enemies.push(enemy);
}

function updateEnemies(delta) {
  enemies.forEach(enemy => {
    const playerPos = controls.getObject().position;
    const dir = new THREE.Vector3().subVectors(playerPos, enemy.position).normalize();
    enemy.position.addScaledVector(dir, delta * 5);

    // 简单碰撞检测防止穿墙（可以自己加更复杂碰撞）
    // 如果靠太近玩家，停止移动
    if (enemy.position.distanceTo(playerPos) < 1) {
      // 你可以写游戏失败逻辑，这里先不写
    }
  });

  // 如果敌人数量少，补充敌人
  if (enemies.length < 5) {
    spawnEnemy();
  }
}
