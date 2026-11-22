import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ============================================================================
// REAL2SIM TRIPLE-A RIGGED .GLB HUMAN SHOPPER ENGINE
// 5 Draco+WebP optimized real-world civilian Mixamo/RPM human models (~2.6 MB total!)
// with genuine motion-captured walking & idle skeletal animations + Malaysian luxury
// mall wardrobe tinting, sculpted leather shopping bags & grounded AO shadows!
// ============================================================================

const MODEL_SPECS = [
  { key: 'remy',   url: '/models/npc_remy.glb',   gender: 'M', targetH: 1.77 },
  { key: 'claire', url: '/models/npc_claire.glb', gender: 'F', targetH: 1.67 },
  { key: 'david',  url: '/models/npc_david.glb',  gender: 'M', targetH: 1.78 }
];

// Contemporary Malaysian luxury mall casual wardrobe tints (natural matte fabrics — ZERO neon or crushed black!)
export const MATTE_CASUAL_TOP_COLORS = [
  '#dcd4c8', // linen cream
  '#637d99', // chambray slate-blue
  '#6c8268', // sage olive
  '#b89474', // camel khaki
  '#8e4a52', // terracotta rose
  '#76828e', // cool heather grey
  '#c8b49a'  // warm sand
];
export const MATTE_CASUAL_BOTTOM_COLORS = [
  '#637d99', // chambray slate-blue
  '#b89474', // camel khaki
  '#76828e', // cool heather grey
  '#dcd4c8', // linen cream
  '#6c8268', // sage olive
  '#c8b49a'  // warm sand
];
const MATTE_SNEAKER_COLORS = ['#dcd4c8', '#76828e', '#c8b49a', '#637d99'];
const BAG_PALETTE = ['#c4b39a', '#4a5568', '#8e4a52', '#52685b', '#b89474', '#dcd4c8'];

let preloadedTemplates = [];
let rawWalkClipM = null;
let rawWalkClipF = null;
let rawIdleClip = null;
let sharedExtras = null;

function createMatteFabricTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Light-neutral #dce0e6 base with fine horizontal/vertical woven cotton/denim micro-grain + subtle crease shading
  ctx.fillStyle = '#dce0e6';
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    const warp = (y & 1) === 0 ? 4 : -4;
    const crease = Math.sin((y / size) * Math.PI * 4) * 5 + Math.cos((y / size) * Math.PI * 10) * 2.5;
    for (let x = 0; x < size; x++) {
      const weft = (x & 1) === 0 ? 3 : -3;
      const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const grain = (hash - Math.floor(hash) - 0.5) * 14;
      const diagWeave = (((x + y) & 3) === 0 ? 3 : -1.5);
      const idx = (y * size + x) * 4;
      const delta = warp + weft + crease + grain + diagWeave;
      d[idx] = Math.max(0, Math.min(255, 220 + delta));
      d[idx + 1] = Math.max(0, Math.min(255, 224 + delta));
      d[idx + 2] = Math.max(0, Math.min(255, 230 + delta));
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createNpcShadowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 2, size * 0.5, size * 0.5, size * 0.5);
  grad.addColorStop(0.0, 'rgba(8, 10, 16, 0.72)');
  grad.addColorStop(0.45, 'rgba(8, 10, 16, 0.36)');
  grad.addColorStop(0.78, 'rgba(8, 10, 16, 0.10)');
  grad.addColorStop(1.0, 'rgba(8, 10, 16, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function getRecoloredDarkClothingTexture(baseMap, hexColor, isCombinedBody = false) {
  const ex = initSharedExtras();
  if (!baseMap || !baseMap.image) return ex.matteFabricTex;
  const cacheKey = `recolor_${baseMap.uuid}_${hexColor}_${isCombinedBody ? 'body' : 'cloth'}`;
  if (ex.texCache.has(cacheKey)) return ex.texCache.get(cacheKey);

  try {
    const srcImg = baseMap.image;
    const w = Math.min(512, srcImg.naturalWidth || srcImg.width || 256);
    const h = Math.min(512, srcImg.naturalHeight || srcImg.height || 256);
    if (w <= 0 || h <= 0) return ex.matteFabricTex;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(srcImg, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const target = new THREE.Color(hexColor);
    const tr = Math.round(target.r * 255);
    const tg = Math.round(target.g * 255);
    const tb = Math.round(target.b * 255);

    for (let y = 0; y < h; y++) {
      const warp = (y & 1) === 0 ? 4 : -4;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Protect ALL skin tones, warm hair tones, and tiny bright eye pixels
        const isSkin = r > g + 8 && r > 64;
        const isWarmHair = r > b + 12 && r > 52;
        const isBrightEye = r > 180 && g > 180 && b > 180;
        if (isSkin || isWarmHair || isBrightEye) continue;

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const isNeutralDarkCloth = (maxC - minC) < 16 && r < 65 && g < 65 && b < 65;
        const isDarkCloth = isCombinedBody ? isNeutralDarkCloth : (r < 68 && g < 68 && b < 68);

        if (isDarkCloth || (!isCombinedBody && r < 96 && g < 96 && b < 96)) {
          const weft = (x & 1) === 0 ? 3 : -3;
          const denom = isCombinedBody ? 65 : 96;
          const lum = Math.min(1, (r * 0.299 + g * 0.587 + b * 0.114) / denom);
          const shade = 0.84 + lum * 0.28;
          const grain = ((((x * 17 + y * 31) & 7) - 3.5) * 2.2) + warp + weft;
          data[i] = Math.max(0, Math.min(255, Math.round(tr * shade + grain)));
          data[i + 1] = Math.max(0, Math.min(255, Math.round(tg * shade + grain)));
          data[i + 2] = Math.max(0, Math.min(255, Math.round(tb * shade + grain)));
        } else if (!isCombinedBody) {
          const weft = (x & 1) === 0 ? 2 : -2;
          const lum255 = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          const lift = 0.88 + lum255 * 0.20;
          const grain = ((((x * 17 + y * 31) & 7) - 3.5) * 1.4) + (warp >> 1) + weft;
          data[i] = Math.max(0, Math.min(255, Math.round(r * 0.5 + tr * lift * 0.5 + grain)));
          data[i + 1] = Math.max(0, Math.min(255, Math.round(g * 0.5 + tg * lift * 0.5 + grain)));
          data[i + 2] = Math.max(0, Math.min(255, Math.round(b * 0.5 + tb * lift * 0.5 + grain)));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY = baseMap.flipY;
    tex.wrapS = baseMap.wrapS;
    tex.wrapT = baseMap.wrapT;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    ex.texCache.set(cacheKey, tex);
    return tex;
  } catch {
    return ex.matteFabricTex;
  }
}

function mergeCleanGeos(geos) {
  const prepared = geos.map((src) => {
    const g = src.index ? src.toNonIndexed() : src.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    return g;
  });
  const merged = mergeGeometries(prepared, false);
  for (const g of prepared) g.dispose();
  return merged;
}

function initSharedExtras() {
  if (sharedExtras) return sharedExtras;
  // Sculpted luxury leather shopping tote (attached directly onto LeftHand bone!)
  const bagBody = new THREE.CylinderGeometry(0.115, 0.132, 0.225, 14);
  bagBody.scale(0.42, 1.0, 1.0);
  bagBody.translate(0, -0.175, 0);
  const bagTop = new THREE.SphereGeometry(0.112, 12, 8);
  bagTop.scale(0.42, 0.22, 0.98);
  bagTop.translate(0, -0.065, 0);
  const bagH1 = new THREE.TorusGeometry(0.055, 0.008, 6, 14, Math.PI);
  bagH1.rotateY(Math.PI / 2);
  bagH1.translate(-0.02, -0.052, 0);
  const bagH2 = new THREE.TorusGeometry(0.055, 0.008, 6, 14, Math.PI);
  bagH2.rotateY(Math.PI / 2);
  bagH2.translate(0.02, -0.052, 0);
  const bagGeo = mergeCleanGeos([bagBody, bagTop, bagH1, bagH2]);
  bagBody.dispose();
  bagTop.dispose();
  bagH1.dispose();
  bagH2.dispose();

  sharedExtras = {
    bagGeo,
    bagMats: BAG_PALETTE.map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.62, metalness: 0.06, envMapIntensity: 0.45 })
    ),
    shadowGeo: new THREE.CircleGeometry(0.46, 20),
    shadowMat: new THREE.MeshBasicMaterial({
      map: createNpcShadowTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1
    }),
    matteFabricTex: createMatteFabricTexture(),
    handleMat: new THREE.MeshStandardMaterial({ color: '#1e2430', roughness: 0.65 }),
    racketHeadMat: new THREE.MeshStandardMaterial({ color: '#723139', roughness: 0.52, metalness: 0.15 }),
    batMat: new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.78, roughness: 0.22 }),
    // Cached tinted clones per template+meshName+hex and recolored CanvasTextures so GPU draw/material count stays ultra lean!
    matCache: new Map(),
    texCache: new Map()
  };
  return sharedExtras;
}

