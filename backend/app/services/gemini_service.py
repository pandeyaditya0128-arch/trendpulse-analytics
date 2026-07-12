import httpx
import json
from typing import Dict, Any, List
from app.config import GEMINI_API_KEY

class GeminiAPIError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

async def call_gemini(prompt: str, expect_json: bool = False) -> str:
    if not GEMINI_API_KEY:
        raise GeminiAPIError("GEMINI_API_KEY is missing", 401)
    
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
            res = await client.post(url, headers=headers, json=payload, timeout=30.0)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
            elif res.status_code == 429:
                # Log exact API error for debugging
                print(f"[DEBUG] Gemini API Quota Exceeded (429): {res.text}")
                raise GeminiAPIError("Gemini daily API quota has been reached. Please try again after the quota resets.", 429)
            else:
                # Log other exact API errors
                print(f"[DEBUG] Gemini API Error {res.status_code}: {res.text}")
                raise GeminiAPIError(f"Gemini API returned status code {res.status_code}", res.status_code)
    except httpx.HTTPError as e:
        print(f"[DEBUG] Gemini Client HTTP Exception: {e}")
        raise GeminiAPIError(f"Gemini API connection error: {str(e)}", 500)

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
    
    try:
        response_text = await call_gemini(prompt, expect_json=True)
        if response_text:
            return json.loads(response_text)
    except GeminiAPIError as e:
        print(f"[DEBUG] Trend analysis failed: {e.message}")
        if e.status_code == 429:
            return {
                "executive_summary": "Gemini daily API quota has been reached. Please try again after the quota resets.",
                "trend_analysis": "No live analysis available due to quota limits.",
                "sentiment_summary": "No sentiment analysis available.",
                "business_insights": "No business insights available.",
                "future_prediction": "No prediction available.",
                "content_suggestions": []
            }
    except Exception as e:
        print(f"[DEBUG] Trend analysis parsing error: {e}")
        
    return {
        "executive_summary": "An error occurred while generating analysis.",
        "trend_analysis": "",
        "sentiment_summary": "",
        "business_insights": "",
        "future_prediction": "",
        "content_suggestions": []
    }

async def generate_chatbot_response(
    message: str, 
    chat_history: List[Dict[str, str]] = None,
    dataset_context: str = "",
    live_context: str = "",
    user_name: str = "User"
) -> str:
    history_str = ""
    if chat_history:
        for chat in chat_history[-8:]:
            history_str += f"User: {chat['message']}\nBot: {chat['response']}\n"

    prompt = f"""
    You are 'TrendPulse AI Bot', the smart conversational AI assistant for the TrendPulse trend intelligence platform.
    Your tone is professional, analytical, insightful, and highly helpful.
    
    User details: Name is {user_name}.
    
    Conversation History:
    {history_str}
    
    {dataset_context}
    
    {live_context}
    
    User Question: {message}
    
    Instructions:
    1. If the dataset context contains information relevant to the user query, use it as primary ground truth to answer the question. Specifically analyze rows, columns, and content.
    2. If live news/YouTube context is present, summarize the highlights, key insights, sentiment trends, and future prediction based on that real live data.
    3. Generate a highly detailed, professional, structured response. Use markdown elements: headers (###), bullet points, bold text, and tables to format your response clearly.
    4. Provide different and fresh answers for different questions. Always utilize the provided context.
    """
    
    try:
        response_text = await call_gemini(prompt, expect_json=False)
        return response_text
    except GeminiAPIError as e:
        if e.status_code == 429:
            return "Gemini daily API quota has been reached. Please try again after the quota resets."
        return f"An API error occurred: {e.message}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"

async def generate_comparison_summary(kw1: str, kw2: str) -> str:
    prompt = f"""
    Write a brief comparative market intelligence analysis between "{kw1}" and "{kw2}".
    Highlight the key differences, market position, adoption velocity, and which trend is leading or holds more future promise.
    Provide a clean, readable response with markdown bullet points. Max 200 words.
    """
    try:
        response_text = await call_gemini(prompt, expect_json=False)
        return response_text
    except GeminiAPIError as e:
        print(f"[DEBUG] Comparison summary failed: {e.message}")
        if e.status_code == 429:
            return "Gemini daily API quota has been reached. Please try again after the quota resets."
        return f"Comparison Analysis: {kw1} vs {kw2} is currently unavailable."
    except Exception:
        return f"Comparison Analysis: {kw1} vs {kw2} is currently unavailable."
