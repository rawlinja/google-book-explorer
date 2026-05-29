import OpenAI from 'openai';

const client = new OpenAI();

export interface ToolCall {
  name: string;
  args: Record<string, string>;
}

export async function selectTool(
  query: string,
  tools: OpenAI.Responses.Tool[],
  systemPrompt: string
): Promise<ToolCall | null> {
  const response = await client.responses.create({
    model: 'gpt-4.1',
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ],
    tools,
    tool_choice: 'required',
  });

  const call = (response.output ?? []).find((o) => o.type === 'function_call');
  if (!call) return null;

  const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
  return { name: call.name, args };
}
