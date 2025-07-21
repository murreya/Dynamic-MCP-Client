import { useCallback } from 'react'
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