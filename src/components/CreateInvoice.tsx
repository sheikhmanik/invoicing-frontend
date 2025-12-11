"use client";

import axios from "axios";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CreateInvoice() {

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [business, setBusiness] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  // const [plan, setPlan] = useState<any[]>([]);

  const [brand, setBrand] = useState("");
  const [store, setStore] = useState("");
  const [plan, setPlan] = useState("");

  const [brandId, setBrandId] = useState<number | null>(null);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [planId, setPlanId] = useState<number | null>(null);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [displayDate, setDisplayDate] = useState("");

  const [duration, setDuration] = useState("1 Month");
  const [subtotal, setSubtotal] = useState(0);

  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(0);

  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxAmount, setTaxAmount] = useState(0);

  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    let discounted = subtotal;

    if (discountType === "percent") {
      discounted -= (subtotal * discountValue) / 100;
    } else {
      discounted -= discountValue;
    }

    const tax = taxEnabled ? discounted * 0.18 : 0;

    setTaxAmount(tax);
    setTotalAmount(discounted + tax);
  }, [subtotal, discountType, discountValue, taxEnabled]);

  useEffect(() => {
    axios.get(`${API}/business`).then((res) => {
      setBusinesses(res.data);
    });
  }, []);

  function handleBusiness(name: string) {
    setBusiness(name);
  
    if (!name || businesses.length === 0) {
      setBrands([]);
      setBrand("");
      setStores([]);
      setStore("");
      setPlan([]);
      setPlan("");
      return;
    }
  
    const selectedBusiness = businesses.find((b) => b.name === name);
    setBrands(selectedBusiness?.brands ?? []);
  
    setBrand("");
    setStores([]);
    setStore("");
    setPlan([]);
    setPlan("");
  }

  function handleBrand(name: string) {
    setBrand(name);
    const selectedBusiness = businesses.find((b) => b.name === business);
    const selectedBrand = selectedBusiness?.brands.find((br: any) => br.name === name);
    setStores(selectedBrand?.restaurants ?? []);
  }

  function handleStore(name: string) {
    setStore(name);
    const selectedBusiness = businesses.find((b) => b.name === business);
    const selectedBrand = selectedBusiness?.brands.find((br: any) => br.name === brand);
    const selectedStore = selectedBrand?.restaurants.find((st: any) => st.name === name);
    setPlan(selectedStore?.restaurantPricingPlans[0].pricingPlan ?? {});
  }

  // useEffect(() => {
  //   if (business && businesses && brands) {
  //     console.log({ businesses });
  //     console.log({ business });
  //     console.log({ brands });
  //     console.log({ stores });
  //     console.log({ plan });
  //   }
  // }, [business, brand]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ADD / UPDATE INVOICE</h1>
        <span className="text-gray-400 cursor-pointer hover:text-black">Manage Invoices</span>
      </div>

      <div className="space-y-6">

        {/* Company */}
        <div>
          <label className="text-sm font-semibold">Choose Business</label>
          <select
            className="w-full border rounded-md p-2 mt-1"
            value={business}
            onChange={(e) => handleBusiness(e.target.value as string)}
          >
            <option value="">Choose Company</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div>
          <label className="text-sm font-semibold">Choose Brand</label>
          <select
            className="w-full border rounded-md p-2 mt-1"
            value={brand}
            onChange={(e) => handleBrand(e.target.value as string)}
          >
            <option value="">Choose Brand</option>
            {brands.map((b) => (
              <option key={b} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Store + Plan */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold">Choose Store</label>
            <select
              className="w-full border rounded-md p-2 mt-1"
              value={store}
              onChange={(e) => handleStore(e.target.value as string)}
            >
              <option value="">Choose Store</option>
              {stores.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* <div>
            <label className="text-sm font-semibold">Choose Plan</label>
            <select
              className="w-full border rounded-md p-2 mt-1"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              <option value="">Choose Plan</option>
              {plan.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div> */}
        </div>

        {/* Invoice No */}
        <div>
          <label className="text-sm font-semibold">Invoice No #</label>
          <input
            type="text"
            className="w-full border rounded-md p-2 mt-1"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
          />
        </div>

        {/* Invoice Date */}
        <div>
          <label className="text-sm font-semibold">Invoice Date</label>
          <input
            type="date"
            className="w-full border rounded-md p-2 mt-1"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>

        {/* Display Date */}
        <div>
          <label className="text-sm font-semibold">Display Date (Optional)</label>
          <input
            type="date"
            className="w-full border rounded-md p-2 mt-1"
            value={displayDate}
            onChange={(e) => setDisplayDate(e.target.value)}
          />
        </div>

        {/* Duration */}
        <div>
          <label className="text-sm font-semibold">Invoice Duration</label>
          <select
            className="w-full border rounded-md p-2 mt-1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option>1 Month</option>
            <option>3 Months</option>
            <option>6 Months</option>
            <option>12 Months</option>
          </select>
        </div>

        {/* Subtotal */}
        <div>
          <label className="text-sm font-semibold">Subtotal Amount</label>
          <input
            type="number"
            className="w-full border rounded-md p-2 mt-1"
            value={subtotal}
            onChange={(e) => setSubtotal(Number(e.target.value))}
          />
        </div>

        {/* Discount */}
        <div>
          <label className="text-sm font-semibold">Discount</label>
          <div className="flex gap-2 mt-1">
            <select
              className="border rounded-md p-2"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
            >
              <option value="percent">Percent</option>
              <option value="fixed">Fixed</option>
            </select>

            <input
              type="number"
              className="border rounded-md p-2 flex-1"
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Tax */}
        <div className="flex items-center gap-3">
          <label className="font-semibold">Taxes (18%)</label>

          <input
            type="checkbox"
            checked={taxEnabled}
            onChange={() => setTaxEnabled(!taxEnabled)}
            className="w-5 h-5"
          />

          <input
            disabled
            type="number"
            value={taxAmount.toFixed(2)}
            className="border rounded-md p-2 w-24 bg-gray-100"
          />
        </div>

        {/* Total */}
        <div>
          <label className="text-sm font-semibold">Total Amount</label>
          <input
            disabled
            type="number"
            className="w-full border rounded-md p-2 bg-gray-100"
            value={totalAmount.toFixed(2)}
          />
        </div>

        {/* Submit */}

        <button
          className="w-full bg-black text-white py-2 rounded-md text-lg font-semibold hover:bg-gray-800"
        >
          Save Invoice
        </button>

      </div>
    </div>
  );
}