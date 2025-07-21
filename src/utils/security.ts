/**
 * Security utilities for validating and sanitizing user input
 */

/**
 * Validates if a URL is safe for image loading
 * Blocks javascript:, data:, and other potentially dangerous protocols
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const parsed = new URL(url)
    // Only allow http, https, and data URLs for images
    const allowedProtocols = ['http:', 'https:']
    
    // Allow data URLs only for images
    if (parsed.protocol === 'data:') {
      return parsed.pathname.startsWith('image/')
    }
    
    return allowedProtocols.includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Validates if a URL is safe for server connections
 * Only allows HTTPS and WSS for production
 */
export function isValidServerUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const parsed = new URL(url)
    // In development, allow localhost HTTP
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    const allowedProtocols = ['https:', 'wss:']
    
    if (process.env.NODE_ENV === 'development' && isLocalhost) {
      allowedProtocols.push('http:', 'ws:')
    }
    
    return allowedProtocols.includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Sanitizes HTML content to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div')
  temp.textContent = html
  return temp.innerHTML
}

/**
 * Validates tool names to prevent injection attacks
 */
export function isValidToolName(name: string): boolean {
  if (!name || typeof name !== 'string') return false
  
  // Tool names should be alphanumeric with underscores/dashes
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)
}

/**
 * Rate limiting for MCP operations
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private readonly windowMs: number
  private readonly maxRequests: number
  
  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }
  
  isAllowed(key: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }
}

export const mcpRateLimiter = new RateLimiter(60000, 50) // 50 requests per minute