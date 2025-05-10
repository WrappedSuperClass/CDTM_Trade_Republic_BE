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
                " • Identify the 10 most significant stock movements (both up and down) based on absolute percentage change. "
                " • Focus on stocks with meaningful market impact and trading volume. "
                " • Exclude penny stocks and stocks with very low trading volume. "
                " • Explain the most plausible primary catalyst for each move. "
                " • Prioritize stocks that are relevant to the broader market or their sector. "
                " • For sources, provide actual URLs to news articles or financial reports, not footnote references. "
                "   Example sources format: ['https://www.reuters.com/article/...', 'https://www.bloomberg.com/...']"
            ),
        },
        {   
            "role": "user",
            "content": (
                "Provide the 10 most significant stock movements (both up and down) traded on the US and European markets within the last 7 days. "
                "Focus on stocks with meaningful market impact and trading volume. "
                "Exclude penny stocks and stocks with very low trading volume. "
                "Return the results sorted by absolute percentage change, regardless of direction. "
                "For each movement, include actual URLs to news articles or financial reports that explain the price movement."
            )
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
                            "asOf": {
                                "type": "string", 
                                "format": "date-time",
                                "description": "The current date and time in ISO-8601 format"
                            },
                            "timeframe": {
                                "type": "string",
                                "description": "The time period for which the data is valid, e.g. 'last 7 days'"
                            },
                            "movers": {
                                "type": "array",
                                "description": "List of the 10 most significant stock movements",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "rank": {
                                            "type": "integer",
                                            "description": "Position in the list, starting from 1 for the largest movement"
                                        },
                                        "isin": {
                                            "type": "string",
                                            "description": "The International Securities Identification Number of the stock"
                                        },
                                        "symbol": {
                                            "type": "string",
                                            "description": "The stock's ticker symbol"
                                        },
                                        "name": {
                                            "type": "string",
                                            "description": "The full company name"
                                        },
                                        "percentChange": {
                                            "type": "number",
                                            "description": "The percentage change in stock price (positive for up, negative for down)"
                                        },
                                        "direction": {
                                            "type": "string",
                                            "enum": ["up", "down"],
                                            "description": "The direction of the price movement"
                                        },
                                        "story": {
                                            "type": "string",
                                            "maxLength": 300,
                                            "description": "A brief explanation of the main catalyst for the price movement"
                                        },
                                        "sources": {
                                            "type": "array",
                                            "description": "List of actual URLs to news articles or financial reports that explain the price movement. Example: ['https://www.reuters.com/article/...', 'https://www.bloomberg.com/...']",
                                            "items": {
                                                "type": "string",
                                                "description": "Complete URL to a news article or financial report"
                                            },
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
                " • Explain the most plausible primary catalyst for each move. "
                " • For sources, provide actual URLs to news articles or financial reports, not footnote references. "
                "   Example sources format: ['https://www.reuters.com/article/...', 'https://www.bloomberg.com/...']"
            ),
        },
        {   
            "role": "user",
            "content": f"Analyze the stock movement for {ticker} during {timeframe}. Include actual URLs to news articles or financial reports that explain the price movements."
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
                            "asOf": {
                                "type": "string",
                                "format": "date-time",
                                "description": "The current date and time in ISO-8601 format"
                            },
                            "timeframe": {
                                "type": "string",
                                "description": "The time period for which the data is valid"
                            },
                            "stock": {
                                "type": "object",
                                "properties": {
                                    "symbol": {
                                        "type": "string",
                                        "description": "The stock's ticker symbol"
                                    },
                                    "movements": {
                                        "type": "array",
                                        "description": "List of significant price movements for the stock",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "date": {
                                                    "type": "string",
                                                    "format": "date",
                                                    "description": "The date of the price movement in ISO-8601 format"
                                                },
                                                "percentChange": {
                                                    "type": "number",
                                                    "description": "The percentage change in stock price (positive for up, negative for down)"
                                                },
                                                "direction": {
                                                    "type": "string",
                                                    "enum": ["up", "down"],
                                                    "description": "The direction of the price movement"
                                                },
                                                "story": {
                                                    "type": "string",
                                                    "maxLength": 300,
                                                    "description": "A brief explanation of the main catalyst for the price movement"
                                                },
                                                "sources": {
                                                    "type": "array",
                                                    "description": "List of actual URLs to news articles or financial reports that explain the price movement. Example: ['https://www.reuters.com/article/...', 'https://www.bloomberg.com/...']",
                                                    "items": {
                                                        "type": "string",
                                                        "description": "Complete URL to a news article or financial report"
                                                    },
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