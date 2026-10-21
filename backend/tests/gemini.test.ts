import { describe, it, expect } from 'vitest';
import { processAssistantMessage } from '../src/services/gemini.js';

describe('Gemini AI Assistant Service Tests', () => {
  const testUserId = 'a0000000-0000-0000-0000-000000000001';

  it('Processes natural language query and returns vocal text response', async () => {
    const result = await processAssistantMessage(
      'Hello Alexa, who are you and what can you help me with?',
      [],
      testUserId
    );

    expect(result).toHaveProperty('response');
    expect(typeof result.response).toBe('string');
    expect(result.response.length).toBeGreaterThan(5);
    expect(result).toHaveProperty('toolExecutions');
    expect(Array.isArray(result.toolExecutions)).toBe(true);
  });

  it('Selects and executes MCP tool when user requests task action', async () => {
    const result = await processAssistantMessage(
      'Please create a high priority task titled "Review Supabase RLS security policies" with description "Verify row level security for all user tables"',
      [],
      testUserId
    );

    expect(result).toHaveProperty('response');
    expect(typeof result.response).toBe('string');
    expect(result.toolExecutions.length).toBeGreaterThan(0);

    const executedTool = result.toolExecutions.find(t => t.name === 'create_task');
    expect(executedTool).toBeDefined();
    expect(executedTool?.status).toBe('success');
    expect(executedTool?.result).toHaveProperty('id');
    expect(executedTool?.result.title).toContain('Review Supabase RLS security policies');
  });

  it('Provides follow-up suggestions tailored to assistant state', async () => {
    const result = await processAssistantMessage(
      'What is your system status?',
      [],
      testUserId
    );

    expect(result).toHaveProperty('response');
    expect(result.followUpSuggestions).toBeInstanceOf(Array);
  });
});
