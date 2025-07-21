import { ChatContainer } from './components/Chat/ChatContainer'
import { Sidebar } from './components/Layout/Sidebar'

function App() {
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-xl font-semibold">Dynamic MCP Client</h1>
          <p className="text-sm text-muted-foreground">
            Chat with your MCP servers using natural language commands
          </p>
        </div>
        
        {/* Chat Container */}
        <div className="flex-1">
          <ChatContainer />
        </div>
      </div>
    </div>
  )
}

export default App