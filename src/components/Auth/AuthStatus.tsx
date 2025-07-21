import { Shield, Key, Lock, Unlock, AlertCircle, CheckCircle } from 'lucide-react'
import type { MCPAuthentication } from '../../types/mcp'
import { authService } from '../../services/auth/authService'

interface AuthStatusProps {
  authentication?: MCPAuthentication
  className?: string
}

export function AuthStatus({ authentication, className = '' }: AuthStatusProps) {
  if (!authentication || authentication.type === 'none') {
    return (
      <div className={`flex items-center gap-1 text-gray-500 ${className}`}>
        <Unlock className="h-4 w-4" />
        <span className="text-sm">No Auth</span>
      </div>
    )
  }
  
  const isValid = authService.areCredentialsValid(authentication)
  
  const getAuthIcon = () => {
    switch (authentication.type) {
      case 'bearer':
        return <Key className="h-4 w-4" />
      case 'api_key':
        return <Key className="h-4 w-4" />
      case 'oauth':
        return <Shield className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }
  
  const getAuthLabel = () => {
    switch (authentication.type) {
      case 'bearer':
        return 'Bearer Token'
      case 'api_key':
        return 'API Key'
      case 'oauth':
        return 'OAuth 2.0'
      default:
        return 'Authenticated'
    }
  }
  
  const statusColor = isValid ? 'text-green-600' : 'text-red-500'
  const StatusIcon = isValid ? CheckCircle : AlertCircle
  
  return (
    <div className={`flex items-center gap-1 ${statusColor} ${className}`}>
      {getAuthIcon()}
      <span className="text-sm">{getAuthLabel()}</span>
      <StatusIcon className="h-3 w-3" />
    </div>
  )
}