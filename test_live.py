import httpx, json

BASE = "http://localhost:8000"
H = {"Authorization": "Bearer mock-jwt-token-test"}

print("=== LIVE DASHBOARD ENDPOINT ===")
r = httpx.get(f"{BASE}/api/dashboard/live?keyword=AI", headers=H, timeout=35)
d = r.json()
print(f"Status: {r.status_code}")
print(f"Keyword: {d.get('keyword')}")
kpis = d.get("kpis", {})
print(f"Trend Strength: {kpis.get('trend_strength')}")
print(f"Total Mentions: {kpis.get('total_mentions')}")
print(f"Total Engagement: {kpis.get('total_engagement')}")
print(f"News Count: {kpis.get('news_count')}")
print(f"YouTube Count: {kpis.get('youtube_count')}")
print(f"Sentiment: {kpis.get('sentiment')}")
print(f"History Points: {len(d.get('history', []))}")
print(f"Hashtags: {len(d.get('top_hashtags', []))}")
print(f"AI Insights Keys: {list(d.get('ai_insights', {}).keys())}")

print("\n=== COMPARE/FULL ENDPOINT ===")
r2 = httpx.get(f"{BASE}/api/compare/full?kw1=Bitcoin&kw2=Ethereum", headers=H, timeout=45)
d2 = r2.json()
print(f"Status: {r2.status_code}")
print(f"KW1: {d2.get('keyword_1')}, Mentions: {d2.get('analysis_1', {}).get('total_mentions')}")
print(f"KW2: {d2.get('keyword_2')}, Mentions: {d2.get('analysis_2', {}).get('total_mentions')}")
