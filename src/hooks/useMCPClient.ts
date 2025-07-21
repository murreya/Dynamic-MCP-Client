import { useCallback, useEffect } from 'react'
import { useMCPStore } from '../store/mcpStore'
import { mcpClientManager } from '../services/mcp/mcpClient'
import type { MCPServer } from '../types/mcp'

export function useMCPClient() {
  const {
    servers,
    activeServerId,
    addServer,
    removeServer,
    updateServerStatus,
    updateServerCapabilities,
    setActiveServer,
    getServer,
  } = useMCPStore()
  
  // Handle OAuth code exchange on component mount
  useEffect(() => {
    const handleOAuthReturn = async () => {
      const authCode = localStorage.getItem('mcp_auth_code')
      const serverId = localStorage.getItem('mcp_auth_server_id')
      const oauthState = localStorage.getItem('mcp_oauth_state')
      
      if (authCode && serverId && oauthState) {
        try {
          console.log('Processing OAuth return for server:', serverId)
          const state = JSON.parse(oauthState)
          
          // Check if OAuth state is still valid (not too old)
          const maxAge = 10 * 60 * 1000 // 10 minutes
          if (Date.now() - state.timestamp > maxAge) {
            console.warn('OAuth state expired, cleaning up')
            localStorage.removeItem('mcp_oauth_state')
            localStorage.removeItem('mcp_auth_server_id')
            localStorage.removeItem('mcp_auth_server_url')
            return
          }
          
          // Find the server
          const server = getServer(serverId)
          if (!server) {
            console.error('Server not found for OAuth return:', serverId)
            return
          }
          
          if (server.authentication?.type === 'oauth') {
            // The MCP SDK will automatically handle the code exchange
            // We just need to trigger a reconnection
            console.log('Reconnecting to server with OAuth credentials...')
            try {
              await connectToServer(serverId)
            } catch (connectError) {
              console.error('Failed to reconnect after OAuth:', connectError)
              // Update server status with error
              updateServerStatus(serverId, 'error', 'Failed to complete OAuth authentication')
            }
          }
          
          // Clean up OAuth state
          localStorage.removeItem('mcp_oauth_state')
          localStorage.removeItem('mcp_auth_server_id')
          localStorage.removeItem('mcp_auth_server_url')
        } catch (error) {
          console.error('Error processing OAuth return:', error)
          // Clean up on any error
          localStorage.removeItem('mcp_oauth_state')
          localStorage.removeItem('mcp_auth_server_id')
          localStorage.removeItem('mcp_auth_server_url')
          
          // Update server status if we can identify it
          if (serverId) {
            updateServerStatus(serverId, 'error', 'OAuth processing failed')
          }
        }
      }
    }
    
    // Small delay to ensure stores are initialized
    setTimeout(handleOAuthReturn, 200)
  }, [getServer, updateServerStatus])
  
  const connectToServer = useCallback(async (serverId: string) => {
    const server = getServer(serverId)
    if (!server) {
      console.error('Server not found:', serverId)
      return
    }
    
    const capabilities = await mcpClientManager.connectToServer(
      server,
      (status, error) => {
        updateServerStatus(serverId, status, error)
      }
    )
    
    if (capabilities) {
      updateServerCapabilities(serverId, capabilities)
    }
  }, [getServer, updateServerStatus, updateServerCapabilities])
  
  const disconnectFromServer = useCallback(async (serverId: string) => {
    await mcpClientManager.disconnectFromServer(serverId)
    updateServerStatus(serverId, 'disconnected')
  }, [updateServerStatus])
  
  const addAndConnectServer = useCallback(async (serverData: Omit<MCPServer, 'id' | 'status'>) => {
    const serverId = addServer(serverData)
    await connectToServer(serverId)
    return serverId
  }, [addServer, connectToServer])
  
  const removeAndDisconnectServer = useCallback(async (serverId: string) => {
    await disconnectFromServer(serverId)
    removeServer(serverId)
  }, [disconnectFromServer, removeServer])
  
  const callTool = useCallback(async (serverId: string, toolName: string, args: any) => {
    return await mcpClientManager.callTool(serverId, toolName, args)
  }, [])
  
  const getResource = useCallback(async (serverId: string, uri: string) => {
    return await mcpClientManager.getResource(serverId, uri)
  }, [])
  
  return {
    servers,
    activeServerId,
    activeServer: activeServerId ? getServer(activeServerId) : null,
    
    // Connection management
    connectToServer,
    disconnectFromServer,
    addAndConnectServer,
    removeAndDisconnectServer,
    
    // Server management
    setActiveServer,
    
    // MCP operations
    callTool,
    getResource,
  }
}