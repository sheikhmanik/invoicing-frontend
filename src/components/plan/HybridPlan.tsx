export default function HybridPlanPage({ hybrid }: { hybrid: any[] }) {
  
  if (!hybrid || hybrid.length === 0) {
    return (
      <p className="text-gray-500 text-center">No metered plans found.</p>
    );
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

          {/* BASIC DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div>
              <p className="font-semibold">Plan Name</p>
              <p>{plan.planName}</p>
            </div>

            <div>
              <p className="font-semibold">
                Price <span className="text-sm font-light">(Fixed)</span>
              </p>
              <p>₹ {plan.basePrice}</p>
            </div>
            
            <div>
              <p className="font-semibold">Price</p>
              <p>₹ {plan.basePrice}</p>
            </div>

            <div>
              <p className="font-semibold">Credits Included</p>
              <p>{plan.creditsIncluded}</p>
            </div>

            <div>
              <p className="font-semibold">Validity</p>
              <p>{plan.validity} months</p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <p className="font-semibold">Description</p>
            <p className="text-gray-600">
              {plan.description || "No description"}
            </p>
          </div>

          {/* METERED USAGE LIST */}
          <div>
            <p className="text-lg font-semibold mb-2">Metered Usage</p>

            <div className="space-y-3">
              {plan.meteredUsages?.map((mu: any) => (
                <div
                  key={mu.id}
                  className="flex items-center justify-between bg-gray-100 border rounded p-3"
                >
                  <p className="font-semibold">{mu.product.name}</p>

                  <p className="text-gray-800">Credits: {mu.credits}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}