function normalizeBoneName(name) {
  return (name || '')
    .replace(/^mixamorig\d*[:_]?/i, '')
    .replace(/^Armature\|/i, '')
    .trim();
}

const Q_TUCK_IDLE = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.20);
const Q_TUCK_WALK_M_L = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.21);
const Q_TUCK_WALK_M_R = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.14);
const Q_TUCK_WALK_F = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.16);

/**
 * Retarget a Mixamo FBX animation clip cleanly to ANY normalized Mixamo/RPM GLB template:
 * - Strips `.position` & `.scale` tracks (prevents cm-vs-m floating/exploding!)
 * - Pre-multiplies `Hips.quaternion` keys by `qRestHips` so Blender-exported Mixamo GLBs
 *   whose Armature has +90°X / Hips -90°X stay 100% upright on their feet!
 * - Tucks LeftArm/RightArm cleanly along the torso (kills wide splayed A-pose arms!) & tames wrist twist.
 */
function buildRetargetedClip(rawClip, clipName, qRestHips, validBoneSet) {
  if (!rawClip) return null;
  const tracks = [];
  const tmpQ = new THREE.Quaternion();
  const outQ = new THREE.Quaternion();
  const identQ = new THREE.Quaternion();
  const isOffsetHips = Math.abs(qRestHips.x) > 0.25 || Math.abs(qRestHips.y) > 0.25 || Math.abs(qRestHips.z) > 0.25;
  const isIdle = clipName.startsWith('idle_');
  const isFemaleWalk = clipName === 'walk_claire';

  for (const tr of rawClip.tracks) {
    if (!tr.name.endsWith('.quaternion')) continue;
    const rawBone = tr.name.slice(0, tr.name.lastIndexOf('.quaternion'));
    const boneName = normalizeBoneName(rawBone);
    if (!validBoneSet.has(boneName)) continue;

    const vals = new Float32Array(tr.values.length);
    if (boneName === 'Hips' && isOffsetHips) {
      for (let i = 0; i < tr.values.length; i += 4) {
        tmpQ.set(tr.values[i], tr.values[i + 1], tr.values[i + 2], tr.values[i + 3]);
        outQ.copy(qRestHips).multiply(tmpQ);
        vals[i] = outQ.x;
        vals[i + 1] = outQ.y;
        vals[i + 2] = outQ.z;
        vals[i + 3] = outQ.w;
      }
    } else if (boneName === 'Head' || boneName === 'Neck') {
      // Keep every shopper's gaze naturally horizontal (zero vertical pitch + 0.06 slerp kills Mixamo ceiling stare!)
      const tmpE = new THREE.Euler(0, 0, 0, 'YXZ');
      for (let i = 0; i < tr.values.length; i += 4) {
        tmpQ.set(tr.values[i], tr.values[i + 1], tr.values[i + 2], tr.values[i + 3]).normalize();
        tmpE.setFromQuaternion(tmpQ, 'YXZ');
        tmpE.x = 0;
        tmpQ.setFromEuler(tmpE);
        outQ.copy(identQ).slerp(tmpQ, 0.06);
        vals[i] = outQ.x;
        vals[i + 1] = outQ.y;
        vals[i + 2] = outQ.z;
        vals[i + 3] = outQ.w;
      }
    } else if (boneName === 'LeftArm' || boneName === 'RightArm') {
      const qTuck = isIdle
        ? Q_TUCK_IDLE
        : isFemaleWalk
          ? Q_TUCK_WALK_F
          : boneName === 'LeftArm'
            ? Q_TUCK_WALK_M_L
            : Q_TUCK_WALK_M_R;
      for (let i = 0; i < tr.values.length; i += 4) {
        tmpQ.set(tr.values[i], tr.values[i + 1], tr.values[i + 2], tr.values[i + 3]);
        outQ.copy(qTuck).multiply(tmpQ);
        vals[i] = outQ.x;
        vals[i + 1] = outQ.y;
        vals[i + 2] = outQ.z;
        vals[i + 3] = outQ.w;
      }
    } else if (boneName === 'LeftHand' || boneName === 'RightHand') {
      // Soften wrist rotation so hands never hyper-extend during walk or idle
      for (let i = 0; i < tr.values.length; i += 4) {
        tmpQ.set(tr.values[i], tr.values[i + 1], tr.values[i + 2], tr.values[i + 3]);
        outQ.copy(identQ).slerp(tmpQ, 0.45);
        vals[i] = outQ.x;
        vals[i + 1] = outQ.y;
        vals[i + 2] = outQ.z;
        vals[i + 3] = outQ.w;
      }
    } else {
      vals.set(tr.values);
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, tr.times.slice(), vals));
  }
  return tracks.length > 0 ? new THREE.AnimationClip(clipName, rawClip.duration, tracks) : null;
}

