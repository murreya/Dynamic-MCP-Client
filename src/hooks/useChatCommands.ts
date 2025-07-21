import { useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { useMCPClient } from './useMCPClient'
import type { ParsedCommand, RichContent } from '../types/chat'
import { isValidServerUrl, isValidToolName, mcpRateLimiter } from '../utils/security'

export function useChatCommands() {
  const { 
    addSystemMessage, 
    addErrorMessage, 
    setTyping,
    getActiveConversation,
  } = useChatStore()
  
  const { 
    servers, 
    connectToServer, 
    disconnectFromServer, 
    addAndConnectServer,
    callTool,
    getResource,
  } = useMCPClient()
  
  const parseCommand = useCallback((message: string): ParsedCommand => {
    const lowerMessage = message.toLowerCase().trim()
    
    // Connect server patterns
    if (lowerMessage.includes('connect') && (lowerMessage.includes('server') || lowerMessage.includes('http'))) {
      const urlMatch = message.match(/(https?:\/\/[^\s]+)/i)
      const nameMatch = message.match(/(?:connect (?:to )?(?:server )?(?:named |called )?["\']([^"\']+)["\']|connect ["\']([^"\']+)["\'])/i)
      
      return {
        intent: 'connect_server',
        parameters: {
          url: urlMatch?.[1] || '',
          name: nameMatch?.[1] || nameMatch?.[2] || 'New Server',
        },
        confidence: urlMatch ? 0.9 : 0.3,
        originalMessage: message,
      }
    }
    
    // Disconnect server patterns
    if (lowerMessage.includes('disconnect') && lowerMessage.includes('server')) {
      return {
        intent: 'disconnect_server',
        parameters: {},
        confidence: 0.9,
        originalMessage: message,
      }
    }
    
    // List servers
    if ((lowerMessage.includes('list') || lowerMessage.includes('show')) && lowerMessage.includes('server')) {
      return {
        intent: 'list_servers',
        parameters: {},
        confidence: 0.9,
        originalMessage: message,
      }
    }
    
    // List tools
    if ((lowerMessage.includes('list') || lowerMessage.includes('show')) && (lowerMessage.includes('tool') || lowerMessage.includes('function'))) {
      return {
        intent: 'list_tools',
        parameters: {},
        confidence: 0.9,
        originalMessage: message,
      }
    }
    
    // List resources
    if ((lowerMessage.includes('list') || lowerMessage.includes('show')) && lowerMessage.includes('resource')) {
      return {
        intent: 'list_resources',
        parameters: {},
        confidence: 0.9,
        originalMessage: message,
      }
    }
    
    // Execute tool patterns
    if (lowerMessage.includes('run') || lowerMessage.includes('execute') || lowerMessage.includes('call')) {
      const toolNameMatch = message.match(/(?:run|execute|call)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i)
      if (toolNameMatch) {
        return {
          intent: 'execute_tool',
          parameters: {
            toolName: toolNameMatch[1],
            args: {},
          },
          confidence: 0.8,
          originalMessage: message,
        }
      }
    }
    
    // Help patterns
    if (lowerMessage.includes('help') || lowerMessage === '?' || lowerMessage.includes('command')) {
      return {
        intent: 'help',
        parameters: {},
        confidence: 1.0,
        originalMessage: message,
      }
    }
    
    // Default to unknown
    return {
      intent: 'unknown',
      parameters: {},
      confidence: 0.0,
      originalMessage: message,
    }
  }, [])
  
  const executeCommand = useCallback(async (command: ParsedCommand): Promise<void> => {
    setTyping(true)
    
    try {
      switch (command.intent) {
        case 'connect_server':
          await handleConnectServer(command.parameters.url, command.parameters.name)
          break
          
        case 'disconnect_server':
          await handleDisconnectServer()
          break
          
        case 'list_servers':
          handleListServers()
          break
          
        case 'list_tools':
          handleListTools()
          break
          
        case 'list_resources':
          handleListResources()
          break
          
        case 'execute_tool':
          await handleExecuteTool(command.parameters.toolName, command.parameters.args)
          break
          
        case 'help':
          handleHelp()
          break
          
        case 'unknown':
          handleUnknownCommand(command.originalMessage)
          break
      }
    } catch (error) {
      addErrorMessage(`Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTyping(false)
    }
  }, [servers, connectToServer, disconnectFromServer, addAndConnectServer, callTool, getResource, addSystemMessage, addErrorMessage, setTyping])
  
  const handleConnectServer = async (url: string, name: string) => {
    if (!url) {
      addErrorMessage('Please provide a server URL. Example: "connect to server at https://example.com/mcp"')
      return
    }
    
    // Security: Validate server URL
    if (!isValidServerUrl(url)) {
      addErrorMessage('Invalid server URL. Only HTTPS/WSS URLs are allowed (HTTP/WS allowed for localhost in development)')
      return
    }
    
    // Security: Rate limiting
    if (!mcpRateLimiter.isAllowed(`connect:${url}`)) {
      addErrorMessage('Too many connection attempts. Please wait before trying again.')
      return
    }
    
    try {
      // Determine transport type from URL (simple heuristic)
      const transport = url.includes('ws://') || url.includes('wss://') ? 'websocket' : 'sse'
      
      addSystemMessage('Connecting to server...', undefined, { intent: 'connect_server' })
      
      const serverId = await addAndConnectServer({
        name,
        url,
        transport,
      })
      
      // Find the connected server to show details
      const server = servers.find(s => s.id === serverId)
      if (server) {
        const serverStatusContent: RichContent = {
          type: 'server_status',
          data: {
            serverId: server.id,
            name: server.name,
            url: server.url,
            status: server.status,
            error: server.error,
            capabilities: server.capabilities ? {
              tools: server.capabilities.tools?.length || 0,
              resources: server.capabilities.resources?.length || 0,
              prompts: server.capabilities.prompts?.length || 0,
            } : undefined,
          },
        }
        
        addSystemMessage(serverStatusContent, undefined, { intent: 'connect_server' })
      }
      
    } catch (error) {
      addErrorMessage(`Failed to connect to server: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleDisconnectServer = async () => {
    const activeConversation = getActiveConversation()
    if (activeConversation?.serverId) {
      await disconnectFromServer(activeConversation.serverId)
      addSystemMessage('Disconnected from server.')
    } else {
      addSystemMessage('No server currently connected.')
    }
  }
  
  const handleListServers = () => {
    if (servers.length === 0) {
      addSystemMessage('No servers connected. Use "connect to server at <URL>" to add one.')
      return
    }
    
    const serverList = servers.map(server => 
      `• ${server.name} (${server.status}) - ${server.url}`
    ).join('\n')
    
    addSystemMessage(`Connected servers:\n${serverList}`)
  }
  
  const handleListTools = () => {
    const activeConversation = getActiveConversation()
    if (!activeConversation?.serverId) {
      addSystemMessage('Please connect to a server first to see available tools.')
      return
    }
    
    const server = servers.find(s => s.id === activeConversation.serverId)
    const tools = server?.capabilities?.tools
    
    if (!tools || tools.length === 0) {
      addSystemMessage('No tools available on the connected server.')
      return
    }
    
    const toolList = tools.map(tool => 
      `• ${tool.name}${tool.description ? ` - ${tool.description}` : ''}`
    ).join('\n')
    
    addSystemMessage(`Available tools:\n${toolList}`)
  }
  
  const handleListResources = () => {
    const activeConversation = getActiveConversation()
    if (!activeConversation?.serverId) {
      addSystemMessage('Please connect to a server first to see available resources.')
      return
    }
    
    const server = servers.find(s => s.id === activeConversation.serverId)
    const resources = server?.capabilities?.resources
    
    if (!resources || resources.length === 0) {
      addSystemMessage('No resources available on the connected server.')
      return
    }
    
    const resourceList = resources.map(resource => 
      `• ${resource.name} (${resource.uri})${resource.description ? ` - ${resource.description}` : ''}`
    ).join('\n')
    
    addSystemMessage(`Available resources:\n${resourceList}`)
  }
  
  const handleExecuteTool = async (toolName: string, args: any) => {
    const activeConversation = getActiveConversation()
    if (!activeConversation?.serverId) {
      addSystemMessage('Please connect to a server first to execute tools.')
      return
    }
    
    // Security: Validate tool name
    if (!isValidToolName(toolName)) {
      addErrorMessage('Invalid tool name. Tool names must be alphanumeric with underscores/dashes only.')
      return
    }
    
    // Security: Rate limiting
    if (!mcpRateLimiter.isAllowed(`tool:${activeConversation.serverId}:${toolName}`)) {
      addErrorMessage('Too many tool execution attempts. Please wait before trying again.')
      return
    }
    
    try {
      const startTime = Date.now()
      const result = await callTool(activeConversation.serverId, toolName, args)
      const executionTime = Date.now() - startTime
      
      const toolResultContent: RichContent = {
        type: 'tool_result',
        data: {
          toolName,
          success: true,
          result,
          executionTime,
        },
      }
      
      addSystemMessage(toolResultContent, undefined, { 
        intent: 'execute_tool', 
        toolName 
      })
      
    } catch (error) {
      const toolResultContent: RichContent = {
        type: 'tool_result',
        data: {
          toolName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
      
      addSystemMessage(toolResultContent, undefined, { 
        intent: 'execute_tool', 
        toolName 
      })
    }
  }
  
  const handleHelp = () => {
    const helpMessage = `Available commands:
    
🔗 **Server Management:**
• "connect to server at <URL>" - Connect to an MCP server
• "disconnect server" - Disconnect current server
• "list servers" - Show all connected servers

🔧 **Tools & Resources:**
• "list tools" - Show available tools
• "list resources" - Show available resources
• "run <tool_name>" - Execute a tool

❓ **Help:**
• "help" - Show this help message

Examples:
• "connect to server at https://api.example.com/mcp"
• "run get_contacts"
• "list tools"`
    
    addSystemMessage(helpMessage)
  }
  
  const handleUnknownCommand = (message: string) => {
    addSystemMessage(`I didn't understand "${message}". Type "help" to see available commands.`)
  }
  
  const processCommand = useCallback(async (message: string): Promise<void> => {
    const command = parseCommand(message)
    await executeCommand(command)
  }, [parseCommand, executeCommand])
  
  return {
    processCommand,
    parseCommand,
  }
}