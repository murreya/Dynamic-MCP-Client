import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card'
import { useMCPClient } from '../../hooks/useMCPClient'
import { Terminal, FileText, MessageSquare } from 'lucide-react'

export function Dashboard() {
  const { activeServer } = useMCPClient()
  
  if (!activeServer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Server Selected</CardTitle>
          <CardDescription>
            Select a server from the list to view its capabilities
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  if (activeServer.status !== 'connected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{activeServer.name}</CardTitle>
          <CardDescription>
            Server is {activeServer.status}. Connect to view capabilities.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  const { capabilities } = activeServer
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{activeServer.name}</h2>
        <p className="text-muted-foreground">Server Capabilities</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tools</CardTitle>
              <Terminal className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {capabilities?.tools?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Available tools</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Resources</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {capabilities?.resources?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Available resources</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Prompts</CardTitle>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {capabilities?.prompts?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Available prompts</p>
          </CardContent>
        </Card>
      </div>
      
      {capabilities?.tools && capabilities.tools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Tools</CardTitle>
            <CardDescription>
              Tools you can execute on this server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {capabilities.tools.map((tool, index) => (
                <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                  <h4 className="font-medium">{tool.name}</h4>
                  {tool.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {tool.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {capabilities?.resources && capabilities.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Resources</CardTitle>
            <CardDescription>
              Resources you can access from this server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {capabilities.resources.map((resource, index) => (
                <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                  <h4 className="font-medium">{resource.name}</h4>
                  <p className="text-sm text-muted-foreground">{resource.uri}</p>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {resource.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}