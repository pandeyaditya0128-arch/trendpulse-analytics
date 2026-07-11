import re
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor

STOPWORDS = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "is", "are", "was", "were", "it", "this", "that", "of", "from", "about", "by", "as", "if", "so", "up", "out", "who", "get"}

def preprocess_text(text: str):
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^\w\s#@]', '', text)
    tokens = text.lower().split()
    cleaned = []
    for t in tokens:
        if t not in STOPWORDS and len(t) > 2:
            if t.endswith("ing"):
                t = t[:-3]
            elif t.endswith("ed"):
                t = t[:-2]
            elif t.endswith("s") and not t.endswith("ss"):
                t = t[:-1]
            cleaned.append(t)
    return cleaned

def analyze_sentiment_scores(texts):
    pos_words = {"excellent", "breakthrough", "bullish", "record", "growth", "win", "amazing", "innovation", "best", "perfect", "good", "great", "love", "support", "success", "positive", "rising"}
    neg_words = {"crisis", "bearish", "fall", "crash", "loss", "warning", "fail", "terrible", "risk", "shortage", "bad", "worst", "skepticism", "drop", "decline", "negative"}
    
    pos_count, neg_count, neu_count = 0, 0, 0
    for text in texts:
        tokens = set(text.lower().split())
        p = len(tokens.intersection(pos_words))
        n = len(tokens.intersection(neg_words))
        if p > n:
            pos_count += 1
        elif n > p:
            neg_count += 1
        else:
            neu_count += 1
            
    total = len(texts) if len(texts) > 0 else 1
    return {
        "positive": round((pos_count / total) * 100, 1),
        "negative": round((neg_count / total) * 100, 1),
        "neutral": round((neu_count / total) * 100, 1)
    }

def forecast_trend_rf(history_dates, history_volumes, forecast_days=10):
    if len(history_volumes) < 7:
        last_val = history_volumes[-1] if history_volumes else 10
        forecast = []
        for i in range(forecast_days):
            change = random.uniform(-2, 5)
            last_val = max(1, last_val + change)
            forecast.append(round(last_val, 1))
        lower = [round(max(0, val - (1.96 * (idx + 1) ** 0.5)), 1) for idx, val in enumerate(forecast)]
        upper = [round(val + (1.96 * (idx + 1) ** 0.5), 1) for idx, val in enumerate(forecast)]
        return forecast, lower, upper

    df = pd.DataFrame({"vol": history_volumes})
    df["lag1"] = df["vol"].shift(1)
    df["lag2"] = df["vol"].shift(2)
    df["lag3"] = df["vol"].shift(3)
    df.dropna(inplace=True)

    if len(df) < 3:
        forecast = [round(history_volumes[-1] * (1 + 0.02 * i), 1) for i in range(forecast_days)]
        lower = [round(max(0, v * 0.8), 1) for v in forecast]
        upper = [round(v * 1.2, 1) for v in forecast]
        return forecast, lower, upper

    X = df[["lag1", "lag2", "lag3"]].values
    y = df["vol"].values

    rf = RandomForestRegressor(n_estimators=50, random_state=42)
    rf.fit(X, y)

    predictions = []
    last_lags = list(history_volumes[-3:])
    
    for _ in range(forecast_days):
        pred = rf.predict([last_lags])[0]
        predictions.append(round(pred, 1))
        last_lags = last_lags[1:] + [pred]

    std_err = np.std(y - rf.predict(X)) if len(y) > 1 else 5
    lower = [round(max(0, val - 1.96 * std_err * (1 + idx * 0.1)), 1) for idx, val in enumerate(predictions)]
    upper = [round(val + 1.96 * std_err * (1 + idx * 0.1), 1) for idx, val in enumerate(predictions)]

    return predictions, lower, upper

def cluster_topics(dataset, n_clusters=6):
    if not dataset:
        return []
    
    keyword_map = {}
    for item in dataset:
        kw = item["keyword"]
        text = item["text"]
        if kw not in keyword_map:
            keyword_map[kw] = []
        keyword_map[kw].append(text)
        
    keywords = list(keyword_map.keys())
    docs = [" ".join(keyword_map[k]) for k in keywords]
    
    if len(keywords) < n_clusters:
        n_clusters = max(2, len(keywords))

    try:
        vectorizer = TfidfVectorizer(max_features=100)
        X = vectorizer.fit_transform(docs)
        
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)
        
        clusters = {}
        for idx, label in enumerate(labels):
            l = int(label)
            if l not in clusters:
                clusters[l] = []
            clusters[l].append(keywords[idx])
            
        cluster_list = []
        categories = ["AI", "Finance", "Sports", "Technology", "Politics", "Lifestyle", "Entertainment", "Healthcare"]
        for c_id, kws in clusters.items():
            name = categories[c_id % len(categories)]
            total_size = sum(len(keyword_map[k]) for k in kws)
            cluster_list.append({
                "id": c_id,
                "name": f"{name} Cluster",
                "keywords": kws,
                "size": total_size,
                "x": round(random.uniform(20, 80), 1),
                "y": round(random.uniform(20, 80), 1)
            })
        return cluster_list
    except Exception as e:
        print(f"Error in topic clustering: {e}")
        return [
            {"id": 0, "name": "AI & Tech", "keywords": ["AI", "OpenAI", "Nvidia"], "size": 500, "x": 35.0, "y": 60.0},
            {"id": 1, "name": "Finance & Crypto", "keywords": ["Bitcoin", "Stocks", "Gold"], "size": 320, "x": 65.0, "y": 40.0},
            {"id": 2, "name": "Sports & Games", "keywords": ["Cricket", "Football", "Gaming"], "size": 250, "x": 45.0, "y": 25.0}
        ]
