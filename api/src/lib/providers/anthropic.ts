import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMTool, ToolCall } from '../llm.js';

const DEFAULT_MODEL = 'claude-haiku-4-5';

export function createAnthropicProvider(model?: string): LLMProvider {
  const client = new Anthropic();
  const resolvedModel = model ?? DEFAULT_MODEL;

  return {
    async selectTool(
      query: string,
      tools: LLMTool[],
      systemPrompt: string
    ): Promise<ToolCall | null> {
      const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters as Anthropic.Tool['input_schema'],
      }));

      const response = await client.messages.create({
        model: resolvedModel,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }],
        tools: anthropicTools,
        tool_choice: { type: 'any' },
      });

      const block = response.content.find((b: Anthropic.ContentBlock) => b.type === 'tool_use');
      if (!block || block.type !== 'tool_use') return null;

      return { name: block.name, args: block.input as Record<string, string> };
    },
  };
}
