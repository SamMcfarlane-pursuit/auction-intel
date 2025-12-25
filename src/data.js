export const TIERS = {
    1: { label: "T1", name: "Prime", color: "#059669", bg: "#D1FAE5", action: "PURSUE" },
    2: { label: "T2", name: "Strong", color: "#2563EB", bg: "#DBEAFE", action: "PURSUE" },
    3: { label: "T3", name: "Opportunity", color: "#D97706", bg: "#FEF3C7", action: "PURSUE" },
    4: { label: "T4", name: "Speculative", color: "#EA580C", bg: "#FFEDD5", action: "CAUTION" },
    5: { label: "T5", name: "Avoid", color: "#DC2626", bg: "#FEE2E2", action: "AVOID" }
};

// Tier Detection Algorithm Criteria
export const TIER_CRITERIA = {
    1: {
        name: "Prime Investor",
        description: "Unmatched liquidity, constant buyer depth, fast exits",
        criteria: {
            population: "> 500,000",
            medianIncome: "> $80,000",
            homeValueGrowth: "> 5% YoY",
            daysOnMarket: "< 30 days",
            transactionVolume: "> 10,000/year",
            employmentRate: "> 96%"
        }
    },
    2: {
        name: "Strong / Selective",
        description: "Moderate liquidity, requires neighborhood selectivity",
        criteria: {
            population: "200,000 - 500,000",
            medianIncome: "$60,000 - $80,000",
            homeValueGrowth: "3-5% YoY",
            daysOnMarket: "30-45 days",
            transactionVolume: "5,000-10,000/year",
            employmentRate: "94-96%"
        }
    },
    3: {
        name: "Opportunistic",
        description: "Regional hub liquidity, anchor employer stability",
        criteria: {
            population: "100,000 - 200,000",
            medianIncome: "$50,000 - $60,000",
            homeValueGrowth: "1-3% YoY",
            daysOnMarket: "45-60 days",
            transactionVolume: "2,000-5,000/year",
            employmentRate: "92-94%"
        }
    },
    4: {
        name: "Speculative",
        description: "Thin liquidity, selective exits tied to specific demand",
        criteria: {
            population: "50,000 - 100,000",
            medianIncome: "$40,000 - $50,000",
            homeValueGrowth: "0-1% YoY",
            daysOnMarket: "60-90 days",
            transactionVolume: "500-2,000/year",
            employmentRate: "90-92%"
        }
    },
    5: {
        name: "Capital Trap Risk",
        description: "Weak resale fundamentals, minimal buyer activity",
        criteria: {
            population: "< 50,000",
            medianIncome: "< $40,000",
            homeValueGrowth: "< 0% YoY",
            daysOnMarket: "> 90 days",
            transactionVolume: "< 500/year",
            employmentRate: "< 90%"
        }
    }
};

// Free Data Sources for Tier Detection
export const FREE_DATA_SOURCES = [
    {
        name: "Census ACS API",
        metrics: ["Population", "Median Income", "Housing Units", "Vacancy Rate"],
        url: "api.census.gov/data/2023/acs/acs5",
        weight: 0.25,
        icon: "📊"
    },
    {
        name: "Zillow Research",
        metrics: ["ZHVI", "Rent Index", "Price Forecast", "Inventory"],
        url: "zillow.com/research/data",
        weight: 0.25,
        icon: "🏠"
    },
    {
        name: "Redfin Data Center",
        metrics: ["Days on Market", "Sale-to-List", "Price Drops", "Homes Sold"],
        url: "redfin.com/news/data-center",
        weight: 0.25,
        icon: "📈"
    },
    {
        name: "FRED Economic",
        metrics: ["Unemployment", "GDP", "Mortgage Rates"],
        url: "fred.stlouisfed.org",
        weight: 0.15,
        icon: "💹"
    },
    {
        name: "HUD Datasets",
        metrics: ["Fair Market Rent", "Foreclosure Risk", "Income Limits"],
        url: "huduser.gov/portal/pdrdatas_landing.html",
        weight: 0.10,
        icon: "🏛️"
    }
];