/**
 * Preload all realistic rigged .glb human templates & motion-captured Mixamo FBX animations once at boot.
 */
export async function preloadRealisticHumans() {
  initSharedExtras();
  if (preloadedTemplates.length > 0) return;

  const gltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  gltfLoader.setDRACOLoader(dracoLoader);
  const fbxLoader = new FBXLoader();

  const loadGLB = (url) =>
    new Promise((resolve) => {
      gltfLoader.load(
        url,
        (gltf) => resolve(gltf),
        undefined,
        (err) => {
          console.warn('[HumanRig] Failed to load GLB:', url, err);
          resolve(null);
        }
      );
    });

  const loadFBX = (url) =>
    new Promise((resolve) => {
      fbxLoader.load(
        url,
        (fbx) => resolve(fbx && fbx.animations && fbx.animations[0] ? fbx.animations[0] : null),
        undefined,
        (err) => {
          console.warn('[HumanRig] Failed to load FBX:', url, err);
          resolve(null);
        }
      );
    });

  const loadIdleJSON = (url) =>
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.tracks)) return null;
        const tracks = data.tracks.map(
          (t) => new THREE.QuaternionKeyframeTrack(t.name, t.times, t.values)
        );
        return new THREE.AnimationClip(data.name || 'BreathingIdle', data.duration || 4.0, tracks);
      })
      .catch((err) => {
        console.warn('[HumanRig] Failed to load idle JSON:', url, err);
        return null;
      });

  const [walkM, walkF, idleAnim, ...gltfs] = await Promise.all([
    loadFBX('/models/anim_walking.fbx'),
    loadFBX('/models/anim_female_walk.fbx'),
    loadIdleJSON('/models/anim_idle.json'),
    ...MODEL_SPECS.map((s) => loadGLB(s.url))
  ]);

  rawWalkClipM = walkM;
  rawWalkClipF = walkF || walkM;
  rawIdleClip = idleAnim;

  for (let i = 0; i < MODEL_SPECS.length; i++) {
    const spec = MODEL_SPECS[i];
    const gltf = gltfs[i];
    if (!gltf || !gltf.scene) continue;

    const scene = gltf.scene;
    const boneSet = new Set();
    let qRestHips = new THREE.Quaternion();
    const claimedMatUuids = new Set();

    scene.traverse((obj) => {
      if (obj.isBone) {
        const clean = normalizeBoneName(obj.name);
        obj.name = clean;
        boneSet.add(clean);
        if (clean === 'Hips') {
          qRestHips = obj.quaternion.clone();
        }
      }
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.frustumCulled = false;

        // Separate shared materials (e.g. Ch28_body shared across Body/Hoody/Pants/Sneakers, Bodymat across Body/Eyes)
        if (obj.material && !Array.isArray(obj.material)) {
          if (claimedMatUuids.has(obj.material.uuid)) {
            obj.material = obj.material.clone();
          }
          claimedMatUuids.add(obj.material.uuid);
        }

        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (!m) continue;
          // Force opaque depthWrite on all human clothing/skin/hair so ZERO translucent hip/head alpha-sorting glitches occur!
          const objNm = (obj.name || '').toLowerCase();
          const matNm = (m.name || '').toLowerCase();
          const n = `${objNm} ${matNm}`;
          if (!n.includes('lash')) {
            m.transparent = false;
            m.depthWrite = true;
            m.opacity = 1.0;
            m.alphaTest = 0;
          } else {
            m.transparent = false;
            m.alphaTest = 0.5;
            m.depthWrite = true;
          }

          const isLashMesh = n.includes('lash');
          const isEyeOrGlass = objNm.includes('eye') || matNm.includes('eye') || n.includes('glass');
          const isRemyCombinedBody = spec.key === 'remy' && objNm === 'body';
          const isSkinMesh =
            !isRemyCombinedBody && (
              objNm === 'wolf3d_body' ||
              objNm === 'ch28_body' ||
              objNm.includes('head') ||
              objNm.includes('skin') ||
              objNm.includes('teeth') ||
              matNm.includes('skin')
            );
          const isHairMesh = objNm.includes('hair') || matNm.includes('hair');

          // Grounded matte photorealistic cloth/skin PBR (strip glossy Mixamo roughnessMap/metalnessMap -> ZERO wet-latex clothes!)
          if (isLashMesh) {
            m.roughness = 0.8;
            m.metalness = 0.0;
            m.envMapIntensity = 0.15;
          } else if (isEyeOrGlass) {
            m.roughness = Math.min(m.roughness ?? 0.2, 0.22);
            m.metalness = 0.05;
            m.envMapIntensity = 0.85;
          } else if (isRemyCombinedBody) {
            m.roughnessMap = null;
            m.metalnessMap = null;
            m.roughness = 0.78;
            m.metalness = 0.0;
            m.envMapIntensity = 0.18;
            m.emissive = new THREE.Color('#181614');
            m.emissiveIntensity = 0.10;
            if (!m.userData.origMap) m.userData.origMap = m.map;
            m.color.set('#ffffff');
            m.map = getRecoloredDarkClothingTexture(m.userData.origMap, MATTE_CASUAL_TOP_COLORS[0], true);
          } else if (isSkinMesh) {
            m.roughnessMap = null;
            m.metalnessMap = null;
            m.roughness = 0.64;
            m.metalness = 0.0;
            m.envMapIntensity = 0.22;
            if (m.color) m.color.set('#ffffff');
          } else if (isHairMesh) {
            m.roughnessMap = null;
            m.metalnessMap = null;
            m.roughness = 0.74;
            m.metalness = 0.0;
            m.envMapIntensity = 0.18;
            if (m.color) m.color.set('#ffffff');
          } else {
            m.roughnessMap = null;
            m.metalnessMap = null;
            m.roughness = 0.88;
            m.metalness = 0.0;
            m.envMapIntensity = 0.18;
            m.emissive = new THREE.Color('#181614');
            m.emissiveIntensity = 0.14;
            if (!m.userData.origMap) m.userData.origMap = m.map;
            if (m.userData.origMap && m.userData.origMap.image) {
              m.color.set('#ffffff');
              m.map = getRecoloredDarkClothingTexture(m.userData.origMap, MATTE_CASUAL_TOP_COLORS[1], false);
            } else if (m.color && m.color.r + m.color.g + m.color.b < 1.65) {
              m.color.lerp(new THREE.Color('#dcd4c8'), 0.65);
            }
          }
          m.needsUpdate = true;
        }
      }
    });

    // Compute exact bounding height & floor offset so EVERY model stands flush at y = 0.00!
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const h = Math.max(0.5, box.max.y - box.min.y);
    const normScale = spec.targetH / h;
    const baseYOffset = -box.min.y * normScale;

    const walkClip = buildRetargetedClip(
      spec.gender === 'M' ? rawWalkClipM : rawWalkClipF,
      `walk_${spec.key}`,
      qRestHips,
      boneSet
    );
    const idleClip = buildRetargetedClip(rawIdleClip, `idle_${spec.key}`, qRestHips, boneSet);

    preloadedTemplates.push({
      ...spec,
      scene,
      normScale,
      baseYOffset,
      walkClip,
      idleClip
    });
  }
}

