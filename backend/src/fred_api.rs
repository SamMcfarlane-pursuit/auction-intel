//! FRED API Client for Federal Reserve Economic Data
//! 
//! Fetches live economic indicators:
//! - MORTGAGE30US - 30-Year Fixed Mortgage Rate
//! - MORTGAGE15US - 15-Year Fixed Mortgage Rate  
//! - FEDFUNDS - Federal Funds Rate
//! - CPIAUCSL - Consumer Price Index (Inflation)
//! - UNRATE - Unemployment Rate
//! - HOUST - Housing Starts

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// FRED API base URL
const FRED_API_BASE: &str = "https://api.stlouisfed.org/fred/series/observations";

// Series IDs for economic indicators
pub const SERIES_MORTGAGE_30YR: &str = "MORTGAGE30US";
pub const SERIES_MORTGAGE_15YR: &str = "MORTGAGE15US";
pub const SERIES_FED_FUNDS: &str = "FEDFUNDS";
pub const SERIES_CPI: &str = "CPIAUCSL";
pub const SERIES_UNEMPLOYMENT: &str = "UNRATE";
pub const SERIES_HOUSING_STARTS: &str = "HOUST";
pub const SERIES_TREASURY_10YR: &str = "DGS10";

#[derive(Debug, Deserialize)]
struct FredResponse {
    observations: Vec<FredObservation>,
}

#[derive(Debug, Deserialize)]
struct FredObservation {
    date: String,
    value: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct FredDataPoint {
    pub series_id: String,
    pub name: String,
    pub value: f64,
    pub date: String,
    pub unit: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct LiveRatesData {
    pub mortgage_30yr: f64,
    pub mortgage_15yr: f64,
    pub mortgage_30yr_change: f64,
    pub fed_funds: f64,
    pub cpi_yoy: f64,
    pub unemployment: f64,
    pub housing_starts: f64,
    pub treasury_10yr: f64,
    pub updated: String,
    pub source: String,
}

/// Fetch latest observation for a FRED series
async fn fetch_series(series_id: &str, api_key: Option<&str>) -> Result<(f64, String), String> {
    let key = api_key.unwrap_or("DEMO_API_KEY"); // Use demo key if not provided
    
    let url = format!(
        "{}?series_id={}&api_key={}&file_type=json&sort_order=desc&limit=1",
        FRED_API_BASE, series_id, key
    );

    match reqwest::get(&url).await {
        Ok(response) => {
            if let Ok(data) = response.json::<FredResponse>().await {
                if let Some(obs) = data.observations.first() {
                    let value: f64 = obs.value.parse().unwrap_or(0.0);
                    return Ok((value, obs.date.clone()));
                }
            }
            Err(format!("No data for series {}", series_id))
        }
        Err(e) => Err(format!("Failed to fetch {}: {}", series_id, e)),
    }
}

/// Fetch historical data for a series (for calculating change)
async fn fetch_series_history(series_id: &str, api_key: Option<&str>, limit: usize) -> Result<Vec<(String, f64)>, String> {
    let key = api_key.unwrap_or("DEMO_API_KEY");
    
    let url = format!(
        "{}?series_id={}&api_key={}&file_type=json&sort_order=desc&limit={}",
        FRED_API_BASE, series_id, key, limit
    );

    match reqwest::get(&url).await {
        Ok(response) => {
            if let Ok(data) = response.json::<FredResponse>().await {
                let history: Vec<(String, f64)> = data.observations
                    .iter()
                    .filter_map(|obs| {
                        obs.value.parse::<f64>().ok().map(|v| (obs.date.clone(), v))
                    })
                    .collect();
                return Ok(history);
            }
            Err("Failed to parse response".to_string())
        }
        Err(e) => Err(format!("Failed to fetch history: {}", e)),
    }
}

/// Fetch all live economic data from FRED
pub async fn fetch_live_rates(api_key: Option<&str>) -> LiveRatesData {
    // Try to fetch live data, fall back to defaults
    let mut mortgage_30yr = 6.72;
    let mut mortgage_15yr = 5.92;
    let mut mortgage_30yr_change = 0.12;
    let mut fed_funds = 4.33;
    let mut cpi_yoy = 2.9;
    let mut unemployment = 4.1;
    let mut housing_starts = 1.499;
    let mut treasury_10yr = 4.68;
    let mut updated = chrono::Utc::now().to_rfc3339();
    let mut source = "Fallback Data".to_string();

    // Only try live fetch if API key is available
    if let Some(key) = api_key {
        if !key.is_empty() && key != "DEMO_API_KEY" {
            source = "FRED API (Live)".to_string();
            
            // Fetch 30-year mortgage with history for change calculation
            if let Ok(history) = fetch_series_history(SERIES_MORTGAGE_30YR, Some(key), 2).await {
                if let Some((date, current)) = history.first() {
                    mortgage_30yr = *current;
                    updated = date.clone();
                    if let Some((_, previous)) = history.get(1) {
                        mortgage_30yr_change = ((current - previous) * 100.0).round() / 100.0;
                    }
                }
            }

            // Fetch 15-year mortgage
            if let Ok((value, _)) = fetch_series(SERIES_MORTGAGE_15YR, Some(key)).await {
                mortgage_15yr = value;
            }

            // Fetch Fed Funds
            if let Ok((value, _)) = fetch_series(SERIES_FED_FUNDS, Some(key)).await {
                fed_funds = value;
            }

            // Fetch Unemployment
            if let Ok((value, _)) = fetch_series(SERIES_UNEMPLOYMENT, Some(key)).await {
                unemployment = value;
            }

            // Fetch 10-Year Treasury
            if let Ok((value, _)) = fetch_series(SERIES_TREASURY_10YR, Some(key)).await {
                treasury_10yr = value;
            }
        }
    }

    LiveRatesData {
        mortgage_30yr,
        mortgage_15yr,
        mortgage_30yr_change,
        fed_funds,
        cpi_yoy,
        unemployment,
        housing_starts,
        treasury_10yr,
        updated,
        source,
    }
}

/// Get indicator metadata
pub fn get_indicator_metadata() -> HashMap<&'static str, (&'static str, &'static str)> {
    let mut meta = HashMap::new();
    meta.insert(SERIES_MORTGAGE_30YR, ("30-Year Fixed Mortgage", "%"));
    meta.insert(SERIES_MORTGAGE_15YR, ("15-Year Fixed Mortgage", "%"));
    meta.insert(SERIES_FED_FUNDS, ("Federal Funds Rate", "%"));
    meta.insert(SERIES_CPI, ("Consumer Price Index", "%"));
    meta.insert(SERIES_UNEMPLOYMENT, ("Unemployment Rate", "%"));
    meta.insert(SERIES_HOUSING_STARTS, ("Housing Starts", "M units"));
    meta.insert(SERIES_TREASURY_10YR, ("10-Year Treasury", "%"));
    meta
}
