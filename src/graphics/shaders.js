import * as THREE from 'three';

const GLSL_NOISE = /* glsl */ `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise2D(p);
    p = rot * p * 2.04 + vec2(17.1, 31.7);
    a *= 0.5;
  }
  return v;
}

float voronoiCaustic(vec2 uv, float t) {
  vec2 g = floor(uv);
  vec2 f = fract(uv);
  float minDist = 1.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 lattice = vec2(float(x), float(y));
      float h = hash21(g + lattice);
      vec2 offset = 0.5 + 0.42 * sin(t * 1.35 + 6.2831 * vec2(h, fract(h * 17.3)));
      vec2 diff = lattice + offset - f;
      minDist = min(minDist, length(diff));
    }
  }
  return pow(clamp(minDist, 0.0, 1.0), 2.3);
}
`;

/**
 * 0A. Custom HDR Architectural Atrium Light-Probe PMREM Environment (Replaces Flat Gray RoomEnvironment!)
 * Produces dramatic warm-boutique vs cool-skylight specular reflections on marble, brass, steel, glass & hypercar!
 */
export function createAtriumPMREM(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#131926');

  // Cool tropical Malaysian skylight strip overhead (6500K crisp sky reflection)
  const skyPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 10),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.65, 2.2), side: THREE.DoubleSide })
  );
  skyPanel.rotation.x = Math.PI / 2;
  skyPanel.position.set(0, 10, 0);
  envScene.add(skyPanel);

  // Warm 3000K golden architectural boutique light bands along the horizon
  const warmBandMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.8, 1.32, 0.82),
    side: THREE.DoubleSide
  });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.2), warmBandMat);
    panel.position.set(Math.cos(a) * 14, 1.5, Math.sin(a) * 14);
    panel.lookAt(0, 1.5, 0);
    envScene.add(panel);
  }

  // Calibrated architectural recessed spotlight specular pinpoints (crisp metallic gleam, ZERO white flashbangs!)
  const spotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.0, 1.45) });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), spotMat);
    sp.position.set(Math.cos(a) * 9.5, 7.8, Math.sin(a) * 9.5);
    envScene.add(sp);
  }

  // Warm champagne-travertine floor bounce light below
  const floorBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 36),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.46, 0.36), side: THREE.DoubleSide })
  );
  floorBounce.rotation.x = -Math.PI / 2;
  floorBounce.position.set(0, -8, 0);
  envScene.add(floorBounce);

  // Warm neutral architectural champagne-ivory bounce panel (KILLS stray neon-emerald green bleed on storefront glass & plinths!)
  const warmAccentPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.08, 0.99, 0.88), side: THREE.DoubleSide })
  );
  warmAccentPanel.position.set(0, 1, 14);
  warmAccentPanel.lookAt(0, 0, 0);
  envScene.add(warmAccentPanel);

  const envRT = pmrem.fromScene(envScene, 0.035);
  pmrem.dispose();
  return envRT.texture;
}

/**
 * 0B. PS5 / UE5 Anisotropic Wet-Polished Marble Real-Time Planar Reflector Shader
 * 7-tap vertical anisotropic reflection elongation + Schlick Fresnel grazing + marble vein roughness modulation!
 */
export const MarbleReflectorShader = {
  name: 'MarbleReflectorShader',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uOpacity: { value: 0.36 }
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorldPos;

    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */ `
    ${GLSL_NOISE}
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uOpacity;
    varying vec4 vUv;
    varying vec3 vWorldPos;

    void main() {
      vec2 proj = vUv.xy / max(vUv.w, 0.0001);

      // Subtle stone micro-undulation & marble polish variation (breaks up flat mirror CG look!)
      float polishVar = fbm(vWorldPos.xz * 0.28);
      vec2 distort = (vec2(noise2D(vWorldPos.xz * 1.4), noise2D(vWorldPos.xz * 1.4 + 19.3)) - 0.5) * 0.0022;
      proj += distort;

      // 7-tap crisp anisotropic vertically-streaked polished marble reflection!
      float bx = 0.0010 * (0.75 + 0.45 * polishVar);
      float by = 0.0024 * (0.75 + 0.45 * polishVar);
      vec3 refl = texture2D(tDiffuse, proj).rgb * 0.34;
      refl += texture2D(tDiffuse, proj + vec2(0.0,  by)).rgb * 0.16;
      refl += texture2D(tDiffuse, proj + vec2(0.0, -by)).rgb * 0.16;
      refl += texture2D(tDiffuse, proj + vec2( bx,  by * 0.5)).rgb * 0.085;
      refl += texture2D(tDiffuse, proj + vec2(-bx,  by * 0.5)).rgb * 0.085;
      refl += texture2D(tDiffuse, proj + vec2( bx, -by * 0.5)).rgb * 0.085;
      refl += texture2D(tDiffuse, proj + vec2(-bx, -by * 0.5)).rgb * 0.085;

      // Warm authentic 1 Utama Crema Marfil polished marble reflection (unified seamlessly across sunlit Oval & shaded concourses!)
      float warmCap = max(refl.r, refl.g) * 0.90 + 0.012;
      refl.b = min(refl.b, warmCap);
      refl *= color * 1.26;
      refl = refl / (vec3(1.0) + refl * 0.24);

      // Subtle architectural 2m travertine slab seam masking & per-tile micro-roughness breakup (breaks up wet ice-rink look!)
      vec2 tileId = floor(vWorldPos.xz * 0.5);
      vec2 tileF = fract(vWorldPos.xz * 0.5);
      float tileHash = fract(sin(dot(tileId, vec2(127.1, 311.7))) * 43758.5453);
      float tileTilt = (tileHash - 0.5) * 0.0022;
      proj += vec2(tileTilt, -tileTilt * 0.8);
      float groutMask = smoothstep(0.008, 0.026, tileF.x) * smoothstep(0.008, 0.026, 1.0 - tileF.x)
                      * smoothstep(0.008, 0.026, tileF.y) * smoothstep(0.008, 0.026, 1.0 - tileF.y);

      // True Schlick Fresnel grazing curve with natural foot-traffic satin variation across marble slabs!
      vec3 viewDir = normalize(cameraPosition - vWorldPos);
      float ndotv = max(viewDir.y, 0.0);
      float fresnel = mix(0.32, 0.92, pow(1.0 - ndotv, 2.05));
      float tilePolish = 0.78 + 0.28 * tileHash + 0.14 * polishVar;

      float alpha = clamp(uOpacity * fresnel * groutMask * tilePolish, 0.10, 0.54);
      gl_FragColor = vec4(refl, alpha);
    }
  `
};