function getTintedMaterial(baseMat, tintHex, cacheKey, recolorMap = null, isCombinedBody = false) {
  const ex = initSharedExtras();
  const fullKey = `${baseMat.uuid}_${cacheKey}_${tintHex}_${recolorMap && recolorMap !== ex.matteFabricTex ? 'rc' : 'mul'}`;
  if (ex.matCache.has(fullKey)) return ex.matCache.get(fullKey);
  const cloned = baseMat.clone();
  cloned.roughnessMap = null;
  cloned.metalnessMap = null;
  cloned.metalness = 0.0;
  cloned.roughness = isCombinedBody ? 0.78 : 0.88;
  cloned.envMapIntensity = 0.18;
  cloned.emissive = new THREE.Color('#181614');
  cloned.emissiveIntensity = isCombinedBody ? 0.10 : 0.14;
  if (recolorMap && recolorMap !== ex.matteFabricTex) {
    cloned.map = recolorMap;
    cloned.color.set('#ffffff');
  } else {
    if (recolorMap === ex.matteFabricTex) cloned.map = ex.matteFabricTex;
    cloned.color.set(tintHex);
  }
  cloned.needsUpdate = true;
  ex.matCache.set(fullKey, cloned);
  return cloned;
}

/**
 * Instantiate an anatomically sculpted, skeletally animated AAA .glb human shopper or staff member!
 * Maintains backwards-compatible return signature for crowdSystem, mallArchitecture & iconicAttractions.
 */
