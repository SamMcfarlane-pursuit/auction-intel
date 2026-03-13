use crate::census;
use crate::db::AppState;
use crate::scoring::{self, AnalysisInput};
use axum::{
    extract::{Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DealRecommendation {
    pub county: String,
    pub state: String,
    pub score: f32,
    pub grade: String,
    pub recommendation: String,
    pub population: u32,
    pub median_income: u32,
    pub zhvi: u32,
}

#[derive(Debug, Deserialize)]
pub struct DealQuery {
    pub limit: Option<usize>,
}

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

#[derive(Debug, Serialize)]
pub struct SearchFilters {
    pub max_price: Option<u32>,
    pub min_population: Option<u32>,
    pub state: Option<String>,
}

pub async fn get_top_deals(
    State(_state): State<Arc<AppState>>,
    Query(params): Query<DealQuery>,
) -> Json<Vec<DealRecommendation>> {
    let limit = params.limit.unwrap_or(10);

    // In a real app, we'd query the DB for all counties.
    // For now, we'll fetch from our census module (which has 3,000+ counties cached).
    let counties = census::fetch_all_counties(None).await.unwrap_or_default();

    let mut deals: Vec<DealRecommendation> = counties
        .iter()
        .map(|c| {
            let input = AnalysisInput {
                population: c.population as u32,
                median_income: c.median_income as u32,
                growth_yoy: 2.0,    // Mocked growth for now
                days_on_market: 40, // Mocked DOM
                momentum_score: Some(0.6),
                list_to_sale_ratio: None,
            };

            let output = scoring::evaluate_county(&input);

            DealRecommendation {
                county: c.name.clone(),
                state: c.state.clone(),
                score: output.score,
                grade: output.grade,
                recommendation: output.recommendation,
                population: c.population as u32,
                median_income: c.median_income as u32,
                zhvi: c.median_home_value as u32,
            }
        })
        .collect();

    deals.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    deals.truncate(limit);

    Json(deals)
}

pub async fn search_deals(Query(params): Query<SearchQuery>) -> Json<SearchFilters> {
    let q = params.q.to_lowercase();

    // Simple natural language parser logic
    let mut filters = SearchFilters {
        max_price: None,
        min_population: None,
        state: None,
    };

    if q.contains("under 200k") || q.contains("under $200,000") {
        filters.max_price = Some(200_000);
    } else if q.contains("under 500k") {
        filters.max_price = Some(500_000);
    }

    if q.contains("large") || q.contains("big") {
        filters.min_population = Some(500_000);
    }

    // Extract state if mentioned (simple check)
    let states = ["FL", "TX", "CA", "GA", "AZ"];
    for s in states {
        if q.contains(&s.to_lowercase()) {
            filters.state = Some(s.to_string());
            break;
        }
    }

    Json(filters)
}
