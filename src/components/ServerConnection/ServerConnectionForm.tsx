import React, { useState } from 'react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card'
import { useMCPClient } from '../../hooks/useMCPClient'
import { Plus } from 'lucide-react'

export function ServerConnectionForm() {
  const { addAndConnectServer } = useMCPClient()
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    transport: 'sse' as 'sse' | 'websocket',
  })
  
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
      })
      
      // Reset form
      setFormData({
        name: '',
        url: '',
        transport: 'sse',
      })
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
          
          <Button type="submit" disabled={isAdding || !formData.name || !formData.url}>
            <Plus className="h-4 w-4 mr-2" />
            {isAdding ? 'Connecting...' : 'Add Server'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}