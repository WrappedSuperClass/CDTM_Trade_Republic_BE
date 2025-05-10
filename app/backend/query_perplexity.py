from openai import OpenAI
from fastapi import HTTPException
import os
from dotenv import load_dotenv
# Load environment variables
load_dotenv()

# Initialize OpenAI client
YOUR_API_KEY = os.getenv('PERPLEXITY_API_KEY')
client = OpenAI(api_key=YOUR_API_KEY, base_url="https://api.perplexity.ai")

async def get_news():
    messages = [
        {
            "role": "system",
            "content": (
                "You are a real‑time financial summarization assistant. "
                "You have access to live market data, corporate news, and credible financial media. "
                "When asked for 'stock movers,' you must: "
                " • Identify the securities with the largest absolute %‑price change within the requested window. "
                " • Explain only the most plausible primary catalyst for each move."
            ),
        },
        {   
            "role": "user",
            "content": "Provide the top 10 stocks by absolute percent change traded on the US and European markets within the last 7 days."
        }
    ]

    try:
        response = client.chat.completions.create(
            model="sonar-deep-research",
            messages=messages,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "asOf": {"type": "string", "format": "date-time"},
                            "timeframe": {"type": "string"},
                            "movers": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "rank": {"type": "integer"},
                                        "isin": {"type": "string"},
                                        "symbol": {"type": "string"},
                                        "name": {"type": "string"},
                                        "percentChange": {"type": "number"},
                                        "direction": {"type": "string", "enum": ["up", "down"]},
                                        "story": {"type": "string", "maxLength": 300},
                                        "sources": {
                                            "type": "array",
                                            "items": {"type": "string"},
                                            "maxItems": 3
                                        }
                                    },
                                    "required": ["rank", "isin", "symbol", "name", "percentChange", "direction", "story", "sources"]
                                },
                                "minItems": 10,
                                "maxItems": 10
                            }
                        },
                        "required": ["asOf", "timeframe", "movers"]
                    }
                }
            }
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_stock_movement(ticker: str, timeframe: str):
    messages = [
        {
            "role": "system",
            "content": (
                "You are a real‑time financial summarization assistant. "
                "You have access to live market data, corporate news, and credible financial media. "
                "When asked about specific stock movements, you must: "
                " • Identify the significant price movements for the specified stock during the given timeframe. "
                " • Explain the most plausible primary catalyst for each move."
            ),
        },
        {   
            "role": "user",
            "content": f"Analyze the stock movement for {ticker} during {timeframe}."
        }
    ]

    try:
        response = client.chat.completions.create(
            model="sonar-pro",
            messages=messages,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "asOf": {"type": "string", "format": "date-time"},
                            "timeframe": {"type": "string"},
                            "stock": {
                                "type": "object",
                                "properties": {
                                    "symbol": {"type": "string"},
                                    "movements": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "date": {"type": "string", "format": "date"},
                                                "percentChange": {"type": "number"},
                                                "direction": {"type": "string", "enum": ["up", "down"]},
                                                "story": {"type": "string", "maxLength": 300},
                                                "sources": {
                                                    "type": "array",
                                                    "items": {"type": "string"},
                                                    "maxItems": 3
                                                }
                                            },
                                            "required": ["date", "percentChange", "direction", "story", "sources"]
                                        }
                                    }
                                },
                                "required": ["symbol", "movements"]
                            }
                        },
                        "required": ["asOf", "timeframe", "stock"]
                    }
                }
            }
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 