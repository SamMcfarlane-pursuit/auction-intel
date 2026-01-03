// Census API Client - Fetch county data for all US counties
// Documentation: https://api.census.gov/data/2022/acs/acs5.html

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use once_cell::sync::Lazy;

// Census API endpoint
const CENSUS_API_BASE: &str = "https://api.census.gov/data/2022/acs/acs5";

// State FIPS mapping
static STATE_FIPS: Lazy<HashMap<&str, &str>> = Lazy::new(|| {
    let mut m = HashMap::new();
    m.insert("AL", "01"); m.insert("AK", "02"); m.insert("AZ", "04"); m.insert("AR", "05");
    m.insert("CA", "06"); m.insert("CO", "08"); m.insert("CT", "09"); m.insert("DE", "10");
    m.insert("DC", "11"); m.insert("FL", "12"); m.insert("GA", "13"); m.insert("HI", "15");
    m.insert("ID", "16"); m.insert("IL", "17"); m.insert("IN", "18"); m.insert("IA", "19");
    m.insert("KS", "20"); m.insert("KY", "21"); m.insert("LA", "22"); m.insert("ME", "23");
    m.insert("MD", "24"); m.insert("MA", "25"); m.insert("MI", "26"); m.insert("MN", "27");
    m.insert("MS", "28"); m.insert("MO", "29"); m.insert("MT", "30"); m.insert("NE", "31");
    m.insert("NV", "32"); m.insert("NH", "33"); m.insert("NJ", "34"); m.insert("NM", "35");
    m.insert("NY", "36"); m.insert("NC", "37"); m.insert("ND", "38"); m.insert("OH", "39");
    m.insert("OK", "40"); m.insert("OR", "41"); m.insert("PA", "42"); m.insert("RI", "44");
    m.insert("SC", "45"); m.insert("SD", "46"); m.insert("TN", "47"); m.insert("TX", "48");
    m.insert("UT", "49"); m.insert("VT", "50"); m.insert("VA", "51"); m.insert("WA", "53");
    m.insert("WV", "54"); m.insert("WI", "55"); m.insert("WY", "56");
    m
});

// Reverse FIPS to state abbr
static FIPS_TO_STATE: Lazy<HashMap<&str, &str>> = Lazy::new(|| {
    STATE_FIPS.iter().map(|(k, v)| (*v, *k)).collect()
});

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountyCensusData {
    pub name: String,
    pub state: String,
    pub fips: String,
    pub population: i64,
    pub median_income: i64,
    pub median_home_value: i64,
    pub total_housing_units: i64,
    pub vacant_units: i64,
    pub tier: i32,
}

// Cache for census data (avoid hitting API on every request)
pub struct CensusCache {
    data: RwLock<Option<Vec<CountyCensusData>>>,
    last_fetch: RwLock<Option<std::time::Instant>>,
}

impl CensusCache {
    pub fn new() -> Self {
        CensusCache {
            data: RwLock::new(None),
            last_fetch: RwLock::new(None),
        }
    }
}

static CENSUS_CACHE: Lazy<Arc<CensusCache>> = Lazy::new(|| Arc::new(CensusCache::new()));

// Tier calculation based on population, income, and home values
fn calculate_tier(population: i64, income: i64, home_value: i64) -> i32 {
    let mut score = 0.0;
    
    // Population score (25%)
    score += (population as f64 / 500_000.0).min(1.0) * 25.0;
    
    // Income score (25%)
    score += (income as f64 / 80_000.0).min(1.0) * 25.0;
    
    // Home value score (indicates growth - 50%)
    // Assuming higher value = stronger market
    score += (home_value as f64 / 400_000.0).min(1.0) * 50.0;
    
    match score as i32 {
        80..=100 => 1,  // Prime
        60..=79 => 2,   // Strong
        40..=59 => 3,   // Opportunity
        20..=39 => 4,   // Speculative
        _ => 5,         // Avoid
    }
}

