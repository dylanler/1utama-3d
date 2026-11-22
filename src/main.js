import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import {
  FLOORS,
  BOUNDS,
  STORES,
  MALL_FACILITIES,
  KIOSKS,
  LANDMARKS,
  ESCALATOR_BANKS,
  LEVEL_VERIFICATION_SHOTS,
  getZoneInfo
} from './data/mallLayout.js';
import { setTextureAnisotropy } from './graphics/proceduralTextures.js';
import {
  createAtriumPMREM,
  createSkyDomeMaterial,
  AAAPostProcessShader
} from './graphics/shaders.js';
import { buildVFXSystem } from './graphics/vfxSystem.js';
import { buildMallArchitecture } from './world/mallArchitecture.js';
import { buildTraversalSystems } from './world/traversalSystems.js';
import { buildIconicAttractions } from './world/iconicAttractions.js';
import { buildCrowdSystem } from './world/crowdSystem.js';
import { preloadRealisticHumans } from './world/humanRig.js';
import { PlayerController } from './systems/playerController.js';
import { MallAudioEngine } from './systems/audioEngine.js';

// ============================================================================
// 1. RENDERER, SCENE, HDR ATRIUM IBL & PS5 / UE5 POST-PROCESSING PIPELINE
// ============================================================================
(async function boot1Utama() {
  // Immediately hide Launch Splash & gameplay HUD cleanly on boot or deep-link inspection (?store= / ?shot=)
  const bootParams = new URLSearchParams(window.location.search);
  const isDeepLink = Boolean(bootParams.get('store') || bootParams.get('shot'));
  if (isDeepLink) {
    const introEl = document.getElementById('intro-overlay');
    if (introEl) introEl.classList.add('hidden');
    document.body.classList.remove('modal-open');
  } else {
    document.body.classList.add('modal-open');
  }

  // Preload ALL authentic brand Google Fonts + real rigged .glb human characters & Mixamo animations in parallel!
  const fontPromise =
    document.fonts && typeof document.fonts.load === 'function'
      ? Promise.race([
          Promise.allSettled([
            document.fonts.load('500 48px "Jost"'),
            document.fonts.load('600 48px "Jost"'),
            document.fonts.load('700 48px "Jost"'),
            document.fonts.load('600 48px "Bodoni Moda"'),
            document.fonts.load('700 48px "Bodoni Moda"'),
            document.fonts.load('600 48px "Oswald"'),
            document.fonts.load('700 48px "Oswald"'),
            document.fonts.load('700 48px "Playfair Display"'),
            document.fonts.load('italic 700 48px "Cormorant Garamond"'),
            document.fonts.load('600 48px "Cormorant Garamond"'),
            document.fonts.load('700 48px "Cormorant Garamond"'),
            document.fonts.load('600 48px "Montserrat"'),
            document.fonts.load('700 48px "Montserrat"'),
            document.fonts.load('800 48px "Montserrat"'),
            document.fonts.load('700 48px "Noto Serif JP"'),
            document.fonts.load('800 48px "Noto Serif JP"'),
            document.fonts.load('700 48px "Plus Jakarta Sans"'),
            document.fonts.ready
          ]),
          new Promise((r) => setTimeout(r, 1800))
        ])
      : Promise.resolve();
  await Promise.all([
    fontPromise,
    Promise.race([preloadRealisticHumans(), new Promise((r) => setTimeout(r, 6500))])
  ]);

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: 'high-performance',
  stencil: false
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.15));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.96;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Bake crisp 4K static directional architectural shadows (refreshed automatically on weather change — ZERO per-frame FPS cost!)
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
container.appendChild(renderer.domElement);

setTextureAnisotropy(renderer);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#c2d4e8', 0.00036);

const camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.12, 920);

// Custom HDR Architectural Skylight + Warm Boutique IBL Environment (calibrated dynamic range — ZERO whiteout glare!)
const envTex = createAtriumPMREM(renderer);
scene.environment = envTex;
scene.environmentIntensity = 0.60;

const skyMat = createSkyDomeMaterial();
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(680, 32, 20), skyMat);
scene.add(skyDome);

// Warm Malaysian Luxury Daylight Fill + Crisp Directional Sun (bright sunlit 1 Utama ceilings & ivory marble!)
const hemiLight = new THREE.HemisphereLight('#c8ddf6', '#9a846b', 0.52);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight('#ffefd6', 1.78);
sunLight.position.set(110, 145, -72);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(4096, 4096);
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 420;
sunLight.shadow.camera.left = -98;
sunLight.shadow.camera.right = 98;
sunLight.shadow.camera.top = 98;
sunLight.shadow.camera.bottom = -98;
sunLight.shadow.bias = -0.00032;
sunLight.shadow.normalBias = 0.028;
sunLight.shadow.radius = 4.8;
scene.add(sunLight);
scene.add(sunLight.target);

const sunDirOffset = new THREE.Vector3(110, 145, -72);
const lastShadowSyncPos = new THREE.Vector3(9999, 0, 9999);
function syncSunShadowToCamera(cx, cy, cz, force = false) {
  if (!force && Math.hypot(cx - lastShadowSyncPos.x, cz - lastShadowSyncPos.z) < 24 && Math.abs(cy - lastShadowSyncPos.y) < 10) {
    return;
  }
  const ty = Math.max(0, cy - 2.0);
  sunLight.target.position.set(cx, ty, cz);
  sunLight.target.updateMatrixWorld();
  sunLight.position.set(cx + sunDirOffset.x, ty + sunDirOffset.y, cz + sunDirOffset.z);
  sunLight.updateMatrixWorld();
  lastShadowSyncPos.set(cx, cy, cz);
  renderer.shadowMap.needsUpdate = true;
}

// Calibrated Warm 3000K Interior Boutique & Atrium Accent Lights (Rainforest light raised to y=29.5 + warm Old Wing corridor bounce fills!)
const courtLights = [
  { x: -160, y: 16, z: 0, color: '#ffd4a3', intensity: 16, dist: 72 },   // 1 Utama E FlowRider / WINDLAB
  { x: -92, y: 10.6, z: 16.5, color: '#ffe0b5', intensity: 9, dist: 26 }, // Old Wing GF Sephora / Starbucks Reserve Warm Fill
  { x: -74, y: 10.6, z: 16.5, color: '#ffe0b5', intensity: 9, dist: 26 }, // Old Wing GF South Corridor Warm Fill
  { x: -74, y: 20, z: 0, color: '#ffcf8f', intensity: 20, dist: 92 },    // Old Wing Centre Court Pavilion
  { x: 38, y: 29.5, z: 0, color: '#ffe3b3', intensity: 22, dist: 92 },   // The Rainforest Canopy Skylight Pool
  { x: 86, y: 18, z: 0, color: '#ffd79e', intensity: 17, dist: 74 },     // GF Luxe & Highstreet
  { x: 138, y: 24, z: 0, color: '#ffdc9e', intensity: 24, dist: 96 }     // The Oval Atrium & Parkson Elite
];
for (const cl of courtLights) {
  const pl = new THREE.PointLight(cl.color, cl.intensity, cl.dist, 1.75);
  pl.position.set(cl.x, cl.y, cl.z);
  scene.add(pl);
}

// Hardware DepthTexture-Backed HalfFloat EffectComposer (ZERO extra geometry passes for SSAO + Motion Blur!)
const rtW = Math.floor(window.innerWidth * renderer.getPixelRatio());
const rtH = Math.floor(window.innerHeight * renderer.getPixelRatio());
const createDepthRT = () => {
  const rt = new THREE.WebGLRenderTarget(rtW, rtH, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter
  });
  rt.depthTexture = new THREE.DepthTexture(rtW, rtH);
  rt.depthTexture.type = THREE.UnsignedIntType;
  rt.depthTexture.format = THREE.DepthFormat;
  return rt;
};

const composer = new EffectComposer(renderer, createDepthRT());
composer.renderTarget2 = createDepthRT();
composer.readBuffer = composer.renderTarget2;

const renderPass = new RenderPass(scene, camera);

// Half-res Filmic HDR Bloom (high threshold 1.22 -> glowing neon & lanterns only, ZERO bloom on brushed steel railings, ducts, or escalators!)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(Math.max(320, Math.floor(window.innerWidth * 0.5)), Math.max(180, Math.floor(window.innerHeight * 0.5))),
  0.19,
  0.42,
  1.22
);

// Unified Linear-HDR Triple-A Post-Processing Pass (Hardware-Depth SSAO + Subtle Calibrated Motion Blur + Anamorphic Lens Flare + Atmospheric Haze + Filmic Contrast & Grain)
const aaaPostPass = new ShaderPass(AAAPostProcessShader);
aaaPostPass.uniforms.uResolution.value.set(rtW, rtH);
aaaPostPass.uniforms.uCameraNear.value = camera.near;
aaaPostPass.uniforms.uCameraFar.value = camera.far;
aaaPostPass.uniforms.uMotionBlurEnabled.value = 0.35;
const origPostRender = aaaPostPass.render.bind(aaaPostPass);
aaaPostPass.render = function (ren, writeBuffer, readBuffer, deltaTime, maskActive) {
  this.uniforms.tDepth.value = readBuffer.depthTexture;
  origPostRender(ren, writeBuffer, readBuffer, deltaTime, maskActive);
};