// Enhanced NY County Data with Investor Focus & Lifestyle insights
export const NY_COUNTY_DETAILS = {
    "New York": { investorFocus: "Unmatched liquidity with constant buyer depth", lifestyle: "Global employment center with premier urban lifestyle", fips: "36061" },
    "Kings": { investorFocus: "Extremely high transaction volume and fast exits", lifestyle: "Dense population and cultural amenities drive demand", fips: "36047" },
    "Queens": { investorFocus: "Strong liquidity with diverse housing stock", lifestyle: "Transit access and employment hubs support livability", fips: "36081" },
    "Nassau": { investorFocus: "Affluent suburban market with reliable resale", lifestyle: "Top schools and commuter access boost demand", fips: "36059" },
    "Bronx": { investorFocus: "High volume requires neighborhood selectivity", lifestyle: "Urban density supports employment access", fips: "36005" },
    "Richmond": { investorFocus: "Moderate liquidity with suburban profile", lifestyle: "Family-oriented lifestyle with NYC access", fips: "36085" },
    "Suffolk": { investorFocus: "Large market with selective exits", lifestyle: "Suburban and coastal lifestyle appeal", fips: "36103" },
    "Rockland": { investorFocus: "Commuter-driven demand supports resale", lifestyle: "High incomes and metro access enhance livability", fips: "36087" },
    "Erie": { investorFocus: "Regional hub liquidity centered on Buffalo", lifestyle: "Healthcare and education employment anchor demand", fips: "36029" },
    "Monroe": { investorFocus: "University and healthcare employment stabilize exits", lifestyle: "Rochester anchors livability", fips: "36055" },
    "Onondaga": { investorFocus: "Government and education support baseline liquidity", lifestyle: "Syracuse anchors regional lifestyle", fips: "36067" },
    "Albany": { investorFocus: "State government employment stabilizes housing", lifestyle: "Capital-region amenities support livability", fips: "36001" },
    "Westchester": { investorFocus: "Consistent high-value exits near NYC", lifestyle: "Affluent communities and quality of life sustain demand", fips: "36119" },
    "Dutchess": { investorFocus: "Selective exits tied to commuter demand", lifestyle: "Rural-suburban mix limits volume", fips: "36027" },
    "Ulster": { investorFocus: "Thin liquidity outside select towns", lifestyle: "Lifestyle appeal balanced by slower growth", fips: "36111" },
    "Jefferson": { investorFocus: "Military presence offers narrow liquidity", lifestyle: "Limited civilian demand", fips: "36045" },
    "Chautauqua": { investorFocus: "Very weak resale fundamentals", lifestyle: "Population decline and limited employment", fips: "36013" },
    "St. Lawrence": { investorFocus: "Extremely thin market", lifestyle: "Remote geography limits demand", fips: "36089" },
    "Allegany": { investorFocus: "Minimal buyer activity", lifestyle: "Rural isolation", fips: "36003" },
    "Hamilton": { investorFocus: "Near-zero liquidity", lifestyle: "Smallest population base", fips: "36041" }
};

// Python Quick Start Code for Data Fetching
export const PYTHON_QUICK_START = `import requests
import pandas as pd

# 1. Census API - Get population & income
CENSUS_KEY = "YOUR_FREE_KEY"  # Get at api.census.gov
state_fips = "36"  # New York

census_url = f"""https://api.census.gov/data/2023/acs/acs5?
  get=B01003_001E,B19013_001E,B25077_001E&
  for=county:*&in=state:{state_fips}&key={CENSUS_KEY}"""

census_data = requests.get(census_url).json()
df = pd.DataFrame(census_data[1:], columns=census_data[0])
df.columns = ['population', 'median_income', 'median_home_value', 'state', 'county']

# 2. Zillow Research - Get home value trends
zhvi = pd.read_csv("https://files.zillowstatic.com/research/public_csvs/zhvi/County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv")
ny_zhvi = zhvi[zhvi['StateCodeFIPS'] == 36]

# 3. Calculate tier score
def calculate_tier(pop, income, growth):
    score = 0
    score += min(pop / 500000, 1) * 25  # Population
    score += min(income / 80000, 1) * 25  # Income
    score += min(growth / 0.05, 1) * 50  # Growth
    if score >= 80: return 1
    if score >= 60: return 2
    if score >= 40: return 3
    if score >= 20: return 4
    return 5

print("County tiers calculated!")`;

