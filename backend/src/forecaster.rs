use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Clone)]
pub struct ClearingPredictionOutput {
    pub estimated_clearing_price: f32,
    pub target_clearing_margin_pct: f32, // e.g., 73.5 (Meaning 73.5% of ARV)
    pub safe_bid_max: f32,
    pub danger_zone_threshold: f32,
    pub safety_sentiment: String, // "Safe", "Aggressive", "Overbid"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ForecastInput {
    pub current_zhvi: f32,
    pub historical_growth_yoy: f32,
    pub mortgage_rate_30yr: f32,
    pub employment_rate: f32,
    pub inventory_level: u32,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForecastOutput {
    pub projected_zhvi_12m: f32,
    pub projected_zhvi_24m: f32,
    pub confidence_score: f32,
    pub yield_forecast_pct: f32, // 12-month projected ROI
    pub market_sentiment: String, // "Bullish", "Stable", "Caution"
    pub scenario_aggressive: f32,
    pub scenario_conservative: f32,
}

pub fn predict_market_yield(input: &ForecastInput) -> ForecastOutput {
    // 1. Calculate base growth momentum
    let mut momentum = input.historical_growth_yoy;

    // 2. Adjust for borrowing costs (FRED 30yr Rate impact)
    // High rates (>7%) typically cool growth by 2-3%
    let rate_impact = (input.mortgage_rate_30yr - 4.5).max(0.0) * -0.5;
    momentum += rate_impact;

    // 3. Labor market impact (Employment > 96% is a multiplier)
    if input.employment_rate > 96.0 {
        momentum += 0.5;
    } else if input.employment_rate < 92.0 {
        momentum -= 1.0;
    }

    // 4. Inventory impact (Supply/Demand)
    // Low inventory (<1000 per major hub) typically sustains price growth
    if input.inventory_level < 500 {
        momentum += 1.0;
    }

    // Projected values
    let proj_12m = input.current_zhvi * (1.0 + (momentum / 100.0));
    let proj_24m = proj_12m * (1.0 + (momentum * 0.9 / 100.0)); // Slight diminishing returns on long-term

    let yield_forecast = (proj_12m - input.current_zhvi) / input.current_zhvi * 100.0;

    let sentiment = if momentum > 5.0 {
        "Bullish".to_string()
    } else if momentum > 1.0 {
        "Stable".to_string()
    } else {
        "Caution".to_string()
    };

    let confidence = 0.85 - (input.historical_growth_yoy.abs() * 0.01);

    ForecastOutput {
        projected_zhvi_12m: proj_12m,
        projected_zhvi_24m: proj_24m,
        confidence_score: confidence,
        yield_forecast_pct: yield_forecast,
        market_sentiment: sentiment,
        scenario_aggressive: proj_12m * 1.02,
        scenario_conservative: proj_12m * 0.98,
    }
}

pub fn predict_clearing_margin(fips: &str, arv: f32) -> ClearingPredictionOutput {
    // In a real statistical model, we would fetch actual historical clearance 
    // rates for this specific FIPS code from QuestDB/Postgres.
    // For this simulation, we use deterministic scaling based on FIPS string hash 
    // to generate consistent clearing bounds per county.
    
    let base_mab_percentage = 0.70; // 70% rule
    
    // Hash-like deterministic adjustment based on FIPS string length and first char
    let fips_weight = if let Some(first_char) = fips.chars().next() {
        match first_char.to_digit(10) {
            Some(d) if d > 6 => 0.04,  // High competition market -> pushes clearing price closer to ARV
            Some(d) if d > 3 => 0.015, // Medium competition
            _ => -0.02,                // Low competition
        }
    } else {
        0.0
    };

    // Calculate actual margins
    let expected_margin_pct = base_mab_percentage + fips_weight; // e.g., 74%
    let estimated_clearing_price = arv * expected_margin_pct;
    
    let safe_bid_max = arv * (expected_margin_pct - 0.02); // 2% buffer representing the "Snipe" range
    let danger_zone_threshold = arv * (expected_margin_pct + 0.03); // If you bid above this, it's dangerous

    let safety_sentiment = if expected_margin_pct > 0.73 {
        "Aggressive Market".to_string()
    } else if expected_margin_pct < 0.69 {
        "Favorable Buyer Market".to_string()
    } else {
        "Standard Equilibrium".to_string()
    };

    ClearingPredictionOutput {
        estimated_clearing_price,
        target_clearing_margin_pct: expected_margin_pct * 100.0,
        safe_bid_max,
        danger_zone_threshold,
        safety_sentiment,
    }
}
