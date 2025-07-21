import { Button } from '../common/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card'
import { useMCPClient } from '../../hooks/useMCPClient'
import { Trash2, WifiOff, Wifi, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export function ServerList() {
  const { servers, activeServerId, setActiveServer, connectToServer, disconnectFromServer, removeAndDisconnectServer } = useMCPClient()
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-400" />
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'disconnected':
        return 'Disconnected'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Error'
      default:
        return status
    }
  }
  
  if (servers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Servers Connected</CardTitle>
          <CardDescription>
            Add your first MCP server to get started
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Connected Servers</h2>
      <div className="space-y-2">
        {servers.map((server) => (
          <Card
            key={server.id}
            className={cn(
              "cursor-pointer transition-colors",
              activeServerId === server.id && "ring-2 ring-primary"
            )}
            onClick={() => setActiveServer(server.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{server.name}</h3>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(server.status)}
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(server.status)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{server.url}</p>
                  {server.error && (
                    <p className="text-sm text-red-500 mt-1">{server.error}</p>
                  )}
                  {server.capabilities && (
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      {server.capabilities.tools && (
                        <span>{server.capabilities.tools.length} tools</span>
                      )}
                      {server.capabilities.resources && (
                        <span>{server.capabilities.resources.length} resources</span>
                      )}
                      {server.capabilities.prompts && (
                        <span>{server.capabilities.prompts.length} prompts</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {server.status === 'disconnected' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        connectToServer(server.id)
                      }}
                    >
                      Connect
                    </Button>
                  ) : server.status === 'connected' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        disconnectFromServer(server.id)
                      }}
                    >
                      Disconnect
                    </Button>
                  ) : null}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeAndDisconnectServer(server.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}