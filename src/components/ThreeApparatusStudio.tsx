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
  Check,
  Crosshair
} from 'lucide-react';
import { Agency } from '../types';

export type ApparatusType = 'ambulance' | 'engine' | 'defib';
export type VisualPreset = 'studio' | 'duty' | 'night' | 'highvis';
export type CameraPreset = 'iso' | 'front' | 'side' | 'top' | 'clinical';

export interface ThreeApparatusStudioProps {
  activeAccount?: Agency | null;
}

export interface ApparatusHotspot {
  id: string;
  label: string;
  subsystem: string;
  spherical: { radius: number; theta: number; phi: number };
  lookAt: [number, number, number];
  zollAdvantage: string;
  competitorGap: string;
}

const APPARATUS_HOTSPOTS: Record<ApparatusType, ApparatusHotspot[]> = {
  defib: [
    {
      id: 'cpr_display',
      label: 'Real CPR Help & BVM HUD',
      subsystem: 'High-Contrast Sunlight LCD • Dual Depth/Rate Bar',
      spherical: { radius: 4.8, theta: 0.12, phi: 1.25 },
      lookAt: [0, 1.35, 0.45],
      zollAdvantage: 'Real-time numeric depth (2.0–2.4 in), release velocity, and Perfusion Performance Indicator (PPI) on screen.',
      competitorGap: 'Stryker LIFEPAK 15 requires external TrueCPR puck; lacks integrated Real BVM Help tidal volume/rate telemetry.'
    },
    {
      id: 'onestep_bay',
      label: 'OneStep Pacing & Defib Bay',
      subsystem: 'Right High-Voltage Therapy Connector & Printer',
      spherical: { radius: 5.0, theta: 0.85, phi: 1.22 },
      lookAt: [0.95, 1.25, 0.2],
      zollAdvantage: 'Single OneStep cable integrates ECG monitoring, rectilinear biphasic 200J defib, and 40mA pacing without separate 3-lead cable.',
      competitorGap: 'Legacy 360J escalating monophasic/biphasic designs require higher peak current and separate pacing/ECG lead sets.'
    },
    {
      id: 'masimo_ports',
      label: 'Masimo Rainbow SET & EtCO2',
      subsystem: 'Left Patient Telemetry Manifold (SpO2 / SpCO / NIBP)',
      spherical: { radius: 5.0, theta: -0.95, phi: 1.25 },
      lookAt: [-0.95, 1.15, 0.15],
      zollAdvantage: 'Simultaneous 3-waveform display + Sidestream/Mainstream EtCO2 + Masimo SpCO carbon monoxide screening for fireground rehab.',
      competitorGap: 'Rival units weigh 18.9+ lbs (vs ZOLL 11.7 lbs), increasing medic musculoskeletal fatigue on multi-story carry-downs.'
    },
    {
      id: 'surepower_battery',
      label: 'SurePower II Li-Ion Bay',
      subsystem: 'Rear Smart Battery Well & Rapid-Charge Interface',
      spherical: { radius: 5.4, theta: 2.75, phi: 1.2 },
      lookAt: [0, 1.2, -0.55],
      zollAdvantage: '6-hour continuous runtime per SurePower II pack with calibrated runtime-in-minutes LED telemetry (eliminates blind battery swaps).',
      competitorGap: 'Unsealed SLA/legacy packs suffer memory degradation and require 2x more frequent battery replacement cycles over 7 years.'
    }
  ],
  ambulance: [
    {
      id: 'als_module',
      label: 'ALS Patient Module & Mount',
      subsystem: 'SAE J3043 Crash-Rated X Series & AutoPulse Action Wall',
      spherical: { radius: 7.2, theta: -0.65, phi: 1.18 },
      lookAt: [-0.5, 1.65, 0],
      zollAdvantage: '26G SAE J3043 certified swivel mount keeps X Series & Z Vent within 18-inch ergonomic reach of airway seat.',
      competitorGap: 'Heavy 19 lb legacy monitors require reinforced dual-latch brackets and obstruct action-wall oxygen flowmeters.'
    },
    {
      id: 'cab_telemetry',
      label: 'Cab CAD & STEMI Telemetry',
      subsystem: '5G/LTE RescueNet CaseReview & Hospital Pre-Alert Router',
      spherical: { radius: 6.5, theta: 0.72, phi: 1.22 },
      lookAt: [2.1, 1.35, 0.3],
      zollAdvantage: 'Automated 12-lead STEMI transmission to receiving cath lab + zero-touch NEMSIS 3.5 ePCR waveform upload.',
      competitorGap: 'Manual modem pairing adds 3.5+ minutes to door-to-balloon activation during rural/suburban STEMI transports.'
    },
    {
      id: 'extrication_bay',
      label: 'Exterior O2 & Z Vent Bay',
      subsystem: 'Weather-Sealed Exterior Medical & Cylinder Compartment',
      spherical: { radius: 6.8, theta: 0.55, phi: 1.32 },
      lookAt: [-1.2, 1.2, 1.15],
      zollAdvantage: 'Z Vent internal compressor runs 10+ hours without depleting onboard M-tank oxygen during long interfacility transfers.',
      competitorGap: 'Pneumatic-only transport vents consume 100% driving gas from portable D-cylinders, risking mid-transport O2 depletion.'
    },
    {
      id: 'lightbar_array',
      label: 'NFPA 1917 Emergency Array',
      subsystem: 'Perimeter Whelen LED Warning & Scene Flood Optics',
      spherical: { radius: 7.5, theta: 0.35, phi: 0.85 },
      lookAt: [0.2, 2.55, 0],
      zollAdvantage: 'High-visibility scene lighting paired with ZOLL RescueNet Road Safety reduces intersection collision risk by 42%.',
      competitorGap: 'Standard fleet telematics lack real-time G-force patient compartment smoothness scoring for medic safety.'
    }
  ],
  engine: [
    {
      id: 'pump_panel',
      label: 'Mid-Ship 1500 GPM Pump Panel',
      subsystem: 'NFPA 1901 Master Pressure Governor & Crosslay Manifold',
      spherical: { radius: 6.8, theta: 0.25, phi: 1.28 },
      lookAt: [0.4, 1.35, 1.15],
      zollAdvantage: 'Engine company first-response ALS integration: Masimo Rainbow SET SpCO screens firefighters for CO toxicity at rehab.',
      competitorGap: 'Standard pulse oximeters read carboxyhemoglobin as normal SpO2, masking lethal carbon monoxide exposure.'
    },
    {
      id: 'als_compartment',
      label: 'ALS Medical & AutoPulse Bay',
      subsystem: 'Roll-Up Rescue Compartment #2 (Monitor + Mechanical CPR)',
      spherical: { radius: 6.8, theta: -0.35, phi: 1.28 },
      lookAt: [-1.3, 1.4, 1.15],
      zollAdvantage: 'Slim X Series (11.7 lbs) + AutoPulse low-profile board fit standard 18-inch deep pumper compartments without custom shelving.',
      competitorGap: 'Bulky piston CPR devices + 19 lb monitors require full compartment reconfiguration on Class A pumpers.'
    },
    {
      id: 'crew_cab',
      label: 'Heavy Rescue Crew Cab',
      subsystem: '6-Person SCBA Command Cab & In-Transit Charging Mount',
      spherical: { radius: 7.0, theta: 0.78, phi: 1.18 },
      lookAt: [2.2, 1.6, 0.4],
      zollAdvantage: 'Direct 12V DC apparatus shoreline trickle-charges X Series & AutoPulse batteries continuously between 911 runs.',
      competitorGap: 'Desktop-only battery bays force crews to rotate depleted batteries back at the firehouse.'
    },
    {
      id: 'rear_hosebed',
      label: 'Booster Tank & Ladders',
      subsystem: '750-Gallon Poly Tank & 24-Ft Extension Ladder Rack',
      spherical: { radius: 7.8, theta: -2.2, phi: 1.1 },
      lookAt: [-2.2, 1.8, -0.5],
      zollAdvantage: 'IP55 dust/water ingress protection withstands high-pressure hose spray and extreme fireground particulates.',
      competitorGap: 'IP44-rated rival monitors are vulnerable to water spray ingress during inclement weather fireground operations.'
    }
  ]
};

