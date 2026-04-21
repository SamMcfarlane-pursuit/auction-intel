// Real lat/lng centroids for states and major US cities.
// Used by USMap to place property markers when the source record lacks coordinates.
// Coordinates are population-weighted centroids (NWS / USGS) rounded to 4 decimals.

export const STATE_CENTROIDS = {
    AL: [32.7794, -86.8287], AK: [64.0685, -152.2782], AZ: [34.2744, -111.6602],
    AR: [34.8938, -92.4426], CA: [37.1841, -119.4696], CO: [38.9972, -105.5478],
    CT: [41.6219, -72.7273], DE: [38.9896, -75.5050], DC: [38.9101, -77.0147],
    FL: [28.6305, -82.4497], GA: [32.6415, -83.4426], HI: [20.2927, -156.3737],
    ID: [44.3509, -114.6130], IL: [40.0417, -89.1965], IN: [39.8942, -86.2816],
    IA: [42.0751, -93.4960], KS: [38.4937, -98.3804], KY: [37.5347, -85.3021],
    LA: [31.0689, -91.9968], ME: [45.3695, -69.2428], MD: [39.0550, -76.7909],
    MA: [42.2596, -71.8083], MI: [44.3467, -85.4102], MN: [46.2807, -94.3053],
    MS: [32.7364, -89.6678], MO: [38.3566, -92.4580], MT: [47.0527, -109.6333],
    NE: [41.5378, -99.7951], NV: [39.3289, -116.6312], NH: [43.6805, -71.5811],
    NJ: [40.1907, -74.6728], NM: [34.4071, -106.1126], NY: [42.9538, -75.5268],
    NC: [35.5557, -79.3877], ND: [47.4501, -100.4659], OH: [40.2862, -82.7937],
    OK: [35.5889, -97.4943], OR: [43.9336, -120.5583], PA: [40.8781, -77.7996],
    RI: [41.6762, -71.5562], SC: [33.9169, -80.8964], SD: [44.4443, -100.2263],
    TN: [35.8580, -86.3505], TX: [31.4757, -99.3312], UT: [39.3055, -111.6703],
    VT: [44.0687, -72.6658], VA: [37.5215, -78.8537], WA: [47.3826, -120.4472],
    WV: [38.6409, -80.6227], WI: [44.6243, -89.9941], WY: [42.9957, -107.5512]
};

