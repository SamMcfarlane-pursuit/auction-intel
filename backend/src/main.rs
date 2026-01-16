use axum::{
    extract::{Path, Query, State},
    http::{header, Method},
    routing::{get, post},
    Json, Router,
};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tower_http::cors::{AllowOrigin, CorsLayer};

mod census;
mod foreclosure;
mod auctions;
mod fred_api;

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(Debug, Serialize, Clone)]
pub struct StateAuctionInfo {
    pub abbr: String,
    pub name: String,
    #[serde(rename = "type")]
    pub sale_type: String,
    pub interest_rate: String,
    pub redemption_period: String,
    pub notes: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct CountyData {
    pub name: String,
    pub state: String,
    pub tier: u8,
    pub pop: u32,
    pub income: u32,
    pub zhvi: u32,
    pub growth: f32,
    pub dom: u32,
    pub notes: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnalysisInput {
    pub population: u32,
    pub median_income: u32,
    pub growth_yoy: f32,
    pub days_on_market: u16,
    pub transaction_volume: u32,
    pub employment_rate: f32,
}

#[derive(Debug, Serialize, Clone)]
pub struct AnalysisOutput {
    pub score: f32,
    pub tier: u8,
    pub name: String,
    pub action: String,
    pub recommendation: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub endpoints: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ZhviRecord {
    pub region_name: String,
    pub state: String,
    pub state_fips: String,
    pub county_fips: String,
    pub zhvi: f64,
    pub zhvi_change_yoy: f64,
}

#[derive(Debug, Serialize, Clone)]
pub struct ZhviResponse {
    pub updated: String,
    pub source: String,
    pub record_count: usize,
    pub data: Vec<ZhviRecord>,
}

#[derive(Debug, Serialize, Clone)]
pub struct RedfRecord {
    pub region: String,
    pub region_type: String,
    pub median_dom: f32,
    pub sale_to_list: f32,
    pub inventory: u32,
    pub price_drop_pct: f32,
    pub homes_sold: u32,
}

#[derive(Debug, Serialize, Clone)]
pub struct RedfResponse {
    pub updated: String,
    pub source: String,
    pub record_count: usize,
    pub data: Vec<RedfRecord>,
}

#[derive(Debug, Serialize, Clone)]
pub struct RatesResponse {
    pub updated: String,
    pub source: String,
    pub mortgage_30yr: f32,
    pub mortgage_15yr: f32,
    pub mortgage_30yr_change: f32,
    pub unemployment_rate: f32,
}

// ============================================================================
// STATIC DATA - STATE AUCTION INFO (51 entries: 50 states + DC)
// ============================================================================

static STATE_NAMES: Lazy<HashMap<&str, &str>> = Lazy::new(|| {
    let mut m = HashMap::new();
    m.insert("AL", "Alabama"); m.insert("AK", "Alaska"); m.insert("AZ", "Arizona");
    m.insert("AR", "Arkansas"); m.insert("CA", "California"); m.insert("CO", "Colorado");
    m.insert("CT", "Connecticut"); m.insert("DE", "Delaware"); m.insert("DC", "District of Columbia");
    m.insert("FL", "Florida"); m.insert("GA", "Georgia"); m.insert("HI", "Hawaii");
    m.insert("ID", "Idaho"); m.insert("IL", "Illinois"); m.insert("IN", "Indiana");
    m.insert("IA", "Iowa"); m.insert("KS", "Kansas"); m.insert("KY", "Kentucky");
    m.insert("LA", "Louisiana"); m.insert("ME", "Maine"); m.insert("MD", "Maryland");
    m.insert("MA", "Massachusetts"); m.insert("MI", "Michigan"); m.insert("MN", "Minnesota");
    m.insert("MS", "Mississippi"); m.insert("MO", "Missouri"); m.insert("MT", "Montana");
    m.insert("NE", "Nebraska"); m.insert("NV", "Nevada"); m.insert("NH", "New Hampshire");
    m.insert("NJ", "New Jersey"); m.insert("NM", "New Mexico"); m.insert("NY", "New York");
    m.insert("NC", "North Carolina"); m.insert("ND", "North Dakota"); m.insert("OH", "Ohio");
    m.insert("OK", "Oklahoma"); m.insert("OR", "Oregon"); m.insert("PA", "Pennsylvania");
    m.insert("RI", "Rhode Island"); m.insert("SC", "South Carolina"); m.insert("SD", "South Dakota");
    m.insert("TN", "Tennessee"); m.insert("TX", "Texas"); m.insert("UT", "Utah");
    m.insert("VT", "Vermont"); m.insert("VA", "Virginia"); m.insert("WA", "Washington");
    m.insert("WV", "West Virginia"); m.insert("WI", "Wisconsin"); m.insert("WY", "Wyoming");
    m
});

static STATE_AUCTION_DATA: Lazy<HashMap<String, StateAuctionInfo>> = Lazy::new(|| {
    let mut m = HashMap::new();
    
    macro_rules! add_state {
        ($abbr:expr, $type:expr, $rate:expr, $redemption:expr, $notes:expr) => {
            m.insert($abbr.to_string(), StateAuctionInfo {
                abbr: $abbr.to_string(),
                name: STATE_NAMES.get($abbr).unwrap_or(&$abbr).to_string(),
                sale_type: $type.to_string(),
                interest_rate: $rate.to_string(),
                redemption_period: $redemption.to_string(),
                notes: $notes.to_string(),
            });
        };
    }
    
    // === LIEN STATES (26) ===
    add_state!("AL", "Lien", "12%", "3 years", "Most sales May-June; 12% interest from date of sale");
    add_state!("AZ", "Lien", "16%", "3 years", "Bid-down process; max 16% simple interest");
    add_state!("CO", "Lien", "Fed rate + 9pts", "3 years", "Premium bidding; no premium reimbursement");
    add_state!("CT", "Lien", "18%", "6 months", "Combined lien/deed format; larger towns only");
    add_state!("DC", "Lien", "18%", "6 months - 1 year", "Premium bidding; no interest on overbid");
    add_state!("FL", "Lien", "18%", "2 years", "Bid-down; guaranteed 5% minimum return");
    add_state!("GA", "Lien", "20-40%", "1 year", "20% year 1; escalates to 30% after 2yrs, 40% after 3yrs");
    add_state!("IL", "Lien", "18%", "2 years", "Bid-down from 18%; graduated penalty redemption");
    add_state!("IN", "Lien", "Graduated", "1 year", "A/B/C Sales process; Commissioner's Sale for county-titled");
    add_state!("IA", "Lien", "24%", "1 year 9 months", "Bid least undivided ownership interest; highest rate");
    add_state!("KY", "Lien", "12%", "1 year", "12% interest from date of issuance");
    add_state!("LA", "Lien", "Bid-down", "3 years", "2024-2025 reform: bid-down interest system; online now available");
    add_state!("MD", "Lien", "18-24%", "6 months", "Statutory 6% but most counties charge 18-24%");
    add_state!("MA", "Lien", "16%", "Collector's deed", "Smallest undivided part auction; 16% rate");
    add_state!("MS", "Lien", "18%", "2 years", "Tax lien state");
    add_state!("MO", "Lien", "10%", "2 years", "10% interest; 18% penalty each year delinquent");
    add_state!("MT", "Lien", "10%", "2-3 years", "5/6 of 1% per month (10% per annum)");
    add_state!("NE", "Lien", "14%", "3 years", "Undivided interest at 14% per annum");
    add_state!("NH", "Lien", "18%", "2 years", "Auction for percentage of undivided interest");
    add_state!("NJ", "Lien", "18%", "2 years", "Bid-down from 18%; active market");
    add_state!("OK", "Lien", "8%", "2 years", "Multiple bidders decided by random drawing");
    add_state!("RI", "Lien", "10% + 1%/mo", "1 year", "Collector's Deed; 10% first 6mo, 1%/mo after");
    add_state!("SC", "Lien", "8% penalty", "1 year", "Highest and best bidder wins");
    add_state!("SD", "Lien", "12% (max 10% bid)", "3-4 years", "Bid-down from 10%; 12% statutory");
    add_state!("WV", "Lien", "12%", "1 year", "Highest bidder at public auction");
    add_state!("WY", "Lien", "15% + 3% penalty", "4 years", "Longest redemption; 15% + 3% penalty + fees");
    
    // === DEED STATES (25) ===
    add_state!("AK", "Deed", "N/A", "1 year", "Municipal foreclosure; deeded to borough/city if unredeemed");
    add_state!("AR", "Deed", "N/A", "30 days", "Forfeited to state; limited warranty deed after 30 days");
    add_state!("CA", "Deed", "N/A", "5 years (3 for some)", "Tax Collector's Deed; free of pre-existing encumbrances");
    add_state!("DE", "Deed", "15%", "60 days", "Judicial foreclosure; 15% penalty on redemption");
    add_state!("HI", "Deed", "N/A", "1 year", "3-year lien before auction; 1-year redemption after sale");
    add_state!("ID", "Deed", "N/A", "3 years before deed", "Tax deed to county after 3 years; then sold at auction");
    add_state!("KS", "Deed", "N/A", "Court judgment", "Bid off to county; court petition for foreclosure");
    add_state!("ME", "Deed", "N/A", "18 months", "Tax lien mortgage auto-forecloses after 18 months");
    add_state!("MI", "Deed", "N/A", "None after sale", "Forfeit lands; auction 3rd Tuesday July; min bid = taxes + FMV");
    add_state!("MN", "Deed", "N/A", "None after sale", "Tax-forfeited land auctions; cash or installment");
    add_state!("NV", "Deed", "N/A", "2 years before deed", "Tax deed to Treasurer after 2yr; then auction");
    add_state!("NM", "Deed", "N/A", "120 days IRS only", "No owner redemption; Quitclaim Deed issued");
    add_state!("NY", "Deed", "N/A", "2-4 years", "2yr standard; 3-4yr for residential/farm; judicial foreclosure");
    add_state!("NC", "Deed", "N/A", "Upset bid period", "Judicial foreclosure or docketing certificate");
    add_state!("ND", "Deed", "Max 9%", "4 years", "Bid-down from 9%; 4yr redemption from due date");
    add_state!("OH", "Deed", "N/A", "None after sale", "Judicial foreclosure after 2yr delinquent; Sheriff's sale");
    add_state!("OR", "Deed", "N/A", "2 years before deed", "Foreclosure after 3yr; sold to county; 2yr redemption");
    add_state!("PA", "Deed", "N/A", "None after sale", "Upset Sale; min bid = taxes + interest + costs");
    add_state!("TN", "Deed", "N/A", "1 year", "2yr delinquent before Chancery Court suit");
    add_state!("TX", "Deed", "25% penalty", "6mo-2yr", "6mo non-Homestead; 2yr Homestead/Ag; 25% penalty");
    add_state!("UT", "Deed", "N/A", "4 years", "Preliminary sale Jan 16; final sale May 4yr later");
    add_state!("VT", "Deed", "N/A", "1 year", "Foreclosure after 2yr; Collector's Deed after 1yr redemption");
    add_state!("VA", "Deed", "N/A", "Surplus rights only", "Judicial foreclosure; 3yr after due date; surplus to former owner");
    add_state!("WA", "Deed", "N/A", "3 years before sale", "Certificate of delinquency after 3yr; foreclosure judgment");
    add_state!("WI", "Deed", "N/A", "2 years", "Tax deed after 2yr certificate; county cannot sell certificate");
    
    m
});

// ============================================================================
// STATIC DATA - COUNTY DATABASE
// ============================================================================

type CountyDb = HashMap<String, Vec<CountyData>>;

static COUNTY_DATABASE: Lazy<CountyDb> = Lazy::new(|| {
    let mut db: CountyDb = HashMap::new();
    
    macro_rules! add_county {
        ($state:expr, $name:expr, $pop:expr, $income:expr, $zhvi:expr, $growth:expr, $dom:expr, $tier:expr, $notes:expr) => {
            db.entry($state.to_string())
                .or_insert_with(Vec::new)
                .push(CountyData {
                    name: $name.to_string(),
                    state: $state.to_string(),
                    tier: $tier,
                    pop: $pop,
                    income: $income,
                    zhvi: $zhvi,
                    growth: $growth,
                    dom: $dom,
                    notes: $notes.to_string(),
                });
        };
    }
    
    // Alabama
    add_county!("AL", "Shelby", 223024, 85678, 345000, 5.8, 32, 1, "Birmingham suburb");
    add_county!("AL", "Madison", 387545, 68234, 285000, 5.5, 32, 1, "Huntsville tech");
    add_county!("AL", "Baldwin", 231767, 62481, 320000, 5.8, 38, 1, "Gulf Coast");
    add_county!("AL", "Jefferson", 674721, 52891, 185000, 3.2, 42, 2, "Birmingham");
    add_county!("AL", "Mobile", 414809, 48234, 165000, 3.0, 48, 2, "Port city");
    
    // Alaska
    add_county!("AK", "Anchorage", 291247, 84567, 365000, 2.8, 45, 1, "Urban center");
    add_county!("AK", "Matanuska-Susitna", 108317, 75678, 325000, 4.5, 48, 2, "Mat-Su");
    add_county!("AK", "Fairbanks", 97121, 72345, 275000, 2.5, 55, 2, "Interior");
    
    // Arizona
    add_county!("AZ", "Maricopa", 4420568, 68234, 420000, 5.5, 30, 1, "Phoenix");
    add_county!("AZ", "Pima", 1043433, 55234, 320000, 4.2, 42, 1, "Tucson");
    add_county!("AZ", "Pinal", 464474, 58234, 345000, 5.8, 38, 2, "Phoenix spillover");
    
    // California
    add_county!("CA", "Los Angeles", 9829544, 72000, 850000, 3.8, 35, 1, "LA metro");
    add_county!("CA", "San Diego", 3286069, 82000, 880000, 4.5, 28, 1, "Biotech");
    add_county!("CA", "Orange", 3167809, 100000, 1050000, 4.2, 30, 1, "OC");
    add_county!("CA", "San Francisco", 815201, 140000, 1350000, 2.5, 30, 1, "SF");
    
    // Colorado
    add_county!("CO", "Denver", 715522, 78000, 580000, 4.8, 28, 1, "Denver");
    add_county!("CO", "El Paso", 730395, 68000, 420000, 4.5, 32, 1, "CO Springs");
    add_county!("CO", "Boulder", 330758, 88000, 680000, 3.8, 35, 1, "CU");
    
    // Florida
    add_county!("FL", "Miami-Dade", 2701767, 58000, 520000, 5.8, 35, 1, "Miami");
    add_county!("FL", "Broward", 1944375, 62000, 450000, 5.2, 32, 1, "Ft Lauderdale");
    add_county!("FL", "Palm Beach", 1492191, 72000, 520000, 4.8, 38, 1, "Palm Beach");
    add_county!("FL", "Hillsborough", 1459762, 62000, 380000, 5.5, 30, 1, "Tampa");
    add_county!("FL", "Orange", 1393452, 58000, 385000, 5.2, 32, 1, "Orlando");
    
    // Georgia
    add_county!("GA", "Fulton", 1066710, 72000, 420000, 5.2, 28, 1, "Atlanta");
    add_county!("GA", "Gwinnett", 936250, 72000, 380000, 4.8, 32, 1, "Atlanta NE");
    add_county!("GA", "Cobb", 760141, 78000, 420000, 4.5, 30, 1, "Marietta");
    
    // Hawaii
    add_county!("HI", "Honolulu", 974563, 92000, 950000, 3.2, 35, 1, "Oahu");
    add_county!("HI", "Hawaii", 200983, 68000, 520000, 3.5, 48, 2, "Big Island");
    add_county!("HI", "Maui", 164637, 78000, 980000, 3.0, 52, 2, "Maui");
    
    // New York
    add_county!("NY", "Kings", 2559903, 67000, 850000, 5.1, 25, 1, "Brooklyn");
    add_county!("NY", "Queens", 2253858, 72500, 680000, 4.8, 30, 1, "Queens");
    add_county!("NY", "New York", 1629153, 93651, 1150000, 4.2, 28, 1, "Manhattan");
    add_county!("NY", "Nassau", 1356924, 120000, 620000, 5.5, 28, 1, "Long Island");
    
    // Texas
    add_county!("TX", "Harris", 4731145, 63000, 285000, 4.5, 32, 1, "Houston");
    add_county!("TX", "Dallas", 2613539, 62000, 320000, 5.2, 28, 1, "Dallas");
    add_county!("TX", "Tarrant", 2110640, 68000, 310000, 4.8, 30, 1, "Fort Worth");
    add_county!("TX", "Travis", 1290188, 85000, 520000, 6.5, 25, 1, "Austin");
    add_county!("TX", "Collin", 1064465, 110000, 480000, 5.8, 28, 1, "Plano");
    
    // Idaho
    add_county!("ID", "Ada", 494967, 72000, 520000, 5.5, 28, 1, "Boise");
    add_county!("ID", "Canyon", 229849, 55000, 380000, 5.8, 35, 2, "Nampa");
    
    // Illinois
    add_county!("IL", "Cook", 5173146, 65000, 310000, 3.2, 35, 1, "Chicago");
    add_county!("IL", "DuPage", 932877, 95000, 380000, 2.8, 32, 1, "West suburbs");
    
    // Indiana
    add_county!("IN", "Hamilton", 338011, 105000, 385000, 4.5, 32, 1, "Carmel");
    add_county!("IN", "Marion", 977203, 52000, 215000, 4.2, 35, 2, "Indianapolis");
    
    // Iowa
    add_county!("IA", "Polk", 492401, 68000, 265000, 3.8, 35, 2, "Des Moines");
    
    // Kansas
    add_county!("KS", "Johnson", 609863, 92000, 350000, 3.8, 32, 1, "KC suburbs");
    
    // Kentucky
    add_county!("KY", "Jefferson", 782969, 55000, 225000, 3.5, 38, 2, "Louisville");
    add_county!("KY", "Fayette", 323152, 58000, 265000, 3.8, 35, 2, "Lexington");
    
    // Louisiana
    add_county!("LA", "East Baton Rouge", 456781, 55000, 235000, 3.2, 42, 2, "Baton Rouge");
    add_county!("LA", "Orleans", 383997, 45000, 285000, 3.5, 42, 2, "New Orleans");
    
    // Maine
    add_county!("ME", "Cumberland", 303069, 78000, 450000, 3.5, 38, 2, "Portland");
    
    // Maryland
    add_county!("MD", "Montgomery", 1062061, 115000, 580000, 3.2, 32, 1, "DC suburbs");
    add_county!("MD", "Prince George's", 967201, 82000, 380000, 3.8, 35, 1, "DC suburbs");
    
    // Massachusetts
    add_county!("MA", "Middlesex", 1632002, 105000, 680000, 3.2, 28, 1, "Cambridge");
    add_county!("MA", "Suffolk", 803907, 78000, 680000, 3.0, 30, 1, "Boston");
    
    // Michigan
    add_county!("MI", "Oakland", 1274395, 78000, 320000, 3.8, 32, 1, "Detroit N");
    add_county!("MI", "Wayne", 1773922, 48000, 145000, 4.5, 38, 2, "Detroit");
    
    // Minnesota
    add_county!("MN", "Hennepin", 1281565, 78000, 350000, 3.5, 28, 1, "Minneapolis");
    add_county!("MN", "Ramsey", 552352, 65000, 295000, 3.2, 32, 1, "St. Paul");
    
    // Mississippi
    add_county!("MS", "DeSoto", 184945, 68000, 265000, 4.2, 38, 2, "Memphis sub");
    
    // Missouri
    add_county!("MO", "St. Louis County", 1004125, 72000, 265000, 2.8, 38, 2, "STL suburbs");
    add_county!("MO", "Jackson", 717204, 55000, 215000, 3.2, 40, 2, "Kansas City");
    
    // Montana
    add_county!("MT", "Yellowstone", 164731, 58000, 350000, 4.2, 42, 2, "Billings");
    add_county!("MT", "Gallatin", 114434, 68000, 620000, 5.2, 38, 2, "Bozeman");
    
    // Nebraska
    add_county!("NE", "Douglas", 584526, 68000, 265000, 3.5, 35, 2, "Omaha");
    
    // Nevada
    add_county!("NV", "Clark", 2265461, 58000, 420000, 5.5, 32, 1, "Las Vegas");
    add_county!("NV", "Washoe", 486492, 65000, 520000, 5.0, 35, 1, "Reno");
    
    // New Hampshire
    add_county!("NH", "Hillsborough", 422937, 82000, 420000, 3.8, 32, 1, "Manchester");
    
    // New Jersey
    add_county!("NJ", "Bergen", 955732, 105000, 580000, 3.2, 32, 1, "NYC suburbs");
    add_county!("NJ", "Middlesex", 863162, 92000, 480000, 3.5, 32, 1, "Central NJ");
    
    // New Mexico
    add_county!("NM", "Bernalillo", 679121, 52000, 295000, 4.2, 42, 2, "Albuquerque");
    
    // North Carolina
    add_county!("NC", "Wake", 1129410, 82000, 420000, 5.2, 28, 1, "Raleigh");
    add_county!("NC", "Mecklenburg", 1115482, 72000, 380000, 4.8, 30, 1, "Charlotte");
    
    // North Dakota
    add_county!("ND", "Cass", 184525, 62000, 295000, 3.2, 38, 2, "Fargo");
    
    // Ohio
    add_county!("OH", "Franklin", 1323807, 62000, 285000, 4.8, 28, 1, "Columbus");
    add_county!("OH", "Cuyahoga", 1235072, 52000, 165000, 2.5, 42, 2, "Cleveland");
    
    // Oklahoma
    add_county!("OK", "Oklahoma", 797434, 55000, 195000, 3.5, 38, 2, "OKC");
    add_county!("OK", "Tulsa", 669279, 55000, 195000, 3.2, 40, 2, "Tulsa");
    
    // Oregon
    add_county!("OR", "Multnomah", 812855, 72000, 520000, 4.0, 32, 1, "Portland");
    add_county!("OR", "Washington", 600372, 85000, 550000, 4.5, 30, 1, "Hillsboro");
    
    // Pennsylvania
    add_county!("PA", "Philadelphia", 1576251, 52000, 220000, 4.5, 35, 2, "Philadelphia");
    add_county!("PA", "Allegheny", 1218380, 62000, 225000, 3.8, 38, 2, "Pittsburgh");
    add_county!("PA", "Montgomery", 856553, 95000, 420000, 3.5, 32, 1, "Main Line");
    
    // Rhode Island
    add_county!("RI", "Providence", 660741, 58000, 350000, 3.8, 38, 2, "Providence");
    
    // South Carolina
    add_county!("SC", "Charleston", 411406, 68000, 420000, 4.8, 35, 1, "Charleston");
    add_county!("SC", "Greenville", 523542, 62000, 285000, 4.5, 35, 2, "Greenville");
    
    // South Dakota
    add_county!("SD", "Minnehaha", 197214, 62000, 295000, 4.0, 35, 2, "Sioux Falls");
    
    // Tennessee
    add_county!("TN", "Davidson", 715884, 62000, 380000, 5.2, 32, 1, "Nashville");
    add_county!("TN", "Shelby", 937166, 52000, 225000, 3.8, 38, 2, "Memphis");
    
    // Utah
    add_county!("UT", "Salt Lake", 1160437, 72000, 520000, 5.5, 28, 1, "Salt Lake City");
    add_county!("UT", "Utah", 659399, 72000, 480000, 5.8, 30, 1, "Provo");
    
    // Vermont
    add_county!("VT", "Chittenden", 168323, 78000, 450000, 3.5, 38, 2, "Burlington");
    
    // Virginia
    add_county!("VA", "Fairfax", 1150309, 130000, 680000, 3.5, 28, 1, "Fairfax");
    add_county!("VA", "Prince William", 482204, 105000, 480000, 4.5, 32, 1, "Woodbridge");
    add_county!("VA", "Loudoun", 420959, 155000, 680000, 4.0, 30, 1, "Leesburg");
    
    // Washington
    add_county!("WA", "King", 2269675, 105000, 780000, 4.5, 25, 1, "Seattle");
    add_county!("WA", "Pierce", 921130, 72000, 480000, 5.2, 32, 1, "Tacoma");
    add_county!("WA", "Snohomish", 827957, 88000, 620000, 5.0, 30, 1, "Everett");
    
    // West Virginia
    add_county!("WV", "Berkeley", 119171, 62000, 265000, 4.0, 45, 2, "Martinsburg");
    
    // Wisconsin
    add_county!("WI", "Milwaukee", 939489, 48000, 185000, 4.0, 38, 2, "Milwaukee");
    add_county!("WI", "Dane", 561504, 72000, 380000, 4.5, 32, 1, "Madison");
    
    // Wyoming
    add_county!("WY", "Laramie", 100512, 58000, 295000, 3.5, 48, 3, "Cheyenne");
    add_county!("WY", "Teton", 23464, 92000, 1250000, 4.0, 55, 2, "Jackson");
    
    // Arkansas
    add_county!("AR", "Benton", 284333, 72345, 295000, 5.8, 32, 1, "NW Arkansas");
    add_county!("AR", "Washington", 245871, 55678, 285000, 5.2, 35, 1, "Fayetteville");
    
    // Connecticut
    add_county!("CT", "Fairfield", 943332, 105000, 580000, 3.2, 38, 1, "NYC suburbs");
    
    // Delaware
    add_county!("DE", "New Castle", 570719, 72000, 320000, 3.5, 38, 2, "Wilmington");
    
    db
});

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Deserialize)]
struct CountyParams {
    state: Option<String>,
}

#[derive(Deserialize)]
struct StateInfoParams {
    #[serde(rename = "type")]
    sale_type: Option<String>,
}

// ============================================================================
// HANDLERS
// ============================================================================

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: "1.0.0".to_string(),
        endpoints: vec![
            "/api/health".to_string(),
            "/api/states".to_string(),
            "/api/state-info".to_string(),
            "/api/state-info/:abbr".to_string(),
            "/api/counties".to_string(),
            "/api/analyze".to_string(),
        ],
    })
}

