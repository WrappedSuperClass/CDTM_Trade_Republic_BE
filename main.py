from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from query_perplexity import get_news, get_stock_movement



app = FastAPI()

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
        response = await get_news()
        return response
    except HTTPException as e:
        return {"error": e.detail}

@app.post("/stock-movement")
async def query_stock_movement(request: StockMovementRequest):
    try:
        response = await get_stock_movement(request.ticker, request.timeframe)
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    