// Fetch all counties from Census API
pub async fn fetch_all_counties(api_key: Option<&str>) -> Result<Vec<CountyCensusData>, String> {
    // Check cache first (valid for 24 hours)
    {
        let last_fetch = CENSUS_CACHE.last_fetch.read().await;
        let data = CENSUS_CACHE.data.read().await;
        if let (Some(time), Some(cached_data)) = (&*last_fetch, &*data) {
            if time.elapsed().as_secs() < 86400 {
                return Ok(cached_data.clone());
            }
        }
    }
    
    let client = Client::new();
    
    // Census API variables:
    // B01003_001E = Total population
    // B19013_001E = Median household income
    // B25077_001E = Median home value
    // B25001_001E = Total housing units
    // B25002_003E = Vacant housing units
    
    let key_param = api_key.map(|k| format!("&key={}", k)).unwrap_or_default();
    let url = format!(
        "{}?get=NAME,B01003_001E,B19013_001E,B25077_001E,B25001_001E,B25002_003E&for=county:*&in=state:*{}",
        CENSUS_API_BASE,
        key_param
    );
    
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Census API request failed: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Census API returned status: {}", response.status()));
    }
    
    let data: Vec<Vec<String>> = response.json()
        .await
        .map_err(|e| format!("Failed to parse Census response: {}", e))?;
    
    // Skip header row
    let counties: Vec<CountyCensusData> = data.iter()
        .skip(1)
        .filter_map(|row| {
            if row.len() < 8 { return None; }
            
            let name_parts: Vec<&str> = row[0].split(',').collect();
            let county_name = name_parts.get(0)
                .unwrap_or(&"Unknown")
                .replace(" County", "")
                .replace(" Parish", "")   // Louisiana
                .replace(" Borough", "")  // Alaska
                .trim()
                .to_string();
            
            let state_fips = row.get(6)?;
            let county_fips = row.get(7)?;
            let state_abbr = FIPS_TO_STATE.get(state_fips.as_str())?;
            
            let population = row[1].parse().unwrap_or(0);
            let income = row[2].parse().unwrap_or(0);
            let home_value = row[3].parse().unwrap_or(0);
            let housing_units = row[4].parse().unwrap_or(0);
            let vacant = row[5].parse().unwrap_or(0);
            
            // Skip if missing critical data
            if population == 0 || income < 0 { return None; }
            
            let tier = calculate_tier(population, income, home_value);
            
            Some(CountyCensusData {
                name: county_name,
                state: state_abbr.to_string(),
                fips: format!("{}{}", state_fips, county_fips),
                population,
                median_income: income,
                median_home_value: home_value,
                total_housing_units: housing_units,
                vacant_units: vacant,
                tier,
            })
        })
        .collect();
    
    // Update cache
    {
        let mut cache_data = CENSUS_CACHE.data.write().await;
        let mut cache_time = CENSUS_CACHE.last_fetch.write().await;
        *cache_data = Some(counties.clone());
        *cache_time = Some(std::time::Instant::now());
    }
    
    Ok(counties)
}

// Fetch counties for a specific state
pub async fn fetch_state_counties(state_abbr: &str, api_key: Option<&str>) -> Result<Vec<CountyCensusData>, String> {
    let all_counties = fetch_all_counties(api_key).await?;
    let state_upper = state_abbr.to_uppercase();
    
    Ok(all_counties.into_iter()
        .filter(|c| c.state == state_upper)
        .collect())
}

// Get county statistics summary
pub fn county_stats(counties: &[CountyCensusData]) -> HashMap<String, serde_json::Value> {
    let mut stats = HashMap::new();
    
    stats.insert("total_counties".to_string(), serde_json::json!(counties.len()));
    
    let by_tier: HashMap<i32, usize> = counties.iter()
        .fold(HashMap::new(), |mut acc, c| {
            *acc.entry(c.tier).or_insert(0) += 1;
            acc
        });
    stats.insert("by_tier".to_string(), serde_json::json!(by_tier));
    
    let by_state: HashMap<String, usize> = counties.iter()
        .fold(HashMap::new(), |mut acc, c| {
            *acc.entry(c.state.clone()).or_insert(0) += 1;
            acc
        });
    stats.insert("by_state".to_string(), serde_json::json!(by_state));
    
    stats
}
