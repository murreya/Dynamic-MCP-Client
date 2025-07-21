# Dynamic MCP Client

A dynamic Model Context Protocol (MCP) client application that allows users to connect multiple remote MCP servers and provides a responsive UI that adapts to the tools, data, and resources each server offers.

## Features

- 🔌 **Multi-Server Connection**: Connect to multiple MCP servers simultaneously
- 🎨 **Dynamic UI**: Interface adapts based on available tools and resources
- 📊 **Marketing Tools**: Specialized components for marketing automation
- 📈 **Analytics Dashboard**: Real-time data visualization
- 👥 **Contact Management**: CRM-like features for managing contacts
- 🚀 **Real-time Updates**: WebSocket/SSE for live data streaming

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + React Query
- **MCP Integration**: @modelcontextprotocol/sdk
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/     # UI components
├── hooks/         # Custom React hooks
├── services/      # MCP and API services
├── store/         # State management
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler

## License

MIT
