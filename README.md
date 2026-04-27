# mcp-flow

**mcp-flow** is a professional-grade, node-based no-code platform for creating and deploying [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers visually. Build powerful tools for AI agents (Claude, ChatGPT, Cursor, Copilot) without writing a single line of code.

## Features

- **Visual Workflow Builder**: Drag-and-drop interface powered by React Flow.
- **MCP Native**: Out-of-the-box support for MCP tool definitions and schemas.
- **Instant Deployment**: Publish your workflows as hosted MCP endpoints.
- **Dynamic Nodes**: HTTP requests, JSON transformations, conditional logic, and secret management.
- **Security First**: Encrypted secrets, rate limiting, and sandboxed execution.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, React Flow.
- **Backend**: NestJS, Node.js, TypeScript, [mcp-use](https://mcp-use.com/).
- **Database**: PostgreSQL (Prisma ORM).
- **Monorepo**: pnpm workspaces.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v9+)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/udaykumar-dhokia/mcp-flow.git
   cd mcp-flow
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Setup environment variables:
   Copy `.env.example` to `.env` in both `frontend` and `backend` directories and fill in the required values.

### Development

Start both frontend and backend in development mode:

```bash
pnpm dev
```

- **Frontend**: [http://localhost:1528](http://localhost:1528)
- **Backend**: [http://localhost:2815](http://localhost:2815)

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you like this project, please give it a star! ⭐
