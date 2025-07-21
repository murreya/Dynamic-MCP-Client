import { useEffect, useRef } from 'react'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { useChatStore } from '../../store/chatStore'
import { Card } from '../common/Card'

export function ChatContainer() {
  const {
    activeConversationId,
    isTyping,
    createConversation,
    getActiveConversation,
  } = useChatStore()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const activeConversation = getActiveConversation()
  
  // Create initial conversation if none exists
  useEffect(() => {
    if (!activeConversationId) {
      createConversation()
    }
  }, [activeConversationId, createConversation])
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages.length, isTyping])
  
  if (!activeConversation) {
    return (
      <Card className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading conversation...</p>
      </Card>
    )
  }
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">{activeConversation.title}</h2>
        <p className="text-sm text-muted-foreground">
          {activeConversation.serverId ? 'Connected to server' : 'No server connected'}
        </p>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 space-y-4">
          <MessageList messages={activeConversation.messages} />
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t border-border p-4">
        <ChatInput />
      </div>
    </div>
  )
}