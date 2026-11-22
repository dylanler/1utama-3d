// ============================================================================
// 1 UTAMA SHOPPING CENTRE (BANDAR UTAMA, PETALING JAYA) — VERIFIED 2025–2026
// MASTER ARCHITECTURAL LAYOUT, LOT NUMBERING & 160+ WALL-TO-WALL TENANTS
// ============================================================================

export const FLOORS = [
  {
    index: 0,
    code: 'LG',
    name: 'Lower Ground',
    subtitle: 'E-Street FlowRider & MODU • AEON • LG Promenade • Rainforest Koi • Jaya Grocer & HEYTEA',
    y: 0.0,
    has1UE: true,
    hasOldWing: true,
    hasPromenade: true,
    hasNewWing: true,
    isRooftop: false
  },
  {
    index: 1,
    code: 'G',
    name: 'Ground Floor',
    subtitle: 'MRT Pintu B & Sports Direct • Centre Court Uniqlo & Sephora • Promenade PUTIEN • GF Luxe Zara, Chanel & Parkson',
    y: 6.0,
    has1UE: true,
    hasOldWing: true,
    hasPromenade: true,
    hasNewWing: true,
    isRooftop: false
  },
  {
    index: 2,
    code: '1F',
    name: 'First Floor (F)',
    subtitle: 'District K Rollerwa • Nitori & AEON • 1F Promenade CU • Decathlon, Padini, Shake Shack & Bath & Body Works',
    y: 12.0,
    has1UE: true,
    hasOldWing: true,
    hasPromenade: true,
    hasNewWing: true,
    isRooftop: false
  },
  {
    index: 3,
    code: '2F',
    name: 'Second Floor (S)',
    subtitle: 'WINDLAB Skydiving & PJPAC • Harvey Norman, Popular & Toys"R"Us • Rainbow Bridge & Food District • Nike, Machines, MR.DIY & Pop Mart',
    y: 18.0,
    has1UE: true,
    hasOldWing: true,
    hasPromenade: true,
    hasNewWing: true,
    isRooftop: false
  },
  {
    index: 4,
    code: '3F',
    name: 'Third Floor (EZ / OV / T)',
    subtitle: 'NextGen T601 • TGV Cinemas IMAX (EZ101) • Celebrity Fitness (EZ216A) • The Ledge Art Gallery, Concierge & XZQT (OV301)',
    y: 24.0,
    has1UE: true,
    hasOldWing: true,
    hasPromenade: true,
    hasNewWing: true,
    isRooftop: false
  },
  {
    index: 5,
    code: '4F',
    name: '4F–5F Entertainment Zone (EZ / OV)',
    subtitle: 'GSC 15-Screen Cinema (EZ403) • Wangsa Bowl (EZ401) • Toy Catcher • Camp5 Climbing (EZ501) • Diva Karaoke & Cross Fire Arcade',
    y: 30.0,
    has1UE: false,
    hasOldWing: false,
    hasPromenade: false,
    hasNewWing: true,
    isRooftop: false
  },
  {
    index: 6,
    code: 'UR',
    name: 'Upper Roof (UR601–UR603A)',
    subtitle: 'The Secret Garden (UR603A) • ASCARO Padel Club (UR601) • Padang Futsal (UR602) • Baseball Cage (UR603)',
    y: 37.0,
    has1UE: false,
    hasOldWing: false,
    hasPromenade: false,
    hasNewWing: true,
    isRooftop: true
  }
];

export const BOUNDS = {
  ueWing: { xMin: -188, xMax: -130, zMin: -25, zMax: 25, walkZ: 19.4, walkXMin: -182.2 },
  oldWing: { xMin: -130, xMax: -28, zMin: -28, zMax: 28, walkZ: 21.4 },
  promenade: { xMin: -28, xMax: 12, zMin: -12.5, zMax: 12.5, walkZ: 9.0 },
  newWing: { xMin: 12, xMax: 178, zMin: -30, zMax: 30, walkZ: 22.4, walkXMax: 172.0 },
  rooftop: { xMin: 12, xMax: 178, zMin: -30, zMax: 30, walkZ: 28.0, walkXMin: 14.0, walkXMax: 175.5 },

  centreCourtVoid: { xMin: -98, xMax: -50, zMin: -10.5, zMax: 10.5 },
  promenadeVoid: { xMin: -19.5, xMax: 4.5, zMin: -3.2, zMax: 3.2 },
  rainforestVoid: { xMin: 20, xMax: 56, zMin: -13.0, zMax: 13.0 },
  koiPond: { xMin: 23, xMax: 53, zMin: -10.2, zMax: 10.2 },
  koiJetty: { xMin: 22.5, xMax: 31.8, zMin: -2.4, zMax: 2.4 },
  rainbowBridge2F: { xMin: 36.2, xMax: 39.8, zMin: -13.6, zMax: 13.6 },
  highstreetVoid: { xMin: 70, xMax: 100, zMin: -6.2, zMax: 6.2 },
  ovalVoid: { cx: 138, cz: 0, rx: 19.5, rz: 12.8 },
  ovalLiftBridge: { xMin: 154.0, xMax: 158.6, zMin: -4.6, zMax: 4.6 }
};

export const ESCALATOR_BANKS = [
  // 1 Utama E Paired Side-by-Side Parallel Escalators (LG <-> G <-> 1F <-> 2F <-> 3F — Verified #087, #099, #509)
  ...[0, 1, 2, 3].flatMap((f) => [
    { id: `ue-up-${f}`, wing: 'ue', lowerFloor: f, upperFloor: f + 1, direction: 1, xStart: -146.5, xEnd: -136.0, z: -1.6, width: 1.5 },
    { id: `ue-dn-${f}`, wing: 'ue', lowerFloor: f, upperFloor: f + 1, direction: -1, xStart: -146.5, xEnd: -136.0, z: 1.6, width: 1.5 }
  ]),
  // Old Wing West / Uniqlo / Harvey Norman / TGV IMAX Escalators (LG <-> G <-> 1F <-> 2F <-> 3F TGV — Verified #034–#035, #068, #429–#430)
  ...[0, 1, 2, 3].flatMap((f) => [
    { id: `ow-west-up-${f}`, wing: 'old', theme: f === 3 ? 'tgv-imax' : 'standard', lowerFloor: f, upperFloor: f + 1, direction: 1, xStart: -114.5, xEnd: -103.5, z: -1.6, width: 1.5 },
    { id: `ow-west-dn-${f}`, wing: 'old', theme: f === 3 ? 'tgv-imax' : 'standard', lowerFloor: f, upperFloor: f + 1, direction: -1, xStart: -114.5, xEnd: -103.5, z: 1.6, width: 1.5 }
  ]),
  // Old Wing East / AEON Escalators (LG <-> G <-> 1F <-> 2F <-> 3F — Verified #048, #456)
  ...[0, 1, 2, 3].flatMap((f) => [
    { id: `ow-up-${f}`, wing: 'old', lowerFloor: f, upperFloor: f + 1, direction: 1, xStart: -45.5, xEnd: -34.5, z: -5.4, width: 1.5 },
    { id: `ow-dn-${f}`, wing: 'old', lowerFloor: f, upperFloor: f + 1, direction: -1, xStart: -45.5, xEnd: -34.5, z: 5.4, width: 1.5 }
  ]),
  // Promenade Central Atrium Escalators (LG <-> G <-> 1F <-> 2F — Verified #030, #203, #279, #409–#411)
  ...[0, 1, 2].flatMap((f) => [
    { id: `pr-up-${f}`, wing: 'promenade', lowerFloor: f, upperFloor: f + 1, direction: 1, xStart: -16.5, xEnd: -6.5, z: -1.35, width: 1.45 },
    { id: `pr-dn-${f}`, wing: 'promenade', lowerFloor: f, upperFloor: f + 1, direction: -1, xStart: -16.5, xEnd: -6.5, z: 1.35, width: 1.45 }
  ]),
  // Rainforest Green-Clad Escalators (LG <-> G <-> 1F <-> 2F <-> 3F — Verified #018, #383)
  ...[0, 1, 2, 3].flatMap((f) => [
    { id: `rf-up-${f}`, wing: 'rainforest', theme: 'rainforest-green', lowerFloor: f, upperFloor: f + 1, direction: 1, xStart: 57.5, xEnd: 68.0, z: -16.8, width: 1.5 },
    { id: `rf-dn-${f}`, wing: 'rainforest', theme: 'rainforest-green', lowerFloor: f, upperFloor: f + 1, direction: -1, xStart: 57.5, xEnd: 68.0, z: 16.8, width: 1.5 }
  ]),
  // Highstreet / Parkson Connector Escalators (LG <-> G <-> 1F <-> 2F <-> 3F <-> 4F <-> UR — Verified #173, #188, #195, #404)
  ...[0, 1, 2, 3, 4, 5].flatMap((f) => [
    { id: `nw-up-${f}`, wing: 'oval', theme: 'oval-led', lowerFloor: f, upperFloor: f + 1, direction: 1, xStart: 103.5, xEnd: f === 5 ? 116.0 : 114.5, z: -17.4, width: 1.5 },
    { id: `nw-dn-${f}`, wing: 'oval', theme: 'oval-led', lowerFloor: f, upperFloor: f + 1, direction: -1, xStart: 103.5, xEnd: f === 5 ? 116.0 : 114.5, z: 17.4, width: 1.5 }
  ]),
  // The Oval Inner-Rim Crisscrossing Atrium Escalators (LG <-> G <-> 1F <-> 2F <-> 3F — Verified #154, #164, #308, #373, #379!)
  ...[0, 1, 2, 3].map((f) => ({
    id: `oval-rim-${f}`,
    wing: 'oval-rim',
    theme: 'oval-led',
    lowerFloor: f,
    upperFloor: f + 1,
    direction: f % 2 === 0 ? 1 : -1,
    xStart: f % 2 === 0 ? 132.4 : 143.6,
    xEnd: f % 2 === 0 ? 143.6 : 132.4,
    z: -12.6,
    width: 1.5
  }))
];

export const ELEVATORS = [
  {
    id: 'oval-lift-north',
    name: 'Oval Panoramic Glass Lift A (LG – Secret Garden)',
    x: 160.2,
    z: -2.2,
    cabWidth: 2.8,
    cabDepth: 2.8,
    doorDir: 1,
    minFloor: 0,
    maxFloor: 6,
    initialFloor: 1
  },
  {
    id: 'oval-lift-south',
    name: 'Oval Panoramic Glass Lift B (LG – Secret Garden)',
    x: 160.2,
    z: 2.2,
    cabWidth: 2.8,
    cabDepth: 2.8,
    doorDir: 1,
    minFloor: 0,
    maxFloor: 6,
    initialFloor: 2
  },
  {
    id: 'rainforest-garden-lift',
    name: 'Rainforest – Secret Garden Lift (LG – UR)',
    x: 17.5,
    z: 0.0,
    cabWidth: 2.8,
    cabDepth: 2.8,
    doorDir: -1,
    minFloor: 0,
    maxFloor: 6,
    initialFloor: 3
  },
  {
    id: 'oldwing-lift',
    name: 'Centre Court Glass Lift (LG – 3F TGV)',
    x: -100.2,
    z: 0.0,
    cabWidth: 2.8,
    cabDepth: 2.8,
    doorDir: -1,
    minFloor: 0,
    maxFloor: 4,
    initialFloor: 1
  },
  {
    id: '1ue-olive-lift',
    name: '1 Utama E Olive-Gold Lift Core (LG – 3F PJPAC)',
    x: -178.4,
    z: 14.5,
    cabWidth: 2.6,
    cabDepth: 2.6,
    doorDir: 1,
    minFloor: 0,
    maxFloor: 4,
    initialFloor: 1
  }
];

export function getEscalatorWellsForFloor(floorIdx) {
  return ESCALATOR_BANKS.filter((e) => e.upperFloor === floorIdx && e.wing !== 'oval-rim').map((e) => ({
    esc: e,
    xMin: Math.min(e.xStart, e.xEnd) - 1.65,
    xMax: Math.max(e.xStart, e.xEnd) + 0.95,
    zMin: e.z - e.width * 0.74,
    zMax: e.z + e.width * 0.74
  }));
}

export function isAtriumVoid(floorIdx, x, z) {
  // Never treat an escalator's active tread lane or top/bottom landing aprons as a void!
  for (const e of ESCALATOR_BANKS) {
    if (e.upperFloor === floorIdx || e.lowerFloor === floorIdx) {
      const exMin = Math.min(e.xStart, e.xEnd) - 1.95;
      const exMax = Math.max(e.xStart, e.xEnd) + 1.35;
      if (x >= exMin && x <= exMax && Math.abs(z - e.z) <= e.width * 0.76) {
        return false;
      }
    }
  }
  const wells = getEscalatorWellsForFloor(floorIdx);
  for (const w of wells) {
    if (x > w.xMin && x < w.xMax && z > w.zMin && z < w.zMax) return true;
  }
  if (floorIdx === 0) {
    const kp = BOUNDS.koiPond;
    const kj = BOUNDS.koiJetty;
    if (x > kp.xMin && x < kp.xMax && z > kp.zMin && z < kp.zMax) {
      if (x >= kj.xMin && x <= kj.xMax && z >= kj.zMin && z <= kj.zMax) return false;
      return true;
    }
    return false;
  }
  // VERIFIED 2025 WALKTHROUGH (#064, #442, #454): Old Wing Ground Floor Centre Court is SOLID event floor; void opens on 1F (floorIdx >= 2)!
  if (floorIdx >= 2 && floorIdx <= 4) {
    const cc = BOUNDS.centreCourtVoid;
    if (x > cc.xMin && x < cc.xMax && z > cc.zMin && z < cc.zMax) return true;
  }
  // VERIFIED 2025 WALKTHROUGH (#030, #203, #279, #413): Promenade has open central atrium void on 1F & 2F (floorIdx 2..3)!
  if (floorIdx >= 2 && floorIdx <= 3) {
    const pv = BOUNDS.promenadeVoid;
    if (x > pv.xMin && x < pv.xMax && z > pv.zMin && z < pv.zMax) return true;
  }
  if (floorIdx >= 1 && floorIdx <= 5) {
    const rf = BOUNDS.rainforestVoid;
    if (x > rf.xMin && x < rf.xMax && z > rf.zMin && z < rf.zMax) {
      // VERIFIED 2025 WALKTHROUGH (#009, #353): ONLY the 2F Suspension Bridge (floorIdx === 3) spans the Rainforest void!
      if (floorIdx === 3) {
        const rb = BOUNDS.rainbowBridge2F;
        if (x >= rb.xMin && x <= rb.xMax && z >= rb.zMin && z <= rb.zMax) return false;
      }
      return true;
    }
  }
  if (floorIdx >= 2 && floorIdx <= 4) {
    const hs = BOUNDS.highstreetVoid;
    if (x > hs.xMin && x < hs.xMax && z > hs.zMin && z < hs.zMax) return true;
  }
  if (floorIdx === 6) {
    if (x > 21.3 && x < 54.7 && z > -10.2 && z < 10.2) return true;
  }
  if (floorIdx >= 1 && floorIdx <= 6) {
    const ov = BOUNDS.ovalVoid;
    const lb = BOUNDS.ovalLiftBridge;
    if (x >= lb.xMin && x <= lb.xMax && z >= lb.zMin && z <= lb.zMax) return false;
    const nx = (x - ov.cx) / ov.rx;
    const nz = (z - ov.cz) / ov.rz;
    if (nx * nx + nz * nz < 1.0) return true;
  }
  return false;
}

export function isWalkableOnFloor(floorIdx, x, z) {
  const floor = FLOORS[floorIdx];
  if (!floor) return false;
  let inside = false;

  if (floor.has1UE) {
    const ue = BOUNDS.ueWing;
    if (x >= ue.walkXMin && x <= ue.xMax + 0.8 && z >= -ue.walkZ && z <= ue.walkZ) {
      if (x > -131.2 && Math.abs(z) > 9.5) inside = false;
      else inside = true;
    }
    // 2F Outdoor Saranghae Finger-Heart Rooftop Linkbridge (open-air terrace extending North from 1UE 2F!)
    if (floorIdx === 3 && x >= -144.8 && x <= -136.2 && z >= -34.2 && z <= -19.2) {
      inside = true;
    }
  }
  if (floor.hasOldWing && !inside) {
    const ow = BOUNDS.oldWing;
    if (x >= ow.xMin + 4.2 && x <= ow.xMax - 0.5 && z >= -ow.walkZ && z <= ow.walkZ) inside = true;
    if (floor.has1UE && x >= ow.xMin - 1.0 && x <= ow.xMin + 5.0 && Math.abs(z) <= 9.5) inside = true;
    if (floor.hasPromenade && x >= ow.xMax - 2.0 && x <= ow.xMax + 1.0 && Math.abs(z) <= 9.0) inside = true;
  }
  if (floor.hasPromenade && !inside) {
    const pr = BOUNDS.promenade;
    if (x >= pr.xMin - 0.8 && x <= pr.xMax + 0.8 && z >= -pr.walkZ && z <= pr.walkZ) inside = true;
  }
  if (floor.hasNewWing && !inside) {
    if (floor.isRooftop) {
      const rt = BOUNDS.rooftop;
      if (x >= rt.walkXMin && x <= rt.walkXMax && z >= -rt.walkZ && z <= rt.walkZ) inside = true;
    } else {
      const nw = BOUNDS.newWing;
      const xLeft = floor.hasPromenade ? nw.xMin - 0.8 : nw.xMin + 1.2;
      if (x >= xLeft && x <= nw.walkXMax && z >= -nw.walkZ && z <= nw.walkZ) {
        if (x < nw.xMin + 1.2 && Math.abs(z) > 9.0) inside = false;
        else inside = true;
      }
    }
  }

  if (!inside) return false;
  if (isAtriumVoid(floorIdx, x, z)) return false;

  for (const lift of ELEVATORS) {
    if (floorIdx >= lift.minFloor && floorIdx <= lift.maxFloor) {
      const hw = lift.cabWidth * 0.54;
      const hd = lift.cabDepth * 0.54;
      if (Math.abs(x - lift.x) < hw && Math.abs(z - lift.z) < hd) return false;
    }
  }
  return true;
}

