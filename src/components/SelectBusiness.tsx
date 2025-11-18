"use client";

import axios from "axios";
import { useEffect, useState } from "react";

export default function SelectBusiness({ onSelect, onCreateNew }: any) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // simple debounce
    const t = setTimeout(() => {
      load(query);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = async (q = "") => {
    setLoading(true);
    try {
      const URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${URL}/business`, {
        params: q ? { search: q } : {}
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // load initial
  useEffect(() => { load(); }, []);

  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search business by name..."
          className="flex-1 w-full md:w-auto border px-3 py-2 rounded"
        />
        <button onClick={() => onCreateNew()} className="w-full md:w-auto px-4 py-2 bg-sky-600 text-white rounded">
          + New Business
        </button>
      </div>

      <div className="space-y-2">
        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {results.map((b) => (
          <div key={b.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">{b.name}</div>
              <div className="text-xs text-gray-500">{b.address}</div>
            </div>
            <button
              onClick={() => onSelect(b)}
              className="px-3 py-1 border rounded text-sm"
            >
              Select
            </button>
          </div>
        ))}

        {results.length === 0 && !loading && (
          <div className="text-sm text-gray-500">No businesses found.</div>
        )}
      </div>
    </div>
  );
}