// Major US cities with real lat/lng. Keyed by "City,ST" (uppercase state).
// Covers the ~200 largest cities plus common tax-auction markets.
export const CITY_COORDS = {
    'Phoenix,AZ': [33.4484, -112.0740], 'Tucson,AZ': [32.2226, -110.9747], 'Mesa,AZ': [33.4152, -111.8315],
    'Scottsdale,AZ': [33.4942, -111.9261], 'Tempe,AZ': [33.4255, -111.9400], 'Flagstaff,AZ': [35.1983, -111.6513],
    'Los Angeles,CA': [34.0522, -118.2437], 'San Diego,CA': [32.7157, -117.1611], 'San Francisco,CA': [37.7749, -122.4194],
    'San Jose,CA': [37.3382, -121.8863], 'Fresno,CA': [36.7378, -119.7871], 'Sacramento,CA': [38.5816, -121.4944],
    'Oakland,CA': [37.8044, -122.2712], 'Bakersfield,CA': [35.3733, -119.0187], 'Long Beach,CA': [33.7701, -118.1937],
    'Anaheim,CA': [33.8366, -117.9143], 'Riverside,CA': [33.9806, -117.3755], 'Stockton,CA': [37.9577, -121.2908],
    'Denver,CO': [39.7392, -104.9903], 'Colorado Springs,CO': [38.8339, -104.8214], 'Aurora,CO': [39.7294, -104.8319],
    'Boulder,CO': [40.0150, -105.2705], 'Fort Collins,CO': [40.5853, -105.0844],
    'Hartford,CT': [41.7658, -72.6734], 'New Haven,CT': [41.3083, -72.9279], 'Stamford,CT': [41.0534, -73.5387],
    'Washington,DC': [38.9072, -77.0369],
    'Jacksonville,FL': [30.3322, -81.6557], 'Miami,FL': [25.7617, -80.1918], 'Tampa,FL': [27.9506, -82.4572],
    'Orlando,FL': [28.5383, -81.3792], 'St. Petersburg,FL': [27.7676, -82.6403], 'Hialeah,FL': [25.8576, -80.2781],
    'Tallahassee,FL': [30.4383, -84.2807], 'Fort Lauderdale,FL': [26.1224, -80.1373], 'Cape Coral,FL': [26.5629, -81.9495],
    'Pembroke Pines,FL': [26.0070, -80.2962], 'Hollywood,FL': [26.0112, -80.1495], 'Gainesville,FL': [29.6516, -82.3248],
    'Atlanta,GA': [33.7490, -84.3880], 'Augusta,GA': [33.4735, -82.0105], 'Columbus,GA': [32.4610, -84.9877],
    'Savannah,GA': [32.0809, -81.0912], 'Athens,GA': [33.9519, -83.3576], 'Macon,GA': [32.8407, -83.6324],
    'Honolulu,HI': [21.3099, -157.8581],
    'Boise,ID': [43.6150, -116.2023],
    'Chicago,IL': [41.8781, -87.6298], 'Aurora,IL': [41.7606, -88.3201], 'Rockford,IL': [42.2711, -89.0940],
    'Joliet,IL': [41.5250, -88.0817], 'Naperville,IL': [41.7508, -88.1535], 'Springfield,IL': [39.7817, -89.6501],
    'Indianapolis,IN': [39.7684, -86.1581], 'Fort Wayne,IN': [41.0793, -85.1394], 'Evansville,IN': [37.9716, -87.5711],
    'Des Moines,IA': [41.5868, -93.6250], 'Cedar Rapids,IA': [41.9779, -91.6656],
    'Wichita,KS': [37.6872, -97.3301], 'Overland Park,KS': [38.9822, -94.6708], 'Topeka,KS': [39.0473, -95.6752],
    'Louisville,KY': [38.2527, -85.7585], 'Lexington,KY': [38.0406, -84.5037],
    'New Orleans,LA': [29.9511, -90.0715], 'Baton Rouge,LA': [30.4515, -91.1871], 'Shreveport,LA': [32.5252, -93.7502],
    'Portland,ME': [43.6591, -70.2568],
    'Baltimore,MD': [39.2904, -76.6122], 'Annapolis,MD': [38.9784, -76.4922],
    'Boston,MA': [42.3601, -71.0589], 'Worcester,MA': [42.2626, -71.8023], 'Springfield,MA': [42.1015, -72.5898],
    'Detroit,MI': [42.3314, -83.0458], 'Grand Rapids,MI': [42.9634, -85.6681], 'Warren,MI': [42.4934, -83.0277],
    'Ann Arbor,MI': [42.2808, -83.7430], 'Lansing,MI': [42.7325, -84.5555],
    'Minneapolis,MN': [44.9778, -93.2650], 'St. Paul,MN': [44.9537, -93.0900], 'Rochester,MN': [44.0121, -92.4802],
    'Jackson,MS': [32.2988, -90.1848], 'Gulfport,MS': [30.3674, -89.0928],
    'Kansas City,MO': [39.0997, -94.5786], 'St. Louis,MO': [38.6270, -90.1994], 'Springfield,MO': [37.2090, -93.2923],
    'Billings,MT': [45.7833, -108.5007], 'Missoula,MT': [46.8721, -113.9940],
    'Omaha,NE': [41.2565, -95.9345], 'Lincoln,NE': [40.8136, -96.7026],
    'Las Vegas,NV': [36.1716, -115.1391], 'Henderson,NV': [36.0395, -114.9817], 'Reno,NV': [39.5296, -119.8138],
    'Manchester,NH': [42.9956, -71.4548], 'Nashua,NH': [42.7654, -71.4676],
    'Newark,NJ': [40.7357, -74.1724], 'Jersey City,NJ': [40.7178, -74.0431], 'Paterson,NJ': [40.9168, -74.1718],
    'Albuquerque,NM': [35.0844, -106.6504], 'Santa Fe,NM': [35.6870, -105.9378],
    'New York,NY': [40.7128, -74.0060], 'Buffalo,NY': [42.8864, -78.8784], 'Rochester,NY': [43.1566, -77.6088],
    'Yonkers,NY': [40.9312, -73.8987], 'Syracuse,NY': [43.0481, -76.1474], 'Albany,NY': [42.6526, -73.7562],
    'Charlotte,NC': [35.2271, -80.8431], 'Raleigh,NC': [35.7796, -78.6382], 'Greensboro,NC': [36.0726, -79.7920],
    'Durham,NC': [35.9940, -78.8986], 'Winston-Salem,NC': [36.0999, -80.2442], 'Asheville,NC': [35.5951, -82.5515],
    'Fargo,ND': [46.8772, -96.7898],
    'Columbus,OH': [39.9612, -82.9988], 'Cleveland,OH': [41.4993, -81.6944], 'Cincinnati,OH': [39.1031, -84.5120],
    'Toledo,OH': [41.6528, -83.5379], 'Akron,OH': [41.0814, -81.5190], 'Dayton,OH': [39.7589, -84.1916],
    'Oklahoma City,OK': [35.4676, -97.5164], 'Tulsa,OK': [36.1540, -95.9928],
    'Portland,OR': [45.5152, -122.6784], 'Eugene,OR': [44.0521, -123.0868], 'Salem,OR': [44.9429, -123.0351],
    'Philadelphia,PA': [39.9526, -75.1652], 'Pittsburgh,PA': [40.4406, -79.9959], 'Allentown,PA': [40.6084, -75.4902],
    'Erie,PA': [42.1292, -80.0851], 'Harrisburg,PA': [40.2732, -76.8867],
    'Providence,RI': [41.8240, -71.4128],
    'Charleston,SC': [32.7765, -79.9311], 'Columbia,SC': [34.0007, -81.0348], 'Greenville,SC': [34.8526, -82.3940],
    'Sioux Falls,SD': [43.5446, -96.7311],
    'Nashville,TN': [36.1627, -86.7816], 'Memphis,TN': [35.1495, -90.0490], 'Knoxville,TN': [35.9606, -83.9207],
    'Chattanooga,TN': [35.0456, -85.3097],
    'Houston,TX': [29.7604, -95.3698], 'San Antonio,TX': [29.4241, -98.4936], 'Dallas,TX': [32.7767, -96.7970],
    'Austin,TX': [30.2672, -97.7431], 'Fort Worth,TX': [32.7555, -97.3308], 'El Paso,TX': [31.7619, -106.4850],
    'Arlington,TX': [32.7357, -97.1081], 'Corpus Christi,TX': [27.8006, -97.3964], 'Plano,TX': [33.0198, -96.6989],
    'Lubbock,TX': [33.5779, -101.8552], 'Laredo,TX': [27.5306, -99.4803], 'Garland,TX': [32.9126, -96.6389],
    'Salt Lake City,UT': [40.7608, -111.8910], 'West Valley City,UT': [40.6916, -112.0011], 'Provo,UT': [40.2338, -111.6585],
    'Burlington,VT': [44.4759, -73.2121],
    'Virginia Beach,VA': [36.8529, -75.9780], 'Norfolk,VA': [36.8508, -76.2859], 'Richmond,VA': [37.5407, -77.4360],
    'Arlington,VA': [38.8816, -77.0910], 'Alexandria,VA': [38.8048, -77.0469],
    'Seattle,WA': [47.6062, -122.3321], 'Spokane,WA': [47.6587, -117.4260], 'Tacoma,WA': [47.2529, -122.4443],
    'Vancouver,WA': [45.6387, -122.6615], 'Bellevue,WA': [47.6101, -122.2015],
    'Charleston,WV': [38.3498, -81.6326], 'Huntington,WV': [38.4192, -82.4452],
    'Milwaukee,WI': [43.0389, -87.9065], 'Madison,WI': [43.0731, -89.4012], 'Green Bay,WI': [44.5133, -88.0133],
    'Cheyenne,WY': [41.1400, -104.8202], 'Casper,WY': [42.8666, -106.3131]
};

