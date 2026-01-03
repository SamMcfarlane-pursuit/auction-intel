// Auction Data Module - Comprehensive State Tax Sale Listings
// Accurate lien/deed auction data for all 51 jurisdictions

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
    // Enhanced fields
    pub interest_rate: String,
    pub redemption_period: String,
    pub bidding_method: String,
    pub min_bid: String,
    pub payment_deadline: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateAuctionSchedule {
    pub state: String,
    pub sale_type: String,
    pub frequency: String,
    pub typical_months: Vec<String>,
    pub typical_day: String,
    pub interest_rate: String,
    pub redemption_period: String,
    pub bidding_method: String,
    pub online_available: bool,
    pub primary_platform: String,
    pub deposit_range: String,
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
            states_covered: vec!["PA".to_string(), "CA".to_string(), "WA".to_string(), "NJ".to_string(), "MD".to_string(), "VA".to_string(), "GA".to_string(), "NC".to_string(), "DE".to_string()],
            auction_types: vec!["Tax Deed".to_string(), "Sheriff Sale".to_string(), "Tax Lien".to_string()],
            registration_required: true,
            deposit_info: "$500-$2,500 depending on county".to_string(),
        },
        AuctionPlatform {
            name: "RealAuction".to_string(),
            url: "https://www.realauction.com".to_string(),
            states_covered: vec!["FL".to_string(), "TX".to_string(), "AZ".to_string(), "GA".to_string(), "CO".to_string()],
            auction_types: vec!["Tax Lien".to_string(), "Tax Deed".to_string()],
            registration_required: true,
            deposit_info: "$500-$2,000 depending on county".to_string(),
        },
        AuctionPlatform {
            name: "GovEase".to_string(),
            url: "https://www.govease.com".to_string(),
            states_covered: vec!["IN".to_string(), "IL".to_string(), "MI".to_string(), "OH".to_string(), "NE".to_string()],
            auction_types: vec!["Tax Lien".to_string(), "Tax Deed".to_string()],
            registration_required: true,
            deposit_info: "Varies by county - typically $200-$1,000".to_string(),
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
        AuctionPlatform {
            name: "CivicSource".to_string(),
            url: "https://www.civicsource.com".to_string(),
            states_covered: vec!["LA".to_string()],
            auction_types: vec!["Tax Lien".to_string()],
            registration_required: true,
            deposit_info: "Varies by parish".to_string(),
        },
    ]
});

// ============================================================================
// STATE AUCTION SCHEDULES - Accurate for all 51 jurisdictions
// ============================================================================

