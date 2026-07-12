import os
import json
import random
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SearchHistory, ComparisonHistory, Profile
from app.routers.auth import get_current_user
from app.services import ml_service, gemini_service, news_service, youtube_service

router = APIRouter(prefix="/api", tags=["analytics"])

GLOBAL_DATASET = []

def load_dataset():
    global GLOBAL_DATASET
    # Look for dataset.json in backend directory or parent
    paths = ["dataset.json", "../dataset.json", "backend/dataset.json"]
    for path in paths:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    GLOBAL_DATASET = json.load(f)
                print(f"Loaded {len(GLOBAL_DATASET)} entries from {path}")
                return
            except Exception as e:
                print(f"Error loading {path}: {e}")
                
    # Fallback mock dataset
    print("Generating fallback dataset...")
    now = datetime.now()
    keywords = ["AI", "Bitcoin", "Tesla", "Apple", "Samsung", "Cricket", "Elections", "Fitness"]
    categories = ["Technology", "Finance", "Sports", "Politics", "Lifestyle"]
    
    for i in range(1000):
        kw = random.choice(keywords)
        cat = random.choice(categories)
        days_ago = random.randint(0, 90)
        timestamp = (now - timedelta(days=days_ago, hours=random.randint(0, 23))).isoformat()
        
        GLOBAL_DATASET.append({
            "text": f"Latest discussions on #{kw}. This is an amazing development in {cat}!",
            "timestamp": timestamp,
            "user": f"user_{random.randint(1, 100)}",
            "category": cat,
            "keyword": kw,
            "engagement": {
                "likes": random.randint(10, 1000),
                "comments": random.randint(2, 100),
                "shares": random.randint(1, 50)
            }
        })
    print(f"Generated {len(GLOBAL_DATASET)} mock entries.")

load_dataset()

@router.get("/suggestions")
async def suggestions(q: str = ""):
    if len(q) < 1:
        return []
    keywords = list(set([item["keyword"] for item in GLOBAL_DATASET] + [item.get("category", "") for item in GLOBAL_DATASET]))
    matches = [k for k in keywords if q.lower() in k.lower()]
    return matches[:8]

@router.get("/trending")
async def trending():
    keywords = [item["keyword"] for item in GLOBAL_DATASET]
    from collections import Counter
    counts = Counter(keywords).most_common(12)
    
    results = []
    for k, cnt in counts:
        growth = round(random.uniform(5, 95), 1)
        score = round(40 + (growth * 0.6), 1)
        status = "Stable"
        if growth > 75: status = "Strong Rising"
        elif growth > 40: status = "Moderate Rising"
        elif growth > 15: status = "Stable"
        elif growth > -10: status = "Declining"
        else: status = "Critical Drop"
            
        results.append({
            "keyword": k,
            "volume": cnt,
            "growth": growth,
            "score": score,
            "status": status,
            "momentum": round(random.uniform(0.1, 0.99), 2)
        })
    return results

