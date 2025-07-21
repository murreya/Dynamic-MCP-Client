import type { RichContent } from '../../types/chat'
import { ServerConnectionCard } from './ServerConnectionCard'
import { ToolResultCard } from './ToolResultCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card'
import { isValidImageUrl, sanitizeHtml } from '../../utils/security'

interface RichContentRendererProps {
  content: RichContent
}

export function RichContentRenderer({ content }: RichContentRendererProps) {
  switch (content.type) {
    case 'server_status':
      return <ServerConnectionCard data={content.data} />
    
    case 'tool_result':
      return <ToolResultCard data={content.data} title={content.title} />
    
    case 'card':
      return (
        <Card className="max-w-sm">
          <CardHeader>
            {content.title && <CardTitle className="text-base">{content.title}</CardTitle>}
            {content.description && <CardDescription>{content.description}</CardDescription>}
          </CardHeader>
          {content.data && (
            <CardContent>
              <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(content.data, null, 2).slice(0, 5000)}
                {JSON.stringify(content.data, null, 2).length > 5000 && '\n... (truncated)'}
              </pre>
            </CardContent>
          )}
        </Card>
      )
    
    case 'table':
      return (
        <div className="max-w-full overflow-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                {content.data.headers?.slice(0, 20).map((header: string, index: number) => (
                  <th key={index} className="border border-border px-2 py-1 text-left text-sm font-medium">
                    {sanitizeHtml(String(header))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.data.rows?.slice(0, 100).map((row: any[], index: number) => (
                <tr key={index}>
                  {row.slice(0, 20).map((cell: any, cellIndex: number) => (
                    <td key={cellIndex} className="border border-border px-2 py-1 text-sm">
                      {sanitizeHtml(String(cell).slice(0, 1000))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    
    case 'image':
      // Security: Validate image URL before rendering
      if (!isValidImageUrl(content.data.src)) {
        return (
          <Card className="max-w-sm border-red-200">
            <CardContent className="pt-4">
              <p className="text-red-600 text-sm">⚠️ Invalid or unsafe image URL blocked</p>
            </CardContent>
          </Card>
        )
      }
      
      return (
        <div className="max-w-sm">
          <img 
            src={content.data.src} 
            alt={sanitizeHtml(content.data.alt || 'Image')} 
            className="rounded-lg max-w-full h-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.insertAdjacentHTML('afterend', 
                '<p class="text-red-600 text-sm">❌ Failed to load image</p>')
            }}
          />
          {content.title && (
            <p className="text-sm text-muted-foreground mt-2">{sanitizeHtml(content.title)}</p>
          )}
        </div>
      )
    
    default:
      return (
        <Card className="max-w-sm">
          <CardContent className="pt-4">
            <pre className="text-sm bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )
  }
}