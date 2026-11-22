import * as THREE from 'three';
import { FLOORS, isWalkableOnFloor } from '../data/mallLayout.js';

const EYE_HEIGHT = 1.70;

export class PlayerController {
  constructor(camera, domElement, traversalSystem, attractions) {
    this.camera = camera;
    this.domElement = domElement;
    this.traversal = traversalSystem;
    this.attractions = attractions;

    // Start on 2F Rainbow Suspension Bridge right outside S346 Food District!
    this.floorIndex = 3;
    this.footPos = new THREE.Vector3(38.0, FLOORS[3].y, -10.8);
    this.yaw = Math.PI;
    this.pitch = -0.08;

    this.keys = new Set();
    this.isPointerLocked = false;
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };
    this.modalOpen = false;

    this.touchMove = { x: 0, y: 0 };
    this.bobTimer = 0;
    this.speedBoostTimer = 0;
    this.ridingElevator = null;
    this.escalatorTravelDir = 0;
    this.clickStartPos = { x: 0, y: 0 };
    this.onCanvasClickInteract = null;

    this.camera.rotation.order = 'YXZ';
    this._syncCamera(0, 0);
    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.isDragging = false;
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    this.domElement.addEventListener('mousedown', (e) => {
      if (this.modalOpen) return;
      if (e.button === 0) {
        this.isDragging = true;
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;
        this.clickStartPos.x = e.clientX;
        this.clickStartPos.y = e.clientY;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (
        this.isDragging &&
        !this.modalOpen &&
        e.button === 0 &&
        Math.hypot(e.clientX - this.clickStartPos.x, e.clientY - this.clickStartPos.y) < 6 &&
        this.onCanvasClickInteract
      ) {
        this.onCanvasClickInteract();
      }
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.modalOpen) return;
      if (this.isPointerLocked) {
        this.yaw -= e.movementX * 0.0021;
        this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * 0.0019, -1.38, 1.38);
      } else if (this.isDragging) {
        const dx = e.clientX - this.lastMouse.x;
        const dy = e.clientY - this.lastMouse.y;
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;
        this.yaw -= dx * 0.0032;
        this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0028, -1.38, 1.38);
      }
    });
  }

  requestLock() {
    if (!this.modalOpen && this.domElement.requestPointerLock) {
      try {
        const p = this.domElement.requestPointerLock();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        // Drag-look fallback remains active!
      }
    }
  }

  grantCaffeineBoost(seconds = 45) {
    this.speedBoostTimer = Math.max(this.speedBoostTimer, seconds);
  }

  teleportTo(floorIndex, x, z, yaw = 0, pitch = -0.04) {
    this.floorIndex = THREE.MathUtils.clamp(floorIndex, 0, FLOORS.length - 1);
    this.ridingElevator = null;
    this.footPos.set(x, FLOORS[this.floorIndex].y, z);
    this.yaw = yaw;
    this.pitch = pitch;
    this._syncCamera(0, 0);
  }

  _canStandAt(tx, tz) {
    for (const lift of this.traversal.elevatorInstances) {
      const hd = lift.cabDepth * 0.46;
      // Full West doorway threshold (-0.95*w) through cab interior (+0.45*w) so ZERO doorway collision gap!
      if (
        tx >= lift.x - lift.cabWidth * 0.95 &&
        tx <= lift.x + lift.cabWidth * 0.45 &&
        Math.abs(tz - lift.z) <= hd
      ) {
        if (this.ridingElevator === lift) return true;
        if (lift.doorOpenAmount > 0.35 && Math.abs(lift.currentY - this.footPos.y) < 1.1) return true;
      }
    }

    const escHit = this.traversal.getEscalatorConveyor(tx, this.footPos.y, tz);
    if (escHit) return true;

    const r = 0.30;
    return (
      isWalkableOnFloor(this.floorIndex, tx, tz) &&
      isWalkableOnFloor(this.floorIndex, tx + r, tz) &&
      isWalkableOnFloor(this.floorIndex, tx - r, tz) &&
      isWalkableOnFloor(this.floorIndex, tx, tz + r) &&
      isWalkableOnFloor(this.floorIndex, tx, tz - r)
    );
  }

  update(dt, elapsed) {
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer = Math.max(0, this.speedBoostTimer - dt);
    }

    if (this.modalOpen) {
      this._syncCamera(0, elapsed);
      return;
    }

    if (this.keys.has('ArrowLeft')) this.yaw += 1.75 * dt;
    if (this.keys.has('ArrowRight')) this.yaw -= 1.75 * dt;

    let fwd = 0;
    let strafe = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) fwd += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) fwd -= 1;
    if (this.keys.has('KeyD')) strafe += 1;
    if (this.keys.has('KeyA')) strafe -= 1;

    fwd += this.touchMove.y;
    strafe += this.touchMove.x;

    const inputLen = Math.hypot(fwd, strafe);
    if (inputLen > 1) {
      fwd /= inputLen;
      strafe /= inputLen;
    }

    const sprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const boostMult = this.speedBoostTimer > 0 ? 1.28 : 1.0;
    const moveSpeed = (sprinting ? 9.5 : 5.8) * boostMult;

    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);
    let vx = (-sinY * fwd + cosY * strafe) * moveSpeed;
    const vz = (-cosY * fwd - sinY * strafe) * moveSpeed;

    // Auto-summon any nearby elevator on this floor so its doors are open as the player walks up!
    for (const lift of this.traversal.elevatorInstances) {
      if (this.floorIndex >= lift.minFloor && this.floorIndex <= lift.maxFloor) {
        const distToLift = Math.hypot(this.footPos.x - lift.x, this.footPos.z - lift.z);
        if (distToLift < 6.2 && lift.targetFloor !== this.floorIndex && lift.state === 'open') {
          this.traversal.commandElevator(lift.id, this.floorIndex, true);
        }
      }
    }

    const prevLift = this.ridingElevator;
    const liftNow = this.traversal.getActiveElevatorUnderPlayer(
      this.footPos.x,
      this.footPos.y,
      this.footPos.z
    );
    this.ridingElevator = liftNow;
    if (liftNow && !prevLift && document.pointerLockElement) {
      // Automatically unlock mouse cursor when stepping inside an elevator so floor buttons are clickable!
      document.exitPointerLock();
    }

    if (liftNow && liftNow.doorOpenAmount < 0.65) {
      const hw = liftNow.cabWidth * 0.36;
      const hd = liftNow.cabDepth * 0.36;
      this.footPos.x = THREE.MathUtils.clamp(this.footPos.x + vx * dt, liftNow.x - hw, liftNow.x + hw);
      this.footPos.z = THREE.MathUtils.clamp(this.footPos.z + vz * dt, liftNow.z - hd, liftNow.z + hd);
      this.footPos.y = liftNow.currentY;
      this.floorIndex = liftNow.currentFloor;
      this._syncCamera(0, elapsed);
      return;
    }

    let escVx = 0;
    const escBefore = this.traversal.getEscalatorConveyor(this.footPos.x, this.footPos.y, this.footPos.z);
    if (escBefore) {
      // Strictly enforce each escalator's true one-way mechanical direction!
      // esc.direction === 1 ALWAYS moves UP (xStart -> xEnd); esc.direction === -1 ALWAYS moves DOWN (xEnd -> xStart).
      const esc = escBefore.esc;
      const dirSign = esc.dx >= 0 ? 1 : -1;
      this.escalatorTravelDir = esc.direction * dirSign;
      if (
        (this.escalatorTravelDir > 0 && (this.footPos.x - esc.xEnd) < 0.85) ||
        (this.escalatorTravelDir < 0 && (this.footPos.x - esc.xStart) > -0.85)
      ) {
        escVx = this.escalatorTravelDir * 3.15;
      }
      // Prevent walking backwards against the escalator's mechanical direction
      if (vx * escVx < 0) {
        vx = 0;
      }
    } else {
      this.escalatorTravelDir = 0;
    }

    const dx = (vx + escVx) * dt;
    const dz = vz * dt;

    const candX = this.footPos.x + dx;
    const candZ = this.footPos.z + dz;

    if (this._canStandAt(candX, candZ)) {
      this.footPos.x = candX;
      this.footPos.z = candZ;
    } else if (this._canStandAt(candX, this.footPos.z)) {
      this.footPos.x = candX;
    } else if (this._canStandAt(this.footPos.x, candZ)) {
      this.footPos.z = candZ;
    }

    const escAfter = this.traversal.getEscalatorConveyor(this.footPos.x, this.footPos.y, this.footPos.z);
    if (escAfter) {
      this.footPos.y = escAfter.rampY;
      const frac = (this.footPos.y - escAfter.esc.y0) / escAfter.esc.dy;
      this.floorIndex = frac >= 0.5 ? escAfter.esc.upperFloor : escAfter.esc.lowerFloor;
    } else {
      const liftAfter = this.traversal.getActiveElevatorUnderPlayer(this.footPos.x, this.footPos.y, this.footPos.z);
      if (liftAfter) {
        this.ridingElevator = liftAfter;
        this.footPos.y = liftAfter.currentY;
        this.floorIndex = liftAfter.currentFloor;
      } else {
        const targetFloorY = FLOORS[this.floorIndex].y;
        this.footPos.y += (targetFloorY - this.footPos.y) * Math.min(1, dt * 14);
      }
    }

    const movingMag = Math.min(1, Math.hypot(vx, vz) / 5.8);
    if (movingMag > 0.08 && !escAfter) {
      this.bobTimer += dt * (sprinting ? 12.5 : 8.8);
    }
    const bobOffset = movingMag > 0.08 && !escAfter ? Math.sin(this.bobTimer) * 0.036 * movingMag : 0;

    const targetFov = sprinting && movingMag > 0.2 ? 73 : 68;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 8);
      this.camera.updateProjectionMatrix();
    }

    this._syncCamera(bobOffset, elapsed);
  }

  _syncCamera(bobOffset, elapsed) {
    let bridgeSway = 0;
    if (this.attractions) {
      bridgeSway = this.attractions.getRainbowBridgeSwayY(
        this.footPos.x,
        this.footPos.z,
        elapsed,
        this.floorIndex
      );
    }
    this.camera.position.set(
      this.footPos.x,
      this.footPos.y + EYE_HEIGHT + bobOffset + bridgeSway,
      this.footPos.z
    );
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
