import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { collapseStaticMeshes } from './batchUtils.js';
import { createSculptedHumanRig } from './humanRig.js';
import {
  FLOORS,
  BOUNDS,
  STORES,
  MALL_FACILITIES,
  KIOSKS,
  getEscalatorWellsForFloor
} from '../data/mallLayout.js';
import {
  createMarbleFloorMaps,
  createDistrictKFloorMaps,
  createCeilingSoffitMaps,
  createFlutedColumnMaps,
  createContactShadowTexture,
  createTeakBoardwalkMaps,
  createPalmFrondTexture,
  getStoreBrandProfile,
  createStorefrontFasciaTexture,
  createStoreInteriorBackwallTexture,
  createOvalMedallionTexture,
  createBladeSignTexture,
  createAtriumBannerTexture,
  createDigitalDirectoryTexture,
  createKioskSignTexture,
  createKioskSoffitTexture,
  createSignBoardTexture,
  createWayfindingTexture,
  createIppudoVerticalSignTexture,
  createIndustrialPlenumTexture,
  createGarrettStripeTexture,
  createMosaicTileMaps,
  createFoodStallMenuTexture,
  createOakPlankMaps,
  createAmberGlassBlockMaps,
  createStorePosterTexture,
  createMenuStandTexture,
  createVerticalOakMaps,
  createTravertineStoneMaps,
  createRibbedCarpetMaps,
  createSushiZanmaiLogoTexture,
  createMrDiyHammerBadgeTexture,
  createMrDiyPillarTexture,
  createMrDiyChalkboardTexture,
  createIppudoDividerTexture,
  createBhcBackwallSignTexture,
  createZusPastryMedallionTexture,
  createStarbucksSirenTexture,
  createComeTrueWallLogoTexture,
  createRollerWaNeonSignTexture,
  createRollerWaSkateIconTexture,
  createPjpacMonogramTexture,
  createWindlabBackwallSignTexture,
  createPhotoismStripTexture,
  createRestroomWayfindingTexture,
  createDoorPlaqueTexture,
  createRainforestGlassGridTexture,
  createRainforestTerracottaFloorTexture,
  createCentreCourtCheckeredColumnTexture,
  createSensoryPodTexture,
  createLuxeValetVistaTexture
} from '../graphics/proceduralTextures.js';
import {
  MarbleReflectorShader,
  createParallaxInteriorMaterial,
  createVolumetricGodRayMaterial,
  createSkylightGlassMaterial,
  createFresnelGlassMaterial
} from '../graphics/shaders.js';

const SLAB_THICKNESS = 0.58;

function rectPath(xMin, xMax, zMin, zMax) {
  const p = new THREE.Path();
  p.moveTo(xMin, -zMin);
  p.lineTo(xMax, -zMin);
  p.lineTo(xMax, -zMax);
  p.lineTo(xMin, -zMax);
  p.closePath();
  return p;
}

function rectShape(xMin, xMax, zMin, zMax) {
  const s = new THREE.Shape();
  s.moveTo(xMin, -zMin);
  s.lineTo(xMax, -zMin);
  s.lineTo(xMax, -zMax);
  s.lineTo(xMin, -zMax);
  s.closePath();
  return s;
}

function ellipsePath(cx, cz, rx, rz, segments = 48) {
  const p = new THREE.Path();
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = cx + Math.cos(a) * rx;
    const z = cz + Math.sin(a) * rz;
    if (i === 0) p.moveTo(x, -z);
    else p.lineTo(x, -z);
  }
  p.closePath();
  return p;
}

function buildArchedIndoorFrondGeo(width, length, droop = 0.34) {
  const geo = new THREE.PlaneGeometry(width, length, 2, 5);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = (y + length * 0.5) / length;
    const archY = Math.sin(t * Math.PI * 0.85) * length * 0.24 - t * t * length * droop;
    const archZ = t * length;
    const cup = -Math.abs(x) * 0.14 * (0.4 + 0.6 * t);
    pos.setXYZ(i, x, archY + cup, archZ);
  }
  geo.computeVertexNormals();
  return geo;
}

// High-Craft Lush Multi-Tiered Indoor Royal Fan Palm & Cascading Fern Cluster (ZERO bare wireframe twigs!)
let sharedIndoorTrunkMat = null;
let sharedIndoorFrondMat = null;
function createIndoorPalm(scale = 1.0) {
  if (!sharedIndoorTrunkMat) {
    sharedIndoorTrunkMat = new THREE.MeshStandardMaterial({ color: '#6b4d38', roughness: 0.86, metalness: 0.0 });
    sharedIndoorFrondMat = new THREE.MeshStandardMaterial({
      map: createPalmFrondTexture(),
      color: '#d4f2be',
      emissive: '#1e3a18',
      emissiveIntensity: 0.16,
      alphaTest: 0.34,
      transparent: false,
      roughness: 0.54,
      metalness: 0.02,
      envMapIntensity: 0.52,
      side: THREE.DoubleSide
    });
  }
  const g = new THREE.Group();
  const frondGeo = buildArchedIndoorFrondGeo(0.96 * scale, 1.78 * scale, 0.28);
  const midFrondGeo = buildArchedIndoorFrondGeo(0.84 * scale, 1.42 * scale, 0.36);
  const fernGeo = buildArchedIndoorFrondGeo(0.62 * scale, 1.12 * scale, 0.34);

  for (let t = 0; t < 5; t++) {
    const a = (t / 5) * Math.PI * 2 + 0.25;
    const h = (1.10 + (t % 3) * 0.26) * scale;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.048 * scale, 0.072 * scale, h, 8), sharedIndoorTrunkMat);
    stem.position.set(Math.cos(a) * 0.15 * scale, h * 0.5, Math.sin(a) * 0.15 * scale);
    stem.rotation.z = Math.cos(a) * 0.10;
    stem.rotation.x = Math.sin(a) * 0.10;
    stem.castShadow = true;
    g.add(stem);

    for (let f = 0; f < 6; f++) {
      const fa = (f / 6) * Math.PI * 2 + t * 0.72;
      const frond = new THREE.Mesh(f % 2 === 0 ? frondGeo : midFrondGeo, sharedIndoorFrondMat);
      frond.position.set(Math.cos(a) * 0.18 * scale, h - 0.05 * scale, Math.sin(a) * 0.18 * scale);
      frond.rotation.y = fa;
      frond.rotation.x = f % 2 === 0 ? -0.26 : 0.12;
      frond.castShadow = true;
      g.add(frond);
    }
  }
  // Lush low fern rosette spilling generously over the planter rim!
  for (let b = 0; b < 12; b++) {
    const ba = (b / 12) * Math.PI * 2;
    const fern = new THREE.Mesh(fernGeo, sharedIndoorFrondMat);
    fern.position.set(Math.cos(ba) * 0.26 * scale, 0.12 * scale, Math.sin(ba) * 0.26 * scale);
    fern.rotation.y = ba;
    fern.rotation.x = -0.14 + (b % 2) * 0.16;
    g.add(fern);
  }
  return g;
}

export function buildMallArchitecture(scene, interactables) {
  const root = new THREE.Group();
  root.name = 'MallArchitecture';
  scene.add(root);

  // ==========================================================================
  // 1. RICH UE5 / PS5 WET-POLISHED MARBLE, COFFERED SOFFIT & BRONZE PBR MATERIALS
  // ==========================================================================
  const ueFloorMaps = createMarbleFloorMaps({
    baseHex: '#a4b0c2',
    altHex: '#96a4b8',
    veinColor: '#48566b',
    groutColor: '#5c6b82',
    tiles: 4,
    baseRoughness: 38,
    repeatX: 0.14,
    repeatY: 0.14
  });
  const ueFloorMat = new THREE.MeshStandardMaterial({
    map: ueFloorMaps.map,
    roughnessMap: ueFloorMaps.roughnessMap,
    normalMap: ueFloorMaps.normalMap,
    normalScale: new THREE.Vector2(0.42, 0.42),
    metalness: 0.06,
    envMapIntensity: 0.72
  });
  const districtKMaps = createDistrictKFloorMaps(0.15, 0.15);
  const districtKFloorMat = new THREE.MeshStandardMaterial({
    map: districtKMaps.map,
    roughnessMap: districtKMaps.roughnessMap,
    metalness: 0.04,
    envMapIntensity: 0.72
  });
  const plenumMaps = createIndustrialPlenumTexture();
  const districtKPlenumMat = new THREE.MeshStandardMaterial({
    map: plenumMaps.map,
    emissive: '#fff4da',
    emissiveMap: plenumMaps.emissiveMap,
    emissiveIntensity: 0.78,
    roughness: 0.78,
    metalness: 0.22
  });

  const oldWingMaps = createMarbleFloorMaps({
    baseHex: '#ece3d3',
    altHex: '#e3d7c3',
    veinColor: '#b39a74',
    groutColor: '#c2b39b',
    tiles: 4,
    baseRoughness: 38,
    repeatX: 0.13,
    repeatY: 0.13
  });
  const oldWingFloorMat = new THREE.MeshStandardMaterial({
    map: oldWingMaps.map,
    roughnessMap: oldWingMaps.roughnessMap,
    normalMap: oldWingMaps.normalMap,
    normalScale: new THREE.Vector2(0.36, 0.36),
    metalness: 0.03,
    envMapIntensity: 0.58
  });

  const newWingMaps = createMarbleFloorMaps({
    baseHex: '#efe7da',
    altHex: '#e6dccb',
    veinColor: '#aba08e',
    groutColor: '#c4baa8',
    tiles: 4,
    baseRoughness: 38,
    repeatX: 0.12,
    repeatY: 0.12
  });
  const newWingFloorMat = new THREE.MeshStandardMaterial({
    map: newWingMaps.map,
    roughnessMap: newWingMaps.roughnessMap,
    normalMap: newWingMaps.normalMap,
    normalScale: new THREE.Vector2(0.36, 0.36),
    metalness: 0.03,
    envMapIntensity: 0.58
  });

  const rooftopMaps = createMarbleFloorMaps({
    baseHex: '#3e4a5c',
    altHex: '#333f50',
    veinColor: '#4b5a6e',
    groutColor: '#1f2937',
    tiles: 4,
    baseRoughness: 165,
    repeatX: 0.16,
    repeatY: 0.16
  });
  const rooftopFloorMat = new THREE.MeshStandardMaterial({
    map: rooftopMaps.map,
    roughnessMap: rooftopMaps.roughnessMap,
    normalMap: rooftopMaps.normalMap,
    roughness: 0.94,
    metalness: 0.0,
    envMapIntensity: 0.08
  });

  // Bright Warm Architectural 1 Utama Coffered Gallery Plaster Ceilings WITH Real Glowing Recessed LED Downlights!
  const ceilCoolMaps = createCeilingSoffitMaps({
    baseHex: '#f0ece4',
    lightHex: '#fff3d4',
    baffleWood: false,
    repeatX: 0.055,
    repeatY: 0.055
  });
  const ceilCoolMat = new THREE.MeshStandardMaterial({
    color: '#f2ece2',
    map: ceilCoolMaps.map,
    normalMap: ceilCoolMaps.normalMap,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughnessMap: ceilCoolMaps.roughnessMap,
    emissive: '#fff4da',
    emissiveMap: ceilCoolMaps.emissiveMap,
    emissiveIntensity: 1.55,
    roughness: 0.72,
    metalness: 0.03
  });

  const ceilWarmMaps = createCeilingSoffitMaps({
    baseHex: '#f4ede0',
    lightHex: '#ffefcc',
    baffleWood: false,
    repeatX: 0.055,
    repeatY: 0.055
  });
  const ceilWarmMat = new THREE.MeshStandardMaterial({
    color: '#f5eee2',
    map: ceilWarmMaps.map,
    normalMap: ceilWarmMaps.normalMap,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughnessMap: ceilWarmMaps.roughnessMap,
    emissive: '#fff2d0',
    emissiveMap: ceilWarmMaps.emissiveMap,
    emissiveIntensity: 1.55,
    roughness: 0.72,
    metalness: 0.03
  });

  const ceilWoodMaps = createCeilingSoffitMaps({
    baseHex: '#7a4b26',
    lightHex: '#ffe5a5',
    baffleWood: true,
    repeatX: 0.10,
    repeatY: 0.10
  });
  const ceilWoodMat = new THREE.MeshStandardMaterial({
    map: ceilWoodMaps.map,
    normalMap: ceilWoodMaps.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: ceilWoodMaps.roughnessMap,
    emissive: '#ffe9b8',
    emissiveMap: ceilWoodMaps.emissiveMap,
    emissiveIntensity: 0.78,
    roughness: 0.64,
    metalness: 0.04
  });

  const teakMaps = createTeakBoardwalkMaps(0.28, 0.28);
  const teakMat = new THREE.MeshStandardMaterial({
    color: '#a88c74',
    map: teakMaps.map,
    normalMap: teakMaps.normalMap,
    normalScale: new THREE.Vector2(0.90, 0.90),
    roughnessMap: teakMaps.roughnessMap,
    roughness: 0.84,
    metalness: 0.02,
    envMapIntensity: 0.28
  });

  // Authentic Real 1 Utama Bright Satin-White & Brushed-Aluminum Balcony Fascia Materials (replaces dungeon-black collars!)
  const fasciaSideMat = new THREE.MeshStandardMaterial({ color: '#cfd6df', roughness: 0.42, metalness: 0.24, envMapIntensity: 0.65 });
  const balconyWhiteFasciaMat = new THREE.MeshStandardMaterial({ color: '#dce2ea', roughness: 0.36, metalness: 0.16, envMapIntensity: 0.62 });
  const skylightAlumMat = new THREE.MeshStandardMaterial({ color: '#8f9bad', roughness: 0.28, metalness: 0.82, envMapIntensity: 0.92 });
  const darkFasciaTrimMat = new THREE.MeshStandardMaterial({ color: '#242b38', roughness: 0.34, metalness: 0.68, envMapIntensity: 0.75 });

  const glassBalustradeMat = createFresnelGlassMaterial({
    tint: '#d9ebf7',
    opacity: 0.62,
    side: THREE.FrontSide
  });

  const storefrontGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.08,
    roughness: 0.08,
    metalness: 0.08,
    envMapIntensity: 0.85,
    depthWrite: false
  });

  const curtainGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#bae6fd',
    transparent: true,
    opacity: 0.20,
    roughness: 0.06,
    metalness: 0.10,
    clearcoat: 0.85,
    envMapIntensity: 0.95,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const steelHandrailMat = new THREE.MeshStandardMaterial({ color: '#cfd8e4', roughness: 0.22, metalness: 0.88, envMapIntensity: 0.95 });
  const bronzeTrimMat = new THREE.MeshStandardMaterial({ color: '#24201c', roughness: 0.28, metalness: 0.78, envMapIntensity: 0.90 });
  const brassGoldMat = new THREE.MeshStandardMaterial({ color: '#cfa942', roughness: 0.22, metalness: 0.88, envMapIntensity: 1.0 });

  // Calibrated 3000K architectural LED strips (rich warm amber strictly below bloomPass.threshold = 1.42 — ZERO whiteout bleed!)
  const warmCoveLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.24, 0.90, 0.46) });
  const coolCoveLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.92, 1.28, 1.62) });
  const pinkNeonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.65, 0.48, 1.15) });

  const contactShadowTex = createContactShadowTexture();
  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    depthWrite: false
  });

  function addContactShadow(x, y, z, sx = 2.4, sz = 2.4) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), contactShadowMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y + 0.016, z);
    root.add(m);
  }

  const skylightMat = createSkylightGlassMaterial();
  const godRayMaterials = [];

  // Track 1 unified real-time planar Reflector per floor (0..5) -> 75% fewer scene render passes per frame!
  const floorReflectors = new Map();
  const floorReflectorShapes = new Map();
  for (let f = 0; f <= 5; f++) {
    floorReflectors.set(f, []);
    floorReflectorShapes.set(f, { shapes: [], yTop: 0, tintHex: '#dce3ed' });
  }

  function addFloorReflector(floorIdx, shape, yTop, tintHex = '#e2e8f0') {
    if (floorIdx > 5) return; // Rooftop UR is textured outdoor stone
    const entry = floorReflectorShapes.get(floorIdx);
    entry.shapes.push(shape);
    entry.yTop = yTop;
    entry.tintHex = tintHex;
  }

  function finalizeUnifiedFloorReflectors() {
    for (let f = 0; f <= 5; f++) {
      const entry = floorReflectorShapes.get(f);
      if (!entry || entry.shapes.length === 0) continue;
      const geo = new THREE.ShapeGeometry(entry.shapes, 22);
      const refl = new Reflector(geo, {
        clipBias: 0.004,
        textureWidth: 384,
        textureHeight: 384,
        color: entry.tintHex,
        shader: MarbleReflectorShader,
        multisample: 0
      });
      refl.material.transparent = true;
      refl.material.depthWrite = false;
      refl.material.uniforms.uOpacity.value = 0.40;
      refl.rotation.x = -Math.PI / 2;
      refl.position.y = entry.yTop + 0.008;
      refl.visible = false;

      // Throttle reflection pass to every 2nd frame & clamp reflection far plane to 82m for locked 60 FPS!
      const origBeforeRender = refl.onBeforeRender;
      let frameTick = 0;
      refl.userData.forceNextRender = true;
      refl.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
        frameTick++;
        if (!refl.userData.forceNextRender && frameTick % 2 !== 0) return;
        refl.userData.forceNextRender = false;
        const prevFar = camera.far;
        camera.far = 82;
        camera.updateProjectionMatrix();
        origBeforeRender.call(this, renderer, scene, camera, geometry, material, group);
        camera.far = prevFar;
        camera.updateProjectionMatrix();
      };

      root.add(refl);
      floorReflectors.get(f).push(refl);
    }
  }

  function addSlab(floorIdx, shape, yTop, topMat, ceilingMat, reflectTint = null) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: SLAB_THICKNESS,
      bevelEnabled: false,
      curveSegments: 36
    });
    const mesh = new THREE.Mesh(geo, [topMat, fasciaSideMat]);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = yTop - SLAB_THICKNESS;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);

    if (yTop > 1.0 && ceilingMat) {
      const ceilGeo = new THREE.ShapeGeometry(shape, 32);
      const ceilMesh = new THREE.Mesh(ceilGeo, ceilingMat);
      ceilMesh.rotation.x = Math.PI / 2;
      ceilMesh.position.y = yTop - SLAB_THICKNESS - 0.025;
      root.add(ceilMesh);
    }

    if (reflectTint) {
      addFloorReflector(floorIdx, shape, yTop, reflectTint, 0.21);
    }
    return mesh;
  }

  function addRectBalustrade(x1, z1, x2, z2, yFloor, height = 1.08, includeLed = true) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 0.2) return;
    const cx = (x1 + x2) * 0.5;
    const cz = (z1 + z2) * 0.5;
    const angle = Math.atan2(dx, dz);
    const castBalShadow = yFloor >= 36.0;

    const g = new THREE.Group();
    g.position.set(cx, yFloor, cz);
    g.rotation.y = angle;

    // Base aluminum shoe channel + warm 3000K recessed architectural LED cove strip (disabled on outdoor rooftop & koi jetty!)
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, len), darkFasciaTrimMat);
    shoe.position.y = 0.06;
    shoe.castShadow = castBalShadow;
    shoe.receiveShadow = true;
    g.add(shoe);
    if (includeLed) {
      const ledBase = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.028, len), warmCoveLedMat);
      ledBase.position.y = 0.12;
      g.add(ledBase);
    }

    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.03, height - 0.14, len), glassBalustradeMat);
    glass.position.y = (height - 0.14) * 0.5 + 0.10;
    g.add(glass);

    const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, len, 8), steelHandrailMat);
    topRail.rotation.x = Math.PI / 2;
    topRail.position.y = height;
    topRail.castShadow = castBalShadow;
    g.add(topRail);

    const postCount = Math.max(2, Math.ceil(len / 3.4) + 1);
    for (let i = 0; i < postCount; i++) {
      const t = -len * 0.5 + (i / (postCount - 1)) * len;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, height, 0.055), steelHandrailMat);
      post.position.set(0, height * 0.5, t);
      post.castShadow = castBalShadow;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.08, 0.085), brassGoldMat);
      cap.position.set(0, 0.18, t);
      g.add(post, cap);
    }
    root.add(g);
  }

  // Authentic Real 1 Utama Satin Pearl-White Architectural Balcony Collar framing every atrium cutout!
  function addRectVoidCollar(xMin, xMax, zMin, zMax, yFloor, trimThick = 0.18) {
    const w = xMax - xMin;
    const d = zMax - zMin;
    const cx = (xMin + xMax) * 0.5;
    const cz = (zMin + zMax) * 0.5;
    const h = SLAB_THICKNESS + 0.08;
    const cy = yFloor - SLAB_THICKNESS * 0.5 - 0.03;
    for (const zEdge of [zMin, zMax]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w + trimThick * 2, h, trimThick), balconyWhiteFasciaMat);
      b.position.set(cx, cy, zEdge);
      root.add(b);
    }
    for (const xEdge of [xMin, xMax]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(trimThick, h, d + trimThick * 2), balconyWhiteFasciaMat);
      b.position.set(xEdge, cy, cz);
      root.add(b);
    }
  }

  function addOvalBalustradeAndCollar(cx, cz, rx, rz, yFloor, includeLed = true) {
    // Open angular gap on the East lift lobby (0.37 rad -> z = ±4.63, x = 156.18) so ZERO railing or collar blocks lift entry!
    const gapAng = 0.372;
    const segs = 56;
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * Math.PI * 2;
      const a2 = ((i + 1) / segs) * Math.PI * 2;
      const am = (a1 + a2) * 0.5;
      if (am < gapAng || am > Math.PI * 2 - gapAng) continue;
      // Leave clean entrance/exit slots on the North rim where oval-rim escalators (x=132.4..143.6, z=-12.6) enter the Oval!
      const mxEsc = cx + Math.cos(am) * rx;
      const mzEsc = cz + Math.sin(am) * rz;
      if (yFloor >= 5.5 && yFloor <= 24.5 && mzEsc < -11.4 && mxEsc > 131.6 && mxEsc < 144.4) continue;
      addRectBalustrade(
        cx + Math.cos(a1) * rx,
        cz + Math.sin(a1) * rz,
        cx + Math.cos(a2) * rx,
        cz + Math.sin(a2) * rz,
        yFloor,
        1.08,
        includeLed
      );
    }

    // Open-Arc Satin-White Oval Balcony Fascia Ring terminating cleanly flush at elevator deck (gapAng 0.425 -> ZERO floating ship-prow spike!)
    const collarShape = new THREE.Shape();
    const arcSteps = 44;
    const collarGap = 0.425;
    const aStart = collarGap;
    const aEnd = Math.PI * 2 - collarGap;
    for (let i = 0; i <= arcSteps; i++) {
      const a = aStart + (i / arcSteps) * (aEnd - aStart);
      const x = cx + Math.cos(a) * (rx + 0.34);
      const y = -cz - Math.sin(a) * (rz + 0.34);
      if (i === 0) collarShape.moveTo(x, y);
      else collarShape.lineTo(x, y);
    }
    for (let i = arcSteps; i >= 0; i--) {
      const a = aStart + (i / arcSteps) * (aEnd - aStart);
      const x = cx + Math.cos(a) * (rx - 0.08);
      const y = -cz - Math.sin(a) * (rz - 0.08);
      collarShape.lineTo(x, y);
    }
    collarShape.closePath();
    const collarGeo = new THREE.ExtrudeGeometry(collarShape, { depth: 0.64, bevelEnabled: false });
    const collar = new THREE.Mesh(collarGeo, [balconyWhiteFasciaMat, fasciaSideMat]);
    collar.rotation.x = -Math.PI / 2;
    // Tuck top face 2cm strictly BELOW the marble floor surface (ZERO flat untextured cream rim slab overlapping reflective marble!)
    collar.position.y = yFloor - 0.66;
    root.add(collar);
  }

  // ==========================================================================
  // 2. BUILD ALL 7 FLOOR SLABS + PLANAR MARBLE REFLECTORS + BALUSTRADES
  // ==========================================================================
  for (const floor of FLOORS) {
    const fIdx = floor.index;
    const y = floor.y;
    const wells = getEscalatorWellsForFloor(fIdx);

    // --- A. 1 UTAMA E (LG..3F) ---
    if (floor.has1UE) {
      const ue = BOUNDS.ueWing;
      const shape = rectShape(ue.xMin, ue.xMax, ue.zMin, ue.zMax);
      for (const w of wells.filter((item) => item.esc.wing === 'ue')) {
        shape.holes.push(rectPath(w.xMin, w.xMax, w.zMin, w.zMax));
        addRectVoidCollar(w.xMin, w.xMax, w.zMin, w.zMax, y, 0.20);
        addRectBalustrade(w.xMin, w.zMin - 0.08, w.xMax, w.zMin - 0.08, y);
        addRectBalustrade(w.xMin, w.zMax + 0.08, w.xMax, w.zMax + 0.08, y);
        // Only cap the back well edge on the VERY TOP terminus floor (NEVER block stacked escalator entrances!)
        if (fIdx === 4 && w.esc.direction === 1) addRectBalustrade(w.xMin - 0.08, w.zMin, w.xMin - 0.08, w.zMax, y);
      }
      const isDistrictK = fIdx === 2 || fIdx === 3;
      // Note: ceilMat is the UNDERSIDE of floor fIdx (= ceiling of floor fIdx - 1), so industrial plenum goes on 2F & 3F undersides (covering 1F & 2F District K)!
      const slabCeilMat = fIdx === 3 || fIdx === 4 ? districtKPlenumMat : ceilWoodMat;
      addSlab(
        fIdx,
        shape,
        y,
        isDistrictK ? districtKFloorMat : ueFloorMat,
        slabCeilMat,
        isDistrictK ? '#ece6dc' : '#e6dfd4'
      );

      if (isDistrictK) {
        // Authentic 1 Utama District K (1UE 1F & 2F): Suspended parallel multicolor acoustic baffle slats WITH visible steel suspension rods!
        const dkBaffleMats = [
          new THREE.MeshStandardMaterial({ color: '#f3eee4', roughness: 0.46, metalness: 0.08 }),
          new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.42, metalness: 0.10 }),
          new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.42, metalness: 0.10 }),
          new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.42, metalness: 0.10 }),
          new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.42, metalness: 0.10 })
        ];
        const baffleGeo = new THREE.BoxGeometry(0.16, 0.40, 16.4);
        const suspRodGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.46, 6);
        let bIdx = 0;
        for (let bx = -180.5; bx <= -133.5; bx += 1.45) {
          const slat = new THREE.Mesh(baffleGeo, dkBaffleMats[bIdx % dkBaffleMats.length]);
          slat.position.set(bx, y + 5.02, 0);
          root.add(slat);
          if (bIdx % 2 === 0) {
            for (const rz of [-6.8, 6.8]) {
              const rod = new THREE.Mesh(suspRodGeo, steelHandrailMat);
              rod.position.set(bx, y + 5.34, rz);
              root.add(rod);
            }
          }
          bIdx++;
        }
        // 3D Dark Galvanized Cylindrical HVAC Spiral Ducts running along the District K exposed industrial plenum!
        const hvacMat = new THREE.MeshStandardMaterial({ color: '#3b4352', roughness: 0.38, metalness: 0.72, envMapIntensity: 0.85 });
        for (const dz of [-9.4, 9.4]) {
          const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 48.0, 14), hvacMat);
          duct.rotation.z = Math.PI / 2;
          duct.position.set(-157.0, y + 5.18, dz);
          root.add(duct);
        }
        // Iconic District K Plaza (BOTH 1F & 2F!): High-Segment Smooth Suspended HDR Glowing Circular LED Halo Rings WITH steel cables!
        if (fIdx === 2 || fIdx === 3) {
          const dkHalos = fIdx === 2
            ? [
                { x: -163.5, z: -4.2, r: 3.1, c: new THREE.Color(2.4, 1.35, 0.36) },
                { x: -156.2, z: 3.4, r: 3.4, c: new THREE.Color(0.35, 1.85, 2.55) },
                { x: -150.0, z: -2.2, r: 2.7, c: new THREE.Color(2.4, 0.42, 1.48) }
              ]
            : [
                { x: -162.5, z: -1.8, r: 3.2, c: new THREE.Color(0.35, 1.95, 2.55) },
                { x: -154.0, z: 4.0, r: 2.9, c: new THREE.Color(2.4, 1.15, 0.32) },
                { x: -146.5, z: -3.2, r: 2.6, c: new THREE.Color(2.3, 0.48, 1.45) }
              ];
          for (const h of dkHalos) {
            const ring = new THREE.Mesh(
              new THREE.TorusGeometry(h.r, 0.11, 14, 72),
              new THREE.MeshBasicMaterial({ color: h.c, toneMapped: false })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.set(h.x, y + 4.46, h.z);
            root.add(ring);
            for (let k = 0; k < 4; k++) {
              const ka = (k / 4) * Math.PI * 2 + 0.4;
              const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.02, 6), steelHandrailMat);
              cable.position.set(h.x + Math.cos(ka) * h.r, y + 4.98, h.z + Math.sin(ka) * h.r);
              root.add(cable);
            }
          }
        }
      } else {
        for (const zLine of [-8.5, 8.5]) {
          const neon = new THREE.Mesh(new THREE.BoxGeometry(46, 0.08, 0.12), pinkNeonMat);
          neon.position.set(-158, y + 5.36, zLine);
          root.add(neon);
        }
      }
      if (fIdx === 4) {
        addSlab(fIdx, rectShape(ue.xMin, ue.xMax, ue.zMin, ue.zMax), y + 6.0, rooftopFloorMat, ceilWoodMat, null);
      }
    }

    // --- B. OLD WING (LG..3F) ---
    if (floor.hasOldWing) {
      const ow = BOUNDS.oldWing;
      const shape = rectShape(ow.xMin, ow.xMax, ow.zMin, ow.zMax);

      if (fIdx >= 2) {
        const cc = BOUNDS.centreCourtVoid;
        shape.holes.push(rectPath(cc.xMin, cc.xMax, cc.zMin, cc.zMax));
        shape.holes.push(rectPath(-101.7, -98.7, -1.5, 1.5));
        addRectVoidCollar(cc.xMin, cc.xMax, cc.zMin, cc.zMax, y, 0.24);
        addRectBalustrade(cc.xMin, cc.zMin, cc.xMax, cc.zMin, y);
        addRectBalustrade(cc.xMin, cc.zMax, cc.xMax, cc.zMax, y);
        addRectBalustrade(cc.xMax, cc.zMin, cc.xMax, cc.zMax, y);
        // Continuous glass balustrade along West rim of Centre Court void (oldwing-lift door faces WEST at x=-101.6, never blocked!)
        addRectBalustrade(cc.xMin, cc.zMin, cc.xMin, cc.zMax, y);

        const coveGeo = new THREE.BoxGeometry(cc.xMax - cc.xMin + 0.2, 0.12, 0.14);
        for (const zEdge of [cc.zMin, cc.zMax]) {
          const cove = new THREE.Mesh(coveGeo, warmCoveLedMat);
          cove.position.set((cc.xMin + cc.xMax) * 0.5, y - 0.22, zEdge);
          root.add(cove);
        }
      }

      for (const w of wells.filter((item) => item.esc.wing === 'old')) {
        shape.holes.push(rectPath(w.xMin, w.xMax, w.zMin, w.zMax));
        addRectVoidCollar(w.xMin, w.xMax, w.zMin, w.zMax, y, 0.20);
        addRectBalustrade(w.xMin, w.zMin - 0.08, w.xMax, w.zMin - 0.08, y);
        addRectBalustrade(w.xMin, w.zMax + 0.08, w.xMax, w.zMax + 0.08, y);
        if (fIdx === 4 && w.esc.direction === 1) addRectBalustrade(w.xMin - 0.08, w.zMin, w.xMin - 0.08, w.zMax, y);
      }

      addSlab(fIdx, shape, y, oldWingFloorMat, ceilWarmMat, '#e8dbc4');
    }

    // --- C. PROMENADE BRIDGE (LG..3F — Open Central Atrium Void on 1F & 2F + Escalator Wells + Blue-Teal Fluted Columns!) ---
    if (floor.hasPromenade) {
      const pr = BOUNDS.promenade;
      const prShape = rectShape(pr.xMin, pr.xMax, pr.zMin, pr.zMax);
      if (fIdx === 2 || fIdx === 3) {
        const pv = BOUNDS.promenadeVoid;
        prShape.holes.push(rectPath(pv.xMin, pv.xMax, pv.zMin, pv.zMax));
        addRectVoidCollar(pv.xMin, pv.xMax, pv.zMin, pv.zMax, y, 0.22);
        addRectBalustrade(pv.xMin, pv.zMin, pv.xMax, pv.zMin, y);
        addRectBalustrade(pv.xMin, pv.zMax, pv.xMax, pv.zMax, y);
        addRectBalustrade(pv.xMin, pv.zMin, pv.xMin, pv.zMax, y);
        addRectBalustrade(pv.xMax, pv.zMin, pv.xMax, pv.zMax, y);
      }
      if (fIdx >= 1 && fIdx <= 3) {
        for (const w of wells.filter((item) => item.esc.wing === 'promenade')) {
          prShape.holes.push(rectPath(w.xMin, w.xMax, w.zMin, w.zMax));
          addRectVoidCollar(w.xMin, w.xMax, w.zMin, w.zMax, y, 0.20);
          addRectBalustrade(w.xMin, w.zMin - 0.08, w.xMax, w.zMin - 0.08, y);
          addRectBalustrade(w.xMin, w.zMax + 0.08, w.xMax, w.zMax + 0.08, y);
          if (fIdx === 3) addRectBalustrade(w.xMin - 0.08, w.zMin, w.xMin - 0.08, w.zMax, y);
        }
      }
      addSlab(fIdx, prShape, y, newWingFloorMat, ceilWoodMat, '#d8e0eb');
      // Iconic Promenade White Fluted Columns w/ 3-Tone Gradient Blue/Teal Base Bands (#030, #202, #279, #412!)
      if (fIdx >= 1 && fIdx <= 3) {
        const prColWhiteMat = new THREE.MeshStandardMaterial({ color: '#eef2f6', roughness: 0.42 });
        const prBlueBands = ['#93c5fd', '#3b82f6', '#1e4e6e'];
        for (const px of [-21.2, -7.5, 5.5]) {
          for (const pz of [-4.1, 4.1]) {
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 5.35, 18), prColWhiteMat);
            shaft.position.set(px, y + 2.68, pz);
            root.add(shaft);
            prBlueBands.forEach((hex, bi) => {
              const band = new THREE.Mesh(new THREE.CylinderGeometry(0.435, 0.435, 0.42, 18), new THREE.MeshStandardMaterial({ color: hex, roughness: 0.44 }));
              band.position.set(px, y + 1.06 - bi * 0.42, pz);
              root.add(band);
            });
          }
        }
      }
      // Sleek architectural bronze threshold divider strip along Old Wing <-> Promenade marble transition!
      const thresh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 21.0), brassGoldMat);
      thresh.position.set(-28.0, y + 0.008, 0);
      root.add(thresh);

      for (const zSide of [-11.8, 11.8]) {
        const glass = new THREE.Mesh(new THREE.BoxGeometry(10, 5.2, 0.1), curtainGlassMat);
        glass.position.set(-8, y + 2.6, zSide);
        root.add(glass);
      }
      if (fIdx === 4) {
        addSlab(fIdx, rectShape(pr.xMin, pr.xMax, pr.zMin, pr.zMax), y + 6.0, rooftopFloorMat, ceilWoodMat, null);
      }
    }

    // --- D. NEW WING & UPPER ROOF (LG..UR) ---
    if (floor.hasNewWing) {
      const b = floor.isRooftop ? BOUNDS.rooftop : BOUNDS.newWing;
      const nwShape = rectShape(b.xMin, b.xMax, b.zMin, b.zMax);

      if (fIdx === 0) {
        // LG beneath the Ground Floor Rainforest Koi Pond uses the unified reflective LG marble floor (no stretched flat quad!)
      }

      if (fIdx >= 1) {
        nwShape.holes.push(rectPath(16.0, 19.0, -1.5, 1.5));
      }

      // VERIFIED 2025 WALKTHROUGH (#009, #010, #016, #018, #352, #383) & USER PHOTO (media_1795337629668_975ac4eb.jpg):
      // THE RAINFOREST IS AN OPEN-TO-THE-SKY CIRCULAR COURTYARD (NOT AN INDOOR MALL CEILING!)
      // Punch a wide elliptical open-sky well through GF..UR (fIdx 1..6) so ZERO indoor mall ceilings hover above 2F bridge!
      if (fIdx === 1) {
        // GF Rainforest Glossy Diagonal Terracotta Tile & Limestone Floor around the Ground Floor Koi Pond courtyard (#352, #383!)
        const rfFloorTex = createRainforestTerracottaFloorTexture();
        const rfTerraFloorMat = new THREE.MeshStandardMaterial({ map: rfFloorTex, roughness: 0.24, metalness: 0.05, envMapIntensity: 0.72 });
        const rfRing = rectShape(14.0, 62.0, -22.8, 22.8);
        rfRing.holes.push(ellipsePath(38.0, 0.0, 17.6, 12.8, 52));
        const rfTerraMesh = new THREE.Mesh(new THREE.ShapeGeometry(rfRing), rfTerraFloorMat);
        rfTerraMesh.rotation.x = -Math.PI / 2;
        rfTerraMesh.position.y = y + 0.014;
        rfTerraMesh.receiveShadow = true;
        root.add(rfTerraMesh);

        // Photo-matched LUXE G Bright White Calacatta Marble Floor Inlay (x=63..117, z=-22.6..22.6 — #389, #400!)
        const calacattaMaps = createMarbleFloorMaps({
          baseHex: '#f6f4ef',
          altHex: '#efece4',
          veinColor: '#c8bfb0',
          groutColor: '#d9d3c7',
          tiles: 4,
          baseRoughness: 28,
          repeatX: 0.14,
          repeatY: 0.14
        });
        const calacattaMat = new THREE.MeshStandardMaterial({
          map: calacattaMaps.map,
          roughnessMap: calacattaMaps.roughnessMap,
          normalMap: calacattaMaps.normalMap,
          normalScale: new THREE.Vector2(0.28, 0.28),
          metalness: 0.04,
          envMapIntensity: 0.72
        });
        const luxeGFloor = new THREE.Mesh(new THREE.ShapeGeometry(rectShape(63.0, 117.5, -22.6, 22.6)), calacattaMat);
        luxeGFloor.rotation.x = -Math.PI / 2;
        luxeGFloor.position.y = y + 0.014;
        luxeGFloor.receiveShadow = true;
        root.add(luxeGFloor);

        // Textured Dark-Walnut Wood Rim encircling the Ground Floor Oval Atrium balustrade base (#372!)
        const gfOvalWalnutPts = [];
        for (let oi = 0; oi <= 56; oi++) {
          const a = 0.372 + (oi / 56) * (Math.PI * 2 - 0.744);
          gfOvalWalnutPts.push(new THREE.Vector3(138.0 + Math.cos(a) * 18.85, y + 0.06, Math.sin(a) * 12.15));
        }
        const gfOvalRim = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gfOvalWalnutPts, false), 56, 0.13, 8, false),
          new THREE.MeshStandardMaterial({ color: '#4c3220', roughness: 0.52, metalness: 0.08 })
        );
        root.add(gfOvalRim);
      }

      if (fIdx >= 1 && fIdx <= 6) {
        // Circular/elliptical open-air Rainforest courtyard spanning GF..UR (full height of the mall!)
        const rxRF = fIdx <= 3 ? 17.6 : fIdx === 4 ? 18.0 : fIdx === 5 ? 18.75 : 19.65;
        const rzRF = fIdx <= 3 ? 12.8 : fIdx === 4 ? 13.1 : fIdx === 5 ? 13.65 : 14.30;
        nwShape.holes.push(ellipsePath(38.0, 0.0, rxRF, rzRF, 56));

        // On GF (1): Low curved salmon-terracotta Koi Pond curb cleanly OPEN at West & N/S wooden boardwalk entries (Photo 3!)
        // On 1F (2), 2F (3) & 3F (4): Curved Warm Salmon-Terracotta Parapet Balconies & Spandrel Bands (#be7c57) + Dense Vertical Stainless Pickets (Photo 1 & 2!)
        if (fIdx <= 4) {
          const terraBalconyMat = new THREE.MeshStandardMaterial({ color: '#c27952', roughness: 0.58, metalness: 0.05, envMapIntensity: 0.34 });
          const terraCapMat = new THREE.MeshStandardMaterial({ color: '#8e5a3b', roughness: 0.54, metalness: 0.08 });
          const segs = 56;
          for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const am = (a1 + a2) * 0.5;
            const mx = 38.0 + Math.cos(am) * rxRF;
            const mz = Math.sin(am) * rzRF;
            // On GF (fIdx === 1), leave wide open step-down entries onto the Ground Floor Koi Pond timber boardwalks (West x~20.4 & N/S x~38)!
            if (fIdx === 1 && ((mx < 22.0 && Math.abs(mz) < 3.6) || Math.abs(mx - 38.0) < 3.4)) continue;
            // On 2F (fIdx === 3), leave clean bridge entry gaps at North (z=-12.8) & South (z=+12.8) around x=38!
            if (fIdx === 3 && Math.abs(mx - 38.0) < 2.2) continue;
            const x1 = 38.0 + Math.cos(a1) * rxRF;
            const z1 = Math.sin(a1) * rzRF;
            const x2 = 38.0 + Math.cos(a2) * rxRF;
            const z2 = Math.sin(a2) * rzRF;
            const segLen = Math.hypot(x2 - x1, z2 - z1);
            const segAng = Math.atan2(x2 - x1, z2 - z1);
            if (fIdx === 1) {
              // Low stone/terracotta garden pond curb on Ground Floor (NO high wall hiding the Koi Pond!)
              const gfCurb = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.34, segLen + 0.06), terraBalconyMat);
              gfCurb.position.set((x1 + x2) * 0.5, y + 0.14, (z1 + z2) * 0.5);
              gfCurb.rotation.y = segAng;
              root.add(gfCurb);
            } else {
              // 1F, 2F & 3F curved salmon-terracotta spandrel parapet wall + dense brushed-steel vertical picket balustrade (Photo 1 & 2!)
              const paraH = fIdx === 4 ? 1.62 : 1.52;
              const para = new THREE.Mesh(new THREE.BoxGeometry(0.32, paraH, segLen + 0.06), terraBalconyMat);
              para.position.set((x1 + x2) * 0.5, y - 0.18, (z1 + z2) * 0.5);
              para.rotation.y = segAng;
              const cap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, segLen + 0.06), terraCapMat);
              cap.position.set((x1 + x2) * 0.5, y + 0.58, (z1 + z2) * 0.5);
              cap.rotation.y = segAng;
              const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, segLen + 0.04), steelHandrailMat);
              topRail.position.set((x1 + x2) * 0.5, y + 1.12, (z1 + z2) * 0.5);
              topRail.rotation.y = segAng;
              const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.032, segLen + 0.04), steelHandrailMat);
              midRail.position.set((x1 + x2) * 0.5, y + 0.66, (z1 + z2) * 0.5);
              midRail.rotation.y = segAng;
              root.add(para, cap, topRail, midRail);
              // Dense vertical steel pickets (~0.24m spacing along each segment) matching Photo 1 & 2!
              const pCount = Math.max(3, Math.round(segLen / 0.24));
              for (let p = 0; p < pCount; p++) {
                const frac = (p + 0.5) / pCount;
                const px = x1 + (x2 - x1) * frac;
                const pz = z1 + (z2 - z1) * frac;
                const picket = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.48, 5), steelHandrailMat);
                picket.position.set(px, y + 0.89, pz);
                root.add(picket);
              }
            }
          }
          // Glowing red Nando's balcony sign visible on 1F curved Rainforest gallery (exact Photo 1 detail!)
          if (fIdx === 2) {
            const nandosTex = createSignBoardTexture("Nando's", 'PERi-PERi CHICKEN  •  1F RAINFOREST', '#181414', '#ef4444', '#facc15', 512, 128);
            const nandosSign = new THREE.Mesh(
              new THREE.PlaneGeometry(3.4, 0.78),
              new THREE.MeshBasicMaterial({ map: nandosTex, side: THREE.DoubleSide })
            );
            nandosSign.position.set(53.2, y + 3.4, 7.6);
            nandosSign.rotation.y = 0.89;
            root.add(nandosSign);
          }
        } else {
          // Upper floors (3F, 4F, UR): sleek protective glass safety rim outside the circular glass funnel
          const segs = 48;
          for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            addRectBalustrade(
              38.0 + Math.cos(a1) * (rxRF + 0.15), Math.sin(a1) * (rzRF + 0.15),
              38.0 + Math.cos(a2) * (rxRF + 0.15), Math.sin(a2) * (rzRF + 0.15),
              y, 1.08, false
            );
          }
        }
      }
      if (fIdx >= 2 && fIdx <= 4) {
        const hs = BOUNDS.highstreetVoid;
        nwShape.holes.push(rectPath(hs.xMin, hs.xMax, hs.zMin, hs.zMax));
        addRectVoidCollar(hs.xMin, hs.xMax, hs.zMin, hs.zMax, y, 0.22);
        addRectBalustrade(hs.xMin, hs.zMin, hs.xMax, hs.zMin, y);
        addRectBalustrade(hs.xMin, hs.zMax, hs.xMax, hs.zMax, y);
        addRectBalustrade(hs.xMin, hs.zMin, hs.xMin, hs.zMax, y);
        addRectBalustrade(hs.xMax, hs.zMin, hs.xMax, hs.zMax, y);
      }

      if (fIdx >= 1) {
        const ov = BOUNDS.ovalVoid;
        nwShape.holes.push(ellipsePath(ov.cx, ov.cz, ov.rx, ov.rz, 52));
        nwShape.holes.push(rectPath(158.7, 161.8, -3.9, 3.9));
        addOvalBalustradeAndCollar(ov.cx, ov.cz, ov.rx + 0.15, ov.rz + 0.15, y, !floor.isRooftop);

        const lbXMin = 154.0;
        const lbXMax = 158.7;
        const lb = BOUNDS.ovalLiftBridge;
        // Extrude elevator lobby deck using IDENTICAL world-meter marble UVs, planar Floor Reflector & coffered underside soffit!
        const lbShape = rectShape(lbXMin, lbXMax, lb.zMin, lb.zMax);
        const bridgeMesh = new THREE.Mesh(
          new THREE.ExtrudeGeometry(lbShape, { depth: SLAB_THICKNESS, bevelEnabled: false }),
          [floor.isRooftop ? rooftopFloorMat : newWingFloorMat, balconyWhiteFasciaMat]
        );
        bridgeMesh.rotation.x = -Math.PI / 2;
        bridgeMesh.position.y = y - SLAB_THICKNESS;
        bridgeMesh.receiveShadow = true;
        root.add(bridgeMesh);
        if (!floor.isRooftop) {
          addFloorReflector(fIdx, lbShape, y, '#e6dccb');
          const bridgeCeil = new THREE.Mesh(new THREE.ShapeGeometry(lbShape), ceilCoolMat);
          bridgeCeil.rotation.x = Math.PI / 2;
          bridgeCeil.position.y = y - SLAB_THICKNESS - 0.025;
          root.add(bridgeCeil);
        }
        // Wrap UNIFIED clear glass railing STRICTLY around the 3 overhanging drop-off void edges ONLY (x=154.05..joinX)!
        // Leaves the entire x=joinX..158.70 marble lobby directly in front of BOTH panoramic elevator doors 100% OPEN!
        const joinX = ov.cx + Math.cos(0.372) * (ov.rx + 0.15);
        addRectBalustrade(lbXMin + 0.05, lb.zMin, lbXMin + 0.05, lb.zMax, y, 1.08, !floor.isRooftop);
        addRectBalustrade(lbXMin + 0.05, lb.zMin, joinX, lb.zMin, y, 1.08, !floor.isRooftop);
        addRectBalustrade(lbXMin + 0.05, lb.zMax, joinX, lb.zMax, y, 1.08, !floor.isRooftop);
        // Clean mitered brushed-steel corner stanchions joining the Oval curve & straight lift bridge deck seamlessly!
        for (const zCorner of [lb.zMin, lb.zMax]) {
          const miterPost = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 1.12, 12), steelHandrailMat);
          miterPost.position.set(joinX, y + 0.56, zCorner);
          root.add(miterPost);
        }

        const ringPts = [];
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * Math.PI * 2;
          ringPts.push(new THREE.Vector3(ov.cx + Math.cos(a) * (ov.rx - 0.04), y - 0.34, ov.cz + Math.sin(a) * (ov.rz - 0.04)));
        }
        const ringGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ringPts, true), 64, 0.10, 6, true);
        // Warm golden luxury cove light along every elliptical Oval balcony soffit!
        root.add(new THREE.Mesh(ringGeo, warmCoveLedMat));
      }

      for (const w of wells.filter((item) => item.esc.wing === 'rainforest' || item.esc.wing === 'oval')) {
        nwShape.holes.push(rectPath(w.xMin, w.xMax, w.zMin, w.zMax));
        addRectVoidCollar(w.xMin, w.xMax, w.zMin, w.zMax, y, 0.20);
        addRectBalustrade(w.xMin, w.zMin - 0.08, w.xMax, w.zMin - 0.08, y, 1.08, !floor.isRooftop);
        addRectBalustrade(w.xMin, w.zMax + 0.08, w.xMax, w.zMax + 0.08, y, 1.08, !floor.isRooftop);
        const isTopEnd = (w.esc.wing === 'rainforest' && fIdx === 4) || (w.esc.wing === 'oval' && fIdx === 6);
        if (isTopEnd && w.esc.direction === 1) addRectBalustrade(w.xMin - 0.08, w.zMin, w.xMin - 0.08, w.zMax, y, 1.08, !floor.isRooftop);
      }

      addSlab(
        fIdx,
        nwShape,
        y,
        floor.isRooftop ? rooftopFloorMat : newWingFloorMat,
        ceilCoolMat,
        floor.isRooftop ? null : '#e6dccb'
      );

      if (floor.isRooftop) {
        addRectBalustrade(b.xMin + 0.6, b.zMin + 0.6, b.xMax - 0.6, b.zMin + 0.6, y, 1.35, false);
        addRectBalustrade(b.xMin + 0.6, b.zMax - 0.6, b.xMax - 0.6, b.zMax - 0.6, y, 1.35, false);
        addRectBalustrade(b.xMin + 0.6, b.zMin + 0.6, b.xMin + 0.6, b.zMax - 0.6, y, 1.35, false);
        addRectBalustrade(b.xMax - 0.6, b.zMin + 0.6, b.xMax - 0.6, b.zMax - 0.6, y, 1.35, false);
      }
    }
  }
  finalizeUnifiedFloorReflectors();

  // Clean unobstructed honed marble concourse floor in The Oval & Centre Court (removed artificial yellow concentric ring decal!)

  // ==========================================================================
  // 3. SKYLIGHT DOMES, VOLUMETRIC GOD-RAYS & DRIFTING SUNBEAM DUST MOTES
  // ==========================================================================
  {
    const ow = BOUNDS.oldWing;
    const cc = BOUNDS.centreCourtVoid;
    // Extend Old Wing solid roof canopy slightly past perimeter walls (seals all stray directional sunlight leaks under covered walkways!)
    const roofShape = rectShape(ow.xMin - 4, ow.xMax + 4, ow.zMin - 4, ow.zMax + 4);
    roofShape.holes.push(rectPath(cc.xMin, cc.xMax, cc.zMin, cc.zMax));
    addSlab(4, roofShape, 30.2, rooftopFloorMat, ceilWarmMat, null);

    // Architectural dark steel perimeter transom collar capping Old Wing skylight (ZERO jagged floating edges!)
    const ccW = cc.xMax - cc.xMin;
    const ccD = cc.zMax - cc.zMin;
    const ccCX = (cc.xMin + cc.xMax) * 0.5;
    for (const zE of [cc.zMin, cc.zMax]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(ccW + 0.8, 0.72, 0.52), darkFasciaTrimMat);
      beam.position.set(ccCX, 30.05, zE);
      root.add(beam);
    }
    for (const xE of [cc.xMin, cc.xMax]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, ccD + 0.8), darkFasciaTrimMat);
      beam.position.set(xE, 30.05, 0);
      root.add(beam);
    }

    const skyGeo = new THREE.CylinderGeometry(10.75, 10.75, ccW + 0.4, 28, 1, true, 0, Math.PI);
    const skyMesh = new THREE.Mesh(skyGeo, skylightMat);
    skyMesh.rotation.z = Math.PI / 2;
    // Scale local X (= world Y arch height!) NOT local Z (= full 21.5m Z span seated flush on beams!)
    skyMesh.scale.set(0.36, 1, 1);
    skyMesh.position.set(ccCX, 30.08, 0);
    root.add(skyMesh);
    // Closed glazed lunette end-gables sealing Old Wing skylight flush onto perimeter beams!
    for (const xE of [cc.xMin, cc.xMax]) {
      const gable = new THREE.Mesh(new THREE.CircleGeometry(10.75, 28, 0, Math.PI), skylightMat);
      gable.rotation.y = Math.PI / 2;
      gable.scale.set(1, 0.36, 1);
      gable.position.set(xE, 30.08, 0);
      root.add(gable);
    }

    // 3D Curved Dark-Steel Space-Frame Skylight Arch Ribs casting sunlit grid shadows!
    for (let rx = cc.xMin + 4; rx <= cc.xMax - 4; rx += 6.5) {
      const archPts = [];
      for (let k = 0; k <= 16; k++) {
        const a = (k / 16) * Math.PI;
        archPts.push(new THREE.Vector3(rx, 30.08 + Math.sin(a) * 10.65 * 0.36, Math.cos(a) * 10.65));
      }
      const rib = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts), 18, 0.14, 6, false),
        darkFasciaTrimMat
      );
      rib.castShadow = true;
      root.add(rib);
    }

    const rayMat = createVolumetricGodRayMaterial('#ffe8b6', 0.24);
    godRayMaterials.push(rayMat);
    const rayCone = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 16.5, 29.0, 24, 1, true), rayMat);
    rayCone.position.set(-74, 15.0, 2.0);
    rayCone.rotation.x = 0.22;
    rayCone.rotation.z = -0.14;
    const rayCone2 = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 11.5, 26.0, 20, 1, true), rayMat);
    rayCone2.position.set(-84, 14.5, 5.5);
    rayCone2.rotation.x = 0.26;
    rayCone2.rotation.z = -0.18;
    root.add(rayCone, rayCone2);
  }

  {
    // ========================================================================
    // REAL 1 UTAMA OPEN-AIR CIRCULAR GRIDDED-GLASS RAINFOREST CURTAIN-WALL FUNNEL
    // (100% Photo-Exact to media_1795337629668_975ac4eb.jpg & Video #009, #010, #017!)
    // Rises from 2F balcony crown (y = 22.6) flaring slightly outward up into BRIGHT OPEN SKY (y = 38.4) — ZERO enclosed ceiling!
    // ========================================================================
    const rfGlassTex = createRainforestGlassGridTexture();
    const rfFunnelGlassMat = new THREE.MeshStandardMaterial({
      map: rfGlassTex,
      color: '#e8f6f5',
      emissive: '#cceef4',
      emissiveIntensity: 0.24,
      transparent: true,
      opacity: 0.62,
      roughness: 0.12,
      metalness: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const rfForestTrussMat = new THREE.MeshStandardMaterial({ color: '#1d4d3a', roughness: 0.36, metalness: 0.68, envMapIntensity: 0.85 });
    const rfSilverMullionMat = new THREE.MeshStandardMaterial({ color: '#8f9ea4', roughness: 0.28, metalness: 0.80 });

    // Full-Height Inverted-Conical Clear Gridded-Glass Sky Curtain Wall rising ALL THE WAY to the top of the mall (y = 22.6..38.8 — Photo 1 & 2!)
    const funnelH = 16.2;
    const rfZScale = 12.8 / 17.6; // 0.72727 exact match to elliptical floor cutouts!
    const rfBotR = 17.6;
    const rfTopR = 19.6;
    rfFunnelGlassMat.color.set('#f4fbff');
    rfFunnelGlassMat.emissive.set('#dff2fc');
    rfFunnelGlassMat.emissiveIntensity = 0.62;
    rfFunnelGlassMat.opacity = 0.56;
    const funnelGeo = new THREE.CylinderGeometry(rfTopR, rfBotR, funnelH, 60, 1, true);
    const funnelMesh = new THREE.Mesh(funnelGeo, rfFunnelGlassMat);
    funnelMesh.scale.set(1.0, 1.0, rfZScale);
    funnelMesh.position.set(38.0, 22.6 + funnelH * 0.5, 0);
    root.add(funnelMesh);

    // Weathered Brushed Steel-Grey Circular Rain Gutter Pipe rimming the 2F glass funnel base (#010, #013!)
    {
      const gutterPts = [];
      for (let i = 0; i <= 56; i++) {
        const a = (i / 56) * Math.PI * 2;
        gutterPts.push(new THREE.Vector3(38.0 + Math.cos(a) * 17.58, 22.45, Math.sin(a) * 17.58 * rfZScale));
      }
      root.add(new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gutterPts, true), 64, 0.20, 10, true),
        new THREE.MeshStandardMaterial({ color: '#7a7d7c', roughness: 0.42, metalness: 0.65 })
      ));
    }

    // GIANT CIRCULAR FOREST-GREEN OPEN SPACE-TRUSS SKYLIGHT RINGS (2F Collar y=22.8..24.45 + 3F Overhead Dome Collar y=27.6..29.2 & Diagonal Web up to y=33.2) + HANGING BLACK ARCHITECTURAL FLOODLIGHTS (Exact Photo 2!)
    {
      const floodMat = new THREE.MeshStandardMaterial({ color: '#14171c', roughness: 0.42, metalness: 0.65 });
      const floodLensMat = new THREE.MeshBasicMaterial({ color: '#fff8dc' });
      const trussTiers = [
        { rIn: 16.5, rOut: 17.5, rTop: 17.2, yBot: 22.8, yTop: 24.45, floodY: 22.45, floodR: 16.3 },
        { rIn: 17.6, rOut: 18.6, rTop: 18.2, yBot: 27.6, yTop: 29.20, floodY: 27.25, floodR: 17.35 }
      ];
      for (const tier of trussTiers) {
        const ringSpecs = [
          { r: tier.rIn, y: tier.yBot, rad: 0.14 },
          { r: tier.rOut, y: tier.yBot, rad: 0.14 },
          { r: tier.rTop, y: tier.yTop, rad: 0.13 }
        ];
        for (const rs of ringSpecs) {
          const rPts = [];
          for (let i = 0; i <= 56; i++) {
            const a = (i / 56) * Math.PI * 2;
            rPts.push(new THREE.Vector3(38.0 + Math.cos(a) * rs.r, rs.y, Math.sin(a) * rs.r * rfZScale));
          }
          root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rPts, true), 64, rs.rad, 8, true), rfForestTrussMat));
        }
        // Crisp 3D triangular open space-truss web struts around each circular forest-green ring!
        const trussN = 44;
        for (let t = 0; t < trussN; t++) {
          const a1 = (t / trussN) * Math.PI * 2;
          const a2 = ((t + 1) / trussN) * Math.PI * 2;
          const am = (a1 + a2) * 0.5;
          const pIn = new THREE.Vector3(38.0 + Math.cos(a1) * tier.rIn, tier.yBot, Math.sin(a1) * tier.rIn * rfZScale);
          const pOut = new THREE.Vector3(38.0 + Math.cos(a1) * tier.rOut, tier.yBot, Math.sin(a1) * tier.rOut * rfZScale);
          const pTop = new THREE.Vector3(38.0 + Math.cos(am) * tier.rTop, tier.yTop, Math.sin(am) * tier.rTop * rfZScale);
          const pInNext = new THREE.Vector3(38.0 + Math.cos(a2) * tier.rIn, tier.yBot, Math.sin(a2) * tier.rIn * rfZScale);
          root.add(
            new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(pIn, pTop), 2, 0.055, 5, false), rfForestTrussMat),
            new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(pOut, pTop), 2, 0.055, 5, false), rfForestTrussMat),
            new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(pInNext, pTop), 2, 0.048, 5, false), rfForestTrussMat),
            new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(pIn, pOut), 2, 0.05, 5, false), rfForestTrussMat)
          );
        }
        // 8 Hanging Matte-Black Architectural Stadium Floodlights mounted along inner rim of the forest-green truss ring (Photo 2!)
        for (let fl = 0; fl < 8; fl++) {
          const fa = (fl / 8) * Math.PI * 2 + 0.35;
          const fx = 38.0 + Math.cos(fa) * tier.floodR;
          const fz = Math.sin(fa) * tier.floodR * rfZScale;
          const fg = new THREE.Group();
          fg.position.set(fx, tier.floodY, fz);
          fg.lookAt(38.0, 14.0, 0.0);
          const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 6), floodMat);
          bracket.position.y = 0.28;
          const housing = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.50, 0.36), floodMat);
          const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.38), floodLensMat);
          lens.position.z = 0.19;
          fg.add(bracket, housing, lens);
          root.add(fg);
        }
      }
      // Upper forest-green dome purlin ring at y=33.2 & diagonal triangular forest-green web struts spanning y=29.2..33.2 (Photo 2 upper skylight framing!)
      const topDomePts = [];
      for (let i = 0; i <= 56; i++) {
        const a = (i / 56) * Math.PI * 2;
        topDomePts.push(new THREE.Vector3(38.0 + Math.cos(a) * 18.75, 33.2, Math.sin(a) * 18.75 * rfZScale));
      }
      root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(topDomePts, true), 64, 0.12, 8, true), rfForestTrussMat));
      const domeWebN = 36;
      for (let w = 0; w < domeWebN; w++) {
        const a1 = (w / domeWebN) * Math.PI * 2;
        const a2 = ((w + 1) / domeWebN) * Math.PI * 2;
        const am = (a1 + a2) * 0.5;
        const pBot1 = new THREE.Vector3(38.0 + Math.cos(a1) * 18.2, 29.2, Math.sin(a1) * 18.2 * rfZScale);
        const pBot2 = new THREE.Vector3(38.0 + Math.cos(a2) * 18.2, 29.2, Math.sin(a2) * 18.2 * rfZScale);
        const pCrown = new THREE.Vector3(38.0 + Math.cos(am) * 18.75, 33.2, Math.sin(am) * 18.75 * rfZScale);
        root.add(
          new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(pBot1, pCrown), 2, 0.055, 5, false), rfForestTrussMat),
          new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(pBot2, pCrown), 2, 0.055, 5, false), rfForestTrussMat)
        );
      }
    }

    // Crisp 3D Structural Horizontal Ring Beams & Vertical Steel Mullions wrapping the full-height circular glass wall!
    const ringHeights = [24.8, 27.4, 30.2, 33.2, 36.0, 38.6];
    for (let rIdx = 0; rIdx < ringHeights.length; rIdx++) {
      const ry = ringHeights[rIdx];
      const frac = (ry - 22.6) / funnelH;
      const rad = rfBotR + frac * (rfTopR - rfBotR);
      const pts = [];
      for (let i = 0; i <= 56; i++) {
        const a = (i / 56) * Math.PI * 2;
        pts.push(new THREE.Vector3(38.0 + Math.cos(a) * rad, ry, Math.sin(a) * rad * rfZScale));
      }
      const ringTube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, rIdx === ringHeights.length - 1 ? 0.16 : 0.065, 8, true),
        rfSilverMullionMat
      );
      root.add(ringTube);
    }
    for (let v = 0; v < 36; v++) {
      const a = (v / 36) * Math.PI * 2;
      const pBot = new THREE.Vector3(38.0 + Math.cos(a) * rfBotR, 22.6, Math.sin(a) * rfBotR * rfZScale);
      const pTop = new THREE.Vector3(38.0 + Math.cos(a) * rfTopR, 38.8, Math.sin(a) * rfTopR * rfZScale);
      const strut = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.LineCurve3(pBot, pTop), 4, v % 4 === 0 ? 0.095 : 0.045, 6, false),
        v % 4 === 0 ? rfForestTrussMat : rfSilverMullionMat
      );
      root.add(strut);
    }

    // GF Fluted Walnut-Teak Wood LED Columns w/ Staggered White Top LEDs, Black Bottom Inlays & Cool-White Ceiling Halo (#352/#382/#383)
    // + 1F/2F Warm Cream-Beige Architectural Round Columns behind the curved salmon-terracotta balconies (Photo 1 & 2!)
    const rfWoodColMat = new THREE.MeshStandardMaterial({ color: '#6e4326', map: teakMaps.map, roughness: 0.48, metalness: 0.08 });
    const rfBlackInlayMat = new THREE.MeshStandardMaterial({ color: '#14161a', roughness: 0.36, metalness: 0.45 });
    const rfCreamColMat = new THREE.MeshStandardMaterial({ color: '#dfd7c8', roughness: 0.50, metalness: 0.06 });
    const rfWhiteLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.75, 1.85, 1.95), toneMapped: false });
    const rfColAngles = [0.38, 0.88, 1.32, 1.82, 2.26, 2.76, 3.52, 4.02, 4.46, 4.96, 5.40, 5.90];
    for (let ci = 0; ci < rfColAngles.length; ci++) {
      const ang = rfColAngles[ci];
      const cx = 38.0 + Math.cos(ang) * 18.25;
      const cz = Math.sin(ang) * 13.30;
      if (ci % 2 === 0) {
        const gfCol = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 5.95, 20), rfWoodColMat);
        gfCol.position.set(cx, 8.98, cz);
        const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.045, 8, 24), rfWhiteLedMat);
        haloRing.rotation.x = Math.PI / 2;
        haloRing.position.set(cx, 11.72, cz);
        root.add(gfCol, haloRing);
        for (let lb = 0; lb < 8; lb++) {
          const la = (lb / 8) * Math.PI * 2;
          const barH = 1.45 + (lb % 3) * 0.72;
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.055, barH, 0.04), rfWhiteLedMat);
          bar.position.set(cx + Math.cos(la) * 0.55, 10.6 - barH * 0.42, cz + Math.sin(la) * 0.55);
          bar.rotation.y = -la;
          const darkH = 1.15 + ((lb + 1) % 3) * 0.45;
          const darkBar = new THREE.Mesh(new THREE.BoxGeometry(0.055, darkH, 0.036), rfBlackInlayMat);
          darkBar.position.set(cx + Math.cos(la) * 0.55, 6.0 + darkH * 0.5, cz + Math.sin(la) * 0.55);
          darkBar.rotation.y = -la;
          root.add(bar, darkBar);
        }
      }
      const upperCol = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 10.55, 16), rfCreamColMat);
      upperCol.position.set(cx, 17.28, cz);
      root.add(upperCol);
    }

    // Soft open-air daylight volumetric rays pouring down from bright sky into Rainforest Suspension Bridge & Koi Pond!
    const rfRayMat = createVolumetricGodRayMaterial('#fff5dc', 0.24);
    godRayMaterials.push(rfRayMat);
    const rfRay = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 16.5, 36.0, 28, 1, true), rfRayMat);
    rfRay.position.set(38, 18.0, 0);
    rfRay.rotation.z = -0.10;
    root.add(rfRay);
  }

  {
    const ov = BOUNDS.ovalVoid;
    const domeGeo = new THREE.SphereGeometry(1, 44, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMesh = new THREE.Mesh(domeGeo, skylightMat);
    domeMesh.scale.set(ov.rx + 0.5, 5.2, ov.rz + 0.5);
    domeMesh.position.set(ov.cx, 37.0, ov.cz);
    root.add(domeMesh);

    // Smooth White Conical Oval Skylight Collar tucked strictly BELOW UR slab (y = 35.4..36.85) so BOTH 4F-08 and UR-08 stay 100% clear!
    const whiteConicalMat = new THREE.MeshStandardMaterial({ color: '#eef0f2', roughness: 0.42, metalness: 0.08, side: THREE.DoubleSide });
    const domeCollar = new THREE.Mesh(new THREE.CylinderGeometry(16.8, 19.8, 1.45, 48, 1, true), whiteConicalMat);
    domeCollar.scale.set(1.0, 1.0, 0.66);
    domeCollar.position.set(ov.cx, 36.12, ov.cz);
    const centerGantry = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.92, 32, 1, true), whiteConicalMat);
    centerGantry.position.set(ov.cx, 35.45, ov.cz);
    for (let c = 0; c < 4; c++) {
      const ca = (c / 4) * Math.PI * 2;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 2.2, 6), skylightAlumMat);
      rod.position.set(ov.cx + Math.cos(ca) * 2.25, 36.8, ov.cz + Math.sin(ca) * 2.25);
      root.add(rod);
    }
    root.add(domeCollar, centerGantry);

    // Glowing Backlit Frosted-White Curved LG->G Oval Parapet Fascia + Warm Dark Wood GF Promenade Border (#154, #372, #373!)
    const ovalBacklitMat = new THREE.MeshStandardMaterial({
      color: '#fffef8',
      emissive: '#fff8e2',
      emissiveIntensity: 0.72,
      roughness: 0.24,
      side: THREE.DoubleSide
    });
    const ovalBacklitRing = new THREE.Mesh(new THREE.CylinderGeometry(ov.rx + 0.04, ov.rx + 0.04, 1.35, 56, 1, true, 0.42, Math.PI * 2 - 0.84), ovalBacklitMat);
    ovalBacklitRing.scale.set(1.0, 1.0, ov.rz / ov.rx);
    ovalBacklitRing.position.set(ov.cx, 5.25, ov.cz);
    root.add(ovalBacklitRing);

    const gfOvalWoodShape = ellipsePath(ov.cx, ov.cz, ov.rx + 2.8, ov.rz + 2.4, 52);
    const gfOvalWoodOuter = new THREE.Shape(gfOvalWoodShape.getPoints(52));
    gfOvalWoodOuter.holes.push(ellipsePath(ov.cx, ov.cz, ov.rx + 0.05, ov.rz + 0.05, 52));
    const gfWoodBorder = new THREE.Mesh(
      new THREE.ShapeGeometry(gfOvalWoodOuter),
      new THREE.MeshStandardMaterial({ color: '#6b472d', roughness: 0.44, metalness: 0.06 })
    );
    gfWoodBorder.rotation.x = -Math.PI / 2;
    gfWoodBorder.position.y = 6.012;
    root.add(gfWoodBorder);

    // (Removed duplicate floating stanzo boards that were skewered by Oval columns in 4F-10 — OV501 Stanzo renders cleanly on its East Oval wall!)

    // 3D Radial Brushed-Aluminum Structural Space-Frame Ribs under the 6-story Oval Glass Skylight Dome!
    for (let r = 0; r < 12; r++) {
      const ang = (r / 12) * Math.PI * 2;
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const phi = (k / 12) * Math.PI * 0.5;
        pts.push(
          new THREE.Vector3(
            ov.cx + Math.cos(ang) * Math.cos(phi) * (ov.rx + 0.4),
            37.0 + Math.sin(phi) * 5.05,
            ov.cz + Math.sin(ang) * Math.cos(phi) * (ov.rz + 0.4)
          )
        );
      }
      const rib = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.14, 8, false),
        skylightAlumMat
      );
      rib.castShadow = true;
      root.add(rib);
    }

    // Structural aluminum ring-beam curbing the Oval Glass Dome on Upper Roof!
    const curbPts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      curbPts.push(new THREE.Vector3(ov.cx + Math.cos(a) * (ov.rx + 0.55), 37.15, ov.cz + Math.sin(a) * (ov.rz + 0.55)));
    }
    const curbGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curbPts, true), 64, 0.28, 8, true);
    root.add(new THREE.Mesh(curbGeo, skylightAlumMat));

    // Dramatic Multi-Beam Volumetric Sunlight Shafts streaming from Oval Dome onto G & LG Concourse!
    const ovalRayMat = createVolumetricGodRayMaterial('#fff2cc', 0.30);
    godRayMaterials.push(ovalRayMat);
    const ovalRay = new THREE.Mesh(new THREE.CylinderGeometry(11.0, 19.0, 38.0, 32, 1, true), ovalRayMat);
    ovalRay.scale.set(1.12, 1, 0.78);
    ovalRay.position.set(ov.cx, 18.5, ov.cz);
    ovalRay.rotation.z = -0.14;
    root.add(ovalRay);
  }
  // Dramatic Highstreet Multi-Story Void Volumetric Skylight Shafts (Shot 8 GF Luxe warm-vs-cool depth — ZERO detached ceiling ribs blocking escalators!)
  {
    const hsRayMat = createVolumetricGodRayMaterial('#fff0cc', 0.28);
    godRayMaterials.push(hsRayMat);
    for (const hx of [76.5, 86.5, 95.5]) {
      const hsRay = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 7.2, 26.5, 18, 1, true), hsRayMat);
      hsRay.position.set(hx, 14.5, 0);
      hsRay.rotation.z = -0.18;
      hsRay.rotation.x = 0.08;
      root.add(hsRay);
    }
  }

  // Drifting Volumetric Atrium Sunbeam Dust Motes!
  const moteCount = 420;
  const motePos = new Float32Array(moteCount * 3);
  const atriumCenters = [
    { x: -74, z: 0, rx: 20, rz: 9, h: 28 },
    { x: 38, z: 0, rx: 16, rz: 11, h: 34 },
    { x: 138, z: 0, rx: 17, rz: 11, h: 35 }
  ];
  for (let i = 0; i < moteCount; i++) {
    const a = atriumCenters[i % 3];
    motePos[i * 3] = a.x + (Math.random() - 0.5) * a.rx * 1.8;
    motePos[i * 3 + 1] = 1.5 + Math.random() * a.h;
    motePos[i * 3 + 2] = a.z + (Math.random() - 0.5) * a.rz * 1.8;
  }
  // Soft circular radial-glow sprite for sunbeam dust motes (ZERO opaque beige squares!)
  const moteCanvas = document.createElement('canvas');
  moteCanvas.width = moteCanvas.height = 64;
  const mCtx = moteCanvas.getContext('2d');
  const mGrad = mCtx.createRadialGradient(32, 32, 0, 32, 32, 30);
  mGrad.addColorStop(0, 'rgba(255, 248, 220, 0.95)');
  mGrad.addColorStop(0.4, 'rgba(255, 243, 199, 0.35)');
  mGrad.addColorStop(1, 'rgba(255, 243, 199, 0.0)');
  mCtx.fillStyle = mGrad;
  mCtx.fillRect(0, 0, 64, 64);
  const moteSpriteTex = new THREE.CanvasTexture(moteCanvas);

  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const moteMat = new THREE.PointsMaterial({
    color: '#fef3c7',
    map: moteSpriteTex,
    size: 0.12,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const dustMotes = new THREE.Points(moteGeo, moteMat);
  root.add(dustMotes);

  // ==========================================================================
  // 4. PERIMETER-ALIGNED ARCHITECTURAL COLUMNS WITH BRONZE PLINTHS (ZERO WALKWAY BLOCKS!)
  // ==========================================================================
  {
    const colPositions = [];
    // 1UE transition portal columns strictly flanking East entry (ZERO mid-storefront bisected signs!)
    for (const z of [-10.6, 10.6]) {
      colPositions.push({ x: -131.6, y: 14.7, z, h: 29.4, r: 0.44, floors: [0, 1, 2, 3, 4] });
    }
    // Old Wing Centre Court void rim columns (z = ±11.3, stops cleanly under roof soffit!)
    for (const x of [-99, -82, -65, -49]) {
      for (const z of [-11.3, 11.3]) colPositions.push({ x, y: 14.7, z, h: 29.4, r: 0.52, floors: [0, 1, 2, 3, 4] });
    }
    // Legacy rectangular Rainforest corner columns removed (replaced by 12 curved elliptical Rainforest rim columns!)
    // Highstreet columns RIGHT on void rim (z = ±6.8, stops cleanly under 3F ceiling y=29.4!)
    for (const x of [70.2, 85.0, 99.8]) {
      for (const z of [-6.8, 6.8]) colPositions.push({ x, y: 14.7, z, h: 29.4, r: 0.48, floors: [0, 1, 2, 3, 4] });
    }
    // Oval ring columns strictly on elliptical void rim (skip East lift-bridge & Parkson sightline columns!)
    for (let i = 0; i < 10; i++) {
      const a = ((i + 0.5) / 10) * Math.PI * 2;
      if (Math.abs(Math.sin(a)) < 0.28) continue;
      if (Math.abs(Math.sin(a)) < 0.36 && Math.cos(a) > 0) continue;
      colPositions.push({
        x: 138 + Math.cos(a) * 20.4,
        y: 18.175,
        z: Math.sin(a) * 13.7,
        h: 36.35,
        r: 0.56,
        floors: [0, 1, 2, 3, 4, 5]
      });
    }

    // Fluted Travertine & Champagne-Marble Columns with Bronze Plinths, Brass Mid-Collars & Warm 3000K Capital Uplights!
    const colMaps = createFlutedColumnMaps();
    const colGeo = new THREE.CylinderGeometry(1, 1, 1, 24);
    const colMat = new THREE.MeshStandardMaterial({
      map: colMaps.map,
      normalMap: colMaps.normalMap,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughnessMap: colMaps.roughnessMap,
      roughness: 0.55,
      metalness: 0.14,
      envMapIntensity: 0.85
    });
    const instCols = new THREE.InstancedMesh(colGeo, colMat, colPositions.length);
    instCols.castShadow = true;
    instCols.receiveShadow = true;
    const dummy = new THREE.Object3D();

    const plinthGeo = new THREE.CylinderGeometry(1.16, 1.24, 0.34, 24);
    const collarGeo = new THREE.CylinderGeometry(1.06, 1.06, 0.055, 24);
    const capitalGeo = new THREE.CylinderGeometry(1.24, 1.08, 0.24, 24);
    const uplightGeo = new THREE.CylinderGeometry(1.14, 1.14, 0.075, 24);
    const plinths = [];

    colPositions.forEach((c, idx) => {
      dummy.position.set(c.x, c.y, c.z);
      dummy.scale.set(c.r, c.h, c.r);
      dummy.updateMatrix();
      instCols.setMatrixAt(idx, dummy.matrix);

      for (const fIdx of c.floors) {
        const fy = FLOORS[fIdx].y;
        plinths.push({ x: c.x, y: fy + 0.17, fy, z: c.z, r: c.r });
        addContactShadow(c.x, fy, c.z, c.r * 5.8, c.r * 5.8);
      }
    });
    instCols.instanceMatrix.needsUpdate = true;
    root.add(instCols);

    // Instanced honed dark-granite base plinths (catching floor reflections, ZERO flat black silhouette!) + brushed warm-bronze reveal rings!
    const colPlinthStoneMat = new THREE.MeshStandardMaterial({ color: '#4c4842', roughness: 0.30, metalness: 0.22, envMapIntensity: 0.85 });
    const colBronzeCollarMat = new THREE.MeshStandardMaterial({ color: '#b49456', roughness: 0.36, metalness: 0.58, envMapIntensity: 0.62 });
    const instPlinths = new THREE.InstancedMesh(plinthGeo, colPlinthStoneMat, plinths.length);
    const instCollars = new THREE.InstancedMesh(collarGeo, colBronzeCollarMat, plinths.length);
    const instCapitals = new THREE.InstancedMesh(capitalGeo, balconyWhiteFasciaMat, plinths.length);
    const instUplights = new THREE.InstancedMesh(uplightGeo, warmCoveLedMat, plinths.length);
    plinths.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.r, 1, p.r);
      dummy.updateMatrix();
      instPlinths.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x, p.fy + 0.36, p.z);
      dummy.scale.set(p.r, 1, p.r);
      dummy.updateMatrix();
      instCollars.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x, p.fy + 5.26, p.z);
      dummy.scale.set(p.r, 1, p.r);
      dummy.updateMatrix();
      instCapitals.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x, p.fy + 5.10, p.z);
      dummy.scale.set(p.r, 1, p.r);
      dummy.updateMatrix();
      instUplights.setMatrixAt(i, dummy.matrix);
    });
    instPlinths.instanceMatrix.needsUpdate = true;
    instCollars.instanceMatrix.needsUpdate = true;
    instCapitals.instanceMatrix.needsUpdate = true;
    instUplights.instanceMatrix.needsUpdate = true;
    root.add(instPlinths, instCollars, instCapitals, instUplights);

    // Iconic Old Wing Centre Court Red/White Checkered Column Wraps on GF, 1F, 2F (#064, #453!)
    const ccWrapMat = new THREE.MeshStandardMaterial({ map: createCentreCourtCheckeredColumnTexture(), roughness: 0.36, metalness: 0.12 });
    for (const x of [-99, -82, -65, -49]) {
      for (const z of [-11.3, 11.3]) {
        for (const fy of [6.0, 12.0, 18.0]) {
          const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.555, 0.555, 2.75, 20, 1, true), ccWrapMat);
          wrap.position.set(x, fy + 2.45, z);
          root.add(wrap);
        }
      }
    }

    // Iconic Oval Atrium Cylindrical Vertical Glowing White LED-Slatted Columns (LG/1F/2F #154/#373) + Gold-Banded Brushed Stainless Columns on GF (#372) + LUXE G 3-Gold-Band Brushed Stainless Columns!
    const ovalLedRibMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.75, 1.82, 1.92), toneMapped: false });
    const ovalChromeMat = new THREE.MeshStandardMaterial({ color: '#c4cdd6', roughness: 0.22, metalness: 0.88, envMapIntensity: 1.35 });
    const calacattaPlinthMat = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.24, metalness: 0.05 });
    for (const lx of [70.2, 85.0, 99.8]) {
      for (const lz of [-6.8, 6.8]) {
        const lgSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.575, 0.575, 4.92, 22), ovalChromeMat);
        lgSleeve.position.set(lx, 8.65, lz);
        const lgBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.67, 0.42, 22), calacattaPlinthMat);
        lgBase.position.set(lx, 6.21, lz);
        root.add(lgSleeve, lgBase);
        for (const gy of [7.15, 8.65, 10.15]) {
          const gBand = new THREE.Mesh(new THREE.CylinderGeometry(0.592, 0.592, 0.075, 22), brassGoldMat);
          gBand.position.set(lx, gy, lz);
          root.add(gBand);
        }
      }
    }
    for (let i = 0; i < 10; i++) {
      const a = ((i + 0.5) / 10) * Math.PI * 2;
      if (Math.abs(Math.sin(a)) < 0.28) continue;
      if (Math.abs(Math.sin(a)) < 0.36 && Math.cos(a) > 0) continue;
      const cx = 138 + Math.cos(a) * 20.4;
      const cz = Math.sin(a) * 13.7;
      // GF brushed stainless steel column sleeve with 2 signature horizontal brass bands (#372!)
      const gfCol = new THREE.Mesh(new THREE.CylinderGeometry(0.585, 0.585, 4.95, 22), ovalChromeMat);
      gfCol.position.set(cx, 8.65, cz);
      const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 0.60, 0.08, 22), brassGoldMat);
      band1.position.set(cx, 7.6, cz);
      const band2 = band1.clone();
      band2.position.y = 9.7;
      root.add(gfCol, band1, band2);
      // LG, 1F & 2F vertical glowing white LED ribs wrapping each Oval column (#154, #373!)
      for (const fy of [0.0, 12.0, 18.0]) {
        for (let r = 0; r < 10; r++) {
          const ra = (r / 10) * Math.PI * 2;
          const rib = new THREE.Mesh(new THREE.BoxGeometry(0.05, 4.55, 0.045), ovalLedRibMat);
          rib.position.set(cx + Math.cos(ra) * 0.59, fy + 2.75, cz + Math.sin(ra) * 0.59);
          rib.rotation.y = -ra;
          root.add(rib);
        }
      }
    }
  }

  // ==========================================================================
  // 5. OUTER SHELL ENCLOSURE WALLS (RECESSED 4.2m OUTWARD FOR TRUE 3D RETAIL INTERIORS!)
  // ==========================================================================
  const wallBackMat = new THREE.MeshStandardMaterial({ color: '#1b2029', roughness: 0.72, metalness: 0.12 });

  for (const floor of FLOORS) {
    if (floor.isRooftop) continue;
    const y = floor.y;
    const h = floor.index === 5 ? 6.45 : 5.45;

    if (floor.has1UE) {
      for (const zS of [-1, 1]) {
        if (floor.index === 3 && zS === -1) {
          // Punch wide 8.6m sunlit doorway at x=-144.8..-136.2 on 2F 1UE North wall leading to Outdoor Saranghae Bridge!
          const wLeft = new THREE.Mesh(new THREE.BoxGeometry(42.6, h, 0.5), wallBackMat);
          wLeft.position.set(-166.1, y + h * 0.5, -24.4);
          const wRight = new THREE.Mesh(new THREE.BoxGeometry(8.0, h, 0.5), wallBackMat);
          wRight.position.set(-132.2, y + h * 0.5, -24.4);
          root.add(wLeft, wRight);
        } else {
          const w = new THREE.Mesh(new THREE.BoxGeometry(62, h, 0.5), wallBackMat);
          w.position.set(-161, y + h * 0.5, zS * 24.4);
          root.add(w);
        }
        const fl = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 14.5), wallBackMat);
        fl.position.set(-128.6, y + h * 0.5, zS * 17.0);
        root.add(fl);
      }
      const wEnd = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 50), wallBackMat);
      wEnd.position.set(-187.4, y + h * 0.5, 0);
      root.add(wEnd);
    }

    if (floor.hasOldWing) {
      for (const zS of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(106, h, 0.5), wallBackMat);
        w.position.set(-79, y + h * 0.5, zS * 26.4);
        root.add(w);
        const flankW = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 16.5), wallBackMat);
        flankW.position.set(-127.8, y + h * 0.5, zS * 17.5);
        const flankE = flankW.clone();
        flankE.position.x = -27.2;
        root.add(flankW, flankE);
      }
    }

    if (floor.hasPromenade) {
      for (const zS of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(40, h, 0.4), wallBackMat);
        w.position.set(-8, y + h * 0.5, zS * 14.2);
        root.add(w);
      }
    }

    if (floor.hasNewWing) {
      for (const zS of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(170, h, 0.5), wallBackMat);
        w.position.set(95, y + h * 0.5, zS * 27.4);
        root.add(w);
        if (floor.hasPromenade) {
          const flank = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 17.5), wallBackMat);
          flank.position.set(11.4, y + h * 0.5, zS * 18.0);
          root.add(flank);
        }
      }
      if (!floor.hasPromenade) {
        const wWest = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 56), wallBackMat);
        wWest.position.set(9.8, y + h * 0.5, 0);
        root.add(wWest);
      }
      const wEast = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 56), wallBackMat);
      wEast.position.set(177.2, y + h * 0.5, 0);
      root.add(wEast);
    }
  }

  // ============================================================================
  // 5B. 168 100% REAL 1 UTAMA BESPOKE MULTI-ARCHITECTURE 3D STOREFRONTS!
  // 8 Distinct Real-World Retail Facade Constructions + 7 Brand Typography Families
  // + Wide-Open Continuous 3D Parallax Interiors (All Shared Materials -> Batched to ~16 Draw Calls!)
  // ============================================================================
  const bladeGeo = new THREE.BoxGeometry(0.08, 0.52, 0.96);
  const frameMatCache = new Map();

  // Shared Architectural Storefront Materials (auto-merged by collapseStaticMeshes -> ZERO FPS cost!)
  const hinokiWoodMat = new THREE.MeshStandardMaterial({ color: '#c89b66', roughness: 0.58, metalness: 0.02, envMapIntensity: 0.52 });
  const smokedOakMat = new THREE.MeshStandardMaterial({ color: '#4f3624', roughness: 0.62, metalness: 0.04, envMapIntensity: 0.45 });
  const slateRoofMat = new THREE.MeshStandardMaterial({ color: '#272c34', roughness: 0.72, metalness: 0.14, envMapIntensity: 0.48 });
  const rawConcreteMat = new THREE.MeshStandardMaterial({ color: '#58606b', roughness: 0.86, metalness: 0.04, envMapIntensity: 0.35 });
  const matteSteelMat = new THREE.MeshStandardMaterial({ color: '#1b2029', roughness: 0.38, metalness: 0.72, envMapIntensity: 0.78 });
  const brushedAlumMat = new THREE.MeshStandardMaterial({ color: '#cdd4de', roughness: 0.28, metalness: 0.78, envMapIntensity: 0.88 });
  const travertineMaps = createTravertineStoneMaps(2, 2);
  const ivoryStoneMat = new THREE.MeshStandardMaterial({
    color: '#ece4d7',
    map: travertineMaps.map,
    normalMap: travertineMaps.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: travertineMaps.roughnessMap,
    roughness: 0.62,
    metalness: 0.04,
    envMapIntensity: 0.56
  });
  const obsidianGlossMat = new THREE.MeshPhysicalMaterial({ color: '#1b1f27', roughness: 0.12, metalness: 0.28, clearcoat: 0.95, clearcoatRoughness: 0.08, envMapIntensity: 1.25 });
  const satinWhiteMat = new THREE.MeshStandardMaterial({ color: '#f4f6f8', emissive: '#e8ecf0', emissiveIntensity: 0.16, roughness: 0.30, metalness: 0.06, envMapIntensity: 0.68 });
  const emeraldTrimMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.38, metalness: 0.12, envMapIntensity: 0.55 });
  const creamTileMat = new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: 0.42, metalness: 0.06, envMapIntensity: 0.52 });
  const awningForestMat = new THREE.MeshStandardMaterial({ color: '#284237', roughness: 0.84, metalness: 0.02, side: THREE.DoubleSide });
  const awningTerracottaMat = new THREE.MeshStandardMaterial({ color: '#8f4732', roughness: 0.84, metalness: 0.02, side: THREE.DoubleSide });
  const awningCreamMat = new THREE.MeshStandardMaterial({ color: '#d8cbb8', roughness: 0.84, metalness: 0.02, side: THREE.DoubleSide });
  const cafeMarbleMat = new THREE.MeshStandardMaterial({ color: '#efeae2', roughness: 0.24, metalness: 0.06, envMapIntensity: 0.72 });
  const mannequinLinenMat = new THREE.MeshStandardMaterial({ color: '#3b3732', roughness: 0.82, metalness: 0.02 });
  const mannequinLightMat = new THREE.MeshStandardMaterial({ color: '#cdc3b4', roughness: 0.80, metalness: 0.02 });
  const herbFoliageMat = new THREE.MeshStandardMaterial({ color: '#3d6338', roughness: 0.76, metalness: 0.02 });
  const norenCrimsonMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.86, side: THREE.DoubleSide });
  const norenCreamMat = new THREE.MeshStandardMaterial({ color: '#f5efe6', roughness: 0.86, side: THREE.DoubleSide });
  const uniqloRedBoxMat = new THREE.MeshStandardMaterial({
    color: '#dc2626',
    emissive: '#b91c1c',
    emissiveIntensity: 0.34,
    roughness: 0.26,
    metalness: 0.08
  });
  const lanternGlowWarmMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.26, 0.88, 0.44) });
  const lanternGlowRedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.18, 0.30, 0.20) });
  const sportLedBarMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.12, 1.24, 1.36) });
  // Photo-Verified 1 Utama Brand Architectural PBR Materials (Shared -> Auto-Batched for 60 FPS!)
  const jayaRedPortalMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.30, metalness: 0.14, envMapIntensity: 0.65 });
  const jayaTerracottaMaps = createMosaicTileMaps('#8a4b2a', '#a85f38', '#3c291f', 2, 5);
  const jayaTerracottaMat = new THREE.MeshStandardMaterial({ map: jayaTerracottaMaps.map, normalMap: jayaTerracottaMaps.normalMap, roughnessMap: jayaTerracottaMaps.roughnessMap, roughness: 0.45, metalness: 0.06, envMapIntensity: 0.65 });
  const minisoPinkMat = new THREE.MeshStandardMaterial({ color: '#f2748b', emissive: '#e85b74', emissiveIntensity: 0.22, roughness: 0.26, metalness: 0.06, envMapIntensity: 0.68 });
  const minisoPastelMat = new THREE.MeshStandardMaterial({ color: '#f5d0fe', emissive: '#e9d5ff', emissiveIntensity: 0.16, roughness: 0.30, metalness: 0.04, envMapIntensity: 0.60 });
  const minisoLavenderMat = new THREE.MeshStandardMaterial({ color: '#c4b5fd', roughness: 0.30, metalness: 0.06, envMapIntensity: 0.62 });
  const minisoPinkLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 0.55, 1.35), toneMapped: false });
  const whiteStripLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.42, 1.44, 1.48) });
  const adidasCubeMaps = createMosaicTileMaps('#edf2f7', '#ffffff', '#cbd5e1', 2, 5);
  const adidasFrostedMat = new THREE.MeshStandardMaterial({ map: adidasCubeMaps.map, normalMap: adidasCubeMaps.normalMap, color: '#f8fafc', emissive: '#e6edf6', emissiveIntensity: 0.38, roughness: 0.18, metalness: 0.10, envMapIntensity: 0.92 });
  const adidasCyanLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.08, 1.55, 2.25), toneMapped: false });
  const popMartLimeMat = new THREE.MeshStandardMaterial({ color: '#ec1878', emissive: '#c81262', emissiveIntensity: 0.36, roughness: 0.24, metalness: 0.06 });
  const topToyCyanLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.18, 1.75, 2.20), toneMapped: false });
  const topToyMagentaLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.10, 0.28, 1.45), toneMapped: false });
  const mrDiyOrangeMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.38, metalness: 0.06 });
  const mrDiyYellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.32, metalness: 0.08 });
  const parksonGoldMosaicMaps = createMosaicTileMaps('#d9bc7a', '#ebd59b', '#8d733e', 3, 6);
  const parksonGoldMosaicMat = new THREE.MeshStandardMaterial({ map: parksonGoldMosaicMaps.map, normalMap: parksonGoldMosaicMaps.normalMap, roughness: 0.24, metalness: 0.58, envMapIntensity: 1.05 });
  const zusCreamPlasterMat = new THREE.MeshStandardMaterial({ color: '#f2eadc', roughness: 0.72, metalness: 0.02 });
  const zusRoyalBlueMat = new THREE.MeshStandardMaterial({ color: '#0f2e78', roughness: 0.34, metalness: 0.10 });
  const croissantGoldMat = new THREE.MeshStandardMaterial({ color: '#c68335', roughness: 0.52, metalness: 0.04 });
  const comeTrueGreyPlasterMat = new THREE.MeshStandardMaterial({ color: '#c8ccd0', roughness: 0.78, metalness: 0.02 });
  const coralBenchMat = new THREE.MeshStandardMaterial({ color: '#e14949', roughness: 0.52, metalness: 0.06 });
  const sushiSlatWoodMat = new THREE.MeshStandardMaterial({ color: '#d4a66a', roughness: 0.54, metalness: 0.02 });
  const sushiGreenGlassMat = new THREE.MeshPhysicalMaterial({ color: '#7ea892', transparent: true, opacity: 0.42, roughness: 0.08, metalness: 0.06, envMapIntensity: 0.9 });
  const bungkusForestMat = new THREE.MeshStandardMaterial({ color: '#1a4731', roughness: 0.56, metalness: 0.04 });
  const nadejeNavyMat = new THREE.MeshStandardMaterial({ color: '#0f234a', roughness: 0.32, metalness: 0.16 });
  const baskinPurpleMat = new THREE.MeshStandardMaterial({ color: '#4c1d95', roughness: 0.36, metalness: 0.12 });
  const owalaNavyMat = new THREE.MeshStandardMaterial({ color: '#14244d', roughness: 0.32, metalness: 0.12 });
  const owalaSkyMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.28, metalness: 0.10 });
  const tealivePurpleMat = new THREE.MeshStandardMaterial({ color: '#3b1578', roughness: 0.34, metalness: 0.14 });
  const llaollaoLimeMat = new THREE.MeshStandardMaterial({ color: '#84cc16', roughness: 0.28, metalness: 0.06 });
  const memoriPlumMat = new THREE.MeshStandardMaterial({ color: '#2b1e2e', roughness: 0.52, metalness: 0.08 });
  const crimsonNeonLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.25, 0.03, 0.04), toneMapped: false });
  const turfGreenMat = new THREE.MeshStandardMaterial({ color: '#2e7d3c', roughness: 0.94, metalness: 0.0 });
  const sageFlutedMat = new THREE.MeshStandardMaterial({ color: '#5f7b6d', roughness: 0.54, metalness: 0.04 });
  const gunmetalRibMat = new THREE.MeshStandardMaterial({ color: '#38404d', roughness: 0.30, metalness: 0.72, envMapIntensity: 1.08 });
  const amberBlockTex = createAmberGlassBlockMaps();
  const amberBacklitMat = new THREE.MeshPhysicalMaterial({ map: amberBlockTex, emissive: '#d9822b', emissiveMap: amberBlockTex, emissiveIntensity: 0.68, roughness: 0.12, metalness: 0.05, clearcoat: 1.0, envMapIntensity: 1.15 });
  const bhcMosaicMaps = createMosaicTileMaps('#f4b400', '#ffca28', '#5c4614', 2, 5);
  const mustardMosaicMat = new THREE.MeshPhysicalMaterial({ map: bhcMosaicMaps.map, normalMap: bhcMosaicMaps.normalMap, roughnessMap: bhcMosaicMaps.roughnessMap, roughness: 0.22, metalness: 0.06, clearcoat: 0.85, clearcoatRoughness: 0.14, envMapIntensity: 0.95 });
  const rwWhiteMosaicMaps = createMosaicTileMaps('#f6f8fa', '#e5eaf0', '#94a3b8', 2, 5);
  const rwWhiteMosaicMat = new THREE.MeshStandardMaterial({ map: rwWhiteMosaicMaps.map, normalMap: rwWhiteMosaicMaps.normalMap, roughnessMap: rwWhiteMosaicMaps.roughnessMap, roughness: 0.24, metalness: 0.06, envMapIntensity: 0.80 });
  const rwElectricBlueMat = new THREE.MeshStandardMaterial({ color: '#004ce6', roughness: 0.28, metalness: 0.28, envMapIntensity: 0.90 });
  const rwPinkNeonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.08, 1.05), toneMapped: false });
  const canaryArchMat = new THREE.MeshStandardMaterial({ color: '#ffb800', emissive: '#b45309', emissiveIntensity: 0.26, roughness: 0.32, metalness: 0.12 });
  const orangeAccentMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.86 });
  const ribbedOrangeMaps = createRibbedCarpetMaps('#e8540a', 5, 6);
  const gameOnCarpetMat = new THREE.MeshStandardMaterial({
    map: ribbedOrangeMaps.map,
    normalMap: ribbedOrangeMaps.normalMap,
    normalScale: new THREE.Vector2(0.88, 0.88),
    roughnessMap: ribbedOrangeMaps.roughnessMap,
    roughness: 0.90,
    metalness: 0.02,
    envMapIntensity: 0.22
  });
  const tealPanelMat = new THREE.MeshStandardMaterial({ color: '#007a78', roughness: 0.36, metalness: 0.10 });
  const navyPanelMat = new THREE.MeshStandardMaterial({ color: '#14244b', roughness: 0.36, metalness: 0.10 });
  const bauhausOrangeMat = new THREE.MeshStandardMaterial({ color: '#d95d2b', roughness: 0.38, metalness: 0.08 });
  const frostedPanelMat = new THREE.MeshPhysicalMaterial({ color: '#f2f7fb', emissive: '#fff4df', emissiveIntensity: 0.42, roughness: 0.18, metalness: 0.04, clearcoat: 0.65, envMapIntensity: 0.95 });
  const oakPlankMaps = createOakPlankMaps(3, 2);
  const vertOakMaps = createVerticalOakMaps(1, 2);
  const lightOakMat = new THREE.MeshStandardMaterial({ map: oakPlankMaps.map, normalMap: oakPlankMaps.normalMap, roughness: 0.48, metalness: 0.02, envMapIntensity: 0.52 });
  const vertOakMat = new THREE.MeshStandardMaterial({ map: vertOakMaps.map, normalMap: vertOakMaps.normalMap, roughness: 0.48, metalness: 0.02, envMapIntensity: 0.52 });
  const rainbowBandMats = ['#ec4899', '#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6'].map(
    (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.12, metalness: 0.12, clearcoat: 1.0, clearcoatRoughness: 0.08, envMapIntensity: 1.15 })
  );
  // High-purity chroma progression: Golden Yellow -> Vibrant Orange -> Deep Saturated Crimson Red (ZERO pale salmon washout!)
  const gameOnLedMats = [
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.75, 1.42, 0.05), toneMapped: false }),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.92, 0.52, 0.025), toneMapped: false }),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.68, 0.015, 0.032), toneMapped: false })
  ];
  const chanelBacklitAlabasterMat = new THREE.MeshStandardMaterial({ color: '#f4f5f7', emissive: '#eceef2', emissiveIntensity: 0.44, roughness: 0.36 });
  const ippudoKanjiSignMat = new THREE.MeshBasicMaterial({ map: createIppudoVerticalSignTexture() });
  const foodStallMenuMats = [0, 1, 2, 3, 4, 5].map((idx) => {
    const t = createFoodStallMenuTexture(idx);
    return new THREE.MeshStandardMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.58, roughness: 0.26 });
  });
  const brandPosterMats = {
    rollerwa: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('rollerwa'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('rollerwa'), emissiveIntensity: 0.48, roughness: 0.22 }),
    gameon: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('gameon'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('gameon'), emissiveIntensity: 0.48, roughness: 0.22 }),
    nextgen: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('nextgen'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('nextgen'), emissiveIntensity: 0.48, roughness: 0.22 }),
    pjpac: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('pjpac'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('pjpac'), emissiveIntensity: 0.48, roughness: 0.22 }),
    sephora: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('sephora'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('sephora'), emissiveIntensity: 0.44, roughness: 0.20 }),
    puma: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('puma'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('puma'), emissiveIntensity: 0.50, roughness: 0.20 }),
    toptoy: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('toptoy'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('toptoy'), emissiveIntensity: 0.42, roughness: 0.22 }),
    starbucks: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('starbucks'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('starbucks'), emissiveIntensity: 0.34, roughness: 0.24 }),
    heytea_left: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('heytea_left'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('heytea_left'), emissiveIntensity: 0.26, roughness: 0.28 }),
    heytea_right: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('heytea_right'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('heytea_right'), emissiveIntensity: 0.26, roughness: 0.28 }),
    mrdiy_pl: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('mrdiy_pl'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('mrdiy_pl'), emissiveIntensity: 0.34, roughness: 0.24 }),
    beutea_menu: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('beutea_menu'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('beutea_menu'), emissiveIntensity: 0.62, roughness: 0.22 }),
    boost_front: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('boost_front'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('boost_front'), emissiveIntensity: 0.22, roughness: 0.30 }),
    default: new THREE.MeshStandardMaterial({ map: createStorePosterTexture('default'), emissive: '#ffffff', emissiveMap: createStorePosterTexture('default'), emissiveIntensity: 0.44, roughness: 0.22 })
  };
  const intFloorChanelGlossMat = new THREE.MeshPhysicalMaterial({ color: '#111318', roughness: 0.07, metalness: 0.24, clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 1.45 });
  const intFloorOakMat = new THREE.MeshStandardMaterial({ map: oakPlankMaps.map, normalMap: oakPlankMaps.normalMap, roughness: 0.34, metalness: 0.04, envMapIntensity: 0.65 });
  const posterTex = createDigitalDirectoryTexture();
  const posterGlowMat = new THREE.MeshStandardMaterial({
    map: posterTex,
    emissive: '#ffffff',
    emissiveMap: posterTex,
    emissiveIntensity: 0.42,
    roughness: 0.24,
    metalness: 0.10
  });
  const crateWoodMat = new THREE.MeshStandardMaterial({ color: '#784824', roughness: 0.84 });
  const produceMats = [
    new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.65 }),
    new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.55 }),
    new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.50 }),
    new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.55 })
  ];

  // Shared 3D Mannequin Bust, Bistro Table, Chair & Sconce Geometries
  const mannequinTorsoGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.01, 0.0),
      new THREE.Vector2(0.14, 0.04),
      new THREE.Vector2(0.125, 0.22),
      new THREE.Vector2(0.175, 0.48),
      new THREE.Vector2(0.188, 0.58),
      new THREE.Vector2(0.072, 0.66),
      new THREE.Vector2(0.048, 0.74),
      new THREE.Vector2(0.01, 0.75)
    ],
    14
  );
  mannequinTorsoGeo.scale(1.06, 1.0, 0.68);
  const bistroTopGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 16);
  const bistroPoleGeo = new THREE.CylinderGeometry(0.042, 0.052, 0.74, 8);
  const bistroBaseGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.045, 12);
  const chairSeatGeo = new THREE.CylinderGeometry(0.24, 0.23, 0.05, 12);
  const chairBackGeo = new THREE.TorusGeometry(0.22, 0.028, 6, 12, Math.PI);
  const chairLegGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.48, 6);
  const sconceGlobeGeo = new THREE.SphereGeometry(0.11, 10, 8);
  const sconceArmGeo = new THREE.BoxGeometry(0.06, 0.08, 0.22);
  const lanternBodyGeo = new THREE.SphereGeometry(0.22, 12, 10);
  const lanternCapGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.05, 8);
  const produceMoundGeo = new THREE.SphereGeometry(0.14, 8, 6);
  const herbShrubGeo = new THREE.DodecahedronGeometry(0.24, 1);

  // True Schlick Fresnel Low-Iron Architectural Storefront Glass (crisp specular mall reflections & subtle edge tint!)
  const intGlassPhysMat = createFresnelGlassMaterial({
    tint: '#e4f1f8',
    opacity: 0.72,
    side: THREE.FrontSide
  });
  const intBackMatCache = new Map();
  const getInteriorBackwallMat = (store, prof) => {
    const tex = createStoreInteriorBackwallTexture(store);
    const cacheKey = `${tex.uuid}-${prof.isLight ? 'L' : 'D'}`;
    if (intBackMatCache.has(cacheKey)) return intBackMatCache.get(cacheKey);
    const m = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(prof.isLight ? '#fff7eb' : '#ffe8cc'),
      emissiveMap: tex,
      emissiveIntensity: prof.isLight ? 0.56 : 0.64,
      roughness: 0.62,
      metalness: 0.04,
      envMapIntensity: 0.45
    });
    intBackMatCache.set(cacheKey, m);
    return m;
  };
  const intWallWarmMat = new THREE.MeshStandardMaterial({ color: '#e8dfd0', emissive: '#6a5640', emissiveIntensity: 0.36, roughness: 0.72 });
  const intWallWhiteMat = new THREE.MeshStandardMaterial({ color: '#f4f6f8', emissive: '#6e7682', emissiveIntensity: 0.38, roughness: 0.52 });
  const intWallDarkMat = new THREE.MeshStandardMaterial({ color: '#2b313c', emissive: '#1e2430', emissiveIntensity: 0.42, roughness: 0.58 });
  const intWallWoodMat = new THREE.MeshStandardMaterial({ color: '#9c6e44', emissive: '#58381d', emissiveIntensity: 0.38, roughness: 0.64 });
  const intWallNavyMat = new THREE.MeshStandardMaterial({ color: '#1b2e4d', emissive: '#152542', emissiveIntensity: 0.44, roughness: 0.58 });
  const intWallOliveMat = new THREE.MeshStandardMaterial({ color: '#334a3a', emissive: '#223628', emissiveIntensity: 0.40, roughness: 0.68 });
  const intWallCrimsonMat = new THREE.MeshStandardMaterial({ color: '#6b1d22', emissive: '#4a1216', emissiveIntensity: 0.38, roughness: 0.62 });
  const intFloorLightMat = new THREE.MeshPhysicalMaterial({ color: '#e2d9cb', map: newWingMaps.map, roughness: 0.16, metalness: 0.06, clearcoat: 0.85, clearcoatRoughness: 0.10, envMapIntensity: 1.05 });
  const intFloorWoodMat = new THREE.MeshStandardMaterial({ color: '#8a603c', map: oakPlankMaps.map, normalMap: oakPlankMaps.normalMap, emissive: '#3a2410', emissiveIntensity: 0.22, roughness: 0.42, metalness: 0.04, envMapIntensity: 0.55 });
  const intFloorDarkMat = new THREE.MeshPhysicalMaterial({ color: '#1b1f28', roughness: 0.12, metalness: 0.22, clearcoat: 0.85, clearcoatRoughness: 0.08, envMapIntensity: 1.20 });
  const intLightWarmMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.34, 1.08, 0.74) });
  const intLightCoolMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.22, 1.30, 1.38) });
  const intBacklitBayMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.16, 1.12, 1.06) });
  const intChillerGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 1.18, 1.28) });
  const intCopperMat = new THREE.MeshStandardMaterial({ color: '#b87042', roughness: 0.26, metalness: 0.84, envMapIntensity: 0.95 });
  const intMerchMats = [
    new THREE.MeshStandardMaterial({ color: '#c83e4d', emissive: '#4a1218', emissiveIntensity: 0.28, roughness: 0.50 }),
    new THREE.MeshStandardMaterial({ color: '#2b4568', emissive: '#122036', emissiveIntensity: 0.28, roughness: 0.55 }),
    new THREE.MeshStandardMaterial({ color: '#d4a66a', emissive: '#543c1e', emissiveIntensity: 0.28, roughness: 0.48 }),
    new THREE.MeshStandardMaterial({ color: '#ece6dc', emissive: '#58524a', emissiveIntensity: 0.28, roughness: 0.45 }),
    new THREE.MeshStandardMaterial({ color: '#466b52', emissive: '#1d3224', emissiveIntensity: 0.28, roughness: 0.58 }),
    new THREE.MeshStandardMaterial({ color: '#b56c78', emissive: '#48242a', emissiveIntensity: 0.28, roughness: 0.45 })
  ];

  // Shared 3D Interior Fixture Geometries
  const bottleSmallGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.24, 8);
  const flaconSquareGeo = new THREE.BoxGeometry(0.11, 0.18, 0.065);
  const flaconCapGeo = new THREE.BoxGeometry(0.058, 0.052, 0.048);
  const foldedStackGeo = new THREE.BoxGeometry(0.46, 0.26, 0.36);
  const pastryDomeGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.14, 10);
  const shoeBoxGeo = new THREE.BoxGeometry(0.28, 0.14, 0.18);
  const sneakerSoleGeo = new THREE.BoxGeometry(0.30, 0.042, 0.112);
  const sneakerUpperGeo = new THREE.BoxGeometry(0.22, 0.075, 0.092);
  const sneakerHeelGeo = new THREE.CylinderGeometry(0.046, 0.052, 0.105, 8);
  const plushBodyGeo = new THREE.SphereGeometry(0.11, 10, 8);
  const plushHeadGeo = new THREE.SphereGeometry(0.088, 10, 8);
  const plushEarGeo = new THREE.CapsuleGeometry(0.024, 0.065, 4, 6);
  const plushEyeGeo = new THREE.SphereGeometry(0.012, 6, 6);
  const plushSnoutGeo = new THREE.SphereGeometry(0.026, 8, 6);
  const hangingGarmentGeo = new THREE.BoxGeometry(0.14, 0.92, 0.42);
  const handbagGeo = new THREE.BoxGeometry(0.32, 0.26, 0.15);
  const handbagHandleGeo = new THREE.TorusGeometry(0.085, 0.014, 6, 12, Math.PI);
  const stoolSeatGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 10);
  const stoolLegGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.68, 6);
  const herbFrondGeo = buildArchedIndoorFrondGeo(0.28, 0.58, 0.30);
  const downlightBezelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.045, 14);
  const downlightLensGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.052, 12);
  const mannequinHeadGeo = new THREE.SphereGeometry(0.105, 12, 10);
  const mannequinLegGeo = new THREE.CylinderGeometry(0.062, 0.042, 0.84, 10);
  const mannequinArmGeo = new THREE.CylinderGeometry(0.042, 0.032, 0.56, 8);

  const addLocalContactShadow = (parent, x, z, sx = 1.8, sz = 1.2, y = 0.076) => {
    const cs = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), contactShadowMat);
    cs.rotation.x = -Math.PI / 2;
    cs.position.set(x, y, z);
    parent.add(cs);
  };

  const addSculptedMannequin = (parent, x, y, z, bodyMat, rotY = 0, outfitMat = null) => {
    const mg = new THREE.Group();
    mg.position.set(x, y, z);
    mg.rotation.y = rotY;
    const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.035, 16), brushedAlumMat);
    baseDisc.position.y = 0.018;
    const legL = new THREE.Mesh(mannequinLegGeo, bodyMat);
    legL.position.set(-0.09, 0.44, 0.02);
    legL.rotation.x = -0.05;
    const legR = new THREE.Mesh(mannequinLegGeo, bodyMat);
    legR.position.set(0.09, 0.44, -0.02);
    legR.rotation.x = 0.05;
    const torso = new THREE.Mesh(mannequinTorsoGeo, outfitMat || bodyMat);
    torso.position.y = 0.80;
    const head = new THREE.Mesh(mannequinHeadGeo, bodyMat);
    head.scale.set(0.86, 1.12, 0.94);
    head.position.set(0, 1.62, 0.01);
    const armL = new THREE.Mesh(mannequinArmGeo, outfitMat || bodyMat);
    armL.position.set(-0.22, 1.16, 0.01);
    armL.rotation.z = -0.10;
    const armR = new THREE.Mesh(mannequinArmGeo, outfitMat || bodyMat);
    armR.position.set(0.22, 1.16, 0.02);
    armR.rotation.z = 0.14;
    armR.rotation.x = -0.12;
    mg.add(baseDisc, legL, legR, torso, head, armL, armR);
    parent.add(mg);
  };

  const addKawaiiPlushie = (parent, x, y, z, mat, scale = 1.0, rotY = 0) => {
    const pg = new THREE.Group();
    pg.position.set(x, y, z);
    pg.rotation.y = rotY;
    pg.scale.setScalar(scale);
    const body = new THREE.Mesh(plushBodyGeo, mat);
    body.scale.set(0.96, 1.04, 0.90);
    body.position.y = 0.095;
    const belly = new THREE.Mesh(plushSnoutGeo, satinWhiteMat);
    belly.scale.set(2.2, 2.3, 0.9);
    belly.position.set(0, 0.095, 0.075);
    const head = new THREE.Mesh(plushHeadGeo, mat);
    head.position.y = 0.228;
    const snout = new THREE.Mesh(plushSnoutGeo, satinWhiteMat);
    snout.scale.set(1.25, 0.92, 0.85);
    snout.position.set(0, 0.214, 0.074);
    const eyeL = new THREE.Mesh(plushEyeGeo, obsidianGlossMat);
    eyeL.position.set(-0.032, 0.242, 0.078);
    const eyeR = new THREE.Mesh(plushEyeGeo, obsidianGlossMat);
    eyeR.position.set(0.032, 0.242, 0.078);
    const nose = new THREE.Mesh(plushEyeGeo, obsidianGlossMat);
    nose.scale.set(0.85, 0.65, 0.85);
    nose.position.set(0, 0.222, 0.094);
    const earL = new THREE.Mesh(plushEarGeo, mat);
    earL.position.set(-0.048, 0.315, 0);
    earL.rotation.z = 0.24;
    const earR = new THREE.Mesh(plushEarGeo, mat);
    earR.position.set(0.048, 0.315, 0);
    earR.rotation.z = -0.24;
    pg.add(body, belly, head, snout, eyeL, eyeR, nose, earL, earR);
    parent.add(pg);
  };

  const addSneakerDisplay = (parent, x, y, z, upperMat, rotY = 0.28) => {
    const sg = new THREE.Group();
    sg.position.set(x, y, z);
    sg.rotation.y = rotY;
    const sole = new THREE.Mesh(sneakerSoleGeo, satinWhiteMat);
    sole.position.y = 0.022;
    const upper = new THREE.Mesh(sneakerUpperGeo, upperMat);
    upper.position.set(0.02, 0.072, 0);
    upper.rotation.z = -0.10;
    const heel = new THREE.Mesh(sneakerHeelGeo, upperMat);
    heel.position.set(-0.088, 0.090, 0);
    const accentBand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.116), satinWhiteMat);
    accentBand.position.set(-0.01, 0.068, 0);
    sg.add(sole, upper, heel, accentBand);
    parent.add(sg);
  };

  let cachedCamp5BackMat = null;
  const getCamp5ProshopBackwallMat = () => {
    if (cachedCamp5BackMat) return cachedCamp5BackMat;
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext('2d');
    // Warm industrial birch-plywood & charcoal climbing proshop pegboard backwall
    const bg = ctx.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, '#c8ab83');
    bg.addColorStop(1, '#9e815c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 512);
    // Top dark charcoal Camp5 Proshop header bar
    ctx.fillStyle = '#14171c';
    ctx.fillRect(0, 0, 1024, 68);
    ctx.fillStyle = '#bef264';
    ctx.fillRect(0, 64, 1024, 4);
    ctx.font = '800 26px "Plus Jakarta Sans", "Montserrat", sans-serif';
    ctx.fillStyle = '#bef264';
    ctx.textAlign = 'center';
    ctx.fillText('camp (5) PROSHOP  •  CLIMBING ROPES  •  HARNESSES  •  CHALK BAGS  •  CLIMBING SHOES', 512, 42);
    // 4 Illuminated Birch Pegboard Climbing Gear Bays
    const ropeCols = ['#f97316', '#bef264', '#38bdf8', '#facc15', '#ef4444', '#22c55e'];
    for (let b = 0; b < 4; b++) {
      const bx = 20 + b * 250;
      ctx.fillStyle = '#d9c09c';
      ctx.fillRect(bx, 82, 232, 326);
      ctx.strokeStyle = '#272b33';
      ctx.lineWidth = 6;
      ctx.strokeRect(bx, 82, 232, 326);
      // Coiled dynamic climbing ropes row
      for (let r = 0; r < 3; r++) {
        const rx = bx + 46 + r * 70;
        const ry = 136;
        ctx.strokeStyle = ropeCols[(b * 2 + r) % ropeCols.length];
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(rx, ry, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(rx, ry, 11, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Hanging harnesses & chalk bags row
      for (let h = 0; h < 4; h++) {
        const hx = bx + 34 + h * 54;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(hx - 14, 196, 28, 10);
        ctx.strokeStyle = ropeCols[(b + h + 1) % ropeCols.length];
        ctx.lineWidth = 4;
        ctx.strokeRect(hx - 12, 208, 10, 18);
        ctx.strokeRect(hx + 2, 208, 10, 18);
        ctx.fillStyle = ropeCols[(b + h + 3) % ropeCols.length];
        ctx.fillRect(hx - 9, 234, 18, 24);
      }
      // Aggressive downturn climbing-shoe cubby grid (lower 2 shelves)
      for (let sh = 0; sh < 2; sh++) {
        const sy = 286 + sh * 58;
        ctx.fillStyle = '#334155';
        ctx.fillRect(bx + 10, sy + 32, 212, 6);
        for (let s = 0; s < 4; s++) {
          const sx = bx + 26 + s * 50;
          ctx.fillStyle = ropeCols[(b + sh * 2 + s) % ropeCols.length];
          ctx.beginPath();
          ctx.moveTo(sx, sy + 28);
          ctx.lineTo(sx + 32, sy + 18);
          ctx.lineTo(sx + 36, sy + 30);
          ctx.lineTo(sx, sy + 32);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    ctx.fillStyle = '#272b33';
    ctx.fillRect(0, 416, 1024, 96);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    cachedCamp5BackMat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.34, roughness: 0.55 });
    return cachedCamp5BackMat;
  };

  let cachedToyCatcherBackMat = null;
  const getToyCatcherBackwallMat = () => {
    if (cachedToyCatcherBackMat) return cachedToyCatcherBackMat;
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext('2d');
    // Crisp Illuminated Toy Catchers Kawaii Plushie Prize Wall & Claw-Arcade Marquee Graphics (ZERO flat pastel ovals!)
    const bg = ctx.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, '#2e1065');
    bg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 512);
    // Glowing hot-pink & electric-cyan arcade marquee header
    ctx.fillStyle = '#831843';
    ctx.fillRect(0, 0, 1024, 68);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(0, 62, 1024, 6);
    ctx.font = '900 27px "Plus Jakarta Sans", "Montserrat", sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText('TOY CATCHERS  •  100+ KAWAII PLUSHIE PRIZE WALL  •  UFO CLAW & GACHAPON ZONE', 512, 43);
    const plushPal = ['#f472b6', '#38bdf8', '#facc15', '#34d399', '#c084fc', '#fb923c', '#fb7185'];
    // 4 Illuminated Multi-Tier Plushie Cubby Display Cabinets
    for (let b = 0; b < 4; b++) {
      const bx = 18 + b * 250;
      ctx.fillStyle = '#fdf2f8';
      ctx.fillRect(bx, 80, 234, 332);
      ctx.strokeStyle = b % 2 === 0 ? '#f472b6' : '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(bx, 80, 234, 332);
      // Sub-header per bay
      ctx.fillStyle = b % 2 === 0 ? '#db2777' : '#0284c7';
      ctx.fillRect(bx + 4, 84, 226, 30);
      ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(b % 2 === 0 ? 'JUMBO PLUSHIE PRIZE SHELF' : 'UFO CATCHER & GACHAPON WALL', bx + 117, 104);
      for (let sh = 0; sh < 4; sh++) {
        const sy = 122 + sh * 70;
        ctx.fillStyle = '#fbcfe8';
        ctx.fillRect(bx + 8, sy + 56, 218, 6);
        for (let p = 0; p < 4; p++) {
          const px = bx + 34 + p * 54;
          const py = sy + 34;
          const col = plushPal[(b * 3 + sh * 2 + p) % plushPal.length];
          // Detailed kawaii plushie bear/bunny silhouette with ears, belly, eyes & ribbon
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(px - 10, py - 16, 6, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(px + 10, py - 16, 6, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(px, py - 8, 12, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(px, py + 10, 14, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(px, py + 11, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#18181b';
          ctx.beginPath(); ctx.arc(px - 4, py - 9, 2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(px + 4, py - 9, 2, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.fillStyle = '#311042';
    ctx.fillRect(0, 418, 1024, 94);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    cachedToyCatcherBackMat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.44, roughness: 0.42 });
    return cachedToyCatcherBackMat;
  };

  let cachedDivaBackMat = null;
  const getDivaKtvBackwallMat = () => {
    if (cachedDivaBackMat) return cachedDivaBackMat;
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext('2d');
    // Warm Taupe-Champagne Neoclassical KTV Corridor & VIP Suite Doors (ZERO handbags or fashion racks!)
    const bg = ctx.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, '#e9e0d1');
    bg.addColorStop(1, '#cbbba2');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = '#2e1a36';
    ctx.fillRect(0, 0, 1024, 64);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 60, 1024, 4);
    ctx.font = '700 25px "Cormorant Garamond", "Georgia", serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.fillText('Diva KARAOKE LOUNGE  •  VIP NEOCLASSICAL KTV SUITES  •  CONCERT SOUND', 512, 40);
    for (let b = 0; b < 4; b++) {
      const bx = 32 + b * 248;
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 6;
      ctx.strokeRect(bx, 86, 212, 318);
      ctx.fillStyle = '#3b234a';
      ctx.fillRect(bx + 18, 104, 176, 282);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx + 28, 116, 156, 258);
      ctx.font = '700 22px "Georgia", serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText(`VIP SUITE 0${b + 1}`, bx + 106, 245);
    }
    ctx.fillStyle = '#4a3b32';
    ctx.fillRect(0, 412, 1024, 100);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    cachedDivaBackMat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.32, roughness: 0.48 });
    return cachedDivaBackMat;
  };

  for (const store of STORES) {
    const floor = FLOORS[store.floor];
    if (!floor) continue;
    const prof = getStoreBrandProfile(store);
    const storeH = floor.index === 5 ? 6.0 : 5.25;
    const fasciaH = prof.fasciaH;
    const depth = 0.56;
    const uName = (store.name || '').toUpperCase();
    const isMrDiy = uName.includes('MR. D.I.Y') || uName.includes('MR.D.I.Y') || uName.includes('MR DIY');
    const isPopMart = uName.includes('POP MART');
    const isTopToy = uName.includes('TOP TOY');
    const isToyCatcher = uName.includes('TOY CATCHER');
    const isCamp5 = uName.includes('CAMP5');
    const isDiva = uName.includes('DIVA');
    const isZusPastry = uName.includes('COFFEE MEETS PASTRY') || (uName.includes('ZUS') && uName.includes('PASTRY'));
    const isNike = uName.includes('NIKE');
    const isSephora = uName.includes('SEPHORA') || store.style === 'sephora';
    const isUniqlo = uName.includes('UNIQLO');
    const isJayaGrocer = uName.includes('JAYA GROCER');
    const isMiniso = uName.includes('MINISO');
    const isOrientalKopi = uName.includes('ORIENTAL KOPI');
    const isIppudo = uName.includes('IPPUDO');
    const isTommy = uName.includes('TOMMY');
    const isParkson = uName.includes('PARKSON');
    const isOutside = uName.includes('OUTSIDE') || uName.includes('NORTH FACE');
    const isAdidas = uName.includes('ADIDAS');
    const isFoodDistrict = uName.includes('FOOD DISTRICT');
    const isPuma = uName.includes('PUMA');
    const isUnderArmour = uName.includes('UNDER ARMOUR');
    const isStarbucks = uName.includes('STARBUCKS');
    const isComeTrue = uName.includes('COME TRUE');
    const isChanel = uName.includes('CHANEL');
    const isCoach = uName.includes('COACH');
    const isZara = uName.includes('ZARA');
    const isHeytea = uName.includes('HEYTEA');
    const isNextGen = uName.includes('NEXT GEN') || uName.includes('NEXTGEN');
    const isGameOn = uName.includes('GAME ON');
    const isBhc = uName.includes('BHC');
    const isModu = uName.includes('MODU');
    const isWindlab = uName.includes('WINDLAB');
    const isPjpac = uName.includes('PJPAC');
    const isRollerwa = uName.includes('ROLLERWA');
    const isTehTarik = uName.includes('TEH TARIK');
    const isAeon = uName.includes('AEON');
    const isDecathlon = uName.includes('DECATHLON');
    const isTgv = uName.includes('TGV');
    const isGsc = uName.includes('GSC');
    const isWangsa = uName.includes('WANGSA BOWL');
    const isCellini = uName.includes('CELLINI');
    const isLoccitane = uName.includes('OCCITANE');
    const isMrt = store.id === 'g-mrt-portal' || uName.includes('MRT BANDAR UTAMA');
    const isNarrowCorridor = Math.abs(store.z) < 12.5;
    const isFlankWall = store.width <= 13.5 && (store.side === 'E' || store.side === 'W');
    const intD = isOutside ? 1.94 : isFlankWall ? 1.55 : 3.45;
    const fasciaMaps = createStorefrontFasciaTexture(store, fasciaH);

    // Deterministic per-store hash for architectural variety across adjacent & stacked lots!
    let storeHash = 0;
    const hStr = `${store.id}-${store.floor}-${store.lot}`;
    for (let i = 0; i < hStr.length; i++) storeHash = (storeHash * 31 + hStr.charCodeAt(i)) % 997;

    const g = new THREE.Group();
    let rotY = 0;
    if (store.side === 'N') rotY = 0;
    else if (store.side === 'S') rotY = Math.PI;
    else if (store.side === 'W') rotY = Math.PI / 2;
    else if (store.side === 'E') rotY = -Math.PI / 2;

    g.position.set(store.x, floor.y, store.z);
    g.rotation.y = rotY;

    // Pick authentic architectural surround material per brand profile (NO uniform dark bronze box!)
    let surroundMat = ivoryStoneMat;
    if (prof.facadeType === 'japanese-machiya') surroundMat = hinokiWoodMat;
    else if (prof.facadeType === 'korean-hanok') surroundMat = lightOakMat;
    else if (prof.facadeType === 'open-market') surroundMat = satinWhiteMat;
    else if (isSephora) surroundMat = obsidianGlossMat;
    else if (isUniqlo) surroundMat = satinWhiteMat;
    else if (prof.facadeType === 'cafe-patisserie') surroundMat = creamTileMat;
    else if (prof.facadeType === 'modern-bistro') surroundMat = smokedOakMat;
    else if (prof.facadeType === 'sports-industrial') surroundMat = rawConcreteMat;
    else if (prof.facadeType === 'entertainment-marquee') surroundMat = matteSteelMat;
    else if (prof.facadeType === 'minimalist-tech') surroundMat = prof.isLight ? brushedAlumMat : matteSteelMat;
    else if (!prof.isLight) surroundMat = obsidianGlossMat;

    const fasciaMat = new THREE.MeshStandardMaterial({
      map: fasciaMaps.map,
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: fasciaMaps.emissiveMap,
      emissiveIntensity: prof.isLight ? 0.36 : 0.72,
      roughness: prof.materialStyle === 'raw-concrete' ? 0.78 : prof.isLight ? 0.38 : 0.26,
      metalness: prof.materialStyle === 'brushed-silver' ? 0.42 : prof.isLight ? 0.08 : 0.20,
      envMapIntensity: 0.62
    });

    const bgHex = prof.isLight ? '#e8e4dc' : store.brandBg || '#1c2028';
    let frameMat = frameMatCache.get(bgHex);
    if (!frameMat) {
      frameMat = new THREE.MeshStandardMaterial({
        color: bgHex,
        roughness: prof.isLight ? 0.44 : 0.32,
        metalness: prof.isLight ? 0.10 : 0.48,
        envMapIntensity: 0.70
      });
      frameMatCache.set(bgHex, frameMat);
    }

    // Varied architectural facade relief depth so neighbouring shopfronts step in/out like REAL 1 Utama!
    const fasciaDepthOff =
      prof.facadeType === 'entertainment-marquee'
        ? 0.28
        : prof.facadeType === 'modern-bistro' || prof.facadeType === 'japanese-machiya'
          ? 0.16
          : prof.facadeType === 'minimalist-tech'
            ? 0.02
            : 0.09;

    // 1. Upper 3D Architectural Branded Fascia Bulkhead
    const fasciaBox = new THREE.Mesh(
      new THREE.BoxGeometry(store.width, fasciaH, depth + 0.16 + fasciaDepthOff),
      [frameMat, frameMat, frameMat, surroundMat, fasciaMat, frameMat]
    );
    fasciaBox.position.set(0, storeH - fasciaH * 0.5, 0.08 + fasciaDepthOff * 0.5);
    g.add(fasciaBox);

    const eaveY = storeH - fasciaH;
    const halfW = store.width * 0.5;
    const innerW = Math.max(3.6, store.width - 0.56);

    // ========================================================================
    // 2. TRUE PHYSICAL 3.45m-DEEP 3D RECESSED RETAIL ROOM + PHOTOREALISTIC BRAND BACKWALL ATLAS + BESPOKE 3D FIXTURES!
    // ========================================================================
    const wallMatInt = isMiniso
      ? minisoPastelMat
      : isZara || isParkson
        ? ivoryStoneMat
        : isCoach
          ? smokedOakMat
          : isSephora || isUniqlo || isChanel || isNextGen || prof.facadeType === 'open-market'
            ? intWallWhiteMat
            : isTommy
              ? intWallNavyMat
              : isOutside || isOrientalKopi
                ? intWallOliveMat
                : isTehTarik
                  ? intWallWoodMat
                  : prof.facadeType === 'korean-hanok'
                    ? intWallWarmMat
                    : prof.facadeType === 'japanese-machiya' || prof.facadeType === 'modern-bistro'
                      ? (prof.materialStyle === 'crimson-lacquer' ? intWallCrimsonMat : intWallWoodMat)
                      : prof.facadeType === 'cafe-patisserie' || prof.isLight
                        ? intWallWarmMat
                        : intWallDarkMat;
    const backAtlasTex = createStoreInteriorBackwallTexture(store);
    const backAtlasMat = getInteriorBackwallMat(store, prof);
    // Use GPU Raymarched 3D Parallax on hero flagship/atrium/District K storefronts & batched atlas on secondary bays -> LOCKED 60 FPS!
    const isHeroParallax =
      /SEPHORA|PARKSON|JAYA GROCER|ZARA|CHANEL|YSL|COACH|MICHAEL KORS|LULULEMON|IPPUDO|FOOD DISTRICT|UNDER ARMOUR|PUMA|OUTSIDE|MINISO|ADIDAS|ORIENTAL KOPI|KYOCHON|PAO XIANG|COME TRUE|STARBUCKS|UNIQLO|DEGEM|BONIA|HEYTEA|DIN TAI FUNG|SPEEDO|BHC|MODU|NEXT GEN|NEXTGEN|GAME ON|ROLLERWA|PJPAC|WINDLAB|TEH TARIK|MADAM KWAN|CHILI|CELLINI|TAISHI|MR\. D\.I\.Y|MR\.D\.I\.Y|POP MART|TOP TOY|COFFEE MEETS PASTRY|NIKE/.test(uName);
    const backWallMatFinal = isCamp5
      ? getCamp5ProshopBackwallMat()
      : isToyCatcher
        ? getToyCatcherBackwallMat()
        : isDiva
          ? getDivaKtvBackwallMat()
          : isHeroParallax
            ? createParallaxInteriorMaterial(store, backAtlasTex)
            : backAtlasMat;
    const floorMatInt = isGameOn
      ? gameOnCarpetMat
      : isChanel
        ? intFloorChanelGlossMat
        : isAdidas || isModu || isOutside || prof.facadeType === 'korean-hanok'
          ? intFloorOakMat
          : isSephora || isZara || isNextGen || isMiniso || isParkson || isHeytea
            ? intFloorLightMat
            : isCoach || isStarbucks || isIppudo || isTehTarik || prof.facadeType === 'japanese-machiya' || prof.facadeType === 'cafe-patisserie' || prof.facadeType === 'modern-bistro'
              ? intFloorWoodMat
              : (prof.facadeType === 'sports-industrial' && !isAdidas) || prof.facadeType === 'entertainment-marquee'
                ? intFloorDarkMat
                : intFloorLightMat;
    const ceilLightMatInt = isSephora || isMiniso || isNextGen || prof.facadeType === 'open-market' || prof.facadeType === 'sports-industrial' || prof.facadeType === 'minimalist-tech'
      ? intLightCoolMat
      : intLightWarmMat;

    // Recessed 3D Interior Floor (Chanel piano-black granite extends flush through entrance portal!), Ceiling, Parallax Back Wall & Architectural Side Walls!
    const floorDepthExtra = isChanel ? 0.92 : 0.62;
    const intFloor = new THREE.Mesh(new THREE.BoxGeometry(innerW + 0.16, 0.08, intD + floorDepthExtra), floorMatInt);
    intFloor.position.set(0, 0.032, -intD * 0.5 + (isChanel ? 0.22 : 0.08));
    const intCeil = new THREE.Mesh(new THREE.BoxGeometry(innerW + 0.16, 0.10, intD + 0.62), isJayaGrocer ? smokedOakMat : wallMatInt);
    intCeil.position.set(0, eaveY - 0.05, -intD * 0.5 + 0.08);
    const intBack = new THREE.Mesh(new THREE.PlaneGeometry(innerW, eaveY), backWallMatFinal);
    intBack.position.set(0, eaveY * 0.5, -intD + 0.08);
    const intSideL = new THREE.Mesh(new THREE.PlaneGeometry(intD + 0.18, eaveY), wallMatInt);
    intSideL.rotation.y = Math.PI / 2;
    intSideL.position.set(-innerW * 0.5 + 0.08, eaveY * 0.5, -intD * 0.5);
    const intSideR = new THREE.Mesh(new THREE.PlaneGeometry(intD + 0.18, eaveY), wallMatInt);
    intSideR.rotation.y = -Math.PI / 2;
    intSideR.position.set(innerW * 0.5 - 0.08, eaveY * 0.5, -intD * 0.5);
    g.add(intFloor, intCeil, intBack, intSideL, intSideR);

    // 3D Recessed Circular Architectural Downlight Cans (bezel + optical lens — SKIPPED on Game On so warm neon tunnel bounce dominates!)
    if (!isGameOn) {
      const lightRows = intD > 2.2 ? [-0.88, -2.25] : [-0.72];
      const dlCols = Math.max(2, Math.min(7, Math.floor((innerW - 1.0) / 2.6)));
      for (const lz of lightRows) {
        for (let di = 0; di < dlCols; di++) {
          const dx = dlCols === 1 ? 0 : -(innerW - 2.2) * 0.5 + (di / (dlCols - 1)) * (innerW - 2.2);
          const bezel = new THREE.Mesh(downlightBezelGeo, matteSteelMat);
          bezel.position.set(dx, eaveY - 0.11, lz);
          const lens = new THREE.Mesh(downlightLensGeo, ceilLightMatInt);
          lens.position.set(dx, eaveY - 0.12, lz);
          g.add(bezel, lens);
        }
      }
    }

    // Populate Real 3D Physical Retail Fixtures Inside the Recessed Room!
    const numBays = Math.max(2, Math.min(6, Math.floor((innerW - 1.2) / 3.2)));
    const bayStep = (innerW - 1.2) / numBays;

    if (isSephora) {
      // SEPHORA: Glossy black freestanding beauty island gondolas + anchored illuminated cosmetic shelving framing the luxury beauty atlas backwall!
      for (let b = 0; b < numBays; b++) {
        const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
        const baseCab = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.35, 0.72, 0.56), obsidianGlossMat);
        baseCab.position.set(bx, 0.38, -intD + 0.36);
        const topRim = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.42, 0.05, 0.22), intLightWarmMat);
        topRim.position.set(bx, eaveY - 0.45, -intD + 0.28);
        // Twin vertical black-lacquer stanchion uprights anchoring every shelf cleanly floor-to-ceiling!
        for (const sOff of [-(bayStep - 0.48) * 0.5, (bayStep - 0.48) * 0.5]) {
          const upright = new THREE.Mesh(new THREE.BoxGeometry(0.06, eaveY - 0.36, 0.34), obsidianGlossMat);
          upright.position.set(bx + sOff, (eaveY - 0.36) * 0.5, -intD + 0.30);
          g.add(upright);
        }
        g.add(baseCab, topRim);
        for (let sh = 0; sh < 4; sh++) {
          const sy = 1.05 + sh * 0.56;
          const shelf = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.48, 0.045, 0.34), obsidianGlossMat);
          shelf.position.set(bx, sy, -intD + 0.30);
          g.add(shelf);
          for (let it = -2; it <= 2; it++) {
            const isPalette = (sh + it) % 2 === 0;
            const itemMat = (b + sh + it) % 3 === 0 ? intMerchMats[0] : (b + it) % 2 === 0 ? brassGoldMat : intMerchMats[5];
            const bottle = new THREE.Mesh(isPalette ? shoeBoxGeo : bottleSmallGeo, itemMat);
            if (isPalette) bottle.scale.set(0.55, 0.52, 0.62);
            else bottle.scale.set(0.58, 0.78, 0.58);
            bottle.position.set(bx + it * 0.34, sy + (isPalette ? 0.06 : 0.11), -intD + 0.32);
            g.add(bottle);
          }
        }
      }
      // 3D Freestanding Glossy-Black Sephora Luxury Cosmetics Island Gondolas with Backlit Circular LED Vanity Mirrors & Multi-Pan Makeup Palettes!
      if (intD > 2.2) {
        const gondolaCount = Math.max(2, Math.floor(innerW / 5.5));
        for (let i = 0; i < gondolaCount; i++) {
          const gx = -innerW * 0.32 + (gondolaCount === 1 ? 0 : (i / (gondolaCount - 1)) * (innerW * 0.64));
          const gondBase = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.96, 0.94), obsidianGlossMat);
          gondBase.position.set(gx, 0.52, -1.55);
          const gondToe = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.045, 0.96), intLightWarmMat);
          gondToe.position.set(gx, 0.06, -1.55);
          const gondTop = new THREE.Mesh(new THREE.BoxGeometry(2.30, 0.055, 1.00), intBacklitBayMat);
          gondTop.position.set(gx, 1.03, -1.55);
          const mirrorDiv = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.62, 0.08), obsidianGlossMat);
          mirrorDiv.position.set(gx, 1.38, -1.55);
          // Dual Backlit Circular LED Vanity Mirrors + Sleek Overhead Rim!
          for (const mxOff of [-0.52, 0.52]) {
            const ledHalo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 8, 24), intLightCoolMat);
            ledHalo.position.set(gx + mxOff, 1.40, -1.49);
            const mirrorDisc = new THREE.Mesh(new THREE.CircleGeometry(0.20, 20), brushedAlumMat);
            mirrorDisc.position.set(gx + mxOff, 1.40, -1.495);
            g.add(ledHalo, mirrorDisc);
          }
          g.add(gondBase, gondToe, gondTop, mirrorDiv);
          addLocalContactShadow(g, gx, -1.55, 2.75, 1.45);
          for (let p = -2; p <= 2; p++) {
            const isPal = p % 2 === 0;
            if (isPal) {
              const palCase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.032, 0.16), obsidianGlossMat);
              palCase.position.set(gx + p * 0.38, 1.08, -1.24);
              const pan1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.10), intMerchMats[0]);
              pan1.position.set(gx + p * 0.38 - 0.06, 1.10, -1.24);
              const pan2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.10), intMerchMats[5]);
              pan2.position.set(gx + p * 0.38 + 0.06, 1.10, -1.24);
              g.add(palCase, pan1, pan2);
            } else {
              const tester = new THREE.Mesh(bottleSmallGeo, (i + p) % 2 === 0 ? brassGoldMat : intMerchMats[0]);
              tester.scale.set(0.54, 0.72, 0.54);
              tester.position.set(gx + p * 0.38, 1.16, -1.24);
              g.add(tester);
            }
          }
        }
      }
    } else if (prof.facadeType === 'cafe-patisserie') {
      // COME TRUE CAFE / ORIENTAL KOPI / CHATERAISE / LAVENDER / HEYTEA / STARBUCKS:
      // Place architectural oak slats STRICTLY on outer flanks so ZERO posts ever clip Come True / HEYTEA menus!
      if (!isStarbucks && !isHeytea) {
        const flankXs = [-innerW * 0.46, -innerW * 0.36, innerW * 0.36, innerW * 0.46];
        for (const sx of flankXs) {
          const slat = new THREE.Mesh(new THREE.BoxGeometry(0.11, eaveY - 0.25, 0.14), isOrientalKopi ? smokedOakMat : hinokiWoodMat);
          slat.position.set(sx, eaveY * 0.5, -intD + 0.16);
          g.add(slat);
        }
      }
      // Generic rear wall shelf ONLY on standard patisseries (DELETED on Come True, HEYTEA & Starbucks — ZERO floating mid-air beams!)
      if (!isComeTrue && !isHeytea && !isStarbucks) {
        const backShelf = new THREE.Mesh(new THREE.BoxGeometry(innerW * 0.48, 0.07, 0.32), smokedOakMat);
        backShelf.position.set(-innerW * 0.08, 1.92, -intD + 0.30);
        for (const brX of [-innerW * 0.28, innerW * 0.12]) {
          const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.28), matteSteelMat);
          bracket.position.set(brX, 1.78, -intD + 0.28);
          g.add(bracket);
        }
        g.add(backShelf);
        for (let c = -2; c <= 2; c++) {
          const jar = new THREE.Mesh(bottleSmallGeo, intMerchMats[(c + 6) % intMerchMats.length]);
          jar.position.set(-innerW * 0.08 + c * 0.52, 2.08, -intD + 0.32);
          g.add(jar);
        }
      }

      // Physical 3D Espresso Bar Counter + Stainless Espresso Machine + Framed Glass Cake Vitrine (SKIPPED on Starbucks & HEYTEA which build their own bespoke bars!)
      const barZ = intD > 2.2 ? -1.75 : -0.92;
      if (!isStarbucks && !isHeytea) {
        const barW = Math.min(innerW * 0.56, 7.6);
        const barX = -innerW * 0.12;
        const barBase = new THREE.Mesh(new THREE.BoxGeometry(barW, 1.02, 0.88), isComeTrue ? lightOakMat : creamTileMat);
        barBase.position.set(barX, 0.53, barZ);
        const barTop = new THREE.Mesh(new THREE.BoxGeometry(barW + 0.14, 0.08, 0.98), cafeMarbleMat);
        barTop.position.set(barX, 1.08, barZ);
        const espressoBody = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.46, 0.54), brushedAlumMat);
        espressoBody.position.set(barX - barW * 0.26, 1.34, barZ - 0.06);
        const espDeck = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.05, 0.60), obsidianGlossMat);
        espDeck.position.set(barX - barW * 0.26, 1.12, barZ - 0.04);
        const espRail = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.04, 0.50), brassGoldMat);
        espRail.position.set(barX - barW * 0.26, 1.59, barZ - 0.06);
        for (const gh of [-0.30, 0, 0.30]) {
          const grp = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.12, 8), obsidianGlossMat);
          grp.position.set(barX - barW * 0.26 + gh, 1.36, barZ + 0.22);
          g.add(grp);
        }
        // Enclosed stainless-framed glass patisserie showcase stocked with multi-layered golden soufflé pancakes & pastries!
        const vitrineW = Math.min(2.6, barW * 0.44);
        const vitrineX = barX + barW * 0.22;
        const vitrineDeck = new THREE.Mesh(new THREE.BoxGeometry(vitrineW, 0.06, 0.72), intBacklitBayMat);
        vitrineDeck.position.set(vitrineX, 1.15, barZ + 0.06);
        const vitrineMid = new THREE.Mesh(new THREE.BoxGeometry(vitrineW - 0.08, 0.025, 0.56), brushedAlumMat);
        vitrineMid.position.set(vitrineX, 1.44, barZ + 0.06);
        const vitrineCap = new THREE.Mesh(new THREE.BoxGeometry(vitrineW + 0.04, 0.04, 0.72), brushedAlumMat);
        vitrineCap.position.set(vitrineX, 1.76, barZ + 0.06);
        const vitrineGlass = new THREE.Mesh(new THREE.BoxGeometry(vitrineW, 0.62, 0.70), intGlassPhysMat);
        vitrineGlass.position.set(vitrineX, 1.46, barZ + 0.06);
        for (const vx of [-vitrineW * 0.49, vitrineW * 0.49]) {
          for (const vz of [-0.34, 0.34]) {
            const vPost = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.64, 0.032), brushedAlumMat);
            vPost.position.set(vitrineX + vx, 1.46, barZ + 0.06 + vz);
            g.add(vPost);
          }
        }
        g.add(barBase, barTop, espressoBody, espDeck, espRail, vitrineDeck, vitrineMid, vitrineCap, vitrineGlass);
        addLocalContactShadow(g, barX, barZ, barW + 0.5, 1.4);
        for (let p = 0; p < 5; p++) {
          const px = vitrineX - vitrineW * 0.38 + (p / 4) * (vitrineW * 0.76);
          const cake = new THREE.Mesh(pastryDomeGeo, intMerchMats[2]);
          cake.scale.set(0.95, 0.65, 0.95);
          cake.position.set(px, 1.22, barZ + 0.08);
          const souffMid = new THREE.Mesh(pastryDomeGeo, intMerchMats[2]);
          souffMid.scale.set(0.86, 0.58, 0.86);
          souffMid.position.set(px, 1.31, barZ + 0.08);
          const souffCream = new THREE.Mesh(pastryDomeGeo, cafeMarbleMat);
          souffCream.scale.set(0.55, 0.42, 0.55);
          souffCream.position.set(px, 1.50, barZ + 0.08);
          g.add(cake, souffMid, souffCream);
        }

        // Hanging Warm Brass Dome Pendant Lamps INSIDE the Café!
        const pendN = Math.min(4, Math.max(2, Math.floor(innerW / 3.4)));
        for (let p = 0; p < pendN; p++) {
          const px = -innerW * 0.36 + (p / Math.max(1, pendN - 1)) * (innerW * 0.72);
          const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.95, 6), matteSteelMat);
          cord.position.set(px, eaveY - 0.52, barZ + 0.25);
          const shade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.20, 10), brassGoldMat);
          shade.position.set(px, eaveY - 1.02, barZ + 0.25);
          const glow = new THREE.Mesh(sconceGlobeGeo, lanternGlowWarmMat);
          glow.scale.setScalar(0.8);
          glow.position.set(px, eaveY - 1.12, barZ + 0.25);
          g.add(cord, shade, glow);
        }
      }

      // Full-Height Interior Café Wood Table, 4-Leg Bentwood Chairs & Tabletop Coffee Cups inside right showcase glass!
      if (intD > 2.2 && innerW > 9.0 && !isHeytea) {
        const ix = innerW * 0.32;
        const tTop = new THREE.Mesh(bistroTopGeo, cafeMarbleMat);
        tTop.position.set(ix, 0.74, -1.45);
        const tPole = new THREE.Mesh(bistroPoleGeo, matteSteelMat);
        tPole.position.set(ix, 0.38, -1.45);
        const tFoot = new THREE.Mesh(bistroBaseGeo, matteSteelMat);
        tFoot.position.set(ix, 0.07, -1.45);
        const cup1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.036, 0.085, 10), satinWhiteMat);
        cup1.position.set(ix - 0.16, 0.81, -1.42);
        const cup2 = cup1.clone();
        cup2.position.set(ix + 0.14, 0.81, -1.50);
        g.add(tTop, tPole, tFoot, cup1, cup2);
        addLocalContactShadow(g, ix, -1.45, 2.2, 1.5);
        for (const cSide of [-1, 1]) {
          const cx = ix + cSide * 0.68;
          const cSeat = new THREE.Mesh(chairSeatGeo, smokedOakMat);
          cSeat.position.set(cx, 0.46, -1.45);
          const cBack = new THREE.Mesh(chairBackGeo, smokedOakMat);
          cBack.position.set(cx + cSide * 0.21, 0.62, -1.45);
          cBack.rotation.y = Math.PI / 2;
          for (const [lx, lz] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) {
            const cLeg = new THREE.Mesh(chairLegGeo, matteSteelMat);
            cLeg.position.set(cx + lx, 0.24, -1.45 + lz);
            g.add(cLeg);
          }
          g.add(cSeat, cBack);
        }
      }
    } else if (isMiniso) {
      // MINISO ALL-PINK IP FLAGSHIP: Anchored white pastel lifestyle gondolas stocked with sculpted 2-part kawaii plushies (ZERO stray red beams!)
      for (let b = 0; b < numBays; b++) {
        const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
        const headerPink = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.24, 0.20, 0.34), minisoPinkMat);
        headerPink.position.set(bx, eaveY - 0.55, -intD + 0.30);
        g.add(headerPink);
        // White vertical shelf uprights anchoring all 4 shelves cleanly!
        for (const sOff of [-(bayStep - 0.34) * 0.5, (bayStep - 0.34) * 0.5]) {
          const up = new THREE.Mesh(new THREE.BoxGeometry(0.06, eaveY - 0.55, 0.38), satinWhiteMat);
          up.position.set(bx + sOff, (eaveY - 0.55) * 0.5, -intD + 0.34);
          g.add(up);
        }
        for (let sh = 0; sh < 4; sh++) {
          const sy = 0.62 + sh * 0.60;
          const shelf = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.34, 0.05, 0.38), satinWhiteMat);
          shelf.position.set(bx, sy, -intD + 0.34);
          g.add(shelf);
          for (let k = -2; k <= 2; k++) {
            const pMat = sh % 2 === 0 ? minisoPinkMat : intMerchMats[(b + sh + k + 12) % intMerchMats.length];
            if (sh % 2 === 0) {
              addKawaiiPlushie(g, bx + k * 0.44, sy + 0.03, -intD + 0.36, pMat, 0.88, (k * 0.2));
            } else {
              const item = new THREE.Mesh(foldedStackGeo, pMat);
              item.scale.set(0.68, 0.82, 0.72);
              item.position.set(bx + k * 0.44, sy + 0.13, -intD + 0.36);
              g.add(item);
            }
          }
        }
      }
      if (intD > 2.2) {
        for (const side of [-1, 1]) {
          const ix = side * Math.min(innerW * 0.28, 2.8);
          const isl = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.88, 0.92), satinWhiteMat);
          isl.position.set(ix, 0.46, -1.55);
          const islPink = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.08, 0.96), minisoPinkMat);
          islPink.position.set(ix, 0.92, -1.55);
          g.add(isl, islPink);
          for (let p = -1; p <= 1; p++) {
            const pMat = p === 0 ? minisoPinkMat : intMerchMats[(p + 4 + (side > 0 ? 2 : 0)) % intMerchMats.length];
            addKawaiiPlushie(g, ix + p * 0.58, 0.96, -1.55, pMat, 1.25, -side * 0.35);
          }
        }
      }
    } else if (prof.facadeType === 'open-market') {
      // JAYA GROCER / AEON SUPERMARKET: Wide-open sunlit gourmet supermarket hall letting the rich 3D parallax grocery aisles shine cleanly (ZERO obstructing blank white wall boards!)
      for (let b = 0; b < numBays; b++) {
        const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
        // Overhead forest-green gourmet section header beam & warm hanging industrial copper barn pendant!
        const headerBand = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.35, 0.28, 0.22), emeraldTrimMat);
        headerBand.position.set(bx, eaveY - 0.55, -intD + 0.45);
        const pCord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.85, 6), matteSteelMat);
        pCord.position.set(bx, eaveY - 0.48, -1.55);
        const pShade = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.22, 12), intCopperMat);
        pShade.position.set(bx, eaveY - 0.92, -1.55);
        const pBulb = new THREE.Mesh(sconceGlobeGeo, lanternGlowWarmMat);
        pBulb.scale.setScalar(0.85);
        pBulb.position.set(bx, eaveY - 1.04, -1.55);
        g.add(headerBand, pCord, pShade, pBulb);
      }
      // Freestanding 3D Rustic Timber Gourmet Fresh-Produce Islands INSIDE Jaya Grocer!
      if (intD > 2.2) {
        const islCount = Math.max(2, Math.floor(innerW / 6.5));
        for (let i = 0; i < islCount; i++) {
          const ix = -innerW * 0.34 + (islCount === 1 ? 0 : (i / (islCount - 1)) * (innerW * 0.68));
          const island = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.82, 1.18), crateWoodMat);
          island.position.set(ix, 0.43, -1.65);
          const islandTrim = new THREE.Mesh(new THREE.BoxGeometry(2.88, 0.08, 1.24), smokedOakMat);
          islandTrim.position.set(ix, 0.84, -1.65);
          g.add(island, islandTrim);
          for (let f = -2; f <= 2; f++) {
            const pile = new THREE.Mesh(produceMoundGeo, produceMats[(i + f + 8) % produceMats.length]);
            pile.scale.set(1.15, 0.72, 1.08);
            pile.position.set(ix + f * 0.48, 0.94, -1.65);
            g.add(pile);
          }
        }
      }
    } else if (prof.facadeType === 'japanese-machiya') {
      // IPPUDO / SUSHI ZANMAI / SHABU-YO: Warm 3D open hinoki ramen counter, bar stools, copper kitchen hood, backlit sake wall & warm interior lanterns!
      const barW = Math.min(innerW * 0.76, 11.5);
      const barZ = intD > 2.2 ? -1.68 : -0.88;
      const counter = new THREE.Mesh(new THREE.BoxGeometry(barW, 1.02, 0.82), hinokiWoodMat);
      counter.position.set(0, 0.53, barZ);
      const counterTop = new THREE.Mesh(new THREE.BoxGeometry(barW + 0.16, 0.09, 0.96), cafeMarbleMat);
      counterTop.position.set(0, 1.06, barZ);
      // Brushed copper ramen-kitchen exhaust hood overhead
      const hood = new THREE.Mesh(new THREE.BoxGeometry(barW * 0.72, 0.95, 1.05), intCopperMat);
      hood.position.set(0, eaveY - 0.55, -intD + 0.78);
      const kitchenGlow = new THREE.Mesh(new THREE.BoxGeometry(barW * 0.68, 0.08, 0.45), intLightWarmMat);
      kitchenGlow.position.set(0, eaveY - 1.04, -intD + 0.78);
      g.add(counter, counterTop, hood, kitchenGlow);

      // Wooden Ramen Bar Stools lined up inside the open machiya!
      const stoolN = Math.min(7, Math.max(3, Math.floor(barW / 1.35)));
      for (let st = 0; st < stoolN; st++) {
        const sx = -barW * 0.42 + (st / Math.max(1, stoolN - 1)) * (barW * 0.84);
        const sTop = new THREE.Mesh(stoolSeatGeo, smokedOakMat);
        sTop.position.set(sx, 0.70, barZ + 0.72);
        const sLeg = new THREE.Mesh(stoolLegGeo, matteSteelMat);
        sLeg.position.set(sx, 0.35, barZ + 0.72);
        g.add(sTop, sLeg);
      }
      // Backlit Japanese Sake Bottle Shelving along rear wall + rod-suspended capped interior Chochin lanterns (ZERO floating orbs!)
      for (let b = 0; b < 3; b++) {
        const bx = (b - 1) * (barW * 0.30);
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.32), hinokiWoodMat);
        shelf.position.set(bx, 1.65, -intD + 0.28);
        const inRod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.70, 6), matteSteelMat);
        inRod.position.set(bx, eaveY - 0.36, barZ + 0.25);
        const lant = new THREE.Mesh(lanternBodyGeo, b === 1 ? lanternGlowRedMat : lanternGlowWarmMat);
        lant.scale.set(0.75, 1.25, 0.75);
        lant.position.set(bx, eaveY - 0.95, barZ + 0.25);
        const inCapT = new THREE.Mesh(lanternCapGeo, matteSteelMat);
        inCapT.position.set(bx, eaveY - 0.68, barZ + 0.25);
        const inCapB = new THREE.Mesh(lanternCapGeo, matteSteelMat);
        inCapB.position.set(bx, eaveY - 1.22, barZ + 0.25);
        g.add(shelf, inRod, lant, inCapT, inCapB);
        for (let sb = -2; sb <= 2; sb++) {
          const sake = new THREE.Mesh(bottleSmallGeo, intMerchMats[(b + sb + 8) % intMerchMats.length]);
          sake.position.set(bx + sb * 0.34, 1.80, -intD + 0.28);
          g.add(sake);
        }
      }
      // Steaming stainless ramen stock cauldron behind Ippudo counter!
      const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.42, 16), brushedAlumMat);
      cauldron.position.set(0, 1.28, barZ - 0.14);
      g.add(cauldron);
      addLocalContactShadow(g, 0, barZ, barW + 0.6, 1.6);
    } else if (prof.facadeType === 'modern-bistro') {
      // FOOD DISTRICT / KYOCHON 1991 / BHC CHICKEN / TEH TARIK CLUB / HAIDILAO / DIN TAI FUNG:
      if (isFoodDistrict) {
        // Solid dark smoked-oak backing board cleanly separating the 6 backlit stall menu lightboxes from any competing parallax text!
        const menuBackWall = new THREE.Mesh(new THREE.BoxGeometry(innerW - 0.32, eaveY - 0.22, 0.08), smokedOakMat);
        menuBackWall.position.set(0, eaveY * 0.5, -intD + 0.13);
        g.add(menuBackWall);
      }
      if (isBhc) {
        // BHC CHICKEN (G601): One cohesive rear BHC order counter (POS screens, stainless kitchen pass, glowing overhead menu) + spacious dining tables with yellow chicken baskets!
        const orderW = Math.min(innerW * 0.62, 6.2);
        const oBase = new THREE.Mesh(new THREE.BoxGeometry(orderW, 1.00, 0.88), obsidianGlossMat);
        oBase.position.set(0, 0.50, -intD + 0.82);
        const oTop = new THREE.Mesh(new THREE.BoxGeometry(orderW + 0.12, 0.08, 0.96), cafeMarbleMat);
        oTop.position.set(0, 1.04, -intD + 0.82);
        // NOTE: Keep Venetian plaster backwall 100% UNOBSTRUCTED so glowing "bhc CHICKEN — TASTE THE ORIGINAL KOREAN FLAVOUR" shines cleanly (photo-matched to G_G601_BHC_CHICKEN.jpg!)
        for (const px of [-orderW * 0.28, orderW * 0.28]) {
          const pos = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.06), matteSteelMat);
          pos.position.set(px, 1.24, -intD + 0.92);
          pos.rotation.x = -0.32;
          g.add(pos);
        }
        g.add(oBase, oTop);
        addLocalContactShadow(g, 0, -intD + 0.82, orderW + 0.6, 1.5);
        for (const side of [-1, 1]) {
          const tx = side * Math.min(innerW * 0.30, 3.2);
          const dTab = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.055, 0.82), matteSteelMat);
          dTab.position.set(tx, 0.75, -1.28);
          const dLeg = new THREE.Mesh(bistroPoleGeo, matteSteelMat);
          dLeg.position.set(tx, 0.38, -1.28);
          const dFoot = new THREE.Mesh(bistroBaseGeo, matteSteelMat);
          dFoot.position.set(tx, 0.07, -1.28);
          const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.11, 12), canaryArchMat);
          basket.position.set(tx, 0.84, -1.28);
          g.add(dTab, dLeg, dFoot, basket);
          addLocalContactShadow(g, tx, -1.28, 2.2, 1.5);
          for (const cSide of [-1, 1]) {
            const cx = tx + cSide * 0.66;
            const cSeat = new THREE.Mesh(chairSeatGeo, cSide < 0 ? canaryArchMat : obsidianGlossMat);
            cSeat.position.set(cx, 0.45, -1.28);
            const cBack = new THREE.Mesh(chairBackGeo, matteSteelMat);
            cBack.position.set(cx + cSide * 0.17, 0.62, -1.28);
            cBack.rotation.y = Math.PI / 2;
            const cPole = new THREE.Mesh(bistroPoleGeo, matteSteelMat);
            cPole.scale.set(0.75, 0.62, 0.75);
            cPole.position.set(cx, 0.23, -1.28);
            g.add(cSeat, cBack, cPole);
          }
        }
      } else {
        for (let b = 0; b < numBays; b++) {
          const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
          const counterZ = isFoodDistrict ? -intD + 1.52 : -intD + 0.55;
          if (isFoodDistrict) {
            const passMenu = new THREE.Mesh(
              new THREE.BoxGeometry(bayStep - 0.36, 0.98, 0.12),
              foodStallMenuMats[(b + storeHash) % foodStallMenuMats.length]
            );
            passMenu.position.set(bx, 2.48, -intD + 0.24);
            // Curved glass food sneeze guard + stainless bain-marie warmers + POS screen on each Food District stall!
            const sneeze = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.65, 0.44, 0.38), intGlassPhysMat);
            sneeze.position.set(bx - 0.22, 1.28, counterZ + 0.12);
            const warmer = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.85, 0.10, 0.42), brushedAlumMat);
            warmer.position.set(bx - 0.22, 1.11, counterZ + 0.10);
            const posScr = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.05), obsidianGlossMat);
            posScr.position.set(bx + (bayStep - 0.6) * 0.36, 1.20, counterZ + 0.14);
            posScr.rotation.x = -0.35;
            g.add(passMenu, sneeze, warmer, posScr);
          }
          const stallCounter = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.32, 0.98, 0.78), smokedOakMat);
          stallCounter.position.set(bx, 0.51, counterZ);
          const stallTop = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.26, 0.08, 0.86), cafeMarbleMat);
          stallTop.position.set(bx, 1.03, counterZ);
          const copCord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.78, 6), matteSteelMat);
          copCord.position.set(bx, eaveY - 0.44, counterZ + 0.15);
          const copShade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.20, 10), intCopperMat);
          copShade.position.set(bx, eaveY - 0.85, counterZ + 0.15);
          const copBulb = new THREE.Mesh(sconceGlobeGeo, lanternGlowWarmMat);
          copBulb.scale.setScalar(0.8);
          copBulb.position.set(bx, eaveY - 0.95, counterZ + 0.15);
          g.add(stallCounter, stallTop, copCord, copShade, copBulb);

          // Foreground interior dining tables inside left/right bays (clear of central doorway!)
          if (intD > 2.2 && Math.abs(bx) > 2.0 && !isFoodDistrict) {
            if (isTehTarik) {
              // TEH TARIK CLUB: Authentic round white-marble kopitiam tables + dark bentwood stools!
              const kTop = new THREE.Mesh(bistroTopGeo, cafeMarbleMat);
              kTop.position.set(bx, 0.74, -1.40);
              const kPole = new THREE.Mesh(bistroPoleGeo, smokedOakMat);
              kPole.position.set(bx, 0.38, -1.40);
              const kFoot = new THREE.Mesh(bistroBaseGeo, smokedOakMat);
              kFoot.position.set(bx, 0.07, -1.40);
              g.add(kTop, kPole, kFoot);
              addLocalContactShadow(g, bx, -1.40, 1.9, 1.3);
              for (const cSide of [-1, 1]) {
                const sTop = new THREE.Mesh(chairSeatGeo, smokedOakMat);
                sTop.position.set(bx + cSide * 0.58, 0.46, -1.40);
                const sLeg = new THREE.Mesh(bistroPoleGeo, smokedOakMat);
                sLeg.scale.set(0.72, 0.62, 0.72);
                sLeg.position.set(bx + cSide * 0.58, 0.23, -1.40);
                g.add(sTop, sLeg);
              }
            } else {
              const dTab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 0.82), hinokiWoodMat);
              dTab.position.set(bx, 0.75, -1.35);
              const dLeg = new THREE.Mesh(bistroPoleGeo, matteSteelMat);
              dLeg.position.set(bx, 0.38, -1.35);
              const dBench = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.46, 0.44), smokedOakMat);
              dBench.position.set(bx, 0.24, -1.92);
              const dBack = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.44, 0.08), intMerchMats[(storeHash + b) % 3]);
              dBack.position.set(bx, 0.66, -2.10);
              g.add(dTab, dLeg, dBench, dBack);
            }
          }
        }
        if (isFoodDistrict) {
          // Warm oak-slatted foreground dining tables & greenery planters in Food District right dining zone!
          for (const fx of [3.2, 7.6]) {
            const fdTab = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.06, 0.92), lightOakMat);
            fdTab.position.set(fx, 0.75, -0.78);
            const fdBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.56), matteSteelMat);
            fdBase.position.set(fx, 0.36, -0.78);
            g.add(fdTab, fdBase);
            addLocalContactShadow(g, fx, -0.78, 2.2, 1.4);
          }
        }
      }
    } else if (prof.facadeType === 'sports-industrial') {
      // UNDER ARMOUR / NIKE / ADIDAS / PUMA vs OUTSIDE CAMPING (100% DISTINCT — ZERO FLOATING SHELVES OR LEGO CUBES!):
      if (isOutside) {
        // OUTSIDE CAMPING & SALOMON: Open timber & alpine-slate expedition gear showroom with thick steel suspension rods + 3D pitched canvas expedition tent!
        for (let b = 0; b < numBays; b++) {
          const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
          const beamTop = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.36, 0.14, 0.22), hinokiWoodMat);
          beamTop.position.set(bx, eaveY - 0.52, -intD + 0.34);
          const warmBar = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.52, 0.05, 0.14), intLightWarmMat);
          warmBar.position.set(bx, eaveY - 0.62, -intD + 0.34);
          for (const rOff of [-(bayStep - 0.56) * 0.45, (bayStep - 0.56) * 0.45]) {
            const suspRod = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.52, 8), matteSteelMat);
            suspRod.position.set(bx + rOff, eaveY - 0.26, -intD + 0.34);
            g.add(suspRod);
          }
          g.add(beamTop, warmBar);
        }
        if (intD > 1.4) {
          // 3D Pitched Canvas Expedition Tent on Timber Deck inside left showcase window + outdoor apparel rail & KEEN footwear shelf!
          const tentX = -Math.min(innerW * 0.24, 2.35);
          const tentZ = -1.08;
          const tentBase = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.18, 1.38), lightOakMat);
          tentBase.position.set(tentX, 0.12, tentZ);
          const tentBody = new THREE.Mesh(new THREE.ConeGeometry(0.96, 1.32, 4), awningCreamMat);
          tentBody.rotation.y = Math.PI * 0.25;
          tentBody.scale.set(1.18, 1.0, 0.88);
          tentBody.position.set(tentX, 0.86, tentZ);
          const tentFly = new THREE.Mesh(new THREE.ConeGeometry(0.98, 0.72, 4), awningForestMat);
          tentFly.rotation.y = Math.PI * 0.25;
          tentFly.scale.set(1.22, 1.0, 0.90);
          tentFly.position.set(tentX, 1.18, tentZ);
          const tentDoor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.78, 0.06), smokedOakMat);
          tentDoor.position.set(tentX, 0.60, tentZ + 0.54);
          tentDoor.rotation.x = -0.40;
          g.add(tentBase, tentBody, tentFly, tentDoor);
          addLocalContactShadow(g, tentX, tentZ, 2.75, 1.75);
          // Outdoor expedition jacket rail + KEEN boot shelf along rear-center bay
          const gearRail = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 0.04), matteSteelMat);
          gearRail.position.set(0.35, 1.98, -intD + 0.44);
          for (const gx of [-0.95, 1.65]) {
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, eaveY, 8), matteSteelMat);
            st.position.set(gx, eaveY * 0.5, -intD + 0.44);
            g.add(st);
          }
          g.add(gearRail);
          for (let j = -2; j <= 2; j++) {
            const jkt = new THREE.Mesh(hangingGarmentGeo, j % 2 === 0 ? awningForestMat : intMerchMats[2]);
            jkt.position.set(0.35 + j * 0.42, 1.48, -intD + 0.44);
            g.add(jkt);
          }
        }
      } else if (isCamp5) {
        // CAMP5 PROSHOP (EZ501): Authentic birch-plywood & galvanized-steel climbing-gear wall displays (coiled dynamic climbing ropes, hanging harnesses, chalk bags & downturn climbing-shoe cubbies — ZERO fashion sneakers or mannequins!)
        const ropeMats = [mrDiyOrangeMat, canaryArchMat, owalaSkyMat, uniqloRedBoxMat, minisoPinkMat, emeraldTrimMat];
        for (let b = 0; b < numBays; b++) {
          const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
          const pegBoard = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.44, eaveY - 0.52, 0.08), hinokiWoodMat);
          pegBoard.position.set(bx, (eaveY - 0.52) * 0.5 + 0.12, -intD + 0.22);
          const topBar = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.38, 0.10, 0.18), canaryArchMat);
          topBar.position.set(bx, eaveY - 0.44, -intD + 0.26);
          g.add(pegBoard, topBar);
          for (const uOff of [-(bayStep - 0.52) * 0.5, (bayStep - 0.52) * 0.5]) {
            const upright = new THREE.Mesh(new THREE.BoxGeometry(0.055, eaveY, 0.32), matteSteelMat);
            upright.position.set(bx + uOff, eaveY * 0.5, -intD + 0.30);
            g.add(upright);
          }
          // Tier 4 (top, y=2.62): Colorful coiled dynamic climbing ropes hanging on steel peg hooks
          for (let r = -2; r <= 2; r++) {
            const rMat = ropeMats[(b * 2 + r + 8) % ropeMats.length];
            const coil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.046, 8, 16), rMat);
            coil.position.set(bx + r * 0.46, 2.62, -intD + 0.32);
            coil.scale.set(0.85, 1.25, 0.95);
            const tie = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.11), obsidianGlossMat);
            tie.position.set(bx + r * 0.46, 2.80, -intD + 0.32);
            g.add(coil, tie);
          }
          // Tier 3 (y=1.96): Hanging climbing harnesses (waistbelt + twin leg loops) & drawstring chalk bags
          const harnessBar = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.54, 0.035, 0.04), brushedAlumMat);
          harnessBar.position.set(bx, 2.18, -intD + 0.36);
          g.add(harnessBar);
          for (let h = -2; h <= 2; h++) {
            const hx = bx + h * 0.46;
            const hMat = ropeMats[(b + h + 5) % ropeMats.length];
            if (h % 2 === 0) {
              // Climbing harness: padded waist ring + twin leg loops
              const belt = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.026, 6, 12), obsidianGlossMat);
              belt.rotation.x = Math.PI * 0.38;
              belt.position.set(hx, 2.04, -intD + 0.36);
              const legL = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.018, 6, 10), hMat);
              legL.position.set(hx - 0.065, 1.88, -intD + 0.36);
              const legR = legL.clone();
              legR.position.x = hx + 0.065;
              g.add(belt, legL, legR);
            } else {
              // Cylindrical drawstring chalk bag + carabiner loop
              const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.19, 10), hMat);
              bag.position.set(hx, 1.96, -intD + 0.36);
              const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.035, 10), obsidianGlossMat);
              rim.position.set(hx, 2.06, -intD + 0.36);
              g.add(bag, rim);
            }
          }
          // Tiers 1 & 2 (y=0.76, 1.34): Birch-plywood climbing-shoe cubby shelves stocked with angled downturn rock-climbing shoes
          for (let sh = 0; sh < 2; sh++) {
            const sy = 0.76 + sh * 0.58;
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.54, 0.045, 0.34), lightOakMat);
            shelf.position.set(bx, sy, -intD + 0.32);
            g.add(shelf);
            for (let c = -2; c <= 2; c++) {
              const div = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.54, 0.30), lightOakMat);
              div.position.set(bx + c * 0.44, sy + 0.27, -intD + 0.31);
              g.add(div);
              const sMat = ropeMats[(b + sh * 2 + c + 6) % ropeMats.length];
              const cShoe = new THREE.Mesh(sneakerUpperGeo, sMat);
              cShoe.scale.set(0.88, 0.82, 0.86);
              cShoe.rotation.set(0.18, c % 2 === 0 ? 0.36 : -0.32, -0.22);
              cShoe.position.set(bx + c * 0.44 + 0.18, sy + 0.09, -intD + 0.34);
              const rand = new THREE.Mesh(sneakerSoleGeo, obsidianGlossMat);
              rand.scale.set(0.86, 0.90, 0.84);
              rand.rotation.y = c % 2 === 0 ? 0.36 : -0.32;
              rand.position.set(bx + c * 0.44 + 0.18, sy + 0.04, -intD + 0.34);
              g.add(cShoe, rand);
            }
          }
        }
        if (intD > 2.2) {
          // Foreground Birch-Plywood Proshop Gear Tables with Coiled Climbing Ropes, Chalk Buckets & Climbing Helmets!
          for (const side of [-1, 1]) {
            const tx = side * Math.min(innerW * 0.28, 6.2);
            const gTable = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.84, 0.96), hinokiWoodMat);
            gTable.position.set(tx, 0.44, -1.52);
            const gTop = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.05, 1.02), matteSteelMat);
            gTop.position.set(tx, 0.88, -1.52);
            g.add(gTable, gTop);
            addLocalContactShadow(g, tx, -1.52, 2.5, 1.45);
            for (let k = -1; k <= 1; k++) {
              const rCoil = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.05, 8, 16), ropeMats[(k + (side > 0 ? 3 : 1)) % ropeMats.length]);
              rCoil.rotation.x = Math.PI / 2;
              rCoil.position.set(tx + k * 0.58, 0.96, -1.52);
              const helm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), k === 0 ? satinWhiteMat : mrDiyOrangeMat);
              helm.position.set(tx + k * 0.58, 1.01, -1.52);
              g.add(rCoil, helm);
            }
          }
        }
      } else {
        // UNDER ARMOUR / PUMA / NIKE / ADIDAS: Full floor-to-eave anchored steel sneaker walls (ZERO top gap!) + 3-part sneakers + full sculpted athletic mannequins!
        const accentMat = isUnderArmour || isPuma || uName.includes('NIKE') ? uniqloRedBoxMat : intLightCoolMat;
        for (let b = 0; b < numBays; b++) {
          const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
          const topBar = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.40, 0.08, 0.16), accentMat);
          topBar.position.set(bx, eaveY - 0.46, -intD + 0.22);
          g.add(topBar);
          // Twin matte-steel uprights extending flush from floor (y=0) to eaveY (ZERO top gap!)
          for (const uOff of [-(bayStep - 0.54) * 0.5, (bayStep - 0.54) * 0.5]) {
            const upright = new THREE.Mesh(new THREE.BoxGeometry(0.055, eaveY, 0.30), matteSteelMat);
            upright.position.set(bx + uOff, eaveY * 0.5, -intD + 0.30);
            g.add(upright);
          }
          for (let sh = 0; sh < 4; sh++) {
            const sy = 0.78 + sh * 0.58;
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.54, 0.04, 0.30), matteSteelMat);
            shelf.position.set(bx, sy, -intD + 0.30);
            g.add(shelf);
            for (let s = -2; s <= 2; s++) {
              addSneakerDisplay(
                g,
                bx + s * 0.40,
                sy + 0.02,
                -intD + 0.32,
                intMerchMats[(b + sh + s + 10) % intMerchMats.length],
                s % 2 === 0 ? 0.32 : -0.26
              );
            }
          }
        }
        if (intD > 2.2) {
          for (const side of [-1, 1]) {
            const tx = side * Math.min(innerW * 0.28, 3.6);
            const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.32, 0.96), rawConcreteMat);
            plinth.position.set(tx, 0.18, -1.52);
            const plinthTrim = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.04, 1.00), matteSteelMat);
            plinthTrim.position.set(tx, 0.35, -1.52);
            g.add(plinth, plinthTrim);
            addLocalContactShadow(g, tx, -1.52, 2.0, 1.45);
            addSculptedMannequin(
              g,
              tx - 0.26,
              0.37,
              -1.52,
              isPuma || isUnderArmour ? obsidianGlossMat : mannequinLightMat,
              -side * 0.30,
              isPuma ? uniqloRedBoxMat : isAdidas ? obsidianGlossMat : intMerchMats[(storeHash + (side > 0 ? 1 : 0)) % intMerchMats.length]
            );
            // Angled sneaker pedestal beside athletic mannequin
            const shoePed = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.42), matteSteelMat);
            shoePed.position.set(tx + 0.42, 0.56, -1.46);
            g.add(shoePed);
            addSneakerDisplay(g, tx + 0.42, 0.78, -1.46, isPuma || isUnderArmour ? uniqloRedBoxMat : intMerchMats[1], -side * 0.38);
          }
        }
      }
    } else if (prof.facadeType === 'luxury-fashion') {
      // LUXURY FASHION (UNIQLO, TOMMY HILFIGER, BONIA, PARKSON ELITE, CHANEL, DIOR, COACH, ZARA) vs DIVA KARAOKE NEOCLASSICAL KTV LOUNGE:
      // Every brand gets grounded floor-to-ceiling anchored fixtures & ZERO blown-out white lightboxes!
      const accentRackMat = isUniqlo || isTommy ? brushedAlumMat : isChanel ? obsidianGlossMat : brassGoldMat;
      for (let b = 0; b < numBays; b++) {
        const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
        if (isDiva) {
          // DIVA KARAOKE (EZ502): Warm taupe-cream neoclassical KTV VIP suite portals, fluted walnut acoustic doors, gold architraves & glowing crystal wall sconces (ZERO handbags or garment racks!)
          const ktvWallPanel = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.24, eaveY - 0.32, 0.10), ivoryStoneMat);
          ktvWallPanel.position.set(bx, (eaveY - 0.32) * 0.5 + 0.08, -intD + 0.22);
          const goldArchitrave = new THREE.Mesh(new THREE.BoxGeometry(1.76, 2.74, 0.16), brassGoldMat);
          goldArchitrave.position.set(bx, 1.39, -intD + 0.28);
          const vipDoor = new THREE.Mesh(new THREE.BoxGeometry(1.52, 2.58, 0.20), smokedOakMat);
          vipDoor.position.set(bx, 1.31, -intD + 0.30);
          const doorWindow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.92, 0.22), intLightWarmMat);
          doorWindow.position.set(bx, 1.56, -intD + 0.31);
          const roomPlaque = new THREE.Mesh(
            new THREE.PlaneGeometry(0.76, 0.26),
            new THREE.MeshBasicMaterial({ map: createSignBoardTexture(`VIP SUITE 0${b + 1}`, 'DIVA KTV LOUNGE', '#2e1a36', '#fde68a', '#d4af37', 256, 96) })
          );
          roomPlaque.position.set(bx, 2.98, -intD + 0.30);
          g.add(ktvWallPanel, goldArchitrave, vipDoor, doorWindow, roomPlaque);
          for (const sOff of [-(bayStep - 0.44) * 0.44, (bayStep - 0.44) * 0.44]) {
            const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.14, eaveY - 0.28, 0.18), ivoryStoneMat);
            pilaster.position.set(bx + sOff, (eaveY - 0.28) * 0.5 + 0.08, -intD + 0.26);
            const sconceBack = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.28, 0.06), brassGoldMat);
            sconceBack.position.set(bx + sOff, 2.05, -intD + 0.36);
            const sconceOrb = new THREE.Mesh(sconceGlobeGeo, lanternGlowWarmMat);
            sconceOrb.scale.setScalar(0.75);
            sconceOrb.position.set(bx + sOff, 2.16, -intD + 0.42);
            g.add(pilaster, sconceBack, sconceOrb);
          }
        } else if (isChanel) {
          // CHANEL BEAUTY / FRAGRANCE: Soft calibrated backlit alabaster niche (staggered z = -intD + 0.24 -> ZERO Z-fighting!) + faceted square No. 5 perfume flacons with black stoppers!
          const backLitNiche = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.44, eaveY - 0.65, 0.08), chanelBacklitAlabasterMat);
          backLitNiche.position.set(bx, eaveY * 0.5, -intD + 0.24);
          const blackCredenza = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.40, 0.82, 0.52), obsidianGlossMat);
          blackCredenza.position.set(bx, 0.42, -intD + 0.38);
          for (const uOff of [-(bayStep - 0.44) * 0.5, (bayStep - 0.44) * 0.5]) {
            const framePost = new THREE.Mesh(new THREE.BoxGeometry(0.055, eaveY - 0.58, 0.34), obsidianGlossMat);
            framePost.position.set(bx + uOff, eaveY * 0.5, -intD + 0.34);
            g.add(framePost);
          }
          g.add(backLitNiche, blackCredenza);
          for (let sh = 0; sh < 3; sh++) {
            const sy = 1.16 + sh * 0.62;
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.48, 0.035, 0.30), obsidianGlossMat);
            shelf.position.set(bx, sy, -intD + 0.36);
            g.add(shelf);
            for (let fl = -2; fl <= 2; fl++) {
              const flacon = new THREE.Mesh(flaconSquareGeo, fl % 2 === 0 ? amberBacklitMat : satinWhiteMat);
              flacon.position.set(bx + fl * 0.36, sy + 0.11, -intD + 0.36);
              const stopper = new THREE.Mesh(flaconCapGeo, obsidianGlossMat);
              stopper.position.set(bx + fl * 0.36, sy + 0.22, -intD + 0.36);
              g.add(flacon, stopper);
            }
          }
        } else if (isCoach) {
          // COACH (G309): Warm espresso-walnut credenzas + floor-to-ceiling brushed-brass stanchions + 3D structured leather handbags with top handles!
          const credenza = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.40, 0.82, 0.56), smokedOakMat);
          credenza.position.set(bx, 0.42, -intD + 0.38);
          const topGlow = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.50, 0.045, 0.16), intLightWarmMat);
          topGlow.position.set(bx, eaveY - 0.52, -intD + 0.24);
          for (const uOff of [-(bayStep - 0.54) * 0.5, (bayStep - 0.54) * 0.5]) {
            const upright = new THREE.Mesh(new THREE.BoxGeometry(0.048, eaveY - 0.48, 0.32), brassGoldMat);
            upright.position.set(bx + uOff, (eaveY - 0.48) * 0.5, -intD + 0.34);
            g.add(upright);
          }
          g.add(credenza, topGlow);
          for (let sh = 0; sh < 3; sh++) {
            const sy = 1.10 + sh * 0.64;
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.54, 0.045, 0.34), brassGoldMat);
            shelf.position.set(bx, sy, -intD + 0.34);
            g.add(shelf);
            for (let hb = -1; hb <= 1; hb++) {
              const bagMat = (sh + hb) % 2 === 0 ? smokedOakMat : intMerchMats[(sh + hb + 6) % 4];
              const bag = new THREE.Mesh(handbagGeo, bagMat);
              bag.position.set(bx + hb * 0.62, sy + 0.15, -intD + 0.36);
              const handle = new THREE.Mesh(handbagHandleGeo, brassGoldMat);
              handle.position.set(bx + hb * 0.62, sy + 0.28, -intD + 0.36);
              g.add(bag, handle);
            }
          }
        } else if (isZara) {
          // ZARA: Minimalist travertine plinths + floor-to-ceiling anchored matte-steel garment rails (ZERO floating bars!)
          const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.44, 0.58, 0.58), ivoryStoneMat);
          stoneBase.position.set(bx, 0.30, -intD + 0.38);
          const rail = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.60, 0.04, 0.04), matteSteelMat);
          rail.position.set(bx, 2.04, -intD + 0.44);
          for (const uOff of [-(bayStep - 0.62) * 0.5, (bayStep - 0.62) * 0.5]) {
            const stanchion = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, eaveY - 0.20, 8), matteSteelMat);
            stanchion.position.set(bx + uOff, (eaveY - 0.20) * 0.5, -intD + 0.44);
            g.add(stanchion);
          }
          g.add(stoneBase, rail);
          for (let h = -2; h <= 2; h++) {
            const garm = new THREE.Mesh(hangingGarmentGeo, h % 2 === 0 ? mannequinLinenMat : rawConcreteMat);
            garm.position.set(bx + h * 0.35, 1.54, -intD + 0.44);
            g.add(garm);
          }
        } else if (isUniqlo) {
          // UNIQLO: Anchored modular gallery-white cube shelves packed with colorful folded knitwear stacks!
          for (const uOff of [-(bayStep - 0.36) * 0.5, (bayStep - 0.36) * 0.5]) {
            const up = new THREE.Mesh(new THREE.BoxGeometry(0.055, eaveY - 0.42, 0.42), satinWhiteMat);
            up.position.set(bx + uOff, (eaveY - 0.42) * 0.5, -intD + 0.34);
            g.add(up);
          }
          for (let sh = 0; sh < 4; sh++) {
            const sy = 0.68 + sh * 0.64;
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.36, 0.05, 0.42), satinWhiteMat);
            shelf.position.set(bx, sy, -intD + 0.34);
            g.add(shelf);
            for (let k = -1; k <= 1; k++) {
              const stack = new THREE.Mesh(foldedStackGeo, intMerchMats[(b * 2 + sh + k + 12) % intMerchMats.length]);
              stack.position.set(bx + k * 0.64, sy + 0.16, -intD + 0.36);
              g.add(stack);
            }
          }
        } else if (isParkson) {
          // PARKSON ELITE (G320): Grounded beveled walnut & brass luxury display cabinets with uprights cleanly capped at y = 2.68 (WELL below crystal chandeliers — ZERO double-rod seam!)
          const credenza = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.48, 0.82, 0.56), smokedOakMat);
          credenza.position.set(bx, 0.43, -intD + 0.38);
          const credTop = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.44, 0.05, 0.60), brassGoldMat);
          credTop.position.set(bx, 0.86, -intD + 0.38);
          const rackH = 2.66;
          for (const uOff of [-(bayStep - 0.64) * 0.5, (bayStep - 0.64) * 0.5]) {
            const up = new THREE.Mesh(new THREE.BoxGeometry(0.044, rackH, 0.30), brassGoldMat);
            up.position.set(bx + uOff, rackH * 0.5, -intD + 0.34);
            g.add(up);
          }
          const topCap = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.58, 0.048, 0.32), brassGoldMat);
          topCap.position.set(bx, rackH, -intD + 0.34);
          g.add(credenza, credTop, topCap);
          for (let sh = 0; sh < 2; sh++) {
            const sy = 1.38 + sh * 0.66;
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.66, 0.042, 0.32), brassGoldMat);
            shelf.position.set(bx, sy, -intD + 0.34);
            g.add(shelf);
            for (let hb = -1; hb <= 1; hb++) {
              const bag = new THREE.Mesh(handbagGeo, intMerchMats[(storeHash + sh + hb + 12) % intMerchMats.length]);
              bag.position.set(bx + hb * 0.66, sy + 0.15, -intD + 0.36);
              const handle = new THREE.Mesh(handbagHandleGeo, brassGoldMat);
              handle.position.set(bx + hb * 0.66, sy + 0.28, -intD + 0.36);
              g.add(bag, handle);
            }
          }
        } else if (isTommy || (storeHash + b) % 2 === 0) {
          // TOMMY HILFIGER / TAILORED APPAREL: Floor-to-ceiling anchored brass/chrome garment rail with hung 3D garments!
          const rail = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.60, 0.045, 0.045), accentRackMat);
          rail.position.set(bx, 1.98, -intD + 0.46);
          for (const uOff of [-(bayStep - 0.62) * 0.5, (bayStep - 0.62) * 0.5]) {
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, eaveY - 0.20, 8), accentRackMat);
            st.position.set(bx + uOff, (eaveY - 0.20) * 0.5, -intD + 0.46);
            g.add(st);
          }
          const railBarTop = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.52, 0.05, 0.18), intLightWarmMat);
          railBarTop.position.set(bx, eaveY - 0.50, -intD + 0.26);
          g.add(rail, railBarTop);
          if (isTommy) {
            const redStripe = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.44, 0.12, 0.10), uniqloRedBoxMat);
            redStripe.position.set(bx, eaveY - 0.42, -intD + 0.20);
            g.add(redStripe);
          }
          for (let h = -2; h <= 2; h++) {
            const garm = new THREE.Mesh(hangingGarmentGeo, intMerchMats[(storeHash + b + h + 10) % intMerchMats.length]);
            garm.position.set(bx + h * 0.34, 1.48, -intD + 0.46);
            g.add(garm);
          }
        } else {
          // BONIA / PARKSON / DIOR: Grounded luxury credenza & vertical-upright anchored brass handbag shelves!
          const credenza = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.42, 0.78, 0.56), prof.isLight ? ivoryStoneMat : obsidianGlossMat);
          credenza.position.set(bx, 0.41, -intD + 0.38);
          const topGlow = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.52, 0.05, 0.16), intLightWarmMat);
          topGlow.position.set(bx, eaveY - 0.52, -intD + 0.24);
          for (const uOff of [-(bayStep - 0.56) * 0.5, (bayStep - 0.56) * 0.5]) {
            const up = new THREE.Mesh(new THREE.BoxGeometry(0.048, eaveY - 0.48, 0.32), brassGoldMat);
            up.position.set(bx + uOff, (eaveY - 0.48) * 0.5, -intD + 0.34);
            g.add(up);
          }
          g.add(credenza, topGlow);
          for (let sh = 0; sh < 3; sh++) {
            const sy = 1.08 + sh * 0.66;
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.56, 0.045, 0.34), brassGoldMat);
            shelf.position.set(bx, sy, -intD + 0.34);
            g.add(shelf);
            for (let hb = -1; hb <= 1; hb++) {
              const bag = new THREE.Mesh(handbagGeo, intMerchMats[(storeHash + sh + hb + 12) % intMerchMats.length]);
              bag.position.set(bx + hb * 0.62, sy + 0.16, -intD + 0.36);
              const handle = new THREE.Mesh(handbagHandleGeo, brassGoldMat);
              handle.position.set(bx + hb * 0.62, sy + 0.29, -intD + 0.36);
              g.add(bag, handle);
            }
          }
        }
      }
      // Interior Luxury Marble Display Islands & Dressed Window Mannequins INSIDE the Store!
      if (intD > 2.2) {
        if (isDiva) {
          // DIVA KARAOKE (EZ502): Tufted velvet neoclassical KTV lounge booths, marble cocktail tables, upright gold microphone stands & hanging crystal chandeliers (ZERO mannequins!)
          for (let b = 0; b < numBays; b++) {
            const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
            // Hanging 2-tier gold & warm crystal chandelier in each KTV bay
            const chChain = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.72, 6), brassGoldMat);
            chChain.position.set(bx, eaveY - 0.40, -1.55);
            const chRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.032, 8, 18), brassGoldMat);
            chRing1.rotation.x = Math.PI / 2;
            chRing1.position.set(bx, eaveY - 0.78, -1.55);
            const chGlow1 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.26, 14), lanternGlowWarmMat);
            chGlow1.position.set(bx, eaveY - 0.90, -1.55);
            g.add(chChain, chRing1, chGlow1);
            if (Math.abs(bx) < 1.8) continue;
            // Tufted velvet KTV lounge banquette sofa + gold-rimmed cocktail table + gold standing mic
            const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.44, 0.76), smokedOakMat);
            sofaSeat.position.set(bx, 0.24, -1.85);
            const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.54, 0.22), norenCrimsonMat);
            sofaBack.position.set(bx, 0.68, -2.14);
            const sofaGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(2.20, 0.05, 0.80), brassGoldMat);
            sofaGoldTrim.position.set(bx, 0.05, -1.85);
            const ktvTable = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 16), cafeMarbleMat);
            ktvTable.position.set(bx, 0.66, -1.16);
            const ktvPed = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.18, 0.62, 10), brassGoldMat);
            ktvPed.position.set(bx, 0.33, -1.16);
            const micStand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.32, 8), brassGoldMat);
            micStand.position.set(bx + 0.72, 0.68, -1.18);
            const micHead = new THREE.Mesh(sconceGlobeGeo, brushedAlumMat);
            micHead.scale.setScalar(0.55);
            micHead.position.set(bx + 0.72, 1.36, -1.18);
            g.add(sofaSeat, sofaBack, sofaGoldTrim, ktvTable, ktvPed, micStand, micHead);
            addLocalContactShadow(g, bx, -1.65, 2.5, 1.5);
          }
        } else if (isChanel) {
          // Sleek central Chanel black-lacquer fragrance bar table with faceted square No. 5 perfume flacons
          const chTable = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.88, 1.05), obsidianGlossMat);
          chTable.position.set(0, 0.45, -1.65);
          const chTop = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.04, 1.10), satinWhiteMat);
          chTop.position.set(0, 0.91, -1.65);
          g.add(chTable, chTop);
          addLocalContactShadow(g, 0, -1.65, 3.2, 1.6);
          for (let fl = -2; fl <= 2; fl++) {
            const flacon = new THREE.Mesh(flaconSquareGeo, fl % 2 === 0 ? amberBacklitMat : satinWhiteMat);
            flacon.scale.set(1.25, 1.25, 1.25);
            flacon.position.set(fl * 0.46, 1.05, -1.65);
            const cap = new THREE.Mesh(flaconCapGeo, obsidianGlossMat);
            cap.scale.set(1.25, 1.25, 1.25);
            cap.position.set(fl * 0.46, 1.19, -1.65);
            g.add(flacon, cap);
          }
        } else if (isCoach) {
          // Grounded Coach brushed-brass frame & espresso-walnut handbag display tables (cleanly spaced, ZERO overlapping boxes!)
          for (const side of [-1, 1]) {
            const cx = side * Math.min(innerW * 0.25, 2.55);
            const cTable = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.82, 0.92), smokedOakMat);
            cTable.position.set(cx, 0.43, -1.56);
            const cRim = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.05, 0.98), brassGoldMat);
            cRim.position.set(cx, 0.86, -1.56);
            const cPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.06, 0.96), brassGoldMat);
            cPlinth.position.set(cx, 0.06, -1.56);
            g.add(cTable, cRim, cPlinth);
            addLocalContactShadow(g, cx, -1.56, 2.35, 1.45);
            for (const hbOff of [-0.46, 0.46]) {
              const bag = new THREE.Mesh(handbagGeo, hbOff < 0 ? intMerchMats[2] : obsidianGlossMat);
              bag.position.set(cx + hbOff, 1.02, -1.56);
              const handle = new THREE.Mesh(handbagHandleGeo, brassGoldMat);
              handle.position.set(cx + hbOff, 1.15, -1.56);
              g.add(bag, handle);
            }
          }
        } else if (isZara) {
          // Minimalist Zara monolithic travertine showcase tables + 2 full sculpted travertine window mannequins!
          for (const side of [-1, 1]) {
            const zx = side * Math.min(innerW * 0.28, 3.6);
            const zTable = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.72, 0.98), ivoryStoneMat);
            zTable.position.set(zx, 0.38, -1.62);
            const st1 = new THREE.Mesh(foldedStackGeo, mannequinLinenMat);
            st1.position.set(zx - 0.46, 0.86, -1.62);
            const st2 = new THREE.Mesh(foldedStackGeo, rawConcreteMat);
            st2.position.set(zx + 0.46, 0.86, -1.62);
            const mPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.22, 0.76), ivoryStoneMat);
            mPlinth.position.set(zx - side * 1.65, 0.13, -1.32);
            g.add(zTable, st1, st2, mPlinth);
            addLocalContactShadow(g, zx, -1.62, 2.6, 1.45);
            addSculptedMannequin(g, zx - side * 1.65, 0.24, -1.32, mannequinLightMat, -side * 0.26, side < 0 ? mannequinLinenMat : rawConcreteMat);
          }
        } else {
          const islandCount = isParkson ? 4 : 2;
          for (let i = 0; i < islandCount; i++) {
            const ix = -innerW * 0.34 + (i / Math.max(1, islandCount - 1)) * (innerW * 0.68);
            if (Math.abs(ix) < 1.85) continue; // Keep central entrance walk-in aisle open!
            if (isParkson) {
              // Beveled walnut & brass luxury cosmetics/handbag counter inside Parkson Elite!
              const pCab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.88, 0.96), smokedOakMat);
              pCab.position.set(ix, 0.46, -1.55);
              const pTop = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.055, 1.04), cafeMarbleMat);
              pTop.position.set(ix, 0.92, -1.55);
              const pBrass = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.04, 1.02), brassGoldMat);
              pBrass.position.set(ix, 0.06, -1.55);
              g.add(pCab, pTop, pBrass);
              addLocalContactShadow(g, ix, -1.55, 2.75, 1.50);
              for (const bo of [-0.55, 0.55]) {
                const bag = new THREE.Mesh(handbagGeo, intMerchMats[(storeHash + i + (bo > 0 ? 1 : 0)) % intMerchMats.length]);
                bag.position.set(ix + bo, 1.08, -1.55);
                const handle = new THREE.Mesh(handbagHandleGeo, brassGoldMat);
                handle.position.set(ix + bo, 1.21, -1.55);
                g.add(bag, handle);
              }
            } else {
              const ped = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.42, 0.84), prof.isLight ? cafeMarbleMat : obsidianGlossMat);
              ped.position.set(ix, 0.23, -1.48);
              const pedTrim = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.04, 0.88), accentRackMat);
              pedTrim.position.set(ix, 0.45, -1.48);
              g.add(ped, pedTrim);
              addLocalContactShadow(g, ix, -1.48, 1.65, 1.3);
              addSculptedMannequin(g, ix, 0.47, -1.48, prof.isLight ? mannequinLightMat : obsidianGlossMat, i % 2 === 0 ? 0.30 : -0.30, intMerchMats[(storeHash + i) % intMerchMats.length]);
            }
          }
        }
      }
    } else if (prof.facadeType === 'entertainment-marquee') {
      // PJPAC warm timber-slatted performing arts lobby vs Game On reception & turnstiles vs RollerWa 3D skate cubbies vs Toy Catchers 3D Plushie Shelves & Claw Arcade vs GSC/TGV/Pop Mart!
      if (isPjpac) {
        // PJPAC (S611): Warm timber-slatted theatre lobby wall, Stage 1 & Nero Space acoustic walnut double doors, brass velvet queue stanchions & cushioned foyer benches!
        const lobbyWall = new THREE.Mesh(new THREE.BoxGeometry(13.6, eaveY - 0.15, 0.14), smokedOakMat);
        lobbyWall.position.set(0, eaveY * 0.5, -intD + 0.24);
        g.add(lobbyWall);
        for (let sl = -16; sl <= 16; sl++) {
          if (Math.abs(sl) <= 4) continue; // Keep central Stage 1 acoustic double doors open!
          const tSlat = new THREE.Mesh(new THREE.BoxGeometry(0.11, eaveY - 0.22, 0.22), vertOakMat);
          tSlat.position.set(sl * 0.40, eaveY * 0.5, -intD + 0.30);
          g.add(tSlat);
        }
        // Central Stage 1 Proscenium Acoustic Double Doors framed in warm brushed brass!
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.3, 2.75, 0.22), brassGoldMat);
        doorFrame.position.set(0, 1.38, -intD + 0.32);
        for (const ds of [-0.78, 0.78]) {
          const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.48, 2.62, 0.26), smokedOakMat);
          leaf.position.set(ds, 1.32, -intD + 0.34);
          const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.85, 8), brassGoldMat);
          pull.position.set(ds - Math.sign(ds) * 0.56, 1.18, -intD + 0.50);
          g.add(leaf, pull);
        }
        // Velvet-rope brass queue stanchions & upholstered theatre foyer benches flanking Stage 1!
        for (const side of [-1, 1]) {
          for (let sp = 0; sp < 3; sp++) {
            const sx = side * (2.35 + sp * 1.35);
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.045, 0.90, 8), brassGoldMat);
            post.position.set(sx, 0.45, -1.22);
            const pBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.04, 12), brassGoldMat);
            pBase.position.set(sx, 0.04, -1.22);
            g.add(post, pBase);
          }
          const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 2.7, 8), norenCrimsonMat);
          rope.rotation.z = Math.PI / 2;
          rope.position.set(side * 3.70, 0.72, -1.22);
          const fBench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.46, 0.74), obsidianGlossMat);
          fBench.position.set(side * 4.2, 0.25, -2.15);
          const fBenchWood = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.12, 0.78), vertOakMat);
          fBenchWood.position.set(side * 4.2, 0.08, -2.15);
          g.add(rope, fBench, fBenchWood);
          addLocalContactShadow(g, side * 4.2, -2.15, 2.6, 1.2);
        }
        g.add(doorFrame);
      } else if (isRollerwa) {
        // ROLLERWA (F603A): Backlit dark-indigo 3D skate rental cubby walls flanking entrance stocked with colorful 3D quad roller skates!
        for (const side of [-1, 1]) {
          const cx = side * 3.95;
          const cubbyBack = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.65, 0.42), navyPanelMat);
          cubbyBack.position.set(cx, 1.35, -intD + 0.34);
          g.add(cubbyBack);
          for (let sh = 0; sh < 4; sh++) {
            const sy = 0.56 + sh * 0.56;
            const shBar = new THREE.Mesh(new THREE.BoxGeometry(3.32, 0.04, 0.46), satinWhiteMat);
            shBar.position.set(cx, sy, -intD + 0.36);
            const shLed = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.025, 0.05), sh % 2 === 0 ? coolCoveLedMat : rwPinkNeonMat);
            shLed.position.set(cx, sy - 0.03, -intD + 0.56);
            g.add(shBar, shLed);
            for (let sk = -2; sk <= 2; sk++) {
              const skX = cx + sk * 0.58;
              const boot = new THREE.Mesh(sneakerUpperGeo, rainbowBandMats[(sh * 2 + sk + 7) % rainbowBandMats.length]);
              boot.scale.set(0.85, 1.25, 0.95);
              boot.position.set(skX, sy + 0.12, -intD + 0.40);
              const wheels = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.045, 0.12), rwPinkNeonMat);
              wheels.position.set(skX, sy + 0.04, -intD + 0.40);
              g.add(boot, wheels);
            }
          }
        }
      } else if (isGameOn) {
        // GAME ON SPORTS HUB (F601): Sleek dark-anodized reception counter, illuminated glass entry turnstile gates & athletic locker wall inside tunnel!
        const recDesk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.02, 0.78), obsidianGlossMat);
        recDesk.position.set(0, 0.54, -intD + 0.65);
        const recLed = new THREE.Mesh(new THREE.BoxGeometry(3.46, 0.05, 0.82), gameOnLedMats[1]);
        recLed.position.set(0, 1.04, -intD + 0.65);
        g.add(recDesk, recLed);
        for (const tx of [-1.45, 0.0, 1.45]) {
          const gate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.94, 0.92), matteSteelMat);
          gate.position.set(tx, 0.50, -1.65);
          const gateLed = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.04, 0.94), gameOnLedMats[0]);
          gateLed.position.set(tx, 0.98, -1.65);
          g.add(gate, gateLed);
          if (tx < 1.0) {
            const wing = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.72), intGlassPhysMat);
            wing.position.set(tx + 0.72, 0.56, -1.65);
            g.add(wing);
          }
        }
      } else if (isToyCatcher) {
        // TOY CATCHERS (EZ402): Crisp Illuminated 4-Tier 3D Kawaii Plushie Display Shelving & Glowing UFO Claw / Gachapon Arcade Cabinets across the entire width (especially the right half visible in 4F-05!)
        const tcMarqueeMat = new THREE.MeshBasicMaterial({
          map: createSignBoardTexture('TOY CATCHERS • PLUSHIE PRIZE WALL', '100+ KAWAII PLUSHIES • UFO CATCHERS & GACHAPON', '#831843', '#fef08a', '#f472b6', 512, 128)
        });
        const plushPalette = [minisoPinkMat, canaryArchMat, owalaSkyMat, emeraldTrimMat, mrDiyOrangeMat, uniqloRedBoxMat];
        for (let b = 0; b < numBays; b++) {
          const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
          // Illuminated pink/white marquee header crowning every backwall plushie shelf bay
          const bayHeader = new THREE.Mesh(
            new THREE.BoxGeometry(bayStep - 0.34, 0.48, 0.24),
            [minisoPinkMat, minisoPinkMat, minisoPinkMat, minisoPinkMat, tcMarqueeMat, tcMarqueeMat]
          );
          bayHeader.position.set(bx, eaveY - 0.58, -intD + 0.34);
          const baseCab = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.34, 0.64, 0.48), satinWhiteMat);
          baseCab.position.set(bx, 0.34, -intD + 0.36);
          const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.30, 0.06, 0.52), b % 2 === 0 ? rwPinkNeonMat : topToyCyanLedMat);
          baseTrim.position.set(bx, 0.66, -intD + 0.36);
          g.add(bayHeader, baseCab, baseTrim);
          for (const uOff of [-(bayStep - 0.38) * 0.5, (bayStep - 0.38) * 0.5]) {
            const up = new THREE.Mesh(new THREE.BoxGeometry(0.065, eaveY - 0.44, 0.42), satinWhiteMat);
            up.position.set(bx + uOff, (eaveY - 0.44) * 0.5, -intD + 0.36);
            const ledPost = new THREE.Mesh(new THREE.BoxGeometry(0.028, eaveY - 0.52, 0.04), b % 2 === 0 ? rwPinkNeonMat : topToyCyanLedMat);
            ledPost.position.set(bx + uOff, (eaveY - 0.52) * 0.5, -intD + 0.58);
            g.add(up, ledPost);
          }
          for (let sh = 0; sh < 4; sh++) {
            const sy = 0.72 + sh * 0.64;
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.38, 0.05, 0.42), satinWhiteMat);
            shelf.position.set(bx, sy, -intD + 0.36);
            const shLed = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.42, 0.025, 0.04), sh % 2 === 0 ? rwPinkNeonMat : topToyCyanLedMat);
            shLed.position.set(bx, sy + 0.02, -intD + 0.57);
            g.add(shelf, shLed);
            for (let p = -2; p <= 2; p++) {
              const pMat = plushPalette[(b * 2 + sh + p + 10) % plushPalette.length];
              addKawaiiPlushie(g, bx + p * 0.52, sy + 0.03, -intD + 0.38, pMat, 1.08, p * 0.18);
            }
          }
          // Mid-room row of glowing 3D UFO Claw & Gachapon Capsules Cabinets inside the deep right/left bays!
          if (intD > 2.2) {
            const cabBase = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.90, 1.12), minisoPinkMat);
            cabBase.position.set(bx, 0.47, -1.48);
            const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(1.44, 1.18, 1.04), intGlassPhysMat);
            cabGlass.position.set(bx, 1.51, -1.48);
            const cabTop = new THREE.Mesh(
              new THREE.BoxGeometry(1.56, 0.36, 1.16),
              [minisoPinkMat, minisoPinkMat, minisoPinkMat, minisoPinkMat, tcMarqueeMat, tcMarqueeMat]
            );
            cabTop.position.set(bx, 2.28, -1.48);
            g.add(cabBase, cabGlass, cabTop);
            for (let pl = -1; pl <= 1; pl++) {
              addKawaiiPlushie(g, bx + pl * 0.38, 0.94, -1.48, plushPalette[(b + pl + 4) % plushPalette.length], 0.96, 0);
            }
          }
        }
      } else {
        for (let b = 0; b < numBays; b++) {
          const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayStep;
          const baseDesk = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.38, 0.96, 0.78), matteSteelMat);
          baseDesk.position.set(bx, 0.50, -1.55);
          const topGlow = new THREE.Mesh(new THREE.BoxGeometry(bayStep - 0.36, 0.06, 0.82), coolCoveLedMat);
          topGlow.position.set(bx, 1.00, -1.55);
          g.add(baseDesk, topGlow);
        }
      }
    } else {
      // MINIMALIST TECH / FURNITURE (Machines, Dyson, Samsung, Muji, Nitori, XZQT — EXCLUDING Cellini which builds its own L-shaped leather sectional vignettes!):
      // Sleek oak/steel product demo tables framing the architectural feature backwall!
      if (intD > 2.2 && !isCellini) {
        const tblN = Math.max(2, Math.min(4, Math.floor(innerW / 4.8)));
        for (let i = 0; i < tblN; i++) {
          const tx = -innerW * 0.34 + (i / Math.max(1, tblN - 1)) * (innerW * 0.68);
          if (Math.abs(tx) < 1.55) continue;
          const tbl = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.86, 0.96), prof.isLight ? hinokiWoodMat : matteSteelMat);
          tbl.position.set(tx, 0.45, -1.55);
          const item1 = new THREE.Mesh(shoeBoxGeo, brushedAlumMat);
          item1.position.set(tx - 0.52, 0.96, -1.55);
          const item2 = new THREE.Mesh(shoeBoxGeo, brushedAlumMat);
          item2.position.set(tx + 0.52, 0.96, -1.55);
          g.add(tbl, item1, item2);
        }
      }
    }

    // Physical Gleaming Ultra-Clear Single-Sided Low-Iron Fresnel Storefront Glass Panes (OMITTED on 100% open glassless portals matching real 1 Utama photos!)
    const doorHalfW = Math.min(2.1, innerW * 0.24);
    const glassBayW = halfW - 0.22 - doorHalfW;
    const isOpenGlassless =
      isParkson || isAeon || isDecathlon || isGsc || isTgv || isWangsa || isToyCatcher ||
      isJayaGrocer || isGameOn || isModu || isMrt ||
      isMrDiy || isPopMart || isTopToy || isZusPastry || isSephora ||
      isStarbucks || isHeytea || isMiniso || isIppudo || isBhc ||
      isComeTrue || isAdidas || isFoodDistrict || isRollerwa;
    if (glassBayW > 0.45 && !isOpenGlassless) {
      const trimM = prof.isLight ? brushedAlumMat : matteSteelMat;
      for (const side of [-1, 1]) {
        const gx = side * (doorHalfW + glassBayW * 0.5);
        const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(glassBayW, eaveY - 0.16), intGlassPhysMat);
        glassPane.position.set(gx, eaveY * 0.5, 0.20);
        glassPane.renderOrder = 10;
        // Top & bottom aluminum glazing channels + vertical glass portal stile + brushed stainless door pull-bar!
        const botChannel = new THREE.Mesh(new THREE.BoxGeometry(glassBayW, 0.08, 0.09), trimM);
        botChannel.position.set(gx, 0.04, 0.18);
        const topChannel = new THREE.Mesh(new THREE.BoxGeometry(glassBayW, 0.08, 0.09), trimM);
        topChannel.position.set(gx, eaveY - 0.06, 0.18);
        const doorEdge = new THREE.Mesh(new THREE.BoxGeometry(0.065, eaveY - 0.06, 0.10), trimM);
        doorEdge.position.set(side * doorHalfW, eaveY * 0.5, 0.18);
        const pullBar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.92, 8), steelHandrailMat);
        pullBar.position.set(side * (doorHalfW + 0.14), 1.18, 0.25);
        g.add(glassPane, botChannel, topChannel, doorEdge, pullBar);
        // Slim vertical glass panel mullions every ~3.4m across wide showcase windows (skipped on HEYTEA so menu stays 100% crisp & uncrossed!)
        const paneCount = isHeytea ? 0 : Math.floor(glassBayW / 3.4);
        for (let mp = 1; mp <= paneCount; mp++) {
          const mx = side * (doorHalfW + (mp / (paneCount + 1)) * glassBayW);
          const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.042, eaveY - 0.10, 0.07), trimM);
          mullion.position.set(mx, eaveY * 0.5, 0.18);
          g.add(mullion);
        }
      }
    }

    // 3. BESPOKE 3D ARCHITECTURAL FACADE CONSTRUCTION BY STORE TYPE (ZERO COOKIE-CUTTER TEMPLATES!)
    switch (prof.facadeType) {
      case 'cafe-patisserie': {
        // Photo-matched café architecture: ONLY generic patisseries get fabric awnings/dados (SKIPPED on Come True Cafe, HEYTEA, Starbucks Reserve & Coffee Meets Pastry by ZUS!)
        const isModernOpenCafe = isHeytea || isComeTrue || isStarbucks || isZusPastry;
        const awningMat = uName.includes('ORIENTAL')
          ? awningForestMat
          : uName.includes('CHÂTERAISÉ') || uName.includes('LAVENDER') || uName.includes('FAMOUS')
            ? awningTerracottaMat
            : awningCreamMat;

        if (!isModernOpenCafe) {
          for (const side of [-1, 1]) {
            const px = side * (halfW - 0.18);
            const pil = new THREE.Mesh(new THREE.BoxGeometry(0.36, storeH, 0.80), creamTileMat);
            pil.position.set(px, storeH * 0.5, 0.22);
            const woodCap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.84), smokedOakMat);
            woodCap.position.set(px, eaveY - 0.04, 0.24);
            const sconceArm = new THREE.Mesh(sconceArmGeo, brassGoldMat);
            sconceArm.position.set(px, 2.55, 0.68);
            const sconceBulb = new THREE.Mesh(sconceGlobeGeo, lanternGlowWarmMat);
            sconceBulb.position.set(px, 2.66, 0.76);
            g.add(pil, woodCap, sconceArm, sconceBulb);
          }

          const awningW = Math.max(3.6, store.width - 0.96);
          const awningSlope = new THREE.Mesh(new THREE.BoxGeometry(awningW, 0.10, 1.24), awningMat);
          awningSlope.position.set(0, eaveY - 0.22, 0.76);
          awningSlope.rotation.x = 0.34;
          const awningValance = new THREE.Mesh(new THREE.BoxGeometry(awningW, 0.24, 0.06), awningMat);
          awningValance.position.set(0, eaveY - 0.48, 1.32);
          const awningBar = new THREE.Mesh(new THREE.BoxGeometry(awningW + 0.04, 0.06, 0.08), smokedOakMat);
          awningBar.position.set(0, eaveY - 0.02, 0.28);
          g.add(awningSlope, awningValance, awningBar);

          if (store.width >= 9.0) {
            const bayW = Math.max(1.6, halfW - 2.15);
            for (const side of [-1, 1]) {
              const bx = side * (halfW - 0.38 - bayW * 0.5);
              const dado = new THREE.Mesh(new THREE.BoxGeometry(bayW, 0.54, 0.52), creamTileMat);
              dado.position.set(bx, 0.27, 0.22);
              const sill = new THREE.Mesh(new THREE.BoxGeometry(bayW + 0.06, 0.06, 0.58), smokedOakMat);
              sill.position.set(bx, 0.56, 0.24);
              g.add(dado, sill);
            }
          }
        }

        // Physical 3D Alfresco Round Marble Bistro Tables + Bentwood Chairs (SKIPPED on HEYTEA, ZUS Pastry & Come True open walk-in!)
        if (store.width >= 10.5 && !isNarrowCorridor && !isHeytea && !isZusPastry && !isComeTrue) {
          const tableOffX = Math.min(halfW - 1.65, 3.6);
          for (const side of [-1, 1]) {
            const tx = side * tableOffX;
            const tz = 1.56;
            const tTop = new THREE.Mesh(bistroTopGeo, cafeMarbleMat);
            tTop.position.set(tx, 0.74, tz);
            const tPole = new THREE.Mesh(bistroPoleGeo, matteSteelMat);
            tPole.position.set(tx, 0.38, tz);
            const tBase = new THREE.Mesh(bistroBaseGeo, matteSteelMat);
            tBase.position.set(tx, 0.02, tz);
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, 0.08, 10), satinWhiteMat);
            cup.position.set(tx + side * 0.14, 0.80, tz);
            g.add(tTop, tPole, tBase, cup);
            addLocalContactShadow(g, tx, tz, 2.2, 1.45, 0.018);

            for (const cSide of [-1, 1]) {
              const cx = tx + cSide * 0.68;
              const cSeat = new THREE.Mesh(chairSeatGeo, smokedOakMat);
              cSeat.position.set(cx, 0.45, tz);
              const cBack = new THREE.Mesh(chairBackGeo, smokedOakMat);
              cBack.position.set(cx + cSide * 0.22, 0.58, tz);
              cBack.rotation.y = Math.PI / 2;
              for (const [lx, lz] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) {
                const cLeg = new THREE.Mesh(chairLegGeo, matteSteelMat);
                cLeg.position.set(cx + lx, 0.22, tz + lz);
                g.add(cLeg);
              }
              g.add(cSeat, cBack);
            }
          }
          if (!isStarbucks) {
            // Warm cream-travertine herb planter box tucked cleanly against right pilaster away from chairs!
            const pBox = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.50, 0.44), creamTileMat);
            pBox.position.set(halfW - 1.02, 0.25, 0.62);
            const pRim = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.05, 0.50), brassGoldMat);
            pRim.position.set(halfW - 1.02, 0.52, 0.62);
            g.add(pBox, pRim);
            if (!sharedIndoorFrondMat) createIndoorPalm(0.1);
            for (let h = 0; h < 6; h++) {
              const fa = (h / 6) * Math.PI * 2;
              const spray = new THREE.Mesh(herbFrondGeo, sharedIndoorFrondMat);
              spray.position.set(halfW - 1.02 + ((h % 3) - 1) * 0.24, 0.54, 0.62);
              spray.rotation.y = fa;
              spray.rotation.x = -0.35;
              g.add(spray);
            }
          }
        }
        break;
      }

      case 'luxury-fashion': {
        if (isSephora) {
          // Photo-matched 1 Utama G139C SEPHORA: HORIZONTAL alternating glossy black & pure white stripes (8 black & 8 white) on both piers + glossy white stadium floor oval inlay + central hanging vertical LED video screen!
          const pierW = Math.min(2.15, Math.max(1.25, (halfW - 2.35)));
          const bandCount = 16;
          const bandH = (eaveY - 0.04) / bandCount;
          for (const side of [-1, 1]) {
            const px = side * (halfW - pierW * 0.5);
            for (let bi = 0; bi < bandCount; bi++) {
              const band = new THREE.Mesh(
                new THREE.BoxGeometry(pierW, bandH - 0.008, 0.64),
                bi % 2 === 0 ? obsidianGlossMat : satinWhiteMat
              );
              band.position.set(px, (bi + 0.5) * bandH, 0.18);
              g.add(band);
            }
            const doorJamb = new THREE.Mesh(new THREE.BoxGeometry(0.10, eaveY - 0.04, 0.68), obsidianGlossMat);
            doorJamb.position.set(side * (halfW - pierW - 0.05), (eaveY - 0.04) * 0.5, 0.18);
            g.add(doorJamb);
          }
          const topTrim = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.12, 0.68), obsidianGlossMat);
          topTrim.position.set(0, eaveY - 0.02, 0.18);
          // Glossy white stadium oval marble inlay centered on Sephora's black marble entry floor!
          const ovalInlay = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.02, 32), satinWhiteMat);
          ovalInlay.scale.set(1.35, 1, 0.72);
          ovalInlay.position.set(0, 0.075, -0.78);
          // Iconic large hanging vertical double-sided Sephora LED beauty video screen right behind threshold (Sephora Beauty campaign, NEVER generic 1UE!)
          const ledFrame = new THREE.Mesh(new THREE.BoxGeometry(1.42, 2.38, 0.12), obsidianGlossMat);
          ledFrame.position.set(0, eaveY - 1.52, -0.78);
          const ledScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.30, 2.22), brandPosterMats.sephora);
          ledScreen.position.set(0, eaveY - 1.52, -0.71);
          const ledPoleL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), matteSteelMat);
          ledPoleL.position.set(-0.52, eaveY - 0.28, -0.78);
          const ledPoleR = ledPoleL.clone();
          ledPoleR.position.x = 0.52;
          // Warm backlit coral-peach SKINCARE (left) & crimson-rose MAKEUP (right) interior wall headers (G_G139C_Sephora.jpg!)
          const skHeader = new THREE.Mesh(
            new THREE.BoxGeometry(3.4, 0.44, 0.08),
            new THREE.MeshBasicMaterial({ map: createSignBoardTexture('SKINCARE', '', '#f59e0b', '#ffffff', '#fed7aa', 512, 96) })
          );
          skHeader.position.set(-halfW + pierW + 2.1, eaveY - 0.45, -1.65);
          const mkHeader = new THREE.Mesh(
            new THREE.BoxGeometry(3.4, 0.44, 0.08),
            new THREE.MeshBasicMaterial({ map: createSignBoardTexture('MAKEUP', '', '#be123c', '#ffffff', '#fda4af', 512, 96) })
          );
          mkHeader.position.set(halfW - pierW - 2.1, eaveY - 0.45, -1.65);
          g.add(topTrim, ovalInlay, ledFrame, ledScreen, ledPoleL, ledPoleR, skHeader, mkHeader);
        } else if (isUniqlo) {
          // Authentic Real 1 Utama UNIQLO: Bright Monolithic Architectural White Portal + Dual Physical 3D Glowing Crimson UNIQLO Cube Lightboxes!
          for (const side of [-1, 1]) {
            const pil = new THREE.Mesh(new THREE.BoxGeometry(0.46, storeH, 0.82), satinWhiteMat);
            pil.position.set(side * (halfW - 0.23), storeH * 0.5, 0.22);
            const cube = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 0.44), uniqloRedBoxMat);
            cube.position.set(side * Math.min(halfW - 1.5, 4.6), eaveY + fasciaH * 0.5, 0.62);
            g.add(pil, cube);
          }
          const crispBeam = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.14, 0.74), satinWhiteMat);
          crispBeam.position.set(0, eaveY, 0.24);
          g.add(crispBeam);
        } else {
          // Classical Luxury Boutique (Parkson Elite, Tommy Hilfiger, Bonia, Coach, Chanel, Dior, Zara):
          // Strict width clamping so ZERO neighboring brass caps/flutes ever bleed into adjacent storefronts!
          const pilMat = isChanel ? satinWhiteMat : prof.isLight ? ivoryStoneMat : obsidianGlossMat;
          const trimMat = isChanel ? obsidianGlossMat : isZara ? ivoryStoneMat : brassGoldMat;
          for (const side of [-1, 1]) {
            const px = side * (halfW - 0.28);
            const pil = new THREE.Mesh(new THREE.BoxGeometry(0.46, storeH, 0.86), pilMat);
            pil.position.set(px, storeH * 0.5, 0.24);
            if (!isChanel && !isZara) {
              // Start vertical brass flutes cleanly ABOVE basePlinth (y = 0.38..eaveY - 0.14, z = 0.72 -> ZERO plinth/flute Z-fighting!)
              const fluteH = eaveY - 0.54;
              for (const fOff of [-0.14, 0, 0.14]) {
                const flute = new THREE.Mesh(new THREE.BoxGeometry(0.048, fluteH, 0.045), brassGoldMat);
                flute.position.set(px + fOff, 0.38 + fluteH * 0.5, 0.72);
                g.add(flute);
              }
              const cap = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.94), brassGoldMat);
              cap.position.set(px, eaveY - 0.04, 0.28);
              g.add(cap);
            }
            const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.92), isChanel ? obsidianGlossMat : pilMat);
            basePlinth.position.set(px, 0.17, 0.27);
            g.add(pil, basePlinth);
          }
          const lintel = new THREE.Mesh(new THREE.BoxGeometry(store.width - 0.04, isChanel ? 0.065 : 0.10, 0.78), trimMat);
          lintel.position.set(0, eaveY, 0.24);
          const cove = new THREE.Mesh(new THREE.BoxGeometry(store.width - 0.8, 0.03, 0.07), isChanel ? sportLedBarMat : warmCoveLedMat);
          cove.position.set(0, eaveY - 0.07, 0.40);
          g.add(lintel, cove);

          // 2 Physical 3D Illuminated Showcase Display Plinths flanking wide luxury boutiques (omitted on Chanel, Zara, Coach & Diva Karaoke!)
          if (store.width >= 10.0 && !isChanel && !isZara && !isCoach && !isDiva) {
            const mMat = prof.isLight ? mannequinLinenMat : mannequinLightMat;
            for (const side of [-1, 1]) {
              const mx = side * Math.min(halfW - 1.65, 3.35);
              const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.78, 0.52), pilMat);
              plinth.position.set(mx, 0.39, 0.56);
              const plinthTrim = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.04, 0.56), brassGoldMat);
              plinthTrim.position.set(mx, 0.79, 0.56);
              const standRod = new THREE.Mesh(bistroPoleGeo, brassGoldMat);
              standRod.scale.set(0.75, 0.42, 0.75);
              standRod.position.set(mx, 0.96, 0.56);
              const bust = new THREE.Mesh(mannequinTorsoGeo, mMat);
              bust.position.set(mx, 1.06, 0.56);
              bust.rotation.y = -side * 0.28;
              g.add(plinth, plinthTrim, standRod, bust);
            }
          }
        }
        break;
      }

      case 'open-market': {
        if (isMrDiy) {
          // Photo-matched 1 Utama S319 MR. D.I.Y. (directly beside S320 Parkson Elite!):
          // Left stacked multi-tone warm-teak wood-block mosaic wall + glowing circular yellow hammer badge + MR.D.I.Y.
          // Right matte-charcoal tool-sketch chalkboard wall + glowing blue CSR screen
          // Center interior square warm-orange "Always Low prices" pillar surrounded by stacks of bright yellow shopping baskets + stainless stanchions!
          const leftWallW = Math.min(3.4, halfW - 3.6);
          const rightWallW = Math.min(3.4, halfW - 3.6);
          const leftWall = new THREE.Mesh(new THREE.BoxGeometry(leftWallW, eaveY, 0.92), lightOakMat);
          leftWall.position.set(-halfW + leftWallW * 0.5, eaveY * 0.5, 0.28);
          const hammerBadgeMat = new THREE.MeshStandardMaterial({
            map: createMrDiyHammerBadgeTexture(),
            emissive: '#fef08a',
            emissiveMap: createMrDiyHammerBadgeTexture(),
            emissiveIntensity: 0.34,
            transparent: true,
            roughness: 0.28
          });
          const hammerDisc = new THREE.Mesh(new THREE.CircleGeometry(0.82, 32), hammerBadgeMat);
          hammerDisc.position.set(-halfW + leftWallW * 0.5, 2.48, 0.78);
          const hammerRing = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.04, 10, 32), mrDiyYellowMat);
          hammerRing.position.set(-halfW + leftWallW * 0.5, 2.48, 0.77);
          const woodLogoBar = new THREE.Mesh(
            new THREE.BoxGeometry(1.75, 0.36, 0.06),
            new THREE.MeshBasicMaterial({ map: createSignBoardTexture('MR.D.I.Y.', '', '#dc2626', '#ffffff', '#facc15', 384, 96) })
          );
          woodLogoBar.position.set(-halfW + leftWallW * 0.5, 1.32, 0.78);

          const chalkMat = new THREE.MeshStandardMaterial({ map: createMrDiyChalkboardTexture(), roughness: 0.84 });
          const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(rightWallW, eaveY, 0.92),
            [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, chalkMat, obsidianGlossMat]
          );
          rightWall.position.set(halfW - rightWallW * 0.5, eaveY * 0.5, 0.28);
          // Vertical blue CSR digital info screen inset on right wall
          const csrScreen = new THREE.Mesh(
            new THREE.BoxGeometry(0.76, 1.38, 0.08),
            new THREE.MeshBasicMaterial({ map: createSignBoardTexture('MR. D.I.Y.', 'ALWAYS LOW PRICES', '#0284c7', '#ffffff', '#facc15', 256, 384) })
          );
          csrScreen.position.set(halfW - rightWallW * 0.42, 1.95, 0.76);

          // Interior square warm-orange pillar with seamless painted white "Always Low prices" + yellow PRICE LOCK standing board!
          const diyPillarMat = new THREE.MeshStandardMaterial({ map: createMrDiyPillarTexture(), roughness: 0.56 });
          const orangePillar = new THREE.Mesh(
            new THREE.BoxGeometry(1.24, eaveY, 1.24),
            [mrDiyOrangeMat, mrDiyOrangeMat, mrDiyOrangeMat, mrDiyOrangeMat, diyPillarMat, mrDiyOrangeMat]
          );
          orangePillar.position.set(0.25, eaveY * 0.5, -1.65);
          // Bright yellow PRICE LOCK standing promo display board at entrance (photo-matched to 2_S319_MR_D_I_Y_.jpg!)
          const plStand = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.48, 0.08), brandPosterMats.mrdiy_pl);
          plStand.position.set(-1.75, 0.76, 0.15);
          g.add(leftWall, hammerDisc, hammerRing, woodLogoBar, rightWall, csrScreen, orangePillar, plStand);

          // 3 Neat Stacks of Bright Yellow MR. D.I.Y. Shopping Baskets flanking the orange pillar + stainless security gates!
          for (const [bx, bz] of [[-1.15, -1.45], [-0.55, -1.45], [1.65, -1.45]]) {
            for (let b = 0; b < 5; b++) {
              const bsk = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.34), mrDiyYellowMat);
              bsk.position.set(bx, 0.12 + b * 0.13, bz);
              const rim = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.025, 0.36), obsidianGlossMat);
              rim.position.set(bx, 0.19 + b * 0.13, bz);
              g.add(bsk, rim);
            }
          }
          for (const gx of [-2.4, 2.4]) {
            const gate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.48, 0.42), brushedAlumMat);
            gate.position.set(gx, 0.74, 0.25);
            g.add(gate);
          }
        } else if (isJayaGrocer) {
          // Photo-matched 1 Utama LG309 JAYA GROCER: 3D multi-tone brown wood-block mosaic piers + thick bright-red inward-wrapping portal architrave + burgundy entrance carpet runner + slatted wood ceiling w/ hanging vines!
          const portalHalf = Math.min(halfW - 1.4, 5.4);
          for (const side of [-1, 1]) {
            const outerPier = new THREE.Mesh(new THREE.BoxGeometry(1.18, storeH, 0.92), jayaTerracottaMat);
            outerPier.position.set(side * (halfW - 0.59), storeH * 0.5, 0.24);
            const innerPier = new THREE.Mesh(new THREE.BoxGeometry(1.12, storeH, 0.96), jayaTerracottaMat);
            innerPier.position.set(side * (portalHalf + 0.62), storeH * 0.5, 0.28);
            const redJamb = new THREE.Mesh(new THREE.BoxGeometry(0.42, eaveY, 1.18), jayaRedPortalMat);
            redJamb.position.set(side * portalHalf, eaveY * 0.5, 0.28);
            g.add(outerPier, innerPier, redJamb);
          }
          const redHeader = new THREE.Mesh(new THREE.BoxGeometry(portalHalf * 2 + 0.44, 0.44, 1.18), jayaRedPortalMat);
          redHeader.position.set(0, eaveY - 0.08, 0.28);
          // Full-width burgundy welcome runner mat outside threshold!
          const matBorder = new THREE.Mesh(new THREE.BoxGeometry(portalHalf * 1.75, 0.018, 1.88), matteSteelMat);
          matBorder.position.set(0, 0.012, 0.68);
          const redMat = new THREE.Mesh(new THREE.BoxGeometry(portalHalf * 1.66, 0.024, 1.62), new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.94, metalness: 0.0 }));
          redMat.position.set(0, 0.016, 0.68);
          g.add(redHeader, matBorder, redMat);
          for (let sl = -6; sl <= 7; sl++) {
            const ribX = (sl - 0.5) * (innerW / 14);
            const rib = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, intD), lightOakMat);
            rib.position.set(ribX, eaveY - 0.22, -intD * 0.5 + 0.14);
            g.add(rib);
          }
          // Photo-matched Jaya Grocer full-width flanking supermarket perimeter glazing, bright ceiling & glowing checkout lanes!
          const flankW = halfW - portalHalf - 2.35;
          if (flankW > 1.2) {
            for (const side of [-1, 1]) {
              const fx = side * (portalHalf + 1.18 + flankW * 0.5);
              const fGlass = new THREE.Mesh(new THREE.PlaneGeometry(flankW, eaveY - 0.22), intGlassPhysMat);
              fGlass.position.set(fx, eaveY * 0.5, 0.24);
              const fCurb = new THREE.Mesh(new THREE.BoxGeometry(flankW, 0.28, 0.26), satinWhiteMat);
              fCurb.position.set(fx, 0.14, 0.24);
              const chkCounter = new THREE.Mesh(new THREE.BoxGeometry(Math.min(flankW - 0.8, 3.2), 0.94, 0.72), satinWhiteMat);
              chkCounter.position.set(fx, 0.47, -1.35);
              const chkSign = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.36, 0.08), new THREE.MeshBasicMaterial({ map: createSignBoardTexture('CHECKOUT', 'EXPRESS LANE', '#dc2626', '#ffffff', '#facc15', 256, 96) }));
              chkSign.position.set(fx, 2.35, -1.35);
              g.add(fGlass, fCurb, chkCounter, chkSign);
            }
          }
        } else if (isAeon) {
          // Photo-matched AEON (LG/G/1F/2F Old Wing): Bright white & Statuario marble outer piers + warm honey-oak portal arch + white egg-crate ceiling louver band + open glassless silver EAS security gates!
          const oakPortalHalf = Math.min(halfW - 1.5, 6.2);
          for (const side of [-1, 1]) {
            const marblePier = new THREE.Mesh(new THREE.BoxGeometry(1.45, storeH, 0.96), satinWhiteMat);
            marblePier.position.set(side * (halfW - 0.72), storeH * 0.5, 0.26);
            const oakJamb = new THREE.Mesh(new THREE.BoxGeometry(0.46, eaveY, 1.04), lightOakMat);
            oakJamb.position.set(side * oakPortalHalf, eaveY * 0.5, 0.28);
            g.add(marblePier, oakJamb);
          }
          const oakArchBeam = new THREE.Mesh(new THREE.BoxGeometry(oakPortalHalf * 2 + 0.48, 0.42, 1.06), lightOakMat);
          oakArchBeam.position.set(0, eaveY - 0.10, 0.28);
          // Crisp white egg-crate ceiling louver band inside portal!
          const louverBar = new THREE.Mesh(new THREE.BoxGeometry(oakPortalHalf * 1.92, 0.10, 1.85), satinWhiteMat);
          louverBar.position.set(0, eaveY - 0.24, -0.82);
          g.add(oakArchBeam, louverBar);
          for (let ex = -2; ex <= 2; ex++) {
            const eas = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.54, 0.42), brushedAlumMat);
            eas.position.set(ex * 2.15, 0.77, 0.26);
            g.add(eas);
          }
        } else if (isMiniso) {
          // Photo-matched 1 Utama LG308C MINISO: Coral-pink portal w/ 3 CONTINUOUS PARALLEL WHITE LED STRIPS running up both jambs & header soffit + projecting RED square smiling-bag pier blade sign + LAVENDER blind-box threshold island + striped lavender/white column!
          for (const side of [-1, 1]) {
            const pinkPier = new THREE.Mesh(new THREE.BoxGeometry(0.92, storeH, 0.96), minisoPinkMat);
            pinkPier.position.set(side * (halfW - 0.46), storeH * 0.5, 0.26);
            g.add(pinkPier);
            // 3 continuous parallel crisp white LED strips along the inner face of both pink jambs!
            for (let ls = 0; ls < 3; ls++) {
              const ledJamb = new THREE.Mesh(new THREE.BoxGeometry(0.036, eaveY - 0.16, 0.04), whiteStripLedMat);
              ledJamb.position.set(side * (halfW - 0.94), eaveY * 0.5, 0.16 + ls * 0.22);
              g.add(ledJamb);
            }
          }
          const pinkBeam = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.30, 0.96), minisoPinkMat);
          pinkBeam.position.set(0, eaveY - 0.04, 0.28);
          g.add(pinkBeam);
          for (let ls = 0; ls < 3; ls++) {
            const ledTop = new THREE.Mesh(new THREE.BoxGeometry(store.width - 1.88, 0.036, 0.04), whiteStripLedMat);
            ledTop.position.set(0, eaveY - 0.20, 0.16 + ls * 0.22);
            g.add(ledTop);
          }
          // Projecting iconic red square MINISO smiling-bag pier blade sign on left pier!
          const redBagSign = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.78, 0.78), jayaRedPortalMat);
          redBagSign.position.set(-halfW + 0.42, 2.75, 1.05);
          const bagHandle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16, Math.PI), jayaRedPortalMat);
          bagHandle.rotation.y = Math.PI / 2;
          bagHandle.position.set(-halfW + 0.42, 3.14, 1.05);
          g.add(redBagSign, bagHandle);

          // Lavender-purple "MINISO / HANG OUT WITH MINISO" blind-box island right at entrance threshold!
          const lavIsland = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.92, 1.10), minisoLavenderMat);
          lavIsland.position.set(-0.35, 0.46, -0.58);
          const lavTop = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.06, 1.16), satinWhiteMat);
          lavTop.position.set(-0.35, 0.94, -0.58);
          const lavPlaque = new THREE.Mesh(
            new THREE.PlaneGeometry(2.15, 0.54),
            new THREE.MeshBasicMaterial({ map: createSignBoardTexture('HANG OUT WITH MINISO', 'BLIND BOXES • PLUSHIES', '#7c3aed', '#ffffff', '#f472b6', 512, 128) })
          );
          lavPlaque.position.set(-0.35, 0.50, -0.02);
          g.add(lavIsland, lavTop, lavPlaque);
          for (let pl = -1; pl <= 1; pl++) {
            addKawaiiPlushie(g, -0.35 + pl * 0.62, 0.98, -0.58, pl === 0 ? minisoPinkMat : minisoLavenderMat, 1.15, 0.1);
          }

          // Hot-pink circular ceiling ticker ring + lavender/white vertically striped interior column!
          const pZ = -2.15;
          const hotRing = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.09, 10, 44), minisoPinkLedMat);
          hotRing.rotation.x = Math.PI / 2;
          hotRing.position.set(1.65, eaveY - 0.52, pZ);
          const colBody = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, eaveY - 0.24, 24), satinWhiteMat);
          colBody.position.set(1.65, eaveY * 0.5, pZ);
          g.add(hotRing, colBody);
          for (let fl = 0; fl < 12; fl++) {
            const fa = (fl / 12) * Math.PI * 2;
            const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, eaveY - 0.30, 6), minisoLavenderMat);
            stripe.position.set(1.65 + Math.cos(fa) * 0.455, eaveY * 0.5, pZ + Math.sin(fa) * 0.455);
            g.add(stripe);
          }
        } else {
          // Bright Satin-White Sculpted Market Portal + Emerald Cornice
          for (const side of [-1, 1]) {
            const pil = new THREE.Mesh(new THREE.BoxGeometry(0.52, storeH, 0.86), satinWhiteMat);
            pil.position.set(side * (halfW - 0.26), storeH * 0.5, 0.24);
            const emBand = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.26, 0.90), emeraldTrimMat);
            emBand.position.set(side * (halfW - 0.26), eaveY, 0.26);
            g.add(pil, emBand);
          }
          const marketCornice = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.18, 0.88), satinWhiteMat);
          marketCornice.position.set(0, eaveY, 0.28);
          const emeraldLip = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.08, 0.92), emeraldTrimMat);
          emeraldLip.position.set(0, eaveY + 0.10, 0.30);
          g.add(marketCornice, emeraldLip);
        }

        // Tiered rustic wooden fresh-produce displays tucked neatly INSIDE bright Jaya Grocer & supermarket entrances (ZERO walkway jutting!)
        if (!isMiniso && (isJayaGrocer || store.width >= 12.0)) {
          const crateCount = isJayaGrocer ? 3 : 2;
          for (const side of [-1, 1]) {
            for (let c = 0; c < crateCount; c++) {
              const cx = side * (2.6 + c * 1.72);
              if (Math.abs(cx) > halfW - 1.55) continue;
              const cz = isJayaGrocer ? -1.35 : 0.65;
              const crate = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.82, 0.92), lightOakMat);
              crate.position.set(cx, 0.41, cz);
              const slatTrim = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.07, 0.96), crateWoodMat);
              slatTrim.position.set(cx, 0.80, cz);
              g.add(crate, slatTrim);
              const pMat = produceMats[(c + (side > 0 ? 2 : 0)) % produceMats.length];
              for (let f = 0; f < 5; f++) {
                const mound = new THREE.Mesh(produceMoundGeo, pMat);
                mound.scale.set(1.12, 0.76, 1.02);
                mound.position.set(cx + (f - 2) * 0.25, 0.88, cz + (f % 2) * 0.14 - 0.07);
                g.add(mound);
              }
            }
          }
        }
        break;
      }

      case 'japanese-machiya': {
        // Authentic Japanese Machiya Facade: Bold 18° Pitched Light-Ash Oak Canopy (Ippudo) or Slate Hisashi Eave + Hinoki Slatted Columns + Split Noren + Unobstructed Rod-Suspended Chochin Lanterns!
        const eaveRoof = new THREE.Mesh(
          new THREE.BoxGeometry(store.width, isIppudo ? 0.20 : 0.14, isIppudo ? 1.66 : 1.42),
          isIppudo ? lightOakMat : slateRoofMat
        );
        eaveRoof.position.set(0, eaveY - 0.08, isIppudo ? 0.90 : 0.78);
        eaveRoof.rotation.x = isIppudo ? 0.31 : 0.22;
        const timberFrieze = new THREE.Mesh(
          new THREE.BoxGeometry(store.width, 0.18, 0.22),
          isIppudo ? matteSteelMat : hinokiWoodMat
        );
        timberFrieze.position.set(0, eaveY - (isIppudo ? 0.30 : 0.20), isIppudo ? 1.62 : 1.36);
        g.add(eaveRoof, timberFrieze);

        const bracketCount = Math.max(5, Math.floor(store.width / 2.2));
        for (let b = 0; b <= bracketCount; b++) {
          const bx = -halfW + 0.45 + (b / bracketCount) * (store.width - 0.9);
          const brk = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 1.32), isIppudo ? lightOakMat : hinokiWoodMat);
          brk.position.set(bx, eaveY - (isIppudo ? 0.28 : 0.22), 0.78);
          brk.rotation.x = isIppudo ? 0.30 : 0.20;
          g.add(brk);
        }
        for (const side of [-1, 1]) {
          for (let s = 0; s < 4; s++) {
            const sx = side * (halfW - 0.18 - s * 0.26);
            const slat = new THREE.Mesh(new THREE.BoxGeometry(0.10, eaveY, 0.62), isIppudo ? lightOakMat : hinokiWoodMat);
            slat.position.set(sx, eaveY * 0.5, 0.28);
            g.add(slat);
          }
          const basaltBase = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.34, 0.74), slateRoofMat);
          basaltBase.position.set(side * (halfW - 0.58), 0.17, 0.28);
          g.add(basaltBase);
        }

        // Physical 3D hanging split Noren fabric curtains + rod-suspended oval Chochin lanterns centered strictly clear of window mullions & door jambs!
        const norenCount = Math.min(3, Math.max(2, Math.floor((store.width - 3.0) / 2.8)));
        for (let n = -norenCount; n <= norenCount; n++) {
          const noren = new THREE.Mesh(
            new THREE.BoxGeometry(1.06, 0.84, 0.03),
            Math.abs(n) % 2 === 0 ? norenCrimsonMat : norenCreamMat
          );
          noren.position.set(n * 1.24, eaveY - 0.66, 0.70);
          g.add(noren);
        }
        const lanternXs = isIppudo
          ? [-Math.min(halfW - 1.85, 3.65), -1.32, 0, 1.32, Math.min(halfW - 1.85, 3.65)]
          : [-Math.min(halfW - 1.75, 2.2), 0, Math.min(halfW - 1.75, 2.2)];
        lanternXs.forEach((lx, idx) => {
          const lz = isIppudo ? 1.28 : 1.12;
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.42, 6), matteSteelMat);
          rod.position.set(lx, eaveY - 0.34, lz);
          const lantern = new THREE.Mesh(
            lanternBodyGeo,
            idx % 2 === 0 ? lanternGlowWarmMat : lanternGlowRedMat
          );
          lantern.scale.set(0.78, 1.32, 0.78);
          lantern.position.set(lx, eaveY - 0.82, lz);
          const capT = new THREE.Mesh(lanternCapGeo, matteSteelMat);
          capT.position.set(lx, eaveY - 0.53, lz);
          const capB = new THREE.Mesh(lanternCapGeo, matteSteelMat);
          capB.position.set(lx, eaveY - 1.11, lz);
          g.add(rod, lantern, capT, capB);
        });
        if (isIppudo && intD > 2.0) {
          for (const side of [-1, 1]) {
            for (const dz of [-1.25, -2.55]) {
              const tx = side * Math.min(halfW - 1.9, 3.3);
              const rTable = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 0.85), lightOakMat);
              rTable.position.set(tx, 0.74, dz);
              const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.52), matteSteelMat);
              rLeg.position.set(tx, 0.36, dz);
              g.add(rTable, rLeg);
              for (const cz of [-0.62, 0.62]) {
                const stool = new THREE.Mesh(chairSeatGeo, lightOakMat);
                stool.position.set(tx, 0.46, dz + cz);
                const sLeg = new THREE.Mesh(bistroPoleGeo, matteSteelMat);
                sLeg.scale.set(0.8, 0.65, 0.8);
                sLeg.position.set(tx, 0.23, dz + cz);
                g.add(stool, sLeg);
              }
            }
          }
        }
        break;
      }

      case 'korean-hanok': {
        // Authentic Contemporary Korean Hanok Facade (MODU Samgyetang LG602): TRUE VERTICAL HONEY-OAK GRAIN + Fine 3D Changhoji Vertical & Horizontal Lattice Muntins over Warm Backlit Hanji Rice-Paper Panels!
        const hanokEave = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.22, 1.04), lightOakMat);
        hanokEave.position.set(0, eaveY - 0.04, 0.38);
        const warmCove = new THREE.Mesh(new THREE.BoxGeometry(store.width - 0.6, 0.04, 0.08), warmCoveLedMat);
        warmCove.position.set(0, eaveY - 0.17, 0.78);
        g.add(hanokEave, warmCove);

        for (const side of [-1, 1]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.60, storeH, 0.96), vertOakMat);
          post.position.set(side * (halfW - 0.28), storeH * 0.5, 0.30);
          g.add(post);

          // Widen sidelight flush right to door leaf stile (halfW - 1.82 -> ZERO vertical white light-leak gap!)
          const sidelightW = Math.max(1.2, halfW - 1.82);
          const sideCenterX = side * (halfW - 0.52 - sidelightW * 0.5);
          const panelH = eaveY - 0.96;
          const ricePaper = new THREE.Mesh(new THREE.BoxGeometry(sidelightW, panelH, 0.07), frostedPanelMat);
          ricePaper.position.set(sideCenterX, 0.86 + panelH * 0.5, 0.22);
          const wainscot = new THREE.Mesh(new THREE.BoxGeometry(sidelightW, 0.86, 0.34), vertOakMat);
          wainscot.position.set(sideCenterX, 0.43, 0.26);
          g.add(ricePaper, wainscot);
          // Fine intersecting 3D Changhoji vertical & horizontal lattice grid muntins!
          const slatN = Math.max(5, Math.floor(sidelightW / 0.24));
          for (let s = 0; s <= slatN; s++) {
            const sx = sideCenterX - sidelightW * 0.5 + (s / slatN) * sidelightW;
            const slat = new THREE.Mesh(new THREE.BoxGeometry(0.042, panelH + 0.08, 0.14), vertOakMat);
            slat.position.set(sx, 0.86 + panelH * 0.5, 0.27);
            g.add(slat);
          }
          for (let hr = 0; hr <= 5; hr++) {
            const hy = 0.88 + (hr / 5) * panelH;
            const hBar = new THREE.Mesh(new THREE.BoxGeometry(sidelightW, 0.038, 0.13), lightOakMat);
            hBar.position.set(sideCenterX, hy, 0.27);
            g.add(hBar);
          }
          // Traditional Changhoji lattice door leaf with vertical oak frame + translucent hanji insert + brushed-bronze pull handle!
          const doorLeafX = side * 1.48;
          const leafInset = new THREE.Mesh(new THREE.BoxGeometry(0.76, eaveY - 0.34, 0.07), frostedPanelMat);
          leafInset.position.set(doorLeafX, (eaveY - 0.18) * 0.5, 0.35);
          for (const fdx of [-0.39, 0.39]) {
            const stile = new THREE.Mesh(new THREE.BoxGeometry(0.08, eaveY - 0.18, 0.12), vertOakMat);
            stile.position.set(doorLeafX + fdx, (eaveY - 0.18) * 0.5, 0.36);
            g.add(stile);
          }
          for (let dr = 0; dr <= 4; dr++) {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.055, 0.12), lightOakMat);
            rail.position.set(doorLeafX, 0.14 + (dr / 4) * (eaveY - 0.38), 0.36);
            g.add(rail);
          }
          const bronzePull = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.78, 8), brassGoldMat);
          bronzePull.position.set(doorLeafX - side * 0.28, 1.18, 0.46);
          g.add(leafInset, bronzePull);
        }
        // Serene Korean Samgyetang honey-oak dining tables, wooden chairs & steaming black ceramic ttukbaegi pots positioned right in the central doorway sightline (a0/a1/a2)!
        if (intD > 1.8) {
          const moduTables = [
            { tx: -0.92, tz: -1.52 },
            { tx: 0.92, tz: -1.52 },
            { tx: 0.0, tz: -2.62 }
          ];
          for (const mt of moduTables) {
            const hTable = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.07, 0.84), lightOakMat);
            hTable.position.set(mt.tx, 0.74, mt.tz);
            const hBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.52), smokedOakMat);
            hBase.position.set(mt.tx, 0.36, mt.tz);
            const ttuk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.095, 12), obsidianGlossMat);
            ttuk1.position.set(mt.tx - 0.28, 0.82, mt.tz);
            const ttuk2 = ttuk1.clone();
            ttuk2.position.x = mt.tx + 0.28;
            g.add(hTable, hBase, ttuk1, ttuk2);
            addLocalContactShadow(g, mt.tx, mt.tz, 1.75, 1.35);
            for (const cz of [-0.62, 0.62]) {
              const chSeat = new THREE.Mesh(chairSeatGeo, lightOakMat);
              chSeat.position.set(mt.tx, 0.46, mt.tz + cz);
              const chBack = new THREE.Mesh(chairBackGeo, lightOakMat);
              chBack.position.set(mt.tx, 0.60, mt.tz + cz + Math.sign(cz) * 0.16);
              const chLeg = new THREE.Mesh(bistroPoleGeo, smokedOakMat);
              chLeg.scale.set(0.75, 0.64, 0.75);
              chLeg.position.set(mt.tx, 0.23, mt.tz + cz);
              g.add(chSeat, chBack, chLeg);
            }
          }
          // Warm amber hanji glow accent light spilling gently across MODU's honey-oak floor!
          const moduWarm = new THREE.PointLight('#ffcf86', 5.2, 7.5, 1.8);
          moduWarm.position.set(0, 2.35, -1.45);
          g.add(moduWarm);
        }
        break;
      }

      case 'modern-bistro': {
        // Smoked-oak vertical timber louver screens + industrial black-steel canopy + hanging warm pendants + PRINTED branded menu lectern!
        const steelCanopy = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.20, 0.96), matteSteelMat);
        steelCanopy.position.set(0, eaveY, 0.36);
        const warmStrip = new THREE.Mesh(new THREE.BoxGeometry(store.width - 0.6, 0.032, 0.08), warmCoveLedMat);
        warmStrip.position.set(0, eaveY - 0.12, 0.56);
        g.add(steelCanopy, warmStrip);

        for (const side of [-1, 1]) {
          for (let lv = 0; lv < 5; lv++) {
            const lx = side * (halfW - 0.18 - lv * 0.24);
            const slat = new THREE.Mesh(new THREE.BoxGeometry(0.08, eaveY, 0.66), smokedOakMat);
            slat.position.set(lx, eaveY * 0.5, 0.26);
            g.add(slat);
          }
        }
        const pendSpan = Math.min(2, Math.max(1, Math.floor((store.width - 4.0) / 5.0)));
        for (let p = -pendSpan; p <= pendSpan; p++) {
          const px = p * 2.45;
          const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.54, 6), matteSteelMat);
          cord.position.set(px, eaveY - 0.34, 0.72);
          const shade = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.17, 10), matteSteelMat);
          shade.position.set(px, eaveY - 0.60, 0.72);
          const bulb = new THREE.Mesh(sconceGlobeGeo, lanternGlowWarmMat);
          bulb.scale.setScalar(0.75);
          bulb.position.set(px, eaveY - 0.68, 0.72);
          g.add(cord, shade, bulb);
        }
        // Physical 3D grounded menu lectern stand with crisp PRINTED restaurant menu card (ZERO blank gray slate!)
        if (store.width >= 8.0) {
          const lx = Math.min(halfW - 1.3, 2.45);
          const lFoot = new THREE.Mesh(bistroBaseGeo, matteSteelMat);
          lFoot.position.set(lx, 0.025, 0.96);
          const lPost = new THREE.Mesh(bistroPoleGeo, matteSteelMat);
          lPost.scale.set(1.1, 1.55, 1.1);
          lPost.position.set(lx, 0.58, 0.96);
          const lBoard = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.06), smokedOakMat);
          lBoard.position.set(lx, 1.20, 0.98);
          lBoard.rotation.x = -0.45;
          const menuMat = new THREE.MeshBasicMaterial({ map: createMenuStandTexture(store) });
          const lPage = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.40), menuMat);
          lPage.position.set(lx, 1.22, 1.022);
          lPage.rotation.x = -0.45;
          g.add(lFoot, lPost, lBoard, lPage);
        }
        break;
      }

      case 'sports-industrial': {
        for (const side of [-1, 1]) {
          const px = side * (halfW - 0.27);
          const concPil = new THREE.Mesh(new THREE.BoxGeometry(0.54, storeH, 0.92), rawConcreteMat);
          concPil.position.set(px, storeH * 0.5, 0.28);
          g.add(concPil);
          if (!isPuma && !isUnderArmour) {
            const steelChannel = new THREE.Mesh(new THREE.BoxGeometry(0.12, eaveY - 0.16, 0.14), matteSteelMat);
            steelChannel.position.set(px - side * 0.16, eaveY * 0.5, 0.72);
            const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.055, eaveY - 0.32, 0.08), sportLedBarMat);
            ledBar.position.set(px - side * 0.16, eaveY * 0.5, 0.78);
            g.add(steelChannel, ledBar);
          }
        }
        const visor = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.18, 1.02), matteSteelMat);
        visor.position.set(0, eaveY, 0.38);
        const kick = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.14, 0.66), matteSteelMat);
        kick.position.set(0, 0.07, 0.18);
        g.add(visor, kick);
        break;
      }

      case 'entertainment-marquee': {
        // 3D Cantilevered Glowing Marquee Canopy + Brand-Specific Illuminated Poster Frames (ZERO duplicate "1 UTAMA DIRECTORY" posters!)
        const marquee = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.30, 1.24), matteSteelMat);
        marquee.position.set(0, eaveY - 0.04, 0.52);
        const marqueeLed = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.055, 0.08), coolCoveLedMat);
        marqueeLed.position.set(0, eaveY - 0.15, 1.15);
        g.add(marquee, marqueeLed);

        const posterMatBrand = brandPosterMats[
          isRollerwa ? 'rollerwa' : isGameOn ? 'gameon' : isNextGen ? 'nextgen' : isPjpac ? 'pjpac' : 'default'
        ];
        for (const side of [-1, 1]) {
          const px = side * (halfW - 0.25);
          const pil = new THREE.Mesh(new THREE.BoxGeometry(0.50, storeH, 0.88), matteSteelMat);
          pil.position.set(px, storeH * 0.5, 0.26);
          g.add(pil);
          if (store.width >= 9.0 && !isGameOn && !isPjpac && !isNextGen && !isPopMart && !isTopToy) {
            const pFrame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.72, 0.14), matteSteelMat);
            pFrame.position.set(side * (halfW - 1.18), 1.95, 0.54);
            const pGlow = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.54, 0.16), posterMatBrand);
            pGlow.position.set(side * (halfW - 1.18), 1.95, 0.55);
            g.add(pFrame, pGlow);
          }
        }
        break;
      }

      default: {
        // 'minimalist-tech' (Machines, Dyson, Muji, Nitori, Cellini, XZQT):
        // Ultra-sleek monolithic brushed-aluminum or matte-graphite recessed portal with razor-clean frameless glass!
        const techMat = prof.isLight ? brushedAlumMat : matteSteelMat;
        for (const side of [-1, 1]) {
          const pil = new THREE.Mesh(new THREE.BoxGeometry(0.32, storeH, 0.78), techMat);
          pil.position.set(side * (halfW - 0.15), storeH * 0.5, 0.20);
          g.add(pil);
        }
        const reveal = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.09, 0.74), techMat);
        reveal.position.set(0, eaveY, 0.20);
        g.add(reveal);
        break;
      }
    }

    // 3B. PHOTO-VERIFIED 1 UTAMA BESPOKE 3D STOREFRONT SIGNATURE ARCHITECTURAL DETAILS!
    if (isPopMart) {
      // Photo-matched 1 Utama S333 POP MART: Luminous lime-yellow backlit surround piers & header + glowing yellow-ribbed central blind-box island + giant red-haired crown mascot centered at back!
      for (const side of [-1, 1]) {
        const limePier = new THREE.Mesh(new THREE.BoxGeometry(0.92, storeH, 0.96), popMartLimeMat);
        limePier.position.set(side * (halfW - 0.46), storeH * 0.5, 0.28);
        g.add(limePier);
      }
      const limeHeader = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.28, 0.96), popMartLimeMat);
      limeHeader.position.set(0, eaveY - 0.05, 0.28);
      // Glowing yellow-ribbed central blind-box island right inside entrance (vertical glowing gold bars + black stanchions w/ red rope!)
      const pmIsland = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.92, 1.05), obsidianGlossMat);
      pmIsland.position.set(0, 0.46, -1.15);
      for (let rb = -7; rb <= 7; rb++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.78, 0.05), warmCoveLedMat);
        bar.position.set(rb * 0.20, 0.46, -0.61);
        g.add(bar);
      }
      const pmTop = new THREE.Mesh(new THREE.BoxGeometry(3.28, 0.06, 1.12), satinWhiteMat);
      pmTop.position.set(0, 0.94, -1.15);
      for (let b = -3; b <= 3; b++) {
        const box = new THREE.Mesh(shoeBoxGeo, rainbowBandMats[(b + 7) % rainbowBandMats.length]);
        box.scale.set(0.75, 1.35, 0.85);
        box.position.set(b * 0.42, 1.10, -1.15);
        g.add(box);
      }
      for (const sx of [-2.8, -0.95, 0.95, 2.8]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.86, 8), obsidianGlossMat);
        post.position.set(sx, 0.43, 0.18);
        g.add(post);
      }
      const pmBelt = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.045, 0.02), jayaRedPortalMat);
      pmBelt.position.set(0, 0.76, 0.18);
      g.add(pmBelt);
      // Sculpted giant red-haired POP MART crown mascot centered on rear pedestal!
      const mascotPed = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.55, 20), obsidianGlossMat);
      mascotPed.position.set(0, 0.28, -2.55);
      const mascotBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.85, 16), popMartLimeMat);
      mascotBody.position.set(0, 0.98, -2.55);
      const mascotHead = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), new THREE.MeshStandardMaterial({ color: '#f5d0b5', roughness: 0.45 }));
      mascotHead.position.set(0, 1.66, -2.55);
      const mascotHair = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), jayaRedPortalMat);
      mascotHair.position.set(0, 1.72, -2.55);
      const mascotCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.22, 6), mrDiyYellowMat);
      mascotCrown.position.set(0, 2.22, -2.55);
      g.add(limeHeader, pmIsland, pmTop, mascotPed, mascotBody, mascotHead, mascotHair, mascotCrown);
    } else if (isTopToy) {
      // Photo-matched 1 Utama S330 TOP TOY: Grey outer piers lined inside by vertical glowing cyan & magenta neon tubes + electric-cyan left blind-box island + dark navy TOP TOY right counter!
      for (const side of [-1, 1]) {
        const gPier = new THREE.Mesh(new THREE.BoxGeometry(0.84, storeH, 0.94), rawConcreteMat);
        gPier.position.set(side * (halfW - 0.42), storeH * 0.5, 0.28);
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, eaveY - 0.18, 10), side < 0 ? topToyCyanLedMat : topToyMagentaLedMat);
        tube.position.set(side * (halfW - 0.88), eaveY * 0.5, 0.52);
        g.add(gPier, tube);
      }
      // Glowing electric-cyan left blind-box island + dark navy TOP TOY right counter
      const cyanIsl = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.96, 1.05), owalaSkyMat);
      cyanIsl.position.set(-2.0, 0.48, -1.35);
      const cyanTrim = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.06, 1.12), topToyCyanLedMat);
      cyanTrim.position.set(-2.0, 0.98, -1.35);
      const navyCntr = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.98, 0.92), navyPanelMat);
      navyCntr.position.set(2.1, 0.49, -1.35);
      const navyLogo = new THREE.Mesh(
        new THREE.PlaneGeometry(1.85, 0.42),
        new THREE.MeshBasicMaterial({ map: createSignBoardTexture('TOP TOY', '', '#10183a', '#ffffff', '#38bdf8', 512, 128) })
      );
      navyLogo.position.set(2.1, 0.50, -0.88);
      const navyTop = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.06, 0.98), satinWhiteMat);
      navyTop.position.set(2.1, 1.00, -1.35);
      // Right outer concrete wall crisp illuminated white TOP TOY lightbox poster (2_S330_TOP_TOY.jpg!)
      const ttLightbox = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.26, 0.10), brandPosterMats.toptoy);
      ttLightbox.position.set(halfW - 0.42, 1.92, 0.78);
      for (let t = -2; t <= 2; t++) {
        const fig = new THREE.Mesh(shoeBoxGeo, rainbowBandMats[(t + 8) % rainbowBandMats.length]);
        fig.scale.set(0.65, 1.25, 0.75);
        fig.position.set(-2.0 + t * 0.38, 1.12, -1.35);
        g.add(fig);
        const fig2 = new THREE.Mesh(shoeBoxGeo, rainbowBandMats[(t + 11) % rainbowBandMats.length]);
        fig2.scale.set(0.65, 1.15, 0.75);
        fig2.position.set(2.1 + t * 0.42, 1.14, -1.35);
        g.add(fig2);
      }
      g.add(cyanIsl, cyanTrim, navyCntr, navyLogo, navyTop, ttLightbox);
    } else if (isZusPastry) {
      // Photo-matched 1 Utama G601A COFFEE MEETS PASTRY BY ZUS: Smooth warm cream curved plaster arch portal + left column w/ circular royal-blue "coffee BY ZUS" medallion & clear acrylic vitrine packed with blue ZUS cups & croissants + giant 1.4m croissant floor sculpture!
      for (const side of [-1, 1]) {
        const cPier = new THREE.Mesh(new THREE.BoxGeometry(1.18, storeH, 0.98), zusCreamPlasterMat);
        cPier.position.set(side * (halfW - 0.59), storeH * 0.5, 0.28);
        g.add(cPier);
      }
      const cHeader = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.42, 0.98), zusCreamPlasterMat);
      cHeader.position.set(0, eaveY - 0.10, 0.28);
      // Curved inner arch fillet corners in warm cream plaster
      for (const side of [-1, 1]) {
        const fillet = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.94, 16, 1, false, 0, Math.PI * 0.5), zusCreamPlasterMat);
        fillet.rotation.x = Math.PI / 2;
        fillet.rotation.z = side < 0 ? Math.PI : Math.PI * 0.5;
        fillet.position.set(side * (halfW - 1.18), eaveY - 0.30, 0.28);
        g.add(fillet);
      }
      // Circular backlit royal-blue "coffee BY ZUS" medallion + built-in clear acrylic cup & croissant display vitrine on left column!
      const zusMedMat = new THREE.MeshStandardMaterial({
        map: createZusPastryMedallionTexture(),
        emissive: '#60a5fa',
        emissiveMap: createZusPastryMedallionTexture(),
        emissiveIntensity: 0.38,
        transparent: true,
        roughness: 0.25
      });
      const zusMed = new THREE.Mesh(new THREE.CircleGeometry(0.46, 28), zusMedMat);
      zusMed.position.set(-halfW + 0.59, 2.72, 0.80);
      const vitBox = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.38, 0.26), intGlassPhysMat);
      vitBox.position.set(-halfW + 0.59, 1.35, 0.86);
      for (let r = 0; r < 3; r++) {
        for (let c = -1; c <= 1; c++) {
          const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.16, 10), (r + c) % 2 === 0 ? zusRoyalBlueMat : croissantGoldMat);
          cup.position.set(-halfW + 0.59 + c * 0.22, 0.92 + r * 0.38, 0.86);
          g.add(cup);
        }
      }
      // Curved cream bar inside + GIANT 1.4m sculpted golden croissant floor sculpture in front!
      const zBar = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 1.02, 24, 1, false, -Math.PI * 0.45, Math.PI * 0.90), zusCreamPlasterMat);
      zBar.position.set(0.55, 0.51, -1.65);
      const zBarTop = new THREE.Mesh(new THREE.CylinderGeometry(1.50, 1.50, 0.06, 24, 1, false, -Math.PI * 0.45, Math.PI * 0.90), cafeMarbleMat);
      zBarTop.position.set(0.55, 1.04, -1.65);
      // Sculpted multi-segmented flaky golden Giant Croissant sculpture (5 overlapping layered crescent pastry ribs!)
      const giantCroissant = new THREE.Group();
      giantCroissant.position.set(-1.65, 0.38, 0.78);
      giantCroissant.rotation.y = 0.42;
      const crPed = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.82, 0.14, 24), zusCreamPlasterMat);
      crPed.position.y = -0.31;
      giantCroissant.add(crPed);
      const crRibSpecs = [
        { a: -0.95, r: 0.16, l: 0.24, y: -0.10 },
        { a: -0.48, r: 0.23, l: 0.34, y: 0.02 },
        { a: 0.0,   r: 0.28, l: 0.40, y: 0.08 },
        { a: 0.48,  r: 0.23, l: 0.34, y: 0.02 },
        { a: 0.95,  r: 0.16, l: 0.24, y: -0.10 }
      ];
      for (const s of crRibSpecs) {
        const rib = new THREE.Mesh(new THREE.CapsuleGeometry(s.r, s.l, 10, 16), croissantGoldMat);
        rib.position.set(Math.sin(s.a) * 0.56, s.y, -Math.cos(s.a) * 0.22 + 0.18);
        rib.rotation.set(0.32, -s.a * 0.45, Math.PI * 0.5 - s.a * 0.55);
        giantCroissant.add(rib);
      }
      g.add(cHeader, zusMed, vitBox, zBar, zBarTop, giantCroissant);
    } else if (isAdidas) {
      // Photo-matched 1 Utama LG307-LG307A ADIDAS: 3D beveled frosted off-white square-grid piers + TALL VERTICAL CYAN-BLUE LED jamb panels + 3 staggered cylindrical taupe mannequin podiums on oak floor!
      for (const side of [-1, 1]) {
        const px = side * (halfW - 0.45);
        const cubePier = new THREE.Mesh(new THREE.BoxGeometry(0.92, storeH, 0.96), adidasFrostedMat);
        cubePier.position.set(px, storeH * 0.5, 0.28);
        const ledChannel = new THREE.Mesh(new THREE.BoxGeometry(0.14, eaveY - 0.12, 0.12), matteSteelMat);
        ledChannel.position.set(side * (halfW - 0.96), eaveY * 0.5, 0.48);
        const cyanLed = new THREE.Mesh(new THREE.BoxGeometry(0.085, eaveY - 0.20, 0.06), adidasCyanLedMat);
        cyanLed.position.set(side * (halfW - 0.96), eaveY * 0.5, 0.54);
        g.add(cubePier, ledChannel, cyanLed);
      }
      const frostLintel = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.22, 0.96), adidasFrostedMat);
      frostLintel.position.set(0, eaveY - 0.04, 0.28);
      g.add(frostLintel);
      // 3 staggered cylindrical taupe mannequin podiums inside Adidas open entrance!
      const podMat = new THREE.MeshStandardMaterial({ color: '#b8aa96', roughness: 0.65 });
      const podSpecs = [[-1.65, -0.95, 0.26], [0.0, -1.55, 0.44], [1.65, -1.10, 0.34]];
      for (let pi = 0; pi < podSpecs.length; pi++) {
        const [px, pz, ph] = podSpecs[pi];
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, ph, 20), podMat);
        pod.position.set(px, ph * 0.5, pz);
        g.add(pod);
        addSculptedMannequin(g, px, ph, pz, mannequinLightMat, (pi - 1) * 0.25, pi === 1 ? obsidianGlossMat : intMerchMats[pi]);
      }
    } else if (isFoodDistrict) {
      // Photo-matched 1 Utama S346-S347 FOOD DISTRICT: Left 45% Mondrian black-steel partition screen w/ WELCOME walnut panel + 11 glowing white circular food-stall medallions inside 3 black rings + burnt-orange/teal/grey infill!
      const screenW = Math.min(halfW * 0.88, 6.4);
      const screenX = -halfW + screenW * 0.5 + 0.45;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(screenW, eaveY - 0.12, 0.14), matteSteelMat);
      frame.position.set(screenX, eaveY * 0.5, 0.48);
      g.add(frame);
      const bCells = [
        { ox: -screenW * 0.32, oy: 2.95, w: screenW * 0.28, h: 1.15, m: smokedOakMat },
        { ox: 0.0, oy: 2.95, w: screenW * 0.30, h: 1.15, m: tealPanelMat },
        { ox: screenW * 0.32, oy: 2.95, w: screenW * 0.28, h: 1.15, m: bauhausOrangeMat },
        { ox: -screenW * 0.32, oy: 1.65, w: screenW * 0.28, h: 1.15, m: rawConcreteMat },
        { ox: 0.0, oy: 1.65, w: screenW * 0.30, h: 1.15, m: frostedPanelMat },
        { ox: screenW * 0.32, oy: 1.65, w: screenW * 0.28, h: 1.15, m: tealPanelMat },
        { ox: -screenW * 0.16, oy: 0.55, w: screenW * 0.58, h: 0.78, m: bauhausOrangeMat },
        { ox: screenW * 0.32, oy: 0.55, w: screenW * 0.28, h: 0.78, m: frostedPanelMat }
      ];
      for (const c of bCells) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, 0.18), c.m);
        p.position.set(screenX + c.ox, c.oy, 0.48);
        g.add(p);
      }
      // 11 Glowing white circular food-stall medallions mounted inside 3 black steel rings across Mondrian screen!
      for (let mi = 0; mi < 11; mi++) {
        const col = mi % 4;
        const row = Math.floor(mi / 4);
        const mx = screenX - screenW * 0.34 + col * (screenW * 0.225);
        const my = 3.05 - row * 0.92;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.024, 8, 20), matteSteelMat);
        ring.position.set(mx, my, 0.60);
        const disc = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), intBacklitBayMat);
        disc.position.set(mx, my, 0.59);
        g.add(ring, disc);
      }
      // Exposed overhead red utility conduits on Food District open right entrance!
      for (const rz of [-0.5, -1.6]) {
        const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, innerW * 0.52, 8), jayaRedPortalMat);
        conduit.rotation.z = Math.PI / 2;
        conduit.position.set(halfW * 0.42, eaveY - 0.24, rz);
        g.add(conduit);
      }
      const rPlanter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.56, 0.58), lightOakMat);
      rPlanter.position.set(halfW - 1.35, 0.28, 0.62);
      const rPalm = createIndoorPalm(0.75);
      rPalm.position.set(halfW - 1.35, 0.54, 0.62);
      g.add(rPlanter, rPalm);
    } else if (isPuma) {
      // Photo-matched 1 Utama S345 PUMA: Continuous glossy PUMA Red U-frame portal + right dark-slate pier + right glass bay w/ vibrant purple/pink/blue lifestyle LED screen!
      for (const side of [-1, 1]) {
        const blkPier = new THREE.Mesh(new THREE.BoxGeometry(0.68, storeH, 0.96), gunmetalRibMat);
        blkPier.position.set(side * (halfW - 0.34), storeH * 0.5, 0.30);
        const redLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, eaveY, 1.02), jayaRedPortalMat);
        redLeg.position.set(side * (halfW - 0.80), eaveY * 0.5, 0.34);
        g.add(blkPier, redLeg);
      }
      const redTop = new THREE.Mesh(new THREE.BoxGeometry(store.width - 1.36, 0.28, 1.02), jayaRedPortalMat);
      redTop.position.set(0, eaveY - 0.06, 0.36);
      const redBar = new THREE.Mesh(new THREE.BoxGeometry(store.width - 1.60, 0.075, 0.08), crimsonNeonLedMat);
      redBar.position.set(0, eaveY - 0.22, 0.86);
      // Right-side vibrant PUMA FOREVER FASTER magenta/violet LED showcase screen (replaces RollerWa poster!)
      const ledScr = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.75, 0.14), brandPosterMats.puma);
      ledScr.position.set(halfW - 2.35, 1.68, -0.45);
      const pumaGlow = new THREE.PointLight('#e00024', 4.2, 6.2, 1.9);
      pumaGlow.position.set(0, eaveY - 0.35, 1.05);
      g.add(redTop, redBar, ledScr, pumaGlow);
    } else if (isUnderArmour) {
      // Photo-matched 1 Utama S347A-S348 UNDER ARMOUR: Light-grey architectural concrete piers framing thick glossy bright-red portal + recessed glossy red left alcove + dark charcoal threshold band + glowing ice-blue interior center column!
      for (const side of [-1, 1]) {
        const concPier = new THREE.Mesh(new THREE.BoxGeometry(0.68, storeH, 0.96), rawConcreteMat);
        concPier.position.set(side * (halfW - 0.34), storeH * 0.5, 0.30);
        const redJamb = new THREE.Mesh(new THREE.BoxGeometry(0.26, eaveY, 1.02), jayaRedPortalMat);
        redJamb.position.set(side * (halfW - 0.80), eaveY * 0.5, 0.34);
        g.add(concPier, redJamb);
      }
      const redTop = new THREE.Mesh(new THREE.BoxGeometry(store.width - 1.36, 0.28, 1.04), jayaRedPortalMat);
      redTop.position.set(0, eaveY - 0.06, 0.36);
      const redAlcove = new THREE.Mesh(new THREE.BoxGeometry(1.95, eaveY - 0.32, 0.85), jayaRedPortalMat);
      redAlcove.position.set(-halfW + 1.95, (eaveY - 0.32) * 0.5, -0.25);
      const darkThresh = new THREE.Mesh(new THREE.BoxGeometry(store.width - 1.8, 0.025, 1.25), obsidianGlossMat);
      darkThresh.position.set(0, 0.02, 0.25);
      const iceColMat = new THREE.MeshStandardMaterial({ color: '#bae6fd', emissive: '#38bdf8', emissiveIntensity: 0.45, roughness: 0.24 });
      const iceCol = new THREE.Mesh(new THREE.BoxGeometry(0.56, eaveY - 0.2, 0.56), iceColMat);
      iceCol.position.set(0.15, eaveY * 0.5, -1.95);
      g.add(redTop, redAlcove, darkThresh, iceCol);
    } else if (isNike) {
      // Photo-matched 1 Utama S306-S308 NIKE: Matte-black left feature wall w/ crisp white Nike Swoosh + honey-oak plank floor!
      const featW = Math.min(3.8, halfW - 2.6);
      const blackWall = new THREE.Mesh(new THREE.BoxGeometry(featW, eaveY, 0.82), obsidianGlossMat);
      blackWall.position.set(-halfW + featW * 0.5, eaveY * 0.5, 0.28);
      const swooshBar = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.14, 0.06), whiteStripLedMat);
      swooshBar.position.set(-halfW + featW * 0.5, 2.25, 0.72);
      swooshBar.rotation.z = 0.28;
      const swooshHook = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.06), whiteStripLedMat);
      swooshHook.position.set(-halfW + featW * 0.5 - 0.58, 2.15, 0.72);
      swooshHook.rotation.z = -0.65;
      g.add(blackWall, swooshBar, swooshHook);
    } else if (isOutside) {
      // Photo-matched 1 Utama S343 outside: Blonde birch plywood post-and-beam frame + open left entrance w/ interior light-wood A-frame pergola strung with colorful bunting flags + right AstroTurf display w/ teal folding camp wagon & camp chair!
      for (const side of [-1, 1]) {
        const birchPier = new THREE.Mesh(new THREE.BoxGeometry(0.62, storeH, 0.92), lightOakMat);
        birchPier.position.set(side * (halfW - 0.31), storeH * 0.5, 0.28);
        g.add(birchPier);
      }
      // Interior light-wood A-frame pergola strung with colorful triangle bunting flags on left entrance!
      const pergX = -halfW * 0.22;
      for (const px of [-1.45, 1.45]) {
        const pPost = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.55, 0.11), lightOakMat);
        pPost.position.set(pergX + px, 1.28, -0.95);
        g.add(pPost);
      }
      const pRidge = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.11, 0.11), lightOakMat);
      pRidge.position.set(pergX, 2.58, -0.95);
      g.add(pRidge);
      for (let bf = 0; bf < 7; bf++) {
        const flag = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 3), rainbowBandMats[bf % rainbowBandMats.length]);
        flag.rotation.x = Math.PI;
        flag.position.set(pergX - 1.2 + bf * 0.40, 2.42 - Math.sin((bf / 6) * Math.PI) * 0.14, -0.92);
        g.add(flag);
      }
      const turfX = halfW - 2.15;
      const turfZ = -0.82;
      const turfPlinth = new THREE.Mesh(new THREE.BoxGeometry(Math.min(3.4, halfW - 2.0), 0.24, 1.55), turfGreenMat);
      turfPlinth.position.set(turfX, 0.12, turfZ);
      // Iconic teal folding expedition camp wagon on AstroTurf!
      const wagonBody = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.36, 0.52), tealPanelMat);
      wagonBody.position.set(turfX - 0.45, 0.52, turfZ);
      for (const [wx, wz] of [[-0.32, -0.22], [0.32, -0.22], [-0.32, 0.22], [0.32, 0.22]]) {
        const whl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), obsidianGlossMat);
        whl.rotation.x = Math.PI / 2;
        whl.position.set(turfX - 0.45 + wx, 0.33, turfZ + wz);
        g.add(whl);
      }
      const campChair = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 0.46), awningCreamMat);
      campChair.position.set(turfX + 0.62, 0.48, turfZ);
      // Warm bright cream-white interior backdrop wall w/ colorful hiking backpacks & sunlit nature display (photo-matched to 2_S343_OUTSIDE.jpg!)
      const outBrightWall = new THREE.Mesh(new THREE.BoxGeometry(innerW - 0.4, eaveY - 0.25, 0.08), satinWhiteMat);
      outBrightWall.position.set(0, eaveY * 0.5, -intD + 0.14);
      const packCols = ['#f97316', '#0284c7', '#16a34a', '#eab308', '#dc2626', '#64748b'];
      for (let pk = 0; pk < 6; pk++) {
        const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.16), new THREE.MeshStandardMaterial({ color: packCols[pk], roughness: 0.62 }));
        pack.position.set(halfW - 2.95 + (pk % 3) * 0.52, 1.55 + Math.floor(pk / 3) * 0.65, -intD + 0.26);
        g.add(pack);
      }
      g.add(turfPlinth, wagonBody, campChair, outBrightWall);
    } else if (isIppudo) {
      // Photo-matched 1 Utama LG352 IPPUDO: Split dual-aisle open entrance divided by central low gray-stone & light-oak rail wall ("SMILE / ARIGATOU") + left slate 一風堂 pier + right backlit oak-lattice tower!
      const divW = Math.min(4.8, innerW * 0.38);
      const divMat = new THREE.MeshStandardMaterial({ map: createIppudoDividerTexture(), roughness: 0.72 });
      const centerDiv = new THREE.Mesh(
        new THREE.BoxGeometry(divW, 1.02, 0.38),
        [rawConcreteMat, rawConcreteMat, lightOakMat, rawConcreteMat, divMat, divMat]
      );
      centerDiv.position.set(0, 0.51, 0.42);
      const divRail = new THREE.Mesh(new THREE.BoxGeometry(divW + 0.10, 0.07, 0.44), lightOakMat);
      divRail.position.set(0, 1.05, 0.42);
      // Left slate 一風堂 vertical lightbox + right backlit oak-lattice feature tower
      const kanjiBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.66, 2.65, 0.20),
        [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, ippudoKanjiSignMat, ippudoKanjiSignMat]
      );
      kanjiBox.position.set(-halfW + 0.58, 2.15, 0.78);
      const oakTower = new THREE.Mesh(new THREE.BoxGeometry(1.42, eaveY, 0.88), frostedPanelMat);
      oakTower.position.set(halfW - 0.78, eaveY * 0.5, 0.32);
      for (let sl = -2; sl <= 2; sl++) {
        const sBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, eaveY, 0.08), lightOakMat);
        sBar.position.set(halfW - 0.78 + sl * 0.28, eaveY * 0.5, 0.78);
        g.add(sBar);
      }
      g.add(centerDiv, divRail, kanjiBox, oakTower);
    } else if (isStarbucks) {
      // Photo-matched 1 Utama G139B-G139D STARBUCKS RESERVE: Clean dark charcoal-slate right pier w/ glowing circular GREEN Starbucks Siren medallion + recessed light-oak inner portal + circular light-wood slatted drum canopy over round fluted light-wood bar topped with polished black granite!
      for (const side of [-1, 1]) {
        const slatePier = new THREE.Mesh(new THREE.BoxGeometry(0.95, storeH, 0.96), gunmetalRibMat);
        slatePier.position.set(side * (halfW - 0.48), storeH * 0.5, 0.28);
        const oakInner = new THREE.Mesh(new THREE.BoxGeometry(0.24, eaveY, 0.98), lightOakMat);
        oakInner.position.set(side * (halfW - 1.06), eaveY * 0.5, 0.28);
        g.add(slatePier, oakInner);
      }
      const sirenMat = new THREE.MeshStandardMaterial({
        map: createStarbucksSirenTexture(),
        emissive: '#34d399',
        emissiveMap: createStarbucksSirenTexture(),
        emissiveIntensity: 0.35,
        transparent: true,
        roughness: 0.24
      });
      const sirenDisc = new THREE.Mesh(new THREE.CircleGeometry(0.46, 28), sirenMat);
      sirenDisc.position.set(halfW - 0.48, 2.68, 0.79);
      const sageBack = new THREE.Mesh(new THREE.BoxGeometry(innerW * 0.82, eaveY - 0.30, 0.12), sageFlutedMat);
      sageBack.position.set(0, eaveY * 0.5, -intD + 0.20);
      g.add(sirenDisc, sageBack);
      for (let sf = -7; sf <= 6; sf++) {
        const sFlute = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, eaveY - 0.36, 8), sageFlutedMat);
        sFlute.position.set((sf + 0.5) * ((innerW * 0.78) / 14), eaveY * 0.5, -intD + 0.28);
        g.add(sFlute);
      }
      // Circular light-wood slatted drum canopy over round fluted light-wood bar topped with polished black granite!
      const canopyRing = new THREE.Mesh(new THREE.CylinderGeometry(2.58, 2.58, 0.46, 36, 1, true), lightOakMat);
      canopyRing.position.set(0, eaveY - 0.52, -1.55);
      const canopyCove = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.052, 8, 44), warmCoveLedMat);
      canopyCove.rotation.x = Math.PI / 2;
      canopyCove.position.set(0, eaveY - 0.74, -1.55);
      g.add(canopyRing, canopyCove);
      for (let wr = 0; wr < 28; wr++) {
        const wa = (wr / 28) * Math.PI * 2;
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.12), vertOakMat);
        rib.position.set(Math.cos(wa) * 2.60, eaveY - 0.52, -1.55 + Math.sin(wa) * 2.60);
        rib.rotation.y = -wa;
        g.add(rib);
      }
      const reserveBar = new THREE.Mesh(new THREE.CylinderGeometry(2.04, 2.04, 1.00, 32, 1, false, -Math.PI * 0.48, Math.PI * 0.96), vertOakMat);
      reserveBar.position.set(0, 0.52, -1.55);
      const barGraniteTop = new THREE.Mesh(new THREE.CylinderGeometry(2.10, 2.10, 0.08, 32, 1, false, -Math.PI * 0.48, Math.PI * 0.96), obsidianGlossMat);
      barGraniteTop.position.set(0, 1.05, -1.55);
      addLocalContactShadow(g, 0, -1.55, 4.6, 3.6);
      const blackEagle = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.46, 0.54), obsidianGlossMat);
      blackEagle.position.set(-0.52, 1.32, -0.35);
      const eagleBrass = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.065, 0.56), brassGoldMat);
      eagleBrass.position.set(-0.52, 1.56, -0.35);
      const pCase = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.54, 0.56), intGlassPhysMat);
      pCase.position.set(0.88, 1.36, -0.42);
      // Glowing white-gold Reserve Star/R emblem on sage backwall + "SPICE THINGS UP" white A-frame stand left (photo-matched to G_G139B-G139D_Starbucks_Reserve.jpg!)
      const resBackSign = new THREE.Mesh(
        new THREE.PlaneGeometry(1.10, 1.10),
        new THREE.MeshBasicMaterial({ map: createSignBoardTexture('★', 'R', '#2d4736', '#fef3c7', '#e9b03f', 256, 256) })
      );
      resBackSign.position.set(0, 2.38, -intD + 0.34);
      const sbStand = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.46, 0.08), brandPosterMats.starbucks);
      sbStand.position.set(-halfW + 1.85, 0.78, 0.38);
      g.add(reserveBar, barGraniteTop, blackEagle, eagleBrass, pCase, resBackSign, sbStand);
    } else if (isComeTrue) {
      // Photo-matched 1 Utama G315A COME TRUE CAFE: Matte cool-grey concrete plaster left menu pier & right feature wall framed in warm light-oak trim + right logo + arched clerestory transom + hanging cylindrical white ceiling planters w/ greenery!
      const leftGrey = new THREE.Mesh(new THREE.BoxGeometry(1.32, storeH, 0.94), comeTrueGreyPlasterMat);
      leftGrey.position.set(-halfW + 0.66, storeH * 0.5, 0.28);
      const leftOakTrim = new THREE.Mesh(new THREE.BoxGeometry(0.12, storeH, 0.98), lightOakMat);
      leftOakTrim.position.set(-halfW + 1.34, storeH * 0.5, 0.28);
      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(2.45, storeH, 0.94), comeTrueGreyPlasterMat);
      rightWall.position.set(halfW - 1.225, storeH * 0.5, 0.28);
      // Unstretched square 1.65m x 1.65m Come True CAFE ripple logo plaque + lush white-potted fiddle-leaf fig plant beside it (G_G315A_Come_True_Cafe.jpg!)
      const rightLogoMat = new THREE.MeshStandardMaterial({ map: createComeTrueWallLogoTexture(), roughness: 0.58 });
      const rightLogoPlaque = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 1.65), rightLogoMat);
      rightLogoPlaque.position.set(halfW - 1.225, 2.15, 0.77);
      const figPot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.52, 16), satinWhiteMat);
      figPot.position.set(halfW - 0.55, 0.26, 0.95);
      const figTree = createIndoorPalm(0.78);
      figTree.position.set(halfW - 0.55, 0.52, 0.95);
      const rightOakTrim = new THREE.Mesh(new THREE.BoxGeometry(0.12, storeH, 0.98), lightOakMat);
      rightOakTrim.position.set(halfW - 2.48, storeH * 0.5, 0.28);
      g.add(leftGrey, leftOakTrim, rightWall, rightLogoPlaque, figPot, figTree, rightOakTrim);
      // Cylindrical white hanging ceiling planters with lush greenery across open cafe bay!
      for (const hx of [-1.8, -0.4, 1.0]) {
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.72, 6), matteSteelMat);
        wire.position.set(hx, eaveY - 0.36, -0.85);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.20, 0.36, 16), satinWhiteMat);
        pot.position.set(hx, eaveY - 0.78, -0.85);
        const bush = new THREE.Mesh(herbShrubGeo, herbFoliageMat);
        bush.scale.set(1.05, 0.85, 1.05);
        bush.position.set(hx, eaveY - 0.58, -0.85);
        g.add(wire, pot, bush);
      }
    } else if (isParkson) {
      // Photo-matched 1 Utama PARKSON ELITE (G320 Cosmetics / F320 1F Apparel & Menswear / S320 2F Toys & Home):
      // Corrugated reflective silver-chrome piers w/ vertical LED strips & black digital fashion screens (G/1F), central matte-charcoal pier w/ digital screen (2F)!
      const is1FParkson = store.floor === 2;
      const is2FParkson = store.floor === 3;
      const innerSpan = Math.min(halfW - 2.4, 8.6);
      const chromePierMat = new THREE.MeshStandardMaterial({ color: '#d4dce6', roughness: 0.20, metalness: 0.90, envMapIntensity: 1.45 });
      const pierMat = is2FParkson ? gunmetalRibMat : chromePierMat;
      for (const side of [-1, 1]) {
        for (const px of [side * (halfW - 0.85), side * innerSpan]) {
          const pMesh = new THREE.Mesh(new THREE.BoxGeometry(1.55, storeH, 1.15), pierMat);
          pMesh.position.set(px, storeH * 0.5, 0.34);
          const goldBand = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.14, 1.20), brassGoldMat);
          goldBand.position.set(px, eaveY, 0.34);
          g.add(pMesh, goldBand);
          if (!is2FParkson) {
            // Vertical LED edge strips + inset black digital fashion screen on corrugated silver pier!
            for (const lo of [-0.74, 0.74]) {
              const pLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, eaveY - 0.2, 0.05), sportLedBarMat);
              pLed.position.set(px + lo, eaveY * 0.5, 0.93);
              g.add(pLed);
            }
            const digScr = new THREE.Mesh(
              new THREE.BoxGeometry(0.96, 1.72, 0.06),
              new THREE.MeshBasicMaterial({ map: createSignBoardTexture('PARKSON Elite', is1FParkson ? 'NEW SEASON APPAREL' : 'HAUTE BEAUTÉ', '#0f172a', '#ffffff', '#d4af37', 256, 384) })
            );
            digScr.position.set(px, 2.05, 0.93);
            g.add(digScr);
          }
        }
      }
      if (is2FParkson) {
        // Central matte-charcoal dividing pier with digital promo screen splitting 2F Toys & Home bays!
        const cPier = new THREE.Mesh(new THREE.BoxGeometry(1.65, storeH, 1.18), obsidianGlossMat);
        cPier.position.set(0, storeH * 0.5, 0.34);
        const cScr = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.92, 0.06), new THREE.MeshBasicMaterial({ map: createSignBoardTexture('PARKSON Elite', 'TOYS & HOME LIVING', '#111827', '#ffffff', '#facc15', 256, 384) }));
        cScr.position.set(0, 2.15, 0.94);
        g.add(cPier, cScr);
        // S320 Toys & Home Living: Colorful red wooden toy train left + black-steel open kitchenware display racks right!
        const trainBody = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.72, 0.82), jayaRedPortalMat);
        trainBody.position.set(-4.2, 0.46, -1.45);
        const trainCab = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.56, 0.78), mrDiyYellowMat);
        trainCab.position.set(-3.75, 1.05, -1.45);
        const trainStack = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.38, 12), obsidianGlossMat);
        trainStack.position.set(-4.72, 0.98, -1.45);
        const homeRackBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.72, 0.86), obsidianGlossMat);
        homeRackBase.position.set(4.2, 0.36, -1.65);
        g.add(trainBody, trainCab, trainStack, homeRackBase);
        for (let sh = 0; sh < 3; sh++) {
          const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.05, 0.72), lightOakMat);
          shelf.position.set(4.2, 0.95 + sh * 0.52, -1.65);
          g.add(shelf);
          for (let pot = -2; pot <= 2; pot++) {
            const cookware = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.16, 12), pot % 2 === 0 ? jayaRedPortalMat : brushedAlumMat);
            cookware.position.set(4.2 + pot * 0.56, 1.06 + sh * 0.52, -1.65);
            g.add(cookware);
          }
        }
      } else if (is1FParkson) {
        // F320 1F Menswear & Ladies Apparel Hall: Sculpted fashion mannequins on marble risers, tailored brass garment racks & festive ceiling lanterns (NO G320 cosmetics!)
        for (const [mx, colIdx] of [[-4.8, 0], [-1.6, 2], [1.6, 4], [4.8, 1]]) {
          const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.78, 0.24, 18), cafeMarbleMat);
          riser.position.set(mx, 0.12, -1.35);
          g.add(riser);
          addSculptedMannequin(g, mx, 0.24, -1.35, mannequinLightMat, mx < 0 ? 0.25 : -0.25, intMerchMats[colIdx]);
        }
        for (const rx of [-3.2, 3.2]) {
          const rBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.04), brassGoldMat);
          rBar.position.set(rx, 1.55, -2.35);
          for (const endX of [-1.18, 1.18]) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.55, 0.48), brassGoldMat);
            leg.position.set(rx + endX, 0.78, -2.35);
            g.add(leg);
          }
          for (let gm = -3; gm <= 3; gm++) {
            const shirt = new THREE.Mesh(hangingGarmentGeo, intMerchMats[(gm + 7) % intMerchMats.length]);
            shirt.position.set(rx + gm * 0.30, 1.15, -2.35);
            g.add(shirt);
          }
          g.add(rBar);
        }
      } else {
        // G320 Cosmetics Hall: Estée Lauder octagonal black/white island + SK-II burgundy island w/ 3 red barstools + Laneige white marble island!
        const elBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.18, 0.92, 8), obsidianGlossMat);
        elBase.position.set(-4.8, 0.46, -1.45);
        const elTop = new THREE.Mesh(new THREE.CylinderGeometry(1.20, 1.20, 0.06, 8), satinWhiteMat);
        elTop.position.set(-4.8, 0.95, -1.45);
        const skBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.92, 1.05), norenCrimsonMat);
        skBase.position.set(0.0, 0.46, -1.55);
        const skTop = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.06, 1.10), satinWhiteMat);
        skTop.position.set(0.0, 0.95, -1.55);
        for (let sb = -1; sb <= 1; sb++) {
          const st = new THREE.Mesh(stoolSeatGeo, jayaRedPortalMat);
          st.position.set(sb * 0.72, 0.68, -0.78);
          const leg = new THREE.Mesh(stoolLegGeo, brushedAlumMat);
          leg.position.set(sb * 0.72, 0.34, -0.78);
          g.add(st, leg);
        }
        const lnBase = new THREE.Mesh(new THREE.CylinderGeometry(1.10, 1.14, 0.92, 16), cafeMarbleMat);
        lnBase.position.set(4.8, 0.46, -1.45);
        g.add(elBase, elTop, skBase, skTop, lnBase);
      }
      for (let ch = -2; ch <= 2; ch++) {
        const chX = ch * 3.2;
        const chZ = -1.65;
        const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.036, 8, 32), brassGoldMat);
        ringOuter.rotation.x = Math.PI / 2;
        ringOuter.position.set(chX, eaveY - 0.58, chZ);
        const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.030, 8, 28), warmCoveLedMat);
        ringGlow.rotation.x = Math.PI / 2;
        ringGlow.position.set(chX, eaveY - 0.62, chZ);
        g.add(ringOuter, ringGlow);
      }
    } else if (isChanel) {
      // Photo-matched 1 Utama G330 CHANEL: Glossy black metal outer perimeter frame w/ small glowing white CC plaque on far-left + 4 black queue stanchions + 2 cream-white runner strips inlaid in glossy black marble floor!
      for (const side of [-1, 1]) {
        const bOuter = new THREE.Mesh(new THREE.BoxGeometry(0.42, storeH, 0.94), obsidianGlossMat);
        bOuter.position.set(side * (halfW - 0.21), storeH * 0.5, 0.28);
        g.add(bOuter);
      }
      // Glowing white CC plaque mounted on far-left black outer frame!
      const ccPlaque = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, 0.30, 0.06),
        new THREE.MeshBasicMaterial({ map: createSignBoardTexture('CC', '', '#08080a', '#ffffff', '#ffffff', 128, 128) })
      );
      ccPlaque.position.set(-halfW + 0.21, 2.55, 0.78);
      // 2 crisp cream-white marble runner strips inlaid across glossy black entrance floor + 4 black stanchions!
      for (const rx of [-1.25, 1.25]) {
        const runner = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.016, intD + 0.8), satinWhiteMat);
        runner.position.set(rx, 0.075, -intD * 0.5 + 0.22);
        g.add(runner);
      }
      for (const sx of [-2.15, -1.55, 1.55, 2.15]) {
        const stPost = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.92, 8), obsidianGlossMat);
        stPost.position.set(sx, 0.46, 0.52);
        g.add(stPost);
      }
      g.add(ccPlaque);
    } else if (isCoach) {
      // Photo-matched 1 Utama G309 COACH: Full-width glowing amber glass-block lattice flanking BOTH left & right piers + craft workshop bench w/ pink neon scissors!
      for (const side of [-1, 1]) {
        const cPier = new THREE.Mesh(new THREE.BoxGeometry(0.82, storeH, 0.94), obsidianGlossMat);
        cPier.position.set(side * (halfW - 0.41), storeH * 0.5, 0.28);
        const amberFlank = new THREE.Mesh(new THREE.BoxGeometry(1.55, eaveY - 0.35, 0.24), amberBacklitMat);
        amberFlank.position.set(side * (halfW - 1.65), eaveY * 0.5, 0.44);
        g.add(cPier, amberFlank);
      }
      const amberTransom = new THREE.Mesh(new THREE.BoxGeometry(store.width - 1.6, 0.56, 0.22), amberBacklitMat);
      amberTransom.position.set(0, eaveY - 0.32, 0.46);
      const craftBench = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.88, 0.85), lightOakMat);
      craftBench.position.set(halfW - 1.95, 0.44, -1.15);
      // Glowing pink neon scissors craft emblem on right workshop wall!
      const scis1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.045, 0.04), rwPinkNeonMat);
      scis1.position.set(halfW - 1.95, 2.35, -1.75);
      scis1.rotation.z = 0.55;
      const scis2 = scis1.clone();
      scis2.rotation.z = -0.55;
      g.add(amberTransom, craftBench, scis1, scis2);
    } else if (isZara) {
      // Photo-matched 1 Utama G319 ZARA: Monumental horizontal warm-beige travertine center-left pier + right L-shaped wrap-around corner glass display box on low stone plinth!
      const zCenterPier = new THREE.Mesh(new THREE.BoxGeometry(1.38, storeH, 0.98), ivoryStoneMat);
      zCenterPier.position.set(-halfW + 2.85, storeH * 0.5, 0.28);
      const zRightPlinth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.32, 1.35), ivoryStoneMat);
      zRightPlinth.position.set(halfW - 1.85, 0.16, 0.15);
      const zCornerGlass = new THREE.Mesh(new THREE.BoxGeometry(3.15, eaveY - 0.38, 1.28), intGlassPhysMat);
      zCornerGlass.position.set(halfW - 1.85, (eaveY + 0.28) * 0.5, 0.15);
      g.add(zCenterPier, zRightPlinth, zCornerGlass);
    } else if (isHeytea) {
      // Photo-matched 1 Utama LG313 HEYTEA: Brushed slate-steel piers w/ HEYTEA GO QR plaque + clean cream backwall + 4-TIER GLOWING WARM-WHITE HORIZONTAL BACKLIT FRONT COUNTER + 3 glass domes + 3 crisp monitors + 2 graphic "Real Quality" / "Real Milk" A-frames!
      const heySteelMat = new THREE.MeshStandardMaterial({ color: '#64707d', roughness: 0.36, metalness: 0.65 });
      for (const side of [-1, 1]) {
        const gPier = new THREE.Mesh(new THREE.BoxGeometry(0.76, storeH, 0.94), heySteelMat);
        gPier.position.set(side * (halfW - 0.38), storeH * 0.5, 0.28);
        g.add(gPier);
      }
      // Clean warm-beige HEYTEA backwall covering any generic dark cafe menu behind the 3 monitors!
      const heyBack = new THREE.Mesh(new THREE.BoxGeometry(innerW - 0.3, eaveY - 0.2, 0.08), creamTileMat);
      heyBack.position.set(0, eaveY * 0.5, -intD + 0.15);
      // Left pier white HEYTEA GO QR plaque!
      const qrPlaque = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.66, 0.05),
        new THREE.MeshBasicMaterial({ map: createSignBoardTexture('HEYTEA GO', 'SCAN TO ORDER NOW', '#ffffff', '#18181b', '#18181b', 256, 384) })
      );
      qrPlaque.position.set(-halfW + 0.38, 1.82, 0.78);
      const barW = Math.min(innerW - 1.8, 6.2);
      const barBase = new THREE.Mesh(new THREE.BoxGeometry(barW, 1.04, 0.94), obsidianGlossMat);
      barBase.position.set(0, 0.52, -0.95);
      const barTop = new THREE.Mesh(new THREE.BoxGeometry(barW + 0.10, 0.06, 1.02), brushedAlumMat);
      barTop.position.set(0, 1.06, -0.95);
      g.add(heyBack, qrPlaque, barBase, barTop);
      // 4 glowing warm-white horizontal backlit tiers across front counter!
      for (let t = 0; t < 4; t++) {
        const tier = new THREE.Mesh(new THREE.BoxGeometry(barW - 0.18, 0.16, 0.05), intLightWarmMat);
        tier.position.set(0, 0.18 + t * 0.23, -0.46);
        g.add(tier);
      }
      // 3 clear glass display domes atop front counter!
      for (const dx of [-1.45, 0, 1.45]) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), intGlassPhysMat);
        dome.position.set(dx, 1.09, -0.78);
        g.add(dome);
      }
      // 3 horizontal backlit menu monitors across clean backwall + 2 crisp graphic "Real Quality" & "Real Milk" A-frames outside!
      const heyMenuMat = new THREE.MeshStandardMaterial({ map: createMenuStandTexture(store), emissive: '#ffffff', emissiveIntensity: 0.44, roughness: 0.26 });
      for (const mx of [-2.1, 0, 2.1]) {
        const mon = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.88, 0.08), heyMenuMat);
        mon.position.set(mx, 2.58, -intD + 0.24);
        g.add(mon);
      }
      const aFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.12, 0.08), [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, brandPosterMats.heytea_left, brandPosterMats.heytea_left]);
      aFrameL.position.set(-halfW + 1.25, 0.56, 0.92);
      aFrameL.rotation.x = -0.14;
      const aFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.12, 0.08), [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, brandPosterMats.heytea_right, brandPosterMats.heytea_right]);
      aFrameR.position.set(halfW - 1.25, 0.56, 0.92);
      aFrameR.rotation.x = -0.14;
      g.add(aFrameL, aFrameR);
      addLocalContactShadow(g, 0, -0.95, barW + 0.6, 1.6);
    } else if (isNextGen) {
      // Photo-matched 1 Utama F602-F603 NEXT GEN: Left slate-purple shutter + CENTRAL SQUARE WHITE COLUMN CLAD IN 6 VERTICAL RAINBOW STRIPES + parallel multicolor vertical ceiling fins + curved dark fluted reception counter w/ rainbow stripes!
      for (const side of [-1, 1]) {
        const wPier = new THREE.Mesh(new THREE.BoxGeometry(0.66, storeH, 0.92), satinWhiteMat);
        wPier.position.set(side * (halfW - 0.33), storeH * 0.5, 0.28);
        g.add(wPier);
      }
      // Central SQUARE white column clad in 6 vertical rainbow stripes!
      const colX = -1.25;
      const colZ = 0.52;
      const sqCol = new THREE.Mesh(new THREE.BoxGeometry(0.96, eaveY - 0.12, 0.96), satinWhiteMat);
      sqCol.position.set(colX, eaveY * 0.5, colZ);
      g.add(sqCol);
      for (let st = 0; st < 6; st++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.11, eaveY - 0.28, 0.04), rainbowBandMats[st]);
        stripe.position.set(colX - 0.36 + st * 0.144, eaveY * 0.5, colZ + 0.49);
        g.add(stripe);
      }
      // Parallel multicolor vertical ceiling fins across open right entrance!
      for (let cf = 0; cf < 10; cf++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 2.8), rainbowBandMats[cf % rainbowBandMats.length]);
        fin.position.set(0.55 + cf * 0.62, eaveY - 0.26, -0.95);
        g.add(fin);
      }
      // Curved dark fluted reception counter w/ vertical rainbow stripes!
      if (intD > 1.8) {
        const recDesk = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 1.02, 24, 1, false, -Math.PI * 0.45, Math.PI * 0.90), obsidianGlossMat);
        recDesk.position.set(2.35, 0.51, -1.65);
        for (let rs = 0; rs < 6; rs++) {
          const ra = -Math.PI * 0.35 + (rs / 5) * Math.PI * 0.70;
          const rStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.88, 0.05), rainbowBandMats[rs]);
          rStrip.position.set(2.35 + Math.sin(ra) * 1.40, 0.51, -1.65 + Math.cos(ra) * 1.40);
          rStrip.rotation.y = ra;
          g.add(rStrip);
        }
        g.add(recDesk);
      }
    } else if (isGameOn) {
      // Photo-matched 1 Utama F601 GAME ON SPORTS HUB: 6 nested inverted-U colored arches (bright orange+LED -> dark maroon -> cream -> dark teal -> crimson -> white) + continuous burnt-orange floor + 3D RED CARTOON NINJA MASCOT peeking left + right cream utility door w/ green KELUAR sign!
      const carpet = new THREE.Mesh(new THREE.BoxGeometry(doorHalfW * 2.25, 0.032, 3.92), gameOnCarpetMat);
      carpet.position.set(0, 0.056, -1.36);
      g.add(carpet);
      const archColors = [orangeAccentMat, norenCrimsonMat, creamTileMat, tealPanelMat, jayaRedPortalMat, satinWhiteMat];
      for (let t = 0; t < 6; t++) {
        const tw = doorHalfW * 2.28 - t * 0.26;
        const th = eaveY - 0.16 - t * 0.15;
        const tz = 0.56 - t * 0.54;
        const aMat = archColors[t];
        const topB = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.24, 0.22), aMat);
        topB.position.set(0, th, tz);
        const lB = new THREE.Mesh(new THREE.BoxGeometry(0.24, th, 0.22), aMat);
        lB.position.set(-tw * 0.5, th * 0.5, tz);
        const rB = lB.clone();
        rB.position.x = tw * 0.5;
        g.add(topB, lB, rB);
        if (t === 0) {
          const warmStrip = new THREE.Mesh(new THREE.BoxGeometry(tw - 0.26, 0.06, 0.06), gameOnLedMats[0]);
          warmStrip.position.set(0, th - 0.14, tz + 0.08);
          g.add(warmStrip);
        }
      }
      // Sculpted 3D red cartoon ninja mascot peeking around left portal edge!
      const ninjaG = new THREE.Group();
      ninjaG.position.set(-doorHalfW * 1.18, 0.0, 0.68);
      const nBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.65, 8, 12), jayaRedPortalMat);
      nBody.position.y = 0.72;
      const nHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), jayaRedPortalMat);
      nHead.position.y = 1.44;
      const nBand = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.12), creamTileMat);
      nBand.position.set(0, 1.46, 0.26);
      const nEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), obsidianGlossMat);
      nEyeL.position.set(-0.10, 1.46, 0.32);
      const nEyeR = nEyeL.clone();
      nEyeR.position.x = 0.10;
      ninjaG.add(nBody, nHead, nBand, nEyeL, nEyeR);
      // Right cream utility door w/ glowing green KELUAR exit sign!
      const keluarDoor = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.25, 0.14), creamTileMat);
      keluarDoor.position.set(halfW - 1.15, 1.12, 0.45);
      const keluarSign = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.22, 0.08),
        new THREE.MeshBasicMaterial({ map: createSignBoardTexture('KELUAR', '', '#15803d', '#ffffff', '#22c55e', 128, 64) })
      );
      keluarSign.position.set(halfW - 1.15, 2.48, 0.50);
      const goBounce = new THREE.PointLight('#ff3b0a', 6.5, 8.5, 1.75);
      goBounce.position.set(0, 2.35, -0.45);
      g.add(ninjaG, keluarDoor, keluarSign, goBounce);
    } else if (isBhc) {
      // Photo-matched 1 Utama G601 BHC CHICKEN: Golden-yellow mosaic left pier & top fascia over dark walnut inner portal frame + textured grey Venetian plaster backwall w/ glowing `bhc CHICKEN / TASTE THE ORIGINAL KOREAN FLAVOUR` + front-right curved fluted walnut host podium!
      for (const side of [-1, 1]) {
        const yPier = new THREE.Mesh(new THREE.BoxGeometry(0.86, storeH, 0.96), mustardMosaicMat);
        yPier.position.set(side * (halfW - 0.43), storeH * 0.5, 0.30);
        const wInner = new THREE.Mesh(new THREE.BoxGeometry(0.22, eaveY, 0.98), smokedOakMat);
        wInner.position.set(side * (halfW - 0.96), eaveY * 0.5, 0.30);
        g.add(yPier, wInner);
      }
      const yLint = new THREE.Mesh(new THREE.BoxGeometry(store.width, 0.28, 0.98), mustardMosaicMat);
      yLint.position.set(0, eaveY - 0.06, 0.30);
      const bhcBackSign = new THREE.Mesh(
        new THREE.PlaneGeometry(innerW - 1.4, eaveY - 0.75),
        new THREE.MeshStandardMaterial({
          map: createBhcBackwallSignTexture(),
          emissive: '#fef08a',
          emissiveMap: createBhcBackwallSignTexture(),
          emissiveIntensity: 0.28,
          roughness: 0.65
        })
      );
      bhcBackSign.position.set(0, eaveY * 0.52, -intD + 0.18);
      // Front-right curved fluted dark-walnut host/POS podium!
      const hostPod = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.48, 1.08, 20), smokedOakMat);
      hostPod.position.set(halfW - 2.15, 0.54, 0.42);
      const hostTop = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.50, 0.05, 20), cafeMarbleMat);
      hostTop.position.set(halfW - 2.15, 1.10, 0.42);
      g.add(yLint, bhcBackSign, hostPod, hostTop);
    } else if (isModu) {
      // Photo-matched 1 Utama LG602 MODU: Sweeping 2-tier rough-hewn timber curved interior canopy w/ glowing white Hangul `모두` + long light-wood bar counter & 9 wood stools!
      const oakThresh = new THREE.Mesh(new THREE.BoxGeometry(doorHalfW * 1.48, 0.025, 0.48), lightOakMat);
      oakThresh.position.set(0, 0.015, 0.32);
      for (const tierY of [eaveY - 0.68, eaveY - 1.05]) {
        const curvedCan = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.75, 0.24, 24, 1, true, -Math.PI * 0.45, Math.PI * 0.90), lightOakMat);
        curvedCan.position.set(0, tierY, -1.75);
        g.add(curvedCan);
      }
      const moduNeon = new THREE.Mesh(
        new THREE.PlaneGeometry(1.45, 0.55),
        new THREE.MeshBasicMaterial({ map: createSignBoardTexture('모두', 'MODU SAMGYETANG', '#3b2412', '#ffffff', '#fde68a', 256, 96) })
      );
      moduNeon.position.set(0, eaveY - 0.85, -1.55);
      const longBar = new THREE.Mesh(new THREE.BoxGeometry(Math.min(innerW - 2.2, 7.6), 0.96, 0.72), lightOakMat);
      longBar.position.set(0, 0.48, -1.75);
      for (let st = -4; st <= 4; st++) {
        const sTop = new THREE.Mesh(stoolSeatGeo, vertOakMat);
        sTop.position.set(st * 0.78, 0.68, -1.12);
        const sLeg = new THREE.Mesh(stoolLegGeo, smokedOakMat);
        sLeg.position.set(st * 0.78, 0.34, -1.12);
        g.add(sTop, sLeg);
      }
      g.add(oakThresh, moduNeon, longBar);
    } else if (isWindlab) {
      // Photo-matched 1 Utama S601 WINDLAB: Sweeping curved silver perforated canopy + matching curved silver perforated reception counter w/ white top + glossy black backwall sign + sharp diagonal orange accent framing glass wind-tunnel window!
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(store.width - 0.6, 0.26, 1.52), brushedAlumMat);
      canopy.position.set(0, eaveY - 0.06, 0.68);
      const recBar = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.02, 28, 1, false, -Math.PI * 0.42, Math.PI * 0.84), brushedAlumMat);
      recBar.position.set(0, 0.51, -0.85);
      const recTop = new THREE.Mesh(new THREE.CylinderGeometry(2.28, 2.28, 0.06, 28, 1, false, -Math.PI * 0.42, Math.PI * 0.84), satinWhiteMat);
      recTop.position.set(0, 1.04, -0.85);
      const wlBack = new THREE.Mesh(
        new THREE.PlaneGeometry(innerW - 1.6, eaveY - 0.65),
        new THREE.MeshStandardMaterial({
          map: createWindlabBackwallSignTexture(),
          emissive: '#ffffff',
          emissiveMap: createWindlabBackwallSignTexture(),
          emissiveIntensity: 0.48,
          roughness: 0.18
        })
      );
      wlBack.position.set(0, eaveY * 0.52, -intD + 0.18);
      g.add(canopy, recBar, recTop, wlBack);
      for (const side of [-1, 1]) {
        const oPanel = new THREE.Mesh(new THREE.BoxGeometry(0.32, eaveY * 0.88, 0.96), orangeAccentMat);
        oPanel.position.set(side * (halfW - 0.62), eaveY * 0.46, 0.36);
        oPanel.rotation.z = side * 0.18;
        g.add(oPanel);
      }
    } else if (isPjpac) {
      // Photo-matched 1 Utama S611 PJPAC: Smooth glossy golden-marigold inverted-U rounded portal arch + central matte-white column holding square white/orange PJPAC monogram lightbox + coral-red wooden slatted park bench on right!
      for (const side of [-1, 1]) {
        for (const px of [side * (halfW - 0.58), side * 6.6]) {
          const yCol = new THREE.Mesh(new THREE.BoxGeometry(1.16, storeH, 1.08), canaryArchMat);
          yCol.position.set(px, storeH * 0.5, 0.34);
          g.add(yCol);
        }
      }
      const yCanopy = new THREE.Mesh(new THREE.BoxGeometry(store.width - 0.04, 0.30, 1.46), canaryArchMat);
      yCanopy.position.set(0, eaveY - 0.16, 0.62);
      // Central square matte-white architectural column w/ glowing square PJPAC monogram lightbox!
      const pjCol = new THREE.Mesh(new THREE.BoxGeometry(1.08, eaveY - 0.24, 1.08), satinWhiteMat);
      pjCol.position.set(0, (eaveY - 0.24) * 0.5, 0.58);
      const pjMonoMat = new THREE.MeshStandardMaterial({
        map: createPjpacMonogramTexture(),
        emissive: '#fffbeb',
        emissiveMap: createPjpacMonogramTexture(),
        emissiveIntensity: 0.42,
        roughness: 0.24
      });
      const pjMono = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.86, 0.12), [canaryArchMat, canaryArchMat, canaryArchMat, canaryArchMat, pjMonoMat, pjMonoMat]);
      pjMono.position.set(0, 2.38, 1.15);
      // Iconic coral-red wooden slatted park bench on right front concourse!
      const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.56), coralBenchMat);
      benchSeat.position.set(3.85, 0.46, 1.15);
      const benchBack = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 0.07), coralBenchMat);
      benchBack.position.set(3.85, 0.72, 0.88);
      const benchLegL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.46, 0.52), matteSteelMat);
      benchLegL.position.set(2.98, 0.23, 1.15);
      const benchLegR = benchLegL.clone();
      benchLegR.position.x = 4.72;
      g.add(yCanopy, pjCol, pjMono, benchSeat, benchBack, benchLegL, benchLegR);
    } else if (isRollerwa) {
      // Photo-matched 1 Utama F603A-F613 ROLLERWA: White square-grid tile left pier + deep matte navy left wall w/ floating pure-white cursive RollerWa neon + 3 white rounded-top touchscreen kiosks + dark warm taupe right wall w/ glowing white quad-skate outline + red retractable stanchions!
      for (const lx of [-halfW + 0.54, -6.2]) {
        const whiteMosaic = new THREE.Mesh(new THREE.BoxGeometry(1.08, storeH, 1.06), rwWhiteMosaicMat);
        whiteMosaic.position.set(lx, storeH * 0.5, 0.34);
        g.add(whiteMosaic);
      }
      for (const rx of [halfW - 0.54, 6.2]) {
        const bluePier = new THREE.Mesh(new THREE.BoxGeometry(1.08, storeH, 1.06), rwElectricBlueMat);
        bluePier.position.set(rx, storeH * 0.5, 0.34);
        g.add(bluePier);
      }
      // Deep matte navy-blue left wall w/ floating pure-white cursive RollerWa neon sign!
      const rwLeftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(4.4, 2.2),
        new THREE.MeshStandardMaterial({
          map: createRollerWaNeonSignTexture(),
          emissive: '#ffffff',
          emissiveMap: createRollerWaNeonSignTexture(),
          emissiveIntensity: 0.65,
          roughness: 0.55
        })
      );
      rwLeftWall.position.set(-3.4, 2.35, -0.85);
      // Dark warm taupe right wall w/ glowing white LED quad-skate outline!
      const rwSkateWall = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 2.4),
        new THREE.MeshStandardMaterial({
          map: createRollerWaSkateIconTexture(),
          emissive: '#ffffff',
          emissiveMap: createRollerWaSkateIconTexture(),
          emissiveIntensity: 0.60,
          roughness: 0.55
        })
      );
      rwSkateWall.position.set(3.6, 2.25, -0.85);
      g.add(rwLeftWall, rwSkateWall);
      // 3 crisp WHITE rounded-top self-ticketing touchscreen kiosks!
      for (let tk = -1; tk <= 1; tk++) {
        const kx = tk * 1.65;
        const kBase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.10, 0.56), satinWhiteMat);
        kBase.position.set(kx, 0.05, 1.05);
        const kBody = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.72, 0.24), satinWhiteMat);
        kBody.position.set(kx, 0.92, 1.05);
        const kCap = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.24, 16), satinWhiteMat);
        kCap.rotation.x = Math.PI / 2;
        kCap.position.set(kx, 1.78, 1.05);
        const scr = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.66, 0.04), brandPosterMats.rollerwa);
        scr.position.set(kx, 1.32, 1.18);
        g.add(kBase, kBody, kCap, scr);
        addLocalContactShadow(g, kx, 1.05, 1.05, 0.95, 0.018);
      }
      // Red retractable-belt queue stanchions on right side!
      for (const sx of [2.8, 4.4]) {
        const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.92, 8), obsidianGlossMat);
        sp.position.set(sx, 0.46, 0.95);
        g.add(sp);
      }
      const rBelt = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.02), jayaRedPortalMat);
      rBelt.position.set(3.6, 0.84, 0.95);
      g.add(rBelt);
    } else if (isDecathlon) {
      // Photo-matched 1F F319 DECATHLON: Deep indigo-cobalt (#2c2e83) twin-bay open glassless portal + central backlit hiker photo pillar +
      // green AstroTurf outdoor display island (dome tent + pop-up soccer goal) + giant royal-blue branded column w/ 3-tone pink/rose/burgundy base rings!
      const decBlueMat = new THREE.MeshStandardMaterial({ color: '#2c2e83', roughness: 0.34, metalness: 0.18 });
      const turfMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.92 });
      for (const px of [-halfW + 0.58, 0, halfW - 0.58]) {
        const pH = px === 0 ? eaveY - 0.04 : storeH;
        const dPier = new THREE.Mesh(new THREE.BoxGeometry(1.16, pH, 1.02), decBlueMat);
        dPier.position.set(px, pH * 0.5, 0.32);
        g.add(dPier);
      }
      // Full-width Decathlon cobalt-blue sporting goods feature backwall banner (suppresses generic "... MOTION" backwall text clipping behind shelves!)
      const decBackWall = new THREE.Mesh(
        new THREE.PlaneGeometry(innerW - 0.4, 1.35),
        new THREE.MeshBasicMaterial({ map: createSignBoardTexture('DECATHLON  •  ALL FOR SPORT', 'CAMPING  •  CYCLING  •  FITNESS  •  RUNNING  •  RACKET SPORTS', '#1e2b6e', '#ffffff', '#38bdf8', 1024, 192) })
      );
      decBackWall.position.set(0, eaveY - 0.82, -intD + 0.34);
      // Central backlit hiker / sport adventure photo pillar!
      const hikerScr = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, 2.85, 0.08),
        new THREE.MeshBasicMaterial({ map: createSignBoardTexture('DECATHLON', 'READY TO PLAY? • 70+ SPORTS', '#1e3a8a', '#ffffff', '#38bdf8', 256, 512) })
      );
      hikerScr.position.set(0, 1.95, 0.86);
      // Vibrant Green AstroTurf outdoor display island raised cleanly ABOVE store floor (y=0.085) w/ dome tent & soccer goal!
      const turfPad = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.06, 2.4), turfMat);
      turfPad.position.set(-3.6, 0.085, -1.15);
      const tentDome = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.55 }));
      tentDome.scale.set(1.15, 0.92, 1.05);
      tentDome.position.set(-4.5, 0.06, -1.15);
      // Pop-up white soccer goal frame
      const goalTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.06), satinWhiteMat);
      goalTop.position.set(-2.3, 1.02, -1.15);
      for (const gx of [-3.05, -1.55]) {
        const gPost = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.02, 0.06), satinWhiteMat);
        gPost.position.set(gx, 0.51, -1.15);
        g.add(gPost);
      }
      // Giant Royal-Blue "DECATHLON Ready to play?" Branded Column w/ 3-tone Pink/Dusty-Rose/Burgundy Base Rings & Unclipped Angled Banner!
      const decCol = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, eaveY - 0.12, 20), decBlueMat);
      decCol.position.set(2.85, eaveY * 0.5, 0.92);
      const ringCols = ['#881337', '#be5a7a', '#f472b6'];
      ringCols.forEach((hex, ri) => {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.585, 0.585, 0.28, 20), new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45 }));
        ring.position.set(2.85, 0.16 + ri * 0.28, 0.92);
        g.add(ring);
      });
      const decColSignMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('DECATHLON', 'Ready to play?', '#2c2e83', '#ffffff', '#67e8f9', 512, 192) });
      const colBanner = new THREE.Mesh(
        new THREE.BoxGeometry(1.42, 0.88, 0.16),
        [decBlueMat, decBlueMat, decBlueMat, decBlueMat, decColSignMat, decColSignMat]
      );
      colBanner.position.set(2.85, 2.38, 1.48);
      colBanner.rotation.y = -0.34;
      g.add(decBackWall, hikerScr, turfPad, tentDome, goalTop, decCol, colBanner);
    } else if (isTgv) {
      // Photo-matched 3F EZ101 TGV MAYBANK IMAX: Corrugated steel piers + glowing cyan Bites bar draped in green vines + white backlit Now Seating Halls 1-7 & TGV JUNIOR board + dark striped foyer floor + slatted LED ceiling!
      const corrSteelMat = new THREE.MeshStandardMaterial({ color: '#c4c9d0', roughness: 0.36, metalness: 0.62 });
      const vineMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.78 });
      const cyanGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.85, 2.45), toneMapped: false });
      for (const side of [-1, 1]) {
        const tPier = new THREE.Mesh(new THREE.BoxGeometry(1.25, storeH, 1.05), corrSteelMat);
        tPier.position.set(side * (halfW - 0.62), storeH * 0.5, 0.30);
        g.add(tPier);
      }
      // Dark charcoal-striped foyer floor pad + dark linear ceiling slats with glowing LED bars!
      const foyerFloor = new THREE.Mesh(new THREE.BoxGeometry(innerW - 0.8, 0.04, intD + 0.6), obsidianGlossMat);
      foyerFloor.position.set(0, 0.03, -intD * 0.5 + 0.15);
      g.add(foyerFloor);
      for (let sl = -5; sl <= 5; sl++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, intD), obsidianGlossMat);
        slat.position.set(sl * (innerW / 12), eaveY - 0.22, -intD * 0.5 + 0.12);
        g.add(slat);
        if (sl % 2 === 0) {
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, intD - 0.4), cyanGlowMat);
          led.position.set(sl * (innerW / 12) + 0.18, eaveY - 0.32, -intD * 0.5 + 0.12);
          g.add(led);
        }
      }
      // Bites Concession Bar w/ black steel pergola draped in hanging green vines (left-center!)
      const bitesX = -Math.min(innerW * 0.24, 5.2);
      const bitesCounter = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.02, 1.05), obsidianGlossMat);
      bitesCounter.position.set(bitesX, 0.51, -1.45);
      const bitesTop = new THREE.Mesh(new THREE.BoxGeometry(4.72, 0.07, 1.15), satinWhiteMat);
      bitesTop.position.set(bitesX, 1.05, -1.45);
      const bitesHeader = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.64, 0.24), new THREE.MeshBasicMaterial({ map: createSignBoardTexture('Bites', 'POPCORN • COMBOS • DRINKS', '#0284c7', '#ffffff', '#fef08a', 512, 128) }));
      bitesHeader.position.set(bitesX, 2.92, -1.05);
      // Lush hanging greenery garland draped cleanly ALONG TOP pergola beam ABOVE Bites text (ZERO text overlap!)
      const garland = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.18, 0.28), vineMat);
      garland.position.set(bitesX, 3.32, -1.04);
      g.add(garland);
      for (const vx of [-2.32, 2.32]) {
        const sideVine = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.035, 1.45, 6), vineMat);
        sideVine.position.set(bitesX + vx, 2.65, -1.02);
        g.add(sideVine);
      }
      // White backlit "Now Seating • Halls 1 2 3 4 5 6 7" & "TGV JUNIOR" directory wall (right-center!)
      const hallX = Math.min(innerW * 0.24, 5.2);
      const nowSeating = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 2.1, 0.12),
        new THREE.MeshBasicMaterial({ map: createSignBoardTexture('Now Seating  •  Halls 1 2 3 4 5 6 7', 'MAYBANK IMAX  •  TGV JUNIOR  •  INDULGE', '#f8fafc', '#0f172a', '#e11d48', 768, 320) })
      );
      nowSeating.position.set(hallX, 2.15, -intD + 0.25);
      g.add(bitesCounter, bitesTop, bitesHeader, nowSeating);
    } else if (isGsc) {
      // Photo-matched 4F EZ403 GSC CINEMAS: Towering warm honey-oak vertical wood-slat portal piers + open glassless wide matte-black concession counter w/ white quartz top + 5 glowing menu monitors!
      const honeyOakMat = new THREE.MeshStandardMaterial({ color: '#c5a87e', roughness: 0.48 });
      const darkOakSlatMat = new THREE.MeshStandardMaterial({ color: '#785a38', roughness: 0.62 });
      for (const side of [-1, 1]) {
        const gx = side * (halfW - 0.95);
        const oakPier = new THREE.Mesh(new THREE.BoxGeometry(1.9, storeH, 1.05), honeyOakMat);
        oakPier.position.set(gx, storeH * 0.5, 0.28);
        g.add(oakPier);
        for (let sl = -3; sl <= 3; sl++) {
          const slat = new THREE.Mesh(new THREE.BoxGeometry(0.08, storeH - 0.1, 0.10), darkOakSlatMat);
          slat.position.set(gx + sl * 0.24, storeH * 0.5, 0.82);
          g.add(slat);
        }
      }
      // Wide open matte-black concession counter w/ crisp white quartz top + 5 glowing backlit cinema menu monitors!
      const concW = Math.min(innerW - 4.2, 14.8);
      const concBase = new THREE.Mesh(new THREE.BoxGeometry(concW, 1.02, 1.05), obsidianGlossMat);
      concBase.position.set(0, 0.51, -1.65);
      const concTop = new THREE.Mesh(new THREE.BoxGeometry(concW + 0.14, 0.08, 1.18), satinWhiteMat);
      concTop.position.set(0, 1.06, -1.65);
      const concToe = new THREE.Mesh(new THREE.BoxGeometry(concW + 0.06, 0.05, 1.08), warmCoveLedMat);
      concToe.position.set(0, 0.05, -1.65);
      g.add(concBase, concTop, concToe);
      const menuLabels = ['CARAMEL POPCORN', 'COMBO 1 • REGULAR', 'HOTDOG & NACHOS', 'COLD DRINKS', 'GSC MERCHANDISE'];
      for (let m = 0; m < 5; m++) {
        const mx = (m - 2) * Math.min(2.55, (concW - 1.2) / 4.5);
        const mon = new THREE.Mesh(
          new THREE.BoxGeometry(1.85, 0.98, 0.08),
          new THREE.MeshBasicMaterial({ map: createSignBoardTexture(menuLabels[m], 'GSC CONCESSIONS • RM18.90', '#18181b', '#facc15', '#ffffff', 384, 192) })
        );
        mon.position.set(mx, 2.75, -intD + 0.28);
        g.add(mon);
      }
      // 4 Glowing Backlit Cinema Movie Poster Lightboxes illuminating the flanking gold-framed GSC wall bays!
      const posterSpecs = [
        [-innerW * 0.38, 'NOW SHOWING • BIG 4K', 'GALAXY ODYSSEY • DOLBY ATMOS', '#0f172a', '#38bdf8', '#facc15'],
        [-innerW * 0.24, 'SCREENX 270°', 'MIDNIGHT VELOCITY • LIVE NOW', '#3b0764', '#f472b6', '#fde047'],
        [innerW * 0.24, '4DX EXPERIENCE', 'TITAN HORIZON • MOTION SEATS', '#7f1d1d', '#fde047', '#fb923c'],
        [innerW * 0.38, 'GSC PRESTIGE', 'VIP DINING RECLINER SUITES', '#1c1917', '#fef08a', '#d4af37']
      ];
      for (const [px, t1, t2, bg, fg, ac] of posterSpecs) {
        const pBox = new THREE.Mesh(
          new THREE.BoxGeometry(4.4, 2.1, 0.08),
          new THREE.MeshBasicMaterial({ map: createSignBoardTexture(t1, t2, bg, fg, ac, 512, 256) })
        );
        pBox.position.set(px, 2.25, -intD + 0.24);
        g.add(pBox);
      }
    } else if (isCellini) {
      // Photo-matched 4F OV401 Cellini: Matte-charcoal architectural monolith piers + glowing sky-blue vertical accent LED + richly furnished Italian leather sectional showroom!
      const skyLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.28, 1.65, 2.35), toneMapped: false });
      const sofaCreamMat = new THREE.MeshStandardMaterial({ color: '#e8e2d6', roughness: 0.62 });
      const sofaSlateMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.68 });
      for (const side of [-1, 1]) {
        const cPier = new THREE.Mesh(new THREE.BoxGeometry(1.15, storeH, 0.96), obsidianGlossMat);
        cPier.position.set(side * (halfW - 0.58), storeH * 0.5, 0.28);
        const cLed = new THREE.Mesh(new THREE.BoxGeometry(0.06, eaveY - 0.2, 0.06), skyLedMat);
        cLed.position.set(side * (halfW - 1.18), eaveY * 0.5, 0.72);
        g.add(cPier, cLed);
      }
      // 3 Designer Living Room Vignettes (Warm walnut wood-slat feature backdrops + L-shaped leather sectionals + walnut coffee tables + glowing floor lamps + framed wall art!)
      for (let v = -1; v <= 1; v++) {
        const vx = v * Math.min(innerW * 0.26, 9.5);
        const sMat = v === 0 ? sofaSlateMat : sofaCreamMat;
        const slatBackdrop = new THREE.Mesh(new THREE.BoxGeometry(4.2, eaveY - 0.45, 0.10), smokedOakMat);
        slatBackdrop.position.set(vx, (eaveY - 0.45) * 0.5 + 0.08, -intD + 0.20);
        const artFrame = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 1.15, 0.08),
          [brassGoldMat, brassGoldMat, brassGoldMat, brassGoldMat, new THREE.MeshBasicMaterial({ map: createSignBoardTexture('CELLINI DESIGN STUDIO', 'CONTEMPORARY ITALIAN & MOTORIZED LEATHER LIVING', '#1e293b', '#f8fafc', '#38bdf8', 512, 256) }), brassGoldMat]
        );
        artFrame.position.set(vx, 2.28, -intD + 0.28);
        for (let sl = -6; sl <= 6; sl++) {
          const wSlat = new THREE.Mesh(new THREE.BoxGeometry(0.08, eaveY - 0.52, 0.14), vertOakMat);
          wSlat.position.set(vx + sl * 0.30, (eaveY - 0.52) * 0.5 + 0.08, -intD + 0.22);
          g.add(wSlat);
        }
        const rug = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.03, 2.4), creamTileMat);
        rug.position.set(vx, 0.07, -1.65);
        const sofaMain = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.44, 0.96), sMat);
        sofaMain.position.set(vx, 0.28, -2.15);
        const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.52, 0.22), sMat);
        sofaBack.position.set(vx, 0.68, -2.52);
        const chaise = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.44, 1.65), sMat);
        chaise.position.set(vx - 1.12, 0.28, -1.55);
        const tbl = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.36, 0.75), smokedOakMat);
        tbl.position.set(vx + 0.45, 0.24, -1.15);
        const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.85, 8), brassGoldMat);
        lampPole.position.set(vx + 1.85, 0.96, -2.25);
        const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.32, 12), intLightWarmMat);
        lampShade.position.set(vx + 1.85, 1.88, -2.25);
        g.add(slatBackdrop, artFrame, rug, sofaMain, sofaBack, chaise, tbl, lampPole, lampShade);
      }
    } else if (isLoccitane) {
      // Photo-matched LUXE G L'OCCITANE: Provence sunshine-yellow (#eab308) arched boutique window frames & limestone mullions!
      const provYellowMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.42 });
      for (const side of [-1, 1]) {
        const yPier = new THREE.Mesh(new THREE.BoxGeometry(0.75, storeH, 0.88), provYellowMat);
        yPier.position.set(side * (halfW - 0.38), storeH * 0.5, 0.28);
        const arch = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.12, 8, 20, Math.PI), provYellowMat);
        arch.position.set(side * (halfW - 2.15), eaveY - 1.25, 0.42);
        g.add(yPier, arch);
      }
    } else if (isMrt) {
      // MRT BANDAR UTAMA (PINTU B) SKYWALK PORTAL: Sunlit glazed transit sliding doors + glowing MRT blue-teal wayfinding header + daylight skywalk corridor behind!
      const skyGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.08, 1.24, 1.38) });
      const mrtBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(innerW - 0.6, eaveY - 0.2), skyGlowMat);
      mrtBackdrop.position.set(0, eaveY * 0.5, -intD + 0.16);
      g.add(mrtBackdrop);
      const bayCount = 6;
      const bayW = (innerW - 1.2) / bayCount;
      for (let b = 0; b < bayCount; b++) {
        const bx = -innerW * 0.5 + 0.6 + (b + 0.5) * bayW;
        const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.14, eaveY, 0.36), brushedAlumMat);
        frameL.position.set(bx - bayW * 0.48, eaveY * 0.5, 0.32);
        const glassDoor = new THREE.Mesh(new THREE.PlaneGeometry(bayW - 0.22, eaveY - 0.24), intGlassPhysMat);
        glassDoor.position.set(bx, eaveY * 0.5, 0.32);
        g.add(frameL, glassDoor);
      }
      const mrtTransom = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.22, 0.46), brushedAlumMat);
      mrtTransom.position.set(0, eaveY - 0.11, 0.34);
      const mrtHangingMat = new THREE.MeshBasicMaterial({
        map: createSignBoardTexture('MRT BANDAR UTAMA (SBK09) • PINTU B', 'DIRECT SHELTERED SKYWALK TO KAJANG LINE & 1POWERHOUSE', '#0c4a6e', '#ffffff', '#38bdf8', 1024, 160)
      });
      const mrtSign = new THREE.Mesh(
        new THREE.BoxGeometry(9.6, 1.05, 0.22),
        [brushedAlumMat, brushedAlumMat, brushedAlumMat, brushedAlumMat, mrtHangingMat, mrtHangingMat]
      );
      mrtSign.position.set(0, eaveY - 0.82, 1.22);
      for (const rx of [-3.8, 3.8]) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8), brushedAlumMat);
        rod.position.set(rx, eaveY - 0.28, 1.22);
        g.add(rod);
      }
      g.add(mrtTransom, mrtSign);
    }

    // 4. Sleek Brand-Matched Perpendicular Blade Sign (calibrated PBR emissive -> ZERO white-on-white blowout! Enabled on flagship stores too!)
    if (!isMrt) {
      const bladeTex = createBladeSignTexture(store);
      const bladeFace = new THREE.MeshStandardMaterial({
        map: bladeTex,
        emissive: '#ffffff',
        emissiveMap: bladeTex,
        emissiveIntensity: 0.22,
        roughness: 0.36,
        metalness: 0.06
      });
      const bladeTrim = prof.isLight ? brushedAlumMat : prof.facadeType === 'japanese-machiya' || prof.facadeType === 'korean-hanok' ? lightOakMat : matteSteelMat;
      const bladeMount = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.42), bladeTrim);
      bladeMount.position.set(-halfW + 0.08, eaveY - 0.38, 0.92);
      const blade = new THREE.Mesh(
        bladeGeo,
        [bladeFace, bladeFace, bladeTrim, bladeTrim, bladeTrim, bladeTrim]
      );
      blade.position.set(-halfW + 0.08, eaveY - 0.38, 1.28);
      g.add(bladeMount, blade);
    }

    root.add(g);

    // Register interactive storefront prompt in the concourse walkway directly in front of the store!
    let ix = store.x;
    let iz = store.z;
    if (store.side === 'N') iz += 3.2;
    else if (store.side === 'S') iz -= 3.2;
    else if (store.side === 'W') ix += 3.6;
    else if (store.side === 'E') ix -= 3.6;
    interactables.push({
      id: `store-${store.id}`,
      position: new THREE.Vector3(ix, floor.y + 1.35, iz),
      radius: Math.max(4.8, Math.min(7.8, store.width * 0.42)),
      priority: 1,
      prompt: `[E] Visit ${store.name} (Lot ${store.lot}) — ${store.subtitle}`,
      actionType: 'visit-store',
      store
    });
  }

  // ============================================================================
  // 5C. ARCHITECTURAL MALL FACILITIES, CAR PARK LOBBIES, CANOPY OVERLOOKS & TRANSIT PORTALS
  // (Authentic Real-World 1 Utama Facilities — NEVER Mistaken for Retail Storefronts!)
  // ============================================================================
  const facPlasterMat = new THREE.MeshStandardMaterial({ color: '#ece6db', roughness: 0.56, metalness: 0.04, envMapIntensity: 0.45 });
  const facConcMat = new THREE.MeshStandardMaterial({ color: '#5b626d', roughness: 0.86, metalness: 0.04 });
  const facBurgundyMat = new THREE.MeshStandardMaterial({ color: '#a10022', roughness: 0.42, metalness: 0.14 });
  const facSkyGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.06, 1.22, 1.36) });
  const facZoneMatCache = new Map();
  const getZoneMat = (hex) => {
    if (!facZoneMatCache.has(hex)) {
      facZoneMatCache.set(hex, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.40, metalness: 0.12, envMapIntensity: 0.52 }));
    }
    return facZoneMatCache.get(hex);
  };

  for (const fac of MALL_FACILITIES) {
    const floor = FLOORS[fac.floor];
    if (!floor) continue;
    const facH = floor.index === 5 ? 6.0 : 5.25;
    const halfW = fac.width * 0.5;
    const fg = new THREE.Group();
    let rotY = 0;
    if (fac.side === 'N') rotY = 0;
    else if (fac.side === 'S') rotY = Math.PI;
    else if (fac.side === 'W') rotY = Math.PI / 2;
    else if (fac.side === 'E') rotY = -Math.PI / 2;
    fg.position.set(fac.x, floor.y, fac.z);
    fg.rotation.y = rotY;

    const zoneMat = getZoneMat(fac.zoneColor || '#64748b');

    if (fac.facilityType === 'carpark-lobby') {
      // REAL 1 UTAMA COLOR-CODED CAR PARK ACCESS VESTIBULE:
      // Panelled architectural stone/plaster surround + zone color stripe + safety bollards + automatic sliding double glass doors into concrete carpark lift lobby + glowing 1PAY Autopay Kiosk!
      const doorW = Math.min(4.8, fac.width * 0.34);
      const sideW = Math.max(0.8, (fac.width - doorW) * 0.5);
      for (const s of [-1, 1]) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(sideW, facH, 0.56), facPlasterMat);
        wall.position.set(s * (doorW * 0.5 + sideW * 0.5), facH * 0.5, 0.10);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(sideW, 0.62, 0.60), zoneMat);
        stripe.position.set(s * (doorW * 0.5 + sideW * 0.5), 3.55, 0.12);
        const kick = new THREE.Mesh(new THREE.BoxGeometry(sideW, 0.24, 0.60), matteSteelMat);
        kick.position.set(s * (doorW * 0.5 + sideW * 0.5), 0.12, 0.12);
        // Architectural vertical stone-panel reveal grooves breaking up long side wall expanses!
        const revN = Math.max(1, Math.floor(sideW / 2.8));
        for (let r = 1; r <= revN; r++) {
          const rx = s * (doorW * 0.5 + (r / (revN + 1)) * sideW);
          const rev = new THREE.Mesh(new THREE.BoxGeometry(0.04, facH - 0.3, 0.61), matteSteelMat);
          rev.position.set(rx, facH * 0.5, 0.12);
          fg.add(rev);
        }
        // Safety yellow/steel carpark portal bollard flanking automatic sliding doors!
        const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.88, 12), zoneMat);
        bollard.position.set(s * (doorW * 0.5 + 0.36), 0.44, 0.64);
        const bolCap = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.14, 12), matteSteelMat);
        bolCap.position.set(s * (doorW * 0.5 + 0.36), 0.78, 0.64);
        fg.add(wall, stripe, kick, bollard, bolCap);
      }
      // Upper architectural transom bulkhead over automatic sliding vestibule doors
      const topWall = new THREE.Mesh(new THREE.BoxGeometry(doorW, facH - 2.9, 0.56), facPlasterMat);
      topWall.position.set(0, 2.9 + (facH - 2.9) * 0.5, 0.10);
      const topStripe = new THREE.Mesh(new THREE.BoxGeometry(doorW, 0.62, 0.60), zoneMat);
      topStripe.position.set(0, 3.55, 0.12);
      // Recessed Concrete Carpark Lift Vestibule with twin structural concrete columns & elevator doors visible through sliding glass!
      const vestD = 3.8;
      const vestFloor = new THREE.Mesh(new THREE.BoxGeometry(doorW + 2.4, 0.08, vestD), facConcMat);
      vestFloor.position.set(0, 0.03, -vestD * 0.5);
      const vestBack = new THREE.Mesh(new THREE.BoxGeometry(doorW + 2.4, 3.3, 0.20), facConcMat);
      vestBack.position.set(0, 1.65, -vestD);
      const vestBand = new THREE.Mesh(new THREE.BoxGeometry(doorW + 2.2, 0.58, 0.24), zoneMat);
      vestBand.position.set(0, 2.05, -vestD + 0.06);
      const vestCeil = new THREE.Mesh(new THREE.BoxGeometry(doorW + 2.4, 0.12, vestD), facConcMat);
      vestCeil.position.set(0, 3.22, -vestD * 0.5);
      const vestFluoro = new THREE.Mesh(new THREE.BoxGeometry(doorW * 0.76, 0.06, 0.20), intLightCoolMat);
      vestFluoro.position.set(0, 3.12, -vestD * 0.45);
      for (const cs of [-1, 1]) {
        const vCol = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.2, 0.42), facConcMat);
        vCol.position.set(cs * (doorW * 0.44), 1.6, -vestD * 0.62);
        const vColBand = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.45), zoneMat);
        vColBand.position.set(cs * (doorW * 0.44), 1.45, -vestD * 0.62);
        const liftDoor = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.25, 0.12), brushedAlumMat);
        liftDoor.position.set(cs * 1.15, 1.14, -vestD + 0.14);
        fg.add(vCol, vColBand, liftDoor);
      }
      // Automatic brushed-aluminum framed sliding double glass vestibule doors
      const doorFrameT = new THREE.Mesh(new THREE.BoxGeometry(doorW, 0.12, 0.16), brushedAlumMat);
      doorFrameT.position.set(0, 2.86, 0.24);
      const slideGlass = new THREE.Mesh(new THREE.PlaneGeometry(doorW - 0.16, 2.78), intGlassPhysMat);
      slideGlass.position.set(0, 1.40, 0.26);
      const centerStile = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.80, 0.09), brushedAlumMat);
      centerStile.position.set(0, 1.40, 0.26);
      // Directional Transit/Parking Overhead Illuminated Gantry Sign Board (clean P Car Park wayfinding!)
      const cpSignTex = createSignBoardTexture(`P  ${fac.name}`, '1PAY TICKETLESS LPR • AUTOPAY & CAR FINDER', '#18181b', '#ffffff', fac.zoneColor || '#eab308', 1024, 160);
      const cpSignMat = new THREE.MeshStandardMaterial({ map: cpSignTex, emissive: '#ffffff', emissiveMap: cpSignTex, emissiveIntensity: 0.42, roughness: 0.28 });
      const cpBoard = new THREE.Mesh(
        new THREE.BoxGeometry(Math.min(fac.width - 1.2, 7.6), 0.84, 0.22),
        [matteSteelMat, matteSteelMat, matteSteelMat, matteSteelMat, cpSignMat, cpSignMat]
      );
      cpBoard.position.set(0, 3.55, 0.62);
      // Authentic 1 Utama High-Visibility BRIGHT YELLOW Freestanding auto pay / 1PAY Kiosk (#438!)
      const kx = Math.min(halfW - 1.1, doorW * 0.5 + 1.35);
      const yellowAutoPayMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.28, metalness: 0.18 });
      const payBody = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.82, 0.48), yellowAutoPayMat);
      payBody.position.set(kx, 0.91, 0.68);
      const payAccent = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.26, 0.50), new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.35 }));
      payAccent.position.set(kx, 1.68, 0.68);
      const payScrTex = createSignBoardTexture('1PAY AUTOPAY', 'SCAN PLATE / TOUCH N GO', '#0f172a', '#ffffff', '#38bdf8', 256, 200);
      const payScr = new THREE.Mesh(
        new THREE.PlaneGeometry(0.50, 0.44),
        new THREE.MeshStandardMaterial({ map: payScrTex, emissive: '#ffffff', emissiveMap: payScrTex, emissiveIntensity: 0.72, roughness: 0.20 })
      );
      payScr.position.set(kx, 1.20, 0.92);
      addLocalContactShadow(fg, kx, 0.68, 1.35, 1.05, 0.018);
      fg.add(topWall, topStripe, vestFloor, vestBack, vestBand, vestCeil, vestFluoro, doorFrameT, slideGlass, centerStile, cpBoard, payBody, payAccent, payScr);
    } else if (fac.facilityType === 'canopy-overlook') {
      // REAL 3F RAINFOREST CANOPY OPEN ECO-OVERLOOK:
      // Warm travertine & slatted teak parapet + Fresnel glass balustrade + lush overflowing tropical palm/fern planters + slatted oak benches + bronze botanical plaque!
      const backScreen = new THREE.Mesh(new THREE.BoxGeometry(fac.width, facH, 0.28), facPlasterMat);
      backScreen.position.set(0, facH * 0.5, -2.6);
      const lowParapet = new THREE.Mesh(new THREE.BoxGeometry(fac.width - 0.6, 0.52, 0.54), ivoryStoneMat);
      lowParapet.position.set(0, 0.26, 0.24);
      const glassRail = new THREE.Mesh(new THREE.PlaneGeometry(fac.width - 0.8, 0.78), glassBalustradeMat);
      glassRail.position.set(0, 0.90, 0.26);
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(fac.width - 0.6, 0.06, 0.10), lightOakMat);
      topRail.position.set(0, 1.30, 0.26);
      fg.add(backScreen, lowParapet, glassRail, topRail);
      // Lush overflowing tropical planters & slatted oak rest benches along the canopy overlook!
      const numPlanters = Math.max(2, Math.floor(fac.width / 5.4));
      for (let p = 0; p < numPlanters; p++) {
        const px = -halfW + 2.2 + (p / Math.max(1, numPlanters - 1)) * (fac.width - 4.4);
        const pBox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.64, 0.96), ivoryStoneMat);
        pBox.position.set(px, 0.32, -1.25);
        const pCap = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.06, 1.02), lightOakMat);
        pCap.position.set(px, 0.66, -1.25);
        const palm = createIndoorPalm(1.05);
        palm.position.set(px, 0.66, -1.25);
        fg.add(pBox, pCap, palm);
        if (p < numPlanters - 1) {
          const bx = px + (fac.width - 4.4) / (2 * Math.max(1, numPlanters - 1));
          const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.10, 0.64), lightOakMat);
          benchSeat.position.set(bx, 0.46, -1.15);
          const benchLegL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.56), matteSteelMat);
          benchLegL.position.set(bx - 0.78, 0.22, -1.15);
          const benchLegR = benchLegL.clone();
          benchLegR.position.x = bx + 0.78;
          fg.add(benchSeat, benchLegL, benchLegR);
        }
      }
      // Subtle mounted bronze eco-info plaque
      const ecoMat = new THREE.MeshBasicMaterial({
        map: createSignBoardTexture('RAINFOREST CANOPY ECO-OVERLOOK', '1 UTAMA BIODIVERSITY • TROPICAL TREETOP WALK', '#064e3b', '#ecfdf5', '#34d399', 1024, 160)
      });
      const ecoPlaque = new THREE.Mesh(new THREE.BoxGeometry(Math.min(5.2, fac.width - 1.6), 0.62, 0.10), [brassGoldMat, brassGoldMat, brassGoldMat, brassGoldMat, ecoMat, ecoMat]);
      ecoPlaque.position.set(0, 2.35, -2.42);
      fg.add(ecoPlaque);
    } else if (fac.facilityType === 'valet-lobby') {
      // REAL LUXE G MAIN ENTRANCE & VALET PARKING / CENTRAL PARK LOBBY (Between Michael Kors & Coach — Verified #400-#402!)
      // Strictly inside z = 0..-1.96 so outer mall structural shell NEVER causes black void or side leaks!
      const lobW = fac.width;
      const lobD = 1.94;
      const marbleMat = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.18, metalness: 0.05 });
      const bronzeMat = new THREE.MeshStandardMaterial({ color: '#453b31', roughness: 0.32, metalness: 0.68 });
      const champGoldMat = new THREE.MeshStandardMaterial({ color: '#a89060', roughness: 0.28, metalness: 0.72 });
      const vistaMat = new THREE.MeshBasicMaterial({ map: createLuxeValetVistaTexture() });

      // Luminous sunlit Valet Porte-Cochere & Central Park trees backdrop right behind bronze glass automatic doors!
      const vistaBack = new THREE.Mesh(new THREE.PlaneGeometry(lobW - 0.3, facH - 0.1), vistaMat);
      vistaBack.position.set(0, facH * 0.5, -lobD);
      const lobFloor = new THREE.Mesh(new THREE.BoxGeometry(lobW, 0.08, lobD + 0.4), marbleMat);
      lobFloor.position.set(0, 0.03, -lobD * 0.5 + 0.1);
      const lobCeil = new THREE.Mesh(new THREE.BoxGeometry(lobW, 0.14, lobD + 0.4), satinWhiteMat);
      lobCeil.position.set(0, facH - 0.08, -lobD * 0.5 + 0.1);
      fg.add(vistaBack, lobFloor, lobCeil);

      // Flanking Calacatta marble piers & warm bronze glass door mullions
      for (const s of [-1, 1]) {
        const sWall = new THREE.Mesh(new THREE.BoxGeometry(0.68, facH, lobD + 0.25), marbleMat);
        sWall.position.set(s * (lobW * 0.5 - 0.34), facH * 0.5, -lobD * 0.5 + 0.08);
        const bTrim = new THREE.Mesh(new THREE.BoxGeometry(0.14, facH, 0.26), bronzeMat);
        bTrim.position.set(s * (lobW * 0.5 - 0.72), facH * 0.5, 0.18);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.58, 14), marbleMat);
        pot.position.set(s * (lobW * 0.5 - 1.18), 0.29, -0.45);
        const palm = createIndoorPalm(0.78);
        palm.position.set(s * (lobW * 0.5 - 1.18), 0.58, -0.45);
        fg.add(sWall, bTrim, pot, palm);
      }
      // Bronze-framed automatic sliding glass vestibule doors + sunlit transom
      for (const bx of [-2.4, 0, 2.4]) {
        const mul = new THREE.Mesh(new THREE.BoxGeometry(0.08, facH - 0.2, 0.16), bronzeMat);
        mul.position.set(bx, facH * 0.5, -0.88);
        fg.add(mul);
      }
      const doorTransom = new THREE.Mesh(new THREE.BoxGeometry(lobW - 1.2, 0.14, 0.18), bronzeMat);
      doorTransom.position.set(0, 3.05, -0.88);
      const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(lobW - 1.4, facH - 0.4), intGlassPhysMat);
      doorGlass.position.set(0, facH * 0.5, -0.86);
      fg.add(doorTransom, doorGlass);

      // Signature Matte-Black & Brushed Champagne-Gold Hanging LUXE G Directional Blade Sign (#401!)
      const luxeSignTex = createSignBoardTexture('LUXE G  •  VALET PARKING & MAIN ENTRANCE', '← TOILET / LIFT   |   ↑ CENTRAL PARK & VALET   |   → TAXI & E-HAILING', '#1c1814', '#ffffff', '#d4af37', 1024, 160);
      const luxeSignMat = new THREE.MeshStandardMaterial({ map: luxeSignTex, emissive: '#ffffff', emissiveMap: luxeSignTex, emissiveIntensity: 0.42, roughness: 0.24 });
      const signW = Math.min(lobW - 1.2, 8.8);
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(signW, 0.86, 0.18),
        [champGoldMat, champGoldMat, champGoldMat, champGoldMat, luxeSignMat, luxeSignMat]
      );
      blade.position.set(0, facH - 0.88, 0.92);
      for (const rx of [-signW * 0.36, signW * 0.36]) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.56, 8), bronzeMat);
        rod.position.set(rx, facH - 0.22, 0.92);
        fg.add(rod);
      }
      fg.add(blade);
    } else if (fac.facilityType === 'sensory-baby') {
      // REAL 2F OVAL SENSORY POD (Vibrant Jigsaw Puzzle Wall) + WARM WOOD BABY ROOM (#159, #161 — ZERO Surau!)
      const podW = fac.width;
      const leftW = podW * 0.52;
      const rightW = podW - leftW;
      const sensMat = new THREE.MeshStandardMaterial({ map: createSensoryPodTexture(), emissive: '#ffffff', emissiveMap: createSensoryPodTexture(), emissiveIntensity: 0.22, roughness: 0.38 });
      const woodMat = new THREE.MeshStandardMaterial({ color: '#9c7c5b', roughness: 0.46 });
      const blueDoorMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.40 });
      // Left half: Jigsaw-puzzle SENSORY POD facade + recessed calm doorway
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(leftW, facH, 0.36), sensMat);
      leftWall.position.set(-podW * 0.5 + leftW * 0.5, facH * 0.5, 0.02);
      const sensDoor = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.35, 0.42), new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.35 }));
      sensDoor.position.set(-podW * 0.5 + leftW * 0.5, 1.18, 0.06);
      // Right half: Warm wood BABY ROOM fascia + muted grey-blue double doors + red AED box
      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(rightW, facH, 0.36), woodMat);
      rightWall.position.set(podW * 0.5 - rightW * 0.5, facH * 0.5, 0.02);
      const babyDoor = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.35, 0.42), blueDoorMat);
      babyDoor.position.set(podW * 0.5 - rightW * 0.5, 1.18, 0.06);
      const babySignTex = createSignBoardTexture('BABY ROOM', 'NURSING  •  CHANGING  •  FAMILY CARE', '#5c4330', '#ffffff', '#facc15', 512, 128);
      const babySign = new THREE.Mesh(new THREE.PlaneGeometry(rightW - 0.5, 0.72), new THREE.MeshBasicMaterial({ map: babySignTex }));
      babySign.position.set(podW * 0.5 - rightW * 0.5, 3.35, 0.22);
      const aedBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.14), new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.32 }));
      aedBox.position.set(podW * 0.5 - 0.45, 1.55, 0.22);
      fg.add(leftWall, sensDoor, rightWall, babyDoor, babySign, aedBox);
    } else if (fac.facilityType === 'transit-portal') {
      // SUNLIT GLAZED TRANSIT PORTAL (Strictly inside z = 0..-1.96 -> ZERO outer black wall clipping & ZERO cyan side leaks!)
      const tunW = Math.min(fac.width - 0.6, 12.6);
      const tunD = 1.94;
      const vistaMat = new THREE.MeshBasicMaterial({ map: createLuxeValetVistaTexture() });
      const skyEnd = new THREE.Mesh(new THREE.PlaneGeometry(tunW - 0.2, facH - 0.15), vistaMat);
      skyEnd.position.set(0, facH * 0.5, -tunD);
      const tunFloor = new THREE.Mesh(new THREE.BoxGeometry(fac.width, 0.08, tunD + 0.4), intFloorLightMat);
      tunFloor.position.set(0, 0.03, -tunD * 0.5 + 0.1);
      const tunCeil = new THREE.Mesh(new THREE.BoxGeometry(tunW + 0.4, 0.16, tunD + 0.3), satinWhiteMat);
      tunCeil.position.set(0, facH - 0.10, -tunD * 0.5 + 0.1);
      fg.add(skyEnd, tunFloor, tunCeil);
      for (const s of [-1, 1]) {
        const sWall = new THREE.Mesh(new THREE.BoxGeometry(0.32, facH, tunD + 0.2), facPlasterMat);
        sWall.position.set(s * (tunW * 0.5), facH * 0.5, -tunD * 0.5 + 0.05);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.52, 12), ivoryStoneMat);
        pot.position.set(s * (tunW * 0.5 - 0.65), 0.26, -0.55);
        const palm = createIndoorPalm(0.76);
        palm.position.set(s * (tunW * 0.5 - 0.65), 0.52, -0.55);
        fg.add(sWall, pot, palm);
      }
      if (fac.width > tunW + 1.0) {
        const flankW = (fac.width - tunW) * 0.5;
        for (const s of [-1, 1]) {
          const fw = new THREE.Mesh(new THREE.BoxGeometry(flankW, facH, 0.52), facPlasterMat);
          fw.position.set(s * (tunW * 0.5 + flankW * 0.5), facH * 0.5, 0.16);
          const fStripe = new THREE.Mesh(new THREE.BoxGeometry(flankW, 0.48, 0.56), zoneMat);
          fStripe.position.set(s * (tunW * 0.5 + flankW * 0.5), 3.72, 0.18);
          fg.add(fw, fStripe);
        }
      }
      const bayCount = Math.max(2, Math.min(5, Math.round(tunW / 2.6)));
      const bayW = tunW / bayCount;
      for (let b = 0; b < bayCount; b++) {
        const bx = -tunW * 0.5 + (b + 0.5) * bayW;
        const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.12, facH, 0.26), brushedAlumMat);
        mullion.position.set(bx - bayW * 0.5, facH * 0.5, 0.18);
        if (Math.abs(bx) > bayW * 0.85) {
          const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(bayW - 0.16, facH - 0.45), intGlassPhysMat);
          glassPane.position.set(bx, facH * 0.5, 0.18);
          fg.add(glassPane);
        }
        fg.add(mullion);
      }
      const transom = new THREE.Mesh(new THREE.BoxGeometry(fac.width, 0.24, 0.44), brushedAlumMat);
      transom.position.set(0, facH - 0.18, 0.24);
      const transitSignTex = createSignBoardTexture(fac.name, fac.subtitle, '#0c4a6e', '#ffffff', fac.zoneColor || '#38bdf8', 1024, 160);
      const transitSignMat = new THREE.MeshStandardMaterial({ map: transitSignTex, emissive: '#ffffff', emissiveMap: transitSignTex, emissiveIntensity: 0.42, roughness: 0.26 });
      const signW = Math.min(fac.width - 1.0, 9.6);
      const gantry = new THREE.Mesh(
        new THREE.BoxGeometry(signW, 0.96, 0.22),
        [brushedAlumMat, brushedAlumMat, brushedAlumMat, brushedAlumMat, transitSignMat, transitSignMat]
      );
      gantry.position.set(0, facH - 0.96, 0.95);
      for (const rx of [-signW * 0.38, signW * 0.38]) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.52, 8), brushedAlumMat);
        rod.position.set(rx, facH - 0.26, 0.95);
        fg.add(rod);
      }
      fg.add(transom, gantry);
    } else if (fac.facilityType === 'restroom-surau' || fac.facilityType === 'surau') {
      // REAL 1 UTAMA RECESSED RESTROOM, BABY CARE & SURAU SERVICE CORRIDOR (NEVER A STOREFRONT!):
      //  • `fac-surau-g1ue` (#506): Authentic 1 Utama E bright-white split architectural header (`TOILET • BABY ROOM | LIFT • PRAYER ROOM` with crisp dark icons & white/silver fascia — ZERO dark-brown fascia!)
      //  • `hasSurau === false` WC-only corridors: Crisp `RESTROOMS & LIFT LOBBY` headers with ZERO Surau/mosque icons!
      const is1UESplit = fac.id === 'fac-surau-g1ue' || fac.wing === '1 Utama E';
      const hasSurauHere = fac.hasSurau !== false;
      const portalW = Math.min(3.8, Math.max(3.2, fac.width - 1.2));
      const sideWallW = Math.max(0.4, (fac.width - portalW) * 0.5);
      // Strictly stay INSIDE the 2.08m building shell perimeter (z = 0..-2.02) so the outer black structural mall wall NEVER occludes the washroom & Surau interior!
      const corrD = 2.02;
      const corrH = 3.65;
      const bronzeTrimMat = is1UESplit
        ? brushedAlumMat
        : new THREE.MeshStandardMaterial({ color: '#443a31', roughness: 0.34, metalness: 0.58 });
      const portalWallMat = is1UESplit ? satinWhiteMat : facPlasterMat;
      const walnutDoorMat = new THREE.MeshStandardMaterial({ color: '#5b3d28', roughness: 0.44, metalness: 0.08 });
      const tileFloorMat = new THREE.MeshStandardMaterial({ color: '#dfd9ce', roughness: 0.28, metalness: 0.05 });
      const corrLitWallMat = new THREE.MeshStandardMaterial({ color: '#e6ded0', emissive: '#382f22', emissiveIntensity: 0.26, roughness: 0.72 });

      // 1. Plain honed-travertine (or 1UE bright architectural white) mall wall flanking the narrow corridor opening (blends into mall architecture — ZERO retail fascia!)
      for (const s of [-1, 1]) {
        const sx = s * (portalW * 0.5 + sideWallW * 0.5);
        const flankWall = new THREE.Mesh(new THREE.BoxGeometry(sideWallW, facH, 0.52), portalWallMat);
        flankWall.position.set(sx, facH * 0.5, 0.08);
        const baseSkirt = new THREE.Mesh(new THREE.BoxGeometry(sideWallW, 0.22, 0.56), bronzeTrimMat);
        baseSkirt.position.set(sx, 0.11, 0.09);
        const topCornice = new THREE.Mesh(new THREE.BoxGeometry(sideWallW, 0.14, 0.58), is1UESplit ? satinWhiteMat : ivoryStoneMat);
        topCornice.position.set(sx, facH - 0.08, 0.10);
        fg.add(flankWall, baseSkirt, topCornice);

        // Subtle architectural stone reveal joints on wide mall service walls
        const revN = Math.max(1, Math.floor(sideWallW / 2.6));
        for (let r = 1; r <= revN; r++) {
          const rx = s * (portalW * 0.5 + (r / (revN + 1)) * sideWallW);
          const rev = new THREE.Mesh(new THREE.BoxGeometry(0.035, facH - 0.36, 0.54), bronzeTrimMat);
          rev.position.set(rx, facH * 0.5, 0.09);
          fg.add(rev);
        }

        // On wide service corridor stretches (e.g. 3F Highstreet / 1UE), add mall oak benches & indoor potted palms (authentic concourse rest area!)
        if (sideWallW >= 3.2) {
          const benchCount = Math.min(3, Math.floor(sideWallW / 4.2));
          for (let b = 0; b < benchCount; b++) {
            const bx = s * (portalW * 0.5 + 2.2 + b * 4.2);
            if (Math.abs(bx) > halfW - 1.4) continue;
            const bSeat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.09, 0.62), lightOakMat);
            bSeat.position.set(bx, 0.46, 0.68);
            const bLegL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.44, 0.52), bronzeTrimMat);
            bLegL.position.set(bx - 0.84, 0.22, 0.68);
            const bLegR = bLegL.clone();
            bLegR.position.x = bx + 0.84;
            fg.add(bSeat, bLegL, bLegR);
            addLocalContactShadow(fg, bx, 0.68, 2.35, 0.85, 0.016);
          }
          const potX = s * (portalW * 0.5 + 0.82);
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.62, 14), ivoryStoneMat);
          pot.position.set(potX, 0.31, 0.66);
          const palm = createIndoorPalm(0.68);
          palm.position.set(potX, 0.60, 0.66);
          fg.add(pot, palm);
        }
      }

      // Upper lintel over the recessed corridor opening (bright-white on 1UE #506!)
      const lintelH = Math.max(0.8, facH - corrH);
      const lintelWall = new THREE.Mesh(new THREE.BoxGeometry(portalW + 0.16, lintelH, 0.52), portalWallMat);
      lintelWall.position.set(0, corrH + lintelH * 0.5, 0.08);
      // Clean architectural portal jambs & header framing the service passage
      const pHead = new THREE.Mesh(new THREE.BoxGeometry(portalW + 0.26, 0.14, 0.62), bronzeTrimMat);
      pHead.position.set(0, corrH, 0.10);
      for (const s of [-1, 1]) {
        const pJamb = new THREE.Mesh(new THREE.BoxGeometry(0.14, corrH, 0.62), bronzeTrimMat);
        pJamb.position.set(s * (portalW * 0.5 + 0.06), corrH * 0.5, 0.10);
        fg.add(pJamb);
      }
      fg.add(lintelWall, pHead);

      // Build dedicated high-fidelity header texture for 1UE Bright-White Split Sign (#506) and WC-Only Corridors (ZERO Surau/mosque icons when hasSurau === false!)
      let wayTex;
      if (fac.id === 'fac-surau-g1ue') {
        const sc = document.createElement('canvas');
        sc.width = 1024;
        sc.height = 176;
        const sctx = sc.getContext('2d');
        // Authentic 1 Utama E bright-white split architectural header (#506)
        const sbg = sctx.createLinearGradient(0, 0, 0, 176);
        sbg.addColorStop(0, '#ffffff');
        sbg.addColorStop(1, '#f1f5f9');
        sctx.fillStyle = sbg;
        sctx.fillRect(0, 0, 1024, 176);
        sctx.strokeStyle = '#cbd5e1';
        sctx.lineWidth = 4;
        sctx.strokeRect(4, 4, 1016, 168);
        // Center split divider bar
        sctx.fillStyle = '#18181b';
        sctx.fillRect(510, 22, 4, 132);
        // Crisp dark vector icons on LEFT HALF (Male | Female | Baby)
        sctx.fillStyle = '#18181b';
        // Male icon
        sctx.beginPath(); sctx.arc(46, 56, 8, 0, Math.PI * 2); sctx.fill();
        sctx.fillRect(37, 67, 18, 22); sctx.fillRect(38, 89, 6, 19); sctx.fillRect(48, 89, 6, 19);
        // Female icon
        sctx.beginPath(); sctx.arc(84, 56, 8, 0, Math.PI * 2); sctx.fill();
        sctx.beginPath(); sctx.moveTo(77, 67); sctx.lineTo(91, 67); sctx.lineTo(98, 92); sctx.lineTo(70, 92); sctx.closePath(); sctx.fill();
        sctx.fillRect(77, 92, 5, 16); sctx.fillRect(86, 92, 5, 16);
        // Baby Room icon
        sctx.beginPath(); sctx.arc(124, 62, 7, 0, Math.PI * 2); sctx.fill();
        sctx.fillRect(114, 73, 20, 18); sctx.fillRect(115, 93, 7, 13); sctx.fillRect(126, 93, 7, 13);
        // Left Half Text: TOILET • BABY ROOM
        sctx.textAlign = 'left';
        sctx.font = '800 30px "Plus Jakarta Sans", "Montserrat", sans-serif';
        sctx.fillText('TOILET  •  BABY ROOM', 154, 76, 340);
        sctx.fillStyle = '#475569';
        sctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
        sctx.fillText('TANDAS LELAKI & WANITA  •  OKU  •  BILIK BAYI', 154, 118, 340);
        // Crisp dark vector icons on RIGHT HALF (Lift Cabin | Prayer Room Dome)
        sctx.fillStyle = '#18181b';
        sctx.strokeStyle = '#18181b';
        sctx.lineWidth = 3;
        sctx.strokeRect(536, 54, 34, 50);
        sctx.beginPath(); sctx.arc(547, 70, 4, 0, Math.PI * 2); sctx.arc(559, 70, 4, 0, Math.PI * 2); sctx.fill();
        sctx.fillRect(543, 76, 8, 18); sctx.fillRect(555, 76, 8, 18);
        // Dark Prayer Dome icon
        sctx.beginPath(); sctx.arc(602, 82, 16, Math.PI, 0); sctx.lineTo(618, 102); sctx.lineTo(586, 102); sctx.closePath(); sctx.fill();
        sctx.fillRect(600, 54, 4, 14);
        // Right Half Text: LIFT • PRAYER ROOM
        sctx.font = '800 30px "Plus Jakarta Sans", "Montserrat", sans-serif';
        sctx.fillText('LIFT  •  PRAYER ROOM', 636, 76, 360);
        sctx.fillStyle = '#475569';
        sctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
        sctx.fillText('LIF  •  SURAU LELAKI & WANITA  •  WUDHU', 636, 118, 360);
        wayTex = new THREE.CanvasTexture(sc);
        wayTex.colorSpace = THREE.SRGBColorSpace;
      } else if (!hasSurauHere) {
        // WC-only corridors (`hasSurau: false`): Crisp RESTROOMS & LIFT LOBBY header with ZERO Surau/mosque icons!
        const wc = document.createElement('canvas');
        wc.width = 1024;
        wc.height = 160;
        const wctx = wc.getContext('2d');
        const bgHex0 = is1UESplit ? '#ffffff' : '#24414b';
        const bgHex1 = is1UESplit ? '#f1f5f9' : '#182d35';
        const fgCol = is1UESplit ? '#18181b' : '#f8fafc';
        const subCol = is1UESplit ? '#475569' : '#7dd3fc';
        const wbg = wctx.createLinearGradient(0, 0, 0, 160);
        wbg.addColorStop(0, bgHex0);
        wbg.addColorStop(1, bgHex1);
        wctx.fillStyle = wbg;
        wctx.fillRect(0, 0, 1024, 160);
        wctx.strokeStyle = is1UESplit ? '#cbd5e1' : '#7dd3fc';
        wctx.lineWidth = 4;
        wctx.strokeRect(5, 5, 1014, 150);
        wctx.fillStyle = fgCol;
        wctx.strokeStyle = fgCol;
        // Male icon
        wctx.beginPath(); wctx.arc(64, 54, 9, 0, Math.PI * 2); wctx.fill();
        wctx.fillRect(54, 67, 20, 24); wctx.fillRect(55, 91, 7, 22); wctx.fillRect(66, 91, 7, 22);
        // Female icon
        wctx.beginPath(); wctx.arc(112, 54, 9, 0, Math.PI * 2); wctx.fill();
        wctx.beginPath(); wctx.moveTo(105, 67); wctx.lineTo(119, 67); wctx.lineTo(127, 96); wctx.lineTo(97, 96); wctx.closePath(); wctx.fill();
        wctx.fillRect(104, 96, 6, 17); wctx.fillRect(114, 96, 6, 17);
        // OKU wheelchair icon
        wctx.lineWidth = 4;
        wctx.beginPath(); wctx.arc(166, 56, 7, 0, Math.PI * 2); wctx.fill();
        wctx.beginPath(); wctx.arc(164, 94, 15, 0.25 * Math.PI, 1.55 * Math.PI); wctx.stroke();
        // Lift cabin icon (ZERO mosque/Surau icon!)
        wctx.lineWidth = 3;
        wctx.strokeRect(204, 52, 38, 56);
        wctx.beginPath(); wctx.arc(217, 70, 4, 0, Math.PI * 2); wctx.arc(229, 70, 4, 0, Math.PI * 2); wctx.fill();
        wctx.fillRect(213, 77, 8, 20); wctx.fillRect(225, 77, 8, 20);
        // Divider
        wctx.fillRect(262, 34, 3, 92);
        wctx.textAlign = 'left';
        wctx.font = '800 32px "Plus Jakarta Sans", "Montserrat", sans-serif';
        wctx.fillText('RESTROOMS & LIFT LOBBY', 286, 68, 706);
        wctx.fillStyle = subCol;
        wctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
        wctx.fillText('TANDAS LELAKI & WANITA  •  OKU  •  BILIK BAYI  •  LIF LOBI', 286, 112, 706);
        wayTex = new THREE.CanvasTexture(wc);
        wayTex.colorSpace = THREE.SRGBColorSpace;
      } else {
        wayTex = createRestroomWayfindingTexture(fac.surauGender || 'SURAU');
      }
      const wayMat = new THREE.MeshStandardMaterial({ map: wayTex, emissive: '#ffffff', emissiveMap: wayTex, emissiveIntensity: is1UESplit ? 0.46 : 0.38, roughness: 0.28 });
      const waySign = new THREE.Mesh(
        new THREE.BoxGeometry(Math.min(portalW - 0.15, 3.45), 0.50, 0.10),
        [bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, wayMat, wayMat]
      );
      waySign.position.set(0, corrH - 0.34, 0.36);
      for (const rx of [-1.1, 1.1]) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 8), bronzeTrimMat);
        rod.position.set(rx, corrH - 0.08, 0.36);
        fg.add(rod);
      }
      fg.add(waySign);
      // On 1UE (#506) & WC-only corridors, also mount a wide architectural fascia header band directly across the upper portal lintel for long-range concourse legibility!
      if (is1UESplit || !hasSurauHere) {
        const upperHeaderW = Math.min(fac.width - 0.6, 5.2);
        const upperHeader = new THREE.Mesh(
          new THREE.BoxGeometry(upperHeaderW, 0.78, 0.14),
          [bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, wayMat, wayMat]
        );
        upperHeader.position.set(0, corrH + 0.52, 0.38);
        fg.add(upperHeader);
      }

      // 2. WARMLY-LIT RECESSED WASHROOM & SURAU SERVICE CORRIDOR INTERIOR (z = 0..-2.02, 100% VISIBLE & UNOCCLUDED!)
      const cFloor = new THREE.Mesh(new THREE.BoxGeometry(portalW + 0.3, 0.08, corrD + 0.2), tileFloorMat);
      cFloor.position.set(0, 0.02, -corrD * 0.5);
      const cCeil = new THREE.Mesh(new THREE.BoxGeometry(portalW + 0.3, 0.12, corrD + 0.2), corrLitWallMat);
      cCeil.position.set(0, corrH + 0.04, -corrD * 0.5);
      const cBackWall = new THREE.Mesh(new THREE.BoxGeometry(portalW + 0.3, corrH, 0.18), corrLitWallMat);
      cBackWall.position.set(0, corrH * 0.5, -corrD);
      // Recessed warm ceiling cove light strips illuminating the washroom & Surau foyer!
      for (const cz of [-0.65, -1.55]) {
        const cove = new THREE.Mesh(new THREE.BoxGeometry(portalW * 0.62, 0.05, 0.22), intLightWarmMat);
        cove.position.set(0, corrH - 0.03, cz);
        fg.add(cove);
      }
      fg.add(cFloor, cCeil, cBackWall);

      // Left & Right side walls of the recessed washroom corridor
      for (const s of [-1, 1]) {
        const sWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, corrH, corrD), corrLitWallMat);
        sWall.position.set(s * (portalW * 0.5 + 0.06), corrH * 0.5, -corrD * 0.5);
        fg.add(sWall);
      }

      // 3. LEFT SIDE (z = -0.82): GENTS / LELAKI RESTROOM baffled privacy entry + bronze plaque!
      const gentsBaffle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.52, 0.92), walnutDoorMat);
      gentsBaffle.position.set(-portalW * 0.5 + 0.28, 1.26, -0.82);
      const gentsGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.65), intLightWarmMat);
      gentsGlow.rotation.y = Math.PI * 0.5;
      gentsGlow.position.set(-portalW * 0.5 + 0.02, 1.52, -0.88);
      const gentsPlaqueTex = createDoorPlaqueTexture('male', 'GENTS', 'TANDAS LELAKI', '#272320', '#f8fafc', '#c9a96e');
      const gentsPlaque = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.24, 0.72),
        [
          new THREE.MeshStandardMaterial({ map: gentsPlaqueTex, emissive: '#ffffff', emissiveMap: gentsPlaqueTex, emissiveIntensity: 0.34, roughness: 0.3 }),
          bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, bronzeTrimMat
        ]
      );
      gentsPlaque.position.set(-portalW * 0.5 + 0.36, 2.02, -0.78);
      fg.add(gentsBaffle, gentsGlow, gentsPlaque);

      // 4. RIGHT SIDE (z = -0.82): LADIES / WANITA RESTROOM baffled privacy entry + OKU/BABY CARE plaque!
      const ladiesBaffle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.52, 0.92), walnutDoorMat);
      ladiesBaffle.position.set(portalW * 0.5 - 0.28, 1.26, -0.82);
      const ladiesGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.65), intLightWarmMat);
      ladiesGlow.rotation.y = -Math.PI * 0.5;
      ladiesGlow.position.set(portalW * 0.5 - 0.02, 1.52, -0.88);
      const ladiesPlaqueTex = createDoorPlaqueTexture('female', 'LADIES', 'TANDAS WANITA', '#272320', '#f8fafc', '#c9a96e');
      const ladiesPlaque = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.24, 0.72),
        [
          bronzeTrimMat,
          new THREE.MeshStandardMaterial({ map: ladiesPlaqueTex, emissive: '#ffffff', emissiveMap: ladiesPlaqueTex, emissiveIntensity: 0.34, roughness: 0.3 }),
          bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, bronzeTrimMat
        ]
      );
      ladiesPlaque.position.set(portalW * 0.5 - 0.36, 2.02, -0.78);

      const babyPlaqueTex = createDoorPlaqueTexture('baby', 'BABY & OKU', 'BILIK BAYI / OKU', '#272320', '#f8fafc', '#c9a96e');
      const babyPlaque = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.22, 0.66),
        [
          bronzeTrimMat,
          new THREE.MeshStandardMaterial({ map: babyPlaqueTex, emissive: '#ffffff', emissiveMap: babyPlaqueTex, emissiveIntensity: 0.32, roughness: 0.3 }),
          bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, bronzeTrimMat
        ]
      );
      babyPlaque.position.set(portalW * 0.5 - 0.08, 1.68, -1.60);
      fg.add(ladiesBaffle, ladiesGlow, ladiesPlaque, babyPlaque);

      // 5. TUCKED INSIDE RIGHT BESIDE THE TOILETS (z = -1.90): THE SURAU / PRAYER ROOM (ONLY when fac.hasSurau !== false!)
      if (fac.hasSurau !== false) {
        const surauDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.92, 2.48, 0.14), bronzeTrimMat);
        surauDoorFrame.position.set(0, 1.24, -corrD + 0.12);
        const surauDoorL = new THREE.Mesh(new THREE.BoxGeometry(0.82, 2.34, 0.08), walnutDoorMat);
        surauDoorL.position.set(-0.44, 1.18, -corrD + 0.16);
        const surauDoorR = new THREE.Mesh(new THREE.BoxGeometry(0.82, 2.34, 0.08), walnutDoorMat);
        surauDoorR.position.set(0.44, 1.18, -corrD + 0.16);
        for (const hx of [-0.12, 0.12]) {
          const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), brassGoldMat);
          handle.position.set(hx, 1.12, -corrD + 0.24);
          fg.add(handle);
        }
        for (const s of [-1, 1]) {
          for (let sl = 0; sl < 3; sl++) {
            const slat = new THREE.Mesh(new THREE.BoxGeometry(0.048, 2.46, 0.10), vertOakMat);
            slat.position.set(s * (1.06 + sl * 0.16), 1.23, -corrD + 0.16);
            fg.add(slat);
          }
        }
        const shoeRackBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.52, 0.58), lightOakMat);
        shoeRackBase.position.set(-portalW * 0.5 + 0.24, 0.26, -1.62);
        const shoeShelf = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.62), walnutDoorMat);
        shoeShelf.position.set(-portalW * 0.5 + 0.24, 0.54, -1.62);
        const surauPlaqueTex = createDoorPlaqueTexture('surau', fac.surauGender || 'SURAU', 'PRAYER ROOM • WUDHU INSIDE', '#064e3b', '#ecfdf5', '#d4af37');
        const surauPlaqueMat = new THREE.MeshStandardMaterial({ map: surauPlaqueTex, emissive: '#ffffff', emissiveMap: surauPlaqueTex, emissiveIntensity: 0.36, roughness: 0.30 });
        const surauPlaque = new THREE.Mesh(
          new THREE.BoxGeometry(1.42, 0.38, 0.07),
          [brassGoldMat, brassGoldMat, brassGoldMat, brassGoldMat, surauPlaqueMat, surauPlaqueMat]
        );
        surauPlaque.position.set(0, 2.74, -corrD + 0.22);
        fg.add(surauDoorFrame, surauDoorL, surauDoorR, shoeRackBase, shoeShelf, surauPlaque);
      } else {
        // WC-only & Lift Lobby rear marble vanity mirror & lift doors (NO false Surau!)
        const liftFrame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.42, 0.14), brushedAlumMat);
        liftFrame.position.set(0, 1.21, -corrD + 0.12);
        const liftDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.64, 2.28, 0.08), new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.24, metalness: 0.82 }));
        liftDoorPanel.position.set(0, 1.14, -corrD + 0.16);
        const wcOnlyTex = createSignBoardTexture('LIFT LOBBY • TOILETS', 'GENTS  •  LADIES  •  OKU  •  BABY CARE', '#2b4c57', '#ffffff', '#7dd3fc', 512, 128);
        const wcOnlySign = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 0.42), new THREE.MeshBasicMaterial({ map: wcOnlyTex }));
        wcOnlySign.position.set(0, 2.76, -corrD + 0.22);
        fg.add(liftFrame, liftDoorPanel, wcOnlySign);
      }
    } else {
      // ONECARD CUSTOMER SERVICE & CONCIERGE LOUNGE:
      // Official 1 Utama burgundy (#a10022) & champagne-gold feature wall + recessed marble customer service desk + dual monitors + lounge seating!
      const cWall = new THREE.Mesh(new THREE.BoxGeometry(fac.width, facH, 0.42), facPlasterMat);
      cWall.position.set(0, facH * 0.5, -2.2);
      const burgFeature = new THREE.Mesh(new THREE.BoxGeometry(Math.min(fac.width - 1.4, 7.6), facH - 0.5, 0.16), facBurgundyMat);
      burgFeature.position.set(0, facH * 0.5, -1.94);
      const cFloor = new THREE.Mesh(new THREE.BoxGeometry(fac.width, 0.08, 2.8), intFloorLightMat);
      cFloor.position.set(0, 0.03, -0.95);
      const cDesk = new THREE.Mesh(new THREE.BoxGeometry(Math.min(fac.width - 2.4, 4.8), 1.04, 1.05), facBurgundyMat);
      cDesk.position.set(0, 0.52, -0.45);
      const cTop = new THREE.Mesh(new THREE.BoxGeometry(Math.min(fac.width - 2.2, 5.0), 0.09, 1.16), cafeMarbleMat);
      cTop.position.set(0, 1.08, -0.45);
      const cSignMat = new THREE.MeshBasicMaterial({
        map: createSignBoardTexture(fac.name, '1 UTAMA OFFICIAL CUSTOMER SERVICE • ONECARD & 1PAY', '#a10022', '#ffffff', '#e9b03f', 1024, 160)
      });
      const cPlaque = new THREE.Mesh(
        new THREE.BoxGeometry(Math.min(fac.width - 2.0, 6.2), 0.78, 0.10),
        [brassGoldMat, brassGoldMat, brassGoldMat, brassGoldMat, cSignMat, cSignMat]
      );
      cPlaque.position.set(0, 3.15, -1.82);
      fg.add(cWall, burgFeature, cFloor, cDesk, cTop, cPlaque);
    }

    root.add(fg);

    // Interactive facility access prompt (clearly marked as Facility, NEVER "Visit Store"!)
    let fx = fac.x;
    let fz = fac.z;
    if (fac.side === 'N') fz += 3.2;
    else if (fac.side === 'S') fz -= 3.2;
    else if (fac.side === 'W') fx += 3.6;
    else if (fac.side === 'E') fx -= 3.6;
    interactables.push({
      id: `facility-${fac.id}`,
      position: new THREE.Vector3(fx, floor.y + 1.35, fz),
      radius: Math.max(4.6, Math.min(7.2, fac.width * 0.36)),
      priority: 1,
      prompt: `[E] ${fac.name} (${fac.wing}) — ${fac.subtitle}`,
      actionType: 'open-directory'
    });
  }

  // ==========================================================================
  // 6. 16 BESPOKE BRAND-THEMED REAL 1 UTAMA STANDALONE CONCOURSE BOOTHS!
  // (Each booth has its OWN distinct real-world 1U shape, color, canopy, props & character — ZERO generic 4-post boxes!)
  // ==========================================================================
  const counterMarbleMat = new THREE.MeshStandardMaterial({ color: '#ece9e2', roughness: 0.26, metalness: 0.06, envMapIntensity: 0.72 });
  const leatherBenchMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.44, metalness: 0.1 });
  const staffSkinMat = new THREE.MeshStandardMaterial({ color: '#e2a982', roughness: 0.65 });
  const staffHairMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.55 });
  const staffApronMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.58 });
  const kioskSoffitMat = new THREE.MeshStandardMaterial({
    map: createKioskSoffitTexture(),
    emissive: '#fffbeb',
    emissiveIntensity: 0.36,
    roughness: 0.55
  });
  const warmToeKickMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 1.05, 0.68) });

  for (const k of KIOSKS) {
    const fy = FLOORS[k.floor].y;
    const kg = new THREE.Group();
    kg.position.set(k.x, fy, k.z);

    const signTex = createKioskSignTexture(k);
    const signFace = new THREE.MeshBasicMaterial({ map: signTex });
    const kBodyMat = new THREE.MeshStandardMaterial({ color: k.color, roughness: 0.42, metalness: 0.12 });
    const kAccMat = new THREE.MeshStandardMaterial({ color: k.accent || '#fbbf24', roughness: 0.34, metalness: 0.25 });

    // Helper: Sculpted Articulated Humanoid Brand Staff (Replaces legacy pitch-black sphere/cylinder puppet!)
    let staffSeedCounter = 41 + KIOSKS.indexOf(k) * 7;
    const addStaff = (sx, sz, shirtHex = k.color || '#1e293b') => {
      staffSeedCounter += 3;
      const rig = createSculptedHumanRig(staffSeedCounter, {
        allowBag: false,
        idlePose: true,
        shirtHex: typeof shirtHex === 'string' ? shirtHex : '#1e293b',
        pantsHex: '#2c3442'
      });
      rig.group.position.set(sx, 0, sz);
      kg.add(rig.group);
    };

    if (k.id === 'k-luxe-pop') {
      // Photo-matched 2025 LUXE G Center Pavilions (#149, #389): TOM FORD black/white marble fragrance bar (staggered SW so visible alongside Bell & Ross in G-09!) + Bell & Ross matte-black octagonal watch pavilion w/ giant white '&' roof emblem + TUDOR matte-black/crimson pavilion + organic white/gold pebble ottomans!
      const tfG = new THREE.Group();
      tfG.position.set(-2.4, 0, 3.1);
      const tfDeck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 3.0), obsidianGlossMat);
      tfDeck.position.y = 0.04;
      const tfBar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.96, 1.35), obsidianGlossMat);
      tfBar.position.y = 0.52;
      const tfTop = new THREE.Mesh(new THREE.BoxGeometry(3.28, 0.08, 1.42), cafeMarbleMat);
      tfTop.position.y = 1.04;
      const tfSignMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('TOM FORD', 'PRIVATE BLEND • BEAUTY', '#09090b', '#ffffff', '#d4af37', 512, 128) });
      const tfCornice = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.56, 2.25), [tfSignMat, tfSignMat, obsidianGlossMat, kioskSoffitMat, tfSignMat, tfSignMat]);
      tfCornice.position.y = 3.05;
      const tfGoldRim = new THREE.Mesh(new THREE.BoxGeometry(3.62, 0.06, 2.32), brassGoldMat);
      tfGoldRim.position.y = 2.75;
      for (const px of [-1.58, 1.58]) {
        for (const pz of [-0.95, 0.95]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.75, 0.10), brassGoldMat);
          post.position.set(px, 1.40, pz);
          tfG.add(post);
        }
      }
      // Illuminated perfume risers & bottles atop Tom Ford marble counter
      for (let pb = -2; pb <= 2; pb++) {
        const btl = new THREE.Mesh(bottleSmallGeo, pb % 2 === 0 ? obsidianGlossMat : brassGoldMat);
        btl.scale.set(0.75, 1.15, 0.75);
        btl.position.set(pb * 0.52, 1.22, 0.15);
        tfG.add(btl);
      }
      tfG.add(tfDeck, tfBar, tfTop, tfCornice, tfGoldRim);

      // Bell & Ross Matte-Black Octagonal Watch Pavilion w/ Giant White '&' Architectural Roof Emblem!
      const brG = new THREE.Group();
      brG.position.set(2.4, 0, 0);
      const brBase = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.22, 0.10, 8), obsidianGlossMat);
      brBase.position.y = 0.05;
      const brRoof = new THREE.Mesh(new THREE.CylinderGeometry(2.10, 2.10, 0.48, 8), obsidianGlossMat);
      brRoof.position.y = 3.08;
      const brTex = createSignBoardTexture('BELL & ROSS', 'AVIATION INSTRUMENTS', '#0b0c10', '#ffffff', '#facc15', 512, 96);
      brTex.wrapS = THREE.RepeatWrapping;
      brTex.repeat.set(3, 1);
      const brSign = new THREE.Mesh(
        new THREE.CylinderGeometry(2.13, 2.13, 0.42, 8, 1, true),
        new THREE.MeshBasicMaterial({ map: brTex })
      );
      brSign.position.y = 3.08;
      // Giant Glowing White '&' Roof Emblem atop Bell & Ross Pavilion!
      const ampPlaque = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 0.08, 24),
        [obsidianGlossMat, new THREE.MeshBasicMaterial({ map: createSignBoardTexture('&', '', '#0b0c10', '#ffffff', '#ffffff', 256, 256) }), obsidianGlossMat]
      );
      ampPlaque.position.y = 3.38;
      for (let bp = 0; bp < 4; bp++) {
        const ba = (bp / 4) * Math.PI * 2 + Math.PI * 0.25;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.85, 0.12), obsidianGlossMat);
        post.position.set(Math.cos(ba) * 1.72, 1.48, Math.sin(ba) * 1.72);
        const vit = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.32, 0.62), obsidianGlossMat);
        vit.position.set(Math.cos(ba) * 0.95, 0.68, Math.sin(ba) * 0.95);
        const vitG = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 0.56), intGlassPhysMat);
        vitG.position.set(Math.cos(ba) * 0.95, 1.56, Math.sin(ba) * 0.95);
        brG.add(post, vit, vitG);
      }
      brG.add(brBase, brRoof, brSign, ampPlaque);

      // Adjacent TUDOR Matte-Black & Crimson Shield Totem (staggered clear of Bell & Ross + crisp 4-sided branding!)
      const tudorG = new THREE.Group();
      tudorG.position.set(5.4, 0, -2.6);
      const tSignMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('TUDOR', 'BORN TO DARE • GENÈVE', '#0b0c10', '#ffffff', '#dc2626', 384, 192) });
      const tPyl = new THREE.Mesh(new THREE.BoxGeometry(1.22, 2.55, 1.22), obsidianGlossMat);
      tPyl.position.y = 1.275;
      const tRed = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.20, 1.28), jayaRedPortalMat);
      tRed.position.y = 2.48;
      for (const [sx, sz, rot] of [[0, 0.625, 0], [0, -0.625, Math.PI], [0.625, 0, Math.PI * 0.5], [-0.625, 0, -Math.PI * 0.5]]) {
        const ts = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.68), tSignMat);
        ts.position.set(sx, 1.76, sz);
        ts.rotation.y = rot;
        tudorG.add(ts);
      }
      tudorG.add(tPyl, tRed);

      for (const [ox, oz] of [[-0.4, 2.35], [-0.4, -2.35]]) {
        const peb = new THREE.Mesh(new THREE.SphereGeometry(0.68, 18, 12), cafeMarbleMat);
        peb.scale.set(1.45, 0.42, 0.92);
        peb.position.set(ox, 0.24, oz);
        const pebBase = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.78, 0.08, 20), brassGoldMat);
        pebBase.scale.set(1.3, 1.0, 0.85);
        pebBase.position.set(ox, 0.04, oz);
        kg.add(peb, pebBase);
      }
      const luxeSpot = new THREE.PointLight('#fff0d0', 7.0, 12, 1.7);
      luxeSpot.position.set(0, 3.15, 0);
      kg.add(tfG, brG, tudorG, luxeSpot);
      addStaff(-2.4, 1.85, '#14161a');
      addStaff(2.4, 1.45, '#14161a');
    } else if (k.id === 'k-sushizanmai') {
      // Photo-matched 1 Utama SK9A SUSHI ZANMAI: Freestanding OPEN-CONCEPT 2F Highstreet Japanese timber-slatted dining booth/pavilion!
      // Raised warm wood-trimmed open dining platform (5.8m x 3.6m)
      const deck = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.12, 3.6), lightOakMat);
      deck.position.y = 0.06;
      const deckCurb = new THREE.Mesh(new THREE.BoxGeometry(5.88, 0.10, 3.68), obsidianGlossMat);
      deckCurb.position.y = 0.04;
      kg.add(deck, deckCurb);

      // Right/front 16 vertical pale-honey oak dowel slats forming the signature open Japanese screen!
      const dowelGeo = new THREE.CylinderGeometry(0.042, 0.042, 2.72, 10);
      for (let d = 0; d < 16; d++) {
        const dx = -0.35 + d * 0.21;
        const dowel = new THREE.Mesh(dowelGeo, sushiSlatWoodMat);
        dowel.position.set(dx, 1.48, 1.66);
        kg.add(dowel);
      }
      // Side wrap slats along right edge (x = +2.84)
      for (let ds = 0; ds < 8; ds++) {
        const dowelS = new THREE.Mesh(dowelGeo, sushiSlatWoodMat);
        dowelS.position.set(2.84, 1.48, 1.45 - ds * 0.42);
        kg.add(dowelS);
      }
      const screenTopBeam = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.12, 0.16), sushiSlatWoodMat);
      screenTopBeam.position.set(1.22, 2.86, 1.66);
      kg.add(screenTopBeam);

      // Giant iconic MATCHA-GREEN brush-circle `寿司三昧 / Sushi Zanmai / スシ` mounted directly on the front oak dowel screen (transparent center hole!)
      const szLogoTex = createSushiZanmaiLogoTexture();
      const szLogoMat = new THREE.MeshStandardMaterial({
        map: szLogoTex,
        emissive: '#ffffff',
        emissiveMap: szLogoTex,
        emissiveIntensity: 0.35,
        transparent: true,
        alphaTest: 0.08,
        roughness: 0.35,
        side: THREE.DoubleSide
      });
      const szLogoPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.68, 1.68), szLogoMat);
      szLogoPlane.position.set(1.24, 1.66, 1.75);
      // Authentic frosted vertical-striped half-glass perimeter screen & 4 glowing round cream globe pendants (#188!)
      const szGlassMat = new THREE.MeshPhysicalMaterial({ color: '#eef4f0', transparent: true, opacity: 0.42, roughness: 0.22 });
      const szHalfGlass = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.08, 0.05), szGlassMat);
      szHalfGlass.position.set(0, 0.66, -1.72);
      const szGlobeMat = new THREE.MeshStandardMaterial({ color: '#fff8e8', emissive: '#ffd282', emissiveIntensity: 0.95, roughness: 0.30 });
      for (let gp = 0; gp < 4; gp++) {
        const gx = -2.1 + gp * 1.4;
        const globe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), szGlobeMat);
        globe.position.set(gx, 3.08, 0.95);
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.15, 6), obsidianGlossMat);
        cord.position.set(gx, 3.72, 0.95);
        kg.add(globe, cord);
      }
      kg.add(szLogoPlane, szHalfGlass);

      // Left open dark slate-tiled & green-tinted glass cashier bar + POS terminal + red ONE CARD floor mat!
      const slateTileMat = new THREE.MeshStandardMaterial({ color: '#2b3330', roughness: 0.56, metalness: 0.08 });
      const cashBase = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.02, 0.78), slateTileMat);
      cashBase.position.set(-1.72, 0.62, 1.25);
      const cashGlass = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.06, 1.05), sushiGreenGlassMat);
      cashGlass.position.set(-2.72, 0.68, 1.32);
      const cashTop = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.07, 0.86), lightOakMat);
      cashTop.position.set(-1.72, 1.15, 1.25);
      const posScr = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.05), obsidianGlossMat);
      posScr.position.set(-1.35, 1.32, 1.24);
      posScr.rotation.x = -0.32;
      const ocMat = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.014, 0.52), jayaRedPortalMat);
      ocMat.position.set(-1.45, 0.012, 2.25);
      kg.add(cashBase, cashGlass, cashTop, posScr, ocMat);

      // Horizontally-slatted Japanese wooden central column crowned by 4 RADIANT GLOWING SQUARE WASHI PAPER LANTERNS!
      const centerColCore = new THREE.Mesh(new THREE.BoxGeometry(0.58, 3.18, 0.58), smokedOakMat);
      centerColCore.position.set(-0.25, 1.70, -0.35);
      kg.add(centerColCore);
      for (let hr = 0; hr < 18; hr++) {
        const ringBand = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 0.72), sushiSlatWoodMat);
        ringBand.position.set(-0.25, 0.24 + hr * 0.165, -0.35);
        kg.add(ringBand);
      }
      const warmWashiMat = new THREE.MeshStandardMaterial({
        color: '#fffbeb',
        emissive: '#ffcf70',
        emissiveIntensity: 1.05,
        roughness: 0.35
      });
      for (const [lx, lz] of [[-0.64, 0.06], [0.14, 0.06], [-0.64, -0.76], [0.14, -0.76]]) {
        const lanGlow = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.40, 0.30), warmWashiMat);
        lanGlow.position.set(lx, 2.76, lz);
        const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.34), smokedOakMat);
        capTop.position.set(lx, 2.98, lz);
        const capBot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.34), smokedOakMat);
        capBot.position.set(lx, 2.54, lz);
        const midBand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.32), smokedOakMat);
        midBand.position.set(lx, 2.76, lz);
        kg.add(lanGlow, capTop, capBot, midBand);
      }

      // Open interior Kaiten conveyor-belt sushi counter + colorful sushi plates + booth seats!
      const beltTrack = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.94, 1.22), smokedOakMat);
      beltTrack.position.set(0.85, 0.58, -0.35);
      const beltTop = new THREE.Mesh(new THREE.BoxGeometry(3.48, 0.06, 1.30), cafeMarbleMat);
      beltTop.position.set(0.85, 1.07, -0.35);
      kg.add(beltTrack, beltTop);
      const plateCols = ['#ef4444', '#facc15', '#22c55e', '#f97316', '#38bdf8'];
      for (let sp = 0; sp < 8; sp++) {
        const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.03, 12), new THREE.MeshStandardMaterial({ color: plateCols[sp % plateCols.length], roughness: 0.28 }));
        pl.position.set(-0.55 + sp * 0.40, 1.12, -0.05 + (sp % 2) * -0.58);
        kg.add(pl);
      }
      // Pale-wood angled menu podium w/ illuminated open photo menu book & chrome queue stanchions right outside entry!
      const podLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.08, 0.16), sushiSlatWoodMat);
      podLeg.position.set(-2.55, 0.54, 1.95);
      const podBoard = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.05), sushiSlatWoodMat);
      podBoard.position.set(-2.55, 1.12, 1.98);
      podBoard.rotation.x = -0.45;
      const szMenuTex = createSignBoardTexture('SUSHI ZANMAI MENU', 'SALMON • UNAGI • TEMPURA • RAMEN • ONE CARD', '#fffaf0', '#18181b', '#8ab14c', 512, 320);
      const menuPage = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.34), new THREE.MeshStandardMaterial({ map: szMenuTex, emissive: '#ffffff', emissiveMap: szMenuTex, emissiveIntensity: 0.32 }));
      menuPage.position.set(-2.55, 1.15, 2.01);
      menuPage.rotation.x = -0.45;
      for (const sx of [-1.25, -0.45]) {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.88, 8), brushedAlumMat);
        st.position.set(sx, 0.44, 2.02);
        kg.add(st);
      }
      const redStrap = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.055, 0.02), jayaRedPortalMat);
      redStrap.position.set(-0.85, 0.80, 2.02);
      kg.add(podLeg, podBoard, menuPage, redStrap);
      addStaff(-1.65, 0.55, '#1e293b');
      addStaff(0.85, -0.35, '#f8fafc');
    } else if (k.id === 'k-photoism') {
      // Photo-matched 1 Utama GK601 PHOTOISM: Open matte-black steel cage w/ white 3D Photoism sign on top + 2 black & off-white Korean 4-cut photo cabins + heavy black privacy curtains + 4-cut photo strip collage!
      const cageW = 4.4;
      const cageD = 2.6;
      const cageH = 2.85;
      for (const px of [-cageW * 0.5, 0, cageW * 0.5]) {
        for (const pz of [-cageD * 0.5, cageD * 0.5]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, cageH, 0.09), obsidianGlossMat);
          post.position.set(px, cageH * 0.5, pz);
          kg.add(post);
        }
      }
      const topRailF = new THREE.Mesh(new THREE.BoxGeometry(cageW + 0.1, 0.10, 0.10), obsidianGlossMat);
      topRailF.position.set(0, cageH, cageD * 0.5);
      const topRailB = topRailF.clone();
      topRailB.position.z = -cageD * 0.5;
      const phSign = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.58, 0.16), [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, signFace, signFace]);
      phSign.position.set(0, cageH + 0.34, cageD * 0.5);
      // Two Korean 4-cut photo booths (left matte black, right crisp off-white) w/ heavy black curtains!
      const cabL = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.45, 2.15), obsidianGlossMat);
      cabL.position.set(-1.05, 1.225, -0.10);
      const cabR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.45, 2.15), satinWhiteMat);
      cabR.position.set(1.05, 1.225, -0.10);
      const curtL = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.15, 0.08), matteSteelMat);
      curtL.position.set(-1.05, 1.12, 0.99);
      const curtR = curtL.clone();
      curtR.position.x = 1.05;
      // 4-cut photo strip sample collage panel & central monitor!
      const stripPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 1.15),
        new THREE.MeshBasicMaterial({ map: createPhotoismStripTexture() })
      );
      stripPanel.position.set(0, 1.48, 1.06);
      kg.add(topRailF, topRailB, phSign, cabL, cabR, curtL, curtR, stripPanel);
    } else if (k.id === 'k-memori') {
      // Photo-matched 1 Utama FK113 MEMORI 추억: Compact matte dark-charcoal/eggplant Korean photo cabin w/ warm-white LED-outlined rounded-arch doorway + draped taupe curtain + circular glowing white/magenta MEMORI 추억 lightbox + black hexagonal stool!
      const cab = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.75, 2.3), memoriPlumMat);
      cab.position.set(0, 1.375, 0);
      // Warm-white LED rounded-arch doorway frame + draped taupe privacy curtain!
      const archRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 10, 24, Math.PI), warmCoveLedMat);
      archRing.position.set(0.35, 1.56, 1.17);
      for (const sx of [-0.62, 0.62]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.56, 0.05), warmCoveLedMat);
        leg.position.set(0.35 + sx, 0.78, 1.17);
        kg.add(leg);
      }
      const curtain = new THREE.Mesh(new THREE.BoxGeometry(1.16, 1.85, 0.06), creamTileMat);
      curtain.position.set(0.35, 1.02, 1.15);
      // Circular glowing white/magenta MEMORI 추억 camera lightbox + 4-cut sample photo strip gallery on left!
      const memSign = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.62, 0.14), [memoriPlumMat, memoriPlumMat, memoriPlumMat, memoriPlumMat, signFace, signFace]);
      memSign.position.set(-0.92, 2.22, 1.22);
      const memStrips = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.15), new THREE.MeshBasicMaterial({ map: createPhotoismStripTexture() }));
      memStrips.position.set(-0.92, 1.22, 1.18);
      const hexStool = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.46, 6), obsidianGlossMat);
      hexStool.position.set(-1.12, 0.23, 1.45);
      kg.add(cab, archRing, curtain, memSign, memStrips, hexStool);
    } else if (k.id === 'k-boost') {
      // Photo-matched 1 Utama FK101 BOOST JUICE: Branded lime-green & berry graphic counter + fresh fruit basket pyramid + 4 blender stations + wide lime-green gantry!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.02, 2.3), [satinWhiteMat, satinWhiteMat, satinWhiteMat, satinWhiteMat, brandPosterMats.boost_front, brandPosterMats.boost_front]);
      base.position.y = 0.51;
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 2.4), satinWhiteMat);
      top.position.y = 1.06;
      const loveBox = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.28, 0.92), [rawConcreteMat, rawConcreteMat, rawConcreteMat, rawConcreteMat, brandPosterMats.boost_front, rawConcreteMat]);
      loveBox.position.set(-2.55, 0.64, 0.45);
      for (let bl = 0; bl < 4; bl++) {
        const bMotor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), obsidianGlossMat);
        bMotor.position.set(-1.2 + bl * 0.78, 1.18, 0.35);
        const hood = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.46, 0.34), intGlassPhysMat);
        hood.position.set(-1.2 + bl * 0.78, 1.38, 0.35);
        kg.add(bMotor, hood);
      }
      // Fresh mango, orange, berry & green-apple display baskets on front counter!
      for (let fr = 0; fr < 8; fr++) {
        const fruit = new THREE.Mesh(produceMoundGeo, produceMats[fr % produceMats.length]);
        fruit.position.set(-1.55 + fr * 0.44, 1.18, 0.88);
        kg.add(fruit);
      }
      for (const px of [-2.12, 2.12]) {
        for (const pz of [-1.06, 1.06]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.85, 0.10), llaollaoLimeMat);
          post.position.set(px, 1.425, pz);
          kg.add(post);
        }
      }
      const gantry = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.62, 0.24), [llaollaoLimeMat, llaollaoLimeMat, llaollaoLimeMat, kioskSoffitMat, signFace, signFace]);
      gantry.position.set(0, 2.75, 1.06);
      const gantryB = gantry.clone();
      gantryB.position.z = -1.06;
      kg.add(base, top, loveBox, gantry, gantryB);
      addStaff(-0.4, -0.15, '#65a30d');
      addStaff(0.85, -0.15, '#1e293b');
    } else if (k.id === 'k-llaollao') {
      // Photo-matched 1 Utama SK106A LLAOLLAO: Minimalist pure-white rectangular portal frame w/ 3D lime-green `llaollao.` perched on top-left corner + warm-white counter + clear glass topping bar + translucent bright lime-green chairs!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.00, 2.1), satinWhiteMat);
      base.position.y = 0.50;
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.32, 0.08, 2.22), satinWhiteMat);
      top.position.y = 1.04;
      const guard = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.44, 0.62), intGlassPhysMat);
      guard.position.set(0, 1.30, 0.62);
      for (let t = 0; t < 6; t++) {
        const bowl = new THREE.Mesh(pastryDomeGeo, produceMats[t % produceMats.length]);
        bowl.position.set(-1.25 + t * 0.50, 1.15, 0.62);
        kg.add(bowl);
      }
      // Pure-white minimalist rectangular portal arch!
      for (const px of [-2.05, 2.05]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.75, 0.18), satinWhiteMat);
        post.position.set(px, 1.375, -0.78);
        kg.add(post);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(4.28, 0.18, 0.18), satinWhiteMat);
      beam.position.set(0, 2.72, -0.78);
      const signBox = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.56, 0.18), [satinWhiteMat, satinWhiteMat, satinWhiteMat, satinWhiteMat, signFace, signFace]);
      signBox.position.set(-0.75, 3.08, -0.78);
      // Adjacent seating w/ translucent bright lime-green chairs!
      for (const cx of [2.85, 3.65]) {
        const seat = new THREE.Mesh(chairSeatGeo, llaollaoLimeMat);
        seat.position.set(cx, 0.46, 0.25);
        const leg = new THREE.Mesh(bistroPoleGeo, brushedAlumMat);
        leg.scale.set(0.7, 0.62, 0.7);
        leg.position.set(cx, 0.23, 0.25);
        kg.add(seat, leg);
      }
      kg.add(base, top, guard, beam, signBox);
      addStaff(-0.35, -0.20, '#65a30d');
    } else if (k.id === 'k-garrett') {
      // Photo-matched 1 Utama LGK2 GARRETT POPCORN: Chamfered island wrapping navy/blue striped central column + warm vertical wood-slat right serving bay + matte-black gantry w/ oval Garrett medallion & hanging 2-tier striped tin rack!
      const garrettStripeMat = new THREE.MeshStandardMaterial({ map: createGarrettStripeTexture(5, 1), roughness: 0.34, metalness: 0.06 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.02, 2.4), nadejeNavyMat);
      base.position.y = 0.51;
      const woodRight = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.02, 2.44), vertOakMat);
      woodRight.position.set(1.42, 0.51, 0);
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.09, 2.56), counterMarbleMat);
      top.position.y = 1.06;
      const stripeCol = new THREE.Mesh(new THREE.BoxGeometry(0.92, 3.05, 0.92), garrettStripeMat);
      stripeCol.position.set(-0.35, 1.525, -0.15);
      // Brass-framed glass popcorn warmer + golden CaramelCrisp & CheeseCorn mounds!
      const popGlass = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.76, 0.86), intGlassPhysMat);
      popGlass.position.set(0.45, 1.48, 0.66);
      const caramelMat = new THREE.MeshStandardMaterial({ color: '#c97114', roughness: 0.62 });
      const cheeseMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.64 });
      for (let m = 0; m < 8; m++) {
        const mound = new THREE.Mesh(produceMoundGeo, m < 4 ? caramelMat : cheeseMat);
        mound.scale.set(1.5, 1.25, 1.4);
        mound.position.set(-0.25 + (m % 4) * 0.42, 1.24 + Math.floor(m / 4) * 0.14, 0.66);
        kg.add(mound);
      }
      // Matte-black rectangular overhead gantry w/ oval Garrett medallion + hanging 2-tier striped tin shelf rack!
      for (const px of [-2.10, 2.10]) {
        for (const pz of [-1.12, 1.12]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.85, 0.08), obsidianGlossMat);
          post.position.set(px, 1.425, pz);
          kg.add(post);
        }
      }
      const gFront = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.68, 0.20), [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, kioskSoffitMat, signFace, signFace]);
      gFront.position.set(0, 2.72, 1.12);
      const gBack = gFront.clone();
      gBack.position.z = -1.12;
      const tinMat = new THREE.MeshStandardMaterial({ map: createGarrettStripeTexture(2, 1), roughness: 0.24, metalness: 0.42 });
      for (let t = 0; t < 4; t++) {
        const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.28, 14), tinMat);
        tin.position.set(-1.45 + t * 0.34, 2.15, 0.88);
        kg.add(tin);
      }
      kg.add(base, woodRight, top, stripeCol, popGlass, gFront, gBack);
      addStaff(-0.95, -0.58, '#172554');
      addStaff(0.85, -0.58, '#172554');
    } else if (k.id === 'k-auntie') {
      // Photo-matched 1 Utama LGK3 AUNTIE ANNE'S: Curved vertical light-oak slatted counter w/ white terrazzo panels + royal-blue wrapped right column + floating oval halo canopy w/ cyan Auntie Anne's + slanted glass pretzel warmer & 2 drink dispensers!
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 1.02, 28), vertOakMat);
      base.scale.set(1.15, 1, 0.64);
      base.position.y = 0.51;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.22, 0.08, 28), cafeMarbleMat);
      top.scale.set(1.15, 1, 0.64);
      top.position.y = 1.06;
      const blueCol = new THREE.Mesh(new THREE.BoxGeometry(0.88, 3.08, 0.88), zusRoyalBlueMat);
      blueCol.position.set(1.55, 1.54, -0.25);
      const goldCap = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.34, 0.94), brassGoldMat);
      goldCap.position.set(1.55, 2.95, -0.25);
      // Fix stretched Auntie Anne's oval ring texture UV (3 clean repeats around circumference, FrontSide only so inside isn't mirrored!)
      const auntieRingTex = signTex.clone();
      auntieRingTex.wrapS = THREE.RepeatWrapping;
      auntieRingTex.repeat.set(3, 1);
      auntieRingTex.needsUpdate = true;
      const ovalCanopy = new THREE.Mesh(new THREE.CylinderGeometry(2.32, 2.32, 0.46, 36, 1, true), new THREE.MeshStandardMaterial({ map: auntieRingTex, roughness: 0.32, side: THREE.FrontSide }));
      ovalCanopy.scale.set(1.15, 1, 0.64);
      ovalCanopy.position.y = 2.86;
      const ovalInner = new THREE.Mesh(new THREE.CylinderGeometry(2.29, 2.29, 0.44, 36, 1, true), new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.45, side: THREE.BackSide }));
      ovalInner.scale.set(1.15, 1, 0.64);
      ovalInner.position.y = 2.86;
      const warmer = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.68, 0.72), intGlassPhysMat);
      warmer.position.set(-0.45, 1.44, 0.64);
      for (let pr = 0; pr < 4; pr++) {
        const pretz = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.028, 6, 12), croissantGoldMat);
        pretz.rotation.x = Math.PI * 0.42;
        pretz.position.set(-0.92 + pr * 0.32, 1.24, 0.64);
        kg.add(pretz);
      }
      for (const dx of [-1.45, -1.08]) {
        const disp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.46, 12), new THREE.MeshStandardMaterial({ color: '#fde047', transparent: true, opacity: 0.72 }));
        disp.position.set(dx, 1.35, 0.48);
        kg.add(disp);
      }
      kg.add(base, top, blueCol, goldCap, ovalCanopy, ovalInner, warmer);
      addStaff(-0.25, -0.35, '#1d4ed8');
    } else if (k.id === 'k-nadeje') {
      // Photo-matched 1 Utama GK101 NADEJE: Elongated octagonal DEEP NAVY-BLUE patisserie island w/ raised gold molding frames & brass plinth + tall central navy pylon + hanging navy/gold pill Nadeje marquee + mille-crêpe cake vitrines!
      const octBase = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.28, 1.02, 8), nadejeNavyMat);
      octBase.scale.set(1.18, 1, 0.66);
      octBase.position.y = 0.51;
      const brassBase = new THREE.Mesh(new THREE.CylinderGeometry(2.32, 2.34, 0.12, 8), brassGoldMat);
      brassBase.scale.set(1.18, 1, 0.66);
      brassBase.position.y = 0.06;
      const octTop = new THREE.Mesh(new THREE.CylinderGeometry(2.30, 2.30, 0.08, 8), cafeMarbleMat);
      octTop.scale.set(1.18, 1, 0.66);
      octTop.position.y = 1.06;
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.95, 0.78), nadejeNavyMat);
      pylon.position.set(0, 1.50, -0.18);
      const pylonTrim = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.08, 0.84), brassGoldMat);
      pylonTrim.position.set(0, 2.95, -0.18);
      const cakeCase = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.68, 0.82), intGlassPhysMat);
      cakeCase.position.set(0.45, 1.44, 0.68);
      const cakeCols = ['#fef08a', '#fbcfe8', '#d4a373', '#86efac', '#e0c6b2'];
      for (let c = 0; c < 5; c++) {
        const ck = new THREE.Mesh(pastryDomeGeo, new THREE.MeshStandardMaterial({ color: cakeCols[c], roughness: 0.45 }));
        ck.position.set(-0.60 + c * 0.52, 1.20, 0.68);
        kg.add(ck);
      }
      const pillSign = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.62, 0.18), [brassGoldMat, brassGoldMat, brassGoldMat, brassGoldMat, signFace, signFace]);
      pillSign.position.set(0, 2.86, 0.52);
      kg.add(octBase, brassBase, octTop, pylon, pylonTrim, cakeCase, pillSign);
      addStaff(-0.95, -0.25, '#0f234a');
      addStaff(0.95, -0.25, '#0f234a');
    } else if (k.id === 'k-beutea') {
      // Photo-matched 1 Utama GK102 BEUTEA: Natural oak counter divided into 6 warm-backlit framed bays (cream panels + wood apothecary drawers w/ bronze ring-pulls!) + wood-clad square center column + hanging dark-wood/gold 茶仙子 BEUTEA sign + 4 angled black TV menu screens!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.02, 2.4), lightOakMat);
      base.position.y = 0.51;
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.72, 0.09, 2.54), cafeMarbleMat);
      top.position.y = 1.06;
      for (let bay = 0; bay < 6; bay++) {
        const bx = -1.85 + bay * 0.74;
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.76, 0.06), bay % 3 === 1 ? smokedOakMat : creamTileMat);
        panel.position.set(bx, 0.52, 1.21);
        kg.add(panel);
        if (bay % 3 === 1) {
          for (const dy of [0.34, 0.66]) {
            const pull = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 12), brassGoldMat);
            pull.position.set(bx, dy, 1.25);
            kg.add(pull);
          }
        }
      }
      const woodCol = new THREE.Mesh(new THREE.BoxGeometry(0.96, 3.12, 0.96), vertOakMat);
      woodCol.position.set(0, 1.56, -0.15);
      const pillSign = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.62, 0.22), [smokedOakMat, smokedOakMat, smokedOakMat, smokedOakMat, signFace, signFace]);
      pillSign.position.set(0, 2.88, 0.85);
      for (const tx of [-1.45, -0.55, 0.55, 1.45]) {
        const tv = new THREE.Mesh(
          new THREE.BoxGeometry(0.76, 0.44, 0.06),
          [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, brandPosterMats.beutea_menu, obsidianGlossMat]
        );
        tv.position.set(tx, 2.28, 0.72);
        tv.rotation.x = 0.24;
        kg.add(tv);
      }
      kg.add(base, top, woodCol, pillSign);
      addStaff(-1.15, -0.25, '#3b2414');
      addStaff(1.15, -0.25, '#3b2414');
    } else if (k.id === 'k-tealive') {
      // Photo-matched 1 Utama SK101 TEALIVE PLUS: Chamfered deep royal-purple counter w/ gold tea-leaf accents & warm gold under-counter/plinth LED cove + open canopy w/ rounded deep-blue `tealive plus` lightbox & 4 menu screens!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.02, 2.4), tealivePurpleMat);
      base.position.y = 0.51;
      const goldPlinth = new THREE.Mesh(new THREE.BoxGeometry(4.46, 0.06, 2.46), warmToeKickMat);
      goldPlinth.position.y = 0.05;
      const goldUnder = new THREE.Mesh(new THREE.BoxGeometry(4.46, 0.04, 2.46), warmToeKickMat);
      goldUnder.position.y = 0.98;
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.08, 2.52), cafeMarbleMat);
      top.position.y = 1.06;
      for (const px of [-2.05, 2.05]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.75, 10), brassGoldMat);
        p.position.set(px, 1.40, -0.82);
        kg.add(p);
      }
      const pillBox = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.64, 0.24), [zusRoyalBlueMat, zusRoyalBlueMat, zusRoyalBlueMat, kioskSoffitMat, signFace, signFace]);
      pillBox.position.set(0, 2.86, 0.25);
      kg.add(base, goldPlinth, goldUnder, top, pillBox);
      addStaff(-0.55, -0.20, '#3b1578');
      addStaff(0.75, -0.20, '#3b1578');
    } else if (k.id === 'k-baskin') {
      // Photo-matched 1 Utama FK8 BASKIN-ROBBINS: Champagne-gold brushed-metal perimeter counter w/ stepped glass ice-cream vitrines + white/magenta BASKIN [BR] ROBBINS header over deep purple oval canopy rimmed in hot-pink neon!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.00, 2.4), brassGoldMat);
      base.position.y = 0.50;
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.08, 2.52), satinWhiteMat);
      top.position.y = 1.04;
      const vit = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.62, 0.88), intGlassPhysMat);
      vit.position.set(0, 1.38, 0.66);
      const tubCols = ['#f472b6', '#fde047', '#93c5fd', '#86efac', '#c084fc', '#fb923c'];
      for (let tb = 0; tb < 6; tb++) {
        const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 12), new THREE.MeshStandardMaterial({ color: tubCols[tb], roughness: 0.42 }));
        tub.position.set(-1.15 + tb * 0.46, 1.18, 0.66);
        kg.add(tub);
      }
      const purpleOval = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.22, 32), baskinPurpleMat);
      purpleOval.scale.set(1.15, 1, 0.64);
      purpleOval.position.y = 2.52;
      const pinkRim = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.04, 8, 36), rwPinkNeonMat);
      pinkRim.rotation.x = Math.PI / 2;
      pinkRim.scale.set(1.15, 0.64, 1);
      pinkRim.position.y = 2.42;
      const brSign = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.62, 0.20), [satinWhiteMat, satinWhiteMat, satinWhiteMat, satinWhiteMat, signFace, signFace]);
      brSign.position.set(0, 3.06, 0.76);
      for (const px of [-1.95, 1.95]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.66, 10), satinWhiteMat);
        post.position.set(px, 1.33, -0.78);
        kg.add(post);
      }
      kg.add(base, top, vit, purpleOval, pinkRim, brSign);
      addStaff(-0.35, -0.22, '#db2777');
    } else if (k.id === 'k-owala') {
      // Photo-matched 1 Utama FK2 OWALA: Raised pale-wood walk-in platform w/ brushed-metal bevel ramp + deep navy & bright sky-blue curved pill bottle display islands w/ glowing white LED rims + rounded-corner navy canopy w/ glowing white owala®!
      const deck = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.10, 3.2), lightOakMat);
      deck.position.y = 0.05;
      const islL = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.90, 0.94, 24), owalaNavyMat);
      islL.scale.set(1.35, 1, 0.72);
      islL.position.set(-1.15, 0.52, 0.15);
      const islR = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.90, 0.94, 24), owalaSkyMat);
      islR.scale.set(1.35, 1, 0.72);
      islR.position.set(1.15, 0.52, 0.15);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.58, 2.6), [owalaNavyMat, owalaNavyMat, owalaNavyMat, kioskSoffitMat, signFace, signFace]);
      canopy.position.set(0, 2.92, 0);
      for (const px of [-2.15, 2.15]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.75, 10), owalaNavyMat);
        post.position.set(px, 1.42, -1.12);
        kg.add(post);
      }
      const owCols = ['#fb7185', '#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#fb923c', '#2dd4bf', '#60a5fa'];
      for (let b = 0; b < 18; b++) {
        const isLeft = b < 9;
        const idx = b % 9;
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        const bot = new THREE.Mesh(bottleSmallGeo, new THREE.MeshStandardMaterial({ color: owCols[b % owCols.length], roughness: 0.24, metalness: 0.35 }));
        bot.scale.set(1.15, 1.35, 1.15);
        bot.position.set((isLeft ? -1.15 : 1.15) + (col - 1) * 0.42, 1.14, -0.18 + row * 0.32);
        kg.add(bot);
      }
      kg.add(deck, islL, islR, canopy);
      addStaff(0.0, -0.65, '#14244d');
    } else if (k.id === 'k-samsung') {
      // Photo-matched 1 Utama SK2A SAMSUNG: Open-air 4-poster polished chrome cylindrical columns supporting brushed-silver rectangular gantry w/ glowing white SAMSUNG + matte-black watch vitrine & black demo table!
      const deck = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 3.0), brushedAlumMat);
      deck.position.y = 0.04;
      for (const px of [-2.18, 2.18]) {
        for (const pz of [-1.28, 1.28]) {
          const chromeCol = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 2.95, 14), brushedAlumMat);
          chromeCol.position.set(px, 1.50, pz);
          kg.add(chromeCol);
        }
      }
      const gantry = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.56, 2.78), [brushedAlumMat, brushedAlumMat, brushedAlumMat, kioskSoffitMat, signFace, signFace]);
      gantry.position.y = 3.02;
      const demoTbl = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.94, 1.25), satinWhiteMat);
      demoTbl.position.set(0, 0.51, 0.15);
      const samTrim = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.08, 1.30), obsidianGlossMat);
      samTrim.position.set(0, 0.96, 0.15);
      const galTex = createSignBoardTexture('GALAXY S25 ULTRA', 'GALAXY AI • LIVE DEMO', '#0f172a', '#ffffff', '#38bdf8', 256, 160);
      const galMat = new THREE.MeshStandardMaterial({ map: galTex, emissive: '#ffffff', emissiveMap: galTex, emissiveIntensity: 0.55, roughness: 0.18 });
      for (let d = -1; d <= 1; d++) {
        const scr = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.04), [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, galMat, obsidianGlossMat]);
        scr.position.set(d * 0.96, 1.16, 0.25);
        scr.rotation.x = -0.35;
        kg.add(scr);
      }
      kg.add(deck, gantry, demoTbl, samTrim);
      addStaff(0.95, -0.75, '#18181b');
    } else if (k.id === 'k-bungkus') {
      // Photo-matched 1 Utama LGK105-LGK108 BUNGKUS KAW KAW: Deep forest-green timber pergola cage + horizontal green clapboard wainscoting w/ warm LED under-glow + hanging vintage enamel tin mugs inside frame + kopitiam tables & stools!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.02, 2.4), bungkusForestMat);
      base.position.y = 0.51;
      const toe = new THREE.Mesh(new THREE.BoxGeometry(4.56, 0.045, 2.46), warmToeKickMat);
      toe.position.y = 0.05;
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.62, 0.09, 2.54), cafeMarbleMat);
      top.position.y = 1.06;
      for (const px of [-2.18, 2.18]) {
        for (const pz of [-1.14, 1.14]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.95, 0.14), bungkusForestMat);
          post.position.set(px, 1.475, pz);
          kg.add(post);
        }
      }
      // Outer faces ONLY carry signFace (inner faces use solid bungkusForestMat -> ZERO duplicate rear sign showing through!)
      const signF = new THREE.Mesh(new THREE.BoxGeometry(4.55, 0.62, 0.20), [bungkusForestMat, bungkusForestMat, bungkusForestMat, kioskSoffitMat, signFace, bungkusForestMat]);
      signF.position.set(0, 2.86, 1.14);
      const signB = new THREE.Mesh(new THREE.BoxGeometry(4.55, 0.62, 0.20), [bungkusForestMat, bungkusForestMat, bungkusForestMat, kioskSoffitMat, bungkusForestMat, signFace]);
      signB.position.set(0, 2.86, -1.14);
      // Iconic row of hanging vintage enamel tin mugs suspended cleanly under a dark-green pergola rail at y=2.52 (clear of all text!)
      const mugRail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, 0.05), bungkusForestMat);
      mugRail.position.set(0, 2.58, 1.05);
      kg.add(mugRail);
      const mugCols = ['#eab308', '#dc2626', '#2563eb', '#16a34a', '#f8fafc'];
      for (let mg = 0; mg < 5; mg++) {
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.11, 10), new THREE.MeshStandardMaterial({ color: mugCols[mg], roughness: 0.25 }));
        mug.position.set(-1.35 + mg * 0.68, 2.50, 1.05);
        kg.add(mug);
      }
      // Photo-matched dark charcoal-green roof canopy w/ top-printed white BUNGKUS KAW KAW logo + pitched charcoal-green roof crest & front counter plaque visible from eye level!
      const bRoofTopMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('BUNGKUS KAW KAW', 'KOPI • TEH • NASI LEMAK', '#113021', '#ffffff', '#fde047', 512, 256) });
      const bRoof = new THREE.Mesh(new THREE.BoxGeometry(4.55, 0.14, 2.48), [bungkusForestMat, bungkusForestMat, bRoofTopMat, kioskSoffitMat, bungkusForestMat, bungkusForestMat]);
      bRoof.position.set(0, 3.16, 0);
      const bRoofCrest = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.44, 0.10), [bungkusForestMat, bungkusForestMat, bungkusForestMat, bungkusForestMat, bRoofTopMat, bRoofTopMat]);
      bRoofCrest.position.set(0, 3.40, 0.45);
      bRoofCrest.rotation.x = 0.24;
      const bFrontPlaque = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 0.56), bRoofTopMat);
      bFrontPlaque.position.set(0, 0.54, 1.21);
      kg.add(base, toe, top, signF, signB, bRoof, bRoofCrest, bFrontPlaque);
      addStaff(-0.45, -0.25, '#14532d');
      addStaff(0.75, -0.25, '#14532d');
    } else if (k.id === 'k-kenangan') {
      // Photo-matched 1 Utama LGK101B KENANGAN COFFEE: Linear blonde-oak wood counter w/ brushed-steel kickplate + projecting curved blonde-wood canopy + espresso machine & low glass sneeze guard!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.00, 2.2), lightOakMat);
      base.position.y = 0.50;
      const kick = new THREE.Mesh(new THREE.BoxGeometry(4.46, 0.10, 2.26), brushedAlumMat);
      kick.position.y = 0.05;
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.08, 2.32), cafeMarbleMat);
      top.position.y = 1.04;
      const espresso = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.52, 0.54), brushedAlumMat);
      espresso.position.set(-0.95, 1.34, 0.22);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.42, 0.64), intGlassPhysMat);
      guard.position.set(0.85, 1.29, 0.62);
      for (const px of [-2.05, 2.05]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.80, 0.14), lightOakMat);
        post.position.set(px, 1.40, -0.82);
        kg.add(post);
      }
      const woodCan = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.62, 1.35), [lightOakMat, lightOakMat, lightOakMat, kioskSoffitMat, signFace, signFace]);
      woodCan.position.set(0, 2.84, -0.22);
      kg.add(base, kick, top, espresso, guard, woodCan);
      addStaff(-0.35, -0.20, '#451a03');
    } else if (k.id === 'k-popmart-robo') {
      // 1. Photo-matched GK602 POP MART ROBO SHOP: Unmanned bright-yellow dual-bay blind-box vending machine + wavy rainbow vertical-slat backdrop + yellow neon crown (ZERO staff!)
      const rbMats = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#a855f7', '#ec4899'].map((hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.34 }));
      for (let s = 0; s < 14; s++) {
        const slatH = 2.45 + Math.sin(s * 0.65) * 0.38;
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.22, slatH, 0.16), rbMats[s % rbMats.length]);
        slat.position.set(-1.68 + s * 0.26, slatH * 0.5, -0.68);
        kg.add(slat);
      }
      for (const mx of [-0.95, 0.95]) {
        const vm = new THREE.Mesh(new THREE.BoxGeometry(1.58, 2.25, 0.96), mrDiyYellowMat);
        vm.position.set(mx, 1.125, 0.12);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.32, 0.06), intGlassPhysMat);
        glass.position.set(mx - 0.12, 1.38, 0.61);
        const touch = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.42, 0.04), sportLedBarMat);
        touch.position.set(mx + 0.58, 1.25, 0.61);
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.36, 0.08), obsidianGlossMat);
        slot.position.set(mx - 0.12, 0.42, 0.60);
        kg.add(vm, glass, touch, slot);
      }
      const crownSign = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.52, 0.24), [mrDiyYellowMat, mrDiyYellowMat, mrDiyYellowMat, kioskSoffitMat, signFace, signFace]);
      crownSign.position.set(0, 2.56, 0.14);
      kg.add(crownSign);
    } else if (k.id === 'k-ogawa') {
      // 2. Photo-matched FK7 OGAWA • POKÉMON: Crimson carpeted wellness lounge + glowing sky-blue OGAWA Pokémon lightbox raised cleanly above all 3 sculpted robotic massage chair backrests!
      const carpet = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 3.6), norenCrimsonMat);
      carpet.position.y = 0.03;
      const ogBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.62, 0.34), norenCrimsonMat);
      ogBase.position.set(0, 0.81, -1.22);
      const lbPillar = new THREE.Mesh(
        new THREE.BoxGeometry(3.84, 1.48, 0.36),
        [norenCrimsonMat, norenCrimsonMat, norenCrimsonMat, norenCrimsonMat, new THREE.MeshBasicMaterial({ map: createSignBoardTexture('OGAWA  ×  POKÉMON', 'MASTER DRIVE AI MASSAGE CHAIRS', '#0284c7', '#ffffff', '#facc15', 512, 192) }), new THREE.MeshBasicMaterial({ map: createSignBoardTexture('OGAWA  ×  POKÉMON', 'WELLNESS LOUNGE • FK7', '#0284c7', '#ffffff', '#facc15', 512, 192) })]
      );
      lbPillar.position.set(0, 2.36, -1.22);
      kg.add(ogBase);
      const chairMat = new THREE.MeshStandardMaterial({ color: '#1e1b22', roughness: 0.32, metalness: 0.22 });
      for (const [cx, trimMat] of [[-1.55, jayaRedPortalMat], [0, mrDiyYellowMat], [1.55, brassGoldMat]]) {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.46, 1.05), chairMat);
        seat.position.set(cx, 0.42, 0.55);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.92, 0.26), chairMat);
        back.position.set(cx, 0.98, 0.08);
        back.rotation.x = -0.26;
        const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 1.18), trimMat);
        sideL.position.set(cx - 0.46, 0.58, 0.52);
        const sideR = sideL.clone();
        sideR.position.x = cx + 0.46;
        kg.add(seat, back, sideL, sideR);
      }
      kg.add(carpet, lbPillar);
      addStaff(2.35, 0.35, '#991b1b');
    } else if (k.id === 'k-havaianas') {
      // 3. Photo-matched FK4 HAVAIANAS: Bright-red open steel canopy sandal island + glowing red havaianas fascia + beach lightbox pillar + sandal display tables!
      const deck = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 3.0), lightOakMat);
      deck.position.y = 0.04;
      for (const px of [-2.25, 2.25]) {
        for (const pz of [-1.35, 1.35]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.85, 0.11), jayaRedPortalMat);
          post.position.set(px, 1.46, pz);
          kg.add(post);
        }
      }
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.46, 2.95), [jayaRedPortalMat, jayaRedPortalMat, jayaRedPortalMat, kioskSoffitMat, signFace, signFace]);
      canopy.position.set(0, 2.92, 0);
      const beachPillar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.35, 0.42), new THREE.MeshBasicMaterial({ map: createSignBoardTexture('havaianas', 'BRAZIL SINCE 1962', '#0ea5e9', '#ffffff', '#facc15', 256, 512) }));
      beachPillar.position.set(-1.35, 1.24, -0.55);
      const sandalCols = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#ec4899', '#f8fafc'];
      for (const [tx, tz] of [[0.65, 0.65], [0.65, -0.55]]) {
        const tbl = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.86, 0.82), satinWhiteMat);
        tbl.position.set(tx, 0.48, tz);
        kg.add(tbl);
        for (let s = 0; s < 6; s++) {
          const pair = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.34), new THREE.MeshStandardMaterial({ color: sandalCols[s], roughness: 0.4 }));
          pair.position.set(tx - 0.78 + s * 0.31, 0.94, tz);
          kg.add(pair);
        }
      }
      kg.add(deck, canopy, beachPillar);
      addStaff(1.6, 0.1, '#dc2626');
    } else if (k.id === 'k-pokedots') {
      // 4. Photo-matched SK29 pokédots.: Vivid magenta-pink (#d8277c) FULL SOLID 360° curved counter drum + curved front pokédots. plaque + elevated serif pokédots. pylon + staff standing cleanly outside drum!
      const magMat = new THREE.MeshStandardMaterial({ color: '#d8277c', roughness: 0.36, side: THREE.DoubleSide });
      const pdSignMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('pokédots.', 'DONUTS & MATCHA • SK29', '#d8277c', '#111827', '#ffffff', 512, 220) });
      const wallCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 1.98, 1.06, 32), magMat);
      wallCyl.position.y = 0.53;
      const frontCurvePlaque = new THREE.Mesh(
        new THREE.CylinderGeometry(2.005, 2.005, 0.56, 20, 1, true, -Math.PI * 0.22, Math.PI * 0.44),
        pdSignMat
      );
      frontCurvePlaque.position.y = 0.54;
      const topRim = new THREE.Mesh(new THREE.CylinderGeometry(2.06, 2.06, 0.07, 32), cafeMarbleMat);
      topRim.position.y = 1.09;
      const backBase = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.48, 0.24), magMat);
      backBase.position.set(0, 0.74, -1.55);
      const backPyl = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.25, 0.26), [magMat, magMat, magMat, magMat, pdSignMat, pdSignMat]);
      backPyl.position.set(0, 2.10, -1.55);
      const pastryCase = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.46, 0.64), intGlassPhysMat);
      pastryCase.position.set(-0.35, 1.36, 1.15);
      kg.add(wallCyl, frontCurvePlaque, topRim, backBase, backPyl, pastryCase);
      addStaff(2.42, -0.35, '#111827');
    } else if (k.id === 'k-tgv-pop') {
      // 5. Photo-matched EZ101-K BANPRESTO: Light-grey collectibles counter backed by 2 widely-spaced tall glowing white glass anime-figure vitrines with staff standing cleanly in the 1.6m center gap!
      const greyMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.36 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.96, 1.05), greyMat);
      base.position.set(0, 0.48, 0.55);
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.28, 0.07, 1.12), satinWhiteMat);
      top.position.set(0, 0.99, 0.55);
      const figCols = ['#f97316', '#38bdf8', '#ec4899', '#facc15', '#22c55e', '#a855f7'];
      for (const vx of [-1.45, 1.45]) {
        const vitFrame = new THREE.Mesh(new THREE.BoxGeometry(1.30, 2.45, 0.58), satinWhiteMat);
        vitFrame.position.set(vx, 1.225, -0.82);
        const vitGlass = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.65, 0.64), intGlassPhysMat);
        vitGlass.position.set(vx, 1.45, -0.82);
        kg.add(vitFrame, vitGlass);
        for (let sh = 0; sh < 3; sh++) {
          for (let f = -1; f <= 1; f++) {
            const fig = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.14, 4, 8), new THREE.MeshStandardMaterial({ color: figCols[(sh * 3 + f + 3) % figCols.length], roughness: 0.3 }));
            fig.position.set(vx + f * 0.32, 0.88 + sh * 0.48, -0.79);
            kg.add(fig);
          }
        }
      }
      const header = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.56, 0.28), [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, kioskSoffitMat, new THREE.MeshBasicMaterial({ map: createSignBoardTexture('BANPRESTO', 'ANIME FIGURES & COLLECTIBLES', '#0f172a', '#ffffff', '#38bdf8', 512, 128) }), new THREE.MeshBasicMaterial({ map: createSignBoardTexture('BANPRESTO', 'ANIME FIGURES & COLLECTIBLES', '#0f172a', '#ffffff', '#38bdf8', 512, 128) })]);
      header.position.set(0, 2.74, -0.82);
      kg.add(base, top, header);
      addStaff(0, -0.18, '#1e293b');
    } else if (k.id === 'k-zus2f') {
      // 6. Photo-matched SK9 ZUS COFFEE: Curved white horizontal-ribbed front counter + curved navy-blue overhanging canopy w/ glowing white ZUS COFFEE oriented cleanly toward 2F-09 concourse!
      const cFront = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 1.02, 24, 1, false, -Math.PI * 0.46, Math.PI * 0.92), satinWhiteMat);
      cFront.position.set(0, 0.51, -0.55);
      for (let rb = 0; rb < 5; rb++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(2.17, 0.024, 6, 24, Math.PI * 0.90), brushedAlumMat);
        rib.rotation.x = Math.PI / 2;
        rib.rotation.z = -Math.PI * 0.95;
        rib.position.set(0, 0.18 + rb * 0.18, -0.55);
        kg.add(rib);
      }
      const cTop = new THREE.Mesh(new THREE.CylinderGeometry(2.24, 2.24, 0.08, 24, 1, false, -Math.PI * 0.46, Math.PI * 0.92), cafeMarbleMat);
      cTop.position.set(0, 1.05, -0.55);
      const backPyl = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.85, 0.52), zusRoyalBlueMat);
      backPyl.position.set(0, 1.425, -1.12);
      const navyCanopy = new THREE.Mesh(new THREE.CylinderGeometry(2.32, 2.32, 0.58, 28, 1, false, -Math.PI * 0.46, Math.PI * 0.92), [zusRoyalBlueMat, zusRoyalBlueMat, kioskSoffitMat]);
      navyCanopy.position.set(0, 2.86, -0.55);
      const zusSign = new THREE.Mesh(
        new THREE.CylinderGeometry(2.35, 2.35, 0.50, 28, 1, true, -Math.PI * 0.22, Math.PI * 0.58),
        signFace
      );
      zusSign.position.set(0, 2.86, -0.55);
      kg.add(cFront, cTop, backPyl, navyCanopy, zusSign);
      addStaff(-0.45, 0.25, '#0f2e78');
      addStaff(0.55, 0.25, '#0f2e78');
    } else if (k.id === 'k-yomaro') {
      // 7. Photo-matched FK5A YOMARO: Matte-black steel open pergola w/ crisp white LED perimeter outlines & YOMARO signage!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.00, 2.2), obsidianGlossMat);
      base.position.y = 0.50;
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.32, 0.08, 2.32), satinWhiteMat);
      top.position.y = 1.04;
      for (const px of [-2.05, 2.05]) {
        for (const pz of [-1.05, 1.05]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.85, 0.10), obsidianGlossMat);
          post.position.set(px, 1.425, pz);
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.75, 0.03), sportLedBarMat);
          led.position.set(px + Math.sign(px) * 0.06, 1.425, pz + Math.sign(pz) * 0.06);
          kg.add(post, led);
        }
      }
      const topLed = new THREE.Mesh(new THREE.BoxGeometry(4.22, 0.06, 2.22), sportLedBarMat);
      topLed.position.y = 2.82;
      const header = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.54, 0.22), [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, kioskSoffitMat, signFace, signFace]);
      header.position.set(0, 2.86, 1.05);
      kg.add(base, top, topLed, header);
      addStaff(0, -0.15, '#166534');
    } else if (k.id === 'k-haagen') {
      // 8. Photo-matched SK5 HÄAGEN-DAZS: White-brick pier & oak-planter open café seating island w/ burgundy chairs & warm coral pendants!
      const deck = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 3.2), lightOakMat);
      deck.position.y = 0.04;
      const counter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.00, 1.15), norenCrimsonMat);
      counter.position.set(-0.4, 0.54, -0.55);
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.52, 0.08, 1.26), cafeMarbleMat);
      top.position.set(-0.4, 1.08, -0.55);
      const gelCase = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.54, 0.86), intGlassPhysMat);
      gelCase.position.set(-0.4, 1.38, -0.25);
      const brickPier = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.95, 0.85), satinWhiteMat);
      brickPier.position.set(1.85, 1.50, -0.85);
      const hdSign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.56, 0.22), [norenCrimsonMat, norenCrimsonMat, norenCrimsonMat, kioskSoffitMat, signFace, signFace]);
      hdSign.position.set(-0.2, 2.86, -0.85);
      for (const cx of [-1.2, 0.6]) {
        const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.74, 14), cafeMarbleMat);
        tbl.position.set(cx, 0.42, 0.98);
        const chr = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.78, 0.44), norenCrimsonMat);
        chr.position.set(cx + 0.58, 0.42, 0.98);
        const pend = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#fb7185' }));
        pend.position.set(cx, 2.38, 0.55);
        kg.add(tbl, chr, pend);
      }
      kg.add(deck, counter, top, gelCase, brickPier, hdSign);
      addStaff(-0.4, -0.95, '#4c0519');
    } else if (k.id === 'k-chizu') {
      // 9. Photo-matched SK28 CHIZU チズ: Warm vertical timber-slatted Japanese pergola + white clapboard counter!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.00, 2.2), satinWhiteMat);
      base.position.y = 0.50;
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.32, 0.08, 2.32), lightOakMat);
      top.position.y = 1.04;
      for (let sl = -6; sl <= 6; sl++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.75, 0.10), lightOakMat);
        slat.position.set(sl * 0.32, 1.42, -1.02);
        kg.add(slat);
      }
      const header = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.58, 0.34), [lightOakMat, lightOakMat, lightOakMat, kioskSoffitMat, signFace, signFace]);
      header.position.set(0, 2.82, -0.82);
      const toastCase = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.48, 0.68), intGlassPhysMat);
      toastCase.position.set(0.65, 1.32, 0.62);
      kg.add(base, top, header, toastCase);
      addStaff(-0.35, -0.15, '#78350f');
    } else if (k.id === 'k-cinnabon') {
      // 10. Photo-matched GK108 CINNABON: Warm fluted-oak slatted counter w/ illuminated glass cinnamon-roll warmer & navy/white oval plaques!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.00, 2.3), lightOakMat);
      base.position.y = 0.50;
      for (let fl = -12; fl <= 12; fl++) {
        const flute = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.94, 6), smokedOakMat);
        flute.position.set(fl * 0.17, 0.50, 1.16);
        kg.add(flute);
      }
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.08, 2.42), cafeMarbleMat);
      top.position.y = 1.04;
      const rollWarmer = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.62, 0.82), intGlassPhysMat);
      rollWarmer.position.set(0.55, 1.40, 0.62);
      const warmerGlow = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.06, 0.68), intLightWarmMat);
      warmerGlow.position.set(0.55, 1.68, 0.62);
      const ovalPlaque = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 24), [zusRoyalBlueMat, zusRoyalBlueMat, zusRoyalBlueMat]);
      ovalPlaque.rotation.x = Math.PI / 2;
      ovalPlaque.scale.set(1.65, 1.0, 0.52);
      ovalPlaque.position.set(0, 2.75, -0.72);
      const header = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.56, 0.24), [zusRoyalBlueMat, zusRoyalBlueMat, zusRoyalBlueMat, kioskSoffitMat, signFace, signFace]);
      header.position.set(0, 2.76, -0.62);
      kg.add(base, top, rollWarmer, warmerGlow, ovalPlaque, header);
      addStaff(-0.55, -0.15, '#1e3a8a');
    } else if (k.id === 'k-nespresso') {
      // 11. Photo-matched GK104 NESPRESSO: Matte-black & walnut luxury boutique w/ glowing backlit colorful coffee-capsule wall matrix!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.00, 2.2), obsidianGlossMat);
      base.position.y = 0.50;
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.08, 2.32), smokedOakMat);
      top.position.y = 1.04;
      const capWall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.55, 0.28), obsidianGlossMat);
      capWall.position.set(0, 1.48, -0.95);
      const capCols = ['#dc2626', '#7c3aed', '#16a34a', '#d97706', '#0284c7', '#be185d', '#ca8a04'];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 12; c++) {
          const cap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.06), new THREE.MeshBasicMaterial({ color: capCols[(r + c) % capCols.length] }));
          cap.position.set(-1.65 + c * 0.30, 0.92 + r * 0.28, -0.78);
          kg.add(cap);
        }
      }
      const header = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.56, 0.28), [obsidianGlossMat, obsidianGlossMat, obsidianGlossMat, kioskSoffitMat, signFace, signFace]);
      header.position.set(0, 2.86, -0.85);
      kg.add(base, top, capWall, header);
      addStaff(0.35, -0.10, '#18181b');
    } else if (k.id === 'k-mynews2f') {
      // 12. Photo-matched SK109 myNEWS: Matte-black LED-outlined beverage & orange-trimmed convenience kiosk w/ chilled grab-and-go drink cooler!
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.00, 2.2), obsidianGlossMat);
      base.position.y = 0.50;
      const oBand = new THREE.Mesh(new THREE.BoxGeometry(4.26, 0.14, 2.26), orangeAccentMat);
      oBand.position.y = 0.96;
      const chiller = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.05, 0.72), obsidianGlossMat);
      chiller.position.set(-1.05, 1.025, -0.68);
      const chGlass = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.65, 0.06), intGlassPhysMat);
      chGlass.position.set(-1.05, 1.15, -0.30);
      const header = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.62, 0.32), [orangeAccentMat, orangeAccentMat, orangeAccentMat, kioskSoffitMat, signFace, signFace]);
      header.position.set(0, 2.72, -0.68);
      kg.add(base, oBand, chiller, chGlass, header);
      addStaff(0.75, -0.10, '#ea580c');
    } else {
      // 13. Photo-matched EK5 NEWSPLUS: Open cinema snacks & grab-and-go newsstand w/ glowing red/white newsplus sign, tiered snack racks & cold drink chiller (ZERO espresso machine!)
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.94, 2.2), satinWhiteMat);
      base.position.y = 0.47;
      const redBand = new THREE.Mesh(new THREE.BoxGeometry(4.46, 0.16, 2.26), jayaRedPortalMat);
      redBand.position.y = 0.90;
      // Tiered grab-and-go snack racks + illuminated cold drink chiller!
      const rackCols = ['#facc15', '#ef4444', '#38bdf8', '#22c55e', '#f97316'];
      for (let sh = 0; sh < 3; sh++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 0.46), brushedAlumMat);
        shelf.position.set(-0.95, 1.18 + sh * 0.42, -0.55);
        kg.add(shelf);
        for (let sn = 0; sn < 6; sn++) {
          const bag = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.14), new THREE.MeshStandardMaterial({ color: rackCols[(sh + sn) % rackCols.length], roughness: 0.4 }));
          bag.position.set(-1.8 + sn * 0.34, 1.34 + sh * 0.42, -0.52);
          kg.add(bag);
        }
      }
      const chiller = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.05, 0.72), obsidianGlossMat);
      chiller.position.set(1.25, 1.025, -0.62);
      const chGlow = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.62, 0.05), sportLedBarMat);
      chGlow.position.set(1.25, 1.16, -0.24);
      const npMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('newsplus', 'CINEMA SNACKS • DRINKS • EK5', '#dc2626', '#ffffff', '#fde047', 512, 128) });
      const header = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.62, 2.24), [npMat, npMat, jayaRedPortalMat, kioskSoffitMat, npMat, npMat]);
      header.position.set(0, 2.68, 0.0);
      kg.add(base, redBand, chiller, chGlow, header);
      addStaff(0.15, 0.22, '#dc2626');
    }

    root.add(kg);
    addContactShadow(k.x, fy, k.z, 5.8, 4.2);

    interactables.push({
      id: `kiosk-${k.id}`,
      position: new THREE.Vector3(k.x, fy + 1.35, k.z),
      radius: 5.2,
      priority: 2,
      prompt: `[E] ${k.kind === 'perfume' || k.kind === 'tech' ? 'Browse' : 'Order at'} ${k.name} (${k.lot}) — ${k.sub}`,
      actionType: 'visit-kiosk',
      kiosk: k
    });
  }

  // ==========================================================================
  // 6B. STAFFED 3D CONCIERGE DESKS, 3F VR HOLOGATE POD, CINEMA FOYERS & FURNITURE VIGNETTES!
  // ==========================================================================
  const conciergeSpecs = [
    { f: 0, x: -155.5, z: -11.8, rotY: 0, title: '1U CONCIERGE', sub: '1UE E-STREET • ONECARD' },
    { f: 3, x: -46.0, z: 14.5, rotY: -Math.PI / 2, title: '2F CONCIERGE', sub: 'OLD WING INFORMATION DESK' },
    { f: 4, x: 75.5, z: 16.5, rotY: Math.PI, title: '3F CONCIERGE', sub: 'ONESHOP • CLICK & CARRY' }
  ];
  for (const cs of conciergeSpecs) {
    const fy = FLOORS[cs.f].y;
    const cg = new THREE.Group();
    cg.position.set(cs.x, fy, cs.z);
    cg.rotation.y = cs.rotY;
    const deskBase = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.05, 1.45),
      new THREE.MeshStandardMaterial({ color: '#701a3c', roughness: 0.38, metalness: 0.22 })
    );
    deskBase.position.y = 0.525;
    const deskToe = new THREE.Mesh(new THREE.BoxGeometry(4.28, 0.05, 1.52), warmToeKickMat);
    deskToe.position.y = 0.04;
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.10, 1.6), counterMarbleMat);
    deskTop.position.y = 1.08;
    const deskSignMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture(cs.title, cs.sub, '#500724', '#ffffff', '#fbbf24') });
    const deskSign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.74), deskSignMat);
    deskSign.position.set(0, 0.58, 0.74);
    const deskSignBack = deskSign.clone();
    deskSignBack.position.z = -0.74;
    deskSignBack.rotation.y = Math.PI;
    // Overhead illuminated Concierge canopy sign on thin brass posts so unmistakably legible from every corridor angle!
    for (const px of [-1.85, 1.85]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.55, 8), brassGoldMat);
      p.position.set(px, 1.88, 0);
      cg.add(p);
    }
    const topSign = new THREE.Mesh(
      new THREE.BoxGeometry(3.9, 0.54, 0.22),
      [bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, kioskSoffitMat, deskSignMat, deskSignMat]
    );
    topSign.position.set(0, 2.75, 0);
    // Sculpted Articulated Concierge Officer + dual info monitors (ZERO primitive cylinder/sphere puppet!)
    const concOfficer = createSculptedHumanRig(91 + conciergeSpecs.indexOf(cs) * 5, {
      allowBag: false,
      idlePose: true,
      shirtHex: '#831843',
      pantsHex: '#2c3442'
    });
    concOfficer.group.position.set(0, 0, -0.32);
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.36, 0.08), darkFasciaTrimMat);
    monitor.position.set(-1.1, 1.32, 0.12);
    const monitorR = monitor.clone();
    monitorR.position.x = 1.1;
    cg.add(deskBase, deskToe, deskTop, deskSign, deskSignBack, topSign, concOfficer.group, monitor, monitorR);
    root.add(cg);
    addContactShadow(cs.x, fy, cs.z, 5.2, 2.5);

    interactables.push({
      id: `concierge-${cs.f}-${cs.x}`,
      position: new THREE.Vector3(cs.x, fy + 1.35, cs.z),
      radius: 5.5,
      priority: 3,
      prompt: `[E] Ask ${cs.title} (${cs.sub}) & Open Fast-Travel Directory`,
      actionType: 'open-directory'
    });
  }

  // 3F 1UE T601 3D VR Hologate Arena Pod, Guardrails, Cable Booms, Check-In Kiosk & Spectator Monitors (Transforms 3F-01!)
  {
    const vrG = new THREE.Group();
    vrG.position.set(-169.5, 24.0, -2.5);
    const vrPad = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.16, 7.2),
      new THREE.MeshStandardMaterial({ color: '#1e1b4b', roughness: 0.35, metalness: 0.4 })
    );
    vrPad.position.y = 0.08;
    const vrGlow = new THREE.Mesh(new THREE.BoxGeometry(7.35, 0.06, 7.35), new THREE.MeshBasicMaterial({ color: '#22d3ee' }));
    vrGlow.position.y = 0.16;
    const cyanRailMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    for (const px of [-3.3, 3.3]) {
      for (const pz of [-3.3, 3.3]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.65, 0.24), darkFasciaTrimMat);
        col.position.set(px, 1.98, pz);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.42), steelHandrailMat);
        foot.position.set(px, 0.23, pz);
        vrG.add(col, foot);
      }
    }
    // Glowing perimeter safety rails (open front-east entry) + overhead cable boom arms!
    for (const [rx, rz, rw, rd] of [[0, -3.3, 6.4, 0.08], [0, 3.3, 6.4, 0.08], [-3.3, 0, 0.08, 6.4]]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.08, rd), cyanRailMat);
      rail.position.set(rx, 1.05, rz);
      const glassP = new THREE.Mesh(new THREE.BoxGeometry(rw > 1 ? rw : 0.04, 0.85, rd > 1 ? rd : 0.04), glassBalustradeMat);
      glassP.position.set(rx, 0.62, rz);
      vrG.add(rail, glassP);
    }
    for (const [bx, bz] of [[-1.3, 0.8], [1.4, -0.7]]) {
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.55, 6), steelHandrailMat);
      boom.position.set(bx, 2.68, bz);
      vrG.add(boom);
    }
    const vrSignMat = new THREE.MeshBasicMaterial({ map: createSignBoardTexture('HOLOGATE VR ARENA', 'NEXTGEN T601 • 4-PLAYER FREE-ROAM', '#1e1b4b', '#ffffff', '#22d3ee') });
    const vrBeam = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.85, 6.8), [vrSignMat, vrSignMat, darkFasciaTrimMat, kioskSoffitMat, vrSignMat, vrSignMat]);
    vrBeam.position.y = 3.65;
    // 2 Real Rigged .glb VR Players with glowing cyan VR visors inside the arena!
    [[-1.3, 0.8], [1.4, -0.7]].forEach(([vx, vz], vi) => {
      const rig = createSculptedHumanRig(301 + vi * 7, { allowBag: false, idlePose: true });
      rig.group.position.set(vx, 0.16, vz);
      rig.group.rotation.y = vi === 0 ? 0.65 : -1.1;
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.08, 0.14), new THREE.MeshBasicMaterial({ color: '#38bdf8' }));
      visor.position.set(vx, 1.74, vz + 0.06);
      vrG.add(rig.group, visor);
    });
    // Staffed Hologate VR Check-In Counter + Dual Live Spectator Screens on front-right flank (3F-01!)
    const vrDesk = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.04, 3.2), new THREE.MeshStandardMaterial({ color: '#312e81', roughness: 0.38 }));
    vrDesk.position.set(5.4, 0.52, -1.8);
    const vrDeskTop = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.09, 3.32), counterMarbleMat);
    vrDeskTop.position.set(5.4, 1.08, -1.8);
    const vrDeskSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 0.66),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('VR CHECK-IN & SCORES', 'HOLOGATE • NEXTGEN T601', '#0f172a', '#67e8f9', '#ec4899') })
    );
    vrDeskSign.rotation.y = Math.PI / 2;
    vrDeskSign.position.set(6.05, 0.56, -1.8);
    const vrStaffRig = createSculptedHumanRig(325, { allowBag: false, idlePose: true, shirtHex: '#db2777' });
    vrStaffRig.group.position.set(4.5, 0, -1.8);
    vrStaffRig.group.rotation.y = Math.PI / 2;
    // Live Spectator Scoreboard TV Pedestal!
    const tvPole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.05, 1.65), darkFasciaTrimMat);
    tvPole.position.set(5.4, 1.025, 2.4);
    const tvScr = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 0.88),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('LIVE VR LEADERBOARD', 'TEAM ALPHA 9,420 • NEXTGEN', '#09090b', '#38bdf8', '#f472b6') })
    );
    tvScr.rotation.y = Math.PI / 2;
    tvScr.position.set(5.51, 1.48, 2.4);
    // Foreground upholstered lounge benches framing the VR plaza
    for (const [bx, bz] of [[7.8, 5.2], [6.2, -6.2]]) {
      const lb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.46, 0.82), leatherBenchMat);
      lb.position.set(bx, 0.23, bz);
      const lBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.72), darkFasciaTrimMat);
      lBase.position.set(bx, 0.06, bz);
      vrG.add(lb, lBase);
    }
    vrG.add(vrPad, vrGlow, vrBeam, vrDesk, vrDeskTop, vrDeskSign, vrStaffRig.group, tvPole, tvScr);
    root.add(vrG);
    addContactShadow(-169.5, 24.0, -2.5, 8.2, 8.2);
    interactables.push({
      id: 'hologate-vr-arena',
      position: new THREE.Vector3(-164.5, 25.3, -2.5),
      radius: 8.5,
      priority: 3,
      prompt: '[E] Play NextGen T601 Hologate 4-Player Free-Roam VR Match (+150 UPoints)',
      actionType: 'play-vr'
    });
  }

  // 3F 1UE -> Old Wing Illuminated Portal Arch (Spans open walkway in 3F-02!)
  {
    const linkG = new THREE.Group();
    linkG.position.set(-132.8, 24.0, 0);
    linkG.rotation.y = Math.PI / 2;
    for (const px of [-6.8, 6.8]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 4.8, 0.42), darkFasciaTrimMat);
      pillar.position.set(px, 2.4, 0);
      linkG.add(pillar);
    }
    const portalMat = new THREE.MeshBasicMaterial({
      map: createSignBoardTexture('3F LINK TO TGV IMAX CINEMAS', 'OLD WING EZ101 • CELEBRITY FITNESS • THE LEDGE', '#4c0519', '#ffffff', '#f43f5e', 1024, 128)
    });
    const portalHeader = new THREE.Mesh(new THREE.BoxGeometry(14.0, 1.05, 0.35), [darkFasciaTrimMat, darkFasciaTrimMat, darkFasciaTrimMat, kioskSoffitMat, portalMat, portalMat]);
    portalHeader.position.y = 4.35;
    linkG.add(portalHeader);
    root.add(linkG);
  }

  // LG126 AEON SUPERMARKET TROLLEY BAY, PRODUCE PROMO DISPLAY & WELCOME PORTAL (LG-05 Real2Sim Polish!)
  {
    const aeonG = new THREE.Group();
    aeonG.position.set(-37.5, 0.0, 19.6);
    const promoIsland = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.85, 1.4), new THREE.MeshStandardMaterial({ color: '#9d174d', roughness: 0.42 }));
    promoIsland.position.set(0, 0.425, 0);
    const pCols = ['#22c55e', '#facc15', '#ef4444', '#f97316'];
    for (let i = 0; i < 4; i++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 0.95), new THREE.MeshStandardMaterial({ color: pCols[i], roughness: 0.6 }));
      crate.position.set(-1.05 + i * 0.70, 0.98, 0);
      aeonG.add(crate);
    }
    // Neat row of metallic shopping trolleys beside AEON entrance!
    for (let t = 0; t < 4; t++) {
      const cart = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.82), new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.7, roughness: 0.3, wireframe: true }));
      cart.position.set(2.8 + t * 0.34, 0.56, 0.4);
      aeonG.add(cart);
    }
    aeonG.add(promoIsland);
    root.add(aeonG);
  }

  // 3F SPORTSZONE CELEBRITY FITNESS 3D STUDIO EQUIPMENT & MEMBERSHIP PODIUM (3F-06 Polish!)
  {
    const gymG = new THREE.Group();
    gymG.position.set(-10.0, 24.0, 0);
    // Sleek Celebrity Fitness Membership Promo Standee + Lounge Benches on bridge edges
    const promo = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 0.24), darkFasciaTrimMat);
    promo.position.set(-3.5, 1.0, -7.8);
    const promoSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.96, 1.45),
      new THREE.MeshBasicMaterial({ map: createSignBoardTexture('JOIN CELEBRITY FITNESS', 'EZ216A • FREE TRIAL PASS', '#7f1d1d', '#ffffff', '#ef4444', 256, 384) })
    );
    promoSign.position.set(-3.5, 1.12, -7.67);
    const gymBenchN = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.48, 0.75), leatherBenchMat);
    gymBenchN.position.set(2.5, 0.24, -8.2);
    const gymBenchS = gymBenchN.clone();
    gymBenchS.position.set(-1.5, 0.24, 8.2);
    // 3D Spin bikes visible just inside front studio bays
    for (let s = 0; s < 3; s++) {
      const bike = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 14), new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3, metalness: 0.6 }));
      bike.rotation.x = Math.PI / 2;
      bike.position.set(-5.0 + s * 3.8, 0.52, -9.2);
      const bikeBase = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.38), darkFasciaTrimMat);
      bikeBase.position.set(-5.0 + s * 3.8, 0.08, -9.2);
      gymG.add(bike, bikeBase);
    }
    gymG.add(promo, promoSign, gymBenchN, gymBenchS);
    root.add(gymG);
    interactables.push({
      id: 'celebrity-fitness-studio',
      position: new THREE.Vector3(-10.0, 25.3, -5.5),
      radius: 8.5,
      priority: 3,
      prompt: '[E] Join Celebrity Fitness EZ216A Spin Class (+28% Stamina Speed Boost)',
      actionType: 'order-kopi'
    });
  }

  // Cinema Foyer Velvet Stanchions, Self-Ticketing E-Kiosks & Movie Standees (3F TGV EZ101 + 4F GSC EZ403!)
  const cinemaFoyers = [
    { f: 4, x: -102, z: -20.2, accent: '#0284c7', title: 'MAYBANK IMAX' },
    { f: 5, x: 56, z: -20.4, accent: '#eab308', title: 'GSC BIG 4DX' }
  ];
  const velvetRopeMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.55 });
  for (const cf of cinemaFoyers) {
    const fy = FLOORS[cf.f].y;
    const fg = new THREE.Group();
    fg.position.set(cf.x, fy, cf.z);
    // 3 Self-Ticketing E-Kiosks
    for (let k = -1; k <= 1; k++) {
      const ek = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.85, 0.42), darkFasciaTrimMat);
      ek.position.set(-6.5 + k * 1.4, 0.925, 0);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.82), new THREE.MeshBasicMaterial({ map: createSignBoardTexture(cf.title, 'E-TICKETING', '#0f172a', '#ffffff', cf.accent) }));
      scr.position.set(-6.5 + k * 1.4, 1.25, 0.22);
      fg.add(ek, scr);
    }
    // Crimson velvet queue stanchion row
    for (let s = 0; s < 5; s++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.92, 8), brassGoldMat);
      post.position.set(1.0 + s * 1.8, 0.46, 0.6);
      fg.add(post);
      if (s < 4) {
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.8, 6), velvetRopeMat);
        rope.rotation.z = Math.PI / 2;
        rope.position.set(1.9 + s * 1.8, 0.72, 0.6);
        fg.add(rope);
      }
    }
    root.add(fg);
    interactables.push({
      id: `cinema-foyer-${cf.f}`,
      position: new THREE.Vector3(cf.x, fy + 1.35, cf.z + 2.8),
      radius: 8.5,
      priority: 3,
      prompt: `[E] Book ${cf.title} Premiere Tickets & Caramel Popcorn Combo (+150 UPoints)`,
      actionType: 'cinema-ticket',
      cinemaTitle: cf.title
    });
  }

  // 3D Luxury Furniture Showroom Feature Vignettes (3F XZQT OV301, 4F Cellini OV401, 4F Stanzo OV501!)
  const furnDisplays = [
    { f: 4, x: 148, z: -21.2, rotY: 0, sofaCol: '#d6d3d1', accent: '#f59e0b' },
    { f: 5, x: 146, z: -21.2, rotY: 0, sofaCol: '#9a3412', accent: '#38bdf8' },
    { f: 5, x: 170.5, z: -4.5, rotY: -Math.PI / 2, sofaCol: '#334155', accent: '#eab308' }
  ];
  for (const fd of furnDisplays) {
    const fy = FLOORS[fd.f].y;
    const fg = new THREE.Group();
    fg.position.set(fd.x, fy, fd.z);
    fg.rotation.y = fd.rotY;
    const rug = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.04, 2.8), new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 }));
    rug.position.y = 0.02;
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 0.95), new THREE.MeshStandardMaterial({ color: fd.sofaCol, roughness: 0.55 }));
    sofaBase.position.set(0, 0.28, -0.45);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.65, 0.24), new THREE.MeshStandardMaterial({ color: fd.sofaCol, roughness: 0.55 }));
    sofaBack.position.set(0, 0.68, -0.82);
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.36, 0.72), counterMarbleMat);
    table.position.set(0, 0.22, 0.65);
    const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.9, 8), brassGoldMat);
    lampPole.position.set(1.75, 0.95, -0.4);
    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.34, 12), new THREE.MeshStandardMaterial({ color: fd.accent, emissive: '#fde68a', emissiveIntensity: 0.35 }));
    lampShade.position.set(1.75, 1.85, -0.4);
    fg.add(rug, sofaBase, sofaBack, table, lampPole, lampShade);
    root.add(fg);
  }

  // Designer Cushioned Leather Planter-Benches (100% ON SOLID FLOORS & CLEAR OF ALL 70 CAMERA SIGHTLINES!)
  const benchSpots = [
    // LG (Includes sculptural LG Oval perimeter concourse benches framing Ferrari & KyoChon cleanly!)
    { f: 0, x: -162.5, z: 9.5 }, { f: 0, x: -152.0, z: 3.5 }, { f: 0, x: -114, z: -7.5 }, { f: 0, x: -45, z: 15.8 }, { f: 0, x: -20, z: -4.8 }, { f: 0, x: 64, z: -3.0 }, { f: 0, x: 112, z: -5.0 }, { f: 0, x: 123.5, z: -14.2 }, { f: 0, x: 120.5, z: 15.8 },
    // G (Moved (-74, 15.5) -> (-64, 13.8) clear of Starbucks a2 & (-168, 7.5) -> (-161.5, 11.8) clear of MRT Skywalk!)
    { f: 1, x: -161.5, z: 11.8 }, { f: 1, x: -146, z: 5.5 }, { f: 1, x: -146, z: -3.0 }, { f: 1, x: -74, z: -15.5 }, { f: 1, x: -64, z: 13.8 }, { f: 1, x: -10, z: 3.2 }, { f: 1, x: 74, z: -13.0 }, { f: 1, x: 96, z: 12.5 }, { f: 1, x: 114, z: -10.5 }, { f: 1, x: 119.5, z: -19.8 },
    // 1F (Moved (-152, 6.5) -> (-146.5, 2.5) 100% clear of 1F-02 lens!)
    { f: 2, x: -146.5, z: 2.5 }, { f: 2, x: -74, z: -15.5 }, { f: 2, x: -74, z: 15.5 }, { f: 2, x: 86, z: 13.5 }, { f: 2, x: 114, z: 10.5 }, { f: 2, x: 129, z: -18.8 },
    // 2F (Added Highstreet walkway bench at (85, -10.5) for 2F-08; cleared (129, -18.8) from 2F-10 Pop Mart sightline!)
    { f: 3, x: -152, z: -1.5 }, { f: 3, x: -74, z: -15.5 }, { f: 3, x: -74, z: 15.5 }, { f: 3, x: -14, z: -4.2 }, { f: 3, x: 74, z: 14.5 }, { f: 3, x: 85, z: -10.5 }, { f: 3, x: 114, z: 10.5 }, { f: 3, x: 142, z: 16.2 },
    // 3F (Added 1UE mezzanine planter at (-157, 9.5) for 3F-01!)
    { f: 4, x: -157.5, z: 9.8 }, { f: 4, x: -152, z: -10.5 }, { f: 4, x: -74, z: -15.5 }, { f: 4, x: -74, z: 15.5 }, { f: 4, x: 38, z: -16.2 }, { f: 4, x: 84, z: 10.5 }, { f: 4, x: 129, z: -18.8 }, { f: 4, x: 142, z: 16.2 },
    // 4F–5F Entertainment Zone & Oval
    { f: 5, x: 64, z: -1.5 }, { f: 5, x: 76, z: 10.5 }, { f: 5, x: 102, z: 0 }, { f: 5, x: 130, z: 16.8 }, { f: 5, x: 129, z: -18.8 }
  ];

  // Architectural Travertine, Slatted-Oak & Sculpted Curved-Bolster Leather Designer Concourse Planter-Benches (ZERO overlapping rectangular blocks!)
  const benchSoilMat = new THREE.MeshStandardMaterial({ color: '#2b2016', roughness: 0.94 });
  const benchCaramelMat = new THREE.MeshStandardMaterial({ color: '#7a5438', roughness: 0.56, metalness: 0.06, envMapIntensity: 0.42 });
  const benchSlatGeo = new THREE.BoxGeometry(0.08, 0.42, 0.06);
  // Smooth rounded continuous circular leather bolster cushion profile (beveled top & radiused edge!)
  const cushionProfile = [
    new THREE.Vector2(0.84, 0.40),
    new THREE.Vector2(1.62, 0.40),
    new THREE.Vector2(1.66, 0.44),
    new THREE.Vector2(1.64, 0.50),
    new THREE.Vector2(1.56, 0.53),
    new THREE.Vector2(0.92, 0.53),
    new THREE.Vector2(0.84, 0.48),
    new THREE.Vector2(0.84, 0.40)
  ];
  const curvedCushionGeo = new THREE.LatheGeometry(cushionProfile, 64);
  curvedCushionGeo.computeVertexNormals();
  for (const bs of benchSpots) {
    const fy = FLOORS[bs.f].y;
    const bg = new THREE.Group();
    bg.position.set(bs.x, fy, bs.z);

    // Recessed dark architectural shadow plinth + soft 3000K under-bench LED toe-kick halo
    const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.56, 0.10, 48), matteSteelMat);
    baseRing.position.y = 0.05;
    const ledToe = new THREE.Mesh(new THREE.TorusGeometry(1.56, 0.022, 6, 48), warmCoveLedMat);
    ledToe.rotation.x = Math.PI / 2;
    ledToe.position.y = 0.10;
    // Smooth 64-segment cream-travertine stone bench base + continuous beveled tan-leather cushion ring (ZERO radial Z-fighting seams!)
    const stoneDrum = new THREE.Mesh(new THREE.CylinderGeometry(1.66, 1.62, 0.32, 64), ivoryStoneMat);
    stoneDrum.position.y = 0.26;
    const brassRing = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.020, 8, 64), brassGoldMat);
    brassRing.rotation.x = Math.PI / 2;
    brassRing.position.y = 0.41;
    const cushionRing = new THREE.Mesh(curvedCushionGeo, benchCaramelMat);
    cushionRing.castShadow = true;
    cushionRing.receiveShadow = true;
    // Vertical slatted warm-oak inner planter surround + dark bark soil mulch!
    const potCore = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.72, 0.88, 24), smokedOakMat);
    potCore.position.y = 0.44;
    for (let sl = 0; sl < 16; sl++) {
      const a = (sl / 16) * Math.PI * 2;
      const slat = new THREE.Mesh(benchSlatGeo, hinokiWoodMat);
      slat.position.set(Math.cos(a) * 0.78, 0.66, Math.sin(a) * 0.78);
      slat.rotation.y = -a + Math.PI / 2;
      bg.add(slat);
    }
    const soilCap = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.05, 18), benchSoilMat);
    soilCap.position.y = 0.88;
    const palm = createIndoorPalm(1.12);
    palm.position.y = 0.86;

    bg.add(baseRing, ledToe, stoneDrum, brassRing, cushionRing, potCore, soilCap, palm);
    root.add(bg);
    addContactShadow(bs.x, fy, bs.z, 4.4, 4.4);
  }

  // Symmetrical Printed 1 Utama Branded Vertical Hanging Atrium Banners (Exact per-atrium ceiling cable clamps — ZERO floating/protruding rods!)
  const bannerDefs = [
    // Old Wing Centre Court symmetrical quad (skylight ceiling y = 30.0)
    { x: -86, y: 20, z: -9.8, ceilY: 30.0, t: 'CENTRE COURT', s: 'OLD WING 1995', bg: '#78350f', ac: '#fbbf24' },
    { x: -62, y: 20, z: -9.8, ceilY: 30.0, t: 'AEON • UNIQLO', s: 'OLD WING FLAGSHIPS', bg: '#831843', ac: '#f472b6' },
    { x: -86, y: 20, z: 9.8, ceilY: 30.0, t: 'SEPHORA • MUJI', s: 'CENTRE COURT', bg: '#064e3b', ac: '#34d399' },
    { x: -62, y: 20, z: 9.8, ceilY: 30.0, t: 'TGV IMAX 3F', s: 'LASER CINEMA', bg: '#4c0519', ac: '#f43f5e' },
    // Highstreet void banners (stops strictly at 3F ceiling y = 29.35 -> ZERO rod poking up into 4F-03!)
    { x: 76, y: 21, z: -5.6, ceilY: 29.35, t: 'GF LUXE', s: 'HIGHSTREET', bg: '#0f172a', ac: '#38bdf8' },
    { x: 94, y: 21, z: -5.6, ceilY: 29.35, t: 'GSC 15-HALL', s: '4F ENTERTAINMENT', bg: '#1c1917', ac: '#eab308' },
    { x: 76, y: 21, z: 5.6, ceilY: 29.35, t: 'THE LEDGE 3F', s: 'ART GALLERY', bg: '#312e81', ac: '#c084fc' },
    { x: 94, y: 21, z: 5.6, ceilY: 29.35, t: '2F SPORTSZONE', s: 'NIKE • MACHINES', bg: '#064e3b', ac: '#34d399' },
    // The Oval symmetrical 4-point hanging banners (dome ceiling y = 36.85)
    { x: 127, y: 26, z: -11.4, ceilY: 36.85, t: 'THE OVAL', s: 'PARKSON ELITE', bg: '#1e1b4b', ac: '#fde047' },
    { x: 149, y: 26, z: -11.4, ceilY: 36.85, t: 'POP MART • XZQT', s: 'NEW WING OVAL', bg: '#7c2d12', ac: '#fb923c' },
    { x: 127, y: 26, z: 11.4, ceilY: 36.85, t: 'SECRET GARDEN', s: 'UPPER ROOF UR603A', bg: '#064e3b', ac: '#34d399' },
    { x: 149, y: 26, z: 11.4, ceilY: 36.85, t: '1 UTAMA E', s: 'FLOWRIDER • WINDLAB', bg: '#4c1d95', ac: '#f472b6' }
  ];
  for (const bn of bannerDefs) {
    const tex = createAtriumBannerTexture(bn.t, bn.s, bn.bg, bn.ac);
    const bMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.08 });
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 6.8, 0.08),
      [bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, bMat, bMat]
    );
    banner.position.set(bn.x, bn.y, bn.z);
    // Exact clamped steel suspension cable terminating cleanly inside atrium ceiling!
    const topOfBanner = bn.y + 3.4;
    const cableLen = Math.max(0.5, bn.ceilY - topOfBanner);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, cableLen, 6), steelHandrailMat);
    cable.position.set(bn.x, topOfBanner + cableLen * 0.5, bn.z);
    root.add(banner, cable);
  }

  // ==========================================================================
  // 7. OVERHEAD WAYFINDING SIGNS (VERIFIED 2025 WALKTHROUGH WING COLORS + ZERO ESCALATOR CLIPPING!) & DIGITAL TOTEMS
  // ==========================================================================
  // Authentic 1 Utama Wing Color Bands verified in 2025 walkthrough video:
  //  • Old Wing: warm terracotta `#9e3223`
  //  • Promenade: slate-teal `#2e5d75`
  //  • Rainforest: forest-green `#1d4e34`
  //  • Highstreet: deep burgundy `#7d2938`
  //  • LUXE G: champagne-gold `#9c8459`
  //  • The Oval: olive-gold `#a89d20`
  const createAuthenticWingWayfindingTexture = (leftText, centerBadge, rightText, wingColor, leftWingColor, rightWingColor) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 176;
    const ctx = canvas.getContext('2d');
    // Dark brushed-espresso architectural sign body
    ctx.fillStyle = '#141619';
    ctx.fillRect(0, 0, 1024, 176);
    // Prominent top & bottom wing-color-coded bands
    ctx.fillStyle = wingColor;
    ctx.fillRect(0, 0, 1024, 16);
    ctx.fillRect(0, 160, 1024, 16);
    // Left & right destination wing color accent tabs
    ctx.fillStyle = leftWingColor || wingColor;
    ctx.fillRect(14, 34, 10, 108);
    ctx.fillStyle = rightWingColor || wingColor;
    ctx.fillRect(1000, 34, 10, 108);
    // Left & right high-contrast directional text
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 23px "Plus Jakarta Sans", "Montserrat", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(leftText, 36, 88, 336);
    ctx.textAlign = 'right';
    ctx.fillText(rightText, 988, 88, 336);
    // Central Wing-Color-Coded Zone Badge with crisp white typography & champagne hairline border
    ctx.fillStyle = wingColor;
    ctx.fillRect(384, 28, 256, 120);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.strokeRect(386, 30, 252, 116);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '900 26px "Plus Jakarta Sans", "Montserrat", sans-serif';
    ctx.fillText(centerBadge, 512, 76, 236);
    ctx.fillStyle = '#fde68a';
    ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('1 UTAMA SHOPPING CENTRE', 512, 118, 236);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const signs = [
    { x: -131.5, y: 4.5, ceilY: 5.25, z: 0, rotY: Math.PI / 2, l: '← FLOWRIDER • MODU', c: 'OLD WING • 1UE', r: 'CENTRE COURT • AEON →', a: '#9e3223', la: '#2e5d75', ra: '#9e3223' },
    { x: -131.5, y: 10.5, ceilY: 11.25, z: 0, rotY: Math.PI / 2, l: '← MRT PINTU B • SPORTS DIRECT', c: 'OLD WING', r: 'CENTRE COURT • UNIQLO →', a: '#9e3223', la: '#2e5d75', ra: '#9e3223' },
    { x: -29.0, y: 10.6, ceilY: 11.25, z: 0, rotY: Math.PI / 2, l: '← CENTRE COURT • AEON', c: 'PROMENADE', r: 'RAINFOREST • LUXE G →', a: '#2e5d75', la: '#9e3223', ra: '#1d4e34' },
    { x: 13.5, y: 10.5, ceilY: 11.25, z: 0, rotY: -Math.PI / 2, l: '← PROMENADE • OLD WING', c: 'RAINFOREST', r: 'LUXE G • ZARA • OVAL →', a: '#1d4e34', la: '#2e5d75', ra: '#9c8459' },
    { x: 64.5, y: 10.65, ceilY: 11.25, z: 0, rotY: -Math.PI / 2, l: '← RAINFOREST • PROMENADE', c: 'LUXE G', r: 'COACH • CHANEL • THE OVAL →', a: '#9c8459', la: '#1d4e34', ra: '#a89d20' },
    { x: 68.0, y: 22.6, ceilY: 23.25, z: 0, rotY: -Math.PI / 2, l: '← RAINBOW BRIDGE • FOOD DISTRICT', c: '2F HIGHSTREET', r: 'NIKE • MACHINES • POP MART →', a: '#7d2938', la: '#1d4e34', ra: '#a89d20' },
    { x: 115.0, y: 10.5, ceilY: 11.25, z: 0, rotY: -Math.PI / 2, l: '← LUXE G • CHANEL • COACH', c: 'THE OVAL', r: 'PARKSON ELITE • LIFTS →', a: '#a89d20', la: '#9c8459', ra: '#a89d20' },
    { x: 52.0, y: 35.0, ceilY: 36.0, z: 0, rotY: -Math.PI / 2, l: '← CAMP5 CLIMBING', c: '4F–5F HIGHSTREET', r: 'GSC 15-HALL • WANGSA BOWL →', a: '#7d2938', la: '#1d4e34', ra: '#a89d20' }
  ];

  for (const s of signs) {
    const tex = createAuthenticWingWayfindingTexture(s.l, s.c, s.r, s.a, s.la, s.ra);
    const signMat = new THREE.MeshBasicMaterial({ map: tex });
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 1.15, 0.14),
      [bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, bronzeTrimMat, signMat, signMat]
    );
    board.position.set(s.x, s.y, s.z);
    board.rotation.y = s.rotY;
    root.add(board);
    // Clamped steel ceiling suspension rods anchoring each wayfinding board to its floor soffit!
    const rodTop = s.ceilY || (s.y + 0.75);
    const rodH = Math.max(0.25, rodTop - (s.y + 0.575));
    for (const rOff of [-3.6, 3.6]) {
      const rx = s.x + Math.cos(s.rotY) * rOff;
      const rz = s.z - Math.sin(s.rotY) * rOff;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, rodH, 8), steelHandrailMat);
      rod.position.set(rx, s.y + 0.575 + rodH * 0.5, rz);
      root.add(rod);
    }
  }

  // Double-Sided Illuminated 1 Utama Digital Touch-Directory Totems (100% clear of 1UE Concierge!)
  const kioskLocations = [
    { x: -139, y: 0, z: 2.5, rotY: 0, label: '1 Utama E E-Street Digital Directory' },
    { x: -160, y: 6, z: 5.5, rotY: 0.25, label: '1 Utama E GF MRT & Sports Direct Directory' },
    { x: -50, y: 0, z: 0, rotY: Math.PI / 2, label: 'Old Wing LG Digital Directory' },
    { x: -14, y: 6, z: 5.5, rotY: Math.PI / 2, label: 'GF Promenade Digital Directory' },
    { x: 34, y: 18, z: -15.2, rotY: 0, label: '2F Rainforest & Food District Directory' },
    { x: 115, y: 0, z: -6.5, rotY: -Math.PI / 2, label: 'LG Oval Digital Directory' },
    { x: 58, y: 30, z: -4.5, rotY: 0, label: '4F Entertainment Zone Directory' }
  ];

  const totemTex = createDigitalDirectoryTexture();
  const totemScreenMat = new THREE.MeshBasicMaterial({ map: totemTex });
  for (const kl of kioskLocations) {
    const g = new THREE.Group();
    g.position.set(kl.x, kl.y, kl.z);
    g.rotation.y = kl.rotY;

    const stand = new THREE.Mesh(new THREE.BoxGeometry(1.02, 2.25, 0.24), bronzeTrimMat);
    stand.position.y = 1.125;
    const screenF = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.56), totemScreenMat);
    screenF.position.set(0, 1.24, 0.13);
    const screenB = screenF.clone();
    screenB.position.z = -0.13;
    screenB.rotation.y = Math.PI;
    g.add(stand, screenF, screenB);
    root.add(g);
    addContactShadow(kl.x, kl.y, kl.z, 1.9, 1.9);

    interactables.push({
      id: `kiosk-${kl.x}-${kl.y}`,
      position: new THREE.Vector3(kl.x, kl.y + 1.3, kl.z),
      radius: 4.8,
      prompt: `[E] Open ${kl.label} & Fast-Travel Map`,
      actionType: 'open-directory'
    });
  }

  // Batch static single-material opaque architectural & prop meshes by material to cut ~4,200 draw calls down to ~35!
  collapseStaticMeshes(root, [dustMotes, ...Array.from(floorReflectors.values()).flat()]);

  // Freeze matrices on static architectural meshes (protect SkinnedMesh & Bones for rigged .glb kiosk/concierge staff!)
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (obj !== root && obj !== dustMotes && !obj.isSkinnedMesh && !obj.isBone) {
      obj.matrixAutoUpdate = false;
    }
  });

  let currentReflectorFloor = -1;
  function setActiveFloor(floorIdx, reflectionsEnabled = true, forceRender = false) {
    const key = reflectionsEnabled ? floorIdx : -1;
    if (key === currentReflectorFloor) {
      if (forceRender) {
        for (const r of floorReflectors.get(floorIdx) || []) r.userData.forceNextRender = true;
      }
      return;
    }
    currentReflectorFloor = key;
    for (const [f, list] of floorReflectors.entries()) {
      for (const r of list) {
        r.visible = f === key;
        if (r.visible) r.userData.forceNextRender = true;
      }
    }
  }

  return {
    root,
    skylightMat,
    godRayMaterials,
    setActiveFloor,
    update(elapsed) {
      skylightMat.uniforms.uTime.value = elapsed;
      for (const m of godRayMaterials) m.uniforms.uTime.value = elapsed;
      dustMotes.position.y = Math.sin(elapsed * 0.4) * 0.45;
      dustMotes.rotation.y = elapsed * 0.012;
    }
  };
}
