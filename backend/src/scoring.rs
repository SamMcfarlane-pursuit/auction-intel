use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnalysisInput {
    pub population: u32,
    pub median_income: u32,
    pub growth_yoy: f32,
    pub days_on_market: u16,
    pub momentum_score: Option<f32>, // 0.0 to 1.0 (from price trends)
    pub list_to_sale_ratio: Option<f32>,
}

#[derive(Debug, Serialize, Clone)]
pub struct AnalysisOutput {
    pub score: f32,             // Raw score from 0-100
    pub grade: String,          // Letter grade (A+, A, B, C, D, F)
    pub recommendation: String, // E.g., Strong Buy, Hold, Avoid
    pub volatility_index: f32,  // 0-1.0
    pub stability_grade: String,
}

/// Calculate an investment score/grade for a county based on v2 Weighted Model
pub fn evaluate_county(input: &AnalysisInput) -> AnalysisOutput {
    let mut score = 0.0;

    // --- WEIGHTED FACTORS ---
    
    // 1. Growth Weight (35%)
    // Benchmark: 2.5% YoY growth is "Good"
    let growth_component = (input.growth_yoy / 2.5).min(1.5).max(-0.5) * 35.0;
    score += growth_component;

    // 2. Liquidity (DOM) Weight (25%)
    // Benchmark: 40 days is neutral. Lower is better.
    let dom_component = ((60.0 - input.days_on_market as f32) / 20.0).min(1.2).max(0.0) * 25.0;
    score += dom_component;

    // 3. Purchasing Power (Income) Weight (20%)
    // Benchmark: $65k is neutral.
    let income_component = (input.median_income as f32 / 65_000.0).min(1.3) * 20.0;
    score += income_component;

    // 4. Momentum (Bonus/Malus 20%)
    // If momentum_score is provided, use it. Otherwise assume neutral (0.5).
    let momentum = input.momentum_score.unwrap_or(0.5);
    score += momentum * 20.0;

    // 5. Population Stability (Static 10% Floor)
    let pop_bonus = ((input.population as f32) / 1_000_000.0).min(1.0) * 10.0;
    score += pop_bonus;

    // Clamp score
    score = score.clamp(0.0, 100.0);

    // Calculate Volatility Index (Inverse of stability)
    // High growth + High DOM = High Volatility
    let volatility_index = (input.growth_yoy.abs() / 10.0 + (input.days_on_market as f32 / 100.0)).min(1.0);
    
    let stability_grade = match volatility_index {
        v if v < 0.3 => "High",
        v if v < 0.6 => "Moderate",
        _ => "Low",
    };

    let (grade, recommendation) = match score {
        s if s >= 88.0 => ("A+", "Institutional Buy"),
        s if s >= 80.0 => ("A", "Strong Buy"),
        s if s >= 70.0 => ("B", "Buy"),
        s if s >= 60.0 => ("C", "Hold"),
        s if s >= 45.0 => ("D", "Avoid"),
        _ => ("F", "Strong Avoid"),
    };

    AnalysisOutput {
        score,
        grade: grade.to_string(),
        recommendation: recommendation.to_string(),
        volatility_index,
        stability_grade: stability_grade.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_high_growth_county() {
        let input = AnalysisInput {
            population: 500_000,
            median_income: 80_000,
            growth_yoy: 5.0,    // High growth
            days_on_market: 20, // Low DOM
            momentum_score: Some(0.8),
            list_to_sale_ratio: None,
        };

        let output = evaluate_county(&input);
        assert!(output.score > 80.0); // Should be a high score
        assert!(output.grade == "A+" || output.grade == "A");
    }

    #[test]
    fn test_stagnant_county() {
        let input = AnalysisInput {
            population: 50_000,
            median_income: 40_000,
            growth_yoy: -1.0,   // Negative growth
            days_on_market: 60, // High DOM
            momentum_score: Some(0.2),
            list_to_sale_ratio: None,
        };

        let output = evaluate_county(&input);
        assert!(output.score < 50.0);
        assert!(output.grade == "F" || output.grade == "D");
    }
}
