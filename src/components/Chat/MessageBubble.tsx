import { format } from 'date-fns'
import { User, Bot, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { ChatMessage, RichContent } from '../../types/chat'
import { RichContentRenderer } from '../Messages/RichContentRenderer'

interface MessageBubbleProps {
  message: ChatMessage
  isLast?: boolean
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user'
  const isError = message.type === 'error'
  
  const getMessageIcon = () => {
    switch (message.type) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'system':
        return <Bot className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'connection_status':
        return message.metadata?.connectionStatus === 'connected' 
          ? <CheckCircle className="h-4 w-4 text-green-500" />
          : <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }
  
  const getMessageVariant = () => {
    if (isUser) return 'user'
    if (isError) return 'error'
    return 'system'
  }
  
  const variant = getMessageVariant()
  
  return (
    <div
      className={cn(
        "flex gap-3 max-w-4xl",
        isUser && "ml-auto flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white",
          variant === 'user' && "bg-primary",
          variant === 'system' && "bg-secondary",
          variant === 'error' && "bg-destructive"
        )}
      >
        {getMessageIcon()}
      </div>
      
      {/* Message Content */}
      <div className={cn("flex-1 space-y-1", isUser && "text-right")}>
        {/* Message Bubble */}
        <div
          className={cn(
            "inline-block p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl",
            variant === 'user' && "bg-primary text-primary-foreground ml-auto",
            variant === 'system' && "bg-muted",
            variant === 'error' && "bg-destructive/10 border border-destructive/20"
          )}
        >
          {typeof message.content === 'string' ? (
            <div className="whitespace-pre-wrap text-sm">
              {message.content}
            </div>
          ) : (
            <RichContentRenderer content={message.content as RichContent} />
          )}
        </div>
        
        {/* Timestamp */}
        <div
          className={cn(
            "text-xs text-muted-foreground",
            isUser && "text-right"
          )}
        >
          {format(message.timestamp, 'HH:mm')}
        </div>
        
        {/* Metadata */}
        {message.metadata && (
          <div
            className={cn(
              "text-xs text-muted-foreground",
              isUser && "text-right"
            )}
          >
            {message.metadata.toolName && (
              <span>Tool: {message.metadata.toolName}</span>
            )}
            {message.metadata.intent && (
              <span className="ml-2">Intent: {message.metadata.intent}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}