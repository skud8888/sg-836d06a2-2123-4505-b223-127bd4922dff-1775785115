import React, { Component, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: "global" | "page" | "component";
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch() {
    // Log error to service
    console.error("Error caught by boundary");
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In production, send to error monitoring service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      level: this.props.level || "component",
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : ""
    };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("Error logged:", errorData);
    }

    // TODO: Send to monitoring service in production
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails } = this.state;
      const { level = "component" } = this.props;

      // Global/page level error - show full screen error
      if (level === "global" || level === "page") {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Something went wrong</CardTitle>
                    <CardDescription>
                      {level === "global" 
                        ? "The application encountered an unexpected error" 
                        : "This page encountered an error"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {process.env.NODE_ENV === "development" && error && (
                  <div className="space-y-2">
                    <button
                      onClick={this.toggleDetails}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showDetails ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide error details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show error details
                        </>
                      )}
                    </button>

                    {showDetails && (
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Error Message:</p>
                          <p className="text-sm font-mono text-destructive">{error.message}</p>
                        </div>
                        {error.stack && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Stack Trace:</p>
                            <pre className="text-xs font-mono overflow-auto max-h-48 bg-background p-2 rounded">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                        {errorInfo?.componentStack && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Component Stack:</p>
                            <pre className="text-xs font-mono overflow-auto max-h-48 bg-background p-2 rounded">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={this.handleReset} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Homepage
                  </Button>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium mb-1">What you can do:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Try refreshing the page</li>
                    <li>Clear your browser cache and cookies</li>
                    <li>Check your internet connection</li>
                    <li>Contact support if the problem persists</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Component level error - show inline error
      return (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="font-medium">Component Error</p>
                <p className="text-sm text-muted-foreground">
                  This component encountered an error. Try refreshing or contact support if this persists.
                </p>
                {process.env.NODE_ENV === "development" && error && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Error details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                      {error.message}
                    </pre>
                  </details>
                )}
                <Button onClick={this.handleReset} size="sm" variant="outline">
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}