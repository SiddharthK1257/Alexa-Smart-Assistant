import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { executeMcpTool, MCP_TOOLS_CATALOG } from '../src/mcp/tools.js';

describe('Model Context Protocol (MCP) Server Tests', () => {
  const testUserId = 'a0000000-0000-0000-0000-000000000001';

  it('GET /mcp returns protocol specification and transport details', async () => {
    const res = await request(app).get('/mcp');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Alexa+ Smart Assistant MCP Server');
    expect(res.body).toHaveProperty('protocolVersion', '2025-11-25');
    expect(res.body).toHaveProperty('transport', 'Streamable HTTP (JSON-RPC 2.0)');
    expect(res.body).toHaveProperty('toolsAvailable', MCP_TOOLS_CATALOG.length);
  });

  it('GET /mcp/tools lists all catalog tools with valid descriptions', async () => {
    const res = await request(app).get('/mcp/tools');
    expect(res.status).toBe(200);
    expect(res.body.tools).toHaveLength(MCP_TOOLS_CATALOG.length);

    const toolNames = res.body.tools.map((t: any) => t.name);
    expect(toolNames).toContain('create_task');
    expect(toolNames).toContain('list_tasks');
    expect(toolNames).toContain('update_task');
    expect(toolNames).toContain('complete_task');
    expect(toolNames).toContain('create_reminder');
    expect(toolNames).toContain('list_reminders');
    expect(toolNames).toContain('save_note');
    expect(toolNames).toContain('search_notes');
    expect(toolNames).toContain('get_assistant_status');
    expect(toolNames).toContain('play_music');
    expect(toolNames).toContain('search_recipes');
    expect(toolNames).toContain('discover_devices');
    expect(toolNames).toContain('book_restaurant');
    expect(toolNames).toContain('book_hotel');
    expect(toolNames).toContain('get_calendar_events');
  });

  it('MCP Tool Execution: create_task, complete_task, list_tasks, and get_assistant_status', async () => {
    // 1. Execute create_task tool
    const task = await executeMcpTool('create_task', {
      title: 'MCP Integration Verification Task',
      priority: 'high',
      description: 'Automated test execution via MCP tool dispatcher',
    }, testUserId);

    expect(task).toHaveProperty('id');
    expect(task.title).toBe('MCP Integration Verification Task');

    // 2. Execute complete_task tool
    const completed = await executeMcpTool('complete_task', {
      task_id: task.id,
    }, testUserId);
    expect(completed.status).toBe('completed');

    // 3. Execute list_tasks tool
    const tasks = await executeMcpTool('list_tasks', { limit: 10 }, testUserId);
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.some((t: any) => t.id === task.id)).toBe(true);

    // 4. Execute get_assistant_status tool
    const status = await executeMcpTool('get_assistant_status', {}, testUserId);
    expect(status).toHaveProperty('status', 'healthy');
    expect(status).toHaveProperty('mcpProtocolVersion', '2025-11-25');
    expect(status).toHaveProperty('database');
    expect(status).toHaveProperty('userSummary');
  });

  it('MCP Tool Validation: Rejects invalid parameters with schema errors', async () => {
    // Empty title
    await expect(
      executeMcpTool('create_task', { title: '' }, testUserId)
    ).rejects.toThrow();

    // Invalid task_id UUID
    await expect(
      executeMcpTool('update_task', { task_id: 'not-a-uuid', title: 'New Title' }, testUserId)
    ).rejects.toThrow(/uuid/i);

    // Unknown tool
    await expect(
      executeMcpTool('non_existent_tool', {}, testUserId)
    ).rejects.toThrow(/Unknown MCP tool/i);
  });

  it('POST /mcp requires authentication and returns standard JSON-RPC error if unauthenticated', async () => {
    const res = await request(app)
      .post('/mcp')
      .send({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('jsonrpc', '2.0');
    expect(res.body.error).toHaveProperty('code', -32000);
    expect(res.body.error.message).toContain('Unauthorized');
  });
});
