import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Play, AlertTriangle, Shield, Key, History, RefreshCw } from 'lucide-react';
import { api, AuditEventItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MCPInspector: React.FC = () => {
  const { user, token, quickDemoLogin } = useAuth();

  // MCP Tool Testing State
  const [tools, setTools] = useState<Array<{ name: string; description: string }>>([]);
  const [selectedTool, setSelectedTool] = useState<string>('get_assistant_status');
  const [toolArgsJson, setToolArgsJson] = useState('{}');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Health State
  const [healthData, setHealthData] = useState<any>(null);

  // OAuth Metadata State
  const [authServerMeta, setAuthServerMeta] = useState<any>(null);
  const [resourceMeta, setResourceMeta] = useState<any>(null);

  // Audit Logs State
  const [auditEvents, setAuditEvents] = useState<AuditEventItem[]>([]);
  const [activeTab, setActiveTab] = useState<'tools' | 'health' | 'oauth' | 'audit'>('tools');

  // Default sample arguments for each tool
  const sampleArgs: Record<string, any> = {
    get_assistant_status: {},
    list_tasks: { status: 'all', limit: 5 },
    create_task: {
      title: 'Inspect MCP Streamable HTTP response',
      priority: 'high',
      description: 'Testing directly via Developer Inspector console',
    },
    update_task: {
      task_id: '00000000-0000-0000-0000-000000000000',
      status: 'completed',
    },
    list_reminders: { status: 'scheduled', limit: 5 },
    create_reminder: {
      message: 'MCP Test Alert',
      scheduled_time: new Date(Date.now() + 3600000).toISOString(),
    },
    save_note: {
      title: 'MCP Developer Guide',
      content: 'MCP enables AI assistants to execute deterministic tools.',
      tags: ['mcp', 'developer', 'docs'],
    },
    search_notes: { query: 'developer', limit: 5 },
  };

  useEffect(() => {
    // Load tools list
    api.getMcpTools().then(res => {
      setTools(res.tools);
    }).catch(console.error);

    // Load health
    api.getHealth().then(setHealthData).catch(console.error);

    // Load OAuth metadata
    api.getOAuthAuthorizationServerMetadata().then(setAuthServerMeta).catch(console.error);
    api.getOAuthProtectedResourceMetadata().then(setResourceMeta).catch(console.error);
  }, []);

  useEffect(() => {
    if (token) {
      api.getAuditEvents(token).then(res => setAuditEvents(res.auditEvents)).catch(console.error);
    }
  }, [token, activeTab]);

  const handleToolSelect = (name: string) => {
    setSelectedTool(name);
    setToolArgsJson(JSON.stringify(sampleArgs[name] || {}, null, 2));
    setExecutionResult(null);
  };

  const handleExecuteTool = async () => {
    if (!token) {
      alert('Please log in with Supabase Auth or click Demo Login to execute tools.');
      return;
    }
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      let parsedArgs = {};
      if (toolArgsJson.trim()) {
        parsedArgs = JSON.parse(toolArgsJson);
      }
      const res = await api.executeMcpTool(selectedTool, parsedArgs, token);
      setExecutionResult(res);
      // Refresh audit logs
      api.getAuditEvents(token).then(r => setAuditEvents(r.auditEvents)).catch(() => {});
    } catch (err: any) {
      setExecutionResult({ error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRefreshHealth = async () => {
    try {
      const res = await api.getHealth();
      setHealthData(res);
    } catch (e: any) {
      setHealthData({ status: 'error', error: e.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span>MCP & System Inspector</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time Model Context Protocol testbed, health status, and Amazon Alexa+ OAuth 2.1 metadata
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#111827] border border-gray-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'tools'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Tools Console
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'health'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Health & Status
          </button>
          <button
            onClick={() => setActiveTab('oauth')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'oauth'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            OAuth 2.1 Specs
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'audit'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Audit Log
          </button>
        </div>
      </div>

      {/* Guest Mode Warning Banner */}
      {!user && activeTab !== 'health' && activeTab !== 'oauth' && (
        <div className="bg-[#111827] border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>MCP tool execution requires an authenticated Supabase user token to enforce RLS.</span>
          </div>
          <button
            onClick={() => quickDemoLogin()}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold tracking-wide hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md active:scale-95"
          >
            ⚡ Instant Demo Login
          </button>
        </div>
      )}

      {/* TAB 1: Tools Console */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tool Selector List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              Registered Tools ({tools.length})
            </h3>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {tools.map(tool => (
                <button
                  key={tool.name}
                  onClick={() => handleToolSelect(tool.name)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedTool === tool.name
                      ? 'bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border-cyan-500/50 text-cyan-300 font-semibold shadow-md'
                      : 'bg-[#111827] border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <div className="font-mono">{tool.name}</div>
                  <div className="text-[11px] text-gray-500 font-normal mt-0.5 line-clamp-1">
                    {tool.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Tool Runner */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-cyan-300 font-mono flex items-center gap-2">
                    <span>Tool:</span>
                    <span className="text-gray-100">{selectedTool}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {tools.find(t => t.name === selectedTool)?.description}
                  </p>
                </div>

                <button
                  onClick={handleExecuteTool}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Executing...' : 'Invoke Tool'}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 uppercase font-medium mb-1">
                  Arguments (JSON)
                </label>
                <textarea
                  rows={5}
                  value={toolArgsJson}
                  onChange={e => setToolArgsJson(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-gray-700 rounded-lg p-2.5 text-xs text-gray-200 font-mono outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Execution Result Output */}
            {executionResult && (
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300">Execution Output</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      executionResult.error
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {executionResult.error ? 'ERROR' : 'HTTP 200 SUCCESS'}
                  </span>
                </div>
                <pre className="bg-[#0B0F19] border border-gray-800 rounded-lg p-3 text-xs text-cyan-300 font-mono overflow-x-auto max-h-80">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Health & Status */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Backend & Database Health Probe (/health)</span>
            </h3>
            <button
              onClick={handleRefreshHealth}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg border border-gray-700 bg-[#111827]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Probe</span>
            </button>
          </div>

          <pre className="bg-[#111827] border border-gray-800 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto shadow-inner">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </div>
      )}

      {/* TAB 3: Alexa+ OAuth 2.1 Metadata Specs */}
      {activeTab === 'oauth' && (
        <div className="space-y-6 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-gray-200">
                RFC 8414 OAuth 2.0 Authorization Server Metadata
              </h3>
            </div>
            <p className="text-gray-400">
              Accessed at <code className="text-cyan-300">/.well-known/oauth-authorization-server</code> by Amazon Alexa+ Toolkit during Add-on configuration.
            </p>
            <pre className="bg-[#111827] border border-gray-800 rounded-xl p-4 font-mono text-cyan-300 overflow-x-auto">
              {JSON.stringify(authServerMeta, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-200">
                RFC 9470 OAuth 2.0 Protected Resource Metadata
              </h3>
            </div>
            <p className="text-gray-400">
              Accessed at <code className="text-purple-300">/.well-known/oauth-protected-resource</code> to verify protected scopes for <code className="text-purple-300">/mcp</code>.
            </p>
            <pre className="bg-[#111827] border border-gray-800 rounded-xl p-4 font-mono text-purple-300 overflow-x-auto">
              {JSON.stringify(resourceMeta, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: Audit Log */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Security & Tool Execution Audit Trail</span>
            </h3>
            <span className="text-xs text-gray-400">Showing last {auditEvents.length} events</span>
          </div>

          {auditEvents.length === 0 ? (
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 text-center text-xs text-gray-400">
              No audit events logged yet. Execute an MCP tool or chat with the assistant to generate security events.
            </div>
          ) : (
            <div className="bg-[#111827] border border-gray-800 rounded-xl divide-y divide-gray-800 overflow-hidden text-xs">
              {auditEvents.map(ev => (
                <div key={ev.id} className="p-3 flex items-start justify-between gap-3 font-mono">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-200">{ev.event_type}</span>
                      {ev.tool_name && (
                        <span className="text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.2 rounded text-[10px]">
                          tool: {ev.tool_name}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded uppercase ${
                          ev.status === 'success'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-red-400 bg-red-500/10'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                    {ev.details && Object.keys(ev.details).length > 0 && (
                      <div className="text-[11px] text-gray-400">
                        {JSON.stringify(ev.details)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