export function createSculptedHumanRig(
  seed = 1,
  { allowBag = true, sitting = false, idlePose = false, shirtHex = null, pantsHex = null, helmetHex = null, prop = null, modelIdx = null } = {}
) {
  const ex = initSharedExtras();
  const g = new THREE.Group();

  // Soft grounded radial contact shadow disc directly beneath every NPC's shoes (zero floating feet!)
  const footShadow = new THREE.Mesh(ex.shadowGeo, ex.shadowMat);
  footShadow.rotation.x = -Math.PI / 2;
  footShadow.position.y = 0.015;
  g.add(footShadow);

  // Fallback safeguard only if somehow called before preloadRealisticHumans()
  if (preloadedTemplates.length === 0) {
    const dummyPivot = new THREE.Group();
    g.add(dummyPivot);
    return {
      group: g,
      mixer: null,
      walkAction: null,
      idleAction: null,
      torso: dummyPivot,
      headGroup: dummyPivot,
      baseHeadRotY: 0,
      leftLeg: dummyPivot,
      leftCalf: null,
      rightLeg: dummyPivot,
      rightCalf: null,
      leftArm: dummyPivot,
      leftForearm: null,
      rightArm: dummyPivot,
      rightForearm: null
    };
  }

  // Strict 3-cycle across our 3 photorealistic casual Mixamo civilian humans (remy, claire, david)
  const tmplIdx = (modelIdx !== null ? Math.abs(modelIdx) : Math.abs(seed)) % preloadedTemplates.length;
  const tmpl = preloadedTemplates[tmplIdx];

  const charRoot = SkeletonUtils.clone(tmpl.scene);
  const personalScale = tmpl.normScale * (0.95 + (Math.abs(seed) % 5) * 0.024);
  charRoot.scale.setScalar(personalScale);
  charRoot.position.y = tmpl.baseYOffset * (personalScale / tmpl.normScale) + (sitting ? -0.26 : 0.0);
  g.add(charRoot);

  // Per-shopper wardrobe variety across RPM & Mixamo clothing meshes (bright matte Malaysian casual palette!)
  const topHex = shirtHex || MATTE_CASUAL_TOP_COLORS[(Math.abs(seed) * 3) % MATTE_CASUAL_TOP_COLORS.length];
  const botHex = pantsHex || MATTE_CASUAL_BOTTOM_COLORS[(Math.abs(seed) * 5) % MATTE_CASUAL_BOTTOM_COLORS.length];
  const shoeHex = MATTE_SNEAKER_COLORS[Math.abs(seed) % MATTE_SNEAKER_COLORS.length];

  let headBone = null;
  let leftHandBone = null;
  let rightHandBone = null;
  let leftShoulderBone = null;
  let rightShoulderBone = null;
  let leftArmBone = null;
  let rightArmBone = null;
  let leftForeArmBone = null;
  let rightForeArmBone = null;
  let leftUpLegBone = null;
  let rightUpLegBone = null;
  let leftLegBone = null;
  let rightLegBone = null;
  let spineBone = null;

  charRoot.traverse((obj) => {
    if (obj.isBone) {
      if (obj.name === 'Head') headBone = obj;
      else if (obj.name === 'LeftHand') leftHandBone = obj;
      else if (obj.name === 'RightHand') rightHandBone = obj;
      else if (obj.name === 'LeftShoulder') leftShoulderBone = obj;
      else if (obj.name === 'RightShoulder') rightShoulderBone = obj;
      else if (obj.name === 'LeftArm') leftArmBone = obj;
      else if (obj.name === 'RightArm') rightArmBone = obj;
      else if (obj.name === 'LeftForeArm') leftForeArmBone = obj;
      else if (obj.name === 'RightForeArm') rightForeArmBone = obj;
      else if (obj.name === 'LeftUpLeg') leftUpLegBone = obj;
      else if (obj.name === 'RightUpLeg') rightUpLegBone = obj;
      else if (obj.name === 'LeftLeg') leftLegBone = obj;
      else if (obj.name === 'RightLeg') rightLegBone = obj;
      else if (obj.name === 'Spine1' || obj.name === 'Spine') spineBone = obj;
    }
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.frustumCulled = false;

      const nm = obj.name || '';
      if (nm === 'Wolf3D_Glasses') {
        obj.visible = seed % 2 === 0;
      }

      const isRemyBodyMesh = tmpl.key === 'remy' && nm === 'Body';
      const isTopMesh = nm === 'Wolf3D_Outfit_Top' || nm === 'Tops' || nm === 'Ch28_Hoody' || nm === 'Ch02_Cloth';
      const isBotMesh = nm === 'Wolf3D_Outfit_Bottom' || nm === 'Bottoms' || nm === 'Ch28_Pants';
      const isShoeMesh = nm === 'Ch28_Sneakers' || nm === 'Shoes' || nm === 'Wolf3D_Outfit_Footwear';
      if (isRemyBodyMesh && obj.material && !Array.isArray(obj.material)) {
        const srcMap = obj.material.userData?.origMap || obj.material.map;
        const rcMap = getRecoloredDarkClothingTexture(srcMap, topHex, true);
        obj.material = getTintedMaterial(obj.material, topHex, 'remy_body', rcMap, true);
      } else if (isTopMesh && obj.material && !Array.isArray(obj.material)) {
        const srcMap = obj.material.userData?.origMap || obj.material.map;
        const rcMap = getRecoloredDarkClothingTexture(srcMap, topHex, false);
        obj.material = getTintedMaterial(obj.material, topHex, 'top', rcMap, false);
      } else if (isBotMesh && obj.material && !Array.isArray(obj.material)) {
        const srcMap = obj.material.userData?.origMap || obj.material.map;
        const rcMap = getRecoloredDarkClothingTexture(srcMap, botHex, false);
        obj.material = getTintedMaterial(obj.material, botHex, 'bot', rcMap, false);
      } else if (isShoeMesh && obj.material && !Array.isArray(obj.material)) {
        const srcMap = obj.material.userData?.origMap || obj.material.map;
        const rcMap = getRecoloredDarkClothingTexture(srcMap, shoeHex, false);
        obj.material = getTintedMaterial(obj.material, shoeHex, 'shoe', rcMap, false);
      }
    }
  });

  // Attach sculpted luxury shopping tote or sports prop directly onto bone hand!
  const invScale = 1 / personalScale;
  if (allowBag && !sitting && !prop && seed % 2 === 0 && leftHandBone) {
    const bag = new THREE.Mesh(ex.bagGeo, ex.bagMats[Math.abs(seed) % ex.bagMats.length]);
    bag.scale.setScalar(invScale);
    bag.position.set(0, -0.04 * invScale, 0.02 * invScale);
    leftHandBone.add(bag);
  }
  if (prop && rightHandBone) {
    const propG = new THREE.Group();
    propG.scale.setScalar(invScale);
    if (prop === 'racket') {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.38, 6), ex.handleMat);
      shaft.position.set(0, 0.16, 0.05);
      const headR = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.024, 12), ex.racketHeadMat);
      headR.rotation.z = Math.PI / 2;
      headR.position.set(0, 0.36, 0.05);
      propG.add(shaft, headR);
    } else if (prop === 'bat') {
      const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.016, 0.82, 8), ex.batMat);
      bat.position.set(0, 0.36, 0.04);
      propG.add(bat);
    } else if (prop === 'phone') {
      const ph = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.125, 0.012), ex.handleMat);
      ph.position.set(0, 0.06, 0.04);
      propG.add(ph);
    }
    rightHandBone.add(propG);
  }

  // Real Skeletal AnimationMixer driving motion-captured Mixamo walk & natural standing idle!
  const mixer = new THREE.AnimationMixer(charRoot);
  let walkAction = null;
  let idleAction = null;
  let baseHeadRotY = 0;

  if (idlePose || sitting) {
    if (tmpl.idleClip) {
      idleAction = mixer.clipAction(tmpl.idleClip);
      idleAction.play();
      // Start at a unique natural offset in the breathing/weight-shift cycle (ZERO synchronized statues!)
      mixer.update((Math.abs(seed) * 0.73) % Math.max(0.5, tmpl.idleClip.duration));
    }
    if (!sitting) {
      // Explicit natural downward arm + gently bent forearm + subtle head turn (100% kills splayed T/A-pose even on static staff!)
      if (!tmpl.idleClip) {
        if (leftShoulderBone) leftShoulderBone.quaternion.set(0.509, 0.465, -0.605, 0.398);
        if (rightShoulderBone) rightShoulderBone.quaternion.set(0.557, -0.446, 0.538, 0.447);
        if (leftArmBone) leftArmBone.quaternion.set(0.472, 0.165, 0.087, 0.861).premultiply(Q_TUCK_IDLE);
        if (rightArmBone) rightArmBone.quaternion.set(0.499, -0.144, -0.112, 0.847).premultiply(Q_TUCK_IDLE);
      }
      if (leftForeArmBone) leftForeArmBone.quaternion.set(0.03, 0.0, 0.21, 0.977);
      if (rightForeArmBone) rightForeArmBone.quaternion.set(0.03, 0.0, -0.20, 0.979);
      if (headBone) {
        const yawOffset = ((Math.abs(seed) % 7) - 3) * 0.04;
        headBone.rotation.y += yawOffset;
        baseHeadRotY = headBone.rotation.y;
      }
    }
    // Gentle seated pose override if placed on benches/café chairs
    if (sitting && leftUpLegBone && rightUpLegBone && leftLegBone && rightLegBone) {
      leftUpLegBone.rotation.x = -1.35;
      rightUpLegBone.rotation.x = -1.35;
      leftLegBone.rotation.x = 1.35;
      rightLegBone.rotation.x = 1.35;
    }
  } else {
    if (tmpl.walkClip) {
      walkAction = mixer.clipAction(tmpl.walkClip);
      walkAction.play();
      mixer.update((Math.abs(seed) * 0.41) % Math.max(0.5, tmpl.walkClip.duration));
    } else if (tmpl.idleClip) {
      idleAction = mixer.clipAction(tmpl.idleClip);
      idleAction.play();
      mixer.update((Math.abs(seed) * 0.5) % Math.max(0.5, tmpl.idleClip.duration));
    }
  }

  // Keep dummy safe references for legacy callers that check .leftLeg/.rightArm without crashing
  const noopPivot = new THREE.Group();

  return {
    group: g,
    charRoot,
    isSkinnedGLB: true,
    mixer,
    walkAction,
    idleAction,
    torso: spineBone || noopPivot,
    headGroup: headBone || noopPivot,
    baseHeadRotY,
    leftLeg: noopPivot,
    leftCalf: null,
    rightLeg: noopPivot,
    rightCalf: null,
    leftArm: noopPivot,
    leftForearm: null,
    rightArm: noopPivot,
    rightForearm: null
  };
}
