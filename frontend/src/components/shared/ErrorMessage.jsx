"use client"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button, Card } from "../ui"

const ErrorMessage = ({
  message,
  onRetry,
  showRetry = true,
  className = "",
  variant = "default", // 'default', 'permission', 'network'
}) => {
  const getErrorIcon = () => {
    switch (variant) {
      case "permission":
        return <AlertCircle className="w-8 h-8 text-red-500" />
      case "network":
        return <AlertCircle className="w-8 h-8 text-orange-500" />
      default:
        return <AlertCircle className="w-8 h-8 text-red-500" />
    }
  }

  const getErrorTitle = () => {
    switch (variant) {
      case "permission":
        return "Access Denied"
      case "network":
        return "Connection Error"
      default:
        return "Error"
    }
  }

  return (
    <Card className={`p-8 text-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {getErrorIcon()}

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{getErrorTitle()}</h3>
          <p className="text-gray-600 max-w-md">{message || "An unexpected error occurred. Please try again."}</p>
        </div>

        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" className="flex items-center gap-2 bg-transparent">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </div>
    </Card>
  )
}

export default ErrorMessage