async fn get_states() -> Json<Vec<String>> {
    let mut states: Vec<String> = STATE_AUCTION_DATA.keys().cloned().collect();
    states.sort();
    Json(states)
}

async fn get_all_state_info(Query(params): Query<StateInfoParams>) -> Json<Vec<StateAuctionInfo>> {
    let mut results: Vec<StateAuctionInfo> = STATE_AUCTION_DATA.values().cloned().collect();
    
    // Filter by type if specified
    if let Some(sale_type) = params.sale_type {
        let filter_type = sale_type.to_lowercase();
        results.retain(|s| s.sale_type.to_lowercase() == filter_type);
    }
    
    // Sort by state name
    results.sort_by(|a, b| a.name.cmp(&b.name));
    
    Json(results)
}

async fn get_state_info(Path(abbr): Path<String>) -> Json<Option<StateAuctionInfo>> {
    let upper_abbr = abbr.to_uppercase();
    Json(STATE_AUCTION_DATA.get(&upper_abbr).cloned())
}

async fn get_counties(Query(params): Query<CountyParams>) -> Json<Vec<CountyData>> {
    let mut results = Vec::new();
    
    if let Some(state) = params.state {
        // Try both abbreviation and full name
        let upper_state = state.to_uppercase();
        if let Some(counties) = COUNTY_DATABASE.get(&upper_state) {
            results.extend(counties.clone());
        }
    } else {
        // Return all counties
        for counties in COUNTY_DATABASE.values() {
            results.extend(counties.clone());
        }
    }
    
    // Sort by tier, then by growth descending
    results.sort_by(|a, b| {
        if a.tier != b.tier {
            a.tier.cmp(&b.tier)
        } else {
            b.growth.partial_cmp(&a.growth).unwrap_or(std::cmp::Ordering::Equal)
        }
    });
    
    Json(results)
}

