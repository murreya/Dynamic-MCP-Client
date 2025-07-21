import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js'
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js'
import type { MCPServer, MCPCapabilities, MCPCredentials } from '../../types/mcp'
import { authService } from '../auth/authService'

export class MCPClientManager {
  private clients: Map<string, Client> = new Map()
  private transports: Map<string, any> = new Map()
  private onServerUpdate?: (serverId: string, updates: Partial<MCPServer>) => void
  
  setOnServerUpdate(callback: (serverId: string, updates: Partial<MCPServer>) => void) {
    this.onServerUpdate = callback
  }
  
  async connectToServer(server: MCPServer, onStatusUpdate: (status: MCPServer['status'], error?: string) => void): Promise<MCPCapabilities | null> {
    try {
      onStatusUpdate('connecting')
      
      // Close existing connection if any
      await this.disconnectFromServer(server.id)
      
      // Create transport based on type
      let transport: any
      
      if (server.transport === 'sse') {
        console.log(`Trying Streamable HTTP transport for ${server.url}`)
        try {
          // Try the newer Streamable HTTP transport first
          const transportOptions: any = {}
          
          // Add authentication if configured
          if (server.authentication && authService.areCredentialsValid(server.authentication)) {
            const authHeaders = authService.getAuthHeaders(server.authentication)
            transportOptions.requestInit = {
              headers: authHeaders
            }
            
            // For OAuth, add the OAuth provider
            if (server.authentication.type === 'oauth') {
              const updateCredentials = (credentials: MCPCredentials) => {
                this.onServerUpdate?.(server.id, {
                  authentication: {
                    ...server.authentication!,
                    credentials
                  }
                })
              }
              
              transportOptions.authProvider = authService.createOAuthProvider(
                server.id, 
                server, 
                updateCredentials
              )
            }
          }
          
          transport = new StreamableHTTPClientTransport(new URL(server.url), transportOptions)
        } catch (error) {
          console.log(`Streamable HTTP failed, falling back to SSE transport`, error)
          // Fallback to older SSE transport
          transport = new SSEClientTransport(new URL(server.url))
        }
      } else if (server.transport === 'websocket') {
        console.log(`Creating WebSocket transport for ${server.url}`)
        transport = new WebSocketClientTransport(new URL(server.url))
      } else {
        throw new Error(`Unsupported transport type: ${server.transport}`)
      }
      
      // Create and connect client
      const client = new Client({
        name: `dynamic-mcp-client-${server.id}`,
        version: '1.0.0',
      }, {
        capabilities: {}
      })
      
      console.log('Connecting MCP client with transport...')
      
      // Note: For StreamableHTTP, client.connect() calls transport.start() automatically
      // So we don't need to call transport.start() manually
      await client.connect(transport)
      console.log('MCP client connected successfully!')
      
      // Get server capabilities
      const capabilities: MCPCapabilities = {}
      
      // List tools
      try {
        const toolsResponse = await client.listTools()
        if (toolsResponse.tools && toolsResponse.tools.length > 0) {
          capabilities.tools = toolsResponse.tools
        }
      } catch (error) {
        console.warn('Failed to list tools:', error)
      }
      
      // List resources
      try {
        const resourcesResponse = await client.listResources()
        if (resourcesResponse.resources && resourcesResponse.resources.length > 0) {
          capabilities.resources = resourcesResponse.resources
        }
      } catch (error) {
        console.warn('Failed to list resources:', error)
      }
      
      // List prompts
      try {
        const promptsResponse = await client.listPrompts()
        if (promptsResponse.prompts && promptsResponse.prompts.length > 0) {
          capabilities.prompts = promptsResponse.prompts
        }
      } catch (error) {
        console.warn('Failed to list prompts:', error)
      }
      
      // Store client and transport
      this.clients.set(server.id, client)
      this.transports.set(server.id, transport)
      
      onStatusUpdate('connected')
      return capabilities
      
    } catch (error) {
      console.error('Failed to connect to MCP server:', error)
      
      let errorMessage = 'Unknown error'
      let requiresAuth = false
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Check if this is an authentication error (but not CORS)
        const isCorsError = error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')
        
        if (!isCorsError && (error instanceof UnauthorizedError || error.message.includes('401') || error.message.includes('Unauthorized'))) {
          requiresAuth = true
          errorMessage = 'Authentication required. Please configure authentication credentials.'
        } else if (!isCorsError && (error.message.includes('invalid token') || error.message.includes('access token'))) {
          requiresAuth = true
          errorMessage = 'Invalid or expired authentication credentials. Please update your authentication.'
        } else if (error.message.includes('oauth') && error.message.toLowerCase().includes('cancelled')) {
          errorMessage = 'OAuth authentication was cancelled. You can try connecting again.'
        } else if (error.message.includes('oauth') && error.message.toLowerCase().includes('timeout')) {
          errorMessage = 'OAuth authentication timed out. Please try again.'
        } else if (error.message.includes('oauth') && error.message.toLowerCase().includes('blocked')) {
          errorMessage = 'OAuth authentication was blocked. Please allow redirects and try again.'
        } else if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
          errorMessage = `CORS Error: The server at ${server.url} doesn't allow browser connections from this origin (${window.location.origin}).\n\nThis is a server-side configuration issue. The MCP server needs to:\n1. Add CORS headers allowing your domain\n2. Or be accessed through a proxy that handles CORS\n3. Or run locally without browser restrictions\n\nNote: This is not an authentication issue.`
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = `Network Error: Cannot reach ${server.url}. Check if the server is running and accessible.`
        } else if (error.message.includes('404')) {
          errorMessage = `Server Not Found: The MCP endpoint at ${server.url} doesn't exist or has moved.`
        } else if (error.message.includes('403')) {
          errorMessage = `Access Forbidden: You don't have permission to access this server. Check your authentication credentials.`
        } else if (error.message.includes('500')) {
          errorMessage = `Server Error: The MCP server is experiencing internal problems. Please try again later.`
        } else if (error.message.includes('timeout')) {
          errorMessage = `Connection Timeout: The server took too long to respond. Please try again.`
        }
      }
      
