import { Node, Edge } from '@xyflow/react';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Node[];
  edges: Edge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'weather-tool',
    name: 'Weather Lookup',
    description: 'Fetch current weather data for any city using a public API.',
    category: 'API Integration',
    nodes: [
      {
        id: 'input-1',
        type: 'inputNode',
        position: { x: 300, y: 40 },
        data: {
          name: 'get_weather',
          description: 'Get current weather for a given city',
          parameters: [
            {
              name: 'city',
              type: 'string',
              description: 'City name (e.g. London)',
              required: true,
              defaultValue: '',
            },
          ],
        },
      },
      {
        id: 'http-1',
        type: 'httpNode',
        position: { x: 300, y: 220 },
        data: {
          method: 'GET',
          url: 'https://wttr.in/{{input.city}}?format=j1',
          headers: {},
          body: '',
        },
      },
      {
        id: 'transform-1',
        type: 'transformNode',
        position: { x: 300, y: 400 },
        data: {
          mappings: [
            { from: 'current_condition.0.temp_C', to: 'temperature' },
            { from: 'current_condition.0.weatherDesc.0.value', to: 'condition' },
            { from: 'current_condition.0.humidity', to: 'humidity' },
          ],
          expression: '',
        },
      },
      {
        id: 'output-1',
        type: 'outputNode',
        position: { x: 300, y: 570 },
        data: { outputType: 'text' },
      },
    ],
    edges: [
      {
        id: 'e-1',
        source: 'input-1',
        target: 'http-1',
        type: 'customEdge',
      },
      {
        id: 'e-2',
        source: 'http-1',
        target: 'transform-1',
        type: 'customEdge',
      },
      {
        id: 'e-3',
        source: 'transform-1',
        target: 'output-1',
        type: 'customEdge',
      },
    ],
  },
  {
    id: 'github-repo',
    name: 'GitHub Repository Info',
    description: 'Retrieve repository details from the GitHub REST API.',
    category: 'API Integration',
    nodes: [
      {
        id: 'input-1',
        type: 'inputNode',
        position: { x: 300, y: 40 },
        data: {
          name: 'get_repo',
          description: 'Get GitHub repository information',
          parameters: [
            {
              name: 'owner',
              type: 'string',
              description: 'Repository owner',
              required: true,
              defaultValue: '',
            },
            {
              name: 'repo',
              type: 'string',
              description: 'Repository name',
              required: true,
              defaultValue: '',
            },
          ],
        },
      },
      {
        id: 'http-1',
        type: 'httpNode',
        position: { x: 300, y: 250 },
        data: {
          method: 'GET',
          url: 'https://api.github.com/repos/{{input.owner}}/{{input.repo}}',
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'MCP-Flow',
          },
          body: '',
        },
      },
      {
        id: 'transform-1',
        type: 'transformNode',
        position: { x: 300, y: 440 },
        data: {
          mappings: [
            { from: 'full_name', to: 'name' },
            { from: 'description', to: 'description' },
            { from: 'stargazers_count', to: 'stars' },
            { from: 'forks_count', to: 'forks' },
            { from: 'language', to: 'language' },
          ],
          expression: '',
        },
      },
      {
        id: 'output-1',
        type: 'outputNode',
        position: { x: 300, y: 620 },
        data: { outputType: 'text' },
      },
    ],
    edges: [
      {
        id: 'e-1',
        source: 'input-1',
        target: 'http-1',
        type: 'customEdge',
      },
      {
        id: 'e-2',
        source: 'http-1',
        target: 'transform-1',
        type: 'customEdge',
      },
      {
        id: 'e-3',
        source: 'transform-1',
        target: 'output-1',
        type: 'customEdge',
      },
    ],
  },
  {
    id: 'api-proxy-auth',
    name: 'Authenticated API Proxy',
    description: 'Proxy requests to any API with a secret API key for authentication.',
    category: 'Security',
    nodes: [
      {
        id: 'input-1',
        type: 'inputNode',
        position: { x: 300, y: 40 },
        data: {
          name: 'api_request',
          description: 'Make an authenticated API request',
          parameters: [
            {
              name: 'endpoint',
              type: 'string',
              description: 'API endpoint path',
              required: true,
              defaultValue: '',
            },
          ],
        },
      },
      {
        id: 'secret-1',
        type: 'secretNode',
        position: { x: 60, y: 180 },
        data: {
          secretKey: 'API_KEY',
          secretValue: '',
          description: 'API authentication key',
        },
      },
      {
        id: 'http-1',
        type: 'httpNode',
        position: { x: 300, y: 260 },
        data: {
          method: 'GET',
          url: 'https://api.example.com/{{input.endpoint}}',
          headers: {
            Authorization: 'Bearer {{secret.API_KEY}}',
          },
          body: '',
        },
      },
      {
        id: 'output-1',
        type: 'outputNode',
        position: { x: 300, y: 440 },
        data: { outputType: 'text' },
      },
    ],
    edges: [
      {
        id: 'e-1',
        source: 'input-1',
        target: 'http-1',
        type: 'customEdge',
      },
      {
        id: 'e-2',
        source: 'secret-1',
        target: 'http-1',
        type: 'customEdge',
      },
      {
        id: 'e-3',
        source: 'http-1',
        target: 'output-1',
        type: 'customEdge',
      },
    ],
  },
  {
    id: 'full-pipeline',
    name: 'Full Pipeline (All Nodes)',
    description:
      'A comprehensive workflow using every node type: Input, Secret, HTTP, Transform, Condition, and Output.',
    category: 'Showcase',
    nodes: [
      {
        id: 'input-1',
        type: 'inputNode',
        position: { x: 340, y: 30 },
        data: {
          name: 'lookup_user',
          description: 'Look up a GitHub user and decide if they are hireable',
          parameters: [
            {
              name: 'username',
              type: 'string',
              description: 'GitHub username to look up',
              required: true,
              defaultValue: '',
            },
          ],
        },
      },
      {
        id: 'secret-1',
        type: 'secretNode',
        position: { x: 60, y: 170 },
        data: {
          secretKey: 'GITHUB_TOKEN',
          secretValue: '',
          description: 'Optional GitHub personal access token for higher rate limits',
        },
      },
      {
        id: 'http-1',
        type: 'httpNode',
        position: { x: 340, y: 210 },
        data: {
          method: 'GET',
          url: 'https://api.github.com/users/{{input.username}}',
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'MCP-Flow',
            Authorization: 'Bearer {{secret.GITHUB_TOKEN}}',
          },
          body: '',
        },
      },
      {
        id: 'transform-1',
        type: 'transformNode',
        position: { x: 340, y: 400 },
        data: {
          mappings: [
            { from: 'login', to: 'username' },
            { from: 'name', to: 'displayName' },
            { from: 'public_repos', to: 'repoCount' },
            { from: 'followers', to: 'followers' },
            { from: 'hireable', to: 'isHireable' },
            { from: 'bio', to: 'bio' },
          ],
          expression: '',
        },
      },
      {
        id: 'condition-1',
        type: 'conditionNode',
        position: { x: 340, y: 590 },
        data: {
          field: 'isHireable',
          operator: 'equals',
          value: 'true',
        },
      },
      {
        id: 'output-hireable',
        type: 'outputNode',
        position: { x: 140, y: 770 },
        data: { outputType: 'widget' },
      },
      {
        id: 'output-not-hireable',
        type: 'outputNode',
        position: { x: 540, y: 770 },
        data: { outputType: 'text' },
      },
    ],
    edges: [
      {
        id: 'e-1',
        source: 'input-1',
        target: 'http-1',
        type: 'customEdge',
      },
      {
        id: 'e-2',
        source: 'secret-1',
        target: 'http-1',
        type: 'customEdge',
      },
      {
        id: 'e-3',
        source: 'http-1',
        target: 'transform-1',
        type: 'customEdge',
      },
      {
        id: 'e-4',
        source: 'transform-1',
        target: 'condition-1',
        type: 'customEdge',
      },
      {
        id: 'e-5',
        source: 'condition-1',
        sourceHandle: 'true',
        target: 'output-hireable',
        type: 'customEdge',
        data: { branch: 'true' },
      },
      {
        id: 'e-6',
        source: 'condition-1',
        sourceHandle: 'false',
        target: 'output-not-hireable',
        type: 'customEdge',
        data: { branch: 'false' },
      },
    ],
  },
  {
    id: 'joke-generator',
    name: 'Random Joke',
    description: 'Fetch a random programming joke from a public API.',
    category: 'Fun',
    nodes: [
      {
        id: 'input-1',
        type: 'inputNode',
        position: { x: 300, y: 40 },
        data: {
          name: 'get_joke',
          description: 'Get a random programming joke',
          parameters: [],
        },
      },
      {
        id: 'http-1',
        type: 'httpNode',
        position: { x: 300, y: 200 },
        data: {
          method: 'GET',
          url: 'https://official-joke-api.appspot.com/jokes/programming/random',
          headers: {},
          body: '',
        },
      },
      {
        id: 'output-1',
        type: 'outputNode',
        position: { x: 300, y: 380 },
        data: { outputType: 'text' },
      },
    ],
    edges: [
      {
        id: 'e-1',
        source: 'input-1',
        target: 'http-1',
        type: 'customEdge',
      },
      {
        id: 'e-2',
        source: 'http-1',
        target: 'output-1',
        type: 'customEdge',
      },
    ],
  },
];
