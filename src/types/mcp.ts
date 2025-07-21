export interface MCPServer {
  id: string
  name: string
  url: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'authenticating'
  transport: 'sse' | 'websocket' | 'stdio'
  capabilities?: MCPCapabilities
  lastConnected?: Date
  error?: string
  authentication?: MCPAuthentication
}

export interface MCPAuthentication {
  type: 'none' | 'bearer' | 'oauth' | 'api_key'
  credentials?: MCPCredentials
  config?: AuthConfig
}

export interface MCPCredentials {
  // Bearer/API Key authentication
  token?: string
  apiKey?: string
  
  // OAuth authentication
  accessToken?: string
  refreshToken?: string
  tokenType?: string
  expiresAt?: Date
  scope?: string
  
  // OAuth client info
  clientId?: string
  clientSecret?: string
}

export interface AuthConfig {
  // OAuth configuration
  authorizationUrl?: string
  tokenUrl?: string
  scope?: string
  redirectUrl?: string
  
  // API Key configuration
  headerName?: string // e.g., 'Authorization', 'X-API-Key'
  headerPrefix?: string // e.g., 'Bearer ', 'ApiKey '
  
  // Security
  requiresHttps?: boolean
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