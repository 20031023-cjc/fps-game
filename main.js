// --- 変数定義 ---
let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let enemy;
let bullets = [];
let score = 0;
let timer = 60;
let direction = new THREE.Vector3();
let objects = [];
let prevTime = performance.now();

// --- シーンとカメラの作成 ---
scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

// --- コントロールの初期化（カメラと連動） ---
controls = new THREE.PointerLockControls(camera, document.body);
scene.add(controls.getObject());

// カメラ（プレイヤー）の初期位置設定
controls.getObject().position.set(0, 10, 50);

// --- 照明 ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(50, 200, 100);
scene.add(dirLight);

// --- 地面の作成 ---
const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
floorGeometry.rotateX(-Math.PI / 2);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x303030, wireframe: true });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
scene.add(floor);
objects.push(floor);

// --- 敵の作成 ---
const enemyGeometry = new THREE.BoxGeometry(5, 5, 5);
const enemyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
enemy.position.set(30, 2.5, -30);
scene.add(enemy);

// --- レンダラー ---
renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gameCanvas") });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);

// --- イベントリスナー ---
// マウスクリックでポインタロック開始
const instructions = document.getElementById('instructions');
instructions.addEventListener('click', () => {
  controls.lock();
  instructions.style.display = 'none';
});

// ロック状態のログ
controls.addEventListener('lock', () => console.log("Pointer locked"));
controls.addEventListener('unlock', () => {
  console.log("Pointer unlocked");
  instructions.style.display = '';
});

// キー入力処理
function onKeyDown(event) {
  switch (event.code) {
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
    case 'Space':
      if (canJump === true) {
        velocity.y += 350;
        canJump = false;
      }
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
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

document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);

// 弾を撃つ処理
function shoot() {
  if (!controls.isLocked) return; // 鼠标没锁定不发射

  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  bullet.position.copy(controls.getObject().position);

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  bullet.velocity = dir.multiplyScalar(2);

  bullets.push(bullet);
  scene.add(bullet);
}

document.addEventListener('click', shoot, false);

// --- アニメーションループ ---
function animate() {
  requestAnimationFrame(animate);

  if (!controls.isLocked) {
    renderer.render(scene, camera);
    return;
  }

  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * 100.0 * delta;

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  controls.getObject().position.y += velocity.y * delta;

  if (controls.getObject().position.y < 10) {
    velocity.y = 0;
    controls.getObject().position.y = 10;
    canJump = true;
  }

  // 弾の処理
  bullets.forEach((bullet, index) => {
    bullet.position.add(bullet.velocity);

    if (bullet.position.distanceTo(enemy.position) < 3) {
      bullets.splice(index, 1);
      scene.remove(bullet);
      score++;
      document.getElementById('score').textContent = score;
      respawnEnemy();
    }

    if (bullet.position.length() > 500) {
      bullets.splice(index, 1);
      scene.remove(bullet);
    }
  });

  // 敵の移動（プレイヤーに近づく）
  const playerPos = controls.getObject().position;
  const directionToPlayer = new THREE.Vector3().subVectors(playerPos, enemy.position).normalize();
  enemy.position.addScaledVector(directionToPlayer, 0.05);

  renderer.render(scene, camera);
  prevTime = time;
}

function respawnEnemy() {
  enemy.position.set(
    (Math.random() - 0.5) * 100,
    2.5,
    (Math.random() - 0.5) * 100
  );
}

animate();

// --- タイマー処理 ---
setInterval(() => {
  if (!controls.isLocked) return; // 没锁定不倒计时
  timer--;
  document.getElementById('timer').textContent = timer;
  if (timer <= 0) {
    alert(`ゲーム終了！得点：${score}`);
    location.reload();
  }
}, 1000);

// --- リサイズ対応 ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