@router.get("/analyze")
async def analyze(keyword: str, user: Optional[Profile] = Depends(get_current_user), db: Session = Depends(get_db)):
    keyword_lower = keyword.lower()
    
    # Save search history if user is authenticated
    if user:
        search_record = SearchHistory(user_id=user.id, keyword=keyword)
        db.add(search_record)
        db.commit()

    relevant = [p for p in GLOBAL_DATASET if keyword_lower in p["text"].lower() or keyword_lower in p.get("category", "").lower() or keyword_lower in p.get("keyword", "").lower()]
    
    if not relevant:
        now = datetime.now()
        for i in range(120):
            days_ago = random.randint(0, 90)
            timestamp = (now - timedelta(days=days_ago, hours=random.randint(0, 23))).isoformat()
            relevant.append({
                "text": f"Discussing about {keyword}. It feels like an amazing breakthrough in this field! #{keyword}",
                "timestamp": timestamp,
                "user": f"user_{random.randint(1, 1000)}",
                "engagement": {
                    "likes": random.randint(10, 5000),
                    "comments": random.randint(2, 400),
                    "shares": random.randint(1, 150)
                },
                "category": "Technology",
                "keyword": keyword
            })
            
    # Calculate sentiments
    texts = [p["text"] for p in relevant]
    sentiment_counts = ml_service.analyze_sentiment_scores(texts)

    # Time series
    daily = {}
    for p in relevant:
        d = p["timestamp"][:10]
        daily[d] = daily.get(d, 0) + 1
        
    sorted_dates = sorted(daily.keys())
    history = [{"date": d, "volume": daily[d]} for d in sorted_dates]
    
    # Related Keywords
    all_tokens = []
    for p in relevant:
        all_tokens.extend(ml_service.preprocess_text(p["text"]))
    from collections import Counter
    related = [k for k, v in Counter(all_tokens).most_common(15) if k != keyword_lower and len(k) > 3]

    # Engagement
    likes = sum(p["engagement"]["likes"] for p in relevant)
    comments = sum(p["engagement"]["comments"] for p in relevant)
    shares = sum(p["engagement"]["shares"] for p in relevant)
    views = sum(p["engagement"].get("views", p["engagement"]["likes"] * 10) for p in relevant)
    
    eng_rate = round(((likes + comments + shares) / (views if views > 0 else 1)) * 100, 2)
    eng_score = round(min(100, (likes + comments * 3 + shares * 5) / 100), 1)

    # Fetch real API integrations concurrently
    import asyncio
    news_data, youtube_data, ai_analysis = await asyncio.gather(
        news_service.fetch_news(keyword),
        youtube_service.fetch_youtube_videos(keyword),
        gemini_service.generate_trend_analysis(keyword)
    )

    return {
        "keyword": keyword,
        "total_mentions": len(relevant),
        "sentiment": sentiment_counts,
        "history": history,
        "related": related[:8],
        "engagement": {
            "likes": likes,
            "comments": comments,
            "shares": shares,
            "views": views,
            "rate": eng_rate,
            "score": eng_score
        },
        "news": news_data,
        "youtube": youtube_data,
        "ai_analysis": ai_analysis
    }

@router.get("/forecast")
async def forecast(keyword: str):
    # Fetch base history
    keyword_lower = keyword.lower()
    relevant = [p for p in GLOBAL_DATASET if keyword_lower in p["text"].lower() or keyword_lower in p.get("keyword", "").lower()]
    
    if not relevant:
        relevant = [{"timestamp": (datetime.now() - timedelta(days=d)).isoformat(), "engagement": {"likes": 1}} for d in range(30)]

    daily = {}
    for p in relevant:
        d = p["timestamp"][:10]
        daily[d] = daily.get(d, 0) + 1
        
    sorted_dates = sorted(daily.keys())
    volumes = [daily[d] for d in sorted_dates]
    
    predictions, lower, upper = ml_service.forecast_trend_rf(sorted_dates, volumes, forecast_days=10)
    
    last_date = datetime.strptime(sorted_dates[-1], "%Y-%m-%d") if sorted_dates else datetime.now()
    forecast_data = []
    for idx, p in enumerate(predictions):
        f_date = (last_date + timedelta(days=idx + 1)).strftime("%Y-%m-%d")
        forecast_data.append({
            "date": f_date,
            "forecast": p,
            "lower": lower[idx],
            "upper": upper[idx]
        })
        
    growth = round(random.uniform(5, 95), 1)
    return {
        "keyword": keyword,
        "forecast": forecast_data,
        "metrics": {
            "score": round(50 + (growth * 0.5), 1),
            "growth": growth,
            "momentum": round(random.uniform(0.1, 0.99), 2),
            "peak_probability": round(random.uniform(10, 95), 1),
            "confidence_score": round(random.uniform(0.7, 0.98), 2)
        }
    }

@router.get("/compare")
async def compare(kw1: str, kw2: str, user: Optional[Profile] = Depends(get_current_user), db: Session = Depends(get_db)):
    if user:
        compare_record = ComparisonHistory(user_id=user.id, keyword_1=kw1, keyword_2=kw2)
        db.add(compare_record)
        db.commit()
        
    # Analyze both keywords
    # Simulate data fetching for comparing
    kw1_analysis = await analyze(kw1, user=None, db=db)
    kw2_analysis = await analyze(kw2, user=None, db=db)
    
    ai_comparison = await gemini_service.generate_comparison_summary(kw1, kw2)
    
    return {
        "keyword_1": kw1,
        "keyword_2": kw2,
        "analysis_1": {
            "keyword": kw1,
            "total_mentions": kw1_analysis["total_mentions"],
            "sentiment": kw1_analysis["sentiment"],
            "engagement": kw1_analysis["engagement"],
            "history": kw1_analysis["history"]
        },
        "analysis_2": {
            "keyword": kw2,
            "total_mentions": kw2_analysis["total_mentions"],
            "sentiment": kw2_analysis["sentiment"],
            "engagement": kw2_analysis["engagement"],
            "history": kw2_analysis["history"]
        },
        "ai_comparison": ai_comparison
    }

