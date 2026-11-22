import * as THREE from 'three';
import { FLOORS } from '../data/mallLayout.js';
import { createSculptedHumanRig, MATTE_CASUAL_TOP_COLORS, MATTE_CASUAL_BOTTOM_COLORS } from './humanRig.js';

const PATROL_ROUTES = [
  // LG: 1UE E-Street, Old Wing, Promenade, Rainforest, Highstreet, Oval
  { floor: 0, x1: -168, z1: -7.0, x2: -136, z2: -7.0, count: 6 },
  { floor: 0, x1: -166, z1: 7.5, x2: -136, z2: 7.5, count: 5 },
  { floor: 0, x1: -119, z1: -15.5, x2: -46, z2: -15.5, count: 12 },
  { floor: 0, x1: -118, z1: 15.8, x2: -46, z2: 15.8, count: 12 },
  { floor: 0, x1: -24, z1: 1.5, x2: 10, z2: 1.5, count: 5 },
  { floor: 0, x1: 62, z1: -11.5, x2: 112, z2: -11.5, count: 8 },
  { floor: 0, x1: 62, z1: 9.5, x2: 112, z2: 9.5, count: 8 },
  { floor: 0, x1: 118, z1: -14.8, x2: 158, z2: -14.8, count: 8 },
  { floor: 0, x1: 118, z1: 14.8, x2: 158, z2: 14.8, count: 7 },

  // G: 1UE MRT Link, Old Wing, Promenade, Rainforest G-Bridge, GF Luxe, Oval (keep clear of G-10 Oval lifts camera at 122.0, -15.2!)
  { floor: 1, x1: -175, z1: 4.5, x2: -134, z2: 4.5, count: 7 },
  { floor: 1, x1: -175, z1: -1.5, x2: -136, z2: -1.5, count: 6 },
  { floor: 1, x1: -118, z1: -16.2, x2: -44, z2: -16.2, count: 11 },
  { floor: 1, x1: -118, z1: 16.2, x2: -44, z2: 16.2, count: 11 },
  { floor: 1, x1: -24, z1: -1.8, x2: 10, z2: -1.8, count: 6 },
  { floor: 1, x1: 38, z1: -11.0, x2: 38, z2: 11.0, count: 4 },
  { floor: 1, x1: 62, z1: -15.5, x2: 115, z2: -15.5, count: 9 },
  { floor: 1, x1: 134, z1: -16.8, x2: 156, z2: -16.8, count: 4 },
  { floor: 1, x1: 62, z1: 15.5, x2: 156, z2: 15.5, count: 14 },

  // 1F: District K, Old Wing, Promenade, Rainforest, Highstreet, Oval (stop cleanly clear of 1UE escalators x=-146..-135.5!)
  { floor: 2, x1: -164, z1: -6.5, x2: -148.5, z2: -6.5, count: 5 },
  { floor: 2, x1: -162, z1: 6.5, x2: -148.5, z2: 6.5, count: 4 },
  { floor: 2, x1: -118, z1: -16.2, x2: -44, z2: -16.2, count: 8 },
  { floor: 2, x1: -118, z1: 16.2, x2: -44, z2: 16.2, count: 8 },
  { floor: 2, x1: -24, z1: 3.2, x2: 10, z2: 3.2, count: 5 },
  { floor: 2, x1: 22, z1: -16.2, x2: 154, z2: -16.2, count: 9 },
  { floor: 2, x1: 22, z1: 16.2, x2: 154, z2: 16.2, count: 9 },

  // 2F: WINDLAB/NextGen, Old Wing, Promenade, 2F Rainbow Bridge (>= 2.6m separated segments!), Highstreet, Pop Mart Oval
  { floor: 3, x1: -166, z1: 4.5, x2: -135, z2: 4.5, count: 6 },
  { floor: 3, x1: -118, z1: -16.2, x2: -44, z2: -16.2, count: 8 },
  { floor: 3, x1: -118, z1: 16.2, x2: -44, z2: 16.2, count: 8 },
  { floor: 3, x1: -24, z1: -2.2, x2: 10, z2: -2.2, count: 4 },
  { floor: 3, x1: 37.55, z1: -7.2, x2: 37.55, z2: -2.4, count: 1 },
  { floor: 3, x1: 38.75, z1: 0.4, x2: 38.75, z2: 5.4, count: 1 },
  { floor: 3, x1: 37.65, z1: 8.1, x2: 37.65, z2: 12.0, count: 1 },
  { floor: 3, x1: 60, z1: -15.5, x2: 156, z2: -15.5, count: 9 },
  { floor: 3, x1: 60, z1: 15.5, x2: 156, z2: 15.5, count: 9 },

  // 3F: NextGen T601, TGV IMAX, Celebrity Fitness, Ledge Art Gallery, XZQT (strictly |z| >= 15.2 or x >= 58.5, clear of Rainforest void & escalators!)
  { floor: 4, x1: -166, z1: 4.5, x2: -136, z2: 4.5, count: 6 },
  { floor: 4, x1: -118, z1: -16.2, x2: -46, z2: -16.2, count: 8 },
  { floor: 4, x1: -116, z1: 15.8, x2: -48, z2: 15.8, count: 6 },
  { floor: 4, x1: -24, z1: 0.0, x2: 10, z2: 0.0, count: 5 },
  { floor: 4, x1: 20, z1: -18.2, x2: 55, z2: -18.2, count: 3 },
  { floor: 4, x1: 70, z1: -16.2, x2: 101, z2: -16.2, count: 3 },
  { floor: 4, x1: 117, z1: -16.2, x2: 156, z2: -16.2, count: 3 },
  { floor: 4, x1: 70, z1: 16.0, x2: 101, z2: 16.0, count: 3 },
  { floor: 4, x1: 117, z1: 16.0, x2: 156, z2: 16.0, count: 4 },

  // 4F–5F Entertainment Zone: Strictly inside solid concourse walkways (|z| >= 15.5, clear of Rainforest void/skylight rim & escalators!)
  { floor: 5, x1: 22, z1: -18.0, x2: 101, z2: -18.0, count: 6 },
  { floor: 5, x1: 118, z1: -16.2, x2: 156, z2: -16.2, count: 4 },
  { floor: 5, x1: 24, z1: 16.8, x2: 101, z2: 16.8, count: 6 },
  { floor: 5, x1: 118, z1: 16.2, x2: 156, z2: 16.2, count: 4 },

  // UR Upper Roof: Strictly on Secret Garden & Oval Promenades (|z| >= 15.5, clear of Rainforest skylight rim & sport cages!)
  { floor: 6, x1: 27, z1: -16.2, x2: 52, z2: -16.2, count: 3 },
  { floor: 6, x1: 26, z1: 16.2, x2: 52, z2: 16.2, count: 3 },
  { floor: 6, x1: 120, z1: 16.2, x2: 156, z2: 16.2, count: 4 }
];

