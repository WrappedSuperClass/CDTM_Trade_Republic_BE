from openai import OpenAI
from fastapi import HTTPException
import os
from dotenv import load_dotenv
# Load environment variables
load_dotenv()

# Initialize OpenAI client
YOUR_API_KEY = os.getenv('PERPLEXITY_API_KEY')
client = OpenAI(api_key=YOUR_API_KEY, base_url="https://api.perplexity.ai")

async def get_weather_in_berlin():
    messages = [
        {
            "role": "system",
            "content": (
                "You are a real‑time financial summarization assistant. "
                "You have access to live market data, corporate news, and credible financial media. "
                "When asked for “stock movers,” you must: "
                " • Identify the securities with the largest absolute %‑price change within the requested window. "
                " • Explain only the most plausible primary catalyst for each move."
                " • Return output strictly as minified JSON that conforms to the schema the user provides (no markdown, no code fences, no extra keys, no commentary)."
                "If you are unsure of a catalyst, state that explicitly and provide no sources."

            ),
        },
        {   
            "role": "user",
            "content": (
                "What is the weather today in Berlin?"
            ),
        },
    ]

    try:
        # chat completion without streaming
        response = client.chat.completions.create(
            model="sonar-pro",
            messages=messages,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 