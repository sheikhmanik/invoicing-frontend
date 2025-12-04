export default function HybridPlanPage({ hybrid }: { hybrid: any[] }) {

  if (!hybrid || hybrid.length === 0) {
    return <p className="text-gray-500 text-center">No hybrid plans found.</p>;
  }

  return (
    <div className="space-y-8">
      {hybrid.map((plan) => (
        <div
          key={plan.id}
          className="bg-white border shadow-md rounded-lg p-6 space-y-6"
        >
          <h2 className="text-xl font-bold text-gray-800">
            Hybrid Plan – {plan.planName}
          </h2>

          {/* BASIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div>
              <p className="font-semibold">Fixed Price</p>
              <p>₹ {plan.fixedPrice}</p>
            </div>

            <div>
              <p className="font-semibold">Base Price</p>
              <p>₹ {plan.basePrice}</p>
            </div>

            <div>
              <p className="font-semibold">Credits Included</p>
              <p>{plan.creditsIncluded}</p>
            </div>

            <div>
              <p className="font-semibold">Validity</p>
              <p>{plan.validity ? `${plan.validity} months` : "-"}</p>
            </div>
          </div>

          {/* INCLUDED */}
          <div>
            <p className="text-lg font-semibold mb-2">Included Products</p>

            {plan.includedProducts?.length ? (
              <div className="space-y-3">
                {plan.includedProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-100 border rounded p-3">
                    <p className="font-semibold">{p.product.name}</p>
                    {p.product.license && (
                      <p className="text-gray-800">License: {p.product.license}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No included products</p>
            )}
          </div>

          {/* METERED */}
          <div>
            <p className="text-lg font-semibold mb-2">Metered Products</p>

            {plan.meteredProducts?.length ? (
              <div className="space-y-3">
                {plan.meteredProducts.map((mp: any) => (
                  <div key={mp.id} className="flex items-center justify-between bg-gray-100 border rounded p-3">
                    <p className="font-semibold">{mp.product.name}</p>
                    <p className="text-gray-800">Credits: {mp.credits}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No metered products</p>
            )}
          </div>

        </div>
      ))}
    </div>
  );
}