import OpenAI from 'openai';
import type { LLMProvider, LLMTool, ToolCall } from '../llm.js';

const DEFAULT_MODEL = 'gpt-4.1';

export function createOpenAIProvider(model?: string): LLMProvider {
  const client = new OpenAI();
  const resolvedModel = model ?? DEFAULT_MODEL;

  return {
    async selectTool(query: string, tools: LLMTool[], systemPrompt: string): Promise<ToolCall | null> {
      const openaiTools: OpenAI.Responses.Tool[] = tools.map((t) => ({
        type: 'function',
        name: t.name,
        description: t.description,
        parameters: t.parameters,
        strict: true,
      }));

      const response = await client.responses.create({
        model: resolvedModel,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        tools: openaiTools,
        tool_choice: 'required',
      });

      const call = (response.output ?? []).find((o) => o.type === 'function_call');
      if (!call) return null;

      const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
      return { name: call.name, args };
    },
  };
}
