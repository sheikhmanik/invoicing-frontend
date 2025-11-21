"use client";

import axios from "axios";
import { useState } from "react";

export default function CreateStore({ business, brand, onBack, onDone }: any) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    location: "",
    GSTIN: "",
    FSSAI: "",
    PrimaryContactName: "",
    PrimaryContactPhone: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const URL = process.env.NEXT_PUBLIC_API_URL;
      await axios.post(`${URL}/restaurant`, {
        ...form,
        brandId: Number(brand.id),
      });
      alert("Store created");
      onDone();
    } catch (err) {
      console.error(err);
      alert("Failed to create store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <div className="text-sm text-gray-500">Business</div>
        <div className="font-medium">{business?.name}</div>
        <div className="text-sm text-gray-500 mt-2">Brand</div>
        <div className="font-medium">{brand?.name}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input name="name" placeholder="Store name" onChange={handleChange} className="border p-2 rounded" />
        <input name="address" placeholder="Address" onChange={handleChange} className="border p-2 rounded" />
        <input name="location" placeholder="Location" onChange={handleChange} className="border p-2 rounded" />
        <input name="GSTIN" placeholder="GSTIN" onChange={handleChange} className="border p-2 rounded" />
        <input name="FSSAI" placeholder="FSSAI" onChange={handleChange} className="border p-2 rounded" />
        <input name="PrimaryContactName" placeholder="Primary contact" onChange={handleChange} className="border p-2 rounded" />
        <input name="PrimaryContactPhone" placeholder="Primary phone" onChange={handleChange} className="border p-2 rounded" />
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
        <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-sky-600 text-white rounded">
          {loading ? "Saving..." : "Create Store"}
        </button>
      </div>
    </div>
  );
}