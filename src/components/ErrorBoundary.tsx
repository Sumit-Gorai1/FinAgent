import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // Explicitly declare component fields to satisfy React 19 / TypeScript with useDefineForClassFields
  declare props: Readonly<Props>;
  declare state: Readonly<State>;
  declare setState: <K extends keyof State>(
    state: ((prevState: Readonly<State>, props: Readonly<Props>) => (Pick<State, K> | State | null)) | (Pick<State, K> | State | null),
    callback?: () => void
  ) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 my-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">
              {this.props.fallbackTitle || 'Component Encountered an Issue'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              An unexpected display issue occurred. You can retry loading this view safely.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono inline-flex items-center gap-2 transition-all shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