const outputPass = new OutputPass();
const smaaPass = new SMAAPass(rtW, rtH);

composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(aaaPostPass);
composer.addPass(outputPass);
composer.addPass(smaaPass);

let qualityUltra = true;

// ============================================================================
// 2. BUILD ALL 1 UTAMA WORLD MODULES + GPU PARTICLE VFX ENGINE
// ============================================================================
const interactables = [];
const audio = new MallAudioEngine();

const architecture = buildMallArchitecture(scene, interactables);
const traversal = buildTraversalSystems(scene, interactables, (lift) => {
  audio.playChime('elevator');
  showToast(`Arrived at ${FLOORS[lift.currentFloor].code} — ${FLOORS[lift.currentFloor].name}`);
});
const attractions = buildIconicAttractions(scene, interactables);
const crowd = buildCrowdSystem(scene);
const vfx = buildVFXSystem(scene);

// Guarantee the hero Ferrari 458 Italia Draco GLB is decoded & seated on the LG Oval turntable before Frame 1!
await Promise.race([attractions.ferrariReady, new Promise((r) => setTimeout(r, 4500))]);

const player = new PlayerController(camera, renderer.domElement, traversal, attractions);
architecture.setActiveFloor(player.floorIndex, qualityUltra);

// ============================================================================
// 3. TIME OF DAY & MALAYSIAN TROPICAL MONSOON CONTROLLER
// ============================================================================
const WEATHER_PRESETS = [
  {
    name: 'PJ Sunny Day',
    zenith: '#134b96',
    horizon: '#8cc7ed',
    sunCol: '#ffefd6',
    sunPos: [110, 145, -72],
    sunIntensity: 2.35,
    hemiIntensity: 0.28,
    hemiGround: '#6c563f',
    godRay: 0.36,
    cloudCover: 0.40,
    rain: 0.0,
    stars: 0.0,
    fogHex: '#c8d9ec',
    fogDensity: 0.00018,
    aaaFogDensity: 0.00055,
    sunWarmth: 1.08,
    exposure: 0.88
  },
  {
    name: 'PJ Golden Sunset',
    zenith: '#1c184c',
    horizon: '#ec7834',
    sunCol: '#ffb868',
    sunPos: [105, 36, -62],
    sunIntensity: 2.15,
    hemiIntensity: 0.40,
    hemiGround: '#9a6845',
    godRay: 0.38,
    cloudCover: 0.48,
    rain: 0.0,
    stars: 0.0,
    fogHex: '#d98a52',
    fogDensity: 0.00065,
    aaaFogDensity: 0.0014,
    sunWarmth: 1.54,
    exposure: 0.88
  },
  {
    name: 'Night Luxe Glow',
    zenith: '#040714',
    horizon: '#16153d',
    sunCol: '#4ca6ff',
    sunPos: [-60, 80, 40],
    sunIntensity: 0.42,
    hemiIntensity: 0.16,
    godRay: 0.042,
    cloudCover: 0.22,
    rain: 0.0,
    stars: 1.0,
    fogHex: '#0b1324',
    fogDensity: 0.00065,
    aaaFogDensity: 0.0024,
    sunWarmth: 0.35,
    exposure: 0.96
  },
  {
    name: 'Tropical Monsoon',
    zenith: '#182232',
    horizon: '#3c4b5e',
    sunCol: '#9fb4c9',
    sunPos: [30, 110, 20],
    sunIntensity: 0.72,
    hemiIntensity: 0.24,
    godRay: 0.055,
    cloudCover: 0.94,
    rain: 1.0,
    stars: 0.0,
    fogHex: '#2c3b4d',
    fogDensity: 0.0015,
    aaaFogDensity: 0.0042,
    sunWarmth: 0.45,
    exposure: 0.90
  }
];

let weatherIdx = 0;
function applyWeatherPreset(idx) {
  weatherIdx = idx % WEATHER_PRESETS.length;
  const w = WEATHER_PRESETS[weatherIdx];

  skyMat.uniforms.uZenithColor.value.set(w.zenith);
  skyMat.uniforms.uHorizonColor.value.set(w.horizon);
  skyMat.uniforms.uSunColor.value.set(w.sunCol);
  skyMat.uniforms.uSunDir.value.set(...w.sunPos).normalize();
  skyMat.uniforms.uCloudCover.value = w.cloudCover;
  skyMat.uniforms.uNightStars.value = w.stars;

  sunDirOffset.set(...w.sunPos);
  sunLight.color.set(w.sunCol);
  sunLight.intensity = w.sunIntensity;
  hemiLight.intensity = w.hemiIntensity;
  hemiLight.groundColor.set(w.hemiGround || '#4a3a2a');
  scene.fog.color.set(w.fogHex);
  scene.fog.density = w.fogDensity ?? 0.00036;
  renderer.toneMappingExposure = w.exposure;
  syncSunShadowToCamera(camera.position.x, camera.position.y, camera.position.z, true);

  aaaPostPass.uniforms.uFogColor.value.set(w.fogHex);
  aaaPostPass.uniforms.uFogDensity.value = w.aaaFogDensity ?? 0.0018;
  aaaPostPass.uniforms.uSunWarmth.value = w.sunWarmth;
  vfx.setWeather(weatherIdx);

  architecture.skylightMat.uniforms.uSkyTint.value.set(weatherIdx === 1 ? '#b8947c' : w.horizon);
  architecture.skylightMat.uniforms.uRainAmount.value = w.rain;
  for (const gm of architecture.godRayMaterials) {
    gm.uniforms.uColor.value.set(w.sunCol);
    gm.uniforms.uIntensity.value = w.godRay;
  }
  attractions.setSkylineTimeOfDay(weatherIdx);

  document.getElementById('label-weather').textContent = w.name;
}
applyWeatherPreset(0);

// ============================================================================
// 4. ONECARD UPOINTS QUEST, INTERACTIONS & HUD LOGIC
// ============================================================================
const stampedIds = new Set();
let totalUPoints = 0;
let activeInteractable = null;
let toastTimeout = null;

function showToast(msg) {
  const el = document.getElementById('toast-banner');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.add('hidden'), 4000);
}

function awardStamp(stampId, bonusPoints = 150) {
  if (!stampId || stampedIds.has(stampId)) return false;
  stampedIds.add(stampId);
  const lm = LANDMARKS.find((l) => l.id === stampId);
  const pts = lm && lm.upoints ? lm.upoints : bonusPoints;
  totalUPoints += pts;

  document.getElementById('upoints-val').textContent = `${totalUPoints} UPoints`;
  const totalStamps = LANDMARKS.filter((l) => l.isStamp).length;
  const pct = Math.round((stampedIds.size / totalStamps) * 100);
  document.getElementById('stamp-bar-fill').style.width = `${pct}%`;
  document.getElementById('stamp-status').textContent = `${stampedIds.size} / ${totalStamps} Iconic Landmarks Stamped`;

  audio.playChime('stamp');
  return true;
}

const visitedElementIds = new Set();
function addBonusUPoints(id, pts) {
  if (id && visitedElementIds.has(id)) return false;
  if (id) visitedElementIds.add(id);
  totalUPoints += pts;
  document.getElementById('upoints-val').textContent = `${totalUPoints} UPoints`;
  return true;
}