export const STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
};

// Counties format: [name, pop, income, zhvi, growth, dom, tier, notes]
export const COUNTIES = {
    "AL": [
        ["Shelby", 223024, 85678, 345000, 5.8, 32, 1, "Birmingham suburb"],
        ["Madison", 387545, 68234, 285000, 5.5, 32, 1, "Huntsville tech"],
        ["Baldwin", 231767, 62481, 320000, 5.8, 38, 1, "Gulf Coast"],
        ["Jefferson", 674721, 52891, 185000, 3.2, 42, 2, "Birmingham"],
        ["Mobile", 414809, 48234, 165000, 3.0, 48, 2, "Port city"],
    ],
    "AK": [
        ["Anchorage", 291247, 84567, 365000, 2.8, 45, 1, "Urban center"],
        ["Matanuska-Susitna", 108317, 75678, 325000, 4.5, 48, 2, "Mat-Su"],
        ["Fairbanks", 97121, 72345, 275000, 2.5, 55, 2, "Interior"],
    ],
    "AZ": [
        ["Maricopa", 4420568, 68234, 420000, 5.5, 30, 1, "Phoenix"],
        ["Pima", 1043433, 55234, 320000, 4.2, 42, 1, "Tucson"],
        ["Pinal", 464474, 58234, 345000, 5.8, 38, 2, "Phoenix spillover"],
    ],
    "CA": [
        ["Los Angeles", 9829544, 72000, 850000, 3.8, 35, 1, "LA metro"],
        ["San Diego", 3286069, 82000, 880000, 4.5, 28, 1, "Biotech"],
        ["Orange", 3167809, 100000, 1050000, 4.2, 30, 1, "OC"],
        ["San Francisco", 815201, 140000, 1350000, 2.5, 30, 1, "SF"],
    ],
    "CO": [
        ["Denver", 715522, 78000, 580000, 4.8, 28, 1, "Denver"],
        ["El Paso", 730395, 68000, 420000, 4.5, 32, 1, "CO Springs"],
        ["Boulder", 330758, 88000, 680000, 3.8, 35, 1, "CU"],
    ],
    "FL": [
        ["Miami-Dade", 2701767, 58000, 520000, 5.8, 35, 1, "Miami"],
        ["Broward", 1944375, 62000, 450000, 5.2, 32, 1, "Ft Lauderdale"],
        ["Palm Beach", 1492191, 72000, 520000, 4.8, 38, 1, "Palm Beach"],
        ["Hillsborough", 1459762, 62000, 380000, 5.5, 30, 1, "Tampa"],
        ["Orange", 1393452, 58000, 385000, 5.2, 32, 1, "Orlando"],
    ],
    "GA": [
        ["Fulton", 1066710, 72000, 420000, 5.2, 28, 1, "Atlanta"],
        ["Gwinnett", 936250, 72000, 380000, 4.8, 32, 1, "Atlanta NE"],
        ["Cobb", 760141, 78000, 420000, 4.5, 30, 1, "Marietta"],
    ],
    "HI": [
        ["Honolulu", 974563, 92000, 950000, 3.2, 35, 1, "Oahu"],
        ["Hawaii", 200983, 68000, 520000, 3.5, 48, 2, "Big Island"],
        ["Maui", 164637, 78000, 980000, 3.0, 52, 2, "Maui"],
    ],
    "ID": [
        ["Ada", 494967, 72000, 520000, 5.5, 28, 1, "Boise"],
        ["Canyon", 229849, 55000, 380000, 5.8, 35, 2, "Nampa"],
    ],
    "IL": [
        ["Cook", 5173146, 65000, 310000, 3.2, 35, 1, "Chicago"],
        ["DuPage", 932877, 95000, 380000, 2.8, 32, 1, "West suburbs"],
    ],
    "IN": [
        ["Hamilton", 338011, 105000, 385000, 4.5, 32, 1, "Carmel"],
        ["Marion", 977203, 52000, 215000, 4.2, 35, 2, "Indianapolis"],
    ],
    "IA": [
        ["Polk", 492401, 68000, 265000, 3.8, 35, 2, "Des Moines"],
    ],
    "KS": [
        ["Johnson", 609863, 92000, 350000, 3.8, 32, 1, "KC suburbs"],
    ],
    "KY": [
        ["Jefferson", 782969, 55000, 225000, 3.5, 38, 2, "Louisville"],
        ["Fayette", 323152, 58000, 265000, 3.8, 35, 2, "Lexington"],
    ],
    "LA": [
        ["East Baton Rouge", 456781, 55000, 235000, 3.2, 42, 2, "Baton Rouge"],
        ["Orleans", 383997, 45000, 285000, 3.5, 42, 2, "New Orleans"],
    ],
    "ME": [
        ["Cumberland", 303069, 78000, 450000, 3.5, 38, 2, "Portland"],
    ],
    "MD": [
        ["Montgomery", 1062061, 115000, 580000, 3.2, 32, 1, "DC suburbs"],
        ["Prince George's", 967201, 82000, 380000, 3.8, 35, 1, "DC suburbs"],
    ],
    "MA": [
        ["Middlesex", 1632002, 105000, 680000, 3.2, 28, 1, "Cambridge"],
        ["Suffolk", 803907, 78000, 680000, 3.0, 30, 1, "Boston"],
    ],
    "MI": [
        ["Oakland", 1274395, 78000, 320000, 3.8, 32, 1, "Detroit N"],
        ["Wayne", 1773922, 48000, 145000, 4.5, 38, 2, "Detroit"],
    ],
    "MN": [
        ["Hennepin", 1281565, 78000, 350000, 3.5, 28, 1, "Minneapolis"],
        ["Ramsey", 552352, 65000, 295000, 3.2, 32, 1, "St. Paul"],
    ],
    "MS": [
        ["DeSoto", 184945, 68000, 265000, 4.2, 38, 2, "Memphis sub"],
    ],
    "MO": [
        ["St. Louis County", 1004125, 72000, 265000, 2.8, 38, 2, "STL suburbs"],
        ["Jackson", 717204, 55000, 215000, 3.2, 40, 2, "Kansas City"],
    ],
    "MT": [
        ["Yellowstone", 164731, 58000, 350000, 4.2, 42, 2, "Billings"],
        ["Gallatin", 114434, 68000, 620000, 5.2, 38, 2, "Bozeman"],
    ],
    "NE": [
        ["Douglas", 584526, 68000, 265000, 3.5, 35, 2, "Omaha"],
    ],
    "NV": [
        ["Clark", 2265461, 58000, 420000, 5.5, 32, 1, "Las Vegas"],
        ["Washoe", 486492, 65000, 520000, 5.0, 35, 1, "Reno"],
    ],
    "NH": [
        ["Hillsborough", 422937, 82000, 420000, 3.8, 32, 1, "Manchester"],
    ],
    "NJ": [
        ["Bergen", 955732, 105000, 580000, 3.2, 32, 1, "NYC suburbs"],
        ["Middlesex", 863162, 92000, 480000, 3.5, 32, 1, "Central NJ"],
    ],
    "NM": [
        ["Bernalillo", 679121, 52000, 295000, 4.2, 42, 2, "Albuquerque"],
    ],
    "NY": [
        ["Kings", 2559903, 67000, 850000, 5.1, 25, 1, "Brooklyn"],
        ["Queens", 2253858, 72500, 680000, 4.8, 30, 1, "Queens"],
        ["New York", 1629153, 93651, 1150000, 4.2, 28, 1, "Manhattan"],
        ["Nassau", 1356924, 120000, 620000, 5.5, 28, 1, "Long Island"],
    ],
    "NC": [
        ["Wake", 1129410, 82000, 420000, 5.2, 28, 1, "Raleigh"],
        ["Mecklenburg", 1115482, 72000, 380000, 4.8, 30, 1, "Charlotte"],
    ],
    "ND": [
        ["Cass", 184525, 62000, 295000, 3.2, 38, 2, "Fargo"],
    ],
    "OH": [
        ["Franklin", 1323807, 62000, 285000, 4.8, 28, 1, "Columbus"],
        ["Cuyahoga", 1235072, 52000, 165000, 2.5, 42, 2, "Cleveland"],
    ],
    "OK": [
        ["Oklahoma", 797434, 55000, 195000, 3.5, 38, 2, "OKC"],
        ["Tulsa", 669279, 55000, 195000, 3.2, 40, 2, "Tulsa"],
    ],
    "OR": [
        ["Multnomah", 812855, 72000, 520000, 4.0, 32, 1, "Portland"],
        ["Washington", 600372, 85000, 550000, 4.5, 30, 1, "Hillsboro"],
    ],
    "PA": [
        ["Philadelphia", 1576251, 52000, 220000, 4.5, 35, 2, "Philadelphia"],
        ["Allegheny", 1218380, 62000, 225000, 3.8, 38, 2, "Pittsburgh"],
        ["Montgomery", 856553, 95000, 420000, 3.5, 32, 1, "Main Line"],
    ],
    "RI": [
        ["Providence", 660741, 58000, 350000, 3.8, 38, 2, "Providence"],
    ],
    "SC": [
        ["Charleston", 411406, 68000, 420000, 4.8, 35, 1, "Charleston"],
        ["Greenville", 523542, 62000, 285000, 4.5, 35, 2, "Greenville"],
    ],
    "SD": [
        ["Minnehaha", 197214, 62000, 295000, 4.0, 35, 2, "Sioux Falls"],
    ],
    "TN": [
        ["Davidson", 715884, 62000, 380000, 5.2, 32, 1, "Nashville"],
        ["Shelby", 937166, 52000, 225000, 3.8, 38, 2, "Memphis"],
    ],
    "TX": [
        ["Harris", 4731145, 63000, 285000, 4.5, 32, 1, "Houston"],
        ["Dallas", 2613539, 62000, 320000, 5.2, 28, 1, "Dallas"],
        ["Tarrant", 2110640, 68000, 310000, 4.8, 30, 1, "Fort Worth"],
        ["Travis", 1290188, 85000, 520000, 6.5, 25, 1, "Austin"],
        ["Collin", 1064465, 110000, 480000, 5.8, 28, 1, "Plano"],
    ],
    "UT": [
        ["Salt Lake", 1160437, 72000, 520000, 5.5, 28, 1, "Salt Lake City"],
        ["Utah", 659399, 72000, 480000, 5.8, 30, 1, "Provo"],
    ],
    "VT": [
        ["Chittenden", 168323, 78000, 450000, 3.5, 38, 2, "Burlington"],
    ],
    "VA": [
        ["Fairfax", 1150309, 130000, 680000, 3.5, 28, 1, "Fairfax"],
        ["Prince William", 482204, 105000, 480000, 4.5, 32, 1, "Woodbridge"],
        ["Loudoun", 420959, 155000, 680000, 4.0, 30, 1, "Leesburg"],
    ],
    "WA": [
        ["King", 2269675, 105000, 780000, 4.5, 25, 1, "Seattle"],
        ["Pierce", 921130, 72000, 480000, 5.2, 32, 1, "Tacoma"],
        ["Snohomish", 827957, 88000, 620000, 5.0, 30, 1, "Everett"],
    ],
    "WV": [
        ["Berkeley", 119171, 62000, 265000, 4.0, 45, 2, "Martinsburg"],
    ],
    "WI": [
        ["Milwaukee", 939489, 48000, 185000, 4.0, 38, 2, "Milwaukee"],
        ["Dane", 561504, 72000, 380000, 4.5, 32, 1, "Madison"],
    ],
    "WY": [
        ["Laramie", 100512, 58000, 295000, 3.5, 48, 3, "Cheyenne"],
        ["Teton", 23464, 92000, 1250000, 4.0, 55, 2, "Jackson"],
    ],
    "AR": [
        ["Benton", 284333, 72345, 295000, 5.8, 32, 1, "NW Arkansas"],
        ["Washington", 245871, 55678, 285000, 5.2, 35, 1, "Fayetteville"],
    ],
    "CT": [
        ["Fairfield", 943332, 105000, 580000, 3.2, 38, 1, "NYC suburbs"],
    ],
    "DE": [
        ["New Castle", 570719, 72000, 320000, 3.5, 38, 2, "Wilmington"],
    ],
};

