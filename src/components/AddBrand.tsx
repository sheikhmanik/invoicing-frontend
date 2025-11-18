"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function AddBrand() {
  const [businesses, setBusinesses] = useState([]);
  const [form, setForm] = useState({
    name: "",
    businessId: "",
  });

  // Load all businesses for dropdown
  useEffect(() => {
    const URL = process.env.NEXT_PUBLIC_API_URL;
    axios.get(`${URL}/business`).then((res) => {
      setBusinesses(res.data);
    });
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_API_URL;
      await axios.post(`${URL}/brand`, {
        name: form.name,
        businessId: Number(form.businessId),
      });

      alert("Brand Created Successfully!");
    } catch (err) {
      console.error(err);
      alert("Error creating brand");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Add Brand</h1>

        <div className="space-y-4">

          {/* Business Select */}
          <div>
            <label className="block font-medium mb-1">Select Business</label>
            <select
              name="businessId"
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Business</option>
              {businesses.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Name */}
          <div>
            <label className="block font-medium mb-1">Brand Name</label>
            <input
              name="name"
              placeholder="Brand Name"
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}