export function getZoneInfo(floorIdx, x, z) {
  const floor = FLOORS[floorIdx] || FLOORS[1];
  let wing = 'NEW WING';
  let zone = 'THE OVAL';
  let accent = '#38bdf8';

  if (floorIdx === 6) {
    wing = 'UPPER ROOF (UR)';
    if (x < 68) zone = 'UR603A • THE SECRET GARDEN';
    else if (x < 112) zone = 'UR602–603 • PADANG FUTSAL & BASEBALL CAGE';
    else zone = 'UR601 • ASCARO PADEL & SOCIAL CLUB';
    accent = '#34d399';
  } else if (floorIdx === 5) {
    wing = '4F–5F ENTERTAINMENT ZONE';
    if (x < 50) zone = 'EZ501 • CAMP5 CLIMBING & WANGSA BOWL';
    else if (x < 112) zone = z < 0 ? 'EZ403 • GSC CINEMAS (15 HALLS)' : 'EZ402–503 • TOY CATCHER, DIVA KTV & CROSS FIRE';
    else zone = 'OV401–501 • CELLINI, STANZO & OVAL LIFTS';
    accent = '#f472b6';
  } else if (x < -130) {
    wing = '1 UTAMA E (6xx)';
    if (floorIdx === 0) zone = 'E-STREET • FLOWRIDER (LG601) & MODU (LG602)';
    else if (floorIdx === 1) zone = 'MRT PINTU B LINK • ZUS, BHC & SPORTS DIRECT';
    else if (floorIdx === 2) zone = 'DISTRICT K • ROLLERWA (F603A) & GAME ON';
    else if (floorIdx === 3) zone = 'WINDLAB SKYDIVING (S601) • NEXTGEN & PJPAC';
    else zone = 'T601 • NEXTGEN UPPER MEZZANINE & VR ARENA';
    accent = '#ec4899';
  } else if (x < -28) {
    wing = 'OLD WING (1xx)';
    if (floorIdx === 4) zone = 'EZ101 • TGV CINEMAS IMAX & INDULGE';
    else if (x < -102) zone = floorIdx === 1 ? 'G139C • SEPHORA, UNIQLO & CENTRE COURT' : floorIdx === 2 ? 'F101 • NITORI & UNIQLO DUPLEX' : floorIdx === 3 ? 'S101 • HARVEY NORMAN' : 'LG101 • ALL IT HYPERMARKET & WEST CONCOURSE';
    else if (x > -46) zone = 'LOT 125 • AEON ANCHOR & ESCALATORS';
    else zone = 'CENTRE COURT ATRIUM';
    accent = '#fbbf24';
  } else if (x <= 12) {
    wing = 'PROMENADE BRIDGE (2xx)';
    zone = floorIdx === 4 ? 'EZ216A • CELEBRITY FITNESS SPORTSZONE' : 'LEBUH BANDAR UTAMA SKYBRIDGE & ONE WORLD LINK';
    accent = '#a78bfa';
  } else if (x < 62) {
    wing = 'NEW WING • RAINFOREST';
    if (floorIdx === 3 && x >= 36 && x <= 40 && Math.abs(z) <= 13.6) zone = '2F RAINBOW SUSPENSION BRIDGE & FOOD DISTRICT';
    else if (floorIdx === 0) zone = 'LG RAINFOREST • KOI POND, IPPUDO & AQUARIUM';
    else zone = `${floor.code} RAINFOREST CANOPY TERRACE`;
    accent = '#10b981';
  } else if (x < 112) {
    wing = 'NEW WING • HIGHSTREET';
    if (floorIdx === 1) zone = 'GF LUXE • ZARA, CHANEL, COACH & DIN TAI FUNG';
    else if (floorIdx === 2) zone = '1F HIGHSTREET • DECATHLON, DYSON & BATH & BODY';
    else if (floorIdx === 3) zone = '2F HIGHSTREET • NIKE, MACHINES & MR.DIY';
    else if (floorIdx === 4) zone = '3F HIGHSTREET • THE LEDGE ART GALLERY & CONCIERGE';
    else zone = 'LG HIGHSTREET • ADIDAS, GARRETT & AUNTIE ANNE’S';
    accent = '#e2e8f0';
  } else {
    wing = 'NEW WING • THE OVAL';
    if (floorIdx === 0) zone = 'LG OVAL • JAYA GROCER (LG309), HEYTEA & FERRARI 458';
    else if (x > 160) zone = `${floor.code}320 • PARKSON ELITE ANCHOR`;
    else if (floorIdx === 3) zone = '2F OVAL • POP MART (S333), TOP TOY & CONCIERGE';
    else zone = `${floor.code} OVAL ATRIUM & PANORAMIC LIFTS`;
    accent = '#38bdf8';
  }

  return { floorCode: floor.code, floorName: floor.name, wing, zone, accent };
}

// Continuous wall-to-wall storefront generator
function strip(floor, wing, side, zPos, xStart, items) {
  let cursor = xStart;
  return items.map((it, idx) => {
    const w = it.w || 16;
    const cx = cursor + w * 0.5;
    cursor += w + 0.12;
    return {
      id: `${floor}-${wing.replace(/\s+/g, '')}-${side}-${idx}-${it.lot}`,
      name: it.name,
      subtitle: it.sub,
      lot: it.lot,
      floor,
      wing,
      x: cx,
      z: zPos,
      width: w,
      side,
      brandBg: it.bg || '#18181b',
      brandFg: it.fg || '#ffffff',
      accent: it.ac || '#38bdf8',
      style: it.st || 'fashion'
    };
  });
}

