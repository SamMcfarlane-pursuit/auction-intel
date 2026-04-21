// MapLibre GL style definitions for the three map modes used in USMap.
// Streets: vector tiles from OpenFreeMap (Liberty style, no API key required).
// Satellite: raster tiles from ESRI World Imagery (no API key required).
// Hybrid: ESRI satellite with ESRI reference labels on top.

const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

export const STYLE_STREETS_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const STYLE_POSITRON_URL = 'https://tiles.openfreemap.org/styles/positron';

export const STYLE_SATELLITE = {
    version: 8,
    glyphs: GLYPHS,
    sources: {
        'esri-imagery': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution:
                'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        }
    },
    layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#0B1220' } },
        { id: 'esri-imagery', type: 'raster', source: 'esri-imagery' }
    ]
};

export const STYLE_HYBRID = {
    version: 8,
    glyphs: GLYPHS,
    sources: {
        'esri-imagery': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics'
        },
        'esri-reference': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Labels &copy; Esri'
        },
        'esri-transportation': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Roads &copy; Esri'
        }
    },
    layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#0B1220' } },
        { id: 'esri-imagery', type: 'raster', source: 'esri-imagery' },
        { id: 'esri-transportation', type: 'raster', source: 'esri-transportation' },
        { id: 'esri-reference', type: 'raster', source: 'esri-reference' }
    ]
};

export const STYLE_MODES = [
    { id: 'streets', label: 'Streets', url: STYLE_STREETS_URL, dark: false },
    { id: 'light', label: 'Light', url: STYLE_POSITRON_URL, dark: false },
    { id: 'satellite', label: 'Satellite', url: null, style: STYLE_SATELLITE, dark: true },
    { id: 'hybrid', label: 'Hybrid', url: null, style: STYLE_HYBRID, dark: true }
];

export function getStyleConfig(id) {
    return STYLE_MODES.find(m => m.id === id) || STYLE_MODES[0];
}
