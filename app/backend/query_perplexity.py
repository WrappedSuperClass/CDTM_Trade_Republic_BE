import requests
from openai import OpenAI
from fastapi import HTTPException
import os
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta
import pandas as pd
from typing import Dict, List
from news_cache import NewsStory
# Load environment variables
load_dotenv()

# Initialize OpenAI client
YOUR_API_KEY = os.getenv('PERPLEXITY_API_KEY')
LOGO_API_KEY = os.getenv('LOGO_API_KEY')
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY')
client = OpenAI(api_key=YOUR_API_KEY, base_url="https://api.perplexity.ai")
mistral_client = OpenAI(api_key=MISTRAL_API_KEY, base_url="https://api.mistral.ai/v1")


def get_company_logo(company_name: str) -> str:
    company_name = company_name.split(" ")[0]
    """Fragt die Logo.dev API nach dem Logo anhand des Firmennamens."""
    search_url = "https://api.logo.dev/search"
    headers = {"Authorization": f"Bearer {LOGO_API_KEY}"}
    params = {"q": company_name}

    try:
        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()
        results = response.json()

        if results and isinstance(results, list):
            domain = results[0].get("domain")
            if domain:
                return f"https://img.logo.dev/{domain}?token=pk_Z7L8cnXPQ9-ezxAAjHAejA&size=128&format=png"
        print(response.text)
    except Exception as e:
        print(f"Fehler bei Logo.dev Anfrage: {e}")

    return ""

async def get_news():
    messages = [
        {
            "role": "system",
            "content": (
                "You are a real‑time financial summarization assistant. "
                "You have access to live market data, corporate news, and credible financial media. "
                "When asked for 'stock movers,' you must: "
                " • Identify the 3 most significant stock gains and 3 most significant stock losses based on absolute percentage change. "
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
                "Provide the 3 most significant stock gains and 3 most significant stock losses traded on the US and European markets within the last 7 days. "
                "Focus on stocks with meaningful market impact and trading volume. "
                "Exclude penny stocks and stocks with very low trading volume. "
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
                                "description": "List of the most significant stock movements (3 gains and 3 losses)",
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
                                "minItems": 6,
                                "maxItems": 6
                            }
                        },
                        "required": ["asOf", "timeframe", "movers"]
                    }
                }
            }
        )

        content = response.choices[0].message.content
        if "<think>" in content:
            content = content.split("</think>")[-1].strip()
        json_response = json.loads(content)
        
        # Füge Logos für jeden Stock hinzu
        for mover in json_response["movers"]:
            logo_url = get_company_logo(get_company_name(mover["symbol"]))
            mover["logo"] = logo_url
            
        return json_response
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

RELEVANT_KEYWORDS = ["record", "earnings", "beats", "acquisition", "upgrade", "forecast", "profit", "guidance", "merger", "lawsuit", "CEO", "drop", "plunge", "surge", "buy", "sell"]
TRUSTED_SOURCES = ["Reuters", "Bloomberg", "CNBC", "Yahoo", "WSJ", "MarketWatch"]

def get_stock_news(ticker: str, days_back: int = 3) -> List[NewsStory]:
    """Holt News für einen bestimmten Ticker und gibt maximal 4 Stories zurück."""
    to_date = datetime.today().date()
    from_date = to_date - timedelta(days=days_back)
    print(f"News for {ticker} from {from_date} to {to_date}")
    
    url = "https://finnhub.io/api/v1/company-news"
    params = {
        "symbol": ticker,
        "from": str(from_date),
        "to": str(to_date),
        "token": FINNHUB_API_KEY
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        articles = response.json()

        # Filtere nach relevanten Schlagworten und Quellen
        relevant_articles = [
            a for a in articles
            if any(kw.lower() in a["headline"].lower() for kw in RELEVANT_KEYWORDS)
            and any(src.lower() in a["source"].lower() for src in TRUSTED_SOURCES)
            and isinstance(a.get("datetime"), (int, float))  # Stelle sicher, dass datetime ein numerischer Wert ist
        ]

        if not relevant_articles:
            print("Keine besonders relevanten Artikel gefunden.")
            return []

        # Sortiere nach Datum (neueste zuerst) und nehme maximal 4 Artikel
        relevant_articles.sort(key=lambda x: x["datetime"], reverse=True)
        relevant_articles = relevant_articles[:4]

        # Extrahiere die relevanten Felder für NewsStory
        formatted_articles = []
        company_name = get_company_name(ticker)
        company_logo = get_company_logo(company_name)
        for article in relevant_articles:
            try:
                # Konvertiere Unix-Timestamp (Sekunden) zu datetime
                created_at = datetime.fromtimestamp(article["datetime"])
                formatted_article = NewsStory(
                    companyName=company_name,
                    ticker=ticker,
                    headline=article["headline"],
                    content=article["summary"],
                    source=article["url"],
                    logo=company_logo,
                    created_at=created_at
                )
                formatted_articles.append(formatted_article)
            except (ValueError, TypeError) as e:
                print(f"Fehler bei der Verarbeitung des Artikels: {str(e)}")
                continue

        return formatted_articles

    except Exception as e:
        print(f"Fehler beim Abrufen der News für {ticker}: {str(e)}")
        return []


def get_company_name(ticker: str) -> str:
    """Ermittelt den Firmennamen anhand des Tickers mit Hilfe von Mistral AI."""
    try:
        response = mistral_client.chat.completions.create(
            model="mistral-small",
            messages=[
                {
                    "role": "system",
                    "content": "Du bist ein Finanzassistent. Deine Aufgabe ist es, den vollständigen Firmennamen anhand eines Aktientickers zu ermitteln. Antworte NUR mit dem Firmennamen, ohne weitere Erklärungen, Formatierung oder Disclaimer. Beispiel: Für 'AAPL' antworte nur 'Apple Inc.'"
                },
                {
                    "role": "user",
                    "content": f"Was ist der vollständige Firmenname für den Aktienticker {ticker}? Antworte nur mit dem Namen."
                }
            ],
            temperature=0.1,  # Niedrige Temperatur für konsistente Antworten
            max_tokens=50
        )
        
        company_name = response.choices[0].message.content.strip()
        
        # Bereinige die Antwort
        # Entferne alles nach dem ersten Zeilenumbruch
        company_name = company_name.split('\n')[0]
        # Entferne mögliche Anführungszeichen
        company_name = company_name.strip('"\'')
        # Entferne Disclaimer und ähnliche Texte
        company_name = company_name.split('(')[0].strip()
        company_name = company_name.split('[')[0].strip()
        company_name = company_name.split('{')[0].strip()
        
        # Wenn die Antwort leer ist oder nur aus dem Ticker besteht, gib den Ticker zurück
        if not company_name or company_name.upper() == ticker.upper():
            return ticker
            
        return company_name
    except Exception as e:
        print(f"Fehler beim Abrufen des Firmennamens für {ticker}: {str(e)}")
        return ticker