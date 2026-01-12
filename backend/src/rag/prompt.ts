export function makeRagPrompt(question: string, context: string[]): string {
  const ctx = context.map((c, i) => `### Context Chunk ${i + 1}\n${c}`).join('\n\n');

  return [
    `You are a senior engineer writing grounded answers.`,
    ``,
    `QUESTION:`,
    question,
    ``,
    `CONTEXT:`,
    ctx,
    ``,
    `Answer only using the context above.`,
  ]
    .join('\n')
    .trim();
}
