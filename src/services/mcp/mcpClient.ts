import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js'
import type { MCPServer, MCPCapabilities } from '../../types/mcp'

export class MCPClientManager {
  private clients: Map<string, Client> = new Map()
  private transports: Map<string, any> = new Map()
  
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
          transport = new StreamableHTTPClientTransport(new URL(server.url))
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
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Provide more specific error messages
        if (error.message.includes('CORS')) {
          errorMessage = `CORS Error: The server at ${server.url} doesn't allow browser connections. You may need to use a different transport or configure CORS.`
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = `Network Error: Cannot reach ${server.url}. Check if the server is running and accessible.`
        } else if (error.message.includes('Authentication') || error.message.includes('401')) {
          errorMessage = `Authentication Error: The server requires authentication. You may need to provide API keys or tokens.`
        } else if (error.message.includes('404')) {
          errorMessage = `Server Not Found: The MCP endpoint at ${server.url} doesn't exist or has moved.`
        }
      }
      
      onStatusUpdate('error', errorMessage)
      return null
    }
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