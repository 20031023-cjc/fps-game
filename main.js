let camera, scene, renderer;
let objects = [];

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let raycaster;
let shootSound;

init();
animate();

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // 灯光
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  // 创建目标方块
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 0, -10);
  scene.add(cube);
  objects.push(cube);

  raycaster = new THREE.Raycaster();

  setupControls();

  window.addEventListener('resize', onWindowResize, false);

  // 射击事件监听
  document.addEventListener('click', onShoot, false);
}

let pitchObject = new THREE.Object3D();
let yawObject = new THREE.Object3D();
yawObject.position.y = 1.6;
yawObject.add(pitchObject);
pitchObject.add(camera);

let PI_2 = Math.PI / 2;

function onMouseMove(event) {
  const movementX = event.movementX || 0;
  const movementY = event.movementY || 0;

  yawObject.rotation.y -= movementX * 0.002;
  pitchObject.rotation.x -= movementY * 0.002;
  pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
}

function setupControls() {
  document.body.requestPointerLock =
    document.body.requestPointerLock ||
    document.body.mozRequestPointerLock ||
    document.body.webkitRequestPointerLock;

  document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', lockChange, false);
  document.addEventListener('mozpointerlockchange', lockChange, false);
  document.addEventListener('webkitpointerlockchange', lockChange, false);

  function lockChange() {
    if (
      document.pointerLockElement === document.body ||
      document.mozPointerLockElement === document.body ||
      document.webkitPointerLockElement === document.body
    ) {
      document.addEventListener('mousemove', onMouseMove, false);
      document.addEventListener('keydown', onKeyDown, false);
      document.addEventListener('keyup', onKeyUp, false);
    } else {
      document.removeEventListener('mousemove', onMouseMove, false);
      document.removeEventListener('keydown', onKeyDown, false);
      document.removeEventListener('keyup', onKeyUp, false);
    }
  }
}

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

function onShoot() {
  // 从摄像机位置沿着摄像机前方发射射线
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    console.log("击中目标！");

    // 改变颜色表示被击中
    hit.material.color.set(0xff0000);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

  yawObject.translateX(velocity.x * delta);
  yawObject.translateZ(velocity.z * delta);

  prevTime = time;

  renderer.render(scene, camera);
}