// Grounded Ambient Visitor Clusters admiring flagship attractions & browsing kiosks!
const AMBIENT_VISITORS = [
  // LG-01 FlowRider spectators watching surfer
  { floor: 0, x: -168.5, z: -3.2, rotY: -1.4 },
  { floor: 0, x: -168.8, z: 2.8, rotY: -1.7 },
  { floor: 0, x: -167.2, z: 0.4, rotY: -1.55 },
  // LG-04 Old Wing Festive Pavilion visitors (strictly clear of bazaar booths at [-87.5,-7.8] & [-85.5,8.2]!)
  { floor: 0, x: -81.2, z: -2.8, rotY: 1.2 },
  { floor: 0, x: -80.4, z: 3.4, rotY: 2.0 },
  { floor: 0, x: -65.0, z: -3.5, rotY: -1.2 },
  { floor: 0, x: -66.2, z: 4.4, rotY: -2.1 },
  // LG-09 Highstreet Garrett & Auntie Anne's customers
  { floor: 0, x: 81.5, z: -13.2, rotY: 0 },
  { floor: 0, x: 95.5, z: -14.2, rotY: 0 },
  // LG-10 Oval Ferrari 458 roadshow admirers (strictly outside r=7.2m velvet stanchion rope — ZERO stanchion clipping!)
  { floor: 0, x: 131.5, z: -8.6, rotY: 0.45 },
  { floor: 0, x: 132.2, z: 8.4, rotY: 2.35 },
  { floor: 0, x: 146.5, z: -6.8, rotY: -0.95 },
  { floor: 0, x: 146.2, z: 7.2, rotY: -2.25 },
  // G-10 GF Oval luxury shoppers browsing Parkson, DeGem & Panoramic Lift Lobby!
  { floor: 1, x: 165.8, z: -5.5, rotY: -1.45 },
  { floor: 1, x: 166.2, z: 5.8, rotY: -1.65 },
  { floor: 1, x: 164.0, z: -0.6, rotY: -1.55 },
  { floor: 1, x: 152.0, z: 16.5, rotY: 2.8 },
  { floor: 1, x: 140.5, z: 17.2, rotY: -0.4 },
  // G-03 Nadeje & Uniqlo shoppers + G-08/G-09 GF Luxe Dior/Chanel/Coach shoppers!
  { floor: 1, x: -110.2, z: -1.6, rotY: Math.PI },
  { floor: 1, x: 43.0, z: -18.2, rotY: 2.8 },
  { floor: 1, x: 50.5, z: -17.5, rotY: -2.4 },
  { floor: 1, x: 56.0, z: -19.0, rotY: Math.PI },
  { floor: 1, x: 76.5, z: -10.5, rotY: 0.6 },
  { floor: 1, x: 79.8, z: 9.8, rotY: 2.5 },
  { floor: 1, x: 89.2, z: -9.5, rotY: -0.9 },
  { floor: 1, x: 92.5, z: 9.2, rotY: -2.3 },
  { floor: 1, x: 83.2, z: -15.5, rotY: 0.2 },
  { floor: 1, x: 86.4, z: 15.2, rotY: 3.0 },
  // 1F-06 Promenade CU / Baskin-Robbins / Wong Kok shoppers!
  { floor: 2, x: -16.5, z: -3.2, rotY: 1.4 },
  { floor: 2, x: -11.5, z: 2.8, rotY: -1.8 },
  // 2F-05 Concierge visitor cleanly in front of counter (zero counter overlap!)
  { floor: 3, x: -48.8, z: 14.5, rotY: Math.PI / 2 },
  // 3F-01 NextGen VR spectators
  { floor: 4, x: -164.5, z: -5.5, rotY: -1.1 },
  { floor: 4, x: -165.0, z: 2.2, rotY: -2.0 },
  // LG-05 Old Wing AEON Supermarket & Bungkus Kaw Kaw shoppers (eliminates ghost-town!)
  { floor: 0, x: -40.2, z: 15.2, rotY: Math.PI },
  { floor: 0, x: -38.5, z: 18.2, rotY: 0.4 },
  { floor: 0, x: -44.0, z: 19.2, rotY: 1.3 },
  { floor: 0, x: -33.5, z: 17.0, rotY: -1.6 },
  // LG-07 Rainforest Koi Jetty visitors cleanly inset >1.15m inside timber deck (ZERO glass railing or post clipping!)
  { floor: 0, x: 28.4, z: -0.82, rotY: 0.95, yOff: 0.09 },
  { floor: 0, x: 29.3, z: 0.96, rotY: 2.15, yOff: 0.09 },
  // LG-08 Rainforest Arapaima Aquarium admirers on boardwalk
  { floor: 0, x: 51.8, z: -10.5, rotY: -2.4 },
  { floor: 0, x: 48.2, z: -11.2, rotY: Math.PI },
  // 1F-01 Rollerwa outside spectators (offset clear of ROLLERWA SKATE RENTAL sign!)
  { floor: 2, x: -164.8, z: -2.2, rotY: -1.6 },
  { floor: 2, x: -165.0, z: 4.5, rotY: -1.5 },
  // 2F-10 Pop Mart & TOP TOY Oval shoppers
  { floor: 3, x: 147.5, z: -18.5, rotY: Math.PI },
  { floor: 3, x: 156.5, z: -18.2, rotY: -2.6 },
  { floor: 3, x: 162.5, z: -17.5, rotY: Math.PI },
  // 4F-02 GSC Cinemas moviegoers at velvet ropes & e-kiosks
  { floor: 5, x: 48.5, z: -18.5, rotY: Math.PI },
  { floor: 5, x: 51.5, z: -18.2, rotY: -2.7 },
  { floor: 5, x: 57.5, z: -18.5, rotY: Math.PI },
  // 4F-06 Diva Karaoke guests (aligned to Diva Arch at x = 123.5!)
  { floor: 5, x: 121.0, z: 18.2, rotY: 0.35 },
  { floor: 5, x: 126.0, z: 18.0, rotY: -0.35 },
  // 4F-08 Cellini Oval strollers
  { floor: 5, x: 135.5, z: -18.2, rotY: 1.2 },
  { floor: 5, x: 148.5, z: -17.5, rotY: -1.3 }
];

