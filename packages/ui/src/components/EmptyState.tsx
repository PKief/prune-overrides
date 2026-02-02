export function EmptyState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Prune Overrides</h1>
        <p className="text-gray-600 text-sm mb-4">
          Analyze your npm overrides to find which ones can be safely removed.
        </p>
        <div className="bg-white rounded-lg border p-4 text-left">
          <p className="text-xs text-gray-500 mb-2">Run in your project:</p>
          <code className="block bg-gray-900 text-green-400 p-3 rounded text-sm font-mono">
            npx prune-overrides --share
          </code>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          <a
            href="https://github.com/PKief/prune-overrides"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-500"
          >
            github.com/PKief/prune-overrides
          </a>
        </p>
      </div>
    </div>
  );
}
