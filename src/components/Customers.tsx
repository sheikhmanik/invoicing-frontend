"use client";

import axios from "axios";
import { useEffect, useState } from "react";

export default function Customers() {

  const [restaurants, setRestaurants] = useState([]);

  // Load restaurants on mount
  useEffect(() => {
    const URL = process.env.NEXT_PUBLIC_API_URL;
    axios.get(`${URL}/restaurant`).then((res) => {
      setRestaurants(res.data);
      console.log(res.data);
    });
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto overflow-scroll">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Total Customers</h1>

      {/* Table Container */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          {/* Header */}
          <thead className="bg-gray-100 text-gray-700 border-b">
            <tr>
              <th className="p-3 border-r text-center font-semibold">Outlet</th>
              <th className="p-3 border-r text-center font-semibold">Subscription Type</th>
              <th className="p-3 border-r text-center font-semibold">Proforma Invoice</th>
              <th className="p-3 border-r text-center font-semibold">Pending</th>
              <th className="p-3 border-r text-center font-semibold">Paid</th>
              <th className="p-3 border-r text-center font-semibold">Initial Churn</th>
              <th className="p-3 border-r text-center font-semibold">Churn</th>
              <th className="p-3 text-center font-semibold">Update</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="text-gray-700">

            {restaurants.map((r: any) => (
              <tr key={r.id} className="border-b hover:bg-gray-50 transition">

                {/* OUTLET */}
                <td className="p-4 border-r text-center">
                  <div className="font-semibold text-gray-800">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.location}</div>

                  {/* Brand Name */}
                  <div className="text-xs text-blue-600 mt-1 font-medium">
                    Brand: {r.brand?.name || "—"}
                  </div>

                  {/* Business Name */}
                  <div className="text-xs text-green-600 font-medium">
                    Business: {r.brand?.business?.name || "—"}
                  </div>
                </td>

                {/* SUBSCRIPTION TYPE (dummy) */}
                <td className="p-4 border-r text-center leading-5">
                  <div className="font-medium">Start: 1-6-25</div>
                  <div className="text-sm">Recurring: 3 months</div>
                  <div className="text-sm text-gray-500">Metered / Usage</div>
                </td>

                {/* PROFORMA (dummy) */}
                <td className="p-4 border-r text-center leading-5">
                  <div className="font-medium">E/24/1/0001</div>
                  <div className="text-gray-700">₹ 25,000</div>
                </td>

                {/* PENDING (dummy) */}
                <td className="p-4 border-r text-center leading-5">
                  <div className="text-red-600 font-semibold">₹ 15,000</div>
                  <button className="text-blue-600 text-xs underline hover:text-blue-800">
                    Create Invoice
                  </button>
                </td>

                {/* PAID (dummy) */}
                <td className="p-4 border-r text-center leading-5">
                  <div className="font-medium">Paid on</div>
                  <div className="text-gray-700">25/11/2025</div>
                  <div className="text-xs text-gray-500 italic">Tax Invoice</div>
                </td>

                {/* INITIAL CHURN (dummy) */}
                <td className="p-4 border-r text-center font-medium">
                  15–30 days
                </td>

                {/* CHURN (dummy) */}
                <td className="p-4 border-r text-center font-medium">
                  31–50 days
                </td>

                {/* UPDATE ACTIONS */}
                <td className="p-4 text-center space-y-2">
                  <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50">
                    Pause Subscription
                  </button>
                  <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50">
                    Paid Confirmation
                  </button>
                  <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50">
                    Reference Receipt
                  </button>
                  <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50">
                    Extend License
                  </button>
                </td>
              </tr>
            ))}

            {restaurants.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}

            {/* <tr className="border-b hover:bg-gray-50 transition">
              
              <td className="p-4 border-r text-center">
                <div className="font-semibold text-gray-800">Hotel Empire</div>
                <div className="text-xs text-gray-500">Koramangala</div>
              </td>

              <td className="p-4 border-r text-center leading-5">
                <div className="font-medium">Start: 1-6-25</div>
                <div className="text-sm">Recurring: 3 months</div>
                <div className="text-sm text-gray-500">Metered / Usage</div>
              </td>

              <td className="p-4 border-r text-center leading-5">
                <div className="font-medium">E/24/1/0001</div>
                <div className="text-gray-700">₹ 25,000</div>
              </td>

              <td className="p-4 border-r text-center leading-5">
                <div className="text-red-600 font-semibold">₹ 15,000</div>
                <button className="text-blue-600 text-xs underline hover:text-blue-800">
                  Create Invoice
                </button>
              </td>

              <td className="p-4 border-r text-center leading-5">
                <div className="font-medium">Paid on</div>
                <div className="text-gray-700">25/11/2025</div>
                <div className="text-xs text-gray-500 italic">Tax Invoice</div>
              </td>

              <td className="p-4 border-r text-center font-medium">
                15-30 days
              </td>

              <td className="p-4 border-r text-center font-medium">
                31-50 days
              </td>

              <td className="p-4 text-center space-y-2">
                <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition">
                  Pause Subscription
                </button>
                <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition">
                  Paid Confirmation
                </button>
                <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition">
                  Reference Receipt
                </button>
                <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition">
                  Extend License
                </button>
              </td>
            </tr> */}
          </tbody>
        </table>
      </div>
    </div>
  );
}