use crate::db::AppState;
use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PriceSnapshot {
    pub date: String,
    pub fips: String,
    pub zhvi: f64,
    pub change_pct: f64,
}

#[derive(Debug, Deserialize)]
pub struct TrendQuery {
    pub days: Option<i64>,
}

pub async fn init_price_tracker(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fips TEXT NOT NULL,
            zhvi REAL NOT NULL,
            change_pct REAL NOT NULL,
            date TEXT NOT NULL,
            UNIQUE(fips, date)
        );
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[allow(dead_code)]
pub async fn record_snapshot(
    pool: &Pool<Sqlite>,
    fips: &str,
    zhvi: f64,
    change_pct: f64,
) -> Result<(), sqlx::Error> {
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();

    sqlx::query(
        r#"
        INSERT OR REPLACE INTO price_history (fips, zhvi, change_pct, date)
        VALUES (?, ?, ?, ?)
        "#,
    )
    .bind(fips)
    .bind(zhvi)
    .bind(change_pct)
    .bind(today)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_trends_handler(
    State(state): State<Arc<AppState>>,
    Path(fips): Path<String>,
    Query(params): Query<TrendQuery>,
) -> Json<Vec<PriceSnapshot>> {
    let days = params.days.unwrap_or(90);

    let results = sqlx::query_as::<_, PriceSnapshot>(
        r#"
        SELECT date, fips, zhvi, change_pct
        FROM price_history
        WHERE fips = ? AND date >= date('now', ?)
        ORDER BY date ASC
        "#,
    )
    .bind(fips)
    .bind(format!("-{} days", days))
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    Json(results)
}
