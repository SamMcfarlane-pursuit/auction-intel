use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::env;

#[derive(Clone)]
pub struct AppState {
    pub db: Pool<Sqlite>,
}

pub async fn init_db() -> Result<Pool<Sqlite>, sqlx::Error> {
    // defaults to creating the file if it doesn't exist (mode=rwc)
    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:auction_intel.db?mode=rwc".to_string());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // Create users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}
