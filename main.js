// 初期設定
let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;
let velocity = new THREE.Vector3();
let enemy; // 敵キャラ
let bullets = []; // 弾丸配列
let score = 0;
let timer = 60;
let direction = new THREE.Vector3();
let objects = [];
let prevTime = performance.now();
let timerInterval = null; // 計時器用

// シーン作成
scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

// ライト
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
light.position.set(0, 200, 0);
scene.add(light);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(50, 200, 100);
scene.add(dirLight);

// 地面
const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
floorGeometry.rotateX(-Math.PI / 2);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x303030, wireframe: true });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = 0; // 地面は y=0 に設定
scene.add(floor);
objects.push(floor);

// 敵追加
const enemyGeometry = new THREE.BoxGeometry(5, 5, 5);
const enemyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
enemy.position.set(30, 2.5, -30);
scene.add(enemy);

// レンダラー設定
renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gameCanvas") });
renderer.setSize(window.innerWidth, window.innerHeight);

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// コントロール設定
controls = new THREE.PointerLockControls(camera, document.body);
scene.add(controls.getObject());

document.body.addEventListener('click', () => controls.lock(), false);

controls.addEventListener('lock', () => console.log("Pointer locked"));
controls.addEventListener('unlock', () => console.log("Pointer unlocked"));

// キー入力処理
const onKeyDown = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = true; break;
        case 'Space':
            if (canJump === true) {
                velocity.y += 350;
                canJump = false;
            }
            break;
    }
};
const onKeyUp = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = false; break;
    }
};
document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);
document.addEventListener('click', shoot, false);

// 弾丸を撃つ関数
function shoot() {
    const bullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    bullet.position.copy(controls.getObject().position);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    bullet.velocity = dir.multiplyScalar(20); // 子弹速度改快点
    bullets.push(bullet);
    scene.add(bullet);
}

// 敵リスポーン
function respawnEnemy() {
    enemy.position.set(
        (Math.random() - 0.5) * 100,
        2.5,
        (Math.random() - 0.5) * 100
    );
}

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // 減速
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 重力

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta;

    // 地面判定（地面の高さは0）
    if (controls.getObject().position.y < 1) {
        velocity.y = 0;
        controls.getObject().position.y = 1;
        canJump = true;
    }

    // 弾丸処理（逆ループで安全に削除）
    for(let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.velocity);

        // 敵に当たったら
        if (bullet.position.distanceTo(enemy.position) < 3) {
            scene.remove(bullet);
            bullets.splice(i, 1);
            score += 1;
            document.getElementById('score').textContent = score;
            respawnEnemy();
            continue;
        }

        // 画面外に出たら削除
        if (bullet.position.length() > 500) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }

    // 敵がプレイヤーを追跡
    const playerPos = controls.getObject().position;
    const directionToPlayer = new THREE.Vector3().subVectors(playerPos, enemy.position).normalize();
    enemy.position.addScaledVector(directionToPlayer, 0.05);

    renderer.render(scene, camera);
    prevTime = time;
}

animate();

// タイマー処理（1回だけセット）
function startTimer() {
    if(timerInterval) return; // すでに開始してたら何もしない
    timerInterval = setInterval(() => {
        timer--;
        document.getElementById('timer').textContent = timer;
        if (timer <= 0) {
            clearInterval(timerInterval);
            alert(`ゲーム終了！得点：${score}`);
            location.reload();
        }
    }, 1000);
}
startTimer();
