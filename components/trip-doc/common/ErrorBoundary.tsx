import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props  { children: ReactNode; fallback?: ReactNode; }
interface State  { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null }; }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="card max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-2">오류가 발생했습니다</h2>
            {this.state.error && (
              <p className="text-xs text-red-500 bg-red-50 rounded p-2 mb-4 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <button onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md">
                다시 시도
              </button>
              <button onClick={() => { window.location.href = '/'; }}
                className="px-4 py-2 bg-white border border-neutral-300 text-sm font-medium rounded-md">
                처음으로
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
