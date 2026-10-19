// APPLICATIONS = problem domains (where and why). Technical methods live in services.ts; link by service id.
import type { VisualKey } from './services';

export interface Application {
  id: string;
  title: string;
  meta: string;
  summary: string;
  question: string; // the practical problem
  approach: string; // one sentence on the methods that could address it
  services: string[]; // service ids that can be combined to address it
  outputs: string[]; // outputs that could inform a decision
  visual: VisualKey;
  illustrative: true; // every example is illustrative unless real project evidence is added
}

export const APPLICATIONS: Application[] = [
  {
    id: 'flood-water',
    title: 'Flood & Water Intelligence',
    meta: 'WATER · EXPOSURE',
    summary:
      'Map flood extent, analyse water-body changes and assess potential exposure using satellite observations, terrain, rainfall and spatial data.',
    question: 'Where did the water go, how much has changed, and what sits in its path?',
    approach:
      'Compare radar and optical scenes from before and after the event to extract water extent, then overlay terrain-derived flow paths and land-use layers to estimate what lies within reach of the water.',
    services: ['remote-sensing', 'terrain-elevation', 'gis-modelling'],
    outputs: [
      'Flood-extent and water-change maps',
      'Exposure summary for land and assets',
      'Hotspot map with uncertainty notes',
    ],
    visual: 'flood',
    illustrative: true,
  },
  {
    id: 'agriculture-ecosystems',
    title: 'Agriculture & Ecosystems',
    meta: 'VEGETATION · LAND COVER',
    summary:
      'Monitor vegetation condition, crop patterns, land-cover transitions and ecosystem change.',
    question: 'Is vegetation healthy, where is land cover changing, and is the change seasonal or lasting?',
    approach:
      'Build a Sentinel-2 vegetation-index time series, then use a classifier to separate crop and land-cover types and flag anomalies against a seasonal baseline.',
    services: ['remote-sensing', 'geoai', 'data-engineering'],
    outputs: [
      'Vegetation-condition and anomaly maps',
      'Crop-pattern and land-cover transition maps',
      'Season-by-season change summary',
    ],
    visual: 'ndvi',
    illustrative: true,
  },
  {
    id: 'urban-land-use',
    title: 'Urban Planning & Land Use',
    meta: 'GROWTH · LULC TRANSITIONS',
    summary:
      'Analyse urban expansion, LULC transitions, planning conformance and spatial growth patterns.',
    question: 'Where is the built-up area growing, what land is it replacing, and does growth follow the plan?',
    approach:
      'Classify built-up and other land cover across several dates, compare the maps to quantify transitions, then overlay the planning layers to check where growth departs from the plan.',
    services: ['remote-sensing', 'geoai', 'gis-modelling', 'cartography-decision-support'],
    outputs: [
      'Urban-expansion and LULC-transition maps',
      'Conformance check against planning layers',
      'Growth-pattern indicators by zone',
    ],
    visual: 'urban',
    illustrative: true,
  },
  {
    id: 'infrastructure-resilience',
    title: 'Infrastructure & Climate Resilience',
    meta: 'EXPOSURE · BROAD-AREA CHANGE',
    summary:
      'Assess environmental exposure, monitor broad-area change and support critical-infrastructure resilience planning.',
    question: 'Which assets and corridors are exposed to environmental hazards, and where is change happening around them?',
    approach:
      'Intersect asset and corridor geometries with hazard layers such as flood extent and slope, then use repeated imagery to spot change nearby and rank the most exposed locations.',
    services: ['gis-modelling', 'terrain-elevation', 'remote-sensing', 'cartography-decision-support'],
    outputs: [
      'Exposure maps for assets and corridors',
      'Broad-area change-monitoring layers',
      'Ranked list of resilience hotspots',
    ],
    visual: 'infrastructure',
    illustrative: true,
  },
  {
    id: 'defence-security',
    title: 'Defence & Security Geospatial Intelligence',
    meta: 'TERRAIN · LAND COVER · RESILIENCE',
    summary:
      'Support terrain and land-cover assessment, broad-area infrastructure change detection, remote-area environmental monitoring and strategic-level resilience analysis.',
    question: 'What do the terrain and land cover of a remote area look like, and what is changing around critical infrastructure over time?',
    approach:
      'Derive terrain models and land-cover maps for the area, then run repeated change detection on imagery around known infrastructure and summarise the results as condition indicators.',
    services: ['terrain-elevation', 'remote-sensing', 'geoai', 'gis-modelling'],
    outputs: [
      'Terrain and land-cover assessment',
      'Broad-area infrastructure change layers',
      'Environmental-condition and resilience indicators',
    ],
    visual: 'terrain',
    illustrative: true,
  },
];

export const APPLICATIONS_NOTE =
  'These are illustrative examples of the kind of problem we work on. They are not case studies, and none describes a named client or measured result.';