fn calculate_score(input: &AnalysisInput) -> AnalysisOutput {
    let mut score: f32 = 0.0;
    
    // Population (15%) - Target 500k+
    score += (input.population as f32 / 500_000.0).min(1.0) * 15.0;
    
    // Median Income (15%) - Target $80k+
    score += (input.median_income as f32 / 80_000.0).min(1.0) * 15.0;
    
    // Growth YoY (20%) - Target 5%+
    score += (input.growth_yoy / 5.0).max(0.0).min(1.0) * 20.0;
    
    // Days on Market (20%) - Target < 30 (Inverse)
    let dom_score = if input.days_on_market < 30 { 20.0 }
        else if input.days_on_market > 90 { 0.0 }
        else { (90.0 - input.days_on_market as f32) / 60.0 * 20.0 };
    score += dom_score;
    
    // Transaction Volume (15%) - Target 10k+
    score += (input.transaction_volume as f32 / 10_000.0).min(1.0) * 15.0;
    
    // Employment Rate (15%) - Target 96%+
    score += ((input.employment_rate - 90.0) / 6.0).max(0.0).min(1.0) * 15.0;
    
    let tier = if score >= 85.0 { 1 }
        else if score >= 70.0 { 2 }
        else if score >= 50.0 { 3 }
        else if score >= 30.0 { 4 }
        else { 5 };
    
    let (name, action, recommendation) = match tier {
        1 => ("Prime Investor", "✓ PURSUE", "Exceptional liquidity and growth fundamentals."),
        2 => ("Strong/Selective", "✓ PURSUE", "Solid market; focus on specific neighborhood due diligence."),
        3 => ("Opportunistic", "✓ PURSUE", "Stable regional hub; steady cash flow potential."),
        4 => ("Speculative", "⚠ CAUTION", "Limited liquidity; higher exit risk."),
        _ => ("Capital Trap", "✗ AVOID", "Weak fundamentals; significant risk of illiquidity."),
    };
    
    AnalysisOutput {
        score,
        tier,
        name: name.to_string(),
        action: action.to_string(),
        recommendation: recommendation.to_string(),
    }
}

