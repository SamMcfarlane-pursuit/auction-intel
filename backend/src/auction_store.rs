// SQLite-backed storage for AuctionListing records. Replaces the in-memory
// `auctions::get_upcoming_auctions()` Vec as the primary source of truth while
// keeping the hardcoded list as a first-boot seed — if the table is empty on
// startup we populate it so the API continues to return the known baseline
// dataset until scrapers (or CSV imports) add more rows.

use crate::auctions::AuctionListing;
use sqlx::{Pool, Sqlite};

pub async fn init(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS auction_listings (
            id TEXT PRIMARY KEY,
            state TEXT NOT NULL,
            county TEXT NOT NULL,
            sale_type TEXT NOT NULL,
            sale_date TEXT NOT NULL,
            property_count INTEGER NOT NULL DEFAULT 0,
            deposit_required REAL NOT NULL DEFAULT 0,
            registration_deadline TEXT NOT NULL DEFAULT '',
            platform TEXT NOT NULL DEFAULT '',
            platform_url TEXT NOT NULL DEFAULT '',
            auction_type TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            interest_rate TEXT NOT NULL DEFAULT '',
            redemption_period TEXT NOT NULL DEFAULT '',
            bidding_method TEXT NOT NULL DEFAULT '',
            min_bid TEXT NOT NULL DEFAULT '',
            payment_deadline TEXT NOT NULL DEFAULT '',
            source TEXT NOT NULL DEFAULT 'seed',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_auction_listings_state ON auction_listings(state);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_auction_listings_sale_date ON auction_listings(sale_date);")
        .execute(pool)
        .await?;

    let existing: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM auction_listings")
        .fetch_one(pool)
        .await
        .unwrap_or(0);
    if existing == 0 {
        let seed = crate::auctions::get_upcoming_auctions();
        let inserted = insert_many(pool, &seed, "seed").await?;
        println!("🌱 Seeded auction_listings with {} baseline rows", inserted);
    } else {
        println!("📦 auction_listings already populated ({} rows)", existing);
    }
    Ok(())
}

pub async fn fetch_all(pool: &Pool<Sqlite>) -> Result<Vec<AuctionListing>, sqlx::Error> {
    sqlx::query_as::<_, AuctionListing>(
        r#"
        SELECT id, state, county, sale_type, sale_date, property_count,
               deposit_required, registration_deadline, platform, platform_url,
               auction_type, notes, interest_rate, redemption_period,
               bidding_method, min_bid, payment_deadline
        FROM auction_listings
        ORDER BY sale_date ASC
        "#,
    )
    .fetch_all(pool)
    .await
}

pub async fn fetch_by_state(
    pool: &Pool<Sqlite>,
    state: &str,
) -> Result<Vec<AuctionListing>, sqlx::Error> {
    sqlx::query_as::<_, AuctionListing>(
        r#"
        SELECT id, state, county, sale_type, sale_date, property_count,
               deposit_required, registration_deadline, platform, platform_url,
               auction_type, notes, interest_rate, redemption_period,
               bidding_method, min_bid, payment_deadline
        FROM auction_listings
        WHERE state = ?
        ORDER BY sale_date ASC
        "#,
    )
    .bind(state.to_uppercase())
    .fetch_all(pool)
    .await
}

pub async fn insert_many(
    pool: &Pool<Sqlite>,
    listings: &[AuctionListing],
    source: &str,
) -> Result<usize, sqlx::Error> {
    if listings.is_empty() {
        return Ok(0);
    }
    let mut tx = pool.begin().await?;
    for l in listings {
        sqlx::query(
            r#"
            INSERT INTO auction_listings (
                id, state, county, sale_type, sale_date, property_count,
                deposit_required, registration_deadline, platform, platform_url,
                auction_type, notes, interest_rate, redemption_period,
                bidding_method, min_bid, payment_deadline, source, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                state=excluded.state, county=excluded.county,
                sale_type=excluded.sale_type, sale_date=excluded.sale_date,
                property_count=excluded.property_count,
                deposit_required=excluded.deposit_required,
                registration_deadline=excluded.registration_deadline,
                platform=excluded.platform, platform_url=excluded.platform_url,
                auction_type=excluded.auction_type, notes=excluded.notes,
                interest_rate=excluded.interest_rate,
                redemption_period=excluded.redemption_period,
                bidding_method=excluded.bidding_method, min_bid=excluded.min_bid,
                payment_deadline=excluded.payment_deadline,
                source=excluded.source, updated_at=CURRENT_TIMESTAMP
            "#,
        )
        .bind(&l.id)
        .bind(l.state.to_uppercase())
        .bind(&l.county)
        .bind(&l.sale_type)
        .bind(&l.sale_date)
        .bind(l.property_count)
        .bind(l.deposit_required)
        .bind(&l.registration_deadline)
        .bind(&l.platform)
        .bind(&l.platform_url)
        .bind(&l.auction_type)
        .bind(&l.notes)
        .bind(&l.interest_rate)
        .bind(&l.redemption_period)
        .bind(&l.bidding_method)
        .bind(&l.min_bid)
        .bind(&l.payment_deadline)
        .bind(source)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    Ok(listings.len())
}
