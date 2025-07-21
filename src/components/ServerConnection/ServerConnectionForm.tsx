import React, { useState } from 'react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card'
import { AuthenticationForm } from '../Auth/AuthenticationForm'
import { useMCPClient } from '../../hooks/useMCPClient'
import { Plus, Settings } from 'lucide-react'
import type { MCPAuthentication } from '../../types/mcp'

export function ServerConnectionForm() {
  const { addAndConnectServer } = useMCPClient()
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    transport: 'sse' as 'sse' | 'websocket',
    authentication: undefined as MCPAuthentication | undefined,
  })
  const [showAuthForm, setShowAuthForm] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.url) {
      return
    }
    
    setIsAdding(true)
    
    try {
      await addAndConnectServer({
        name: formData.name,
        url: formData.url,
        transport: formData.transport,
        authentication: formData.authentication,
      })
      
      // Reset form
      setFormData({
        name: '',
        url: '',
        transport: 'sse',
        authentication: undefined,
      })
      setShowAuthForm(false)
    } catch (error) {
      console.error('Failed to add server:', error)
    } finally {
      setIsAdding(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add MCP Server</CardTitle>
        <CardDescription>
          Connect to a remote MCP server to access its tools and resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Server Name
            </label>
            <Input
              id="name"
              placeholder="My MCP Server"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isAdding}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              Server URL
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/mcp"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              disabled={isAdding}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="transport" className="text-sm font-medium">
              Transport Type
            </label>
            <Select
              id="transport"
              value={formData.transport}
              onChange={(e) => setFormData({ ...formData, transport: e.target.value as 'sse' | 'websocket' })}
              disabled={isAdding}
            >
              <option value="sse">Server-Sent Events (SSE)</option>
              <option value="websocket">WebSocket</option>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowAuthForm(!showAuthForm)}
              disabled={isAdding}
            >
              <Settings className="h-4 w-4 mr-2" />
              {formData.authentication?.type && formData.authentication.type !== 'none' 
                ? `Auth: ${formData.authentication.type}` 
                : 'Configure Auth'
              }
            </Button>
            <Button 
              type="submit" 
              disabled={isAdding || !formData.name || !formData.url}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? 'Connecting...' : 'Add Server'}
            </Button>
          </div>
        </form>
        
        {showAuthForm && (
          <div className="mt-6 pt-6 border-t">
            <AuthenticationForm
              authentication={formData.authentication}
              serverUrl={formData.url}
              onSave={(auth) => {
                setFormData({ ...formData, authentication: auth })
                setShowAuthForm(false)
              }}
              onCancel={() => setShowAuthForm(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}