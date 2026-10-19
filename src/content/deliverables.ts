// DELIVERABLES = what a client receives, grouped by output type (not by industry).
export interface Deliverable {
  id: string;
  title: string;
  summary: string;
  includes: string[]; // illustrative contents
}

export const DELIVERABLES: Deliverable[] = [
  {
    id: 'maps-spatial-data',
    title: 'Maps & Spatial Data',
    summary: 'Validated raster and vector layers, thematic maps and documented geospatial datasets.',
    includes: [
      'GeoTIFF and COG rasters, GeoPackage and GeoParquet vectors',
      'Thematic maps for reports and presentations',
      'Metadata and a data dictionary',
    ],
  },
  {
    id: 'monitoring-reports',
    title: 'Monitoring & Change Reports',
    summary: 'Time-series summaries, change indicators, hotspot maps and uncertainty notes.',
    includes: [
      'Period-to-period change statistics',
      'Hotspot maps for review',
      'Stated data sources, methods and uncertainty',
    ],
  },
  {
    id: 'data-pipelines',
    title: 'Automated Data Pipelines',
    summary: 'Reproducible scripts and processing workflows for repeated data ingestion and analysis.',
    includes: [
      'Version-controlled code and environment files',
      'Scheduled ingestion and processing jobs',
      'Run documentation and handover notes',
    ],
  },
  {
    id: 'decision-support-prototypes',
    title: 'Decision-Support Prototypes',
    summary: 'Lightweight dashboards, visualisation tools and map-based prototypes.',
    includes: [
      'Interactive map or dashboard for stakeholder review',
      'Simple filters and charts',
      'Notes for extending or replacing the prototype',
    ],
  },
];

export const DELIVERABLES_NOTE =
  'Illustrative: these describe the kinds of output a project can produce. They are not a record of completed work.';
