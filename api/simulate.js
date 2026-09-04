const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// In-memory simulation state
let simulationState = {
  agents: [],
  isRunning: false,
  round: 0,
  logs: []
};

const AGENT_ROLES = ['Project Manager', 'Developer', 'Tester', 'Designer'];
const STRATEGIES = ['collaborate', 'compete', 'analyze', 'innovate'];
const MESSAGE_TEMPLATES = {
  'Project Manager': [
    'I need you to prioritize {task} for the upcoming sprint.',
    'Let\'s align on the timeline for {project}.',
    'The client has requested changes to {feature}.'
  ],
  'Developer': [
    'I\'ve implemented the {component} with improved performance.',
    'There\'s a {issue} we need to address in the current build.',
    'The API endpoint is ready for integration testing.'
  ],
  'Tester': [
    'I found {bug_type} in the latest deployment.',
    'Test coverage is at {percentage}%.',
    'The {feature} needs more edge case testing.'
  ],
  'Designer': [
    'Here\'s the updated mockup for {component}.',
    'We need to improve accessibility on {page}.',
    'The user feedback suggests changes to {element}.'
  ]
};

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMessage(agent) {
  const templates = MESSAGE_TEMPLATES[agent.role] || ['Let\'s collaborate on this task.'];
  let template = getRandomItem(templates);
  
  const context = {
    task: getRandomItem(['bug fixes', 'new features', 'documentation', 'refactoring']),
    project: getRandomItem(['launch', 'sprint planning', 'release', 'demo']),
    feature: getRandomItem(['authentication', 'dashboard', 'search', 'notifications']),
    component: getRandomItem(['UI library', 'API', 'database', 'frontend']),
    issue: getRandomItem(['performance issue', 'security vulnerability', 'edge case']),
    bug_type: getRandomItem(['critical bug', 'minor issue', 'edge case', 'performance bug']),
    percentage: Math.floor(Math.random() * 30) + 70,
    page: getRandomItem(['homepage', 'settings', 'profile', 'dashboard']),
    element: getRandomItem(['navigation', 'forms', 'tables', 'modals'])
  };
  
  let message = template;
  for (const [key, value] of Object.entries(context)) {
    message = message.replace(`{${key}}`, value);
  }
  return message;
}

function initializeSimulation(config = {}) {
  const { numAgents = 4 } = config;
  
  const agents = AGENT_ROLES.slice(0, numAgents).map((role, i) => ({
    id: `agent-${i}`,
    role,
    state: i === 0 ? 'active' : 'idle',
    strategy: STRATEGIES[i % STRATEGIES.length],
    trust: 0.5 + Math.random() * 0.3,
    messages: [],
    lastActive: Date.now()
  }));
  
  simulationState = {
    agents,
    isRunning: false,
    round: 0,
    logs: [{
      time: new Date().toLocaleTimeString(),
      message: `🚀 Simulation initialized with ${agents.length} agents`,
      type: 'system',
      round: 0
    }]
  };
  
  return simulationState;
}

function createPairs(agents) {
  const shuffled = [...agents].sort(() => Math.random() - 0.5);
  const pairs = [];
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }
  return pairs;
}

function simulateInteraction(agent1, agent2) {
  const msg1 = generateMessage(agent1);
  const msg2 = generateMessage(agent2);
  
  agent1.messages.push({ to: agent2.id, content: msg1, round: simulationState.round });
  agent2.messages.push({ to: agent1.id, content: msg2, round: simulationState.round });
  
  agent1.trust = Math.min(1, Math.max(0, agent1.trust + (Math.random() - 0.4) * 0.1));
  agent2.trust = Math.min(1, Math.max(0, agent2.trust + (Math.random() - 0.4) * 0.1));
  
  return {
    pair: `${agent1.role} ↔ ${agent2.role}`,
    message: `${agent1.role}: "${msg1.substring(0, 40)}..."`
  };
}

function stepSimulation() {
  simulationState.round++;
  const logs = [];
  logs.push({
    time: new Date().toLocaleTimeString(),
    message: `📊 === Round ${simulationState.round} ===`,
    type: 'system',
    round: simulationState.round
  });
  
  const pairs = createPairs(simulationState.agents);
  for (const [a1, a2] of pairs) {
    const result = simulateInteraction(a1, a2);
    logs.push({
      time: new Date().toLocaleTimeString(),
      message: `💬 ${result.message}`,
      type: 'interaction',
      round: simulationState.round
    });
  }
  
  for (const agent of simulationState.agents) {
    if (agent.trust > 0.7 && agent.state === 'idle' && Math.random() < 0.3) {
      agent.state = 'active';
      logs.push({
        time: new Date().toLocaleTimeString(),
        message: `🟢 ${agent.role} became active (trust: ${agent.trust.toFixed(2)})`,
        type: 'state',
        round: simulationState.round
      });
    }
  }
  
  const broadcaster = simulationState.agents[simulationState.round % simulationState.agents.length];
  logs.push({
    time: new Date().toLocaleTimeString(),
    message: `📢 ${broadcaster.role} broadcasts: "${generateMessage(broadcaster)}"`,
    type: 'broadcast',
    round: simulationState.round
  });
  
  simulationState.logs = [...simulationState.logs, ...logs].slice(-500);
  return simulationState;
}

// Routes
app.get('/api/simulate', (req, res) => {
  if (!simulationState.agents.length) initializeSimulation();
  res.json(simulationState);
});

app.post('/api/simulate/init', (req, res) => {
  const { numAgents = 4 } = req.body;
  res.json(initializeSimulation({ numAgents }));
});

app.post('/api/simulate/start', (req, res) => {
  simulationState.isRunning = true;
  simulationState.logs.push({
    time: new Date().toLocaleTimeString(),
    message: '▶️ Simulation started',
    type: 'system',
    round: simulationState.round
  });
  res.json(simulationState);
});

app.post('/api/simulate/stop', (req, res) => {
  simulationState.isRunning = false;
  simulationState.logs.push({
    time: new Date().toLocaleTimeString(),
    message: '⏹️ Simulation stopped',
    type: 'system',
    round: simulationState.round
  });
  res.json(simulationState);
});

app.post('/api/simulate/step', (req, res) => {
  res.json(stepSimulation());
});

app.post('/api/simulate/reset', (req, res) => {
  res.json(initializeSimulation());
});

app.post('/api/simulate/clear', (req, res) => {
  simulationState.logs = [];
  res.json(simulationState);
});

// For local dev
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 API: http://localhost:${PORT}`));
}

module.exports = app;
module.exports.handler = serverless(app);
