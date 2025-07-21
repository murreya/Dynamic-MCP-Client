import { useState, useEffect } from 'react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card'
import { Key, Shield, ExternalLink, Eye, EyeOff } from 'lucide-react'
import type { MCPAuthentication, MCPCredentials, AuthConfig } from '../../types/mcp'

interface AuthenticationFormProps {
  authentication?: MCPAuthentication
  serverUrl: string
  onSave: (auth: MCPAuthentication) => void
  onCancel: () => void
}

export function AuthenticationForm({ authentication, serverUrl, onSave, onCancel }: AuthenticationFormProps) {
  const [authType, setAuthType] = useState<MCPAuthentication['type']>(authentication?.type || 'none')
  const [credentials, setCredentials] = useState<MCPCredentials>(authentication?.credentials || {})
  const [config, setConfig] = useState<AuthConfig>(authentication?.config || {})
  const [showSecrets, setShowSecrets] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  
  // Auto-detect HTTPS requirement
  useEffect(() => {
    const isHttps = serverUrl.startsWith('https://')
    setConfig(prev => ({
      ...prev,
      requiresHttps: isHttps
    }))
  }, [serverUrl])
  
  const handleSave = async () => {
    setIsValidating(true)
    
    try {
      const auth: MCPAuthentication = {
        type: authType,
        credentials: authType === 'none' ? undefined : credentials,
        config: authType === 'none' ? undefined : config
      }
      
      // Basic validation
      if (authType === 'bearer' && !credentials.token) {
        throw new Error('Bearer token is required')
      }
      
      if (authType === 'api_key' && !credentials.apiKey) {
        throw new Error('API key is required')
      }
      
      if (authType === 'oauth' && !credentials.clientId) {
        throw new Error('OAuth client ID is required')
      }
      
      onSave(auth)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Invalid authentication configuration')
    } finally {
      setIsValidating(false)
    }
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Setup
        </CardTitle>
        <CardDescription>
          Configure authentication for {(() => {
            try {
              return serverUrl ? new URL(serverUrl).hostname : 'this server'
            } catch {
              return 'this server'
            }
          })()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Type */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Authentication Type
          </label>
          <Select
            value={authType}
            onChange={(e) => setAuthType(e.target.value as MCPAuthentication['type'])}
          >
            <option value="none">None (No Authentication)</option>
            <option value="bearer">Bearer Token</option>
            <option value="api_key">API Key</option>
            <option value="oauth">OAuth 2.0</option>
          </Select>
        </div>
        
        {/* Bearer Token */}
        {authType === 'bearer' && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Bearer Token
            </label>
            <div className="relative">
              <Input
                type={showSecrets ? 'text' : 'password'}
                placeholder="Enter bearer token..."
                value={credentials.token || ''}
                onChange={(e) => setCredentials(prev => ({ ...prev, token: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowSecrets(!showSecrets)}
              >
                {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This token will be sent as: Authorization: Bearer {credentials.token ? '••••••••' : '<token>'}
            </p>
          </div>
        )}
        
        {/* API Key */}
        {authType === 'api_key' && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                API Key
              </label>
              <div className="relative">
                <Input
                  type={showSecrets ? 'text' : 'password'}
                  placeholder="Enter API key..."
                  value={credentials.apiKey || ''}
                  onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Header Name
                </label>
                <Input
                  placeholder="Authorization"
                  value={config.headerName || 'Authorization'}
                  onChange={(e) => setConfig(prev => ({ ...prev, headerName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Prefix
                </label>
                <Input
                  placeholder="Bearer "
                  value={config.headerPrefix || 'Bearer '}
                  onChange={(e) => setConfig(prev => ({ ...prev, headerPrefix: e.target.value }))}
                />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              This will be sent as: {config.headerName || 'Authorization'}: {config.headerPrefix || 'Bearer '}{credentials.apiKey ? '••••••••' : '<api-key>'}
            </p>
          </>
        )}
        
        {/* OAuth 2.0 */}
        {authType === 'oauth' && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Client ID
              </label>
              <Input
                placeholder="Enter OAuth client ID..."
                value={credentials.clientId || ''}
                onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Client Secret (Optional)
              </label>
              <div className="relative">
                <Input
                  type={showSecrets ? 'text' : 'password'}
                  placeholder="Enter client secret (if required)..."
                  value={credentials.clientSecret || ''}
                  onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Many OAuth 2.1 servers use PKCE and don't require client secrets
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Scope (Optional)
              </label>
              <Input
                placeholder="e.g., read write"
                value={config.scope || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, scope: e.target.value }))}
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700">
                <ExternalLink className="h-4 w-4 inline mr-1" />
                OAuth authentication will redirect you to the provider's login page
              </p>
            </div>
          </>
        )}
        
        {/* Security Warning */}
        {authType !== 'none' && !config.requiresHttps && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-700">
              ⚠️ Warning: This server uses HTTP. Credentials may be transmitted insecurely.
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isValidating}
            className="flex-1"
          >
            <Key className="h-4 w-4 mr-2" />
            {isValidating ? 'Validating...' : 'Save Authentication'}
          </Button>
          <Button 
            onClick={onCancel} 
            variant="outline"
            disabled={isValidating}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}