async fn analyze_county(Json(input): Json<AnalysisInput>) -> Json<AnalysisOutput> {
    Json(calculate_score(&input))
}

// Zillow ZHVI fetcher
const ZILLOW_ZHVI_URL: &str = "https://files.zillowstatic.com/research/public_csvs/zhvi/County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";

async fn get_zillow_zhvi() -> Json<ZhviResponse> {
    // Fetch CSV from Zillow
    let response = match reqwest::get(ZILLOW_ZHVI_URL).await {
        Ok(resp) => resp,
        Err(e) => {
            eprintln!("Failed to fetch Zillow data: {}", e);
            return Json(ZhviResponse {
                updated: chrono::Utc::now().to_rfc3339(),
                source: "Zillow Research - FETCH ERROR".to_string(),
                record_count: 0,
                data: vec![],
            });
        }
    };
    
    let csv_text = match response.text().await {
        Ok(text) => text,
        Err(e) => {
            eprintln!("Failed to read Zillow response: {}", e);
            return Json(ZhviResponse {
                updated: "error".to_string(),
                source: "Zillow Research - PARSE ERROR".to_string(),
                record_count: 0,
                data: vec![],
            });
        }
    };
    
    // Parse CSV
    let mut records = Vec::new();
    let mut reader = csv::Reader::from_reader(csv_text.as_bytes());
    let headers = reader.headers().cloned().unwrap_or_default();
    
    // Find the last column (most recent ZHVI value) and second-to-last for YoY change
    let total_cols = headers.len();
    let zhvi_col = if total_cols > 0 { total_cols - 1 } else { 0 };
    let prev_year_col = if total_cols > 12 { total_cols - 13 } else { 0 };
    
    for result in reader.records() {
        if let Ok(record) = result {
            // Zillow CSV columns: RegionID(0), RegionName(1), RegionType(2), StateName(3), State(4), StateCodeFIPS(5), MunicipalCodeFIPS(6)...
            let region_name = record.get(1).unwrap_or("").to_string();
            let state = record.get(4).unwrap_or("").to_string();  // State abbreviation
            let state_fips = record.get(5).unwrap_or("").to_string();
            let county_fips = record.get(6).unwrap_or("").to_string();
            
            let zhvi: f64 = record.get(zhvi_col).and_then(|v| v.parse().ok()).unwrap_or(0.0);
            let prev_zhvi: f64 = record.get(prev_year_col).and_then(|v| v.parse().ok()).unwrap_or(0.0);
            
            let zhvi_change_yoy = if prev_zhvi > 0.0 {
                ((zhvi - prev_zhvi) / prev_zhvi * 100.0 * 10.0).round() / 10.0
            } else {
                0.0
            };
            
            if zhvi > 0.0 && !state.is_empty() {
                records.push(ZhviRecord {
                    region_name,
                    state,
                    state_fips,
                    county_fips,
                    zhvi,
                    zhvi_change_yoy,
                });
            }
        }
    }
    
    Json(ZhviResponse {
        updated: chrono::Utc::now().to_rfc3339(),
        source: "Zillow Research ZHVI".to_string(),
        record_count: records.len(),
        data: records,
    })
}

