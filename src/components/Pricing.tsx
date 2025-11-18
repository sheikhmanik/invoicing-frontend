"use client";

import axios from "axios";
import { SquarePen } from "lucide-react";
import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  createdAt?: string;
}

interface MeteredUsage {
  id?: number;
  productId: number;
  credits: number | string;
  product: Product;
  isActive?: boolean;
}

export interface PricingPlan {
  id?: number;
  planType: "fixed" | "metered" | "hybrid";
  planName: string;
  description: string;
  fixedPrice?: number | string | null;
  basePrice: number | string;
  creditsIncluded: number | string;
  validity: number;
  meteredUsages: MeteredUsage[];
  createdAt?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Pricing() {

  const [allPlans, setAllPlans] = useState<PricingPlan[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [onDisplayProducts, setOnDisplayProducts] = useState<boolean>(false);

  const [currentPlan, setCurrentPlan] = useState<PricingPlan | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [createProductModal, setCreateProductModal] = useState(false);

  const [newProductName, setNewProductName] = useState("");
  const [newProductCredit, setNewProductCredit] = useState("");

  const emptyPlan = (): PricingPlan => ({
    planType: "fixed",
    planName: "",
    description: "",
    fixedPrice: "",
    basePrice: "",
    creditsIncluded: "",
    validity: 6,
    meteredUsages: []
  });

  // load plans
  const loadPlans = async () => {
    try {
      const res = await axios.get<PricingPlan[]>(`${API}/pricing-plan`);
      setAllPlans(res.data || []);
      if (!currentPlan && res.data && res.data.length > 0) {
        setCurrentPlan(res.data[0]);
        setIsCreatingNew(false);
      } else if (isCreatingNew === false && currentPlan) {
        // try keep current selected id if exists
        const found = res.data.find(p => p.id === currentPlan?.id);
        if (found) setCurrentPlan(found);
        else if (res.data.length) setCurrentPlan(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load plans", err);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // select plan from dropdown by id
  const onSelectPlan = (planId: number) => {
    const p = allPlans.find(x => x.id === planId) || null;
    setCurrentPlan(p);
    setIsCreatingNew(false);
  };

  // start creating a new plan (Create Behavior 1)
  const onCreatePlan = () => {
    setCurrentPlan(emptyPlan());
    setIsCreatingNew(true);
  };

  // add product modal handler: create product and (optionally) attach to metered plan
  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return alert("Product name required");
    try {
      const payload: any = { name: newProductName };
      if (newProductCredit !== "") payload.credit = Number(newProductCredit);

      const res = await axios.post(`${API}/products`, payload);
      const createdProduct: Product = res.data.product ?? res.data;

      // Immediately add to currentPlan's meteredUsages (so user can set/save)
      // If server returned meteredUsage, use that (we still push to UI)
      const muFromServer = res.data.meteredUsage ?? null;

      if (!currentPlan) setCurrentPlan(emptyPlan());

      setCurrentPlan(prev => {
        const updated = prev ? { ...prev } : emptyPlan();
        // add new metered usage stub (if product exists)
        updated.meteredUsages = [
          ...updated.meteredUsages,
          {
            id: muFromServer?.id,
            productId: createdProduct.id,
            credits: muFromServer ? muFromServer.credits : (newProductCredit ? Number(newProductCredit) : 0),
            product: createdProduct,
            isActive: muFromServer ? muFromServer.isActive : true
          }
        ];
        return updated;
      });

      // close modal & reset
      setCreateProductModal(false);
      setNewProductName("");
      setNewProductCredit("");
      // optionally reload product list if you maintain one
      alert("Product created and added to current plan view.");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create product");
    }
  };

  // save plan (create or update). Important: include planId when updating
  const handleSavePlan = async () => {
    if (!currentPlan) return alert("No plan to save");
    if (
      !currentPlan.planName
      || !currentPlan.planType
      || !currentPlan.description.trim()
      || !currentPlan.basePrice
      || !currentPlan.validity
      || !currentPlan.creditsIncluded
    ) return alert("Plan name required");

    const payload: any = {
      planType: currentPlan.planType,
      planName: currentPlan.planName,
      description: currentPlan.description,
      basePrice: Number(currentPlan.basePrice),
      creditsIncluded: Number(currentPlan.creditsIncluded),
      validity: currentPlan.validity,
      meteredUsages: currentPlan.meteredUsages.map(mu => ({
        productId: mu.productId,
        name: mu.product?.name,
        credits: Number(mu.credits) || 0
      }))
    };

    if (currentPlan.planType === "hybrid") {
      payload.fixedPrice = Number(currentPlan.fixedPrice) || 0;
    }

    console.log("Payload", payload);

    // if we're editing existing plan, include planId to update that plan
    if (!isCreatingNew && currentPlan.id) payload.planId = currentPlan.id;

    try {
      const res = await axios.post(`${API}/pricing-plan`, payload);
      const savedPlan = res.data?.plan ?? res.data?.planId ?? null;

      // reload plans and select the saved plan
      await loadPlans();
      if (res.data?.plan?.id) {
        setIsCreatingNew(false);
        setCurrentPlan(res.data.plan);
      } else {
        // fallback: find by name or keep first
        const byName = allPlans.find(p => p.planName === payload.planName);
        if (byName) setCurrentPlan(byName);
      }
      alert("Plan saved.");
    } catch (err) {
      console.error("Failed to save plan", err);
      alert("Failed to save plan");
    }
  };

  // helper to update currentPlan fields
  const updateCurrent = (patch: Partial<PricingPlan>) => {
    setCurrentPlan(prev => prev ? ({ ...prev, ...patch }) : ({ ...emptyPlan(), ...patch }));
  };

  // change a metered usage credits locally
  const setMeteredCredits = (idx: number, value: string) => {
    setCurrentPlan(prev => {
      if (!prev) return prev;
      const next = { ...prev, meteredUsages: [...prev.meteredUsages] };
      next.meteredUsages[idx] = { ...next.meteredUsages[idx], credits: value };
      return next;
    });
  };

  const availableProducts = allProducts.filter(
    p => !currentPlan?.meteredUsages.some(mu => mu.productId === p.id)
  );

  const attachProductToPlan = (product: Product) => {
    setCurrentPlan(prev => ({
      ...prev!,
      meteredUsages: [
        ...prev!.meteredUsages,
        {
          productId: product.id,
          credits: 0,
          product,
          isActive: true
        }
      ]
    }));
  };

  useEffect(() => {
    (async () => {
      const res = await axios.get(`${API}/products`);
      setAllProducts(res.data);
    })();
  }, []);

  useEffect(() => {
    if (!currentPlan) return;

    if (currentPlan.planType !== "hybrid") {
      setCurrentPlan((prev: any) => ({
        ...prev!,
        fixedPrice: ""
      }))
    }
  }, [currentPlan?.planType]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <label className="block mb-2 font-semibold">Select Plan</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={currentPlan?.id ?? ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              onSelectPlan(id);
            }}
          >
            <option value="">-- choose plan --</option>
            {allPlans.map(p => (
              <option key={p.id} value={p.id}>
                {p.planName} ({p.planType})
              </option>
            ))}
            <option value="">-- create new --</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={onCreatePlan}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            + Create Plan
          </button>
          <button
            onClick={() => loadPlans()}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="my-10 bg-white border rounded-lg shadow-md p-6">

        <div className="flex gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Plans Overview
          </h2>
          <button
            onClick={onCreatePlan}
            className="text-lg text-blue-700 underline cursor-pointer"
          >
            + Create Plan
          </button>
        </div>

        <div className="rounded-lg max-h-[350px] overflow-scroll">
          <table className="min-w-full border-collapse text-left">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr className="bg-gray-100 border-b">
                <th className="p-3 text-start font-semibold text-gray-700">Plan Name</th>
                <th className="p-3 text-start font-semibold text-gray-700">Plan Type</th>
                <th className="p-3 text-start font-semibold text-gray-700">Description</th>
                <th className="p-3 text-start font-semibold text-gray-700">Price</th>
                <th className="p-3 text-start font-semibold text-gray-700">Credits</th>
              </tr>
            </thead>
            <tbody>
              {allPlans.map((plan: any) => (
                <tr key={plan.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-start">
                    <div className="flex items-center gap-1">
                      <a
                        className="text-blue-700 cursor-pointer"
                        onClick={() => onSelectPlan(plan.id)}
                      >
                        <SquarePen size={16} />
                      </a>
                      <p>{plan.planName}</p>
                    </div>
                  </td>
                  <td className="p-3 text-start capitalize">{plan.planType}</td>
                  <td className="p-3 text-start text-gray-600">{plan.description || "—"}</td>
                  <td className="p-3 text-start">₹ {plan.basePrice}</td>
                  <td className="p-3 text-start">{plan.creditsIncluded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {currentPlan ? (
        <>
          <div className="bg-white p-6 rounded shadow mb-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold">Plan Type</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={currentPlan.planType === "fixed"}
                    onChange={() => updateCurrent({ planType: "fixed" })}
                  />
                  <span>Fixed</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={currentPlan.planType === "metered"}
                    onChange={() => updateCurrent({ planType: "metered" })}
                  />
                  <span>Metered</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={currentPlan.planType === "hybrid"}
                    onChange={() => updateCurrent({ planType: "hybrid" })}
                  />
                  <span>Hybrid</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold">Plan Name</label>
              <input
                className="w-full border px-3 py-2 rounded mt-1"
                value={currentPlan.planName}
                onChange={(e) => updateCurrent({ planName: e.target.value })}
                placeholder="e.g. Basic Monthly"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold">Description</label>
              <textarea
                className="w-full border px-3 py-2 rounded mt-1"
                value={currentPlan.description ?? ""}
                onChange={(e) => updateCurrent({ description: e.target.value })}
              />
            </div>

            {currentPlan.planType === "hybrid" && (
              <div>
                <label className="block text-sm font-semibold">Price <span className="text-sm font-light">(Fixed)</span></label>
                <input
                  className="w-full border px-3 py-2 rounded mt-1"
                  value={String(currentPlan.fixedPrice ?? "")}
                  onChange={(e) => updateCurrent({ fixedPrice: e.target.value })}
                  inputMode="numeric"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold">Validity (in months)</label>
              <input
                type="number"
                className="w-full border px-3 py-2 rounded mt-1"
                value={currentPlan.validity}
                onChange={(e) => updateCurrent({ validity: Number(e.target.value) })}
                placeholder="e.g. 6"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold">Base Price</label>
                <input
                  className="w-full border px-3 py-2 rounded mt-1"
                  value={String(currentPlan.basePrice ?? "")}
                  onChange={(e) => updateCurrent({ basePrice: e.target.value })}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold">Credits Included</label>
                <input
                  className="w-full border px-3 py-2 rounded mt-1"
                  value={String(currentPlan.creditsIncluded ?? "")}
                  onChange={(e) => updateCurrent({ creditsIncluded: e.target.value })}
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Metered Usages</h3>
              <button
                onClick={() => setCreateProductModal(true)}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
              >
                + Add Product
              </button>
            </div>

            <div className="flex items-end justify-end mb-4">
              <button
                className={`flex items-center justify-center p-2 text-sm rounded ${onDisplayProducts === true ? "bg-blue-700 text-white" : "bg-gray-200 text-black"} `}
                onClick={() => setOnDisplayProducts(!onDisplayProducts)}
              >Existing Products</button>
            </div>

            {onDisplayProducts && (
              <div className="space-y-3 mb-4">
                {availableProducts.length === 0 && (
                  <p className="text-gray-500 text-sm">No products available</p>
                )}
                {availableProducts.map(prod => (
                  <div
                    key={prod.id}
                    className="flex justify-between p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => attachProductToPlan(prod)}
                  >
                    <span className="font-medium">{prod.name}</span>
                    <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            {currentPlan.meteredUsages.length === 0 && (
              <p className="text-sm text-gray-500">No metered usages yet.</p>
            )}

            <div className="space-y-3">
              {currentPlan?.meteredUsages?.map((mu, idx) => (
                <div key={mu.productId + "-" + idx} className="flex items-center gap-4">
                  <div className="w-1/3">
                    <div className="text-sm font-medium">{mu.product?.name}</div>
                  </div>
                  <div className="flex-1">
                    <input
                      className="w-full border px-3 py-2 rounded"
                      value={String(mu.credits)}
                      onChange={(e) => setMeteredCredits(idx, e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSavePlan}
              className="px-4 py-2 bg-sky-600 text-white rounded"
            >
              Save Plan
            </button>

            <button
              onClick={() => { loadPlans(); setIsCreatingNew(false); }}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <p>No plan selected</p>
      )}

      {/* Create Product Modal */}
      {createProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h3 className="font-semibold mb-3">Create Product</h3>

            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full border px-3 py-2 rounded mt-1 mb-3"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="WhatsApp"
            />

            <label className="block text-sm font-medium">Credit (optional)</label>
            <input
              className="w-full border px-3 py-2 rounded mt-1 mb-4"
              value={newProductCredit}
              onChange={(e) => setNewProductCredit(e.target.value)}
              placeholder="e.g. 1.5"
            />

            <div className="flex gap-3 justify-end">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setCreateProductModal(false)}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleCreateProduct}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}