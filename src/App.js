import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

function App() {
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const logContainerRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchState = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/simulate`);
      const data = await response.json();
      setAgents(data.agents || []);
      setLogs(data.logs || []);
      setIsRunning(data.isRunning || false);
      setRound(data.round || 0);
    } catch (error) {
      console.error('Error fetching state:', error);
    }
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const initSimulation = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/simulate/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numAgents: 4 })
      });
      await fetchState();
    } catch (error) {
      console.error('Error initializing:', error);
    }
    setLoading(false);
  }, [fetchState]);

  const startSimulation = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/simulate/start`, { method: 'POST' });
      await fetchState();
    } catch (error) {
      console.error('Error starting:', error);
    }
    setLoading(false);
  }, [fetchState]);

  const stopSimulation = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/simulate/stop`, { method: 'POST' });
      await fetchState();
    } catch (error) {
      console.error('Error stopping:', error);
    }
    setLoading(false);
  }, [fetchState]);

  const stepSimulation = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/simulate/step`, { method: 'POST' });
      const data = await response.json();
      setAgents(data.agents || []);
      setLogs(data.logs || []);
      setRound(data.round || 0);
    } catch (error) {
      console.error('Error stepping:', error);
    }
  }, []);

  const resetSimulation = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/simulate/reset`, { method: 'POST' });
      await fetchState();
    } catch (error) {
      console.error('Error resetting:', error);
    }
    setLoading(false);
  }, [fetchState]);

  const clearLogs = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/simulate/clear`, { method: 'POST' });
      await fetchState();
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }, [fetchState]);

  useEffect(() => {
    initSimulation();
  }, [initSimulation]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(stepSimulation, 2000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, stepSimulation]);

  const getLogClass = (type) => {
    const classes = { system: 'log-type-system', interaction: 'log-type-interaction', state: 'log-type-state', broadcast: 'log-type-broadcast', evolution: 'log-type-evolution', tool: 'log-type-tool' };
    return classes[type] || '';
  };

  const getLogEmoji = (type) => {
    const emojis = { system: '⚙️', interaction: '💬', state: '🔄', broadcast: '📢', evolution: '🧬', tool: '🔧' };
    return emojis[type] || '📝';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              🧠 LangChain Simulation
            </h1>
            <p className="text-sm text-gray-400 mt-1">Multi-agent system simulation with web capabilities</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={isRunning ? stopSimulation : startSimulation} disabled={loading || !agents.length} className={`btn ${isRunning ? 'btn-danger' : 'btn-success'}`}>
              {isRunning ? '⏹️ Stop' : '▶️ Start'}
            </button>
            <button onClick={stepSimulation} disabled={isRunning || loading || !agents.length} className="btn btn-primary">⏭️ Step</button>
            <button onClick={resetSimulation} disabled={loading} className="btn btn-secondary">🔄 Reset</button>
            <button onClick={clearLogs} disabled={loading} className="btn btn-secondary">🗑️ Clear Logs</button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#14141e] border border-[#2a2a3e] rounded-lg p-4">
            <div className="text-xs text-gray-400">Round</div>
            <div className="text-2xl font-bold">{round}</div>
          </div>
          <div className="bg-[#14141e] border border-[#2a2a3e] rounded-lg p-4">
            <div className="text-xs text-gray-400">Agents</div>
            <div className="text-2xl font-bold">{agents.length}</div>
          </div>
          <div className="bg-[#14141e] border border-[#2a2a3e] rounded-lg p-4">
            <div className="text-xs text-gray-400">Status</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span className={`status-dot ${isRunning ? 'active' : 'idle'}`}></span>
              {isRunning ? 'Running' : 'Idle'}
            </div>
          </div>
          <div className="bg-[#14141e] border border-[#2a2a3e] rounded-lg p-4">
            <div className="text-xs text-gray-400">Logs</div>
            <div className="text-2xl font-bold">{logs.length}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">🤖 Agents</h2>
            <div className="agent-grid">
              {agents.map((agent) => (
                <div key={agent.id} className={`agent-card cursor-pointer ${selectedAgent?.id === agent.id ? 'border-purple-500' : ''}`} onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="role flex items-center gap-2">
                      <span className={`status-dot ${agent.state}`}></span>
                      {agent.role}
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-[#2a2a3e] rounded-full">{agent.strategy}</span>
                  </div>
                  <div className="trust">Trust: {(agent.trust * 100).toFixed(0)}%</div>
                  <div className="trust-bar"><div className="trust-bar-fill" style={{ width: `${agent.trust * 100}%` }}></div></div>
                  <div className="text-xs text-gray-500 mt-2">{agent.messages?.length || 0} messages</div>
                </div>
              ))}
            </div>
            {selectedAgent && (
              <div className="mt-4 bg-[#14141e] border border-[#2a2a3e] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">{selectedAgent.role} - Messages</h3>
                <div className="max-h-32 overflow-y-auto text-xs text-gray-400 space-y-1">
                  {selectedAgent.messages?.slice(-5).map((msg, i) => (
                    <div key={i} className="border-b border-[#2a2a3e] pb-1">→ {msg.content.substring(0, 60)}...</div>
                  )) || <div>No messages yet</div>}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">📋 Activity Log</h2>
            <div className="log-container" ref={logContainerRef}>
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No logs yet. Start the simulation to see activity.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`log-entry ${getLogClass(log.type)}`}>
                    <span className="log-time">{log.time}</span>
                    <span className="log-message">{getLogEmoji(log.type)} {log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <footer className="mt-8 text-center text-xs text-gray-500 border-t border-[#2a2a3e] pt-4">
          Built with LangChain • Deployed on {process.env.NODE_ENV === 'production' ? 'Vercel/Netlify' : 'Local'}
        </footer>
      </div>
    </div>
  );
}

export default App;
