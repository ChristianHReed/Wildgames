// Afterstreet world builder for three.js (r160+), ES module.
// Builds Springfield from the GeoJSON in ../map_data and textures in ../textures.
// Usage: const world = await buildWorld(scene, { base: '../', renderer }); world.setTime(19.5);
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const ORIGIN = { lat: 37.211, lon: -93.290 };
const KX = 111320 * Math.cos(ORIGIN.lat * Math.PI / 180), KN = 110540;
/** lon/lat -> [x east (m), n north (m)]. World position is (x, y, -n). */
export const project = (lon, lat) => [(lon - ORIGIN.lon) * KX, (lat - ORIGIN.lat) * KN];
export const toWorld = (lon, lat, y = 0) => { const [x, n] = project(lon, lat); return new THREE.Vector3(x, y, -n); };

export const INK = '#3d3029';
const ROAD_W = { motorway: 14, trunk: 12, primary: 10, secondary: 8, tertiary: 7, residential: 6, unclassified: 6, living_street: 5, service: 4, pedestrian: 4, footway: 2 };
const MAJOR = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary']);
const FACADES = ['brick', 'brick_dark', 'siding_cream', 'siding_river', 'stucco'];
const SHOP_CATS = new Set(['food', 'medicine', 'materials', 'gear', 'misc']);
const FACADE_TILE = [8, 6.4];   // facade_*.png = 2 bays x 2 floors
const SHOP_TILE = [8, 4];       // shopfront_*.png = 8 m wide ground floor
const GROUND_FLOOR = 4;

const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };

function pointInRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ExtrudeGeometry is non-indexed with group 0 = caps, group 1 = walls. Split them.
function splitGroups(geo) {
  return geo.groups.map(g => {
    const out = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'uv']) {
      const a = geo.attributes[k];
      out.setAttribute(k, new THREE.BufferAttribute(a.array.slice(g.start * a.itemSize, (g.start + g.count) * a.itemSize), a.itemSize));
    }
    return out;
  });
}

