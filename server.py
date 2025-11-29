import os
import praw
import re
import numpy as np
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification

app = Flask(__name__)
CORS(app)

# 1. SETUP REDDIT API
# REPLACE THE PLACEHOLDERS BELOW WITH YOUR ACTUAL KEYS
reddit = praw.Reddit(
    client_id="o6Zs31tEtOrXylN63wLC2Q",         # Your 14-character client ID
    client_secret="WDTefleTeB78pbJv-JXo49YE04tr4w", # Your 27-character client secret
    user_agent="CanadianETF_Agent/1.0"
)    

# 2. SETUP AI MODELS
print("Loading AI Models... (This takes time on startup)")
vader = SentimentIntensityAnalyzer()

try:
    finbert_tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
    finbert_model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")
    finbert_pipeline = pipeline("text-classification", model=finbert_model, tokenizer=finbert_tokenizer)
    print("FinBERT Loaded Successfully.")
except Exception as e:
    print(f"Warning: Could not load FinBERT ({e}). Falling back to VADER only.")
    finbert_pipeline = None

# --- SEMANTIC KNOWLEDGE BASE ---
THEME_KNOWLEDGE_BASE = {
    'AI & Automation': {
        "keywords": ["AI", "Artificial Intelligence", "LLM", "Nvidia", "NVDA", "tech rally", "generative ai", "automation", "robotics"],
        "context": "Tracks the technology sector momentum driven by AI adoption and capital expenditure."
    },
    'Canadian Housing': {
        "keywords": ["housing market", "mortgage", "rent", "real estate", "variable rate", "fixed rate", "condo", "toronto housing", "vancouver housing"],
        "context": "Focuses on the Canadian residential real estate market, mortgage rates, and affordability metrics."
    },
    'Interest Rates': {
        "keywords": ["interest rates", "BoC", "Bank of Canada", "Fed", "rate hike", "rate cut", "inflation", "CPI", "bond yields", "yield curve"],
        "context": "Monitors central bank policy, inflation data, and the cost of borrowing."
    },
    'Green Energy': {
        "keywords": ["clean energy", "renewables", "solar", "wind", "nuclear", "uranium", "carbon tax", "EV", "energy transition"],
        "context": "Covers the shift to renewable energy sources, government policy, and commodity inputs like Uranium."
    },
    'Semiconductors': {
        "keywords": ["semiconductors", "chips", "TSMC", "AMD", "supply chain", "wafer", "silicon"],
        "context": "Tracks the cyclical semiconductor industry, essential for tech hardware and AI infrastructure."
    },
    'Oil Prices': {
        "keywords": ["oil", "crude", "WTI", "Brent", "OPEC", "energy sector", "suncor", "cnq", "pipelines"],
        "context": "Analyzes energy commodities, producer profitability, and geopolitical supply constraints."
    },
    'Bank Dividends': {
        "keywords": ["dividends", "big 5 banks", "payout ratio", "loan loss", "RY", "TD", "BMO", "yield"],
        "context": "Focuses on the stability and growth of Canadian banking sector dividends."
    },
    'Crypto Regulation': {
        "keywords": ["crypto", "bitcoin", "ethereum", "SEC", "OSC", "regulation", "coinbase", "ETF approval"],
        "context": "Monitors the regulatory environment for digital assets and institutional adoption."
    },
    'Recession Fears': {
        "keywords": ["recession", "soft landing", "hard landing", "GDP", "unemployment", "jobs report", "economic slowdown"],
        "context": "Tracks macroeconomic indicators signaling potential economic contraction."
    },
    'Consumer Spending': {
        "keywords": ["consumer spending", "retail sales", "debt", "credit card", "inflation", "cost of living", "groceries"],
        "context": "Analyzes the health of the consumer, discretionary income, and retail trends."
    },
    'Supply Chains': {
        "keywords": ["supply chain", "shipping", "freight", "logistics", "rail", "CN rail", "CP rail", "port strike"],
        "context": "Monitors the movement of goods, transportation costs, and logistical bottlenecks."
    },
    'ESG Investing': {
        "keywords": ["ESG", "sustainable investing", "governance", "social responsibility", "green bonds", "divestment"],
        "context": "Tracks investment flows into Environmental, Social, and Governance focused funds."
    }
}