      // If authentication is required, automatically initiate OAuth flow
      if (requiresAuth && !server.authentication) {
        // Try to get more info from the error if it's a fetch response
        try {
          if (error instanceof Error && error.message.includes('POST') && error.message.includes('401')) {
            // This looks like our StreamableHTTP transport error
            // Set up OAuth configuration for this server
            const hostname = new URL(server.url).hostname.toLowerCase()
            const oauthConfig = this.getDefaultOAuthConfig(hostname, server)
            
            this.onServerUpdate?.(server.id, {
              authentication: oauthConfig
            })
            
            // Automatically initiate OAuth flow
            console.log('Initiating OAuth flow for server:', server.id)
            onStatusUpdate('authenticating', 'Starting OAuth authentication...')
            
            try {
              // Create OAuth provider and initiate flow
              const updateCredentials = (credentials: MCPCredentials) => {
                this.onServerUpdate?.(server.id, {
                  authentication: {
                    ...oauthConfig,
                    credentials
                  }
                })
              }
              
              const oauthProvider = authService.createOAuthProvider(
                server.id,
                { ...server, authentication: oauthConfig },
                updateCredentials
              )
              
              // This will redirect to OAuth provider
              await this.initiateOAuthFlow(oauthProvider, server)
              return null // Return null to indicate OAuth flow initiated
              
            } catch (oauthError) {
              console.error('Failed to initiate OAuth flow:', oauthError)
              
              if (oauthError instanceof Error && oauthError.message.includes('CLIENT_ID_REQUIRED')) {
                const hostname = new URL(server.url).hostname.toLowerCase()
                if (hostname.includes('atlassian.com')) {
                  errorMessage = 'Atlassian OAuth authentication detected. Please:\n\n1. Click "Configure Auth" button\n2. Create an OAuth app at: https://developer.atlassian.com/console/myapps/\n3. Set redirect URI to: ' + window.location.origin + '/auth/callback\n4. Enter your Client ID and try connecting again.'
                } else {
                  errorMessage = 'OAuth authentication required. Please configure OAuth credentials by clicking the "Configure Auth" button first.'
                }
              } else {
                errorMessage = 'Failed to start OAuth authentication. Please check your browser settings and try again.'
              }
            }
          }
        } catch (detectionError) {
          console.warn('Failed to detect auth requirements:', detectionError)
        }
      }
      
