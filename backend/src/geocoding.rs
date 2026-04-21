// Lightweight offline geocoder. Covers all US states (centroid fallback), ~25 counties
// referenced in `auctions.rs`, and ~115 cities referenced in `foreclosure.rs`.
// Coordinates are the geographic centroid or city hall approximation — accurate to ~5 km,
// good enough for map pin placement. Used to avoid a runtime dependency on external
// geocoding APIs (Nominatim, Mapbox, etc.) for the seed dataset.

use once_cell::sync::Lazy;
use std::collections::HashMap;

fn norm(s: &str) -> String {
    s.trim()
        .to_uppercase()
        .replace('.', "")
        .replace('-', " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn geocode_county(state: &str, county: &str) -> Option<(f64, f64)> {
    let key = (state.trim().to_uppercase(), norm(county));
    COUNTY_CENTROIDS.get(&key).copied()
}

pub fn geocode_city(state: &str, city: &str) -> Option<(f64, f64)> {
    let key = (state.trim().to_uppercase(), norm(city));
    CITY_CENTROIDS.get(&key).copied()
}

pub fn geocode_state(state: &str) -> Option<(f64, f64)> {
    STATE_CENTROIDS.get(state.trim().to_uppercase().as_str()).copied()
}

// Resolve with graceful fallback: city → county → state. Always returns Some(_) for any
// known US state abbreviation.
#[allow(dead_code)]
pub fn resolve(state: &str, city: Option<&str>, county: Option<&str>) -> Option<(f64, f64)> {
    if let Some(c) = city {
        if let Some(coords) = geocode_city(state, c) { return Some(coords); }
    }
    if let Some(c) = county {
        if let Some(coords) = geocode_county(state, c) { return Some(coords); }
    }
    geocode_state(state)
}

// ============================================================================
// STATE CENTROIDS (51)
// ============================================================================
static STATE_CENTROIDS: Lazy<HashMap<&'static str, (f64, f64)>> = Lazy::new(|| {
    HashMap::from([
        ("AL", (32.7794, -86.8287)), ("AK", (64.0685, -152.2782)), ("AZ", (34.2744, -111.6602)),
        ("AR", (34.8938, -92.4426)), ("CA", (37.1841, -119.4696)), ("CO", (38.9972, -105.5478)),
        ("CT", (41.6219, -72.7273)), ("DE", (38.9896, -75.5050)), ("DC", (38.9101, -77.0147)),
        ("FL", (28.6305, -82.4497)), ("GA", (32.6415, -83.4426)), ("HI", (20.2927, -156.3737)),
        ("ID", (44.3509, -114.6130)), ("IL", (40.0417, -89.1965)), ("IN", (39.8942, -86.2816)),
        ("IA", (42.0751, -93.4960)), ("KS", (38.4937, -98.3804)), ("KY", (37.5347, -85.3021)),
        ("LA", (31.0689, -91.9968)), ("ME", (45.3695, -69.2428)), ("MD", (39.0550, -76.7909)),
        ("MA", (42.2596, -71.8083)), ("MI", (44.3467, -85.4102)), ("MN", (46.2807, -94.3053)),
        ("MS", (32.7364, -89.6678)), ("MO", (38.3566, -92.4580)), ("MT", (47.0527, -109.6333)),
        ("NE", (41.5378, -99.7951)), ("NV", (39.3289, -116.6312)), ("NH", (43.6805, -71.5811)),
        ("NJ", (40.1907, -74.6728)), ("NM", (34.4071, -106.1126)), ("NY", (42.9538, -75.5268)),
        ("NC", (35.5557, -79.3877)), ("ND", (47.4501, -100.4659)), ("OH", (40.2862, -82.7937)),
        ("OK", (35.5889, -97.4943)), ("OR", (43.9336, -120.5583)), ("PA", (40.8781, -77.7996)),
        ("RI", (41.6762, -71.5562)), ("SC", (33.9169, -80.8964)), ("SD", (44.4443, -100.2263)),
        ("TN", (35.8580, -86.3505)), ("TX", (31.4757, -99.3312)), ("UT", (39.3055, -111.6703)),
        ("VT", (44.0687, -72.6658)), ("VA", (37.5215, -78.8537)), ("WA", (47.3826, -120.4472)),
        ("WV", (38.6409, -80.6227)), ("WI", (44.6243, -89.9941)), ("WY", (42.9957, -107.5512)),
    ])
});

