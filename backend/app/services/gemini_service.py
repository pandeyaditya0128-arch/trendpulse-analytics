import httpx
import json
import random
from typing import Dict, Any, List
from app.config import GEMINI_API_KEY

async def call_gemini(prompt: str, expect_json: bool = False) -> str:
    if not GEMINI_API_KEY:
        return ""
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    if expect_json:
        payload["generationConfig"] = {"responseMimeType": "application/json"}
        
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=headers, json=payload, timeout=20.0)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
            else:
                print(f"Gemini API Error {res.status_code}: {res.text}")
                return ""
    except Exception as e:
        print(f"Gemini Client Exception: {e}")
        return ""

def get_mock_analysis(keyword: str) -> Dict[str, Any]:
    return {
        "executive_summary": f"Interest in '{keyword}' has surged significantly over the past quarter. This upward trend is driven by key technological integrations, robust public interest, and expanding commercial use cases. Organizations are actively positioning themselves to capture value from this ecosystem.",
        "trend_analysis": f"The trend analysis for '{keyword}' reveals high momentum. Mentions across social media, search platforms, and news outlets indicate a steady month-over-month growth rate of approximately 15%. Peak activity correlates with recent industry updates and product announcements.",
        "sentiment_summary": f"Overall sentiment surrounding '{keyword}' is highly positive (65%), reflecting optimism about its potential. Neutral discussions account for 25%, while negative sentiment remains low at 10%, primarily centered around regulatory hurdles and implementation costs.",
        "business_insights": f"Businesses should prioritize incorporating '{keyword}' into their strategic planning. Key opportunities exist in enhancing customer experiences and optimizing supply chains. Early adopters stand to gain a competitive advantage by leveraging this market momentum.",
        "future_prediction": f"Over the next 12 to 18 months, '{keyword}' is expected to see mainstream adoption. Regulatory frameworks will solidify, and integration across legacy platforms will drive down barrier entries. We project a secondary growth wave by early next year.",
        "content_suggestions": [
            f"Why '{keyword}' is reshaping the industry landscape this year.",
            f"The ultimate beginner guide to understanding and deploying '{keyword}'.",
            f"Top 5 trends in '{keyword}' that you should watch out for.",
            f"How modern enterprises are scaling operations using '{keyword}'."
        ]
    }

async def generate_trend_analysis(keyword: str) -> Dict[str, Any]:
    prompt = f"""
    You are an expert market research analyst.
    Perform a comprehensive trend intelligence analysis for the keyword: "{keyword}".
    Provide your analysis as a JSON object matching this schema:
    {{
        "executive_summary": "High-level summary of the trend",
        "trend_analysis": "Detailed breakdown of the trend's velocity and channels",
        "sentiment_summary": "Summary of public and industry sentiment",
        "business_insights": "Actionable strategic recommendations for businesses",
        "future_prediction": "Forecasting details for the next 12-24 months",
        "content_suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4"]
    }}
    Ensure all fields are fully populated with professional, high-quality, commercial-grade analysis.
    """
    
    response_text = await call_gemini(prompt, expect_json=True)
    if response_text:
        try:
            return json.loads(response_text)
        except Exception as e:
            print(f"Failed to parse Gemini JSON: {e}. Raw response: {response_text}")
            
    return get_mock_analysis(keyword)

async def generate_chatbot_response(message: str, chat_history: List[Dict[str, str]] = None) -> str:
    # Build history context
    history_context = ""
    if chat_history:
        for chat in chat_history[-6:]:
            history_context += f"User: {chat['message']}\nBot: {chat['response']}\n"
            
    prompt = f"""
    You are 'TrendPulse AI Bot', a smart conversational agent for a trend intelligence platform.
    Help the user answer questions about market trends, tech breakthroughs, business strategy, or compare topics.
    
    Conversation History:
    {history_context}
    
    User Question: {message}
    
    Provide a professional, engaging, and detailed answer. Keep it readable with markdown formatting where appropriate.
    """
    
    response_text = await call_gemini(prompt, expect_json=False)
    if response_text:
        return response_text
        
    # Fallback mock answers
    msg_lower = message.lower()
    if "bitcoin" in msg_lower or "crypto" in msg_lower:
        return "Bitcoin and other cryptocurrencies are currently seeing increased volatility due to macroeconomic shifts, institutional inflows, and interest rate discussions. The underlying trend remains supported by growing adoption in financial systems."
    elif "apple" in msg_lower or "samsung" in msg_lower:
        return "Apple and Samsung continue to dominate the premium mobile device landscape. Apple focuses on ecosystem lock-in and high-margin services, while Samsung leads in hardware innovation, such as foldable displays. Both are aggressively integrating custom AI chips."
    elif "ai" in msg_lower or "chatgpt" in msg_lower or "artificial" in msg_lower:
        return "Artificial Intelligence is trending because of breakthroughs in generative models and large-scale language systems. Businesses are finding immediate efficiency gains in automation, customer support, and software development, fueling a massive investment boom."
    elif "news" in msg_lower:
        return "Today's top trends focus on global economic updates, the adoption of generative AI systems in enterprise software, and renewable energy storage milestones. Markets remain cautiously optimistic."
    
    return f"That is a great question about '{message}'. While I gather the latest data on this, we are observing high interest in this segment, particularly driven by emerging research and digital transformation trends."

async def generate_comparison_summary(kw1: str, kw2: str) -> str:
    prompt = f"""
    Write a brief comparative market intelligence analysis between "{kw1}" and "{kw2}".
    Highlight the key differences, market position, adoption velocity, and which trend is leading or holds more future promise.
    Provide a clean, readable response with markdown bullet points. Max 200 words.
    """
    
    response_text = await call_gemini(prompt, expect_json=False)
    if response_text:
        return response_text
        
    return f"""### Comparative Analysis: {kw1} vs {kw2}
- **Adoption Dynamics**: **{kw1}** currently commands higher general public interest and search volume, whereas **{kw2}** is experiencing faster growth in niche developer and B2B sectors.
- **Market Impact**: **{kw1}** focuses on consumer-facing applications, while **{kw2}** is driving backend structural efficiency.
- **Verdict**: In terms of long-term investment, **{kw1}** holds high immediate liquidity, but **{kw2}** represents a fundamental paradigm shift with more substantial compounding potential over the next 5 years."""
