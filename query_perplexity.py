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
            """
Provide the top 10 stocks by absolute percent change traded on the US and European markets within the last 7 days.

Return **only** valid minified JSON matching this exact schema:

{
  "asOf": "<ISO‑8601 UTC timestamp>",
  "timeframe": "<human‑readable label, e.g. 'last 60 minutes'>",
  "movers": [
    {
      "rank": <integer>,                  // 1 = largest mover
      "isin": "<ISIN>",
      "symbol": "<ticker>",
      "name": "<company name>",
      "percentChange": <number>,          // positive = up, negative = down
      "direction": "up" | "down",
      "story": "<max 60‑word plain‑language explanation of the main catalyst, ending with a period>",
      "sources": ["<url1>", "<url2>"]     // up to 3 credible links; omit array or leave [] if unknown
    }
  ]
}

Constraints:
• JSON only, no markdown.
• The array must contain exactly 10 objects.
• Use minified syntax (no pretty‑print spacing).
• If the catalyst cannot be determined, set "story":"No clear catalyst identified." and leave "sources":[]. 
• Do **NOT** invent ISINs, prices, or sources.

"""
            ),
        },
    ]

    try:
        # chat completion without streaming
        response = client.chat.completions.create(
            model="sonar-deep-research",
            messages=messages,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 