// Module-scope scratch objects to ensure 0 GC allocations inside the render loop
const _vec3 = new THREE.Vector3();
const _targetVec = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3(0, 1.2, 0);
const _currentLook = new THREE.Vector3(0, 1.2, 0);

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
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);

  const activeHotspot = APPARATUS_HOTSPOTS[apparatusType].find(h => h.id === activeHotspotId) || null;

  // Auto-switch apparatus when activeAccount changes
  useEffect(() => {
    if (activeAccount) {
      if (activeAccount.providerCategory === 'FIRE' || activeAccount.agencyType?.toLowerCase().includes('fire')) {
        setApparatusType('engine');
      } else {
        setApparatusType('ambulance');
      }
      setActiveHotspotId(null);
    }
  }, [activeAccount?.id, activeAccount?.agencyType, activeAccount?.providerCategory]);

  // Mutable refs to decouple animation tick from React renders
  const stateRef = useRef({
    apparatusType,
    preset,
    cameraPreset,
    explodedFactor,
    isRotating,
    activeHotspot: null as ApparatusHotspot | null,
  });

  useEffect(() => {
    stateRef.current = {
      apparatusType,
      preset,
      cameraPreset,
      explodedFactor,
      isRotating,
      activeHotspot,
    };
  }, [apparatusType, preset, cameraPreset, explodedFactor, isRotating, activeHotspot]);

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

      // If an interactive hotspot is selected, smoothly damp spherical coordinates and lookAt target toward the subsystem
      if (currentState.activeHotspot && !isDragging) {
        spherical.radius = THREE.MathUtils.damp(spherical.radius, currentState.activeHotspot.spherical.radius, 4.5, dt);
        spherical.theta = THREE.MathUtils.damp(spherical.theta, currentState.activeHotspot.spherical.theta, 4.5, dt);
        spherical.phi = THREE.MathUtils.damp(spherical.phi, currentState.activeHotspot.spherical.phi, 4.5, dt);
        _lookTarget.set(
          currentState.activeHotspot.lookAt[0],
          currentState.activeHotspot.lookAt[1],
          currentState.activeHotspot.lookAt[2]
        );
      } else {
        _lookTarget.set(0, 1.2, 0);
        // Auto-rotation if enabled and not dragging
        if (currentState.isRotating && !isDragging) {
          spherical.theta += dt * 0.35;
        }
      }

      // Smooth Camera Damping
      const targetX = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      const targetY = spherical.radius * Math.cos(spherical.phi);
      const targetZ = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, Math.max(0.8, targetY), 5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 5, dt);

      _currentLook.x = THREE.MathUtils.damp(_currentLook.x, _lookTarget.x, 5, dt);
      _currentLook.y = THREE.MathUtils.damp(_currentLook.y, _lookTarget.y, 5, dt);
      _currentLook.z = THREE.MathUtils.damp(_currentLook.z, _lookTarget.z, 5, dt);
      camera.lookAt(_currentLook);

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
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-950 shadow-md select-none">
      
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: 3D Studio Identity & Active Specification HUD with Crosshair Corner Ticks */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="relative flex items-center gap-2.5 backdrop-blur-md bg-slate-950/85 border border-white/10 px-4 py-2.5 rounded-xl shadow-lg text-white">
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-sky-400/60 pointer-events-none" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-sky-400/60 pointer-events-none" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-sky-400/60 pointer-events-none" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-sky-400/60 pointer-events-none" />
          <Box className="w-4 h-4 text-sky-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <span>ZOLL Hardware &amp; Apparatus 3D CAD Studio</span>
              <span className="text-[10px] text-sky-400 font-mono">· Three.js PBR</span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono mt-0.5">
              {apparatusType === 'ambulance' && 'Type III Modular ALS Transport Unit · Stryker/ZOLL Interface'}
              {apparatusType === 'engine' && 'Class A Rescue Pumper · NFPA 1901 Spec · High-Pressure Foam'}
              {apparatusType === 'defib' && 'ZOLL X Series Advanced · Real CPR Help · 12-Lead ECG · AutoPulse Ready'}
            </div>
            {activeAccount && (
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <span>Account Spec: <strong>{activeAccount.name}</strong> ({activeAccount.fleet?.currentDefibVendor || activeAccount.installedFleet?.defibBrand || 'Competitor'} fleet)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Right: CAD Telemetry Badge & Turntable HUD */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 pointer-events-auto">
        {/* CAD Telemetry HUD Readout */}
        <div className="backdrop-blur-md bg-slate-950/85 border border-white/10 rounded-xl px-2.5 py-1.5 shadow-2xl flex items-center gap-2.5 text-[9.5px] font-mono text-slate-300">
          <span className="text-sky-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            CAD SPEC 1:1
          </span>
          <span className="text-white/20">|</span>
          <span>PITCH: <span className="tabular-nums text-white font-semibold">-14°</span></span>
          <span className="text-white/20">·</span>
          <span>YAW: <span className="tabular-nums text-white font-semibold">122°</span></span>
          <span className="text-white/20">·</span>
          <span>FOV: <span className="tabular-nums text-white font-semibold">45mm</span></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs backdrop-blur-md cursor-pointer ${
              isRotating 
                ? 'bg-sky-600/90 text-white border border-sky-400/40 shadow-sky-950/50' 
                : 'bg-slate-950/85 text-slate-200 hover:text-white border border-white/10'
            }`}
            title="Toggle Turntable Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            <span>{isRotating ? 'Auto-Orbiting' : 'Paused'}</span>
          </button>

          <button
            onClick={() => setExplodedFactor(explodedFactor > 0.05 ? 0 : 1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs backdrop-blur-md cursor-pointer ${
              explodedFactor > 0.05
                ? 'bg-amber-600/90 text-white border border-amber-400/40 shadow-amber-950/50'
                : 'bg-slate-950/85 text-slate-200 hover:text-white border border-white/10'
            }`}
            title="Exploded View Toggle"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{explodedFactor > 0.05 ? 'Collapse Parts' : 'Explode Spec'}</span>
          </button>
        </div>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock HUD */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl transition-all duration-300 pointer-events-auto ${
        isControlsCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}>
        
        {/* Collapse Toggle Tab */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            className="px-4 py-1 rounded-t-lg backdrop-blur-md bg-slate-950/85 border-t border-x border-white/10 text-[11px] font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {isControlsCollapsed ? <ChevronUp className="w-3 h-3 text-sky-400" /> : <ChevronDown className="w-3 h-3 text-sky-400" />}
            <span>{isControlsCollapsed ? 'Expand 3D CAD Controls' : 'Cinema Mode (Hide)'}</span>
          </button>
        </div>

        {/* Main Dock Container */}
        <div className="relative backdrop-blur-md bg-slate-950/85 border border-white/10 rounded-2xl p-3 shadow-2xl space-y-2.5 text-white">
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-sky-400/60 pointer-events-none" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-sky-400/60 pointer-events-none" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-sky-400/60 pointer-events-none" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-sky-400/60 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Subject Selector Buttons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold mr-1">Apparatus:</span>
              <button
                onClick={() => { setApparatusType('ambulance'); setActiveHotspotId(null); }}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                  apparatusType === 'ambulance'
                    ? 'bg-sky-600 text-white shadow-md border border-sky-400/50'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-white/10'
                }`}
              >
                <Siren className="w-3.5 h-3.5" />
                <span>ALS Ambulance</span>
              </button>

              <button
                onClick={() => { setApparatusType('engine'); setActiveHotspotId(null); }}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                  apparatusType === 'engine'
                    ? 'bg-rose-600 text-white shadow-md border border-rose-400/50'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-white/10'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Rescue Pumper</span>
              </button>

              <button
                onClick={() => { setApparatusType('defib'); setActiveHotspotId(null); }}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                  apparatusType === 'defib'
                    ? 'bg-amber-600 text-white shadow-md border border-amber-400/50'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-white/10'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>ZOLL X Series</span>
              </button>
            </div>

            {/* Exploded View Slider */}
            <div className="flex items-center gap-2 w-full sm:w-64 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold whitespace-nowrap">Explode:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={explodedFactor}
                onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-[10px] font-mono text-sky-400 font-bold tabular-nums w-9 text-right">
                {Math.round(explodedFactor * 100)}%
              </span>
            </div>

          </div>

          {/* Interactive 3D Subsystem Callout Hotspots Bar */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-sky-400" />
                CAD Reticle Hotspots:
              </span>
              {APPARATUS_HOTSPOTS[apparatusType].map((spot, idx) => {
                const isSelected = activeHotspotId === spot.id;
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setActiveHotspotId(null);
                        setIsRotating(true);
                      } else {
                        setActiveHotspotId(spot.id);
                        setIsRotating(false);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-200 border-sky-400/60 shadow-xs'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-white/10'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full font-mono text-[9px] font-bold flex items-center justify-center ${
                      isSelected ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-300 border border-white/10'
                    }`}>
                      {idx + 1}
                    </span>
                    <span>{spot.label}</span>
                  </button>
                );
              })}
              {activeHotspot && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveHotspotId(null);
                    setIsRotating(true);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-white/10 transition-colors cursor-pointer ml-auto"
                >
                  Reset Orbit
                </button>
              )}
            </div>

            {/* Active Subsystem Clinical vs. Competitor Callout Banner */}
            {activeHotspot && (
              <div className="p-2.5 rounded-xl bg-slate-900/90 text-white border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs relative">
                <span className="absolute top-1 right-2 text-[8px] font-mono text-sky-400 uppercase">RETICLE LOCKED</span>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                    {activeHotspot.label} &bull; {activeHotspot.subsystem}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-200 leading-relaxed">
                    <strong className="text-emerald-400">ZOLL Engineering Advantage: </strong>
                    {activeHotspot.zollAdvantage}
                  </div>
                </div>
                <div className="md:border-l md:border-white/10 md:pl-3 flex flex-col justify-center">
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    <strong className="text-rose-400">Competitor Vulnerability: </strong>
                    {activeHotspot.competitorGap}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Secondary Controls Bar: Material Finishes & Specs */}
          <div className="pt-1.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
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
