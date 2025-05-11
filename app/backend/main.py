from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from query_perplexity import get_news, get_stock_movement, get_company_logo, get_stock_news
from news_cache import NewsCache
import yfinance as yf
from typing import Optional
from datetime import datetime, timedelta
import json
import os


app = FastAPI()

# Initialize news cache
news_cache = NewsCache()

# Disable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StockMovementRequest(BaseModel):
    ticker: str
    timeframe: str

class StockDataRequest(BaseModel):
    ticker: str
    period: Optional[str] = "1d"  # Default to 1 day

class SubscriptionStoryRequest(BaseModel):
    tickers: list[str]




@app.get("/getTopMovers")
async def root():
    try:
        cached_news = news_cache.get_cached_news()
        if cached_news:
            return cached_news

        news_data = await get_news()
        news_cache.store_news(news_data)
        
        return news_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stock-movement")
async def query_stock_movement(request: StockMovementRequest):
    try:
        response = await get_stock_movement(request.ticker, request.timeframe)
        content = response.choices[0].message.content
        if "<think>" in content:
            content = content.split("</think>")[-1].strip()
        json_response = json.loads(content)
        return json_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@app.get("/stock-data")
async def get_stock_data(ticker: str, period: str = "d"):
    try:
        # Map period to appropriate interval
        interval_map = {
            "1d": "5m",    # 1 day -> 1 minute intervals
            "1wk": "5m",  # 1 week -> 15 minute intervals
            "1mo": "1h",   # 1 month -> 1 hour intervals
            "1y": "1d",     # 1 year -> 1 day intervals
            "max": "1mo"     # max -> 1 day intervals
        }
        
        # Validate period
        if period not in interval_map:
            raise HTTPException(
                status_code=400, 
                detail="Invalid period. Must be one of: 1d, 1wk, 1mo, 1y"
            )
            
        interval = interval_map[period]
        
        # Get stock data
        stock = yf.Ticker(ticker)
        print(stock)
        hist = stock.history(period=period, interval=interval)
        
        # Convert the data to a more API-friendly format
        data = []
        for index, row in hist.iterrows():
            data.append({
                "timestamp": index.isoformat(),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"])
            })
        
        # Get additional stock info
        info = stock.info
        stock_info = {
            "name": info.get("longName", ""),
            "symbol": info.get("symbol", ""),
            "currency": info.get("currency", ""),
            "exchange": info.get("exchange", ""),
            "market_cap": info.get("marketCap", 0),
            "current_price": info.get("currentPrice", 0),
            "previous_close": info.get("previousClose", 0),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh", 0),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow", 0)
        }
        
        return {
            "stock_info": stock_info,
            "historical_data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/trading-wrapped")
async def get_trading_wrapped(user_id: str):
    try:
        from tr_wrapped.trading_wrapped import get_trading_wrapped_points
        
        # Get the absolute path to the CSV file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(current_dir, "tr_wrapped", "trading_sample_data.csv")
        
        wrapped_points = get_trading_wrapped_points(user_id, csv_path)
        return {"points": wrapped_points}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/getSubscriptionStories")
async def get_subscription_stories(request: SubscriptionStoryRequest):
    try:
        # Hole existierende Stories
        stories = news_cache.get_subscription_stories_by_tickers(request.tickers)
        
        # Finde Ticker, für die keine Stories vorhanden sind
        missing_tickers = [ticker for ticker in request.tickers if ticker not in stories]
        
        # Hole und speichere neue Stories für fehlende Ticker
        for ticker in missing_tickers:
            try:
                ticker_stories = get_stock_news(ticker)
                if ticker_stories:  # Nur wenn Stories gefunden wurden
                    for story in ticker_stories:
                        news_cache.store_subscription_story(story)
                    stories[ticker] = news_cache.get_subscription_stories_by_ticker(ticker)
            except Exception as e:
                print(f"Fehler beim Abrufen der News für {ticker}: {str(e)}")
                continue
        
        # Transformiere die Stories in das gewünschte Format
        transformed_stories = news_cache.transform_stories_with_stock_data(stories)
        
        return {"stock_news": transformed_stories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

    
