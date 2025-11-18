"use client";

import axios from "axios";
import { useEffect, useState } from "react";

export default function SelectBrand({ business, onBack, onSelect, onCreateNew }: any) {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!business) return;
    loadBrands(business.id);
  }, [business]);

  const loadBrands = async (businessId: number) => {
    setLoading(true);
    try {
      const URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${URL}/brand`, {
        params: { businessId }
      });
      setBrands(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-500">Selected Business</div>
          <div className="font-medium">{business?.name}</div>
        </div>

        <div className="flex gap-2">
          <button onClick={onBack} className="px-3 py-1 border rounded">Back</button>
          <button onClick={() => onCreateNew()} className="px-3 py-1 bg-sky-600 text-white rounded">+ New Brand</button>
        </div>
      </div>

      <div className="space-y-2">
        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {brands.map((b) => (
          <div key={b.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">{b.name}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onSelect(b)} className="px-3 py-1 border rounded text-sm">Select</button>
            </div>
          </div>
        ))}

        {brands.length === 0 && !loading && (
          <div className="text-sm text-gray-500">No brands found for this business.</div>
        )}
      </div>
    </div>
  );
}