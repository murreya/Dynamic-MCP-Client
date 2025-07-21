import { ChatContainer } from './components/Chat/ChatContainer'
import { Sidebar } from './components/Layout/Sidebar'
import { AuthCallback } from './pages/AuthCallback'
import { useEffect, useState } from 'react'

function App() {
  const [isRestoringAuth, setIsRestoringAuth] = useState(false)
  
  // Check if this is the OAuth callback route
  const isAuthCallback = window.location.pathname === '/auth/callback'
  
  useEffect(() => {
    // Check if we're returning from OAuth flow
    const authCode = localStorage.getItem('mcp_auth_code')
    const authError = localStorage.getItem('mcp_auth_error')
    const oauthState = localStorage.getItem('mcp_oauth_state')
    
    if ((authCode || authError) && oauthState) {
      setIsRestoringAuth(true)
      
      // Process the OAuth result
      const handleOAuthReturn = async () => {
        try {
          const state = JSON.parse(oauthState)
          
          if (authError) {
            console.error('OAuth failed:', authError)
            // Clean up auth state
            localStorage.removeItem('mcp_auth_code')
            localStorage.removeItem('mcp_auth_error')
            localStorage.removeItem('mcp_auth_error_description')
            localStorage.removeItem('mcp_oauth_state')
            setIsRestoringAuth(false)
            return
          }
          
          if (authCode && state.serverId) {
            console.log('OAuth success, completing authentication for server:', state.serverId)
            
            // The MCP client will automatically handle the auth code exchange
            // when it detects the stored auth code
            
            // Clean up the temporary auth code (keep oauth state for MCP client)
            localStorage.removeItem('mcp_auth_code')
          }
          
        } catch (error) {
          console.error('Error processing OAuth return:', error)
        } finally {
          setIsRestoringAuth(false)
        }
      }
      
      // Small delay to ensure UI is ready
      setTimeout(handleOAuthReturn, 100)
    }
  }, [])
  
  if (isAuthCallback) {
    return <AuthCallback />
  }
  
  if (isRestoringAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Completing authentication...</p>
        </div>
      </div>
    )
  }

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