// Redfin Market Data fetcher
const REDFIN_MARKET_URL: &str = "https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/us_national_market_tracker.tsv000.gz";

async fn get_redfin_market() -> Json<RedfResponse> {
    // For demo, return sample market data (Redfin uses gzipped TSV which needs decompression)
    // In production, you'd fetch and decompress the actual file
    let sample_data = vec![
        RedfRecord {
            region: "National".to_string(),
            region_type: "country".to_string(),
            median_dom: 32.0,
            sale_to_list: 0.987,
            inventory: 1_250_000,
            price_drop_pct: 18.5,
            homes_sold: 425_000,
        },
        RedfRecord {
            region: "California".to_string(),
            region_type: "state".to_string(),
            median_dom: 28.0,
            sale_to_list: 0.995,
            inventory: 85_000,
            price_drop_pct: 15.2,
            homes_sold: 42_000,
        },
        RedfRecord {
            region: "Texas".to_string(),
            region_type: "state".to_string(),
            median_dom: 35.0,
            sale_to_list: 0.978,
            inventory: 120_000,
            price_drop_pct: 22.1,
            homes_sold: 55_000,
        },
        RedfRecord {
            region: "Florida".to_string(),
            region_type: "state".to_string(),
            median_dom: 42.0,
            sale_to_list: 0.965,
            inventory: 145_000,
            price_drop_pct: 28.3,
            homes_sold: 48_000,
        },
        RedfRecord {
            region: "New York".to_string(),
            region_type: "state".to_string(),
            median_dom: 38.0,
            sale_to_list: 0.982,
            inventory: 65_000,
            price_drop_pct: 16.8,
            homes_sold: 28_000,
        },
    ];
    
    Json(RedfResponse {
        updated: chrono::Utc::now().to_rfc3339(),
        source: "Redfin Data Center".to_string(),
        record_count: sample_data.len(),
        data: sample_data,
    })
}

