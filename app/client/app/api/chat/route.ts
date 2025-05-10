import { generateText, streamText } from "ai";
import { mistral } from "@ai-sdk/mistral";
import { systemPrompt } from "./systemPrompt";

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("messages", messages);
  const res = streamText({
    model: mistral("mistral-large-latest"),
    system: systemPrompt,
    messages,
  });
  return res.toDataStreamResponse();
}