const SHIRT_COLORS = [
  '#f8fafc', '#1e293b', '#e11d48', '#0284c7', '#059669',
  '#d97706', '#7c3aed', '#f472b6', '#0d9488', '#eab308', '#334155', '#991b1b'
];
const PANTS_COLORS = ['#0f172a', '#334155', '#1e3a8a', '#cbd5e1', '#27272a', '#44403c'];
const SKIN_TONES = ['#f5d0b5', '#e2a982', '#c6865c', '#8d5524'];
const BAG_COLORS = ['#dc2626', '#111827', '#15803d', '#eab308', '#ec4899', '#f8fafc'];

export function buildCrowdSystem(scene) {
  const root = new THREE.Group();
  root.name = 'MallShoppers';
  scene.add(root);

  const floorModelIdx = {};
  const floorColorIdx = {};
  function nextNpcVisuals(floor) {
    const m = floorModelIdx[floor] ?? (floor % 3);
    floorModelIdx[floor] = m + 1;
    const c = floorColorIdx[floor] ?? floor;
    floorColorIdx[floor] = c + 1;
    const shirtHex = MATTE_CASUAL_TOP_COLORS[c % MATTE_CASUAL_TOP_COLORS.length];
    let pantsHex = MATTE_CASUAL_BOTTOM_COLORS[(c * 2 + 1) % MATTE_CASUAL_BOTTOM_COLORS.length];
    if (pantsHex === shirtHex) {
      pantsHex = MATTE_CASUAL_BOTTOM_COLORS[(c * 2 + 2) % MATTE_CASUAL_BOTTOM_COLORS.length];
    }
    return { modelIdx: m % 3, shirtHex, pantsHex };
  }

  function createShopperMesh(seed, floor, allowBag = true) {
    const { modelIdx, shirtHex, pantsHex } = nextNpcVisuals(floor);
    return createSculptedHumanRig(seed, { allowBag, modelIdx, shirtHex, pantsHex });
  }

  const shoppers = [];
  const ambientMeshes = [];
  let idx = 0;

  for (const route of PATROL_ROUTES) {
    const floorY = FLOORS[route.floor].y;
    const isZRoute = Math.abs(route.x2 - route.x1) < 1.0;
    const allowBag = route.floor !== 6;
    for (let c = 0; c < route.count; c++) {
      idx++;
      const rig = createShopperMesh(idx, route.floor, allowBag);
      const t = (c + 0.5) / route.count;
      // Two distinct walking lanes separated by 1.3m so shoppers NEVER clip or merge into twins!
      const laneOffset = c % 2 === 0 ? -0.65 : 0.65;
      const x1 = route.x1 + (isZRoute ? laneOffset * 0.35 : 0);
      const z1 = route.z1 + (isZRoute ? 0 : laneOffset);
      const x2 = route.x2 + (isZRoute ? laneOffset * 0.35 : 0);
      const z2 = route.z2 + (isZRoute ? 0 : laneOffset);

      const x = THREE.MathUtils.lerp(x1, x2, t);
      const z = THREE.MathUtils.lerp(z1, z2, t);
      rig.group.position.set(x, floorY, z);
      root.add(rig.group);

      shoppers.push({
        ...rig,
        floor: route.floor,
        x1,
        z1,
        x2,
        z2,
        t,
        dir: c % 2 === 0 ? 1 : -1,
        speed: 1.0 + (idx % 4) * 0.14,
        phase: idx * 1.7
      });
    }
  }

  // Spawn grounded ambient visitors in natural motion-captured relaxed idle stances
  for (const av of AMBIENT_VISITORS) {
    idx++;
    const { modelIdx, shirtHex, pantsHex } = nextNpcVisuals(av.floor);
    const rig = createSculptedHumanRig(idx, { allowBag: av.floor !== 6, idlePose: true, modelIdx, shirtHex, pantsHex });
    rig.group.position.set(av.x, FLOORS[av.floor].y + (av.yOff || 0), av.z);
    rig.group.rotation.y = av.rotY;
    root.add(rig.group);
    ambientMeshes.push({
      group: rig.group,
      mixer: rig.mixer,
      headGroup: rig.headGroup,
      torso: rig.torso,
      baseHeadRotY: rig.baseHeadRotY || 0,
      phase: idx * 1.37,
      floor: av.floor
    });
  }

  let animFrame = 0;
  function update(dt, elapsed, camPos, playerFloor = 1) {
    animFrame++;
    const safeDt = Math.min(dt, 0.05);
    const totalLenVec = new THREE.Vector2();
    const cx = camPos ? camPos.x : 0;
    const cz = camPos ? camPos.z : 0;
    for (let i = 0; i < shoppers.length; i++) {
      const s = shoppers[i];
      const dist = totalLenVec.set(s.x2 - s.x1, s.z2 - s.z1).length() || 1;
      s.t += (s.dir * s.speed * safeDt) / dist;
      if (s.t >= 1) {
        s.t = 1;
        s.dir = -1;
      } else if (s.t <= 0) {
        s.t = 0;
        s.dir = 1;
      }
      const nx = THREE.MathUtils.lerp(s.x1, s.x2, s.t);
      const nz = THREE.MathUtils.lerp(s.z1, s.z2, s.t);
      s.group.position.x = nx;
      s.group.position.z = nz;

      let manhattan = 12;
      if (camPos) {
        const dx = nx - cx;
        const dz = nz - cz;
        manhattan = Math.abs(dx) + Math.abs(dz);
        const floorDiff = Math.abs(s.floor - playerFloor);
        const isVis = dx * dx + dz * dz >= 17.64 && manhattan <= 46 && (floorDiff === 0 || (floorDiff === 1 && manhattan <= 26));
        s.group.visible = isVis;
        if (!isVis) continue;
      }

      s.group.rotation.y = Math.atan2((s.x2 - s.x1) * s.dir, (s.z2 - s.z1) * s.dir);
      if (s.mixer) {
        // Sync Mixamo stride speed to ground travel speed so feet NEVER skate!
        // Throttle distant shoppers > 24m to every 2nd frame for locked 60 FPS!
        if (manhattan <= 24 || (animFrame + i) % 2 === 0) {
          const stepDt = manhattan <= 24 ? safeDt : safeDt * 2.0;
          s.mixer.update(stepDt * (s.speed * 0.88));
        }
      }
    }

    if (camPos) {
      for (let i = 0; i < ambientMeshes.length; i++) {
        const av = ambientMeshes[i];
        const manhattan = Math.abs(av.group.position.x - cx) + Math.abs(av.group.position.z - cz);
        const floorDiff = Math.abs(av.floor - playerFloor);
        const isVis = manhattan <= 50 && (floorDiff === 0 || (floorDiff === 1 && manhattan <= 28));
        av.group.visible = isVis;
        if (isVis && av.mixer && (manhattan <= 22 || (animFrame + i) % 2 === 0)) {
          av.mixer.update(manhattan <= 22 ? safeDt : safeDt * 2.0);
        }
      }
    }
  }

  // Prevents ANY NPC from photobombing close to the lens during QA inspection!
  function enforceCameraClearance(camPos, minDist = 4.6) {
    for (const s of shoppers) {
      const d = s.group.position.distanceTo(camPos);
      s.group.visible = d >= minDist && d <= 98;
    }
    for (const av of ambientMeshes) {
      const d = av.group.position.distanceTo(camPos);
      av.group.visible = d >= minDist && d <= 98;
    }
  }

  function restoreVisibility() {
    for (const s of shoppers) s.group.visible = true;
    for (const av of ambientMeshes) av.group.visible = true;
  }

  return { root, update, enforceCameraClearance, restoreVisibility };
}