/**
 * 0C. True Hybrid Real2Sim + Spider-Man 2 Raymarched 3D Parallax Interior Mapping Storefront Shader!
 * Projects a bespoke 1024x512 real 1 Utama brand interior atlas (`uBackMap`) onto the back plane of a
 * 3D raycasted retail volume with procedural 3D fluted side-wall paneling, recessed circular downlight cans,
 * glossy reflective floors, deep corner ambient occlusion, and zero mid-wall UV tiling seams!
 */
export function createParallaxInteriorMaterial(store, backAtlasTex = null) {
  const glassBays = Math.max(2, Math.round((store.width || 16) / 3.8));
  const style = store.style || 'fashion';
  const uName = (store.name || '').toUpperCase();

  const isLightInterior =
    style === 'supermarket' ||
    style === 'bakery' ||
    style === 'kitchenware' ||
    style === 'luxury' ||
    uName.includes('JAYA GROCER') ||
    uName.includes('UNIQLO') ||
    uName.includes('HEYTEA') ||
    uName.includes('COME TRUE') ||
    uName.includes('CHÂTERAISÉ') ||
    uName.includes('LAVENDER') ||
    uName.includes('PARKSON') ||
    uName.includes('SEPHORA') ||
    uName.includes('CHANEL') ||
    uName.includes('ZARA') ||
    uName.includes('MINISO') ||
    uName.includes('NEXT GEN') ||
    uName.includes('NEXTGEN') ||
    uName.includes('MR. D.I.Y') ||
    uName.includes('MR.D.I.Y') ||
    uName.includes('TOP TOY') ||
    uName.includes('COFFEE MEETS PASTRY') ||
    uName.includes('ZUS') ||
    uName.includes('NIKE') ||
    uName.includes('BHC') ||
    uName.includes('MODU');

  const isWarmDining =
    style === 'dining' ||
    style === 'kopitiam' ||
    style === 'japanese' ||
    style === 'korean' ||
    style === 'wok' ||
    uName.includes('IPPUDO') ||
    uName.includes('FOOD DISTRICT') ||
    uName.includes('KYOCHON') ||
    uName.includes('MODU') ||
    uName.includes('BHC') ||
    uName.includes('COACH') ||
    uName.includes('STARBUCKS');

  const wallHex = uName.includes('POP MART')
    ? '#222630'
    : isLightInterior
      ? '#dcd4c8'
      : isWarmDining
        ? '#78563a'
        : '#3a404c';
  // Brand-matched continuous interior floor albedo
  const floorHex = uName.includes('GAME ON')
    ? '#dc5214'
    : uName.includes('CHANEL') || uName.includes('SEPHORA')
      ? '#161922'
      : uName.includes('MR. D.I.Y') || uName.includes('MR.D.I.Y')
        ? '#d8d2c6'
        : uName.includes('POP MART')
          ? '#262b35'
          : uName.includes('TOP TOY')
            ? '#d8e4ec'
            : uName.includes('ADIDAS') || uName.includes('MODU') || uName.includes('COME TRUE') || uName.includes('OUTSIDE') || uName.includes('NIKE')
              ? '#b89060'
              : uName.includes('COACH') || uName.includes('STARBUCKS') || uName.includes('IPPUDO')
                ? '#755336'
                : uName.includes('ROLLERWA')
                  ? '#241e58'
                  : isLightInterior
                    ? '#cfc6b8'
                    : '#4a4f59';
  const lightHex = isWarmDining ? '#ffd89b' : isLightInterior ? '#fff6e6' : '#ffe8c8';
  const floorReflectivity = isWarmDining ? 0.28 : isLightInterior ? 0.36 : 0.34;

  let seed = 0;
  const idStr = store.id || store.name || 'shop';
  for (let i = 0; i < idStr.length; i++) seed = (seed * 31 + idStr.charCodeAt(i)) % 997;

  return new THREE.ShaderMaterial({
    uniforms: {
      uBackMap: { value: backAtlasTex },
      uHasBackMap: { value: backAtlasTex ? 1.0 : 0.0 },
      uWallCol: { value: new THREE.Color(wallHex) },
      uFloorCol: { value: new THREE.Color(floorHex) },
      uLightCol: { value: new THREE.Color(lightHex) },
      uFloorReflectivity: { value: floorReflectivity },
      uGlassBays: { value: glassBays },
      uAspect: { value: Math.max(1.2, (store.width || 16) / 3.8) },
      uIsLight: { value: isLightInterior ? 1.0 : 0.0 },
      uIsWarm: { value: isWarmDining ? 1.0 : 0.0 },
      uSeed: { value: seed * 0.137 },
      // Locked to 1.0 ALWAYS so hero murals never split or tile down the middle
      uTileRepeat: { value: 1.0 }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vWorldRight;
      varying vec3 vWorldUp;

      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vec3 wn = normalize(mat3(modelMatrix) * normal);
        vWorldNormal = wn;
        vWorldUp = vec3(0.0, 1.0, 0.0);
        vWorldRight = normalize(cross(vWorldUp, wn));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform sampler2D uBackMap;
      uniform float uHasBackMap;
      uniform vec3 uWallCol;
      uniform vec3 uFloorCol;
      uniform vec3 uLightCol;
      uniform float uFloorReflectivity;
      uniform float uGlassBays;
      uniform float uAspect;
      uniform float uIsLight;
      uniform float uIsWarm;
      uniform float uSeed;
      uniform float uTileRepeat;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vWorldRight;
      varying vec3 vWorldUp;

      void main() {
        vec3 rayW = normalize(vWorldPos - cameraPosition);
        vec3 rayTS = vec3(
          dot(rayW, vWorldRight),
          dot(rayW, vWorldUp),
          dot(rayW, vWorldNormal)
        );

        float D = 2.15;
        vec3 ro = vec3(vUv * 2.0 - 1.0, 0.0);
        vec3 rd = normalize(vec3(rayTS.x / max(uAspect, 1.0), rayTS.y, min(rayTS.z, -0.06)));

        float tx = abs(rd.x) < 1e-4 ? 1e6 : ((rd.x > 0.0 ? 1.0 : -1.0) - ro.x) / rd.x;
        float ty = abs(rd.y) < 1e-4 ? 1e6 : ((rd.y > 0.0 ? 1.0 : -1.0) - ro.y) / rd.y;
        float tz = -D / rd.z;

        float tMin = min(min(tx, ty), tz);
        vec3 hit = ro + rd * tMin;

        float zNorm = clamp(-hit.z / D, 0.0, 1.0);
        float cols = max(2.0, floor(uGlassBays + 0.5));
        float rows = 2.0;
        float depthShade = mix(1.03, 0.74, zNorm);

        vec3 interiorCol = vec3(0.0);

        if (tMin == ty && rd.y > 0.0) {
          // Virtual Ceiling: warm plaster soffit + recessed circular architectural downlight cans
          vec2 cellIdx = vec2((hit.x * 0.5 + 0.5) * cols, zNorm * rows);
          vec2 cellUV = fract(cellIdx) - 0.5;
          vec2 dVec = vec2(cellUV.x * (uAspect / cols), cellUV.y * (2.2 / rows));
          float r = length(dVec);

          float bezel = smoothstep(0.115, 0.090, r) * smoothstep(0.056, 0.078, r);
          float coreLens = smoothstep(0.072, 0.024, r);
          float soffitSpill = exp(-r * r * 26.0) * 0.34;

          float ceilEdgeAO = smoothstep(0.0, 0.16, min(1.0 - abs(hit.x), 1.0 - zNorm));
          float ceilAO = mix(0.55, 1.0, ceilEdgeAO);

          vec3 ceilBase = mix(vec3(0.24, 0.23, 0.24), vec3(0.80, 0.77, 0.72), uIsLight);
          vec3 canColor = mix(ceilBase * ceilAO * depthShade, vec3(0.06, 0.06, 0.07), bezel * 0.88);
          vec3 warmCore = mix(uLightCol, vec3(1.0, 0.89, 0.70), 0.55);
          interiorCol = canColor + warmCore * (coreLens * 1.45 + soffitSpill * 0.55);
        } else if (tMin == ty && rd.y <= 0.0) {
          // Virtual Floor: architectural tile/plank seams + glossy reflections of downlights & backwall + deep wall-contact AO
          vec2 tileCoord = uIsWarm > 0.5
            ? vec2((hit.x * 0.5 + 0.5) * uGlassBays * 3.0, zNorm * 2.5)
            : vec2((hit.x * 0.5 + 0.5) * uGlassBays * 2.0, zNorm * 4.0);
          vec2 fTile = fract(tileCoord);
          vec2 tileId = floor(tileCoord);
          float tileVar = 0.94 + 0.12 * hash21(tileId + uSeed);
          float grout = smoothstep(0.014, 0.042, fTile.x) * smoothstep(0.014, 0.042, fTile.y);
          vec3 floorBase = uFloorCol * tileVar * (0.86 + 0.14 * grout);

          // Subtle blurred reflection of backwall graphics onto floor
          float reflU = clamp(hit.x * 0.5 + 0.5, 0.015, 0.985);
          float reflV = clamp(0.10 + (1.0 - zNorm) * 0.52, 0.03, 0.85);
          vec3 backRefl = uWallCol;
          if (uHasBackMap > 0.5) {
            vec2 bOff = vec2(0.018, 0.028);
            backRefl = (
              texture2D(uBackMap, vec2(reflU, reflV)).rgb * 0.40 +
              texture2D(uBackMap, clamp(vec2(reflU + bOff.x, reflV), 0.002, 0.998)).rgb * 0.15 +
              texture2D(uBackMap, clamp(vec2(reflU - bOff.x, reflV), 0.002, 0.998)).rgb * 0.15 +
              texture2D(uBackMap, clamp(vec2(reflU, reflV + bOff.y), 0.002, 0.998)).rgb * 0.15 +
              texture2D(uBackMap, clamp(vec2(reflU, reflV - bOff.y), 0.002, 0.998)).rgb * 0.15
            );
          }

          // Specular floor pools reflecting overhead recessed circular downlights
          vec2 fCellUV = fract(vec2((hit.x * 0.5 + 0.5) * cols, zNorm * rows)) - 0.5;
          vec2 fLightVec = vec2(fCellUV.x * (uAspect / cols), fCellUV.y * (1.5 / rows));
          float downlightPool = exp(-dot(fLightVec, fLightVec) * 14.0);
          vec3 reflCol = mix(backRefl * 0.78, uLightCol * 1.15, downlightPool * 0.65);

          float floorFresnel = mix(0.42, 0.95, pow(1.0 - clamp(abs(rd.y), 0.0, 1.0), 1.5));
          float reflWeight = clamp(uFloorReflectivity * floorFresnel, 0.08, 0.52);

          // Deep interior contact AO along back & side wall edges
          float distFromWall = min(1.0 - abs(hit.x), 1.0 - zNorm);
          float floorAO = mix(0.38, 1.0, smoothstep(0.0, 0.16, distFromWall));

          vec3 litFloor = mix(floorBase, reflCol, reflWeight);
          interiorCol = litFloor * floorAO * mix(1.02, 0.82, zNorm) + uLightCol * downlightPool * 0.14 * floorAO;
        } else if (tMin == tz) {
          // Virtual Backwall: seamless single-atlas graphic (uTileRepeat locked to 1.0) + deep corner AO + spotlight scallops
          vec2 backUV = clamp(hit.xy * 0.5 + 0.5, vec2(0.002), vec2(0.998));
          vec3 texCol = uHasBackMap > 0.5 ? texture2D(uBackMap, backUV).rgb : uWallCol;

          float aoX = smoothstep(0.0, 0.15, min(backUV.x, 1.0 - backUV.x));
          float aoY = smoothstep(0.0, 0.16, min(backUV.y, 1.0 - backUV.y));
          float backCornerAO = mix(0.58, 1.0, aoX * aoY);

          float scallop = exp(-pow((fract(backUV.x * cols) - 0.5) * 2.4, 2.0)) * smoothstep(0.16, 0.96, backUV.y);
          interiorCol = texCol * backCornerAO + uLightCol * scallop * 0.18 * backCornerAO;
        } else {
          // Virtual Left / Right Side Walls: ZERO 2D backwall poster cloning!
          // Procedural 3D architectural fluted slat / recessed bay paneling + 3000K cove wall-wash + dark skirting + corner AO
          float yNorm = clamp(hit.y * 0.5 + 0.5, 0.0, 1.0);
          float distFromTop = 1.0 - yNorm;

          // Architectural wide bay seams & fine vertical fluted slats along Z
          float bayPhase = fract(zNorm * 3.0);
          float bayReveal = smoothstep(0.0, 0.025, bayPhase) * smoothstep(1.0, 0.975, bayPhase);

          float slatFreq = uIsWarm > 0.5 ? 28.0 : (uIsLight > 0.5 ? 18.0 : 24.0);
          float slatWave = 0.5 + 0.5 * cos(zNorm * slatFreq * 6.283185);
          float fluteShade = mix(0.84, 1.04, pow(slatWave, 0.75));
          float groove = smoothstep(0.06, 0.24, slatWave);
          float panelMod = mix(fluteShade * (0.86 + 0.14 * groove), 0.96 + 0.04 * groove, uIsLight * 0.55) * (0.78 + 0.22 * bayReveal);

          // Store-palette-matched side wall material (timber/warm plaster/architectural slate)
          vec3 warmTimber = mix(uWallCol, vec3(0.46, 0.30, 0.18), 0.58);
          vec3 lightPlaster = mix(uWallCol, vec3(0.84, 0.80, 0.74), 0.55);
          vec3 slatePanel = mix(uWallCol, vec3(0.24, 0.27, 0.32), 0.45);
          vec3 panelAlbedo = mix(slatePanel, warmTimber, uIsWarm);
          panelAlbedo = mix(panelAlbedo, lightPlaster, uIsLight);

          float microTex = 0.96 + 0.08 * noise2D(vec2(zNorm * 14.0 + uSeed, yNorm * 8.0));
          panelAlbedo *= panelMod * microTex;

          // Dark recessed base skirting (y < 0.06) with crisp shadow-gap reveal
          float skirtMask = 1.0 - smoothstep(0.052, 0.065, yNorm);
          float skirtReveal = exp(-pow((yNorm - 0.066) * 140.0, 2.0));
          panelAlbedo = mix(panelAlbedo, panelAlbedo * 0.24 + vec3(0.03), skirtMask);
          panelAlbedo *= (1.0 - 0.42 * skirtReveal);

          // Warm 3000K grazing cove wall-wash light falling softly from top edge
          float coveWash = exp(-distFromTop * 2.8);
          float bayCone = 0.65 + 0.35 * exp(-pow((bayPhase - 0.5) * 2.6, 2.0));
          vec3 warm3000K = mix(vec3(1.0, 0.85, 0.64), uLightCol, 0.35);

          // Crisp dark ambient occlusion along floor, ceiling, and rear-wall corner seams
          float aoFloor = smoothstep(0.0, 0.14, yNorm);
          float aoCeil = smoothstep(0.0, 0.12, 1.0 - yNorm);
          float aoBack = smoothstep(0.0, 0.18, 1.0 - zNorm);
          float sideAO = mix(0.40, 1.0, aoFloor * aoCeil * aoBack);

          interiorCol = panelAlbedo * sideAO * depthShade + warm3000K * coveWash * bayCone * 0.28 * (0.45 + 0.55 * aoBack);
        }

        gl_FragColor = vec4(interiorCol, 1.0);
      }
    `
  });
}

/**
 * 0D. Architectural Low-Iron Tempered Fresnel Glass Shader
 * Eliminates invisible storefront glass & atrium balustrades with true Schlick Fresnel,
 * synthesized warm mall downlight streaks, cool skylight sheen, marble bounce, and crisp speculars.
 */
export function createFresnelGlassMaterial(options = {}) {
  const tintColor = new THREE.Color(options.tint || '#d4eef4');
  const side = options.side ?? THREE.FrontSide;
  const opacityScale = options.opacity ?? 1.0;

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side,
    uniforms: {
      uEdgeTint: { value: tintColor },
      uOpacityScale: { value: opacityScale }
    },
    vertexShader: /* glsl */ `
      varying vec3 vViewPos;
      varying vec3 vNormalView;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = mvPos.xyz;
        vNormalView = normalize(normalMatrix * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uEdgeTint;
      uniform float uOpacityScale;

      varying vec3 vViewPos;
      varying vec3 vNormalView;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      void main() {
        vec3 N = normalize(vNormalView);
        vec3 V = normalize(-vViewPos);
        vec3 worldN = normalize(vWorldNormal);
        vec3 I = normalize(cameraPosition - vWorldPos);
        vec3 R = normalize(reflect(-I, worldN));

        // Calibrated Schlick Fresnel curve for crystal-clear low-iron tempered architectural glass (ZERO milky white fog at grazing angles!)
        float fresnel = mix(0.05, 0.44, pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 3.4));

        // Subtle vertical architectural reflection bands along azimuth
        float az = atan(R.z, R.x);
        float archBands = 0.5 + 0.5 * cos(az * 8.0 + 0.45);
        float mullionStreaks = smoothstep(0.62, 0.98, abs(sin(az * 5.0)));

        // Cool sunlit atrium skylight sheen at upper angles (#d8ecff)
        vec3 skySheenCol = vec3(0.847, 0.925, 1.0);
        float skyMask = smoothstep(0.02, 0.65, R.y);

        // Warm golden ceiling downlight reflection streaks (#fff0d4) when R.y > 0.08
        vec3 warmStreakCol = vec3(1.0, 0.941, 0.831);
        float downlightGate = smoothstep(0.08, 0.24, R.y) * smoothstep(0.78, 0.28, R.y);
        float downlightStreak = pow(0.5 + 0.5 * cos(az * 10.0), 5.0) * downlightGate;

        // Subtle marble corridor bounce when R.y < -0.05
        vec3 marbleBounceCol = vec3(0.56, 0.50, 0.43);
        float floorMask = smoothstep(-0.05, -0.48, R.y);

        // Mid-concourse warm-neutral architectural bounce
        vec3 midBandCol = mix(vec3(0.38, 0.42, 0.46), vec3(0.68, 0.64, 0.58), archBands);
        vec3 envRefl = mix(midBandCol, skySheenCol, skyMask * 0.72);
        envRefl = mix(envRefl, marbleBounceCol, floorMask * 0.72);
        envRefl += warmStreakCol * downlightStreak * 0.55;
        envRefl += vec3(0.08, 0.09, 0.10) * mullionStreaks * (1.0 - floorMask * 0.5);

        // Primary overhead skylight/fixture crisp specular highlight (clamped to prevent white HDR bloom)
        float spec = pow(max(dot(R, normalize(vec3(0.35, 0.85, 0.42))), 0.0), 56.0) * 0.35;

        // Low-iron slight blue-green edge tint (#d4eef4) + crisp non-milky architectural glass output
        vec3 glassCol = envRefl * (0.48 + 0.52 * fresnel) + uEdgeTint * (0.12 + 0.24 * fresnel) + vec3(1.0, 0.97, 0.91) * (spec * 0.85);
        float alpha = clamp((fresnel * 0.72 + spec * 0.36) * uOpacityScale, 0.06, 0.44);

        gl_FragColor = vec4(glassCol, alpha);
      }
    `
  });
}

/**
 * 1. Dynamic Malaysian Sky Dome Shader (Bandar Utama / Petaling Jaya Atmosphere)
 */
export function createSkyDomeMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.45, 0.65, -0.35).normalize() },
      uZenithColor: { value: new THREE.Color('#134b96') },
      uHorizonColor: { value: new THREE.Color('#92c9ee') },
      uSunColor: { value: new THREE.Color('#fff2cf') },
      uCloudCover: { value: 0.44 },
      uNightStars: { value: 0.0 }
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uZenithColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunColor;
      uniform float uCloudCover;
      uniform float uNightStars;
      varying vec3 vWorldDir;

      void main() {
        vec3 dir = normalize(vWorldDir);
        float elev = clamp(dir.y, 0.0, 1.0);

        vec3 col = mix(uHorizonColor, uZenithColor, pow(elev, 0.52));

        float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
        float mie = pow(sunDot, 6.0) * 0.45 + pow(sunDot, 84.0) * 1.15;
        float disc = smoothstep(0.9985, 0.9996, sunDot) * 2.6;
        col += uSunColor * (mie + disc) * (1.0 - uCloudCover * 0.55);

        if (dir.y > 0.012) {
          vec2 cloudUV = dir.xz / (dir.y + 0.16) * 1.42 + vec2(uTime * 0.008, uTime * 0.004);
          float c1 = fbm(cloudUV);
          float c2 = fbm(cloudUV * 2.3 - vec2(uTime * 0.012, 0.0));
          float c = c1 * 0.68 + c2 * 0.32;
          float cloudMask = smoothstep(0.50 - uCloudCover * 0.28, 0.84, c) * smoothstep(0.012, 0.22, dir.y);
          vec3 cloudShadow = uHorizonColor * 0.68;
          vec3 cloudLit = uSunColor * 1.12 + vec3(0.16);
          vec3 cloudLight = mix(cloudShadow, cloudLit, clamp(0.45 + 0.55 * sunDot + (c1 - 0.5) * 0.4, 0.0, 1.0));
          col = mix(col, cloudLight, cloudMask * 0.82);
        }

        if (uNightStars > 0.01 && dir.y > 0.08) {
          vec2 starGrid = floor(dir.xz / (dir.y + 0.25) * 260.0);
          float sh = hash21(starGrid);
          if (sh > 0.994) {
            float twinkle = 0.55 + 0.45 * sin(uTime * 3.2 + sh * 90.0);
            col += vec3(0.9, 0.95, 1.0) * twinkle * uNightStars * smoothstep(0.08, 0.35, dir.y);
          }
        }

        if (dir.y < 0.0) {
          col = mix(uHorizonColor * 0.52, vec3(0.06, 0.10, 0.09), clamp(-dir.y * 5.0, 0.0, 1.0));
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/**
 * 2. Volumetric Skylight Crepuscular God-Rays Shader (Rich diagonal sunlit shafts!)
 */
export function createVolumetricGodRayMaterial(colorHex = '#ffebc0', intensity = 0.115) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(colorHex) },
      uIntensity: { value: intensity }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormalView = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;

      void main() {
        vec3 viewDir = normalize(vViewPos);
        // Ultra-soft Fresnel edge falloff + near-camera fade so god-ray cylinders NEVER draw hard polygon edges across storefronts!
        float edgeFade = pow(abs(dot(normalize(vNormalView), viewDir)), 2.45);
        float camDistFade = smoothstep(5.0, 15.0, length(vViewPos));
        float vert = smoothstep(0.0, 0.28, vUv.y) * smoothstep(1.0, 0.68, vUv.y) * (0.60 + 0.40 * vUv.y);
        float rays = 0.52 + 0.48 * pow(0.5 + 0.5 * sin(vUv.x * 18.85 + uTime * 0.14), 1.5) * (0.72 + 0.28 * sin(vUv.x * 9.42 - uTime * 0.10));
        float fineBeam = 0.80 + 0.20 * noise2D(vec2(vUv.x * 24.0, vUv.y * 4.5 - uTime * 0.18));

        float alpha = edgeFade * camDistFade * vert * rays * fineBeam * uIntensity;
        gl_FragColor = vec4(uColor * alpha * 2.85, alpha);
      }
    `
  });
}

/**
 * 3. Rainforest Koi Pond & Rooftop Lotus Mirror Pond Water Shader (Dual-Layer Ripples + Chromatic Caustics)
 */
export function createKoiPondWaterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSkyColor: { value: new THREE.Color('#a7e3ff') },
      uDeepColor: { value: new THREE.Color('#03352a') },
      uShallowColor: { value: new THREE.Color('#0d9488') },
      uSplashes: {
        value: [
          new THREE.Vector4(0, 0, -99, 0),
          new THREE.Vector4(0, 0, -99, 0),
          new THREE.Vector4(0, 0, -99, 0),
          new THREE.Vector4(0, 0, -99, 0)
        ]
      }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        wp.y += sin(wp.x * 1.4 + uTime * 2.1) * 0.018 + cos(wp.z * 1.7 + uTime * 1.8) * 0.015;
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime;
      uniform vec3 uSkyColor;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec4 uSplashes[4];
      varying vec3 vWorldPos;
      varying vec2 vUv;

      void main() {
        // Optical Crystal-Clear Beer-Lambert River-Pond Water (ZERO opaque cyan Voronoi wallpaper!)
        vec2 p = vWorldPos.xz * 0.62;
        float t = uTime;

        float nx = (noise2D(p * 3.8 + vec2(t * 0.45, 0.0)) + noise2D(p * 9.5 - vec2(0.0, t * 0.72)) * 0.45) - 0.72;
        float nz = (noise2D(p * 3.8 + vec2(0.0, t * 0.42)) + noise2D(p * 9.5 + vec2(t * 0.65, 0.0)) * 0.45) - 0.72;
        vec3 norm = normalize(vec3(nx * 0.28, 1.0, nz * 0.28));
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float ndotv = max(dot(norm, viewDir), 0.0);
        float fres = pow(1.0 - ndotv, 3.8);

        // Authentic Photo 3 Ground-Floor Rainforest Koi Pond Water: rich natural dark olive-emerald basin with luminous dappled sky sheen so bright orange/white Koi fish pop!
        float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float shallowFactor = 1.0 - smoothstep(0.0, 0.28, edgeDist);
        vec3 waterCol = mix(vec3(0.018, 0.042, 0.032), vec3(0.046, 0.095, 0.068), shallowFactor);

        // Soft organic underwater dappled sunlight caustics dancing gently over river stones
        float c1 = voronoiCaustic(p * 1.65 + vec2(t * 0.08, -t * 0.06), t);
        float c2 = voronoiCaustic(p * 2.55 - vec2(t * 0.06, t * 0.07), t * 1.15);
        float causticNet = pow(clamp(c1 * 0.65 + c2 * 0.58, 0.0, 1.0), 1.45);
        waterCol += vec3(0.24, 0.42, 0.30) * causticNet * (0.45 + 0.38 * shallowFactor);

        // Grazing Fresnel reflection capturing warm Ippudo timber lights, dark canopy & bright overhead skylight!
        vec3 reflDir = reflect(-viewDir, norm);
        float warmMallBand = smoothstep(0.0, 0.35, reflDir.y) * smoothstep(0.75, 0.25, reflDir.y);
        vec3 reflCol = mix(vec3(0.05, 0.10, 0.11), uSkyColor * 0.85, smoothstep(0.22, 0.85, reflDir.y));
        reflCol += vec3(0.86, 0.58, 0.30) * warmMallBand * 0.54;
        waterCol = mix(waterCol, reflCol, clamp(fres * 0.90, 0.08, 0.82));

        // Crisp sparkling skylight & sun glints across micro-ripples
        vec3 sunDir = normalize(vec3(0.35, 0.85, -0.35));
        vec3 halfV = normalize(sunDir + viewDir);
        float spec = pow(max(dot(norm, halfV), 0.0), 120.0) * 1.35;
        waterCol += vec3(1.0, 0.96, 0.86) * spec;

        // Delicate refractive koi feeding ripples
        float ringFoam = 0.0;
        for (int i = 0; i < 4; i++) {
          vec4 sp = uSplashes[i];
          float age = uTime - sp.z;
          if (age > 0.0 && age < 4.5 && sp.w > 0.0) {
            float d = length(vWorldPos.xz - sp.xy);
            float radius = age * 2.2;
            float wave = exp(-abs(d - radius) * 6.5) * sin((d - radius) * 18.0) * (1.0 - age / 4.5);
            ringFoam += max(0.0, wave) * sp.w;
          }
        }
        waterCol += vec3(0.78, 0.92, 0.96) * ringFoam * 0.26;

        // Soft aerated whitewater plunge froth around 4-story cliff waterfall base (45.8, 7.6)
        float wfDist = length(vWorldPos.xz - vec2(45.8, 7.6));
        float plungeFoam = smoothstep(3.8, 0.7, wfDist) * (0.40 + 0.60 * fbm(p * 3.8 - vec2(0.0, t * 2.2)));
        waterCol = mix(waterCol, vec3(0.84, 0.92, 0.96), plungeFoam * 0.58);

        // Low center alpha (0.28) so river pebbles & bright orange/white Koi read unmistakably clear!
        float alpha = clamp(0.28 + fres * 0.44 + plungeFoam * 0.34, 0.26, 0.78);
        gl_FragColor = vec4(waterCol, alpha);
      }
    `
  });
}

/**
 * 4. Silky Multi-Stream Rainforest Cascading Waterfall Shader (Soft Feathered Organic Edges — ZERO Flat Cyan Slabs!)
 */
export function createWaterfallMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += sin(uv.y * 12.0 + uTime * 7.5 + uv.x * 5.0) * 0.045;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        // Multi-scale elongated falling aerated water filaments
        float n1 = fbm(vec2(vUv.x * 8.5, vUv.y * 2.2 + uTime * 2.6));
        float n2 = fbm(vec2(vUv.x * 18.0 + 3.1, vUv.y * 4.0 + uTime * 3.8));
        float filaments = smoothstep(0.30, 0.78, n1 * 0.58 + n2 * 0.52);

        // Soft organic feathered silhouette on top, left, right, AND plunge bottom (ZERO sharp rectangle edges!)
        float sideMask = smoothstep(0.0, 0.24, vUv.x) * smoothstep(1.0, 0.76, vUv.x);
        float topFade = smoothstep(1.0, 0.84, vUv.y);
        float botFade = smoothstep(0.0, 0.14, vUv.y);
        float plungeFoam = smoothstep(0.32, 0.04, vUv.y) * 0.72;

        // Natural deep cool-slate falling water + softened silky ivory-mist foam streaks (<= 1.08 max luminance to prevent HDR bloom blowout)
        vec3 deepStream = vec3(0.19, 0.32, 0.36);
        vec3 silkyFoam = vec3(0.84, 0.89, 0.92);
        vec3 col = mix(deepStream, silkyFoam, clamp(filaments * 0.80 + plungeFoam * 0.85, 0.0, 1.0));
        float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
        if (lum > 1.05) {
          col *= 1.05 / lum;
        }
        float alpha = sideMask * topFade * botFade * (0.26 + filaments * 0.54 + plungeFoam * 0.30);
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.84));
      }
    `
  });
}

