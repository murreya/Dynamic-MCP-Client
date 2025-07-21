import { Bot } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-4xl">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white">
        <Bot className="h-4 w-4" />
      </div>
      
      {/* Typing Animation */}
      <div className="bg-muted p-3 rounded-lg">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}