import httpx
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.config import YOUTUBE_API_KEY

def get_mock_youtube(keyword: str) -> List[Dict[str, Any]]:
    now = datetime.now()
    
    videos = {
        "ai": [
            {"title": "The Future of AI: What to Expect in 2026", "channel": "Tech Frontiers", "views": 250000, "likes": 18000},
            {"title": "OpenAI Reasoning Models Explained!", "channel": "Code Academy", "views": 85000, "likes": 5200},
            {"title": "Is NVIDIA's AI Bubble About to Pop?", "channel": "Finance Hub", "views": 420000, "likes": 29000},
            {"title": "Building a Modern App with Gemini API", "channel": "Dev Bytes", "views": 15000, "likes": 980}
        ],
        "bitcoin": [
            {"title": "Bitcoin Price Targets for This Week!", "channel": "Crypto Daily", "views": 120000, "likes": 9500},
            {"title": "Why Ethereum Gas Fees Dropped to Zero (Almost)", "channel": "Web3 Watch", "views": 65000, "likes": 4100},
            {"title": "How to Secure Your Crypto Wallet in 2026", "channel": "Security Sherpa", "views": 35000, "likes": 2800},
            {"title": "Spot ETF Inflows Reach All-Time Highs", "channel": "Market Focus", "views": 180000, "likes": 14000}
        ],
        "tesla": [
            {"title": "Tesla FSD 12.5 Full Self-Driving Review", "channel": "EV Enthusiast", "views": 340000, "likes": 22000},
            {"title": "We Drove the Tesla Cybercab! Real Hands-On", "channel": "Auto World", "views": 980000, "likes": 75000},
            {"title": "Why Tesla Model Y is the Best Selling Car", "channel": "Gear Shift", "views": 150000, "likes": 8900},
            {"title": "Gigafactory Shanghai Expansion Tour", "channel": "Inside EV", "views": 89000, "likes": 4300}
        ]
    }
    
    kw_lower = keyword.lower()
    vid_list = []
    
    if kw_lower in videos:
        vid_list = videos[kw_lower]
    elif "crypto" in kw_lower or "ethereum" in kw_lower:
        vid_list = videos["bitcoin"]
    elif "chatgpt" in kw_lower or "nvidia" in kw_lower or "google" in kw_lower or "technology" in kw_lower:
        vid_list = videos["ai"]
    else:
        vid_list = [
            {"title": f"The Ultimate Guide to Understanding {keyword}", "channel": f"{keyword} Focus", "views": random.randint(5000, 100000), "likes": random.randint(200, 8000)},
            {"title": f"Why is {keyword} Trending Worldwide Right Now?", "channel": "Trend Watcher", "views": random.randint(10000, 250000), "likes": random.randint(500, 15000)},
            {"title": f"Top 5 Things You Didn't Know About {keyword}", "channel": "Fact Sphere", "views": random.randint(20000, 500000), "likes": random.randint(1000, 30000)},
            {"title": f"{keyword} Tutorial: Step-by-Step Implementation", "channel": "Tech Labs", "views": random.randint(2000, 50000), "likes": random.randint(100, 3000)}
        ]
        
    results = []
    for idx, v in enumerate(vid_list):
        days_ago = idx * 2 + 1
        published_at = (now - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        results.append({
            "id": f"mock_vid_{idx}",
            "title": v["title"],
            "channel": v["channel"],
            "published_at": published_at,
            "thumbnail": f"https://images.unsplash.com/photo-{1610000000000 + idx*1200}?auto=format&fit=crop&w=400&q=80",
            "views": v["views"],
            "likes": v["likes"]
        })
        
    return results

async def fetch_youtube_videos(keyword: str) -> List[Dict[str, Any]]:
    if not YOUTUBE_API_KEY:
        return get_mock_youtube(keyword)
        
    search_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={keyword}&maxResults=5&type=video&key={YOUTUBE_API_KEY}"
    
    try:
        async with httpx.AsyncClient() as client:
            # Step 1: Search for videos
            res = await client.get(search_url, timeout=10.0)
            if res.status_code != 200:
                print(f"YouTube Search API error {res.status_code}: {res.text}")
                return get_mock_youtube(keyword)
                
            search_data = res.json()
            items = search_data.get("items", [])
            
            if not items:
                return []
                
            # Extract video IDs
            video_ids = [item["id"]["videoId"] for item in items if "videoId" in item.get("id", {})]
            if not video_ids:
                return []
                
            # Step 2: Get video statistics
            ids_str = ",".join(video_ids)
            details_url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id={ids_str}&key={YOUTUBE_API_KEY}"
            
            details_res = await client.get(details_url, timeout=10.0)
            if details_res.status_code != 200:
                print(f"YouTube Details API error {details_res.status_code}: {details_res.text}")
                # Return search results without views/likes
                results = []
                for item in items:
                    snippet = item.get("snippet", {})
                    results.append({
                        "id": item["id"]["videoId"],
                        "title": snippet.get("title", ""),
                        "channel": snippet.get("channelTitle", ""),
                        "published_at": snippet.get("publishedAt", "")[:10],
                        "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                        "views": 0,
                        "likes": 0
                    })
                return results
                
            details_data = details_res.json()
            detail_items = details_data.get("items", [])
            
            results = []
            for item in detail_items:
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                
                results.append({
                    "id": item["id"],
                    "title": snippet.get("title", ""),
                    "channel": snippet.get("channelTitle", ""),
                    "published_at": snippet.get("publishedAt", "")[:10],
                    "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                    "views": int(stats.get("viewCount", 0)),
                    "likes": int(stats.get("likeCount", 0))
                })
            return results
            
    except Exception as e:
        print(f"YouTube client exception: {e}")
        return get_mock_youtube(keyword)