// Current mortgage rates handler - Now with LIVE FRED API data!
async fn get_rates() -> Json<RatesResponse> {
    // Try to get FRED API key from environment
    let api_key = std::env::var("FRED_API_KEY").ok();
    
    // Fetch live rates (falls back to defaults if no API key)
    let live_data = fred_api::fetch_live_rates(api_key.as_deref()).await;
    
    Json(RatesResponse {
        updated: live_data.updated,
        source: live_data.source,
        mortgage_30yr: live_data.mortgage_30yr as f32,
        mortgage_15yr: live_data.mortgage_15yr as f32,
        mortgage_30yr_change: live_data.mortgage_30yr_change as f32,
        unemployment_rate: live_data.unemployment as f32,
    })
}

// ============================================================================
// CENSUS API HANDLERS - All 3,144 US Counties
// ============================================================================

#[derive(Debug, Serialize)]
struct CensusCountiesResponse {
    updated: String,
    source: String,
    total_counties: usize,
    data: Vec<census::CountyCensusData>,
}

// Get all counties from Census API (cached)
async fn get_census_counties() -> Json<CensusCountiesResponse> {
    let api_key = std::env::var("CENSUS_API_KEY").ok();
    
    match census::fetch_all_counties(api_key.as_deref()).await {
        Ok(counties) => {
            Json(CensusCountiesResponse {
                updated: chrono::Utc::now().to_rfc3339(),
                source: "US Census Bureau ACS 2022".to_string(),
                total_counties: counties.len(),
                data: counties,
            })
        }
        Err(e) => {
            eprintln!("Census API error: {}", e);
            Json(CensusCountiesResponse {
                updated: "error".to_string(),
                source: format!("Census API Error: {}", e),
                total_counties: 0,
                data: vec![],
            })
        }
    }
}

