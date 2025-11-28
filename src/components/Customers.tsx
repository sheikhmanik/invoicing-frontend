"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  createdAt?: string;
}

interface MeteredProduct {
  id?: number;
  productId: number;
  credits: number | string;
  product: Product;
  isActive?: boolean;
}

interface IncludedProduct {
  id?: number;
  productId: number;
  credits: number | string;
  product: Product;
  isActive?: boolean;
}

export interface PricingPlan {
  id: number;
  planType: "fixed" | "metered" | "hybrid";
  planName: string;
  description: string;
  fixedPrice?: number | string | null;
  basePrice: number | string;
  creditsIncluded: number | string;
  validity: number;
  meteredProducts: MeteredProduct[];
  includedProducts: IncludedProduct[];
  createdAt?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Customers({ onDone }: { onDone: () => void }) {

  const router = useRouter();

  const [restaurants, setRestaurants] = useState([]);
  const [allPlans, setAllPlans] = useState<PricingPlan[]>([]);
  const [planEditingModal, setPlanEditingModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<null | Record<any, any>>(null);
  const [currentPlan, setCurrentPlan] = useState<PricingPlan>();
  const [confirmAssigned, setConfirmAssigned] = useState(false);
  const [updatePayment, setUpdatePayment] = useState(false);
  const [currentResId, serCurrentResId] = useState<number | null>(null);
  const [paidCustomers, setPaidCustomers] = useState([]);
  const [unpaidCustomers, setUnpaidCustomers] = useState([]);
  const [display, setDisplay] = useState<"paid" | "unpaid" | "customers">(() => {
    const saved = localStorage.getItem("customerView");
    if (saved === "paid" || saved === "unpaid" || saved === "customers") {
      return saved;
    }
    return "paid";
  });
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    return today;
  });

  const [planMode, setPlanMode] = useState<"trial" | "live">("live");
  const [trialDays, setTrialDays] = useState<number>(15);

  const [taxSettings, setTaxSettings] = useState({
    CGST: false,
    SGST: false,
    IGST: false,
    LUT: false,
  });

