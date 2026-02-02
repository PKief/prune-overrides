import { useUrlState } from "./hooks/useUrlState";
import { ResultsView } from "./components/ResultsView";
import { EmptyState } from "./components/EmptyState";

function App() {
  const { report, error, loading } = useUrlState();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">⚠</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        <header className="mb-4">
          <div className="text-center mb-3">
            {report.projectName && (
              <h1 className="text-lg font-bold text-gray-800 font-mono">{report.projectName}</h1>
            )}
            <p className="text-xs text-gray-500">Override Analysis</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <p>
              Results from{" "}
              <a
                href="https://www.npmjs.com/package/prune-overrides"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                prune-overrides
              </a>{" "}
              - analyzes npm overrides in your package.json.
            </p>
            <p className="mt-1 text-blue-600">
              <span className="text-red-500">✗ Remove</span> = safe to delete,{" "}
              <span className="text-green-600">✓ Keep</span> = still needed.
            </p>
          </div>
        </header>
        <ResultsView report={report} />
        <footer className="text-center mt-4 text-xs text-gray-400">
          <a
            href="https://github.com/PKief/prune-overrides"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-500"
          >
            github.com/PKief/prune-overrides
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
