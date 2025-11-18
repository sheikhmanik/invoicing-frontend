import axios from "axios";
import { useEffect, useState } from "react";
import FixedPlanPage from "./plan/FixedPlan";
import MeteredPlanPage from "./plan/MeteredPlan";

export default function PlanListing() {

  const [FixedPlan, setFixedPlan] = useState([]);
  const [MeteredPlan, setMeteredPlan] = useState([]);
  const [onDisplay, setOnDisplay] = useState("fixed");

  useEffect(() => {
    (async () => {
      const URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${URL}/pricing-plan`);
      const DATA = res.data;
      const fixedPlan = DATA?.filter((plan: any) => plan.planType === "fixed");
      const meteredPlan = DATA?.filter((plan: any) => plan.planType === "metered");
      setFixedPlan(fixedPlan);
      setMeteredPlan(meteredPlan);
      console.log(fixedPlan, meteredPlan);
    })();
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-center">
        <button
          className={`flex-1 flex items-center justify-center py-2 ${onDisplay === "fixed" ? "bg-blue-700 text-white font-semibold" : "bg-gray-200 text-black"} `}
          onClick={() => setOnDisplay("fixed")}
        >Fixed Plan</button>
        <button
          className={`flex-1 flex items-center justify-center py-2 ${onDisplay === "metered" ? "bg-blue-700 text-white font-semibold" : "bg-gray-200 text-black"} `}
          onClick={() => setOnDisplay("metered")}
        >Metered Plan</button>
      </div>
      
      {/* CONTENT */}
      {onDisplay === "fixed" && <FixedPlanPage fixed={FixedPlan} />}
      {onDisplay === "metered" && <MeteredPlanPage metered={MeteredPlan} />}
    </div>
  )
}