function executeInteraction(item, elapsed) {
  if (!item) return;
  audio.init();
  if (item.stampId) awardStamp(item.stampId);
  if (item.position && item.actionType !== 'open-directory' && item.actionType !== 'call-elevator') {
    const burstHex =
      item.actionType === 'feed-koi' || item.actionType === 'flowrider-trick' || item.actionType === 'scuba-dive'
        ? '#38bdf8'
        : item.actionType === 'rollerwa-party' || item.actionType === 'play-karaoke'
          ? '#f472b6'
          : '#fbbf24';
    vfx.spawnBurst(item.position, burstHex, 46);
  }

  switch (item.actionType) {
    case 'feed-koi': {
      attractions.triggerKoiFeeding(elapsed);
      addBonusUPoints(null, 25);
      audio.playChime('splash');
      showToast('Koi Feeding Frenzy! 34 Nishikigoi fish darting toward golden pellets in LG Rainforest.');
      break;
    }
    case 'inspect-aquarium': {
      addBonusUPoints(item.id, 100);
      audio.playChime('stamp');
      showToast('LG Rainforest Freshwater Aquarium: Giant Arapaima Gigas & Redtail Catfish!');
      break;
    }
    case 'scuba-dive': {
      addBonusUPoints(item.id, 100);
      audio.playChime('splash');
      showToast('LG-P289 Sealantis PADI 5★ Dive Centre: Watching divers train inside the 4m heated glass pool!');
      break;
    }
    case 'ring-rainbow-bell': {
      addBonusUPoints(item.id, 50);
      audio.playChime('bell');
      showToast('Canopy Eco-Bell rung on 2F Rainbow Suspension Bridge (18m above Koi Pond, beside Food District)!');
      break;
    }
    case 'cycle-festive': {
      const themeName = attractions.cycleFestiveTheme();
      addBonusUPoints(item.id, 75);
      audio.playChime('stamp');
      showToast(`Old Wing Centre Court Stage switched to: ${themeName}`);
      break;
    }
    case 'order-kopi': {
      player.grantCaffeineBoost(45);
      addBonusUPoints(item.id, 50);
      audio.playChime('stamp');
      showToast('Refreshment Boost Active! +28% Walking & Sprinting Speed for 45s!');
      break;
    }
    case 'order-chagee': {
      player.grantCaffeineBoost(45);
      addBonusUPoints(item.id, 50);
      audio.playChime('stamp');
      showToast('GF Promenade Skybridge: Watching Lebuh Bandar Utama traffic, RapidKL T8xx & One World Hotel!');
      break;
    }
    case 'toggle-hypercar': {
      const res = attractions.interactHypercar();
      addBonusUPoints(item.id, 75);
      audio.playChime('stamp');
      showToast(
        `LG Oval Ferrari 458 Italia: ${res.doorsOpen ? 'Showroom Doors Opened' : 'Showroom Doors Closed'} • Finish: ${res.paintName}`
      );
      break;
    }
    case 'flowrider-trick': {
      attractions.triggerSurfTrick();
      addBonusUPoints(item.id, 100);
      audio.playChime('splash');
      showToast('LG601 FlowRider® 1 Utama E: 360 Shuvit Aerial Stunt on the 32 km/h perpetual sheet wave!');
      break;
    }
    case 'rollerwa-party': {
      player.grantCaffeineBoost(45);
      addBonusUPoints(item.id, 150);
      audio.playChime('stamp');
      showToast('F603A District K Rollerwa: K-Pop Neon Rink Beat Dropped! (+150 UPoints & Speed Boost)');
      break;
    }
    case 'airrider-boost': {
      const mode = attractions.cycleAirRiderSpeed();
      addBonusUPoints(item.id, 100);
      audio.playChime('stamp');
      showToast(`S601 WINDLAB Indoor Skydiving set to: ${mode}`);
      break;
    }
    case 'saranghae-lock': {
      addBonusUPoints(item.id, 100);
      audio.playChime('bell');
      showToast('2F Saranghae ♥ Bridge: Locked a Golden Wish Padlock on the Korean Love-Lock Trellis! (+100 UPoints)');
      break;
    }
    case 'play-vr': {
      addBonusUPoints(item.id, 150);
      audio.playChime('stamp');
      showToast('3F NextGen T601 Hologate VR Arena: New High Score 9,850 pts in 4-Player Free-Roam VR! (+150 UPoints)');
      break;
    }
    case 'cinema-ticket': {
      player.grantCaffeineBoost(45);
      addBonusUPoints(item.id, 150);
      audio.playChime('stamp');
      showToast(`${item.cinemaTitle || 'Cinema'} Premiere VIP Ticket & Royal Caramel Popcorn Combo Claimed! (+150 UPoints)`);
      break;
    }
    case 'art-gallery': {
      addBonusUPoints(item.id, 150);
      audio.playChime('stamp');
      showToast('3F The Ledge Art Gallery: Explored Contemporary Malaysian Sculptures & Canvas Exhibition! (+150 UPoints)');
      break;
    }
    case 'climb-camp5': {
      player.grantCaffeineBoost(60);
      addBonusUPoints(item.id, 200);
      audio.playChime('stamp');
      showToast('4F EZ501 Camp5 Climbing Gym: Summited the 24m Lead Overhang Wall! (+200 UPoints & 60s Stamina Boost)');
      break;
    }
    case 'play-bowling': {
      addBonusUPoints(item.id, 150);
      audio.playChime('bell');
      showToast('4F EZ401 Wangsa Bowl: Cosmic Ten-Pin STRIKE on Tournament Lane 01! (+150 UPoints)');
      break;
    }
    case 'play-claw': {
      addBonusUPoints(item.id, 100);
      audio.playChime('bell');
      showToast('4F EZ402 Toy Catcher: Caught a Limited-Edition Plushie in the UFO Claw Machine! (+100 UPoints)');
      break;
    }
    case 'play-karaoke': {
      addBonusUPoints(item.id, 150);
      audio.playChime('stamp');
      showToast('4F EZ502 Diva VIP Karaoke: Full 100-Point Encore Score in the Concert KTV Suite! (+150 UPoints)');
      break;
    }
    case 'play-maimai': {
      addBonusUPoints(item.id, 150);
      audio.playChime('bell');
      showToast('4F EZ503 Cross Fire Arcade: ALL PERFECT (SSS+) on maimai DX PRiSM Rhythm Cabinet! (+150 UPoints)');
      break;
    }
    case 'ev-charge': {
      addBonusUPoints(item.id, 100);
      audio.playChime('stamp');
      showToast('4F EVCS457 Oval Supercharger Bay: 180kW DC Fast Charge Activated via 1PAY! (+100 UPoints)');
      break;
    }
    case 'secret-garden-stamp': {
      addBonusUPoints(item.id, 120);
      audio.playChime('stamp');
      showToast('Upper Roof UR603A Secret Garden: Stamped Southeast Asia’s Largest Rooftop Botanical Sanctuary!');
      break;
    }
    case 'play-futsal': {
      player.grantCaffeineBoost(45);
      addBonusUPoints(item.id, 150);
      audio.playChime('bell');
      showToast('UR602 Padang @ 1U Rooftop Futsal: Top-Corner Volley Goal Scored! (+150 UPoints & Speed Boost)');
      break;
    }
    case 'play-baseball': {
      addBonusUPoints(item.id, 150);
      audio.playChime('bell');
      showToast('UR603 Baseball Cage @ 1U: Crushed a 110 km/h Fastball Home Run off the Pitching Machine! (+150 UPoints)');
      break;
    }
    case 'play-padel': {
      player.grantCaffeineBoost(45);
      addBonusUPoints(item.id, 150);
      audio.playChime('bell');
      showToast('UR601 ASCARO Padel & Social Club: Winning Smash on Panoramic Rooftop Court 1! (+150 UPoints)');
      break;
    }
    case 'skyline-vista': {
      addBonusUPoints(item.id, 200);
      audio.playChime('stamp');
      showToast('KL Skyline Binoculars: Viewing Petronas Twin Towers (KLCC), Merdeka 118 & Menara KL! (+200 UPoints)');
      break;
    }
    case 'visit-kiosk': {
      const k = item.kiosk;
      const isAdded = addBonusUPoints(item.id, 50);
      if (k.kind !== 'perfume' && k.kind !== 'tech') {
        player.grantCaffeineBoost(45);
      }
      audio.playChime('stamp');
      showToast(
        `${k.name} (Lot ${k.lot}): ${k.sub}${k.kind !== 'perfume' && k.kind !== 'tech' ? ' • +28% Speed Boost!' : ''}${isAdded ? ' (+50 UPoints)' : ''}`
      );
      break;
    }
    case 'visit-store': {
      const s = item.store;
      const isAdded = addBonusUPoints(item.id, 35);
      const isFood =
        s.style === 'dining' ||
        s.style === 'kopitiam' ||
        s.style === 'japanese' ||
        s.style === 'korean' ||
        s.style === 'bakery' ||
        s.style === 'wok';
      if (isFood) player.grantCaffeineBoost(45);
      audio.playChime('stamp');
      showToast(
        `${s.name} (Lot ${s.lot} • ${FLOORS[s.floor].code}): ${s.subtitle}${isFood ? ' • Dining Refreshment Boost!' : ''}${isAdded ? ' (+35 UPoints)' : ''}`
      );
      break;
    }
    case 'call-elevator': {
      traversal.boardElevator(item.elevatorId, item.floorIndex, player);
      syncElevatorHUD();
      audio.playChime('elevator');
      showToast(
        `Boarded ${FLOORS[item.floorIndex].code} Panoramic Glass Lift — click any floor button (or press 1–7) to ride!`
      );
      break;
    }
    case 'open-directory': {
      openDirectoryModal();
      break;
    }
    default:
      break;
  }
}

// ============================================================================
// 5. PANORAMIC ELEVATOR HUD PANEL & DIRECTORY MODAL (160+ VERIFIED LOTS)
// ============================================================================
const elevPanel = document.getElementById('elevator-panel');
const elevBtnContainer = document.getElementById('elevator-buttons');
let lastShownLiftId = null;

function syncElevatorHUD() {
  const lift = player.ridingElevator;
  if (!lift) {
    elevPanel.classList.add('hidden');
    lastShownLiftId = null;
    return;
  }

  elevPanel.classList.remove('hidden');
  if (lastShownLiftId !== lift.id) {
    lastShownLiftId = lift.id;
    elevBtnContainer.innerHTML = '';
    for (let f = lift.maxFloor; f >= lift.minFloor; f--) {
      const btn = document.createElement('button');
      btn.className = 'elev-floor-btn';
      btn.dataset.floor = String(f);
      btn.textContent = `${FLOORS[f].code} • ${FLOORS[f].name.split('(')[0].trim()}`;
      btn.addEventListener('click', () => {
        audio.init();
        traversal.commandElevator(lift.id, f);
        showToast(`Glass Lift heading to ${FLOORS[f].code} (${FLOORS[f].name})...`);
      });
      elevBtnContainer.appendChild(btn);
    }
  }

  for (const child of elevBtnContainer.children) {
    child.classList.toggle('active', Number(child.dataset.floor) === lift.targetFloor);
  }
}