const GRID_SIZE = 64;
const GUTTER = 4;
const X_OFF = 60;
const Y_OFF = 40;

const getTilePath = (col, row) => {
    const x = X_OFF + col * (GRID_SIZE + GUTTER);
    const y = Y_OFF + row * (GRID_SIZE + GUTTER);
    return `M${x},${y} h${GRID_SIZE} v${GRID_SIZE} h-${GRID_SIZE} Z`;
};

const getTileLabel = (col, row) => {
    const x = X_OFF + col * (GRID_SIZE + GUTTER) + GRID_SIZE / 2;
    const y = Y_OFF + row * (GRID_SIZE + GUTTER) + GRID_SIZE / 2;
    return [x, y];
};

export const STATE_PATHS = {
    "ME": getTilePath(10, 0),
    "VT": [9, 1], "NH": [10, 1],
    "WA": [0, 2], "ID": [1, 2], "MT": [2, 2], "ND": [3, 2], "MN": [4, 2], "IL": [5, 2], "WI": [6, 2], "MI": [7, 2], "NY": [8, 2], "RI": [9, 2], "MA": [10, 2],
    "OR": [0, 3], "NV": [1, 3], "WY": [2, 3], "SD": [3, 3], "IA": [4, 3], "IN": [5, 3], "OH": [6, 3], "PA": [7, 3], "NJ": [8, 3], "CT": [9, 3],
    "CA": [0, 4], "UT": [1, 4], "CO": [2, 4], "NE": [3, 4], "MO": [4, 4], "KY": [5, 4], "WV": [6, 4], "VA": [7, 4], "MD": [8, 4], "DE": [9, 4],
    "AZ": [1, 5], "NM": [2, 5], "KS": [3, 5], "AR": [4, 5], "TN": [5, 5], "NC": [6, 5], "SC": [7, 5],
    "OK": [2, 6], "LA": [3, 6], "MS": [4, 6], "AL": [5, 6], "GA": [6, 6],
    "HI": [0, 7], "AK": [1, 7], "TX": [2, 7], "FL": [7, 7]
};

