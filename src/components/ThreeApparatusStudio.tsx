/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  Box, 
  Eye, 
  RotateCw, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Sparkles, 
  Siren, 
  Flame, 
  Activity, 
  Sliders,
  Check
} from 'lucide-react';
import { Agency } from '../types';

export type ApparatusType = 'ambulance' | 'engine' | 'defib';
export type VisualPreset = 'studio' | 'duty' | 'night' | 'highvis';
export type CameraPreset = 'iso' | 'front' | 'side' | 'top' | 'clinical';

export interface ThreeApparatusStudioProps {
  activeAccount?: Agency | null;
}

// Module-scope scratch objects to ensure 0 GC allocations inside the render loop
const _vec3 = new THREE.Vector3();
const _targetVec = new THREE.Vector3();
const _camTarget = new THREE.Vector3();

/**
 * Creates a procedural diamond plate bump texture for fire apparatus and ambulance steps
 */
function createDiamondPlateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#e0e0e0';
  for (let y = 0; y < 128; y += 32) {
    for (let x = 0; x < 128; x += 32) {
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 16, 10, 3, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x + 32, y + 32, 10, 3, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Creates a procedural simulated ECG & CPR feedback display texture for the ZOLL monitor
 */
function createEcgScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark medical LCD background
  ctx.fillStyle = '#08141d';
  ctx.fillRect(0, 0, 512, 256);

  // Grid lines
  ctx.strokeStyle = '#0e2938';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y < 256; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Header status
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('LEAD II  HR: 72 bpm   SpO2: 98%   EtCO2: 38 mmHg', 16, 26);

  // Real CPR Help Bar
  ctx.fillStyle = '#10b981';
  ctx.fillRect(16, 38, 220, 14);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('REAL CPR HELP: OPTIMAL DEPTH 2.3in (108 cpm)', 20, 50);

  // ECG Waveform (Green Trace)
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const baseline = 130;
  ctx.moveTo(16, baseline);

  let curX = 16;
  while (curX < 490) {
    // P wave
    ctx.lineTo(curX + 15, baseline - 8);
    ctx.lineTo(curX + 30, baseline);
    // PR interval
    ctx.lineTo(curX + 45, baseline);
    // Q wave
    ctx.lineTo(curX + 50, baseline + 10);
    // R spike
    ctx.lineTo(curX + 60, baseline - 65);
    // S wave
    ctx.lineTo(curX + 70, baseline + 25);
    // ST segment
    ctx.lineTo(curX + 90, baseline);
    // T wave
    ctx.lineTo(curX + 115, baseline - 18);
    ctx.lineTo(curX + 140, baseline);
    curX += 160;
  }
  ctx.stroke();

  // ZOLL Dashboard watermark
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('ZOLL Medical Corporation - X Series Advanced', 16, 238);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates radial contact shadow plane
 */
function createContactShadow(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(10, 15, 25, 0.7)');
  gradient.addColorStop(0.5, 'rgba(10, 15, 25, 0.3)');
  gradient.addColorStop(1, 'rgba(10, 15, 25, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(8, 6);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0.85
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.01; // offset from floor
  return mesh;
}

export const ThreeApparatusStudio: React.FC<ThreeApparatusStudioProps> = ({ activeAccount }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // UI state (consolidated into collapsible bottom dock)
  const [apparatusType, setApparatusType] = useState<ApparatusType>(() => {
    if (activeAccount?.providerCategory === 'FIRE' || activeAccount?.agencyType?.toLowerCase().includes('fire')) return 'engine';
    return 'ambulance';
  });
  const [preset, setPreset] = useState<VisualPreset>('studio');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);

  // Auto-switch apparatus when activeAccount changes
  useEffect(() => {
    if (activeAccount) {
      if (activeAccount.providerCategory === 'FIRE' || activeAccount.agencyType?.toLowerCase().includes('fire')) {
        setApparatusType('engine');
      } else {
        setApparatusType('ambulance');
      }
    }
  }, [activeAccount?.id, activeAccount?.agencyType, activeAccount?.providerCategory]);

  // Mutable refs to decouple animation tick from React renders
  const stateRef = useRef({
    apparatusType,
    preset,
    cameraPreset,
    explodedFactor,
    isRotating,
  });

  useEffect(() => {
    stateRef.current = {
      apparatusType,
      preset,
      cameraPreset,
      explodedFactor,
      isRotating,
    };
  }, [apparatusType, preset, cameraPreset, explodedFactor, isRotating]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8fafc');
    scene.fog = new THREE.FogExp2('#f8fafc', 0.025);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 640;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(7.5, 4.5, 8.5);
    camera.lookAt(0, 1.2, 0);

    // 2. Renderer Setup with PBR Tone Mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Studio Environment Map (PMREMGenerator + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#cbd5e1', 1.0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 3.0);
    dirLight.position.set(6, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 1.2);
    rimLight.position.set(-8, 5, -8);
    scene.add(rimLight);

    // Floor Grid Plane
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Procedural Grid Overlay
    const grid = new THREE.GridHelper(30, 30, '#94a3b8', '#cbd5e1');
    grid.position.y = 0.005;
    scene.add(grid);

    // Contact Shadow
    const contactShadow = createContactShadow();
    scene.add(contactShadow);

    // 5. Shared Procedural Materials
    const diamondTexture = createDiamondPlateTexture();
    const ecgTexture = createEcgScreenTexture();

    const matWhiteBody = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25, metalness: 0.1 });
    const matAmbulanceOrange = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.35, metalness: 0.1 });
    const matFireRed = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.22, metalness: 0.25 });
    const matZollYellow = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.35, metalness: 0.15 });
    const matDarkPolymer = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.65, metalness: 0.3 });
    const matChrome = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.08, metalness: 0.95 });
    const matGlass = new THREE.MeshPhysicalMaterial({ color: '#38bdf8', transmission: 0.85, opacity: 0.85, transparent: true, roughness: 0.1, ior: 1.5 });
    const matRubber = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9, metalness: 0.05 });
    const matDiamondPlate = new THREE.MeshStandardMaterial({ color: '#94a3b8', bumpMap: diamondTexture, bumpScale: 0.04, roughness: 0.3, metalness: 0.8 });
    const matEcgScreen = new THREE.MeshBasicMaterial({ map: ecgTexture });
    const matEmergencyRed = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#dc2626', emissiveIntensity: 0.8, roughness: 0.2 });
    const matEmergencyBlue = new THREE.MeshStandardMaterial({ color: '#3b82f6', emissive: '#2563eb', emissiveIntensity: 0.8, roughness: 0.2 });

    // Root model container
    const apparatusRoot = new THREE.Group();
    scene.add(apparatusRoot);

    // Exploded view tracking arrays: store part references and their expansion vectors
    interface ExplodedPart {
      mesh: THREE.Object3D;
      originalPos: THREE.Vector3;
      explodeDir: THREE.Vector3;
    }
    let explodedParts: ExplodedPart[] = [];

    // -------------------------------------------------------------
    // BUILD MODEL 1: Frontline ALS Ambulance (10 distinct procedural parts)
    // -------------------------------------------------------------
    function buildAmbulance(): THREE.Group {
      const group = new THREE.Group();
      explodedParts = [];

      // 1. Cab / Front Chassis
      const cabGeo = new THREE.BoxGeometry(2.1, 1.4, 1.8);
      const cab = new THREE.Mesh(cabGeo, matWhiteBody);
      cab.position.set(0, 1.0, 1.7);
      cab.castShadow = true;
      group.add(cab);
      explodedParts.push({ mesh: cab, originalPos: cab.position.clone(), explodeDir: new THREE.Vector3(0, 0, 1.2) });

      // 2. Windshield & Cab Windows
      const windGeo = new THREE.BoxGeometry(2.0, 0.75, 0.6);
      const wind = new THREE.Mesh(windGeo, matGlass);
      wind.position.set(0, 1.45, 1.95);
      group.add(wind);
      explodedParts.push({ mesh: wind, originalPos: wind.position.clone(), explodeDir: new THREE.Vector3(0, 0.5, 1.5) });

      // 3. Patient Care Module (Main Box Body)
      const boxGeo = new THREE.BoxGeometry(2.4, 1.9, 3.4);
      const box = new THREE.Mesh(boxGeo, matWhiteBody);
      box.position.set(0, 1.35, -0.9);
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);
      explodedParts.push({ mesh: box, originalPos: box.position.clone(), explodeDir: new THREE.Vector3(0, 0, -0.6) });

      // 4. Emergency Side Stripe Accent
      const stripeGeo = new THREE.BoxGeometry(2.44, 0.35, 3.35);
      const stripe = new THREE.Mesh(stripeGeo, matAmbulanceOrange);
      stripe.position.set(0, 1.25, -0.9);
      group.add(stripe);
      explodedParts.push({ mesh: stripe, originalPos: stripe.position.clone(), explodeDir: new THREE.Vector3(0, 0, -0.6) });

      // 5. Heavy Duty Chrome Bumper & Grille
      const bumperGeo = new THREE.BoxGeometry(2.3, 0.45, 0.4);
      const bumper = new THREE.Mesh(bumperGeo, matChrome);
      bumper.position.set(0, 0.45, 2.7);
      bumper.castShadow = true;
      group.add(bumper);
      explodedParts.push({ mesh: bumper, originalPos: bumper.position.clone(), explodeDir: new THREE.Vector3(0, -0.2, 1.8) });

      // 6. Rear Patient Loading Step (Diamond Plate)
      const stepGeo = new THREE.BoxGeometry(2.3, 0.25, 0.6);
      const step = new THREE.Mesh(stepGeo, matDiamondPlate);
      step.position.set(0, 0.35, -2.8);
      step.castShadow = true;
      group.add(step);
      explodedParts.push({ mesh: step, originalPos: step.position.clone(), explodeDir: new THREE.Vector3(0, -0.2, -1.8) });

      // 7. Roof Aerodynamic LED Emergency Lightbar
      const lightbarGeo = new THREE.BoxGeometry(1.9, 0.18, 0.4);
      const lightbar = new THREE.Mesh(lightbarGeo, matEmergencyRed);
      lightbar.position.set(0, 1.85, 1.7);
      group.add(lightbar);
      explodedParts.push({ mesh: lightbar, originalPos: lightbar.position.clone(), explodeDir: new THREE.Vector3(0, 1.4, 0.8) });

      // 8. Rear Corner Emergency Beacons
      const beaconGeo = new THREE.BoxGeometry(2.45, 0.16, 0.25);
      const beacon = new THREE.Mesh(beaconGeo, matEmergencyBlue);
      beacon.position.set(0, 2.35, -2.55);
      group.add(beacon);
      explodedParts.push({ mesh: beacon, originalPos: beacon.position.clone(), explodeDir: new THREE.Vector3(0, 1.5, -1.2) });

      // 9. Heavy Duty Wheels (Front & Rear Pairs)
      const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24);
      wheelGeo.rotateZ(Math.PI / 2);

      const wheelPositions = [
        [-1.15, 0.42, 1.7],
        [1.15, 0.42, 1.7],
        [-1.15, 0.42, -1.6],
        [1.15, 0.42, -1.6]
      ];

      wheelPositions.forEach((pos, idx) => {
        const w = new THREE.Mesh(wheelGeo, matRubber);
        w.position.set(pos[0], pos[1], pos[2]);
        w.castShadow = true;
        group.add(w);

        // Chrome hubcap
        const hubGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.34, 16);
        hubGeo.rotateZ(Math.PI / 2);
        const hub = new THREE.Mesh(hubGeo, matChrome);
        w.add(hub);

        explodedParts.push({ 
          mesh: w, 
          originalPos: w.position.clone(), 
          explodeDir: new THREE.Vector3(pos[0] * 1.5, -0.2, pos[2] * 0.3) 
        });
      });

      // 10. Side Scene Spotlights
      const spotGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
      spotGeo.rotateZ(Math.PI / 2);
      const spotL = new THREE.Mesh(spotGeo, matChrome);
      spotL.position.set(-1.22, 2.1, -0.4);
      group.add(spotL);
      const spotR = spotL.clone();
      spotR.position.x = 1.22;
      group.add(spotR);

      return group;
    }

    // -------------------------------------------------------------
    // BUILD MODEL 2: Heavy Rescue Fire Engine (11 distinct procedural parts)
    // -------------------------------------------------------------
    function buildFireEngine(): THREE.Group {
      const group = new THREE.Group();
      explodedParts = [];

      // 1. Heavy Commercial Crew Cab
      const cabGeo = new THREE.BoxGeometry(2.3, 1.8, 2.2);
      const cab = new THREE.Mesh(cabGeo, matFireRed);
      cab.position.set(0, 1.25, 2.0);
      cab.castShadow = true;
      group.add(cab);
      explodedParts.push({ mesh: cab, originalPos: cab.position.clone(), explodeDir: new THREE.Vector3(0, 0, 1.4) });

      // 2. Wrap-around Heavy Windshield & Side Glass
      const glassGeo = new THREE.BoxGeometry(2.2, 0.8, 1.1);
      const glass = new THREE.Mesh(glassGeo, matGlass);
      glass.position.set(0, 1.65, 2.25);
      group.add(glass);
      explodedParts.push({ mesh: glass, originalPos: glass.position.clone(), explodeDir: new THREE.Vector3(0, 0.6, 1.8) });

      // 3. Apparatus Equipment Body & Hosebed
      const bodyGeo = new THREE.BoxGeometry(2.35, 1.8, 3.8);
      const body = new THREE.Mesh(bodyGeo, matFireRed);
      body.position.set(0, 1.3, -1.0);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);
      explodedParts.push({ mesh: body, originalPos: body.position.clone(), explodeDir: new THREE.Vector3(0, 0, -0.8) });

      // 4. Side Roll-up Compartment Doors (Brushed Diamond Metal)
      const doorGeo = new THREE.BoxGeometry(2.4, 1.1, 2.8);
      const doors = new THREE.Mesh(doorGeo, matDiamondPlate);
      doors.position.set(0, 1.1, -1.0);
      group.add(doors);
      explodedParts.push({ mesh: doors, originalPos: doors.position.clone(), explodeDir: new THREE.Vector3(0, 0, -0.8) });

      // 5. Side-Mount Water Pump Panel (Intake/Discharge Gauges)
      const pumpGeo = new THREE.BoxGeometry(2.44, 0.9, 0.9);
      const pump = new THREE.Mesh(pumpGeo, matDarkPolymer);
      pump.position.set(0, 1.1, 0.6);
      group.add(pump);
      explodedParts.push({ mesh: pump, originalPos: pump.position.clone(), explodeDir: new THREE.Vector3(0, -0.2, 0.3) });

      // 6. Hard Suction Hoses on Flanks
      const hoseGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.4, 16);
      hoseGeo.rotateX(Math.PI / 2);
      const hoseL = new THREE.Mesh(hoseGeo, matDarkPolymer);
      hoseL.position.set(-1.24, 2.05, -1.0);
      group.add(hoseL);
      const hoseR = hoseL.clone();
      hoseR.position.x = 1.24;
      group.add(hoseR);

      // 7. Roof Ladder Gantry Rack
      const ladderGeo = new THREE.BoxGeometry(0.7, 0.25, 3.8);
      const ladder = new THREE.Mesh(ladderGeo, matChrome);
      ladder.position.set(0.6, 2.4, -1.0);
      ladder.castShadow = true;
      group.add(ladder);
      explodedParts.push({ mesh: ladder, originalPos: ladder.position.clone(), explodeDir: new THREE.Vector3(0.5, 1.2, 0) });

      // 8. Federal Q2B Mechanical Chrome Siren & Dual Lightbars
      const sirenGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const siren = new THREE.Mesh(sirenGeo, matChrome);
      siren.position.set(0, 0.9, 3.2);
      group.add(siren);

      const lightbarGeo = new THREE.BoxGeometry(2.0, 0.18, 0.4);
      const lightbar = new THREE.Mesh(lightbarGeo, matEmergencyRed);
      lightbar.position.set(0, 2.25, 1.9);
      group.add(lightbar);
      explodedParts.push({ mesh: lightbar, originalPos: lightbar.position.clone(), explodeDir: new THREE.Vector3(0, 1.4, 0.8) });

      // 9. Heavy Front Bumper & Winch
      const frontBumperGeo = new THREE.BoxGeometry(2.45, 0.5, 0.5);
      const frontBumper = new THREE.Mesh(frontBumperGeo, matDiamondPlate);
      frontBumper.position.set(0, 0.48, 3.2);
      frontBumper.castShadow = true;
      group.add(frontBumper);
      explodedParts.push({ mesh: frontBumper, originalPos: frontBumper.position.clone(), explodeDir: new THREE.Vector3(0, -0.3, 1.8) });

      // 10. Heavy 6-Wheel Tandem Axle Chassis
      const tireGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.38, 24);
      tireGeo.rotateZ(Math.PI / 2);

      const tireCoords = [
        [-1.18, 0.5, 2.0], [1.18, 0.5, 2.0],
        [-1.18, 0.5, -0.8], [1.18, 0.5, -0.8],
        [-1.18, 0.5, -1.8], [1.18, 0.5, -1.8]
      ];

      tireCoords.forEach(pos => {
        const tire = new THREE.Mesh(tireGeo, matRubber);
        tire.position.set(pos[0], pos[1], pos[2]);
        tire.castShadow = true;
        group.add(tire);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 16).rotateZ(Math.PI / 2), matChrome);
        tire.add(hub);

        explodedParts.push({ 
          mesh: tire, 
          originalPos: tire.position.clone(), 
          explodeDir: new THREE.Vector3(pos[0] * 1.4, -0.2, pos[2] * 0.2) 
        });
      });

      return group;
    }

    // -------------------------------------------------------------
    // BUILD MODEL 3: ZOLL X Series Advanced Clinical Monitor (9 distinct parts)
    // -------------------------------------------------------------
    function buildDefibrillator(): THREE.Group {
      const group = new THREE.Group();
      explodedParts = [];

      // 1. Ruggedized Main Unit Housing
      const bodyGeo = new THREE.BoxGeometry(2.6, 2.1, 1.5);
      const body = new THREE.Mesh(bodyGeo, matZollYellow);
      body.position.set(0, 1.25, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);
      explodedParts.push({ mesh: body, originalPos: body.position.clone(), explodeDir: new THREE.Vector3(0, 0, -0.2) });

      // 2. Impact-Resistant Rubberized Armor Roll-Cage
      const cageGeo = new THREE.BoxGeometry(2.76, 2.24, 1.56);
      const cage = new THREE.Mesh(cageGeo, matDarkPolymer);
      cage.position.set(0, 1.25, 0);
      group.add(cage);
      explodedParts.push({ mesh: cage, originalPos: cage.position.clone(), explodeDir: new THREE.Vector3(0, 0, -0.5) });

      // 3. High-Contrast Sunlight LCD Display with Active ECG Waveform
      const screenGeo = new THREE.PlaneGeometry(1.65, 1.15);
      const screen = new THREE.Mesh(screenGeo, matEcgScreen);
      screen.position.set(-0.32, 1.35, 0.8);
      group.add(screen);
      explodedParts.push({ mesh: screen, originalPos: screen.position.clone(), explodeDir: new THREE.Vector3(0, 0.3, 1.2) });

      // 4. Rotary Mode Selector Dial (Off / Monitor / Defib / Pacer)
      const dialGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 24);
      dialGeo.rotateX(Math.PI / 2);
      const dial = new THREE.Mesh(dialGeo, matChrome);
      dial.position.set(0.85, 1.6, 0.82);
      group.add(dial);
      explodedParts.push({ mesh: dial, originalPos: dial.position.clone(), explodeDir: new THREE.Vector3(0.5, 0.5, 1.4) });

      // 5. Clinical Shock Button (Illuminated Safety Red)
      const shockGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 20);
      shockGeo.rotateX(Math.PI / 2);
      const shock = new THREE.Mesh(shockGeo, matEmergencyRed);
      shock.position.set(0.85, 1.05, 0.82);
      group.add(shock);
      explodedParts.push({ mesh: shock, originalPos: shock.position.clone(), explodeDir: new THREE.Vector3(0.5, 0, 1.4) });

      // 6. Ergonomic Top Carry Handle
      const handleShape = new THREE.Shape();
      handleShape.moveTo(-0.9, 0);
      handleShape.lineTo(0.9, 0);
      handleShape.lineTo(0.7, 0.45);
      handleShape.lineTo(-0.7, 0.45);
      handleShape.closePath();
      const extrudeSettings = { depth: 0.22, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
      const handleGeo = new THREE.ExtrudeGeometry(handleShape, extrudeSettings);
      const handle = new THREE.Mesh(handleGeo, matDarkPolymer);
      handle.position.set(0, 2.3, -0.1);
      handle.castShadow = true;
      group.add(handle);
      explodedParts.push({ mesh: handle, originalPos: handle.position.clone(), explodeDir: new THREE.Vector3(0, 1.2, 0) });

      // 7. Multi-Lead Patient Cable Sockets (EtCO2, SpO2, NIBP, 12-Lead ECG)
      const portGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16);
      portGeo.rotateZ(Math.PI / 2);
      const port1 = new THREE.Mesh(portGeo, matChrome);
      port1.position.set(-1.4, 1.5, 0.2);
      group.add(port1);

      const port2 = port1.clone();
      port2.position.set(-1.4, 1.1, 0.2);
      group.add(port2);

      const port3 = port1.clone();
      port3.position.set(-1.4, 0.7, 0.2);
      group.add(port3);

      // 8. Therapy Cable Port & Shock Paddle Dock
      const paddleBayGeo = new THREE.BoxGeometry(0.35, 1.4, 1.0);
      const paddleBay = new THREE.Mesh(paddleBayGeo, matDarkPolymer);
      paddleBay.position.set(1.4, 1.25, 0);
      group.add(paddleBay);
      explodedParts.push({ mesh: paddleBay, originalPos: paddleBay.position.clone(), explodeDir: new THREE.Vector3(1.2, 0, 0) });

      // 9. Rear Battery Well & Defibrillator Capacitor Housing
      const batteryGeo = new THREE.BoxGeometry(2.2, 0.7, 0.45);
      const battery = new THREE.Mesh(batteryGeo, matDarkPolymer);
      battery.position.set(0, 0.65, -0.85);
      battery.castShadow = true;
      group.add(battery);
      explodedParts.push({ mesh: battery, originalPos: battery.position.clone(), explodeDir: new THREE.Vector3(0, -0.5, -1.2) });

      return group;
    }

    // Instantiation helper
    let currentApparatusGroup: THREE.Group | null = null;

    function switchModel(type: ApparatusType) {
      if (currentApparatusGroup) {
        apparatusRoot.remove(currentApparatusGroup);
      }

      if (type === 'ambulance') {
        currentApparatusGroup = buildAmbulance();
        contactShadow.scale.set(1, 1, 1);
      } else if (type === 'engine') {
        currentApparatusGroup = buildFireEngine();
        contactShadow.scale.set(1.2, 1.3, 1);
      } else {
        currentApparatusGroup = buildDefibrillator();
        contactShadow.scale.set(0.65, 0.65, 1);
      }

      apparatusRoot.add(currentApparatusGroup);
    }

    switchModel(stateRef.current.apparatusType);

    // 6. Camera Preset Targets
    function applyCameraPreset(preset: CameraPreset) {
      if (preset === 'iso') {
        _camTarget.set(7.5, 4.5, 8.5);
      } else if (preset === 'front') {
        _camTarget.set(0, 2.5, 9.5);
      } else if (preset === 'side') {
        _camTarget.set(9.5, 2.5, 0);
      } else if (preset === 'top') {
        _camTarget.set(0.1, 12, 0.1);
      } else if (preset === 'clinical') {
        _camTarget.set(2.2, 2.0, 3.8);
      }
    }

    // Orbit Drag Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = { radius: 11, theta: Math.PI / 4, phi: Math.PI / 3 };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      spherical.theta -= deltaX * 0.007;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.05, spherical.phi - deltaY * 0.007));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      spherical.radius = Math.max(3.5, Math.min(22, spherical.radius + e.deltaY * 0.01));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('wheel', onWheel, { passive: true });

    // 7. Animation Loop with Exponential Damping & 60fps Stability
    let animationFrameId: number;
    let lastTime = performance.now();
    let currentModelType = stateRef.current.apparatusType;

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const currentState = stateRef.current;

      // Handle Model Switch
      if (currentModelType !== currentState.apparatusType) {
        currentModelType = currentState.apparatusType;
        switchModel(currentModelType);
      }

      // Auto-rotation if enabled and not dragging
      if (currentState.isRotating && !isDragging) {
        spherical.theta += dt * 0.35;
      }

      // Smooth Camera Damping
      const targetX = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      const targetY = spherical.radius * Math.cos(spherical.phi);
      const targetZ = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, Math.max(0.8, targetY), 5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 5, dt);
      camera.lookAt(0, 1.2, 0);

      // Smooth Exploded View Layer Separation
      const targetExp = currentState.explodedFactor;
      explodedParts.forEach(part => {
        _targetVec.copy(part.originalPos).addScaledVector(part.explodeDir, targetExp);
        part.mesh.position.lerp(_targetVec, 1 - Math.exp(-8 * dt));
      });

      // Render
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('wheel', onWheel);

      renderer.dispose();
      diamondTexture.dispose();
      ecgTexture.dispose();
      if (container && domElement.parentNode === container) {
        container.removeChild(domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-300 bg-slate-100 shadow-md select-none">
      
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: 3D Studio Identity & Active Specification HUD */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/95 border border-slate-300 px-3.5 py-2 rounded-xl shadow-md">
          <Box className="w-4 h-4 text-sky-600" />
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <span>ZOLL Hardware & Apparatus 3D Studio</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200 font-mono">Three.js PBR</span>
            </div>
            <div className="text-[11px] text-slate-600 font-mono mt-0.5">
              {apparatusType === 'ambulance' && 'Type III Modular ALS Transport Unit • Stryker/ZOLL Interface'}
              {apparatusType === 'engine' && 'Class A Rescue Pumper • NFPA 1901 Spec • High-Pressure Foam'}
              {apparatusType === 'defib' && 'ZOLL X Series Advanced • Real CPR Help • 12-Lead ECG • AutoPulse Ready'}
            </div>
            {activeAccount && (
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-700">
                <span>Account Spec: <strong>{activeAccount.name}</strong> ({activeAccount.fleet?.currentDefibVendor || activeAccount.installedFleet?.defibBrand || 'Competitor'} fleet)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Right: Exploded Factor Readout & Auto-Rotate Toggle HUD */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
            isRotating 
              ? 'bg-sky-600 text-white border border-sky-600' 
              : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300'
          }`}
          title="Toggle Turntable Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          <span>{isRotating ? 'Auto-Orbiting' : 'Paused'}</span>
        </button>

        <button
          onClick={() => setExplodedFactor(explodedFactor > 0.05 ? 0 : 1)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
            explodedFactor > 0.05
              ? 'bg-amber-600 text-white border border-amber-600'
              : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300'
          }`}
          title="Exploded View Toggle"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{explodedFactor > 0.05 ? 'Collapse Parts' : 'Explode Spec'}</span>
        </button>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock HUD */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl transition-all duration-300 ${
        isControlsCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}>
        
        {/* Collapse Toggle Tab */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            className="px-4 py-1 rounded-t-lg bg-white border-t border-x border-slate-300 text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 shadow-sm"
          >
            {isControlsCollapsed ? <ChevronUp className="w-3 h-3 text-sky-600" /> : <ChevronDown className="w-3 h-3 text-sky-600" />}
            <span>{isControlsCollapsed ? 'Expand 3D Controls' : 'Cinema Mode (Hide)'}</span>
          </button>
        </div>

        {/* Main Dock Container */}
        <div className="bg-white/95 border border-slate-300 rounded-2xl p-3 shadow-lg space-y-2.5 text-slate-900">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Subject Selector Buttons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold mr-1">Subject:</span>
              <button
                onClick={() => setApparatusType('ambulance')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                  apparatusType === 'ambulance'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Siren className="w-3.5 h-3.5" />
                <span>ALS Ambulance</span>
              </button>

              <button
                onClick={() => setApparatusType('engine')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                  apparatusType === 'engine'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Rescue Pumper</span>
              </button>

              <button
                onClick={() => setApparatusType('defib')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                  apparatusType === 'defib'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>ZOLL X Series</span>
              </button>
            </div>

            {/* Exploded View Slider */}
            <div className="flex items-center gap-2 w-full sm:w-64">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold whitespace-nowrap">Explode:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={explodedFactor}
                onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <span className="text-[10px] font-mono text-sky-700 font-bold w-9 text-right">
                {Math.round(explodedFactor * 100)}%
              </span>
            </div>

          </div>

          {/* Secondary Controls Bar: Material Finishes & Specs */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-600">PBR Environment:</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Studio ACES Filmic Tone • PMREM Room HDR
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Radial Contact Shadow Grounding
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Drag to orbit</span>
              <span>&bull;</span>
              <span>Scroll to zoom</span>
              <span>&bull;</span>
              <span className="text-sky-600 font-semibold">60 FPS Lossless</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