const dirModal = document.getElementById('directory-modal');
const dirTabs = document.getElementById('dir-floor-tabs');
const dirCatPills = document.getElementById('dir-cat-pills');
const dirSearchInput = document.getElementById('dir-search-input');
const dirLandmarksGrid = document.getElementById('dir-landmarks-grid');
const dirStoresGrid = document.getElementById('dir-stores-grid');
let selectedDirFloor = 'ALL';
let selectedDirCat = 'ALL';
let dirSearchQuery = '';

const DIR_CATS = [
  { id: 'ALL', label: 'All Stores' },
  { id: 'fashion', label: 'Fashion & Luxury', styles: ['fashion', 'luxury', 'beauty', 'sephora', 'anchor'] },
  { id: 'dining', label: 'Dining & Café', styles: ['dining', 'kopitiam', 'bakery', 'japanese', 'korean', 'wok', 'cafe', 'popcorn'] },
  { id: 'sports', label: 'Sports & Lifestyle', styles: ['sports', 'gym', 'furniture', 'kitchenware', 'books', 'tech'] },
  { id: 'fun', label: 'Entertainment & 1UE', styles: ['cinema', 'arcade', 'rollerwa', 'skydiving', 'toys', 'lovelock', 'scuba'] },
  { id: 'market', label: 'Supermarket & Banks', styles: ['supermarket', 'herbal', 'transit', 'gallery'] },
  { id: 'facilities', label: 'Mall Facilities & Car Park', isFacilities: true }
];

if (dirSearchInput) {
  dirSearchInput.placeholder = `Search ${STORES.length + KIOSKS.length} verified stores, brands or lots (e.g. Sephora, Food District, G320)...`;
  dirSearchInput.addEventListener('input', (e) => {
    dirSearchQuery = (e.target.value || '').trim().toLowerCase();
    renderDirectoryContent();
  });
}

function renderDirectoryContent() {
  dirTabs.innerHTML = '';
  const tabOptions = ['ALL', ...FLOORS.map((f) => f.code)];
  for (const code of tabOptions) {
    const b = document.createElement('button');
    b.className = `floor-tab-btn ${selectedDirFloor === code ? 'active' : ''}`;
    b.textContent = code === 'ALL' ? 'All 7 Levels' : `${code} — ${FLOORS.find((x) => x.code === code).name}`;
    b.addEventListener('click', () => {
      selectedDirFloor = code;
      renderDirectoryContent();
    });
    dirTabs.appendChild(b);
  }

  if (dirCatPills) {
    dirCatPills.innerHTML = '';
    for (const cat of DIR_CATS) {
      const cb = document.createElement('button');
      cb.className = `cat-pill-btn ${selectedDirCat === cat.id ? 'active' : ''}`;
      cb.textContent = cat.label;
      cb.addEventListener('click', () => {
        selectedDirCat = cat.id;
        renderDirectoryContent();
      });
      dirCatPills.appendChild(cb);
    }
  }

  const floorFilterIdx =
    selectedDirFloor === 'ALL' ? null : FLOORS.find((f) => f.code === selectedDirFloor)?.index;

  dirLandmarksGrid.innerHTML = '';
  const filteredLandmarks = LANDMARKS.filter(
    (lm) => floorFilterIdx === null || lm.floor === floorFilterIdx
  );
  for (const lm of filteredLandmarks) {
    const chip = document.createElement('button');
    chip.className = 'landmark-chip';
    const isStamped = stampedIds.has(lm.id);
    const shortTitle = lm.name.split(',')[0].split('&')[0].trim();
    chip.innerHTML = `
      <span>${FLOORS[lm.floor].code} • ${lm.isStamp ? (isStamped ? '✓ STAMPED' : `+${lm.upoints} UPoints`) : lm.category}</span>
      <strong>${shortTitle} →</strong>
    `;
    chip.addEventListener('click', () => {
      closeDirectoryModal();
      closeIntroOverlay();
      player.teleportTo(lm.floor, lm.x, lm.z, lm.yaw);
      if (lm.isStamp) awardStamp(lm.id, lm.upoints);
      showToast(`Teleported to ${FLOORS[lm.floor].code} • ${lm.name}`);
    });
    dirLandmarksGrid.appendChild(chip);
  }

  dirStoresGrid.innerHTML = '';
  const activeCatObj = DIR_CATS.find((c) => c.id === selectedDirCat);
  const isFacTab = Boolean(activeCatObj && activeCatObj.isFacilities);
  const allUnits = isFacTab
    ? MALL_FACILITIES.map((f) => ({ ...f, isFacility: true }))
    : [
        ...STORES,
        ...KIOSKS.map((k) => ({
          id: k.id,
          name: k.name,
          subtitle: `${k.sub} (Concourse Kiosk)`,
          lot: k.lot,
          floor: k.floor,
          wing: 'Kiosk',
          style: k.kind || 'cafe',
          x: k.x,
          z: k.z,
          side: 'K'
        }))
      ];
  const filteredStores = allUnits.filter((s) => {
    if (floorFilterIdx !== null && s.floor !== floorFilterIdx) return false;
    if (activeCatObj && activeCatObj.styles && !activeCatObj.styles.includes(s.style || 'fashion')) return false;
    if (dirSearchQuery) {
      const hay = `${s.name} ${s.lot} ${s.wing} ${s.subtitle || ''}`.toLowerCase();
      if (!hay.includes(dirSearchQuery)) return false;
    }
    return true;
  });
  const dirBannerSubEl = document.getElementById('dir-banner-sub');
  const dirSecTitleEl = document.getElementById('dir-section-title');
  if (dirBannerSubEl) {
    dirBannerSubEl.textContent = isFacTab
      ? 'IT’S ALL IN ONE • CLICK ANY FACILITY OR CAR PARK LOBBY TO TELEPORT'
      : 'IT’S ALL IN ONE • CLICK ANY SINGLE-BRAND OUTLET TO TELEPORT';
  }
  if (dirSecTitleEl) {
    dirSecTitleEl.innerHTML = isFacTab
      ? `MALL FACILITIES, ACCESS &amp; CAR PARK (<span id="dir-store-count">${filteredStores.length}</span> FACILITIES)`
      : `OFFICIAL SINGLE-BRAND OUTLETS (<span id="dir-store-count">${filteredStores.length}</span> STORES)`;
  } else {
    document.getElementById('dir-store-count').textContent = String(filteredStores.length);
  }
  if (dirSearchInput) {
    dirSearchInput.placeholder = isFacTab
      ? `Search ${MALL_FACILITIES.length} mall facilities: restrooms, suraus, car park lobbies, overlooks & MRT links...`
      : `Search ${STORES.length + KIOSKS.length} verified stores, brands or lots (e.g. Sephora, Food District, G320)...`;
  }

  for (const s of filteredStores) {
    const item = document.createElement('div');
    item.className = 'store-dir-item';
    const topTag = s.isFacility ? `${FLOORS[s.floor].code} • FACILITY` : `${FLOORS[s.floor].code} • LOT ${s.lot}`;
    item.innerHTML = `
      <div class="store-dir-top">
        <span>${topTag}</span>
        <span>${s.wing}</span>
      </div>
      <div class="store-dir-name">${s.name}</div>
      <div class="store-dir-sub">${s.subtitle}</div>
    `;
    item.addEventListener('click', () => {
      let tx = s.x;
      let tz = s.z;
      let tyaw = 0;
      if (s.side === 'N') {
        tz = s.z + 5.6;
        tyaw = 0;
      } else if (s.side === 'S') {
        tz = s.z - 5.6;
        tyaw = Math.PI;
      } else if (s.side === 'W') {
        tx = s.x + 8.0;
        tyaw = Math.PI / 2;
      } else if (s.side === 'E') {
        tx = s.x - 6.8;
        tyaw = -Math.PI / 2;
      } else {
        tz = s.z + 5.2;
        tyaw = 0;
      }
      closeDirectoryModal();
      closeIntroOverlay();
      player.teleportTo(s.floor, tx, tz, tyaw);
      showToast(`Arrived outside ${s.name} (${FLOORS[s.floor].code} • Lot ${s.lot})`);
    });
    dirStoresGrid.appendChild(item);
  }
}

function openDirectoryModal() {
  if (document.pointerLockElement) document.exitPointerLock();
  player.modalOpen = true;
  document.body.classList.add('modal-open');
  renderDirectoryContent();
  dirModal.classList.remove('hidden');
}

function closeDirectoryModal() {
  dirModal.classList.add('hidden');
  const introHidden = document.getElementById('intro-overlay').classList.contains('hidden');
  player.modalOpen = !introHidden;
  document.body.classList.toggle('modal-open', !introHidden);
}