# --- BROKERAGE MAPPING ---
BROKERAGE_KEYWORDS = {
    "Wealthsimple": ["wealthsimple", "ws trade", "wst", "wealth simple", "ws"],
    "Questrade": ["questrade", "qt", "quest trade"],
    "Interactive Brokers": ["ibkr", "interactive brokers", "ib", "ikr"],
    "TD Direct Investing": ["td direct", "td di", "webbroker", "td waterhouse", "td investing"],
    "RBC Direct Investing": ["rbc direct", "rbc di", "rbc investing"],
    "BMO InvestorLine": ["bmo investorline", "investorline", "bmo il"],
    "CIBC Investor's Edge": ["investors edge", "cibc ie", "investorsedge", "ie"],
    "National Bank (NBDB)": ["nbdb", "national bank", "bncd", "bnc"],
    "Scotia iTRADE": ["itrade", "scotia itrade", "scotia investing"],
    "Desjardins (Disnat)": ["disnat", "desjardins", "desjardins online"],
    "Moomoo": ["moomoo"],
    "Qtrade": ["qtrade", "qtrade investor"], 
    "CI Direct": ["ci direct", "ci investment"],
    "Laurentian Bank": ["laurentian", "lbdb"],
    "HSBC InvestDirect": ["hsbc", "investdirect"] 
}

def get_finbert_score(text):
    if not finbert_pipeline: return 0
    try:
        results = finbert_pipeline(text[:512]) 
        label = results[0]['label']
        score = results[0]['score']
        if label == 'positive': return score
        if label == 'negative': return -score
        return 0 
    except:
        return 0