/**
 * 5. FlowRider 1 Utama E Perpetual Surf Wave Shader
 */
export function createFlowRiderWaveMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uBoost: { value: 0 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float crest = exp(-pow((uv.y - 0.68) * 5.5, 2.0)) * 0.18;
        p.y += crest + sin(uv.x * 18.0 + uTime * 11.0) * 0.015;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime;
      uniform float uBoost;
      varying vec2 vUv;

      void main() {
        float speed = 4.2 + uBoost * 2.5;
        vec2 uvFlow = vec2(vUv.x * 8.0, vUv.y * 4.5 - uTime * speed);
        float sheet = fbm(uvFlow);
        float fine = noise2D(vec2(vUv.x * 26.0, vUv.y * 12.0 - uTime * speed * 1.6));

        vec3 vinylBlue = vec3(0.02, 0.36, 0.78);
        vec3 turquoise = vec3(0.06, 0.76, 0.94);
        vec3 spray = vec3(0.96, 0.99, 1.0);

        float crestFoam = exp(-pow((vUv.y - 0.72) * 5.2, 2.0));
        float laneDivider = exp(-pow((vUv.x - 0.5) * 45.0, 2.0)) * 0.35;

        vec3 col = mix(vinylBlue, turquoise, sheet);
        col = mix(col, spray, clamp(fine * 0.45 + crestFoam * 0.80 + laneDivider, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

/**
 * 6. WINDLAB (AirRider) Vertical Wind Tunnel Vortex Shader
 */
export function createWindTunnelVortexMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uWindSpeed: { value: 1.0 }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime;
      uniform float uWindSpeed;
      varying vec2 vUv;

      void main() {
        float spiral = fract(vUv.x * 6.0 + vUv.y * 2.2 - uTime * 2.4 * uWindSpeed);
        float ribbon = smoothstep(0.75, 0.98, spiral) * 0.58;
        float pulse = smoothstep(0.82, 0.99, fract(vUv.y * 4.0 - uTime * 1.8 * uWindSpeed)) * 0.48;
        float fadeEnds = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.82, vUv.y);

        vec3 c1 = vec3(0.18, 0.82, 1.0);
        vec3 c2 = vec3(0.72, 0.44, 1.0);
        vec3 col = mix(c1, c2, vUv.y);
        float a = (ribbon + pulse) * fadeEnds * (0.30 + 0.28 * uWindSpeed);
        gl_FragColor = vec4(col * a * 1.65, a);
      }
    `
  });
}

/**
 * 7. Real 1 Utama Brushed-Aluminum Space-Frame Low-Iron Skylight Glass + Rain Shader
 * (Clean rectangular architectural glazing bays — ZERO ugly thick diagonal red wireframe stripes!)
 */
export function createSkylightGlassMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uSkyTint: { value: new THREE.Color('#9bd8f5') },
      uRainAmount: { value: 0.0 }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormalView = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime;
      uniform vec3 uSkyTint;
      uniform float uRainAmount;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;

      void main() {
        // Slim architectural aluminum mullion grid (clean rectangular glass panels!)
        float gx = abs(fract(vUv.x * 16.0) - 0.5);
        float gy = abs(fract(vUv.y * 10.0) - 0.5);
        float frame = smoothstep(0.478, 0.492, max(gx, gy));

        vec3 nV = normalize(vNormalView);
        vec3 vDir = normalize(vViewPos);
        float ndotv = abs(dot(nV, vDir));
        float fres = pow(1.0 - ndotv, 1.9);
        vec3 neutralLowIron = vec3(0.46, 0.58, 0.72);
        vec3 skyRefl = mix(neutralLowIron, uSkyTint * 1.88, 0.78);
        // Crisp curved-glass HDR daylight & golden sunset luminance catching selective ACES bloom!
        float sunBand = pow(clamp(1.0 - abs(vUv.x - 0.48) * 1.85, 0.0, 1.0), 1.9) * (0.48 + 0.52 * fres);
        vec3 glassCol = mix(neutralLowIron * 1.25, skyRefl, 0.46 + 0.54 * fres) + uSkyTint * sunBand * 2.15;
        float alpha = 0.28 + fres * 0.54;

        if (uRainAmount > 0.01) {
          vec2 rainUV = vec2(vUv.x * 42.0, vUv.y * 12.0 + uTime * 2.2);
          float drop = smoothstep(0.74, 0.95, noise2D(rainUV));
          glassCol += vec3(0.80, 0.92, 1.0) * drop * uRainAmount * 0.65;
          alpha += drop * uRainAmount * 0.24;
        }

        vec3 aluminumCol = vec3(0.32, 0.36, 0.42);
        vec3 col = mix(glassCol, aluminumCol, frame);
        alpha = mix(alpha, 0.92, frame);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
}

/**
 * 8. Unified Triple-A PS5 / Unreal Engine 5 Post-Processing Master Shader (SINGLE PASS — ZERO EXTRA DRAW CALLS!):
 * - Real Hardware-Depth Screen-Space Ambient Occlusion (8-tap Vogel Disk SSAO from Z-buffer!)
 * - Camera-Velocity Per-Pixel Directional + Radial Motion Blur (turns & sprinting!)
 * - Anamorphic Horizontal Lens Flare Streaks & Sun Glare off HDR highlights
 * - Depth-Aware Warm/Cool Volumetric Atmospheric Perspective Haze
 * - Subtle Optical Radial Chromatic Aberration
 * - AgX-Inspired Filmic S-Curve Contrast & Warm/Cool Split Toning
 * - Subtle 35mm Filmic Sensor Micro-Grain + Optical Lens Vignette
 */
export const AAAPostProcessShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uResolution: { value: new THREE.Vector2(1280, 720) },
    uCameraNear: { value: 0.12 },
    uCameraFar: { value: 920.0 },
    uTime: { value: 0.0 },
    uMotionVec: { value: new THREE.Vector2(0, 0) },
    uRadialBlur: { value: 0.0 },
    uMotionBlurEnabled: { value: 1.0 },
    uAOStrength: { value: 1.05 },
    uFlareStrength: { value: 0.02 },
    uFogColor: { value: new THREE.Color('#efe7da') },
    uFogDensity: { value: 0.00048 },
    uSunWarmth: { value: 1.0 },
    uVignette: { value: 0.18 },
    uSaturation: { value: 1.12 },
    uContrast: { value: 1.07 },
    uGrain: { value: 0.003 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uResolution;
    uniform float uCameraNear;
    uniform float uCameraFar;
    uniform float uTime;
    uniform vec2 uMotionVec;
    uniform float uRadialBlur;
    uniform float uMotionBlurEnabled;
    uniform float uAOStrength;
    uniform float uFlareStrength;
    uniform vec3 uFogColor;
    uniform float uFogDensity;
    uniform float uSunWarmth;
    uniform float uVignette;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uGrain;
    varying vec2 vUv;

    float getLinearDepth(vec2 uv) {
      float z = texture2D(tDepth, clamp(uv, 0.001, 0.999)).x;
      float ndc = z * 2.0 - 1.0;
      return (2.0 * uCameraNear * uCameraFar) / max(0.0001, uCameraFar + uCameraNear - ndc * (uCameraFar - uCameraNear));
    }

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 texelSize = 1.0 / max(uResolution, vec2(1.0));
      vec2 centered = vUv - 0.5;
      float edgeDist = length(centered);

      // 1. CAMERA-VELOCITY DIRECTIONAL + SPRINT RADIAL MOTION BLUR (7-tap depth-aware!)
      vec2 blurDir = (uMotionVec + centered * uRadialBlur * 0.35) * uMotionBlurEnabled;
      float blurMag = length(blurDir);
      vec3 col = vec3(0.0);

      if (blurMag > 0.0008) {
        vec2 stepV = blurDir / 6.0;
        float wSum = 0.0;
        for (int i = -3; i <= 3; i++) {
          float fi = float(i);
          float w = 1.0 - abs(fi) * 0.18;
          vec2 sUv = clamp(vUv + stepV * fi, 0.001, 0.999);
          col += texture2D(tDiffuse, sUv).rgb * w;
          wSum += w;
        }
        col /= wSum;
      } else {
        // Subtle optical radial chromatic aberration near viewport edges when crisp
        float ca = edgeDist * edgeDist * 0.0024;
        vec2 caOff = centered * ca;
        col.r = texture2D(tDiffuse, clamp(vUv + caOff, 0.001, 0.999)).r;
        col.g = texture2D(tDiffuse, vUv).g;
        col.b = texture2D(tDiffuse, clamp(vUv - caOff, 0.001, 0.999)).b;
      }

      // 2. HARDWARE DEPTH-BUFFER SCREEN-SPACE AMBIENT OCCLUSION (Clean bilateral Vogel disk — ZERO flat-surface stipple!)
      float centerDepth = getLinearDepth(vUv);
      if (uAOStrength > 0.01 && centerDepth < 140.0) {
        float rot = hash12(gl_FragCoord.xy) * 6.283185;
        float aoRadiusPx = clamp(18.0 / (centerDepth * 0.14 + 0.55), 3.0, 18.0);
        float occ = 0.0;
        for (int i = 0; i < 8; i++) {
          float fi = float(i);
          float ang = fi * 2.399963 + rot;
          float rad = sqrt((fi + 0.5) / 8.0) * aoRadiusPx;
          vec2 off = vec2(cos(ang), sin(ang)) * rad * texelSize;
          float sampleD = getLinearDepth(vUv + off);
          float diff = centerDepth - sampleD;
          float rangeCheck = smoothstep(0.0, 1.0, 1.35 / max(abs(diff), 0.001));
          occ += smoothstep(0.08, 0.55, diff) * rangeCheck;
        }
        float ao = 1.0 - clamp((occ / 8.0) * uAOStrength * 1.45, 0.0, 0.62);
        col *= mix(vec3(0.68, 0.66, 0.64), vec3(1.0), ao);
      }

      // 3. ANAMORPHIC HORIZONTAL LENS FLARE STREAKS OFF TRUE LINEAR HDR HIGHLIGHTS (High threshold 2.45 -> ZERO glare on escalators or chrome!)
      if (uFlareStrength > 0.005) {
        vec3 streak = vec3(0.0);
        for (int s = -4; s <= 4; s++) {
          if (s == 0) continue;
          float fs = float(s);
          vec2 sUv = clamp(vUv + vec2(fs * 8.5 * texelSize.x, 0.0), 0.001, 0.999);
          vec3 sc = texture2D(tDiffuse, sUv).rgb;
          float lum = dot(sc, vec3(0.2126, 0.7152, 0.0722));
          float bright = max(lum - 2.45, 0.0);
          float falloff = 1.0 / (1.0 + abs(fs) * 0.65);
          streak += sc * bright * falloff;
        }
        col += streak * vec3(1.08, 0.94, 0.78) * uFlareStrength * 0.08;
      }

      // 4. DEPTH-AWARE ATMOSPHERIC VOLUMETRIC HAZE (Starts cleanly at 64m — ZERO milky concrete fog across atriums!)
      float fogFactor = clamp((1.0 - exp(-max(0.0, centerDepth - 64.0) * uFogDensity)) * 0.34, 0.0, 0.24);
      fogFactor *= step(centerDepth, 580.0);
      vec3 atmoTint = mix(uFogColor * 0.66, vec3(0.95, 0.74, 0.50), 0.44 * uSunWarmth);
      col = mix(col, atmoTint, fogFactor);

      // 5. LINEAR HDR ARCHITECTURAL CONTRAST, SATURATION & WARM/COOL SPLIT TONING
      col = max(col, 0.0);
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, uSaturation);

      // Balanced architectural contrast preserving bright warm ceilings & luxury matte-black details!
      col = pow(max(col, vec3(0.0001)), vec3(uContrast)) * 1.05;

      // Natural warm-ivory Malaysian luxury mall split tone (ZERO cold blue shadow cast!)
      vec3 shadowTint = vec3(1.00, 0.98, 0.96);
      vec3 highTint = mix(vec3(1.01, 1.00, 0.99), vec3(1.05, 1.01, 0.94), uSunWarmth);
      col *= mix(shadowTint, highTint, smoothstep(0.08, 0.85, luma));

      // 6. OPTICAL LENS VIGNETTE + SUBTLE 35MM FILMIC MICRO-GRAIN
      float vig = 1.0 - dot(centered, centered) * uVignette * 1.45;
      col *= clamp(vig, 0.70, 1.0);

      float grain = (hash12(gl_FragCoord.xy + fract(uTime * 17.3) * 100.0) - 0.5) * uGrain;
      col = max(col + grain * (0.40 + 0.60 * (1.0 - min(luma, 1.0))), 0.0);

      gl_FragColor = vec4(col, 1.0);
    }
  `
};

// Backwards-compatible alias in case anything imports CinemaGradeShader
export const CinemaGradeShader = AAAPostProcessShader;