function closeIntroOverlay() {
  const intro = document.getElementById('intro-overlay');
  if (!intro.classList.contains('hidden')) {
    intro.classList.add('hidden');
    player.modalOpen = false;
    document.body.classList.remove('modal-open');
    audio.init();
  }
}

// ============================================================================
// 6. LIVE 4-WING ARCHITECTURAL VECTOR MINIMAP (PRE-BAKED OFFSCREEN FLOOR CACHE!)
// ============================================================================
const minimapCanvas = document.getElementById('minimap-canvas');
const mCtx = minimapCanvas.getContext('2d');

function mapWorldToMini(wx, wz) {
  const mx = ((wx + 192) / 376) * minimapCanvas.width;
  const my = ((wz + 36) / 72) * minimapCanvas.height;
  return [mx, my];
}

const minimapFloorCache = new Map();
function getOrBakeMinimapFloor(floorIndex) {
  if (minimapFloorCache.has(floorIndex)) return minimapFloorCache.get(floorIndex);
  const W = minimapCanvas.width;
  const H = minimapCanvas.height;
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const ctx = off.getContext('2d');
  const floor = FLOORS[floorIndex];

  const [rx1] = mapWorldToMini(-27, 0);
  const [rx2] = mapWorldToMini(11, 0);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.72)';
  ctx.fillRect(rx1, 0, rx2 - rx1, H);

  if (floor.has1UE) {
    const [x1, y1] = mapWorldToMini(BOUNDS.ueWing.xMin, BOUNDS.ueWing.zMin);
    const [x2, y2] = mapWorldToMini(BOUNDS.ueWing.xMax, BOUNDS.ueWing.zMax);
    ctx.fillStyle = 'rgba(236, 72, 153, 0.24)';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1.1;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  }

  if (floor.hasOldWing) {
    const [x1, y1] = mapWorldToMini(BOUNDS.oldWing.xMin, BOUNDS.oldWing.zMin);
    const [x2, y2] = mapWorldToMini(BOUNDS.oldWing.xMax, BOUNDS.oldWing.zMax);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
    ctx.strokeStyle = '#fbbf24';
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    if (floorIndex >= 1) {
      const [vx1, vy1] = mapWorldToMini(BOUNDS.centreCourtVoid.xMin, BOUNDS.centreCourtVoid.zMin);
      const [vx2, vy2] = mapWorldToMini(BOUNDS.centreCourtVoid.xMax, BOUNDS.centreCourtVoid.zMax);
      ctx.fillStyle = 'rgba(3, 7, 18, 0.75)';
      ctx.fillRect(vx1, vy1, vx2 - vx1, vy2 - vy1);
    }
  }

  if (floor.hasPromenade) {
    const [lx1, ly1] = mapWorldToMini(BOUNDS.promenade.xMin, BOUNDS.promenade.zMin);
    const [lx2, ly2] = mapWorldToMini(BOUNDS.promenade.xMax, BOUNDS.promenade.zMax);
    ctx.fillStyle = 'rgba(167, 139, 250, 0.38)';
    ctx.fillRect(lx1, ly1, lx2 - lx1, ly2 - ly1);
  }

  if (floor.hasNewWing) {
    const b = floor.isRooftop ? BOUNDS.rooftop : BOUNDS.newWing;
    const [nx1, ny1] = mapWorldToMini(b.xMin, b.zMin);
    const [nx2, ny2] = mapWorldToMini(b.xMax, b.zMax);
    ctx.fillStyle = floor.isRooftop ? 'rgba(16, 185, 129, 0.28)' : 'rgba(56, 189, 248, 0.22)';
    ctx.strokeStyle = floor.isRooftop ? '#34d399' : '#38bdf8';
    ctx.fillRect(nx1, ny1, nx2 - nx1, ny2 - ny1);
    ctx.strokeRect(nx1, ny1, nx2 - nx1, ny2 - ny1);

    const [rfx1, rfy1] = mapWorldToMini(20, -13);
    const [rfx2, rfy2] = mapWorldToMini(56, 13);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.38)';
    ctx.fillRect(rfx1, rfy1, rfx2 - rfx1, rfy2 - rfy1);

    const [ocx, ocy] = mapWorldToMini(138, 0);
    ctx.beginPath();
    ctx.ellipse(ocx, ocy, 13, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(3, 7, 18, 0.65)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.6)';
    ctx.stroke();
  }

  ctx.fillStyle = '#facc15';
  for (const e of ESCALATOR_BANKS) {
    if (e.lowerFloor === floorIndex || e.upperFloor === floorIndex) {
      const [ex, ey] = mapWorldToMini((e.xStart + e.xEnd) * 0.5, e.z);
      ctx.fillRect(ex - 2, ey - 1.5, 4, 3);
    }
  }
  minimapFloorCache.set(floorIndex, off);
  return off;
}

function drawMinimap() {
  const W = minimapCanvas.width;
  const H = minimapCanvas.height;
  mCtx.clearRect(0, 0, W, H);
  mCtx.drawImage(getOrBakeMinimapFloor(player.floorIndex), 0, 0);

  const [px, py] = mapWorldToMini(player.footPos.x, player.footPos.z);
  const lookAngle = Math.atan2(-Math.cos(player.yaw), -Math.sin(player.yaw));

  mCtx.save();
  mCtx.translate(px, py);
  mCtx.rotate(lookAngle);
  mCtx.beginPath();
  mCtx.moveTo(0, 0);
  mCtx.arc(0, 0, 13, -0.45, 0.45);
  mCtx.closePath();
  mCtx.fillStyle = 'rgba(56, 189, 248, 0.38)';
  mCtx.fill();
  mCtx.restore();

  mCtx.beginPath();
  mCtx.arc(px, py, 3.4, 0, Math.PI * 2);
  mCtx.fillStyle = '#ffffff';
  mCtx.fill();
  mCtx.strokeStyle = '#0284c7';
  mCtx.lineWidth = 1.4;
  mCtx.stroke();
}

// ============================================================================
// 7. UI EVENT LISTENERS, PHOTO MODE & MOBILE JOYSTICK
// ============================================================================
player.modalOpen = true;

document.getElementById('btn-enter-mall').addEventListener('click', () => {
  closeIntroOverlay();
  player.requestLock();
});

document.getElementById('btn-open-map-intro').addEventListener('click', openDirectoryModal);
document.getElementById('btn-directory').addEventListener('click', openDirectoryModal);
document.getElementById('btn-close-directory').addEventListener('click', closeDirectoryModal);

document.getElementById('btn-weather').addEventListener('click', () => {
  applyWeatherPreset(weatherIdx + 1);
  showToast(`Atmosphere switched to: ${WEATHER_PRESETS[weatherIdx].name}`);
});

document.getElementById('btn-quality').addEventListener('click', () => {
  qualityUltra = !qualityUltra;
  const pr = qualityUltra ? Math.min(window.devicePixelRatio || 1, 1.35) : 1;
  renderer.setPixelRatio(pr);
  composer.setSize(window.innerWidth, window.innerHeight);
  aaaPostPass.uniforms.uResolution.value.set(Math.floor(window.innerWidth * pr), Math.floor(window.innerHeight * pr));
  sunLight.castShadow = qualityUltra;
  renderer.shadowMap.needsUpdate = true;
  architecture.setActiveFloor(player.floorIndex, qualityUltra);
  document.getElementById('label-quality').textContent = `Quality: ${qualityUltra ? 'Ultra' : 'Balanced'}`;
});

document.getElementById('btn-audio').addEventListener('click', () => {
  const on = audio.toggle();
  document.getElementById('label-audio').textContent = `Audio: ${on ? 'On' : 'Muted'}`;
});

let photoMode = false;
function setPhotoMode(active) {
  photoMode = active;
  document.getElementById('hud').classList.toggle('hidden', photoMode);
  document.getElementById('photo-overlay').classList.toggle('hidden', !photoMode);
}

document.getElementById('btn-photo').addEventListener('click', () => setPhotoMode(true));
document.getElementById('btn-exit-photo').addEventListener('click', () => setPhotoMode(false));
document.getElementById('btn-snap-photo').addEventListener('click', () => {
  if (qualityUltra) composer.render();
  else renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `1utama-petaling-jaya-${FLOORS[player.floorIndex].code.toLowerCase()}.png`;
  a.click();
});

let globalElapsed = 0;
document.getElementById('interaction-prompt').addEventListener('click', () => {
  if (activeInteractable) executeInteraction(activeInteractable, globalElapsed);
});

player.onCanvasClickInteract = () => {
  if (player.isPointerLocked && activeInteractable && !player.modalOpen) {
    executeInteraction(activeInteractable, globalElapsed);
  }
};

renderer.domElement.addEventListener('dblclick', () => {
  if (!player.modalOpen) player.requestLock();
});

