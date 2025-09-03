import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
          <div className="text-center max-w-md p-6">
            <div className="text-lg font-medium text-red-600 mb-4">
              Something went wrong
            </div>
            <div className="text-sm text-[var(--muted)] mb-4">
              There was an error loading the application. This often happens
              after OAuth login.
            </div>
            <button
              onClick={() => {
                // Clear auth params and reload
                const url = new URL(window.location);
                url.searchParams.delete("code");
                url.searchParams.delete("state");
                url.searchParams.delete("error");
                url.searchParams.delete("error_description");
                window.history.replaceState({}, "", url.pathname);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload App
            </button>

            {/* Show error details in development */}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left text-xs">
                <summary className="cursor-pointer text-[var(--muted)]">
                  Show Error Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-red-600 overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
