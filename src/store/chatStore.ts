import { create } from 'zustand'
import type { ChatMessage, ChatConversation, RichContent } from '../types/chat'

interface ChatStore {
  conversations: ChatConversation[]
  activeConversationId: string | null
  isTyping: boolean
  
  // Actions
  createConversation: (title?: string, serverId?: string) => string
  deleteConversation: (id: string) => void
  setActiveConversation: (id: string | null) => void
  
  // Message actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>, conversationId?: string) => void
  addUserMessage: (content: string, conversationId?: string) => void
  addSystemMessage: (content: string | RichContent, conversationId?: string, metadata?: ChatMessage['metadata']) => void
  addErrorMessage: (error: string, conversationId?: string) => void
  
  // UI actions
  setTyping: (typing: boolean) => void
  
  // Getters
  getActiveConversation: () => ChatConversation | null
  getConversation: (id: string) => ChatConversation | undefined
  getAllMessages: (conversationId?: string) => ChatMessage[]
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isTyping: false,
  
  createConversation: (title = 'New Conversation', serverId) => {
    const newConversation: ChatConversation = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      serverId,
    }
    
    set((state) => ({
      conversations: [...state.conversations, newConversation],
      activeConversationId: newConversation.id,
    }))
    
    // Add welcome message
    get().addSystemMessage('Welcome to Dynamic MCP Client! Type a command or ask for help to get started.', newConversation.id)
    
    return newConversation.id
  },
  
  deleteConversation: (id) => {
    set((state) => ({
      conversations: state.conversations.filter(c => c.id !== id),
      activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
    }))
  },
  
  setActiveConversation: (id) => {
    set({ activeConversationId: id })
  },
  
  addMessage: (messageData, conversationId) => {
    const targetId = conversationId || get().activeConversationId
    if (!targetId) {
      // Create new conversation if none exists
      const newId = get().createConversation()
      get().addMessage(messageData, newId)
      return
    }
    
    const newMessage: ChatMessage = {
      ...messageData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    
    set((state) => ({
      conversations: state.conversations.map(conv =>
        conv.id === targetId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              updatedAt: new Date(),
            }
          : conv
      ),
    }))
  },
  
  addUserMessage: (content, conversationId) => {
    get().addMessage({
      type: 'user',
      content,
    }, conversationId)
  },
  
  addSystemMessage: (content, conversationId, metadata) => {
    get().addMessage({
      type: 'system',
      content,
      metadata,
    }, conversationId)
  },
  
  addErrorMessage: (error, conversationId) => {
    get().addMessage({
      type: 'error',
      content: error,
      metadata: { error },
    }, conversationId)
  },
  
  setTyping: (typing) => {
    set({ isTyping: typing })
  },
  
  getActiveConversation: () => {
    const { conversations, activeConversationId } = get()
    return conversations.find(c => c.id === activeConversationId) || null
  },
  
  getConversation: (id) => {
    return get().conversations.find(c => c.id === id)
  },
  
  getAllMessages: (conversationId) => {
    const targetId = conversationId || get().activeConversationId
    const conversation = targetId ? get().getConversation(targetId) : null
    return conversation?.messages || []
  },
}))