export const STORES = [
  // ===================== FLOOR 0: LOWER GROUND (LG) =====================
  // 1UE West wall full-span (width 40m so ZERO blank flanking walls!)
  { id: 'lg-ue-w', name: 'FLOWRIDER® 1 UTAMA SURF ARENA', subtitle: 'Malaysia’s 1st Sheet-Wave Simulator • Surf Pro Shop & Café', lot: 'LG601', floor: 0, wing: '1 Utama E', x: -183.2, z: 0, width: 39.6, side: 'W', brandBg: '#0369a1', brandFg: '#ffffff', accent: '#38bdf8', style: 'sports' },
  ...strip(0, '1 Utama E', 'N', -20.2, -182.8, [
    { lot: 'LG602', name: 'MODU', sub: 'Authentic Korean Samgyetang Ginseng Chicken', w: 10.2, bg: '#1e293b', fg: '#f8fafc', ac: '#fbbf24', st: 'korean' },
    { lot: 'LG603-LG603A', name: 'RICH KOPITIAM', sub: 'Nanyang Kopi Kaw • Kaya Butter Toast • Nasi Lemak', w: 10.4, bg: '#451a03', fg: '#fde68a', ac: '#f59e0b', st: 'kopitiam' },
    { lot: 'LG605', name: 'SUSHIYA', sub: 'Artisan Japanese Sushi & Donburi', w: 10.2, bg: '#7f1d1d', fg: '#fef2f2', ac: '#f87171', st: 'japanese' },
    { lot: 'LG606', name: 'MENYA MUSASHI', sub: 'Tokyo Tsukemen & Tonkotsu Ramen', w: 10.2, bg: '#1c1917', fg: '#fde68a', ac: '#ef4444', st: 'japanese' },
    { lot: 'LG608', name: 'TAI HO JIAK 台好甲', sub: 'Taiwanese Braised Pork Rice & Beef Noodles', w: 10.4, bg: '#7c2d12', fg: '#fef3c7', ac: '#f59e0b', st: 'dining' }
  ]),
  ...strip(0, '1 Utama E', 'S', 20.2, -182.8, [
    { lot: 'LG610-LG611', name: 'JATUJAK BANGKOK STREET FOOD', sub: 'Authentic Thai Boat Noodles & Street Grill', w: 12.8, bg: '#065f46', fg: '#fef08a', ac: '#34d399', st: 'dining' },
    { lot: 'LG613A', name: 'SHIN JJAJANG BUDAE JJIGAE', sub: 'Korean Black Bean Noodles & Army Stew', w: 12.8, bg: '#7f1d1d', fg: '#fde68a', ac: '#ef4444', st: 'korean' },
    { lot: 'LG615', name: 'HANSANG KOREAN RESTAURANT', sub: 'Traditional Korean BBQ & Banchan Table', w: 12.8, bg: '#27272a', fg: '#fef3c7', ac: '#fb923c', st: 'korean' },
    { lot: 'LG616-LG617', name: 'WANG DONKAS', sub: 'Crispy Korean King Pork Cutlet • E-Street', w: 12.8, bg: '#1e293b', fg: '#ffffff', ac: '#e9b03f', st: 'korean' }
  ]),

  // Old Wing LG (100% Individual Side-by-Side Single-Brand Tenants per 1utama.com.my!)
  { id: 'lg101-allit', name: 'ALL IT HYPERMARKET', subtitle: 'PC Components • Laptops • Tech Superstore', lot: 'LG101', floor: 0, wing: 'Old Wing', x: -125.8, z: -15.8, width: 12.4, side: 'W', brandBg: '#1e3a8a', brandFg: '#ffffff', accent: '#60a5fa', style: 'tech' },
  { id: 'lg101s-bless', name: 'KEDAI BLESS', subtitle: 'Community Thrift & Preloved Finds', lot: 'LG126', floor: 0, wing: 'Old Wing', x: -125.8, z: 15.8, width: 12.4, side: 'W', brandBg: '#065f46', brandFg: '#ecfdf5', accent: '#34d399', style: 'fashion' },
  { id: 'lg125-aeon', name: 'AEON', subtitle: 'Japanese Department Store & Home Essentials', lot: 'LG125', floor: 0, wing: 'Old Wing', x: -29.2, z: -15.8, width: 12.4, side: 'E', brandBg: '#831843', brandFg: '#ffffff', accent: '#f472b6', style: 'anchor' },
  { id: 'lg125s-aeon', name: 'AEON SUPERMARKET', subtitle: 'Sushi • Fresh Produce • Japanese Groceries', lot: 'LG125B', floor: 0, wing: 'Old Wing', x: -29.2, z: 15.8, width: 12.4, side: 'E', brandBg: '#9d174d', brandFg: '#ffffff', accent: '#f472b6', style: 'supermarket' },
  { id: 'lg301-montigo', name: 'MONTIGO', subtitle: 'Insulated Tumblers & Lifestyle Drinkware', lot: 'LG301', floor: 0, wing: 'New Wing', x: 13.4, z: -16.4, width: 13.2, side: 'W', brandBg: '#0f172a', brandFg: '#fde68a', accent: '#38bdf8', style: 'fashion' },
  { id: 'lg358-richese', name: 'RICHEESE FACTORY', subtitle: 'Fire Wings • Rich Cheese Dip', lot: 'LG356', floor: 0, wing: 'Rainforest', x: 13.4, z: 16.4, width: 13.2, side: 'W', brandBg: '#b91c1c', brandFg: '#fef08a', accent: '#facc15', style: 'dining' },

  ...strip(0, 'Old Wing', 'N', -22.2, -125.2, [
    { lot: 'LG103', name: 'LO HONG KA', sub: 'Imperial Bird’s Nest & Wellness', w: 9.4, bg: '#78350f', fg: '#fde68a', ac: '#f59e0b', st: 'herbal' },
    { lot: 'LG103B', name: 'EU YAN SANG', sub: 'Traditional Chinese Herbal Remedies', w: 9.4, bg: '#451a03', fg: '#fde047', ac: '#eab308', st: 'herbal' },
    { lot: 'LG105-LG106', name: 'SHABU-YO', sub: 'Japanese Wagyu Shabu-Shabu & Sushi Bar', w: 19.2, bg: '#7f1d1d', fg: '#ffffff', ac: '#ef4444', st: 'japanese' },
    { lot: 'LG109A', name: 'MAYBANK', sub: 'Premier Banking & ATM Concourse', w: 9.4, bg: '#ca8a04', fg: '#111827', ac: '#fde047', st: 'transit' },
    { lot: 'LG110', name: 'CIMB BANK', sub: 'Retail Banking & Currency Services', w: 9.4, bg: '#991b1b', fg: '#ffffff', ac: '#ef4444', st: 'transit' },
    { lot: 'LG115', name: 'THE FISH BOWL', sub: 'Fresh Hawaiian Poke Bowls', w: 9.4, bg: '#065f46', fg: '#ecfdf5', ac: '#34d399', st: 'kopitiam' },
    { lot: 'LG117', name: 'STUFF’D', sub: 'Daily Kebabs, Burritos & Quesadillas', w: 9.4, bg: '#1c1917', fg: '#fef08a', ac: '#f59e0b', st: 'kopitiam' },
    { lot: 'LG120', name: 'GUARDIAN', sub: 'Health, Beauty & Personal Care', w: 9.8, bg: '#c2410c', fg: '#ffffff', ac: '#fdba74', st: 'beauty' },
    { lot: 'LG121', name: 'CARING PHARMACY', sub: 'Pharmacist Care & Vitamins', w: 9.8, bg: '#14532d', fg: '#ffffff', ac: '#4ade80', st: 'beauty' }
  ]),
  ...strip(0, 'Old Wing', 'S', 22.2, -125.2, [
    { lot: 'LG106', name: 'TEXAS CHICKEN', sub: 'Crunchy Fried Chicken & Honey Biscuits', w: 9.5, bg: '#991b1b', fg: '#fef08a', ac: '#facc15', st: 'kopitiam' },
    { lot: 'LG107', name: 'KFC', sub: 'Original Recipe & Hot & Spicy Chicken', w: 9.5, bg: '#b91c1c', fg: '#ffffff', ac: '#ef4444', st: 'kopitiam' },
    { lot: 'LG111-LG112', name: 'NOODLE SHACK', sub: 'Artisan Hand-Pulled Pan Mee & Mala Noodles', w: 19.12, bg: '#9a3412', fg: '#fef3c7', ac: '#f59e0b', st: 'dining' },
    { lot: 'LG116', name: 'FOOD STREET', sub: 'Penang Char Kuey Teow • Sarawak Laksa • Cendol', w: 19.8, bg: '#451a03', fg: '#fed7aa', ac: '#fb923c', st: 'kopitiam' },
    { lot: 'LG122', name: 'LA BOHEME', sub: 'Artisan Japanese Bakery & Pastries', w: 9.3, bg: '#713f12', fg: '#fef9c3', ac: '#eab308', st: 'bakery' },
    { lot: 'LG123', name: 'BAKER’S COTTAGE', sub: 'Portuguese Egg Tarts & Roast Chicken', w: 9.3, bg: '#7c2d12', fg: '#fef3c7', ac: '#f59e0b', st: 'bakery' },
    { lot: 'LG125A', name: 'AEON SUPERMARKET', sub: 'Fresh Groceries • Japanese Delicatessen', w: 18.8, bg: '#9d174d', fg: '#ffffff', ac: '#f472b6', st: 'supermarket' }
  ]),

  // LG Promenade Bridge (2025 Walkthrough Verified #408–#409: Winter Time, Yong Sheng, Jungle House, Wok Hey, Sealantis!)
  ...strip(0, 'LG Promenade', 'N', -10.2, -27.5, [
    { lot: 'LG210', name: 'WOK HEY', sub: 'Stir-Fried Wok Egg Fried Rice', w: 9.6, bg: '#991b1b', fg: '#fde047', ac: '#f59e0b', st: 'wok' },
    { lot: 'LG218', name: 'WINTER TIME', sub: 'Carlton Luggage & Cold-Weather Apparel', w: 9.6, bg: '#1e3a8a', fg: '#ffffff', ac: '#60a5fa', st: 'fashion' },
    { lot: 'LG221', name: 'YONG SHENG 榮成', sub: 'Traditional Handmade Pastries & Gifts', w: 9.6, bg: '#9a3412', fg: '#fef3c7', ac: '#fb923c', st: 'bakery' },
    { lot: 'LG222', name: 'JUNGLE HOUSE', sub: 'Raw Rainforest Honey & Botanical Drinks', w: 9.6, bg: '#78350f', fg: '#fef08a', ac: '#facc15', st: 'bakery' }
  ]),
  ...strip(0, 'LG Promenade', 'S', 10.2, -27.5, [
    { lot: 'LG211A', name: 'BEE CHENG HIANG', sub: 'Charcoal-Grilled Bakkwa & Crispy Pork Floss', w: 15.2, bg: '#7f1d1d', fg: '#fef08a', ac: '#ef4444', st: 'bakery' },
    { lot: 'P289', name: 'SEALANTIS DIVE CENTRE', sub: 'PADI 5★ Indoor Scuba Pool • Promenade', w: 23.2, bg: '#0c4a6e', fg: '#e0f2fe', ac: '#38bdf8', st: 'scuba' }
  ]),

  // New Wing LG: 2025 Walkthrough Verified (#405–#407: Huawei opposite Absolute Thai, Montigo opposite Secret Recipe, Adidas, Miniso, KyoChon, HEYTEA!)
  ...strip(0, 'New Wing LG', 'N', -23.2, 13.8, [
    { lot: 'LG302', name: 'BEST DENKI', sub: 'Japanese Home Electronics & OLED TVs', w: 11.6, bg: '#1e3a8a', fg: '#ffffff', ac: '#38bdf8', st: 'tech' },
    { lot: 'LG305', name: 'ANTA SUPERSTORE', sub: 'Performance Basketball & Running Footwear', w: 11.7, bg: '#111827', fg: '#ffffff', ac: '#ef4444', st: 'sports' },
    { lot: 'LG306', name: 'MONTIGO', sub: 'Insulated Tumblers & Drinkware • Opposite Secret Recipe', w: 11.6, bg: '#0f172a', fg: '#fde68a', ac: '#38bdf8', st: 'fashion' },
    { lot: 'LG330A', name: 'HUAWEI EXPERIENCE', sub: 'Mate XT • Pura Flagship & Smart Ecosystem', w: 11.7, bg: '#f4f4f5', fg: '#111827', ac: '#dc2626', st: 'tech' },
    { lot: 'LG333', name: 'VERRONA HILLS', sub: 'Artisan Bread & French Pâtisserie', w: 11.6, bg: '#f5efe6', fg: '#3b2414', ac: '#b4944e', st: 'bakery' },
    { lot: 'LG335', name: 'TEH TARIK CLUB', sub: 'Malaysian Pulled Teh Tarik • Roti Canai & Nasi Lemak', w: 11.7, bg: '#3f2312', fg: '#fde68a', ac: '#e9b03f', st: 'kopitiam' },
    { lot: 'LG307-LG307A', name: 'ADIDAS', sub: 'Originals • Running • Performance Flagship', w: 22.0, bg: '#eef1f5', fg: '#111111', ac: '#e879f9', st: 'sports' },
    { lot: 'LG308C', name: 'MINISO', sub: 'All-Pink IP Flagship • Blind Boxes & Plushies', w: 10.9, bg: '#f9a8d4', fg: '#ffffff', ac: '#e11d48', st: 'toys' },
    { lot: 'LG308', name: 'GO UNIQUE', sub: 'Go Noodle House Concept • Claypot Rice & Ramen', w: 11.0, bg: '#7f1d1d', fg: '#fef3c7', ac: '#f59e0b', st: 'dining' },
    { lot: 'LG311', name: 'KYOCHON 1991', sub: 'Korean Soy Garlic & Red Pepper Chicken', w: 10.9, bg: '#2c1e16', fg: '#fef3c7', ac: '#f59e0b', st: 'korean' },
    { lot: 'LG312', name: 'BURGER KING', sub: 'Flame-Grilled Whopper & Crispy Fries', w: 11.0, bg: '#991b1b', fg: '#fde047', ac: '#facc15', st: 'dining' },
    { lot: 'LG313', name: 'HEYTEA 喜茶', sub: 'Cheese Grape Boom • Roasted Brown Bobo', w: 11.1, bg: '#f0eae0', fg: '#111111', ac: '#52525b', st: 'kopitiam' },
    { lot: 'LG320-LG320A', name: 'LITTLE CRAVINGS', sub: 'Artisan Malaysian Desserts & Kopi', w: 11.2, bg: '#3b2414', fg: '#fef3c7', ac: '#d97706', st: 'kopitiam' }
  ]),
  ...strip(0, 'New Wing LG', 'S', 23.2, 13.8, [
    { lot: 'LG357-LG358', name: 'PARK’S BAGELS', sub: 'Artisan Hand-Rolled Bagels & Cream Cheese', w: 11.1, bg: '#f5efe6', fg: '#1c1814', ac: '#d97706', st: 'bakery' },
    { lot: 'LG350', name: 'FISH & CO.', sub: 'Rainforest Waterside Seafood in a Pan', w: 11.2, bg: '#0f172a', fg: '#bae6fd', ac: '#38bdf8', st: 'dining' },
    { lot: 'LG353-LG355', name: 'SECRET RECIPE', sub: 'Malaysian Artisan Cakes • Opposite Montigo', w: 11.1, bg: '#881337', fg: '#ffe4e6', ac: '#fb7185', st: 'bakery' },
    { lot: 'LG348', name: 'ABSOLUTE THAI', sub: 'Authentic Thai Street Cuisine • Opposite Huawei', w: 11.2, bg: '#1c1917', fg: '#fde68a', ac: '#f59e0b', st: 'dining' },
    { lot: 'LG352', name: 'IPPUDO 一風堂', sub: 'Hakata Tonkotsu Ramen Overlooking Koi Pond', w: 22.4, bg: '#18181b', fg: '#ffffff', ac: '#dc2626', st: 'japanese' },
    { lot: 'LG340', name: 'LANEIGE', sub: 'K-Beauty Water Sleeping Mask & Skincare', w: 11.4, bg: '#1e3a8a', fg: '#e0f2fe', ac: '#60a5fa', st: 'beauty' },
    { lot: 'LG342', name: 'SK JEWELLERY', sub: 'Contemporary Gold & Lab-Grown Diamonds', w: 11.5, bg: '#1e1b4b', fg: '#fde68a', ac: '#d4af37', st: 'luxury' },
    { lot: 'LG310', name: 'BMS ORGANICS', sub: 'Organic Wholefoods & Wellness Café', w: 11.1, bg: '#14532d', fg: '#dcfce7', ac: '#4ade80', st: 'supermarket' },
    { lot: 'LG315', name: 'CELCOMDIGI', sub: '5G Express Flagship Hub', w: 11.2, bg: '#1e40af', fg: '#ffffff', ac: '#facc15', st: 'tech' },
    { lot: 'BT1', name: 'AEROLINE LOUNGE', sub: 'Singapore & Penang Luxury Coach Terminal', w: 23.2, bg: '#1e293b', fg: '#67e8f9', ac: '#22d3ee', st: 'transit' },
    { lot: 'LG316', name: 'SPEEDO', sub: 'Performance Swimwear & Aquatics', w: 11.6, bg: '#0f172a', fg: '#ffffff', ac: '#ef4444', st: 'sports' },
    { lot: 'LG318', name: 'AL-TAMIJ CURRENCY', sub: 'Licensed Money Changer • Oval LG', w: 11.7, bg: '#14532d', fg: '#dcfce7', ac: '#eab308', st: 'transit' }
  ]),
  { id: 'lg309-jayagrocer', name: 'JAYA GROCER', subtitle: 'Gourmet Supermarket • Fresh Produce • Bakery & Organic Pantry', lot: 'LG309', floor: 0, wing: 'The Oval', x: 173.0, z: 0, width: 45.6, side: 'E', brandBg: '#1c1917', brandFg: '#ffffff', accent: '#dc2626', style: 'supermarket' },

  // ===================== FLOOR 1: GROUND FLOOR (G — 2025 Walkthrough Verified #338–#522!) =====================
  // 1 Utama E GF: MRT Pintu B (West) -> G627 Mixue / G623-625 Pasar Eatai -> G621 YGF Malatang -> G619 Yat Yat Seng -> G618 IJN First Pharmacy + Prayer Room/WC -> G616 Rehat~Rehat -> Central Hub -> G610 Wilford opposite Mil Toast House -> G602-609 SportsDirect (East by Giant Chess Courtyard!)
  { id: 'g-ue-en', name: 'COFFEE MEETS PASTRY BY ZUS', subtitle: 'Artisanal Croissants • Blue Cup Vitrine • 1UE GF', lot: 'G601A', floor: 1, wing: '1 Utama E', x: -130.8, z: -15.0, width: 10.2, side: 'E', brandBg: '#f3eee6', brandFg: '#1d4ed8', accent: '#2563eb', style: 'cafe' },
  { id: 'g-ue-es', name: 'BHC CHICKEN', subtitle: 'Korea’s Bburinkle Crispy Chicken & Chimaek • 1UE', lot: 'G601', floor: 1, wing: '1 Utama E', x: -130.8, z: 15.0, width: 10.2, side: 'E', brandBg: '#ca8a04', brandFg: '#18181b', accent: '#fef08a', style: 'korean' },
  ...strip(1, '1 Utama E', 'N', -20.2, -182.8, [
    { lot: 'G623-G625', name: 'PASAR EATAI', sub: 'Curated Malaysian & Thai Street Eats • MRT Wing', w: 10.4, bg: '#7c2d12', fg: '#fef3c7', ac: '#f97316', st: 'dining' },
    { lot: 'G621-G622', name: 'YGF MALATANG 楊國福', sub: 'Signature Mala Tang & Bone Broth', w: 8.6, bg: '#b91c1c', fg: '#ffffff', ac: '#fde047', st: 'dining' },
    { lot: 'G619-G620', name: 'YAT YAT SENG 日日升', sub: 'Modern Kopitiam & Toast', w: 8.4, bg: '#451a03', fg: '#fde68a', ac: '#e9b03f', st: 'kopitiam' },
    { lot: 'G616-G617', name: 'REHAT~REHAT & DR. KYO', sub: 'Muslim-Friendly Wellness Spa & Aesthetic Clinic', w: 8.0, bg: '#1e293b', fg: '#f8fafc', ac: '#38bdf8', st: 'beauty' },
    { lot: 'G613A-G613B', name: 'MIL TOAST HOUSE', sub: 'Seoul Steamed Brioche Bread & Soufflé Toast', w: 15.6, bg: '#f5ede0', fg: '#3b2414', ac: '#d97706', st: 'bakery' }
  ]),
  ...strip(1, '1 Utama E', 'S', 20.2, -182.8, [
    { lot: 'G627', name: 'MIXUE 蜜雪冰城', sub: 'Fresh Ice Cream & Lemonade • MRT Pintu B End', w: 8.4, bg: '#dc2626', fg: '#ffffff', ac: '#fef08a', st: 'kopitiam' },
    { lot: 'G618', name: 'IJN FIRST PHARMACY', sub: 'Clinical Pharmacy Beside 1UE Restrooms & Surau', w: 7.4, bg: '#1e3a8a', fg: '#ffffff', ac: '#38bdf8', st: 'beauty' }
  ]),
  // Recessed Restrooms, Baby Room & Prayer Room corridor (`fac-surau-g1ue`, x=-162.8, w=7.8) sits right beside G618 IJN First Pharmacy (#506!)
  ...strip(1, '1 Utama E', 'S', 20.2, -158.6, [
    { lot: 'G610-G613', name: 'WILFORD', sub: 'Kids Electric Supercars • Opposite Mil Toast House', w: 9.6, bg: '#312e81', fg: '#ffffff', ac: '#a78bfa', st: 'toys' },
    { lot: 'G602-G609', name: 'SPORTSDIRECT.COM', sub: 'Football • Running • Cycling • By Giant Chess Courtyard', w: 17.6, bg: '#1e1b4b', fg: '#ffffff', ac: '#ef4444', st: 'sports' }
  ]),

  // Old Wing GF Centre Court (2025 Walkthrough Verified #425–#467: Uniqlo -> Urban Revivo -> TAG Heuer -> Levi's -> Watatime -> Patchi -> Cotton On -> Sa Sa -> Haidilao -> Skechers -> AEON!)
  { id: 'g101-royalsel', name: 'ROYAL SELANGOR PEWTER', subtitle: 'Malaysian Heritage Craft • Gift Gallery', lot: 'G101', floor: 1, wing: 'Old Wing', x: -125.8, z: -15.8, width: 12.4, side: 'W', brandBg: '#1e293b', brandFg: '#f8fafc', accent: '#94a3b8', style: 'luxury' },
  { id: 'g146-marco', name: 'MARCO CREATIVE CUISINE', subtitle: 'Italian Artisan Pasta & Dining', lot: 'G146', floor: 1, wing: 'Old Wing', x: -125.8, z: 15.8, width: 12.4, side: 'W', brandBg: '#451a03', brandFg: '#fde68a', accent: '#fbbf24', style: 'dining' },
  { id: 'g125-aeon', name: 'AEON', subtitle: 'Japanese Department Store & Fresh Produce', lot: 'G125', floor: 1, wing: 'Old Wing', x: -29.2, z: -15.8, width: 12.4, side: 'E', brandBg: '#831843', brandFg: '#ffffff', accent: '#f472b6', style: 'supermarket' },
  { id: 'g126-tomei', name: 'TOMEI & OPULENCE', subtitle: '916 Fine Gold • Diamond Solitaires', lot: 'G126', floor: 1, wing: 'Old Wing', x: -29.2, z: 15.8, width: 12.4, side: 'E', brandBg: '#713f12', brandFg: '#fef08a', accent: '#eab308', style: 'luxury' },
  { id: 'g353-yunnans', name: 'YUN NANS 云海肴', subtitle: 'Highland Yunnan Steam Pot Chicken • Rainforest Portal', lot: 'G353', floor: 1, wing: 'Rainforest', x: 13.4, z: -16.4, width: 13.2, side: 'W', brandBg: '#292524', brandFg: '#fde68a', accent: '#d97706', style: 'dining' },
  { id: 'g355-hotpot', name: 'HOTPOT KITCHEN', subtitle: 'Rainforest Canopy Dining Terrace • Modern Chinese', lot: 'G355', floor: 1, wing: 'Rainforest', x: 13.4, z: 16.4, width: 13.2, side: 'W', brandBg: '#064e3b', brandFg: '#d1fae5', accent: '#10b981', style: 'dining' },

  ...strip(1, 'Old Wing', 'N', -22.2, -125.2, [
    { lot: 'G102', name: 'UNIQLO', sub: 'LifeWear • AIRism • Linen Collection', w: 14.0, bg: '#dc2626', fg: '#ffffff', ac: '#ffffff', st: 'fashion' },
    { lot: 'G102A', name: 'URBAN REVIVO', sub: 'Contemporary Runway Fashion Flagship', w: 9.2, bg: '#f4f4f5', fg: '#111111', ac: '#71717a', st: 'fashion' },
    { lot: 'G103', name: 'TAG HEUER', sub: 'Swiss Avant-Garde Luxury Watches', w: 8.4, bg: '#111318', fg: '#f8fafc', ac: '#ef4444', st: 'luxury' },
    { lot: 'G105', name: 'LEVI’S', sub: '501 Original Denim & Tailor Shop', w: 8.6, bg: '#1e293b', fg: '#f8fafc', ac: '#dc2626', st: 'fashion' },
    { lot: 'G106', name: 'WATATIME • PATCHI', sub: 'Swiss Timepieces & Luxury Artisanal Chocolate', w: 8.6, bg: '#27201c', fg: '#fde68a', ac: '#d4af37', st: 'luxury' },
    { lot: 'G108-G109', name: 'COTTON ON', sub: 'Australian Everyday Apparel & Denim', w: 9.4, bg: '#27272a', fg: '#f8fafc', ac: '#e4e4e7', st: 'fashion' },
    { lot: 'G115', name: 'SA SA', sub: 'Asian Skincare, Masks & Beauty (West of Haidilao)', w: 9.2, bg: '#be185d', fg: '#ffffff', ac: '#f472b6', st: 'beauty' },
    { lot: 'G116', name: 'HAI DI LAO 海底捞', sub: 'Signature Tomato & Mala Hotpot • Noodle Dance', w: 15.6, bg: '#991b1b', fg: '#ffffff', ac: '#f87171', st: 'dining' },
    { lot: 'G117-G119', name: 'SKECHERS • FOOT LOCKER', sub: 'Performance Footwear & Streetwear Flagships', w: 11.6, bg: '#0f172a', fg: '#ffffff', ac: '#38bdf8', st: 'sports' }
  ]),
  ...strip(1, 'Old Wing', 'S', 22.2, -125.2, [
    { lot: 'G140-G141', name: 'KENS APOTHECARY', sub: 'Diptyque • Byredo • Jo Malone Perfumery', w: 9.4, bg: '#1c1917', fg: '#f5efe6', ac: '#b4944e', st: 'beauty' },
    { lot: 'G139A', name: 'M·A·C • GUARDIAN', sub: 'Professional Makeup Artistry & Cosmetics', w: 9.4, bg: '#111111', fg: '#ffffff', ac: '#f43f5e', st: 'beauty' },
    { lot: 'G139C', name: 'SEPHORA', sub: 'International Skincare • Fragrance • Beauty', w: 17.6, bg: '#000000', fg: '#ffffff', ac: '#f43f5e', st: 'sephora' },
    { lot: 'G139B-G139D', name: 'STARBUCKS RESERVE', sub: 'Artisan Pour-Over Coffee • Paris Baguette Forecourt Spur', w: 16.4, bg: '#181412', fg: '#fef3c7', ac: '#d4af5e', st: 'kopitiam' },
    { lot: 'G135', name: 'MUJI 無印良品', sub: 'Japanese Living, Apparel & Stationery', w: 11.4, bg: '#7f1d1d', fg: '#ffffff', ac: '#d6d3d1', st: 'furniture' },
    { lot: 'G133', name: 'SACOOR BLUE', sub: 'Portuguese Contemporary Menswear & Tailoring', w: 9.6, bg: '#1e3a8a', fg: '#ffffff', ac: '#60a5fa', st: 'luxury' },
    { lot: 'G129A', name: 'CHARLES & KEITH', sub: 'Contemporary Footwear & Sculpted Handbags', w: 11.2, bg: '#eae4da', fg: '#1c1814', ac: '#b4944e', st: 'luxury' },
    { lot: 'G128', name: 'CÔNG CÀ PHÊ • GIGI', sub: 'Vietnamese Coconut Coffee & Forecourt Café', w: 9.6, bg: '#14532d', fg: '#fef08a', ac: '#4ade80', st: 'kopitiam' }
  ]),

  // GF Promenade Bridge (2025 Walkthrough Verified #412–#424, #468–#475, #515–#521: PUTIEN G213A, Lavender G212, Tai Er G210C, Chicken Rice Shop G211, Sun Moulin G201, TGI Fridays G203A!)
  ...strip(1, 'GF Promenade', 'N', -10.2, -27.5, [
    { lot: 'G213A', name: 'PUTIEN 莆田', sub: 'Michelin-Starred Fujian Cuisine • Gong Cha Corner', w: 9.6, bg: '#1e3a8a', fg: '#ffffff', ac: '#38bdf8', st: 'dining' },
    { lot: 'G212', name: 'LAVENDER BAKERY', sub: 'Artisan European Pastries • Zhao Ji Desserts', w: 9.6, bg: '#4c1d95', fg: '#fef3c7', ac: '#c084fc', st: 'bakery' },
    { lot: 'G211', name: 'THE CHICKEN RICE SHOP', sub: 'Hainanese Chicken Rice • Giant Chess Courtyard', w: 9.6, bg: '#b91c1c', fg: '#ffffff', ac: '#facc15', st: 'dining' },
    { lot: 'G210C', name: 'TAI ER 太二', sub: 'Sichuan Sauerkraut Fish • Opposite ROYCE’', w: 9.6, bg: '#18181b', fg: '#ffffff', ac: '#ef4444', st: 'dining' }
  ]),
  ...strip(1, 'GF Promenade', 'S', 10.2, -27.5, [
    { lot: 'G215-G216', name: 'RESTORAN JOHNNY’S', sub: 'Thai Steamboat • Oversea • Bask Bear Coffee', w: 11.0, bg: '#991b1b', fg: '#fef08a', ac: '#f59e0b', st: 'dining' },
    { lot: 'G201', name: 'SUN MOULIN BAKERY', sub: 'Hokkaido Artisan Breads • Car Park Exit Doors', w: 12.6, bg: '#292524', fg: '#fde68a', ac: '#f59e0b', st: 'bakery' },
    { lot: 'G203A-G206', name: 'TGI FRIDAYS', sub: 'American Ribs & Grill • Robataya Izakaya', w: 14.8, bg: '#991b1b', fg: '#ffffff', ac: '#f87171', st: 'dining' }
  ]),

  // New Wing GF (`LUXE G` + The Oval — 2025 Walkthrough Verified #338–#404!)
  // North: DeGem + H&M (West Escalator Corner!) -> Steve Madden -> Calvin Klein -> Lacoste -> Coach (opposite Michael Kors across Main Entrance!) -> Lancôme -> YSL (G329) -> Chanel (G330) -> Marks & Spencer (G332-339) -> Aldo (G340) -> Naelofar (G341) -> ZARA (right beside Parkson Elite!)
  ...strip(1, 'LUXE G', 'N', -23.2, 13.8, [
    { lot: 'G302', name: 'DEGEM', sub: 'Fine Diamond Jewellery • West LUXE G Escalator', w: 10.6, bg: '#1e1b4b', fg: '#fde68a', ac: '#fbbf24', st: 'luxury' },
    { lot: 'G303', name: 'H&M', sub: 'Global Fashion Flagship • Adjacent to DeGem', w: 12.2, bg: '#991b1b', fg: '#ffffff', ac: '#ef4444', st: 'fashion' },
    { lot: 'G358', name: 'STEVE MADDEN • MELANGÉ', sub: 'New York Runway Footwear & Designer Handbags', w: 11.4, bg: '#18181b', fg: '#ffffff', ac: '#e4e4e7', st: 'luxury' },
    { lot: 'G357', name: 'CALVIN KLEIN', sub: 'Minimalist Tailoring & Underwear Flagship', w: 11.0, bg: '#141416', fg: '#ffffff', ac: '#a1a1aa', st: 'luxury' },
    { lot: 'G359', name: 'LACOSTE', sub: 'French Tennis Heritage Polo & Footwear', w: 10.6, bg: '#14532d', fg: '#ffffff', ac: '#22c55e', st: 'fashion' },
    { lot: 'G309', name: 'COACH', sub: 'New York Runway Leather • Opposite Michael Kors', w: 12.2, bg: '#1c1917', fg: '#fde68a', ac: '#d4af37', st: 'luxury' },
    { lot: 'G328', name: 'LANCÔME', sub: 'French Haute Skincare • Adjacent to YSL Beauty', w: 10.4, bg: '#111111', fg: '#ffffff', ac: '#ec4899', st: 'beauty' },
    { lot: 'G329', name: 'YSL BEAUTY', sub: 'Yves Saint Laurent Couture Cosmetics & Fragrance', w: 10.4, bg: '#111111', fg: '#ffffff', ac: '#d4af37', st: 'beauty' },
    { lot: 'G330', name: 'CHANEL', sub: 'GF Luxe Haute Parfumerie & Beauté', w: 11.0, bg: '#09090b', fg: '#ffffff', ac: '#fbbf24', st: 'luxury' },
    { lot: 'G332-G339', name: 'MARKS & SPENCER', sub: 'M&S Pasar Raya • British Fashion & Food Hall', w: 17.8, bg: '#18181b', fg: '#ffffff', ac: '#d4af37', st: 'luxury' },
    { lot: 'G340-G341', name: 'ALDO • NAELOFAR', sub: 'Contemporary Footwear & Hijab Couture • Oval', w: 12.2, bg: '#f4efe6', fg: '#1c1814', ac: '#b4944e', st: 'luxury' },
    { lot: 'G319', name: 'ZARA', sub: 'Woman • Man • Kids • Adjacent to Parkson Elite', w: 27.6, bg: '#09090b', fg: '#ffffff', ac: '#e4e4e7', st: 'fashion' }
  ]),
  // South: Astons -> HSBC Amanah -> Din Tai Fung -> Michael Kors (opposite Coach!) -> [GF Luxe Main Entrance / Valet Portal x=86..96] -> Aesop & Furla -> L'Occitane -> Madam Kwan's (G342-343) -> Maybank (Oval) -> LAMY -> Puras & Geox -> Denza BYD & Fred Perry -> Come True Cafe!
  ...strip(1, 'LUXE G', 'S', 23.2, 13.8, [
    { lot: 'G360', name: 'ASTONS • HSBC AMANAH', sub: 'Western Grill & Rainforest Valet Spur', w: 11.4, bg: '#292524', fg: '#fde68a', ac: '#dc2626', st: 'dining' },
    { lot: 'G343A', name: 'DIN TAI FUNG 鼎泰豐', sub: '18-Fold Xiao Long Bao & Taiwanese Dining', w: 12.2, bg: '#7f1d1d', fg: '#fef2f2', ac: '#ef4444', st: 'dining' },
    { lot: 'G307', name: 'POLO RALPH LAUREN', sub: 'American Luxury Heritage Apparel', w: 11.4, bg: '#0c2340', fg: '#fde68a', ac: '#d4af37', st: 'luxury' },
    { lot: 'G325', name: 'BRITISHINDIA • AESOP', sub: 'Heritage Resort Tailoring & Botanical Skincare', w: 11.8, bg: '#ede6da', fg: '#1c1814', ac: '#b4944e', st: 'luxury' },
    { lot: 'G308', name: 'MICHAEL KORS', sub: 'Jet Set Handbags • Opposite Coach at Main Entrance', w: 12.8, bg: '#eae4d8', fg: '#1c1814', ac: '#b4944e', st: 'luxury' }
  ]),
  // Open GF Luxe Main Entrance / Valet Parking / Central Park Portal (`fac-luxeg-entrance`, x=79.5, w=11.0, z=23.2 — Verified #400–#402!)
  ...strip(1, 'LUXE G', 'S', 23.2, 85.4, [
    { lot: 'G345-G347', name: 'L’OCCITANE', sub: 'Provence Botanical Skincare • Opposite Madam Kwan’s', w: 10.8, bg: '#f5e8c8', fg: '#451a03', ac: '#d97706', st: 'beauty' },
    { lot: 'G342-G343', name: 'MADAM KWAN’S', sub: 'Iconic Malaysian Nasi Bojari • Next to Maybank Oval', w: 12.6, bg: '#451a03', fg: '#fde68a', ac: '#d97706', st: 'dining' },
    { lot: 'G341B', name: 'MAYBANK • LAMY', sub: 'Oval Banking Branch & German Writing Instruments', w: 11.8, bg: '#facc15', fg: '#111827', ac: '#eab308', st: 'transit' },
    { lot: 'G311-G312', name: 'LULULEMON • PURAS', sub: 'Technical Yoga Apparel & Pure Aromatherapy', w: 11.8, bg: '#881337', fg: '#ffffff', ac: '#fb7185', st: 'sports' },
    { lot: 'G314', name: 'DENZA • FRED PERRY', sub: 'Sime Darby BYD Luxury EV Showroom & British Mod', w: 13.4, bg: '#111827', fg: '#ffffff', ac: '#38bdf8', st: 'luxury' },
    { lot: 'G315', name: 'TSL 谢瑞麟 • GEOX', sub: 'Artisanal Diamonds & Italian Footwear', w: 11.8, bg: '#27201c', fg: '#fde68a', ac: '#d4af37', st: 'luxury' },
    { lot: 'G315A', name: 'COME TRUE CAFE 成真咖啡', sub: 'Oval Overlook • Soufflé Pancakes & Specialty Brew', w: 14.2, bg: '#ffffff', fg: '#14332d', ac: '#c9a66b', st: 'kopitiam' }
  ]),
  { id: 'g320-parkson', name: 'PARKSON ELITE 百盛', subtitle: 'Cosmetics • Designer Handbags • Luxury Department Store', lot: 'G320', floor: 1, wing: 'The Oval', x: 173.0, z: 0, width: 45.6, side: 'E', brandBg: '#1c1917', brandFg: '#ffffff', accent: '#d4af37', style: 'anchor' },

  // ===================== FLOOR 2: FIRST FLOOR (1F / F — 2025 Walkthrough Verified #196–#335!) =====================
  { id: 'f603a-rollerwa', name: 'ROLLERWA • CAFE DISCO', subtitle: 'Korea’s Iconic Neon Indoor Roller Rink & Cafe • 1UE', lot: 'F603A-F613', floor: 2, wing: '1 Utama E', x: -183.2, z: 0, width: 39.6, side: 'W', brandBg: '#4c1d95', brandFg: '#f5d0fe', accent: '#ec4899', style: 'rollerwa' },
  { id: 'f-ue-en', name: 'ON AIR 1 BY AFORADIO', subtitle: 'Live Broadcast Studio • Opposite RollerWa Glass Rink', lot: 'F615', floor: 2, wing: '1 Utama E', x: -130.8, z: -15.0, width: 10.2, side: 'E', brandBg: '#0f172a', brandFg: '#ffffff', accent: '#38bdf8', style: 'tech' },
  { id: 'f-ue-es', name: 'MISSION Q', subtitle: 'Immersive Escape Room & Mystery Challenges', lot: 'F625', floor: 2, wing: '1 Utama E', x: -130.8, z: 15.0, width: 10.2, side: 'E', brandBg: '#1e1b4b', brandFg: '#fef08a', accent: '#f43f5e', style: 'arcade' },
  ...strip(2, '1 Utama E', 'N', -20.2, -182.8, [
    { lot: 'F601', name: 'GAME ON SPORTS HUB', sub: 'Rainbow-Arch Entrance • Mini Golf • PS5 • Mini Bowling', w: 17.6, bg: '#1e1b4b', fg: '#67e8f9', ac: '#22d3ee', st: 'arcade' },
    { lot: 'F602-F603', name: 'NEXT GEN [FAMILY EDUTAINMENT PARK]', sub: 'Family Edutainment Park • Happy Memories Factory', w: 15.6, bg: '#f8fafc', fg: '#1e1b4b', ac: '#f43f5e', st: 'toys' },
    { lot: 'F614', name: 'VRFUN • INFINIT WAR VR', sub: 'Neon VR Shooting Arena & Arcade', w: 9.2, bg: '#3b0764', fg: '#67e8f9', ac: '#ec4899', st: 'arcade' },
    { lot: 'F613A', name: 'TAISHI PLANET', sub: 'Claw Machines & Collectible Arcade', w: 8.8, bg: '#581c87', fg: '#fef08a', ac: '#ec4899', st: 'arcade' }
  ]),
  // 1UE 1F South: Verified #243–#245 exact sequence: Kakiseni Junior (F617A) -> Yamaha Music (F618) -> Little Art Studio -> Tutu Toe (F620-F622) -> Mission-Q (F625)!
  ...strip(2, '1 Utama E', 'S', 20.2, -182.8, [
    { lot: 'F617A', name: 'KAKISENI JUNIOR', sub: 'Malaysian Performing Arts • Adjacent to Yamaha Music', w: 12.8, bg: '#1e293b', fg: '#f8fafc', ac: '#f59e0b', st: 'gallery' },
    { lot: 'F618', name: 'YAMAHA MUSIC SCHOOL', sub: 'Pianos • Guitars • Music Academy', w: 12.8, bg: '#3b0764', fg: '#ffffff', ac: '#c084fc', st: 'tech' },
    { lot: 'F619', name: 'LITTLE PALETTE STUDIO', sub: 'Kids Art & Creative Workshop', w: 12.8, bg: '#0e7490', fg: '#ffffff', ac: '#38bdf8', st: 'toys' },
    { lot: 'F620-F622', name: 'TUTU TOE DANCE ACADEMY', sub: 'Ballet • Contemporary & K-Pop Dance Studio', w: 12.8, bg: '#fdf2f8', fg: '#831843', ac: '#ec4899', st: 'beauty' }
  ]),

  // Old Wing 1F (2025 Walkthrough Verified #206–#224: F101 Nitori + F101A Jardin -> Uniqlo -> Cheetah -> Nichii -> Brands Outlet [orange-red!] -> Vincci [warm white!] & South: F142 Neal's Yard -> Melvita -> HOOGA -> iORA -> F136 -> The Face Shop -> ELLE -> Felancy -> Christy Ng!)
  { id: 'f101-nitori', name: 'NITORI 日本ニトリ', subtitle: 'Japanese Furniture • F101A Jardin Coffee & Tea', lot: 'F101', floor: 2, wing: 'Old Wing', x: -125.8, z: -15.8, width: 12.4, side: 'W', brandBg: '#0d9488', brandFg: '#ffffff', accent: '#5eead4', style: 'furniture' },
  { id: 'f142-nealsyard', name: 'NEAL’S YARD REMEDIES', subtitle: 'Organic Botanical Skincare • Melvita Adjacent', lot: 'F142', floor: 2, wing: 'Old Wing', x: -125.8, z: 15.8, width: 12.4, side: 'W', brandBg: '#1e3a8a', brandFg: '#ffffff', accent: '#60a5fa', style: 'beauty' },
  { id: 'f125-aeon', name: 'AEON', subtitle: 'Fashion Department Store • Mens & Ladies', lot: 'F125', floor: 2, wing: 'Old Wing', x: -29.2, z: -15.8, width: 12.4, side: 'E', brandBg: '#831843', brandFg: '#ffffff', accent: '#f472b6', style: 'anchor' },
  { id: 'f125b-aeon', name: 'AEON STYLE', subtitle: 'Shoes • Handbags • Travel Accessories', lot: 'F125B', floor: 2, wing: 'Old Wing', x: -29.2, z: 15.8, width: 12.4, side: 'E', brandBg: '#9d174d', brandFg: '#ffffff', accent: '#f472b6', style: 'anchor' },
  { id: 'f301-clarins', name: 'CLARINS', subtitle: 'French Plant-Based Skincare • Opposite Rocku Yakiniku', lot: 'F301', floor: 2, wing: 'New Wing 1F', x: 13.4, z: -16.4, width: 13.2, side: 'W', brandBg: '#991b1b', brandFg: '#ffffff', accent: '#fca5a5', style: 'beauty' },
  { id: 'f355-rocku', name: 'ROCKU YAKINIKU', subtitle: 'Japanese Charcoal Yakiniku • Opposite Clarins & 1F WC', lot: 'F355-F357', floor: 2, wing: 'Rainforest', x: 13.4, z: 16.4, width: 13.2, side: 'W', brandBg: '#1c1917', brandFg: '#fde68a', accent: '#f59e0b', style: 'japanese' },

  ...strip(2, 'Old Wing', 'N', -22.2, -125.2, [
    { lot: 'F102', name: 'UNIQLO', sub: 'Upper Duplex • UT Graphic Tees • Kids', w: 18.0, bg: '#dc2626', fg: '#ffffff', ac: '#ffffff', st: 'fashion' },
    { lot: 'F107', name: 'GIORDANO • F102C', sub: 'Minimalist Everyday Essentials & Fine Jewellery', w: 9.6, bg: '#1e293b', fg: '#ffffff', ac: '#38bdf8', st: 'fashion' },
    { lot: 'F111', name: 'CHEETAH', sub: 'Casual Menswear & Active Lifestyle', w: 10.6, bg: '#111827', fg: '#f8fafc', ac: '#f59e0b', st: 'fashion' },
    { lot: 'F116A-F117', name: 'NICHII', sub: 'Modern Malaysian Ladies Fashion', w: 10.6, bg: '#ede6da', fg: '#18181b', ac: '#b4944e', st: 'fashion' },
    { lot: 'F118', name: 'BRANDS OUTLET (BO)', sub: 'Bright Orange-Red Casual Streetwear Megastore', w: 18.8, bg: '#ea580c', fg: '#ffffff', ac: '#fef08a', st: 'fashion' },
    { lot: 'F120', name: 'VINCCI', sub: 'Minimalist Ivory Footwear & Handbags Flagship', w: 13.4, bg: '#f4efe6', fg: '#1c1814', ac: '#b4944e', st: 'luxury' },
    { lot: 'F121-F123', name: 'CHRISTY NG • FELANCY', sub: 'Designer Tote Studio & Lingerie Boutique', w: 13.6, bg: '#f4efe6', fg: '#1c1814', ac: '#b4944e', st: 'luxury' }
  ]),
  ...strip(2, 'Old Wing', 'S', 22.2, -125.2, [
    { lot: 'F140', name: 'MELVITA • HOOGA', sub: 'French Organic Beauty & Scandinavian Home Living', w: 12.2, bg: '#3f3f46', fg: '#fef3c7', ac: '#fbbf24', st: 'furniture' },
    { lot: 'F139', name: 'iORA', sub: 'Minimalist Tailored Knits • Opposite Caudalie Pavilion', w: 10.6, bg: '#efe8df', fg: '#1c1814', ac: '#8b6a44', st: 'fashion' },
    { lot: 'F136', name: 'THE FACE SHOP • F136', sub: 'K-Beauty belif Skincare & Hair Accessories', w: 14.8, bg: '#1e3a8a', fg: '#ffffff', ac: '#60a5fa', st: 'beauty' },
    { lot: 'F133A', name: 'ELLE • DENNI & CO', sub: 'Parisian Contemporary Womenswear & Accessories', w: 12.6, bg: '#18181b', fg: '#ffffff', ac: '#e4e4e7', st: 'fashion' }
  ]),
  ...strip(2, 'Old Wing', 'S', 22.2, -68.0, [
    { lot: 'F130C', name: 'OUTPOZT • DIAMOND', sub: 'Streetwear Concept & Bridal Solitaires', w: 9.5, bg: '#1e1b4b', fg: '#e0e7ff', ac: '#a78bfa', st: 'luxury' },
    { lot: 'F131', name: 'WACOAL • NYONYA COLORS', sub: 'Intimates & Traditional Nyonya Kuih Gallery', w: 9.5, bg: '#831843', fg: '#fce7f3', ac: '#f472b6', st: 'fashion' },
    { lot: 'F128', name: 'MUJI 無印良品', sub: 'Upper Duplex • Oak Furniture & Stationery', w: 10.2, bg: '#7f1d1d', fg: '#ffffff', ac: '#d6d3d1', st: 'furniture' },
    { lot: 'F126-F127', name: 'WONG KOK CHAR CHAN TENG', sub: 'Hong Kong Iced Milk Tea & Baked Cheese Rice', w: 9.0, bg: '#991b1b', fg: '#fef08a', ac: '#f59e0b', st: 'kopitiam' }
  ]),

  // 1F Promenade Bridge (2025 Walkthrough Verified #201–#205, #279–#284, #301–#303: Same-wall Makii Makii -> Salon -> BEGA -> Drum -> Sun Paradise OPPOSITE CU -> Clarks -> Rip Curl -> Ecesis!)
  ...strip(2, '1F Promenade', 'N', -10.2, -27.5, [
    { lot: 'F202-F203', name: 'CU • VARZO', sub: 'South Korean Convenience • K-Corn Dogs', w: 9.6, bg: '#4c1d95', fg: '#bef264', ac: '#a3e635', st: 'supermarket' },
    { lot: 'F216', name: 'CLARKS', sub: 'British Heritage Comfort Footwear', w: 9.6, bg: '#292524', fg: '#f5f5f4', ac: '#fbbf24', st: 'fashion' },
    { lot: 'F217', name: 'RIP CURL • TANGOO', sub: 'Surfwear • Boards & Resort Apparel', w: 9.6, bg: '#0e7490', fg: '#ffffff', ac: '#38bdf8', st: 'sports' },
    { lot: 'F220', name: 'ECESIS • TIMEKEEPER', sub: 'Garmin • Contemporary Watches & Eyewear', w: 9.6, bg: '#1e293b', fg: '#f8fafc', ac: '#94a3b8', st: 'luxury' }
  ]),
  ...strip(2, '1F Promenade', 'S', 10.2, -27.5, [
    { lot: 'F223B', name: 'MAKII MAKII', sub: 'Fresh Handcrafted Japanese Maki Rolls', w: 9.6, bg: '#1c1917', fg: '#fde68a', ac: '#ef4444', st: 'japanese' },
    { lot: 'F223A', name: 'SALON • STYLE BY BEGA', sub: 'Hair Atelier & Contemporary Womenswear (F221B)', w: 9.6, bg: '#ede6da', fg: '#1c1814', ac: '#b4944e', st: 'fashion' },
    { lot: 'F221A', name: 'DRUM', sub: 'Urban Youth Fashion & Streetwear', w: 9.6, bg: '#18181b', fg: '#ffffff', ac: '#e4e4e7', st: 'fashion' },
    { lot: 'F221', name: 'SUN PARADISE', sub: 'Arena • LP • TUSA Swimwear & Aquatic Gear', w: 9.6, bg: '#09090b', fg: '#ffffff', ac: '#38bdf8', st: 'sports' }
  ]),

  // New Wing 1F: 2025 Walkthrough Verified (#196–#200, #304–#335: F305 OUTPOZT -> SEMIR -> MANGO -> BUTTONSCARVES -> PULL&BEAR -> HLA -> DECATHLON right next to PARKSON ELITE F320!)
  ...strip(2, 'New Wing 1F', 'N', -23.2, 13.8, [
    { lot: 'F305', name: 'OUTPOZT • INFINITE WATCH', sub: 'Fashion Concept Store & Longines/Tissot Corner', w: 14.2, bg: '#18181b', fg: '#ffffff', ac: '#f59e0b', st: 'fashion' },
    { lot: 'F307', name: 'SEMIR • QUIKSILVER', sub: 'Youth Apparel & Surf Lifestyle', w: 11.4, bg: '#1e293b', fg: '#ffffff', ac: '#38bdf8', st: 'fashion' },
    { lot: 'F308-F309', name: 'MANGO', sub: 'Barcelona Contemporary Fashion', w: 11.8, bg: '#18181b', fg: '#ffffff', ac: '#e4e4e7', st: 'fashion' },
    { lot: 'F311', name: 'BUTTONSCARVES • DYSON', sub: 'Modest Couture & Airwrap Demo Lab', w: 11.4, bg: '#111318', fg: '#f8fafc', ac: '#ec4899', st: 'tech' },
    { lot: 'F313', name: 'PULL&BEAR', sub: 'Youth Urban Streetwear • Opposite Juice Works', w: 12.0, bg: '#1e293b', fg: '#ffffff', ac: '#38bdf8', st: 'fashion' },
    { lot: 'F313A-F315', name: 'HLA CONCEPT STORE', sub: 'Modern Menswear • Opposite Yomaro', w: 12.4, bg: '#111827', fg: '#ffffff', ac: '#94a3b8', st: 'fashion' },
    { lot: 'F317-F318', name: 'BENJAMIN BARKER • G2000', sub: 'Tailored Menswear & Smart Office Attire', w: 12.0, bg: '#27272a', fg: '#ffffff', ac: '#e4e4e7', st: 'fashion' },
    { lot: 'F328', name: 'SHU UEMURA', sub: 'Tokyo Make-Up Artistry Atelier • Oval Entry', w: 11.2, bg: '#14171f', fg: '#ffffff', ac: '#f472b6', st: 'beauty' },
    { lot: 'F330-F331', name: 'SOMETIME • PADINI CONCEPT', sub: 'Seed • Padini Authentics • Sometime Bags (Oval Arc)', w: 20.4, bg: '#09090b', fg: '#ffffff', ac: '#e4e4e7', st: 'fashion' },
    { lot: 'F333', name: 'SAMSONITE • TOMAZ', sub: 'Luxury Travel Luggage & Menswear • Oval', w: 13.6, bg: '#0f172a', fg: '#f8fafc', ac: '#38bdf8', st: 'luxury' },
    { lot: 'F319', name: 'DECATHLON', sub: 'Giant Blue LED Wall • Directly Adjacent to Parkson Elite!', w: 26.8, bg: '#1d4ed8', fg: '#ffffff', ac: '#60a5fa', st: 'sports' }
  ]),
  // 1F South: Verified #199, #304–#305, #312–#318, #334: Nando's -> 1F Starbucks -> XIXILI -> SWAROVSKI -> PANDORA -> ANTE -> LA SENZA -> VICTORIA'S SECRET -> Oval: BREO -> SELECTIV -> WAH CHAN -> CHEEVIT CHEEVA -> TANYU -> ECCO -> BATH & BODY WORKS!
  ...strip(2, 'New Wing 1F', 'S', 23.2, 13.8, [
    { lot: 'F351', name: 'NANDO’S', sub: 'Flame-Grilled PERi-PERi Chicken • Next to 1F Starbucks', w: 11.2, bg: '#211915', fg: '#ffffff', ac: '#ef4444', st: 'dining' },
    { lot: 'F352', name: 'STARBUCKS • SHAKE SHACK', sub: 'Rainforest Canopy Coffee & Burgers', w: 11.2, bg: '#14532d', fg: '#ffffff', ac: '#4ade80', st: 'dining' },
    { lot: 'F349-F350', name: 'XIXILI', sub: 'Malaysian Designer Lingerie • Highstreet South', w: 10.6, bg: '#4c0519', fg: '#fce7f3', ac: '#f472b6', st: 'fashion' },
    { lot: 'F348', name: 'SWAROVSKI', sub: 'Austrian Precision-Cut Crystal Salon', w: 10.2, bg: '#1e1b4b', fg: '#fdf2f8', ac: '#f9a8d4', st: 'luxury' },
    { lot: 'F346A', name: 'PANDORA', sub: 'Hand-Finished Jewellery • Adjacent to ANTE', w: 10.2, bg: '#f5f0ea', fg: '#1c1814', ac: '#f472b6', st: 'luxury' },
    { lot: 'F346', name: 'ANTE', sub: 'Chargrilled Pork Steaks • Between Pandora & La Senza', w: 11.2, bg: '#292524', fg: '#fde68a', ac: '#f59e0b', st: 'dining' },
    { lot: 'F353', name: 'LA SENZA', sub: 'Contemporary Intimates & Loungewear', w: 10.2, bg: '#4c0519', fg: '#ffffff', ac: '#fb7185', st: 'fashion' },
    { lot: 'F343-F343A', name: 'VICTORIA’S SECRET', sub: 'Fine Fragrances & Lingerie Flagship', w: 12.2, bg: '#831843', fg: '#fce7f3', ac: '#f472b6', st: 'beauty' },
    { lot: 'F338A-F339A', name: 'BREO • SELECTIV', sub: 'Smart Wellness Massagers & Fine Perfumery (Oval)', w: 12.4, bg: '#1e293b', fg: '#f8fafc', ac: '#38bdf8', st: 'beauty' },
    { lot: 'F335', name: 'WAH CHAN GOLDSMITH', sub: '916 Fine Gold & Diamond Boutique • Oval', w: 11.4, bg: '#451a03', fg: '#fde047', ac: '#eab308', st: 'luxury' },
    { lot: 'F336', name: 'CHEEVIT CHEEVA', sub: 'Chiang Mai Bingsu Café • Adjacent to TanYu', w: 11.4, bg: '#ede6da', fg: '#231b15', ac: '#b4944e', st: 'kopitiam' },
    { lot: 'F337-F338', name: 'TANYU GRILLED FISH 探鱼', sub: 'Chongqing Charcoal Grilled Fish • Oval Alcove', w: 12.4, bg: '#7f1d1d', fg: '#fde047', ac: '#ef4444', st: 'dining' },
    { lot: 'F341', name: 'ECCO', sub: 'Danish Comfort Leather • Adjacent to Bath & Body Works', w: 11.2, bg: '#ede6da', fg: '#1c1814', ac: '#8b6a44', st: 'luxury' },
    { lot: 'F342', name: 'BATH & BODY WORKS', sub: '3-Wick Candles & Fine Fragrance Mists • Oval Ring', w: 11.2, bg: '#1e3a8a', fg: '#ffffff', ac: '#60a5fa', st: 'beauty' }
  ]),
  { id: 'f320-parkson', name: 'PARKSON ELITE (APPAREL & MENSWEAR)', subtitle: 'Polo Ralph Lauren • Braun Büffel • Adjacent to Decathlon', lot: 'F320', floor: 2, wing: 'The Oval', x: 173.0, z: 0, width: 45.6, side: 'E', brandBg: '#09090b', brandFg: '#fde047', accent: '#eab308', style: 'anchor' },

  // ===================== FLOOR 3: SECOND FLOOR (2F / S — 2025 Walkthrough Verified #001–#194!) =====================
  { id: 's611-pjpac', name: 'PJPAC PERFORMING ARTS CENTRE', subtitle: 'Stage 1 Proscenium Theatre • Nero Space • The Theatre Café (2F–3F)', lot: 'S611', floor: 3, wing: '1 Utama E', x: -183.2, z: 0, width: 39.6, side: 'W', brandBg: '#09090b', brandFg: '#fde68a', accent: '#f59e0b', style: 'cinema' },
  { id: 's-ue-en', name: 'F.O.S • BABYSHOP', subtitle: 'Factory Outlet Store & Baby Apparel • FlowRider View', lot: 'S620', floor: 3, wing: '1 Utama E', x: -130.8, z: -15.0, width: 10.2, side: 'E', brandBg: '#7f1d1d', brandFg: '#ffffff', accent: '#f87171', style: 'fashion' },
  { id: 's-ue-es', name: 'MONSOON-ID • PLAYTIME', subtitle: 'Hair Salon & Kids Playground • By 2F Restrooms', lot: 'SF1UEPK', floor: 3, wing: '1 Utama E', x: -130.8, z: 15.0, width: 10.2, side: 'E', brandBg: '#065f46', brandFg: '#fef08a', accent: '#34d399', style: 'toys' },
  ...strip(3, '1 Utama E', 'N', -20.2, -182.8, [
    { lot: 'S601', name: 'WINDLAB INDOOR SKYDIVING', sub: '14,000-ft Freefall Vertical Glass Wind Tunnel', w: 22.0, bg: '#111318', fg: '#ffffff', ac: '#f97316', st: 'skydiving' },
    { lot: 'S603-S610', name: 'NEXT GEN [FAMILY EDUTAINMENT PARK]', sub: 'Happy Memories Factory • Kids Cafe • Ninja Challenge', w: 16.0, bg: '#f8fafc', fg: '#1e1b4b', ac: '#f43f5e', st: 'toys' }
  ]),
  // Open 8.6m sunlit terrace portal at x=-144.7..-136.1 leading directly out onto Outdoor Saranghae Finger-Heart / Skywalker Rooftop Bridge!
  ...strip(3, '1 Utama E', 'S', 20.2, -182.8, [
    { lot: 'S606', name: 'NEXT GEN NINJA ARENA', sub: 'Trampoline Zone • Climbing • Kids Cafe & Arcade', w: 25.8, bg: '#f8fafc', fg: '#1e1b4b', ac: '#38bdf8', st: 'toys' },
    { lot: 'SF1UE', name: 'LEGO® CERTIFIED STORE • KIDDO', sub: 'Brick Models • Collectibles • Saranghae Corridor', w: 25.8, bg: '#dc2626', fg: '#fef08a', ac: '#facc15', st: 'toys' }
  ]),

  // Old Wing 2F (2025 Walkthrough Verified #033–#075, #136–#139: Harvey Norman [dark charcoal!] opposite LEGO -> Gintell (S142, opposite TGV escalator!) -> Toys"R"Us (S140) -> Fipper (S139) -> Energized -> Wondermama (S131) -> Hokkaido Sushi (S129) -> Soxworld (S126A) & North: ITone Superstore [red] -> SIGNATURE -> Crystal Corner -> Popular -> Fei Fan!)
  { id: 's101-harvey', name: 'HARVEY NORMAN', subtitle: 'OLED TVs • Gaming PCs • Italian Sofas • Bedding', lot: 'S101', floor: 3, wing: 'Old Wing', x: -125.8, z: -15.8, width: 12.4, side: 'W', brandBg: '#1c1917', brandFg: '#ffffff', accent: '#dc2626', style: 'tech' },
  { id: 's101b-lego', name: 'LEGO® CERTIFIED STORE', subtitle: 'Brick Sets • Star Wars • Technic • Opposite Harvey Norman', lot: 'S101B', floor: 3, wing: 'Old Wing', x: -125.8, z: 15.8, width: 12.4, side: 'W', brandBg: '#dc2626', brandFg: '#fef08a', accent: '#facc15', style: 'toys' },
  { id: 's125-aeon', name: 'AEON HOME', subtitle: 'Bedding • Cookware • LEGO Area & Kids World', lot: 'S125', floor: 3, wing: 'Old Wing', x: -29.2, z: -15.8, width: 12.4, side: 'E', brandBg: '#831843', brandFg: '#ffffff', accent: '#f472b6', style: 'furniture' },
  { id: 's125b-aeon', name: 'AEON LIVING', subtitle: 'Japanese Tableware • First Avenue Link Wing', lot: 'S125B', floor: 3, wing: 'Old Wing', x: -29.2, z: 15.8, width: 12.4, side: 'E', brandBg: '#831843', brandFg: '#fce7f3', accent: '#f472b6', style: 'furniture' },
  // 2F Rainforest-West North is now recessed Lift Lobby + Restrooms (`fac-rf-2f-wc`, Verified #025!), South is Under Armour right next to Food District (#025!)
  { id: 's347a-ua-w', name: 'UNDER ARMOUR', subtitle: 'Brand House • Immediately West of Food District (#025)', lot: 'S347A-S348', floor: 3, wing: 'Rainforest', x: 13.4, z: 16.4, width: 13.2, side: 'W', brandBg: '#09090b', brandFg: '#ffffff', accent: '#dc2626', style: 'sports' },

  ...strip(3, 'Old Wing', 'N', -22.2, -125.2, [
    { lot: 'S103', name: 'KEDAI PERMAINAN • CRYSTAL', sub: 'Console Gaming • Switch & Crystal Corner', w: 9.5, bg: '#1e293b', fg: '#f8fafc', ac: '#38bdf8', st: 'toys' },
    { lot: 'S106', name: 'SIGNATURE', sub: 'Bespoke Culinary Cabinets • Adjacent to ITone', w: 10.5, bg: '#292524', fg: '#fde68a', ac: '#f59e0b', st: 'furniture' },
    { lot: 'S109', name: 'ITone SUPERSTORE', sub: 'ASUS • Lenovo • MSI Gaming Laptops (Red Fascia)', w: 10.5, bg: '#dc2626', fg: '#ffffff', ac: '#fef08a', st: 'tech' },
    { lot: 'S113A', name: 'U-TWO • DIRS', sub: 'Contemporary Streetwear • Opposite llaollao.', w: 10.5, bg: '#18181b', fg: '#ffffff', ac: '#d4af37', st: 'fashion' },
    { lot: 'S108', name: 'LE CREUSET • DREAME', sub: 'French Cast Iron Cookware & Smart Home Tech', w: 10.5, bg: '#c2410c', fg: '#ffffff', ac: '#fdba74', st: 'kitchenware' },
    { lot: 'S116', name: 'POPULAR BOOKSTORE', sub: 'Fiction • Manga • Stationery • Gadgets', w: 18.2, bg: '#b91c1c', fg: '#ffffff', ac: '#fca5a5', st: 'books' },
    { lot: 'S120A', name: 'BEAUMEDICA • HONEYPOT', sub: 'Wellness & Beauty Wing Toward First Avenue Link', w: 11.4, bg: '#ede6da', fg: '#1c1814', ac: '#b4944e', st: 'beauty' },
    { lot: 'S122', name: 'FEI FAN HOTPOT', sub: 'Hong Kong Artisan Hotpot Buffet', w: 13.6, bg: '#7f1d1d', fg: '#fde047', ac: '#f59e0b', st: 'dining' }
  ]),
  ...strip(3, 'Old Wing', 'S', 22.2, -125.2, [
    { lot: 'S142', name: 'GINTELL', sub: 'Massage Chairs • Directly Opposite TGV IMAX Escalator', w: 10.8, bg: '#1e1b4b', fg: '#fde68a', ac: '#eab308', st: 'furniture' },
    { lot: 'S140', name: 'TOYS“R”US', sub: 'LEGO • Nerf • Barbie • Gachapon Wall', w: 18.0, bg: '#1d4ed8', fg: '#fef08a', ac: '#facc15', st: 'toys' },
    { lot: 'S139', name: 'FIPPER • ENERGIZED', sub: 'Natural Rubber Sandals & Pastel Athleisure', w: 10.6, bg: '#451a03', fg: '#fef3c7', ac: '#f59e0b', st: 'sports' },
    { lot: 'S135', name: 'MOTHERCARE', sub: 'Baby Strollers, Nursery & Maternity', w: 9.6, bg: '#0e7490', fg: '#ffffff', ac: '#38bdf8', st: 'toys' },
    { lot: 'S131', name: 'WONDERMAMA', sub: 'Malaysian Fusion Dining • Cyan Neon Wall', w: 11.6, bg: '#0f172a', fg: '#67e8f9', ac: '#22d3ee', st: 'dining' },
    { lot: 'S129', name: 'HOKKAIDO SUSHI 北海道寿司', sub: 'Wood-Slat Japanese Sushi & Lantern Dining', w: 12.6, bg: '#451a03', fg: '#fde68a', ac: '#f59e0b', st: 'japanese' },
    { lot: 'S126A', name: 'SOXWORLD • THE NAIL SHOP', sub: 'Hosiery & Nail Atelier • Opposite myNEWS Kiosk', w: 14.8, bg: '#7f1d1d', fg: '#ffffff', ac: '#fb7185', st: 'fashion' }
  ]),

  // 2F Promenade Bridge (2025 Walkthrough Verified #026–#032, #140–#145: Trapo -> Inside Scoop -> Shins -> Res|Toe|Run -> Hypergear -> Celebrity Fitness S-216A -> Kipling & South: Good2U opposite Samsung SK2A -> S222 Dzi Kingdom -> The North Face!)
  ...strip(3, '2F Promenade', 'N', -10.2, -27.5, [
    { lot: 'S202D', name: 'TRAPO • INSIDE SCOOP', sub: 'Automotive Mats & Musang King Ice Cream (East of Trapo)', w: 9.6, bg: '#ca8a04', fg: '#18181b', ac: '#fef08a', st: 'bakery' },
    { lot: 'S212', name: 'SHINS • RES|TOE|RUN', sub: 'Beauty Megastore & Protruding Red Footwear Box', w: 9.6, bg: '#b91c1c', fg: '#ffffff', ac: '#ef4444', st: 'sports' },
    { lot: 'S213A', name: 'HYPERGEAR • ITSU', sub: 'Waterproof Bags & Wellness Massage Chairs', w: 9.6, bg: '#111827', fg: '#ffffff', ac: '#38bdf8', st: 'sports' },
    { lot: 'S216A', name: 'CELEBRITY FITNESS • KIPLING', sub: 'Pusat Gimnasium S-216A & Live Light Travel Bags', w: 9.6, bg: '#18181b', fg: '#ffffff', ac: '#ef4444', st: 'gym' }
  ]),
  ...strip(3, '2F Promenade', 'S', 10.2, -27.5, [
    { lot: 'S215', name: 'TOMTOC • MVP SPORTS', sub: 'Tech Carry Bags & Athletic Footwear', w: 9.6, bg: '#1e3a8a', fg: '#ffffff', ac: '#60a5fa', st: 'sports' },
    { lot: 'S221', name: 'GOOD2U CONCEPT STORE', sub: 'Value Fashion • Directly Opposite SK2A Samsung', w: 9.6, bg: '#18181b', fg: '#ffffff', ac: '#facc15', st: 'fashion' },
    { lot: 'S222', name: 'DZI KINGDOM', sub: 'Tibetan Dzi Beads & Feng Shui Jewellery (LOT-S222)', w: 9.6, bg: '#451a03', fg: '#fde047', ac: '#eab308', st: 'luxury' },
    { lot: 'S218', name: 'THE NORTH FACE • CONVERSE', sub: 'Summit Exploration & Streetwear • Promenade Entry', w: 9.6, bg: '#18181b', fg: '#ffffff', ac: '#ef4444', st: 'sports' }
  ]),

  // New Wing 2F: 2025 Walkthrough Verified (#023–#025, #146–#194: North ASICS -> JD -> OPPO -> NIKE/BATA -> MACHINES -> CUCKOO -> CHILI'S -> PHỞ VIETZ -> CILI KAMPUNG -> DRAGON-I -> GETHÁ -> MR. D.I.Y. beside PARKSON ELITE!)
  ...strip(3, 'New Wing 2F', 'N', -23.2, 13.8, [
    { lot: 'S302', name: 'ASICS', sub: 'Gel-Kayano Running • Directly Opposite Food District', w: 10.4, bg: '#1e3a8a', fg: '#ffffff', ac: '#60a5fa', st: 'sports' },
    { lot: 'S303A-S303B', name: 'NEW BALANCE', sub: 'Made in USA 990 • Lifestyle Trainers', w: 9.6, bg: '#27272a', fg: '#ffffff', ac: '#ef4444', st: 'sports' },
    { lot: 'S305A', name: 'JD SPORTS', sub: 'King of Trainers • Opposite Highstreet Escalators', w: 10.2, bg: '#09090b', fg: '#fef08a', ac: '#facc15', st: 'sports' },
    { lot: 'S305B', name: 'OPPO', sub: 'Find X Flagship • Opposite Häagen-Dazs Booth', w: 9.4, bg: '#14532d', fg: '#ffffff', ac: '#22c55e', st: 'tech' },
    { lot: 'S306-S308', name: 'NIKE • BATA (S306A)', sub: 'Running • Jordan • Football & Soft Walk', w: 19.6, bg: '#111111', fg: '#ffffff', ac: '#fb923c', st: 'sports' },
    { lot: 'S309-S310', name: 'MACHINES', sub: 'Apple Premium Partner • Opposite Starship Galactica', w: 16.4, bg: '#d8dee6', fg: '#111827', ac: '#38bdf8', st: 'tech' },
    { lot: 'S310B', name: 'CUCKOO', sub: 'Smart Water Purifiers & Napure A Series Mattresses', w: 10.4, bg: '#7f1d1d', fg: '#ffffff', ac: '#ef4444', st: 'tech' },
    { lot: 'S310A', name: 'CHILI’S GRILL & BAR', sub: 'Sizzling Fajitas & American Grill', w: 11.4, bg: '#7f1d1d', fg: '#fef3c7', ac: '#ef4444', st: 'dining' },
    { lot: 'S312', name: 'PHỞ VIETZ', sub: 'Authentic Saigon Beef Pho & Iced Drip Coffee', w: 9.6, bg: '#1c1917', fg: '#fde047', ac: '#eab308', st: 'dining' },
    { lot: 'S313', name: 'CILI KAMPUNG', sub: 'Rattan-Weave Langkawi Masak Lemak Cili Api', w: 10.4, bg: '#2b2019', fg: '#fde68a', ac: '#f59e0b', st: 'dining' },
    { lot: 'S313A', name: 'DRAGON-I', sub: 'Xiao Long Bao & La Mian • Facing Sushi Zanmai', w: 11.2, bg: '#7f1d1d', fg: '#fde68a', ac: '#ef4444', st: 'dining' },
    { lot: 'S317', name: 'GETHÁ • SOTHYS PARIS', sub: 'Sleep Kingdom Natural Latex Mattresses & Spa', w: 10.0, bg: '#1e3a8a', fg: '#ffffff', ac: '#60a5fa', st: 'furniture' },
    { lot: 'S319', name: 'MR. D.I.Y.', sub: 'Hardware • Home Improvement • Beside Parkson Elite!', w: 18.8, bg: '#0b0c10', fg: '#facc15', ac: '#dc2626', st: 'books' }
  ]),
  // 2F South: Food District (Rainforest Bridge Edge #009!) -> outside (S343) -> Salomon (S342) -> Birkenstock (S341) -> PUMA (S345) -> KAISON (S335A taupe wood!) -> VICTORIA FACELIFT -> POP MART (S333 HOT PINK!) -> REMAX (S332A) -> [Sensory Pod & Baby Room] -> HONOR -> TOP TOY (S330) -> PONEY / TREEHOUSE -> HOBILITY (S322) -> PARKSON ELITE!
  ...strip(3, 'New Wing 2F', 'S', 23.2, 13.8, [
    { lot: 'S346-S347', name: 'FOOD DISTRICT', sub: 'Pork-Free Artisan Food Hall on Rainforest Bridge Edge', w: 22.0, bg: '#141519', fg: '#ffffff', ac: '#d95d2b', st: 'kopitiam' },
    { lot: 'S343', name: 'outside', sub: 'Keen • Patagonia • Outdoor Expedition Lifestyle', w: 10.6, bg: '#d9c5a5', fg: '#ffffff', ac: '#facc15', st: 'sports' },
    { lot: 'S342', name: 'SALOMON', sub: 'Trail Running Footwear & Alpine Performance', w: 9.8, bg: '#18181b', fg: '#ffffff', ac: '#38bdf8', st: 'sports' },
    { lot: 'S341', name: 'BIRKENSTOCK • GAAGOOKIDS', sub: 'German Cork Footbeds & Kids Apparel (2F #151!)', w: 10.4, bg: '#1e3a8a', fg: '#ffffff', ac: '#93c5fd', st: 'fashion' },
    { lot: 'S345', name: 'PUMA • GUESS KIDS', sub: 'Nitro Running & Motorsport Streetwear', w: 11.0, bg: '#09090b', fg: '#ffffff', ac: '#dc2626', st: 'sports' },
    { lot: 'S335A', name: 'KAISON', sub: 'Warm Taupe-Wood Home Décor & Florals (#163!)', w: 11.2, bg: '#9c856b', fg: '#ffffff', ac: '#e8dcc8', st: 'furniture' },
    { lot: 'S333', name: 'POP MART', sub: 'Hot-Pink Labubu • Molly • Skullpanda Flagship (#165!)', w: 14.8, bg: '#ec1878', fg: '#ffffff', ac: '#f472b6', st: 'toys' },
    { lot: 'S332A', name: 'REMAX • VICTORIA FACELIFT', sub: 'Smart Gadgets & Beauty • Next to Oval Escalator', w: 10.6, bg: '#1e293b', fg: '#ffffff', ac: '#38bdf8', st: 'tech' },
    { lot: 'S328', name: 'HONOR • JUNIOR LOOKBOOK', sub: 'Magic Flagship Store & Kids Luxury (S-320A)', w: 11.2, bg: '#111827', fg: '#ffffff', ac: '#60a5fa', st: 'tech' },
    { lot: 'S330', name: 'TOP TOY • SIAM OASIS', sub: 'Global Trendy Toys & Thai Wellness Sanctuary', w: 12.6, bg: '#7dd3fc', fg: '#ffffff', ac: '#ec4899', st: 'toys' },
    { lot: 'S322', name: 'HOBILITY • TREEHOUSE', sub: 'Japanese Figures • Outpost Uniform • Colour Culture', w: 12.4, bg: '#312e81', fg: '#f5d0fe', ac: '#c084fc', st: 'toys' }
  ]),
  // 2F Oval `SENSORY POD` & `BABY ROOM` + ONECARD Concierge occupy remaining 2F Oval South span cleanly (x=151.6..172.6)!
  { id: 's320-parkson', name: 'PARKSON ELITE (HOME & KIDS LIVING)', subtitle: 'Fine Bedding • Porcelain • Luggage & Nursery', lot: 'S320', floor: 3, wing: 'The Oval', x: 173.0, z: 0, width: 45.6, side: 'E', brandBg: '#09090b', brandFg: '#fde047', accent: '#eab308', style: 'furniture' },

  // ===================== FLOOR 4: THIRD FLOOR (3F — EZ / OV / T — 2025 Walkthrough Verified #036–#042, #087–#106!) =====================
  { id: 't601-nextgen', name: 'PJPAC LEVEL 3 • NEXTGEN MEZZANINE', subtitle: 'Stage 1 Upper Balcony • The Lounge • The Terrace & VR Arena', lot: 'T601', floor: 4, wing: '1 Utama E', x: -183.2, z: 0, width: 39.6, side: 'W', brandBg: '#4c1d95', brandFg: '#fef08a', accent: '#f472b6', style: 'arcade' },
  { id: 't-ue-en', name: '1UE 3F PANORAMIC MRT OVERLOOK', subtitle: 'Glazed Viewing Deck Overlooking MRT Kajang Line & Rooftop Deck', lot: 'T601A', floor: 4, wing: '1 Utama E', x: -130.8, z: -15.0, width: 10.2, side: 'E', brandBg: '#0f172a', brandFg: '#e0f2fe', accent: '#38bdf8', style: 'gallery' },
  ...strip(4, '1 Utama E', 'N', -20.2, -182.8, [
    { lot: 'T601-N', name: 'NEXTGEN VR ARENA & SIM RACING', sub: 'Hologate VR • Motion Cockpits • E-Sports', w: 51.6, bg: '#1e1b4b', fg: '#67e8f9', ac: '#38bdf8', st: 'arcade' }
  ]),
  ...strip(4, '1 Utama E', 'S', 20.2, -182.8, [
    { lot: 'T601-S', name: 'PJPAC THE TERRACE & PARTY SUITES', sub: 'Sky Rooftop Deck Above Saranghae • One World Pool View', w: 51.6, bg: '#312e81', fg: '#fbcfe8', ac: '#ec4899', st: 'dining' }
  ]),

  // Old Wing 3F — TGV CINEMAS 1 UTAMA (EZ101 — 2025 Walkthrough Verified #036–#042: Maybank IMAX, Bites Concessions, TGV Junior, Beanie, Halls 1–7!)
  { id: 'ez101-tgv-w', name: 'TGV CINEMAS • MAYBANK IMAX', subtitle: 'Maybank IMAX Laser • Junior • Beanie • Halls 1–7', lot: 'EZ101', floor: 4, wing: 'Old Wing', x: -125.8, z: -15.8, width: 12.4, side: 'W', brandBg: '#1c1917', brandFg: '#facc15', accent: '#0284c7', style: 'cinema' },
  { id: 'ez101-tgv-ws', name: 'TGV BEANIE & HALLS 1–7', subtitle: 'Double-Height Mezzanine • Dolby Digital Surround', lot: 'EZ101B', floor: 4, wing: 'Old Wing', x: -125.8, z: 15.8, width: 12.4, side: 'W', brandBg: '#4c0519', brandFg: '#fde047', accent: '#f43f5e', style: 'cinema' },
  { id: 'ez101-tgv-en', name: 'TGV SELF-TICKETING & FOYER', subtitle: 'MovieClub Rewards • Express Entry', lot: 'EZ101C', floor: 4, wing: 'Old Wing', x: -29.2, z: -15.8, width: 12.4, side: 'E', brandBg: '#3b0764', brandFg: '#f3e8ff', accent: '#e879f9', style: 'cinema' },

  ...strip(4, 'Old Wing 3F', 'N', -22.2, -125.2, [
    { lot: 'EZ101-IMAX', name: 'MAYBANK IMAX • TGV CINEMAS', sub: 'Double-Height IMAX Mezzanine & Internal Escalator (#036–#038)', w: 32.0, bg: '#0c2340', fg: '#facc15', ac: '#38bdf8', st: 'cinema' },
    { lot: 'EZ101-BITES', name: 'TGV BITES CONCESSIONS & INDULGE', sub: 'Fresh Popcorn Bar • Hot Dogs • Private Indulge Lounge (#039)', w: 31.6, bg: '#1c1917', fg: '#fde68a', ac: '#eab308', st: 'dining' },
    { lot: 'EZ101-JR', name: 'TGV JUNIOR • BEANIE • HALLS 1–7', sub: 'Family Playroom Cinema • Halls 1–7 Directory (#041)', w: 31.8, bg: '#1e3a8a', fg: '#fef08a', ac: '#fb923c', st: 'toys' }
  ]),
  ...strip(4, 'Old Wing 3F', 'S', 22.2, -77.6, [
    { lot: 'EZ101-BOX', name: 'TGV BITES & BANPRESTO COLLECTIBLES', sub: 'Official Cinema Snacks & Anime Merchandise Gallery (#038)', w: 47.8, bg: '#4c0519', fg: '#ffe4e6', ac: '#f43f5e', st: 'bakery' }
  ]),

  // 3F Sportszone Promenade — Celebrity Fitness Upper Studios (EZ216A — connected above 2F S-216A entry!)
  { id: 'ez216a-celeb-n', name: 'CELEBRITY FITNESS MEGACLUB (UPPER)', subtitle: 'Saltar Trampoline • Dance Studio • Free Weights Over Lebuh BU', lot: 'EZ216A', floor: 4, wing: 'Sportszone', x: -8, z: -10.2, width: 38.4, side: 'N', brandBg: '#7f1d1d', brandFg: '#ffffff', accent: '#ef4444', style: 'gym' },
  { id: 'ez216a-celeb-s', name: 'CELEBRITY FITNESS SPIN & YOGA', subtitle: 'Peloton Cycling • Floating Yoga • Recovery Sauna', lot: 'EZ216A', floor: 4, wing: 'Sportszone', x: -8, z: 10.2, width: 38.4, side: 'S', brandBg: '#18181b', brandFg: '#fca5a5', accent: '#ef4444', style: 'gym' },

  // New Wing 3F — The Ledge Art Gallery & XZQT (OV301 — Verified #153, #168, #310!)
  ...strip(4, 'New Wing 3F', 'N', -23.2, 60.8, [
    { lot: '3F-LEDGE', name: 'THE LEDGE ART GALLERY', sub: 'Contemporary Malaysian Visual Arts & Exhibitions', w: 55.0, bg: '#0f172a', fg: '#f8fafc', ac: '#38bdf8', st: 'gallery' },
    { lot: 'OV301-N', name: 'XZQT ITALIAN DESIGNER LIVING', sub: 'Calligaris • Natuzzi • Luxury Dining Galleries', w: 57.6, bg: '#1c1917', fg: '#fde68a', ac: '#f59e0b', st: 'furniture' }
  ]),
  { id: 'ov301-xzqt', name: 'XZQT FLAGSHIP FURNITURE SHOWROOM', subtitle: 'Imported Italian Leather Sofas & Marble Tables', lot: 'OV301', floor: 4, wing: 'The Oval', x: 173.0, z: 0, width: 45.6, side: 'E', brandBg: '#1c1917', brandFg: '#fde68a', accent: '#eab308', style: 'furniture' },

  // ===================== FLOOR 5: 4F–5F ENTERTAINMENT ZONE (EZ / OV — Stacked 4F CELLINI + 5F STANZO Verified #157!) =====================
  { id: 'ez501-camp5-w', name: 'CAMP5 INDOOR CLIMBING GYM', subtitle: '24m Panoramic Glass Lead Wall • Bouldering • Eat Well Café', lot: 'EZ501', floor: 5, wing: 'Entertainment Zone', x: 13.5, z: 0, width: 45.6, side: 'W', brandBg: '#7c2d12', brandFg: '#fed7aa', accent: '#fb923c', style: 'sports' },
  ...strip(5, 'Entertainment Zone', 'N', -23.2, 14.2, [
    { lot: 'E403', name: 'GSC CINEMAS 1 UTAMA (15 HALLS)', sub: 'BIG 4K Laser • Dolby Atmos • ScreenX 270° • 4DX', w: 54.0, bg: '#1c1917', fg: '#fde047', ac: '#eab308', st: 'cinema' },
    { lot: 'E403-PREST', name: 'GSC PRESTIGE LOUNGE & GSC PLAY', sub: 'VIP Recliner Dining Suites & Family PlayPark', w: 52.0, bg: '#292524', fg: '#fef08a', ac: '#f59e0b', st: 'dining' },
    { lot: 'OV401', name: 'CELLINI CONTEMPORARY LIVING (4F)', sub: 'Stacked Beneath 5F Stanzo • Motorized Leather Recliners', w: 53.2, bg: '#0f172a', fg: '#e2e8f0', ac: '#38bdf8', st: 'furniture' }
  ]),
  ...strip(5, 'Entertainment Zone', 'S', 23.2, 14.2, [
    { lot: 'EZ401', name: 'WANGSA BOWL (TEN-PIN BOWLING)', sub: 'Tournament Pro Lanes • Cosmic Glow Bowling', w: 40.0, bg: '#1e3a8a', fg: '#fef08a', ac: '#38bdf8', st: 'arcade' },
    { lot: 'EZ402', name: 'TOY CATCHER CLAW ARCADE', sub: '100+ Plushie UFO Catchers & Gachapon Wall', w: 38.0, bg: '#831843', fg: '#fbcfe8', ac: '#f472b6', st: 'toys' },
    { lot: 'EZ502', name: 'DIVA KARAOKE LOUNGE (5F–6F)', sub: 'VIP Themed KTV Suites • Concert Sound', w: 40.0, bg: '#4c1d95', fg: '#f5d0fe', ac: '#e879f9', st: 'arcade' },
    { lot: 'EZ503', name: 'CROSS FIRE RHYTHM ARCADE', sub: 'maimai DX • Sound Voltex • Taiko • Racing', w: 41.2, bg: '#09090b', fg: '#67e8f9', ac: '#22d3ee', st: 'arcade' }
  ]),
  { id: 'ov501-stanzo', name: 'STANZO COLLECTION (5F OVAL)', subtitle: 'Avant-Garde German & Italian Luxury Interiors • Above 4F Cellini', lot: 'OV501', floor: 5, wing: 'The Oval', x: 173.0, z: 0, width: 45.6, side: 'E', brandBg: '#111827', brandFg: '#fde68a', accent: '#f59e0b', style: 'furniture' }
];

