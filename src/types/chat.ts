export interface ChatMessage {
  id: string
  type: 'user' | 'system' | 'server_response' | 'error' | 'tool_result' | 'connection_status'
  content: string | RichContent
  timestamp: Date
  serverId?: string
  metadata?: {
    toolName?: string
    resourceUri?: string
    intent?: string
    connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error'
    error?: string
  }
}

export interface RichContent {
  type: 'card' | 'chart' | 'table' | 'image' | 'contact' | 'server_status' | 'tool_result'
  data: any
  interactive?: boolean
  title?: string
  description?: string
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  serverId?: string
}

export type MessageIntent = 
  | 'connect_server'
  | 'disconnect_server'
  | 'list_servers'
  | 'execute_tool'
  | 'get_resource'
  | 'list_tools'
  | 'list_resources'
  | 'help'
  | 'unknown'

export interface ParsedCommand {
  intent: MessageIntent
  parameters: Record<string, any>
  confidence: number
  originalMessage: string
}