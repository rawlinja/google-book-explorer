import { config } from '../config/index.js';

export interface LLMTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string }>;
    required: string[];
    additionalProperties: false;
  };
}

export interface ToolCall {
  name: string;
  args: Record<string, string>;
}

export interface LLMProvider {
  selectTool(query: string, tools: LLMTool[], systemPrompt: string): Promise<ToolCall | null>;
}

async function createProvider(): Promise<LLMProvider> {
  const { LLM_PROVIDER, LLM_MODEL } = config;

  if (LLM_PROVIDER === 'anthropic') {
    const { createAnthropicProvider } = await import('./providers/anthropic.js');
    return createAnthropicProvider(LLM_MODEL);
  }

  const { createOpenAIProvider } = await import('./providers/openai.js');
  return createOpenAIProvider(LLM_MODEL);
}

let _provider: LLMProvider | null = null;

async function getProvider(): Promise<LLMProvider> {
  if (!_provider) _provider = await createProvider();
  return _provider;
}

export async function selectTool(
  query: string,
  tools: LLMTool[],
  systemPrompt: string
): Promise<ToolCall | null> {
  const provider = await getProvider();
  return provider.selectTool(query, tools, systemPrompt);
}