// ============================================================================
// ARCHITECTURAL MALL FACILITIES, CAR PARK LOBBIES, RESTROOMS/SURAU & PORTALS
// (100% SEPARATE FROM RETAIL STORES — Verified against 2025 Walkthrough Video!)
// ============================================================================
export const MALL_FACILITIES = [
  // Multi-Level Color-Coded Car Park Lobbies & Exterior Drop-Off Portals (NEVER Storefronts!)
  { id: 'fac-luxeg-entrance', facilityType: 'transit-portal', zoneColor: '#b4944e', name: 'LUXE G MAIN ENTRANCE • VALET PARKING & CENTRAL PARK', subtitle: 'Between Michael Kors & Coach • Valet Parking • Taxi Stand • E-Hailing Lounge (#400–#402)', lot: 'GF-VALET', floor: 1, wing: 'LUXE G', x: 79.6, z: 23.2, width: 11.2, side: 'S' },
  { id: 'fac-cp-yellow-south', facilityType: 'carpark-lobby', zoneColor: '#eab308', name: 'YELLOW ZONE CAR PARK ACCESS (3F)', subtitle: '1PAY Ticketless LPR • Preferred Parking Level 3 Bays', lot: 'CP-YELLOW3', floor: 4, wing: 'Old Wing', x: -101.4, z: 22.2, width: 47.6, side: 'S' },
  { id: 'fac-cp-yellow-east', facilityType: 'carpark-lobby', zoneColor: '#eab308', name: 'YELLOW ZONE CAR PARK LOBBY', subtitle: '1PAY Ticketless LPR Autopay • Centre Court Level 3 Access', lot: 'CP-CC3', floor: 4, wing: 'Old Wing', x: -29.2, z: 15.8, width: 12.4, side: 'E' },
  { id: 'fac-cp-red-west', facilityType: 'carpark-lobby', zoneColor: '#dc2626', name: 'RED ZONE HIGHSTREET CAR PARK LOBBY', subtitle: '1PAY Autopay Kiosk • Level 3 Preferred Car Park Bays', lot: 'CP-HS3', floor: 4, wing: 'New Wing', x: 13.4, z: 16.4, width: 13.2, side: 'W' },
  { id: 'fac-cp-green-north', facilityType: 'carpark-lobby', zoneColor: '#16a34a', name: 'GREEN ZONE CAR PARK LOBBY (3F)', subtitle: '1PAY Ticketless LPR • Direct Lift Lobby to Secret Garden', lot: 'CP-GREEN3', floor: 4, wing: 'New Wing', x: 37.3, z: -23.2, width: 47.0, side: 'N' },
  { id: 'fac-cp-purple-south', facilityType: 'carpark-lobby', zoneColor: '#7c3aed', name: 'PURPLE ZONE CAR PARK LOBBY (OVAL 3F)', subtitle: '1PAY Ticketless LPR • Car Finder Touch Kiosk', lot: 'CP-PURPLE3', floor: 4, wing: 'The Oval', x: 145.6, z: 23.2, width: 55.6, side: 'S' },

  // Transit Portals, Link Walkways & Open Rainforest Canopy Overlooks (Architectural Elements — NEVER Storefronts!)
  { id: 'fac-mrt-pintu-b', facilityType: 'transit-portal', zoneColor: '#0284c7', name: 'MRT BANDAR UTAMA (PINTU B) SKYWALK & 1UE CAR PARK', subtitle: '8-Step Skywalk • G628 Kaki 5 • PJPAC Drop-Off & 1UE Car Park Entrance (#489–#499)', lot: 'MRT-B', floor: 1, wing: '1 Utama E', x: -183.2, z: 0, width: 39.6, side: 'W' },
  { id: 'fac-rf-overlook-s', facilityType: 'canopy-overlook', zoneColor: '#10b981', name: 'RAINFOREST CANOPY ECO-WALKWAY (3F)', subtitle: 'Open Botanical Treetop Viewing Deck & Rest Benches', lot: 'RF-3FS', floor: 4, wing: 'Rainforest', x: 31.8, z: 23.2, width: 36.0, side: 'S' },
  { id: 'fac-rf-overlook-w', facilityType: 'canopy-overlook', zoneColor: '#10b981', name: 'RAINFOREST CANOPY OVERLOOK (3F WEST)', subtitle: 'Open Treetop Atrium Gallery • Secret Garden Lift Access', lot: 'RF-3F', floor: 4, wing: 'Rainforest', x: 13.4, z: -16.4, width: 13.2, side: 'W' },
  { id: 'fac-estreet-alfresco', facilityType: 'transit-portal', zoneColor: '#059669', name: 'E-STREET ALFRESCO GARDEN ACCESS', subtitle: 'Outdoor Garden Terrace & Direct Escalator Link to MRT Pintu B', lot: 'LG-EXT', floor: 0, wing: '1 Utama E', x: -130.8, z: -15.0, width: 10.2, side: 'E' },
  { id: 'fac-1ue-3f-link', facilityType: 'transit-portal', zoneColor: '#be123c', name: '3F PEDESTRIAN LINK TO TGV IMAX', subtitle: 'Direct Covered Link Corridor to Old Wing 3F Maybank IMAX', lot: '3F-LINK', floor: 4, wing: '1 Utama E', x: -130.8, z: 15.0, width: 10.2, side: 'E' },

  // Recessed Restroom, Baby Care, Sensory Pod & Surau (Prayer Room) Service Corridors (Tucked BESIDE Toilets — Verified #025, #135, #159, #200, #320, #506!)
  { id: 'fac-surau-g1ue', facilityType: 'restroom-surau', surauGender: 'SURAU LELAKI & WANITA', zoneColor: '#3f362e', name: 'RESTROOMS, BABY ROOM & PRAYER ROOM (GF 1UE)', subtitle: 'Beside G618 IJN First Pharmacy • Gents & Ladies • Baby Room • Lift & Prayer Room (#506)', lot: 'G1UE-WC/SURAU', floor: 1, wing: '1 Utama E', x: -162.8, z: 20.2, width: 7.8, side: 'S' },
  { id: 'fac-surau-f1ua', facilityType: 'restroom-surau', surauGender: 'SURAU WANITA', zoneColor: '#3f362e', name: 'RESTROOMS, BABY ROOM & SURAU WANITA (1F OLD WING)', subtitle: 'Gents & Ladies Toilets • OKU • Baby Care • Surau Wanita & Wudhu', lot: 'F1-WC/SURAU', floor: 2, wing: 'Old Wing', x: -71.3, z: 22.2, width: 6.4, side: 'S' },
  { id: 'fac-rf-2f-wc', facilityType: 'restroom-surau', surauGender: 'WC • BABY CARE', zoneColor: '#3f362e', name: '2F RAINFOREST WEST LIFT LOBBY & RESTROOMS', subtitle: 'Immediately West of ASICS (S302) • Gents & Ladies WC • Lift Lobby (#025)', lot: 'S301-WC', floor: 3, wing: 'Rainforest', x: 13.4, z: -16.4, width: 13.2, side: 'W' },
  { id: 'fac-surau-s1ua', facilityType: 'restroom-surau', surauGender: 'SURAU LELAKI', zoneColor: '#3f362e', name: 'RESTROOMS, BABY ROOM & SURAU LELAKI (2F OLD WING)', subtitle: 'Gents & Ladies Toilets • OKU • Baby Care • Surau Lelaki & Wudhu', lot: 'S1-WC/SURAU', floor: 3, wing: 'Old Wing', x: -32.8, z: 22.2, width: 6.4, side: 'S' },
  { id: 'fac-2f-sensory-baby', facilityType: 'restroom-surau', surauGender: 'SENSORY POD • BABY ROOM', zoneColor: '#3f362e', name: '2F OVAL SENSORY POD, BABY ROOM & RESTROOMS', subtitle: 'Inclusive Sensory Pod • Nursing Room • Oval Rim Beside Escalators (#159, #161)', lot: 'S2-BABY/POD', floor: 3, wing: 'The Oval', x: 155.4, z: 23.2, width: 7.4, side: 'S' },
  { id: 'fac-surau-t1up', facilityType: 'restroom-surau', surauGender: 'SURAU LELAKI & WANITA', zoneColor: '#3f362e', name: 'RESTROOMS, BABY ROOM & SURAU (3F HIGHSTREET)', subtitle: 'Verified 3F New Wing Prayer Room & Restrooms (#320 sign) • Male & Female Surau', lot: 'T1-WC/SURAU', floor: 4, wing: 'New Wing', x: 100.8, z: 23.2, width: 34.0, side: 'S' },

  // ONECARD Customer Service & Concierge Lounges
  { id: 'fac-concierge-lg1ue', facilityType: 'concierge-lounge', zoneColor: '#a10022', name: 'ONECARD CONCIERGE (LG 1UE)', subtitle: 'Tourist Privileges • 1PAY Registration & Customer Service', lot: 'LG-1UE', floor: 0, wing: '1 Utama E', x: -130.8, z: 15.0, width: 10.2, side: 'E' },
  { id: 'fac-concierge-2f', facilityType: 'concierge-lounge', zoneColor: '#a10022', name: 'ONECARD CONCIERGE (2F OVAL)', subtitle: 'Customer Service • Stroller Loan & Family Lounge', lot: '2F-CS', floor: 3, wing: 'The Oval', x: 165.8, z: 23.2, width: 13.0, side: 'S' },
  { id: 'fac-concierge-3f', facilityType: 'concierge-lounge', zoneColor: '#a10022', name: '3F HIGHSTREET CONCIERGE & ONESHOP', subtitle: 'Verified 3F ONECARD Concierge (#333 sign) • Click & Carry • Lost & Found', lot: '3F-CS', floor: 4, wing: 'New Wing', x: 66.8, z: 23.2, width: 34.0, side: 'S' }
];

