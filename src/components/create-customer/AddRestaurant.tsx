"use client";

import axios from "axios";
import { useEffect, useState } from "react";

export default function AddRestaurant() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    location: "",
    GSTIN: "",
    FSSAI: "",
    PrimaryContactName: "",
    PrimaryContactPhone: "",
    brandId: "",
  });

  // Load all brands
  useEffect(() => {
    const URL = process.env.NEXT_PUBLIC_API_URL;
    axios.get(`${URL}/brand`).then((res) => {
      setBrands(res.data);
    });
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_API_URL;
      await axios.post(`${URL}/restaurant`, {
        ...form,
        brandId: Number(form.brandId),
      });

      alert("Restaurant Created Successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create restaurant");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Add Restaurant</h1>

        <div className="space-y-4">

          {/* Brand Dropdown */}
          <div>
            <label className="block font-medium mb-1">Select Brand</label>
            <select
              name="brandId"
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Brand</option>
              {brands.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} — ({b.business?.name})
                </option>
              ))}
            </select>
          </div>

          <input name="name" placeholder="Restaurant Name" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="address" placeholder="Address" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="location" placeholder="Location" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="GSTIN" placeholder="GSTIN" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="FSSAI" placeholder="FSSAI" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="PrimaryContactName" placeholder="Primary Contact Name" className="w-full border rounded px-3 py-2" onChange={handleChange} />
          <input name="PrimaryContactPhone" placeholder="Primary Contact Phone" className="w-full border rounded px-3 py-2" onChange={handleChange} />

          <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}