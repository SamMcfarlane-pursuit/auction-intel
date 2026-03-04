use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnalysisInput {
    pub population: u32,
    pub median_income: u32,
    pub growth_yoy: f32,
    pub days_on_market: u16,
    // Provide defaults for optional inputs or inputs we might not always have
    pub transaction_volume: Option<u32>,
    pub employment_rate: Option<f32>,
}

#[derive(Debug, Serialize, Clone)]
pub struct AnalysisOutput {
    pub score: f32,             // Raw score from 0-100
    pub grade: String,          // Letter grade (A+, A, B, C, D, F)
    pub recommendation: String, // E.g., Strong Buy, Hold, Avoid
}

/// Calculate an investment score/grade for a county based on economic indicators
pub fn evaluate_county(input: &AnalysisInput) -> AnalysisOutput {
    let mut score = 50.0; // Baseline score

    // Evaluate Growth (Higher is better)
    // Average growth is usually 1-2%. Let's say every 1% above 1% adds 5 points.
    let growth_bonus = (input.growth_yoy - 1.0) * 5.0;
    score += growth_bonus;

    // Evaluate Days on Market (Lower is better)
    // Average is around 30-45. Every day under 40 adds 1 point. Every day over 40 subtracts 1.
    let dom_diff = 40.0 - input.days_on_market as f32;
    score += dom_diff;

    // Evaluate Median Income (Factor of baseline purchasing power)
    // Let's say every $10k above $50k adds 2 points
    let income_bonus = (input.median_income as f32 - 50_000.0) / 10_000.0 * 2.0;
    score += income_bonus;

    // Evaluate Population (Stability factor)
    // Larger populations provide more liquidity. Every 100k people adds 1 point, capped at +10.
    let pop_bonus = ((input.population as f32) / 100_000.0).min(10.0);
    score += pop_bonus;

    // Clamp score between 0 and 100
    score = score.clamp(0.0, 100.0);

    // Determine Grade and Recommendation based on the final score
    let (grade, recommendation) = match score {
        s if s >= 90.0 => ("A+", "Strong Buy"),
        s if s >= 80.0 => ("A", "Buy"),
        s if s >= 70.0 => ("B", "Buy"),
        s if s >= 60.0 => ("C", "Hold"),
        s if s >= 50.0 => ("D", "Avoid"),
        _ => ("F", "Strong Avoid"),
    };

    AnalysisOutput {
        score,
        grade: grade.to_string(),
        recommendation: recommendation.to_string(),
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
            transaction_volume: None,
            employment_rate: None,
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
            transaction_volume: None,
            employment_rate: None,
        };

        let output = evaluate_county(&input);
        assert!(output.score < 50.0);
        assert!(output.grade == "F");
    }
}
