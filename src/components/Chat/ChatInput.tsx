import { useState, type KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { useChatStore } from '../../store/chatStore'
import { useChatCommands } from '../../hooks/useChatCommands'

export function ChatInput() {
  const [message, setMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { addUserMessage, isTyping } = useChatStore()
  const { processCommand } = useChatCommands()
  
  const handleSend = async () => {
    if (!message.trim() || isProcessing) return
    
    const userMessage = message.trim()
    setMessage('')
    setIsProcessing(true)
    
    try {
      // Add user message to chat
      addUserMessage(userMessage)
      
      // Process the command
      await processCommand(userMessage)
      
    } catch (error) {
      console.error('Error processing command:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const isDisabled = isProcessing || isTyping
  
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            isDisabled 
              ? "Processing..." 
              : "Type a message or command..."
          }
          disabled={isDisabled}
          className="text-sm"
        />
        <div className="text-xs text-muted-foreground mt-1">
          Try: "connect to server", "help", or ask about MCP tools
        </div>
      </div>
      
      <Button
        onClick={handleSend}
        disabled={!message.trim() || isDisabled}
        size="icon"
        className="shrink-0"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}