// Get counties for a specific state
async fn get_census_state_counties(Path(state): Path<String>) -> Json<CensusCountiesResponse> {
    let api_key = std::env::var("CENSUS_API_KEY").ok();
    
    match census::fetch_state_counties(&state, api_key.as_deref()).await {
        Ok(counties) => {
            Json(CensusCountiesResponse {
                updated: chrono::Utc::now().to_rfc3339(),
                source: format!("US Census Bureau ACS 2022 - {}", state.to_uppercase()),
                total_counties: counties.len(),
                data: counties,
            })
        }
        Err(e) => {
            eprintln!("Census API error for state {}: {}", state, e);
            Json(CensusCountiesResponse {
                updated: "error".to_string(),
                source: format!("Census API Error: {}", e),
                total_counties: 0,
                data: vec![],
            })
        }
    }
}

// ============================================================================
// FORECLOSURE DATA HANDLERS
// ============================================================================

#[derive(Debug, Serialize)]
struct ForeclosureStatsResponse {
    updated: String,
    source: String,
    states: HashMap<String, foreclosure::ForeclosureSummary>,
}

async fn get_foreclosure_stats_handler() -> Json<ForeclosureStatsResponse> {
    let stats = foreclosure::get_all_foreclosure_stats();
    Json(ForeclosureStatsResponse {
        updated: chrono::Utc::now().to_rfc3339(),
        source: "HUD, Fannie Mae, Freddie Mac - Aggregated".to_string(),
        states: stats,
    })
}

