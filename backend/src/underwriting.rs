use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct UnderwritingInput {
    pub arv: f64,               // After Repair Value
    pub repair_estimate: f64,   // Estimated repair costs
    pub carrying_costs: f64,    // Taxes, insurance, utilities during hold
    pub tax_delinquency: f64,   // Existing back taxes to be paid
    pub target_profit_pct: f64, // Target profit percentage (e.g. 15.0)
}

#[derive(Debug, Serialize, Clone)]
pub struct UnderwritingResult {
    pub max_allowed_bid: f64,
    pub total_acquisition_cost: f64,
    pub estimated_roi_pct: f64,
    pub equity_position: f64,
    pub safety_margin: f64,
}

/// Professional bid calculation engine
/// Uses the 70% Rule of thumb as a baseline for wholesale/flip analysis
pub fn calculate_deal(input: &UnderwritingInput) -> UnderwritingResult {
    // Standard Rule: Max Bid = (ARV * 0.70) - Repairs - Delinquencies
    // We adjust this to be more precise for institutional players
    let base_margin = 0.70;
    let max_allowed_bid = (input.arv * base_margin) - input.repair_estimate - input.tax_delinquency;
    let max_allowed_bid = max_allowed_bid.max(0.0);

    let total_acquisition_cost = max_allowed_bid + input.repair_estimate + input.carrying_costs + input.tax_delinquency;
    
    let equity_position = input.arv - total_acquisition_cost;
    
    let estimated_roi_pct = if total_acquisition_cost > 0.0 {
        (equity_position / total_acquisition_cost) * 100.0
    } else {
        0.0
    };

    let safety_margin = if input.arv > 0.0 {
        (equity_position / input.arv) * 100.0
    } else {
        0.0
    };

    UnderwritingResult {
        max_allowed_bid,
        total_acquisition_cost,
        estimated_roi_pct,
        equity_position,
        safety_margin,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_standard_deal() {
        let input = UnderwritingInput {
            arv: 300_000.0,
            repair_estimate: 40_000.0,
            carrying_costs: 5_000.0,
            tax_delinquency: 10_000.0,
            target_profit_pct: 15.0,
        };

        let result = calculate_deal(&input);
        
        // (300k * 0.7) - 40k - 10k = 210k - 50k = 160k
        assert_eq!(result.max_allowed_bid, 160_000.0);
        assert_eq!(result.total_acquisition_cost, 215_000.0); // 160 + 40 + 5 + 10
        assert!(result.estimated_roi_pct > 30.0);
    }
}
