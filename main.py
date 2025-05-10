from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from query_perplexity import get_news



app = FastAPI()

# Disable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=[],
    allow_headers=[],
)

@app.get("/getNews")
async def root():
    try:
        response = await get_news()
        return response
    except HTTPException as e:
        return {"error": e.detail}
    



