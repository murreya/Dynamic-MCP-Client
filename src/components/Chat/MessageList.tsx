import { MessageBubble } from './MessageBubble'
import type { ChatMessage } from '../../types/chat'

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Start a conversation by typing a message below.</p>
        <p className="text-sm mt-2">
          Try: "connect to server at https://example.com" or "help"
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
        />
      ))}
    </div>
  )
}