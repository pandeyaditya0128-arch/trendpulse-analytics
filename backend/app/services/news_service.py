import httpx
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.config import NEWS_API_KEY

def get_mock_news(keyword: str) -> List[Dict[str, Any]]:
    # Dynamic date generation
    now = datetime.now()
    
    mock_articles = {
        "ai": [
            {"title": "OpenAI Launches Advanced GPT Models with Reasoning Abilities", "source": "TechCrunch", "description": "The new model series is designed to spend more time thinking before they respond, solving complex problems in science and coding."},
            {"title": "Nvidia Reaches Record Valuation Amid Generative AI Surge", "source": "Wall Street Journal", "description": "The chipmaker's stock hit an all-time high as demand for AI hardware chips continues to outstrip industry supply."},
            {"title": "Google Integrates Multi-Modal Gemini Models in Workspace Suite", "source": "The Verge", "description": "Google announced a series of upgrades to its workspace application suite, bringing Gemini directly into docs and spreadsheets."},
            {"title": "AI Ethics Board Calls for Global Regulatory Frameworks", "source": "Reuters", "description": "A coalition of scientists and ethicists are pushing for unified international guardrails on advanced machine learning deployment."}
        ],
        "bitcoin": [
            {"title": "Bitcoin Surges Past Key Resistance Level as Institutional Inflows Rise", "source": "Bloomberg", "description": "The leading cryptocurrency is rallying heavily, supported by new spot ETFs and rising market liquidity."},
            {"title": "Ethereum Gas Fees Drop to Multi-Year Lows Following Upgrade", "source": "CoinDesk", "description": "Transaction costs on the Ethereum network have dropped significantly, encouraging decentralized application adoption."},
            {"title": "SEC Approves Options Trading for Crypto Exchange-Traded Funds", "source": "CNBC", "description": "The regulatory approval marks another major milestone in bringing digital assets into traditional financial portfolios."},
            {"title": "Crypto Security Analyst Warns of New Smart Contract Phishing Scams", "source": "Wired", "description": "Security protocols are urging users to verify contract signatures as hackers deploy sophisticated phishing vectors."}
        ],
        "tesla": [
            {"title": "Tesla Announces Next-Generation Full Self-Driving Beta Update", "source": "Electrek", "description": "Tesla's new FSD version promises smoother city driving and better handling of complex intersections."},
            {"title": "Tesla Model Y Crowned Best-Selling Car Globally", "source": "MotorTrend", "description": "The electric crossover has officialized its position as the top selling vehicle globally, beating traditional ICE competitors."},
            {"title": "Tesla Expands Gigafactory Shanghai to Boost Production Capacity", "source": "Automotive News", "description": "The facility upgrade will support increased production of both standard and long range electric vehicle trims."},
            {"title": "Tesla Unveils Autonomous Cybercab at Hollywood Event", "source": "The Verge", "description": "Elon Musk presented a sleek two-door robotaxi with no steering wheel or pedals, forecasting production by next year."}
        ]
    }
    
    kw_lower = keyword.lower()
    articles_source = []
    
    if kw_lower in mock_articles:
        articles_source = mock_articles[kw_lower]
    elif "crypto" in kw_lower or "ethereum" in kw_lower:
        articles_source = mock_articles["bitcoin"]
    elif "chatgpt" in kw_lower or "nvidia" in kw_lower or "google" in kw_lower or "technology" in kw_lower:
        articles_source = mock_articles["ai"]
    else:
        articles_source = [
            {"title": f"New Breakthrough Announced in {keyword} Research", "source": "Global News Wire", "description": f"Researchers and industry experts have announced a major breakthrough in {keyword}, showing promising efficiency gains."},
            {"title": f"Market Analysis: The Economic Impact of {keyword} Adoption", "source": "Financial Times", "description": f"Analysts predict that {keyword} will see high capital investments over the coming fiscal quarters, shifting market dynamics."},
            {"title": f"Consumer Trends: Why {keyword} is Gaining Rapid Popularity", "source": "Forbes", "description": f"A new consumer report outlines the demographic changes driving interest and sales growth in the {keyword} sector."},
            {"title": f"Key Regulatory Challenges Ahead for {keyword} Companies", "source": "Reuters", "description": f"Policy makers are proposing new compliance standards that could affect how businesses manufacture and distribute {keyword} services."}
        ]
        
    results = []
    for idx, art in enumerate(articles_source):
        days_ago = idx + 1
        published_at = (now - timedelta(days=days_ago, hours=random.randint(0, 23))).isoformat()
        results.append({
            "title": art["title"],
            "source": art["source"],
            "description": art["description"],
            "url": f"https://example.com/news/{kw_lower}/{idx}",
            "urlToImage": f"https://images.unsplash.com/photo-{1600000000000 + idx*1000}?auto=format&fit=crop&w=400&q=80",
            "publishedAt": published_at
        })
        
    return results

async def fetch_news(keyword: str = None) -> List[Dict[str, Any]]:
    if not NEWS_API_KEY:
        return get_mock_news(keyword or "AI")
        
    # Build URL
    if keyword:
        url = f"https://newsapi.org/v2/everything?q={keyword}&sortBy=publishedAt&pageSize=10&language=en&apiKey={NEWS_API_KEY}"
    else:
        url = f"https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=10&apiKey={NEWS_API_KEY}"
        
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, timeout=10.0)
            if res.status_code == 200:
                data = res.json()
                raw_articles = data.get("articles", [])
                
                results = []
                for art in raw_articles:
                    # Map to clean schema
                    results.append({
                        "title": art.get("title", ""),
                        "source": art.get("source", {}).get("name", "Unknown"),
                        "description": art.get("description", ""),
                        "url": art.get("url", ""),
                        "urlToImage": art.get("urlToImage") or "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80",
                        "publishedAt": art.get("publishedAt", "")
                    })
                return results
            else:
                print(f"NewsAPI error {res.status_code}: {res.text}")
                return get_mock_news(keyword or "AI")
    except Exception as e:
        print(f"NewsAPI client exception: {e}")
        return get_mock_news(keyword or "AI")