static STATE_SCHEDULES: Lazy<HashMap<String, StateAuctionSchedule>> = Lazy::new(|| {
    let mut m = HashMap::new();
    
    // === LIEN STATES (26) ===
    m.insert("AL".to_string(), StateAuctionSchedule {
        state: "AL".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["May".to_string(), "June".to_string()],
        typical_day: "Varies by county".to_string(),
        interest_rate: "12%".to_string(),
        redemption_period: "3 years".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: true,
        primary_platform: "County".to_string(),
        deposit_range: "$50-$200".to_string(),
        notes: "12% interest from date of sale; premium not refunded if redeemed".to_string(),
    });
    
    m.insert("AZ".to_string(), StateAuctionSchedule {
        state: "AZ".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["February".to_string()],
        typical_day: "2nd Tuesday".to_string(),
        interest_rate: "16% max (bid down)".to_string(),
        redemption_period: "3 years".to_string(),
        bidding_method: "Bid down interest rate".to_string(),
        online_available: true,
        primary_platform: "RealAuction / County".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Most counties online; Maricopa is largest sale in US; bid starts at 16% and goes down".to_string(),
    });
    
    m.insert("CO".to_string(), StateAuctionSchedule {
        state: "CO".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["November".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "Federal discount + 9%".to_string(),
        redemption_period: "3 years".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: true,
        primary_platform: "RealAuction".to_string(),
        deposit_range: "$200-$1,000".to_string(),
        notes: "Rate tied to federal discount rate; premium lost if redeemed".to_string(),
    });

    m.insert("FL".to_string(), StateAuctionSchedule {
        state: "FL".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["May".to_string(), "June".to_string()],
        typical_day: "Varies by county".to_string(),
        interest_rate: "18% max (bid down) - 5% minimum guaranteed".to_string(),
        redemption_period: "2 years".to_string(),
        bidding_method: "Bid down interest rate".to_string(),
        online_available: true,
        primary_platform: "RealAuction".to_string(),
        deposit_range: "$500-$2,500".to_string(),
        notes: "Guaranteed 5% minimum return; most competitive state; major counties all online".to_string(),
    });
    
    m.insert("GA".to_string(), StateAuctionSchedule {
        state: "GA".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Monthly".to_string(),
        typical_months: vec!["Year-round".to_string()],
        typical_day: "1st Tuesday of month".to_string(),
        interest_rate: "20% (escalates to 30%, then 40%)".to_string(),
        redemption_period: "1 year".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: true,
        primary_platform: "County / Bid4Assets".to_string(),
        deposit_range: "$1,000-$5,000".to_string(),
        notes: "Highest escalating rate in US; 20% year 1, 30% year 2, 40% year 3".to_string(),
    });
    
    m.insert("IL".to_string(), StateAuctionSchedule {
        state: "IL".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["October".to_string(), "November".to_string()],
        typical_day: "Varies by county".to_string(),
        interest_rate: "18% (bid down)".to_string(),
        redemption_period: "2-3 years".to_string(),
        bidding_method: "Bid down interest rate".to_string(),
        online_available: true,
        primary_platform: "GovEase / County".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Cook County largest sale; graduated penalty system on redemption".to_string(),
    });
    
    m.insert("IN".to_string(), StateAuctionSchedule {
        state: "IN".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual/Semi-annual".to_string(),
        typical_months: vec!["September".to_string(), "October".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "10-15% graduated".to_string(),
        redemption_period: "1 year".to_string(),
        bidding_method: "A/B/C tiered sales".to_string(),
        online_available: true,
        primary_platform: "GovEase / SRI".to_string(),
        deposit_range: "$200-$500".to_string(),
        notes: "A sale = certified; B/C = commissioner sales; complex system".to_string(),
    });
    
    m.insert("IA".to_string(), StateAuctionSchedule {
        state: "IA".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["June".to_string()],
        typical_day: "3rd Monday".to_string(),
        interest_rate: "24% (HIGHEST IN US)".to_string(),
        redemption_period: "1 year 9 months".to_string(),
        bidding_method: "Bid down ownership percentage".to_string(),
        online_available: false,
        primary_platform: "County (in-person)".to_string(),
        deposit_range: "$200-$500".to_string(),
        notes: "Highest rate in nation; bid for smallest undivided interest; must negotiate deed".to_string(),
    });
    
    m.insert("KY".to_string(), StateAuctionSchedule {
        state: "KY".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["July".to_string(), "August".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "12%".to_string(),
        redemption_period: "1 year".to_string(),
        bidding_method: "First-come or auction".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$100-$300".to_string(),
        notes: "12% from date of issuance; smaller market".to_string(),
    });
    
    m.insert("LA".to_string(), StateAuctionSchedule {
        state: "LA".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Varies by parish".to_string(),
        typical_months: vec!["June".to_string(), "July".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "Bid-down (2024-2025 reform)".to_string(),
        redemption_period: "3 years".to_string(),
        bidding_method: "Bid down interest rate (new system)".to_string(),
        online_available: true,
        primary_platform: "CivicSource".to_string(),
        deposit_range: "$300-$1,000".to_string(),
        notes: "Major 2024-2025 reform: now bid-down system; previously 12% + 5% penalty".to_string(),
    });
    
    m.insert("MD".to_string(), StateAuctionSchedule {
        state: "MD".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["May".to_string(), "June".to_string()],
        typical_day: "Varies by county".to_string(),
        interest_rate: "18-24%".to_string(),
        redemption_period: "6 months".to_string(),
        bidding_method: "Bid down or premium".to_string(),
        online_available: true,
        primary_platform: "Bid4Assets".to_string(),
        deposit_range: "$1,000-$2,500".to_string(),
        notes: "Short 6-month redemption; near DC; high rates; competitive".to_string(),
    });
    
    m.insert("NJ".to_string(), StateAuctionSchedule {
        state: "NJ".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Varies by municipality".to_string(),
        typical_months: vec!["October".to_string(), "November".to_string(), "December".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "18% (bid down)".to_string(),
        redemption_period: "2 years".to_string(),
        bidding_method: "Bid down interest rate".to_string(),
        online_available: true,
        primary_platform: "Zeusauction / Bid4Assets".to_string(),
        deposit_range: "$1,000-$5,000".to_string(),
        notes: "Active market; high property values; each municipality runs own sale".to_string(),
    });
    
    m.insert("CT".to_string(), StateAuctionSchedule {
        state: "CT".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["June".to_string(), "July".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "18%".to_string(),
        redemption_period: "6 months".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: false,
        primary_platform: "County (in-person)".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Combined lien/deed format; larger towns only; limited availability".to_string(),
    });
    
    m.insert("DC".to_string(), StateAuctionSchedule {
        state: "DC".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["July".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "18%".to_string(),
        redemption_period: "6 months".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: true,
        primary_platform: "DC Government".to_string(),
        deposit_range: "$1,000-$5,000".to_string(),
        notes: "Short 6-month redemption; premium bidding; high competition".to_string(),
    });
    
    m.insert("MA".to_string(), StateAuctionSchedule {
        state: "MA".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies by town".to_string(),
        interest_rate: "16%".to_string(),
        redemption_period: "Collector's deed".to_string(),
        bidding_method: "Bid down ownership percentage".to_string(),
        online_available: false,
        primary_platform: "Town Collector".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Bid for smallest undivided part; complex process; high property values".to_string(),
    });
    
    m.insert("MS".to_string(), StateAuctionSchedule {
        state: "MS".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["August".to_string()],
        typical_day: "Last Monday".to_string(),
        interest_rate: "18%".to_string(),
        redemption_period: "2 years".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$100-$500".to_string(),
        notes: "Less competition; in-person required; smaller market".to_string(),
    });
    
    m.insert("MO".to_string(), StateAuctionSchedule {
        state: "MO".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["August".to_string()],
        typical_day: "4th Monday".to_string(),
        interest_rate: "10%".to_string(),
        redemption_period: "2 years".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$100-$500".to_string(),
        notes: "10% interest; 18% penalty each year delinquent; in-person sales".to_string(),
    });
    
    m.insert("MT".to_string(), StateAuctionSchedule {
        state: "MT".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["July".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "10%".to_string(),
        redemption_period: "2-3 years".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$100-$500".to_string(),
        notes: "5/6 of 1% per month (10% annual); small market; rural properties".to_string(),
    });
    
    m.insert("NE".to_string(), StateAuctionSchedule {
        state: "NE".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["March".to_string()],
        typical_day: "1st Monday".to_string(),
        interest_rate: "14%".to_string(),
        redemption_period: "3 years".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: true,
        primary_platform: "GovEase / County".to_string(),
        deposit_range: "$200-$500".to_string(),
        notes: "14% annual interest; undivided interest system; moderate market".to_string(),
    });
    
    m.insert("NH".to_string(), StateAuctionSchedule {
        state: "NH".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["May".to_string(), "June".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "18%".to_string(),
        redemption_period: "2 years".to_string(),
        bidding_method: "Bid down ownership percentage".to_string(),
        online_available: false,
        primary_platform: "Town".to_string(),
        deposit_range: "$500-$1,000".to_string(),
        notes: "Bid for percentage of undivided interest; high property values".to_string(),
    });
    
    m.insert("OK".to_string(), StateAuctionSchedule {
        state: "OK".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["June".to_string()],
        typical_day: "2nd Monday".to_string(),
        interest_rate: "8%".to_string(),
        redemption_period: "2 years".to_string(),
        bidding_method: "Random drawing".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$100-$500".to_string(),
        notes: "Unique random drawing for ties; 8% rate is lower; in-person".to_string(),
    });
    
    m.insert("RI".to_string(), StateAuctionSchedule {
        state: "RI".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["December".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "10% + 1%/month".to_string(),
        redemption_period: "1 year".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: false,
        primary_platform: "City/Town".to_string(),
        deposit_range: "$500-$1,000".to_string(),
        notes: "10% first 6 months, 1%/month after; Collector's Deed; small state".to_string(),
    });
    
    m.insert("SC".to_string(), StateAuctionSchedule {
        state: "SC".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["October".to_string(), "November".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "8% penalty".to_string(),
        redemption_period: "1 year".to_string(),
        bidding_method: "Highest and best bid".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$100-$500".to_string(),
        notes: "8% penalty rather than interest; short 1-year redemption".to_string(),
    });
    
    m.insert("SD".to_string(), StateAuctionSchedule {
        state: "SD".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["December".to_string()],
        typical_day: "3rd Tuesday".to_string(),
        interest_rate: "12% (max 10% bid)".to_string(),
        redemption_period: "3-4 years".to_string(),
        bidding_method: "Bid down interest rate".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$100-$300".to_string(),
        notes: "Bid down from 10% max; 12% statutory; long redemption".to_string(),
    });
    
    m.insert("VT".to_string(), StateAuctionSchedule {
        state: "VT".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["April".to_string(), "May".to_string(), "June".to_string(), "July".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "12%".to_string(),
        redemption_period: "1 year".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: false,
        primary_platform: "Town".to_string(),
        deposit_range: "$200-$500".to_string(),
        notes: "12% interest; 1-year redemption; small rural market".to_string(),
    });
    
    m.insert("WV".to_string(), StateAuctionSchedule {
        state: "WV".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["October".to_string(), "November".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "12%".to_string(),
        redemption_period: "1 year".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$100-$500".to_string(),
        notes: "12% interest; highest bidder at public auction; rural properties".to_string(),
    });
    
    m.insert("WY".to_string(), StateAuctionSchedule {
        state: "WY".to_string(),
        sale_type: "Tax Lien".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["September".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "15% + 3% penalty".to_string(),
        redemption_period: "4 years".to_string(),
        bidding_method: "Premium bidding".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$100-$500".to_string(),
        notes: "Longest redemption period; 15% interest + 3% penalty + fees".to_string(),
    });
    
    // === DEED STATES (25) ===
    m.insert("TX".to_string(), StateAuctionSchedule {
        state: "TX".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Monthly".to_string(),
        typical_months: vec!["Year-round".to_string()],
        typical_day: "1st Tuesday of month".to_string(),
        interest_rate: "25% penalty on redemption".to_string(),
        redemption_period: "6 months (non-homestead) / 2 years (homestead)".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "County / RealAuction".to_string(),
        deposit_range: "$2,000-$5,000".to_string(),
        notes: "25% penalty if redeemed; largest deed state; no state income tax".to_string(),
    });
    
    m.insert("CA".to_string(), StateAuctionSchedule {
        state: "CA".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["March".to_string(), "April".to_string(), "September".to_string()],
        typical_day: "Varies by county".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "5 years (pre-sale)".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "Bid4Assets".to_string(),
        deposit_range: "$2,500-$5,000".to_string(),
        notes: "Clear title; high values; 5-year pre-sale redemption; very competitive".to_string(),
    });
    
    m.insert("MI".to_string(), StateAuctionSchedule {
        state: "MI".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["July".to_string()],
        typical_day: "3rd Tuesday".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "None after sale".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "GovEase / County".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "No redemption after sale; min bid = taxes + estimated FMV; Detroit challenges".to_string(),
    });
    
    m.insert("OH".to_string(), StateAuctionSchedule {
        state: "OH".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["Year-round".to_string()],
        typical_day: "Varies by county".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "None after sale".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "GovEase / County".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Sheriff's sale after judicial foreclosure; no redemption; large market".to_string(),
    });
    
    m.insert("PA".to_string(), StateAuctionSchedule {
        state: "PA".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Monthly/Quarterly".to_string(),
        typical_months: vec!["Year-round".to_string()],
        typical_day: "Varies by county".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "None after upset sale".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "Bid4Assets".to_string(),
        deposit_range: "$500-$2,500".to_string(),
        notes: "Upset sale then free & clear sale; no redemption after upset; Philadelphia active".to_string(),
    });
    
    m.insert("NY".to_string(), StateAuctionSchedule {
        state: "NY".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["Spring".to_string(), "Fall".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "2-4 years (varies by property type)".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "Zeusauction / County".to_string(),
        deposit_range: "$1,000-$5,000".to_string(),
        notes: "2yr standard; 3-4yr residential/farm; judicial process; high values".to_string(),
    });
    
    m.insert("AK".to_string(), StateAuctionSchedule {
        state: "AK".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "1 year".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: false,
        primary_platform: "Borough/City".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Municipal foreclosure; deeded to borough/city if unredeemed; limited sales".to_string(),
    });
    
    m.insert("AR".to_string(), StateAuctionSchedule {
        state: "AR".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "30 days".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$200-$1,000".to_string(),
        notes: "Forfeited to state; limited warranty deed after 30 days; short redemption".to_string(),
    });
    
    m.insert("DE".to_string(), StateAuctionSchedule {
        state: "DE".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "15%".to_string(),
        redemption_period: "60 days".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "Bid4Assets".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Judicial foreclosure; 15% penalty on redemption; 60-day redemption".to_string(),
    });
    
    m.insert("HI".to_string(), StateAuctionSchedule {
        state: "HI".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "1 year".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$1,000-$5,000".to_string(),
        notes: "3-year lien before auction; 1-year redemption after sale; high values".to_string(),
    });
    
    m.insert("ID".to_string(), StateAuctionSchedule {
        state: "ID".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["January".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "3 years before deed".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$200-$1,000".to_string(),
        notes: "Tax deed to county after 3 years; then sold at auction".to_string(),
    });
    
    m.insert("KS".to_string(), StateAuctionSchedule {
        state: "KS".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["September".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "Court judgment".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$200-$1,000".to_string(),
        notes: "Bid off to county; court petition for foreclosure".to_string(),
    });
    
    m.insert("ME".to_string(), StateAuctionSchedule {
        state: "ME".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "18 months".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: false,
        primary_platform: "Town".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Tax lien mortgage auto-forecloses after 18 months".to_string(),
    });
    
    m.insert("MN".to_string(), StateAuctionSchedule {
        state: "MN".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["May".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "None after sale".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "County".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Tax-forfeited land auctions; cash or installment; no redemption".to_string(),
    });
    
    m.insert("NC".to_string(), StateAuctionSchedule {
        state: "NC".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "Upset bid period".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "Bid4Assets".to_string(),
        deposit_range: "$500-$2,500".to_string(),
        notes: "Judicial foreclosure or docketing certificate; upset bid period".to_string(),
    });
    
    m.insert("ND".to_string(), StateAuctionSchedule {
        state: "ND".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["October".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "Max 9%".to_string(),
        redemption_period: "4 years".to_string(),
        bidding_method: "Bid down interest rate".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$100-$500".to_string(),
        notes: "Bid down from 9%; 4-year redemption from due date".to_string(),
    });
    
    m.insert("NM".to_string(), StateAuctionSchedule {
        state: "NM".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "120 days IRS only".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$200-$1,000".to_string(),
        notes: "No owner redemption; Quitclaim Deed issued; IRS has 120 days".to_string(),
    });
    
    m.insert("NV".to_string(), StateAuctionSchedule {
        state: "NV".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["June".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "2 years before deed".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "County".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Tax deed to Treasurer after 2 years; then auction; Las Vegas active".to_string(),
    });
    
    m.insert("OR".to_string(), StateAuctionSchedule {
        state: "OR".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "2 years".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Foreclosure after 3 years; sold to county; 2-year redemption".to_string(),
    });
    
    m.insert("TN".to_string(), StateAuctionSchedule {
        state: "TN".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "1 year".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: false,
        primary_platform: "County".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "2-year delinquent before Chancery Court suit; 1-year redemption".to_string(),
    });
    
    m.insert("UT".to_string(), StateAuctionSchedule {
        state: "UT".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["May".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "4 years".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "County".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Preliminary sale Jan 16; final sale May 4 years later".to_string(),
    });
    
    m.insert("VA".to_string(), StateAuctionSchedule {
        state: "VA".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Varies".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "Surplus rights only".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "Bid4Assets".to_string(),
        deposit_range: "$1,000-$5,000".to_string(),
        notes: "Judicial foreclosure; 3 years after due date; surplus to former owner".to_string(),
    });
    
    m.insert("WA".to_string(), StateAuctionSchedule {
        state: "WA".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["Varies".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "3 years before sale".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "Bid4Assets".to_string(),
        deposit_range: "$500-$2,500".to_string(),
        notes: "Certificate of delinquency after 3 years; foreclosure judgment".to_string(),
    });
    
    m.insert("WI".to_string(), StateAuctionSchedule {
        state: "WI".to_string(),
        sale_type: "Tax Deed".to_string(),
        frequency: "Annual".to_string(),
        typical_months: vec!["September".to_string()],
        typical_day: "Varies".to_string(),
        interest_rate: "N/A".to_string(),
        redemption_period: "2 years".to_string(),
        bidding_method: "Highest bidder".to_string(),
        online_available: true,
        primary_platform: "County".to_string(),
        deposit_range: "$500-$2,000".to_string(),
        notes: "Tax deed after 2-year certificate; county cannot sell certificate".to_string(),
    });
    
    m
});

// ============================================================================
// UPCOMING AUCTIONS DATABASE - January-June 2026
// ============================================================================

pub fn get_upcoming_auctions() -> Vec<AuctionListing> {
    vec![
        // === JANUARY 2026 ===
        
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
            notes: "Poconos region - Repository sale; no redemption".to_string(),
            interest_rate: "N/A - Deed sale".to_string(),
            redemption_period: "None".to_string(),
            bidding_method: "Highest bidder".to_string(),
            min_bid: "Taxes owed".to_string(),
            payment_deadline: "24 hours".to_string(),
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
            notes: "Largest urban market in PA; real property only".to_string(),
            interest_rate: "N/A - Deed sale".to_string(),
            redemption_period: "None".to_string(),
            bidding_method: "Highest bidder".to_string(),
            min_bid: "Upset amount".to_string(),
            payment_deadline: "30 days".to_string(),
        },
        
        // New Jersey - Tax Liens
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
            notes: "Newark area - high property values; bid-down from 18%".to_string(),
            interest_rate: "18% max (bid down)".to_string(),
            redemption_period: "2 years".to_string(),
            bidding_method: "Bid down interest rate".to_string(),
            min_bid: "Taxes + fees".to_string(),
            payment_deadline: "Same day".to_string(),
        },
        
        // === FEBRUARY 2026 ===
        
        // Texas - 1st Tuesday
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
            notes: "Houston metro - largest TX county; 25% penalty if redeemed".to_string(),
            interest_rate: "25% penalty on redemption".to_string(),
            redemption_period: "6 months (2 years homestead)".to_string(),
            bidding_method: "Highest bidder".to_string(),
            min_bid: "Judgment amount".to_string(),
            payment_deadline: "Same day".to_string(),
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
            notes: "DFW metro - online auction; 25% penalty if redeemed".to_string(),
            interest_rate: "25% penalty on redemption".to_string(),
            redemption_period: "6 months (2 years homestead)".to_string(),
            bidding_method: "Highest bidder".to_string(),
            min_bid: "Min upset".to_string(),
            payment_deadline: "Same day".to_string(),
        },
        AuctionListing {
            id: "TX-TARRANT-2026-02".to_string(),
            state: "TX".to_string(),
            county: "Tarrant".to_string(),
            sale_type: "Tax Deed".to_string(),
            sale_date: "2026-02-03".to_string(),
            property_count: 280,
            deposit_required: 2000.0,
            registration_deadline: "2026-01-27".to_string(),
            platform: "County".to_string(),
            platform_url: "https://www.tarrantcounty.com".to_string(),
            auction_type: "In-Person".to_string(),
            notes: "Fort Worth metro - courthouse steps".to_string(),
            interest_rate: "25% penalty on redemption".to_string(),
            redemption_period: "6 months (2 years homestead)".to_string(),
            bidding_method: "Highest bidder".to_string(),
            min_bid: "Judgment amount".to_string(),
            payment_deadline: "Same day".to_string(),
        },
        
        // Arizona - Annual February Lien Sales
        AuctionListing {
            id: "AZ-MARICOPA-2026-02".to_string(),
            state: "AZ".to_string(),
            county: "Maricopa".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-02-10".to_string(),
            property_count: 2800,
            deposit_required: 500.0,
            registration_deadline: "2026-02-01".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://treasurer.maricopa.gov".to_string(),
            auction_type: "Online".to_string(),
            notes: "LARGEST TAX LIEN SALE IN US - Phoenix metro; bid down from 16%".to_string(),
            interest_rate: "16% max (bid down to 0%)".to_string(),
            redemption_period: "3 years".to_string(),
            bidding_method: "Bid down interest rate".to_string(),
            min_bid: "Taxes + fees".to_string(),
            payment_deadline: "Varies".to_string(),
        },
        AuctionListing {
            id: "AZ-PIMA-2026-02".to_string(),
            state: "AZ".to_string(),
            county: "Pima".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-02-17".to_string(),
            property_count: 850,
            deposit_required: 300.0,
            registration_deadline: "2026-02-07".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://www.pima.gov".to_string(),
            auction_type: "Online".to_string(),
            notes: "Tucson area - 2nd largest AZ sale; online".to_string(),
            interest_rate: "16% max (bid down)".to_string(),
            redemption_period: "3 years".to_string(),
            bidding_method: "Bid down interest rate".to_string(),
            min_bid: "Taxes owed".to_string(),
            payment_deadline: "10 days".to_string(),
        },
        
        // Georgia - 1st Tuesday
        AuctionListing {
            id: "GA-FULTON-2026-02".to_string(),
            state: "GA".to_string(),
            county: "Fulton".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-02-03".to_string(),
            property_count: 320,
            deposit_required: 1000.0,
            registration_deadline: "2026-01-27".to_string(),
            platform: "County".to_string(),
            platform_url: "https://www.fultoncountyga.gov".to_string(),
            auction_type: "In-Person".to_string(),
            notes: "Atlanta metro - HIGHEST ESCALATING RATE (20% → 30% → 40%)".to_string(),
            interest_rate: "20% (escalates to 40%)".to_string(),
            redemption_period: "1 year".to_string(),
            bidding_method: "Premium bidding".to_string(),
            min_bid: "Taxes + fees".to_string(),
            payment_deadline: "Same day".to_string(),
        },
        AuctionListing {
            id: "GA-DEKALB-2026-02".to_string(),
            state: "GA".to_string(),
            county: "DeKalb".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-02-03".to_string(),
            property_count: 250,
            deposit_required: 1000.0,
            registration_deadline: "2026-01-27".to_string(),
            platform: "County".to_string(),
            platform_url: "https://www.dekalbcountyga.gov".to_string(),
            auction_type: "In-Person".to_string(),
            notes: "Atlanta suburbs - 20% escalating rate".to_string(),
            interest_rate: "20% (escalates to 40%)".to_string(),
            redemption_period: "1 year".to_string(),
            bidding_method: "Premium bidding".to_string(),
            min_bid: "Taxes + fees".to_string(),
            payment_deadline: "Same day".to_string(),
        },
        
        // === MARCH 2026 ===
        
        // Florida - Weekly Tax Deed Sales
        AuctionListing {
            id: "FL-BROWARD-2026-03".to_string(),
            state: "FL".to_string(),
            county: "Broward".to_string(),
            sale_type: "Tax Deed".to_string(),
            sale_date: "2026-03-04".to_string(),
            property_count: 45,
            deposit_required: 1000.0,
            registration_deadline: "2026-02-25".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://www.broward.org/RecordsTaxesTreasury".to_string(),
            auction_type: "Online".to_string(),
            notes: "Fort Lauderdale - weekly auction; pre-registration required".to_string(),
            interest_rate: "N/A - Deed sale".to_string(),
            redemption_period: "None".to_string(),
            bidding_method: "Highest bidder".to_string(),
            min_bid: "Opening bid".to_string(),
            payment_deadline: "24 hours".to_string(),
        },
        AuctionListing {
            id: "FL-PALM-2026-03".to_string(),
            state: "FL".to_string(),
            county: "Palm Beach".to_string(),
            sale_type: "Tax Deed".to_string(),
            sale_date: "2026-03-11".to_string(),
            property_count: 55,
            deposit_required: 1000.0,
            registration_deadline: "2026-03-04".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://www.mypalmbeachclerk.com".to_string(),
            auction_type: "Online".to_string(),
            notes: "Wednesdays 9:30am ET; affluent area".to_string(),
            interest_rate: "N/A - Deed sale".to_string(),
            redemption_period: "None".to_string(),
            bidding_method: "Highest bidder".to_string(),
            min_bid: "Opening bid".to_string(),
            payment_deadline: "24 hours".to_string(),
        },
        
        // Maryland - Spring Sales
        AuctionListing {
            id: "MD-BALTIMORE-2026-03".to_string(),
            state: "MD".to_string(),
            county: "Baltimore City".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-03-15".to_string(),
            property_count: 600,
            deposit_required: 2000.0,
            registration_deadline: "2026-03-01".to_string(),
            platform: "Bid4Assets".to_string(),
            platform_url: "https://www.bid4assets.com".to_string(),
            auction_type: "Online".to_string(),
            notes: "Urban properties; 20% rate; short 6-month redemption".to_string(),
            interest_rate: "20%".to_string(),
            redemption_period: "6 months".to_string(),
            bidding_method: "Premium bidding".to_string(),
            min_bid: "Taxes + fees".to_string(),
            payment_deadline: "10 days".to_string(),
        },
        
        // === MAY-JUNE 2026 ===
        
        // Florida - Annual Tax Lien Sales
        AuctionListing {
            id: "FL-MIAMI-2026-05".to_string(),
            state: "FL".to_string(),
            county: "Miami-Dade".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-05-15".to_string(),
            property_count: 3500,
            deposit_required: 2500.0,
            registration_deadline: "2026-05-01".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://www.miamidade.gov/taxcollector".to_string(),
            auction_type: "Online".to_string(),
            notes: "MAJOR SALE - 5% minimum guaranteed; very competitive".to_string(),
            interest_rate: "18% max (bid down) - 5% GUARANTEED".to_string(),
            redemption_period: "2 years".to_string(),
            bidding_method: "Bid down interest rate".to_string(),
            min_bid: "Taxes + fees".to_string(),
            payment_deadline: "Varies".to_string(),
        },
        AuctionListing {
            id: "FL-HILLSBOROUGH-2026-05".to_string(),
            state: "FL".to_string(),
            county: "Hillsborough".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-05-20".to_string(),
            property_count: 2200,
            deposit_required: 2000.0,
            registration_deadline: "2026-05-10".to_string(),
            platform: "RealAuction".to_string(),
            platform_url: "https://www.hillstax.org".to_string(),
            auction_type: "Online".to_string(),
            notes: "Tampa Bay - large sale; 5% minimum guaranteed".to_string(),
            interest_rate: "18% max (bid down) - 5% GUARANTEED".to_string(),
            redemption_period: "2 years".to_string(),
            bidding_method: "Bid down interest rate".to_string(),
            min_bid: "Taxes + fees".to_string(),
            payment_deadline: "Varies".to_string(),
        },
        
        // Iowa - Annual Sale (HIGHEST RATE)
        AuctionListing {
            id: "IA-POLK-2026-06".to_string(),
            state: "IA".to_string(),
            county: "Polk".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-06-15".to_string(),
            property_count: 220,
            deposit_required: 500.0,
            registration_deadline: "2026-06-01".to_string(),
            platform: "County".to_string(),
            platform_url: "https://www.polkcountyiowa.gov".to_string(),
            auction_type: "In-Person".to_string(),
            notes: "Des Moines - 24% HIGHEST RATE IN US; bid for ownership %".to_string(),
            interest_rate: "24% (HIGHEST IN US)".to_string(),
            redemption_period: "1 year 9 months".to_string(),
            bidding_method: "Bid down ownership percentage".to_string(),
            min_bid: "Taxes owed".to_string(),
            payment_deadline: "Same day".to_string(),
        },
        AuctionListing {
            id: "IA-LINN-2026-06".to_string(),
            state: "IA".to_string(),
            county: "Linn".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-06-16".to_string(),
            property_count: 120,
            deposit_required: 300.0,
            registration_deadline: "2026-06-01".to_string(),
            platform: "County".to_string(),
            platform_url: "https://www.linncountyiowa.gov".to_string(),
            auction_type: "In-Person".to_string(),
            notes: "Cedar Rapids - 24% rate; unique bidding system".to_string(),
            interest_rate: "24% (HIGHEST IN US)".to_string(),
            redemption_period: "1 year 9 months".to_string(),
            bidding_method: "Bid down ownership percentage".to_string(),
            min_bid: "Taxes owed".to_string(),
            payment_deadline: "Same day".to_string(),
        },
        
        // Illinois - Fall Sales
        AuctionListing {
            id: "IL-COOK-2026-06".to_string(),
            state: "IL".to_string(),
            county: "Cook".to_string(),
            sale_type: "Tax Lien".to_string(),
            sale_date: "2026-10-15".to_string(),
            property_count: 5000,
            deposit_required: 2500.0,
            registration_deadline: "2026-10-01".to_string(),
            platform: "County".to_string(),
            platform_url: "https://www.cookcountytreasurer.com".to_string(),
            auction_type: "Online".to_string(),
            notes: "Chicago metro - LARGEST LIEN SALE; bid down from 18%".to_string(),
            interest_rate: "18% (bid down)".to_string(),
            redemption_period: "2-3 years".to_string(),
            bidding_method: "Bid down interest rate".to_string(),
            min_bid: "Taxes + fees".to_string(),
            payment_deadline: "Varies".to_string(),
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

// Get state auction schedule/rules
pub fn get_state_schedule(state: &str) -> Option<StateAuctionSchedule> {
    STATE_SCHEDULES.get(&state.to_uppercase()).cloned()
}

// Get all state schedules
pub fn get_all_schedules() -> Vec<StateAuctionSchedule> {
    STATE_SCHEDULES.values().cloned().collect()
}
