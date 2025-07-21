import { useState } from 'react'
import { ChevronLeft, ChevronRight, Server, Settings } from 'lucide-react'
import { Button } from '../common/Button'
import { ServerConnectionForm } from '../ServerConnection/ServerConnectionForm'
import { ServerList } from '../ServerConnection/ServerList'
import { cn } from '../../utils/cn'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  return (
    <div
      className={cn(
        "relative bg-muted/50 border-r border-border transition-all duration-300",
        isCollapsed ? "w-12" : "w-80",
        className
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 z-10 h-6 w-6 bg-background border border-border"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
      
      {/* Collapsed State */}
      {isCollapsed ? (
        <div className="p-2 space-y-2">
          <Button variant="ghost" size="icon" className="w-full" title="Servers">
            <Server className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-full" title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* Expanded State */
        <div className="h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg">MCP Servers</h2>
            <p className="text-sm text-muted-foreground">
              Manage your server connections
            </p>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <ServerConnectionForm />
            <ServerList />
          </div>
        </div>
      )}
    </div>
  )
}