      onStatusUpdate('error', errorMessage)
      return null
    }
  }
  
  private async initiateOAuthFlow(oauthProvider: any, server: MCPServer): Promise<void> {
    // For Atlassian and other common MCP servers, we need to use their OAuth endpoints
    const authorizationUrl = this.getOAuthAuthorizationUrl(server)
    
    if (authorizationUrl) {
      console.log('Redirecting to OAuth provider:', authorizationUrl)
      await oauthProvider.redirectToAuthorization(new URL(authorizationUrl))
    } else {
      throw new Error('Could not determine OAuth authorization URL for this server')
    }
  }
  
  private getDefaultOAuthConfig(hostname: string, server: MCPServer): any {
    // Return provider-specific OAuth configurations
    if (hostname.includes('atlassian.com')) {
      return {
        type: 'oauth' as const,
        config: {
          requiresHttps: true,
          scope: 'read:jira-user read:confluence-content.all read:jira-work',
          authorizationUrl: 'https://auth.atlassian.com/authorize',
          tokenUrl: 'https://auth.atlassian.com/oauth/token',
          audience: 'api.atlassian.com'
        },
        credentials: {
          // Note: User needs to provide real client ID
          clientId: 'ATLASSIAN_CLIENT_ID_REQUIRED'
        }
      }
    }
    
    if (hostname.includes('github.com')) {
      return {
        type: 'oauth' as const,
        config: {
          requiresHttps: true,
          scope: 'repo user',
          authorizationUrl: 'https://github.com/login/oauth/authorize',
          tokenUrl: 'https://github.com/login/oauth/access_token'
        },
        credentials: {
          clientId: 'GITHUB_CLIENT_ID_REQUIRED'
        }
      }
    }
    
    // Generic OAuth config
    return {
      type: 'oauth' as const,
      config: {
        requiresHttps: server.url.startsWith('https://'),
        scope: 'read write'
      },
      credentials: {
        clientId: 'OAUTH_CLIENT_ID_REQUIRED'
      }
    }
  }
  
  private getOAuthAuthorizationUrl(server: MCPServer): string | null {
    const url = new URL(server.url)
    const hostname = url.hostname.toLowerCase()
    
    // Map common MCP servers to their OAuth endpoints
    if (hostname.includes('atlassian.com')) {
      const clientId = server.authentication?.credentials?.clientId
      if (!clientId || clientId === 'ATLASSIAN_CLIENT_ID_REQUIRED') {
        throw new Error('Atlassian OAuth requires a valid Client ID. Please create an app at https://developer.atlassian.com/console/myapps/')
      }
      
      return 'https://auth.atlassian.com/authorize?' + new URLSearchParams({
        audience: 'api.atlassian.com',
        client_id: clientId,
        scope: server.authentication?.config?.scope || 'read:jira-user read:confluence-content.all',
        redirect_uri: window.location.origin + '/auth/callback',
        state: crypto.randomUUID(),
        response_type: 'code',
        prompt: 'consent'
      }).toString()
    }
    
    // Add support for other common OAuth providers
    if (hostname.includes('github.com')) {
      const clientId = server.authentication?.credentials?.clientId
      if (!clientId || clientId === 'GITHUB_CLIENT_ID_REQUIRED') {
        throw new Error('GitHub OAuth requires a valid Client ID. Please create an app at https://github.com/settings/developers')
      }
      
      return 'https://github.com/login/oauth/authorize?' + new URLSearchParams({
        client_id: clientId,
        scope: server.authentication?.config?.scope || 'repo user',
        redirect_uri: window.location.origin + '/auth/callback',
        state: crypto.randomUUID()
      }).toString()
    }
    
    // Generic OAuth 2.0 endpoint detection
    if (server.authentication?.config?.authorizationUrl) {
      return server.authentication.config.authorizationUrl
    }
    
    return null
  }
  
  async disconnectFromServer(serverId: string): Promise<void> {
    const client = this.clients.get(serverId)
    const transport = this.transports.get(serverId)
    
    if (client) {
      try {
        await client.close()
      } catch (error) {
        console.error('Error closing client:', error)
      }
      this.clients.delete(serverId)
    }
    
    if (transport) {
      try {
        if (transport instanceof StreamableHTTPClientTransport) {
          // For StreamableHTTP, we can terminate the session cleanly
          await transport.terminateSession()
        }
        await transport.close()
      } catch (error) {
        console.error('Error closing transport:', error)
      }
      this.transports.delete(serverId)
    }
  }
  
  async callTool(serverId: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(serverId)
    if (!client) {
      throw new Error('Server not connected')
    }
    
    const response = await client.callTool({
      name: toolName,
      arguments: args,
    })
    
    return response.content
  }
  
  async getResource(serverId: string, uri: string): Promise<any> {
    const client = this.clients.get(serverId)
    if (!client) {
      throw new Error('Server not connected')
    }
    
    const response = await client.readResource({
      uri,
    })
    
    return response.contents
  }
  
  getClient(serverId: string): Client | undefined {
    return this.clients.get(serverId)
  }
}

export const mcpClientManager = new MCPClientManager()