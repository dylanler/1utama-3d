import * as THREE from 'three';
import { FLOORS, ESCALATOR_BANKS, ELEVATORS } from '../data/mallLayout.js';
import { createEscalatorStepTexture, createEscalatorStepNormalMap, createImaxEscalatorTexture } from '../graphics/proceduralTextures.js';
import { collapseStaticMeshes } from './batchUtils.js';

export function buildTraversalSystems(scene, interactables, onLiftArrived) {
  const root = new THREE.Group();
  root.name = 'TraversalSystems';
  scene.add(root);

  // ==========================================================================
  // 1. REAL 1 UTAMA HITACHI MOVING 3D STAIRCASE ESCALATORS (INSTANCED 3D STEPS!)
  // ==========================================================================
  const stepTex = createEscalatorStepTexture();
  stepTex.repeat.set(1, 1);
  const stepNorm = createEscalatorStepNormalMap();

  const stepMetalMat = new THREE.MeshStandardMaterial({
    color: '#2b323c',
    map: stepTex,
    normalMap: stepNorm,
    normalScale: new THREE.Vector2(1.20, 1.20),
    roughness: 0.34,
    metalness: 0.72,
    envMapIntensity: 1.15
  });
  const stepYellowMat = new THREE.MeshStandardMaterial({
    color: '#facc15',
    roughness: 0.36,
    metalness: 0.14
  });
  const trussMat = new THREE.MeshStandardMaterial({
    color: '#cfd8e3',
    roughness: 0.22,
    metalness: 0.88,
    envMapIntensity: 1.35
  });
  const skirtDarkMat = new THREE.MeshStandardMaterial({
    color: '#252d3a',
    roughness: 0.32,
    metalness: 0.78,
    envMapIntensity: 1.05
  });
  const handrailBlackMat = new THREE.MeshStandardMaterial({
    color: '#161a22',
    roughness: 0.18,
    metalness: 0.28,
    envMapIntensity: 1.15
  });
  const handrailBurgundyMat = new THREE.MeshStandardMaterial({
    color: '#7c1d24',
    roughness: 0.22,
    metalness: 0.24,
    envMapIntensity: 1.05
  });
  const imaxBalTex = createImaxEscalatorTexture();
  const imaxBalMat = new THREE.MeshStandardMaterial({
    map: imaxBalTex,
    emissive: '#0284c7',
    emissiveIntensity: 0.18,
    roughness: 0.26,
    metalness: 0.16
  });
  const rfGreenEnamelMat = new THREE.MeshStandardMaterial({
    color: '#14532d',
    roughness: 0.26,
    metalness: 0.28,
    envMapIntensity: 0.95
  });
  const escGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#cdeee8',
    transparent: true,
    opacity: 0.42,
    roughness: 0.04,
    metalness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 2.15,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const escGlassEdgeMat = new THREE.MeshStandardMaterial({ color: '#7cc7ba', roughness: 0.14, metalness: 0.55 });
  // Subtle warm champagne architectural skirt LEDs (ZERO jagged white stair-stepping!)
  const escSkirtLedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.96, 0.84, 0.60) });
  const greenBeaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 1.15, 0.56) });
  const amberBeaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.15, 0.76, 0.22) });
  const combPlateMat = new THREE.MeshStandardMaterial({
    color: '#d8e1ec',
    map: stepTex,
    normalMap: stepNorm,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughness: 0.22,
    metalness: 0.90,
    envMapIntensity: 1.45
  });

  const STEPS_PER_BANK = 34;
  const totalStepCount = ESCALATOR_BANKS.length * STEPS_PER_BANK;
  // Physical 3D Horizontal Grooved Brushed-Aluminum Stair Tread + Vertical Riser Block (1 InstancedMesh draw call!)
  const stepGeo = new THREE.BoxGeometry(0.42, 0.24, 1.18);
  const instSteps = new THREE.InstancedMesh(stepGeo, stepMetalMat, totalStepCount);
  instSteps.frustumCulled = false;
  root.add(instSteps);

  // Slim 4.2cm Front Yellow Safety Nosing Lip ONLY (exposes full brushed ribbed aluminum treads — ZERO Playmobil solid yellow steps!)
  const stepTrimGeo = new THREE.BoxGeometry(0.044, 0.022, 1.19);
  const instStepTrims = new THREE.InstancedMesh(stepTrimGeo, stepYellowMat, totalStepCount);
  instStepTrims.frustumCulled = false;
  root.add(instStepTrims);

  const escalatorData = [];
  const stepDummy = new THREE.Object3D();

  for (let bIdx = 0; bIdx < ESCALATOR_BANKS.length; bIdx++) {
    const bank = ESCALATOR_BANKS[bIdx];
    const y0 = FLOORS[bank.lowerFloor].y;
    const y1 = FLOORS[bank.upperFloor].y;
    const dx = bank.xEnd - bank.xStart;
    const dy = y1 - y0;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const cx = (bank.xStart + bank.xEnd) * 0.5;
    const cy = (y0 + y1) * 0.5;

    const g = new THREE.Group();
    g.position.set(cx, cy, bank.z);

    // Inclined sub-group (truss, glass balustrades & black moving handrail — NO smooth ramp hiding our 3D steps!)
    const incline = new THREE.Group();
    incline.rotation.z = angle;
    g.add(incline);

    // Properly orient incline for BOTH positive-dx and negative-dx crisscrossing escalators!
    const flipX = dx < 0;
    const dirSign = dx >= 0 ? 1 : -1;
    const absAngle = Math.atan2(dy, Math.abs(dx));
    const sinA = Math.sin(absAngle);
    const cosA = Math.cos(absAngle);
    incline.rotation.z = flipX ? Math.atan2(-dy, -dx) : angle;

    // Helper: position an inclined element at vertical height H above the step-line so its ends meet
    // (xStart, y0 + H) and (xEnd, y1 + H) with ZERO horizontal skew or diagonal overhang!
    const setInclinedPos = (mesh, H, zPos, xShift = 0) => {
      mesh.position.set(dirSign * (H * sinA + xShift), H * cosA, zPos);
    };

    const activeTrussMat = bank.theme === 'rainforest-green'
      ? rfGreenEnamelMat
      : bank.theme === 'tgv-imax'
      ? new THREE.MeshStandardMaterial({ color: '#2b2826', roughness: 0.42, metalness: 0.45 })
      : bank.theme === 'oval-led'
      ? new THREE.MeshStandardMaterial({ color: '#e2e8f0', emissive: '#fff4d8', emissiveIntensity: 0.34, roughness: 0.28, metalness: 0.65 })
      : trussMat;
    const activeBalMat = bank.theme === 'tgv-imax'
      ? imaxBalMat
      : bank.theme === 'rainforest-green'
      ? rfGreenEnamelMat
      : escGlassMat;

    // Recessed dark step-chain underbed tucked strictly BELOW all 34 steps
    const underBed = new THREE.Mesh(new THREE.BoxGeometry(length - 0.50, 0.14, bank.width * 0.78), skirtDarkMat);
    setInclinedPos(underBed, -0.34, 0, 0.12);
    incline.add(underBed);

    // Architectural Under-Truss aligned so upper end joins flush into the upper ceiling soffit return (ZERO floating flange!)
    // and lower end stays tucked inside the lower floor slab.
    const truss = new THREE.Mesh(
      new THREE.BoxGeometry(length - 0.36, 0.38, bank.width * 0.90),
      activeTrussMat
    );
    setInclinedPos(truss, -0.48, 0, 0.18);
    incline.add(truss);

    // Upper horizontal machine-head truss soffit return seated 100% flush with ceiling coffer (y = y1 - 0.605..y1 - 0.02)!
    const upperTrussHead = new THREE.Mesh(
      new THREE.BoxGeometry(1.36, 0.585, bank.width * 0.92),
      activeTrussMat
    );
    upperTrussHead.position.set(bank.xEnd + dirSign * 0.48, y1 - 0.3125, bank.z);
    root.add(upperTrussHead);

    // Seal the side well-collar soffit seam flush with the 1.36m (z = ±0.68) ceiling well opening!
    {
      const wellSoffitMat = new THREE.MeshStandardMaterial({ color: '#f0ece4', roughness: 0.42, metalness: 0.05 });
      const wellXMin = Math.min(bank.xStart, bank.xEnd) + 0.35;
      const wellXMax = Math.max(bank.xStart, bank.xEnd) - 0.04;
      const wellLen = wellXMax - wellXMin;
      const wellCenterX = (wellXMin + wellXMax) * 0.5;
      for (const zSign of [-1, 1]) {
        const sideClosure = new THREE.Mesh(
          new THREE.BoxGeometry(wellLen, 0.585, 0.06),
          wellSoffitMat
        );
        sideClosure.position.set(wellCenterX, y1 - 0.3125, bank.z + zSign * 0.66);
        root.add(sideClosure);
      }
    }

    // Glass/Themed side balustrades + skirt guards + warm 3000K skirt LEDs + black moving rubber handrails
    // All aligned to identical span (length + 0.04) and vertical-height-compensated localX so rail NEVER protrudes past glass!
    const balSpan = length + 0.04;
    for (const zSide of [-bank.width * 0.44, bank.width * 0.44]) {
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(balSpan, 0.30, 0.08),
        bank.theme === 'rainforest-green' ? activeTrussMat : skirtDarkMat
      );
      setInclinedPos(skirt, -0.06, zSide * 0.92);
      incline.add(skirt);

      const glass = new THREE.Mesh(new THREE.BoxGeometry(balSpan, 0.84 * cosA, 0.032), activeBalMat);
      setInclinedPos(glass, 0.45, zSide);
      incline.add(glass);

      // Tempered glass green architectural top-edge highlight + brushed stainless clamp channel
      const glassClamp = new THREE.Mesh(new THREE.BoxGeometry(balSpan, 0.04, 0.052), trussMat);
      setInclinedPos(glassClamp, 0.04, zSide);
      const glassEdge = new THREE.Mesh(new THREE.BoxGeometry(balSpan, 0.024, 0.038), escGlassEdgeMat);
      setInclinedPos(glassEdge, 0.86, zSide);
      incline.add(glassClamp, glassEdge);

      const skirtLed = new THREE.Mesh(new THREE.BoxGeometry(length - 0.08, 0.036, 0.032), escSkirtLedMat);
      setInclinedPos(skirtLed, 0.09, zSide * 0.87);
      incline.add(skirtLed);

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(balSpan, 0.075, 0.095),
        bank.theme === 'tgv-imax' ? handrailBurgundyMat : handrailBlackMat
      );
      setInclinedPos(rail, 0.89, zSide);
      incline.add(rail);
    }

    root.add(g);

    // Horizontal Top & Bottom Grooved Stainless Comb Landing Plates + Yellow Comb Teeth + Curved Handrail Newels!
    for (const endInfo of [
      { x: bank.xStart - dirSign * 0.56, y: y0, isEntry: bank.direction === 1, sign: -dirSign },
      { x: bank.xEnd + dirSign * 0.56, y: y1, isEntry: bank.direction === -1, sign: dirSign }
    ]) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.05, 1.36), combPlateMat);
      plate.position.set(endInfo.x, endInfo.y + 0.015, bank.z);
      const combYellow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.058, bank.width * 0.84), stepYellowMat);
      combYellow.position.set(endInfo.x - endInfo.sign * 0.60, endInfo.y + 0.022, bank.z);
      root.add(plate, combYellow);

      // Curved semicircular rubber handrail newel loops + stainless newel ends meeting the inclined glass & handrail at xStart/xEnd!
      for (const zSide of [-bank.width * 0.44, bank.width * 0.44]) {
        const newelBody = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.86, 0.09), trussMat);
        newelBody.position.set(endInfo.x - endInfo.sign * 0.06, endInfo.y + 0.43, bank.z + zSide);
        const newelTop = new THREE.Mesh(
          new THREE.BoxGeometry(1.08, 0.075, 0.095),
          bank.theme === 'tgv-imax' ? handrailBurgundyMat : handrailBlackMat
        );
        newelTop.position.set(endInfo.x - endInfo.sign * 0.06, endInfo.y + 0.89, bank.z + zSide);
        const newelCurve = new THREE.Mesh(
          new THREE.TorusGeometry(0.28, 0.042, 12, 20, Math.PI),
          bank.theme === 'tgv-imax' ? handrailBurgundyMat : handrailBlackMat
        );
        newelCurve.rotation.z = endInfo.sign < 0 ? Math.PI / 2 : -Math.PI / 2;
        newelCurve.position.set(endInfo.x + endInfo.sign * 0.46, endInfo.y + 0.61, bank.z + zSide);
        root.add(newelBody, newelTop, newelCurve);
      }

      // Sleek architectural stainless end-cap with zero protruding glowing green dot on rubber handrail!
      const beacon = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.04, 0.04),
        endInfo.isEntry ? greenBeaconMat : amberBeaconMat
      );
      beacon.position.set(endInfo.x, endInfo.y + 0.16, bank.z - bank.width * 0.48);
      root.add(beacon);
    }

    escalatorData.push({
      ...bank,
      bankIdx: bIdx,
      y0,
      y1,
      dx,
      dy
    });
  }

  let escPhase = 0;
  function syncEscalatorSteps() {
    let idx = 0;
    for (const esc of escalatorData) {
      for (let s = 0; s < STEPS_PER_BANK; s++) {
        // Real moving staircase cycle: steps glide continuously UP or DOWN & level smoothly at comb landings!
        const rawT = (s / STEPS_PER_BANK + escPhase * esc.direction) % 1;
        const t = rawT < 0 ? rawT + 1 : rawT;
        const sx = esc.xStart + t * esc.dx;
        // Smooth 2-step horizontal comb landing transition at bottom (t < 0.08) and top (t > 0.92)!
        const yRamp = t < 0.08 ? 0 : t > 0.92 ? 1 : (t - 0.08) / 0.84;
        const sy = esc.y0 + yRamp * esc.dy - 0.105;

        stepDummy.position.set(sx, sy, esc.z);
        stepDummy.rotation.set(0, 0, 0);
        stepDummy.scale.set(1, 1, 1);
        stepDummy.updateMatrix();
        instSteps.setMatrixAt(idx, stepDummy.matrix);

        stepDummy.position.set(sx - (esc.dx >= 0 ? 0.185 : -0.185), sy + 0.114, esc.z);
        stepDummy.scale.set(1.0, 1.0, 1.0);
        stepDummy.updateMatrix();
        instStepTrims.setMatrixAt(idx, stepDummy.matrix);
        idx++;
      }
    }
    instSteps.instanceMatrix.needsUpdate = true;
    instStepTrims.instanceMatrix.needsUpdate = true;
  }
  syncEscalatorSteps();

  // ==========================================================================
  // 2. RIDEABLE ICONIC 1 UTAMA PANORAMIC CURVED GLASS BUBBLE ELEVATORS (OVAL & OLD WING)
  // ==========================================================================
  const liftSteelMat = new THREE.MeshStandardMaterial({
    color: '#dce3ec',
    roughness: 0.18,
    metalness: 0.88,
    envMapIntensity: 1.15
  });
  const liftFrameMat = new THREE.MeshStandardMaterial({
    color: '#9aa7b8',
    roughness: 0.24,
    metalness: 0.86,
    envMapIntensity: 1.12
  });
  // Crisp low-iron architectural Fresnel glass for cab bubble & curved hoistway (clear warm cab legibility + grazing Fresnel sheen!)
  const liftBubbleGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#eef8fb',
    transparent: true,
    opacity: 0.22,
    ior: 1.52,
    reflectivity: 0.94,
    roughness: 0.03,
    metalness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.95,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const shaftGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#e6f4f8',
    transparent: true,
    opacity: 0.16,
    ior: 1.52,
    reflectivity: 0.94,
    roughness: 0.03,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.75,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  // Balanced warm champagne architectural accents (strictly below bloomPass threshold 1.24 -> ZERO blown-out white star-blobs!)
  const liftGlowRingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.16, 0.96, 0.62) });
  const liftCyanAccentMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.20, 0.99, 0.62) });
  const cabWarmLightMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.18, 1.00, 0.72) });
  // Interior warm backlit frosted-acrylic rear-side valence & cove panels (emissiveIntensity 0.85 -> rich luxury glow, zero blowout!)
  const cabBacklitAcrylicMat = new THREE.MeshStandardMaterial({
    color: '#fff4dc',
    emissive: '#ffcf86',
    emissiveIntensity: 0.85,
    roughness: 0.28,
    metalness: 0.04,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide
  });
  const cabMarbleFloorMat = new THREE.MeshStandardMaterial({
    color: '#d6ccbc',
    roughness: 0.34,
    metalness: 0.04,
    envMapIntensity: 0.72
  });
  const cabCeilingSoffitMat = new THREE.MeshStandardMaterial({
    color: '#e9e0d2',
    roughness: 0.42,
    metalness: 0.16,
    envMapIntensity: 0.72
  });
  const cabDownlightBezelMat = new THREE.MeshStandardMaterial({
    color: '#3a342c',
    roughness: 0.28,
    metalness: 0.78,
    envMapIntensity: 0.95
  });
  const cabGoldRailMat = new THREE.MeshStandardMaterial({ color: '#d4af45', roughness: 0.22, metalness: 0.88, envMapIntensity: 1.20 });
  const hoistCableMat = new THREE.MeshStandardMaterial({ color: '#8d99a8', roughness: 0.26, metalness: 0.90 });
  // Sleek dark-granite counterweight slabs + gunmetal structural frame riding opposite the cab!
  const cwGraniteMat = new THREE.MeshStandardMaterial({
    color: '#252a32',
    roughness: 0.32,
    metalness: 0.24,
    envMapIntensity: 0.92
  });
  const cwFrameSteelMat = new THREE.MeshStandardMaterial({
    color: '#4c5664',
    roughness: 0.26,
    metalness: 0.86,
    envMapIntensity: 1.15
  });

  function computeCounterweightY(lift, cabY) {
    const span = Math.max(0.01, lift.maxY - lift.minY);
    const t = THREE.MathUtils.clamp((cabY - lift.minY) / span, 0, 1);
    const cwMinY = lift.minY + 1.5;
    const cwMaxY = lift.maxY - Math.min(4.1, span * 0.11);
    return cwMinY + (1 - t) * (cwMaxY - cwMinY);
  }

  const elevatorInstances = [];

  for (const cfg of ELEVATORS) {
    const minY = FLOORS[cfg.minFloor].y;
    const maxY = FLOORS[cfg.maxFloor].y;
    const totalH = maxY - minY + 4.4;
    const bubbleDir = -cfg.doorDir; // Panoramic curved glass bubble faces OPPOSITE the sliding lobby doors!
    const isOvalTwin = cfg.id === 'oval-lift-north' || cfg.id === 'oval-lift-south';
    const shaftRadius = cfg.cabDepth * 0.525; // 1.47m — fits cleanly inside ±1.50m slab cutouts on all 4 lifts!
    const shaftArcCenterX = cfg.x + bubbleDir * 0.02;
    const doorX = cfg.x + cfg.doorDir * (cfg.cabWidth * 0.5);
    const sideLen = Math.abs(doorX - shaftArcCenterX);
    const sideCenterX = (doorX + shaftArcCenterX) * 0.5;

    // Gleaming Brushed-Chrome Cylindrical Structural Glazing Spine Mullions (2 rear lobby posts + 2 curved-tangent posts!)
    for (const xPos of [doorX - cfg.doorDir * 0.04, shaftArcCenterX]) {
      for (const zOff of [-shaftRadius, shaftRadius]) {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, totalH, 12), liftSteelMat);
        rail.position.set(xPos, minY + totalH * 0.5, cfg.z + zOff);
        root.add(rail);
      }
    }

    // Twin vertical stainless cab guide rails & braided steel hoist cables cleanly tucked along NORTH/SOUTH side flanks (ZERO bars across doors OR panoramic view!)
    for (const zSign of [-1, 1]) {
      const guideRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, totalH, 0.08), liftFrameMat);
      guideRail.position.set(cfg.x, minY + totalH * 0.5, cfg.z + zSign * (shaftRadius - 0.05));
      root.add(guideRail);
      for (const xOff of [-0.16, 0.16]) {
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, totalH, 6), hoistCableMat);
        cable.position.set(cfg.x + xOff, minY + totalH * 0.5, cfg.z + zSign * (shaftRadius - 0.09));
        root.add(cable);
      }
    }

    // Dedicated Rear-Side Counterweight Guide Track, Twin T-Rails, Hoist Cables & Overhead Deflection Sheave!
    // Oval twin lifts share the open central mechanical spine between Lift A & Lift B; single shafts tuck cleanly inside rear-North flank.
    const cwZ = cfg.id === 'oval-lift-north'
      ? cfg.z + 1.72
      : cfg.id === 'oval-lift-south'
        ? cfg.z - 1.72
        : cfg.z - 1.385;
    const cwX = cfg.x + cfg.doorDir * 0.42;
    const cwSpanX = isOvalTwin ? 1.12 : 1.00;
    const cwThicknessZ = isOvalTwin ? 0.20 : 0.14;
    const cwRailHalfSpan = cwSpanX * 0.5 + 0.045;

    for (const xSign of [-1, 1]) {
      const cwRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, totalH, 0.065), liftFrameMat);
      cwRail.position.set(cwX + xSign * cwRailHalfSpan, minY + totalH * 0.5, cwZ);
      root.add(cwRail);
    }
    for (const ropeOff of [-0.14, 0.14]) {
      const cwRope = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, totalH, 6), hoistCableMat);
      cwRope.position.set(cwX + ropeOff, minY + totalH * 0.5, cwZ);
      root.add(cwRope);
    }
    // Overhead machined traction deflection sheave tucked beneath shaft crown
    const topSheave = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.09, 18), liftSteelMat);
    topSheave.rotation.x = Math.PI / 2;
    topSheave.position.set(cwX, minY + totalH - 0.36, cwZ);
    root.add(topSheave);

    // Hollow Architectural Perimeter Floor Transoms, Spider Clamps & Champagne Glow Arcs (100% OPEN interior hoistway!)
    for (let f = cfg.minFloor; f <= cfg.maxFloor; f++) {
      const fy = FLOORS[f].y;
      // Flush stainless lobby threshold sill + fascia beam sealing lobby cutout gap 100%
      const sillPlate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, cfg.cabDepth + 0.22), liftSteelMat);
      sillPlate.position.set(doorX, fy + 0.01, cfg.z);
      const doorFascia = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, cfg.cabDepth + 0.24), liftFrameMat);
      doorFascia.position.set(doorX, fy - 0.13, cfg.z);
      root.add(sillPlate, doorFascia);

      // Straight North & South perimeter transom beams + warm champagne underside accent
      for (const zSign of [-1, 1]) {
        const sideBeam = new THREE.Mesh(new THREE.BoxGeometry(sideLen + 0.06, 0.15, 0.10), liftFrameMat);
        sideBeam.position.set(sideCenterX, fy - 0.14, cfg.z + zSign * shaftRadius);
        const sideGlow = new THREE.Mesh(new THREE.BoxGeometry(sideLen + 0.04, 0.032, 0.05), liftGlowRingMat);
        sideGlow.position.set(sideCenterX, fy - 0.225, cfg.z + zSign * (shaftRadius + 0.02));
        root.add(sideBeam, sideGlow);
      }

      // Curved semi-cylindrical stainless glass transom ring & slim warm champagne halo hugging outer shaft glass!
      const curvedTransom = new THREE.Mesh(
        new THREE.TorusGeometry(shaftRadius + 0.015, 0.055, 8, 32, Math.PI),
        liftFrameMat
      );
      curvedTransom.rotation.x = Math.PI / 2;
      curvedTransom.rotation.z = bubbleDir > 0 ? -Math.PI / 2 : Math.PI / 2;
      curvedTransom.position.set(shaftArcCenterX, fy - 0.14, cfg.z);

      const curvedGlow = new THREE.Mesh(
        new THREE.TorusGeometry(shaftRadius + 0.03, 0.018, 6, 32, Math.PI),
        liftGlowRingMat
      );
      curvedGlow.rotation.x = Math.PI / 2;
      curvedGlow.rotation.z = bubbleDir > 0 ? -Math.PI / 2 : Math.PI / 2;
      curvedGlow.position.set(shaftArcCenterX, fy - 0.225, cfg.z);
      root.add(curvedTransom, curvedGlow);

      // Brushed-chrome spider-glass structural clamp bosses along each floor's curved transom arc
      for (const ang of [-Math.PI * 0.34, -Math.PI * 0.12, Math.PI * 0.12, Math.PI * 0.34]) {
        const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.09, 8), liftSteelMat);
        boss.rotation.z = Math.PI / 2;
        boss.position.set(
          shaftArcCenterX + bubbleDir * Math.cos(ang) * (shaftRadius + 0.03),
          fy - 0.14,
          cfg.z + Math.sin(ang) * (shaftRadius + 0.03)
        );
        boss.rotation.y = -bubbleDir * ang;
        root.add(boss);
      }

      // Counterweight guide-rail steel tie brackets anchoring twin T-rails cleanly to shaft structure (ZERO overlap with moving counterweight!)
      const shaftEdgeZ = cfg.z + (cwZ > cfg.z ? shaftRadius : -shaftRadius);
      const cwBracketZ = (shaftEdgeZ + cwZ) * 0.5;
      const cwBracketLen = Math.max(0.08, Math.abs(cwZ - shaftEdgeZ));
      for (const xSign of [-1, 1]) {
        const cwBracket = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, cwBracketLen), liftFrameMat);
        cwBracket.position.set(cwX + xSign * cwRailHalfSpan, fy - 0.14, cwBracketZ);
        root.add(cwBracket);
      }
    }

    // Recessed architectural shaft pit floor (at minFloor only) & cylindrical stainless hoistway crown cap
    const pitFloor = new THREE.Mesh(new THREE.CylinderGeometry(shaftRadius, shaftRadius, 0.12, 24), skirtDarkMat);
    pitFloor.position.set(cfg.x, minY - 0.42, cfg.z);
    const shaftCap = new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.cabWidth * 0.58, cfg.cabWidth * 0.62, 0.42, 28),
      liftSteelMat
    );
    shaftCap.position.set(cfg.x, minY + totalH, cfg.z);
    root.add(pitFloor, shaftCap);

    // Curved Panoramic Low-Iron Fresnel Glass Hoistway Shell facing bubbleDir (theta 0..PI -> faces +X when rotY=0, -X when rotY=PI!)
    const curvedShaftGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(shaftRadius, shaftRadius, totalH, 32, 1, true, 0, Math.PI),
      shaftGlassMat
    );
    curvedShaftGlass.position.set(shaftArcCenterX, minY + totalH * 0.5, cfg.z);
    curvedShaftGlass.rotation.y = bubbleDir > 0 ? 0 : Math.PI;
    const sideGlassN = new THREE.Mesh(new THREE.PlaneGeometry(sideLen, totalH), shaftGlassMat);
    sideGlassN.position.set(sideCenterX, minY + totalH * 0.5, cfg.z - shaftRadius);
    const sideGlassS = sideGlassN.clone();
    sideGlassS.position.z = cfg.z + shaftRadius;
    root.add(curvedShaftGlass, sideGlassN, sideGlassS);

    // Hoistway Brushed-Steel Portal Arch & Illuminated Call Button on every served floor!
    for (let f = cfg.minFloor; f <= cfg.maxFloor; f++) {
      const fy = FLOORS[f].y;
      const portalGroup = new THREE.Group();
      portalGroup.position.set(doorX, fy, cfg.z);

      const header = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, cfg.cabDepth + 0.18), liftSteelMat);
      header.position.y = 3.00;
      const headerGlow = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, cfg.cabDepth * 0.86), liftGlowRingMat);
      headerGlow.position.y = 2.83;
      // Illuminated Digital LED Floor Indicator Display centered on lift transom header!
      const ledHousing = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.56), skirtDarkMat);
      ledHousing.position.y = 3.01;
      const ledReadout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.34), liftCyanAccentMat);
      ledReadout.position.y = 3.01;
      portalGroup.add(header, headerGlow, ledHousing, ledReadout);

      for (const zSide of [-cfg.cabDepth * 0.37, cfg.cabDepth * 0.37]) {
        const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.08, cfg.cabDepth * 0.22), liftSteelMat);
        jamb.position.set(0, 1.54, zSide);
        portalGroup.add(jamb);
      }

      // Framed tempered-glass hoistway landing doors on floors where cab isn't currently docked (so shaft NEVER looks like an unfinished open hole!)
      if (f !== cfg.initialFloor) {
        const doorPaneL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.74, cfg.cabDepth * 0.26), liftBubbleGlassMat);
        doorPaneL.position.set(0, 1.40, -cfg.cabDepth * 0.13);
        const doorPaneR = doorPaneL.clone();
        doorPaneR.position.z = cfg.cabDepth * 0.13;
        const doorSeam = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.76, 0.04), liftSteelMat);
        doorSeam.position.set(0, 1.40, 0);
        const doorStileL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.76, 0.06), liftSteelMat);
        doorStileL.position.set(0, 1.40, -cfg.cabDepth * 0.26);
        const doorStileR = doorStileL.clone();
        doorStileR.position.z = cfg.cabDepth * 0.26;
        portalGroup.add(doorPaneL, doorPaneR, doorSeam, doorStileL, doorStileR);
      }

      // Brushed-Steel Hall Call Button Pillar with Glowing Directional Call Halo
      const callHousing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.16), liftSteelMat);
      callHousing.position.set(cfg.doorDir * 0.11, 1.18, cfg.cabDepth * 0.55);
      const callBtn = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.08), liftCyanAccentMat);
      callBtn.position.set(cfg.doorDir * 0.12, 1.18, cfg.cabDepth * 0.55);
      portalGroup.add(callHousing, callBtn);

      root.add(portalGroup);

      interactables.push({
        id: `call-${cfg.id}-f${f}`,
        position: new THREE.Vector3(doorX + cfg.doorDir * 0.5, fy + 1.2, cfg.z),
        radius: 3.6,
        prompt: `[E] Call / Board ${cfg.name} (${FLOORS[f].code})`,
        actionType: 'call-elevator',
        elevatorId: cfg.id,
        floorIndex: f
      });
    }

    // Dynamic Sleek Dark-Granite Counterweight Frame Riding Smoothly Opposite the Cab!
    const startY = FLOORS[cfg.initialFloor].y;
    const cwH = 2.68;
    const counterweightGroup = new THREE.Group();
    counterweightGroup.position.set(cwX, computeCounterweightY({ minY, maxY }, startY), cwZ);

    // Structural gunmetal steel crosshead top/bottom beams & side vertical channel stiles
    const cwTopBeam = new THREE.Mesh(
      new THREE.BoxGeometry(cwSpanX + 0.08, 0.14, cwThicknessZ + 0.04),
      cwFrameSteelMat
    );
    cwTopBeam.position.y = cwH * 0.5 - 0.04;
    const cwBotBeam = cwTopBeam.clone();
    cwBotBeam.position.y = -cwH * 0.5 + 0.04;
    counterweightGroup.add(cwTopBeam, cwBotBeam);

    for (const xSign of [-1, 1]) {
      const cwStile = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, cwH, cwThicknessZ + 0.03),
        cwFrameSteelMat
      );
      cwStile.position.x = xSign * (cwSpanX * 0.5);
      counterweightGroup.add(cwStile);

      // Precision top & bottom guide-shoe slippers riding directly on twin T-rails
      for (const ySign of [-1, 1]) {
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.095), liftSteelMat);
        shoe.position.set(xSign * (cwSpanX * 0.5 + 0.04), ySign * (cwH * 0.5 - 0.08), 0);
        counterweightGroup.add(shoe);
      }
    }

    // 7 Stacked Machined Dark-Granite Counterweight Filler Slabs with crisp architectural shadow reveals + vertical clamping rods
    const slabCount = 7;
    const slabPitch = 0.34;
    const slabStartY = -((slabCount - 1) * slabPitch) * 0.5;
    for (let s = 0; s < slabCount; s++) {
      const graniteSlab = new THREE.Mesh(
        new THREE.BoxGeometry(cwSpanX - 0.09, 0.295, cwThicknessZ),
        cwGraniteMat
      );
      graniteSlab.position.y = slabStartY + s * slabPitch;
      counterweightGroup.add(graniteSlab);
    }
    for (const rodX of [-cwSpanX * 0.26, cwSpanX * 0.26]) {
      const clampRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, cwH - 0.10, 6),
        liftSteelMat
      );
      clampRod.position.set(rodX, 0, cwThicknessZ * 0.5 + 0.01);
      const clampRodBack = clampRod.clone();
      clampRodBack.position.z = -(cwThicknessZ * 0.5 + 0.01);
      counterweightGroup.add(clampRod, clampRodBack);
    }
    // Overhead rope hitch pulley block on counterweight crosshead
    const cwPulley = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, cwThicknessZ * 0.72, 14),
      liftSteelMat
    );
    cwPulley.rotation.x = Math.PI / 2;
    cwPulley.position.y = cwH * 0.5 + 0.10;
    counterweightGroup.add(cwPulley);
    root.add(counterweightGroup);

    // Moving Iconic 1 Utama Curved Panoramic Glass Bubble Cab (auto-oriented by cfg.doorDir!)
    const cabGroup = new THREE.Group();
    cabGroup.position.set(cfg.x, startY, cfg.z);
    cabGroup.rotation.y = cfg.doorDir > 0 ? Math.PI : 0;

    // Seamless D-Shaped Honed Marble Floor & Brushed-Steel Roof (ZERO square corners poking through curved glass bubble!)
    const cabBubbleR = isOvalTwin ? cfg.cabDepth * 0.49 : cfg.cabDepth * 0.44;
    const cabArcX = 0.02;
    const rearLen = cfg.cabWidth * 0.5 + cabArcX;
    const rearCenterX = -cfg.cabWidth * 0.5 + rearLen * 0.5;

    const cabFloorRear = new THREE.Mesh(
      new THREE.BoxGeometry(rearLen, 0.16, cabBubbleR * 2),
      cabMarbleFloorMat
    );
    cabFloorRear.position.set(rearCenterX, -0.02, 0);
    const cabFloorFront = new THREE.Mesh(
      new THREE.CylinderGeometry(cabBubbleR, cabBubbleR, 0.16, 32, 1, false, 0, Math.PI),
      cabMarbleFloorMat
    );
    cabFloorFront.position.set(cabArcX, -0.02, 0);

    const cabBaseDome = new THREE.Mesh(
      new THREE.CylinderGeometry(cabBubbleR * 0.98, cabBubbleR * 0.72, 0.28, 28),
      liftSteelMat
    );
    cabBaseDome.position.set(cabArcX, -0.22, 0);

    const cabRoofRear = new THREE.Mesh(
      new THREE.BoxGeometry(rearLen, 0.16, cabBubbleR * 2),
      liftSteelMat
    );
    cabRoofRear.position.set(rearCenterX, 2.98, 0);
    const cabRoofFront = new THREE.Mesh(
      new THREE.CylinderGeometry(cabBubbleR, cabBubbleR, 0.16, 32, 1, false, 0, Math.PI),
      liftSteelMat
    );
    cabRoofFront.position.set(cabArcX, 2.98, 0);

    const cabTopCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(cabBubbleR * 0.78, cabBubbleR * 0.98, 0.24, 28),
      liftSteelMat
    );
    cabTopCrown.position.set(cabArcX, 3.16, 0);
    cabGroup.add(cabFloorRear, cabFloorFront, cabBaseDome, cabRoofRear, cabRoofFront, cabTopCrown);

    // Warm Champagne Architectural Rear Half-Halo Rings (strictly hugging curved panoramic bubble perimeter!)
    const bottomHalo = new THREE.Mesh(
      new THREE.TorusGeometry(cabBubbleR + 0.015, 0.032, 8, 32, Math.PI),
      liftGlowRingMat
    );
    bottomHalo.rotation.x = Math.PI / 2;
    bottomHalo.rotation.z = -Math.PI / 2;
    bottomHalo.position.set(cabArcX, -0.06, 0);
    const topHalo = bottomHalo.clone();
    topHalo.position.set(cabArcX, 3.00, 0);
    cabGroup.add(bottomHalo, topHalo);

    // Interior Warm Backlit Frosted-Acrylic Rear-Side Valence / Cove Panels (emissiveIntensity: 0.85)
    // 1) Upper curved cove valence ribbon tucked cleanly beneath ceiling (above eye-line, unmistakable luminous crown!)
    const upperCurvedValence = new THREE.Mesh(
      new THREE.CylinderGeometry(cabBubbleR - 0.04, cabBubbleR - 0.04, 0.22, 32, 1, true, 0, Math.PI),
      cabBacklitAcrylicMat
    );
    upperCurvedValence.position.set(cabArcX, 2.79, 0);
    // 2) Rear transom backlit frosted-acrylic valence header above sliding doorway
    const rearTransomValence = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.24, cabBubbleR * 1.92),
      cabBacklitAcrylicMat
    );
    rearTransomValence.position.set(-cfg.cabWidth * 0.45, 2.77, 0);
    const rearTransomTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.028, cabBubbleR * 1.94),
      cabGoldRailMat
    );
    rearTransomTrim.position.set(-cfg.cabWidth * 0.45, 2.64, 0);
    cabGroup.add(upperCurvedValence, rearTransomValence, rearTransomTrim);

    // 3) Luminous warm backlit frosted-acrylic rear-side interior wall panels flanking the straight cab sides
    const sidePanelLen = 1.12;
    const sidePanelCenterX = -0.66;
    for (const zSign of [-1, 1]) {
      const zPanel = zSign * (cabBubbleR - 0.035);
      const sideAcrylic = new THREE.Mesh(
        new THREE.BoxGeometry(sidePanelLen, 2.34, 0.045),
        cabBacklitAcrylicMat
      );
      sideAcrylic.position.set(sidePanelCenterX, 1.48, zPanel);

      const kickPlate = new THREE.Mesh(
        new THREE.BoxGeometry(sidePanelLen + 0.04, 0.24, 0.065),
        liftSteelMat
      );
      kickPlate.position.set(sidePanelCenterX, 0.18, zPanel);

      // Subtle warm lower architectural floor-wash cove strip & champagne-gold horizontal reveal bars
      const baseCove = new THREE.Mesh(
        new THREE.BoxGeometry(sidePanelLen, 0.035, 0.055),
        liftGlowRingMat
      );
      baseCove.position.set(sidePanelCenterX, 0.31, zPanel - zSign * 0.01);

      for (const barY of [0.98, 2.02, 2.66]) {
        const revealBar = new THREE.Mesh(
          new THREE.BoxGeometry(sidePanelLen + 0.04, 0.026, 0.068),
          cabGoldRailMat
        );
        revealBar.position.set(sidePanelCenterX, barY, zPanel);
        cabGroup.add(revealBar);
      }

      // Slim vertical stainless edge stiles framing the backlit side panel (ZERO bars inside curved panoramic glass!)
      for (const stileX of [-1.22, cabArcX]) {
        const stile = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 2.88, 10), liftSteelMat);
        stile.position.set(stileX, 1.46, zSign * cabBubbleR);
        cabGroup.add(stile);
      }
      cabGroup.add(sideAcrylic, kickPlate, baseCove);
    }

    // Refined Architectural Coffered Ceiling Soffit + Crisp Warm Recessed Ceiling Downlight Rings!
    const soffitRear = new THREE.Mesh(
      new THREE.BoxGeometry(rearLen - 0.08, 0.016, cabBubbleR * 1.92),
      cabCeilingSoffitMat
    );
    soffitRear.position.set(rearCenterX, 2.895, 0);
    const soffitFront = new THREE.Mesh(
      new THREE.CylinderGeometry(cabBubbleR - 0.05, cabBubbleR - 0.05, 0.016, 32, 1, false, 0, Math.PI),
      cabCeilingSoffitMat
    );
    soffitFront.position.set(cabArcX, 2.895, 0);
    cabGroup.add(soffitRear, soffitFront);

    // Central concentric recessed ceiling halo ring + backlit frosted ceiling medallion
    const centerBezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.47, 0.022, 8, 32),
      cabDownlightBezelMat
    );
    centerBezel.rotation.x = Math.PI / 2;
    centerBezel.position.set(0.04, 2.882, 0);
    const centerGlowRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.425, 0.020, 8, 32),
      cabWarmLightMat
    );
    centerGlowRing.rotation.x = Math.PI / 2;
    centerGlowRing.position.set(0.04, 2.882, 0);
    const centerMedallion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.016, 24),
      cabBacklitAcrylicMat
    );
    centerMedallion.position.set(0.04, 2.886, 0);
    cabGroup.add(centerBezel, centerGlowRing, centerMedallion);

    // 6 Crisp Warm Recessed Perimeter Ceiling Downlight Rings (4 curved canopy arc + 2 rear entry!)
    const downlightCoords = [
      [-0.78, -cabBubbleR * 0.48],
      [-0.78, cabBubbleR * 0.48],
      ...[-Math.PI * 0.34, -Math.PI * 0.12, Math.PI * 0.12, Math.PI * 0.34].map((ang) => [
        cabArcX + Math.cos(ang) * (cabBubbleR * 0.72),
        Math.sin(ang) * (cabBubbleR * 0.72)
      ])
    ];
    for (const [dlx, dlz] of downlightCoords) {
      const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.018, 8, 18), cabDownlightBezelMat);
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(dlx, 2.882, dlz);
      const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.015, 8, 18), cabWarmLightMat);
      ledRing.rotation.x = Math.PI / 2;
      ledRing.position.set(dlx, 2.881, dlz);
      const ledDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 14), cabWarmLightMat);
      ledDisc.position.set(dlx, 2.884, dlz);
      cabGroup.add(bezel, ledRing, ledDisc);
    }

    // Balanced warm interior PointLight on BOTH staggered Oval panoramic lifts (GF & 1F) — crisp luxury legibility, zero floor star-blobs!
    if (isOvalTwin) {
      const cabLight = new THREE.PointLight('#ffe0a8', 9.5, 13, 1.8);
      cabLight.position.set(0.12, 2.38, 0);
      cabGroup.add(cabLight);
    }

    // Curved Champagne-Gold Interior Handrail + Minimal Standoff Brackets
    const innerRail = new THREE.Mesh(
      new THREE.TorusGeometry(cabBubbleR - 0.11, 0.030, 8, 28, Math.PI),
      cabGoldRailMat
    );
    innerRail.rotation.x = Math.PI / 2;
    innerRail.rotation.z = -Math.PI / 2;
    innerRail.position.set(cabArcX, 0.98, 0);
    // Brushed-Steel COP Interior Floor-Selector Button Panel + Illuminated Warm Floor Button Dots!
    const copPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.24, 0.24), liftSteelMat);
    copPanel.position.set(-cfg.cabWidth * 0.44, 1.32, -(cabBubbleR - 0.22));
    const copScreen = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.16, 0.16), liftCyanAccentMat);
    copScreen.position.set(-cfg.cabWidth * 0.44, 1.76, -(cabBubbleR - 0.22));
    for (let b = 0; b < 5; b++) {
      const btn = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.045, 0.045), liftGlowRingMat);
      btn.position.set(-cfg.cabWidth * 0.44, 1.04 + b * 0.12, -(cabBubbleR - 0.22));
      cabGroup.add(btn);
    }
    cabGroup.add(innerRail, copPanel, copScreen);

    // Unobstructed Crystal-Clear Semi-Cylindrical Curved Panoramic Glass Bubble Enclosure (theta 0..PI -> faces local +X = world bubbleDir!)
    const bubbleGeo = new THREE.CylinderGeometry(
      cabBubbleR,
      cabBubbleR,
      2.86,
      32,
      1,
      true,
      0,
      Math.PI
    );
    const bubbleMesh = new THREE.Mesh(bubbleGeo, liftBubbleGlassMat);
    bubbleMesh.position.set(cabArcX, 1.46, 0);
    bubbleMesh.renderOrder = 1;
    cabGroup.add(bubbleMesh);

    // Framed Brushed-Stainless & Crystal-Glass Center-Parting Automatic Sliding Cab Doors (tuck cleanly inside shaftRadius when open — zero protrusion outside shaft!)
    const makeSlidingDoor = (zInit) => {
      const dg = new THREE.Group();
      dg.position.set(-cfg.cabWidth * 0.48, 1.38, zInit);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.66, cfg.cabDepth * 0.26), liftBubbleGlassMat);
      pane.renderOrder = 1;
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, cfg.cabDepth * 0.27), liftSteelMat);
      topRail.position.y = 1.30;
      const botRail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, cfg.cabDepth * 0.27), liftSteelMat);
      botRail.position.y = -1.30;
      const innerStile = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.68, 0.05), liftSteelMat);
      innerStile.position.z = zInit < 0 ? cfg.cabDepth * 0.125 : -cfg.cabDepth * 0.125;
      dg.add(pane, topRail, botRail, innerStile);
      return dg;
    };
    const leftDoor = makeSlidingDoor(-cfg.cabDepth * 0.13);
    const rightDoor = makeSlidingDoor(cfg.cabDepth * 0.13);
    cabGroup.add(leftDoor, rightDoor);

    root.add(cabGroup);

    elevatorInstances.push({
      ...cfg,
      minY,
      maxY,
      cabGroup,
      counterweightGroup,
      leftDoor,
      rightDoor,
      currentY: startY,
      targetFloor: cfg.initialFloor,
      currentFloor: cfg.initialFloor,
      state: 'open', // 'open' | 'closing' | 'moving' | 'opening'
      doorOpenAmount: 1.0 // 0 = closed, 1 = open
    });
  }

  // Batch all 26 escalator banks & static elevator hoistways by material (~310 draw calls -> 11 draw calls!)
  // Exclude BOTH moving cabGroups AND moving counterweightGroups so both glide smoothly in real time!
  collapseStaticMeshes(
    root,
    elevatorInstances.flatMap((e) => [e.cabGroup, e.counterweightGroup])
  );

  function commandElevator(elevatorId, destFloor, express = false) {
    const lift = elevatorInstances.find((e) => e.id === elevatorId);
    if (!lift) return false;
    const clamped = Math.max(lift.minFloor, Math.min(lift.maxFloor, destFloor));
    lift.expressMode = express;
    if (lift.currentFloor === clamped && Math.abs(lift.currentY - FLOORS[clamped].y) < 0.15) {
      lift.targetFloor = clamped;
      lift.state = 'open';
      lift.doorOpenAmount = 1.0;
      return true;
    }
    lift.targetFloor = clamped;
    if (lift.state === 'open' || lift.state === 'opening') {
      lift.state = 'closing';
    }
    return true;
  }

  function getEscalatorConveyor(px, py, pz) {
    let bestHit = null;
    let bestYDiff = Infinity;
    for (const esc of escalatorData) {
      if (Math.abs(pz - esc.z) > esc.width * 0.78) continue;
      const xLo = Math.min(esc.xStart, esc.xEnd) - 1.45;
      const xHi = Math.max(esc.xStart, esc.xEnd) + 1.45;
      if (px < xLo || px > xHi) continue;
      const t = THREE.MathUtils.clamp((px - esc.xStart) / esc.dx, 0, 1);
      const rampY = esc.y0 + t * esc.dy;
      const yDiff = Math.abs(py - rampY);
      if (yDiff < 1.85 && yDiff < bestYDiff) {
        bestYDiff = yDiff;
        bestHit = {
          esc,
          t,
          rampY,
          vx: esc.direction * Math.sign(esc.dx) * 2.65
        };
      }
    }
    return bestHit;
  }

  function getActiveElevatorUnderPlayer(px, py, pz) {
    for (const lift of elevatorInstances) {
      const hw = lift.cabWidth * 0.54;
      const hd = lift.cabDepth * 0.48;
      if (
        px >= lift.x - hw - 0.25 &&
        px <= lift.x + hw + 0.25 &&
        Math.abs(pz - lift.z) <= hd &&
        Math.abs(py - lift.currentY) <= 1.65
      ) {
        return lift;
      }
    }
    return null;
  }

  function boardElevator(elevatorId, floorIndex, player) {
    const lift = elevatorInstances.find((e) => e.id === elevatorId);
    if (!lift) return false;
    const clamped = Math.max(lift.minFloor, Math.min(lift.maxFloor, floorIndex));
    lift.currentFloor = clamped;
    lift.targetFloor = clamped;
    lift.currentY = FLOORS[clamped].y;
    lift.cabGroup.position.y = lift.currentY;
    lift.counterweightGroup.position.y = computeCounterweightY(lift, lift.currentY);
    lift.state = 'open';
    lift.doorOpenAmount = 1.0;
    const slide = lift.cabDepth * 0.245;
    lift.leftDoor.position.z = -lift.cabDepth * 0.13 - slide;
    lift.rightDoor.position.z = lift.cabDepth * 0.13 + slide;
    if (player) {
      player.floorIndex = clamped;
      player.footPos.set(lift.x + lift.doorDir * 0.45, lift.currentY, lift.z);
      player.yaw = lift.doorDir > 0 ? -Math.PI / 2 : Math.PI / 2; // Face cleanly out the open panoramic glass doors!
      player.pitch = -0.02;
      player.ridingElevator = lift;
      if (document.pointerLockElement) document.exitPointerLock();
    }
    return true;
  }

  function update(dt) {
    // Animate all 780 physical 3D staircase escalator steps continuously!
    escPhase = (escPhase + dt * 0.085) % 1;
    syncEscalatorSteps();

    // Update Panoramic Glass Elevators
    for (const lift of elevatorInstances) {
      const targetY = FLOORS[lift.targetFloor].y;

      if (lift.state === 'closing') {
        const doorSpd = lift.expressMode ? 3.6 : 2.1;
        lift.doorOpenAmount = Math.max(0, lift.doorOpenAmount - dt * doorSpd);
        if (lift.doorOpenAmount <= 0.01) {
          lift.doorOpenAmount = 0;
          lift.state = 'moving';
        }
      } else if (lift.state === 'moving') {
        const diff = targetY - lift.currentY;
        const dist = Math.abs(diff);
        if (dist < 0.04) {
          lift.currentY = targetY;
          lift.currentFloor = lift.targetFloor;
          lift.state = 'opening';
          lift.expressMode = false;
          if (onLiftArrived) onLiftArrived(lift);
        } else {
          // Smooth cruise up to 5.8 m/s (or 14 m/s when empty express summoned)
          const maxSpd = lift.expressMode ? 14.0 : 5.8;
          const speed = Math.min(maxSpd, Math.max(1.4, dist * (lift.expressMode ? 3.5 : 2.0)));
          lift.currentY += Math.sign(diff) * Math.min(dist, speed * dt);
          // Update nearest floor display
          let nearest = lift.minFloor;
          let bestD = Infinity;
          for (let f = lift.minFloor; f <= lift.maxFloor; f++) {
            const d = Math.abs(FLOORS[f].y - lift.currentY);
            if (d < bestD) {
              bestD = d;
              nearest = f;
            }
          }
          lift.currentFloor = nearest;
        }
      } else if (lift.state === 'opening') {
        lift.doorOpenAmount = Math.min(1, lift.doorOpenAmount + dt * 2.4);
        if (lift.doorOpenAmount >= 0.99) {
          lift.doorOpenAmount = 1;
          lift.state = 'open';
        }
      }

      lift.cabGroup.position.y = lift.currentY;
      lift.counterweightGroup.position.y = computeCounterweightY(lift, lift.currentY);
      const slide = lift.doorOpenAmount * (lift.cabDepth * 0.245);
      lift.leftDoor.position.z = -lift.cabDepth * 0.13 - slide;
      lift.rightDoor.position.z = lift.cabDepth * 0.13 + slide;
    }
  }

  return {
    root,
    elevatorInstances,
    commandElevator,
    boardElevator,
    getEscalatorConveyor,
    getActiveElevatorUnderPlayer,
    update
  };
}
