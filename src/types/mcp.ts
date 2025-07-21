export interface MCPServer {
  id: string
  name: string
  url: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  transport: 'sse' | 'websocket' | 'stdio'
  capabilities?: MCPCapabilities
  lastConnected?: Date
  error?: string
}

export interface MCPCapabilities {
  tools?: MCPTool[]
  resources?: MCPResource[]
  prompts?: MCPPrompt[]
}

export interface MCPTool {
  name: string
  description?: string
  inputSchema?: {
    type: string
    properties?: Record<string, any>
    required?: string[]
  }
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface MCPPrompt {
  name: string
  description?: string
  arguments?: MCPPromptArgument[]
}

export interface MCPPromptArgument {
  name: string
  description?: string
  required?: boolean
}