document.addEventListener('pointerlockchange', () => {
  document.body.classList.toggle('pointer-locked', Boolean(document.pointerLockElement));
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') {
    if (dirModal.classList.contains('hidden')) openDirectoryModal();
    else closeDirectoryModal();
  } else if (e.code === 'Escape' && !dirModal.classList.contains('hidden')) {
    closeDirectoryModal();
  } else if (e.code === 'KeyT' && !player.modalOpen) {
    applyWeatherPreset(weatherIdx + 1);
    showToast(`Atmosphere: ${WEATHER_PRESETS[weatherIdx].name}`);
  } else if (e.code === 'KeyQ' && !player.modalOpen) {
    document.getElementById('btn-quality').click();
  } else if (e.code === 'KeyP' && !player.modalOpen) {
    setPhotoMode(!photoMode);
  } else if (e.code === 'KeyV') {
    const on = audio.toggle();
    document.getElementById('label-audio').textContent = `Audio: ${on ? 'On' : 'Muted'}`;
  } else if ((e.code === 'KeyE' || e.code === 'KeyF' || e.code === 'Enter') && !player.modalOpen && activeInteractable) {
    executeInteraction(activeInteractable, globalElapsed);
  } else if (player.ridingElevator && e.code.startsWith('Digit')) {
    const num = Number(e.code.replace('Digit', '')) - 1;
    const lift = player.ridingElevator;
    if (num >= lift.minFloor && num <= lift.maxFloor) {
      traversal.commandElevator(lift.id, num);
      showToast(`Glass Lift heading to ${FLOORS[num].code}...`);
    }
  }
});

// Mobile Joystick & Touch Look
{
  const jZone = document.getElementById('joystick-zone');
  const jKnob = document.getElementById('joystick-knob');
  let jActive = false;

  const updateStick = (touch) => {
    const rect = jZone.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const maxR = rect.width * 0.42;
    let dx = touch.clientX - cx;
    let dy = touch.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > maxR) {
      dx = (dx / d) * maxR;
      dy = (dy / d) * maxR;
    }
    jKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    player.touchMove.x = dx / maxR;
    player.touchMove.y = -dy / maxR;
  };

  jZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jActive = true;
    updateStick(e.touches[0]);
  });
  jZone.addEventListener('touchmove', (e) => {
    if (!jActive) return;
    e.preventDefault();
    updateStick(e.touches[0]);
  });
  const resetStick = () => {
    jActive = false;
    jKnob.style.transform = 'translate(0px, 0px)';
    player.touchMove.x = 0;
    player.touchMove.y = 0;
  };
  jZone.addEventListener('touchend', resetStick);
  jZone.addEventListener('touchcancel', resetStick);

  let lookTouchId = null;
  let lastTX = 0;
  let lastTY = 0;
  renderer.domElement.addEventListener('touchstart', (e) => {
    if (player.modalOpen) return;
    const t = e.changedTouches[0];
    lookTouchId = t.identifier;
    lastTX = t.clientX;
    lastTY = t.clientY;
  });
  renderer.domElement.addEventListener('touchmove', (e) => {
    if (player.modalOpen || lookTouchId === null) return;
    for (const t of e.changedTouches) {
      if (t.identifier === lookTouchId) {
        player.yaw -= (t.clientX - lastTX) * 0.0045;
        player.pitch = THREE.MathUtils.clamp(player.pitch - (t.clientY - lastTY) * 0.0038, -1.35, 1.35);
        lastTX = t.clientX;
        lastTY = t.clientY;
      }
    }
  });
  renderer.domElement.addEventListener('touchend', () => {
    lookTouchId = null;
  });

  document.getElementById('btn-mobile-interact').addEventListener('click', () => {
    if (activeInteractable) executeInteraction(activeInteractable, globalElapsed);
  });
  document.getElementById('btn-mobile-map').addEventListener('click', openDirectoryModal);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  const nw = Math.floor(window.innerWidth * renderer.getPixelRatio());
  const nh = Math.floor(window.innerHeight * renderer.getPixelRatio());
  aaaPostPass.uniforms.uResolution.value.set(nw, nh);
  smaaPass.setSize(nw, nh);
});

