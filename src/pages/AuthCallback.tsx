import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export function AuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing your authentication...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')
        const state = urlParams.get('state')

        if (error) {
          console.error('OAuth error:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || error)
          
          // Store error for main app
          localStorage.setItem('mcp_auth_error', error)
          localStorage.setItem('mcp_auth_error_description', errorDescription || '')
          
          // Redirect back to main app after showing error
          setTimeout(() => {
            window.location.href = '/'
          }, 3000)
          return
        }

        if (code) {
          console.log('OAuth authorization code received:', code)
          setMessage('Authentication successful! Redirecting...')
          
          // Store the authorization code and state
          localStorage.setItem('mcp_auth_code', code)
          if (state) {
            localStorage.setItem('mcp_auth_state', state)
          }
          
          setStatus('success')
          
          // Redirect back to main app
          setTimeout(() => {
            window.location.href = '/'
          }, 1500)
          return
        }
        
        // No code or error - this shouldn't happen
        console.warn('OAuth callback received without code or error')
        setStatus('error')
        setMessage('Invalid OAuth response received')
        
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      } catch (err) {
        console.error('Error processing OAuth callback:', err)
        setStatus('error')
        setMessage('Failed to process authentication response')
        
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      }
    }

    // Run callback handler
    handleCallback()
  }, [])


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {status === 'error' ? (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h1>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Redirecting back to the main application...
              </p>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Successful
              </h1>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Taking you back to the Dynamic MCP Client...
              </p>
            </>
          ) : (
            <>
              <Loader className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Authentication
              </h1>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Please wait...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}