import { generateText, streamText, tool } from "ai";
import { mistral } from "@ai-sdk/mistral";
import { systemPrompt } from "./systemPrompt";
import { z } from "zod";

const printTool = tool({
  description: "Print a message to the console",
  parameters: z.object({
    message: z.string().describe("The message to print to the console")
  }),
  execute: async ({ message }) => {
    console.log("User requested to print:", message);
    return { success: true };
  }
});

const getStockMovementTool = tool({
  description: "Get stock movement data for a specific ticker and timeframe",
  parameters: z.object({
    ticker: z.string().describe("The stock ticker symbol or name"),
    timeframe: z.string().describe("The timeframe to check (e.g., 'End of January 2025')")
  }),
  execute: async ({ ticker, timeframe }) => {
    try {
      const response = await fetch('http://localhost:8000/stock-movement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker, timeframe }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Stock movement data:", data);
      return data;
    } catch (error) {
      console.error('Error fetching stock movement:', error);
      return { error: 'Failed to fetch stock movement data' };
    }
  }
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("messages", messages);
  const res = streamText({
    model: mistral("mistral-large-latest"),
    system: systemPrompt,
    messages,
    tools: {
      print: printTool,
      getStockMovement: getStockMovementTool
    },
    maxSteps: 3
  });
  return res.toDataStreamResponse();
}
