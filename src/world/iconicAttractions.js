import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { BOUNDS } from '../data/mallLayout.js';
import { collapseStaticMeshes } from './batchUtils.js';
import { createSculptedHumanRig } from './humanRig.js';
import {
  createRoadAsphaltTexture,
  createUrbanGroundTexture,
  createSkyscraperCurtainTexture,
  createOneWorldHotelTexture,
  createPerforatedNetTexture,
  createTeakBoardwalkMaps,
  createPalmFrondTexture,
  createHangingVineTexture,
  createMossyRockMaps,
  createRiverPebbleTexture,
  createContactShadowTexture,
  createGalleryArtworkTexture,
  createSignBoardTexture,
  createSecretGardenArchTexture,
  createMaimaiScreenTexture,
  createBowlingScoreTexture,
  createStrikeZoneTexture,
  createWayfindingTexture,
  createSilverMosaicMaps,
  createRainforestBridgeStripeTexture
} from '../graphics/proceduralTextures.js';
import {
  createKoiPondWaterMaterial,
  createWaterfallMaterial,
  createFlowRiderWaveMaterial,
  createWindTunnelVortexMaterial,
  createVolumetricGodRayMaterial
} from '../graphics/shaders.js';

// Shared High-Craft Botanical & Natural Asset Generators (Batched cleanly by collapseStaticMeshes!)
let sharedBotanicalMats = null;
function getBotanicalMaterials() {
  if (sharedBotanicalMats) return sharedBotanicalMats;
  const frondTex = createPalmFrondTexture();
  const vineTex = createHangingVineTexture(false);
  const flowerVineTex = createHangingVineTexture(true);
  const rockMaps = createMossyRockMaps();
  const pebbleTex = createRiverPebbleTexture();

  // Soft radial foam froth sprite for waterfall impact (ZERO solid white cylinders!)
  const foamCanvas = document.createElement('canvas');
  foamCanvas.width = foamCanvas.height = 256;
  const fCtx = foamCanvas.getContext('2d');
  const fg = fCtx.createRadialGradient(128, 128, 12, 128, 128, 122);
  fg.addColorStop(0.0, 'rgba(235, 249, 255, 0.72)');
  fg.addColorStop(0.35, 'rgba(205, 240, 252, 0.42)');
  fg.addColorStop(0.72, 'rgba(170, 226, 245, 0.14)');
  fg.addColorStop(1.0, 'rgba(170, 226, 245, 0.0)');
  fCtx.fillStyle = fg;
  fCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 65; i++) {
    const ang = (i * 2.39996);
    const rad = Math.sqrt(i / 65) * 96;
    fCtx.fillStyle = `rgba(255,255,255,${0.12 + (i % 4) * 0.06})`;
    fCtx.beginPath();
    fCtx.arc(128 + Math.cos(ang) * rad, 128 + Math.sin(ang) * rad, 3 + (i % 6) * 2.2, 0, Math.PI * 2);
    fCtx.fill();
  }
  const foamTex = new THREE.CanvasTexture(foamCanvas);
  foamTex.colorSpace = THREE.SRGBColorSpace;

  // Lift karst limestone albedo cleanly to sunlit Malaysian karst (#7a7468 wet / #789660 mossy) — ZERO crushed black crevices!
  const buildLiftedKarstTex = (baseHex, mossHex) => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);
    if (rockMaps.map && rockMaps.map.image) {
      ctx.globalAlpha = 0.42;
      ctx.drawImage(rockMaps.map.image, 0, 0, 512, 512);
      ctx.globalAlpha = 1.0;
    }
    // Soft warm mineral limestone mottling & pale calcareous strata streaks
    for (let i = 0; i < 220; i++) {
      const rx = ((i * 73) % 512);
      const ry = ((i * 139) % 512);
      const rw = 24 + (i % 5) * 16;
      const rh = 7 + (i % 4) * 5;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(186, 178, 162, 0.22)' : i % 3 === 1 ? 'rgba(118, 112, 98, 0.18)' : mossHex;
      ctx.fillRect(rx - rw * 0.5, ry - rh * 0.5, rw, rh);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const liftedWetKarstTex = buildLiftedKarstTex('#847e72', 'rgba(120, 150, 96, 0.16)');
  const liftedMossKarstTex = buildLiftedKarstTex('#7c9a64', 'rgba(104, 138, 76, 0.28)');

  // Alpha-cutout dense botanical shrub sprig card (for 3D instanced green & burgundy-tipped rooftop hedges!)
  const shrubC = document.createElement('canvas');
  shrubC.width = shrubC.height = 256;
  const sCtx = shrubC.getContext('2d');
  sCtx.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 58; i++) {
    const a = i * 2.39996;
    const rad = Math.sqrt(i / 58) * 102;
    const lx = 128 + Math.cos(a) * rad;
    const ly = 128 + Math.sin(a) * rad;
    const lw = 18 + (i % 5) * 5;
    const lh = 30 + (i % 4) * 7;
    sCtx.save();
    sCtx.translate(lx, ly);
    sCtx.rotate(a + ((i % 3) - 1) * 0.45);
    const lLum = 185 + (i % 5) * 15;
    sCtx.fillStyle = `rgb(${lLum}, ${lLum}, ${lLum})`;
    sCtx.beginPath();
    sCtx.ellipse(0, 0, lw * 0.5, lh * 0.5, 0, 0, Math.PI * 2);
    sCtx.fill();
    sCtx.strokeStyle = 'rgba(255,255,255,0.45)';
    sCtx.lineWidth = 1.4;
    sCtx.beginPath();
    sCtx.moveTo(0, -lh * 0.42);
    sCtx.lineTo(0, lh * 0.42);
    sCtx.stroke();
    sCtx.restore();
  }
  const shrubLeafTex = new THREE.CanvasTexture(shrubC);
  shrubLeafTex.colorSpace = THREE.SRGBColorSpace;

  // Alpha-cutout split-leaf Monstera Deliciosa & veined Elephant-Ear Alocasia leaf textures for Secret Garden understory!
  const monC = document.createElement('canvas');
  monC.width = monC.height = 256;
  const mCtx = monC.getContext('2d');
  mCtx.clearRect(0, 0, 256, 256);
  const monG = mCtx.createRadialGradient(128, 132, 14, 128, 128, 114);
  monG.addColorStop(0, '#2d7a3e');
  monG.addColorStop(0.65, '#1f6331');
  monG.addColorStop(1, '#144922');
  mCtx.fillStyle = monG;
  mCtx.beginPath();
  mCtx.moveTo(128, 22);
  mCtx.bezierCurveTo(222, 42, 236, 178, 168, 224);
  mCtx.quadraticCurveTo(142, 238, 128, 206);
  mCtx.quadraticCurveTo(114, 238, 88, 224);
  mCtx.bezierCurveTo(20, 178, 34, 42, 128, 22);
  mCtx.closePath();
  mCtx.fill();
  // Fenestration leaf splits (punch clean alpha cutouts!)
  mCtx.globalCompositeOperation = 'destination-out';
  for (const side of [-1, 1]) {
    for (let s = 0; s < 4; s++) {
      const sy = 64 + s * 38;
      mCtx.beginPath();
      mCtx.ellipse(128 + side * 78, sy, 46, 7.5, side * -0.26, 0, Math.PI * 2);
      mCtx.fill();
    }
  }
  mCtx.globalCompositeOperation = 'source-over';
  mCtx.strokeStyle = '#6db36b';
  mCtx.lineWidth = 4;
  mCtx.beginPath();
  mCtx.moveTo(128, 212);
  mCtx.lineTo(128, 32);
  mCtx.stroke();
  const monsteraTex = new THREE.CanvasTexture(monC);
  monsteraTex.colorSpace = THREE.SRGBColorSpace;

  const eleC = document.createElement('canvas');
  eleC.width = eleC.height = 256;
  const eCtx = eleC.getContext('2d');
  eCtx.clearRect(0, 0, 256, 256);
  const eleG = eCtx.createLinearGradient(128, 16, 128, 240);
  eleG.addColorStop(0, '#3a8c44');
  eleG.addColorStop(0.55, '#256c32');
  eleG.addColorStop(1, '#184c23');
  eCtx.fillStyle = eleG;
  eCtx.beginPath();
  eCtx.moveTo(128, 14);
  eCtx.bezierCurveTo(212, 92, 228, 198, 174, 236);
  eCtx.quadraticCurveTo(146, 244, 128, 196);
  eCtx.quadraticCurveTo(110, 244, 82, 236);
  eCtx.bezierCurveTo(28, 198, 44, 92, 128, 14);
  eCtx.closePath();
  eCtx.fill();
  eCtx.strokeStyle = '#9dd48a';
  eCtx.lineWidth = 4;
  eCtx.beginPath();
  eCtx.moveTo(128, 198);
  eCtx.lineTo(128, 24);
  for (let v = 0; v < 5; v++) {
    const vy = 62 + v * 30;
    eCtx.moveTo(128, vy);
    eCtx.lineTo(128 - 54 + v * 4, vy + 24);
    eCtx.moveTo(128, vy);
    eCtx.lineTo(128 + 54 - v * 4, vy + 24);
  }
  eCtx.stroke();
  const elephantEarTex = new THREE.CanvasTexture(eleC);
  elephantEarTex.colorSpace = THREE.SRGBColorSpace;

  sharedBotanicalMats = {
    trunkMat: new THREE.MeshStandardMaterial({ color: '#5c4230', roughness: 0.90, metalness: 0.0, envMapIntensity: 0.35 }),
    crownshaftMat: new THREE.MeshStandardMaterial({ color: '#2b542c', roughness: 0.72, metalness: 0.0, envMapIntensity: 0.38 }),
    frondDeep: new THREE.MeshStandardMaterial({
      map: frondTex,
      color: '#d4ecc4',
      alphaTest: 0.40,
      transparent: false,
      roughness: 0.56,
      metalness: 0.02,
      envMapIntensity: 0.45,
      side: THREE.DoubleSide
    }),
    frondWarm: new THREE.MeshStandardMaterial({
      map: frondTex,
      color: '#c4e0a8',
      alphaTest: 0.40,
      transparent: false,
      roughness: 0.60,
      metalness: 0.02,
      envMapIntensity: 0.42,
      side: THREE.DoubleSide
    }),
    shrubLeafCard: new THREE.MeshStandardMaterial({
      map: shrubLeafTex,
      color: '#ffffff',
      alphaTest: 0.38,
      transparent: false,
      roughness: 0.74,
      metalness: 0.0,
      envMapIntensity: 0.25,
      side: THREE.DoubleSide
    }),
    monsteraLeaf: new THREE.MeshStandardMaterial({
      map: monsteraTex,
      color: '#e6f5de',
      alphaTest: 0.40,
      transparent: false,
      roughness: 0.48,
      metalness: 0.02,
      envMapIntensity: 0.38,
      side: THREE.DoubleSide
    }),
    elephantEarLeaf: new THREE.MeshStandardMaterial({
      map: elephantEarTex,
      color: '#e8f7e0',
      alphaTest: 0.40,
      transparent: false,
      roughness: 0.52,
      metalness: 0.02,
      envMapIntensity: 0.36,
      side: THREE.DoubleSide
    }),
    heliconiaRed: new THREE.MeshStandardMaterial({
      color: '#dc2626',
      emissive: '#7f1d1d',
      emissiveIntensity: 0.16,
      roughness: 0.38,
      metalness: 0.04
    }),
    heliconiaTip: new THREE.MeshStandardMaterial({
      color: '#facc15',
      roughness: 0.40,
      metalness: 0.02
    }),
    hangingVine: new THREE.MeshStandardMaterial({
      map: vineTex,
      color: '#d8ecc8',
      alphaTest: 0.38,
      transparent: false,
      roughness: 0.64,
      metalness: 0.02,
      envMapIntensity: 0.40,
      side: THREE.DoubleSide
    }),
    floweringVine: new THREE.MeshStandardMaterial({
      map: flowerVineTex,
      color: '#f4ece8',
      alphaTest: 0.38,
      transparent: false,
      roughness: 0.62,
      metalness: 0.02,
      envMapIntensity: 0.42,
      side: THREE.DoubleSide
    }),
    wetKarst: new THREE.MeshStandardMaterial({
      map: liftedWetKarstTex,
      color: '#a8a294',
      normalMap: rockMaps.normalMap,
      normalScale: new THREE.Vector2(1.45, 1.45),
      roughnessMap: rockMaps.roughnessMap,
      emissive: '#2e2b24',
      emissiveIntensity: 0.16,
      roughness: 0.42,
      metalness: 0.04,
      envMapIntensity: 0.65
    }),
    wetLowerKarst: new THREE.MeshPhysicalMaterial({
      map: liftedWetKarstTex,
      color: '#6b665d',
      normalMap: rockMaps.normalMap,
      normalScale: new THREE.Vector2(1.55, 1.55),
      emissive: '#1e1c18',
      emissiveIntensity: 0.10,
      roughness: 0.10,
      metalness: 0.06,
      clearcoat: 0.88,
      clearcoatRoughness: 0.08,
      envMapIntensity: 0.92
    }),
    mossKarst: new THREE.MeshStandardMaterial({
      map: liftedMossKarstTex,
      color: '#94ae78',
      normalMap: rockMaps.normalMap,
      normalScale: new THREE.Vector2(1.38, 1.38),
      roughnessMap: rockMaps.roughnessMap,
      emissive: '#26361d',
      emissiveIntensity: 0.18,
      roughness: 0.58,
      metalness: 0.02,
      envMapIntensity: 0.44
    }),
    riverBed: new THREE.MeshStandardMaterial({
      map: pebbleTex,
      color: '#a8b8ae',
      roughness: 0.85,
      metalness: 0.04,
      envMapIntensity: 0.35
    }),
    foamDecal: new THREE.MeshBasicMaterial({
      map: foamTex,
      transparent: true,
      opacity: 0.48,
      depthWrite: false
    }),
    flowerCoral: new THREE.MeshStandardMaterial({ color: '#e11d48', roughness: 0.56, side: THREE.DoubleSide }),
    flowerMagenta: new THREE.MeshStandardMaterial({ color: '#c026d3', roughness: 0.56, side: THREE.DoubleSide }),
    flowerGold: new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.48 })
  };
  return sharedBotanicalMats;
}

// Parabolically arched & subtly V-cupped palm frond geometry (catches directional sunlight & casts feathered shadows!)
function createArchedFrondGeo(width, length, droop = 0.36) {
  const geo = new THREE.PlaneGeometry(width, length, 2, 6);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = (y + length * 0.5) / length;
    const archY = Math.sin(t * Math.PI * 0.86) * length * 0.25 - t * t * length * droop;
    const archZ = t * length;
    const vCup = -Math.abs(x) * 0.16 * (0.35 + 0.65 * t);
    pos.setXYZ(i, x, archY + vCup, archZ);
  }
  geo.computeVertexNormals();
  return geo;
}

// Draped undulating curtain geometry for Rainforest hanging vines & pergola climbers
function createDrapedVineGeo(width, length, seed = 0) {
  const geo = new THREE.PlaneGeometry(width, length, 2, 6);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = 1.0 - (y + length * 0.5) / length; // 0 at top, 1 at bottom tip
    const waveZ = Math.sin(t * Math.PI * 2.1 + seed) * 0.12 * t + Math.cos(x * 3.0 + seed) * 0.05;
    pos.setZ(i, waveZ);
  }
  geo.computeVertexNormals();
  return geo;
}

// Angular fractured craggy Malaysian karst limestone boulder (sharp geological strata ledges — ZERO smooth Play-Doh spheres!)
function createOrganicBoulderGeo(radius, seed = 1.0) {
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = x / Math.max(0.001, radius);
    const nyNorm = y / Math.max(0.001, radius);
    const nz = z / Math.max(0.001, radius);
    // Sharp karst fracture planes + terraced limestone strata + angular crevices
    const ridge1 = Math.abs(Math.sin(nx * 3.8 + seed) * Math.cos(nz * 3.4 - seed * 0.7));
    const ridge2 = 1.0 - Math.abs(Math.sin(nyNorm * 5.2 + nx * 2.7 + seed * 1.9));
    const crag = Math.sin(nx * 7.5 + nz * 6.3 + seed * 2.3) * 0.09;
    const strataShelf = Math.floor((nyNorm + 1.0) * 4.5) * 0.055;
    const disp = 0.78 + ridge1 * 0.34 + ridge2 * 0.22 + crag + strataShelf;
    let ny = y * (0.88 + ridge1 * 0.20 + ridge2 * 0.12);
    if (ny < -radius * 0.44) ny = -radius * 0.44 + (ny + radius * 0.44) * 0.22;
    pos.setXYZ(i, x * disp, ny, z * disp);
  }
  geo.computeVertexNormals();
  return geo;
}

let personSeedCounter = 11;
function createArticulatedPerson({
  shirt = null,
  pants = null,
  helmet = null,
  prop = null,
  sitting = false
} = {}) {
  personSeedCounter += 3;
  const rig = createSculptedHumanRig(personSeedCounter, {
    allowBag: false,
    sitting,
    shirtHex: shirt,
    pantsHex: pants,
    helmetHex: helmet,
    prop
  });
  return rig.group;
}

function createSlattedBench(length = 2.4, woodMat, metalMat) {
  const g = new THREE.Group();
  for (const lx of [-length * 0.38, length * 0.38]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.42, 0.64), metalMat);
    leg.position.set(lx, 0.21, 0);
    // Solid angled steel backrest stanchion connecting leg/seat firmly to BOTH backrest slats (ZERO floating backrest!)
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 0.08), metalMat);
    bracket.position.set(lx, 0.66, -0.33);
    bracket.rotation.x = -0.18;
    const armConn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.22), metalMat);
    armConn.position.set(lx, 0.41, -0.26);
    g.add(leg, bracket, armConn);
  }
  for (let s = 0; s < 4; s++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(length, 0.055, 0.13), woodMat);
    slat.position.set(0, 0.45, -0.24 + s * 0.16);
    g.add(slat);
  }
  // Angled slatted backrest mounted directly onto both steel stanchions
  for (let b = 0; b < 2; b++) {
    const backSlat = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, 0.05), woodMat);
    backSlat.position.set(0, 0.66 + b * 0.16, -0.31 - b * 0.03);
    backSlat.rotation.x = -0.18;
    g.add(backSlat);
  }
  return g;
}

function createTropicalPlant(scale = 1.0, trunkHeight = 3.2, frondCount = 10, hueShift = 0, withFlowers = false) {
  const mats = getBotanicalMaterials();
  const g = new THREE.Group();

  let topX = 0;
  let topZ = 0;
  if (trunkHeight > 0.3) {
    const segs = Math.max(5, Math.min(10, Math.round(trunkHeight * 1.15)));
    const curveAmp = Math.min(0.42, trunkHeight * 0.055) * scale;
    const leanDir = (hueShift * 37.0) % (Math.PI * 2);
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs;
      const t1 = (i + 1) / segs;
      const rBot = (0.21 * (1 - t0 * 0.42) + (i === 0 ? 0.05 : 0)) * scale;
      const rTop = 0.20 * (1 - t1 * 0.42) * scale;
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(rTop, rBot, trunkHeight / segs + 0.08, 10),
        mats.trunkMat
      );
      const sx = Math.cos(leanDir) * Math.sin(t0 * Math.PI * 0.72) * curveAmp;
      const sz = Math.sin(leanDir) * Math.sin(t0 * Math.PI * 0.72) * curveAmp;
      seg.position.set(sx, ((i + 0.5) * trunkHeight) / segs, sz);
      seg.castShadow = true;
      seg.receiveShadow = true;
      g.add(seg);
      if (i === segs - 1) {
        topX = sx;
        topZ = sz;
      }
    }
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13 * scale, 0.16 * scale, 0.44 * scale, 10),
      mats.crownshaftMat
    );
    crown.position.set(topX, trunkHeight + 0.14 * scale, topZ);
    crown.castShadow = true;
    g.add(crown);
  }

  // Two natural tiers of curved alpha-cutout pinnate royal-palm fronds (upper soaring + lower arching!)
  const upperGeo = createArchedFrondGeo(1.06 * scale, 2.35 * scale, 0.26);
  const lowerGeo = createArchedFrondGeo(1.18 * scale, 2.55 * scale, 0.46);
  const effectiveFronds = Math.max(8, frondCount);
  for (let f = 0; f < effectiveFronds; f++) {
    const isUpper = f % 2 === 0;
    const a = (f / effectiveFronds) * Math.PI * 2 + (isUpper ? 0.0 : 0.22);
    const frond = new THREE.Mesh(
      isUpper ? upperGeo : lowerGeo,
      (f + Math.round(hueShift * 100)) % 2 === 0 ? mats.frondDeep : mats.frondWarm
    );
    frond.position.set(topX, trunkHeight + (trunkHeight > 0.3 ? 0.26 : 0.14) * scale, topZ);
    frond.rotation.y = a;
    frond.rotation.x = isUpper ? -0.24 : 0.10;
    frond.rotation.z = Math.sin(f * 2.3) * 0.14;
    frond.castShadow = true;
    g.add(frond);
  }

  // Lush feathery fern rosette around trunk base (alpha-cutout fronds — ZERO solid boxes!)
  const fernGeo = createArchedFrondGeo(0.56 * scale, 1.05 * scale, 0.34);
  for (let b = 0; b < 7; b++) {
    const ba = (b / 7) * Math.PI * 2 + hueShift * 4.0;
    const fern = new THREE.Mesh(fernGeo, b % 2 === 0 ? mats.frondWarm : mats.frondDeep);
    fern.position.set(Math.cos(ba) * 0.14 * scale, 0.12 * scale, Math.sin(ba) * 0.14 * scale);
    fern.rotation.y = ba;
    fern.rotation.x = -0.18 + (b % 2) * 0.16;
    fern.castShadow = true;
    g.add(fern);
  }

  if (withFlowers) {
    // Rich tropical hibiscus / bougainvillea blossom clusters nestled into the lower ferns!
    const fMat = hueShift > 0.03 ? mats.flowerCoral : mats.flowerMagenta;
    for (let fl = 0; fl < 5; fl++) {
      const a = (fl / 5) * Math.PI * 2 + 0.35;
      const rad = (0.48 + (fl % 2) * 0.24) * scale;
      const fx = Math.cos(a) * rad;
      const fz = Math.sin(a) * rad;
      const fy = (0.36 + (fl % 3) * 0.14) * scale;
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 6, 6), mats.flowerGold);
      center.position.set(fx, fy, fz);
      g.add(center);
      for (let pt = 0; pt < 5; pt++) {
        const pa = (pt / 5) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.CircleGeometry(0.095 * scale, 6), fMat);
        petal.position.set(fx + Math.cos(pa) * 0.08 * scale, fy, fz + Math.sin(pa) * 0.08 * scale);
        petal.rotation.x = -Math.PI * 0.42;
        petal.rotation.z = pa;
        g.add(petal);
      }
    }
  }
  return g;
}

function createSportsFieldTexture(kind = 'futsal') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  if (kind === 'futsal') {
    // Mowed striped artificial futsal turf with crisp white markings
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#166534';
      ctx.fillRect(i * 64, 0, 64, 512);
    }
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 472, 472);
    ctx.beginPath();
    ctx.moveTo(256, 20);
    ctx.lineTo(256, 492);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(256, 256, 68, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(20, 146, 86, 220);
    ctx.strokeRect(406, 146, 86, 220);
  } else {
    // ASCARO Blue Padel Court with crisp white service & center lines
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(28, 28, 456, 456);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(28, 28, 456, 456);
    ctx.beginPath();
    ctx.moveTo(148, 28);
    ctx.lineTo(148, 484);
    ctx.moveTo(364, 28);
    ctx.lineTo(364, 484);
    ctx.moveTo(148, 256);
    ctx.lineTo(364, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function buildIconicAttractions(scene, interactables) {
  const root = new THREE.Group();
  root.name = 'IconicAttractions';
  scene.add(root);

  const shadowTex = createContactShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  function addShadow(parent, x, y, z, sx = 3, sz = 3) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), shadowMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y + 0.018, z);
    parent.add(m);
  }

  const steelDarkMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.32, metalness: 0.78 });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#d4af37', roughness: 0.22, metalness: 0.85 });
  const perfNetTex = createPerforatedNetTexture('#ffffff');
  const perfNetMat = new THREE.MeshStandardMaterial({
    map: perfNetTex,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
    roughness: 0.65
  });

  // ==========================================================================
  // 1. THE RAINFOREST (LG KOI POND, ANGLED WATERFALL, AQUARIUM & 2F RAINBOW BRIDGE)
  // ==========================================================================
  const botMats = getBotanicalMaterials();
  const rainforestGroup = new THREE.Group();
  root.add(rainforestGroup);

  const kp = BOUNDS.koiPond;
  const pondW = kp.xMax - kp.xMin;
  const pondD = kp.zMax - kp.zMin;
  const pondCX = (kp.xMin + kp.xMax) * 0.5;

  // Textured river-pebble pond bed visible through translucent Beer-Lambert water!
  const pondBed = new THREE.Mesh(
    new THREE.BoxGeometry(pondW + 0.6, 0.2, pondD + 0.6),
    botMats.riverBed
  );
  pondBed.position.set(pondCX, -1.12, 0);
  pondBed.receiveShadow = true;
  rainforestGroup.add(pondBed);

  const rockMat = botMats.wetKarst;
  const wetLowerRockMat = botMats.wetLowerKarst;
  const mossRockMat = botMats.mossKarst;

  // Pre-build 6 craggy vertex-displaced karst limestone boulder templates (ZERO smooth Play-Doh spheres!)
  const boulderTemplates = [
    createOrganicBoulderGeo(0.72, 1.3),
    createOrganicBoulderGeo(0.88, 2.9),
    createOrganicBoulderGeo(1.04, 4.7),
    createOrganicBoulderGeo(0.62, 6.4),
    createOrganicBoulderGeo(0.94, 8.1),
    createOrganicBoulderGeo(0.78, 10.5)
  ];

  // Scattered submerged river cobbles resting on the pebble bed for realistic underwater depth!
  for (let c = 0; c < 14; c++) {
    const cb = new THREE.Mesh(boulderTemplates[c % boulderTemplates.length], c % 2 === 0 ? wetLowerRockMat : mossRockMat);
    cb.scale.set(1.15, 0.42, 0.95);
    cb.position.set(
      pondCX + Math.sin(c * 2.4) * (pondW * 0.34),
      -0.96,
      Math.cos(c * 1.9) * (pondD * 0.34)
    );
    cb.rotation.y = c * 1.1;
    rainforestGroup.add(cb);
  }

  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const rx = pondW * 0.49 + Math.sin(i * 3.1) * 0.28;
    const rz = pondD * 0.49 + Math.cos(i * 2.7) * 0.28;
    const rock = new THREE.Mesh(
      boulderTemplates[i % boulderTemplates.length],
      i % 4 === 0 ? mossRockMat : wetLowerRockMat
    );
    rock.scale.set(1.22, 0.68, 1.05);
    rock.position.set(pondCX + Math.cos(a) * rx, -0.34, Math.sin(a) * rz);
    rock.rotation.set((i % 3) * 0.14, i * 0.85, ((i + 1) % 3) * 0.12);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rainforestGroup.add(rock);
  }

  const koiWaterMat = createKoiPondWaterMaterial();
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(pondW, pondD, 24, 16), koiWaterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(pondCX, -0.22, 0);
  rainforestGroup.add(waterMesh);

  // 34 Streamlined Sculpted Nishikigoi Koi (Smooth LatheGeometry curved fish profile + translucent fanned fins — ZERO rigid torpedo cones!)
  const koiColors = ['#ea580c', '#dc2626', '#f59e0b', '#f8fafc', '#fb7185'];
  const koiList = [];
  const koiProfile = [
    new THREE.Vector2(0.002, -0.34),
    new THREE.Vector2(0.026, -0.26),
    new THREE.Vector2(0.056, -0.14),
    new THREE.Vector2(0.086, -0.02),
    new THREE.Vector2(0.095, 0.10),
    new THREE.Vector2(0.078, 0.22),
    new THREE.Vector2(0.042, 0.30),
    new THREE.Vector2(0.002, 0.34)
  ];
  const koiBodyGeo = new THREE.LatheGeometry(koiProfile, 12);
  koiBodyGeo.rotateX(Math.PI / 2);
  koiBodyGeo.scale(0.84, 0.72, 1.0);
  const koiPecGeo = new THREE.CircleGeometry(0.11, 8, 0, Math.PI * 0.72);
  koiPecGeo.rotateX(-Math.PI / 2);
  const koiTailGeo = new THREE.CircleGeometry(0.15, 8, -0.58, 1.16);
  koiTailGeo.rotateY(Math.PI / 2);
  const koiFinMat = new THREE.MeshStandardMaterial({
    color: '#fff7ed',
    roughness: 0.32,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < 34; i++) {
    const cHex = koiColors[i % koiColors.length];
    const kMat = new THREE.MeshStandardMaterial({
      color: cHex,
      roughness: 0.24,
      emissive: cHex,
      emissiveIntensity: 0.14
    });
    const fish = new THREE.Group();
    const body = new THREE.Mesh(koiBodyGeo, kMat);
    const spot = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 8, 6),
      new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#ffffff' : '#b91c1c', roughness: 0.28 })
    );
    spot.scale.set(0.88, 0.52, 1.45);
    spot.position.set(0, 0.036, 0.08);
    const pecL = new THREE.Mesh(koiPecGeo, koiFinMat);
    pecL.position.set(-0.055, -0.015, 0.08);
    pecL.rotation.y = 0.65;
    const pecR = new THREE.Mesh(koiPecGeo, koiFinMat);
    pecR.position.set(0.055, -0.015, 0.08);
    pecR.rotation.y = -0.65;
    pecR.scale.x = -1;
    const tail = new THREE.Mesh(koiTailGeo, koiFinMat);
    tail.position.z = -0.32;
    fish.add(body, spot, pecL, pecR, tail);
    fish.scale.setScalar(0.82 + (i % 4) * 0.10);
    fish.position.set(
      pondCX + (Math.random() - 0.5) * (pondW - 5),
      -0.46 - (i % 3) * 0.06,
      (Math.random() - 0.5) * (pondD - 4)
    );
    rainforestGroup.add(fish);
    koiList.push({
      group: fish,
      tail,
      angle: Math.random() * Math.PI * 2,
      speed: 0.95 + Math.random() * 0.65,
      turnSeed: Math.random() * 100,
      baseY: -0.46 - (i % 3) * 0.06
    });
  }

  // Sleek Architectural Brushed-Steel & Clear-Glass Koi Pellet Capsule Dispenser!
  const feederGroup = new THREE.Group();
  feederGroup.position.set(30.9, 0.08, -1.85);
  const brushedSteelMat = new THREE.MeshStandardMaterial({ color: '#c4cdd8', roughness: 0.22, metalness: 0.88, envMapIntensity: 1.15 });
  const feederBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.10, 14), brushedSteelMat);
  feederBase.position.y = 0.05;
  const feederPost = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.105, 0.78, 14), brushedSteelMat);
  feederPost.position.y = 0.44;
  const feederCap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 14), brassMat);
  feederCap.position.y = 0.86;
  const feederGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.24, 14),
    new THREE.MeshPhysicalMaterial({ color: '#e0f2fe', roughness: 0.06, transparent: true, opacity: 0.38, clearcoat: 1.0 })
  );
  feederGlass.position.y = 1.01;
  const feederPellets = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.09, 0.13, 12),
    new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.78 })
  );
  feederPellets.position.y = 0.96;
  const feederCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.045, 14), brassMat);
  feederCrown.position.y = 1.15;
  feederGroup.add(feederBase, feederPost, feederCap, feederGlass, feederPellets, feederCrown);
  rainforestGroup.add(feederGroup);

  let splashCursor = 0;
  let activeFeedTarget = null;
  let feedTimer = 0;
  const pelletMeshes = [];
  const pelletGeo = new THREE.SphereGeometry(0.025, 6, 6);
  const pelletMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.7 });

  function triggerKoiFeeding(elapsed) {
    const tx = 35.5 + (Math.random() - 0.5) * 3.0;
    const tz = 1.2 + (Math.random() - 0.5) * 3.5;
    activeFeedTarget = new THREE.Vector2(tx, tz);
    feedTimer = 7.5;
    koiWaterMat.uniforms.uSplashes.value[splashCursor].set(tx, tz, elapsed + 0.15, 1.0);
    splashCursor = (splashCursor + 1) % 4;
    for (let p = 0; p < 6; p++) {
      const pm = new THREE.Mesh(pelletGeo, pelletMat);
      pm.position.set(31.2, 0.4, -1.0);
      rainforestGroup.add(pm);
      pelletMeshes.push({
        mesh: pm,
        vx: (tx - 31.2) * 1.4 + (Math.random() - 0.5) * 1.0,
        vy: 1.8 + Math.random() * 0.6,
        vz: (tz + 1.0) * 1.4 + (Math.random() - 0.5) * 1.0,
        life: 0.9
      });
    }
  }

  interactables.push({
    id: 'koi-feeder',
    position: new THREE.Vector3(30.8, 1.1, -1.0),
    radius: 8.5,
    priority: 4,
    prompt: '[E] Toss Koi Pellets into Rainforest Pond (+150 UPoints)',
    actionType: 'feed-koi',
    stampId: 'spawn-koi-pond'
  });

  // Grounded Layered 6.2m Wet Mossy Karst Limestone Waterfall Cliff at (x=45.6, z=8.6) — ALL boulders cleanly RECESSED BEHIND curved multi-stream waterfall ribbons (ZERO floating rocks!)
  const waterfallCliff = new THREE.Group();
  waterfallCliff.position.set(45.6, 0, 8.6);
  waterfallCliff.rotation.y = 0.72;

  // Solid broad wet-skirt stone terrace rooted deeply into pond bed behind water streams (z >= +0.45)
  const cliffBase = new THREE.Mesh(createOrganicBoulderGeo(3.2, 8.2), wetLowerRockMat);
  cliffBase.scale.set(1.45, 0.82, 1.05);
  cliffBase.position.set(0, 0.35, 1.35);
  cliffBase.castShadow = true;
  cliffBase.receiveShadow = true;
  waterfallCliff.add(cliffBase);

  const cliffFernGeo = createArchedFrondGeo(0.58, 1.25, 0.42);
  const cliffVineGeo = createDrapedVineGeo(0.85, 2.4, 1.4);
  for (let r = 0; r < 24; r++) {
    const t = r / 24;
    const h = -0.25 + t * 5.75;
    const col = (r % 5) - 2; // -2, -1, 0, +1, +2
    const isFlank = Math.abs(col) >= 2;
    const bx = col * (isFlank ? 1.55 : 0.95) * (1.0 - t * 0.28);
    // Keep center channel recessed at z >= +0.85..+1.8 while side flanking rock walls frame the waterfall cleanly!
    const bz = isFlank ? 0.35 + (1 - t) * 0.35 : 0.95 + (1 - t) * 0.55;
    // Glossy wet lower skirt near water line (h < 1.35) transitioning to mossy upper patches & craggy karst!
    const bMat = h < 1.35 ? wetLowerRockMat : r % 2 === 0 ? mossRockMat : rockMat;
    const boulder = new THREE.Mesh(
      boulderTemplates[r % boulderTemplates.length],
      bMat
    );
    boulder.position.set(bx, h, bz);
    boulder.scale.set(isFlank ? 1.28 : 1.15, 0.78, 0.96);
    boulder.rotation.set((r % 4) * 0.14, r * 0.85, 0.12);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    waterfallCliff.add(boulder);

    // Tuck lush feathery ferns & draped vines along side rocky flanks (clear of central water ribbons!)
    if (isFlank && h > 0.5 && h < 5.0) {
      const cf = new THREE.Mesh(cliffFernGeo, r % 2 === 0 ? botMats.frondDeep : botMats.frondWarm);
      cf.position.set(bx * 0.96, h + 0.38, bz - 0.48);
      cf.rotation.y = Math.PI + (col < 0 ? -0.55 : 0.55);
      cf.rotation.x = 0.20;
      waterfallCliff.add(cf);
    }
    if (isFlank && (r === 17 || r === 22)) {
      const cv = new THREE.Mesh(cliffVineGeo, botMats.hangingVine);
      cv.position.set(bx * 0.98, h - 0.55, bz - 0.56);
      waterfallCliff.add(cv);
    }
  }

  // 3 Overlapping Gently Arched Silky Cascading Water Ribbons + Layered Scrolling Whitewater Foam Cascades!
  const waterfallMat = createWaterfallMaterial();
  const wfFoamCanvas = document.createElement('canvas');
  wfFoamCanvas.width = 256;
  wfFoamCanvas.height = 512;
  const wfCtx = wfFoamCanvas.getContext('2d');
  wfCtx.clearRect(0, 0, 256, 512);
  for (let i = 0; i < 140; i++) {
    const fx = ((i * 53) % 236) + 10;
    const fy = (i * 89) % 512;
    const fw = 6 + (i % 4) * 5;
    const fh = 38 + (i % 5) * 28;
    const fg = wfCtx.createLinearGradient(fx, fy, fx, fy + fh);
    fg.addColorStop(0.0, 'rgba(235, 250, 255, 0.0)');
    fg.addColorStop(0.35, `rgba(242, 252, 255, ${0.26 + (i % 3) * 0.12})`);
    fg.addColorStop(0.75, 'rgba(210, 242, 255, 0.18)');
    fg.addColorStop(1.0, 'rgba(210, 242, 255, 0.0)');
    wfCtx.fillStyle = fg;
    wfCtx.fillRect(fx, fy, fw, fh);
    if (fy + fh > 512) {
      wfCtx.fillRect(fx, fy - 512, fw, fh);
    }
  }
  const wfFoamTex = new THREE.CanvasTexture(wfFoamCanvas);
  wfFoamTex.colorSpace = THREE.SRGBColorSpace;
  wfFoamTex.wrapS = wfFoamTex.wrapT = THREE.RepeatWrapping;
  wfFoamTex.repeat.set(1.5, 2.0);
  const wfFoamMat = new THREE.MeshBasicMaterial({
    map: wfFoamTex,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const buildCurvedFallGeo = (w, h, archOut) => {
    const geo = new THREE.PlaneGeometry(w, h, 10, 20);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const u = 1.0 - (y + h * 0.5) / h; // 0 = top crest, 1 = plunge bottom
      const zCurve = -Math.sin(u * Math.PI * 0.55) * archOut - u * 0.45;
      pos.setZ(i, zCurve);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const wfCenter = new THREE.Mesh(buildCurvedFallGeo(2.55, 5.95, 0.46), waterfallMat);
  wfCenter.position.set(0, 2.75, -0.32);
  const wfCenterFoam = new THREE.Mesh(buildCurvedFallGeo(2.42, 5.92, 0.49), wfFoamMat);
  wfCenterFoam.position.set(0, 2.75, -0.37);
  const wfLeft = new THREE.Mesh(buildCurvedFallGeo(1.45, 5.15, 0.36), waterfallMat);
  wfLeft.position.set(-1.18, 2.38, -0.22);
  const wfLeftFoam = new THREE.Mesh(buildCurvedFallGeo(1.36, 5.12, 0.39), wfFoamMat);
  wfLeftFoam.position.set(-1.18, 2.38, -0.27);
  const wfRight = new THREE.Mesh(buildCurvedFallGeo(1.45, 4.85, 0.36), waterfallMat);
  wfRight.position.set(1.18, 2.24, -0.22);
  const wfRightFoam = new THREE.Mesh(buildCurvedFallGeo(1.36, 4.82, 0.39), wfFoamMat);
  wfRightFoam.position.set(1.18, 2.24, -0.27);
  waterfallCliff.add(wfCenter, wfCenterFoam, wfLeft, wfLeftFoam, wfRight, wfRightFoam);

  // Sculpted aerated whitewater crest rolls spilling cleanly over the upper karst ledges!
  const whitewaterMat = new THREE.MeshStandardMaterial({
    color: '#dff4ff',
    emissive: '#9fd8ec',
    emissiveIntensity: 0.14,
    roughness: 0.34,
    metalness: 0.02,
    transparent: true,
    opacity: 0.68,
    depthWrite: false
  });
  const crestConfigs = [
    { x: 0.0, y: 5.56, z: -0.26, w: 2.35, r: 0.22 },
    { x: -1.16, y: 4.82, z: -0.18, w: 1.32, r: 0.17 },
    { x: 1.16, y: 4.54, z: -0.18, w: 1.32, r: 0.17 }
  ];
  for (const cc of crestConfigs) {
    const crestPts = [];
    for (let k = 0; k <= 10; k++) {
      const u = k / 10 - 0.5;
      crestPts.push(new THREE.Vector3(cc.x + u * cc.w, cc.y + Math.cos(u * Math.PI) * 0.12, cc.z - Math.cos(u * Math.PI) * 0.14));
    }
    const crestTube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(crestPts), 16, cc.r, 8, false),
      whitewaterMat
    );
    crestTube.scale.set(1.0, 0.72, 0.85);
    waterfallCliff.add(crestTube);
  }

  // Soft feathered radial plunge-pool froth decal + animated expanding pond-impact ripple rings + animated rising splash mist puffs!
  const splashFroth = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.1), botMats.foamDecal);
  splashFroth.rotation.x = -Math.PI / 2;
  splashFroth.position.set(0, -0.202, -1.28);
  waterfallCliff.add(splashFroth);

  const waterfallRippleRings = [];
  const waterfallMistPuffs = [];
  const impactSpots = [
    { x: 0.0, z: -1.24, r1: 0.85, r2: 1.55, r3: 2.25 },
    { x: -1.22, z: -1.06, r1: 0.55, r2: 1.02, r3: 1.48 },
    { x: 1.22, z: -1.06, r1: 0.55, r2: 1.02, r3: 1.48 }
  ];
  for (let sIdx = 0; sIdx < impactSpots.length; sIdx++) {
    const sp = impactSpots[sIdx];
    const boil = new THREE.Mesh(new THREE.CylinderGeometry(sp.r1 * 0.82, sp.r1 * 1.15, 0.24, 16), whitewaterMat);
    boil.position.set(sp.x, -0.14, sp.z);
    waterfallCliff.add(boil);
    [sp.r1, sp.r2, sp.r3].forEach((rad, rIdx) => {
      const rMat = new THREE.MeshBasicMaterial({ color: '#cbeefa', transparent: true, opacity: 0.36 - rIdx * 0.09, depthWrite: false });
      const ringM = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.075 - rIdx * 0.015, 6, 28), rMat);
      ringM.rotation.x = Math.PI / 2;
      ringM.scale.set(1.18, 0.82, 0.35);
      ringM.position.set(sp.x, -0.195, sp.z);
      waterfallCliff.add(ringM);
      waterfallRippleRings.push({ mesh: ringM, mat: rMat, phase: sIdx * 0.31 + rIdx * 0.33 });
    });
  }
  for (let m = 0; m < 8; m++) {
    const mistMat = new THREE.MeshBasicMaterial({ map: botMats.foamDecal.map, transparent: true, opacity: 0.42, depthWrite: false });
    const mistPuff = new THREE.Mesh(new THREE.PlaneGeometry(2.2 + (m % 3) * 0.45, 1.6 + (m % 2) * 0.4), mistMat);
    const baseX = -1.6 + (m / 7) * 3.2;
    const baseY = 0.24 + (m % 3) * 0.22;
    const baseZ = -1.16 - (m % 2) * 0.24;
    mistPuff.position.set(baseX, baseY, baseZ);
    waterfallCliff.add(mistPuff);
    waterfallMistPuffs.push({ mesh: mistPuff, mat: mistMat, baseX, baseY, baseZ, phase: m * 0.78 });
  }
  // 3 Dedicated Warm Grazing Waterfall Lights (clamped <= 4.2 -> ZERO nuclear pure-white bloom blowout!)
  const wfKeyLight1 = new THREE.PointLight('#ffe2b4', 4.2, 22, 1.45);
  wfKeyLight1.position.set(-1.8, 2.2, -2.6);
  const wfKeyLight2 = new THREE.PointLight('#fff0cf', 3.8, 22, 1.45);
  wfKeyLight2.position.set(1.8, 4.5, -2.4);
  const wfKeyLight3 = new THREE.PointLight('#dff7ee', 3.2, 18, 1.50);
  wfKeyLight3.position.set(0.1, 0.78, -2.9);
  waterfallCliff.add(wfKeyLight1, wfKeyLight2, wfKeyLight3);
  rainforestGroup.add(waterfallCliff);

  // Giant Panoramic Luminous Freshwater Aquarium (LG Rainforest x=48.2, z=-6.5) — Clean Dark Brushed-Bronze Bezel + Low-Glare Fresnel Curved Glass + Streamlined Arapaima (r <= 0.68*R)!
  {
    const aqGroup = new THREE.Group();
    aqGroup.position.set(48.2, 0, -6.5);
    const tankR = 2.98;
    const aqRimMat = new THREE.MeshStandardMaterial({ color: '#3b3026', roughness: 0.38, metalness: 0.78, envMapIntensity: 0.58 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.08, 3.18, 0.62, 40), aqRimMat);
    base.position.y = 0.31;
    base.castShadow = true;
    base.receiveShadow = true;
    const baseBrass = new THREE.Mesh(new THREE.TorusGeometry(3.09, 0.032, 8, 48), aqRimMat);
    baseBrass.rotation.x = Math.PI / 2;
    baseBrass.position.y = 0.62;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.10, 3.07, 0.26, 40), aqRimMat);
    cap.position.y = 4.38;
    const capBrass = new THREE.Mesh(new THREE.TorusGeometry(3.08, 0.030, 8, 48), aqRimMat);
    capBrass.rotation.x = Math.PI / 2;
    capBrass.position.y = 4.25;
    aqGroup.add(baseBrass, capBrass);

    const aqBed = new THREE.Mesh(new THREE.CylinderGeometry(2.90, 2.90, 0.12, 36), botMats.riverBed);
    aqBed.position.y = 0.64;

    // Subtle deep-water volumetric sunlight shaft descending through the crystal tank
    const aqBeamMat = createVolumetricGodRayMaterial('#8ce8dd', 0.09);
    const aqBeam = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.55, 3.45, 24, 1, true), aqBeamMat);
    aqBeam.position.y = 2.42;

    // Low-glare Fresnel curved acrylic cylinder glass (depthWrite: false, smooth optical rim -> ZERO diagonal white slash artifacts!)
    const glassCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(tankR, tankR, 3.66, 48, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: '#dff6fc',
        transparent: true,
        opacity: 0.14,
        roughness: 0.04,
        metalness: 0.06,
        clearcoat: 0.85,
        clearcoatRoughness: 0.05,
        reflectivity: 0.72,
        envMapIntensity: 1.05,
        side: THREE.FrontSide,
        depthWrite: false
      })
    );
    glassCyl.position.y = 2.44;

    const glassFresnelRim = new THREE.Mesh(
      new THREE.CylinderGeometry(tankR - 0.015, tankR - 0.015, 3.64, 48, 1, true),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide,
        vertexShader: /* glsl */ `
          varying vec3 vNorm;
          varying vec3 vView;
          void main() {
            vNorm = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vNorm;
          varying vec3 vView;
          void main() {
            float f = pow(1.0 - abs(dot(normalize(vNorm), normalize(vView))), 3.4);
            vec3 rimCol = mix(vec3(0.55, 0.88, 0.96), vec3(0.84, 0.95, 0.98), f);
            gl_FragColor = vec4(rimCol, clamp(f * 0.32, 0.0, 0.30));
          }
        `
      })
    );
    glassFresnelRim.position.y = 2.44;
    aqGroup.add(glassFresnelRim);

    // Natural organic curved rear driftwood stump tucked cleanly toward rear-center
    const driftMat = new THREE.MeshStandardMaterial({ color: '#4c3525', roughness: 0.84, metalness: 0.04 });
    const trunkCurve = [
      new THREE.Vector3(0.36, 0.68, -0.30),
      new THREE.Vector3(0.14, 1.65, -0.08),
      new THREE.Vector3(0.04, 2.75, 0.14),
      new THREE.Vector3(0.24, 3.65, 0.20)
    ];
    const mainDrift = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunkCurve), 16, 0.20, 10, false),
      driftMat
    );
    const sideLimb = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.12, 1.75, -0.04),
          new THREE.Vector3(-0.30, 2.38, 0.10),
          new THREE.Vector3(-0.62, 2.88, 0.30)
        ]),
        12,
        0.095,
        8,
        false
      ),
      driftMat
    );
    aqGroup.add(mainDrift, sideLimb);

    for (let r = 0; r < 6; r++) {
      const ang = (r / 6) * Math.PI * 2;
      const aqRock = new THREE.Mesh(boulderTemplates[r % boulderTemplates.length], r % 2 === 0 ? mossRockMat : wetLowerRockMat);
      aqRock.scale.set(0.52, 0.34, 0.48);
      aqRock.position.set(Math.cos(ang) * 0.86, 0.78, Math.sin(ang) * 0.86);
      aqGroup.add(aqRock);
    }

    // Branching 3D Aquatic Plants (Vallisneria ribbon clusters & branching Anubias/Java Fern stems — ZERO flat curtain ribbons!)
    const aqStemMat = new THREE.MeshStandardMaterial({ color: '#2b5e2e', roughness: 0.62 });
    const aqLeafMat = new THREE.MeshStandardMaterial({ color: '#3b8c42', roughness: 0.46, side: THREE.DoubleSide });
    const aqDarkLeafMat = new THREE.MeshStandardMaterial({ color: '#236630', roughness: 0.50, side: THREE.DoubleSide });
    const aqBladeGeo = createArchedFrondGeo(0.22, 0.64, 0.22);
    for (let ap = 0; ap < 9; ap++) {
      const ang = (ap / 9) * Math.PI * 2 + 0.22;
      const rad = 0.65 + (ap % 3) * 0.34;
      const px = Math.cos(ang) * rad;
      const pz = Math.sin(ang) * rad;
      const plantH = 0.85 + (ap % 3) * 0.48;
      // Branching main stem + 2 secondary forks
      const mainCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(px, 0.68, pz),
        new THREE.Vector3(px + Math.sin(ap) * 0.14, 0.68 + plantH * 0.5, pz + Math.cos(ap) * 0.14),
        new THREE.Vector3(px + Math.sin(ap * 1.7) * 0.22, 0.68 + plantH, pz + Math.cos(ap * 1.7) * 0.22)
      ]);
      const stemMesh = new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 10, 0.024, 6, false), aqStemMat);
      aqGroup.add(stemMesh);
      for (let lf = 0; lf < 6; lf++) {
        const lt = 0.25 + (lf / 5) * 0.72;
        const pt = mainCurve.getPoint(lt);
        const blade = new THREE.Mesh(aqBladeGeo, lf % 2 === 0 ? aqLeafMat : aqDarkLeafMat);
        blade.position.copy(pt);
        blade.rotation.set(-0.28 + (lf % 3) * 0.18, ang + lf * 1.15, Math.sin(lf) * 0.2);
        blade.scale.setScalar(0.55 + (1.0 - lt * 0.4) * 0.42);
        aqGroup.add(blade);
      }
    }

    // Recessed warm-aqua interior lighting strictly tucked UNDER sleek dark bronze bezel cap (ZERO UFO white dot ring!)
    const aquaGlow = new THREE.PointLight('#bdf3ec', 7.5, 7.5, 1.75);
    aquaGlow.position.y = 3.75;

    // Natural narrow vertical airstone bubble plumes rising from the driftwood rocks (ZERO horizontal circular dot ring!)
    const bubMat = new THREE.MeshBasicMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.48, depthWrite: false });
    const airStones = [[-0.45, 0.35], [0.52, -0.28]];
    for (let s = 0; s < airStones.length; s++) {
      const [ax, az] = airStones[s];
      for (let b = 0; b < 11; b++) {
        const t = b / 10;
        const bub = new THREE.Mesh(new THREE.SphereGeometry(0.018 + (b % 3) * 0.010, 6, 6), bubMat);
        bub.position.set(
          ax + Math.sin(b * 1.9 + s) * 0.08 * t,
          0.78 + t * 3.15,
          az + Math.cos(b * 2.3 + s) * 0.08 * t
        );
        aqGroup.add(bub);
      }
    }

    // Sculpted Streamlined 3D Giant Arapaima Gigas + Schooling Silver-Gold Tetras inside tank!
    const arapaimaOrbit = new THREE.Group();
    arapaimaOrbit.position.y = 2.38;
    const tetraSchoolOrbit = new THREE.Group();
    tetraSchoolOrbit.position.y = 1.95;
    const araOliveMat = new THREE.MeshStandardMaterial({ color: '#9eb6c2', roughness: 0.16, metalness: 0.66, envMapIntensity: 1.32 });
    const araRedMat = new THREE.MeshStandardMaterial({ color: '#c82828', roughness: 0.28, metalness: 0.25 });
    const araFinMat = new THREE.MeshStandardMaterial({ color: '#d05858', transparent: true, opacity: 0.80, roughness: 0.34, side: THREE.DoubleSide });

    const araBodyPts = [
      new THREE.Vector2(0.006, -0.82),
      new THREE.Vector2(0.062, -0.60),
      new THREE.Vector2(0.112, -0.24),
      new THREE.Vector2(0.136, 0.20),
      new THREE.Vector2(0.122, 0.58),
      new THREE.Vector2(0.062, 0.84),
      new THREE.Vector2(0.010, 0.94)
    ];
    const araBodyGeo = new THREE.LatheGeometry(araBodyPts, 14);
    araBodyGeo.rotateX(Math.PI / 2);
    araBodyGeo.scale(0.66, 0.90, 1.0);
    const araTailFinGeo = new THREE.CircleGeometry(0.15, 8);
    araTailFinGeo.scale(0.65, 1.0, 1.0);
    araTailFinGeo.rotateY(Math.PI / 2);
    const araPecFinGeo = new THREE.CircleGeometry(0.125, 8, 0, Math.PI * 0.72);
    araPecFinGeo.rotateX(-Math.PI / 2);

    for (let f = 0; f < 5; f++) {
      const a = (f / 5) * Math.PI * 2;
      const orbitR = tankR * (0.48 + (f % 3) * 0.045);
      const af = new THREE.Group();
      const torso = new THREE.Mesh(araBodyGeo, araOliveMat);
      const redBand = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.092, 0.38, 10), araRedMat);
      redBand.rotation.x = Math.PI / 2;
      redBand.scale.set(0.68, 1.0, 0.92);
      redBand.position.z = -0.48;
      const caudal = new THREE.Mesh(araTailFinGeo, araFinMat);
      caudal.position.z = -0.86;
      const pecL = new THREE.Mesh(araPecFinGeo, araFinMat);
      pecL.position.set(-0.09, -0.045, 0.32);
      pecL.rotation.y = 0.65;
      const pecR = new THREE.Mesh(araPecFinGeo, araFinMat);
      pecR.position.set(0.09, -0.045, 0.32);
      pecR.rotation.y = -2.25;
      af.add(torso, redBand, caudal, pecL, pecR);
      af.position.set(Math.cos(a) * orbitR, (f - 2) * 0.42, Math.sin(a) * orbitR);
      af.rotation.y = -a;
      arapaimaOrbit.add(af);
    }

    // 14 Schooling Silver-Gold Tropical Barb / Tetra Fish swimming counter-clockwise in tight natural school
    const tetraSilverMat = new THREE.MeshStandardMaterial({ color: '#d9e7f0', roughness: 0.22, metalness: 0.72 });
    const tetraStripeMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.32, metalness: 0.35 });
    for (let tf = 0; tf < 14; tf++) {
      const ang = (tf / 14) * Math.PI * 1.45;
      const tr = 1.15 + (tf % 4) * 0.22;
      const ty = ((tf % 5) - 2) * 0.24;
      const tg = new THREE.Group();
      const tBody = new THREE.Mesh(araBodyGeo, tf % 3 === 0 ? tetraStripeMat : tetraSilverMat);
      tBody.scale.setScalar(0.24);
      const tTail = new THREE.Mesh(araTailFinGeo, araFinMat);
      tTail.scale.setScalar(0.28);
      tTail.position.z = -0.20;
      tg.add(tBody, tTail);
      tg.position.set(Math.cos(ang) * tr, ty, Math.sin(ang) * tr);
      tg.rotation.y = -ang + Math.PI;
      tetraSchoolOrbit.add(tg);
    }

    aqGroup.add(base, cap, aqBed, aqBeam, glassCyl, aquaGlow, arapaimaOrbit, tetraSchoolOrbit);
    rainforestGroup.add(aqGroup);
    rainforestGroup.userData.aquariumOrbit = arapaimaOrbit;
    rainforestGroup.userData.tetraSchoolOrbit = tetraSchoolOrbit;

    // Warm 2700K Japanese Ramen Lantern Bounce Light radiating from IPPUDO onto the Rainforest boardwalk & Koi Pond!
    const ippudoWarmGlow = new THREE.PointLight('#ffaa55', 22, 24, 1.55);
    ippudoWarmGlow.position.set(46.0, 3.2, 19.6);
    rainforestGroup.add(ippudoWarmGlow);

    interactables.push({
      id: 'rainforest-aquarium',
      position: new THREE.Vector3(50.5, 1.4, -6.5),
      radius: 8.5,
      priority: 4,
      prompt: '[E] Inspect Giant Arapaima Freshwater Aquarium (+150 UPoints)',
      actionType: 'inspect-aquarium',
      stampId: 'spawn-koi-pond'
    });
  }

  // Lush Lakeside Rainforest Palms strictly below G-bridge level & CLEAR of waterfall and overhead bridge sightline!
  const treeSpots = [
    { x: 24.2, y: -0.2, z: -8.4, s: 1.05, h: 3.4 },
    { x: 24.6, y: -0.2, z: 8.6, s: 1.05, h: 3.3 },
    { x: 52.8, y: -0.2, z: 9.8, s: 1.05, h: 3.5 },
    { x: 40.8, y: -0.2, z: 10.6, s: 0.92, h: 2.6 }
  ];
  for (let i = 0; i < treeSpots.length; i++) {
    const t = treeSpots[i];
    const palm = createTropicalPlant(t.s, t.h, 10, (i % 3) * 0.03, i % 2 === 0);
    palm.position.set(t.x, t.y, t.z);
    rainforestGroup.add(palm);
    // Cluster 4 organic mossy karst boulders naturally hugging each lakeside palm root base!
    for (let k = 0; k < 4; k++) {
      const ka = (k / 4) * Math.PI * 2 + i * 0.7;
      const b = new THREE.Mesh(boulderTemplates[(i + k) % 4], k % 2 === 0 ? mossRockMat : rockMat);
      b.scale.set(0.75, 0.48, 0.70);
      b.position.set(t.x + Math.cos(ka) * 0.62, 0.08, t.z + Math.sin(ka) * 0.62);
      b.rotation.y = ka;
      b.castShadow = true;
      b.receiveShadow = true;
      rainforestGroup.add(b);
    }
  }

  // LG-P289 SEALANTIS HOLLOW-FRAMED 3D ILLUMINATED UNDERWATER SCUBA DIVE POOL (ZERO black wall!)
  {
    const scubaG = new THREE.Group();
    scubaG.position.set(-2.0, 0.0, 9.65);
    // Glowing turquoise tiled backwall inside dive pool
    const backTile = new THREE.Mesh(
      new THREE.PlaneGeometry(10.0, 3.25),
      new THREE.MeshBasicMaterial({ color: '#0ea5e9' })
    );
    backTile.rotation.y = Math.PI;
    backTile.position.set(0, 1.88, 0.16);
    // Hollow 4-piece steel perimeter window frame (top, bottom, left, right — OPEN center!)
    const fTop = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.24, 0.34), steelDarkMat);
    fTop.position.set(0, 3.55, -0.22);
    const fBot = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.34, 0.34), steelDarkMat);
    fBot.position.set(0, 0.17, -0.22);
    const fLeft = new THREE.Mesh(new THREE.BoxGeometry(0.26, 3.6, 0.34), steelDarkMat);
    fLeft.position.set(-5.15, 1.85, -0.22);
    const fRight = fLeft.clone();
    fRight.position.x = 5.15;
    // Translucent cyan water volume + stainless steel pool ladder + 2 scuba divers + rising bubbles!
    const tankWater = new THREE.Mesh(
      new THREE.BoxGeometry(10.0, 3.2, 0.42),
      new THREE.MeshPhysicalMaterial({ color: '#22d3ee', emissive: '#0284c7', emissiveIntensity: 0.42, transparent: true, opacity: 0.45, roughness: 0.06, depthWrite: false })
    );
    tankWater.position.set(0, 1.88, -0.05);
    // Stainless steel dive ladder
    const ladderMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.85, roughness: 0.2 });
    for (const lx of [-3.6, -3.1]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 8), ladderMat);
      rail.position.set(lx, 1.9, 0.02);
      scubaG.add(rail);
    }
    for (let r = 0; r < 5; r++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.52, 6), ladderMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(-3.35, 0.9 + r * 0.48, 0.02);
      scubaG.add(rung);
    }
    // Scuba diver + yellow oxygen cylinder + flippers
    const diverBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.72, 4, 8), new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4 }));
    diverBody.rotation.z = Math.PI / 2.2;
    diverBody.position.set(0.4, 2.05, 0.0);
    const scubaTank = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.56, 8), new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.25 }));
    scubaTank.rotation.z = Math.PI / 2.2;
    scubaTank.position.set(0.4, 2.27, 0.0);
    scubaG.add(backTile, fTop, fBot, fLeft, fRight, tankWater, diverBody, scubaTank);
    for (let b = 0; b < 16; b++) {
      const bub = new THREE.Mesh(new THREE.SphereGeometry(0.06 + (b % 3) * 0.025, 6, 6), new THREE.MeshBasicMaterial({ color: '#e0f2fe' }));
      bub.position.set(-2.0 + (b % 6) * 1.1, 0.8 + (b % 7) * 0.36, -0.10);
      scubaG.add(bub);
    }
    root.add(scubaG);
    interactables.push({
      id: 'sealantis-scuba-pool',
      position: new THREE.Vector3(-2.0, 1.35, 7.2),
      radius: 7.5,
      priority: 3,
      prompt: '[E] Watch Sealantis PADI 5★ Scuba Divers & Bubble Jets (+100 UPoints)',
      actionType: 'scuba-dive'
    });
  }

  // G Floor Timber-Planked Canopy Bridge & 2F Rainbow Bridge — Sunlit Warm Oiled Honey-Merbau Timber (rich visible sunlit wood planks!)
  const bridgeTeakMaps = createTeakBoardwalkMaps(2.0, 2.0);
  const plankMat = new THREE.MeshStandardMaterial({
    color: '#f2d0a4',
    map: bridgeTeakMaps.map,
    normalMap: bridgeTeakMaps.normalMap,
    normalScale: new THREE.Vector2(0.88, 0.88),
    roughnessMap: bridgeTeakMaps.roughnessMap,
    emissive: '#58381c',
    emissiveIntensity: 0.28,
    roughness: 0.56,
    metalness: 0.04,
    envMapIntensity: 0.68
  });

  // Soaring Multi-Story 1 Utama Rainforest Canopy Trees (organic asymmetrical heights, orientations & frond sweeps — ZERO repeating grid!)
  const canopyTreeSpots = [
    { x: 23.2, z: -10.3, h: 21.4, s: 1.62, rot: 0.42, fronds: 17 },
    { x: 53.5, z: -10.1, h: 19.2, s: 1.48, rot: 1.85, fronds: 15 },
    { x: 24.4, z: 10.5, h: 22.1, s: 1.56, rot: 2.74, fronds: 16 },
    { x: 52.4, z: 10.9, h: 17.6, s: 1.42, rot: 0.96, fronds: 14 },
    { x: 30.2, z: -10.9, h: 14.8, s: 1.26, rot: 3.55, fronds: 13 },
    { x: 46.8, z: -10.2, h: 18.4, s: 1.46, rot: 4.82, fronds: 16 },
    { x: 27.4, z: -9.1, h: 11.9, s: 1.18, rot: 5.20, fronds: 12 },
    { x: 49.9, z: -9.6, h: 15.6, s: 1.35, rot: 1.12, fronds: 14 },
    { x: 28.8, z: 9.6, h: 13.4, s: 1.24, rot: 2.15, fronds: 13 },
    { x: 47.4, z: 10.1, h: 16.5, s: 1.38, rot: 4.10, fronds: 15 }
  ];
  for (let i = 0; i < canopyTreeSpots.length; i++) {
    const ct = canopyTreeSpots[i];
    const tallPalm = createTropicalPlant(ct.s, ct.h, ct.fronds, (i * 0.037) % 0.14, i % 3 === 0);
    tallPalm.position.set(ct.x, -0.25, ct.z);
    tallPalm.rotation.y = ct.rot;
    rainforestGroup.add(tallPalm);
  }

  // Graceful Gravity-Sagging Catenary Tropical Lianas anchored onto solid balcony troughs & dressed continuously with clustered hanging vine cards (ZERO rigid diagonal sticks or 3F/4F rim floaters!)
  const lianaMat = new THREE.MeshStandardMaterial({ color: '#423320', roughness: 0.90, metalness: 0.0 });
  const lianaConfigs = [
    { start: new THREE.Vector3(22.6, 18.2, -12.75), end: new THREE.Vector3(32.8, 18.2, -12.75), sag: 2.35, swayZ: 1.05 },
    { start: new THREE.Vector3(43.2, 18.2, -12.75), end: new THREE.Vector3(53.4, 18.2, -12.75), sag: 2.45, swayZ: 1.15 },
    { start: new THREE.Vector3(22.6, 12.2, 12.75), end: new THREE.Vector3(32.8, 12.2, 12.75), sag: 2.05, swayZ: -1.10 },
    { start: new THREE.Vector3(43.2, 12.2, 12.75), end: new THREE.Vector3(53.4, 12.2, 12.75), sag: 2.15, swayZ: -1.05 }
  ];
  const lianaLeafGeo = createDrapedVineGeo(0.86, 1.55, 1.9);
  const lianaLeafSmallGeo = createDrapedVineGeo(0.64, 1.12, 3.3);
  for (let li = 0; li < lianaConfigs.length; li++) {
    const cfg = lianaConfigs[li];
    const catPts = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const arc = Math.sin(t * Math.PI);
      const px = THREE.MathUtils.lerp(cfg.start.x, cfg.end.x, t);
      const py = THREE.MathUtils.lerp(cfg.start.y, cfg.end.y, t) - cfg.sag * arc;
      const pz = THREE.MathUtils.lerp(cfg.start.z, cfg.end.z, t) + cfg.swayZ * arc + Math.sin(t * Math.PI * 2 + li) * 0.22;
      catPts.push(new THREE.Vector3(px, py, pz));
    }
    const curve = new THREE.CatmullRomCurve3(catPts);
    const vineTube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.036, 6, false), lianaMat);
    rainforestGroup.add(vineTube);
    for (let ci = 0; ci < 8; ci++) {
      const tPos = 0.09 + (ci / 7) * 0.82;
      const pt = curve.getPoint(tPos);
      const leafMat = (li + ci) % 3 === 0 ? botMats.floweringVine : botMats.hangingVine;
      const useSmall = ci % 2 === 1;
      const leafCurtain = new THREE.Mesh(useSmall ? lianaLeafSmallGeo : lianaLeafGeo, leafMat);
      leafCurtain.position.set(pt.x, pt.y - (useSmall ? 0.44 : 0.62), pt.z);
      leafCurtain.rotation.y = li * 1.15 + tPos * 4.2 + (ci % 2) * 0.8;
      rainforestGroup.add(leafCurtain);
    }
  }

  // Organic Varied Multi-Species Balcony Foliage Troughs (irregular non-grid cluster spacing, varied frond heights & orientations!)
  const planterBoxMat = new THREE.MeshStandardMaterial({ color: '#3b2e24', roughness: 0.68, metalness: 0.14 });
  const balconyFernGeos = [
    createArchedFrondGeo(0.62, 1.12, 0.30),
    createArchedFrondGeo(0.78, 1.48, 0.42),
    createArchedFrondGeo(0.54, 0.92, 0.24)
  ];
  const vineCurtainGeos = [
    createDrapedVineGeo(1.35, 1.10, 0.5),
    createDrapedVineGeo(1.10, 2.85, 2.1),
    createDrapedVineGeo(1.55, 1.70, 3.8),
    createDrapedVineGeo(0.92, 3.35, 5.4)
  ];
  for (const fy of [12.0, 18.0, 24.0]) {
    for (const zEdge of [-12.7, 12.7]) {
      const inwardSign = zEdge < 0 ? 1 : -1;
      for (const [x1, x2] of [[21.8, 33.4], [42.6, 54.2]]) {
        const trough = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, 0.34, 0.52), planterBoxMat);
        trough.position.set((x1 + x2) * 0.5, fy + 0.17, zEdge);
        rainforestGroup.add(trough);
        let vIdx = Math.round(fy * 3 + Math.abs(x1) + (zEdge > 0 ? 17 : 3));
        let vx = x1 + 0.75 + ((vIdx * 37) % 10) * 0.08;
        while (vx <= x2 - 0.75) {
          const jitter = Math.sin(vIdx * 2.31) * 0.32;
          // Irregular organic hanging vine drape lengths
          if ((vIdx * 7) % 5 !== 0) {
            const gIdx = (vIdx * 3) % vineCurtainGeos.length;
            const dropH = gIdx === 0 ? 1.10 : gIdx === 1 ? 2.85 : gIdx === 2 ? 1.70 : 3.35;
            const vMat = vIdx % 4 === 0 ? botMats.floweringVine : botMats.hangingVine;
            const vine = new THREE.Mesh(vineCurtainGeos[gIdx], vMat);
            vine.position.set(vx + jitter * 0.6, fy - dropH * 0.44 + 0.14, zEdge + inwardSign * (0.32 + (vIdx % 3) * 0.09));
            vine.rotation.y = Math.sin(vx * 3.1 + fy) * 0.95;
            rainforestGroup.add(vine);
          }

          const clumpSize = 2 + (vIdx % 4);
          for (let f = 0; f < clumpSize; f++) {
            const geoPick = balconyFernGeos[(vIdx + f) % balconyFernGeos.length];
            const fern = new THREE.Mesh(geoPick, (f + vIdx) % 2 === 0 ? botMats.frondDeep : botMats.frondWarm);
            fern.position.set(vx + (f - clumpSize * 0.5) * 0.24 + jitter * 0.4, fy + 0.28 + ((vIdx + f) % 3) * 0.08, zEdge + (f % 2 - 0.5) * 0.12);
            fern.rotation.y = (inwardSign > 0 ? 0 : Math.PI) + Math.sin(vIdx * 1.7 + f * 2.4) * 1.25;
            fern.rotation.x = -0.26 + ((vIdx + f) % 3) * 0.19;
            fern.scale.setScalar(0.82 + ((vIdx * 5 + f) % 5) * 0.11);
            rainforestGroup.add(fern);
          }
          // Non-uniform spacing step breaks up any grid repetition!
          vx += 1.22 + ((vIdx * 19) % 11) * 0.11;
          vIdx++;
        }
      }
    }
  }

  // ==========================================================================
  // 1B. REAL 1 UTAMA OPEN-AIR RAINFOREST: 2F SUSPENSION BRIDGE, A-FRAME PYLON,
  //     TWIN-FORKED CURVED TUBULAR ARCHES, BROADLEAF CANOPY, AERIAL ROOTS & TREETOP ADVENTURE!
  //     (100% Photo-Exact to media_1795337629668_975ac4eb.jpg + 2025 Video #008-#020, #348-#358!)
  // ==========================================================================

  // Lush Broadleaf Tropical Rainforest Tree Generator (Full sunlit emerald/chartreuse leafy crowns framing BOTH sides of 2F bridge!)
  const broadleafMats = [
    new THREE.MeshStandardMaterial({ map: botMats.shrubLeafCard.map, color: '#3b8c32', alphaTest: 0.36, roughness: 0.68, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ map: botMats.shrubLeafCard.map, color: '#63b33a', alphaTest: 0.36, roughness: 0.64, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ map: botMats.shrubLeafCard.map, color: '#246628', alphaTest: 0.36, roughness: 0.72, side: THREE.DoubleSide })
  ];
  const broadleafCardGeo = new THREE.PlaneGeometry(2.35, 2.35);
  function addBroadleafRainforestTree(tx, tz, trunkH, crownR, seed) {
    const tg = new THREE.Group();
    tg.position.set(tx, -0.35, tz);
    // Curved natural rainforest trunk rising from LG pond floor up past 2F bridge
    const leanX = Math.sin(seed * 3.7) * 0.85;
    const leanZ = Math.cos(seed * 2.9) * 0.65;
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(leanX * 0.45, trunkH * 0.48, leanZ * 0.45),
      new THREE.Vector3(leanX, trunkH, leanZ)
    ]);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 12, 0.24, 8, false), botMats.trunkMat);
    trunk.castShadow = true;
    tg.add(trunk);
    // 3 spreading upper limbs supporting dense multi-layered leafy broadleaf foliage clusters
    const crownAnchors = [
      new THREE.Vector3(leanX, trunkH, leanZ),
      new THREE.Vector3(leanX + Math.cos(seed) * crownR * 0.48, trunkH - 1.4, leanZ + Math.sin(seed) * crownR * 0.48),
      new THREE.Vector3(leanX + Math.cos(seed + 2.1) * crownR * 0.52, trunkH - 2.3, leanZ + Math.sin(seed + 2.1) * crownR * 0.52),
      new THREE.Vector3(leanX + Math.cos(seed + 4.2) * crownR * 0.45, trunkH - 0.8, leanZ + Math.sin(seed + 4.2) * crownR * 0.45)
    ];
    for (let bi = 1; bi < crownAnchors.length; bi++) {
      const limbCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(leanX * 0.75, trunkH - 3.6, leanZ * 0.75),
        crownAnchors[bi]
      ]);
      tg.add(new THREE.Mesh(new THREE.TubeGeometry(limbCurve, 6, 0.09, 6, false), botMats.trunkMat));
    }
    for (let ci = 0; ci < crownAnchors.length; ci++) {
      const anc = crownAnchors[ci];
      for (let lf = 0; lf < 7; lf++) {
        const ang = (lf / 7) * Math.PI * 2 + seed + ci;
        const rad = (lf === 0 ? 0.1 : 0.42 + (lf % 3) * 0.36) * crownR * 0.55;
        const card = new THREE.Mesh(broadleafCardGeo, broadleafMats[(lf + ci + Math.round(seed * 7)) % broadleafMats.length]);
        card.position.set(anc.x + Math.cos(ang) * rad, anc.y + ((lf % 3) - 1) * 0.72, anc.z + Math.sin(ang) * rad);
        card.rotation.set(((lf % 3) - 1) * 0.55, ang, Math.sin(lf + seed) * 0.45);
        card.scale.setScalar(0.88 + (lf % 3) * 0.24);
        tg.add(card);
      }
    }
    rainforestGroup.add(tg);
  }

  // Lush leafy rainforest trees framing BOTH LEFT (+X in 2F-07) & RIGHT (-X in 2F-07) flanks of the 2F suspension bridge (strictly outside bridge x=36..40!)
  const broadleafSpots = [
    { x: 32.8, z: -5.4, h: 21.8, r: 3.8, s: 1.1 },
    { x: 32.4, z: 3.6, h: 20.4, r: 3.5, s: 2.3 },
    { x: 31.2, z: -9.2, h: 19.6, r: 3.2, s: 3.7 },
    { x: 43.2, z: -4.2, h: 21.2, r: 3.8, s: 4.5 },
    { x: 43.8, z: 4.8, h: 20.8, r: 3.7, s: 5.9 },
    { x: 44.6, z: -9.0, h: 19.2, r: 3.3, s: 6.4 },
    { x: 26.8, z: -3.2, h: 22.4, r: 4.1, s: 7.2 },
    { x: 49.4, z: 1.8, h: 22.0, r: 4.0, s: 8.8 },
    { x: 33.8, z: 8.6, h: 19.0, r: 3.0, s: 9.4 },
    { x: 42.4, z: 8.8, h: 18.8, r: 3.1, s: 10.2 }
  ];
  for (const bt of broadleafSpots) {
    addBroadleafRainforestTree(bt.x, bt.z, bt.h, bt.r, bt.s);
  }

  // Iconic Curtains of Long Hanging Brown Aerial Roots (Cissus / Princess Vine Curtains — Verified #010, #016!)
  const aerialRootMat = new THREE.MeshStandardMaterial({ color: '#6b4528', roughness: 0.92, metalness: 0.0 });
  const rootCurtainAnchors = [
    { x: 22.8, z: -8.6, w: 4.2, yTop: 22.4, drop: 11.5 },
    { x: 53.2, z: -8.4, w: 4.4, yTop: 22.4, drop: 11.0 },
    { x: 22.8, z: 8.6, w: 4.0, yTop: 22.4, drop: 10.5 },
    { x: 53.2, z: 8.4, w: 4.2, yTop: 22.4, drop: 11.2 }
  ];
  for (const rc of rootCurtainAnchors) {
    for (let r = 0; r < 14; r++) {
      const t = (r / 13) - 0.5;
      const len = rc.drop * (0.68 + ((r * 37) % 10) * 0.04);
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, len, 4), aerialRootMat);
      strand.position.set(rc.x + t * rc.w, rc.yTop - len * 0.5, rc.z + Math.sin(r * 1.9) * 0.35);
      rainforestGroup.add(strand);
    }
  }

  // TREETOP ADVENTURE (by Camp5 Climbing Gym — Verified #014, #018, #348, #353, #358!)
  // Iconic yellow steel vertical poles (#e5a922), round white checker-plate platforms, suspended rope bridges, hanging black car tires & glowing green wall sign!
  {
    const ttPoleMat = new THREE.MeshStandardMaterial({ color: '#e5a922', roughness: 0.34, metalness: 0.45 });
    const ttPlatMat = new THREE.MeshStandardMaterial({ color: '#e6e4de', roughness: 0.48, metalness: 0.25 });
    const ttRopeMat = new THREE.MeshStandardMaterial({ color: '#c4b89e', roughness: 0.88 });
    const ttTireMat = new THREE.MeshStandardMaterial({ color: '#1b1d22', roughness: 0.78 });
    const ttPoles = [
      { x: 29.5, z: -3.4, h: 14.2 },
      { x: 33.4, z: 4.8, h: 13.8 },
      { x: 43.4, z: -2.6, h: 14.5 },
      { x: 47.0, z: 4.6, h: 13.6 }
    ];
    for (const p of ttPoles) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, p.h, 12), ttPoleMat);
      pole.position.set(p.x, p.h * 0.5 - 0.4, p.z);
      rainforestGroup.add(pole);
      for (const py of [6.8, 11.4]) {
        const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.10, 20), ttPlatMat);
        plat.position.set(p.x, py, p.z);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.03, 6, 20), ttPoleMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(p.x, py + 0.05, p.z);
        rainforestGroup.add(plat, rim);
      }
    }
    // Suspended rope-net obstacle bridges connecting yellow poles at y = 7.0 & y = 11.6
    const ropePairs = [
      [ttPoles[0], ttPoles[1], 7.0],
      [ttPoles[2], ttPoles[3], 7.2],
      [ttPoles[0], ttPoles[2], 11.6]
    ];
    for (const [pa, pb, ry] of ropePairs) {
      const dist = Math.hypot(pb.x - pa.x, pb.z - pa.z);
      const ang = Math.atan2(pb.x - pa.x, pb.z - pa.z);
      const rg = new THREE.Group();
      rg.position.set((pa.x + pb.x) * 0.5, ry, (pa.z + pb.z) * 0.5);
      rg.rotation.y = ang;
      for (const sx of [-0.46, 0.46]) {
        const topRope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, dist, 6), ttRopeMat);
        topRope.rotation.x = Math.PI / 2;
        topRope.position.set(sx, 1.05, 0);
        const botRope = topRope.clone();
        botRope.position.y = 0.06;
        rg.add(topRope, botRope);
      }
      const slats = Math.max(8, Math.floor(dist / 0.58));
      for (let s = 0; s < slats; s++) {
        const tz = -dist * 0.45 + (s / (slats - 1)) * dist * 0.90;
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.04, 0.20), plankMat);
        slat.position.set(0, 0.02, tz);
        rg.add(slat);
        if (s % 3 === 1) {
          const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.11, 8, 16), ttTireMat);
          tire.position.set(0, 0.72, tz);
          rg.add(tire);
        }
      }
      rainforestGroup.add(rg);
    }
    // Glowing green TREETOP ADVENTURE sign mounted on GF/1F Rainforest terracotta balcony (#348!)
    const ttSignMat = new THREE.MeshBasicMaterial({
      map: createSignBoardTexture('TREETOP ADVENTURE', 'BY CAMP5 CLIMBING • HIGH ROPES IN THE RAINFOREST', '#14532d', '#fef08a', '#4ade80', 1024, 192)
    });
    const ttSign = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.96, 0.12), [ttPoleMat, ttPoleMat, ttPoleMat, ttPoleMat, ttSignMat, ttSignMat]);
    ttSign.position.set(27.5, 11.4, -12.85);
    rainforestGroup.add(ttSign);
  }

  // ==========================================================================
  // 2F ICONIC OPEN-AIR RAINFOREST SUSPENSION BRIDGE ("RAINBOW BRIDGE")
  // (100% Photo-Exact to media_1795337629668_975ac4eb.jpg & Video #009, #019, #020!)
  // ==========================================================================
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(38.0, 18.0, 0);
  rainforestGroup.add(bridgeGroup);

  const bridgeSpan = 26.8;
  const bridgeStripeTex = createRainforestBridgeStripeTexture();
  const bridgeDeckMat = new THREE.MeshStandardMaterial({
    map: bridgeStripeTex,
    color: '#ffffff',
    roughness: 0.42,
    metalness: 0.06,
    envMapIntensity: 0.65
  });
  const bridgeCurbMat = new THREE.MeshStandardMaterial({ color: '#e2dfd8', roughness: 0.46, metalness: 0.08 });
  const bridgeGirderMat = new THREE.MeshStandardMaterial({ color: '#b4bcc4', roughness: 0.28, metalness: 0.76, envMapIntensity: 1.05 });
  const chromeRailMat = new THREE.MeshStandardMaterial({ color: '#eef2f6', roughness: 0.12, metalness: 0.94, envMapIntensity: 1.55 });
  const darkArchSteelMat = new THREE.MeshStandardMaterial({ color: '#454b52', roughness: 0.34, metalness: 0.80, envMapIntensity: 1.10 });
  const blackPylonMat = new THREE.MeshStandardMaterial({ color: '#1b1f24', roughness: 0.38, metalness: 0.78, envMapIntensity: 0.92 });
  const blackCableMat = new THREE.MeshStandardMaterial({ color: '#1a1e24', roughness: 0.42, metalness: 0.72 });

  // 1. Clean Light-Cream & Dark-Grey Transverse Striped Terrazzo Deck (2.74m wide) + Raised Sloped Curbs + Silver Structural Girders!
  const deckSlab = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.22, bridgeSpan), bridgeDeckMat);
  deckSlab.position.set(0, -0.09, 0);
  deckSlab.receiveShadow = true;
  bridgeGroup.add(deckSlab);

  const underSoffit = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.18, bridgeSpan), bridgeGirderMat);
  underSoffit.position.set(0, -0.28, 0);
  bridgeGroup.add(underSoffit);

  for (const s of [-1, 1]) {
    // Raised smooth light-cream concrete side curb flanking the striped walkway
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, bridgeSpan), bridgeCurbMat);
    curb.position.set(s * 1.52, 0.06, 0);
    // Slanted brushed-silver exterior fascia girder
    const girder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, bridgeSpan), bridgeGirderMat);
    girder.position.set(s * 1.72, -0.06, 0);
    girder.rotation.z = s * -0.14;
    bridgeGroup.add(curb, girder);
  }

  // 2. Gently Flared Polished Chrome Tubular Top Handrails + 5 Horizontal Stainless Wire Cables + Vertical Stanchions + Outrigger Brackets!
  const railFlare = (z) => {
    const u = Math.abs(z) / (bridgeSpan * 0.5);
    return 1.56 + Math.pow(Math.max(0, (u - 0.55) / 0.45), 2.0) * 0.42;
  };
  for (const s of [-1, 1]) {
    const topRailPts = [];
    const subRailPts = [];
    const wirePtsArr = [[], [], [], [], []];
    const wireYs = [0.28, 0.44, 0.60, 0.76, 0.92];
    for (let i = 0; i <= 36; i++) {
      const z = -bridgeSpan * 0.5 + (i / 36) * bridgeSpan;
      const rx = s * railFlare(z);
      topRailPts.push(new THREE.Vector3(rx, 1.12, z));
      subRailPts.push(new THREE.Vector3(rx * 0.985, 1.02, z));
      for (let w = 0; w < 5; w++) {
        wirePtsArr[w].push(new THREE.Vector3(s * (railFlare(z) - 0.04), wireYs[w], z));
      }
    }
    bridgeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(topRailPts), 44, 0.044, 12, false), chromeRailMat));
    bridgeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(subRailPts), 44, 0.018, 8, false), chromeRailMat));
    for (let w = 0; w < 5; w++) {
      bridgeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePtsArr[w]), 36, 0.0085, 6, false), chromeRailMat));
    }

    // Brushed-steel rectangular vertical stanchions + cantilevered horizontal cable outrigger arms (#019!)
    for (let p = 0; p <= 12; p++) {
      const z = -bridgeSpan * 0.46 + (p / 12) * (bridgeSpan * 0.92);
      const rx = s * railFlare(z);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, 1.04, 0.065), bridgeGirderMat);
      post.position.set(rx - s * 0.04, 0.58, z);
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.055), chromeRailMat);
      bracket.position.set(rx, 1.06, z);
      const outrigger = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.075, 0.085), bridgeGirderMat);
      outrigger.position.set(s * 1.94, 0.06, z);
      bridgeGroup.add(post, bracket, outrigger);
    }
  }

  // 3. TALL BLACK TAPERED A-FRAME STEEL LATTICE MAST / PYLON AT FAR END (z = +11.6)
  //    (Exact Iconic Centerpiece Silhouette of media_1795337629668_975ac4eb.jpg & #009!)
  const pylonZ = 11.4;
  for (const s of [-1, 1]) {
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 1.95, -0.4, pylonZ + 0.5),
      new THREE.Vector3(s * 1.25, 3.8, pylonZ + 0.25),
      new THREE.Vector3(s * 0.72, 7.6, pylonZ),
      new THREE.Vector3(s * 0.52, 11.6, pylonZ - 0.15),
      new THREE.Vector3(s * 0.36, 15.8, pylonZ - 0.30)
    ]);
    bridgeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(legCurve, 24, 0.135, 10, false), blackPylonMat));
  }
  // Horizontal A-frame lattice rungs & diagonal X-bracing struts up the pylon
  const rungLevels = [
    { y: 2.6, hw: 1.48 },
    { y: 4.4, hw: 1.16 },
    { y: 6.2, hw: 0.88 },
    { y: 8.0, hw: 0.68 },
    { y: 9.8, hw: 0.58 },
    { y: 11.8, hw: 0.50 },
    { y: 13.8, hw: 0.42 }
  ];
  for (let ri = 0; ri < rungLevels.length; ri++) {
    const rl = rungLevels[ri];
    const rung = new THREE.Mesh(new THREE.BoxGeometry(rl.hw * 2.05, 0.12, 0.14), blackPylonMat);
    rung.position.set(0, rl.y, pylonZ + (ri < 2 ? 0.22 : 0.0));
    bridgeGroup.add(rung);
    if (ri < rungLevels.length - 1) {
      const rn = rungLevels[ri + 1];
      for (const dir of [-1, 1]) {
        const pA = new THREE.Vector3(dir * rl.hw, rl.y, pylonZ);
        const pB = new THREE.Vector3(-dir * rn.hw, rn.y, pylonZ);
        const diagCurve = new THREE.LineCurve3(pA, pB);
        bridgeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(diagCurve, 4, 0.048, 6, false), blackPylonMat));
      }
    }
  }

  // 4. MASSIVE TWIN-FORKED CURVED DARK-GREY TUBULAR STEEL OVERHEAD ARCH TRUSSES
  //    Sweeping dramatically overhead across the circular glass rainforest dome (media_1795337629668_975ac4eb.jpg!)
  const archCurves = { left: null, right: null };
  for (const s of [-1, 1]) {
    // Primary grand wishbone tubular steel rib curving from far A-frame pylon UP & OUT across the circular atrium!
    const mainRibPts = [
      new THREE.Vector3(s * 1.68, 0.2, 11.5),
      new THREE.Vector3(s * 1.12, 4.4, 10.6),
      new THREE.Vector3(s * 1.38, 7.2, 8.8),
      new THREE.Vector3(s * 4.4, 9.0, 3.8),
      new THREE.Vector3(s * 8.6, 10.0, -3.2),
      new THREE.Vector3(s * 12.2, 9.6, -10.4),
      new THREE.Vector3(s * 14.2, 7.6, -14.8)
    ];
    const mainRibCurve = new THREE.CatmullRomCurve3(mainRibPts);
    if (s < 0) archCurves.left = mainRibCurve;
    else archCurves.right = mainRibCurve;
    bridgeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(mainRibCurve, 48, 0.27, 14, false), darkArchSteelMat));

    // Secondary forked inner-crown strut meeting the central cross-tie overhead (classic wishbone Y-fork visible top-center of photo!)
    const forkPts = [
      new THREE.Vector3(s * 0.72, 7.6, 11.2),
      new THREE.Vector3(s * 2.15, 8.8, 5.2),
      new THREE.Vector3(s * 5.2, 10.4, -2.0),
      new THREE.Vector3(s * 7.8, 10.8, -8.5)
    ];
    const forkCurve = new THREE.CatmullRomCurve3(forkPts);
    bridgeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(forkCurve, 28, 0.19, 10, false), darkArchSteelMat));
  }
  // Curved overhead tubular cross-tie arches joining left & right wishbone ribs cleanly across the sky dome!
  const tieConfigs = [
    { z: -8.2, xSpan: 11.2, yMid: 11.4, yEnd: 9.8, r: 0.24 },
    { z: -2.2, xSpan: 8.2, yMid: 11.2, yEnd: 9.9, r: 0.22 },
    { z: 4.2, xSpan: 4.2, yMid: 9.8, yEnd: 8.9, r: 0.18 },
    { z: 9.6, xSpan: 1.35, yMid: 7.4, yEnd: 7.1, r: 0.14 }
  ];
  for (const tc of tieConfigs) {
    const tieCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-tc.xSpan, tc.yEnd, tc.z),
      new THREE.Vector3(0, tc.yMid, tc.z - 0.5),
      new THREE.Vector3(tc.xSpan, tc.yEnd, tc.z)
    ]);
    bridgeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(tieCurve, 24, tc.r, 10, false), darkArchSteelMat));
  }

  // 5. DIAGONAL BLACK STEEL TENSION SUSPENDER CABLES FANNING FROM OVERHEAD CURVED ARCHES DOWN TO BRIDGE DECK!
  for (let ci = 0; ci < 9; ci++) {
    const u = 0.08 + (ci / 8) * 0.80;
    const zDeck = -11.2 + u * 21.8;
    const tArch = 0.88 - u * 0.68; // Map deck z=-11..+10 cleanly along arch curve back toward pylon!
    for (const s of [-1, 1]) {
      const curve = s < 0 ? archCurves.left : archCurves.right;
      const topPt = curve.getPoint(Math.max(0.12, Math.min(0.92, tArch)));
      const botPt = new THREE.Vector3(s * 1.96, 0.08, zDeck);
      const cab = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.LineCurve3(botPt, topPt), 4, 0.024, 6, false),
        blackCableMat
      );
      bridgeGroup.add(cab);
      // Secondary finer fan cable to outer glass perimeter ring just like media_1795337629668_975ac4eb.jpg!
      if (ci % 2 === 0) {
        const outerPt = new THREE.Vector3(s * (8.5 + (1 - u) * 5.2), 7.8 + (1 - u) * 2.2, zDeck - 1.2);
        const fanCab = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(s * 1.98, 0.08, zDeck + 0.5), outerPt), 4, 0.014, 5, false),
          blackCableMat
        );
        bridgeGroup.add(fanCab);
      }
    }
  }

  // Keep bridgePlanks array defined for update() compatibility (zero stray plank sway glitches on smooth terrazzo deck)
  const bridgePlanks = [];

  interactables.push(
    {
      id: 'rainbow-bridge-bell',
      position: new THREE.Vector3(38.0, 19.1, -4.5),
      radius: 9.5,
      priority: 4,
      prompt: '[E] Enjoy Open-Air Rainforest Suspension Bridge Vista (+150 UPoints)',
      actionType: 'ring-rainbow-bell',
      stampId: 'spawn-rainbow-bridge-2f'
    }
  );

  // ==========================================================================
  // 2B. 2F HIGHSTREET: STARSHIP GALACTICA 2-STOREY NEON SCI-FI PLAYLAND (Verified #148, #171-#172, #190-#191!)
  // ==========================================================================
  {
    const sg = new THREE.Group();
    sg.position.set(85.0, 18.0, 0.0);
    const sgDarkMat = new THREE.MeshStandardMaterial({ color: '#141928', roughness: 0.40, metalness: 0.55 });
    const sgPanelMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.38, metalness: 0.35 });
    const sgCyanNeon = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.9, 2.5), toneMapped: false });
    const sgPinkNeon = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.35, 1.5), toneMapped: false });
    const sgYellowNeon = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.3, 1.85, 0.32), toneMapped: false });
    const sgSlideMat = new THREE.MeshStandardMaterial({ color: '#7e22ce', roughness: 0.24, metalness: 0.22 });

    // Elevated sci-fi playland deck spanning inside 2F Highstreet void
    const sgDeck = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.24, 9.6), sgDarkMat);
    sgDeck.position.y = 0.08;
    sg.add(sgDeck);
    // Illuminated octagonal spaceship play pods rising 2 full storeys (y = 0..7.8m!)
    const podA = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.2, 5.4), sgDarkMat);
    podA.position.set(1.8, 3.6, -0.6);
    const podB = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.4, 4.6), sgPanelMat);
    podB.position.set(2.4, 6.2, -0.8);
    // Glowing cyan & magenta neon sci-fi edge ribs
    for (const py of [1.8, 4.2, 6.6]) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(7.35, 0.09, 5.55), py === 4.2 ? sgPinkNeon : sgCyanNeon);
      rib.position.set(1.8, py, -0.6);
      sg.add(rib);
    }
    // Iconic glowing blue spiral staircase + twisted purple tube slide on left side (#171!)
    for (let st = 0; st < 22; st++) {
      const a = st * 0.42;
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 0.36), st % 2 === 0 ? sgDarkMat : sgCyanNeon);
      step.position.set(-4.2 + Math.cos(a) * 0.95, 0.25 + st * 0.24, 0.6 + Math.sin(a) * 0.95);
      step.rotation.y = -a;
      sg.add(step);
    }
    const slidePts = [];
    for (let k = 0; k <= 18; k++) {
      const t = k / 18;
      slidePts.push(new THREE.Vector3(-2.4 + Math.cos(t * Math.PI * 2.2) * 1.15, 5.4 - t * 4.8, 1.4 + Math.sin(t * Math.PI * 2.2) * 1.15));
    }
    const tubeSlide = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(slidePts), 32, 0.48, 12, false), sgSlideMat);
    // Glowing "GO >>" neon portal frame + STARSHIP GALACTICA marquee sign & ticket counter (#171!)
    const goSignMat = new THREE.MeshBasicMaterial({
      map: createSignBoardTexture('STARSHIP GALACTICA', 'GO >>  •  2F HIGHSTREET PLAYLAND', '#0c1636', '#67e8f9', '#facc15', 1024, 256)
    });
    const marquee = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.25, 0.16), [sgDarkMat, sgDarkMat, sgDarkMat, sgDarkMat, goSignMat, goSignMat]);
    marquee.position.set(-4.8, 2.55, 3.8);
    const tktCounter = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.04, 1.15), sgPanelMat);
    tktCounter.position.set(-4.8, 0.62, 3.8);
    const tktGlow = new THREE.Mesh(new THREE.BoxGeometry(3.86, 0.08, 1.20), sgYellowNeon);
    tktGlow.position.set(-4.8, 1.16, 3.8);
    sg.add(podA, podB, tubeSlide, marquee, tktCounter, tktGlow);
    root.add(sg);
  }

  // ==========================================================================
  // 2C. 1 UTAMA E GF: OPEN-AIR GIANT CHESSBOARD COURTYARD & GREEN FACADE FINS (Verified #120, #518!)
  // ==========================================================================
  {
    const chessG = new THREE.Group();
    chessG.position.set(-139.0, 6.02, 11.4);
    const sqSize = 0.72;
    const whiteTileMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.24, metalness: 0.04 });
    const blackTileMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.28, metalness: 0.08 });
    const whitePieceMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.22, metalness: 0.06 });
    const blackPieceMat = new THREE.MeshStandardMaterial({ color: '#14161a', roughness: 0.24, metalness: 0.14 });
    const greenFinMat = new THREE.MeshPhysicalMaterial({ color: '#10b981', transparent: true, opacity: 0.56, roughness: 0.30, metalness: 0.22, side: THREE.DoubleSide });

    // 8x8 Giant Checkered Board
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = new THREE.Mesh(new THREE.BoxGeometry(sqSize, 0.03, sqSize), (r + c) % 2 === 0 ? whiteTileMat : blackTileMat);
        sq.position.set((c - 3.5) * sqSize, 0.015, (r - 3.5) * sqSize);
        chessG.add(sq);
      }
    }
    // 16 Sculpted Oversized Playable Chess Pieces (LatheGeometry kings, queens, rooks, pawns!)
    const pieceProfile = [
      new THREE.Vector2(0.0, 0.0), new THREE.Vector2(0.18, 0.0), new THREE.Vector2(0.16, 0.10),
      new THREE.Vector2(0.10, 0.24), new THREE.Vector2(0.08, 0.54), new THREE.Vector2(0.13, 0.62),
      new THREE.Vector2(0.09, 0.74), new THREE.Vector2(0.12, 0.86), new THREE.Vector2(0.0, 0.94)
    ];
    const pieceGeo = new THREE.LatheGeometry(pieceProfile, 16);
    const pieceSpots = [
      [-2.5, -2.5, 0, 1.05], [-1.8, -2.5, 0, 0.92], [-0.4, -2.5, 0, 1.15], [0.4, -2.5, 0, 1.12], [1.8, -2.5, 0, 0.92], [2.5, -2.5, 0, 1.05],
      [-1.1, -1.1, 0, 0.80], [0.4, -0.4, 0, 0.82],
      [-2.5, 2.5, 1, 1.05], [-1.8, 2.5, 1, 0.92], [-0.4, 2.5, 1, 1.15], [0.4, 2.5, 1, 1.12], [1.8, 2.5, 1, 0.92], [2.5, 2.5, 1, 1.05],
      [-0.4, 0.4, 1, 0.82], [1.1, 1.1, 1, 0.80]
    ];
    for (const [px, pz, isW, sc] of pieceSpots) {
      const pc = new THREE.Mesh(pieceGeo, isW ? whitePieceMat : blackPieceMat);
      pc.position.set(px, 0.03, pz);
      pc.scale.setScalar(sc);
      chessG.add(pc);
    }
    // Iconic Slanted Translucent Green Architectural Louver Fins along rear edge (#518!)
    for (let f = -3; f <= 3; f++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.10, 5.2, 0.72), greenFinMat);
      fin.position.set(f * 0.95, 2.6, 3.6);
      fin.rotation.z = -0.32;
      chessG.add(fin);
    }
    root.add(chessG);
  }

  // ==========================================================================
  // 2. 1 UTAMA E ATTRACTIONS: LG601 FLOWRIDER, F603A ROLLERWA, S601 WINDLAB
  // ==========================================================================
  // A. LG601 FlowRider® 1 Utama (x=-176.2, y=0.05, z=0 — rotation +PI/2 so front splash rail, surfboards & visible riding surfer face EAST toward E-Street!)
  const flowRiderGroup = new THREE.Group();
  flowRiderGroup.position.set(-176.2, 0.05, 0);
  flowRiderGroup.rotation.y = Math.PI / 2;
  root.add(flowRiderGroup);

  // Raised blue non-slip rubber deck pad eliminating any floor-to-wave Z-fighting!
  const deckPadFR = new THREE.Mesh(
    new THREE.BoxGeometry(15.6, 0.14, 9.2),
    new THREE.MeshStandardMaterial({ color: '#0c4a6e', roughness: 0.78 })
  );
  deckPadFR.position.y = 0.07;
  flowRiderGroup.add(deckPadFR);

  const flowWaveMat = createFlowRiderWaveMaterial();
  // Clamped width 13.9m cleanly tucked INSIDE padded bolsters at x = ±7.35 (ZERO floating wave corners!)
  const waveRampGeo = new THREE.PlaneGeometry(13.9, 7.6, 32, 24);
  const posAttr = waveRampGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const py = posAttr.getY(i);
    const u = (py + 3.8) / 7.6;
    posAttr.setZ(i, Math.pow(u, 1.75) * 1.45 + 0.16);
  }
  waveRampGeo.computeVertexNormals();
  const waveRamp = new THREE.Mesh(waveRampGeo, flowWaveMat);
  waveRamp.rotation.x = -Math.PI / 2;
  flowRiderGroup.add(waveRamp);

  const bolsterMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.42 });
  for (const xSide of [-7.35, 7.35]) {
    const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.62, 8.4), bolsterMat);
    bolster.position.set(xSide, 0.84, 0);
    flowRiderGroup.add(bolster);
  }
  // Back padded wave wall supporting rear crest cleanly!
  const backBolster = new THREE.Mesh(new THREE.BoxGeometry(15.45, 1.62, 0.45), bolsterMat);
  backBolster.position.set(0, 0.84, -4.05);
  flowRiderGroup.add(backBolster);

  // Acrylic splash-guard spectator rail + steel handrail + surfboards rack + instructor NPC on FRONT viewing deck!
  const splashGlass = new THREE.Mesh(
    new THREE.BoxGeometry(15.2, 0.96, 0.06),
    new THREE.MeshPhysicalMaterial({ color: '#bae6fd', transparent: true, opacity: 0.24, depthWrite: false })
  );
  splashGlass.position.set(0, 0.62, 4.4);
  const splashTopRail = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.07, 0.09), steelDarkMat);
  splashTopRail.position.set(0, 1.12, 4.4);
  for (const px of [-7.5, -3.75, 0, 3.75, 7.5]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.02, 8), steelDarkMat);
    p.position.set(px, 0.60, 4.4);
    flowRiderGroup.add(p);
  }
  flowRiderGroup.add(splashGlass, splashTopRail);

  // Decorative surfboard display rack + FlowRider instructor on right front deck flank
  const rackCols = ['#facc15', '#38bdf8', '#f43f5e'];
  for (let sb = 0; sb < 3; sb++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.55, 0.08), new THREE.MeshStandardMaterial({ color: rackCols[sb], roughness: 0.25 }));
    b.position.set(5.4 + sb * 0.56, 0.92, 4.0);
    b.rotation.x = -0.15;
    flowRiderGroup.add(b);
  }
  const frInstructor = createArticulatedPerson({ shirt: '#f97316', pants: '#0f172a' });
  frInstructor.position.set(-6.0, 0.14, 4.0);
  frInstructor.rotation.y = 0.35;
  flowRiderGroup.add(frInstructor);

  // E-Street Outdoor Kopitiam Café Tables enriching the LG-02 foreground concourse!
  const cafeWoodMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.55 });
  for (const [cx, cz] of [[-160.5, -6.2], [-156.5, -6.2]]) {
    const tbl = new THREE.Group();
    tbl.position.set(cx, 0, cz);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 16), cafeWoodMat);
    top.position.y = 0.76;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.76, 8), steelDarkMat);
    pole.position.y = 0.38;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.06, 12), steelDarkMat);
    base.position.y = 0.03;
    tbl.add(top, pole, base);
    for (const sx of [-0.72, 0.72]) {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.42), steelDarkMat);
      ch.position.set(sx, 0.23, 0);
      tbl.add(ch);
    }
    root.add(tbl);
  }

  // Real Rigged .glb Human Surfer riding the yellow FlowRider surfboard (ZERO Lego cylinders/spheres!)
  const surferGroup = new THREE.Group();
  const boardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.08, 1.72),
    new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.22 })
  );
  const boardStripe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 1.68), new THREE.MeshStandardMaterial({ color: '#ef4444' }));
  const surferRig = createSculptedHumanRig(251, { allowBag: false, idlePose: true, shirtHex: '#0284c7', pantsHex: '#18181b' });
  surferRig.group.position.set(0, 0.05, 0);
  surferRig.group.rotation.y = Math.PI * 0.42;
  surferGroup.add(boardMesh, boardStripe, surferRig.group);
  flowRiderGroup.add(surferGroup);

  let surfTrickTimer = 0;
  function triggerSurfTrick() {
    surfTrickTimer = 2.6;
  }

  interactables.push({
    id: 'flowrider-deck',
    position: new THREE.Vector3(-170.0, 1.2, 0),
    radius: 10.0,
    priority: 4,
    prompt: '[E] Trigger LG601 FlowRider® 360 Aerial Surf Stunt (+200 UPoints)',
    actionType: 'flowrider-trick',
    stampId: 'spawn-flowrider'
  });

  // B. F603A District K Rollerwa Neon Roller-Skating Rink (1F, x=-174.5, y=12, z=0)
  //    Glossy dark-indigo reflective rink floor, vivid HDR magenta & cyan perimeter LEDs, crisp cyan ceiling halo,
  //    illuminated neon DJ booth island with twin turntables & glowing animated front EQ bars, and multi-part Skate Rental counter with 24 pairs of lined roller skates!
  const rollerwaGroup = new THREE.Group();
  rollerwaGroup.position.set(-174.5, 12.02, 0);
  root.add(rollerwaGroup);

  // Deep glossy dark-indigo rink floor texture with concentric neon-track lane accents
  const rinkCanvas = document.createElement('canvas');
  rinkCanvas.width = rinkCanvas.height = 512;
  const rCtx = rinkCanvas.getContext('2d');
  const rGrad = rCtx.createRadialGradient(256, 256, 36, 256, 256, 256);
  rGrad.addColorStop(0.0, '#10183c');
  rGrad.addColorStop(0.55, '#0c1230');
  rGrad.addColorStop(0.88, '#080c24');
  rGrad.addColorStop(1.0, '#0f1638');
  rCtx.fillStyle = rGrad;
  rCtx.fillRect(0, 0, 512, 512);
  rCtx.strokeStyle = 'rgba(0, 229, 255, 0.36)';
  rCtx.lineWidth = 4;
  rCtx.beginPath();
  rCtx.arc(256, 256, 178, 0, Math.PI * 2);
  rCtx.stroke();
  rCtx.strokeStyle = 'rgba(236, 72, 153, 0.40)';
  rCtx.lineWidth = 3;
  rCtx.beginPath();
  rCtx.arc(256, 256, 236, 0, Math.PI * 2);
  rCtx.stroke();
  const rinkFloorTex = new THREE.CanvasTexture(rinkCanvas);
  rinkFloorTex.colorSpace = THREE.SRGBColorSpace;

  const rinkFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(6.8, 6.8, 0.08, 48),
    new THREE.MeshPhysicalMaterial({
      map: rinkFloorTex,
      color: '#0c1230',
      roughness: 0.08,
      metalness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.45
    })
  );
  rinkFloor.scale.set(0.75, 1, 1.65);
  rinkFloor.position.y = 0.04;
  rinkFloor.receiveShadow = true;

  // Vivid HDR Magenta & Cyan Perimeter LED Strips (toneMapped: false) + Acrylic Rink Barrier + Brushed Chrome Stanchions!
  const rwMagentaNeon = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.55, 0.32, 1.55), toneMapped: false });
  const rwCyanNeon = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.26, 2.25, 2.95), toneMapped: false });
  const chromeRodMat = new THREE.MeshStandardMaterial({ color: '#d8e2ec', metalness: 0.88, roughness: 0.20, envMapIntensity: 1.35 });

  const rinkWall = new THREE.Mesh(
    new THREE.CylinderGeometry(6.85, 6.85, 1.05, 48, 1, true),
    new THREE.MeshPhysicalMaterial({ color: '#f472b6', transparent: true, opacity: 0.22, roughness: 0.06, clearcoat: 1.0, side: THREE.DoubleSide, depthWrite: false })
  );
  rinkWall.scale.set(0.75, 1, 1.65);
  rinkWall.position.y = 0.56;

  const rinkBaseLed = new THREE.Mesh(new THREE.TorusGeometry(6.86, 0.065, 8, 64), rwCyanNeon);
  rinkBaseLed.rotation.x = Math.PI / 2;
  rinkBaseLed.scale.set(0.75, 1.65, 1);
  rinkBaseLed.position.y = 0.11;

  const rinkMidLed = new THREE.Mesh(new THREE.TorusGeometry(6.86, 0.042, 8, 64), rwCyanNeon);
  rinkMidLed.rotation.x = Math.PI / 2;
  rinkMidLed.scale.set(0.75, 1.65, 1);
  rinkMidLed.position.y = 0.58;

  const rinkNeon = new THREE.Mesh(new THREE.TorusGeometry(6.85, 0.088, 10, 64), rwMagentaNeon);
  rinkNeon.rotation.x = Math.PI / 2;
  rinkNeon.scale.set(0.75, 1.65, 1);
  rinkNeon.position.y = 1.08;

  for (let p = 0; p < 16; p++) {
    const pa = (p / 16) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 1.08, 8), chromeRodMat);
    post.position.set(Math.cos(pa) * 6.85 * 0.75, 0.54, Math.sin(pa) * 6.85 * 1.65);
    rollerwaGroup.add(post);
  }

  // Crisp Glowing Cyan & Magenta Overhead Circular Halo Rings lowered by 0.55m (strictly <= 4.95 -> ZERO bleed into 2F PJPAC floor!)
  const rinkCeilingHalo = new THREE.Mesh(new THREE.TorusGeometry(6.85, 0.105, 12, 72), rwCyanNeon);
  rinkCeilingHalo.rotation.x = Math.PI / 2;
  rinkCeilingHalo.scale.set(0.75, 1.65, 1);
  rinkCeilingHalo.position.y = 4.10;

  const rinkInnerHalo = new THREE.Mesh(new THREE.TorusGeometry(5.65, 0.062, 10, 64), rwMagentaNeon);
  rinkInnerHalo.rotation.x = Math.PI / 2;
  rinkInnerHalo.scale.set(0.72, 1.56, 1);
  rinkInnerHalo.position.y = 3.99;

  for (let r = 0; r < 8; r++) {
    const ra = (r / 8) * Math.PI * 2;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.78, 8), chromeRodMat);
    rod.position.set(Math.cos(ra) * 6.85 * 0.75, 4.49, Math.sin(ra) * 6.85 * 1.65);
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.05, 8), chromeRodMat);
    flange.position.set(Math.cos(ra) * 6.85 * 0.75, 4.88, Math.sin(ra) * 6.85 * 1.65);
    rollerwaGroup.add(rod, flange);
  }

  // Localized neon club glow pool kept strictly within 1F envelope (ZERO bleed up into 2F PJPAC!)
  const rwClubGlow = new THREE.PointLight('#d946ef', 10, 12, 1.65);
  rwClubGlow.position.set(0, 3.10, 0);
  const rwCyanFill = new THREE.PointLight('#38bdf8', 8, 12, 1.65);
  rwCyanFill.position.set(4.5, 2.75, -3.5);
  rollerwaGroup.add(rwClubGlow, rwCyanFill);

  // Detailed Multi-Part RollerWa Skate Rental Counter with Dark-Indigo Recessed 3D Lit Skate Cubbies & 24 Pairs of Roller Skates!
  const rentalGroup = new THREE.Group();
  rentalGroup.position.set(6.8, 0, -6.2);
  const rentalBodyMat = new THREE.MeshStandardMaterial({ color: '#11163a', roughness: 0.36, metalness: 0.25 });
  const cubbyRecessMat = new THREE.MeshStandardMaterial({ color: '#0c102b', roughness: 0.45, metalness: 0.18 });
  const rentalQuartzMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.22, metalness: 0.12 });
  const rentalDesk = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.98, 3.45), rentalBodyMat);
  rentalDesk.position.set(0, 0.49, 0);
  const rentalTop = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.08, 3.58), rentalQuartzMat);
  rentalTop.position.set(0, 1.02, 0);
  const rentalToeLed = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.055, 3.48), rwMagentaNeon);
  rentalToeLed.position.set(0, 0.04, 0);
  const rentalLipLed = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.036, 3.52), rwCyanNeon);
  rentalLipLed.position.set(0, 0.96, 0);
  const rentalSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.85, 0.62),
    new THREE.MeshBasicMaterial({ map: createSignBoardTexture('ROLLERWA SKATE RENTAL', 'F603A • QUADS & SAFETY GEAR', '#0c1230', '#ffffff', '#f472b6') })
  );
  rentalSign.rotation.y = Math.PI / 2;
  rentalSign.position.set(0.54, 0.54, 0);
  // Countertop POS touchscreen + skate-size gauge mat
  const rwPos = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.44), steelDarkMat);
  rwPos.position.set(0.10, 1.24, -0.85);
  rwPos.rotation.z = -0.22;
  const rwPosScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.26), rwCyanNeon);
  rwPosScreen.rotation.y = Math.PI / 2;
  rwPosScreen.position.set(0.18, 1.25, -0.85);

  // Dark-Indigo Recessed 3D Lit Skate Cubbies Cabinet (ZERO solid pink backwall!)
  const cubbyBack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.28, 3.40), cubbyRecessMat);
  cubbyBack.position.set(-1.45, 1.14, 0);
  const cubbyTopFrame = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 3.46), rentalBodyMat);
  cubbyTopFrame.position.set(-1.28, 2.26, 0);
  const cubbyBotFrame = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 3.46), rentalBodyMat);
  cubbyBotFrame.position.set(-1.28, 0.18, 0);
  // Slim outer neon trim strips ONLY around perimeter frame (not a solid pink rectangle!)
  const trimTop = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.042, 3.42), rwMagentaNeon);
  trimTop.position.set(-1.04, 2.27, 0);
  const trimBot = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.042, 3.42), rwCyanNeon);
  trimBot.position.set(-1.04, 0.34, 0);
  rentalGroup.add(rentalDesk, rentalTop, rentalToeLed, rentalLipLed, rentalSign, rwPos, rwPosScreen, cubbyBack, cubbyTopFrame, cubbyBotFrame, trimTop, trimBot);

  for (const sideZ of [-1.68, -1.06, -0.53, 0.0, 0.53, 1.06, 1.68]) {
    const isOuter = Math.abs(sideZ) > 1.6;
    const div = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.94, isOuter ? 0.10 : 0.045), rentalBodyMat);
    div.position.set(-1.26, 1.32, sideZ);
    rentalGroup.add(div);
    if (isOuter) {
      const edgeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.036, 1.92, 0.036), rwMagentaNeon);
      edgeTrim.position.set(-1.04, 1.32, sideZ);
      rentalGroup.add(edgeTrim);
    }
  }

  const cubbyUnderGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 1.35, 1.85) });
  for (let sh = 0; sh < 4; sh++) {
    const sy = 0.42 + sh * 0.46;
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 3.28), rentalQuartzMat);
    shelf.position.set(-1.26, sy, 0);
    const shelfLed = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.022, 3.24), cubbyUnderGlowMat);
    shelfLed.position.set(-1.40, sy + 0.39, 0);
    rentalGroup.add(shelf, shelfLed);
  }
  const skateCols = ['#f472b6', '#38bdf8', '#facc15', '#c084fc', '#f8fafc', '#fb7185'];
  const skateBootGeo = new THREE.BoxGeometry(0.22, 0.16, 0.10);
  const skateCuffGeo = new THREE.BoxGeometry(0.11, 0.14, 0.095);
  const skateWheelGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.12, 8);
  skateWheelGeo.rotateX(Math.PI / 2);
  const wheelNeonMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
  for (let sh = 0; sh < 4; sh++) {
    const sy = 0.48 + sh * 0.46;
    for (let col = 0; col < 6; col++) {
      const sz = -1.32 + col * 0.52;
      const bootMat = new THREE.MeshStandardMaterial({ color: skateCols[(sh * 3 + col) % skateCols.length], roughness: 0.28, metalness: 0.12 });
      for (const pairOff of [-0.075, 0.075]) {
        const boot = new THREE.Mesh(skateBootGeo, bootMat);
        boot.position.set(-1.22, sy + 0.08, sz + pairOff);
        const cuff = new THREE.Mesh(skateCuffGeo, bootMat);
        cuff.position.set(-1.28, sy + 0.19, sz + pairOff);
        const w1 = new THREE.Mesh(skateWheelGeo, wheelNeonMat);
        w1.position.set(-1.16, sy + 0.01, sz + pairOff);
        const w2 = new THREE.Mesh(skateWheelGeo, wheelNeonMat);
        w2.position.set(-1.28, sy + 0.01, sz + pairOff);
        rentalGroup.add(boot, cuff, w1, w2);
      }
    }
  }
  const rentalStaff = createArticulatedPerson({ shirt: '#ec4899', pants: '#0f172a' });
  rentalStaff.position.set(-0.62, 0, -0.35);
  rentalStaff.rotation.y = Math.PI / 2;
  rentalGroup.add(rentalStaff);

  const lacingBench = createSlattedBench(2.8, new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.55 }), steelDarkMat);
  lacingBench.rotation.y = -Math.PI / 2;
  lacingBench.position.set(7.5, 0, 5.2);
  // Resting pair of pastel pink roller skates right beside the lacing bench
  const restBootMat = new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.28 });
  for (const rz of [4.85, 5.02]) {
    const rb = new THREE.Mesh(skateBootGeo, restBootMat);
    rb.position.set(6.95, 0.10, rz);
    rollerwaGroup.add(rb);
  }
  rollerwaGroup.add(rentalGroup, lacingBench);

  // Illuminated Neon DJ Booth Island Centerpiece with Twin Turntables, Club Mixer, DJ & Glowing Animated Front EQ Bars!
  const djIsland = new THREE.Group();
  djIsland.position.set(0, 0.08, 0);
  const djDarkMat = new THREE.MeshStandardMaterial({ color: '#0d1021', roughness: 0.22, metalness: 0.65, envMapIntensity: 1.35 });
  const djPlinth = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.92, 0.16, 16), djDarkMat);
  djPlinth.position.y = 0.08;
  const djPlinthLed = new THREE.Mesh(new THREE.TorusGeometry(1.86, 0.042, 8, 32), rwCyanNeon);
  djPlinthLed.rotation.x = Math.PI / 2;
  djPlinthLed.position.y = 0.16;

  // Sculpted angular DJ console desk facing East (+X toward 1F-01 camera!)
  const djDeskMain = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.06, 2.24), djDarkMat);
  djDeskMain.position.set(0.24, 0.69, 0);
  const djDeskTop = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.07, 2.34), new THREE.MeshStandardMaterial({ color: '#1e1b4b', roughness: 0.16, metalness: 0.52 }));
  djDeskTop.position.set(0.24, 1.24, 0);
  const djFrontTrimTop = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 2.28), rwMagentaNeon);
  djFrontTrimTop.position.set(0.79, 1.20, 0);
  const djFrontTrimBot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 2.28), rwCyanNeon);
  djFrontTrimBot.position.set(0.79, 0.22, 0);

  // Overhead neon DJ marquee hoop arching cleanly above the turntables
  const djArch = new THREE.Mesh(new THREE.TorusGeometry(1.26, 0.048, 8, 32, Math.PI), rwMagentaNeon);
  djArch.rotation.y = Math.PI / 2;
  djArch.position.set(0.24, 1.22, 0);
  const djSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.65, 0.34),
    new THREE.MeshBasicMaterial({ map: createSignBoardTexture('DJ • ROLLERWA', 'K-POP NEON MIX', '#0f0a2c', '#ffffff', '#ec4899') })
  );
  djSign.rotation.y = Math.PI / 2;
  djSign.position.set(0.78, 1.05, 0);

  // Twin Detailed DJ Turntables + Central 4-Channel Club Mixer + Twin Studio Monitor Speakers on Console Top!
  const ttPlatterMat = new THREE.MeshStandardMaterial({ color: '#dbe4ee', roughness: 0.18, metalness: 0.90 });
  const ttVinylMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.26, metalness: 0.35 });
  for (const tz of [-0.62, 0.62]) {
    const ttBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.50), steelDarkMat);
    ttBase.position.set(0.26, 1.30, tz);
    const ttVinyl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.025, 20), ttVinylMat);
    ttVinyl.position.set(0.26, 1.345, tz);
    const ttRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 6, 24), rwCyanNeon);
    ttRing.rotation.x = Math.PI / 2;
    ttRing.position.set(0.26, 1.35, tz);
    const ttLabel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 12), rwMagentaNeon);
    ttLabel.position.set(0.26, 1.35, tz);
    const toneArm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6), ttPlatterMat);
    toneArm.rotation.x = Math.PI * 0.42;
    toneArm.position.set(0.12, 1.38, tz + 0.14);
    const speaker = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.46, 0.30), djDarkMat);
    speaker.position.set(0.20, 1.50, tz * 1.65);
    const woofer = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.015, 6, 16), tz < 0 ? rwCyanNeon : rwMagentaNeon);
    woofer.rotation.y = Math.PI / 2;
    woofer.position.set(0.37, 1.46, tz * 1.65);
    djIsland.add(ttBase, ttVinyl, ttRing, ttLabel, toneArm, speaker, woofer);
  }
  const mixer = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.48), steelDarkMat);
  mixer.position.set(0.26, 1.305, 0);
  const mixerGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.38), rwCyanNeon);
  mixerGlow.rotation.x = -Math.PI / 2;
  mixerGlow.position.set(0.26, 1.345, 0);

  // Glowing Front Animated Neon Equalizer Bars (12 spectrum bands facing +X toward 1F-01!)
  const djEqGroup = new THREE.Group();
  djEqGroup.position.set(0.80, 0.28, 0);
  const djEqBars = [];
  const eqPalette = [
    new THREE.Color(0.24, 2.25, 2.95),
    new THREE.Color(0.55, 1.65, 2.85),
    new THREE.Color(1.65, 0.48, 2.55),
    new THREE.Color(2.55, 0.32, 1.55),
    new THREE.Color(2.55, 1.45, 0.28)
  ];
  for (let b = 0; b < 12; b++) {
    const bz = -0.94 + (b / 11) * 1.88;
    const baseH = 0.36 + (Math.sin(b * 0.9) * 0.5 + 0.5) * 0.30;
    const eqMat = new THREE.MeshBasicMaterial({ color: eqPalette[b % eqPalette.length], toneMapped: false });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.62, 0.105), eqMat);
    bar.position.set(0, 0.31, bz);
    djEqGroup.add(bar);
    djEqBars.push({ mesh: bar, phase: b * 0.72, baseH });
  }
  const djPerson = createArticulatedPerson({ shirt: '#a855f7', pants: '#0f172a' });
  djPerson.position.set(-0.46, 0.16, 0);
  djPerson.rotation.y = Math.PI / 2;

  djIsland.add(djPlinth, djPlinthLed, djDeskMain, djDeskTop, djFrontTrimTop, djFrontTrimBot, djArch, djSign, mixer, mixerGlow, djEqGroup, djPerson);
  rollerwaGroup.add(rinkFloor, rinkWall, rinkBaseLed, rinkMidLed, rinkNeon, rinkCeilingHalo, rinkInnerHalo, djIsland);

  // Real Rigged .glb Human Skaters gliding around F603A District K Rollerwa Neon Rink!
  const rollerSkaters = [];
  for (let s = 0; s < 5; s++) {
    const skRig = createSculptedHumanRig(200 + s * 7, { allowBag: false });
    rollerwaGroup.add(skRig.group);
    rollerSkaters.push({ group: skRig.group, mixer: skRig.mixer, phase: (s / 5) * Math.PI * 2 });
  }
  interactables.push({
    id: 'rollerwa-rink',
    position: new THREE.Vector3(-171.0, 13.3, 0),
    radius: 11.5,
    priority: 4,
    prompt: '[E] Drop K-Pop Neon Beat at F603A Rollerwa Roller-Skating Rink (+150 UPoints)',
    actionType: 'rollerwa-party'
  });

  // C. S601 WINDLAB Indoor Skydiving (2F 1UE, x=-170.5, y=18, z=-12.8)
  //    Compact aerodynamic shroud strictly BELOW y <= 3.55 local (21.55 world) -> WINDLAB fascia reads 100% unobstructed from 2F-01!
  //    Vivid glowing cyan & electric-orange turbine LED rings + intake stator blades + translucent swirling upward mist vortex!
  const airRiderGroup = new THREE.Group();
  airRiderGroup.position.set(-170.5, 18.0, -12.8);
  root.add(airRiderGroup);
  addShadow(airRiderGroup, 0, 0, 0, 7.5, 7.5);

  const windPedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 3.05, 0.66, 32), steelDarkMat);
  windPedestal.position.y = 0.33;
  // Intake diffuser stainless mesh floor + radial turbine stator vanes inside pedestal well
  const windDeckCore = new THREE.Mesh(
    new THREE.CylinderGeometry(2.34, 2.34, 0.06, 28),
    new THREE.MeshStandardMaterial({ color: '#1b2638', roughness: 0.38, metalness: 0.85 })
  );
  windDeckCore.position.y = 0.67;
  for (let v = 0; v < 12; v++) {
    const va = (v / 12) * Math.PI * 2;
    const vane = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.04, 0.14), chromeRodMat);
    vane.position.set(Math.cos(va) * 1.12, 0.70, Math.sin(va) * 1.12);
    vane.rotation.y = -va;
    vane.rotation.x = 0.32;
    airRiderGroup.add(vane);
  }

  // Compact aerodynamic brushed-steel top shroud strictly <= 3.55 local (21.55 world < 21.75!) -> ZERO WINDLAB sign occlusion from 2F-01!
  const windShroudMat = new THREE.MeshStandardMaterial({ color: '#273244', roughness: 0.28, metalness: 0.84, envMapIntensity: 1.25 });
  const windTopCap = new THREE.Mesh(new THREE.CylinderGeometry(2.58, 2.86, 0.28, 32), windShroudMat);
  windTopCap.position.y = 3.41; // Top sits cleanly at local y = 3.55 (world 21.55)!
  const windTopTrim = new THREE.Mesh(new THREE.TorusGeometry(2.82, 0.048, 8, 40), chromeRodMat);
  windTopTrim.rotation.x = Math.PI / 2;
  windTopTrim.position.y = 3.28;

  const windCyanLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.0, 2.15, 2.55), toneMapped: false });
  const windOrangeLed = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.65, 0.72, 0.0), toneMapped: false });
  // Prominent vibrant glowing orange (#ff5a00) + cyan (#00e5ff) turbine collar rings on base pedestal & upper shroud (strictly <= 3.55 local!)
  const windBaseOuterOrange = new THREE.Mesh(new THREE.TorusGeometry(2.88, 0.088, 12, 48), windOrangeLed);
  windBaseOuterOrange.rotation.x = Math.PI / 2;
  windBaseOuterOrange.position.y = 0.56;
  const windFloorRing = new THREE.Mesh(new THREE.TorusGeometry(2.48, 0.075, 12, 48), windCyanLed);
  windFloorRing.rotation.x = Math.PI / 2;
  windFloorRing.position.y = 0.69;
  const windFloorInnerRing = new THREE.Mesh(new THREE.TorusGeometry(1.78, 0.052, 8, 36), windOrangeLed);
  windFloorInnerRing.rotation.x = Math.PI / 2;
  windFloorInnerRing.position.y = 0.71;
  const windTopRing = new THREE.Mesh(new THREE.TorusGeometry(2.68, 0.082, 12, 48), windOrangeLed);
  windTopRing.rotation.x = Math.PI / 2;
  windTopRing.position.y = 3.23;
  const windTopOuterLed = new THREE.Mesh(new THREE.TorusGeometry(2.84, 0.068, 12, 48), windCyanLed);
  windTopOuterLed.rotation.x = Math.PI / 2;
  windTopOuterLed.position.y = 3.44;
  airRiderGroup.add(windBaseOuterOrange);

  for (let wBar = 0; wBar < 4; wBar++) {
    const ba = (wBar / 4) * Math.PI * 2 + Math.PI * 0.25;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 2.64, 8), steelDarkMat);
    strut.position.set(Math.cos(ba) * 2.58, 1.98, Math.sin(ba) * 2.58);
    const glowBar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 2.56, 8), wBar % 2 === 0 ? windCyanLed : windOrangeLed);
    glowBar.position.set(Math.cos(ba) * 2.49, 1.98, Math.sin(ba) * 2.49);
    airRiderGroup.add(strut, glowBar);
  }

  const windGlassTube = new THREE.Mesh(
    new THREE.CylinderGeometry(2.42, 2.42, 2.64, 36, 1, true),
    new THREE.MeshPhysicalMaterial({ color: '#dff4ff', transparent: true, opacity: 0.18, roughness: 0.03, clearcoat: 1.0, side: THREE.FrontSide, depthWrite: false })
  );
  windGlassTube.position.y = 1.98;

  const windVortexMat = createWindTunnelVortexMaterial();
  const windVortexMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.12, 2.12, 2.54, 28, 1, true), windVortexMat);
  windVortexMesh.position.y = 1.98;

  // Translucent swirling upward mist vortex ribbons + tiered vortex mist rings inside the glass flight cylinder!
  const windMistGroup = new THREE.Group();
  windMistGroup.position.y = 0.72;
  const mistRibbonMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.58, 0.94, 1.0),
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mistOrangeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0, 0.56, 0.22),
    transparent: true,
    opacity: 0.20,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  for (let h = 0; h < 4; h++) {
    const hPts = [];
    const startAng = (h / 4) * Math.PI * 2;
    const rad = h % 2 === 0 ? 1.56 : 1.18;
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      const ang = startAng + t * Math.PI * 3.2;
      hPts.push(new THREE.Vector3(Math.cos(ang) * (rad + Math.sin(t * Math.PI) * 0.22), t * 2.45, Math.sin(ang) * (rad + Math.sin(t * Math.PI) * 0.22)));
    }
    const swirl = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hPts), 36, h % 2 === 0 ? 0.082 : 0.056, 6, false),
      h % 2 === 0 ? mistRibbonMat : mistOrangeMat
    );
    windMistGroup.add(swirl);
  }
  for (let vr = 0; vr < 5; vr++) {
    const t = vr / 4;
    const vortexRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.75 - Math.sin(t * Math.PI) * 0.28, 0.045, 8, 40),
      vr % 2 === 0 ? mistRibbonMat : mistOrangeMat
    );
    vortexRing.rotation.x = Math.PI / 2 + (vr % 2 === 0 ? 0.14 : -0.14);
    vortexRing.rotation.y = vr * 0.55;
    vortexRing.position.y = 0.26 + t * 2.02;
    windMistGroup.add(vortexRing);
  }
  const windTurbineGlow = new THREE.PointLight('#38bdf8', 14, 10, 1.6);
  windTurbineGlow.position.y = 1.85;

  // Real Rigged .glb Human Skydiver hovering horizontally inside the S601 WINDLAB glass wind tunnel!
  const flyerGroup = new THREE.Group();
  const flyerRig = createSculptedHumanRig(267, { allowBag: false, idlePose: true, shirtHex: '#ea580c', pantsHex: '#0f172a' });
  flyerRig.group.rotation.x = Math.PI * 0.46;
  flyerRig.group.position.set(0, -0.1, -0.78);
  flyerGroup.add(flyerRig.group);
  flyerGroup.position.y = 1.92;
  airRiderGroup.add(
    windPedestal, windDeckCore, windTopCap, windTopTrim,
    windFloorRing, windFloorInnerRing, windTopRing, windTopOuterLed,
    windGlassTube, windVortexMesh, windMistGroup, windTurbineGlow, flyerGroup
  );

  // WINDLAB Flight Schedule Screen + Viewing Bench
  const schedStand = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, 0.22), steelDarkMat);
  schedStand.position.set(-164.5, 19.0, -10.2);
  const schedFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 0.76),
    new THREE.MeshBasicMaterial({ map: createSignBoardTexture('WINDLAB SCHEDULE', 'NEXT FLIGHT: 14:30 • 250 KM/H', '#0f172a', '#ffffff', '#38bdf8') })
  );
  schedFace.position.set(-164.5, 19.45, -10.08);
  const viewBench = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.48, 0.92), new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.55 }));
  viewBench.position.set(-169.5, 18.24, -7.8);
  root.add(schedStand, schedFace, viewBench);

  // 2F 1UE PJPAC Box Office (S611) cleanly flush & clearly visible at (-178.4, 18.0, -4.5)
  // Sleek canary-yellow & matte-black ticketing counter, dual glowing ticketing monitor screens & warm under-counter LED strip!
  {
    const pjpacGroup = new THREE.Group();
    pjpacGroup.position.set(-178.4, 18.0, -4.5);
    const pjpacBlackMat = new THREE.MeshStandardMaterial({ color: '#14161c', roughness: 0.30, metalness: 0.36 });
    const pjpacCanaryMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.26, metalness: 0.14, envMapIntensity: 0.95 });
    const pjpacLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.15, 1.58, 0.45), toneMapped: false });

    const kickBase = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.12, 2.66), pjpacBlackMat);
    kickBase.position.set(0, 0.06, 0);
    const underLed = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.042, 2.74), pjpacLedMat);
    underLed.position.set(0.02, 0.13, 0);
    const counterBody = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.88, 2.80), pjpacBlackMat);
    counterBody.position.set(0, 0.58, 0);
    counterBody.castShadow = true;
    // Canary-yellow architectural side wraps & sculpted front valence bar matching PJPAC S611 theatre marquee!
    for (const sz of [-1.42, 1.42]) {
      const sideWrap = new THREE.Mesh(new THREE.BoxGeometry(1.04, 1.04, 0.12), pjpacCanaryMat);
      sideWrap.position.set(0, 0.54, sz);
      pjpacGroup.add(sideWrap);
    }
    const yellowBandTop = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.09, 2.94), pjpacCanaryMat);
    yellowBandTop.position.set(0, 1.04, 0);
    const lipLed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.032, 2.76), pjpacLedMat);
    lipLed.position.set(0.51, 0.98, 0);
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.045, 2.88), pjpacBlackMat);
    counterTop.position.set(0, 1.105, 0);

    const pjpacSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.38, 0.66),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('PJPAC BOX OFFICE', 'S611 • ONETIX LIVE SHOWS', '#101218', '#fde68a', '#facc15') })
    );
    pjpacSign.rotation.y = Math.PI / 2;
    pjpacSign.position.set(0.495, 0.58, 0);

    // Dual glowing ticketing monitor screens + card readers on countertop!
    const ticketUiTex = createSignBoardTexture('ONETIX SEAT MAP', 'STAGE 1 • TONIGHT 20:00', '#0f172a', '#67e8f9', '#facc15', 512, 256);
    const ticketUiMat = new THREE.MeshBasicMaterial({ map: ticketUiTex });
    for (const mz of [-0.66, 0.66]) {
      const mBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.22), pjpacBlackMat);
      mBase.position.set(0.05, 1.14, mz);
      const mNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.22, 8), chromeRodMat);
      mNeck.position.set(0.02, 1.25, mz);
      const mFrame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.54), pjpacBlackMat);
      mFrame.position.set(0.05, 1.42, mz);
      mFrame.rotation.z = -0.14;
      const mScrFront = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.30), ticketUiMat);
      mScrFront.rotation.y = Math.PI / 2;
      mScrFront.rotation.x = 0;
      mScrFront.position.set(0.085, 1.42, mz);
      const mScrBack = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.30), ticketUiMat);
      mScrBack.rotation.y = -Math.PI / 2;
      mScrBack.position.set(0.015, 1.42, mz);
      const cardPad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.10), pjpacCanaryMat);
      cardPad.position.set(0.32, 1.15, mz + 0.18);
      pjpacGroup.add(mBase, mNeck, mFrame, mScrFront, mScrBack, cardPad);
    }

    const pjpacStaff = createArticulatedPerson({ shirt: '#18181b', pants: '#0f172a' });
    pjpacStaff.position.set(-0.76, 0, 0.0);
    pjpacStaff.rotation.y = Math.PI / 2;

    const pjpacGlow = new THREE.PointLight('#ffd86b', 9.0, 7.5, 1.65);
    pjpacGlow.position.set(0.85, 0.65, 0);

    pjpacGroup.add(kickBase, underLed, counterBody, yellowBandTop, lipLed, counterTop, pjpacSign, pjpacStaff, pjpacGlow);
    root.add(pjpacGroup);
  }

  // ==========================================================================
  // AUTHENTIC PHOTO-EXACT 1 UTAMA OUTDOOR 2F SARANGHAE FINGER-HEART ROOFTOP BRIDGE (Shot 12 / 2F-02)
  // Positioned 100% OUTSIDE 1UE's z=-24.4 wall at (-140.5, 18.0, -32.2) under OPEN SUNLIT BLUE SKY:
  // - Matte dark-charcoal gridded outdoor stone/ceramic tile deck (z_local = +7.8 -> -6.8) with crisp diagonal sun shadows!
  // - Gleaming faceted silver-mosaic Korean Finger-Heart Hand sculpture + black round plinth + glowing pink wire heart
  // - Twin hot-pink HEART-SHAPED filigree love-lock racks packed with 240 instanced 3D colorful miniature padlocks (body + shackle)!
  // - 2048x1024 dense photographic Seoul Neon Street collage mural (50+ authentic Korean Hangul neon signs) + aluminum vent louvers
  // - 700+ instanced alpha-tested 3D foliage rooftop hedge leaf cards (green left + burgundy-tipped right — ZERO dodecahedrons!)
  // - Subdivided organic terracotta FlowRider rockwork + curved blue slide chute + palms + upper-right terrace bar, glass canopy & crimson umbrella!
  // - Left curved cream One World Hotel / 1 Utama gridded facade with lower interior white curtains (strictly y >= 0, castShadow = false!)
  // - Lower-left angled structural low-iron glass skylight awning with steel struts & spider fittings
  // - Right open multi-story exterior lightwell drop-off with recessed lit office facade & curved white rooftop utility conduits!
  // ==========================================================================
  const sarangGroup = new THREE.Group();
  sarangGroup.position.set(-140.5, 18.0, -32.2);
  {
    // 1. Dark-Charcoal Mottled Outdoor Stone/Ceramic Tile Deck (#52565e..#464a52, thin #353840 grout) + Perimeter Metal Drainage Edge & Ribbed Gray Concrete Fascia!
    const tileC = document.createElement('canvas');
    tileC.width = tileC.height = 1024;
    const tCtx = tileC.getContext('2d');
    tCtx.fillStyle = '#353840'; // Thin dark-neutral mortar grout
    tCtx.fillRect(0, 0, 1024, 1024);
    const rows = 8;
    const cols = 8;
    const cw = 1024 / cols;
    const ch = 1024 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Tile-to-tile variation across #464a52 .. #52565e
        const hash = ((r * 37 + c * 53 + r * c * 11) % 13) / 12;
        const baseR = Math.round(70 + hash * 12);
        const baseG = Math.round(74 + hash * 12);
        const baseB = Math.round(82 + hash * 12);
        tCtx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
        tCtx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
        // Subtle mottled outdoor ceramic stone grain & soft mineral variation
        for (let sp = 0; sp < 28; sp++) {
          const sx = c * cw + 4 + ((r * 31 + c * 17 + sp * 43) % (cw - 10));
          const sy = r * ch + 4 + ((r * 19 + c * 29 + sp * 61) % (ch - 10));
          const rad = 4 + (sp % 5) * 3;
          tCtx.fillStyle = sp % 3 === 0 ? 'rgba(220,226,236,0.032)' : sp % 3 === 1 ? 'rgba(26,28,34,0.055)' : 'rgba(98,104,116,0.04)';
          tCtx.beginPath();
          tCtx.arc(sx, sy, rad, 0, Math.PI * 2);
          tCtx.fill();
        }
      }
    }
    const tileTex = new THREE.CanvasTexture(tileC);
    tileTex.colorSpace = THREE.SRGBColorSpace;
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
    tileTex.repeat.set(3.2, 5.4);
    tileTex.anisotropy = 8;
    const outdoorTileMat = new THREE.MeshStandardMaterial({
      map: tileTex,
      roughness: 0.86,
      metalness: 0.0,
      envMapIntensity: 0.12
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.42, 14.6), outdoorTileMat);
    deck.position.set(0, -0.198, 0.5); // Spans z_local = -6.8 .. +7.8 cleanly meeting 1UE doorway at z=-24.4!
    deck.receiveShadow = true;
    sarangGroup.add(deck);

    // Perimeter brushed-metal drainage edge channels + slotted grate strips along both outer deck margins
    const drainMetalMat = new THREE.MeshStandardMaterial({ color: '#7a828c', roughness: 0.42, metalness: 0.68, envMapIntensity: 0.65 });
    const drainSlotMat = new THREE.MeshStandardMaterial({ color: '#2b2f36', roughness: 0.85 });
    for (const dx of [-4.45, 4.45]) {
      const drainEdge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.024, 14.5), drainMetalMat);
      drainEdge.position.set(dx, 0.008, 0.5);
      drainEdge.receiveShadow = true;
      sarangGroup.add(drainEdge);
      for (let dz = -6.4; dz <= 7.4; dz += 0.36) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.008, 0.14), drainSlotMat);
        slot.position.set(dx, 0.019, dz);
        sarangGroup.add(slot);
      }
    }

    // Local baked shadow-casting tropical afternoon sun spotlight projecting crisp diagonal shadows rightward-forward across the charcoal tiles (EXACT photo angle!)
    const bridgeSunSpot = new THREE.SpotLight('#fff8e8', 46, 36, 0.84, 0.26, 0.95);
    bridgeSunSpot.position.set(-9.4, 14.2, -4.8);
    bridgeSunSpot.castShadow = true;
    bridgeSunSpot.shadow.mapSize.set(1024, 1024);
    bridgeSunSpot.shadow.camera.near = 4.0;
    bridgeSunSpot.shadow.camera.far = 36.0;
    bridgeSunSpot.shadow.bias = -0.00035;
    bridgeSunSpot.shadow.normalBias = 0.025;
    bridgeSunSpot.target.position.set(0.6, 0.0, 0.8);
    sarangGroup.add(bridgeSunSpot, bridgeSunSpot.target);

    // Bright open-sky daylight fill & warm cream architectural facade bounce localized strictly to the outdoor rooftop bridge
    const bridgeSkyFill = new THREE.PointLight('#cfe8ff', 14, 28, 1.30);
    bridgeSkyFill.position.set(2.2, 9.6, -2.0);
    const bridgeFacadeFill = new THREE.PointLight('#fff0d6', 18, 30, 1.28);
    bridgeFacadeFill.position.set(-2.4, 5.8, -5.6);
    sarangGroup.add(bridgeSkyFill, bridgeFacadeFill);

    // 2. Brushed Stainless-Steel Outdoor Tube Handrails + 4 Horizontal Tension Cables + Posts (castShadow = true!)
    const ssMat = new THREE.MeshStandardMaterial({ color: '#dce4ec', roughness: 0.20, metalness: 0.90, envMapIntensity: 1.45 });
    for (const sx of [-4.40, 4.40]) {
      const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 14.4, 10), ssMat);
      topRail.rotation.x = Math.PI / 2;
      topRail.position.set(sx, 1.09, 0.5);
      topRail.castShadow = true;
      sarangGroup.add(topRail);
      for (let w = 0; w < 4; w++) {
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 14.4, 6), ssMat);
        wire.rotation.x = Math.PI / 2;
        wire.position.set(sx, 0.25 + w * 0.22, 0.5);
        wire.castShadow = true;
        sarangGroup.add(wire);
      }
      for (let p = -6.5; p <= 7.5; p += 2.0) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.08, 8), ssMat);
        post.position.set(sx, 0.55, p);
        post.castShadow = true;
        sarangGroup.add(post);
      }
    }

    // 3. Gleaming Faceted Silver-Mosaic Korean Finger-Heart Hand Sculpture (손가락 하트) on Matte-Black Round Plinth!
    const handGroup = new THREE.Group();
    handGroup.position.set(0.0, 0.012, -0.35);
    handGroup.rotation.y = 0.26; // Natural 3/4 turn matching the real photo so thumb-over-index + 3 curled fingers read crisply!
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.74, 0.14, 36),
      new THREE.MeshStandardMaterial({ color: '#161a20', roughness: 0.30, metalness: 0.36 })
    );
    plinth.position.y = 0.07;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    const silverMaps = createSilverMosaicMaps();
    const silverMosaicMat = new THREE.MeshStandardMaterial({
      color: '#f2f6fb',
      map: silverMaps.map,
      normalMap: silverMaps.normalMap,
      normalScale: new THREE.Vector2(1.50, 1.50),
      roughness: 0.18,
      metalness: 0.84,
      envMapIntensity: 1.90
    });
    // Smoothly tapered wrist -> flared sculpted palm using continuous LatheGeometry + flattened anatomical metacarpal palm!
    const wristPalmPts = [
      new THREE.Vector2(0.35, 0.14),
      new THREE.Vector2(0.32, 0.32),
      new THREE.Vector2(0.31, 0.52),
      new THREE.Vector2(0.38, 0.72),
      new THREE.Vector2(0.49, 0.94),
      new THREE.Vector2(0.51, 1.18),
      new THREE.Vector2(0.42, 1.38),
      new THREE.Vector2(0.24, 1.48),
      new THREE.Vector2(0.04, 1.52)
    ];
    const wristPalmGeo = new THREE.LatheGeometry(wristPalmPts, 28);
    wristPalmGeo.scale(1.0, 1.0, 0.62);
    const wristPalmMesh = new THREE.Mesh(wristPalmGeo, silverMosaicMat);
    wristPalmMesh.castShadow = true;
    wristPalmMesh.receiveShadow = true;

    // Smoothly blended thenar (thumb-base) muscle pad sculpted seamlessly into the lower-left palm
    const thenarMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.34, 10, 18), silverMosaicMat);
    thenarMesh.position.set(-0.23, 1.08, 0.11);
    thenarMesh.rotation.set(0.18, 0.10, -0.32);
    thenarMesh.scale.set(0.95, 1.0, 0.82);
    thenarMesh.castShadow = true;

    // Crisply aligned anatomical Thumb & Index Finger crossing cleanly at the fingertip snap!
    const thumbProx = new THREE.Mesh(new THREE.CapsuleGeometry(0.132, 0.42, 10, 18), silverMosaicMat);
    thumbProx.position.set(-0.24, 1.48, 0.17);
    thumbProx.rotation.set(0.22, 0.08, -0.38);
    thumbProx.castShadow = true;
    const thumbDist = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.36, 10, 18), silverMosaicMat);
    thumbDist.position.set(-0.08, 1.84, 0.18);
    thumbDist.rotation.set(-0.06, 0.06, -0.46);
    thumbDist.castShadow = true;

    const indexProx = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.46, 10, 18), silverMosaicMat);
    indexProx.position.set(0.08, 1.62, -0.02);
    indexProx.rotation.set(0.06, 0, 0.14);
    indexProx.castShadow = true;
    const indexDist = new THREE.Mesh(new THREE.CapsuleGeometry(0.110, 0.42, 10, 18), silverMosaicMat);
    indexDist.position.set(0.00, 1.96, 0.06);
    indexDist.rotation.set(0.18, 0, 0.24);
    indexDist.castShadow = true;

    // 3 neatly tucked curled fingers (middle, ring, pinky — smoothly bridged capsule segments, ZERO lumpy spheres!)
    for (let cf = 0; cf < 3; cf++) {
      const fScale = 1.0 - cf * 0.10;
      const prox = new THREE.Mesh(new THREE.CapsuleGeometry(0.115 * fScale, 0.28 * fScale, 8, 14), silverMosaicMat);
      prox.position.set(0.22 + cf * 0.12, 1.40 - cf * 0.13, 0.10 - cf * 0.02);
      prox.rotation.set(1.12, 0.10, -0.26);
      prox.castShadow = true;
      const mid = new THREE.Mesh(new THREE.CapsuleGeometry(0.105 * fScale, 0.22 * fScale, 8, 14), silverMosaicMat);
      mid.position.set(0.20 + cf * 0.11, 1.24 - cf * 0.12, 0.26 - cf * 0.02);
      mid.rotation.set(2.08, 0.04, -0.20);
      mid.castShadow = true;
      const dist = new THREE.Mesh(new THREE.CapsuleGeometry(0.095 * fScale, 0.14 * fScale, 8, 12), silverMosaicMat);
      dist.position.set(0.13 + cf * 0.10, 1.12 - cf * 0.11, 0.20 - cf * 0.02);
      dist.rotation.set(2.72, 0, -0.14);
      dist.castShadow = true;
      handGroup.add(prox, mid, dist);
    }

    // Delicate thin painted-pink metal wire heart anchored directly into the thumb+index fingertip contact point!
    const pinkWireMat = new THREE.MeshStandardMaterial({ color: '#ec4899', roughness: 0.32, metalness: 0.45 });
    const hShape = new THREE.Shape();
    hShape.moveTo(0, -0.15);
    hShape.bezierCurveTo(0.24, 0.02, 0.26, 0.26, 0.09, 0.26);
    hShape.bezierCurveTo(0.02, 0.26, 0, 0.18, 0, 0.13);
    hShape.bezierCurveTo(0, 0.18, -0.02, 0.26, -0.09, 0.26);
    hShape.bezierCurveTo(-0.26, 0.26, -0.24, 0.02, 0, -0.15);
    const heartPts = hShape.getPoints(36).map((pt) => new THREE.Vector3(pt.x * 0.92, pt.y * 0.92, 0));
    const heartWire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(heartPts, true), 48, 0.0085, 8, true), pinkWireMat);
    heartWire.position.set(-0.02, 2.30, 0.12);
    const heartAnchorPin = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 6), pinkWireMat);
    heartAnchorPin.position.set(-0.02, 2.13, 0.12);
    handGroup.add(plinth, wristPalmMesh, thenarMesh, thumbProx, thumbDist, indexProx, indexDist, heartWire, heartAnchorPin);
    sarangGroup.add(handGroup);

    // 4. Slim Metallic Clearcoat Hot-Pink HEART-SHAPED Filigree Love-Lock Racks + 360 Crisper Tightly Packed Miniature Padlocks!
    const hotPinkMat = new THREE.MeshPhysicalMaterial({
      color: '#e11d74',
      roughness: 0.20,
      metalness: 0.58,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.35
    });
    const bigHeartPts = hShape.getPoints(40).map((pt) => new THREE.Vector3(0, pt.y * 2.85, pt.x * 3.15));
    const innerHeartPts = hShape.getPoints(36).map((pt) => new THREE.Vector3(0, pt.y * 2.12, pt.x * 2.36));
    const outerHeartGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bigHeartPts, true), 52, 0.022, 8, true);
    const innerHeartGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(innerHeartPts, true), 44, 0.015, 8, true);

    const lockPalette = [
      new THREE.Color('#e2e8f0'), new THREE.Color('#f472b6'), new THREE.Color('#fbbf24'),
      new THREE.Color('#38bdf8'), new THREE.Color('#ef4444'), new THREE.Color('#cbd5e1'),
      new THREE.Color('#f9a8d4'), new THREE.Color('#a78bfa'), new THREE.Color('#34d399'),
      new THREE.Color('#fb923c'), new THREE.Color('#fda4af')
    ];
    const locksPerRack = 180;
    const totalLocks = locksPerRack * 2;
    const lockBodyGeo = new THREE.BoxGeometry(0.026, 0.042, 0.032);
    const lockBodyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.22, metalness: 0.82, envMapIntensity: 1.2 });
    const lockShackleGeo = new THREE.TorusGeometry(0.012, 0.0035, 6, 12, Math.PI);
    const lockBodiesInst = new THREE.InstancedMesh(lockBodyGeo, lockBodyMat, totalLocks);
    const lockShacklesInst = new THREE.InstancedMesh(lockShackleGeo, ssMat, totalLocks);
    lockBodiesInst.castShadow = true;
    lockBodiesInst.frustumCulled = false;
    lockShacklesInst.frustumCulled = false;

    const dummyLock = new THREE.Object3D();
    let lockIdx = 0;
    const rackZCenter = -0.35;

    for (const sx of [-3.96, 3.96]) {
      const rack = new THREE.Group();
      rack.position.set(sx, 0.012, rackZCenter);
      const rBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.055, 3.12), hotPinkMat);
      rBase.position.y = 0.028;
      rBase.castShadow = true;
      rBase.receiveShadow = true;
      const rTop = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.045, 3.08), hotPinkMat);
      rTop.position.y = 1.56;
      rTop.castShadow = true;
      const rBot = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.045, 3.08), hotPinkMat);
      rBot.position.y = 0.14;
      const rPostA = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.56, 0.045), hotPinkMat);
      rPostA.position.set(0, 0.78, -1.51);
      rPostA.castShadow = true;
      const rPostB = rPostA.clone();
      rPostB.position.z = 1.51;
      rPostB.castShadow = true;
      const outerH = new THREE.Mesh(outerHeartGeo, hotPinkMat);
      outerH.position.set(0, 0.72, 0);
      outerH.castShadow = true;
      const innerH = new THREE.Mesh(innerHeartGeo, hotPinkMat);
      innerH.position.set(0, 0.74, 0);
      innerH.castShadow = true;
      for (const sz of [-1, 1]) {
        const strutU = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.94), hotPinkMat);
        strutU.position.set(0, 1.24, sz * 1.05);
        strutU.rotation.x = sz * 0.45;
        strutU.castShadow = true;
        const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.94), hotPinkMat);
        strutL.position.set(0, 0.42, sz * 1.05);
        strutL.rotation.x = -sz * 0.42;
        strutL.castShadow = true;
        const scrollRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.011, 6, 18), hotPinkMat);
        scrollRing.rotation.y = Math.PI / 2;
        scrollRing.position.set(0, 0.84, sz * 1.15);
        rack.add(strutU, strutL, scrollRing);
      }
      // Fine stainless horizontal & vertical padlock wire mesh inside the heart cage
      for (let g = -3; g <= 3; g++) {
        const wH = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 2.94, 4), ssMat);
        wH.rotation.x = Math.PI / 2;
        wH.position.set(0, 0.84 + g * 0.18, 0);
        rack.add(wH);
      }
      for (let gv = -6; gv <= 6; gv++) {
        const wV = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.38, 4), ssMat);
        wV.position.set(0, 0.84, gv * 0.22);
        rack.add(wV);
      }
      rack.add(rBase, rTop, rBot, rPostA, rPostB, outerH, innerH);
      sarangGroup.add(rack);

      // Cluster 180 smaller, crisper metallic miniature padlocks densely along the heart filigree & mesh!
      for (let lk = 0; lk < locksPerRack; lk++) {
        const t = lk / locksPerRack;
        const u = ((lk * 19) % locksPerRack) / locksPerRack;
        let ly, lz;
        if (lk < 92) {
          const pt = bigHeartPts[(lk * 2) % bigHeartPts.length];
          const sc = lk % 2 === 0 ? 0.96 : 0.75;
          ly = 0.74 + pt.y * sc + Math.sin(lk * 3.1) * 0.026;
          lz = pt.z * sc + Math.cos(lk * 2.7) * 0.026;
        } else {
          const ang = t * Math.PI * 14.0;
          const rNorm = Math.sqrt(u) * 0.64;
          ly = 0.86 + Math.sin(ang) * rNorm * 0.78;
          lz = Math.cos(ang) * rNorm * 1.15;
        }
        const sideOff = (lk % 2 === 0 ? 1 : -1) * (0.020 + (lk % 3) * 0.008);
        const tilt = Math.sin(lk * 4.3) * 0.22;
        const sScale = 0.80 + (lk % 4) * 0.08;

        dummyLock.position.set(sx + sideOff, 0.012 + ly, rackZCenter + lz);
        dummyLock.rotation.set(tilt, (lk % 5 - 2) * 0.16, tilt * 0.5);
        dummyLock.scale.setScalar(sScale);
        dummyLock.updateMatrix();
        lockBodiesInst.setMatrixAt(lockIdx, dummyLock.matrix);
        lockBodiesInst.setColorAt(lockIdx, lockPalette[(lockIdx * 3) % lockPalette.length]);

        dummyLock.position.set(sx + sideOff, 0.012 + ly + 0.022 * sScale, rackZCenter + lz);
        dummyLock.rotation.set(tilt, Math.PI * 0.5 + (lk % 5 - 2) * 0.16, 0);
        dummyLock.scale.setScalar(sScale);
        dummyLock.updateMatrix();
        lockShacklesInst.setMatrixAt(lockIdx, dummyLock.matrix);
        lockIdx++;
      }
    }
    lockBodiesInst.instanceMatrix.needsUpdate = true;
    if (lockBodiesInst.instanceColor) lockBodiesInst.instanceColor.needsUpdate = true;
    lockShacklesInst.instanceMatrix.needsUpdate = true;
    sarangGroup.add(lockBodiesInst, lockShacklesInst);

    // 5. Cream Parapet Wall at z_local = -6.8 (strictly y >= 0, castShadow = false!) + 2048x1024 Dense Photographic Seoul Neon Street Collage Mural + Louvers!
    const parapetMat = new THREE.MeshStandardMaterial({ color: '#e5ddc7', roughness: 0.76, metalness: 0.02 });
    const parapetCapMat = new THREE.MeshStandardMaterial({ color: '#d8ceb4', roughness: 0.70 });
    const endWall = new THREE.Mesh(new THREE.BoxGeometry(24.0, 3.62, 0.66), parapetMat);
    endWall.position.set(0.8, 1.81, -7.12); // Front face sits cleanly at z_local = -6.79 meeting deck end (-6.8)!
    endWall.castShadow = false;
    endWall.receiveShadow = true;
    const endCoping = new THREE.Mesh(new THREE.BoxGeometry(24.4, 0.18, 0.88), parapetCapMat);
    endCoping.position.set(0.8, 3.70, -7.12);
    endCoping.castShadow = false;
    sarangGroup.add(endWall, endCoping);

    // 2048x1024 Authentic Daylight-Pastel Photographic Myeongdong / Hongdae Seoul Street-Alley Mural (Photo-matched to media_1795244955368_84d040ce.jpg!)
    const seoulC = document.createElement('canvas');
    seoulC.width = 2048;
    seoulC.height = 1024;
    const sc = seoulC.getContext('2d');
    const skyG = sc.createLinearGradient(0, 0, 0, 1024);
    skyG.addColorStop(0.0, '#d6cfe0');
    skyG.addColorStop(0.35, '#e8d8df');
    skyG.addColorStop(0.75, '#7c6b86');
    skyG.addColorStop(1.0, '#2e273d');
    sc.fillStyle = skyG;
    sc.fillRect(0, 0, 2048, 1024);

    // Bright pastel-stone & concrete Seoul alley facades receding with daylight-pastel storefronts
    const bldgCols = 15;
    const bw = 2048 / bldgCols;
    const alleyWallPalette = ['#d8cfd8', '#e2d7d2', '#c8c4d4', '#ded5de', '#cfcbd6', '#dcd2d0'];
    for (let b = 0; b < bldgCols; b++) {
      const bx = b * bw;
      const alleyGap = (b % 3 === 1) ? 10 : 4;
      const topGap = 14 + ((b * 41) % 72);
      sc.fillStyle = alleyWallPalette[b % alleyWallPalette.length];
      sc.fillRect(bx, topGap, bw - alleyGap, 1024 - topGap);
      // Dark weathered brick & mortar course texture
      sc.fillStyle = 'rgba(0, 0, 0, 0.24)';
      for (let by = topGap + 8; by < 1024; by += 18) {
        sc.fillRect(bx, by, bw - alleyGap, 2);
      }
      // Illuminated multi-story shopfront windows with dark frames & interior depth
      for (let fl = 0; fl < 6; fl++) {
        const wy = topGap + 22 + fl * 144;
        const litWarm = (b + fl) % 3 === 0;
        const litCyan = (b * 2 + fl) % 5 === 1;
        sc.fillStyle = litWarm
          ? 'rgba(255, 206, 132, 0.72)'
          : litCyan
          ? 'rgba(104, 212, 248, 0.42)'
          : 'rgba(18, 15, 32, 0.78)';
        sc.fillRect(bx + 10, wy, bw - alleyGap - 20, 92);
        sc.strokeStyle = '#0c0a16';
        sc.lineWidth = 4;
        sc.strokeRect(bx + 10, wy, bw - alleyGap - 20, 92);
        sc.beginPath();
        sc.moveTo(bx + (bw - alleyGap) * 0.5, wy);
        sc.lineTo(bx + (bw - alleyGap) * 0.5, wy + 92);
        sc.stroke();
      }
      // Ground-floor warm illuminated Korean street storefronts & glowing awnings
      sc.fillStyle = b % 3 === 0 ? '#9d174d' : b % 3 === 1 ? '#1e3a8a' : '#92400e';
      sc.fillRect(bx + 4, 836, bw - alleyGap - 8, 32);
      const shopG = sc.createLinearGradient(bx, 868, bx, 1024);
      shopG.addColorStop(0, 'rgba(255, 222, 168, 0.88)');
      shopG.addColorStop(0.5, 'rgba(244, 114, 182, 0.34)');
      shopG.addColorStop(1, 'rgba(16, 12, 28, 0.92)');
      sc.fillStyle = shopG;
      sc.fillRect(bx + 8, 868, bw - alleyGap - 16, 150);
    }

    // Criss-crossing overhead Seoul alley power & utility cables + pole brackets
    sc.strokeStyle = 'rgba(10, 8, 18, 0.82)';
    sc.lineWidth = 3;
    for (let c = 0; c < 13; c++) {
      sc.beginPath();
      sc.moveTo(0, 38 + c * 30);
      sc.quadraticCurveTo(1024, 145 + (c % 5) * 44, 2048, 28 + ((c * 3) % 10) * 34);
      sc.stroke();
    }

    // 55+ Layered Glowing Neon Signs in magenta, cyan, warm-amber & crisp white with Korean Hangul!
    const seoulSigns = [
      { x: 32, y: 120, w: 72, h: 420, bg: '#f8fafc', bd: '#ec4899', fg: '#1e1b4b', txt: '서울명동', vert: true },
      { x: 116, y: 295, w: 68, h: 360, bg: '#12102c', bd: '#22d3ee', fg: '#ffffff', txt: '홍대카페', vert: true },
      { x: 204, y: 195, w: 80, h: 455, bg: '#be185d', bd: '#fbcfe8', fg: '#ffffff', txt: '사랑해♥', vert: true },
      { x: 296, y: 78, w: 64, h: 385, bg: '#fffbeb', bd: '#ef4444', fg: '#991b1b', txt: '삼겹살', vert: true },
      { x: 372, y: 240, w: 74, h: 420, bg: '#1e1b4b', bd: '#e879f9', fg: '#f5d0fe', txt: '포장마차', vert: true },
      { x: 460, y: 95, w: 86, h: 490, bg: '#ffffff', bd: '#f59e0b', fg: '#b91c1c', txt: '치킨맥주', vert: true },
      { x: 558, y: 210, w: 66, h: 390, bg: '#090d1f', bd: '#22d3ee', fg: '#67e8f9', txt: '코인노래', vert: true },
      { x: 638, y: 120, w: 76, h: 450, bg: '#9d174d', bd: '#fde047', fg: '#fef08a', txt: '떡볶이집', vert: true },
      { x: 726, y: 270, w: 68, h: 360, bg: '#172554', bd: '#38bdf8', fg: '#ffffff', txt: '명동거리', vert: true },
      { x: 808, y: 88, w: 84, h: 480, bg: '#f8fafc', bd: '#ec4899', fg: '#be185d', txt: '카페거리', vert: true },
      { x: 906, y: 230, w: 72, h: 410, bg: '#2e1065', bd: '#f472b6', fg: '#fbcfe8', txt: '홍대입구', vert: true },
      { x: 990, y: 110, w: 78, h: 460, bg: '#0f172a', bd: '#fbbf24', fg: '#fde68a', txt: '서울야경', vert: true },
      { x: 1082, y: 260, w: 70, h: 380, bg: '#b91c1c', bd: '#ffffff', fg: '#ffffff', txt: '고기구이', vert: true },
      { x: 1166, y: 74, w: 88, h: 520, bg: '#fdf2f8', bd: '#db2777', fg: '#831843', txt: '미용실뷰티', vert: true },
      { x: 1268, y: 195, w: 74, h: 430, bg: '#1e1b4b', bd: '#38bdf8', fg: '#bae6fd', txt: '이태원펍', vert: true },
      { x: 1356, y: 115, w: 80, h: 440, bg: '#3b0764', bd: '#f472b6', fg: '#ffffff', txt: '강남스타일', vert: true },
      { x: 1452, y: 80, w: 72, h: 350, bg: '#090d1f', bd: '#e879f9', fg: '#f5d0fe', txt: '라멘맛집', vert: true },
      { x: 1540, y: 160, w: 82, h: 460, bg: '#ffffff', bd: '#38bdf8', fg: '#1e3a8a', txt: '김밥분식', vert: true },
      { x: 1636, y: 92, w: 78, h: 430, bg: '#4a044e', bd: '#f472b6', fg: '#fdf4ff', txt: '네온거리', vert: true },
      { x: 1728, y: 210, w: 76, h: 410, bg: '#17153b', bd: '#22d3ee', fg: '#67e8f9', txt: 'PC방게임', vert: true },
      { x: 1818, y: 108, w: 86, h: 470, bg: '#9f1239', bd: '#fde047', fg: '#ffffff', txt: '사랑해요', vert: true },
      { x: 1920, y: 180, w: 82, h: 440, bg: '#120f2b', bd: '#ec4899', fg: '#fbcfe8', txt: '디스트릭트', vert: true },
      // Horizontal neon storefront signs & rooftop billboards
      { x: 52, y: 580, w: 230, h: 78, bg: '#12102c', bd: '#f472b6', fg: '#ffffff', txt: 'SEOUL CAFE', vert: false },
      { x: 298, y: 695, w: 215, h: 76, bg: '#be185d', bd: '#fde047', fg: '#fef08a', txt: '명동 치킨', vert: false },
      { x: 530, y: 620, w: 240, h: 82, bg: '#090d1f', bd: '#22d3ee', fg: '#67e8f9', txt: 'HONGDAE BAR', vert: false },
      { x: 790, y: 710, w: 225, h: 78, bg: '#ffffff', bd: '#db2777', fg: '#9d174d', txt: '사랑해 커피', vert: false },
      { x: 1030, y: 600, w: 235, h: 80, bg: '#2e1065', bd: '#e879f9', fg: '#ffffff', txt: 'K-POP LIVE', vert: false },
      { x: 1280, y: 690, w: 175, h: 74, bg: '#7f1d1d', bd: '#fbbf24', fg: '#fef3c7', txt: '서울 포차', vert: false },
      { x: 1680, y: 645, w: 250, h: 82, bg: '#12102c', bd: '#f472b6', fg: '#fbcfe8', txt: 'DISTRICT K ♥', vert: false },
      { x: 140, y: 752, w: 195, h: 66, bg: '#0e7490', bd: '#a5f3fc', fg: '#ffffff', txt: '카페 라떼', vert: false },
      { x: 430, y: 760, w: 210, h: 68, bg: '#3b0764', bd: '#f472b6', fg: '#ffffff', txt: '노래연습장', vert: false },
      { x: 670, y: 525, w: 190, h: 62, bg: '#dc2626', bd: '#fde047', fg: '#ffffff', txt: '24시 맛집', vert: false },
      { x: 940, y: 768, w: 215, h: 66, bg: '#0f172a', bd: '#38bdf8', fg: '#e0f2fe', txt: 'MYEONGDONG', vert: false },
      { x: 1180, y: 755, w: 210, h: 68, bg: '#831843', bd: '#fbcfe8', fg: '#ffffff', txt: '치킨 & 맥주', vert: false },
      { x: 1720, y: 758, w: 240, h: 70, bg: '#090d1f', bd: '#22d3ee', fg: '#67e8f9', txt: 'SEOUL NIGHTS', vert: false },
      // Dense upper & street-level neon signage
      { x: 350, y: 34, w: 180, h: 54, bg: '#1d4ed8', bd: '#93c5fd', fg: '#ffffff', txt: '서울 스트리트', vert: false },
      { x: 615, y: 46, w: 175, h: 52, bg: '#f59e0b', bd: '#fffbeb', fg: '#1e1b4b', txt: '명동 교자', vert: false },
      { x: 878, y: 36, w: 195, h: 54, bg: '#3b0764', bd: '#e879f9', fg: '#ffffff', txt: 'K-WAVE LOUNGE', vert: false },
      { x: 1140, y: 28, w: 185, h: 52, bg: '#9f1239', bd: '#fecdd3', fg: '#ffffff', txt: '치킨 호프', vert: false },
      { x: 1410, y: 34, w: 190, h: 54, bg: '#090d1f', bd: '#38bdf8', fg: '#38bdf8', txt: 'CAFE SEOUL', vert: false },
      { x: 1690, y: 42, w: 210, h: 56, bg: '#4a044e', bd: '#f472b6', fg: '#ffffff', txt: '강남 네온', vert: false },
      { x: 86, y: 896, w: 185, h: 58, bg: '#12102c', bd: '#fbbf24', fg: '#fde68a', txt: '분식 천국', vert: false },
      { x: 326, y: 898, w: 195, h: 58, bg: '#be185d', bd: '#ffffff', fg: '#ffffff', txt: '인생네컷', vert: false },
      { x: 584, y: 894, w: 205, h: 60, bg: '#090d1f', bd: '#38bdf8', fg: '#ffffff', txt: 'COFFEE 24H', vert: false },
      { x: 848, y: 900, w: 210, h: 58, bg: '#991b1b', bd: '#fde047', fg: '#fef08a', txt: '원조 떡볶이', vert: false },
      { x: 1106, y: 896, w: 195, h: 58, bg: '#1e1b4b', bd: '#f472b6', fg: '#fbcfe8', txt: '홍대 포차', vert: false },
      { x: 1710, y: 894, w: 245, h: 62, bg: '#4c1d95', bd: '#22d3ee', fg: '#ffffff', txt: '사랑해 브릿지', vert: false },
      // Extra mid-street layered Korean Hangul signs for high-density Myeongdong look
      { x: 256, y: 505, w: 165, h: 54, bg: '#ffffff', bd: '#ec4899', fg: '#831843', txt: '서울 카페', vert: false },
      { x: 750, y: 465, w: 175, h: 56, bg: '#12102c', bd: '#fbbf24', fg: '#fef08a', txt: '명동 호프', vert: false },
      { x: 1020, y: 492, w: 185, h: 54, bg: '#0e7490', bd: '#ffffff', fg: '#ffffff', txt: '치킨 24H', vert: false },
      { x: 1295, y: 448, w: 175, h: 54, bg: '#831843', bd: '#22d3ee', fg: '#ffffff', txt: '노래방 LIVE', vert: false },
      { x: 1665, y: 485, w: 195, h: 56, bg: '#0f172a', bd: '#f472b6', fg: '#fbcfe8', txt: '서울 떡볶이', vert: false },
      { x: 485, y: 830, w: 170, h: 48, bg: '#fbbf24', bd: '#7c2d12', fg: '#1e1b4b', txt: '명동 분식', vert: false }
    ];

    for (const sg of seoulSigns) {
      sc.save();
      sc.shadowColor = sg.bd;
      sc.shadowBlur = 24;
      sc.fillStyle = sg.bg;
      sc.fillRect(sg.x, sg.y, sg.w, sg.h);
      sc.strokeStyle = sg.bd;
      sc.lineWidth = 5;
      sc.strokeRect(sg.x + 2, sg.y + 2, sg.w - 4, sg.h - 4);
      sc.shadowBlur = 12;
      sc.fillStyle = sg.fg;
      sc.textAlign = 'center';
      sc.textBaseline = 'middle';
      if (sg.vert) {
        const chars = Array.from(sg.txt);
        const fontSize = Math.min(sg.w * 0.66, (sg.h - 24) / Math.max(1, chars.length) * 0.84);
        sc.font = `900 ${Math.round(fontSize)}px "Noto Sans KR", "Malgun Gothic", "Montserrat", sans-serif`;
        const stepY = (sg.h - 26) / Math.max(1, chars.length);
        chars.forEach((ch, ci) => {
          sc.fillText(ch, sg.x + sg.w * 0.5, sg.y + 18 + stepY * (ci + 0.5));
        });
      } else {
        const fontSize = Math.min(sg.h * 0.52, (sg.w - 18) / Math.max(4, sg.txt.length * 0.72));
        sc.font = `900 ${Math.round(fontSize)}px "Noto Sans KR", "Malgun Gothic", "Montserrat", sans-serif`;
        sc.fillText(sg.txt, sg.x + sg.w * 0.5, sg.y + sg.h * 0.52);
      }
      sc.restore();
    }

    // Iconic Hero Lower-Right Dark-Indigo & Red-Gold "락 노래방" Neon Sign Box (EXACT real photo landmark!)
    sc.save();
    sc.shadowColor = '#f43f5e';
    sc.shadowBlur = 32;
    sc.fillStyle = '#140c2b';
    sc.fillRect(1424, 578, 224, 380);
    sc.strokeStyle = '#fb7185';
    sc.lineWidth = 8;
    sc.strokeRect(1428, 582, 216, 372);
    sc.fillStyle = '#fef08a';
    sc.textAlign = 'center';
    sc.textBaseline = 'middle';
    sc.font = '900 132px "Noto Sans KR", "Malgun Gothic", sans-serif';
    sc.fillText('락', 1536, 706);
    sc.fillStyle = '#ffffff';
    sc.font = '900 54px "Noto Sans KR", "Malgun Gothic", sans-serif';
    sc.fillText('노래방', 1536, 834);
    sc.fillStyle = '#fda4af';
    sc.font = '800 32px "Noto Sans KR", "Malgun Gothic", sans-serif';
    sc.fillText('지하 1층 • LIVE', 1536, 906);
    sc.restore();

    // Signature Top-Left Orange Circular Character Icon Badge & White Korean Store Sign (EXACT photo landmark!)
    sc.save();
    sc.fillStyle = '#fffaf5';
    sc.fillRect(46, 32, 290, 154);
    sc.strokeStyle = '#fb923c';
    sc.lineWidth = 5;
    sc.strokeRect(48, 34, 286, 150);
    const charX = 132;
    const charY = 109;
    const charR = 54;
    const cg = sc.createRadialGradient(charX - 14, charY - 16, 6, charX, charY, charR);
    cg.addColorStop(0, '#fdba74');
    cg.addColorStop(0.55, '#f97316');
    cg.addColorStop(1, '#ea580c');
    sc.fillStyle = cg;
    sc.beginPath();
    sc.arc(charX, charY, charR, 0, Math.PI * 2);
    sc.fill();
    // Cute character ears/cheeks & expressive smile
    sc.beginPath();
    sc.arc(charX - 36, charY - 38, 16, 0, Math.PI * 2);
    sc.arc(charX + 36, charY - 38, 16, 0, Math.PI * 2);
    sc.fill();
    sc.fillStyle = '#431407';
    sc.beginPath();
    sc.arc(charX - 18, charY - 8, 6, 0, Math.PI * 2);
    sc.arc(charX + 18, charY - 8, 6, 0, Math.PI * 2);
    sc.fill();
    sc.strokeStyle = '#431407';
    sc.lineWidth = 4.5;
    sc.beginPath();
    sc.arc(charX, charY + 6, 18, 0.15 * Math.PI, 0.85 * Math.PI);
    sc.stroke();
    sc.fillStyle = '#ea580c';
    sc.font = '900 38px "Noto Sans KR", "Malgun Gothic", sans-serif';
    sc.textAlign = 'center';
    sc.textBaseline = 'middle';
    sc.fillText('서울', 256, 86);
    sc.fillStyle = '#1e1b4b';
    sc.font = '900 30px "Noto Sans KR", "Malgun Gothic", sans-serif';
    sc.fillText('명동카페', 256, 134);
    sc.restore();

    // Moody neon street atmosphere glow wash across lower street
    const neonWash = sc.createLinearGradient(0, 740, 2048, 1024);
    neonWash.addColorStop(0.0, 'rgba(244, 114, 182, 0.24)');
    neonWash.addColorStop(0.45, 'rgba(34, 211, 238, 0.18)');
    neonWash.addColorStop(0.85, 'rgba(232, 121, 249, 0.24)');
    neonWash.addColorStop(1.0, 'rgba(251, 191, 36, 0.18)');
    sc.fillStyle = neonWash;
    sc.fillRect(0, 740, 2048, 284);

    const seoulTex = new THREE.CanvasTexture(seoulC);
    seoulTex.colorSpace = THREE.SRGBColorSpace;
    seoulTex.anisotropy = 8;
    const mural = new THREE.Mesh(
      new THREE.PlaneGeometry(7.92, 2.86),
      new THREE.MeshStandardMaterial({ map: seoulTex, emissiveMap: seoulTex, emissive: '#ffffff', emissiveIntensity: 0.14, roughness: 0.56 })
    );
    mural.position.set(0, 1.72, -6.77);
    sarangGroup.add(mural);

    // True 3D Recessed Brushed-Silver Aluminum Louver Bays — EXACT 2 Left + 1 Spaced Right matching real 1 Utama Saranghae Bridge photo!
    const louverRecessMat = new THREE.MeshStandardMaterial({ color: '#45484e', roughness: 0.88, metalness: 0.0 });
    const louverBladeMat = new THREE.MeshStandardMaterial({ color: '#c4cad2', roughness: 0.42, metalness: 0.52, envMapIntensity: 0.72 });
    for (const lx of [-5.28, -4.38, 5.25]) {
      const recessBack = new THREE.Mesh(new THREE.BoxGeometry(0.74, 3.18, 0.06), louverRecessMat);
      recessBack.position.set(lx, 1.76, -6.82);
      recessBack.receiveShadow = true;
      sarangGroup.add(recessBack);
      for (const sideOff of [-0.36, 0.36]) {
        const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.20, 0.14), parapetCapMat);
        jamb.position.set(lx + sideOff, 1.76, -6.76);
        jamb.castShadow = true;
        jamb.receiveShadow = true;
        sarangGroup.add(jamb);
      }
      for (let lv = 0; lv < 18; lv++) {
        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.036, 0.14), louverBladeMat);
        louver.position.set(lx, 0.24 + lv * 0.175, -6.74);
        louver.rotation.x = 0.44;
        louver.castShadow = true;
        louver.receiveShadow = true;
        sarangGroup.add(louver);
      }
    }

    // 6. REAL 3D FOLIAGE ROOFTOP HEDGES — Rounded Organic Multi-Mound Shrub Cores Engulfed in 900+ Alpha-Cutout Leaf Cards!
    const greenShrubCoreMat = new THREE.MeshStandardMaterial({ color: '#2b3b1e', roughness: 0.94 });
    const burgundyShrubCoreMat = new THREE.MeshStandardMaterial({ color: '#3b2127', roughness: 0.94 });
    const moundGeo = new THREE.IcosahedronGeometry(0.85, 2);
    for (let m = 0; m < 18; m++) {
      const mx = -7.8 + m * 1.06 + Math.sin(m * 2.1) * 0.18;
      const mz = -8.05 + Math.cos(m * 1.7) * 0.24;
      const isBurg = mx > 0.15;
      const mound = new THREE.Mesh(moundGeo, isBurg ? burgundyShrubCoreMat : greenShrubCoreMat);
      mound.scale.set(0.88 + (m % 3) * 0.12, 0.56 + (m % 3) * 0.08, 0.96);
      mound.position.set(mx, 3.88 + (m % 2) * 0.08, mz);
      sarangGroup.add(mound);
    }

    const shrubCardGeo = createArchedFrondGeo(0.56, 0.72, 0.28);
    const frondCardGeo = createArchedFrondGeo(0.48, 0.88, 0.36);
    const greenHedgeShades = [
      new THREE.Color('#4d6e32'), new THREE.Color('#5d7f3d'), new THREE.Color('#6c8d47'),
      new THREE.Color('#3f5b28'), new THREE.Color('#77964f')
    ];
    const burgundyHedgeShades = [
      new THREE.Color('#64303b'), new THREE.Color('#783a47'), new THREE.Color('#532833'),
      new THREE.Color('#6d3843'), new THREE.Color('#84424e'), new THREE.Color('#5c393e')
    ];

    const shrubInstCount = 920;
    const frondInstCount = 220;
    const shrubInst = new THREE.InstancedMesh(shrubCardGeo, botMats.shrubLeafCard, shrubInstCount);
    const frondInst = new THREE.InstancedMesh(frondCardGeo, botMats.frondDeep, frondInstCount);
    shrubInst.frustumCulled = false;
    frondInst.frustumCulled = false;
    const hDummy = new THREE.Object3D();

    for (let i = 0; i < shrubInstCount; i++) {
      const t = i / shrubInstCount;
      const hx = -8.4 + t * 19.2 + Math.sin(i * 12.7) * 0.34;
      const hz = -7.08 - ((i * 23) % 100) / 100 * 2.15;
      const crownProfile = Math.sin(Math.min(1, Math.max(0, (hz + 9.28) / 2.18)) * Math.PI);
      const undulate = Math.sin(hx * 0.85) * 0.14 + Math.cos(hx * 1.9 + hz) * 0.09;
      const hy = 3.72 + crownProfile * 0.84 + undulate + Math.cos(i * 7.3) * 0.15;
      hDummy.position.set(hx, hy, hz);
      hDummy.rotation.set(
        -0.55 + ((i * 19) % 100) / 100 * 1.25,
        ((i * 41) % 360) * (Math.PI / 180),
        Math.sin(i * 5.1) * 0.48
      );
      hDummy.scale.setScalar(0.80 + ((i * 13) % 10) * 0.060);
      hDummy.updateMatrix();
      shrubInst.setMatrixAt(i, hDummy.matrix);
      const isRightBurgundy = hx > 0.15 + Math.sin(hz * 2.1) * 0.45;
      const pal = isRightBurgundy ? burgundyHedgeShades : greenHedgeShades;
      shrubInst.setColorAt(i, pal[i % pal.length]);
    }
    shrubInst.instanceMatrix.needsUpdate = true;
    if (shrubInst.instanceColor) shrubInst.instanceColor.needsUpdate = true;

    for (let i = 0; i < frondInstCount; i++) {
      const t = i / frondInstCount;
      const hx = -8.0 + t * 18.2;
      const hz = -7.35 - ((i * 31) % 100) / 100 * 1.75;
      const hy = 3.92 + ((i * 11) % 10) * 0.060;
      hDummy.position.set(hx, hy, hz);
      hDummy.rotation.set(-0.35 + (i % 3) * 0.24, (i * 2.39996) % (Math.PI * 2), Math.sin(i * 3.7) * 0.28);
      hDummy.scale.setScalar(0.72 + (i % 4) * 0.10);
      hDummy.updateMatrix();
      frondInst.setMatrixAt(i, hDummy.matrix);
    }
    frondInst.instanceMatrix.needsUpdate = true;
    sarangGroup.add(shrubInst, frondInst);

    // 7. Normal-Mapped Terracotta FlowRider Rockwork (#c97254) + Bold Curved Royal-Blue Slide Chute (#1d4ed8) + Patio Bar & 8-Rib Pleated Maroon Umbrella!
    const roofTerraceDeck = new THREE.Mesh(
      new THREE.BoxGeometry(26.5, 0.28, 9.8),
      new THREE.MeshStandardMaterial({ color: '#d5ccb4', roughness: 0.86, metalness: 0.0 })
    );
    roofTerraceDeck.position.set(2.0, 3.58, -12.0);
    roofTerraceDeck.castShadow = false;
    roofTerraceDeck.receiveShadow = true;
    sarangGroup.add(roofTerraceDeck);

    // Subdivided multi-lobe organic terracotta rockwork (#c97254, normal-mapped rock strata) sculpted around a central slide valley!
    const buildTerracottaLobeGeo = (radius, seed) => {
      const geo = new THREE.IcosahedronGeometry(radius, 3);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const wave =
          Math.sin(x * 2.2 + seed) * 0.14 +
          Math.cos(y * 2.6 - z * 1.8 + seed * 1.3) * 0.13 +
          Math.sin((x + y + z) * 3.4 + seed * 0.7) * 0.07;
        const sc = 1.0 + wave;
        pos.setXYZ(i, x * sc, y * sc, z * sc);
      }
      geo.computeVertexNormals();
      return geo;
    };
    const terraRockMat = new THREE.MeshStandardMaterial({
      color: '#c97254',
      normalMap: botMats.wetKarst.normalMap,
      normalScale: new THREE.Vector2(0.72, 0.72),
      roughness: 0.84,
      metalness: 0.02
    });
    const terraLightMat = new THREE.MeshStandardMaterial({
      color: '#d48163',
      normalMap: botMats.wetKarst.normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughness: 0.82,
      metalness: 0.02
    });
    const terraLobes = [
      { x: -1.35, y: 5.65, z: -11.35, r: 1.55, sx: 1.05, sy: 1.52, sz: 0.95, s: 1.2, lt: false },
      { x: -0.35, y: 5.55, z: -12.05, r: 1.48, sx: 1.28, sy: 1.42, sz: 1.00, s: 2.8, lt: true },
      { x: 0.95, y: 4.92, z: -11.45, r: 1.32, sx: 1.35, sy: 1.04, sz: 1.05, s: 4.1, lt: false },
      { x: 2.15, y: 4.55, z: -11.40, r: 1.26, sx: 1.40, sy: 0.86, sz: 1.02, s: 5.7, lt: true },
      { x: -2.18, y: 4.68, z: -10.85, r: 1.15, sx: 1.10, sy: 1.05, sz: 0.95, s: 7.3, lt: false },
      { x: 3.18, y: 4.25, z: -10.95, r: 1.02, sx: 1.28, sy: 0.72, sz: 0.96, s: 8.9, lt: false }
    ];
    for (const tl of terraLobes) {
      const m = new THREE.Mesh(buildTerracottaLobeGeo(tl.r, tl.s), tl.lt ? terraLightMat : terraRockMat);
      m.scale.set(tl.sx, tl.sy, tl.sz);
      m.position.set(tl.x, tl.y, tl.z);
      m.castShadow = false;
      sarangGroup.add(m);
    }

    // Bold, unmistakably visible curved royal-blue (#1d4ed8) water slide chute winding right down the front face of the terracotta rockwork!
    const slideBlueMat = new THREE.MeshPhysicalMaterial({
      color: '#1d4ed8',
      roughness: 0.20,
      metalness: 0.08,
      clearcoat: 0.92,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.15
    });
    const slideCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.72, 6.26, -10.65),
      new THREE.Vector3(-0.04, 5.58, -10.08),
      new THREE.Vector3(0.76, 4.92, -9.62),
      new THREE.Vector3(1.88, 4.30, -9.28)
    ]);
    const slideChute = new THREE.Mesh(new THREE.TubeGeometry(slideCurve, 28, 0.42, 14, false), slideBlueMat);
    slideChute.scale.set(1.0, 0.72, 1.0);
    // Raised royal-blue slide side rails for unmistakable open-trough silhouette
    for (const railOff of [-0.30, 0.30]) {
      const railPts = slideCurve.getPoints(20).map((p) => new THREE.Vector3(p.x + railOff, p.y + 0.16, p.z + 0.12));
      const slideRail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 24, 0.085, 8, false), slideBlueMat);
      sarangGroup.add(slideRail);
    }
    sarangGroup.add(slideChute);

    // Tall multi-frond rooftop palms & leafy green accent trees framing the terracotta rockwork
    for (const [px, pz, ph, ps] of [
      [-2.8, -10.4, 6.4, 1.12],
      [-2.1, -11.2, 5.6, 1.02],
      [1.75, -10.6, 6.9, 1.18],
      [3.35, -11.6, 5.8, 1.05]
    ]) {
      const rPalm = createTropicalPlant(ps, ph, 13, 0.03, false);
      rPalm.position.set(px, 3.65, pz);
      sarangGroup.add(rPalm);
    }

    // Upper-Right Rooftop Patio Deck: White Tensile Canopy w/ Anchored Struts, Curved Dark Bar, 6 Barstools, Glass Balustrade, Café Patio & 8-Rib Pleated Maroon Umbrella!
    {
      const barG = new THREE.Group();
      barG.position.set(6.8, 3.72, -11.2);
      const barDarkMat = new THREE.MeshStandardMaterial({ color: '#242830', roughness: 0.56, metalness: 0.18 });
      const barTopMat = new THREE.MeshStandardMaterial({ color: '#3b424d', roughness: 0.34, metalness: 0.25 });
      const barStoolMat = new THREE.MeshStandardMaterial({ color: '#1f2329', roughness: 0.45 });
      const whiteSteelMat = new THREE.MeshStandardMaterial({ color: '#eef2f6', roughness: 0.32, metalness: 0.55 });
      const stoneBaseMat = new THREE.MeshStandardMaterial({ color: '#8a867e', roughness: 0.82 });

      // Curved dark bar counter + countertop + cooler
      const barCounter = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.10, 1.02, 28, 1, false, -Math.PI * 0.2, Math.PI * 1.15), barDarkMat);
      barCounter.position.y = 0.51;
      const barCap = new THREE.Mesh(new THREE.CylinderGeometry(2.18, 2.18, 0.08, 28, 1, false, -Math.PI * 0.2, Math.PI * 1.15), barTopMat);
      barCap.position.y = 1.04;
      const cooler = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.48), new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.38 }));
      cooler.position.set(-0.55, 0.95, -0.35);
      barG.add(barCounter, barCap, cooler);

      // 6 Sculpted Barstools around the curved bar counter
      for (let bs = 0; bs < 6; bs++) {
        const ba = -0.18 + (bs / 5) * Math.PI * 0.88;
        const sx = Math.cos(ba) * 2.48;
        const sz = Math.sin(ba) * 2.48;
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, 0.04, 12), ssMat);
        base.position.set(sx, 0.02, sz);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.72, 8), ssMat);
        stem.position.set(sx, 0.38, sz);
        const footrest = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 6, 14), ssMat);
        footrest.rotation.x = Math.PI / 2;
        footrest.position.set(sx, 0.28, sz);
        const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.08, 14), barStoolMat);
        seat.position.set(sx, 0.76, sz);
        barG.add(base, stem, footrest, seat);
      }

      // White Tensile Canopy with angled white steel tension struts anchored cleanly down onto solid patio deck columns!
      const barCanopy = new THREE.Mesh(
        new THREE.CylinderGeometry(2.95, 3.05, 0.06, 32),
        new THREE.MeshPhysicalMaterial({ color: '#edf2f7', transparent: true, opacity: 0.78, roughness: 0.36, clearcoat: 0.4, depthWrite: false })
      );
      barCanopy.position.set(0.2, 2.92, -0.2);
      const canopyRim = new THREE.Mesh(new THREE.TorusGeometry(3.00, 0.045, 8, 36), ssMat);
      canopyRim.rotation.x = Math.PI / 2;
      canopyRim.position.set(0.2, 2.92, -0.2);
      for (const sx of [-2.4, 2.8]) {
        const anchorBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.26), stoneBaseMat);
        anchorBase.position.set(sx, 0.07, -1.95);
        const deckCol = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 2.95, 10), whiteSteelMat);
        deckCol.position.set(sx, 1.48, -1.95);
        // Angled tension strut anchored cleanly from canopy rim (y=2.92, z=-0.2) down to rear deck anchor column!
        const pTop = new THREE.Vector3(sx * 0.55, 2.94, -0.25);
        const pBot = new THREE.Vector3(sx, 0.12, -1.95);
        const strutLen = pTop.distanceTo(pBot);
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, strutLen, 8), whiteSteelMat);
        strut.position.copy(pTop).add(pBot).multiplyScalar(0.5);
        strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pTop.clone().sub(pBot).normalize());
        barG.add(anchorBase, deckCol, strut);
      }
      barG.add(barCanopy, canopyRim);

      // Glass Terrace Balustrade framing the rooftop patio perimeter (strictly behind the hedges!)
      const patioGlassMat = new THREE.MeshPhysicalMaterial({
        color: '#cce6f2',
        transparent: true,
        opacity: 0.28,
        roughness: 0.04,
        clearcoat: 1.0,
        depthWrite: false
      });
      const glassBal = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.96, 0.04), patioGlassMat);
      glassBal.position.set(2.4, 0.52, 1.68);
      const balRail = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.055, 0.075), ssMat);
      balRail.position.set(2.4, 1.02, 1.68);
      barG.add(glassBal, balRail);
      for (const px of [-1.2, 0.6, 2.4, 4.2, 6.0]) {
        const bPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.02, 8), ssMat);
        bPost.position.set(px, 0.51, 1.68);
        barG.add(bPost);
      }

      // Café Patio Table & 2 Chairs + Sculpted 8-Rib Pleated Maroon-Red Patio Umbrella (#8f1d28) on Steel Pole & Weighted Stone Base!
      const umbX = 4.2;
      const umbZ = 0.72;
      const patTable = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.045, 18), whiteSteelMat);
      patTable.position.set(umbX - 0.65, 0.74, umbZ + 0.15);
      const patLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.74, 8), ssMat);
      patLeg.position.set(umbX - 0.65, 0.37, umbZ + 0.15);
      const patFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.04, 14), stoneBaseMat);
      patFoot.position.set(umbX - 0.65, 0.02, umbZ + 0.15);
      barG.add(patTable, patLeg, patFoot);
      for (const chOff of [-0.62, 0.62]) {
        const chSeat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.38), barStoolMat);
        chSeat.position.set(umbX - 0.65 + chOff, 0.44, umbZ + 0.15);
        const chBack = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.40, 0.36), barStoolMat);
        chBack.position.set(umbX - 0.65 + chOff + (chOff > 0 ? 0.17 : -0.17), 0.64, umbZ + 0.15);
        const chPed = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.44, 6), ssMat);
        chPed.position.set(umbX - 0.65 + chOff, 0.22, umbZ + 0.15);
        barG.add(chSeat, chBack, chPed);
      }

      // Weighted stone base + steel pole + sculpted 8-rib pleated maroon-red (#8f1d28) patio umbrella!
      const umbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.10, 16), stoneBaseMat);
      umbBase.position.set(umbX, 0.05, umbZ);
      const umbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.038, 2.52, 10), ssMat);
      umbPole.position.set(umbX, 1.26, umbZ);
      const maroonUmbMat = new THREE.MeshStandardMaterial({ color: '#8f1d28', roughness: 0.72, metalness: 0.02, side: THREE.DoubleSide });
      const umbHub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.14, 12), ssMat);
      umbHub.position.set(umbX, 2.48, umbZ);
      const umbRibs = 8;
      for (let rb = 0; rb < umbRibs; rb++) {
        const a0 = (rb / umbRibs) * Math.PI * 2;
        const a1 = ((rb + 1) / umbRibs) * Math.PI * 2;
        const aMid = (a0 + a1) * 0.5;
        // Pleated hanging/furled canopy gore panel
        const gore = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.34, 1.28, 3, 1, true, a0, (Math.PI * 2) / umbRibs * 0.88),
          maroonUmbMat
        );
        gore.position.set(umbX, 1.84, umbZ);
        // Sculpted rib spline pinching gently along each pleat fold
        const ribCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(umbX + Math.cos(aMid) * 0.05, 2.46, umbZ + Math.sin(aMid) * 0.05),
          new THREE.Vector3(umbX + Math.cos(aMid) * 0.24, 1.82, umbZ + Math.sin(aMid) * 0.24),
          new THREE.Vector3(umbX + Math.cos(aMid) * 0.34, 1.20, umbZ + Math.sin(aMid) * 0.34)
        ]);
        const ribMesh = new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 10, 0.018, 6, false), maroonUmbMat);
        barG.add(gore, ribMesh);
      }
      barG.add(umbBase, umbPole, umbHub);
      sarangGroup.add(barG);
    }

    // 8. Authentic Surrounding Architecture (ALL wingWall & backdrop walls strictly y_local >= 0, castShadow = false!)
    const wingFacadeMat = new THREE.MeshStandardMaterial({ color: '#e6dec8', roughness: 0.72, metalness: 0.02 });
    // Procedural Speckled Brown-Gray Pebble-Wash Granite Texture for spandrel bands
    const pebbleC = document.createElement('canvas');
    pebbleC.width = 512;
    pebbleC.height = 256;
    const pCtx = pebbleC.getContext('2d');
    pCtx.fillStyle = '#7b7166';
    pCtx.fillRect(0, 0, 512, 256);
    const pebCols = ['#5c534a', '#968c7f', '#423b35', '#aba194', '#6b6054', '#857b6f'];
    for (let p = 0; p < 3400; p++) {
      const px = (p * 73 + (p % 17) * 19) % 512;
      const py = (p * 137 + (p % 13) * 23) % 256;
      pCtx.fillStyle = pebCols[p % pebCols.length];
      pCtx.fillRect(px, py, 2 + (p % 3), 2 + ((p + 1) % 2));
    }
    const pebbleTex = new THREE.CanvasTexture(pebbleC);
    pebbleTex.colorSpace = THREE.SRGBColorSpace;
    pebbleTex.wrapS = pebbleTex.wrapT = THREE.RepeatWrapping;
    pebbleTex.repeat.set(3, 1);
    const graniteBandMat = new THREE.MeshStandardMaterial({ map: pebbleTex, roughness: 0.86, metalness: 0.02 });
    const mullionDarkMat = new THREE.MeshStandardMaterial({ color: '#22262c', roughness: 0.34, metalness: 0.65 });
    const wingGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#638092',
      roughness: 0.06,
      metalness: 0.18,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.90
    });
    const curtainWhiteMat = new THREE.MeshStandardMaterial({ color: '#ece9e2', roughness: 0.90, metalness: 0.0 });
    const curtainShadowMat = new THREE.MeshStandardMaterial({ color: '#d4d0c7', roughness: 0.92, metalness: 0.0 });

    // A. Left Curved One World Hotel & 1 Utama Facade (speckled pebble-wash granite spandrel bands + 3D pleated white drapes + sky-reflecting Fresnel glass!)
    const leftCurveBays = [
      { x: -11.4, z: 3.8, rotY: 1.18, w: 4.8 },
      { x: -9.8, z: -0.2, rotY: 1.32, w: 4.8 },
      { x: -8.6, z: -4.4, rotY: 1.44, w: 4.8 },
      { x: -7.8, z: -8.8, rotY: 1.52, w: 5.0 }
    ];
    for (const bay of leftCurveBays) {
      const bayG = new THREE.Group();
      bayG.position.set(bay.x, 0, bay.z);
      bayG.rotation.y = bay.rotY;
      // Solid warm cream wall strictly y = 0 .. 15.6 (world y = 18.0 .. 33.6!)
      const wingWall = new THREE.Mesh(new THREE.BoxGeometry(bay.w, 15.6, 2.2), wingFacadeMat);
      wingWall.position.set(0, 7.8, -1.1);
      wingWall.castShadow = false;
      wingWall.receiveShadow = true;
      bayG.add(wingWall);

      for (let fl = 0; fl < 4; fl++) {
        const wy = 1.85 + fl * 3.85;
        // Lower bay (fl === 0): 3D pleated vertical white drapes behind sky-reflecting Fresnel tinted glass
        if (fl === 0) {
          const curtainBack = new THREE.Mesh(new THREE.BoxGeometry(bay.w - 0.55, 2.55, 0.06), curtainWhiteMat);
          curtainBack.position.set(0, wy, 0.01);
          bayG.add(curtainBack);
          const pleatCount = 22;
          const spanW = bay.w - 0.65;
          for (let pl = 0; pl < pleatCount; pl++) {
            const px = -spanW * 0.5 + (pl / (pleatCount - 1)) * spanW;
            const fold = new THREE.Mesh(
              new THREE.CylinderGeometry(0.055, 0.055, 2.52, 8),
              pl % 2 === 0 ? curtainWhiteMat : curtainShadowMat
            );
            fold.scale.set(1.0, 1.0, 0.55);
            fold.position.set(px, wy, 0.045 + (pl % 2) * 0.018);
            bayG.add(fold);
          }
          const lowerGlass = new THREE.Mesh(
            new THREE.BoxGeometry(bay.w - 0.50, 2.58, 0.05),
            new THREE.MeshPhysicalMaterial({
              color: '#9ec4d6',
              transparent: true,
              opacity: 0.32,
              roughness: 0.04,
              ior: 1.52,
              clearcoat: 1.0,
              clearcoatRoughness: 0.03,
              envMapIntensity: 1.90,
              depthWrite: false
            })
          );
          lowerGlass.position.set(0, wy, 0.09);
          bayG.add(lowerGlass);
        } else {
          const glassPane = new THREE.Mesh(new THREE.BoxGeometry(bay.w - 0.50, 2.65, 0.08), wingGlassMat);
          glassPane.position.set(0, wy, 0.05);
          bayG.add(glassPane);
        }
        // Speckled brown-gray pebble-wash granite spandrel band between floors + deep cream pier pilaster
        const stoneBand = new THREE.Mesh(new THREE.BoxGeometry(bay.w + 0.08, 0.94, 0.24), graniteBandMat);
        stoneBand.position.set(0, wy + 1.78, 0.06);
        bayG.add(stoneBand);
        // Deep dark bronze/charcoal window mullions (horizontal transom + vertical mullions per bay)
        const hTransom = new THREE.Mesh(new THREE.BoxGeometry(bay.w - 0.45, 0.085, 0.14), mullionDarkMat);
        hTransom.position.set(0, wy + 0.18, 0.09);
        bayG.add(hTransom);
        for (let m = -2; m <= 2; m++) {
          const vMull = new THREE.Mesh(new THREE.BoxGeometry(0.095, 2.70, 0.14), mullionDarkMat);
          vMull.position.set(m * ((bay.w - 0.58) / 4), wy, 0.09);
          bayG.add(vMull);
        }
      }
      sarangGroup.add(bayG);
    }

    // B. Rear Warm-Cream One World Hotel / 1 Utama Gridded Tower Facade behind FlowRider Rockwork (strictly y >= 0, castShadow = false!)
    const rearHotel = new THREE.Mesh(new THREE.BoxGeometry(34.0, 17.6, 3.6), wingFacadeMat);
    rearHotel.position.set(0.5, 8.8, -17.2);
    rearHotel.castShadow = false;
    sarangGroup.add(rearHotel);
    for (let fl = 0; fl < 3; fl++) {
      const hy = 6.2 + fl * 4.15;
      const hWin = new THREE.Mesh(new THREE.BoxGeometry(31.0, 2.65, 0.14), wingGlassMat);
      hWin.position.set(0.5, hy, -15.32);
      const hTransom = new THREE.Mesh(new THREE.BoxGeometry(31.2, 0.10, 0.20), mullionDarkMat);
      hTransom.position.set(0.5, hy + 0.25, -15.26);
      const hBand = new THREE.Mesh(new THREE.BoxGeometry(32.5, 1.15, 0.28), graniteBandMat);
      hBand.position.set(0.5, hy + 1.95, -15.24);
      sarangGroup.add(hWin, hTransom, hBand);
    }
    for (let m = -6; m <= 6; m++) {
      const rPil = new THREE.Mesh(new THREE.BoxGeometry(m % 2 === 0 ? 0.56 : 0.14, 15.8, 0.34), m % 2 === 0 ? wingFacadeMat : mullionDarkMat);
      rPil.position.set(0.5 + m * 2.55, 9.6, -15.22);
      sarangGroup.add(rPil);
    }

    // C. Lower-Left Foreground Angled Structural Low-Iron Glass Skylight Awning with 2 Large Horizontal White Cylindrical HVAC Ducts + Brushed Stainless Spider Clamps!
    {
      const awningG = new THREE.Group();
      awningG.position.set(-5.75, 0.98, 3.85);
      awningG.rotation.z = -0.32;
      const awningGlassMat = new THREE.MeshPhysicalMaterial({
        color: '#d4ecea',
        transparent: true,
        opacity: 0.26,
        roughness: 0.03,
        metalness: 0.04,
        ior: 1.52,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.85,
        depthWrite: false
      });
      const awningPane = new THREE.Mesh(new THREE.BoxGeometry(4.10, 0.055, 6.20), awningGlassMat);
      awningG.add(awningPane);
      const frameBorderL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 6.28), steelDarkMat);
      frameBorderL.position.set(2.04, 0, 0);
      frameBorderL.castShadow = true;
      const frameBorderF = new THREE.Mesh(new THREE.BoxGeometry(4.16, 0.11, 0.11), steelDarkMat);
      frameBorderF.position.set(0, 0, -3.10);
      frameBorderF.castShadow = true;
      awningG.add(frameBorderL, frameBorderF);
      for (const gz of [-1.55, 0.0, 1.55]) {
        const seam = new THREE.Mesh(new THREE.BoxGeometry(4.06, 0.068, 0.065), steelDarkMat);
        seam.position.set(0, 0, gz);
        seam.castShadow = true;
        awningG.add(seam);
      }
      // 2 Large Horizontal White Cylindrical HVAC Ducts + Flanged Collars clearly visible right beneath the low-iron skylight glass!
      const hvacDuctMat = new THREE.MeshStandardMaterial({ color: '#eef2f6', roughness: 0.42, metalness: 0.18 });
      for (const dx of [-0.95, 0.72]) {
        const hvacDuct = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 6.4, 18), hvacDuctMat);
        hvacDuct.rotation.x = Math.PI / 2;
        hvacDuct.position.set(dx, -0.54, 0);
        hvacDuct.castShadow = true;
        awningG.add(hvacDuct);
        for (const fz of [-2.1, 0.0, 2.1]) {
          const collar = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.026, 8, 18), ssMat);
          collar.position.set(dx, -0.54, fz);
          awningG.add(collar);
        }
      }
      // Brushed stainless spider-clamp struts & X-fittings anchoring the low-iron glass above the HVAC ducts!
      const whiteTubeMat = new THREE.MeshStandardMaterial({ color: '#eef2f6', roughness: 0.34, metalness: 0.55 });
      for (const sz of [-2.4, -0.8, 0.8, 2.4]) {
        for (const sx of [-0.95, 0.72]) {
          const spiderPost = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.24, 8), ssMat);
          spiderPost.position.set(sx, -0.13, sz);
          const spiderArmA = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.024, 0.042), ssMat);
          spiderArmA.position.set(sx, -0.05, sz);
          spiderArmA.rotation.y = Math.PI * 0.25;
          const spiderArmB = spiderArmA.clone();
          spiderArmB.rotation.y = -Math.PI * 0.25;
          const spiderDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.025, 12), ssMat);
          spiderDisc.position.set(sx, 0.02, sz);
          awningG.add(spiderPost, spiderArmA, spiderArmB, spiderDisc);
        }
      }
      // Angled white tubular suspension tie-rod anchoring skylight canopy into left wall (exact foreground photo detail!)
      const tieStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.2, 10), whiteTubeMat);
      tieStrut.rotation.z = Math.PI * 0.44;
      tieStrut.position.set(-1.35, 0.48, 0.65);
      tieStrut.castShadow = true;
      awningG.add(tieStrut);
      sarangGroup.add(awningG);
    }

    // D. Right Side Open Multi-Story Exterior Lightwell Drop-Off (x > +4.5, y = -6..0)
    //    Ribbed gray concrete outer bridge girder fascia + lit recessed lower office windows w/ desks & blinds + twin silver rooftop utility pipes!
    {
      const flutedGirderMat = new THREE.MeshStandardMaterial({ color: '#9ca3ad', roughness: 0.78, metalness: 0.05 });
      const bridgeSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.45, 13.8), flutedGirderMat);
      bridgeSkirt.position.set(4.56, -1.22, 0.2);
      bridgeSkirt.castShadow = false;
      sarangGroup.add(bridgeSkirt);
      for (let fl = 0; fl < 20; fl++) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.38, 0.14), graniteBandMat);
        rib.position.set(4.74, -1.22, -6.3 + fl * 0.70);
        sarangGroup.add(rib);
      }

      // Recessed warm-cream exterior building facade on right (x > +4.5, y = -6..0) with lit office windows, desks & blinds!
      const officeInteriorMat = new THREE.MeshStandardMaterial({
        color: '#f5e4c4',
        emissive: '#ffd592',
        emissiveIntensity: 0.46,
        roughness: 0.72
      });
      const blindMat = new THREE.MeshStandardMaterial({ color: '#e5e0d4', roughness: 0.78 });
      const lowerRightWall = new THREE.Mesh(new THREE.BoxGeometry(9.6, 7.6, 0.65), wingFacadeMat);
      lowerRightWall.position.set(9.4, -2.2, -7.12);
      lowerRightWall.castShadow = false;
      sarangGroup.add(lowerRightWall);
      for (const wy of [-4.25, -1.15, 1.75]) {
        const winInterior = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.15, 0.12), officeInteriorMat);
        winInterior.position.set(9.4, wy, -6.78);
        const winGlass = new THREE.Mesh(
          new THREE.BoxGeometry(7.24, 2.18, 0.05),
          new THREE.MeshPhysicalMaterial({ color: '#bcd6e4', transparent: true, opacity: 0.28, roughness: 0.06, ior: 1.52, clearcoat: 1.0, depthWrite: false })
        );
        winGlass.position.set(9.4, wy, -6.68);
        const officeDesk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 0.55), new THREE.MeshStandardMaterial({ color: '#78563a', roughness: 0.6 }));
        officeDesk.position.set(9.2, wy - 0.65, -6.74);
        const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.36, 0.06), steelDarkMat);
        monitor.position.set(9.2, wy - 0.20, -6.74);
        // Horizontal slatted office blinds along top half of window
        for (let bl = 0; bl < 4; bl++) {
          const blind = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.06, 0.04), blindMat);
          blind.position.set(9.4, wy + 0.55 + bl * 0.12, -6.72);
          sarangGroup.add(blind);
        }
        sarangGroup.add(winInterior, winGlass, officeDesk, monitor);
        for (let m = -2; m <= 2; m++) {
          const mull = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.22, 0.14), mullionDarkMat);
          mull.position.set(9.4 + m * 1.75, wy, -6.68);
          sarangGroup.add(mull);
        }
      }

      // Right return warm-cream 1 Utama office wing framing the east lightwell (masks distant yellow hotel checkerboard!)
      const rightWingReturn = new THREE.Mesh(new THREE.BoxGeometry(1.6, 17.5, 16.5), wingFacadeMat);
      rightWingReturn.position.set(14.0, 2.6, 0.2);
      rightWingReturn.castShadow = false;
      sarangGroup.add(rightWingReturn);
      for (const rwy of [-1.2, 2.6, 6.4, 10.2]) {
        const rwWin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.35, 14.5), wingGlassMat);
        rwWin.position.set(13.15, rwy, 0.2);
        const rwBand = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.92, 15.2), graniteBandMat);
        rwBand.position.set(13.12, rwy + 1.68, 0.2);
        sarangGroup.add(rwWin, rwBand);
      }

      // Lower-Right Grey Rooftop Slab & Twin Horizontal Curved Silver Utility Conduits/Pipes (EXACT bottom-right photo detail!)
      const lowerRoofSlab = new THREE.Mesh(
        new THREE.BoxGeometry(9.8, 0.36, 9.4),
        new THREE.MeshStandardMaterial({ color: '#6b7078', roughness: 0.88 })
      );
      lowerRoofSlab.position.set(9.8, -5.65, -2.4);
      lowerRoofSlab.castShadow = false;
      sarangGroup.add(lowerRoofSlab);

      const conduitMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.28, metalness: 0.72, envMapIntensity: 1.15 });
      for (const offset of [0.0, 0.42]) {
        const pipePts = [
          new THREE.Vector3(6.2 + offset, -5.30, 1.8),
          new THREE.Vector3(6.2 + offset, -5.30, -3.6 + offset),
          new THREE.Vector3(6.6 + offset, -5.30, -4.3 + offset),
          new THREE.Vector3(7.5 + offset, -5.30, -4.6 + offset),
          new THREE.Vector3(13.6, -5.30, -4.6 + offset)
        ];
        const pipeMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pipePts), 32, 0.14, 12, false), conduitMat);
        sarangGroup.add(pipeMesh);
      }
    }

    // 9. Clean Cream Sandstone Entry Framing at 2F Doorway (z_local = +7.75, behind 2F-02 camera — ZERO black ceiling overhang!)
    for (const sx of [-4.65, 4.65]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.56, 4.8, 0.52), parapetMat);
      jamb.position.set(sx, 2.4, 7.75);
      jamb.castShadow = false;
      sarangGroup.add(jamb);
    }
    const portalSign = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 0.58),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('SARANGHAE BRIDGE • 사랑해', 'OUTDOOR 2F ROOFTOP TERRACE', '#1e1b4b', '#fbcfe8', '#ec4899') })
    );
    portalSign.position.set(0, 4.35, 7.46);
    sarangGroup.add(portalSign);
  }
  root.add(sarangGroup);

  const windPresets = [
    { label: '140 km/h Beginner Hover', factor: 0.75, targetH: 1.45 },
    { label: '195 km/h Pro Freestyle', factor: 1.15, targetH: 1.98 },
    { label: '250 km/h MAX TURBINE BOOST', factor: 1.75, targetH: 2.52 }
  ];
  let windPresetIdx = 1;
  function cycleAirRiderSpeed() {
    windPresetIdx = (windPresetIdx + 1) % windPresets.length;
    windVortexMat.uniforms.uWindSpeed.value = windPresets[windPresetIdx].factor;
    return windPresets[windPresetIdx].label;
  }

  interactables.push(
    {
      id: 'windlab-console',
      position: new THREE.Vector3(-167.5, 19.2, -10.5),
      radius: 10.0,
      priority: 4,
      prompt: '[E] Crank S601 WINDLAB Skydiving Tunnel up to 250 km/h (+200 UPoints)',
      actionType: 'airrider-boost',
      stampId: 'spawn-windlab'
    },
    {
      id: 'saranghae-bridge-lock',
      position: new THREE.Vector3(-140.5, 19.2, -32.2),
      radius: 9.5,
      priority: 4,
      prompt: '[E] Lock a Wish on Outdoor 2F Saranghae Finger-Heart Bridge (+150 UPoints)',
      actionType: 'saranghae-lock'
    }
  );

  // ==========================================================================
  // 3. OLD WING CENTRE COURT MALAYSIAN HERITAGE ARCHITECTURAL PAVILION
  //    (Multi-Tier Carved Timber Nusantara Roof, Warm Clerestory Glow & Woven-Gold Chandelier Rings)
  // ==========================================================================
  const festiveThemes = [
    { name: 'Hari Raya Aidilfitri Heritage Timber Pavilion', primary: '#115e46', secondary: '#d4af37', glow: '#fde68a' },
    { name: 'Chinese New Year Crimson Lantern Pagoda', primary: '#991b1b', secondary: '#eab308', glow: '#fca5a5' },
    { name: 'Deepavali Royal Kolam Peacock Palace', primary: '#5b21b6', secondary: '#f59e0b', glow: '#f0abfc' }
  ];
  let festiveIndex = 0;

  const stageGroup = new THREE.Group();
  stageGroup.position.set(-74, 6.0, 0);
  root.add(stageGroup);
  addShadow(stageGroup, 0, 0, 0, 21.0, 21.0);

  const heritageTimberMat = new THREE.MeshStandardMaterial({
    color: '#8e5a34',
    map: bridgeTeakMaps.map,
    normalMap: bridgeTeakMaps.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    emissive: '#331c0d',
    emissiveIntensity: 0.10,
    roughness: 0.80,
    metalness: 0.02,
    envMapIntensity: 0.24
  });
  const warmStoneDeckMat = new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: 0.34, metalness: 0.05, envMapIntensity: 0.72 });
  const stagePrimaryMat = new THREE.MeshStandardMaterial({ color: festiveThemes[0].primary, roughness: 0.56, metalness: 0.14, envMapIntensity: 0.55 });
  const stageGoldMat = new THREE.MeshStandardMaterial({ color: festiveThemes[0].secondary, roughness: 0.26, metalness: 0.82, envMapIntensity: 1.05 });
  // Refined warm amber lantern glow + clamped clerestory lattice material (ZERO middle-roof white bloom blowout!)
  const stageLanternMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.24, 0.94, 0.48) });
  const clerestoryAmberMat = new THREE.MeshStandardMaterial({
    color: '#d49a52',
    emissive: '#a66420',
    emissiveIntensity: 0.30,
    roughness: 0.78,
    metalness: 0.04
  });

  // Stepped Octagonal Travertine & Carved Timber Podium with Warm LED Toe-Kick
  const stageBaseStep = new THREE.Mesh(new THREE.CylinderGeometry(9.35, 9.65, 0.18, 8), heritageTimberMat);
  stageBaseStep.position.y = 0.09;
  stageBaseStep.receiveShadow = true;
  const stagePodium = new THREE.Mesh(new THREE.CylinderGeometry(8.55, 8.85, 0.36, 8), warmStoneDeckMat);
  stagePodium.position.y = 0.34;
  stagePodium.receiveShadow = true;
  const stageTrim = new THREE.Mesh(new THREE.CylinderGeometry(8.92, 8.92, 0.06, 8), stageGoldMat);
  stageTrim.position.y = 0.52;
  const stageToeLed = new THREE.Mesh(new THREE.TorusGeometry(9.05, 0.032, 6, 8), stageLanternMat);
  stageToeLed.rotation.x = Math.PI / 2;
  stageToeLed.position.y = 0.19;

  // Woven Songket Emerald & Gold Medallion Carpet + Ceremonial Timber Entry Steps
  const rayaRug = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 0.04, 8), stagePrimaryMat);
  rayaRug.position.y = 0.54;
  const rugBorder = new THREE.Mesh(new THREE.TorusGeometry(5.55, 0.09, 6, 8), stageGoldMat);
  rugBorder.rotation.x = Math.PI / 2;
  rugBorder.position.y = 0.56;
  const innerMedallion = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.06, 6, 8), stageGoldMat);
  innerMedallion.rotation.x = Math.PI / 2;
  innerMedallion.position.y = 0.56;
  for (let st = 0; st < 2; st++) {
    const stepM = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.20, 4.2), st === 0 ? heritageTimberMat : warmStoneDeckMat);
    stepM.position.set(-8.85 - st * 0.72, 0.32 - st * 0.18, 0);
    stepM.receiveShadow = true;
    stageGroup.add(stepM);
  }

  // Carved Malaysian Heritage Entry Archway (dark timber + brushed brass filigree inset)
  const archRing = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.16, 10, 32, Math.PI), heritageTimberMat);
  archRing.position.set(0, 2.25, 0);
  const archBrassInlay = new THREE.Mesh(new THREE.TorusGeometry(2.54, 0.055, 8, 32, Math.PI), stageGoldMat);
  archBrassInlay.position.set(0, 2.25, 0);
  for (const ax of [-2.75, 2.75]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.78, 12), heritageTimberMat);
    leg.position.set(ax, 1.38, 0);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 12), stageGoldMat);
    collar.position.set(ax, 2.18, 0);
    const plinthA = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.34, 0.68), stagePrimaryMat);
    plinthA.position.set(ax, 0.69, 0);
    stageGroup.add(leg, collar, plinthA);
  }

  // Sculpted Festive Display Tables & Carved Timber Lounge Bench inside Pavilion
  for (const hx of [-2.45, 2.45]) {
    const hTable = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.84, 0.88), heritageTimberMat);
    hTable.position.set(hx, 0.94, 2.65);
    const hTop = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.06, 0.94), warmStoneDeckMat);
    hTop.position.set(hx, 1.39, 2.65);
    const urnBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.44, 12), stageGoldMat);
    urnBase.position.set(hx, 1.64, 2.65);
    const urnTop = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), stagePrimaryMat);
    urnTop.scale.set(1.0, 1.25, 1.0);
    urnTop.position.set(hx, 1.98, 2.65);
    stageGroup.add(hTable, hTop, urnBase, urnTop);
  }
  const photoBench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.44, 0.78), heritageTimberMat);
  photoBench.position.set(0, 0.76, -0.35);
  const photoCushion = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.10, 0.68), stagePrimaryMat);
  photoCushion.position.set(0, 1.02, -0.35);
  stageGroup.add(stageBaseStep, stagePodium, stageTrim, stageToeLed, rayaRug, rugBorder, innerMedallion, archRing, archBrassInlay, photoBench, photoCushion);

  // 8 Fluted Timber-and-Brass Structural Columns with Carved Corbel Brackets & Warm Pelita Lanterns
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const cx = Math.cos(a) * 6.05;
    const cz = Math.sin(a) * 6.05;
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.48, 0.58), warmStoneDeckMat);
    colBase.position.set(cx, 0.76, cz);
    const pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 4.95, 12), heritageTimberMat);
    pCol.position.set(cx, 3.45, cz);
    pCol.castShadow = true;
    const colCap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.22, 0.28, 12), stageGoldMat);
    colCap.position.set(cx, 5.82, cz);
    // Curved architectural roof corbel strut
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 1.35), heritageTimberMat);
    strut.position.set(Math.cos(a) * 6.55, 5.55, Math.sin(a) * 6.55);
    strut.rotation.y = -a + Math.PI / 2;
    strut.rotation.x = 0.42;
    // Silk heritage banner hanging cleanly between upper column capitals
    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.35, 0.62), stagePrimaryMat);
    banner.position.set(Math.cos(a) * 5.62, 4.78, Math.sin(a) * 5.62);
    banner.rotation.y = -a;
    // Warm traditional brass Pelita lamp pedestal around outer deck perimeter
    const pelita = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.16, 0.88, 10), stageGoldMat);
    pelita.position.set(Math.cos(a) * 7.55, 0.96, Math.sin(a) * 7.55);
    const pelitaGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.28, 10), stageLanternMat);
    pelitaGlass.position.set(Math.cos(a) * 7.55, 1.52, Math.sin(a) * 7.55);
    const pelitaCap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.16, 8), heritageTimberMat);
    pelitaCap.position.set(Math.cos(a) * 7.55, 1.74, Math.sin(a) * 7.55);
    stageGroup.add(colBase, pCol, colCap, strut, banner, pelita, pelitaGlass, pelitaCap);
  }

  // Matte Textured Terracotta Roof Shingle Material (roughness: 0.68 — ZERO glossy red plastic!)
  const shingleC = document.createElement('canvas');
  shingleC.width = 512;
  shingleC.height = 512;
  const shCtx = shingleC.getContext('2d');
  shCtx.fillStyle = '#8e3d2b';
  shCtx.fillRect(0, 0, 512, 512);
  const shNormC = document.createElement('canvas');
  shNormC.width = 512;
  shNormC.height = 512;
  const snCtx = shNormC.getContext('2d');
  snCtx.fillStyle = 'rgb(128,128,255)';
  snCtx.fillRect(0, 0, 512, 512);
  const shRows = 16;
  const shCols = 12;
  const shH = 512 / shRows;
  const shW = 512 / shCols;
  for (let sr = 0; sr < shRows; sr++) {
    const off = (sr % 2) * (shW * 0.5);
    for (let sc = -1; sc <= shCols; sc++) {
      const hVal = ((sr * 17 + sc * 31) % 11) / 10;
      const rr = Math.round(134 + hVal * 28);
      const rg = Math.round(54 + hVal * 16);
      const rb = Math.round(38 + hVal * 12);
      shCtx.fillStyle = `rgb(${rr},${rg},${rb})`;
      shCtx.fillRect(sc * shW + off + 1, sr * shH + 1, shW - 2, shH - 3);
      shCtx.fillStyle = 'rgba(38, 18, 12, 0.34)';
      shCtx.fillRect(sc * shW + off, (sr + 1) * shH - 3, shW, 3);
      snCtx.fillStyle = 'rgb(128, 92, 232)';
      snCtx.fillRect(sc * shW + off, (sr + 1) * shH - 3, shW, 3);
      snCtx.fillStyle = 'rgb(108, 128, 240)';
      snCtx.fillRect(sc * shW + off, sr * shH, 2, shH);
    }
  }
  const shingleTex = new THREE.CanvasTexture(shingleC);
  shingleTex.colorSpace = THREE.SRGBColorSpace;
  shingleTex.wrapS = shingleTex.wrapT = THREE.RepeatWrapping;
  shingleTex.repeat.set(6, 3);
  shingleTex.anisotropy = 8;
  const shingleNormTex = new THREE.CanvasTexture(shNormC);
  shingleNormTex.wrapS = shingleNormTex.wrapT = THREE.RepeatWrapping;
  shingleNormTex.repeat.set(6, 3);

  const terracottaRoofMat = new THREE.MeshStandardMaterial({
    color: '#c26952',
    map: shingleTex,
    normalMap: shingleNormTex,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.68,
    metalness: 0.02,
    envMapIntensity: 0.22
  });
  const kerawangDarkMat = new THREE.MeshStandardMaterial({
    color: '#362012',
    map: bridgeTeakMaps.map,
    normalMap: bridgeTeakMaps.normalMap,
    roughness: 0.76,
    metalness: 0.04,
    envMapIntensity: 0.22
  });

  // Multi-Tiered Flared Malaysian Nusantara Terracotta-Shingle Roof + Exact Flush Hip-Rafter Ribs + Carved Kerawang Eave Trim!
  const lowerRoofPts = [
    new THREE.Vector2(7.75, 5.65),
    new THREE.Vector2(6.90, 5.95),
    new THREE.Vector2(5.45, 6.72),
    new THREE.Vector2(4.05, 7.65)
  ];
  const lowerRoofGeo = new THREE.LatheGeometry(lowerRoofPts, 8);
  lowerRoofGeo.rotateY(Math.PI / 8);
  const lowerRoof = new THREE.Mesh(lowerRoofGeo, terracottaRoofMat);
  lowerRoof.castShadow = true;
  lowerRoof.receiveShadow = true;

  // Warm Carved Wooden Lattice Clerestory Drum separating Lower & Upper Roof Tiers (clamped warm amber -> ZERO white glare!)
  const clerestoryDrum = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 3.95, 0.92, 8), clerestoryAmberMat);
  clerestoryDrum.rotation.y = Math.PI / 8;
  clerestoryDrum.position.y = 8.05;
  for (let cm = 0; cm < 16; cm++) {
    const ca = (cm / 16) * Math.PI * 2;
    const cMull = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.94, 0.14), kerawangDarkMat);
    cMull.position.set(Math.cos(ca) * 3.88, 8.05, Math.sin(ca) * 3.88);
    cMull.rotation.y = -ca;
    stageGroup.add(cMull);
  }
  const clerestoryFrame = new THREE.Mesh(new THREE.CylinderGeometry(4.02, 4.02, 0.16, 8, 1, true), stageGoldMat);
  clerestoryFrame.rotation.y = Math.PI / 8;
  clerestoryFrame.position.y = 7.66;

  const upperRoofPts = [
    new THREE.Vector2(4.85, 8.38),
    new THREE.Vector2(3.60, 8.85),
    new THREE.Vector2(1.85, 9.78),
    new THREE.Vector2(0.18, 10.85)
  ];
  const upperRoofGeo = new THREE.LatheGeometry(upperRoofPts, 8);
  upperRoofGeo.rotateY(Math.PI / 8);
  const upperRoof = new THREE.Mesh(upperRoofGeo, terracottaRoofMat);
  upperRoof.castShadow = true;
  upperRoof.receiveShadow = true;

  // Carved Dark-Timber Kerawang Eave Fascia Trim (aligned strictly to LatheGeometry PI/8 corner phase!)
  const lowerKerawangFascia = new THREE.Mesh(
    new THREE.CylinderGeometry(7.72, 7.64, 0.26, 8, 1, true),
    kerawangDarkMat
  );
  lowerKerawangFascia.rotation.y = Math.PI / 8;
  lowerKerawangFascia.position.y = 5.53;
  const lowerGoldBead = new THREE.Mesh(new THREE.CylinderGeometry(7.69, 7.69, 0.06, 8, 1, true), stageGoldMat);
  lowerGoldBead.rotation.y = Math.PI / 8;
  lowerGoldBead.position.y = 5.64;

  const upperKerawangFascia = new THREE.Mesh(
    new THREE.CylinderGeometry(4.82, 4.76, 0.20, 8, 1, true),
    kerawangDarkMat
  );
  upperKerawangFascia.rotation.y = Math.PI / 8;
  upperKerawangFascia.position.y = 8.29;
  const upperGoldBead = new THREE.Mesh(new THREE.CylinderGeometry(4.80, 4.80, 0.05, 8, 1, true), stageGoldMat);
  upperGoldBead.rotation.y = Math.PI / 8;
  upperGoldBead.position.y = 8.38;

  // Pierced Kerawang Fretwork Eave Drop Brackets along all 8 octagonal faces (lower + upper tiers!)
  for (let fk = 0; fk < 16; fk++) {
    const fa = (fk / 16) * Math.PI * 2 + Math.PI / 16;
    const dropL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 0.07), kerawangDarkMat);
    dropL.position.set(Math.sin(fa) * 7.22, 5.42, Math.cos(fa) * 7.22);
    dropL.rotation.y = fa;
    const dropGold = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), stageGoldMat);
    dropGold.position.set(Math.sin(fa) * 7.22, 5.26, Math.cos(fa) * 7.22);
    dropGold.rotation.x = Math.PI;
    stageGroup.add(dropL, dropGold);
    if (fk % 2 === 0) {
      const dropU = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.06), kerawangDarkMat);
      dropU.position.set(Math.sin(fa) * 4.52, 8.20, Math.cos(fa) * 4.52);
      dropU.rotation.y = fa;
      stageGroup.add(dropU);
    }
  }

  // Exact Flush Gold Hip-Rafter Ribs: EVERY rib starts at upper ridge/finial apex and terminates STRICTLY FLUSH inside the roof eave edge (rEnd = tierRadius - 0.14 -> ZERO protruding sticks!)
  for (let r = 0; r < 8; r++) {
    const ra = (r / 8) * Math.PI * 2 + Math.PI / 8;
    const sx = Math.sin(ra);
    const cz = Math.cos(ra);

    // Lower tier hip-rafter rib (starts at r = 4.05, terminates at rEnd = 7.75 - 0.14 = 7.61)
    const lowerRibPts = [
      new THREE.Vector3(sx * 4.05, 7.67, cz * 4.05),
      new THREE.Vector3(sx * 5.45, 6.75, cz * 5.45),
      new THREE.Vector3(sx * 6.90, 5.98, cz * 6.90),
      new THREE.Vector3(sx * (7.75 - 0.14), 5.71, cz * (7.75 - 0.14))
    ];
    const lowerRib = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lowerRibPts), 16, 0.056, 8, false),
      stageGoldMat
    );

    // Upper tier hip-rafter rib (starts at finial apex r = 0.18, terminates at rEnd = 4.85 - 0.14 = 4.71)
    const upperRibPts = [
      new THREE.Vector3(sx * 0.18, 10.87, cz * 0.18),
      new THREE.Vector3(sx * 1.85, 9.81, cz * 1.85),
      new THREE.Vector3(sx * 3.60, 8.88, cz * 3.60),
      new THREE.Vector3(sx * (4.85 - 0.14), 8.43, cz * (4.85 - 0.14))
    ];
    const upperRib = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(upperRibPts), 18, 0.048, 8, false),
      stageGoldMat
    );
    stageGroup.add(lowerRib, upperRib);
  }

  // Warm 2400K Lantern Point Lights casting genuine golden glow onto the terracotta roof & eaves
  for (let li = 0; li < 4; li++) {
    const la = (li / 4) * Math.PI * 2 + Math.PI / 4;
    const roofGlowLight = new THREE.PointLight('#ff9e3d', 8.5, 16, 1.55);
    roofGlowLight.position.set(Math.sin(la) * 6.4, 7.4, Math.cos(la) * 6.4);
    stageGroup.add(roofGlowLight);
  }
  const upperRoofLanternLight = new THREE.PointLight('#ff9c38', 7.5, 15, 1.50);
  upperRoofLanternLight.position.set(0, 10.2, 0);
  stageGroup.add(upperRoofLanternLight);

  const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.44, 0.65, 12), stageGoldMat);
  spireBase.position.y = 11.10;
  const spireTip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.15, 12), stageGoldMat);
  spireTip.position.y = 11.95;
  stageGroup.add(
    lowerRoof, clerestoryDrum, clerestoryFrame, upperRoof,
    lowerKerawangFascia, lowerGoldBead, upperKerawangFascia, upperGoldBead,
    spireBase, spireTip
  );

  // Structural Bronze Chandelier Ring & Radial Tie-Beams bolted cleanly into Old Wing Skylight Curb at y=29.85
  const ringTruss = new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.12, 10, 56), steelDarkMat);
  ringTruss.rotation.x = Math.PI / 2;
  ringTruss.position.set(-74, 29.85, 0);
  const tieBeamNS = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 21.0), steelDarkMat);
  tieBeamNS.position.set(-74, 29.85, 0);
  const tieBeamEW = new THREE.Mesh(new THREE.BoxGeometry(48.0, 0.18, 0.18), steelDarkMat);
  tieBeamEW.position.set(-74, 29.85, 0);
  root.add(ringTruss, tieBeamNS, tieBeamEW);

  // Sculptural Architectural Woven-Gold Pendant Chandelier Rings & Glowing Amber Frosted-Glass Cylindrical Lanterns (ZERO low-poly octahedrons!)
  const floatingOrnaments = [];
  const wireMat = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.85, roughness: 0.25 });
  const frostedAmberGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#ffcf7a',
    emissive: '#ff9d2e',
    emissiveIntensity: 0.92,
    roughness: 0.36,
    metalness: 0.04,
    transparent: true,
    opacity: 0.90,
    clearcoat: 0.25,
    envMapIntensity: 0.45
  });
  const lanternCoreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 0.96, 0.44) });
  const chandelierTiers = [
    { radius: 7.4, y: 15.8, lanterns: 8 },
    { radius: 5.2, y: 18.6, lanterns: 6 }
  ];
  for (const tier of chandelierTiers) {
    const chRing = new THREE.Mesh(new THREE.TorusGeometry(tier.radius, 0.11, 10, 48), stageGoldMat);
    chRing.rotation.x = Math.PI / 2;
    chRing.position.y = tier.y;
    const chGlow = new THREE.Mesh(new THREE.TorusGeometry(tier.radius - 0.12, 0.045, 8, 48), stageLanternMat);
    chGlow.rotation.x = Math.PI / 2;
    chGlow.position.y = tier.y - 0.06;
    const tierWarmLight = new THREE.PointLight('#ffc870', 9.5, 20, 1.55);
    tierWarmLight.position.set(0, tier.y - 1.2, 0);
    stageGroup.add(chRing, chGlow, tierWarmLight);
    for (let w = 0; w < 4; w++) {
      const wa = (w / 4) * Math.PI * 2 + Math.PI * 0.25;
      const rodH = 29.85 - tier.y;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, rodH, 6), wireMat);
      rod.position.set(Math.cos(wa) * tier.radius, tier.y + rodH * 0.5, Math.sin(wa) * tier.radius);
      stageGroup.add(rod);
    }
    for (let i = 0; i < tier.lanterns; i++) {
      const a = (i / tier.lanterns) * Math.PI * 2;
      const ornGroup = new THREE.Group();
      const baseY = tier.y - 1.35 - (i % 2) * 0.85;
      ornGroup.position.set(Math.cos(a) * tier.radius, baseY, Math.sin(a) * tier.radius);
      // Warm glowing amber frosted-glass cylindrical lantern + glowing inner filament bulb
      const lantShade = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.72, 16), frostedAmberGlassMat);
      const lantCore = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.44, 10), lanternCoreMat);
      const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.032, 6, 16), stageGoldMat);
      topRim.rotation.x = Math.PI / 2;
      topRim.position.y = 0.36;
      const botRim = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.032, 6, 16), stageGoldMat);
      botRim.rotation.x = Math.PI / 2;
      botRim.position.y = -0.36;
      const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 8), stagePrimaryMat);
      tassel.position.y = -0.52;
      const stemH = tier.y - baseY;
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, stemH, 5), wireMat);
      wire.position.y = stemH * 0.5;
      ornGroup.add(lantShade, lantCore, topRim, botRim, tassel, wire);
      stageGroup.add(ornGroup);
      floatingOrnaments.push({ mesh: ornGroup, baseY, seed: i * 1.1 + tier.radius });
    }
  }

  // Two Authentic Carved Dark-Timber Malaysian Heritage Bazaar Pavilions flanking Old Wing Centre Court foreground (ZERO plain green boxes!)
  const batikBoltsCols = ['#115e46', '#991b1b', '#1e3a8a', '#b45309', '#6d28d9', '#be185d'];
  const ceramicJarMat = new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.22, metalness: 0.12 });
  const shelfGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 0.92, 0.46) });
  const shelfBackMat = new THREE.MeshStandardMaterial({ color: '#3b2414', roughness: 0.76 });
  for (let bi = 0; bi < 2; bi++) {
    const [bx, bz] = bi === 0 ? [-87.5, -7.8] : [-85.5, 8.2];
    const baz = new THREE.Group();
    baz.position.set(bx, 6.0, bz);
    baz.rotation.y = bi === 0 ? 0.18 : Math.PI - 0.18;

    // Stepped travertine & carved dark-timber plinth
    const plinthBase = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.10, 2.55), warmStoneDeckMat);
    plinthBase.position.y = 0.05;
    plinthBase.receiveShadow = true;

    // 4 Carved Dark-Teak Corner Posts + Turned Brass Collars & Roof Corbels
    for (const px of [-1.58, 1.58]) {
      for (const pz of [-1.08, 1.08]) {
        const postBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), warmStoneDeckMat);
        postBase.position.set(px, 0.18, pz);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.10, 2.75, 10), heritageTimberMat);
        post.position.set(px, 1.58, pz);
        post.castShadow = true;
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, 0.12, 10), stageGoldMat);
        collar.position.set(px, 2.86, pz);
        baz.add(postBase, post, collar);
      }
    }

    // Carved Dark-Timber Display Counter with Brass Moulding Inlays & Travertine Top
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.92, 0.88), heritageTimberMat);
    counter.position.set(0, 0.56, 0.62);
    counter.castShadow = true;
    const counterBrassTrim = new THREE.Mesh(new THREE.BoxGeometry(3.10, 0.06, 0.92), stageGoldMat);
    counterBrassTrim.position.set(0, 0.96, 0.62);
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.16, 0.07, 0.98), warmStoneDeckMat);
    counterTop.position.set(0, 1.05, 0.62);
    for (const mx of [-0.95, 0, 0.95]) {
      const carvedPanel = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.62, 0.04), shelfBackMat);
      carvedPanel.position.set(mx, 0.56, 1.07);
      const brassInset = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.46, 0.025), stageGoldMat);
      brassInset.position.set(mx, 0.56, 1.09);
      baz.add(carvedPanel, brassInset);
    }

    // Countertop Heritage Brassware & Glazed Ceramic Jars
    const kettleBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), stageGoldMat);
    kettleBody.scale.set(1.0, 0.85, 1.0);
    kettleBody.position.set(-0.78, 1.22, 0.62);
    const kettleNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.18, 10), stageGoldMat);
    kettleNeck.position.set(-0.78, 1.38, 0.62);
    const jar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.30, 12), ceramicJarMat);
    jar1.position.set(0.68, 1.24, 0.62);
    const jarLid = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.10, 12), stageGoldMat);
    jarLid.position.set(0.68, 1.44, 0.62);

    // Illuminated Interior Display Shelving Unit Stocked with Folded Batik Textiles, Brassware & Ceramic Jars!
    const shelfUnitBack = new THREE.Mesh(new THREE.BoxGeometry(2.86, 2.25, 0.14), shelfBackMat);
    shelfUnitBack.position.set(0, 1.22, -0.82);
    const shelfSideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.25, 0.46), heritageTimberMat);
    shelfSideL.position.set(-1.38, 1.22, -0.66);
    const shelfSideR = shelfSideL.clone();
    shelfSideR.position.x = 1.38;
    baz.add(shelfUnitBack, shelfSideL, shelfSideR);

    for (let sh = 0; sh < 3; sh++) {
      const sy = 0.78 + sh * 0.62;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.055, 0.42), heritageTimberMat);
      plank.position.set(0, sy, -0.66);
      const underLed = new THREE.Mesh(new THREE.BoxGeometry(2.60, 0.024, 0.04), shelfGlowMat);
      underLed.position.set(0, sy + 0.54, -0.50);
      baz.add(plank, underLed);
      for (let it = 0; it < 5; it++) {
        const ix = -1.04 + it * 0.52;
        if ((sh + it) % 3 === 0) {
          // Stacked folded Malaysian batik textile bolts
          for (let fb = 0; fb < 2; fb++) {
            const bolt = new THREE.Mesh(
              new THREE.BoxGeometry(0.34, 0.09, 0.28),
              new THREE.MeshStandardMaterial({ color: batikBoltsCols[(sh + it + fb) % batikBoltsCols.length], roughness: 0.72 })
            );
            bolt.position.set(ix, sy + 0.075 + fb * 0.095, -0.66);
            baz.add(bolt);
          }
        } else if ((sh + it) % 3 === 1) {
          // Turned brass vessel / dulang display
          const brassPot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.24, 12), stageGoldMat);
          brassPot.position.set(ix, sy + 0.15, -0.66);
          baz.add(brassPot);
        } else {
          // Glazed ceramic heritage jar
          const cerJar = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), ceramicJarMat);
          cerJar.scale.set(1.0, 1.25, 1.0);
          cerJar.position.set(ix, sy + 0.17, -0.66);
          baz.add(cerJar);
        }
      }
    }

    // Warm Pitched Malaysian Nusantara Timber Roof + Carved Brass Eave Trim + Roof Finial
    const roofEaveBase = new THREE.Mesh(new THREE.BoxGeometry(3.68, 0.14, 2.72), heritageTimberMat);
    roofEaveBase.position.y = 2.98;
    const roofEaveGold = new THREE.Mesh(new THREE.BoxGeometry(3.74, 0.055, 2.78), stageGoldMat);
    roofEaveGold.position.y = 2.94;
    const pitchedRoof = new THREE.Mesh(new THREE.ConeGeometry(2.42, 1.15, 4), heritageTimberMat);
    pitchedRoof.rotation.y = Math.PI * 0.25;
    pitchedRoof.scale.set(1.12, 1.0, 0.86);
    pitchedRoof.position.y = 3.60;
    pitchedRoof.castShadow = true;
    const roofFinial = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.38, 10), stageGoldMat);
    roofFinial.position.y = 4.32;

    // Warm interior showcase PointLight + hanging pelita lanterns
    const showcaseLight = new THREE.PointLight('#ffd28a', 6.5, 6.5, 1.6);
    showcaseLight.position.set(0, 2.35, -0.15);
    const attendant = createArticulatedPerson({ shirt: '#047857', pants: '#18181b' });
    attendant.position.set(0.35, 0.10, -0.05);

    baz.add(
      plinthBase, counter, counterBrassTrim, counterTop,
      kettleBody, kettleNeck, jar1, jarLid,
      roofEaveBase, roofEaveGold, pitchedRoof, roofFinial,
      showcaseLight, attendant
    );
    root.add(baz);
  }

  function cycleFestiveTheme() {
    festiveIndex = (festiveIndex + 1) % festiveThemes.length;
    const t = festiveThemes[festiveIndex];
    stagePrimaryMat.color.set(t.primary);
    stageGoldMat.color.set(t.secondary);
    stageLanternMat.color.set(t.glow);
    return t.name;
  }

  interactables.push({
    id: 'centre-court-stage',
    position: new THREE.Vector3(-74, 1.2, 0),
    radius: 15.5,
    priority: 4,
    prompt: '[E] Switch Centre Court Malaysian Festive Showcase (+150 UPoints)',
    actionType: 'cycle-festive',
    stampId: 'spawn-centre-court'
  });

  interactables.push({
    id: 'beutea-order',
    position: new THREE.Vector3(-108, 7.2, 5.2),
    radius: 7.5,
    priority: 3,
    prompt: '[E] Order Beutea 茶仙子 Jasmine Peach Oolong (GK102 Speed Boost)',
    actionType: 'order-kopi',
    stampId: 'spawn-centre-court'
  });

  interactables.push({
    id: 'promenade-vista',
    position: new THREE.Vector3(-14, 7.2, 0),
    radius: 9.0,
    priority: 3,
    prompt: '[E] Admire Lebuh Bandar Utama Skybridge & Lavender Bakery (G212) (+150 UPoints)',
    actionType: 'order-chagee',
    stampId: 'spawn-promenade'
  });

  // ==========================================================================
  // 4. THE OVAL LUXURY EV HYPERCAR EXHIBITION (STANCHIONS, LECTERN & SCISSOR DOORS)
  // ==========================================================================
  const hypercarColors = [
    { name: 'Rosso Corsa Ferrari Metallic', hex: '#c8102e' },
    { name: 'Petronas Emerald Metallic', hex: '#00a19c' },
    { name: 'Giallo Modena Gold', hex: '#eab308' },
    { name: 'Bianco Avus Pearl White', hex: '#e2e8f0' }
  ];
  let carColorIdx = 0;
  let carDoorsOpen = false;
  let carDoorAngle = 0;

  const turntableGroup = new THREE.Group();
  turntableGroup.position.set(138, 0, 0);
  root.add(turntableGroup);
  addShadow(turntableGroup, 0, 0, 0, 15.2, 15.2);

  // Brushed Obsidian Graphite Exhibition Plinth (ZERO white spotlight glare blowout!) + Slim Cyan Perimeter LED
  const stageDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(6.2, 6.6, 0.28, 56),
    new THREE.MeshPhysicalMaterial({
      color: '#171c26',
      roughness: 0.36,
      metalness: 0.42,
      clearcoat: 0.24,
      clearcoatRoughness: 0.28,
      envMapIntensity: 0.58
    })
  );
  stageDisc.position.y = 0.14;
  stageDisc.receiveShadow = true;
  const stageInnerTrim = new THREE.Mesh(
    new THREE.TorusGeometry(4.45, 0.028, 6, 64),
    brassMat
  );
  stageInnerTrim.rotation.x = Math.PI / 2;
  stageInnerTrim.position.y = 0.285;
  const stageNeonRing = new THREE.Mesh(
    new THREE.TorusGeometry(6.32, 0.042, 8, 64),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.42, 1.24, 0.88) })
  );
  stageNeonRing.rotation.x = Math.PI / 2;
  stageNeonRing.position.y = 0.275;
  // Warm luxury showroom key light directly above the Ferrari 458 turntable making its emerald metallic clearcoat gleam!
  const ferrariKeyLight = new THREE.PointLight('#fff3db', 26, 22, 1.45);
  ferrariKeyLight.position.set(0, 7.2, 0);
  turntableGroup.add(stageDisc, stageInnerTrim, stageNeonRing, ferrariKeyLight);
  // Subtle contact shadow directly beneath the hypercar tires & chassis onto the obsidian plinth!
  addShadow(turntableGroup, 0, 0.285, 0, 6.2, 3.3);

  // Brushed Brass Weighted Stanchions + True Sagging Catenary Crimson Velvet Ropes around the Oval Turntable!
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#8f1624', roughness: 0.84, metalness: 0.04, envMapIntensity: 0.35 });
  const postCoords = [];
  for (let st = 0; st < 10; st++) {
    const a = (st / 10) * Math.PI * 2;
    const px = Math.cos(a) * 7.2;
    const pz = Math.sin(a) * 7.2;
    postCoords.push(new THREE.Vector3(px, 0.84, pz));
    const postBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 16), brassMat);
    postBase.position.set(px, 0.025, pz);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.90, 10), brassMat);
    post.position.set(px, 0.45, pz);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), brassMat);
    finial.position.set(px, 0.92, pz);
    turntableGroup.add(postBase, post, finial);
  }
  for (let st = 0; st < 10; st++) {
    const p1 = postCoords[st];
    const p2 = postCoords[(st + 1) % 10];
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    mid.y = 0.56; // Natural gravity velvet rope drape catenary!
    const catCurve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const ropeMesh = new THREE.Mesh(new THREE.TubeGeometry(catCurve, 12, 0.026, 8, false), ropeMat);
    turntableGroup.add(ropeMesh);
  }

  // Sleek Low-Profile Brushed-Steel & Obsidian Museum Spec Lectern cleanly placed on left exhibition flank (ZERO tilted yellow box!)
  const lecternStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.12, 0.92, 16),
    new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.28, metalness: 0.85 })
  );
  lecternStand.position.set(-5.6, 0.46, 5.4);
  const lecternBackMat = new THREE.MeshStandardMaterial({ color: '#141820', roughness: 0.34, metalness: 0.68 });
  const lecternFrontMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('FERRARI 458 ITALIA', 'ROSSO CORSA • 1 UTAMA OVAL', '#11151c', '#f8fafc', '#c8102e') });
  const lecternPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.48, 0.045),
    [lecternBackMat, lecternBackMat, lecternBackMat, lecternBackMat, lecternFrontMat, lecternBackMat]
  );
  lecternPanel.position.set(-5.6, 0.96, 5.4);
  lecternPanel.rotation.y = 0.62;
  lecternPanel.rotation.x = -0.32;
  turntableGroup.add(lecternStand, lecternPanel);

  const carGroup = new THREE.Group();
  carGroup.position.y = 0.28;
  carGroup.scale.setScalar(1.24);
  carGroup.rotation.y = -0.68; // Dramatic 3/4 front-quarter hero showcase facing the LG Oval concourse viewer!
  turntableGroup.add(carGroup);

  // 4 Overhead Theatrical Volumetric Spotlight Cones illuminating the Oval Supercar stage!
  const spotConeMat = createVolumetricGodRayMaterial('#fff2d2', 0.22);
  for (let s = 0; s < 4; s++) {
    const sa = (s / 4) * Math.PI * 2 + Math.PI * 0.25;
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 3.8, 14.5, 18, 1, true), spotConeMat);
    cone.position.set(Math.cos(sa) * 3.8, 7.2, Math.sin(sa) * 3.8);
    cone.rotation.z = Math.cos(sa) * 0.36;
    cone.rotation.x = -Math.sin(sa) * 0.36;
    turntableGroup.add(cone);
  }

  const carPaintMat = new THREE.MeshPhysicalMaterial({
    color: hypercarColors[0].hex,
    metalness: 0.88,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.75
  });
  const carDetailsMat = new THREE.MeshStandardMaterial({
    color: '#dce4ee',
    metalness: 0.94,
    roughness: 0.22,
    envMapIntensity: 1.45
  });
  const carGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#111926',
    metalness: 0.22,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    transparent: true,
    opacity: 0.68,
    envMapIntensity: 1.85
  });

  // Safe dummy door pivots (kept for interactHypercar API compatibility)
  const leftDoorPivot = new THREE.Group();
  const rightDoorPivot = new THREE.Group();
  carGroup.add(leftDoorPivot, rightDoorPivot);

  // REAL HIGH-POLY FERRARI 458 ITALIA (.glb + local Draco decoder + baked underbody AO shadow!)
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  const carGltfLoader = new GLTFLoader();
  carGltfLoader.setDRACOLoader(dracoLoader);
  const ferrariWheels = [];

  const ferrariShadowTex = new THREE.TextureLoader().load('/models/ferrari_ao.png');
  const ferrariShadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
    new THREE.MeshBasicMaterial({
      map: ferrariShadowTex,
      blending: THREE.MultiplyBlending,
      toneMapped: false,
      transparent: true,
      premultipliedAlpha: true,
      depthWrite: false
    })
  );
  ferrariShadowMesh.rotation.x = -Math.PI / 2;
  ferrariShadowMesh.position.y = 0.015;
  carGroup.add(ferrariShadowMesh);

  const ferrariReady = new Promise((resolveFerrari) => {
    carGltfLoader.load(
      '/models/ferrari.glb',
      (gltf) => {
        const carModel = gltf.scene.children[0] || gltf.scene;
        carModel.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            const nm = (o.name || '').toLowerCase();
            if (nm === 'body') {
              o.material = carPaintMat;
            } else if (nm === 'rim_fl' || nm === 'rim_fr' || nm === 'rim_rr' || nm === 'rim_rl' || nm === 'trim') {
              o.material = carDetailsMat;
            } else if (nm === 'glass') {
              o.material = carGlassMat;
            }
          }
        });
        for (const wn of ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr']) {
          const wObj = carModel.getObjectByName(wn);
          if (wObj) ferrariWheels.push(wObj);
        }
        carGroup.add(carModel);
        resolveFerrari(true);
      },
      undefined,
      (err) => {
        console.warn('[Ferrari] Failed to load ferrari.glb:', err);
        resolveFerrari(false);
      }
    );
  });

  function interactHypercar() {
    carDoorsOpen = !carDoorsOpen;
    carColorIdx = (carColorIdx + 1) % hypercarColors.length;
    carPaintMat.color.set(hypercarColors[carColorIdx].hex);
    return { doorsOpen: carDoorsOpen, paintName: hypercarColors[carColorIdx].name };
  }

  interactables.push({
    id: 'oval-hypercar',
    position: new THREE.Vector3(138.0, 1.2, 0),
    radius: 13.5,
    priority: 4,
    prompt: '[E] Switch Oval Ferrari 458 Italia Metallic Clearcoat Paint (+150 UPoints)',
    actionType: 'toggle-hypercar',
    stampId: 'spawn-oval-showcase'
  });

  // ==========================================================================
  // 5. 3F THE LEDGE ART GALLERY & 4F–5F ENTERTAINMENT ZONE HERO SET-PIECES
  // ==========================================================================
  // 3F The Ledge Art Gallery (Partitions + Framed Art + Varied 3D Sculptures + Title Plinth!)
  {
    const galleryGroup = new THREE.Group();
    galleryGroup.position.set(86, 24.0, -18.5);
    const sculpGeos = [
      new THREE.TorusKnotGeometry(0.28, 0.08, 48, 8),
      new THREE.IcosahedronGeometry(0.34, 0),
      new THREE.OctahedronGeometry(0.36, 0),
      new THREE.TorusGeometry(0.30, 0.09, 12, 24)
    ];
    for (let i = 0; i < 4; i++) {
      const gx = (i - 1.5) * 6.4;
      const partition = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 3.6, 0.24),
        new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.58 })
      );
      partition.position.set(gx, 1.8, 0);
      const artTex = createGalleryArtworkTexture(i + 1);
      const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.3), new THREE.MeshBasicMaterial({ map: artTex }));
      canvasMesh.position.set(gx, 1.95, 0.14);

      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.05, 0.72), steelDarkMat);
      ped.position.set(gx + 3.2, 0.525, 1.2);
      const sculp = new THREE.Mesh(sculpGeos[i], brassMat);
      sculp.position.set(gx + 3.2, 1.48, 1.2);

      galleryGroup.add(partition, canvasMesh, ped, sculp);
      addShadow(galleryGroup, gx, 0, 0, 3.8, 1.6);
      addShadow(galleryGroup, gx + 3.2, 0, 1.2, 1.6, 1.6);
    }
    // Freestanding Title Plinth at West entrance of The Ledge Art Gallery!
    const titleStand = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.55, 0.35), steelDarkMat);
    titleStand.position.set(-12.6, 0.775, 1.6);
    const titlePlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.42),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('THE LEDGE ART GALLERY', '3F HIGHSTREET • FREE ENTRY', '#0f172a', '#ffffff', '#38bdf8') })
    );
    titlePlate.rotation.y = -Math.PI / 2;
    titlePlate.position.set(-13.09, 1.15, 1.6);
    galleryGroup.add(titleStand, titlePlate);
    root.add(galleryGroup);
  }

  // 4F–5F: EZ501 Camp5 Grounded Faceted Climbing Wall + Crash Mats + Harness Desk + Climbers!
  {
    const campGroup = new THREE.Group();
    campGroup.position.set(14.5, 30.0, -15.5);
    // Thick blue padded bouldering crash mats grounded cleanly clear of corner column & railing
    const crashMat = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.38, 10.6),
      new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.78 })
    );
    crashMat.position.set(1.4, 0.19, 0);
    campGroup.add(crashMat);

    // Angled climbing wall panels + overhanging 3D volumes + top-rope anchor beams
    const wallCols = ['#f97316', '#0ea5e9', '#eab308', '#10b981'];
    const holdCols = ['#ef4444', '#fde047', '#ec4899', '#22d3ee', '#ffffff'];
    for (let i = 0; i < 4; i++) {
      const zOff = (i - 1.5) * 2.55;
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 5.7, 2.42),
        new THREE.MeshStandardMaterial({ color: wallCols[i % wallCols.length], roughness: 0.72 })
      );
      panel.position.set(0.35, 3.0, zOff);
      panel.rotation.z = i % 2 === 0 ? -0.14 : 0.08;
      campGroup.add(panel);

      // 3D Pyramid Overhang Climbing Volume
      const vol = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 0.65, 4),
        new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7 })
      );
      vol.rotation.z = -Math.PI / 2;
      vol.position.set(0.85, 2.4 + (i % 2) * 1.1, zOff);
      campGroup.add(vol);

      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.9, 6), new THREE.MeshBasicMaterial({ color: '#facc15' }));
      rope.position.set(1.05, 2.85, zOff);
      campGroup.add(rope);

      for (let h = 0; h < 8; h++) {
        const hold = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.11, 0),
          new THREE.MeshStandardMaterial({ color: holdCols[(i + h) % holdCols.length], roughness: 0.45 })
        );
        hold.position.set(0.85, 0.9 + h * 0.58, zOff + ((h % 3) - 1) * 0.64);
        campGroup.add(hold);
      }
    }
    // Camp5 Check-In / Harness Counter + Staff + Monitors + Coiled Rope/Chalk Props + Grounded Bench CLEAR of column!
    const cDesk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.05, 1.05), new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.5 }));
    cDesk.position.set(4.8, 0.525, -4.4);
    const cTop = new THREE.Mesh(new THREE.BoxGeometry(2.94, 0.09, 1.16), new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3 }));
    cTop.position.set(4.8, 1.08, -4.4);
    const cSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.64),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('CAMP5 CHECK-IN', 'EZ501 • 24M LEAD & BOULDER', '#7c2d12', '#fed7aa', '#fb923c') })
    );
    cSign.position.set(4.8, 0.58, -3.86);
    const cMon = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.36, 0.08), steelDarkMat);
    cMon.position.set(4.1, 1.32, -4.25);
    // Coiled climbing rope & chalk bag props on reception counter
    const cRopeCoil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.045, 6, 16), new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.65 }));
    cRopeCoil.rotation.x = Math.PI / 2;
    cRopeCoil.position.set(5.45, 1.16, -4.35);
    const chalkBag = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.18, 10), new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.7 }));
    chalkBag.position.set(4.85, 1.21, -4.25);
    const cStaff = createArticulatedPerson({ shirt: '#f97316', pants: '#1e293b' });
    cStaff.position.set(5.1, 0, -5.05);
    // Bench moved cleanly to (4.8, 0, -1.0) — 2.8m CLEAR of Rainforest corner column (19.8, -13.6)!
    const cBench = createSlattedBench(2.2, new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.55 }), steelDarkMat);
    cBench.rotation.y = -Math.PI / 2;
    cBench.position.set(4.8, 0, -1.0);
    campGroup.add(cDesk, cTop, cSign, cMon, cRopeCoil, chalkBag, cStaff, cBench);

    for (const [cx, cy, cz, shirt] of [[1.05, 1.85, -1.6, '#e11d48'], [2.1, 0.38, 1.5, '#0284c7'], [3.8, 0, 0.2, '#10b981']]) {
      const cl = createArticulatedPerson({ shirt, pants: '#1e293b' });
      cl.position.set(cx, cy, cz);
      cl.rotation.y = -Math.PI / 2;
      campGroup.add(cl);
    }
    root.add(campGroup);
  }

  // 4F: EZ401 Wangsa Bowl Recessed Alley Bay (z=20.6, depth 4.6m -> leaves generous 5.5m public marble walkway!)
  const bowlingBalls = [];
  {
    const bowlGroup = new THREE.Group();
    bowlGroup.position.set(36, 30.02, 20.6);
    const mapleMat = new THREE.MeshStandardMaterial({ color: '#c27829', roughness: 0.24, metalness: 0.10 });
    const pinMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25 });

    const deckPad = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.06, 4.6), steelDarkMat);
    deckPad.position.y = 0.03;
    // Printed Cosmic Bowling Pinsetter Masking Unit with illuminated Lane 01-04 banner!
    const hoodTex = createSignBoardTexture('WANGSA BOWL • COSMIC LANES 01 – 04', 'EZ401 • TOURNAMENT TEN-PIN BOWLING', '#1e1b4b', '#fde047', '#38bdf8');
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(11.6, 1.25, 0.85),
      [steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, new THREE.MeshBasicMaterial({ map: hoodTex })]
    );
    hood.position.set(0, 1.58, 1.85);
    bowlGroup.add(deckPad, hood);

    for (let l = 0; l < 4; l++) {
      const lx = (l - 1.5) * 2.55;
      const lane = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.09, 4.4), mapleMat);
      lane.position.set(lx, 0.05, 0);
      bowlGroup.add(lane);

      // Printed Overhead Cosmic Bowling Scoreboard Monitor!
      const scoreTex = createBowlingScoreTexture(l + 1);
      const tvMat = new THREE.MeshBasicMaterial({ map: scoreTex });
      const tv = new THREE.Mesh(
        new THREE.BoxGeometry(1.42, 0.72, 0.12),
        [steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, tvMat, tvMat]
      );
      tv.position.set(lx, 2.75, -1.2);
      bowlGroup.add(tv);

      // Ball return console + racked bowling balls + bowler bench at approach!
      if (l % 2 === 0) {
        const ret = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.72, 1.1), steelDarkMat);
        ret.position.set(lx + 1.25, 0.36, -1.65);
        const rBall = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), new THREE.MeshStandardMaterial({ color: '#ec4899', roughness: 0.2 }));
        rBall.position.set(lx + 1.25, 0.82, -1.65);
        bowlGroup.add(ret, rBall);
      }

      for (let p = 0; p < 6; p++) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 0.38, 8), pinMat);
        pin.position.set(lx + ((p % 3) - 1) * 0.22, 0.28, 1.45 + Math.floor(p / 3) * 0.22);
        bowlGroup.add(pin);
      }
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 12),
        new THREE.MeshStandardMaterial({ color: l % 2 === 0 ? '#ec4899' : '#38bdf8', roughness: 0.16, metalness: 0.4 })
      );
      ball.position.set(lx, 0.22, -1.9);
      bowlGroup.add(ball);
      bowlingBalls.push({ mesh: ball, offset: l * 0.8 });
    }
    // 2 Active Articulated Bowlers + Bowler Seating Bench at approach!
    const b1 = createArticulatedPerson({ shirt: '#0284c7', pants: '#0f172a' });
    b1.position.set(-2.5, 0.05, -2.5);
    const b2 = createArticulatedPerson({ shirt: '#f43f5e', pants: '#334155' });
    b2.position.set(2.5, 0.05, -2.6);
    bowlGroup.add(b1, b2);
    root.add(bowlGroup);
  }

  // 4F: EZ402 Toy Catcher Detailed UFO Claw Machines + Grounded EZ502 Diva KTV + Detailed EZ503 maimai DX + EVCS457 Bay!
  {
    const plushCols = ['#f43f5e', '#fbbf24', '#34d399', '#a855f7', '#38bdf8', '#fb923c'];
    const clawHeaderMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('TOY CATCHER', 'UFO CLAW • 1 TOKEN', '#831843', '#fef08a', '#f472b6') });
    for (let c = 0; c < 6; c++) {
      const claw = new THREE.Group();
      claw.position.set(67 + c * 2.35, 30.0, 20.8);
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 0.92, 1.18),
        new THREE.MeshStandardMaterial({ color: c % 2 === 0 ? '#db2777' : '#0284c7', roughness: 0.34 })
      );
      base.position.y = 0.46;
      // Front arcade control deck with joystick, red push button & prize drop chute!
      const ctrlDeck = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.14, 0.28), steelDarkMat);
      ctrlDeck.position.set(0, 0.88, -0.66);
      const joyStick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 6), brassMat);
      joyStick.position.set(-0.32, 0.99, -0.70);
      const joyKnob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: '#ef4444' }));
      joyKnob.position.set(-0.32, 1.07, -0.70);
      const pushBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 8), new THREE.MeshBasicMaterial({ color: '#fde047' }));
      pushBtn.position.set(0.05, 0.97, -0.70);
      const chute = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.08), new THREE.MeshStandardMaterial({ color: '#0f172a' }));
      chute.position.set(0.40, 0.34, -0.60);

      // LED corner rails framing glass showcase
      for (const rx of [-0.68, 0.68]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.25, 0.05), new THREE.MeshBasicMaterial({ color: c % 2 === 0 ? '#f472b6' : '#38bdf8' }));
        rail.position.set(rx, 1.54, -0.58);
        claw.add(rail);
      }
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(1.36, 1.24, 1.12),
        new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, depthWrite: false })
      );
      glass.position.y = 1.54;
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.48, 0.34, 1.24),
        [steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, clawHeaderMat, clawHeaderMat]
      );
      top.position.y = 2.32;
      // Pile of 8 varied plush toys inside every claw machine!
      for (let pl = 0; pl < 8; pl++) {
        const plush = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.14 + (pl % 2) * 0.04, 1),
          new THREE.MeshStandardMaterial({ color: plushCols[(c + pl) % plushCols.length], roughness: 0.75 })
        );
        plush.position.set(((pl % 4) - 1.5) * 0.26, 1.06 + Math.floor(pl / 4) * 0.20, ((pl % 3) - 1) * 0.25);
        claw.add(plush);
      }
      const gantry = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.45, 6), brassMat);
      gantry.position.set(0, 1.88, 0);
      claw.add(base, ctrlDeck, joyStick, joyKnob, pushBtn, chute, glass, top, gantry);
      if (c === 1 || c === 4) {
        const pl = createArticulatedPerson({ shirt: c === 1 ? '#f472b6' : '#38bdf8', pants: '#1e293b' });
        pl.position.set(0, 0, -1.25);
        claw.add(pl);
      }
      root.add(claw);
      addShadow(root, 67 + c * 2.35, 30.0, 20.8, 2.0, 1.8);
    }

    // EZ502 Diva Karaoke GROUNDED Full-Height Neon Entrance Portal Arch at x=123.5 (9m EAST of escalator nw-dn-4 -> ZERO escalator slicing!)
    const divaArch = new THREE.Group();
    divaArch.position.set(123.5, 30.0, 20.8);
    // Grounded vertical brass/neon legs touching y = 0.0 (ZERO floating arch!)
    for (const ax of [-2.4, 2.4]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 2.25, 10), brassMat);
      leg.position.set(ax, 1.125, 0);
      const legBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.16, 12), steelDarkMat);
      legBase.position.set(ax, 0.08, 0);
      divaArch.add(leg, legBase);
    }
    const neonArch = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.13, 10, 36, Math.PI), new THREE.MeshBasicMaterial({ color: '#e879f9' }));
    neonArch.position.y = 2.22;
    // Crown marquee mounted cleanly ABOVE pink neon arch apex (bottom y=4.87 > arch top 4.75 -> ZERO text occlusion!)
    const divaHeader = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.62, 0.16),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('DIVA VIP KARAOKE', 'EZ502 • CONCERT KTV SUITES', '#4c1d95', '#ffffff', '#e879f9') })
    );
    divaHeader.position.set(0, 5.18, 0);
    for (const sx of [-0.75, 0.75]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 6), brassMat);
      strut.position.set(sx, 4.72, 0);
      divaArch.add(strut);
    }
    const divaDesk = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.05, 0.92),
      new THREE.MeshStandardMaterial({ color: '#4c1d95', roughness: 0.35, metalness: 0.3 })
    );
    divaDesk.position.set(0, 0.525, 0.1);
    const divaTop = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.09, 1.04), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25 }));
    divaTop.position.set(0, 1.08, 0.1);
    const divaFrontSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.64),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('VIP RECEPTION', 'BOOK A SUITE', '#3b0764', '#f5d0fe', '#e879f9') })
    );
    divaFrontSign.rotation.y = Math.PI;
    divaFrontSign.position.set(0, 0.56, -0.37);
    // Uniformed receptionist behind Diva desk + flanking velvet stanchions!
    const recTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.56, 10), new THREE.MeshStandardMaterial({ color: '#ec4899', roughness: 0.45 }));
    recTorso.position.set(0, 1.24, 0.45);
    const recHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), new THREE.MeshStandardMaterial({ color: '#e2a982' }));
    recHead.position.set(0, 1.66, 0.45);
    const velvetM = new THREE.MeshStandardMaterial({ color: '#be123c', roughness: 0.55 });
    for (const sx of [-3.6, 3.6]) {
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.92, 8), brassMat);
      p1.position.set(sx, 0.46, -0.8);
      const p2 = p1.clone();
      p2.position.x = sx * 0.72;
      const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.05, 6), velvetM);
      rp.rotation.z = Math.PI / 2;
      rp.position.set(sx * 0.86, 0.72, -0.8);
      divaArch.add(p1, p2, rp);
    }
    divaArch.add(neonArch, divaHeader, divaDesk, divaTop, divaFrontSign, recTorso, recHead);
    root.add(divaArch);
    addShadow(root, 123.5, 30.0, 20.8, 6.2, 2.8);

    // EZ503 Cross Fire Detailed maimai DX PRiSM Rhythm Cabinets (Glowing Beatmap Screens + 8 Bezel Buttons + Players!)
    const maimaiTex = createMaimaiScreenTexture();
    const maimaiScreenMat = new THREE.MeshBasicMaterial({ map: maimaiTex });
    const maimaiHeaderMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('maimai DX PRiSM', 'CROSS FIRE ARCADE', '#0284c7', '#ffffff', '#fde047') });
    const btnWhiteMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    for (let m = 0; m < 5; m++) {
      const cab = new THREE.Group();
      cab.position.set(143 + m * 2.8, 30.0, 20.8);
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.62, 2.28, 1.15), new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.28 }));
      body.position.y = 1.14;
      const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.32, 1.05), new THREE.MeshStandardMaterial({ color: m % 2 === 0 ? '#0284c7' : '#db2777', roughness: 0.3 }));
      sideStripe.position.y = 0.45;
      const screenDisc = new THREE.Mesh(new THREE.CircleGeometry(0.48, 24), maimaiScreenMat);
      screenDisc.position.set(0, 1.38, -0.59);
      screenDisc.rotation.y = Math.PI;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.06, 8, 24), new THREE.MeshBasicMaterial({ color: m % 2 === 0 ? '#22d3ee' : '#e879f9' }));
      ring.position.set(0, 1.38, -0.60);
      // 8 Illuminated Physical Touch Buttons around the circular bezel!
      for (let bt = 0; bt < 8; bt++) {
        const ba = (bt / 8) * Math.PI * 2 + Math.PI / 8;
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 8), btnWhiteMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(Math.cos(ba) * 0.56, 1.38 + Math.sin(ba) * 0.56, -0.62);
        cab.add(btn);
      }
      const marquee = new THREE.Mesh(
        new THREE.BoxGeometry(1.56, 0.38, 0.24),
        [steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, maimaiHeaderMat, maimaiHeaderMat]
      );
      marquee.position.set(0, 2.46, -0.45);
      cab.add(body, sideStripe, screenDisc, ring, marquee);

      // Grounded articulated arcade players actively playing cabinets 1 & 3!
      if (m === 1 || m === 3) {
        const pl = createArticulatedPerson({ shirt: m === 1 ? '#0ea5e9' : '#f43f5e', pants: '#1e293b' });
        pl.position.set(0, 0, -1.25);
        cab.add(pl);
      }
      root.add(cab);
      addShadow(root, 143 + m * 2.8, 30.0, 20.8, 2.2, 1.8);
    }

    // EVCS457 Dedicated Glazed Oval Carpark EV Supercharger Bay + Painted White Stall Lines + Coiled Cables + Visitors!
    const evG = new THREE.Group();
    evG.position.set(166.5, 30.0, -16.8);
    const evBay = new THREE.Mesh(
      new THREE.PlaneGeometry(8.8, 4.4),
      new THREE.MeshStandardMaterial({ color: '#065f46', roughness: 0.78 })
    );
    evBay.rotation.x = -Math.PI / 2;
    evBay.position.y = 0.02;
    // Crisp white painted parking stall divider lines on green EV bay!
    const stallMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    for (const sx of [-4.2, -1.35, 1.35, 4.2]) {
      const sLine = new THREE.Mesh(new THREE.PlaneGeometry(0.10, 4.2), stallMat);
      sLine.rotation.x = -Math.PI / 2;
      sLine.position.set(sx, 0.03, 0);
      evG.add(sLine);
    }
    // Visitors browsing Stanzo & EVCS457 (eliminates ghost-town feel in 4F-09!)
    const evVis1 = createArticulatedPerson({ shirt: '#0284c7', pants: '#1e293b' });
    evVis1.position.set(-2.0, 0, 2.6);
    evVis1.rotation.y = Math.PI;
    const evVis2 = createArticulatedPerson({ shirt: '#e11d48', pants: '#334155' });
    evVis2.position.set(2.2, 0, 5.2);
    evVis2.rotation.y = Math.PI * 0.65;
    const evVis3 = createArticulatedPerson({ shirt: '#f8fafc', pants: '#0f172a' });
    evVis3.position.set(-4.8, 0, 4.4);
    evVis3.rotation.y = 0.8;
    evG.add(evVis1, evVis2, evVis3);
    // Illuminated EVCS457 Overhead Gantry Arch!
    const evGantryTex = createSignBoardTexture('EVCS457 • 180kW EV SUPERCHARGER BAY', 'OVAL PURPLE CARPARK ACCESS • 1PAY', '#064e3b', '#ffffff', '#34d399');
    const evGantryMat = new THREE.MeshBasicMaterial({ map: evGantryTex });
    const evHeader = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.86, 0.28), [steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, evGantryMat, evGantryMat]);
    evHeader.position.set(0, 3.25, -1.6);
    for (const gx of [-4.0, 4.0]) {
      const gp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.25, 0.22), new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.7, roughness: 0.3 }));
      gp.position.set(gx, 1.625, -1.6);
      evG.add(gp);
    }
    evG.add(evBay, evHeader);

    // Metallic silver-graphite charger pedestals + glowing UI screens + coiled cables + bollards!
    const chargerMetalMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.28, metalness: 0.75 });
    const evUiMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('180kW DC', 'READY • TAP 1PAY', '#0f172a', '#34d399', '#10b981') });
    for (let e = -1; e <= 1; e++) {
      const ex = e * 2.6;
      const ped = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.05, 0.44), chargerMetalMat);
      ped.position.set(ex, 1.025, -1.5);
      const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.48), new THREE.MeshBasicMaterial({ color: '#10b981' }));
      ledStrip.position.set(ex, 1.98, -1.5);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.56), evUiMat);
      screen.position.set(ex, 1.38, -1.27);
      // Coiled charging cable hanging on charger side
      const cable = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 16, Math.PI * 1.4), steelDarkMat);
      cable.position.set(ex + 0.38, 1.1, -1.5);
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.85, 10), new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.35 }));
      bollard.position.set(ex + 0.75, 0.425, -0.9);
      evG.add(ped, ledStrip, screen, cable, bollard);
    }
    root.add(evG);
  }

  // ==========================================================================
  // 6. UR UPPER ROOF (y=37.0): SECRET GARDEN, PADANG, BASEBALL CAGE & ASCARO PADEL + SUNSET LOUNGE
  // ==========================================================================
  const gardenGroup = new THREE.Group();
  gardenGroup.position.set(0, 37.0, 0);
  root.add(gardenGroup);

  // Rich Procedural Organic Dark Bark-Mulch & Scattered River-Pebble Soil PBR Texture (kills pale grey planter soil slabs!)
  const mulchCanvas = document.createElement('canvas');
  mulchCanvas.width = mulchCanvas.height = 256;
  const mCtx = mulchCanvas.getContext('2d');
  mCtx.fillStyle = '#1e1610';
  mCtx.fillRect(0, 0, 256, 256);
  const mulchShades = ['#2b2016', '#18110b', '#352619', '#252c18', '#150f09', '#3d2d1e'];
  for (let i = 0; i < 950; i++) {
    const mx = (i * 53) % 256;
    const my = (i * 97) % 256;
    mCtx.fillStyle = mulchShades[i % mulchShades.length];
    mCtx.fillRect(mx, my, 4 + (i % 7), 2 + (i % 4));
  }
  // Scattered smooth dark river pebbles & fallen leaf mulch flecks
  const pebbleShades = ['#4a4640', '#38342f', '#5c554d', '#2e2b27'];
  for (let p = 0; p < 85; p++) {
    const px = (p * 79 + 13) % 248;
    const py = (p * 113 + 29) % 248;
    mCtx.fillStyle = pebbleShades[p % pebbleShades.length];
    mCtx.beginPath();
    mCtx.ellipse(px, py, 3.5 + (p % 4), 2.2 + (p % 3), (p % 5) * 0.4, 0, Math.PI * 2);
    mCtx.fill();
  }
  const mulchTex = new THREE.CanvasTexture(mulchCanvas);
  mulchTex.wrapS = THREE.RepeatWrapping;
  mulchTex.wrapT = THREE.RepeatWrapping;
  mulchTex.repeat.set(4, 3);
  mulchTex.colorSpace = THREE.SRGBColorSpace;

  const soilMat = new THREE.MeshStandardMaterial({
    map: mulchTex,
    bumpMap: mulchTex,
    bumpScale: 0.08,
    color: '#6b5a4a',
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.14
  });
  const woodPergolaMat = new THREE.MeshStandardMaterial({ color: '#9c6842', roughness: 0.56 });
  const fairyBulbMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });

  // Helper for branded UR Rooftop Entrance Archways (Brushed gunmetal steel PBR — ZERO pitch-black posts!)
  const archMetalMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.34, metalness: 0.72 });
  function addRoofArchway(x, z, rotY, leftT, badge, rightT, accent) {
    const ag = new THREE.Group();
    ag.position.set(x, 0, z);
    ag.rotation.y = rotY;
    for (const px of [-3.6, 3.6]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.26, 3.85, 0.26), archMetalMat);
      post.position.set(px, 1.925, 0);
      const baseP = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.42), brassMat);
      baseP.position.set(px, 0.09, 0);
      ag.add(post, baseP);
    }
    const tex = createWayfindingTexture(leftT, badge, rightT, accent);
    const sm = new THREE.MeshBasicMaterial({ map: tex });
    const header = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.05, 0.28), [archMetalMat, archMetalMat, archMetalMat, archMetalMat, sm, sm]);
    header.position.y = 3.58;
    ag.add(header);
    gardenGroup.add(ag);
  }

  // A. UR603A THE SECRET GARDEN (Warm Sunlit Cedar Entrance Arch + Warm Grazing Light + 2.5x Denser Botanical Beds + Grounded Entry Steps + Golden Volumetric Sunbeams!)
  {
    const sgArch = new THREE.Group();
    sgArch.position.set(21.35, 0, -13.5);
    sgArch.rotation.y = Math.PI / 2;
    const matteBronzeBase = new THREE.MeshStandardMaterial({ color: '#4b3f35', roughness: 0.58, metalness: 0.42 });
    const archTimberMat = new THREE.MeshStandardMaterial({
      color: '#b07b50',
      map: bridgeTeakMaps.map,
      normalMap: bridgeTeakMaps.normalMap,
      roughness: 0.52,
      metalness: 0.04,
      envMapIntensity: 0.80
    });
    for (const px of [-3.3, 3.3]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.66, 0.28), archTimberMat);
      post.position.set(px, 1.83, 0);
      post.castShadow = true;
      post.receiveShadow = true;
      const baseP = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.48), matteBronzeBase);
      baseP.position.set(px, 0.12, 0);
      baseP.castShadow = true;
      baseP.receiveShadow = true;
      const brassCollar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.09, 0.36), brassMat);
      brassCollar.position.set(px, 0.28, 0);
      sgArch.add(post, baseP, brassCollar);
    }
    const sgTex = createSecretGardenArchTexture();
    const sgSignMat = new THREE.MeshStandardMaterial({
      map: sgTex,
      roughness: 0.42,
      metalness: 0.12,
      emissive: '#ffe2b8',
      emissiveMap: sgTex,
      emissiveIntensity: 0.34
    });
    const sgHeader = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 1.04, 0.26),
      [archTimberMat, archTimberMat, archTimberMat, archTimberMat, sgSignMat, sgSignMat]
    );
    sgHeader.position.y = 3.68;
    sgHeader.castShadow = true;
    sgArch.add(sgHeader);
    gardenGroup.add(sgArch);

    // Soft Golden-Hour Grazing Light high above Secret Garden cedar archway (warm wood glow — ZERO circular point-light ring on deck!)
    const sgWarmLight = new THREE.PointLight('#ffca88', 9.5, 24, 1.65);
    sgWarmLight.position.set(18.2, 4.6, -13.5);
    gardenGroup.add(sgWarmLight);
  }

  // Warm Textured Architectural Stacked-Limestone Planter Curbs + Chamfered Coping Rim + Recessed Dark Bark-Mulch Soil Bed!
  const limeC = document.createElement('canvas');
  limeC.width = 512;
  limeC.height = 256;
  const lCtx = limeC.getContext('2d');
  lCtx.fillStyle = '#9e8f7a';
  lCtx.fillRect(0, 0, 512, 256);
  const stoneBlocks = ['#a99a84', '#948570', '#b5a690', '#877864', '#9d8e79'];
  for (let row = 0; row < 6; row++) {
    const rh = 256 / 6;
    const off = (row % 2) * 44;
    for (let col = -1; col < 6; col++) {
      const bw = 88 + ((row * 3 + col) % 3) * 14;
      lCtx.fillStyle = stoneBlocks[(row * 5 + col + 8) % stoneBlocks.length];
      lCtx.fillRect(col * 92 + off, row * rh + 2, bw - 3, rh - 4);
      for (let sp = 0; sp < 14; sp++) {
        lCtx.fillStyle = sp % 2 === 0 ? 'rgba(255,248,236,0.08)' : 'rgba(38,30,22,0.10)';
        lCtx.fillRect(col * 92 + off + ((sp * 19) % 72), row * rh + 4 + ((sp * 11) % 30), 4, 3);
      }
    }
  }
  const limestoneTex = new THREE.CanvasTexture(limeC);
  limestoneTex.colorSpace = THREE.SRGBColorSpace;
  limestoneTex.wrapS = limestoneTex.wrapT = THREE.RepeatWrapping;
  limestoneTex.repeat.set(3, 1);
  const bedCurbMat = new THREE.MeshStandardMaterial({ map: limestoneTex, roughness: 0.88, metalness: 0.02 });
  const stoneCopingMat = new THREE.MeshStandardMaterial({ color: '#c4b69f', roughness: 0.82, metalness: 0.02 });

  function buildArchitecturalPlanter(parent, x, z, w, d, h = 0.46) {
    const outerWall = new THREE.Mesh(new THREE.BoxGeometry(w + 0.44, h, d + 0.44), bedCurbMat);
    outerWall.position.set(x, h * 0.5, z);
    outerWall.castShadow = true;
    outerWall.receiveShadow = true;
    parent.add(outerWall);
    // 4-sided chamfered limestone coping rim framing a recessed bark-mulch bed
    const rimH = 0.075;
    const rimT = 0.26;
    for (const sz of [-1, 1]) {
      const capZ = new THREE.Mesh(new THREE.BoxGeometry(w + 0.56, rimH, rimT), stoneCopingMat);
      capZ.position.set(x, h + rimH * 0.5, z + sz * (d * 0.5 + 0.11));
      capZ.castShadow = true;
      capZ.receiveShadow = true;
      parent.add(capZ);
    }
    for (const sx of [-1, 1]) {
      const capX = new THREE.Mesh(new THREE.BoxGeometry(rimT, rimH, d + 0.02), stoneCopingMat);
      capX.position.set(x + sx * (w * 0.5 + 0.11), h + rimH * 0.5, z);
      capX.castShadow = true;
      capX.receiveShadow = true;
      parent.add(capX);
    }
    // Recessed dark bark-mulch soil bed flush inside the stone coping (above outerWall top so organic dark mulch is cleanly visible!)
    const mulchBed = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.06, d - 0.04), soilMat);
    mulchBed.position.set(x, h + 0.014, z);
    mulchBed.receiveShadow = true;
    parent.add(mulchBed);
  }

  // Rich 6-species tropical understory (Monstera Deliciosa + Elephant-Ear Alocasia + Cascading Ferns + Bromeliad Star Rosettes + Calathea + Dwarf Palms — ZERO cloned red-cone sticks!)
  const monBladeGeo = createArchedFrondGeo(0.58, 0.78, 0.26);
  const eleBladeGeo = createArchedFrondGeo(0.68, 0.94, 0.20);
  const fernBladeGeo = createArchedFrondGeo(0.48, 0.98, 0.40);
  const bromLeafGeo = createArchedFrondGeo(0.18, 0.44, 0.22);
  const stemMat = new THREE.MeshStandardMaterial({ color: '#2d5a27', roughness: 0.76 });
  const bromCoralMat = new THREE.MeshStandardMaterial({ color: '#c83e3b', roughness: 0.48, side: THREE.DoubleSide });
  const bromAmberMat = new THREE.MeshStandardMaterial({ color: '#d97724', roughness: 0.46, side: THREE.DoubleSide });
  const bromPlumMat = new THREE.MeshStandardMaterial({ color: '#6b2944', roughness: 0.52, side: THREE.DoubleSide });
  const riverStoneMat = new THREE.MeshStandardMaterial({ color: '#4c4943', roughness: 0.84, metalness: 0.04 });

  function populateTropicalUnderstory(parent, cx, cz, w, d, baseY, seed, { includePalms = true, stepX = 0.75 } = {}) {
    const cols = Math.max(4, Math.floor(w / stepX));
    const rows = d < 2.2 ? 2 : 3;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const idx = c * rows + r + seed;
        const px = cx - w * 0.42 + (c / Math.max(1, cols - 1)) * (w * 0.84) + Math.sin(idx * 2.1) * 0.16;
        const pz = cz - d * 0.34 + (r / Math.max(1, rows - 1)) * (d * 0.68) + Math.cos(idx * 1.7) * 0.14;
        const kind = idx % 6;
        if (kind === 0) {
          // Lush wide arching Monstera Deliciosa cluster
          for (let lf = 0; lf < 5; lf++) {
            const ang = (lf / 5) * Math.PI * 2 + idx * 0.7;
            const leaf = new THREE.Mesh(monBladeGeo, botMats.monsteraLeaf);
            leaf.position.set(px, baseY + 0.22 + (lf % 3) * 0.14, pz);
            leaf.rotation.set(-0.24 + (lf % 2) * 0.20, ang, Math.sin(idx + lf) * 0.18);
            leaf.scale.setScalar(0.82 + ((idx + lf) % 3) * 0.18);
            leaf.castShadow = true;
            parent.add(leaf);
          }
        } else if (kind === 1) {
          // Broad glossy veined Elephant-Ear Alocasia cluster
          for (let lf = 0; lf < 4; lf++) {
            const ang = (lf / 4) * Math.PI * 2 + idx * 0.9;
            const stemH = 0.42 + (lf % 3) * 0.16;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.024, stemH, 6), stemMat);
            stem.position.set(px + Math.cos(ang) * 0.09, baseY + stemH * 0.5, pz + Math.sin(ang) * 0.09);
            const ear = new THREE.Mesh(eleBladeGeo, botMats.elephantEarLeaf);
            ear.position.set(px + Math.cos(ang) * 0.12, baseY + stemH + 0.04, pz + Math.sin(ang) * 0.12);
            ear.rotation.set(-0.32 + (lf % 2) * 0.14, ang, 0);
            ear.scale.setScalar(0.82 + (lf % 2) * 0.22);
            ear.castShadow = true;
            parent.add(stem, ear);
          }
        } else if (kind === 2) {
          // Layered Tropical Bromeliad Star Rosette (natural arching colorful strappy bracts — ZERO stick-on-cone blobs!)
          const bMat = idx % 3 === 0 ? bromCoralMat : idx % 3 === 1 ? bromAmberMat : bromPlumMat;
          for (let fn = 0; fn < 6; fn++) {
            const ang = (fn / 6) * Math.PI * 2 + idx * 0.5;
            const frond = new THREE.Mesh(fernBladeGeo, fn % 2 === 0 ? botMats.frondDeep : botMats.frondWarm);
            frond.position.set(px, baseY + 0.12, pz);
            frond.rotation.set(-0.22 + (fn % 2) * 0.14, ang, 0);
            frond.scale.setScalar(0.76 + (fn % 3) * 0.14);
            parent.add(frond);
          }
          for (let br = 0; br < 7; br++) {
            const ba = (br / 7) * Math.PI * 2 + idx;
            const petal = new THREE.Mesh(bromLeafGeo, bMat);
            petal.position.set(px, baseY + 0.22 + (br % 2) * 0.06, pz);
            petal.rotation.set(-0.48 + (br % 2) * 0.16, ba, 0);
            petal.scale.setScalar(0.85 + (br % 2) * 0.22);
            parent.add(petal);
          }
        } else if (kind === 3) {
          // Cascading Boston & Bird's-Nest Fern Mound spilling softly over limestone coping rims!
          for (let fn = 0; fn < 7; fn++) {
            const ang = (fn / 7) * Math.PI * 2 + idx * 0.4;
            const frond = new THREE.Mesh(fernBladeGeo, fn % 2 === 0 ? botMats.frondWarm : botMats.frondDeep);
            frond.position.set(px, baseY + 0.16 + (fn % 2) * 0.08, pz);
            frond.rotation.set(-0.10 + (fn % 3) * 0.18, ang, 0);
            frond.scale.setScalar(0.92 + (fn % 3) * 0.16);
            frond.castShadow = true;
            parent.add(frond);
          }
        } else if (kind === 4) {
          // Multi-stem Tropical Dwarf Palm Fan Cluster + mossy river stone accent
          for (let st = 0; st < 3; st++) {
            const sa = (st / 3) * Math.PI * 2 + idx;
            const pH = 0.58 + (st % 2) * 0.24;
            const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, pH, 6), botMats.crownshaftMat);
            cane.position.set(px + Math.cos(sa) * 0.10, baseY + pH * 0.5, pz + Math.sin(sa) * 0.10);
            cane.rotation.z = Math.cos(sa) * 0.12;
            parent.add(cane);
            for (let fl = 0; fl < 4; fl++) {
              const fa = (fl / 4) * Math.PI * 2 + sa;
              const frond = new THREE.Mesh(fernBladeGeo, fl % 2 === 0 ? botMats.frondDeep : botMats.frondWarm);
              frond.position.set(px + Math.cos(sa) * 0.12, baseY + pH, pz + Math.sin(sa) * 0.12);
              frond.rotation.set(-0.34, fa, 0);
              frond.scale.setScalar(0.86);
              parent.add(frond);
            }
          }
          const cob = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 1), riverStoneMat);
          cob.scale.set(1.3, 0.55, 1.1);
          cob.position.set(px + 0.18, baseY + 0.04, pz - 0.12);
          parent.add(cob);
        } else {
          // Mixed Monstera & Ferns + occasional taller canopy palm strictly in deep beds!
          for (let fn = 0; fn < 5; fn++) {
            const ang = (fn / 5) * Math.PI * 2 + idx * 1.1;
            const leaf = new THREE.Mesh(fn % 2 === 0 ? monBladeGeo : fernBladeGeo, fn % 2 === 0 ? botMats.monsteraLeaf : botMats.frondWarm);
            leaf.position.set(px, baseY + 0.18 + (fn % 2) * 0.08, pz);
            leaf.rotation.set(-0.24, ang, 0);
            leaf.scale.setScalar(0.86 + (fn % 2) * 0.16);
            leaf.castShadow = true;
            parent.add(leaf);
          }
          if (includePalms && c % 2 === 0 && r === 1) {
            const palm = createTropicalPlant(1.06 + (c % 2) * 0.22, 1.85 + (c % 3) * 0.75, 13, (seed + c) * 0.03, false);
            palm.position.set(px, baseY, pz);
            parent.add(palm);
          }
        }
      }
    }
  }

  // Keep central skylight well (x: 21.3..54.7, z: -10.2..+10.2) open & pull foreground palms cleanly inward
  const gardenBeds = [
    { x: 24, z: -22.2, w: 15, d: 7.4 },
    { x: 46, z: -22.2, w: 16, d: 7.4 },
    { x: 24, z: 22.5, w: 14, d: 6.5 },
    { x: 46, z: 22.5, w: 16, d: 6.5 },
    { x: 16.4, z: -6.4, w: 5.4, d: 5.6 },
    { x: 34.5, z: -9.8, w: 18.0, d: 2.3 },
    { x: 52.0, z: 21.5, w: 10.0, d: 5.2 }
  ];
  for (let bIdx = 0; bIdx < gardenBeds.length; bIdx++) {
    const bed = gardenBeds[bIdx];
    buildArchitecturalPlanter(gardenGroup, bed.x, bed.z, bed.w, bed.d, 0.46);
    const isNarrowStrip = bed.d < 3.0;
    const isFrontRightBed = bIdx === 4;
    populateTropicalUnderstory(gardenGroup, bed.x, bed.z, bed.w, bed.d, 0.42, bIdx * 17 + 3, {
      includePalms: !isNarrowStrip && !isFrontRightBed,
      stepX: isNarrowStrip ? 0.95 : 1.15
    });
    for (let st = 0; st < Math.max(3, Math.floor(bed.w / 3.2)); st++) {
      const sx = bed.x - bed.w * 0.36 + st * 2.8;
      const stone = new THREE.Mesh(createOrganicBoulderGeo(0.32 + (st % 2) * 0.12, (bIdx + 1) * 7 + st), botMats.mossKarst);
      stone.scale.set(1.25, 0.58, 1.05);
      stone.position.set(sx, 0.44, bed.z + (bed.z < -13 ? bed.d * 0.30 : -bed.d * 0.30));
      gardenGroup.add(stone);
    }
  }

  // Architectural Open Slatted Warm Sunlit Cedar-Teak Sunset Pergola (uncrushed warm wood PBR + grounded entry steps + dramatic golden volumetric sunbeams!)
  const darkTeakPergolaMat = new THREE.MeshStandardMaterial({
    color: '#be8555',
    map: bridgeTeakMaps.map,
    normalMap: bridgeTeakMaps.normalMap,
    normalScale: new THREE.Vector2(0.78, 0.78),
    emissive: '#3d2210',
    emissiveIntensity: 0.16,
    roughness: 0.48,
    metalness: 0.04,
    envMapIntensity: 0.85
  });
  const matteSteelBaseMat = new THREE.MeshStandardMaterial({ color: '#39414e', roughness: 0.50, metalness: 0.58 });
  const edisonAmberMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.58, 1.15, 0.52) });
  const entryRiserAmberMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.62, 0.28) });
  const edisonCordMat = new THREE.MeshStandardMaterial({ color: '#1f232b', roughness: 0.8 });

  // Dry weathered matte Malaysian outdoor merbau hardwood deck PBR (ZERO roughnessMap reflection spike, matte 0.96 -> ZERO wet-plastic stripe!)
  const weatheredRoofTeakMat = new THREE.MeshStandardMaterial({
    color: '#b6895e',
    map: bridgeTeakMaps.map,
    normalMap: bridgeTeakMaps.normalMap,
    normalScale: new THREE.Vector2(1.05, 1.05),
    emissive: '#2e1a0b',
    emissiveIntensity: 0.01,
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.05
  });
  const pergolaDeck = new THREE.Mesh(new THREE.BoxGeometry(22.5, 0.14, 4.35), weatheredRoofTeakMat);
  pergolaDeck.position.set(31.5, 0.07, -13.78);
  pergolaDeck.receiveShadow = true;
  // Grounded Double-Bevel Limestone & Dark-Granite Entry Step seated flush into deck (ZERO hovering slab edges!)
  const entryCurbBase = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.07, 4.78), matteSteelBaseMat);
  entryCurbBase.position.set(19.86, 0.035, -13.78);
  entryCurbBase.receiveShadow = true;
  const entryStep1 = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.055, 4.62), stoneCopingMat);
  entryStep1.position.set(20.00, 0.088, -13.78);
  entryStep1.castShadow = true;
  entryStep1.receiveShadow = true;
  const entryLedRiser = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 4.25), entryRiserAmberMat);
  entryLedRiser.position.set(20.23, 0.115, -13.78);
  gardenGroup.add(pergolaDeck, entryCurbBase, entryStep1, entryLedRiser);

  // Lush Foreground Architectural Limestone Planter Beds with Recessed Bark Mulch & Dense Multi-Layer Tropical Understory!
  for (let fpIdx = 0; fpIdx < 3; fpIdx++) {
    const [fpx, fpz, fpw, fpd] = [
      [16.8, -17.2, 4.8, 1.8],
      [16.6, -9.8, 4.4, 1.7],
      [22.4, -17.6, 5.2, 1.6]
    ][fpIdx];
    buildArchitecturalPlanter(gardenGroup, fpx, fpz, fpw, fpd, 0.44);
    populateTropicalUnderstory(gardenGroup, fpx, fpz, fpw, fpd, 0.40, 100 + fpIdx * 19, {
      includePalms: false,
      stepX: 0.68
    });
  }

  // Longitudinal carrying stringer beams & 10 open shadow-casting slats cleanly inset > 0.55m clear of skylight parapet!
  for (const zBeam of [-15.8, -11.75]) {
    const carrier = new THREE.Mesh(new THREE.BoxGeometry(18.6, 0.24, 0.18), darkTeakPergolaMat);
    carrier.position.set(31.3, 3.28, zBeam);
    carrier.castShadow = true;
    carrier.receiveShadow = true;
    gardenGroup.add(carrier);
  }
  for (let s = 0; s < 10; s++) {
    const sz = -15.7 + (s / 9) * 3.9;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.14, 0.11), darkTeakPergolaMat);
    slat.position.set(31.2, 3.52, sz);
    slat.castShadow = true;
    slat.receiveShadow = true;
    gardenGroup.add(slat);
  }

  // Dramatic Sun-Aligned Golden-Hour Crepuscular Shafts streaming cleanly from the LEFT through the cedar pergola slats!
  const sunsetRayMat = createVolumetricGodRayMaterial('#ffb65c', 0.36);
  for (let r = 0; r < 6; r++) {
    const rx = 22.2 + r * 3.3;
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 2.75, 6.8, 16, 1, true), sunsetRayMat);
    ray.position.set(rx, 2.15, -14.4 + (r % 2) * 0.42);
    ray.rotation.z = 0.24;
    ray.rotation.x = 0.72;
    gardenGroup.add(ray);
  }
  // Warm Edison lantern ambient pool illuminating the timber pergola walkway planks!
  const pergolaWalkGlow = new THREE.PointLight('#ffb868', 11, 18, 1.6);
  pergolaWalkGlow.position.set(29.5, 2.6, -13.78);
  gardenGroup.add(pergolaWalkGlow);

  const pergolaVineGeo = createDrapedVineGeo(1.25, 1.85, 1.7);
  const topCreepGeo = createDrapedVineGeo(1.85, 2.65, 2.9);
  for (let px = 22.0; px <= 40.0; px += 3.0) {
    for (const pz of [-15.8, -11.75]) {
      const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.34), matteSteelBaseMat);
      basePlate.position.set(px, 0.14, pz);
      basePlate.castShadow = true;
      basePlate.receiveShadow = true;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.20, 3.16, 0.20), darkTeakPergolaMat);
      post.position.set(px, 1.72, pz);
      post.castShadow = true;
      post.receiveShadow = true;
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.14), darkTeakPergolaMat);
      brace.position.set(px, 2.96, pz + (pz < -13.78 ? 0.26 : -0.26));
      brace.rotation.x = pz < -13.78 ? -Math.PI * 0.25 : Math.PI * 0.25;
      brace.castShadow = true;
      gardenGroup.add(basePlate, post, brace);
    }
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 4.65), darkTeakPergolaMat);
    crossBeam.position.set(px, 3.36, -13.78);
    crossBeam.castShadow = true;
    gardenGroup.add(crossBeam);

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), edisonCordMat);
    cord.position.set(px, 3.14, -13.78);
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.08, 8), matteSteelBaseMat);
    socket.position.set(px, 2.94, -13.78);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), edisonAmberMat);
    bulb.position.set(px, 2.84, -13.78);
    gardenGroup.add(cord, socket, bulb);

    if (Math.round(px) % 3 === 0 && px < 40.0) {
      const boll = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.16), darkTeakPergolaMat);
      boll.position.set(px + 1.5, 0.36, px % 6 === 0 ? -11.92 : -15.65);
      boll.castShadow = true;
      const bGlass = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), edisonAmberMat);
      bGlass.position.set(px + 1.5, 0.64, px % 6 === 0 ? -11.92 : -15.65);
      const bCap = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.05, 0.20), matteSteelBaseMat);
      bCap.position.set(px + 1.5, 0.73, px % 6 === 0 ? -11.92 : -15.65);
      gardenGroup.add(boll, bGlass, bCap);
    }

    if (px < 40.0) {
      const vL = new THREE.Mesh(pergolaVineGeo, botMats.floweringVine);
      vL.position.set(px + 1.45, 2.66, -15.62);
      vL.rotation.y = 0.08;
      const vR = new THREE.Mesh(pergolaVineGeo, Math.round(px) % 2 === 0 ? botMats.hangingVine : botMats.floweringVine);
      vR.position.set(px + 1.55, 2.70, -11.92);
      vR.rotation.y = Math.PI - 0.08;
      const topCreep = new THREE.Mesh(topCreepGeo, botMats.floweringVine);
      topCreep.rotation.x = Math.PI / 2;
      topCreep.position.set(px + 1.5, 3.62, Math.round(px) % 6 === 0 ? -15.1 : -12.3);
      gardenGroup.add(vL, vR, topCreep);
    }
  }

  // Stone-Rimmed Lotus Mirror Pond (x=59.0, z=12.5, r=4.6 — 100% CLEAR of Rainforest skylight!)
  // Flanked by Slatted Hardwood Rooftop Benches & Multi-Petal Lotus Rosettes!
  const lotusGroup = new THREE.Group();
  lotusGroup.position.set(59.0, 0, 12.5);
  const stoneRim = new THREE.Mesh(new THREE.TorusGeometry(4.65, 0.34, 10, 36), new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.80 }));
  stoneRim.rotation.x = Math.PI / 2;
  stoneRim.position.y = 0.24;
  const lotusWater = new THREE.Mesh(new THREE.CircleGeometry(4.52, 36), koiWaterMat);
  lotusWater.rotation.x = -Math.PI / 2;
  lotusWater.position.y = 0.22;
  const fountBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.78, 1.15, 16), brassMat);
  fountBase.position.y = 0.58;
  const fountBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.45, 0.28, 16), brassMat);
  fountBowl.position.y = 1.18;
  // Graceful curved parabolic translucent water-jet arcs & frothy center plume (replaces floating white spheres!)
  const sprayMat = new THREE.MeshPhysicalMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.52, roughness: 0.12, depthWrite: false });
  const centerPlume = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.34, 0.65, 12), sprayMat);
  centerPlume.position.y = 1.52;
  lotusGroup.add(centerPlume);
  for (let sp = 0; sp < 8; sp++) {
    const sa = (sp / 8) * Math.PI * 2;
    const arcPts = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      const rad = 0.18 + t * 1.35;
      const yy = 1.32 + Math.sin(t * Math.PI) * 0.72 - t * 1.08;
      arcPts.push(new THREE.Vector3(Math.cos(sa) * rad, Math.max(0.24, yy), Math.sin(sa) * rad));
    }
    const jet = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 12, 0.026, 6, false), sprayMat);
    lotusGroup.add(jet);
  }
  lotusGroup.add(stoneRim, lotusWater, fountBase, fountBowl);

  const padMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.48 });
  const blossomMat = new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.42, side: THREE.DoubleSide });
  const lotusCenterMat = new THREE.MeshStandardMaterial({ color: '#fde047', roughness: 0.4 });
  for (let lp = 0; lp < 16; lp++) {
    const a = (lp / 16) * Math.PI * 2;
    const r = 1.6 + (lp % 3) * 0.95;
    const px = Math.cos(a) * r;
    const pz = Math.sin(a) * r;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 14), padMat);
    pad.position.set(px, 0.25, pz);
    lotusGroup.add(pad);
    if (lp % 2 === 0) {
      // Multi-petal lotus rosette (replaces chunky pink icosahedrons!)
      const cen = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), lotusCenterMat);
      cen.position.set(px, 0.31, pz);
      lotusGroup.add(cen);
      for (let pt = 0; pt < 6; pt++) {
        const pa = (pt / 6) * Math.PI * 2;
        const pet = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.16), blossomMat);
        pet.position.set(px + Math.cos(pa) * 0.10, 0.31, pz + Math.sin(pa) * 0.10);
        pet.rotation.y = pa;
        pet.rotation.x = -0.35;
        lotusGroup.add(pet);
      }
    }
  }
  // Slatted Hardwood Rooftop Benches & Compact Orchid Planters cleanly offset from bench seats (UR-02!)
  for (const [bx, bz, rot] of [[-5.8, -3.5, 0.45], [-5.8, 3.8, -0.45], [5.8, -3.5, -0.45]]) {
    const bench = createSlattedBench(2.4, woodPergolaMat, archMetalMat);
    bench.position.set(bx, 0, bz);
    bench.rotation.y = rot;
    const planter = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 1.3), new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.8 }));
    planter.position.set(bx * 0.92, 0.21, bz + (bz > 0 ? 2.6 : -2.6));
    const orchid = createTropicalPlant(0.42, 0.20, 6, 0.05, true);
    orchid.position.set(bx * 0.92, 0.42, bz + (bz > 0 ? 2.6 : -2.6));
    lotusGroup.add(bench, planter, orchid);
  }
  gardenGroup.add(lotusGroup);

  // Planted Geodesic Botanical Conservatory Dome (x=59, z=-12) — STRICTLY UPPER HEMISPHERE (ZERO dipping into 4F-02 GSC!) + OPEN GLASS PORTAL!
  {
    const consGroup = new THREE.Group();
    consGroup.position.set(59, 0, -12);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(5.1, 5.3, 0.48, 28), new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.75 }));
    plinth.position.y = 0.24;
    const innerSoil = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.52, 28), soilMat);
    innerSoil.position.y = 0.26;
    // STRICTLY UPPER HEMISPHERE (phi 0..2PI, theta 0..PI/2) -> sits ONLY above y = 37.45, ZERO bleed below UR floor slab!
    const hemiGeo = new THREE.SphereGeometry(4.9, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const geoDome = new THREE.Mesh(
      hemiGeo,
      new THREE.MeshPhysicalMaterial({ color: '#a7f3d0', transparent: true, opacity: 0.26, roughness: 0.14, flatShading: true, side: THREE.DoubleSide, depthWrite: false })
    );
    geoDome.position.y = 0.45;
    const wireDome = new THREE.Mesh(
      new THREE.SphereGeometry(4.94, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: '#786248', roughness: 0.45, metalness: 0.55, wireframe: true })
    );
    wireDome.position.y = 0.45;

    // OPEN 3-Piece Brushed Silver-Steel Portal Arch + Clear Glass Doorway + Warm Interior Uplight!
    const brushedSilverMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.24, metalness: 0.82 });
    for (const pz of [-1.25, 1.25]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.75, 0.22), brushedSilverMat);
      jamb.position.set(-4.95, 1.375, pz);
      consGroup.add(jamb);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.30, 2.8), brushedSilverMat);
    lintel.position.set(-4.95, 2.75, 0);
    const entryGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 2.55),
      new THREE.MeshPhysicalMaterial({ color: '#d1fae5', transparent: true, opacity: 0.20, roughness: 0.08, side: THREE.DoubleSide, depthWrite: false })
    );
    entryGlass.rotation.y = -Math.PI / 2;
    entryGlass.position.set(-4.95, 1.32, 0);
    const entrySign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.65),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('UR603A CONSERVATORY', 'TROPICAL ORCHIDS & FERNS', '#064e3b', '#ffffff', '#34d399') })
    );
    entrySign.rotation.y = -Math.PI / 2;
    entrySign.position.set(-5.12, 3.05, 0);

    // Warm glowing interior uplight & orchid display rack visible through open glass portal!
    const innerGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.14, 16), new THREE.MeshBasicMaterial({ color: '#fef08a' }));
    innerGlow.position.set(0, 0.56, 0);

    // Slatted Garden Benches, Warm Path Bollards & 2 Articulated Visitors admiring the Conservatory!
    for (const bz of [-4.2, 4.2]) {
      const gb = createSlattedBench(2.3, woodPergolaMat, archMetalMat);
      gb.position.set(-7.2, 0, bz);
      gb.rotation.y = bz < 0 ? 0.3 : -0.3;
      const bol = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.75, 8), archMetalMat);
      bol.position.set(-5.8, 0.375, bz * 0.65);
      const bolLamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), fairyBulbMat);
      bolLamp.position.set(-5.8, 0.78, bz * 0.65);
      consGroup.add(gb, bol, bolLamp);
    }
    const cVis1 = createArticulatedPerson({ shirt: '#0ea5e9', pants: '#1e293b' });
    cVis1.position.set(-7.5, 0, -1.6);
    cVis1.rotation.y = Math.PI * 0.42;
    const cVis2 = createArticulatedPerson({ shirt: '#f43f5e', pants: '#334155' });
    cVis2.position.set(-6.8, 0, 2.1);
    cVis2.rotation.y = Math.PI * 0.62;
    consGroup.add(plinth, innerSoil, geoDome, wireDome, lintel, entryGlass, entrySign, innerGlow, cVis1, cVis2);

    for (let ip = 0; ip < 7; ip++) {
      const a = (ip / 7) * Math.PI * 2;
      const p = createTropicalPlant(0.75, ip === 0 ? 1.8 : 0.7, 7, ip * 0.03, true);
      p.position.set(ip === 0 ? 0 : Math.cos(a) * 2.2, 0.48, ip === 0 ? 0 : Math.sin(a) * 2.2);
      consGroup.add(p);
    }
    gardenGroup.add(consGroup);
  }

  // B. UR602 PADANG @ 1U ROOFTOP FUTSAL PITCH (3D Netted Goals, Futsal Ball, 4 Jersey Players & Unobstructed Gantry Sign!)
  // Place gantry cleanly at West pitch entry (x=76, z=-12) facing West/camera so net NEVER cuts text!
  addRoofArchway(76.2, -12.0, Math.PI / 2, 'ROOFTOP FUTSAL', 'UR602', 'PADANG @ 1U', '#22c55e');
  {
    const pitchGroup = new THREE.Group();
    pitchGroup.position.set(89, 0.03, -12);
    const futsalTex = createSportsFieldTexture('futsal');
    const turf = new THREE.Mesh(new THREE.BoxGeometry(24, 0.08, 14.5), new THREE.MeshStandardMaterial({ map: futsalTex, roughness: 0.78 }));
    pitchGroup.add(turf);

    for (const cx of [-12, 0, 12]) {
      for (const cz of [-7.25, 7.25]) {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 4.6, 8), archMetalMat);
        mast.position.set(cx, 2.3, cz);
        pitchGroup.add(mast);
        if (cx !== 0) {
          const flood = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.25), new THREE.MeshBasicMaterial({ color: '#fffbeb' }));
          flood.position.set(cx, 4.65, cz);
          pitchGroup.add(flood);
        }
      }
    }
    const netN = new THREE.Mesh(new THREE.PlaneGeometry(24, 3.6), perfNetMat);
    netN.position.set(0, 1.8, -7.25);
    const netS = netN.clone();
    netS.position.z = 7.25;
    const netE = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 3.6), perfNetMat);
    netE.rotation.y = Math.PI / 2;
    netE.position.set(12, 1.8, 0);
    pitchGroup.add(netN, netS, netE);

    // Complete 3D Goal Frames WITH Rear Stanchions & White Diamond Goal Nets!
    const goalMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 });
    for (const dir of [-1, 1]) {
      const gx = dir * 10.6;
      const depth = dir * 1.15;
      const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), goalMat);
      topBar.rotation.x = Math.PI / 2;
      topBar.position.set(gx, 2.05, 0);
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 8), goalMat);
      p1.position.set(gx, 1.05, -1.6);
      const p2 = p1.clone();
      p2.position.z = 1.6;
      // Rear stanchion bars & draped goal net panels!
      const rearTop = topBar.clone();
      rearTop.position.set(gx + depth, 2.0, 0);
      const rearBackNet = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.05), perfNetMat);
      rearBackNet.rotation.y = Math.PI / 2;
      rearBackNet.position.set(gx + depth, 1.02, 0);
      const netRoof = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(depth), 3.2), perfNetMat);
      netRoof.rotation.x = Math.PI / 2;
      netRoof.position.set(gx + depth * 0.5, 2.04, 0);
      const sideNetL = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(depth), 2.05), perfNetMat);
      sideNetL.position.set(gx + depth * 0.5, 1.02, -1.6);
      const sideNetR = sideNetL.clone();
      sideNetR.position.z = 1.6;
      pitchGroup.add(topBar, p1, p2, rearTop, rearBackNet, netRoof, sideNetL, sideNetR);
    }
    // Futsal ball + 4 opposing jersey players + digital scoreboard on far end!
    const fBall = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 }));
    fBall.position.set(0.5, 0.22, -0.4);
    pitchGroup.add(fBall);
    const fPlayers = [[-3.5, -1.8, '#dc2626', 1.2], [2.8, 1.6, '#2563eb', -1.8], [-0.6, 2.4, '#dc2626', 0.5], [5.5, -2.2, '#2563eb', -2.4]];
    for (const [fx, fz, kit, rot] of fPlayers) {
      const fp = createArticulatedPerson({ shirt: kit, pants: '#0f172a' });
      fp.position.set(fx, 0.04, fz);
      fp.rotation.y = rot;
      pitchGroup.add(fp);
    }
    const scoreBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 1.15, 3.8),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('PADANG @ 1U • LIVE', 'RED 3  —  BLUE 2   •   12:40', '#0f172a', '#ffffff', '#22c55e') })
    );
    scoreBoard.position.set(11.9, 3.8, 0);
    pitchGroup.add(scoreBoard);
    gardenGroup.add(pitchGroup);
  }

  // C. UR603 BASEBALL CAGE @ 1 UTAMA (Raised Metallic Truss, Lane Divider Nets, Strike-Zone Targets, Pentagon Plates & Batters!)
  addRoofArchway(76.2, 16.5, Math.PI / 2, 'BATTING CAGES', 'UR603', 'BASEBALL @ 1U', '#f97316');
  {
    const cageGroup = new THREE.Group();
    cageGroup.position.set(89, 0.03, 16.5);
    const baseTurf = new THREE.Mesh(new THREE.BoxGeometry(22, 0.08, 12), new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.78 }));
    const clayBox = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.10, 10.5), new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.85 }));
    clayBox.position.x = -7.5;
    cageGroup.add(baseTurf, clayBox);

    const strikeTex = createStrikeZoneTexture();
    const strikeMat = new THREE.MeshBasicMaterial({ map: strikeTex });
    // Authentic Pentagon Home Plates + White Batter Box Lines + Wheeled Pitching Machines + Strike-Zone Targets + Batters!
    for (let b = -1; b <= 1; b++) {
      const bz = b * 3.6;
      // Pentagon home plate shape
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 5), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 }));
      plate.position.set(-7.5, 0.09, bz);
      // Chalk batter box outline
      const boxBorder = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 2.3), new THREE.MeshBasicMaterial({ color: '#e2e8f0', wireframe: true }));
      boxBorder.position.set(-7.5, 0.10, bz);
      // Wheeled pitching machine + L-screen
      const machineBody = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.52), new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.35 }));
      machineBody.position.set(8.2, 0.92, bz);
      const machineStand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.32, 0.65, 8), archMetalMat);
      machineStand.position.set(8.2, 0.34, bz);
      const target = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 2.3, 2.5),
        [strikeMat, strikeMat, archMetalMat, archMetalMat, archMetalMat, archMetalMat]
      );
      target.position.set(10.5, 1.35, bz);
      cageGroup.add(plate, boxBorder, machineBody, machineStand, target);

      // Grounded Articulated Batter wearing batting helmet & holding aluminum bat in lanes 0 and 1!
      if (b !== -1) {
        const bat = createArticulatedPerson({
          shirt: b === 0 ? '#1d4ed8' : '#dc2626',
          pants: '#cbd5e1',
          helmet: '#0f172a',
          prop: 'bat'
        });
        bat.position.set(-7.3, 0.10, bz - 0.55);
        bat.rotation.y = Math.PI * 0.35;
        cageGroup.add(bat);
      }
    }
    // Translucent lane divider nets separating lanes 1-3!
    for (const dz of [-1.8, 1.8]) {
      const divNet = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.8), perfNetMat);
      divNet.position.set(0, 1.95, dz);
      cageGroup.add(divNet);
    }

    // Metallic high-clearance steel truss frames (y = 4.4m — ZERO black bar slicing camera view!)
    for (const px of [-11, 0, 11]) {
      for (const pz of [-6, 6]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.4, 8), archMetalMat);
        post.position.set(px, 2.2, pz);
        cageGroup.add(post);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 12.2), archMetalMat);
      beam.position.set(px, 4.4, 0);
      cageGroup.add(beam);
    }
    const meshSide = new THREE.Mesh(new THREE.PlaneGeometry(22, 4.2), perfNetMat);
    meshSide.position.set(0, 2.1, 6);
    const meshBack = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.2), perfNetMat);
    meshBack.rotation.y = Math.PI / 2;
    meshBack.position.set(11, 2.1, 0);
    cageGroup.add(meshSide, meshBack);
    gardenGroup.add(cageGroup);
  }

  // D. UR601 ASCARO PADEL PANORAMIC COURTS (Archway offset to x=121.5 — 5.5m CLEAR of escalator ending at x=116!)
  addRoofArchway(121.5, -21.5, Math.PI / 2, 'PANORAMIC PADEL', 'UR601', 'ASCARO SOCIAL CLUB', '#38bdf8');
  {
    const padelTex = createSportsFieldTexture('padel');
    const padelCourtMat = new THREE.MeshStandardMaterial({ map: padelTex, roughness: 0.62 });
    const padelGlass = new THREE.MeshPhysicalMaterial({ color: '#bae6fd', transparent: true, opacity: 0.24, roughness: 0.14, depthWrite: false });

    for (const [cx, cz] of [[133, -21.5], [154, -21.5]]) {
      const pg = new THREE.Group();
      pg.position.set(cx, 0.03, cz);
      const court = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.08, 9.6), padelCourtMat);

      const net = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 0.96), perfNetMat);
      net.rotation.y = Math.PI / 2;
      net.position.y = 0.52;
      const netPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.05, 8), archMetalMat);
      netPost1.position.set(0, 0.52, -4.75);
      const netPost2 = netPost1.clone();
      netPost2.position.z = 4.75;

      for (const fx of [-9.25, 0, 9.25]) {
        for (const fz of [-4.8, 4.8]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 0.12), archMetalMat);
          post.position.set(fx, 1.7, fz);
          pg.add(post);
        }
      }
      for (const lx of [-4.5, 4.5]) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.35), new THREE.MeshBasicMaterial({ color: '#fffbeb' }));
        lamp.position.set(lx, 4.5, -4.8);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 4.5, 8), archMetalMat);
        pole.position.set(lx, 2.25, -4.8);
        pg.add(lamp, pole);
      }

      const gBack1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 9.6), padelGlass);
      gBack1.position.set(-9.25, 1.6, 0);
      const gBack2 = gBack1.clone();
      gBack2.position.x = 9.25;
      pg.add(court, net, netPost1, netPost2, gBack1, gBack2);

      // Active Articulated Padel Players with Rackets + Yellow Padel Ball on Court 1!
      if (cx === 133) {
        const pBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: '#fde047' }));
        pBall.position.set(0.8, 1.35, 0.4);
        pg.add(pBall);
        for (const [px, pz, shirt] of [[-4.2, -1.6, '#f8fafc'], [-4.2, 2.0, '#38bdf8'], [4.2, -1.2, '#f43f5e'], [4.2, 2.1, '#facc15']]) {
          const pp = createArticulatedPerson({ shirt, pants: '#1e293b', prop: 'racket' });
          pp.position.set(px, 0.04, pz);
          pp.rotation.y = px < 0 ? Math.PI / 2 : -Math.PI / 2;
          pg.add(pp);
        }
      }
      gardenGroup.add(pg);
    }

    // E. ASCARO SUNSET SOCIAL CLUB DECK (x=136, z=21.5 — Backlit Sunset Lounge Sign, Bar Stools, Drinks, Edison Lights & Patrons!)
    const loungeGroup = new THREE.Group();
    loungeGroup.position.set(136, 0.04, 21.5);
    const deckMat = new THREE.MeshStandardMaterial({ map: bridgeTeakMaps.map, roughness: 0.78, metalness: 0.02 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(28, 0.16, 8.6), deckMat);
    loungeGroup.add(deck);

    // Pergola Cocktail Bar Pavilion + Backlit UR601 ASCARO SUNSET LOUNGE Fascia Sign!
    const barCounter = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.12, 1.6), new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.52 }));
    barCounter.position.set(-7.5, 0.64, 1.6);
    const barTop = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.1, 1.85), new THREE.MeshStandardMaterial({ color: '#e7e5e4', roughness: 0.48 }));
    barTop.position.set(-7.5, 1.24, 1.6);
    const barRoof = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.16, 4.2), woodPergolaMat);
    barRoof.position.set(-7.5, 3.45, 1.6);
    const loungeSignMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('UR601 • ASCARO SUNSET LOUNGE', 'COCKTAILS • TAPAS • KL SKYLINE VIEW', '#431407', '#fef3c7', '#fb923c', 1024, 144) });
    const loungeSign = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.84, 0.18), [woodPergolaMat, woodPergolaMat, woodPergolaMat, woodPergolaMat, loungeSignMat, loungeSignMat]);
    loungeSign.position.set(-7.5, 3.65, -0.55);
    for (const bx of [-11.8, -3.2]) {
      for (const bz of [-0.2, 3.4]) {
        const bp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.10, 3.4, 8), archMetalMat);
        bp.position.set(bx, 1.72, bz);
        loungeGroup.add(bp);
      }
    }
    // Bar stools + Articulated Bartender + Hanging Edison String Bulbs + Bottles on Bar Top!
    for (let st = 0; st < 4; st++) {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.72, 10), archMetalMat);
      stool.position.set(-10.2 + st * 1.8, 0.44, 0.15);
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 10), new THREE.MeshStandardMaterial({ color: '#c2410c' }));
      seat.position.set(-10.2 + st * 1.8, 0.82, 0.15);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), fairyBulbMat);
      bulb.position.set(-10.6 + st * 2.0, 3.12, 0.0);
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 8), new THREE.MeshStandardMaterial({ color: st % 2 === 0 ? '#10b981' : '#f59e0b', roughness: 0.2 }));
      bottle.position.set(-9.6 + st * 1.3, 1.42, 1.45);
      loungeGroup.add(stool, seat, bulb, bottle);
    }
    const bartender = createArticulatedPerson({ shirt: '#18181b', pants: '#0f172a' });
    bartender.position.set(-7.5, 0.1, 2.3);
    bartender.rotation.y = Math.PI;
    loungeGroup.add(barCounter, barTop, barRoof, loungeSign, bartender);

    // 3 Cushioned Terracotta Resort Sofas with Backrests, Throw Pillows, Cocktail Glasses, Parasols & Articulated Seated Patrons!
    const sofaMat = new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.72 });
    const pillowMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.65 });
    const parasolMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.68, side: THREE.DoubleSide });
    for (let s = 0; s < 3; s++) {
      const sx = 0.8 + s * 5.2;
      const sofa = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.44, 1.05), sofaMat);
      sofa.position.set(sx, 0.30, 1.4);
      const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.52, 0.24), sofaMat);
      sofaBack.position.set(sx, 0.68, 1.82);
      const pil1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.16), pillowMat);
      pil1.position.set(sx - 0.85, 0.62, 1.60);
      const pil2 = pil1.clone();
      pil2.position.x = sx + 0.85;
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.46, 16), woodPergolaMat);
      table.position.set(sx, 0.31, -0.35);
      const drink = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.18, 8), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
      drink.position.set(sx - 0.2, 0.63, -0.35);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8), woodPergolaMat);
      pole.position.set(sx, 1.45, -0.35);
      const umbrella = new THREE.Mesh(new THREE.ConeGeometry(2.05, 0.58, 12), parasolMat);
      umbrella.position.set(sx, 2.88, -0.35);
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), fairyBulbMat);
      lantern.position.set(sx, 2.55, -0.35);
      const patron = createArticulatedPerson({ shirt: s === 0 ? '#f8fafc' : s === 1 ? '#0284c7' : '#e11d48', sitting: true });
      patron.position.set(sx, 0.08, 1.32);
      patron.rotation.y = Math.PI;
      loungeGroup.add(sofa, sofaBack, pil1, pil2, table, drink, pole, umbrella, lantern, patron);
    }
    gardenGroup.add(loungeGroup);

    // F. EASTERN KL SKYLINE VIEWING DECK (UR-10: Teak Deck, Slatted Benches, Skyline Binoculars, Plaque & Articulated Visitors!)
    const vistaG = new THREE.Group();
    vistaG.position.set(169.5, 0.03, 0);
    const vDeck = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.10, 22.0), deckMat);
    vistaG.add(vDeck);
    for (const vz of [-8.2, 8.2]) {
      const bench = createSlattedBench(3.4, woodPergolaMat, archMetalMat);
      bench.rotation.y = Math.PI / 2;
      bench.position.set(-1.8, 0.05, vz);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.65, 0.85, 18), archMetalMat);
      pot.position.set(1.6, 0.46, vz);
      const palm = createTropicalPlant(0.78, 1.4, 8, 0.02, true);
      palm.position.set(1.6, 0.82, vz);
      vistaG.add(bench, pot, palm);
    }
    const binoPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.10, 1.35, 10), brassMat);
    binoPole.position.set(4.2, 0.72, -3.2);
    const binoHead = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 0.34), brassMat);
    binoHead.position.set(4.2, 1.42, -3.2);
    const vistaStand = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.05, 2.2), archMetalMat);
    vistaStand.position.set(4.2, 0.56, 3.2);
    const vistaPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.62),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('KL SKYLINE VISTA', 'PETRONAS TWIN TOWERS • MENARA KL • MERDEKA 118', '#0f172a', '#fde68a', '#fb923c') })
    );
    vistaPlaque.rotation.y = -Math.PI / 2;
    vistaPlaque.position.set(4.04, 0.82, 3.2);
    vistaG.add(binoPole, binoHead, vistaStand, vistaPlaque);

    for (const [vx, vz, col, prop] of [[2.8, -1.6, '#f8fafc', 'phone'], [2.6, 0.2, '#e11d48', null], [1.5, 4.6, '#38bdf8', null]]) {
      const vg = createArticulatedPerson({ shirt: col, pants: '#1e293b', prop });
      vg.position.set(vx, 0.05, vz);
      vg.rotation.y = Math.PI * 0.52;
      vistaG.add(vg);
    }
    gardenGroup.add(vistaG);

    // G. NORTH-WEST PJ SKYLINE VIEWING TERRACE (Visitor moved cleanly down railing at midground scale — ZERO lens close-up!)
    const nwTerrace = new THREE.Group();
    nwTerrace.position.set(35.5, 0.03, -26.8);
    const nwBench = createSlattedBench(3.0, woodPergolaMat, archMetalMat);
    nwBench.position.set(-4.2, 0, 0.3);
    const nwVis = createArticulatedPerson({ shirt: '#0ea5e9', pants: '#1e293b' });
    nwVis.position.set(-10.5, 0, -1.2);
    nwVis.rotation.y = Math.PI * 0.85;
    nwTerrace.add(nwBench, nwVis);
    for (const bx of [-6.8, -2.5, 2.2]) {
      const bol = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.72, 8), archMetalMat);
      bol.position.set(bx, 0.36, -1.6);
      const bl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), fairyBulbMat);
      bl.position.set(bx, 0.76, -1.6);
      nwTerrace.add(bol, bl);
    }
    gardenGroup.add(nwTerrace);
  }

  interactables.push(
    {
      id: 'ledge-art-gallery',
      position: new THREE.Vector3(86.0, 25.3, -17.0),
      radius: 12.0,
      priority: 3,
      prompt: '[E] Tour 3F The Ledge Contemporary Malaysian Art Gallery (+150 UPoints)',
      actionType: 'art-gallery'
    },
    {
      id: 'camp5-climbing',
      position: new THREE.Vector3(19.5, 31.3, -15.5),
      radius: 9.0,
      priority: 4,
      prompt: '[E] Belay & Climb EZ501 Camp5 24m Lead Bouldering Wall (+200 UPoints)',
      actionType: 'climb-camp5'
    },
    {
      id: 'wangsa-bowl',
      position: new THREE.Vector3(36.0, 31.3, 18.0),
      radius: 9.0,
      priority: 4,
      prompt: '[E] Bowl a Cosmic Strike on EZ401 Wangsa Bowl Lanes 01–04 (+150 UPoints)',
      actionType: 'play-bowling'
    },
    {
      id: 'toy-catcher-claw',
      position: new THREE.Vector3(73.0, 31.3, 18.5),
      radius: 8.5,
      priority: 3,
      prompt: '[E] Play EZ402 Toy Catcher UFO Plush Claw Machine (+100 UPoints)',
      actionType: 'play-claw'
    },
    {
      id: 'diva-karaoke',
      position: new THREE.Vector3(123.5, 31.3, 18.5),
      radius: 8.0,
      priority: 3,
      prompt: '[E] Sing a K-Pop / Mandopop Hit at EZ502 Diva VIP Karaoke (+150 UPoints)',
      actionType: 'play-karaoke'
    },
    {
      id: 'crossfire-maimai',
      position: new THREE.Vector3(148.5, 31.3, 18.5),
      radius: 8.5,
      priority: 3,
      prompt: '[E] Play EZ503 Cross Fire maimai DX PRiSM Rhythm Cabinet (+150 UPoints)',
      actionType: 'play-maimai'
    },
    {
      id: 'evcs457-charger',
      position: new THREE.Vector3(166.5, 31.3, -14.5),
      radius: 8.0,
      priority: 3,
      prompt: '[E] Activate EVCS457 180kW DC Fast EV Supercharger (+100 UPoints)',
      actionType: 'ev-charge'
    },
    {
      id: 'secret-garden-vista',
      position: new THREE.Vector3(31.0, 38.2, -13.5),
      radius: 10.5,
      priority: 4,
      prompt: '[E] Stamp UR603A Secret Garden 500+ Exotic Botanical Species (+250 UPoints)',
      actionType: 'secret-garden-stamp',
      stampId: 'spawn-secret-garden'
    },
    {
      id: 'ur-conservatory',
      position: new THREE.Vector3(54.5, 38.2, -12.0),
      radius: 8.5,
      priority: 4,
      prompt: '[E] Enter UR603A Tropical Orchid Geodesic Conservatory (+150 UPoints)',
      actionType: 'secret-garden-stamp',
      stampId: 'spawn-secret-garden'
    },
    {
      id: 'ur-lotus-pond',
      position: new THREE.Vector3(54.5, 38.2, 12.5),
      radius: 8.5,
      priority: 3,
      prompt: '[E] Admire Secret Garden Lotus Mirror Fountain & Water Lilies (+100 UPoints)',
      actionType: 'secret-garden-stamp',
      stampId: 'spawn-secret-garden'
    },
    {
      id: 'ur-padang-futsal',
      position: new THREE.Vector3(80.0, 38.2, -12.0),
      radius: 10.5,
      priority: 4,
      prompt: '[E] Kick a Top-Corner Goal at UR602 Padang @ 1U Rooftop Futsal (+150 UPoints)',
      actionType: 'play-futsal'
    },
    {
      id: 'ur-baseball-cage',
      position: new THREE.Vector3(80.0, 38.2, 16.5),
      radius: 10.5,
      priority: 4,
      prompt: '[E] Swing at 110 km/h Fastballs in UR603 Baseball Batting Cage (+150 UPoints)',
      actionType: 'play-baseball'
    },
    {
      id: 'ur-ascaro-padel',
      position: new THREE.Vector3(128.0, 38.2, -17.5),
      radius: 11.5,
      priority: 4,
      prompt: '[E] Rally on UR601 ASCARO Panoramic Padel Courts (+150 UPoints)',
      actionType: 'play-padel'
    },
    {
      id: 'ur-ascaro-sunset',
      position: new THREE.Vector3(133.0, 38.2, 18.5),
      radius: 10.5,
      priority: 4,
      prompt: '[E] Order Sunset Mocktail at UR601 ASCARO Social Club Bar (+28% Speed)',
      actionType: 'order-kopi'
    },
    {
      id: 'ur-kl-skyline',
      position: new THREE.Vector3(167.5, 38.2, 0.0),
      radius: 9.5,
      priority: 4,
      prompt: '[E] Look Through KL Skyline Binoculars (Petronas Twin Towers & Merdeka 118) (+200 UPoints)',
      actionType: 'skyline-vista'
    }
  );

  // ==========================================================================
  // 7. KLANG VALLEY URBAN LANDSCAPE, CURTAIN-WALL TOWERS & KL SKYLINE
  // ==========================================================================
  const exteriorGroup = new THREE.Group();
  root.add(exteriorGroup);

  // Textured Petaling Jaya / Damansara / Klang Valley Urban Landscape Ground Plane!
  const urbanGroundTex = createUrbanGroundTexture();
  const urbanGround = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 1600),
    new THREE.MeshStandardMaterial({ map: urbanGroundTex, roughness: 0.92 })
  );
  urbanGround.rotation.x = -Math.PI / 2;
  urbanGround.position.y = -6.7;
  exteriorGroup.add(urbanGround);

  // Lebuh Bandar Utama 6-Lane Boulevard
  const roadTex = createRoadAsphaltTexture();
  const roadMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 480),
    new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.42, metalness: 0.12 })
  );
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.position.set(-8.0, -6.5, 0);
  exteriorGroup.add(roadMesh);

  // Moving Cars & RapidKL T8xx Feeder Buses
  const carPalette = ['#e2e8f0', '#ef4444', '#3b82f6', '#1e293b', '#f59e0b', '#10b981'];
  const trafficVehicles = [];
  const headMat = new THREE.MeshBasicMaterial({ color: '#fef9c3' });
  const tailMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  const laneConfigs = [
    { x: -21.0, dir: 1, speed: 14.0 }, { x: -16.0, dir: 1, speed: 18.0 }, { x: -11.5, dir: 1, speed: 20.5 },
    { x: -4.5, dir: -1, speed: 20.0 }, { x: 0.0, dir: -1, speed: 16.5 }, { x: 5.0, dir: -1, speed: 13.0 }
  ];
  for (let i = 0; i < 24; i++) {
    const lane = laneConfigs[i % laneConfigs.length];
    const isBus = i % 6 === 0;
    const vGroup = new THREE.Group();
    const w = isBus ? 2.5 : 1.85;
    const h = isBus ? 2.85 : 1.35;
    const l = isBus ? 9.5 : 4.3;
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.58, l), new THREE.MeshStandardMaterial({ color: isBus ? '#0284c7' : carPalette[i % carPalette.length], roughness: 0.25, metalness: 0.5 }));
    chassis.position.y = h * 0.34;
    const cabinMesh = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, h * 0.44, l * (isBus ? 0.94 : 0.54)), new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.15, metalness: 0.4 }));
    cabinMesh.position.y = h * 0.78;
    const hl = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.16, 0.08), headMat);
    hl.position.set(0, 0.5, (l * 0.5 + 0.02) * lane.dir);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.16, 0.08), tailMat);
    tl.position.set(0, 0.55, -(l * 0.5 + 0.02) * lane.dir);
    vGroup.add(chassis, cabinMesh, hl, tl);
    vGroup.position.set(lane.x, -6.5, -180 + ((i * 31) % 360));
    exteriorGroup.add(vGroup);
    trafficVehicles.push({ group: vGroup, dir: lane.dir, speed: lane.speed });
  }

  // MRT Bandar Utama (SBK09) Viaduct & Kajang Line Train
  const viaductBeam = new THREE.Mesh(new THREE.BoxGeometry(620, 1.35, 6.2), new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.8 }));
  viaductBeam.position.set(-20, 8.2, 58);
  exteriorGroup.add(viaductBeam);

  const mrtTrain = new THREE.Group();
  mrtTrain.position.set(-220, 10.0, 58);
  for (let c = 0; c < 4; c++) {
    const coach = new THREE.Mesh(new THREE.BoxGeometry(15.5, 2.9, 2.85), new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.25, metalness: 0.6 }));
    coach.position.x = c * 16.2;
    const winBand = new THREE.Mesh(new THREE.BoxGeometry(14.8, 0.85, 2.92), new THREE.MeshBasicMaterial({ color: '#bae6fd' }));
    winBand.position.set(c * 16.2, 0.25, 0);
    const blueStripe = new THREE.Mesh(new THREE.BoxGeometry(15.55, 0.28, 2.9), new THREE.MeshBasicMaterial({ color: '#2563eb' }));
    blueStripe.position.set(c * 16.2, -0.45, 0);
    mrtTrain.add(coach, winBand, blueStripe);
  }
  exteriorGroup.add(mrtTrain);

  // Curtain-Wall Glass Skyscrapers (Golden-Hour Sunset Atmospheric Haze Tint + Subtle Warm Lit Window Strips!)
  const tealCurtain = createSkyscraperCurtainTexture('#8a7e76', '#fde68a');
  const blueCurtain = createSkyscraperCurtainTexture('#8c827c', '#fed7aa');
  const slateCurtain = createSkyscraperCurtainTexture('#94877d', '#fef3c7');
  const dynamicTowerMats = [];

  function addCurtainTower(x, z, w, h, d, maps, crownHex, stepped = false) {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, -6.5, z);
    const mat = new THREE.MeshStandardMaterial({
      color: '#ebd9c6',
      map: maps.dayMap,
      emissive: '#ffd59c',
      emissiveMap: maps.emissiveMap,
      emissiveIntensity: 0.22,
      roughness: 0.42,
      metalness: 0.32
    });
    dynamicTowerMats.push({ mat, maps });
    const mainT = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mainT.position.y = h * 0.5;
    bGroup.add(mainT);

    if (stepped) {
      const upperT = new THREE.Mesh(new THREE.BoxGeometry(w * 0.68, h * 0.22, d * 0.76), mat);
      upperT.position.y = h + h * 0.11;
      const crown = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 1.3, d * 0.80), new THREE.MeshStandardMaterial({ color: '#5c524a', emissive: crownHex, emissiveIntensity: 0.14, roughness: 0.55 }));
      crown.position.y = h * 1.22 + 0.6;
      const mechCap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.44, 2.2, d * 0.44), new THREE.MeshStandardMaterial({ color: '#6b5e54', roughness: 0.65 }));
      mechCap.position.y = h * 1.22 + 2.2;
      bGroup.add(upperT, crown, mechCap);
    } else {
      const mechPent = new THREE.Mesh(new THREE.BoxGeometry(w * 0.56, 3.4, d * 0.56), new THREE.MeshStandardMaterial({ color: '#5c524a', roughness: 0.65 }));
      mechPent.position.y = h + 1.7;
      const crown = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 1.2, d + 0.5), new THREE.MeshStandardMaterial({ color: '#5c524a', emissive: crownHex, emissiveIntensity: 0.14, roughness: 0.55 }));
      crown.position.y = h + 0.5;
      bGroup.add(mechPent, crown);
    }
    exteriorGroup.add(bGroup);
  }

  // Flagship ONE WORLD HOTEL BANDAR UTAMA (Authentic Stepped Sandstone / Champagne Resort Tower + Curved Podium + Illuminated Roof Sign!)
  const oneWorldTex = createOneWorldHotelTexture();
  const oneWorldMat = new THREE.MeshStandardMaterial({
    map: oneWorldTex.map,
    emissive: '#ffffff',
    emissiveMap: oneWorldTex.emissiveMap,
    emissiveIntensity: 0.12,
    roughness: 0.52,
    metalness: 0.15
  });
  {
    const owh = new THREE.Group();
    owh.position.set(-12, -6.5, -88);
    // Grand stepped sandstone podium + central 5-star hotel slab + champagne crown cornice
    const podium = new THREE.Mesh(new THREE.BoxGeometry(64, 24, 34), oneWorldMat);
    podium.position.y = 12;
    const towerMain = new THREE.Mesh(new THREE.BoxGeometry(48, 62, 24), oneWorldMat);
    towerMain.position.y = 48;
    const towerUpper = new THREE.Mesh(new THREE.BoxGeometry(34, 16, 19), oneWorldMat);
    towerUpper.position.y = 85;
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(37, 2.2, 21), new THREE.MeshStandardMaterial({ color: '#d4af37', roughness: 0.35, metalness: 0.65 }));
    cornice.position.y = 94;
    // Illuminated ONE WORLD HOTEL rooftop fascia sign facing 1 Utama Upper Roof!
    const owhSignMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('ONE WORLD HOTEL', '★★★★★  BANDAR UTAMA • PETALING JAYA', '#1e293b', '#fde68a', '#fbbf24') });
    const owhSign = new THREE.Mesh(new THREE.BoxGeometry(32, 6.2, 0.8), [steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, owhSignMat, owhSignMat]);
    owhSign.position.set(0, 98.2, 10.2);
    owh.add(podium, towerMain, towerUpper, cornice, owhSign);
    exteriorGroup.add(owh);
  }

  // Flagship Bandar Utama Neighbor Towers (1 First Ave, Plaza IBM/KPMG, 1 Powerhouse)
  addCurtainTower(48, 92, 34, 88, 24, blueCurtain, '#fcd34d', true);    // 1 First Avenue
  addCurtainTower(-62, 86, 28, 76, 24, slateCurtain, '#fde68a', false); // Plaza IBM / KPMG
  addCurtainTower(-188, 82, 38, 74, 24, blueCurtain, '#fbbf24', false); // 1 Powerhouse

  // Dense Petaling Jaya / Bandar Utama / Damansara Urban Mid-Rise Skirt — CLEAR east corridor to Petronas Twin Towers & Merdeka 118!
  const pjTowers = [
    [-225, -108, 36, 56, 26], [-172, -118, 34, 64, 26], [-120, -135, 32, 66, 26], [-55, -145, 28, 82, 24],
    [55, -130, 34, 74, 24], [125, -145, 30, 88, 26], [255, -108, 28, 72, 24], [285, -92, 30, 68, 26],
    [285, 86, 28, 74, 24], [265, 112, 34, 84, 26], [335, -98, 26, 86, 24], [345, 92, 28, 96, 24],
    [195, 125, 30, 70, 24], [-135, 135, 32, 68, 24],
    [-95, -92, 36, 48, 24], [32, -98, 32, 54, 24], [95, -96, 38, 52, 24], [168, -94, 34, 58, 24],
    // Low-rise urban skirt below Eastern KL skyline (height 34-40m so Petronas Skybridge at y=82m shines 100% UNOBSTRUCTED!)
    [225, -62, 32, 36, 22], [230, -16, 28, 32, 22], [235, 32, 34, 34, 22], [220, 82, 30, 46, 24],
    [135, 96, 36, 48, 24], [85, 108, 32, 56, 24], [-10, 106, 38, 50, 24], [-115, 98, 36, 52, 24]
  ];
  pjTowers.forEach(([x, z, w, h, d], idx) => {
    const m = idx % 3 === 0 ? tealCurtain : idx % 3 === 1 ? blueCurtain : slateCurtain;
    addCurtainTower(x, z, w, h, d, m, idx % 2 === 0 ? '#fde68a' : '#fdba74', idx % 2 === 0);
  });

  // Distant Selangor Green Horizon Hills STRICTLY at radius 470-560m (ZERO intrusion into mall wings x: -188..+178!)
  const canopyBandMat = new THREE.MeshStandardMaterial({ color: '#1b4332', roughness: 0.92 });
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const rad = 470 + (i % 3) * 45;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(46 + (i % 3) * 10, 12, 8), canopyBandMat);
    hill.scale.set(1.15, 0.34, 1.0);
    hill.position.set(Math.cos(a) * rad, -6.5, Math.sin(a) * rad);
    exteriorGroup.add(hill);
  }

  function setSkylineTimeOfDay(weatherIdx) {
    const isDarkOrSunset = weatherIdx === 1 || weatherIdx === 2;
    for (const item of dynamicTowerMats) {
      item.mat.map = isDarkOrSunset ? item.maps.nightMap : item.maps.dayMap;
      item.mat.emissiveIntensity = weatherIdx === 2 ? 0.72 : weatherIdx === 1 ? 0.42 : 0.22;
      item.mat.needsUpdate = true;
    }
    oneWorldMat.emissiveIntensity = weatherIdx === 2 ? 0.68 : weatherIdx === 1 ? 0.32 : 0.12;
  }

  // Monumental Eastern KL Horizon (Detailed Glazed Petronas Twin Towers KLCC, Faceted Merdeka 118, Menara KL & Atmospheric Haze!)
  {
    const klSteelMat = new THREE.MeshStandardMaterial({
      color: '#c4b8ac',
      map: slateCurtain.dayMap,
      emissive: '#f2ba7a',
      emissiveMap: slateCurtain.emissiveMap,
      emissiveIntensity: 0.24,
      roughness: 0.30,
      metalness: 0.72
    });
    const klGlassMat = new THREE.MeshStandardMaterial({
      color: '#6d7a88',
      map: blueCurtain.dayMap,
      emissive: '#e6b27c',
      emissiveMap: blueCurtain.emissiveMap,
      emissiveIntensity: 0.26,
      roughness: 0.22,
      metalness: 0.70
    });
    const klSpireMat = new THREE.MeshStandardMaterial({
      color: '#d8cfc4',
      emissive: '#ffd29a',
      emissiveIntensity: 0.22,
      roughness: 0.28,
      metalness: 0.80
    });
    dynamicTowerMats.push({ mat: klSteelMat, maps: slateCurtain }, { mat: klGlassMat, maps: blueCurtain });

    // Petronas Twin Towers (KLCC): Authentic 8-lobed tiered stainless-and-glass shafts + double-deck skybridge + arched legs + pinnacles!
    for (const tz of [315, 339]) {
      const tiers = [
        { rT: 8.6, rB: 9.2, h: 74, y: 31 },
        { rT: 7.4, rB: 8.2, h: 44, y: 90 },
        { rT: 6.1, rB: 7.0, h: 34, y: 129 },
        { rT: 4.5, rB: 5.7, h: 28, y: 160 },
        { rT: 2.6, rB: 4.0, h: 20, y: 184 }
      ];
      for (const tr of tiers) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(tr.rT, tr.rB, tr.h, 16), klSteelMat);
        seg.position.set(440, tr.y, tz);
        const ringBand = new THREE.Mesh(new THREE.CylinderGeometry(tr.rT + 0.35, tr.rT + 0.35, 1.8, 16), klSpireMat);
        ringBand.position.set(440, tr.y + tr.h * 0.5, tz);
        exteriorGroup.add(seg, ringBand);
      }
      const pinnacle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 1.35, 36, 12), klSpireMat);
      pinnacle.position.set(440, 212, tz);
      const crownOrb = new THREE.Mesh(new THREE.SphereGeometry(2.0, 12, 8), klSpireMat);
      crownOrb.position.set(440, 196, tz);
      exteriorGroup.add(pinnacle, crownOrb);
    }
    const klccBridge = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.6, 24), klSpireMat);
    klccBridge.position.set(440, 82, 327);
    const bridgeLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 28, 8), klSpireMat);
    bridgeLegL.position.set(440, 68, 322);
    bridgeLegL.rotation.x = 0.42;
    const bridgeLegR = bridgeLegL.clone();
    bridgeLegR.position.z = 332;
    bridgeLegR.rotation.x = -0.42;
    exteriorGroup.add(klccBridge, bridgeLegL, bridgeLegR);

    // Merdeka 118 — Authentic Multi-Faceted Crystalline Diamond Glass Facade & Asymmetric Tapered Spire at x = 465, z = +392!
    const m118Base = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 15.2, 82, 6), klGlassMat);
    m118Base.position.set(465, 35, 392);
    m118Base.rotation.y = Math.PI / 6;
    const m118Mid = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 11.4, 68, 6), klGlassMat);
    m118Mid.position.set(465, 110, 392);
    m118Mid.rotation.y = Math.PI / 6 + 0.15;
    const m118Crown = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 7.0, 56, 5), klGlassMat);
    m118Crown.position.set(465, 172, 391);
    const m118Spire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 1.8, 72, 8), klSpireMat);
    m118Spire.position.set(465, 232, 390);
    exteriorGroup.add(m118Base, m118Mid, m118Crown, m118Spire);

    // Menara KL (KL Tower) with stepped fluted concrete shaft, multi-deck Islamic Muqarnas pod & antenna spire at x = 420, z = +365!
    const klShaft = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 4.2, 118, 16), klSteelMat);
    klShaft.position.set(420, 53, 365);
    const klPodBot = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 4.4, 7, 16), klSpireMat);
    klPodBot.position.set(420, 115, 365);
    const klPod = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 8.6, 12, 16), klGlassMat);
    klPod.position.set(420, 124, 365);
    const klPodTop = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 8.8, 6, 16), klSpireMat);
    klPodTop.position.set(420, 133, 365);
    const klNeedle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 1.1, 46, 10), klSpireMat);
    klNeedle.position.set(420, 158, 365);
    exteriorGroup.add(klShaft, klPodBot, klPod, klPodTop, klNeedle);
  }

  // Batch static single-material opaque attraction, botanical & skyline meshes by material (~4,000 fewer draw calls/frame!)
  collapseStaticMeshes(root, [
    stageGroup,
    turntableGroup,
    surferGroup,
    flyerGroup,
    mrtTrain,
    rainforestGroup.userData.aquariumOrbit,
    rainforestGroup.userData.tetraSchoolOrbit,
    ...koiList.map((k) => k.group),
    ...bridgePlanks.map((b) => b.mesh),
    ...rollerSkaters.map((s) => s.group),
    ...bowlingBalls.map((b) => b.mesh),
    ...trafficVehicles.map((v) => v.group)
  ]);

  const animatedWaterfallNodes = new Set([
    ...waterfallRippleRings.map((r) => r.mesh),
    ...waterfallMistPuffs.map((m) => m.mesh)
  ]);

  // Freeze static matrices on non-animated attraction meshes (protect SkinnedMesh & Bones!)
  root.updateMatrixWorld(true);
  for (const staticGrp of [gardenGroup, waterfallCliff]) {
    staticGrp.traverse((obj) => {
      if (obj !== staticGrp && !obj.isSkinnedMesh && !obj.isBone && !animatedWaterfallNodes.has(obj)) {
        obj.matrixAutoUpdate = false;
      }
    });
  }

  function getRainbowBridgeSwayY(px, pz, elapsed, floorIndex = 3) {
    if (floorIndex !== 3) return 0;
    const rb = BOUNDS.rainbowBridge2F;
    if (px >= rb.xMin && px <= rb.xMax && pz >= rb.zMin && pz <= rb.zMax) {
      const midFactor = Math.cos((pz / 13.6) * (Math.PI * 0.5));
      return Math.sin(elapsed * 3.8) * 0.065 * midFactor - 0.08 * midFactor;
    }
    return 0;
  }

  function update(dt, elapsed, playerPos) {
    koiWaterMat.uniforms.uTime.value = elapsed;
    waterfallMat.uniforms.uTime.value = elapsed;
    flowWaveMat.uniforms.uTime.value = elapsed;
    windVortexMat.uniforms.uTime.value = elapsed;

    if (feedTimer > 0) feedTimer -= dt;
    for (const k of koiList) {
      if (feedTimer > 0 && activeFeedTarget) {
        const dx = activeFeedTarget.x - k.group.position.x;
        const dz = activeFeedTarget.y - k.group.position.z;
        const targetAng = Math.atan2(dx, dz);
        let diff = targetAng - k.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        k.angle += diff * Math.min(1, dt * 3.8);
      } else {
        k.angle += Math.sin(elapsed * 0.7 + k.turnSeed) * dt * 0.85;
      }
      const spd = feedTimer > 0 ? k.speed * 2.1 : k.speed;
      k.group.position.x += Math.sin(k.angle) * spd * dt;
      k.group.position.z += Math.cos(k.angle) * spd * dt;
      if (k.group.position.x < kp.xMin + 1.4) k.angle = Math.PI * 0.5;
      if (k.group.position.x > kp.xMax - 1.4) k.angle = -Math.PI * 0.5;
      if (k.group.position.z < kp.zMin + 1.4) k.angle = 0;
      if (k.group.position.z > kp.zMax - 1.4) k.angle = Math.PI;
      // Keep Koi cleanly submerged below water surface y = -0.22!
      k.group.position.y = Math.min(-0.34, k.baseY + (feedTimer > 0 ? Math.max(0, Math.sin(elapsed * 9 + k.turnSeed)) * 0.08 : 0));
      k.group.rotation.y = k.angle;
      k.tail.rotation.y = Math.sin(elapsed * (feedTimer > 0 ? 18 : 9) + k.turnSeed) * 0.38;
    }

    for (let i = pelletMeshes.length - 1; i >= 0; i--) {
      const p = pelletMeshes[i];
      p.life -= dt;
      p.vy -= 9.8 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(-0.22, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      if (p.life <= 0) {
        rainforestGroup.remove(p.mesh);
        pelletMeshes.splice(i, 1);
      }
    }

    if (rainforestGroup.userData.aquariumOrbit) {
      rainforestGroup.userData.aquariumOrbit.rotation.y = elapsed * 0.35;
    }
    if (rainforestGroup.userData.tetraSchoolOrbit) {
      rainforestGroup.userData.tetraSchoolOrbit.rotation.y = -elapsed * 0.62;
      rainforestGroup.userData.tetraSchoolOrbit.position.y = 1.95 + Math.sin(elapsed * 1.4) * 0.14;
    }
    wfFoamTex.offset.y = -(elapsed * 1.35) % 1.0;
    for (const r of waterfallRippleRings) {
      const cyc = (elapsed * 0.65 + r.phase) % 1.0;
      const sc = 0.65 + cyc * 0.85;
      r.mesh.scale.set(1.18 * sc, 0.82 * sc, 0.35);
      r.mat.opacity = (1.0 - cyc) * 0.42;
    }
    for (const m of waterfallMistPuffs) {
      const cyc = (elapsed * 0.45 + m.phase) % 1.0;
      m.mesh.position.set(
        m.baseX + Math.sin(elapsed * 0.9 + m.phase) * 0.22,
        m.baseY + cyc * 0.55,
        m.baseZ - cyc * 0.28
      );
      m.mesh.scale.setScalar(0.85 + cyc * 0.45);
      m.mat.opacity = Math.sin(cyc * Math.PI) * 0.38;
    }

    const playerOnBridge =
      playerPos &&
      Math.abs(playerPos.y - 18.0) < 2.2 &&
      playerPos.x >= 36.0 &&
      playerPos.x <= 40.0 &&
      Math.abs(playerPos.z) <= 14.0;
    for (const bp of bridgePlanks) {
      const arch = Math.sin(bp.u * Math.PI);
      const sway = playerOnBridge ? Math.sin(elapsed * 4.2 + bp.u * 4.0) * 0.055 : Math.sin(elapsed * 1.5 + bp.u * 3.0) * 0.015;
      bp.mesh.position.y = -0.06 * arch + sway * arch;
    }

    for (const sk of rollerSkaters) {
      const a = elapsed * 1.15 + sk.phase;
      sk.group.position.set(Math.cos(a) * 3.8, 0.08, Math.sin(a) * 8.6);
      sk.group.rotation.y = -a;
      if (sk.mixer) sk.mixer.update(dt * 1.1);
    }

    for (const bb of bowlingBalls) {
      const t = (elapsed * 0.85 + bb.offset) % 1.0;
      bb.mesh.position.z = -1.9 + t * 3.3;
    }

    stageGroup.rotation.y = Math.sin(elapsed * 0.25) * 0.08;
    for (const fo of floatingOrnaments) {
      fo.mesh.position.y = fo.baseY + Math.sin(elapsed * 1.6 + fo.seed) * 0.28;
      fo.mesh.rotation.y = elapsed * 0.8 + fo.seed;
    }

    carGroup.rotation.y = -2.42 + elapsed * 0.12;
    const targetDoor = carDoorsOpen ? 1.08 : 0.0;
    carDoorAngle += (targetDoor - carDoorAngle) * Math.min(1, dt * 4.5);
    leftDoorPivot.rotation.z = -carDoorAngle;
    leftDoorPivot.rotation.y = -carDoorAngle * 0.24;
    rightDoorPivot.rotation.z = -carDoorAngle;
    rightDoorPivot.rotation.y = carDoorAngle * 0.24;

    if (surfTrickTimer > 0) {
      surfTrickTimer = Math.max(0, surfTrickTimer - dt);
      flowWaveMat.uniforms.uBoost.value = surfTrickTimer > 0 ? 1.0 : 0.0;
    }
    const carveX = Math.sin(elapsed * 1.9) * 3.4;
    const jumpY = surfTrickTimer > 0 ? Math.sin((surfTrickTimer / 2.6) * Math.PI) * 0.95 : 0;
    // Surfer & yellow surfboard riding flush on visible front wave face (u ≈ 0.44 -> wave surface y ≈ 0.52m)!
    surferGroup.position.set(carveX, 0.58 + jumpY, 0.50 + Math.cos(elapsed * 1.3) * 0.42);
    surferGroup.rotation.x = 0.24;
    surferGroup.rotation.z = -Math.cos(elapsed * 1.9) * 0.24;
    surferGroup.rotation.y = surfTrickTimer > 0 ? (1 - surfTrickTimer / 2.6) * Math.PI * 4 : Math.cos(elapsed * 1.9) * 0.35;

    const targetFlyY = windPresets[windPresetIdx].targetH + Math.sin(elapsed * 2.3) * 0.32;
    flyerGroup.position.y += (targetFlyY - flyerGroup.position.y) * Math.min(1, dt * 2.5);
    flyerGroup.rotation.y = elapsed * (0.9 * windPresets[windPresetIdx].factor);
    flyerGroup.position.x = Math.cos(elapsed * 1.7) * 0.45;
    flyerGroup.position.z = Math.sin(elapsed * 1.7) * 0.45;

    for (const v of trafficVehicles) {
      v.group.position.z += v.dir * v.speed * dt;
      if (v.dir > 0 && v.group.position.z > 180) v.group.position.z = -180;
      if (v.dir < 0 && v.group.position.z < -180) v.group.position.z = 180;
    }
    mrtTrain.position.x += 26.0 * dt;
    if (mrtTrain.position.x > 250) mrtTrain.position.x = -270;
  }

  return {
    root,
    ferrariReady,
    koiWaterMat,
    triggerKoiFeeding,
    cycleFestiveTheme,
    interactHypercar,
    triggerSurfTrick,
    cycleAirRiderSpeed,
    getRainbowBridgeSwayY,
    setSkylineTimeOfDay,
    update
  };
}
