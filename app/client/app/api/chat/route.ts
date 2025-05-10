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

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("messages", messages);
  const res = streamText({
    model: mistral("mistral-large-latest"),
    system: systemPrompt,
    messages,
    tools: {
      print: printTool
    },
    maxSteps: 2
  });
  return res.toDataStreamResponse();
}