  const [paymentDate, setPaymentDate] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isPartial, setIsPartial] = useState("No");
  const [error, setError] = useState("");

  async function selectRestaurant(restaurantId: any) {
    setCurrentPlan(undefined);
    const restaurant = restaurants.find((r: any) => r.id === restaurantId);
    if (restaurant) setSelectedRestaurant(restaurant);

    const map = await axios.get(`${API}/restaurant/plan-map/${restaurantId}`);
    const pricingPlanId = map.data?.pricingPlanId;

    if (pricingPlanId) {
      const planRes = await axios.get(`${API}/restaurant/plan-map/${restaurantId}/${pricingPlanId}`);
      const fullPlan = planRes.data;
      const { addLut, cgst, igst, sgst } = fullPlan;
      setTaxSettings({ LUT: addLut, CGST: cgst, IGST: igst, SGST: sgst });
      if (fullPlan) setCurrentPlan(fullPlan.pricingPlan);
    }
  }

  async function handleAssignPlan(restaurantId: number, pricingPlanId: number) {
    if (!startDate) return alert("Please include start date.");
    if (!planMode) return alert("Please include plan mode.");
    if (planMode === "trial" && !trialDays) return alert("Please include trial days.");
    if (!confirmAssigned) {
      alert("Please confirm. We can not go back. Edit this again.");
      setConfirmAssigned(true);
      return;
    }
    const payload = {
      restaurantId,
      pricingPlanId,
      ...taxSettings,
      startDate,
      planMode,
      trialDays,
    }
    try {
      await axios.post(`${API}/restaurant/plan-map`, payload);
      alert("Plan assigned successfully");
      setPlanEditingModal(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmAssigned(false);
    }
  }

  async function handleUpdateTaxSettings(restaurantId: number) {
    if (!startDate) return alert("Please include start date.");
    if (!planMode) return alert("Please include plan mode.");
    if (planMode === "trial" && !trialDays) return alert("Please include trial days.");
    const payload = {
      restaurantId,
      pricingPlanId: currentPlan?.id,
      ...taxSettings,
      startDate,
      planMode,
      trialDays,
    };
    console.log(payload);
    try {
      await axios.post(`${API}/restaurant/update-tax-settings`, payload);
      alert("Plan assigned successfully");
      setPlanEditingModal(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdatePayment() {
    if (!paymentDate) {
      setError("Payment date is required!");
      return;
    }

    setUpdating(true);
  
    try {
      let uploadedUrl = null;
  
      if (paymentFile) {
        const data = new FormData();
        data.append("file", paymentFile);
        data.append("upload_preset", "fuvii-invoice");
  
        const cloudinaryRes = await axios.post(
          "https://api.cloudinary.com/v1_1/dzr9nt9aj/auto/upload",
          data
        );
  
        uploadedUrl = cloudinaryRes.data.secure_url;
      }
  
      // Now send URL to backend ✔
      const payload = {
        currentResId,
        paymentDate,
        paymentNotes,
        isPartial,
        paymentFileUrl: uploadedUrl
      };
  
      await axios.post(`${API}/restaurant/update-payment`, payload);
  
      alert("Payment updated successfully!");
      setUpdatePayment(false);
      serCurrentResId(null);
      window.location.reload();
  
    } catch (err) {
      console.error(err);
      setError("Upload failed. Try again.");
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    axios.get(`${API}/restaurant`).then((res) => {
      setRestaurants(res.data);
      const paid = res.data?.filter((res: any) => res.invoices.length > 0 &&  res.invoices.at(-1).status === "paid");
      const unpaid = res.data?.filter((res: any) => res.invoices.length > 0 &&  res.invoices.at(-1).status === "pending");
      if (paid) setPaidCustomers(paid);
      if (unpaid) setUnpaidCustomers(unpaid);
      console.log(paid);
    });
  }, []);

  useEffect(() => {
    (async function fetchPricingPlan() {
      try {
        const res = await axios.get(`${API}/pricing-plan`);
        if (res.data) setAllPlans(res.data);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("customerView");
    if (saved === "paid" || saved === "unpaid" || saved === "customers") {
      setDisplay(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("customerView", display);
  }, [display]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return null;
  }

  if (restaurants.length === 0) {
    return (
      <table className="w-full">
        <tbody>
          <tr>
            <td colSpan={8} className="text-center py-6 text-gray-500">
              No customers found.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto overflow-scroll">
        <div className="flex flex-col gap-10">
          
          <div className="flex items-center justify-center">
            <button
              className={`flex-1 flex items-center justify-center py-2 ${display === "unpaid" ? "bg-blue-700 text-white font-semibold" : "bg-gray-200 text-black"} `}
              onClick={() => setDisplay("unpaid")}
            >Unpaid Invoice</button>
            <button
              className={`flex-1 flex items-center justify-center py-2 ${display === "paid" ? "bg-blue-700 text-white font-semibold" : "bg-gray-200 text-black"} `}
              onClick={() => setDisplay("paid")}
            >Paid Invoice</button>
            <button
              className={`flex-1 flex items-center justify-center py-2 ${display === "customers" ? "bg-blue-700 text-white font-semibold" : "bg-gray-200 text-black"} `}
              onClick={() => setDisplay("customers")}
            >All Customers</button>
          </div>

          {display === "customers" && (
            <div>
              <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
                <table className="w-full text-sm">
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
                  <tbody className="text-gray-700">
                    {restaurants?.map((r: any) => (
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
    
                          {/* Add/Edit Pricing plan */}
                          <div className="flex items-center justify-center mt-1">
                            <button
                              onClick={() => {
                                selectRestaurant(r.id);
                                setPlanEditingModal(true);
                              }}
                              className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer"
                            >
                              Add/Edit Pricing Plan
                            </button>
                          </div>
                        </td>
    
                        {/* SUBSCRIPTION TYPE */}
                        <td className="p-4 border-r text-center leading-5 text-sm text-gray-700">
                          {r.restaurantPricingPlans?.length > 0 && r.restaurantPricingPlans[0]?.pricingPlan ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {r.restaurantPricingPlans[0].pricingPlan.planName}
                              </span>
                              <span className="text-xs text-gray-500 capitalize">
                                {r.restaurantPricingPlans[0].pricingPlan.planType}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">No plan assigned.</span>
                          )}
                        </td>
    
                        {/* PROFORMA */}
                        <td className="p-4 border-r text-center text-xs space-y-3">
    
                          {/* Due Date */}
                          <div>
                            <p className="text-gray-500">Due Date</p>
                            <p className="font-semibold">
                              {r.invoices?.[r.invoices.length - 1]?.dueDate?.split("T")[0] ?? "--"}
                            </p>
                          </div>
    
                          {/* Total Amount */}
                          <div>
                            <p className="text-gray-500">Total Amount</p>
                            <p className="font-semibold">
                              ₹{r.invoices?.[r.invoices.length - 1]?.totalAmount ?? "--"}
                            </p>
                          </div>
    
                          {/* Status */}
                          <div>
                            <p className="text-gray-500">Status</p>
                            <p
                              className={`font-semibold capitalize ${
                                r.invoices?.[r.invoices.length - 1]?.status === "paid"
                                  ? "text-green-600"
                                  : r.invoices?.[r.invoices.length - 1]?.status === "overdue"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {r.invoices?.[r.invoices.length - 1]?.status ?? "--"}
                            </p>
                          </div>
    
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => router.push(`/proforma-invoice/${r.id}`)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Invoice
                            </button>
                            <button
                              onClick={() => {
                                serCurrentResId(r.id)
                                setUpdatePayment(true)
                              }}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Update Payment
                            </button>
                          </div>
    
                        </td>
    
                        {/* PENDING */}
                        <td className="p-4 border-r text-center leading-5">
                          <div className="text-red-600 font-semibold">
                            {r.invoices?.[r.invoices.length - 1]?.status === "pending" ? (
                              <p>${r.invoices?.[r.invoices.length - 1]?.totalAmount}</p>
                            ) : "-"}
                          </div>
                        </td>
    
                        {/* PAID */}
                        <td className="p-1 border-r text-center leading-5">
                          {r.invoices?.[r.invoices.length - 1]?.status === "pending" ? "-" : (
                            <div>
                              <div className="font-medium">Paid on</div>
                              <div className="text-gray-700">{r.invoices.at(-1)?.paymentDate?.split("T")[0]}</div>
                              <div className="text-xs text-gray-500 italic">Tax Invoice</div>
                              {r.invoices.at(-1)?.paymentFileUrl ? (
                                <Link
                                  href={r.invoices.at(-1)?.paymentFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 text-xs font-medium underline hover:text-blue-800 transition"
                                >
                                  View Receipt
                                </Link>
                              ) : (
                                <span className="text-gray-400 text-xs">No Proof</span>
                              )}
                              {r.invoices.at(-1)?.paymentNotes && (
                                <p className="text-gray-600 text-xs italic mt-1">
                                  {r.invoices.at(-1).paymentNotes}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
    
                        {/* INITIAL CHURN */}
                        <td className="p-4 border-r text-center font-medium">
                          -
                        </td>
    
                        {/* CHURN */}
                        <td className="p-4 border-r text-center font-medium">
                          -
                        </td>
    
                        {/* UPDATE ACTIONS */}
                        <td className="p-4 text-center space-y-2">
                          -
                          {/* <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50">
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
                          </button> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {display === "paid" && (
            <div>
              <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 border-b">
                    <tr>
                      <th className="p-3 border-r text-center font-semibold">Outlet</th>
                      <th className="p-3 border-r text-center font-semibold">Subscription Type</th>
                      <th className="p-3 border-r text-center font-semibold">Proforma Invoice</th>
                      <th className="p-3 border-r text-center font-semibold">Payment Docs</th>
                      <th className="p-3 border-r text-center font-semibold">Paid</th>
                      <th className="p-3 border-r text-center font-semibold">Initial Churn</th>
                      <th className="p-3 border-r text-center font-semibold">Churn</th>
                      <th className="p-3 text-center font-semibold">Update</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {paidCustomers?.map((r: any) => (
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

                          {/* Add/Edit Pricing plan */}
                          <div className="flex items-center justify-center mt-1">
                            <button
                              onClick={() => {
                                selectRestaurant(r.id);
                                setPlanEditingModal(true);
                              }}
                              className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer"
                            >
                              Add/Edit Pricing Plan
                            </button>
                          </div>
                        </td>

                        {/* SUBSCRIPTION TYPE */}
                        <td className="p-4 border-r text-center leading-5 text-sm text-gray-700">
                          {r.restaurantPricingPlans?.length > 0 && r.restaurantPricingPlans[0]?.pricingPlan ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {r.restaurantPricingPlans[0].pricingPlan.planName}
                              </span>
                              <span className="text-xs text-gray-500 capitalize">
                                {r.restaurantPricingPlans[0].pricingPlan.planType}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">No plan assigned.</span>
                          )}
                        </td>

                        {/* PROFORMA */}
                        <td className="p-4 border-r text-center text-xs space-y-3">

                          {/* Due Date */}
                          <div>
                            <p className="text-gray-500">Due Date</p>
                            <p className="font-semibold">
                              {r.invoices?.[r.invoices.length - 1]?.dueDate?.split("T")[0] ?? "--"}
                            </p>
                          </div>

                          {/* Total Amount */}
                          <div>
                            <p className="text-gray-500">Total Amount</p>
                            <p className="font-semibold">
                              ₹{r.invoices?.[r.invoices.length - 1]?.totalAmount ?? "--"}
                            </p>
                          </div>

                          {/* Status */}
                          <div>
                            <p className="text-gray-500">Status</p>
                            <p
                              className={`font-semibold capitalize ${
                                r.invoices?.[r.invoices.length - 1]?.status === "paid"
                                  ? "text-green-600"
                                  : r.invoices?.[r.invoices.length - 1]?.status === "overdue"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {r.invoices?.[r.invoices.length - 1]?.status ?? "--"}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => router.push(`/proforma-invoice/${r.id}`)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Invoice
                            </button>
                            <button
                              onClick={() => {
                                serCurrentResId(r.id)
                                setUpdatePayment(true)
                              }}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Update Payment
                            </button>
                          </div>

                        </td>

                        {/* Payment Docs */}
                        <td className="p-4 border-r text-center leading-5">
                          <div className="flex flex-col items-center gap-1">

                            {r.invoices.at(-1)?.paymentFileUrl ? (
                              <Link
                                href={r.invoices.at(-1)?.paymentFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-xs font-medium underline hover:text-blue-800 transition"
                              >
                                View Receipt
                              </Link>
                            ) : (
                              <span className="text-gray-400 text-xs">No Proof</span>
                            )}

                            {r.invoices.at(-1)?.paymentNotes && (
                              <p className="text-gray-600 text-xs italic mt-1">
                                {r.invoices.at(-1).paymentNotes}
                              </p>
                            )}

                          </div>
                        </td>

                        {/* PAID */}
                        <td className="p-4 border-r text-center leading-5">
                          <div className="font-medium">Paid on</div>
                          <div className="text-gray-700">{r.invoices.at(-1)?.paymentDate?.split("T")[0]}</div>
                          <div className="text-xs text-gray-500 italic">Tax Invoice</div>
                        </td>

                        {/* INITIAL CHURN (dummy) */}
                        <td className="p-4 border-r text-center font-medium">
                          -
                        </td>

                        {/* CHURN (dummy) */}
                        <td className="p-4 border-r text-center font-medium">
                          -
                        </td>

                        {/* UPDATE ACTIONS */}
                        <td className="p-4 text-center space-y-2">
                          -
                          {/* <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50">
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
                          </button> */}
                        </td>
                      </tr>
                    ))}
                    {restaurants.length > 0 && paidCustomers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-gray-500">
                          No paid customers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {display === "unpaid" && (
            <div>
              <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 border-b">
                    <tr>
                      <th className="p-3 border-r text-center font-semibold">Outlet</th>
                      <th className="p-3 border-r text-center font-semibold">Subscription Type</th>
                      <th className="p-3 border-r text-center font-semibold">Proforma Invoice</th>
                      <th className="p-3 border-r text-center font-semibold">Pending</th>
                      <th className="p-3 border-r text-center font-semibold">Due For</th>
                      <th className="p-3 border-r text-center font-semibold">Initial Churn</th>
                      <th className="p-3 border-r text-center font-semibold">Churn</th>
                      <th className="p-3 text-center font-semibold">Update</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {unpaidCustomers?.map((r: any) => (
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

                          {/* Add/Edit Pricing plan */}
                          <div className="flex items-center justify-center mt-1">
                            <button
                              onClick={() => {
                                selectRestaurant(r.id);
                                setPlanEditingModal(true);
                              }}
                              className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer"
                            >
                              Add/Edit Pricing Plan
                            </button>
                          </div>
                        </td>

                        {/* SUBSCRIPTION TYPE */}
                        <td className="p-4 border-r text-center leading-5 text-sm text-gray-700">
                          {r.restaurantPricingPlans?.length > 0 && r.restaurantPricingPlans[0]?.pricingPlan ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {r.restaurantPricingPlans[0].pricingPlan.planName}
                              </span>
                              <span className="text-xs text-gray-500 capitalize">
                                {r.restaurantPricingPlans[0].pricingPlan.planType}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">No plan assigned.</span>
                          )}
                        </td>

                        {/* PROFORMA */}
                        <td className="p-4 border-r text-center text-xs space-y-3">

                          {/* Due Date */}
                          <div>
                            <p className="text-gray-500">Due Date</p>
                            <p className="font-semibold">
                              {r.invoices?.[r.invoices.length - 1]?.dueDate?.split("T")[0] ?? "--"}
                            </p>
                          </div>

                          {/* Total Amount */}
                          <div>
                            <p className="text-gray-500">Total Amount</p>
                            <p className="font-semibold">
                              ₹{r.invoices?.[r.invoices.length - 1]?.totalAmount ?? "--"}
                            </p>
                          </div>

                          {/* Status */}
                          <div>
                            <p className="text-gray-500">Status</p>
                            <p
                              className={`font-semibold capitalize ${
                                r.invoices?.[r.invoices.length - 1]?.status === "paid"
                                  ? "text-green-600"
                                  : r.invoices?.[r.invoices.length - 1]?.status === "overdue"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {r.invoices?.[r.invoices.length - 1]?.status ?? "--"}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => router.push(`/proforma-invoice/${r.id}`)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Invoice
                            </button>
                            <button
                              onClick={() => {
                                serCurrentResId(r.id)
                                setUpdatePayment(true)
                              }}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Update Payment
                            </button>
                          </div>

                        </td>

                        {/* PENDING */}
                        <td className="p-4 border-r text-center leading-5">
                          <div className="text-red-600 font-semibold">
                            {r.invoices?.[r.invoices.length - 1]?.status === "pending" && (
                              <p>${r.invoices?.[r.invoices.length - 1]?.totalAmount}</p>
                            )}
                          </div>
                        </td>

                        {/* Due for */}
                        <td className="p-4 border-r text-center leading-5">
                          {(() => {
                            const days = Math.ceil(
                              (new Date().getTime() -
                                new Date(r.restaurantPricingPlans[0]?.startDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            );
                            return (
                              <>
                                {days}
                                <span className="px-1">{days === 1 ? "Day" : "Days"}</span>
                              </>
                            );
                          })()}
                        </td>

                        {/* INITIAL CHURN (dummy) */}
                        <td className="p-4 border-r text-center font-medium">
                          -
                        </td>

                        {/* CHURN (dummy) */}
                        <td className="p-4 border-r text-center font-medium">
                          -
                        </td>

                        {/* UPDATE ACTIONS */}
                        <td className="p-4 text-center space-y-2">
                          -
                          {/* <button className="block w-full text-xs py-1.5 border border-gray-300 rounded-md bg-gray-50">
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
                          </button> */}
                        </td>
                      </tr>
                    ))}
                    {restaurants.length > 0 && unpaidCustomers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-gray-500">
                          No unpaid customers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
      {planEditingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Assign / Edit Pricing Plan</h2>
              <button
                onClick={() => setPlanEditingModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-gray-50 border rounded-lg space-y-4">

              {/* Restaurant Info */}
              <div>
                <p className="text-xs text-gray-500">Restaurant</p>
                <p className="text-lg font-semibold text-gray-800">
                  {selectedRestaurant?.name}
                </p>

                <div className="mt-1 text-sm">
                  <p className="text-blue-600">
                    Brand: {selectedRestaurant?.brand?.name}
                  </p>
                  <p className="text-green-600">
                    Business: {selectedRestaurant?.brand?.business?.name}
                  </p>
                </div>
              </div>

              {/* Assigned Plan */}
              {!currentPlan && (
                <p>No plan assigned.</p>
              )}
              {currentPlan && (
                <div className="border-t pt-4">
                  
                  <p className="text-xs text-gray-500">Assigned Pricing Plan</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {currentPlan.planName}
                  </p>

                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium text-gray-700">Type:</span>{" "}
                      {currentPlan.planType}
                    </p>

                    {currentPlan.description && (
                      <p>
                        <span className="font-medium text-gray-700">Description:</span>{" "}
                        {currentPlan.description}
                      </p>
                    )}

                    {currentPlan.fixedPrice && (
                      <p>
                        <span className="font-medium text-gray-700">Fixed Price:</span>{" "}
                        ₹{currentPlan.fixedPrice}
                      </p>
                    )}

                    <p>
                      <span className="font-medium text-gray-700">Base Price:</span>{" "}
                      ₹{currentPlan.basePrice}
                    </p>

                    <p>
                      <span className="font-medium text-gray-700">Credits Included:</span>{" "}
                      {currentPlan.creditsIncluded}
                    </p>

                    {currentPlan.validity && (
                      <p>
                        <span className="font-medium text-gray-700">Validity:</span>{" "}
                        {currentPlan.validity} months
                      </p>
                    )}
                  </div>

                  {currentPlan.planType === "hybrid" && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mt-2">Included Products</h3>

                      {currentPlan.includedProducts?.length === 0 || !currentPlan.includedProducts ? (
                        <p className="text-gray-500 text-sm">No included products found.</p>
                      ) : (
                        <div className="space-y-3 mt-2">
                          {currentPlan.includedProducts?.map((prod, idx) => (
                            <div
                              key={prod.productId + "-included-" + idx}
                              className="p-3 bg-white border rounded-lg shadow-sm flex justify-between"
                            >
                              <div className="text-sm font-medium text-gray-800">
                                {prod.product?.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                Credits:{" "}
                                <span className="font-semibold">{prod.credits}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mt-2">Metered Products</h3>

                    {(currentPlan.meteredProducts?.length === 0 || !currentPlan.meteredProducts) ? (
                      <p className="text-gray-500 text-sm">No metered products found.</p>
                    ) : (
                      <div className="space-y-3 mt-2">
                        {currentPlan.meteredProducts?.map((prod, idx) => (
                          <div
                            key={prod.productId + "-metered-" + idx}
                            className="p-3 bg-white border rounded-lg shadow-sm flex justify-between"
                          >
                            <div className="text-sm font-medium text-gray-800">
                              {prod.product?.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              Credits:{" "}
                              <span className="font-semibold">{prod.credits}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
            
            {/* TAX SETTINGS & TIME TABLE SECTION */}
            <div className="border rounded-lg p-2 bg-gray-50">
              <div className="bg-gray-100 p-4 rounded space-y-3">
                <h3 className="text-md font-semibold text-gray-800">GST Settings</h3>

                <div className="flex flex-col gap-2 text-sm">

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={taxSettings.CGST}
                      onChange={(e) => setTaxSettings(prev => ({ ...prev, CGST: e.target.checked }))}
                    />
                    <span>CGST 9%</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={taxSettings.SGST}
                      onChange={(e) => setTaxSettings(prev => ({ ...prev, SGST: e.target.checked }))}
                    />
                    <span>SGST 9%</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={taxSettings.IGST}
                      onChange={(e) => setTaxSettings(prev => ({ ...prev, IGST: e.target.checked }))}
                    />
                    <span>IGST 18%</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={taxSettings.LUT}
                      onChange={(e) => setTaxSettings(prev => ({ ...prev, LUT: e.target.checked }))}
                    />
                    <span>Add LUT</span>
                  </label>

                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded space-y-4 mt-2">
                <h3 className="text-md font-semibold text-gray-800">Time Structure</h3>

                {/* Start Date */}
                <div className="flex flex-col gap-1 text-sm">
                  <label className="font-medium">Start Date:</label>
                  <input
                    type="date"
                    className="border p-2 rounded"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {/* Plan Mode */}
                <div className="flex flex-col gap-2 text-sm">
                  <label className="font-medium">Plan Mode:</label>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="planMode"
                        value="live"
                        checked={planMode === "live"}
                        onChange={() => setPlanMode("live")}
                      />
                      <span>Live</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="planMode"
                        value="trial"
                        checked={planMode === "trial"}
                        onChange={() => setPlanMode("trial")}
                      />
                      <span>Trial</span>
                    </label>
                  </div>
                </div>

                {/* Trial Days (conditional) */}
                {planMode === "trial" && (
                  <div className="flex flex-col gap-1 text-sm">
                    <label className="font-medium">Trial Duration (Days):</label>
                    <input
                      type="number"
                      min="1"
                      className="border p-2 rounded"
                      value={trialDays}
                      onChange={(e) => setTrialDays(Number(e.target.value))}
                      placeholder="Enter number of days"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 mb-1">
                <button
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                  onClick={() => {
                    setPlanEditingModal(false);
                    serCurrentResId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm rounded-md bg-sky-600 text-white shadow
                  hover:bg-sky-700 focus:ring-2 focus:ring-sky-400 transition-all"
                  onClick={() => handleUpdateTaxSettings(selectedRestaurant?.id)}
                >
                  Update
                </button>
              </div>
            </div>

            {/* PLAN GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {allPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between"
                >
                  <div>

                    {currentPlan && currentPlan.id === plan.id && (
                      <div className="mb-3">
                        <span className="text-[10px] px-2 py-1 bg-green-600 text-white font-semibold rounded-full uppercase tracking-wide">
                          ✓ Assigned
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-900">{plan.planName}</h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded capitalize">
                        {plan.planType}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mt-2 mb-3 line-clamp-3">
                      {plan.description || "No description available"}
                    </p>

                    <div className="space-y-1 text-sm text-gray-700">
                      {plan.planType === "hybrid" && (
                        <p>
                          <span className="font-medium">Top-up Price (Metered):</span> ₹{plan.fixedPrice}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Base Price:</span> ₹{plan.basePrice}
                      </p>
                      <p>
                        <span className="font-medium">Credits Included:</span> {plan.creditsIncluded}
                      </p>
                      <p>
                        <span className="font-medium">Validity:</span> {plan.validity} months
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleAssignPlan(selectedRestaurant?.id, plan.id)}
                      disabled={currentPlan && currentPlan.id === plan.id}
                      className={`
                        flex-1 py-2 rounded text-sm font-medium transition
                        ${currentPlan && currentPlan.id === plan.id 
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                        }
                      `}
                    >
                      {currentPlan && currentPlan.id === plan.id ? "Already Assigned" : "Assign This Plan"}
                    </button>
                  </div>
                </div>
              ))}

            </div>

            {allPlans.length === 0 && (
              <p className="text-center text-gray-500 py-6">No pricing plans available.</p>
            )}

          </div>
        </div>
      )}
      {updatePayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col gap-6 w-full p-6 rounded-lg shadow-sm border border-gray-200">

              {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:bg-white
                  focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Payment Notes</label>
                <textarea
                  rows={4}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add additional payment details..."
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:bg-white
                  focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Is Payment Partially Done?</label>
                <select
                  value={isPartial}
                  onChange={(e) => setIsPartial(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:bg-white
                  focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none cursor-pointer transition-all"
                >
                  <option value="No">No</option> {/* ⭐ Default */}
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Upload Payment Proof</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 
                  focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <p className="text-xs text-gray-500">
                  Accepted: Images / PDF (max 5MB)
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                  onClick={() => {
                    setUpdatePayment(false);
                    serCurrentResId(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  disabled={updating}
                  onClick={handleUpdatePayment}
                  className={`
                    relative px-4 py-2 text-sm rounded-md font-medium
                    transition-all duration-200
                    ${updating
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-sky-600 text-white shadow hover:bg-sky-700 focus:ring-2 focus:ring-sky-400"
                    }
                  `}
                >
                  {updating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Updating…
                    </span>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}