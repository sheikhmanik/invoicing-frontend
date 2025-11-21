"use client";

import axios from "axios";
import { SquarePen } from "lucide-react";
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
  id?: number;
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

export default function Pricing() {

  const [allPlans, setAllPlans] = useState<PricingPlan[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productType, setProductType] = useState<"included" | "metered">("metered");

  const [currentPlan, setCurrentPlan] = useState<PricingPlan | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [createProductModal, setCreateProductModal] = useState(false);
  const [planEditingModal, setPlanEditingModal] = useState(false);

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
    meteredProducts: [],
    includedProducts: [],
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
    setPlanEditingModal(true);
  };

  // add product modal handler: create product and (optionally) attach to metered plan
  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return alert("Product name required");
    try {
      const payload: any = { name: newProductName };
      if (newProductCredit !== "") payload.credit = Number(newProductCredit);

      const res = await axios.post(`${API}/products`, payload);
      const createdProduct: Product = res.data.product ?? res.data;

      // Immediately add to currentPlan's meteredProducts (so user can set/save)
      // If server returned meteredProduct, use that (we still push to UI)
      const ipFromServer = res.data.includedProduct ?? null;
      const mpFromServer = res.data.meteredProduct ?? null;

      if (!currentPlan) setCurrentPlan(emptyPlan());

      // if (productType === "metered") {
      //   setCurrentPlan(prev => {
      //     const updated = prev
      //       ? {
      //           ...prev,
      //           meteredProducts: prev.meteredProducts ?? [],
      //           includedProducts: prev.includedProducts ?? []
      //         }
      //       : emptyPlan();
      
      //     updated.meteredProducts = [
      //       ...updated.meteredProducts,
      //       {
      //         id: mpFromServer?.id,
      //         productId: createdProduct.id,
      //         credits: mpFromServer ? mpFromServer.credits : (newProductCredit ? Number(newProductCredit) : 0),
      //         product: createdProduct,
      //         isActive: mpFromServer ? mpFromServer.isActive : true
      //       }
      //     ];
      
      //     return updated;
      //   });
      // }
      
      // if (productType === "included") {
      //   setCurrentPlan(prev => {
      //     const updated = prev
      //       ? {
      //           ...prev,
      //           meteredProducts: prev.meteredProducts ?? [],
      //           includedProducts: prev.includedProducts ?? []
      //         }
      //       : emptyPlan();
      
      //     updated.includedProducts = [
      //       ...updated.includedProducts,
      //       {
      //         id: ipFromServer?.id,
      //         productId: createdProduct.id,
      //         credits: ipFromServer ? ipFromServer.credits : (newProductCredit ? Number(newProductCredit) : 0),
      //         product: createdProduct,
      //         isActive: ipFromServer ? ipFromServer.isActive : true
      //       }
      //     ];
      
      //     return updated;
      //   });
      // }
      setCurrentPlan(prev => {
        const cloned = prev ? deepClonePlan(prev) : deepClonePlan(emptyPlan());
      
        if (productType === "metered") {
          cloned.meteredProducts.push({
            id: mpFromServer?.id,
            productId: createdProduct.id,
            credits: mpFromServer ? mpFromServer.credits : Number(newProductCredit) || 0,
            product: createdProduct,
            isActive: mpFromServer?.isActive ?? true
          });
        }
      
        if (productType === "included") {
          cloned.includedProducts.push({
            id: ipFromServer?.id,
            productId: createdProduct.id,
            credits: ipFromServer ? ipFromServer.credits : Number(newProductCredit) || 0,
            product: createdProduct,
            isActive: ipFromServer?.isActive ?? true
          });
        }
      
        return cloned;
      });

      setCreateProductModal(false);
      setNewProductName("");
      setNewProductCredit("");
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
      meteredProducts: currentPlan.meteredProducts.map(mu => ({
        productId: mu.productId,
        name: mu.product?.name,
        credits: Number(mu.credits) || 0
      })),
      includedProducts: currentPlan.includedProducts.map(ip => ({
        productId: ip.productId,
        name: ip.product?.name,
        credits: Number(ip.credits) || 0
      })),
    };

    if (currentPlan.planType === "hybrid") {
      payload.fixedPrice = Number(currentPlan.fixedPrice) || 0;
    }

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
      setPlanEditingModal(false);
    } catch (err) {
      console.error("Failed to save plan", err);
      alert("Failed to save plan");
    }
  };

  // helper to update currentPlan fields
  const updateCurrent = (patch: Partial<PricingPlan>) => {
    setCurrentPlan(prev => prev ? ({ ...prev, ...patch }) : ({ ...emptyPlan(), ...patch }));
  };

  const availableMeteredProducts = allProducts.filter(
    p => !currentPlan?.meteredProducts.some(mp => mp.productId === p.id)
  );
  const availableIncludedProducts = allProducts.filter(
    p => !currentPlan?.includedProducts.some(ip => ip.productId === p.id)
  );

  const attachProductToPlan = (product: Product, productType: "metered" | "included") => {
    if (productType === "metered") {
      setCurrentPlan(prev => ({
        ...prev!,
        meteredProducts: [
          ...prev!.meteredProducts,
          {
            productId: product.id,
            credits: 0,
            product,
            isActive: true
          }
        ]
      }));
    }
    if (productType === "included") {
      setCurrentPlan(prev => ({
        ...prev!,
        includedProducts: [
          ...prev!.includedProducts,
          {
            productId: product.id,
            credits: 0,
            product,
            isActive: true
          }
        ]
      }));
    }
  };

  const updateMeteredCredit = (idx: number, value: string) => {
    setCurrentPlan(prev => {
      if (!prev) return prev;
      const next = {
        ...prev,
        meteredProducts: prev.meteredProducts.map((item, i) =>
          i === idx ? { ...item, credits: value } : item
        ),
      };
      return next;
    });
  };

  const updateIncludedCredit = (idx: number, value: string) => {
    setCurrentPlan(prev => {
      if (!prev) return prev;
      const next = {
        ...prev,
        includedProducts: prev.includedProducts.map((item, i) =>
          i === idx ? { ...item, credits: value } : item
        ),
      };
      return next;
    });
  };

  const deepClonePlan = (p: PricingPlan): PricingPlan => ({
    ...p,
    meteredProducts: p.meteredProducts.map(mp => ({ ...mp })),
    includedProducts: p.includedProducts.map(ip => ({ ...ip })),
  });

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
      <div className="flex items-end justify-end gap-3 mb-6">
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
          {allPlans.length > 0 ? (
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
                          onClick={() => {
                            setPlanEditingModal(true);
                            onSelectPlan(plan.id);
                          }}
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
          ) : (
            <p>No plans created.</p>
          )}
        </div>

      </div>

      {planEditingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">

            {/* HEADER */}
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">Edit Pricing Plan</h2>
              <button
                onClick={() => setPlanEditingModal(false)}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {/* MAIN FORM */}
            {currentPlan ? (
              <>
                {/* --- BASIC INFO SECTION --- */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold">Plan Type</label>
                    <div className="flex gap-4 mt-2">
                      {["fixed", "metered", "hybrid"].map(type => (
                        <label key={type} className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={currentPlan.planType === type}
                            onChange={() => updateCurrent({ planType: type as any })}
                          />
                          <span className="capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold">Plan Name</label>
                    <input
                      className="w-full border px-3 py-2 rounded mt-1"
                      value={currentPlan.planName}
                      onChange={(e) => updateCurrent({ planName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold">Description</label>
                    <textarea
                      className="w-full border px-3 py-2 rounded mt-1"
                      rows={3}
                      value={currentPlan.description ?? ""}
                      onChange={(e) => updateCurrent({ description: e.target.value })}
                    />
                  </div>

                  {currentPlan.planType === "hybrid" && (
                    <div>
                      <label className="block text-sm font-semibold">Price (Fixed)</label>
                      <input
                        className="w-full border px-3 py-2 rounded mt-1"
                        value={String(currentPlan.fixedPrice ?? "")}
                        onChange={(e) => updateCurrent({ fixedPrice: e.target.value })}
                        inputMode="numeric"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold">
                        {currentPlan.planType === "hybrid"
                          ? "Top-up Price (Metered)"
                          : "Base Price"}
                      </label>
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

                  <div>
                    <label className="block text-sm font-semibold">Validity (in months)</label>
                    <input
                      type="number"
                      className="w-full border px-3 py-2 rounded mt-1"
                      value={currentPlan.validity}
                      onChange={(e) =>
                        updateCurrent({ validity: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                {/* --- INCLUDED PRODUCTS (HYBRID ONLY) --- */}
                {currentPlan.planType === "hybrid" && (
                  <div className="bg-white p-6 rounded shadow mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Included Products</h3>
                      <button
                        onClick={() => {
                          setProductType("included");
                          setCreateProductModal(true);
                        }}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
                      >
                        + Add Product
                      </button>
                    </div>

                    <div className="space-y-3 mb-4">
                      {availableIncludedProducts.map(prod => (
                        <div
                          key={prod.id}
                          className="flex justify-between p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                          onClick={() => {
                            attachProductToPlan(prod, "included");
                          }}
                        >
                          <span className="font-medium">{prod.name}</span>
                          <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
                            Add
                          </button>
                        </div>
                      ))}
                    </div>

                    {currentPlan.includedProducts?.length === 0 && (
                      <p className="text-sm text-gray-500">No  included products yet.</p>
                    )}

                    <div className="space-y-3">
                      {currentPlan?.includedProducts?.map((mu, idx) => (
                        <div key={mu.productId + "-" + idx} className="flex items-center gap-4">
                          <div className="w-1/3">
                            <div className="text-sm font-medium">{mu.product?.name}</div>
                          </div>
                          <div className="flex-1">
                            <input
                              className="w-full border px-3 py-2 rounded"
                              value={String(mu.credits)}
                              onChange={(e) => updateIncludedCredit(idx, e.target.value)}
                              inputMode="numeric"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-white p-6 rounded shadow mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Metered Products</h3>
                    <button
                      onClick={() => {
                        setProductType("metered");
                        setCreateProductModal(true);
                      }}
                      className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      + Add Product
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    {availableMeteredProducts.map(prod => (
                      <div
                        key={prod.id}
                        className="flex justify-between p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          attachProductToPlan(prod, "metered");
                        }}
                      >
                        <span className="font-medium">{prod.name}</span>
                        <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
                          Add
                        </button>
                      </div>
                    ))}
                  </div>

                  {currentPlan.meteredProducts.length === 0 && (
                    <p className="text-sm text-gray-500">No metered products yet.</p>
                  )}

                  <div className="space-y-3">
                    {currentPlan?.meteredProducts?.map((mu, idx) => (
                      <div key={mu.productId + "-" + idx} className="flex items-center gap-4">
                        <div className="w-1/3">
                          <div className="text-sm font-medium">{mu.product?.name}</div>
                        </div>
                        <div className="flex-1">
                          <input
                            className="w-full border px-3 py-2 rounded"
                            value={String(mu.credits)}
                            onChange={(e) => updateMeteredCredit(idx, e.target.value)}
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setPlanEditingModal(false)}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePlan}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Plan
                  </button>
                </div>
              </>
            ) : (
              <p>No plan selected</p>
            )}
          </div>
        </div>
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
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => {
                  setCreateProductModal(false);
                  setNewProductName("");
                  setNewProductCredit("");
                }}
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleCreateProduct}>Create</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}