from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from query_perplexity import get_news, get_stock_movement
from news_cache import NewsCache
import json


app = FastAPI()

# Initialize news cache
news_cache = NewsCache()

# Disable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=[],
    allow_headers=[],
)


class StockMovementRequest(BaseModel):
    ticker: str
    timeframe: str


@app.get("/getNews")
async def root():
    try:
        cached_news = news_cache.get_cached_news()
        if cached_news:
            return cached_news

        response = await get_news()
        content = response.choices[0].message.content
        if "<think>" in content:
            content = content.split("</think>")[-1].strip()
        json_response = json.loads(content)

        news_cache.store_news(json_response)

        return json_response
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