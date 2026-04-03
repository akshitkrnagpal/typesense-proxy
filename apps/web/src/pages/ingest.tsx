import { useState, useCallback } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_KEY = process.env.NEXT_PUBLIC_INGEST_API_KEY || "ingest-secret-key";

type Operation = "upsert" | "delete" | "bulk-import";

interface LogEntry {
  id: string;
  timestamp: string;
  operation: string;
  status: "success" | "error";
  message: string;
}

export default function IngestPage() {
  const [collection, setCollection] = useState("products");
  const [operation, setOperation] = useState<Operation>("upsert");
  const [docId, setDocId] = useState("");
  const [body, setBody] = useState(
    JSON.stringify(
      {
        id: "100",
        name: "New Product",
        description: "A test product added via ingest",
        price: 49.99,
        category: "Electronics",
        brand: "TestBrand",
        in_stock: true,
        rating: 4.0,
        created_at: Math.floor(Date.now() / 1000),
      },
      null,
      2,
    ),
  );
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState<Record<string, unknown> | null>(null);

  const addLog = useCallback(
    (operation: string, status: "success" | "error", message: string) => {
      setLog((prev) => [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString(),
          operation,
          status,
          message,
        },
        ...prev.slice(0, 49),
      ]);
    },
    [],
  );

  const execute = async () => {
    setLoading(true);
    try {
      let url: string;
      let method: string;
      let reqBody: string | undefined;

      switch (operation) {
        case "upsert":
          url = `${API_URL}/api/ingest/${collection}/documents`;
          method = "POST";
          reqBody = body;
          break;
        case "delete":
          url = `${API_URL}/api/ingest/${collection}/documents/${docId}`;
          method = "DELETE";
          break;
        case "bulk-import":
          url = `${API_URL}/api/ingest/${collection}/documents/import`;
          method = "POST";
          reqBody = body;
          break;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        ...(reqBody ? { body: reqBody } : {}),
      });

      const data = await res.json();

      if (res.ok) {
        addLog(operation, "success", JSON.stringify(data));
      } else {
        addLog(operation, "error", data.error || JSON.stringify(data));
      }
    } catch (err) {
      addLog(operation, "error", String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ingest/queue/status`, {
        headers: { "X-API-Key": API_KEY },
      });
      const data = await res.json();
      setQueueStatus(data);
    } catch {
      setQueueStatus({ error: "Failed to fetch" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <h1 className="text-xl font-bold text-gray-900">tsproxy</h1>
          <nav className="flex gap-4 text-sm">
            <Link href="/search" className="text-gray-500 hover:text-gray-900">
              Search
            </Link>
            <span className="font-medium text-gray-900">Ingest</span>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900">Ingest API</h2>
        <p className="mt-1 text-sm text-gray-500">
          Test the ingest endpoints — upsert, delete, or bulk import documents.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Collection
              </label>
              <input
                type="text"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Operation
              </label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as Operation)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              >
                <option value="upsert">Upsert Document</option>
                <option value="delete">Delete Document</option>
                <option value="bulk-import">Bulk Import</option>
              </select>
            </div>

            {operation === "delete" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Document ID
                </label>
                <input
                  type="text"
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  placeholder="e.g. 100"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
            )}

            {operation !== "delete" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  JSON Body
                  {operation === "bulk-import" && (
                    <span className="ml-1 text-gray-400">(array)</span>
                  )}
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-gray-400 focus:outline-none"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={execute}
                disabled={loading}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Execute"}
              </button>
              <button
                type="button"
                onClick={fetchQueueStatus}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Queue Status
              </button>
            </div>

            {queueStatus && (
              <pre className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                {JSON.stringify(queueStatus, null, 2)}
              </pre>
            )}
          </div>

          {/* Log */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Request Log
            </h3>
            <div className="mt-2 max-h-[600px] space-y-2 overflow-y-auto">
              {log.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  No requests yet. Execute an operation to see results.
                </p>
              ) : (
                log.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-lg border p-3 text-xs ${
                      entry.status === "success"
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {entry.operation.toUpperCase()}
                      </span>
                      <span className="text-gray-400">{entry.timestamp}</span>
                    </div>
                    <pre className="mt-1 whitespace-pre-wrap break-all text-gray-600">
                      {entry.message}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