def analyze_brokerage_mentions(text, counts_dict):
    text = text.lower()
    for official_name, aliases in BROKERAGE_KEYWORDS.items():
        for alias in aliases:
            # Regex exact match to avoid partial words
            if re.search(r'\b' + re.escape(alias) + r'\b', text):
                counts_dict[official_name] += 1
                break 

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    tickers = data.get('tickers', [])
    themes = data.get('themes', [])
    raw_time_filter = data.get('timeFrame', 'month') 
    
    if not tickers:
        return jsonify({"error": "No tickers provided"}), 400

    print(f"Starting analysis: {len(tickers)} tickers | Timeframe: {raw_time_filter}")
    
    # --- DYNAMIC TIMEFRAME LOGIC ---
    # Reddit API only accepts: hour, day, week, month, year, all.
    # We must map 3/5/10 years to "all" and increase the search depth.
    if raw_time_filter in ['3year', '5year', '10year', 'all']:
        api_time_filter = 'all'
        search_limit = 1000 # Dig deep for long-term trends
    elif raw_time_filter == 'year':
        api_time_filter = 'year'
        search_limit = 500
    else:
        api_time_filter = raw_time_filter
        search_limit = 100

    print(f"   -> Mapped to Reddit API Filter: {api_time_filter} (Limit: {search_limit})")
    
    # --- 1. ANALYZE TICKERS ---
    ticker_results = []
    global_sentiment_scores = []
    total_mentions_count = 0
    
    target_subs = ['PersonalFinanceCanada', 'investing', 'canadianinvestor', 'stocks', 'ETFs']
    
    for ticker in tickers:
        symbol = ticker['symbol']
        mentions = 0
        vader_scores = []
        finbert_scores = []
        discussions = []
        brokerage_counts = {k: 0 for k in BROKERAGE_KEYWORDS.keys()}

        print(f"Scraping Reddit for Ticker: {symbol}...")
        
        for sub in target_subs:
            try:
                # Use the MAPPED api_time_filter and search_limit
                search_results = reddit.subreddit(sub).search(symbol, sort='new', time_filter=api_time_filter, limit=search_limit)
                
                for post in search_results:
                    mentions += 1
                    full_text = f"{post.title} {post.selftext}"
                    
                    v_score = vader.polarity_scores(full_text)['compound']
                    vader_scores.append(v_score)
                    f_score = get_finbert_score(full_text)
                    finbert_scores.append(f_score)
                    
                    analyze_brokerage_mentions(full_text, brokerage_counts)
                    
                    if len(discussions) < 10:
                        discussions.append({
                            "text": post.title[:140] + "...",
                            "source": f"r/{sub}",
                            "url": f"https://www.reddit.com{post.permalink}",
                            "timestamp": post.created_utc
                        })

                    post.comments.replace_more(limit=0)
                    for comment in post.comments.list()[:3]: 
                        comment_text = comment.body
                        vader_scores.append(vader.polarity_scores(comment_text)['compound'])
                        finbert_scores.append(get_finbert_score(comment_text))
                        analyze_brokerage_mentions(comment_text, brokerage_counts)

            except Exception as e:
                print(f"Error scraping {sub} for {symbol}: {e}")

        avg_vader = np.mean(vader_scores) if vader_scores else 0
        avg_finbert = np.mean(finbert_scores) if finbert_scores else 0
        sentiment_score = int((avg_finbert + 1) * 50) 
        
        sentiment_label = "Neutral"
        if sentiment_score > 60: sentiment_label = "Bullish"
        if sentiment_score < 40: sentiment_label = "Bearish"

        total_broker_hits = sum(brokerage_counts.values())
        brokerage_stats = []
        if total_broker_hits > 0:
            for k, v in brokerage_counts.items():
                if v > 0:
                    brokerage_stats.append({"name": k, "percentage": int((v / total_broker_hits) * 100)})
            brokerage_stats.sort(key=lambda x: x['percentage'], reverse=True)

        ticker_results.append({
            "symbol": symbol,
            "name": ticker.get('name', symbol),
            "type": ticker.get('type', 'ETF'),
            "sector": ticker.get('sector', 'Unknown'),
            "active": ticker.get('active', False),
            "mentions": mentions,
            "vaderScore": f"{avg_vader:.2f}",
            "finbertScore": f"{avg_finbert:.2f}",
            "sentiment": sentiment_label,
            "discussions": discussions,
            "brokerageDistribution": brokerage_stats
        })
        
        if mentions > 0:
            global_sentiment_scores.append(sentiment_score)
            total_mentions_count += mentions

    # --- 2. ANALYZE THEMES (SMART SEARCH) ---
    theme_results = []
    theme_subs = ['investing', 'stocks', 'economics', 'PersonalFinanceCanada']
    
    for theme in themes:
        print(f"Scraping Reddit for Theme: {theme}...")
        
        # Get knowledge base for this theme
        knowledge = THEME_KNOWLEDGE_BASE.get(theme, {})
        keywords = knowledge.get("keywords", [])
        
        # Construct Smart Query
        search_query = f'"{theme}"'
        if keywords:
            extras = ' OR '.join([f'"{k}"' for k in keywords[:3]])
            search_query += f' OR {extras}'
            
        print(f"   Query: {search_query}")

        theme_mentions = 0
        theme_scores = []
        theme_discussions = []
        
        for sub in theme_subs:
            try:
                # Use the MAPPED api_time_filter and search_limit
                for post in reddit.subreddit(sub).search(search_query, sort='relevance', time_filter=api_time_filter, limit=search_limit):
                    text = f"{post.title} {post.selftext}"
                    score = get_finbert_score(text)
                    theme_scores.append(score)
                    
                    if len(theme_discussions) < 10:
                        theme_discussions.append({
                            "text": post.title[:140]+"...", 
                            "source": f"r/{sub}",
                            "url": f"https://www.reddit.com{post.permalink}",
                            "timestamp": post.created_utc
                        })
            except Exception as e:
                print(f"Error scraping theme {theme}: {e}")

        if theme_scores:
            avg_theme_score = np.mean(theme_scores)
            normalized_score = int((avg_theme_score + 1) * 50)
        else:
            normalized_score = 50 

        sentiment_label = "neutral"
        if normalized_score > 55: sentiment_label = "positive"
        if normalized_score < 45: sentiment_label = "negative"

        theme_results.append({
            "name": theme,
            "score": normalized_score,
            "sentiment": sentiment_label,
            "discussions": theme_discussions
        })

    overall_sentiment = int(np.mean(global_sentiment_scores)) if global_sentiment_scores else 50

    return jsonify({
        "overallSentiment": overall_sentiment,
        "totalMentions": total_mentions_count,
        "tickers": ticker_results,
        "topThemes": theme_results
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)