window.__1UTAMA__ = {
  player,
  traversal,
  attractions,
  applyWeatherPreset,
  openDirectoryModal,
  closeIntroOverlay,
  setPhotoMode,
  FLOORS,
  STORES,
  KIOSKS,
  LANDMARKS,
  LEVEL_VERIFICATION_SHOTS,
  getRenderStats() {
    return {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures
    };
  },
  goToShot(levelIndex, shotIndex, opts = {}) {
    closeIntroOverlay();
    closeDirectoryModal();
    const list = LEVEL_VERIFICATION_SHOTS[levelIndex];
    if (!list || !list[shotIndex]) return null;
    const s = list[shotIndex];
    if (opts.weather !== undefined && opts.weather !== null) {
      applyWeatherPreset(Number(opts.weather));
    } else if (s.id === 'UR-01' || s.id === 'UR-07' || s.id === 'UR-09' || s.id === 'UR-10') {
      applyWeatherPreset(1);
    } else {
      applyWeatherPreset(0);
    }
    player.teleportTo(levelIndex, s.x, s.z, s.yaw, s.pitch ?? -0.02);
    if (s.yOff) {
      player.footPos.set(s.x, FLOORS[levelIndex].y + s.yOff, s.z);
      camera.position.set(s.x, FLOORS[levelIndex].y + 1.68 + s.yOff, s.z);
    }
    player.activeEscalator = null;
    prevYaw = player.yaw;
    prevPitch = player.pitch;
    prevCamPos.copy(camera.position);
    smoothMotionVec.set(0, 0);
    smoothRadialBlur = 0;
    const zNow = getZoneInfo(player.floorIndex, player.footPos.x, player.footPos.z);
    floorBadgeEl.textContent = zNow.floorCode;
    wingEl.textContent = zNow.wing;
    wingEl.style.color = zNow.accent;
    zoneEl.textContent = zNow.zone;
    minimapTitleEl.textContent = `LEVEL ${zNow.floorCode} • LIVE FLOORPLAN`;
    architecture.setActiveFloor(levelIndex, qualityUltra, true);
    crowd.enforceCameraClearance(camera.position, opts.clearance ?? 5.8);
    syncSunShadowToCamera(camera.position.x, camera.position.y, camera.position.z, true);
    if (opts.koi) attractions.triggerKoiFeeding(globalElapsed + 0.1);
    if (opts.photo) {
      setPhotoMode(true);
      document.getElementById('photo-overlay').classList.add('hidden');
    } else if (opts.photo === false) {
      setPhotoMode(false);
    }
    return s;
  },
  goToKiosk(query, angle = 0, opts = {}) {
    closeIntroOverlay();
    closeDirectoryModal();
    const q = String(query || '').toLowerCase();
    const k =
      KIOSKS.find((item) => item.id.toLowerCase() === q || item.lot.toLowerCase() === q) ||
      KIOSKS.find((item) => item.lot.toLowerCase().split(/[-/]/).includes(q) || item.name.toLowerCase().includes(q));
    if (!k) return null;
    if (opts.weather !== undefined && opts.weather !== null) applyWeatherPreset(Number(opts.weather));
    else applyWeatherPreset(0);
    const angIdx = Math.max(0, Math.min(2, Number(angle || 0)));
    const dist = k.id === 'k-sushizanmai' ? 7.2 : k.id === 'k-nadeje' || k.id === 'k-beutea' ? 6.4 : 5.8;
    const theta = angIdx === 0 ? 0.18 : angIdx === 1 ? -0.62 : 0.72;
    const camX = k.x + Math.sin(theta) * dist;
    const camZ = k.z + Math.cos(theta) * dist;
    const yaw = Math.atan2(-(k.x - camX), -(k.z - camZ));
    player.teleportTo(k.floor, camX, camZ, yaw, -0.08);
    player.footPos.set(camX, FLOORS[k.floor].y, camZ);
    camera.position.set(camX, FLOORS[k.floor].y + 1.85, camZ);
    player.activeEscalator = null;
    prevYaw = player.yaw;
    prevPitch = player.pitch;
    prevCamPos.copy(camera.position);
    smoothMotionVec.set(0, 0);
    smoothRadialBlur = 0;
    const zNow = getZoneInfo(player.floorIndex, player.footPos.x, player.footPos.z);
    floorBadgeEl.textContent = zNow.floorCode;
    wingEl.textContent = zNow.wing;
    wingEl.style.color = zNow.accent;
    zoneEl.textContent = `${k.lot} • ${k.name}`;
    minimapTitleEl.textContent = `LEVEL ${zNow.floorCode} • LIVE FLOORPLAN`;
    architecture.setActiveFloor(k.floor, qualityUltra, true);
    crowd.enforceCameraClearance(camera.position, opts.clearance ?? 10.5);
    syncSunShadowToCamera(camera.position.x, camera.position.y, camera.position.z, true);
    if (opts.photo) {
      setPhotoMode(true);
      document.getElementById('photo-overlay').classList.add('hidden');
    } else if (opts.photo === false) {
      setPhotoMode(false);
    }
    return k;
  },
  goToStore(query, angle = 0, opts = {}) {
    closeIntroOverlay();
    closeDirectoryModal();
    const q = String(query || '').toLowerCase();
    const st =
      STORES.find((item) => item.id.toLowerCase() === q || item.lot.toLowerCase() === q) ||
      STORES.find((item) => item.lot.toLowerCase().split(/[-/]/).includes(q) || item.name.toLowerCase().includes(q));
    if (!st) {
      return window.__1UTAMA__.goToKiosk(query, angle, opts);
    }
    if (opts.weather !== undefined && opts.weather !== null) applyWeatherPreset(Number(opts.weather));
    else applyWeatherPreset(0);
    const angIdx = Math.max(0, Math.min(2, Number(angle || 0)));
    const nX = st.side === 'W' ? 1 : st.side === 'E' ? -1 : 0;
    const nZ = st.side === 'N' ? 1 : st.side === 'S' ? -1 : 0;
    const rX = -nZ;
    const rZ = nX;
    const lotU = st.lot.toUpperCase();
    const isRollerwaBay = lotU.includes('F603A');
    const isPjpacBay = lotU === 'S611';
    const isSportsTight = lotU.includes('S348') || lotU === 'S345';
    const isOutsideBay = lotU === 'S343';
    const isStarbucksBay = lotU.includes('G139B') || lotU.includes('G139A');
    const isNextGenBay = lotU.includes('F602') || lotU === 'S603-S610';
    const isGameOnBay = lotU === 'F601';
    const isMrDiyBay = lotU === 'S319';
    const isPopMartBay = lotU === 'S333' || lotU === 'S330';
    const isZusPastryBay = lotU === 'G601A';
    const isWindlabBay = lotU === 'S601';
    const baseDist = isRollerwaBay
      ? 8.8
      : isPjpacBay
        ? 9.0
        : isNextGenBay
          ? 8.4
          : isGameOnBay
            ? 7.8
            : isMrDiyBay
              ? 8.2
              : isPopMartBay
                ? 5.8
                : isZusPastryBay
                  ? 5.3
                  : isWindlabBay
                    ? 5.4
                    : isSportsTight
                      ? 5.9
                      : isOutsideBay
                        ? 6.6
                        : isStarbucksBay
                          ? 6.6
                          : Math.max(6.8, Math.min(8.8, st.width * 0.58));
    const dist = angIdx === 2 ? Math.max(5.2, baseDist * 0.92) : baseDist;
    const lat = isWindlabBay
      ? (angIdx === 0 ? 3.8 : angIdx === 1 ? 1.8 : 5.4)
      : angIdx === 0
        ? 0
        : angIdx === 1
          ? -Math.min(dist * (isZusPastryBay ? 0.16 : isOutsideBay ? 0.24 : isSportsTight ? 0.26 : 0.38), isZusPastryBay ? 0.95 : isOutsideBay ? 1.6 : isSportsTight ? 1.8 : 2.9)
          : Math.min(dist * (isStarbucksBay ? 0.24 : isSportsTight ? 0.26 : 0.38), isStarbucksBay ? 1.5 : isSportsTight ? 1.8 : 2.9);
    const camX = st.x + nX * dist + rX * lat;
    const camZ = st.z + nZ * dist + rZ * lat;
    const yaw = Math.atan2(-(st.x - camX), -(st.z - camZ));
    player.teleportTo(st.floor, camX, camZ, yaw, 0.08);
    player.footPos.set(camX, FLOORS[st.floor].y, camZ);
    camera.position.set(camX, FLOORS[st.floor].y + 1.68, camZ);
    player.activeEscalator = null;
    prevYaw = player.yaw;
    prevPitch = player.pitch;
    prevCamPos.copy(camera.position);
    smoothMotionVec.set(0, 0);
    smoothRadialBlur = 0;
    const zNow = getZoneInfo(player.floorIndex, player.footPos.x, player.footPos.z);
    floorBadgeEl.textContent = zNow.floorCode;
    wingEl.textContent = zNow.wing;
    wingEl.style.color = zNow.accent;
    zoneEl.textContent = `${st.lot} • ${st.name}`;
    minimapTitleEl.textContent = `LEVEL ${zNow.floorCode} • LIVE FLOORPLAN`;
    architecture.setActiveFloor(st.floor, qualityUltra, true);
    crowd.enforceCameraClearance(camera.position, opts.clearance ?? 13.5);
    syncSunShadowToCamera(camera.position.x, camera.position.y, camera.position.z, true);
    if (opts.photo) {
      setPhotoMode(true);
      document.getElementById('photo-overlay').classList.add('hidden');
    } else if (opts.photo === false) {
      setPhotoMode(false);
    }
    return st;
  },
  goToFacility(query, angle = 0, opts = {}) {
    closeIntroOverlay();
    closeDirectoryModal();
    const q = String(query || '').toLowerCase();
    const fac =
      MALL_FACILITIES.find((item) => item.id.toLowerCase() === q || item.lot.toLowerCase() === q) ||
      MALL_FACILITIES.find((item) => item.name.toLowerCase().includes(q));
    if (!fac) return null;
    if (opts.weather !== undefined && opts.weather !== null) applyWeatherPreset(Number(opts.weather));
    else applyWeatherPreset(0);
    const angIdx = Math.max(0, Math.min(2, Number(angle || 0)));
    const nX = fac.side === 'W' ? 1 : fac.side === 'E' ? -1 : 0;
    const nZ = fac.side === 'N' ? 1 : fac.side === 'S' ? -1 : 0;
    const rX = -nZ;
    const rZ = nX;
    const dist = angIdx === 2 ? 4.4 : 6.6;
    const lat = angIdx === 0 ? 0 : angIdx === 1 ? -2.2 : 1.4;
    const camX = fac.x + nX * dist + rX * lat;
    const camZ = fac.z + nZ * dist + rZ * lat;
    const yaw = Math.atan2(-(fac.x - camX), -(fac.z - camZ));
    player.teleportTo(fac.floor, camX, camZ, yaw, 0.04);
    player.footPos.set(camX, FLOORS[fac.floor].y, camZ);
    camera.position.set(camX, FLOORS[fac.floor].y + 1.68, camZ);
    player.activeEscalator = null;
    prevYaw = player.yaw;
    prevPitch = player.pitch;
    prevCamPos.copy(camera.position);
    smoothMotionVec.set(0, 0);
    smoothRadialBlur = 0;
    const zNow = getZoneInfo(player.floorIndex, player.footPos.x, player.footPos.z);
    floorBadgeEl.textContent = zNow.floorCode;
    wingEl.textContent = zNow.wing;
    wingEl.style.color = zNow.accent;
    zoneEl.textContent = `${fac.lot} • ${fac.name}`;
    minimapTitleEl.textContent = `LEVEL ${zNow.floorCode} • LIVE FLOORPLAN`;
    architecture.setActiveFloor(fac.floor, qualityUltra, true);
    crowd.enforceCameraClearance(camera.position, opts.clearance ?? 12.0);
    syncSunShadowToCamera(camera.position.x, camera.position.y, camera.position.z, true);
    if (opts.photo) {
      setPhotoMode(true);
      document.getElementById('photo-overlay').classList.add('hidden');
    } else if (opts.photo === false) {
      setPhotoMode(false);
    }
    return fac;
  },
  async captureAllQAShots(onlyLevels = null) {
    closeIntroOverlay();
    closeDirectoryModal();
    const saved = [];
    const compCanvas = document.createElement('canvas');
    compCanvas.width = renderer.domElement.width;
    compCanvas.height = renderer.domElement.height;
    const cCtx = compCanvas.getContext('2d');

    for (let lvl = 0; lvl < FLOORS.length; lvl++) {
      if (Array.isArray(onlyLevels) && !onlyLevels.includes(lvl)) continue;
      const floorCode = FLOORS[lvl].code;
      const shots = LEVEL_VERIFICATION_SHOTS[lvl] || [];

      for (let i = 0; i < shots.length; i++) {
        const s = shots[i];
        // Golden Hour Sunset for Sunset Lounge & Skyline shots!
        if (s.id === 'UR-07' || s.id === 'UR-09' || s.id === 'UR-10') applyWeatherPreset(1);
        else applyWeatherPreset(0);

        player.teleportTo(lvl, s.x, s.z, s.yaw, s.pitch ?? -0.02);
        architecture.setActiveFloor(lvl, qualityUltra);

        if (s.id === 'LG-01') attractions.triggerSurfTrick();
        if (s.id === 'LG-07') attractions.triggerKoiFeeding(globalElapsed);
        if (s.id === 'LG-10') {
          const st = attractions.interactHypercar();
          if (!st.doorsOpen) attractions.interactHypercar();
        }

        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        attractions.update(0.08, globalElapsed + 0.35, player.footPos);
        crowd.update(0.08, globalElapsed + 0.35);
        crowd.enforceCameraClearance(camera.position, 4.6);
        composer.render();

        cCtx.clearRect(0, 0, compCanvas.width, compCanvas.height);
        cCtx.drawImage(renderer.domElement, 0, 0);

        // Auto-sized verification header pill (NEVER overflows border!)
        const pillText = `${s.id} • ${floorCode} • ${s.label}`;
        cCtx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
        const pillW = Math.min(compCanvas.width - 36, Math.ceil(cCtx.measureText(pillText).width) + 34);
        cCtx.fillStyle = 'rgba(10, 15, 28, 0.86)';
        cCtx.fillRect(18, 18, pillW, 42);
        cCtx.strokeStyle = '#38bdf8';
        cCtx.lineWidth = 2;
        cCtx.strokeRect(18, 18, pillW, 42);
        cCtx.fillStyle = '#f8fafc';
        cCtx.fillText(pillText, 34, 45);

        const dataUrl = compCanvas.toDataURL('image/png');
        const resp = await fetch('/__save_qa_shot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ floorCode, shotId: s.id, dataUrl })
        });
        const json = await resp.json();
        saved.push({ id: s.id, ok: json.ok });
      }
    }
    crowd.restoreVisibility();
    applyWeatherPreset(0);
    return saved;
  }
};

