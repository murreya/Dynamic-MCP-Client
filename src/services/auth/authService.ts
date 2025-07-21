import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'
import type { MCPServer, MCPAuthentication, MCPCredentials } from '../../types/mcp'

/**
 * OAuth Client Provider implementation for browser-based MCP clients
 */
export class BrowserOAuthClientProvider implements OAuthClientProvider {
  private serverId: string
  private server: MCPServer
  private onCredentialsUpdate: (credentials: MCPCredentials) => void
  
  constructor(
    serverId: string, 
    server: MCPServer, 
    onCredentialsUpdate: (credentials: MCPCredentials) => void
  ) {
    this.serverId = serverId
    this.server = server
    this.onCredentialsUpdate = onCredentialsUpdate
  }
  
  get redirectUrl(): string | URL {
    // Use current origin with a dedicated auth callback path
    return new URL('/auth/callback', window.location.origin)
  }
  
  get clientMetadata() {
    return {
      client_name: 'Dynamic MCP Client',
      client_uri: window.location.origin,
      redirect_uris: [this.redirectUrl.toString()],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none', // PKCE only
      application_type: 'web',
    }
  }
  
  async state(): Promise<string> {
    return crypto.randomUUID()
  }
  
  clientInformation() {
    const auth = this.server.authentication
    if (auth?.credentials?.clientId) {
      return {
        client_id: auth.credentials.clientId,
        client_secret: auth.credentials.clientSecret,
      }
    }
    return undefined
  }
  
  async saveClientInformation(clientInformation: any): Promise<void> {
    const credentials: MCPCredentials = {
      ...this.server.authentication?.credentials,
      clientId: clientInformation.client_id,
      clientSecret: clientInformation.client_secret,
    }
    this.onCredentialsUpdate(credentials)
  }
  
  tokens() {
    const auth = this.server.authentication
    if (auth?.credentials?.accessToken) {
      return {
        access_token: auth.credentials.accessToken,
        refresh_token: auth.credentials.refreshToken,
        token_type: auth.credentials.tokenType || 'Bearer',
        expires_in: auth.credentials.expiresAt ? 
          Math.max(0, Math.floor((auth.credentials.expiresAt.getTime() - Date.now()) / 1000)) : 
          undefined,
        scope: auth.credentials.scope,
      }
    }
    return undefined
  }
  
  async saveTokens(tokens: any): Promise<void> {
    const expiresAt = tokens.expires_in ? 
      new Date(Date.now() + tokens.expires_in * 1000) : 
      undefined
      
    const credentials: MCPCredentials = {
      ...this.server.authentication?.credentials,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenType: tokens.token_type,
      expiresAt,
      scope: tokens.scope,
    }
    
    this.onCredentialsUpdate(credentials)
  }
  
  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    // Store comprehensive app state before redirect
    const appState = {
      serverId: this.serverId,
      serverUrl: this.server.url,
      serverAuth: this.server.authentication,
      timestamp: Date.now(),
      returnUrl: window.location.pathname + window.location.search
    }
    
    localStorage.setItem('mcp_oauth_state', JSON.stringify(appState))
    localStorage.setItem('mcp_auth_server_id', this.serverId)
    localStorage.setItem('mcp_auth_server_url', this.server.url)
    
    // Perform direct redirect instead of popup
    window.location.href = authorizationUrl.toString()
  }
  
  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    localStorage.setItem(`mcp_code_verifier_${this.serverId}`, codeVerifier)
  }
  
  async codeVerifier(): Promise<string> {
    const verifier = localStorage.getItem(`mcp_code_verifier_${this.serverId}`)
    if (!verifier) {
      throw new Error('PKCE code verifier not found')
    }
    return verifier
  }
  
  async invalidateCredentials(scope: 'all' | 'client' | 'tokens' | 'verifier'): Promise<void> {
    let credentials = { ...this.server.authentication?.credentials }
    
    switch (scope) {
      case 'all':
        credentials = {}
        break
      case 'client':
        delete credentials.clientId
        delete credentials.clientSecret
        break
      case 'tokens':
        delete credentials.accessToken
        delete credentials.refreshToken
        delete credentials.expiresAt
        delete credentials.scope
        break
      case 'verifier':
        localStorage.removeItem(`mcp_code_verifier_${this.serverId}`)
        return
    }
    
    this.onCredentialsUpdate(credentials)
  }
}

/**
 * Authentication service for managing MCP server authentication
 */
export class AuthService {
  /**
   * Creates an OAuth client provider for a server
   */
  createOAuthProvider(
    serverId: string, 
    server: MCPServer, 
    onCredentialsUpdate: (credentials: MCPCredentials) => void
  ): BrowserOAuthClientProvider {
    return new BrowserOAuthClientProvider(serverId, server, onCredentialsUpdate)
  }
  
  /**
   * Validates if credentials are still valid
   */
  areCredentialsValid(auth?: MCPAuthentication): boolean {
    if (!auth || !auth.credentials) return false
    
    switch (auth.type) {
      case 'bearer':
      case 'api_key':
        return !!(auth.credentials.token || auth.credentials.apiKey)
      
      case 'oauth':
        if (!auth.credentials.accessToken) return false
        
        // Check if token is expired
        if (auth.credentials.expiresAt && auth.credentials.expiresAt <= new Date()) {
          // Token expired, check if we can refresh
          return !!auth.credentials.refreshToken
        }
        
        return true
      
      default:
        return false
    }
  }
  
  /**
   * Gets authorization headers for a request
   */
  getAuthHeaders(auth?: MCPAuthentication): Record<string, string> {
    if (!auth || !auth.credentials) return {}
    
    switch (auth.type) {
      case 'bearer':
        if (auth.credentials.token) {
          return { 'Authorization': `Bearer ${auth.credentials.token}` }
        }
        break
        
      case 'api_key':
        if (auth.credentials.apiKey) {
          const headerName = auth.config?.headerName || 'Authorization'
          const headerPrefix = auth.config?.headerPrefix || 'Bearer '
          return { [headerName]: `${headerPrefix}${auth.credentials.apiKey}` }
        }
        break
        
      case 'oauth':
        if (auth.credentials.accessToken) {
          const tokenType = auth.credentials.tokenType || 'Bearer'
          return { 'Authorization': `${tokenType} ${auth.credentials.accessToken}` }
        }
        break
    }
    
    return {}
  }
  
  /**
   * Detects authentication requirements from server response
   */
  detectAuthRequirement(response: Response): MCPAuthentication | null {
    const wwwAuth = response.headers.get('WWW-Authenticate')
    if (!wwwAuth) return null
    
    // Parse WWW-Authenticate header
    if (wwwAuth.toLowerCase().includes('bearer')) {
      return {
        type: 'bearer',
        config: {
          requiresHttps: true
        }
      }
    }
    
    if (wwwAuth.toLowerCase().includes('oauth')) {
      return {
        type: 'oauth',
        config: {
          requiresHttps: true
        }
      }
    }
    
    // Default to bearer token
    return {
      type: 'bearer',
      config: {
        requiresHttps: true
      }
    }
  }
}

export const authService = new AuthService()