import { Terminal, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/Card'

interface ToolResultCardProps {
  data: {
    toolName: string
    success: boolean
    result?: any
    error?: string
    executionTime?: number
  }
  title?: string
}

export function ToolResultCard({ data, title }: ToolResultCardProps) {
  const { toolName, success, result, error, executionTime } = data
  
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          <div>
            <CardTitle className="text-base">
              {title || `Tool: ${toolName}`}
            </CardTitle>
            <div className="flex items-center gap-2">
              {success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <CardDescription>
                {success ? 'Executed successfully' : 'Execution failed'}
                {executionTime && ` (${executionTime}ms)`}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {result && (
            <div>
              <p className="text-sm font-medium mb-2">Result:</p>
              <div className="bg-muted p-3 rounded">
                {typeof result === 'string' ? (
                  <p className="text-sm whitespace-pre-wrap">{result}</p>
                ) : Array.isArray(result) ? (
                  <div className="space-y-2">
                    {result.map((item, index) => (
                      <div key={index} className="text-sm">
                        {typeof item === 'string' ? (
                          item
                        ) : (
                          <pre className="text-xs bg-background p-2 rounded overflow-auto">
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="text-xs bg-background p-2 rounded overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}