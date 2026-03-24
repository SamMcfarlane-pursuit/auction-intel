use axum::{
    extract::State,
    http::{StatusCode, HeaderMap},
    Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite, Row};
use std::time::Duration;
use tokio::time;
use std::sync::Arc;

use crate::db::AppState;

#[derive(Deserialize, Debug)]
pub struct SubscribeRequest {
    pub property_fips: String,
    pub mab_threshold: i64,
    pub contact_method: String,
}

#[derive(Serialize, Debug)]
pub struct AlertResponse {
    pub id: String,
    pub property_fips: String,
    pub mab_threshold: i64,
    pub contact_method: String,
    pub is_active: bool,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/subscribe", post(subscribe_handler))
        .route("/", get(get_alerts_handler))
}

async fn subscribe_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<SubscribeRequest>,
) -> Result<Json<AlertResponse>, (StatusCode, String)> {
    let auth_header = headers.get("Authorization").and_then(|h| h.to_str().ok()).unwrap_or("");
    let user_id = crate::auth::verify_token(auth_header).map_err(|e| (StatusCode::UNAUTHORIZED, e))?;
    let alert_id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        r#"
        INSERT INTO alerts (id, user_id, property_fips, mab_threshold, contact_method, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
        "#,
    )
    .bind(&alert_id)
    .bind(&user_id)
    .bind(&payload.property_fips)
    .bind(payload.mab_threshold)
    .bind(&payload.contact_method)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(AlertResponse {
        id: alert_id,
        property_fips: payload.property_fips,
        mab_threshold: payload.mab_threshold,
        contact_method: payload.contact_method,
        is_active: true,
    }))
}

async fn get_alerts_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<Vec<AlertResponse>>, (StatusCode, String)> {
    let auth_header = headers.get("Authorization").and_then(|h| h.to_str().ok()).unwrap_or("");
    let user_id = crate::auth::verify_token(auth_header).map_err(|e| (StatusCode::UNAUTHORIZED, e))?;

    let rows = sqlx::query(
        r#"
        SELECT id, property_fips, mab_threshold, contact_method, is_active
        FROM alerts
        WHERE user_id = ? AND is_active = 1
        "#
    )
    .bind(&user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let alerts = rows
        .into_iter()
        .map(|row| AlertResponse {
            id: row.try_get("id").unwrap_or_default(),
            property_fips: row.try_get("property_fips").unwrap_or_default(),
            mab_threshold: row.try_get("mab_threshold").unwrap_or_default(),
            contact_method: row.try_get("contact_method").unwrap_or_default(),
            is_active: row.try_get("is_active").unwrap_or_default(),
        })
        .collect();

    Ok(Json(alerts))
}

// Background engine that polls for live auction statuses
pub async fn start_alert_engine(pool: Pool<Sqlite>) {
    println!("🔔 Starting Predictive Bidding Alerts Engine...");
    let mut interval = time::interval(Duration::from_secs(60));

    loop {
        interval.tick().await;
        
        let rows = match sqlx::query(
            r#"
            SELECT a.id, a.user_id, a.property_fips, a.mab_threshold, a.contact_method, u.email
            FROM alerts a
            JOIN users u ON a.user_id = u.id
            WHERE a.is_active = 1
            "#
        )
        .fetch_all(&pool)
        .await
        {
            Ok(rows) => rows,
            Err(e) => {
                println!("Error fetching alerts: {}", e);
                continue;
            }
        };

        if rows.is_empty() {
            continue;
        }

        // Simulated live bid fetching abstraction (in a real app, query HUD/PropWire API here)
        println!("🔍 Alert Engine: Scanning {} active alert thresholds...", rows.len());

        for row in rows {
            let id: String = row.try_get("id").unwrap_or_default();
            let property_fips: String = row.try_get("property_fips").unwrap_or_default();
            let contact_method: String = row.try_get("contact_method").unwrap_or_default();
            let email: String = row.try_get("email").unwrap_or_default();
            let mab_threshold: i64 = row.try_get("mab_threshold").unwrap_or_default();

            // SIMULATION: Live bid is historically 80% of our internal MAB algorithm for Tier 1 
            // We use a mock randomizer to simulate a highly volatile live auction environment.
            let simulated_live_bid = (mab_threshold as f64 * 0.85) as i64; 

            if simulated_live_bid < mab_threshold {
                // DEAL SNIPING CONDITION MET!
                send_push_notification(&email, &contact_method, &property_fips, simulated_live_bid, mab_threshold).await;
                
                // Update last triggered to prevent spam
                let _ = sqlx::query(
                    "UPDATE alerts SET last_triggered_at = CURRENT_TIMESTAMP WHERE id = ?"
                )
                .bind(&id)
                .execute(&pool)
                .await;
            }
        }
    }
}

async fn send_push_notification(email: &str, contact_method: &str, property_id: &str, live_bid: i64, mab: i64) {
    // In production, this integrates with AWS SNS / Twilio / SendGrid.
    let margin = mab - live_bid;
    println!("=======================================================");
    println!("🚨 PREDICTIVE ALERT ENGAGED 🚨");
    println!("   TARGET: {}", email);
    println!("   METHOD: {}", contact_method);
    println!("   PROPERTY FIPS: {}", property_id);
    println!("   LIVE BID: ${} (MAB: ${})", live_bid, mab);
    println!("   MARGIN DETECTED: +${} PROFIT", margin);
    println!("=======================================================");
}