// ============================================================================
// COUNTY CENTROIDS (keyed by (STATE, NORMALIZED-NAME))
// ============================================================================
static COUNTY_CENTROIDS: Lazy<HashMap<(String, String), (f64, f64)>> = Lazy::new(|| {
    let raw: &[(&str, &str, f64, f64)] = &[
        // Counties appearing in auctions.rs listings
        ("FL", "MIAMI DADE",     25.5516, -80.6327),
        ("FL", "BROWARD",        26.1901, -80.3659),
        ("FL", "PALM BEACH",     26.6515, -80.2767),
        ("FL", "HILLSBOROUGH",   27.9066, -82.3018),
        ("FL", "ORANGE",         28.5122, -81.3790),
        ("FL", "DUVAL",          30.3350, -81.6495),
        ("TX", "HARRIS",         29.8578, -95.3907),
        ("TX", "DALLAS",         32.7767, -96.7970),
        ("TX", "TARRANT",        32.7717, -97.2920),
        ("TX", "TRAVIS",         30.3344, -97.7814),
        ("TX", "BEXAR",          29.4489, -98.5200),
        ("TX", "COLLIN",         33.1795, -96.4930),
        ("CA", "LOS ANGELES",    34.0522, -118.2437),
        ("CA", "SAN DIEGO",      32.7157, -117.1611),
        ("CA", "ORANGE",         33.7175, -117.8311),
        ("CA", "SAN BERNARDINO", 34.8416, -116.1784),
        ("CA", "RIVERSIDE",      33.7398, -115.9944),
        ("AZ", "MARICOPA",       33.3475, -112.4970),
        ("AZ", "PIMA",           32.1007, -110.9348),
        ("GA", "FULTON",         33.7490, -84.3880),
        ("GA", "DEKALB",         33.7712, -84.2278),
        ("GA", "COBB",           33.9526, -84.5499),
        ("IL", "COOK",           41.8781, -87.6298),
        ("IL", "DUPAGE",         41.8527, -88.0858),
        ("PA", "PHILADELPHIA",   39.9526, -75.1652),
        ("PA", "ALLEGHENY",      40.4666, -80.0120),
        ("PA", "MONROE",         41.0570, -75.4000),
        ("PA", "MONTGOMERY",     40.2100, -75.3700),
        ("NJ", "ESSEX",          40.7862, -74.2288),
        ("NJ", "BERGEN",         40.9590, -74.0742),
        ("NJ", "HUDSON",         40.7282, -74.0776),
        ("NY", "KINGS",          40.6501, -73.9496),
        ("NY", "QUEENS",         40.7282, -73.7949),
        ("NY", "NEW YORK",       40.7831, -73.9712),
        ("NY", "SUFFOLK",        40.9849, -72.6151),
        ("NV", "CLARK",          36.1699, -115.1398),
        ("NV", "WASHOE",         39.5296, -119.8138),
        ("NC", "MECKLENBURG",    35.2271, -80.8431),
        ("NC", "WAKE",           35.7796, -78.6382),
        ("OH", "FRANKLIN",       39.9612, -82.9988),
        ("OH", "CUYAHOGA",       41.4993, -81.6944),
        ("OH", "HAMILTON",       39.1031, -84.5120),
        ("MI", "WAYNE",          42.3314, -83.0458),
        ("MI", "OAKLAND",        42.6475, -83.3519),
        ("MA", "SUFFOLK",        42.3601, -71.0589),
        ("MA", "MIDDLESEX",      42.4464, -71.2289),
        ("VA", "FAIRFAX",        38.8519, -77.3436),
        ("MD", "MONTGOMERY",     39.1547, -77.2405),
        ("WA", "KING",           47.6062, -122.3321),
        ("CO", "DENVER",         39.7392, -104.9903),
        ("MN", "HENNEPIN",       44.9778, -93.2650),
    ];
    raw.iter().map(|(s, c, lat, lng)| {
        ((s.to_string(), norm(c)), (*lat, *lng))
    }).collect()
});

