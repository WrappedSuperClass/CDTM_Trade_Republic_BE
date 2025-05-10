from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from query_perplexity import get_weather_in_berlin



app = FastAPI()

# Disable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=[],
    allow_headers=[],
)

@app.get("/")
async def root():
    try:
        response = await get_weather_in_berlin()
        return response
    except HTTPException as e:
        return {"error": e.detail}