// Transform abbreviated entries into paths
Object.entries(STATE_PATHS).forEach(([abbr, val]) => {
    if (Array.isArray(val)) {
        STATE_PATHS[abbr] = getTilePath(val[0], val[1]);
    }
});

export const STATE_LABEL_COORDS = {
    "ME": getTileLabel(10, 0),
    "VT": [9, 1], "NH": [10, 1],
    "WA": [0, 2], "ID": [1, 2], "MT": [2, 2], "ND": [3, 2], "MN": [4, 2], "IL": [5, 2], "WI": [6, 2], "MI": [7, 2], "NY": [8, 2], "RI": [9, 2], "MA": [10, 2],
    "OR": [0, 3], "NV": [1, 3], "WY": [2, 3], "SD": [3, 3], "IA": [4, 3], "IN": [5, 3], "OH": [6, 3], "PA": [7, 3], "NJ": [8, 3], "CT": [9, 3],
    "CA": [0, 4], "UT": [1, 4], "CO": [2, 4], "NE": [3, 4], "MO": [4, 4], "KY": [5, 4], "WV": [6, 4], "VA": [7, 4], "MD": [8, 4], "DE": [9, 4],
    "AZ": [1, 5], "NM": [2, 5], "KS": [3, 5], "AR": [4, 5], "TN": [5, 5], "NC": [6, 5], "SC": [7, 5],
    "OK": [2, 6], "LA": [3, 6], "MS": [4, 6], "AL": [5, 6], "GA": [6, 6],
    "HI": [0, 7], "AK": [1, 7], "TX": [2, 7], "FL": [7, 7]
};

// Transform abbreviated entries into label coords
Object.entries(STATE_LABEL_COORDS).forEach(([abbr, val]) => {
    if (val.length === 2 && typeof val[0] === 'number' && val[0] < 20) {
        STATE_LABEL_COORDS[abbr] = getTileLabel(val[0], val[1]);
    }
});
