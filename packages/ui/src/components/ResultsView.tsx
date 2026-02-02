import type { AnalysisReport } from "../hooks/useUrlState";

interface ResultsViewProps {
  report: AnalysisReport;
}

export function ResultsView({ report }: ResultsViewProps) {
  const redundant = report.results.filter((r) => r.verdict === "redundant");
  const required = report.results.filter((r) => r.verdict === "required");

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="flex gap-2 text-sm">
        <div className="flex-1 bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-gray-700">{report.total}</div>
          <div className="text-gray-500 text-xs">Total</div>
        </div>
        <div className="flex-1 bg-red-50 rounded-lg p-3 border border-red-100 text-center">
          <div className="text-2xl font-bold text-red-600">{report.redundant}</div>
          <div className="text-red-500 text-xs">Remove</div>
        </div>
        <div className="flex-1 bg-green-50 rounded-lg p-3 border border-green-100 text-center">
          <div className="text-2xl font-bold text-green-600">{report.required}</div>
          <div className="text-green-500 text-xs">Keep</div>
        </div>
      </div>

      {/* Redundant packages */}
      {redundant.length > 0 && (
        <div className="bg-white rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-500">✗</span>
            <span className="font-medium text-sm text-gray-700">Can be removed</span>
          </div>
          <ul className="space-y-1">
            {redundant.map((r) => (
              <li key={r.name}>
                <code className="text-red-700 text-sm font-mono">{r.name}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Required packages */}
      {required.length > 0 && (
        <div className="bg-white rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-500">✓</span>
            <span className="font-medium text-sm text-gray-700">Still required</span>
          </div>
          <ul className="space-y-1">
            {required.map((r) => (
              <li key={r.name}>
                <code className="text-green-700 text-sm font-mono">{r.name}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success message */}
      {redundant.length > 0 && required.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-sm text-green-700">
          🎉 All overrides can be removed!
        </div>
      )}
    </div>
  );
}
