import { create } from 'zustand'
import type { MCPServer } from '../types/mcp'

interface MCPStore {
  servers: MCPServer[]
  activeServerId: string | null
  
  // Actions
  addServer: (server: Omit<MCPServer, 'id' | 'status'>) => string
  removeServer: (id: string) => void
  updateServerStatus: (id: string, status: MCPServer['status'], error?: string) => void
  updateServerCapabilities: (id: string, capabilities: MCPServer['capabilities']) => void
  setActiveServer: (id: string | null) => void
  getServer: (id: string) => MCPServer | undefined
}

export const useMCPStore = create<MCPStore>((set, get) => ({
  servers: [],
  activeServerId: null,
  
  addServer: (serverData) => {
    const newServer: MCPServer = {
      ...serverData,
      id: crypto.randomUUID(),
      status: 'disconnected',
    }
    
    set((state) => ({
      servers: [...state.servers, newServer],
    }))
    
    return newServer.id
  },
  
  removeServer: (id) => {
    set((state) => ({
      servers: state.servers.filter(s => s.id !== id),
      activeServerId: state.activeServerId === id ? null : state.activeServerId,
    }))
  },
  
  updateServerStatus: (id, status, error) => {
    set((state) => ({
      servers: state.servers.map(s => 
        s.id === id 
          ? { 
              ...s, 
              status, 
              error,
              lastConnected: status === 'connected' ? new Date() : s.lastConnected 
            } 
          : s
      ),
    }))
  },
  
  updateServerCapabilities: (id, capabilities) => {
    set((state) => ({
      servers: state.servers.map(s => 
        s.id === id ? { ...s, capabilities } : s
      ),
    }))
  },
  
  setActiveServer: (id) => {
    set({ activeServerId: id })
  },
  
  getServer: (id) => {
    return get().servers.find(s => s.id === id)
  },
}))