// ============================================================================
// VERIFIED 2025 CENTER-CONCOURSE 3D ISLAND KIOSKS (STOCKED WITH PROPS & STAFF!)
// ============================================================================
export const KIOSKS = [
  // LG Kiosks (Verified #426–#427: Bungkus Kaw Kaw beneath West Old Wing void!)
  { id: 'k-kenangan', lot: 'LGK101B', name: 'KENANGAN COFFEE', sub: 'Kenangan Latte', floor: 0, x: -110.5, z: -8.5, color: '#78350f', accent: '#fbbf24', kind: 'cafe' },
  { id: 'k-bungkus', lot: 'LGK105-LGK108', name: 'BUNGKUS KAW KAW', sub: 'Cham & Nasi Lemak • Old Wing West Void (#426)', floor: 0, x: -88.0, z: 2.5, color: '#14532d', accent: '#fde047', kind: 'cafe' },
  { id: 'k-garrett', lot: 'LGK2', name: 'GARRETT POPCORN', sub: 'Chicago Mix Tin', floor: 0, x: 81.5, z: -10.5, color: '#1e3a8a', accent: '#fde68a', kind: 'popcorn' },
  { id: 'k-auntie', lot: 'LGK3', name: 'AUNTIE ANNE’S', sub: 'Cinnamon Pretzels', floor: 0, x: 95.5, z: -11.5, color: '#1d4ed8', accent: '#facc15', kind: 'bakery' },

  // G Kiosks (Verified #149, #387–#389, #442, #455–#456, #480, #502: Nadeje opposite AEON, Nespresso, Cinnabon, Bell & Ross / Tom Ford Luxe pavilions, Photoism + Pop Mart Robo Shop!)
  { id: 'k-photoism', lot: 'GK601', name: 'PHOTOISM', sub: 'Korean 4-Cut Self-Photo Studio Booths (#480)', floor: 1, x: -156.5, z: 5.4, color: '#18181b', accent: '#f8fafc', kind: 'photobooth' },
  { id: 'k-popmart-robo', lot: 'GK602', name: 'POP MART ROBO SHOP', sub: 'Yellow Blind-Box Vending Kiosk • Near Mixue (#502)', floor: 1, x: -176.0, z: 9.5, color: '#facc15', accent: '#111827', kind: 'tech' },
  { id: 'k-beutea', lot: 'GK102', name: 'BEUTEA 茶仙子', sub: 'Jasmine Peach Oolong', floor: 1, x: -108, z: 7.5, color: '#065f46', accent: '#a7f3d0', kind: 'cafe' },
  { id: 'k-nespresso', lot: 'GK104', name: 'NESPRESSO', sub: 'Grand Cru Coffee Pavilion • Centre Court West (#442)', floor: 1, x: -91.5, z: -13.5, color: '#1c1917', accent: '#d4af37', kind: 'cafe' },
  { id: 'k-cinnabon', lot: 'GK108', name: 'CINNABON • WHITTARD', sub: 'Fresh Cinnamon Rolls & Chelsea Tea • Opposite Haidilao (#455)', floor: 1, x: -49.5, z: 12.2, color: '#1e3a8a', accent: '#fde68a', kind: 'bakery' },
  { id: 'k-nadeje', lot: 'GK101', name: 'NADEJE PATISSERIE', sub: 'Melaka Mille Crêpe • Directly Opposite AEON (#456)', floor: 1, x: -37.0, z: -13.5, color: '#1e3a8a', accent: '#fde68a', kind: 'bakery' },
  { id: 'k-luxe-pop', lot: 'GF-LUXE', name: 'TOM FORD • REPLICA', sub: 'LUXE G Center Fragrance & Bell & Ross Pavilions (#149, #389)', floor: 1, x: 84, z: 0, color: '#09090b', accent: '#fbbf24', kind: 'perfume' },

  // 1F Kiosks (Verified #173–#175, #197–#198, #201, #220, #301–#304, #327–#335!)
  { id: 'k-memori', lot: 'FK113', name: 'MEMORI 추억', sub: 'Korean Self-Photo Arch Booth • 1UE Link (#230, #277)', floor: 2, x: -148.5, z: -7.5, color: '#27202b', accent: '#ec4899', kind: 'photobooth' },
  { id: 'k-boost', lot: 'FK101', name: 'BOOST JUICE BARS', sub: 'Mango Magic Smoothie • Old Wing Mid-East (#220)', floor: 2, x: -58.5, z: -15.5, color: '#15803d', accent: '#bef264', kind: 'cafe' },
  { id: 'k-baskin', lot: 'FK8', name: 'BASKIN-ROBBINS', sub: '31 Handcrafted Flavours • 1F Promenade (#200, #302)', floor: 2, x: -22.5, z: 6.2, color: '#be185d', accent: '#fbcfe8', kind: 'bakery' },
  { id: 'k-ogawa', lot: 'FK7', name: 'OGAWA • POKÉMON', sub: 'Wellness Massage Chair Pavilion • 1F Promenade (#201, #301)', floor: 2, x: 7.2, z: -5.8, color: '#991b1b', accent: '#facc15', kind: 'tech' },
  { id: 'k-havaianas', lot: 'FK4', name: 'HAVAIANAS • LiHO TEA', sub: 'Red-Canopy Flip-Flop & Bubble Tea Islands (#197–#198, #335)', floor: 2, x: 64.5, z: 0.0, color: '#dc2626', accent: '#fef08a', kind: 'cafe' },
  { id: 'k-yomaro', lot: 'FK5A', name: 'YOMARO • JUICE WORKS', sub: 'Frozen Yogurt & Fresh Juices • 1F Highstreet (#173, #328)', floor: 2, x: 85.0, z: -11.5, color: '#166534', accent: '#f97316', kind: 'bakery' },
  { id: 'k-owala', lot: 'FK2', name: 'OWALA • ADOPT’', sub: 'FreeSip Insulated Tumblers & French Perfume (#304)', floor: 2, x: 106.0, z: 0.0, color: '#0e7490', accent: '#67e8f9', kind: 'tech' },

  // 2F Kiosks (Verified #026–#032, #047, #063, #140–#147, #176, #188, #193: SK9A Sushi Zanmai + SK9 ZUS near Parkson, llaollao at Centre Court East, Samsung SK2A + Chizu + Pokedots on Promenade, Haagen-Dazs opposite OPPO!)
  { id: 'k-tealive', lot: 'SK101', name: 'TEALIVE PLUS', sub: 'Bang Bang Pearl Tea', floor: 3, x: -107, z: 9.2, color: '#4c1d95', accent: '#c084fc', kind: 'cafe' },
  { id: 'k-llaollao', lot: 'SK106A', name: 'LLAOLLAO', sub: 'Biscoff Frozen Yogurt • Opposite U-TWO Centre Court (#063)', floor: 3, x: -52.5, z: -14.8, color: '#166534', accent: '#86efac', kind: 'bakery' },
  { id: 'k-mynews2f', lot: 'SK109', name: 'myNEWS • RAYA BLISS', sub: 'Convenience & Beverage Kiosk • Opposite Soxworld (#047)', floor: 3, x: -42.5, z: 13.8, color: '#ea580c', accent: '#fef08a', kind: 'cafe' },
  { id: 'k-chizu', lot: 'SK28', name: 'CHIZU チズ • NELSON’S', sub: 'Japanese Cheese Toast & Sweet Corn • 2F Promenade (#031, #140)', floor: 3, x: -22.5, z: 5.8, color: '#78350f', accent: '#fbbf24', kind: 'bakery' },
  { id: 'k-samsung', lot: 'SK2A', name: 'SAMSUNG EXPERIENCE', sub: 'Galaxy S25 Ultra • Opposite Good2U & Res|Toe|Run (#030, #142)', floor: 3, x: -10.5, z: 6.0, color: '#0f172a', accent: '#38bdf8', kind: 'tech' },
  { id: 'k-pokedots', lot: 'SK29', name: 'pokédots. • CHIANG MAI', sub: 'Hot-Pink Pavilion Opposite Celebrity Fitness (#026, #029)', floor: 3, x: 7.4, z: -5.8, color: '#ec1878', accent: '#fce7f3', kind: 'bakery' },
  { id: 'k-haagen', lot: 'SK5', name: 'HÄAGEN-DAZS • NEW ERA', sub: 'Atrium Ice Cream Booth Opposite OPPO (#147, #193)', floor: 3, x: 64.5, z: -9.8, color: '#4c0519', accent: '#fde68a', kind: 'bakery' },
  { id: 'k-zus2f', lot: 'SK9', name: 'ZUS COFFEE', sub: 'Spanish Latte • Back-to-Back w/ Sushi Zanmai (#176, #188)', floor: 3, x: 105.5, z: -7.5, color: '#1e3a8a', accent: '#fbbf24', kind: 'cafe' },
  { id: 'k-sushizanmai', lot: 'SK9A', name: 'SUSHI ZANMAI 寿司三昧', sub: 'Open-Concept Timber-Slatted Conveyor Sushi Pavilion (#188)', floor: 3, x: 117.0, z: -6.5, color: '#8ab14c', accent: '#dc2626', kind: 'sushi-booth' },

  // 3F & 4F Kiosks (Verified #038: TGV Banpresto/Collectibles Kiosk inside 3F TGV Foyer!)
  { id: 'k-tgv-pop', lot: 'EZ101-K', name: 'TGV BANPRESTO • BITES', sub: 'Collectibles Display & Cinema Concessions (#038)', floor: 4, x: -87.0, z: -15.2, color: '#1e293b', accent: '#38bdf8', kind: 'popcorn' },
  { id: 'k-newsplus', lot: 'EK5', name: 'NEWSPLUS', sub: 'Cinema Snacks & Drinks', floor: 5, x: 86, z: -7.0, color: '#ca8a04', accent: '#fef08a', kind: 'bakery' }
];