function ribbon(pts, width, uScale, vScale, y) {
  const pos = [], uv = [], idx = []; let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const nx = -dz * width / 2, nz = dx * width / 2;
    if (i > 0) len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    pos.push(p[0] + nx, y, p[1] + nz, p[0] - nx, y, p[1] - nz);
    uv.push(0, len / vScale, width / uScale, len / vScale);
    if (i > 0) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); } // CCW from above (+Y normal)
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/** Inverted-hull outline for smooth meshes (props). */
export function outlineMaterial(thickness = 0.035) {
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${thickness.toFixed(3)};`); };
  return m;
}

export async function buildWorld(scene, { base = './', renderer, shadows = true } = {}) {
  const loader = new THREE.TextureLoader();
  const aniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 4;
  const cache = {};
  const tex = (p, rx = 1, ry = 1) => {
    const key = p + rx + ',' + ry; if (cache[key]) return cache[key];
    const t = loader.load(base + 'textures/' + p);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
    return (cache[key] = t);
  };
  const ramp = loader.load(base + 'textures/toon_ramp.png');
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.generateMipmaps = false;
  const emissiveMats = [];
  const toon = (opts = {}) => new THREE.MeshToonMaterial({ gradientMap: ramp, ...opts });
  const lit = (map, emap) => { const m = toon({ map, emissiveMap: emap, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 }); emissiveMats.push(m); return m; };
  const json = p => fetch(base + 'map_data/' + p).then(r => r.json());
  const [bld, roads, parks, waters, pois] = await Promise.all(
    ['springfield_buildings', 'springfield_roads', 'springfield_parks', 'springfield_waters', 'springfield_pois'].map(n => json(n + '.geojson')));

  const root = new THREE.Group(); root.name = 'afterstreet_world'; scene.add(root);
  const edgeMat = new THREE.LineBasicMaterial({ color: INK });
  const addMesh = (geos, mat, { outline = false, receive = true, cast = false, name } = {}) => {
    if (!geos.length) return null;
    const g = mergeGeometries(geos, false); geos.forEach(x => x.dispose());
    const mesh = new THREE.Mesh(g, mat); mesh.name = name || ''; mesh.receiveShadow = receive; mesh.castShadow = cast; root.add(mesh);
    if (outline) root.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 28), edgeMat));
    return mesh;
  };

  // ---------- POIs (projected once; used for shopfront assignment + markers)
  const poiList = pois.features.map(f => {
    const [lon, lat] = f.geometry.coordinates; const p = project(lon, lat);
    return { ...f.properties, lon, lat, p, searchedAt: null };
  });

  // ---------- Buildings
  const buckets = {};
  const push = (k, g) => (buckets[k] = buckets[k] || []).push(g);
  for (const f of bld.features) {
    if (f.geometry.type !== 'Polygon') continue;
    const ring = f.geometry.coordinates[0].map(([lon, lat]) => project(lon, lat));
    if (ring.length < 4) continue;
    const shape = new THREE.Shape(ring.map(([x, n]) => new THREE.Vector2(x, n)));
    const inside = poiList.find(p => SHOP_CATS.has(p.category) && pointInRing(p.p, ring));
    const shelter = poiList.find(p => p.category === 'shelter' && pointInRing(p.p, ring));
    let h = Math.max(3.5, f.properties.height_m || 8);
    const fac = shelter ? 'stone' : FACADES[Math.floor(hash(f.properties.id) * FACADES.length)];
    const roof = f.properties.building === 'house' ? 'roof_shingle_clay' : (hash(f.properties.id + 'r') < 0.15 ? 'roof_metal' : 'roof_gravel');
    const extrude = (depth, z0) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }); g.translate(0, 0, z0); g.rotateX(-Math.PI / 2); return splitGroups(g); };
    if (inside) {
      h = Math.max(h, GROUND_FLOOR + 1.2);
      const [, walls0] = extrude(GROUND_FLOOR, 0); push('shop_' + inside.category, walls0);
      const [caps, walls1] = extrude(h - GROUND_FLOOR, GROUND_FLOOR);
      push('fac_' + fac, walls1); push(roof, caps);
      inside.building = f.properties.id;
    } else {
      const [caps, walls] = extrude(h, 0); push('fac_' + fac, walls); push(roof, caps);
    }
  }
  // ExtrudeGeometry wall UVs are in metres (u along wall, v = height); caps UVs are metres in x/n.
  for (const [k, geos] of Object.entries(buckets)) {
    let mat;
    if (k.startsWith('fac_')) { const n = k.slice(4); mat = lit(tex(`facades/facade_${n}.png`, 1 / FACADE_TILE[0], 1 / FACADE_TILE[1]), tex(`facades/facade_${n}_emissive.png`, 1 / FACADE_TILE[0], 1 / FACADE_TILE[1])); }
    else if (k.startsWith('shop_')) { const n = k.slice(5); mat = lit(tex(`facades/shopfront_${n}.png`, 1 / SHOP_TILE[0], 1 / SHOP_TILE[1]), tex(`facades/shopfront_${n}_emissive.png`, 1 / SHOP_TILE[0], 1 / SHOP_TILE[1])); }
    else mat = toon({ map: tex(`roofs/${k}.png`, 1 / 8, 1 / 8) });
    addMesh(geos, mat, { outline: true, cast: true, name: k });
  }

  // ---------- Ground, parks, water
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), toon({ map: tex('ground/dirt_lot.png', 4000 / 6, 4000 / 6) }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  const flat = (features, y) => features.filter(f => f.geometry.type === 'Polygon').map(f => {
    const g = new THREE.ShapeGeometry(new THREE.Shape(f.geometry.coordinates[0].map(([lon, lat]) => { const [x, n] = project(lon, lat); return new THREE.Vector2(x, n); })));
    g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g;
  });
  addMesh(flat(parks.features, 0.02), toon({ map: tex('ground/grass.png', 1 / 4, 1 / 4) }));
  const waterMat = toon({ map: tex('ground/water.png', 1 / 6, 1 / 6) });
  addMesh(flat(waters.features, 0.05), waterMat);
  addMesh(waters.features.filter(f => f.geometry.type === 'LineString').map(f =>
    ribbon(f.geometry.coordinates.map(([lon, lat]) => { const [x, n] = project(lon, lat); return [x, -n]; }), 4, 6, 6, 0.05)), waterMat);

  // ---------- Roads (sidewalk ribbon under each street; lane-marked texture on major roads)
  const rb = { major: [], minor: [], walk: [] };
  const roadLines = [];
  for (const f of roads.features) {
    const hw = f.properties.highway; const w = ROAD_W[hw]; if (!w || f.geometry.type !== 'LineString') continue;
    const pts = f.geometry.coordinates.map(([lon, lat]) => { const [x, n] = project(lon, lat); return [x, -n]; });
    if (hw === 'footway' || hw === 'pedestrian') { rb.walk.push(ribbon(pts, w, 4, 4, 0.06)); continue; }
    rb.walk.push(ribbon(pts, w + 4, 4, 4, 0.04));
    if (MAJOR.has(hw)) rb.major.push(ribbon(pts, w, w, 8, 0.08)); else rb.minor.push(ribbon(pts, w, 4, 4, 0.08));
    roadLines.push({ hw, w, pts });
  }
  const po = (m, u) => Object.assign(m, { polygonOffset: true, polygonOffsetFactor: -u, polygonOffsetUnits: -u });
  addMesh(rb.walk, po(toon({ map: tex('ground/sidewalk.png') }), 1));
  addMesh(rb.minor, po(toon({ map: tex('ground/asphalt.png') }), 2));
  addMesh(rb.major, po(toon({ map: tex('ground/road_lanes.png') }), 3));

  // ---------- Street props (instanced)
  const props = makePropKit(toon, tex);
  const lampM = [], treeM = [], carM = [];
  const m4 = (x, z, ry = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s));
  for (const r of roadLines) {
    const step = MAJOR.has(r.hw) ? 30 : 22; let acc = hash(r.pts[0].join()) * step, side = 1;
    for (let i = 1; i < r.pts.length; i++) {
      const [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i]; const L = Math.hypot(bx - ax, bz - az); if (!L) continue;
      const dx = (bx - ax) / L, dz = (bz - az) / L, ang = Math.atan2(dx, dz);
      for (; acc < L; acc += step) {
        const off = (r.w / 2 + 1.4) * side; const x = ax + dx * acc - dz * off, z = az + dz * acc + dx * off;
        if (MAJOR.has(r.hw)) lampM.push(m4(x, z, ang + (side > 0 ? Math.PI / 2 : -Math.PI / 2)));
        else if (hash(x + ',' + z) < 0.45) treeM.push(m4(x, z, hash(x + ',' + z) * 6, 0.8 + hash(z + '') * 0.5));
        if (hash(x * 3 + ',' + z) < 0.04) { const o = (r.w / 4) * side; carM.push(m4(ax + dx * acc - dz * o, az + dz * acc + dx * o, ang + Math.PI / 2 + (hash(z * 7 + '') - .5) * .5)); }
        side = -side;
      }
      acc -= L;
    }
  }
  const lampHeads = [];
  for (const [proto, mats] of [[props.streetlamp, lampM], [props.tree, treeM], [props.car_wreck, carM]]) {
    const inst = instanceGroup(proto, mats, shadows); root.add(inst);
    if (proto === props.streetlamp) inst.traverse(o => o.material && o.material.userData.lamp && lampHeads.push(o.material));
  }

  // ---------- POI markers (sprite pins, same art as the map UI)
  const pinTex = {};
  const markers = new THREE.Group(); markers.name = 'poi_markers'; root.add(markers);
  for (const p of poiList) {
    const t = pinTex[p.category] || (pinTex[p.category] = (() => { const x = loader.load(base + `assets/pins/${p.category}.svg`); x.colorSpace = THREE.SRGBColorSpace; return x; })());
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
    s.position.set(p.p[0], 3.2, -p.p[1]); s.scale.set(1.4, 1.75, 1); s.userData.poi = p; p.sprite = s; markers.add(s);
  }

  // ---------- Lighting + time of day
  const hemi = new THREE.HemisphereLight('#fff1d6', '#8a7480', 1.6); root.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d0', 2.4); sun.position.set(-260, 380, 220);
  if (shadows) { sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -220, right: 220, top: 220, bottom: -220, near: 10, far: 1200 }); sun.shadow.bias = -0.0006; }
  root.add(sun, sun.target);
  scene.fog = new THREE.Fog('#f0d9b8', 120, 700);
  scene.background = new THREE.Color('#f3dcbc');

  const KEYS = [ // hour, sky, sun color, sun intensity, hemi intensity, window glow
    [0, '#2c2638', '#8fa0d0', 0.25, 0.35, 1.0], [5.5, '#4a3c52', '#c9a0b0', 0.4, 0.45, 0.9], [7, '#f3c9a8', '#ffd2a0', 1.8, 1.3, 0.2],
    [12, '#f3dcbc', '#fff0d0', 2.6, 1.7, 0], [17.5, '#f0c39a', '#ffc58a', 2.2, 1.45, 0.15], [19.5, '#b77a6a', '#ff9a6a', 1.0, 0.9, 0.8],
    [21, '#3a3046', '#9aa8d8', 0.3, 0.38, 1.0], [24, '#2c2638', '#8fa0d0', 0.25, 0.35, 1.0]];
  const setTime = hour => {
    hour = ((hour % 24) + 24) % 24; let i = 0; while (KEYS[i + 1][0] < hour) i++;
    const a = KEYS[i], b = KEYS[i + 1], t = (hour - a[0]) / (b[0] - a[0]);
    const sky = new THREE.Color(a[1]).lerp(new THREE.Color(b[1]), t);
    scene.background.copy(sky); scene.fog.color.copy(sky);
    sun.color.set(a[2]).lerp(new THREE.Color(b[2]), t); sun.intensity = a[3] + (b[3] - a[3]) * t;
    hemi.intensity = a[4] + (b[4] - a[4]) * t; const glow = a[5] + (b[5] - a[5]) * t;
    emissiveMats.forEach(m => m.emissiveIntensity = glow * 0.9); lampHeads.forEach(m => m.emissiveIntensity = glow * 1.5);
    const ang = (hour - 6) / 12 * Math.PI; sun.position.set(-260, Math.max(60, Math.sin(ang) * 420), 220 + Math.cos(ang) * 200);
  };
  setTime(17.8);

  const home = poiList.find(p => /library/i.test(p.name || '')) || poiList[0];
  // spawn on the street point closest to the library (never inside a footprint)
  let spawnPt = [home.p[0], -home.p[1]], sd = Infinity;
  for (const r of roadLines) for (const q of r.pts) { const d = Math.hypot(q[0] - home.p[0], q[1] + home.p[1]); if (d < sd) { sd = d; spawnPt = q; } }
  return {
    root, pois: poiList, sun, props, setTime, home, spawn: new THREE.Vector3(spawnPt[0], 1.7, spawnPt[1]),
    /** face the camera toward a world point: returns yaw */
    yawTo(from, to) { return Math.atan2(-(to.x - from.x), -(to.z - from.z)); },
    /** keep sun shadow box centred on the player */
    follow(v) { if (!shadows) return; sun.target.position.copy(v); sun.position.copy(v).add(new THREE.Vector3(-260, sun.position.y - sun.target.position.y + v.y, 220)); },
    nearestPoi(v, max = 4) { let best = null, bd = max; for (const p of poiList) { const d = Math.hypot(p.p[0] - v.x, -p.p[1] - v.z); if (d < bd) { bd = d; best = p; } } return best; },
    markSearched(p) { p.searchedAt = Date.now(); if (p.sprite) p.sprite.material.opacity = 0.45; }
  };
}

function instanceGroup(proto, matrices, shadows) {
  const g = new THREE.Group(); proto.updateMatrixWorld(true);
  proto.traverse(o => {
    if (!o.isMesh || !matrices.length) return;
    const im = new THREE.InstancedMesh(o.geometry, o.material, matrices.length);
    const tmp = new THREE.Matrix4();
    matrices.forEach((m, i) => im.setMatrixAt(i, tmp.multiplyMatrices(m, o.matrixWorld)));
    im.castShadow = shadows; im.receiveShadow = true; g.add(im);
    if (o.userData.outline !== false) { const ol = new THREE.InstancedMesh(o.geometry, outlineMaterial(o.userData.outlineW || 0.035), matrices.length); ol.instanceMatrix = im.instanceMatrix; g.add(ol); }
  });
  return g;
}

/** Procedural low-poly props textured with ../textures. Every factory returns a THREE.Group in metres, origin on the floor. */
export function makePropKit(toon, tex) {
  const C = c => toon({ color: c });
  const mesh = (geo, mat, x = 0, y = 0, z = 0, ud = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); Object.assign(m.userData, ud); m.castShadow = true; return m; };
  const grp = (...c) => { const g = new THREE.Group(); c.forEach(x => g.add(x)); return g; };
  const boxFront = (w, h, d, front, side) => { const s = side || C('#d9cdb7'); return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [s, s, s, s, front, s]); };
  const kit = {};
  kit.crate = grp(mesh(new THREE.BoxGeometry(1, 1, 1), toon({ map: tex('materials/crate.png') }), 0, 0.5));
  kit.rain_barrel = grp(mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 20, 1, false), [toon({ map: tex('materials/barrel_wrap.png') }), C('#9cc0c9'), C('#9cc0c9')], 0, 0.55));
  kit.dumpster = grp(mesh(new THREE.BoxGeometry(2, 1.3, 1.1), toon({ map: tex('materials/metal_painted.png', 2, 1) }), 0, 0.75), mesh(new THREE.BoxGeometry(2.1, 0.12, 1.2), C('#7a8a5e'), 0, 1.46));
  const lampHead = toon({ color: '#ffe6a0', emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 0 }); lampHead.userData.lamp = true;
  kit.streetlamp = grp(mesh(new THREE.CylinderGeometry(0.07, 0.1, 4.6, 8), C('#4e5a60'), 0, 2.3), mesh(new THREE.BoxGeometry(0.08, 0.08, 1.2), C('#4e5a60'), 0, 4.55, 0.55),
    mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.3, 8), C('#8f99a0'), 0, 4.45, 1.1), mesh(new THREE.SphereGeometry(0.16, 10, 6), lampHead, 0, 4.28, 1.1, { outline: false }));
  const leaf = toon({ map: tex('materials/foliage.png', 2, 2) });
  kit.tree = grp(mesh(new THREE.CylinderGeometry(0.16, 0.24, 2.6, 8), toon({ map: tex('materials/bark.png') }), 0, 1.3),
    mesh(new THREE.IcosahedronGeometry(1.5, 0), leaf, 0, 3.4), mesh(new THREE.IcosahedronGeometry(1.1, 0), leaf, 0.9, 2.9, 0.3), mesh(new THREE.IcosahedronGeometry(1.0, 0), leaf, -0.8, 3.0, -0.4));
  const carSide = toon({ map: tex('props/car_side.png'), transparent: true, alphaTest: 0.5 });
  const body = C('#5f8a9a'), wheel = C('#4e4440');
  kit.car_wreck = grp(mesh(new THREE.BoxGeometry(4.2, 0.8, 1.8), body, 0, 0.75), mesh(new THREE.BoxGeometry(2.2, 0.7, 1.6), body, -0.1, 1.5),
    mesh(new THREE.PlaneGeometry(4.3, 2.15), carSide, 0, 1.08, 0.91, { outline: false }), (() => { const m = mesh(new THREE.PlaneGeometry(4.3, 2.15), carSide, 0, 1.08, -0.91, { outline: false }); m.rotation.y = Math.PI; return m; })(),
    ...[[-1.35, 0.85], [1.35, 0.85], [-1.35, -0.85], [1.35, -0.85]].map(([x, z]) => { const m = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 14), wheel, x, 0.38, z); m.rotation.x = Math.PI / 2; return m; }));
  kit.store_shelf = grp(mesh(new THREE.BoxGeometry(2, 2, 0.6), [C('#d9cdb7'), C('#d9cdb7'), C('#e7ddca'), C('#d9cdb7'), toon({ map: tex('props/store_shelf_front.png') }), C('#d9cdb7')], 0, 1));
  kit.bookshelf = grp(mesh(new THREE.BoxGeometry(1.8, 2.2, 0.45), [C('#a2733f'), C('#a2733f'), C('#b8874f'), C('#a2733f'), toon({ map: tex('props/bookshelf_front.png') }), C('#a2733f')], 0, 1.1));
  kit.fridge = grp(mesh(new THREE.BoxGeometry(0.8, 1.8, 0.7), [C('#ebe5d8'), C('#ebe5d8'), C('#f4efe5'), C('#ebe5d8'), toon({ map: tex('props/fridge_front.png') }), C('#ebe5d8')], 0, 0.9));
  kit.stove = grp(mesh(new THREE.BoxGeometry(0.9, 0.9, 0.65), [C('#fff8ee'), C('#fff8ee'), C('#ebe5d8'), C('#fff8ee'), toon({ map: tex('props/stove_front.png') }), C('#fff8ee')], 0, 0.45));
  kit.window_boarded = grp(mesh(new THREE.PlaneGeometry(1.4, 1.6), toon({ map: tex('props/boarded_window.png') }), 0, 1.6, 0.02, { outline: false }));
  const wood = toon({ map: tex('materials/wood_planks.png') });
  kit.table = grp(mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), wood, 0, 0.76), ...[[-0.72, -0.38], [0.72, -0.38], [-0.72, 0.38], [0.72, 0.38]].map(([x, z]) => mesh(new THREE.BoxGeometry(0.08, 0.72, 0.08), C('#a2733f'), x, 0.36, z)));
  kit.workbench = grp(mesh(new THREE.BoxGeometry(2, 0.1, 0.8), wood, 0, 0.9), mesh(new THREE.BoxGeometry(1.8, 0.06, 0.6), C('#a2733f'), 0, 0.3), ...[[-0.9, -0.32], [0.9, -0.32], [-0.9, 0.32], [0.9, 0.32]].map(([x, z]) => mesh(new THREE.BoxGeometry(0.1, 0.85, 0.1), C('#a2733f'), x, 0.43, z)));
  const fab = n => toon({ map: tex(`materials/fabric_${n}.png`, 2, 2) });
  kit.sofa = grp(mesh(new THREE.BoxGeometry(2, 0.45, 0.9), fab('clay'), 0, 0.35), mesh(new THREE.BoxGeometry(2, 0.6, 0.25), fab('clay'), 0, 0.8, -0.33), mesh(new THREE.BoxGeometry(0.22, 0.6, 0.9), fab('clay'), -1, 0.5), mesh(new THREE.BoxGeometry(0.22, 0.6, 0.9), fab('clay'), 1, 0.5));
  kit.bed = grp(mesh(new THREE.BoxGeometry(1.4, 0.35, 2.1), wood, 0, 0.2), mesh(new THREE.BoxGeometry(1.36, 0.2, 2), C('#fff8ee'), 0, 0.47), mesh(new THREE.BoxGeometry(1.38, 0.08, 1.3), fab('sage'), 0, 0.6, 0.35), mesh(new THREE.BoxGeometry(0.6, 0.14, 0.35), C('#ffffff'), 0, 0.64, -0.75));
  kit.campfire = grp(...[0, 1, 2, 3, 4].map(i => { const a = i / 5 * Math.PI * 2; return mesh(new THREE.DodecahedronGeometry(0.18, 0), C('#b8b0a2'), Math.cos(a) * 0.55, 0.12, Math.sin(a) * 0.55); }),
    mesh(new THREE.ConeGeometry(0.32, 0.8, 7), toon({ color: '#c67139', emissive: new THREE.Color('#e8843a'), emissiveIntensity: 0.9 }), 0, 0.45, 0, { outline: false }));
  for (const k in kit) kit[k].name = k;
  return kit;
}
