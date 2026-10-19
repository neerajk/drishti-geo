// SERVICES = technical capabilities (what we can do). Industries and use cases live in applications.ts.
export type VisualKey =
  | 'sar' | 'gis' | 'segmentation' | 'elevation' | 'pipeline' | 'cartography' // services
  | 'flood' | 'ndvi' | 'urban' | 'infrastructure' | 'terrain'; // applications

export interface Service {
  id: string;
  number: string;
  title: string;
  meta: string; // mono caption on the card
  summary: string;
  work: string[]; // 3-4 examples of technical work
  outputs: string[]; // typical technical outputs
  visual: VisualKey;
}

export const SERVICES: Service[] = [
  {
    id: 'remote-sensing',
    number: '01',
    title: 'Remote Sensing & Earth Observation',
    meta: 'OPTICAL · SAR · TIME SERIES',
    summary:
      'Processing and interpreting satellite imagery to measure what is on the land surface and how it changes over time.',
    work: [
      'Sentinel-2 and Landsat preprocessing, compositing and cloud masking',
      'Sentinel-1 SAR processing, speckle filtering and backscatter analysis',
      'Satellite time-series analysis and trend metrics',
      'Land-cover classification and multi-date change detection',
    ],
    outputs: [
      'Classified land-cover rasters',
      'Change-detection layers with accuracy assessment',
      'Analysis-ready image time series',
    ],
    visual: 'sar',
  },
  {
    id: 'gis-modelling',
    number: '02',
    title: 'GIS & Spatial Modelling',
    meta: 'OVERLAY · SUITABILITY · NETWORK',
    summary:
      'Spatial modelling that combines layers, rules and networks to answer where, how much and how far.',
    work: [
      'Multi-criteria overlay and suitability analysis',
      'Vector and raster geoprocessing workflows',
      'Network and accessibility analysis',
      'PostGIS and GeoPackage database design and queries',
    ],
    outputs: [
      'Suitability and constraint surfaces',
      'Cleaned, documented spatial datasets',
      'Scripted, reusable geoprocessing models',
    ],
    visual: 'gis',
  },
  {
    id: 'geoai',
    number: '03',
    title: 'GeoAI & Computer Vision',
    meta: 'CLASSIFICATION · SEGMENTATION · DETECTION',
    summary:
      'Machine-learning methods built for geospatial imagery, from classical models to Earth-observation foundation models.',
    work: [
      'Image classification and semantic segmentation of satellite and aerial imagery',
      'Object detection for features such as buildings, roads and water bodies',
      'Geospatial machine learning on raster and tabular features',
      'Adapting Earth-observation foundation models to a region or task',
    ],
    outputs: [
      'Predicted maps with per-class probability layers',
      'Trained models with inference code',
      'Validation metrics and a note on known limits',
    ],
    visual: 'segmentation',
  },
  {
    id: 'terrain-elevation',
    number: '04',
    title: 'Terrain & Elevation Analysis',
    meta: 'DEM · DSM · SLOPE · CATCHMENT',
    summary:
      'Quantitative analysis of surface shape from elevation data, used to understand slope, drainage and landform.',
    work: [
      'DEM and DSM processing, void filling and resampling',
      'Terrain derivatives: slope, aspect, curvature and roughness',
      'Elevation profiles and cross-sections along corridors',
      'Hydrological conditioning, flow accumulation and catchment delineation',
    ],
    outputs: [
      'Terrain-derivative rasters',
      'Elevation profile charts',
      'Catchment and drainage-network layers',
    ],
    visual: 'elevation',
  },
  {
    id: 'data-engineering',
    number: '05',
    title: 'Geospatial Data Engineering',
    meta: 'ETL · APIS · PIPELINES',
    summary:
      'Automated, testable pipelines that bring geospatial data from source to analysis the same way every time.',
    work: [
      'API and STAC catalogue integration for satellite and open data',
      'Raster and vector ETL with COG, GeoParquet and GeoPackage outputs',
      'Scheduled, automated processing pipelines',
      'Data validation, versioning and reproducible environments',
    ],
    outputs: [
      'Quality-checked, cloud-optimised datasets',
      'Validation rules and test results',
      'Catalogue or API access to processed data',
    ],
    visual: 'pipeline',
  },
  {
    id: 'cartography-decision-support',
    number: '06',
    title: 'Cartography & Decision-Support Tools',
    meta: 'MAPS · INDICATORS · DASHBOARDS',
    summary:
      'Turning analysis into clear maps, indicators and lightweight tools that decision-makers can read and use.',
    work: [
      'Thematic and report-ready map design',
      'Spatial indicators and composite scores with documented methods',
      'Analytical reports that state data, method and uncertainty',
      'Lightweight dashboards and map-based prototypes',
    ],
    outputs: [
      'Map layouts with legends and scale',
      'Indicator tables with method notes',
      'A reviewable dashboard or web-map prototype',
    ],
    visual: 'cartography',
  },
];

export const SERVICES_NOTE =
  'One application usually combines several of these services, and one service can support several applications. See Applications for the problems they are applied to.';
