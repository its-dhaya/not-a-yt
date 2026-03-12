import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info.componentStack);
  }

  handleReload() {
    window.location.reload();
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message || "Unknown error";
    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-screen bg-zinc-950 font-sans flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20
                          flex items-center justify-center mx-auto mb-6"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f87171"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>

          <h1 className="font-display text-[28px] text-zinc-100 mb-2">
            Something went wrong
          </h1>
          <p className="text-zinc-400 text-[14px] leading-relaxed mb-8">
            The app ran into an unexpected error. Your progress up to this point
            may be lost. Try reloading the page.
          </p>

          {/* Error detail — dev only */}
          {isDev && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 mb-8 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                Error (dev only)
              </p>
              <p className="text-[12px] text-red-400 font-mono break-all leading-relaxed">
                {msg}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleReload}
              className="bg-emerald-400 text-black font-semibold text-[14px] px-7 py-3 rounded-xl
                         hover:opacity-85 transition-opacity"
            >
              Reload Page
            </button>
            <button
              onClick={() => this.handleReset()}
              className="border border-zinc-700 text-zinc-300 text-[14px] px-7 py-3 rounded-xl
                         hover:border-emerald-400 hover:text-emerald-400 transition-colors"
            >
              Try to Recover
            </button>
          </div>

          <p className="text-zinc-700 text-[12px] mt-8">
            NOT A YT · If this keeps happening, check the browser console.
          </p>
        </div>
      </div>
    );
  }
}
