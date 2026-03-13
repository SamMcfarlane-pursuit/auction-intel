use serde::{Deserialize, Serialize};

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