// ============================================================================
// ONECARD EXPLORER LANDMARKS & FAST-TRAVEL SPAWNS
// ============================================================================
export const LANDMARKS = [
  {
    id: 'spawn-rainbow-bridge-2f',
    name: '2F Rainforest Suspension Bridge & Food District',
    wing: 'New Wing • 2F Rainforest',
    floor: 3,
    x: 38.0,
    z: -10.8,
    yaw: Math.PI,
    category: 'Eco Landmark',
    description: 'Cross 1 Utama’s iconic striped-terrazzo Rainforest Suspension Bridge beneath the circular glass sky dome & twin steel arch trusses.',
    isStamp: true,
    upoints: 150
  },
  {
    id: 'spawn-koi-pond',
    name: 'LG Rainforest Koi Pond, Ippudo & Arapaima Tank',
    wing: 'New Wing • LG Rainforest',
    floor: 0,
    x: 26.5,
    z: 1.4,
    yaw: -1.78,
    category: 'Eco Landmark',
    description: 'Toss pellets to 32 Nishikigoi fish on the jetty beside the cascading waterfall, Ippudo (LG352), and the giant Arapaima aquarium.',
    isStamp: true,
    upoints: 150
  },
  {
    id: 'spawn-flowrider',
    name: 'LG601 FlowRider® & MODU at E-Street',
    wing: '1 Utama E • LG E-Street',
    floor: 0,
    x: -161.5,
    z: -4.5,
    yaw: 1.42,
    category: 'Sports Tourism',
    description: 'Visit LG601 FlowRider® in 1 Utama E alongside MODU Samgyetang (LG602), Rich Kopitiam (LG603), and the ONECARD Concierge.',
    isStamp: true,
    upoints: 200
  },
  {
    id: 'spawn-oval-showcase',
    name: 'LG Oval Atrium — Grand Car Showcase',
    wing: 'New Wing • LG Oval',
    floor: 0,
    x: 121.0,
    z: -5.5,
    yaw: -1.88,
    category: 'Grand Atrium',
    description: 'Explore the 6-story Oval dome with backlit white fascia, vertical LED-ribbed columns & crisscrossing rim escalators outside Jaya Grocer (LG309).',
    isStamp: true,
    upoints: 150
  },
  {
    id: 'spawn-centre-court',
    name: 'Old Wing GF Centre Court, AEON & Sephora',
    wing: 'Old Wing • Ground Floor (G)',
    floor: 1,
    x: -97.0,
    z: -14.0,
    yaw: -2.18,
    category: 'Heritage Atrium',
    description: 'Explore the solid Ground Floor 1995 Old Wing Centre Court pavilion flanked by red checkered columns, Uniqlo, Sephora & AEON.',
    isStamp: true,
    upoints: 150
  },
  {
    id: 'spawn-promenade',
    name: 'GF Promenade Bridge, PUTIEN, Lavender & Tai Er',
    wing: 'Promenade (G2xx)',
    floor: 1,
    x: -23.0,
    z: 3.5,
    yaw: -1.18,
    category: 'Skybridge',
    description: 'Stroll across Lebuh Bandar Utama past PUTIEN (G213A), Lavender Bakery (G212), The Chicken Rice Shop, Tai Er (G210C) & TGI Fridays.',
    isStamp: true,
    upoints: 150
  },
  {
    id: 'spawn-windlab',
    name: '2F 1UE: WINDLAB Skydiving (S601), NextGen & PJPAC',
    wing: '1 Utama E • 2F',
    floor: 3,
    x: -158.0,
    z: 4.5,
    yaw: 0.92,
    category: 'Sports Tourism',
    description: 'Crank the S601 WINDLAB vertical skydiving tunnel up to 250 km/h right next to NextGen Theme Park and PJPAC (S611).',
    isStamp: true,
    upoints: 200
  },
  {
    id: 'spawn-secret-garden',
    name: 'Upper Roof: Secret Garden, ASCARO Padel & Padang',
    wing: 'Upper Roof (UR601–603A)',
    floor: 6,
    x: 19.0,
    z: -13.5,
    yaw: -1.55,
    category: 'Rooftop Sanctuary',
    description: 'Explore UR603A The Secret Garden, UR601 ASCARO Padel Club, UR602 Padang Futsal, and UR603 Baseball Cage with KLCC views.',
    isStamp: true,
    upoints: 250
  },
  {
    id: 'spawn-gsc-ez',
    name: '4F–5F Entertainment: GSC 15-Hall, Wangsa Bowl & Camp5',
    wing: 'New Wing • EZ401–503',
    floor: 5,
    x: 56.0,
    z: -5.0,
    yaw: -0.5,
    category: 'Entertainment',
    description: 'Experience the refurbished GSC 15-Screen Cinema (E403), Wangsa Bowl (EZ401), Camp5 24m Climbing Gym (EZ501), Diva KTV & Cross Fire!',
    isStamp: false,
    upoints: 0
  },
  {
    id: 'spawn-tgv-3f',
    name: '3F: TGV Maybank IMAX (EZ101), Celebrity Fitness & Ledge',
    wing: '3F Old & New Wing',
    floor: 4,
    x: -102.0,
    z: -12.5,
    yaw: -0.35,
    category: 'Entertainment & Art',
    description: 'Visit PJ’s sole Maybank IMAX Laser at TGV (EZ101), Bites Concessions & TGV Junior, then walk to The Ledge Art Gallery on 3F Highstreet.',
    isStamp: false,
    upoints: 0
  }
];