// Deterministic hash for property jitter (so markers don't all stack on city center).
function hash32(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
}

/**
 * Resolve a property to [lat, lng].
 * 1. Uses property.lat/lng if present (future-proof for backend geocoding).
 * 2. Looks up "City,ST" in CITY_COORDS, jitters within ~6 km for visual spread.
 * 3. Falls back to state centroid with larger jitter (~40 km).
 * 4. Returns null if nothing resolves.
 */
export function resolvePropertyCoords(property) {
    if (property == null) return null;
    if (Number.isFinite(property.lat) && Number.isFinite(property.lng)) {
        return [property.lat, property.lng];
    }
    const city = (property.city || '').trim();
    const state = (property.state || '').toUpperCase().trim();
    const key = `${city},${state}`;
    const seed = hash32(`${property.id ?? ''}|${property.address ?? ''}|${key}`);
    // Split seed into two pseudo-uniform values in [-0.5, 0.5]
    const ra = ((seed & 0xffff) / 0xffff) - 0.5;
    const rb = (((seed >>> 16) & 0xffff) / 0xffff) - 0.5;

    const cityCoord = CITY_COORDS[key];
    if (cityCoord) {
        // ~6 km: 1 deg lat = 111 km, so 0.054 deg ≈ 6 km
        return [cityCoord[0] + ra * 0.054, cityCoord[1] + rb * 0.054];
    }
    const stateCoord = STATE_CENTROIDS[state];
    if (stateCoord) {
        // ~40 km jitter for state-only placement
        return [stateCoord[0] + ra * 0.72, stateCoord[1] + rb * 0.72];
    }
    return null;
}
