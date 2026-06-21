import random
import datetime
import json
import os

TOPICS = {
    "Technology": ["AI", "OpenAI", "Nvidia", "SaaS", "Apple", "Quantum Computing", "Cybersecurity", "Web3", "Cloud", "Sora"],
    "Sports": ["Football", "NBA", "F1", "Olympics", "Premier League", "Cricket", "Tennis", "UFC", "Golf", "Champions League"],
    "Finance": ["Stocks", "Crypto", "Bitcoin", "Inflation", "Nvidia", "Gold", "Real Estate", "ETF", "Fed", "WallStreet"],
    "Lifestyle": ["Fitness", "Travel", "Vegan", "Meditation", "Home Office", "Skincare", "Photography", "Gaming", "Cooking", "Mindfulness"],
    "Politics": ["Election", "Policy", "Global", "Climate", "Reform", "Democracy", "Debate", "Economy", "Infrastructure", "Trade"]
}

SENTIMENTS = {
    "positive": ["excellent", "breakthrough", "bullish", "record", "growth", "win", "amazing", "innovation", "best", "perfect"],
    "negative": ["crisis", "bearish", "fall", "crash", "loss", "warning", "fail", "terrible", "risk", "shortage"]
}

def generate_text(topic, keyword):
    base = [
        f"The latest in {topic}: {keyword} is absolutely taking over the conversation.",
        f"Just saw a major update regarding {keyword}. This is huge!",
        f"Is {keyword} overrated or actually the future? Let's discuss.",
        f"Check out this deep dive into {keyword} and its impact on {topic}.",
        f"Why everyone is talking about {keyword} right now.",
        f"Huge news: {keyword} just hit a new milestone in the {topic} sector.",
        f"The {topic} industry will never be the same after {keyword}.",
        f"My honest opinion on {keyword}: it's a {random.choice(['game changer', 'total bust', 'solid investment'])}."
    ]
    sentiment = random.choice(["positive", "negative", "neutral"])
    extra = random.choice(SENTIMENTS.get(sentiment, ["interesting"])) if sentiment != "neutral" else ""
    return random.choice(base) + " " + extra + f" #{keyword} #{topic}"

def generate_mock_dataset(num_posts=5000):
    posts = []
    now = datetime.datetime.now()
    
    for _ in range(num_posts):
        category = random.choice(list(TOPICS.keys()))
        keyword = random.choice(TOPICS[category])
        text = generate_text(category, keyword)
        
        # Random timestamp within last 90 days
        days_ago = random.randint(0, 90)
        timestamp = (now - datetime.timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))).isoformat()
        
        posts.append({
            "text": text,
            "timestamp": timestamp,
            "user": f"user_{random.randint(1, 2000)}",
            "engagement": {
                "likes": random.randint(10, 10000),
                "comments": random.randint(5, 500),
                "shares": random.randint(2, 200)
            },
            "category": category,
            "keyword": keyword
        })
    
    return posts

if __name__ == "__main__":
    print("Generating advanced dataset...")
    data = generate_mock_dataset()
    with open("dataset.json", "w") as f:
        json.dump(data, f, indent=2)
    print(f"Dataset generated with {len(data)} posts.")