// ============================================================================
// 8. MAIN GAME & RENDER LOOP
// ============================================================================
let lastTime = performance.now();
let frames = 0;
let fpsAccum = 0;

const promptBtn = document.getElementById('interaction-prompt');
const promptTxt = document.getElementById('interaction-text');
const floorBadgeEl = document.getElementById('hud-floor-badge');
const wingEl = document.getElementById('hud-wing');
const zoneEl = document.getElementById('hud-zone');
const minimapTitleEl = document.getElementById('minimap-title');
const buffPillEl = document.getElementById('buff-pill');
const fpsEl = document.getElementById('fps-counter');

let hudTick = 0;
let prevYaw = player.yaw;
let prevPitch = player.pitch;
const prevCamPos = camera.position.clone();
const smoothMotionVec = new THREE.Vector2(0, 0);
let smoothRadialBlur = 0;

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  globalElapsed += dt;

  frames++;
  hudTick++;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    fpsEl.textContent = `${Math.round(frames / fpsAccum)} FPS`;
    fpsEl.dataset.calls = String(renderer.info.render.calls);
    fpsEl.dataset.triangles = String(renderer.info.render.triangles);
    frames = 0;
    fpsAccum = 0;
  }

  skyMat.uniforms.uTime.value = globalElapsed;
  traversal.update(dt);
  player.update(dt, globalElapsed);
  syncSunShadowToCamera(camera.position.x, camera.position.y, camera.position.z);
  architecture.setActiveFloor(player.floorIndex, qualityUltra);
  architecture.update(globalElapsed);
  attractions.update(dt, globalElapsed, player.footPos);
  crowd.update(dt, globalElapsed, camera.position, player.floorIndex);
  if (photoMode) crowd.enforceCameraClearance(camera.position, 6.2);
  vfx.update(dt, globalElapsed);
  audio.updateSpatial(camera.position);

  // Real-time Camera-Velocity Motion Blur driver (automatically zeroes on camera cuts/teleports — ZERO teleport ghosting!)
  const invDt = dt > 0.001 ? 1.0 / dt : 60.0;
  let dYaw = player.yaw - prevYaw;
  if (dYaw > Math.PI) dYaw -= Math.PI * 2;
  if (dYaw < -Math.PI) dYaw += Math.PI * 2;
  const dPitch = player.pitch - prevPitch;
  const moveSpd = camera.position.distanceTo(prevCamPos) * invDt;
  prevYaw = player.yaw;
  prevPitch = player.pitch;
  prevCamPos.copy(camera.position);

  const isCameraCut = moveSpd > 16.0 || Math.abs(dYaw) > 0.45 || Math.abs(dPitch) > 0.45;
  if (isCameraCut) {
    smoothMotionVec.set(0, 0);
    smoothRadialBlur = 0;
  } else {
    // Subtle, comfortable AAA micro-motion blur (80% toned down — razor-sharp while walking & panning!)
    const targetMx = THREE.MathUtils.clamp(dYaw * 0.055, -0.0032, 0.0032);
    const targetMy = THREE.MathUtils.clamp(-dPitch * 0.042, -0.0024, 0.0024);
    const targetRad = moveSpd > 7.4 ? THREE.MathUtils.clamp((moveSpd - 7.2) * 0.0008, 0, 0.0032) : 0.0;
    const blend = Math.min(1, dt * 24);
    smoothMotionVec.x += (targetMx - smoothMotionVec.x) * blend;
    smoothMotionVec.y += (targetMy - smoothMotionVec.y) * blend;
    smoothRadialBlur += (targetRad - smoothRadialBlur) * blend;
  }

  aaaPostPass.uniforms.uTime.value = globalElapsed;
  aaaPostPass.uniforms.uMotionVec.value.copy(smoothMotionVec);
  aaaPostPass.uniforms.uRadialBlur.value = smoothRadialBlur;

  if (hudTick === 1 || hudTick % 2 === 0) {
    let best = null;
    let bestScore = Infinity;
    const lookX = -Math.sin(player.yaw);
    const lookZ = -Math.cos(player.yaw);
    for (const item of interactables) {
      if (Math.abs(item.position.y - (player.footPos.y + 1.25)) > 3.4) continue;
      const dx = item.position.x - camera.position.x;
      const dz = item.position.z - camera.position.z;
      const d = Math.hypot(dx, dz);
      if (d <= item.radius) {
        // Strictly enforce tight forward sight-cone for storefront visit prompts so [E] ONLY prompts the exact store ahead!
        const dirDot = d > 0.2 ? (dx * lookX + dz * lookZ) / d : 1.0;
        if (item.actionType === 'visit-store' && dirDot < 0.45) continue;
        const prioBonus = (item.priority || 3) * 1.45;
        const score = d - dirDot * 7.2 - prioBonus;
        if (score < bestScore) {
          bestScore = score;
          best = item;
        }
      }
    }
    activeInteractable = best;
    if (best && !player.modalOpen) {
      promptTxt.textContent = best.prompt;
      promptBtn.classList.remove('hidden');
    } else {
      promptBtn.classList.add('hidden');
    }

    const zInfo = getZoneInfo(player.floorIndex, player.footPos.x, player.footPos.z);
    floorBadgeEl.textContent = zInfo.floorCode;
    wingEl.textContent = zInfo.wing;
    wingEl.style.color = zInfo.accent;
    zoneEl.textContent = zInfo.zone;
    minimapTitleEl.textContent = `LEVEL ${zInfo.floorCode} • LIVE FLOORPLAN`;

    if (player.speedBoostTimer > 0) {
      buffPillEl.textContent = `Beutea / Kopitiam Boost (+28% Speed • ${Math.ceil(player.speedBoostTimer)}s)`;
      buffPillEl.classList.remove('hidden');
    } else {
      buffPillEl.classList.add('hidden');
    }

    syncElevatorHUD();
  }
  drawMinimap();

  if (qualityUltra) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

// Optional URL query OR zero-reload #hash deep-link support (?shot=L-S / #shot=L-S, #store=LOT, #kiosk=LOT, #facility=LOT, angle=0..2, weather=W, koi=1, photo=1)
function applyUrlCameraDeepLink() {
  const hashRaw = (window.location.hash || '').replace(/^#/, '');
  const params = hashRaw && hashRaw.includes('=') ? new URLSearchParams(hashRaw) : new URLSearchParams(window.location.search);
  const wParam = params.get('weather');
  const weatherOverride = wParam !== null && !Number.isNaN(Number(wParam)) ? Number(wParam) : null;
  if (weatherOverride !== null) {
    applyWeatherPreset(weatherOverride);
  }
  const photoOpt = params.get('photo') === '1';
  const facParam = params.get('facility');
  if (facParam) {
    const angIdx = Math.max(0, Math.min(2, Number(params.get('angle') || 0)));
    window.__1UTAMA__.goToFacility(facParam, angIdx, { photo: photoOpt, weather: weatherOverride });
    setTimeout(() => { syncSunShadowToCamera(camera.position.x, camera.position.y, camera.position.z, true); }, 160);
    return;
  }
  const kioskParam = params.get('kiosk');
  if (kioskParam) {
    const angIdx = Math.max(0, Math.min(2, Number(params.get('angle') || 0)));
    window.__1UTAMA__.goToKiosk(kioskParam, angIdx, { photo: photoOpt, weather: weatherOverride });
    setTimeout(() => { syncSunShadowToCamera(camera.position.x, camera.position.y, camera.position.z, true); }, 160);
    return;
  }
  const storeParam = params.get('store');
  if (storeParam) {
    const angIdx = Math.max(0, Math.min(2, Number(params.get('angle') || 0)));
    window.__1UTAMA__.goToStore(storeParam, angIdx, { photo: photoOpt, weather: weatherOverride });
    setTimeout(() => { syncSunShadowToCamera(camera.position.x, camera.position.y, camera.position.z, true); }, 160);
    return;
  }
  const shotParam = params.get('shot');
  if (shotParam && /^\d+-\d+$/.test(shotParam)) {
    const [lvlStr, idxStr] = shotParam.split('-');
    window.__1UTAMA__.goToShot(Number(lvlStr), Number(idxStr), {
      photo: photoOpt,
      weather: weatherOverride,
      koi: params.get('koi') === '1'
    });
    setTimeout(() => { syncSunShadowToCamera(camera.position.x, camera.position.y, camera.position.z, true); }, 180);
  }
}
applyUrlCameraDeepLink();
window.addEventListener('hashchange', applyUrlCameraDeepLink);

requestAnimationFrame(animate);
})();