// ============================================================================
// CITY CENTROIDS (keyed by (STATE, NORMALIZED-NAME))
// ============================================================================
static CITY_CENTROIDS: Lazy<HashMap<(String, String), (f64, f64)>> = Lazy::new(|| {
    let raw: &[(&str, &str, f64, f64)] = &[
        ("AL", "Birmingham",      33.5186, -86.8104),
        ("AL", "Mobile",          30.6954, -88.0399),
        ("AK", "Anchorage",       61.2181, -149.9003),
        ("AZ", "Phoenix",         33.4484, -112.0740),
        ("AZ", "Mesa",            33.4152, -111.8315),
        ("AZ", "Tucson",          32.2226, -110.9747),
        ("AR", "Little Rock",     34.7465, -92.2896),
        ("AR", "Fayetteville",    36.0626, -94.1574),
        ("CA", "Los Angeles",     34.0522, -118.2437),
        ("CA", "San Diego",       32.7157, -117.1611),
        ("CA", "San Francisco",   37.7749, -122.4194),
        ("CA", "Sacramento",      38.5816, -121.4944),
        ("CA", "Fresno",          36.7378, -119.7871),
        ("CO", "Denver",          39.7392, -104.9903),
        ("CO", "Colorado Springs",38.8339, -104.8214),
        ("CT", "Hartford",        41.7658, -72.6734),
        ("CT", "New Haven",       41.3083, -72.9279),
        ("DE", "Wilmington",      39.7447, -75.5484),
        ("DC", "Washington",      38.9072, -77.0369),
        ("FL", "Miami",           25.7617, -80.1918),
        ("FL", "Tampa",           27.9506, -82.4572),
        ("FL", "Orlando",         28.5383, -81.3792),
        ("FL", "Jacksonville",    30.3322, -81.6557),
        ("FL", "Fort Lauderdale", 26.1224, -80.1373),
        ("GA", "Atlanta",         33.7490, -84.3880),
        ("GA", "Augusta",         33.4735, -82.0105),
        ("GA", "Savannah",        32.0809, -81.0912),
        ("GA", "Macon",           32.8407, -83.6324),
        ("HI", "Honolulu",        21.3099, -157.8581),
        ("HI", "Kahului",         20.8893, -156.4729),
        ("ID", "Boise",           43.6150, -116.2023),
        ("ID", "Idaho Falls",     43.4666, -112.0341),
        ("IL", "Chicago",         41.8781, -87.6298),
        ("IL", "Springfield",     39.7817, -89.6501),
        ("IL", "Rockford",        42.2711, -89.0940),
        ("IN", "Indianapolis",    39.7684, -86.1581),
        ("IN", "Fort Wayne",      41.0793, -85.1394),
        ("IA", "Des Moines",      41.5868, -93.6250),
        ("IA", "Cedar Rapids",    41.9779, -91.6656),
        ("KS", "Wichita",         37.6872, -97.3301),
        ("KS", "Topeka",          39.0473, -95.6752),
        ("KY", "Louisville",      38.2527, -85.7585),
        ("KY", "Lexington",       38.0406, -84.5037),
        ("LA", "New Orleans",     29.9511, -90.0715),
        ("LA", "Baton Rouge",     30.4515, -91.1871),
        ("ME", "Portland",        43.6591, -70.2568),
        ("MD", "Baltimore",       39.2904, -76.6122),
        ("MD", "Annapolis",       38.9784, -76.4922),
        ("MA", "Boston",          42.3601, -71.0589),
        ("MA", "Worcester",       42.2626, -71.8023),
        ("MI", "Detroit",         42.3314, -83.0458),
        ("MI", "Grand Rapids",    42.9634, -85.6681),
        ("MI", "Lansing",         42.7325, -84.5555),
        ("MN", "Minneapolis",     44.9778, -93.2650),
        ("MN", "St Paul",         44.9537, -93.0900),
        ("MS", "Jackson",         32.2988, -90.1848),
        ("MS", "Gulfport",        30.3674, -89.0928),
        ("MO", "Kansas City",     39.0997, -94.5786),
        ("MO", "St Louis",        38.6270, -90.1994),
        ("MT", "Billings",        45.7833, -108.5007),
        ("NE", "Omaha",           41.2565, -95.9345),
        ("NE", "Lincoln",         40.8136, -96.7026),
        ("NV", "Las Vegas",       36.1699, -115.1398),
        ("NV", "Reno",            39.5296, -119.8138),
        ("NH", "Manchester",      42.9956, -71.4548),
        ("NJ", "Newark",          40.7357, -74.1724),
        ("NJ", "Jersey City",     40.7178, -74.0431),
        ("NJ", "Trenton",         40.2171, -74.7429),
        ("NM", "Albuquerque",     35.0844, -106.6504),
        ("NM", "Santa Fe",        35.6870, -105.9378),
        ("NY", "New York",        40.7128, -74.0060),
        ("NY", "Buffalo",         42.8864, -78.8784),
        ("NY", "Albany",          42.6526, -73.7562),
        ("NY", "Syracuse",        43.0481, -76.1474),
        ("NC", "Charlotte",       35.2271, -80.8431),
        ("NC", "Raleigh",         35.7796, -78.6382),
        ("NC", "Asheville",       35.5951, -82.5515),
        ("ND", "Fargo",           46.8772, -96.7898),
        ("OH", "Columbus",        39.9612, -82.9988),
        ("OH", "Cleveland",       41.4993, -81.6944),
        ("OH", "Cincinnati",      39.1031, -84.5120),
        ("OH", "Dayton",          39.7589, -84.1916),
        ("OK", "Oklahoma City",   35.4676, -97.5164),
        ("OK", "Tulsa",           36.1540, -95.9928),
        ("OR", "Portland",        45.5152, -122.6784),
        ("OR", "Eugene",          44.0521, -123.0868),
        ("PA", "Philadelphia",    39.9526, -75.1652),
        ("PA", "Pittsburgh",      40.4406, -79.9959),
        ("PA", "Allentown",       40.6084, -75.4902),
        ("RI", "Providence",      41.8240, -71.4128),
        ("SC", "Charleston",      32.7765, -79.9311),
        ("SC", "Columbia",        34.0007, -81.0348),
        ("SD", "Sioux Falls",     43.5460, -96.7313),
        ("TN", "Nashville",       36.1627, -86.7816),
        ("TN", "Memphis",         35.1495, -90.0490),
        ("TN", "Knoxville",       35.9606, -83.9207),
        ("TX", "Houston",         29.7604, -95.3698),
        ("TX", "Dallas",          32.7767, -96.7970),
        ("TX", "San Antonio",     29.4241, -98.4936),
        ("TX", "Austin",          30.2672, -97.7431),
        ("TX", "El Paso",         31.7619, -106.4850),
        ("UT", "Salt Lake City",  40.7608, -111.8910),
        ("UT", "Provo",           40.2338, -111.6585),
        ("VT", "Burlington",      44.4759, -73.2121),
        ("VA", "Richmond",        37.5407, -77.4360),
        ("VA", "Norfolk",         36.8508, -76.2859),
        ("VA", "Virginia Beach",  36.8529, -75.9780),
        ("WA", "Seattle",         47.6062, -122.3321),
        ("WA", "Spokane",         47.6588, -117.4260),
        ("WA", "Tacoma",          47.2529, -122.4443),
        ("WV", "Charleston",      38.3498, -81.6326),
        ("WV", "Huntington",      38.4192, -82.4452),
        ("WI", "Milwaukee",       43.0389, -87.9065),
        ("WI", "Madison",         43.0731, -89.4012),
        ("WY", "Cheyenne",        41.1400, -104.8202),
    ];
    raw.iter().map(|(s, c, lat, lng)| {
        ((s.to_string(), norm(c)), (*lat, *lng))
    }).collect()
});
