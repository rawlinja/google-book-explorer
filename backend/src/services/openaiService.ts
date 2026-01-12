import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function sendChatCompletion(messages, tools) {
  const completion = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    tools,
  });
  return completion.choices[0].message.tool_calls;
}