// ============================================================================
// MATHEMATICALLY AIMED 70 VERIFICATION CAMERA PRESETS (10 PER LEVEL x 7 LEVELS)
// aimShot(id, label, camX, camZ, targetX, targetZ, pitch) -> ZERO obstructions!
// ============================================================================
function aimShot(id, label, x, z, tx, tz, pitch = -0.02, yOff = 0) {
  return {
    id,
    label,
    x,
    z,
    yaw: Math.atan2(-(tx - x), -(tz - z)),
    pitch,
    yOff
  };
}

export const LEVEL_VERIFICATION_SHOTS = {
  0: [ // LG (10 unobstructed Real2Sim shots)
    aimShot('LG-01', '1UE LG601 FlowRider® Wave, Surfer & E-Street', -159.5, 4.5, -177.5, -1.0, -0.05),
    aimShot('LG-02', '1UE LG602 MODU, Rich Kopitiam & Concierge', -163.5, 6.2, -153.5, -17.5, 0.01),
    aimShot('LG-03', 'Old Wing LG101 ALL IT, Lo Hong Ka & Shabu-Yo', -87.0, -12.5, -118.0, -19.0, 0.01),
    aimShot('LG-04', 'Old Wing LG Bungkus Kaw Kaw & Kenangan Concourse', -72.0, -6.5, -92.0, 2.5, 0.00),
    aimShot('LG-05', 'Old Wing LG125 AEON & La Boheme', -53.0, 17.5, -33.0, 14.5, 0.01),
    aimShot('LG-06', 'LG Promenade Wok Hey, Winter Time & Sealantis Scuba Pool', -27.2, -5.8, -7.5, 8.8, 0.00),
    aimShot('LG-07', 'LG Rainforest Koi Pond, Waterfall & Ippudo', 24.0, -1.6, 43.0, 6.5, -0.04),
    aimShot('LG-08', 'LG Rainforest Giant Arapaima Aquarium', 56.5, -12.8, 47.5, -6.5, -0.02),
    aimShot('LG-09', 'LG Highstreet Garrett Popcorn, Adidas & Teh Tarik Club', 74.8, -13.2, 84.8, -12.6, 0.01),
    aimShot('LG-10', 'LG Oval Backlit Fascia, Jaya Grocer LG309 & HEYTEA', 119.5, -11.2, 150.5, 1.8, 0.04)
  ],
  1: [ // G (10 unobstructed Real2Sim shots)
    aimShot('G-01', '1UE MRT Pintu B Skywalk, Mixue, Pasar Eatai & Pop Mart Robo', -154.0, 6.0, -176.0, 0.0, 0.01),
    aimShot('G-02', '1UE Giant Chess Courtyard, SportsDirect & Prayer Room/WC Corridor', -151.0, -6.5, -162.8, 20.2, 0.01),
    aimShot('G-03', 'Old Wing Solid GF Centre Court Heritage Pavilion & Checkered Columns', -56.5, -14.8, -74.5, 0.5, 0.02),
    aimShot('G-04', 'Old Wing G139C Sephora, M·A·C & Starbucks Reserve', -102.0, 12.2, -82.5, 19.6, 0.02),
    aimShot('G-05', 'Old Wing G115 Sa Sa, Haidilao, Nadeje & G125 AEON', -64.0, -14.8, -36.0, -16.5, 0.01),
    aimShot('G-06', 'GF Promenade PUTIEN G213A, Lavender, Tai Er & TGI Fridays', -26.5, 5.2, -8.0, -9.5, 0.00),
    aimShot('G-07', 'GF Rainforest Terracotta Balcony, Treetop Adventure & Green Escalators', 21.8, -15.5, 43.0, 4.5, -0.04),
    aimShot('G-08', 'LUXE G Main Entrance, Coach Opposite Michael Kors & Lancôme/YSL', 79.5, -2.5, 79.5, 22.8, 0.01),
    aimShot('G-09', 'LUXE G Tom Ford/Replica Pavilion, Chanel, M&S & Zara', 98.2, -1.8, 81.5, -1.2, 0.00),
    aimShot('G-10', 'GF Oval Skylight Dome, Rim Escalators, LED Columns & Parkson Elite', 124.5, 12.5, 146.0, -11.5, 0.14)
  ],
  2: [ // 1F (10 unobstructed Real2Sim shots)
    aimShot('1F-01', '1UE District K F603A Rollerwa & Cafe Disco', -156.5, 3.5, -178.0, -1.5, -0.02),
    aimShot('1F-02', '1UE F601 Game On Sports Hub Rainbow Arch & NextGen', -156.5, 9.0, -168.0, -17.5, 0.01),
    aimShot('1F-03', 'Old Wing F101 Nitori, F102 Uniqlo & Brands Outlet', -98.0, -13.5, -122.0, -17.5, 0.01),
    aimShot('1F-04', 'Old Wing F142 Neal’s Yard, HOOGA, iORA & Centre Court', -121.0, 14.5, -94.0, 19.5, 0.01),
    aimShot('1F-05', 'Old Wing F118 Brands Outlet, Vincci & Boost Juice', -74.0, -15.5, -46.0, -19.0, 0.01),
    aimShot('1F-06', '1F Promenade Void, Baskin-Robbins, CU & Sun Paradise', -25.5, 5.6, -5.5, 5.2, 0.00),
    aimShot('1F-07', '1F Rainforest Canopy Overlook: Nando’s, Starbucks & Treetop Adventure', 41.0, -15.5, 27.5, 23.2, -0.04),
    aimShot('1F-08', '1F Highstreet Havaianas, Outpozt, Xixili, Swarovski & Pandora', 78.5, 10.5, 58.0, 18.0, 0.01),
    aimShot('1F-09', '1F Highstreet Yomaro, Pull&Bear, HLA & Owala Kiosk', 102.0, -10.5, 76.0, -16.0, 0.01),
    aimShot('1F-10', '1F Oval F319 Decathlon Adjacent to F320 Parkson & Padini', 142.0, -17.2, 168.0, -16.5, 0.01)
  ],
  3: [ // 2F (10 unobstructed Real2Sim shots)
    aimShot('2F-01', '1UE S601 WINDLAB Indoor Skydiving & S611 PJPAC', -151.0, 10.5, -174.0, -9.5, 0.01),
    aimShot('2F-02', 'Outdoor 2F Saranghae Finger-Heart / Skywalker Rooftop Bridge', -143.1, -24.4, -138.8, -37.2, -0.34, 4.4),
    aimShot('2F-03', 'Old Wing S101 Harvey Norman, LEGO & Blue TGV IMAX Escalator', -98.0, -14.0, -118.0, -4.0, 0.01),
    aimShot('2F-04', 'Old Wing S140 Toys"R"Us, Wondermama & Centre Court', -106.5, 14.5, -82.0, 18.5, 0.01),
    aimShot('2F-05', 'Old Wing S125 AEON Home, Hokkaido Sushi & Restrooms/Surau', -58.5, 16.0, -34.0, 17.5, 0.01),
    aimShot('2F-06', '2F Promenade Open Void, SK2A Samsung, Celebrity Fitness & Dzi Kingdom', -24.5, 5.8, -6.0, 4.5, 0.00),
    aimShot('2F-07', '2F Rainforest Suspension Bridge & Circular Glass Sky Dome (Photo Exact!)', 38.0, -11.4, 38.0, 13.0, 0.14, 0.15),
    aimShot('2F-08', '2F Highstreet Starship Galactica, Machines, Cuckoo & Chili’s', 98.5, 14.5, 84.0, -16.5, 0.04),
    aimShot('2F-09', '2F Highstreet SK9A Sushi Zanmai, SK9 ZUS Coffee & Dragon-i', 110.5, 5.5, 117.0, -7.5, -0.02),
    aimShot('2F-10', '2F Oval Hot-Pink Pop Mart, Kaison, Sensory Pod, MR.DIY & Parkson', 136.0, -15.5, 128.0, 22.0, 0.01)
  ],
  4: [ // 3F (10 unobstructed Real2Sim shots)
    aimShot('3F-01', '1UE T601 PJPAC Level 3, NextGen Mezzanine & MRT Overlook', -152.5, 8.5, -174.0, -4.5, 0.01),
    aimShot('3F-02', '1UE T601 Party Suites & Link to TGV IMAX', -159.0, -2.5, -132.8, 0.5, 0.01),
    aimShot('3F-03', 'Old Wing EZ101 TGV Maybank IMAX Double-Height Foyer', -116.5, -12.5, -104.0, -22.2, 0.02),
    aimShot('3F-04', 'Old Wing TGV Bites Concessions, Banpresto & Junior Halls 1–7', -101.0, -14.0, -77.5, -18.5, 0.01),
    aimShot('3F-05', 'Old Wing 3F Yellow Zone Car Park Lobby & 1PAY Autopay', -101.4, 13.4, -101.4, 22.2, 0.02),
    aimShot('3F-06', '3F Sportszone EZ216A Celebrity Fitness Bridge', -31.0, 0.0, 6.0, 0.0, 0.01),
    aimShot('3F-07', '3F Rainforest Circular Glass Dome & Treetop Atrium Overlook', 23.5, 16.2, 41.0, 4.5, -0.14),
    aimShot('3F-08', '3F Highstreet The Ledge Art Gallery Exhibitions', 70.0, -13.5, 92.0, -20.5, 0.01),
    aimShot('3F-09', '3F Highstreet Concierge & Restrooms/Surau Service Corridor', 94.0, 11.5, 100.8, 23.2, -0.02),
    aimShot('3F-10', '3F Oval OV301 XZQT Showroom & Purple Carpark Lobby', 138.0, -16.5, 168.0, 6.0, 0.01)
  ],
  5: [ // 4F–5F Entertainment Zone (10 unobstructed Real2Sim shots)
    aimShot('4F-01', 'EZ501 Camp5 24m Climbing Gym & Crash Mats', 24.5, -18.8, 14.5, -15.2, 0.04),
    aimShot('4F-02', 'E403 GSC Cinemas 15-Screen Golden Foyer', 60.0, 4.5, 40.0, -23.2, 0.02),
    aimShot('4F-03', 'E403 GSC Prestige Lounge, GSC Play & EK5 Newsplus', 64.5, -6.5, 90.0, -19.0, 0.01),
    aimShot('4F-04', 'EZ401 Wangsa Bowl 10-Pin Bowling Lanes & Pinsetters', 20.5, 14.2, 38.0, 21.5, -0.02),
    aimShot('4F-05', 'EZ402 Toy Catcher UFO Claw Machine Arcade', 56.5, 9.5, 74.5, 22.0, 0.00),
    aimShot('4F-06', 'EZ502 Diva Karaoke Neon Lounge Entrance', 116.5, 14.5, 124.0, 22.8, 0.01),
    aimShot('4F-07', 'EZ503 Cross Fire Rhythm Arcade (maimai DX)', 136.5, 14.8, 152.0, 22.2, -0.01),
    aimShot('4F-08', 'OV401 Cellini (4F) Stacked Beneath OV501 Stanzo (5F)', 114.5, -15.5, 152.0, -17.0, 0.04),
    aimShot('4F-09', 'OV501 Stanzo Collection & EVCS457 EV Superchargers', 149.0, -14.8, 169.5, -10.0, 0.01),
    aimShot('4F-10', '4F Oval Panoramic Glass Lifts & 6-Story Dome View', 117.5, 0.0, 158.0, 0.0, 0.02)
  ],
  6: [ // UR — Upper Roof (10 unobstructed Real2Sim shots)
    aimShot('UR-01', 'UR603A The Secret Garden Entrance & Pergola', 14.4, -13.5, 46.0, -13.5, 0.00),
    aimShot('UR-02', 'UR603A Secret Garden Lotus Mirror Pond & Orchids', 49.5, 15.2, 59.0, 12.5, -0.14),
    aimShot('UR-03', 'UR603A Botanical Geodesic Glasshouse Conservatory', 44.5, -12.0, 59.0, -12.0, 0.02),
    aimShot('UR-04', 'UR602 Padang @ 1U Rooftop Futsal Pitch & Cage', 68.0, -15.5, 89.0, -11.5, -0.02),
    aimShot('UR-05', 'UR603 Baseball Cage @ 1 Utama Batting Nets', 68.0, 16.5, 89.0, 16.5, -0.02),
    aimShot('UR-06', 'UR601 ASCARO Padel Panoramic Courts & Floodlights', 114.5, -24.5, 135.0, -21.0, -0.01),
    aimShot('UR-07', 'UR601 ASCARO Sunset Lounge & Oval Glass Dome', 118.5, 18.8, 138.0, 15.5, -0.01),
    aimShot('UR-08', 'Upper Roof Oval Diagrid Glass Dome Looking Down', 155.5, -3.5, 134.0, 2.0, -0.26),
    aimShot('UR-09', 'Petaling Jaya Skyline: One World Hotel & Bandar Utama', 33.5, -24.8, -12.0, -88.0, 0.17),
    aimShot('UR-10', 'Eastern Horizon: KLCC Twin Towers & Merdeka 118 Vista', 162.5, -2.5, 420.0, 4.0, 0.13)
  ]
};