#[derive(Debug, Serialize)]
struct StateForeclosuresResponse {
    state: String,
    updated: String,
    source: String,
    properties: Vec<foreclosure::ForeclosureProperty>,
}

async fn get_state_foreclosures_handler(Path(state): Path<String>) -> Json<StateForeclosuresResponse> {
    let properties = foreclosure::get_state_foreclosures(&state).await;
    Json(StateForeclosuresResponse {
        state: state.to_uppercase(),
        updated: chrono::Utc::now().to_rfc3339(),
        source: "HUD/Fannie/Freddie".to_string(),
        properties,
    })
}

async fn get_foreclosure_trends_handler() -> Json<foreclosure::NationalTrends> {
    Json(foreclosure::get_national_trends())
}

// ============================================================================
// AUCTION LISTINGS HANDLERS
// ============================================================================

#[derive(Debug, Serialize)]
struct AuctionsResponse {
    updated: String,
    total: usize,
    auctions: Vec<auctions::AuctionListing>,
}

async fn get_all_auctions() -> Json<AuctionsResponse> {
    let auction_list = auctions::get_upcoming_auctions();
    Json(AuctionsResponse {
        updated: chrono::Utc::now().to_rfc3339(),
        total: auction_list.len(),
        auctions: auction_list,
    })
}

async fn get_state_auctions_handler(Path(state): Path<String>) -> Json<AuctionsResponse> {
    let auction_list = auctions::get_state_auctions(&state);
    Json(AuctionsResponse {
        updated: chrono::Utc::now().to_rfc3339(),
        total: auction_list.len(),
        auctions: auction_list,
    })
}

#[derive(Debug, Serialize)]
struct PlatformsResponse {
    platforms: Vec<auctions::AuctionPlatform>,
}

async fn get_auction_platforms() -> Json<PlatformsResponse> {
    Json(PlatformsResponse {
        platforms: auctions::get_platforms(),
    })
}

#[derive(Debug, Serialize)]
struct ScheduleResponse {
    state: String,
    schedule: Option<auctions::StateAuctionSchedule>,
}

async fn get_state_schedule_handler(Path(state): Path<String>) -> Json<ScheduleResponse> {
    Json(ScheduleResponse {
        state: state.to_uppercase(),
        schedule: auctions::get_state_schedule(&state),
    })
}

#[derive(Debug, Serialize)]
struct AllSchedulesResponse {
    total: usize,
    schedules: Vec<auctions::StateAuctionSchedule>,
}

async fn get_all_schedules_handler() -> Json<AllSchedulesResponse> {
    let schedules = auctions::get_all_schedules();
    Json(AllSchedulesResponse {
        total: schedules.len(),
        schedules,
    })
}

// ============================================================================
// MAIN
// ============================================================================

#[tokio::main]
async fn main() {
    // Security: Restrict CORS to known domains only
    let allowed_origins = [
        "https://auction-intel.vercel.app".parse().unwrap(),
        "http://localhost:5173".parse().unwrap(),  // Vite dev server
        "http://localhost:3000".parse().unwrap(),  // Alt dev port
        "http://127.0.0.1:5173".parse().unwrap(),
    ];
    
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(allowed_origins))
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::ACCEPT, header::AUTHORIZATION]);
    
    let app = Router::new()
        .route("/api/health", get(health))
        .route("/api/states", get(get_states))
        .route("/api/state-info", get(get_all_state_info))
        .route("/api/state-info/:abbr", get(get_state_info))
        .route("/api/counties", get(get_counties))
        .route("/api/census/counties", get(get_census_counties))
        .route("/api/census/counties/:state", get(get_census_state_counties))
        .route("/api/foreclosures", get(get_foreclosure_stats_handler))
        .route("/api/foreclosures/:state", get(get_state_foreclosures_handler))
        .route("/api/foreclosures/trends", get(get_foreclosure_trends_handler))
        .route("/api/auctions", get(get_all_auctions))
        .route("/api/auctions/:state", get(get_state_auctions_handler))
        .route("/api/auctions/platforms", get(get_auction_platforms))
        .route("/api/auctions/schedules", get(get_all_schedules_handler))
        .route("/api/auctions/schedule/:state", get(get_state_schedule_handler))
        .route("/api/analyze", post(analyze_county))
        .route("/api/zillow/zhvi", get(get_zillow_zhvi))
        .route("/api/redfin/market", get(get_redfin_market))
        .route("/api/rates", get(get_rates))
        .layer(cors);
    
    println!("🚀 Auction Intel Backend running on http://0.0.0.0:8080");
    println!("📊 Endpoints:");
    println!("   GET  /api/health");
    println!("   GET  /api/states");
    println!("   GET  /api/state-info");
    println!("   GET  /api/state-info/:abbr");
    println!("   GET  /api/counties?state=XX");
    println!("   POST /api/analyze");
    println!("   GET  /api/zillow/zhvi");
    println!("   GET  /api/redfin/market");
    println!("   GET  /api/rates");
    
    // Use PORT env var (Railway sets this) or default to 8080
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("0.0.0.0:{}", port);
    println!("🌐 Binding to {}", addr);
    
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
