import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      try {
        const parsed = JSON.parse(this.state.error?.message || '{}');
        if (parsed.error) {
          errorMessage = `Firestore Error: ${parsed.error} (${parsed.operationType} at ${parsed.path})`;
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-zinc-900 border border-amber-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-amber-500/10"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20">
                <AlertCircle className="w-12 h-12 text-amber-500" />
              </div>
            </div>
            
            <h1 className="text-2xl font-serif text-amber-500 mb-4">Something went wrong</h1>
            <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
              {errorMessage}
            </p>

            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-amber-500 text-black font-medium rounded-xl hover:bg-amber-400 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
