import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'

interface ServerConnectionCardProps {
  data: {
    serverId?: string
    name: string
    url: string
    status: 'connecting' | 'connected' | 'disconnected' | 'error'
    error?: string
    capabilities?: {
      tools?: number
      resources?: number
      prompts?: number
    }
  }
}

export function ServerConnectionCard({ data }: ServerConnectionCardProps) {
  const getStatusIcon = () => {
    switch (data.status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'connecting':
        return <Wifi className="h-5 w-5 text-blue-500 animate-pulse" />
      case 'disconnected':
        return <WifiOff className="h-5 w-5 text-gray-400" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }
  
  const getStatusText = () => {
    switch (data.status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Connection Error'
      default:
        return data.status
    }
  }
  
  const getStatusColor = () => {
    switch (data.status) {
      case 'connected':
        return 'text-green-600'
      case 'connecting':
        return 'text-blue-600'
      case 'disconnected':
        return 'text-gray-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }
  
  return (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <CardTitle className="text-base">{data.name}</CardTitle>
            <CardDescription className={getStatusColor()}>
              {getStatusText()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">URL:</span> {data.url}
          </p>
          
          {data.error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {data.error}
            </p>
          )}
          
          {data.status === 'connected' && data.capabilities && (
            <div className="bg-muted p-3 rounded">
              <p className="text-sm font-medium mb-2">Capabilities:</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-medium">{data.capabilities.tools || 0}</div>
                  <div className="text-muted-foreground">Tools</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{data.capabilities.resources || 0}</div>
                  <div className="text-muted-foreground">Resources</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{data.capabilities.prompts || 0}</div>
                  <div className="text-muted-foreground">Prompts</div>
                </div>
              </div>
            </div>
          )}
          
          {data.status === 'connected' && (
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}