@router.get("/history/recent")
async def get_recent_searches(user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    searches = db.query(SearchHistory).filter(SearchHistory.user_id == user.id).order_by(SearchHistory.created_at.desc()).limit(10).all()
    return [{"keyword": s.keyword, "created_at": s.created_at} for s in searches]

@router.get("/history/comparisons")
async def get_recent_comparisons(user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    comparisons = db.query(ComparisonHistory).filter(ComparisonHistory.user_id == user.id).order_by(ComparisonHistory.created_at.desc()).limit(10).all()
    return [{"keyword_1": c.keyword_1, "keyword_2": c.keyword_2, "created_at": c.created_at} for c in comparisons]

@router.get("/dashboard")
async def dashboard_kpis():
    keywords = [item["keyword"] for item in GLOBAL_DATASET]
    total_mentions = len(GLOBAL_DATASET)
    
    total_likes = sum(item["engagement"]["likes"] for item in GLOBAL_DATASET)
    total_comments = sum(item["engagement"]["comments"] for item in GLOBAL_DATASET)
    total_shares = sum(item["engagement"]["shares"] for item in GLOBAL_DATASET)
    total_engagement = total_likes + total_comments + total_shares
    
    all_texts = [item["text"] for item in GLOBAL_DATASET]
    s_counts = ml_service.analyze_sentiment_scores(all_texts[:500])
    
    from collections import Counter
    cats = [item["category"] for item in GLOBAL_DATASET]
    cat_counts = Counter(cats)
    heatmap = [{"category": cat, "intensity": round((count / len(GLOBAL_DATASET)) * 100, 1)} for cat, count in cat_counts.items()]
    
    req_cats = ["Technology", "Sports", "Finance", "Politics", "Lifestyle", "Entertainment", "Gaming", "Health", "Education"]
    for rc in req_cats:
        if not any(h["category"] == rc for h in heatmap):
            heatmap.append({"category": rc, "intensity": round(random.uniform(10, 40), 1)})

    countries = ["USA", "India", "UK", "Canada", "Germany", "Australia", "Japan"]
    country_popularity = [{"country": c, "popularity": round(random.uniform(30, 98), 1)} for c in countries]
    
    time_series = {
        "hourly": [{"time": f"{h:02d}:00", "volume": random.randint(150, 450)} for h in range(24)],
        "daily": [{"time": (datetime.now() - timedelta(days=d)).strftime("%a"), "volume": random.randint(1200, 2800)} for d in range(7)][::-1],
        "weekly": [{"time": f"Week {w}", "volume": random.randint(8000, 15000)} for w in range(1, 5)],
        "monthly": [{"time": (datetime.now() - timedelta(days=d*30)).strftime("%b"), "volume": random.randint(35000, 52000)} for d in range(6)][::-1]
    }
    
    clusters = ml_service.cluster_topics(GLOBAL_DATASET)
    
    all_hashtags = []
    for item in GLOBAL_DATASET:
        tags = re.findall(r'#(\w+)', item["text"])
        all_hashtags.extend(tags)
    hashtag_counts = Counter(all_hashtags).most_common(20)
    top_hashtags = [
        {"tag": f"#{tag}", "count": count, "growth": round(random.uniform(5, 80), 1), "virality": round(random.uniform(20, 95), 1)}
        for tag, count in hashtag_counts if tag.lower() not in ["technology", "sports", "finance", "lifestyle", "politics"]
    ]

    return {
        "kpis": {
            "trend_strength": round(random.uniform(68, 75), 1),
            "total_mentions": total_mentions,
            "total_engagement": total_engagement,
            "sentiment": s_counts,
            "virality_score": round(random.uniform(80, 88), 1),
            "growth_rate": round(random.uniform(12, 18), 1)
        },
        "heatmap": heatmap,
        "countries": country_popularity,
        "time_analysis": time_series,
        "clusters": clusters,
        "top_hashtags": top_hashtags[:10]
    }


@router.get("/dashboard/live")
async def dashboard_live(keyword: str = "AI", user: Optional[Profile] = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Keyword-driven dashboard: fetches real News, YouTube, and Gemini data.
    Caches results in-memory for 10 minutes to avoid redundant API calls.
    """
    import asyncio, time, hashlib
    global _dashboard_cache
    if not hasattr(dashboard_live, "_cache"):
        dashboard_live._cache = {}
    
    cache_key = keyword.lower().strip()
    now = time.time()
    
    # Return cached result if < 10 minutes old
    if cache_key in dashboard_live._cache:
        cached_at, cached_data = dashboard_live._cache[cache_key]
        if now - cached_at < 600:
            return cached_data
    
    # Fetch real data in parallel
    try:
        news_data, youtube_data, ai_analysis = await asyncio.gather(
            news_service.fetch_news(keyword),
            youtube_service.fetch_youtube_videos(keyword),
            gemini_service.generate_trend_analysis(keyword)
        )
    except Exception as e:
        return {"error": f"Failed to fetch live data: {str(e)}", "keyword": keyword}
    
    news_data = news_data or []
    youtube_data = youtube_data or []

    # Save search history
    if user:
        try:
            record = SearchHistory(user_id=user.id, keyword=keyword)
            db.add(record)
            db.commit()
        except:
            pass

    # Compute KPIs from real data
    news_count = len(news_data)
    yt_count = len(youtube_data)
    total_mentions = news_count + yt_count

    yt_likes = sum(int(v.get("likes", 0)) for v in youtube_data)
    yt_views = sum(int(v.get("views", 0)) for v in youtube_data)
    yt_comments = sum(int(v.get("comments", 0) if "comments" in v else 0) for v in youtube_data)
    total_engagement = yt_likes + yt_views + yt_comments

    # Sentiment from AI analysis
    sentiment = {"positive": 0, "neutral": 0, "negative": 0}
    if ai_analysis:
        sraw = ai_analysis.get("sentiment_summary", "")
        if isinstance(sraw, dict):
            sentiment = sraw
        else:
            stxt = str(sraw).lower()
            if "positive" in stxt or "bullish" in stxt or "optimistic" in stxt:
                sentiment = {"positive": 65, "neutral": 25, "negative": 10}
            elif "negative" in stxt or "bearish" in stxt or "pessimistic" in stxt:
                sentiment = {"positive": 20, "neutral": 30, "negative": 50}
            else:
                sentiment = {"positive": 40, "neutral": 40, "negative": 20}

    # Trend score from news recency + youtube views
    trend_strength = min(99, round(
        (news_count * 5) + (yt_count * 8) + (min(yt_views, 10_000_000) / 200_000)
    , 1))

    # Growth rate from most recent vs oldest YouTube video dates
    growth_rate = 0.0
    if len(youtube_data) >= 2:
        dates = []
        for v in youtube_data:
            try:
                d = v.get("published_at", "")
                if d:
                    dates.append(datetime.strptime(d[:10], "%Y-%m-%d"))
            except:
                pass
        if len(dates) >= 2:
            dates.sort()
            days_span = max(1, (dates[-1] - dates[0]).days)
            growth_rate = round((yt_count / days_span) * 10, 1)

    # Build trend volume over time from news publish dates
    daily_vol: dict = {}
    for article in news_data:
        d = (article.get("publishedAt") or "")[:10]
        if d:
            daily_vol[d] = daily_vol.get(d, 0) + 1
    for video in youtube_data:
        d = (video.get("published_at") or "")[:10]
        if d:
            daily_vol[d] = daily_vol.get(d, 0) + 2

    history = [{"date": d, "volume": v} for d, v in sorted(daily_vol.items())[-30:]]

    # Trending hashtags derived from news titles
    from collections import Counter
    words = []
    for a in news_data:
        title = a.get("title", "") or ""
        for tok in title.split():
            tok = tok.strip(".,!?\"'()[]#@").lower()
            if len(tok) > 3 and tok.isalpha():
                words.append(tok)
    stopwords = {"that","this","with","from","have","will","they","been","were","your","more","also","than","when","into","just","like","over","some","such","then","what","other","after","about","which","their","there","these","those","being","would","should","could","while","where","since","until","though","because","however","therefore"}
    top_words = [(w, c) for w, c in Counter(words).most_common(30) if w not in stopwords and w.lower() != keyword.lower()][:8]
    top_hashtags = [{"tag": f"#{w}", "count": c, "growth": round(c * 1.5, 1)} for w, c in top_words]

    # Category intensity from news sources
    source_counts = Counter(a.get("source", "Unknown") for a in news_data)
    heatmap = [{"category": s, "intensity": min(99, round(c * 10, 1))} for s, c in source_counts.most_common(9)]

    # AI insights block
    ai_insights = {}
    if ai_analysis:
        ai_insights = {
            "executive_summary": ai_analysis.get("executive_summary", ""),
            "sentiment_summary": ai_analysis.get("sentiment_summary", ""),
            "business_insights": ai_analysis.get("business_insights", ""),
            "future_prediction": ai_analysis.get("future_prediction", ""),
            "content_suggestions": ai_analysis.get("content_suggestions", [])
        }

    result = {
        "keyword": keyword,
        "kpis": {
            "trend_strength": trend_strength,
            "total_mentions": total_mentions,
            "total_engagement": total_engagement,
            "growth_rate": growth_rate,
            "sentiment": sentiment,
            "news_count": news_count,
            "youtube_count": yt_count,
            "youtube_views": yt_views,
            "youtube_likes": yt_likes,
        },
        "history": history,
        "top_hashtags": top_hashtags,
        "heatmap": heatmap,
        "news": news_data[:5],
        "youtube": youtube_data[:5],
        "ai_insights": ai_insights,
        "cached_at": datetime.now().isoformat()
    }

    dashboard_live._cache[cache_key] = (now, result)
    return result

@router.get("/compare/full")
async def compare_full(kw1: str, kw2: str, user: Optional[Profile] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Enhanced compare endpoint with full news + youtube data per keyword."""
    import asyncio, time
    if user:
        try:
            record = ComparisonHistory(user_id=user.id, keyword_1=kw1, keyword_2=kw2)
            db.add(record); db.commit()
        except: pass

    # Check cache
    if not hasattr(compare_full, "_cache"):
        compare_full._cache = {}
    cache_key = f"{kw1.lower()}|{kw2.lower()}"
    now = time.time()
    if cache_key in compare_full._cache:
        cached_at, cached_data = compare_full._cache[cache_key]
        if now - cached_at < 600:
            return cached_data

    async def analyze_kw(kw):
        news, yt, ai = await asyncio.gather(
            news_service.fetch_news(kw),
            youtube_service.fetch_youtube_videos(kw),
            gemini_service.generate_trend_analysis(kw)
        )
        news = news or []; yt = yt or []
        daily: dict = {}
        for a in news:
            d = (a.get("publishedAt") or "")[:10]
            if d: daily[d] = daily.get(d, 0) + 1
        for v in yt:
            d = (v.get("published_at") or "")[:10]
            if d: daily[d] = daily.get(d, 0) + 2
        history = [{"date": d, "volume": v} for d, v in sorted(daily.items())]
        total_mentions = len(news) + len(yt)
        yt_likes = sum(int(v.get("likes", 0)) for v in yt)
        yt_views = sum(int(v.get("views", 0)) for v in yt)
        sentiment = {"positive": 0, "neutral": 0, "negative": 0}
        if ai:
            sraw = str(ai.get("sentiment_summary", "")).lower()
            if "positive" in sraw or "bullish" in sraw:
                sentiment = {"positive": 65, "neutral": 25, "negative": 10}
            elif "negative" in sraw or "bearish" in sraw:
                sentiment = {"positive": 20, "neutral": 30, "negative": 50}
            else:
                sentiment = {"positive": 40, "neutral": 40, "negative": 20}
        return {
            "total_mentions": total_mentions,
            "sentiment": sentiment,
            "engagement": {"likes": yt_likes, "comments": 0, "shares": 0, "views": yt_views},
            "history": history,
            "news": news[:5],
            "youtube": yt[:5],
            "ai": ai
        }

    a1, a2 = await asyncio.gather(analyze_kw(kw1), analyze_kw(kw2))
    ai_comparison = await gemini_service.generate_comparison_summary(kw1, kw2)

    result = {
        "keyword_1": kw1, "keyword_2": kw2,
        "analysis_1": a1, "analysis_2": a2,
        "ai_comparison": ai_comparison
    }
    compare_full._cache[cache_key] = (now, result)
    return result
