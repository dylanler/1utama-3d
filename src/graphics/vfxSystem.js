import * as THREE from 'three';

/**
 * Triple-A Real-Time GPU Particle VFX Engine (< 8 draw calls total for ~3,000 particles):
 * 1. Volumetric Atrium Sunbeam Dust & Bokeh Motes (Old Wing, Rainforest, Oval)
 * 2. Rainforest Waterfall & Plunge-Pool Rising Mist Plumes + Sparkling Water Spray
 * 3. FlowRider® LG601 Dynamic Carving Sheet-Wave Spray Plume
 * 4. WINDLAB S601 Updraft Spiral Vortex Streamlines
 * 5. Tropical Monsoon 3D Slanted Rain Streaks (Promenade Exterior & Upper Roof)
 * 6. Golden Sunset / Night Luxe Rooftop Fireflies & Festive Pavilion Embers
 * 7. Interactive 3D Celebration Spark Bursts on any [E] interaction!
 */
export function buildVFXSystem(scene) {
  const root = new THREE.Group();
  root.name = 'AAAVFXSystem';
  scene.add(root);

  // ==========================================================================
  // 1. VOLUMETRIC ATRIUM SUNBEAM BOKEH DUST MOTES (900 GPU-animated particles)
  // ==========================================================================
  const moteCount = 900;
  const motePos = new Float32Array(moteCount * 3);
  const moteSeed = new Float32Array(moteCount * 3);
  const atriums = [
    { x: -74, z: 0, rx: 22, rz: 10, h: 28 },
    { x: 38, z: 0, rx: 17, rz: 12, h: 35 },
    { x: 138, z: 0, rx: 18, rz: 12, h: 35 }
  ];
  for (let i = 0; i < moteCount; i++) {
    const a = atriums[i % 3];
    motePos[i * 3] = a.x + (Math.random() - 0.5) * a.rx * 1.9;
    motePos[i * 3 + 1] = 1.2 + Math.random() * a.h;
    motePos[i * 3 + 2] = a.z + (Math.random() - 0.5) * a.rz * 1.9;
    moteSeed[i * 3] = Math.random() * 6.2831;
    moteSeed[i * 3 + 1] = 0.6 + Math.random() * 1.4; // size scale
    moteSeed[i * 3 + 2] = 0.35 + Math.random() * 0.65; // brightness
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  moteGeo.setAttribute('aSeed', new THREE.BufferAttribute(moteSeed, 3));

  const moteMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#ffebc2') },
      uIntensity: { value: 0.52 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) }
    },
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * 0.35 + aSeed.x;
        p.x += sin(t * 0.9 + p.y * 0.25) * 0.65;
        p.y += sin(t * 0.55) * 0.45;
        p.z += cos(t * 0.8 + p.x * 0.2) * 0.65;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = max(1.0, -mv.z);
        gl_PointSize = clamp((38.0 * aSeed.y * uPixelRatio) / dist, 1.5, 14.0);
        float shimmer = 0.55 + 0.45 * sin(uTime * 2.1 + aSeed.x * 3.7);
        float fadeNear = smoothstep(1.2, 4.5, dist);
        float fadeFar = 1.0 - smoothstep(45.0, 95.0, dist);
        vAlpha = aSeed.z * shimmer * fadeNear * fadeFar;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r = length(c);
        if (r > 0.5) discard;
        // Soft optical bokeh ring + luminous core
        float core = exp(-r * r * 18.0);
        float halo = smoothstep(0.5, 0.12, r) * 0.35;
        float a = (core + halo) * vAlpha * uIntensity;
        gl_FragColor = vec4(uColor * a * 1.4, a);
      }
    `
  });
  const dustMotes = new THREE.Points(moteGeo, moteMat);
  dustMotes.frustumCulled = false;
  root.add(dustMotes);

  // ==========================================================================
  // 2. WATERFALL MIST PLUMES & FLOWRIDER CARVING WATER SPRAY (280 GPU particles)
  // ==========================================================================
  const mistCount = 280;
  const mistPos = new Float32Array(mistCount * 3);
  const mistMeta = new Float32Array(mistCount * 4); // phase, speed, spread, type(0=waterfall,1=flowrider)
  for (let i = 0; i < mistCount; i++) {
    const isFlow = i >= 180;
    if (!isFlow) {
      mistPos[i * 3] = 44.8 + (Math.random() - 0.5) * 4.4;
      mistPos[i * 3 + 1] = 0.0;
      mistPos[i * 3 + 2] = 7.4 + (Math.random() - 0.5) * 3.4;
      mistMeta[i * 4] = Math.random();
      mistMeta[i * 4 + 1] = 0.22 + Math.random() * 0.22;
      mistMeta[i * 4 + 2] = 1.2 + Math.random() * 1.8;
      mistMeta[i * 4 + 3] = 0.0;
    } else {
      mistPos[i * 3] = -175.8 + (Math.random() - 0.5) * 1.6;
      mistPos[i * 3 + 1] = 0.6;
      mistPos[i * 3 + 2] = (Math.random() - 0.5) * 8.5;
      mistMeta[i * 4] = Math.random();
      mistMeta[i * 4 + 1] = 0.65 + Math.random() * 0.55;
      mistMeta[i * 4 + 2] = 0.7 + Math.random() * 1.0;
      mistMeta[i * 4 + 3] = 1.0;
    }
  }
  const mistGeo = new THREE.BufferGeometry();
  mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
  mistGeo.setAttribute('aMeta', new THREE.BufferAttribute(mistMeta, 4));

  const mistMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) }
    },
    vertexShader: /* glsl */ `
      attribute vec4 aMeta;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vLife;
      varying float vType;
      void main() {
        float life = fract(aMeta.x + uTime * aMeta.y);
        vLife = life;
        vType = aMeta.w;
        vec3 p = position;
        if (aMeta.w < 0.5) {
          // Waterfall rising cool mist plume
          p.y += life * 4.2;
          p.x += sin(life * 5.0 + aMeta.x * 12.0) * 0.85 * life;
          p.z -= life * 2.1;
        } else {
          // FlowRider sheet-wave dynamic spray droplets
          p.x -= life * 2.6;
          p.y += sin(life * 3.14159) * 1.55;
          p.z += sin(uTime * 1.9) * 1.2 + cos(aMeta.x * 20.0) * life * 0.8;
        }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = max(1.0, -mv.z);
        float baseSz = aMeta.w < 0.5 ? (175.0 * (0.65 + life * 1.15)) : (52.0 * (1.0 - life * 0.4));
        gl_PointSize = clamp((baseSz * aMeta.z * uPixelRatio) / dist, 3.0, 96.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vLife;
      varying float vType;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r = length(c);
        if (r > 0.5) discard;
        float soft = pow(1.0 - r * 2.0, vType < 0.5 ? 2.1 : 1.6);
        float env = sin(vLife * 3.14159);
        vec3 col = vType < 0.5 ? vec3(0.84, 0.96, 1.0) : vec3(0.92, 0.98, 1.0);
        float alpha = soft * env * (vType < 0.5 ? 0.16 : 0.42);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
  const mistParticles = new THREE.Points(mistGeo, mistMat);
  mistParticles.frustumCulled = false;
  root.add(mistParticles);

  // ==========================================================================
  // 3. WINDLAB VORTEX STREAMLINES & HERO ACCENT EMBERS (260 GPU particles)
  // ==========================================================================
  const accentCount = 260;
  const accPos = new Float32Array(accentCount * 3);
  const accMeta = new Float32Array(accentCount * 4); // angle, speed, radius, kind(0=windlab,1=festive,2=hypercar,3=rooftopFirefly)
  for (let i = 0; i < accentCount; i++) {
    let kind = 0;
    if (i < 90) {
      kind = 0; // WINDLAB skydiving cylinder (-170.5, 18.0, -12.8)
      accPos[i * 3] = -170.5;
      accPos[i * 3 + 1] = 18.5;
      accPos[i * 3 + 2] = -12.8;
      accMeta[i * 4] = Math.random() * 6.2831;
      accMeta[i * 4 + 1] = 0.7 + Math.random() * 0.6;
      accMeta[i * 4 + 2] = 0.6 + Math.random() * 1.45;
    } else if (i < 150) {
      kind = 1; // Old Wing Festive Pavilion (-74, 0, 0)
      accPos[i * 3] = -74.0;
      accPos[i * 3 + 1] = 0.8;
      accPos[i * 3 + 2] = 0.0;
      accMeta[i * 4] = Math.random() * 6.2831;
      accMeta[i * 4 + 1] = 0.14 + Math.random() * 0.12;
      accMeta[i * 4 + 2] = 3.5 + Math.random() * 5.8;
    } else if (i < 200) {
      kind = 2; // Oval EV Hypercar holographic energy ring (138, 0.3, 0)
      accPos[i * 3] = 138.0;
      accPos[i * 3 + 1] = 0.4;
      accPos[i * 3 + 2] = 0.0;
      accMeta[i * 4] = Math.random() * 6.2831;
      accMeta[i * 4 + 1] = 0.28 + Math.random() * 0.25;
      accMeta[i * 4 + 2] = 3.2 + Math.random() * 3.1;
    } else {
      kind = 3; // UR603A Secret Garden fireflies / glowing golden pollen
      accPos[i * 3] = 18.0 + Math.random() * 145.0;
      accPos[i * 3 + 1] = 38.0 + Math.random() * 3.8;
      accPos[i * 3 + 2] = (Math.random() - 0.5) * 46.0;
      accMeta[i * 4] = Math.random() * 6.2831;
      accMeta[i * 4 + 1] = 0.25 + Math.random() * 0.35;
      accMeta[i * 4 + 2] = 0.6 + Math.random() * 1.4;
    }
    accMeta[i * 4 + 3] = kind;
  }
  const accGeo = new THREE.BufferGeometry();
  accGeo.setAttribute('position', new THREE.BufferAttribute(accPos, 3));
  accGeo.setAttribute('aMeta', new THREE.BufferAttribute(accMeta, 4));

  const accMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uFireflyGlow: { value: 0.45 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) }
    },
    vertexShader: /* glsl */ `
      attribute vec4 aMeta;
      uniform float uTime;
      uniform float uFireflyGlow;
      uniform float uPixelRatio;
      varying vec3 vCol;
      varying float vAlpha;
      void main() {
        float kind = aMeta.w;
        float t = uTime * aMeta.y;
        vec3 p = position;
        vAlpha = 0.75;
        if (kind < 0.5) {
          // WINDLAB updraft spiral
          float h = fract(t + aMeta.x * 0.159);
          float ang = aMeta.x + uTime * 3.8 + h * 5.0;
          p.x += cos(ang) * aMeta.z;
          p.z += sin(ang) * aMeta.z;
          p.y += h * 4.4;
          vCol = mix(vec3(0.22, 0.82, 1.0), vec3(0.75, 0.45, 1.0), h);
          vAlpha = sin(h * 3.14159) * 0.78;
        } else if (kind < 1.5) {
          // Festive Pavilion golden rising embers
          float h = fract(t + aMeta.x * 0.159);
          float ang = aMeta.x + uTime * 0.35;
          p.x += cos(ang) * aMeta.z;
          p.z += sin(ang) * aMeta.z;
          p.y += h * 11.0;
          vCol = vec3(1.0, 0.84, 0.32);
          vAlpha = sin(h * 3.14159) * 0.62;
        } else if (kind < 2.5) {
          // Oval Hypercar cyan/emerald spotlight motes
          float h = fract(t + aMeta.x * 0.159);
          float ang = aMeta.x + uTime * 0.65;
          p.x += cos(ang) * aMeta.z;
          p.z += sin(ang) * aMeta.z;
          p.y += h * 3.2;
          vCol = vec3(0.24, 0.92, 0.96);
          vAlpha = sin(h * 3.14159) * 0.68;
        } else {
          // Secret Garden fireflies
          p.x += sin(uTime * 0.7 + aMeta.x) * aMeta.z;
          p.y += cos(uTime * 0.9 + aMeta.x * 2.1) * 0.55;
          p.z += cos(uTime * 0.6 + aMeta.x * 1.4) * aMeta.z;
          vCol = vec3(0.95, 1.0, 0.45);
          vAlpha = (0.35 + 0.65 * sin(uTime * 3.4 + aMeta.x * 5.0)) * uFireflyGlow;
        }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = max(1.0, -mv.z);
        gl_PointSize = clamp((34.0 * uPixelRatio) / dist, 2.0, 14.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vCol;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r = length(c);
        if (r > 0.5) discard;
        float glow = exp(-r * r * 16.0);
        gl_FragColor = vec4(vCol * glow * vAlpha * 1.6, glow * vAlpha);
      }
    `
  });
  const accentParticles = new THREE.Points(accGeo, accMat);
  accentParticles.frustumCulled = false;
  root.add(accentParticles);

  // ==========================================================================
  // 4. TROPICAL MALAYSIAN MONSOON 3D RAIN CURTAIN (1,400 slanted rain streaks)
  // ==========================================================================
  const rainCount = 1400;
  const rainPos = new Float32Array(rainCount * 2 * 3); // line segments
  const rainSeed = new Float32Array(rainCount * 2);
  for (let i = 0; i < rainCount; i++) {
    // Spread across Upper Roof + Exterior Promenade + Boulevard
    const onRoof = i < 950;
    const rx = onRoof ? 10 + Math.random() * 172 : -40 + Math.random() * 68;
    const ry = onRoof ? 37.5 + Math.random() * 26.0 : -4.0 + Math.random() * 34.0;
    const rz = onRoof ? (Math.random() - 0.5) * 66 : (Math.random() > 0.5 ? 1 : -1) * (13.5 + Math.random() * 32);
    const s = Math.random();
    // Top vertex
    rainPos[i * 6 + 0] = rx;
    rainPos[i * 6 + 1] = ry;
    rainPos[i * 6 + 2] = rz;
    // Bottom vertex (slanted monsoon wind streak)
    rainPos[i * 6 + 3] = rx - 0.22;
    rainPos[i * 6 + 4] = ry - 1.35;
    rainPos[i * 6 + 5] = rz + 0.14;
    rainSeed[i * 2] = s;
    rainSeed[i * 2 + 1] = s;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  rainGeo.setAttribute('aSeed', new THREE.BufferAttribute(rainSeed, 1));

  const rainMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uRainAmount: { value: 0.0 }
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uRainAmount;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float drop = fract(aSeed + uTime * 2.15);
        p.y -= drop * 26.0;
        p.x -= drop * 4.2;
        if (position.y > 35.0) {
          p.y = 37.2 + mod(p.y - 37.2, 26.0);
        } else {
          p.y = -5.0 + mod(p.y + 5.0, 34.0);
        }
        vAlpha = uRainAmount * 0.42;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        if (vAlpha < 0.01) discard;
        gl_FragColor = vec4(0.76, 0.89, 1.0, vAlpha);
      }
    `
  });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.frustumCulled = false;
  rainLines.visible = false;
  root.add(rainLines);

  // ==========================================================================
  // 5. INTERACTIVE 3D CELEBRATION SPARK BURSTS (Spawned on every [E] action!)
  // ==========================================================================
  const BURST_MAX = 160;
  const burstPos = new Float32Array(BURST_MAX * 3);
  const burstCol = new Float32Array(BURST_MAX * 3);
  const burstAlpha = new Float32Array(BURST_MAX);
  const burstParticles = [];
  for (let i = 0; i < BURST_MAX; i++) {
    burstParticles.push({
      active: false,
      x: 0, y: -999, z: 0,
      vx: 0, vy: 0, vz: 0,
      life: 0, maxLife: 1,
      r: 1, g: 0.85, b: 0.35
    });
  }
  const burstGeo = new THREE.BufferGeometry();
  const burstPosAttr = new THREE.BufferAttribute(burstPos, 3);
  const burstColAttr = new THREE.BufferAttribute(burstCol, 3);
  const burstAlphaAttr = new THREE.BufferAttribute(burstAlpha, 1);
  burstGeo.setAttribute('position', burstPosAttr);
  burstGeo.setAttribute('aColor', burstColAttr);
  burstGeo.setAttribute('aAlpha', burstAlphaAttr);

  const burstMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) }
    },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aAlpha;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = aColor;
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float dist = max(1.0, -mv.z);
        gl_PointSize = clamp((58.0 * uPixelRatio) / dist, 2.0, 22.0) * aAlpha;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        if (vAlpha <= 0.01) discard;
        vec2 c = gl_PointCoord - 0.5;
        float r = length(c);
        if (r > 0.5) discard;
        float core = exp(-r * r * 14.0);
        gl_FragColor = vec4(vColor * core * vAlpha * 2.2, core * vAlpha);
      }
    `
  });
  const burstPoints = new THREE.Points(burstGeo, burstMat);
  burstPoints.frustumCulled = false;
  root.add(burstPoints);

  let burstCursor = 0;
  function spawnBurst(worldPos, hexColor = '#fbbf24', count = 42) {
    const c = new THREE.Color(hexColor);
    for (let i = 0; i < count; i++) {
      const p = burstParticles[burstCursor];
      burstCursor = (burstCursor + 1) % BURST_MAX;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.65;
      const spd = 1.6 + Math.random() * 3.6;
      p.active = true;
      p.x = worldPos.x + (Math.random() - 0.5) * 0.4;
      p.y = worldPos.y + (Math.random() - 0.5) * 0.3;
      p.z = worldPos.z + (Math.random() - 0.5) * 0.4;
      p.vx = Math.cos(theta) * Math.sin(phi) * spd;
      p.vy = Math.cos(phi) * spd + 1.4;
      p.vz = Math.sin(theta) * Math.sin(phi) * spd;
      p.life = 0;
      p.maxLife = 0.85 + Math.random() * 0.65;
      p.r = c.r;
      p.g = c.g;
      p.b = c.b;
    }
  }

  function setWeather(weatherIdx) {
    const isRain = weatherIdx === 3;
    rainLines.visible = isRain;
    rainMat.uniforms.uRainAmount.value = isRain ? 1.0 : 0.0;
    if (weatherIdx === 1) {
      moteMat.uniforms.uColor.value.set('#ffd28a');
      moteMat.uniforms.uIntensity.value = 0.72;
      accMat.uniforms.uFireflyGlow.value = 0.95;
    } else if (weatherIdx === 2) {
      moteMat.uniforms.uColor.value.set('#93c5fd');
      moteMat.uniforms.uIntensity.value = 0.42;
      accMat.uniforms.uFireflyGlow.value = 1.0;
    } else if (weatherIdx === 3) {
      moteMat.uniforms.uColor.value.set('#cbd5e1');
      moteMat.uniforms.uIntensity.value = 0.25;
      accMat.uniforms.uFireflyGlow.value = 0.2;
    } else {
      moteMat.uniforms.uColor.value.set('#ffefc9');
      moteMat.uniforms.uIntensity.value = 0.56;
      accMat.uniforms.uFireflyGlow.value = 0.38;
    }
  }

  function update(dt, elapsed) {
    moteMat.uniforms.uTime.value = elapsed;
    mistMat.uniforms.uTime.value = elapsed;
    accMat.uniforms.uTime.value = elapsed;
    if (rainLines.visible) {
      rainMat.uniforms.uTime.value = elapsed;
    }

    let anyBurst = false;
    for (let i = 0; i < BURST_MAX; i++) {
      const p = burstParticles[i];
      if (!p.active) {
        burstAlpha[i] = 0;
        continue;
      }
      anyBurst = true;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        burstAlpha[i] = 0;
        burstPos[i * 3 + 1] = -999;
        continue;
      }
      p.vy -= 5.8 * dt;
      p.vx *= 0.985;
      p.vz *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      burstPos[i * 3] = p.x;
      burstPos[i * 3 + 1] = p.y;
      burstPos[i * 3 + 2] = p.z;
      burstCol[i * 3] = p.r;
      burstCol[i * 3 + 1] = p.g;
      burstCol[i * 3 + 2] = p.b;
      burstAlpha[i] = 1.0 - p.life / p.maxLife;
    }
    if (anyBurst) {
      burstPosAttr.needsUpdate = true;
      burstColAttr.needsUpdate = true;
      burstAlphaAttr.needsUpdate = true;
    }
  }

  return { root, spawnBurst, setWeather, update };
}
