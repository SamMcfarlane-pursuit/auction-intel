// Auction Data Module - Bid4Assets, County Auctions, GovEase
// Real-time and scheduled tax lien/deed auction listings

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use once_cell::sync::Lazy;

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuctionListing {
    pub id: String,
    pub state: String,
    pub county: String,
    pub sale_type: String,       // "Tax Lien", "Tax Deed", "Sheriff Sale"
    pub sale_date: String,
    pub property_count: i32,
    pub deposit_required: f64,
    pub registration_deadline: String,
    pub platform: String,        // "Bid4Assets", "RealAuction", "County", "GovEase"
    pub platform_url: String,
    pub auction_type: String,    // "Online", "In-Person", "Hybrid"
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuctionPlatform {
    pub name: String,
    pub url: String,
    pub states_covered: Vec<String>,
    pub auction_types: Vec<String>,
    pub registration_required: bool,
    pub deposit_info: String,
}

// ============================================================================
// AUCTION PLATFORMS DATABASE
// ============================================================================

static AUCTION_PLATFORMS: Lazy<Vec<AuctionPlatform>> = Lazy::new(|| {
    vec![
        AuctionPlatform {
            name: "Bid4Assets".to_string(),
            url: "https://www.bid4assets.com".to_string(),
            states_covered: vec!["PA".to_string(), "CA".to_string(), "WA".to_string(), "NJ".to_string(), "MD".to_string(), "VA".to_string(), "GA".to_string()],
            auction_types: vec!["Tax Deed".to_string(), "Sheriff Sale".to_string(), "Tax Lien".to_string()],
            registration_required: true,
            deposit_info: "$500-$2,500 depending on county".to_string(),
        },
        AuctionPlatform {
            name: "RealAuction".to_string(),
            url: "https://www.realauction.com".to_string(),
            states_covered: vec!["FL".to_string(), "TX".to_string(), "AZ".to_string(), "GA".to_string()],
            auction_types: vec!["Tax Lien".to_string(), "Tax Deed".to_string()],
            registration_required: true,
            deposit_info: "$500-$2,000 depending on county".to_string(),
        },
        AuctionPlatform {
            name: "GovEase".to_string(),
            url: "https://www.govease.com".to_string(),
            states_covered: vec!["IN".to_string(), "IL".to_string(), "MI".to_string(), "OH".to_string()],
            auction_types: vec!["Tax Lien".to_string(), "Tax Deed".to_string()],
            registration_required: true,
            deposit_info: "Varies by county".to_string(),
        },
        AuctionPlatform {
            name: "Zeusauction".to_string(),
            url: "https://www.zeusauction.com".to_string(),
            states_covered: vec!["NJ".to_string(), "NY".to_string()],
            auction_types: vec!["Tax Lien".to_string()],
            registration_required: true,
            deposit_info: "Varies by municipality".to_string(),
        },
        AuctionPlatform {
            name: "SRI (Grant Street Group)".to_string(),
            url: "https://www.tax-sale.info".to_string(),
            states_covered: vec!["TX".to_string(), "GA".to_string(), "FL".to_string()],
            auction_types: vec!["Tax Deed".to_string()],
            registration_required: true,
            deposit_info: "$1,000-$5,000".to_string(),
        },
    ]
});

// ============================================================================
// UPCOMING AUCTIONS DATABASE - Updated January 2026
// ============================================================================

pub fn get_upcoming_auctions() -> Vec<AuctionListing> {
    vec![
        // Pennsylvania - Bid4Assets
        AuctionListing {
            id: "PA-MONROE-2026-01".to_string(),
            state: "PA".to_string(),
            county: "Monroe".to_string(),
            sale_type: "Repository Sale".to_string(),
            sale_date: "2026-01-14".to_string(),
            property_count: 150,
            deposit_required: 500.0,
            registration_deadline: "2026-01-07".to_string(),
            platform: "Bid4Assets".to_string(),
            platform_url: "https://www.bid4assets.com/monroe-pa".to_string(),
            auction_type: "Online".to_string(),
            notes: "Poconos region - Repository sale".to_string(),
        },
        AuctionListing {
            id: "PA-PHILA-2026-01".to_string(),
            state: "PA".to_string(),
            county: "Philadelphia".to_string(),
            sale_type: "Sheriff Sale".to_string(),
            sale_date: "2026-01-21".to_string(),
            property_count: 400,
            deposit_required: 600.0,
            registration_deadline: "2026-01-14".to_string(),
            platform: "Bid4Assets".to_string(),
            platform_url: "https://www.bid4assets.com/philadelphia".to_string(),
            auction_type: "Online".to_string(),
            notes: "Real property list - Jan 21 sale".to_string(),
        },
        
        // Texas - 1st Tuesday of month
        AuctionListing {
            id: "TX-HARRIS-2026-02".to_string(),
            state: "TX".to_string(),
            county: "Harris".to_string(),
            sale_type: "Tax Deed".to_string(),
            sale_date: "2026-02-03".to_string(),
            property_count: 450,
            deposit_required: 2500.0,
            registration_deadline: "2026-01-27".to_string(),
            platform: "County".to_string(),
            platform_url: "https://www.hctax.net".to_string(),
            auction_type: "In-Person".to_string(),
            notes: "First Tuesday - 25% penalty on redemption".to_string(),
        },
        AuctionListing {
            id: "TX-DALLAS-2026-02".to_string(),
            state: "TX".to_string(),
            county: "Dallas".to_string(),
            sale_type: "Tax Deed".to_string(),
            sale_date: "2026-02-03".to_string(),
            property_count: 380,
            deposit_required: 2000.0,
            registration_deadline: "2026-01-27".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://www.realauction.com".to_string(),
            auction_type: "Online".to_string(),
            notes: "Online auction - 1st Tuesday".to_string(),
        },
        
        // Florida - Weekly tax deed sales
        AuctionListing {
            id: "FL-PALM-2026-01-W2".to_string(),
            state: "FL".to_string(),
            county: "Palm Beach".to_string(),
            sale_type: "Tax Deed".to_string(),
            sale_date: "2026-01-14".to_string(),
            property_count: 50,
            deposit_required: 1000.0,
            registration_deadline: "2026-01-09".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://www.mypalmbeachclerk.com".to_string(),
            auction_type: "Online".to_string(),
            notes: "Weekly auction - Wednesdays 9:30am".to_string(),
        },
        AuctionListing {
            id: "FL-LEE-2026-01".to_string(),
            state: "FL".to_string(),
            county: "Lee".to_string(),
            sale_type: "Tax Deed".to_string(),
            sale_date: "2026-01-14".to_string(),
            property_count: 35,
            deposit_required: 500.0,
            registration_deadline: "2026-01-07".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://www.leetc.com".to_string(),
            auction_type: "Online".to_string(),
            notes: "Tuesdays 10am online".to_string(),
        },
        
        // Arizona - Annual February sales (16% max)
        AuctionListing {
            id: "AZ-MARICOPA-2026-02".to_string(),
            state: "AZ".to_string(),
            county: "Maricopa".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-02-15".to_string(),
            property_count: 2500,
            deposit_required: 500.0,
            registration_deadline: "2026-02-01".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://treasurer.maricopa.gov".to_string(),
            auction_type: "Online".to_string(),
            notes: "Phoenix area - 16% max interest, bid-down".to_string(),
        },
        AuctionListing {
            id: "AZ-PIMA-2026-02".to_string(),
            state: "AZ".to_string(),
            county: "Pima".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-02-22".to_string(),
            property_count: 800,
            deposit_required: 300.0,
            registration_deadline: "2026-02-08".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://www.pima.gov".to_string(),
            auction_type: "Online".to_string(),
            notes: "Tucson - annual February sale".to_string(),
        },
        
        // Georgia - 1st Tuesday (20% rate)
        AuctionListing {
            id: "GA-FULTON-2026-02".to_string(),
            state: "GA".to_string(),
            county: "Fulton".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-02-03".to_string(),
            property_count: 300,
            deposit_required: 1000.0,
            registration_deadline: "2026-01-27".to_string(),
            platform: "County".to_string(),
            platform_url: "https://www.fultoncountyga.gov".to_string(),
            auction_type: "In-Person".to_string(),
            notes: "Atlanta - 20% escalating to 40%".to_string(),
        },
        
        // Iowa - Annual June (24% - highest rate!)
        AuctionListing {
            id: "IA-POLK-2026-06".to_string(),
            state: "IA".to_string(),
            county: "Polk".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-06-15".to_string(),
            property_count: 200,
            deposit_required: 500.0,
            registration_deadline: "2026-06-01".to_string(),
            platform: "County".to_string(),
            platform_url: "https://www.polkcountyiowa.gov".to_string(),
            auction_type: "In-Person".to_string(),
            notes: "Des Moines - 24% rate (highest in US!)".to_string(),
        },
        
        // New Jersey - Various municipalities (18% bid-down)
        AuctionListing {
            id: "NJ-ESSEX-2026-01".to_string(),
            state: "NJ".to_string(),
            county: "Essex".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-01-28".to_string(),
            property_count: 180,
            deposit_required: 1000.0,
            registration_deadline: "2026-01-21".to_string(),
            platform: "Zeusauction".to_string(),
            platform_url: "https://www.zeusauction.com".to_string(),
            auction_type: "Online".to_string(),
            notes: "Newark area - 18% bid-down".to_string(),
        },
    ]
}

// Get auctions by state
pub fn get_state_auctions(state: &str) -> Vec<AuctionListing> {
    let state_upper = state.to_uppercase();
    get_upcoming_auctions()
        .into_iter()
        .filter(|a| a.state == state_upper)
        .collect()
}

// Get all auction platforms
pub fn get_platforms() -> Vec<AuctionPlatform> {
    AUCTION_PLATFORMS.clone()
}

// Get platforms that cover a specific state
pub fn get_state_platforms(state: &str) -> Vec<AuctionPlatform> {
    let state_upper = state.to_uppercase();
    AUCTION_PLATFORMS
        .iter()
        .filter(|p| p.states_covered.contains(&state_upper))
        .cloned()
        .collect()
}

// Get auction statistics
pub fn get_auction_stats() -> HashMap<String, serde_json::Value> {
    let auctions = get_upcoming_auctions();
    let mut stats = HashMap::new();
    
    stats.insert("total_upcoming".to_string(), serde_json::json!(auctions.len()));
    
    let by_state: HashMap<String, usize> = auctions.iter()
        .fold(HashMap::new(), |mut acc, a| {
            *acc.entry(a.state.clone()).or_insert(0) += 1;
            acc
        });
    stats.insert("by_state".to_string(), serde_json::json!(by_state));
    
    let total_properties: i32 = auctions.iter().map(|a| a.property_count).sum();
    stats.insert("total_properties".to_string(), serde_json::json!(total_properties));
    
    stats
}
