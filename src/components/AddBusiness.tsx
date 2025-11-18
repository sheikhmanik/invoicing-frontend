"use client";

import { useState } from "react";
import axios from "axios";

export default function AddBusiness() {
  const [form, setForm] = useState({
    name: "",
    address: "",
    location: "",
    GSTIN: "",
    PrimaryContactName: "",
    PrimaryContactPhone: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.post(`${URL}/business`, form);
      alert("Business Created!");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Error creating business");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Add Business</h1>

        <div className="space-y-4">

          <div>
            <label className="block font-medium mb-1">Name</label>
            <input
              name="name"
              placeholder="Business Name"
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Address</label>
            <input
              name="address"
              placeholder="Address"
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Location</label>
            <input
              name="location"
              placeholder="City / Area"
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">GSTIN</label>
            <input
              name="GSTIN"
              placeholder="GSTIN Number"
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Primary Contact Name</label>
            <input
              name="PrimaryContactName"
              placeholder="Full Name"
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Primary Contact Phone</label>
            <input
              name="PrimaryContactPhone"
              placeholder="Phone Number"
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