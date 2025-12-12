"use client";

import { useEffect, useState } from "react";
import AddBusiness from "./create-customer/manual/AddBusiness";
import AddBrand from "./create-customer/manual/AddBrand";
import AddRestaurant from "./create-customer/manual/AddRestaurant";
import Customers from "./Customers";
import Pricing from "./Pricing";
import AddProduct from "./AddProduct";
import axios from "axios";
import CustomerWizard from "./create-customer/wizard/CustomerWizard";
import PlanListing from "./PlanListing";
import InvoiceList from "./InvoiceList";
import CreateInvoice from "./CreateInvoice";

export default function Dashboard() {
  const [display, setDisplay] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardView");
      if (saved) {
        return saved;
      }
    }
    return "Dashboard";
  });
  const [stats, setStats] = useState<any>(null);
  const [hydrated, setHydrated] = useState(false);
  const [paidInvoices, setPaidInvoices] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const statsTop = [
    { title: "Total Businesses", value: stats?.totalBusinesses?.length ?? "—" },
    { title: "Total Outlets", value: stats?.totalRestaurants?.length ?? "—" },
    { title: "Pending Invoices", value: unpaidInvoices?.length ?? "—" },
    { title: "Paid Invoices", value: paidInvoices?.length ?? "—" },
  ];

  function groupInvoicesByProforma(allInvoices: any[]) {
    const groups: Record<string, any[]> = {};

    for (const invoice of allInvoices) {
      const key = invoice.proformaNumber as string;
      if (!groups[key]) groups[key] = [];
      groups[key].push(invoice);
    }
    return groups;
  };

  function paidInvs(groups: Record<string, any[]>) {
    return Object.values(groups)
      .map((invoice) =>
        invoice.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      )
      .filter((inv) => inv.status === "paid" || inv.status === "partially paid"
    );
  };

  function unpaidInvs(groups: Record<string, any[]>) {
    return Object.values(groups)
      .map((invoice) =>
        invoice.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      )
      .filter((inv) => inv.status === "pending" || inv.status === "partially paid");
  };

  function applyDateFilter() {
    if (!fromDate && !toDate) return;
  
    // Normalize bounds (start of fromDate, end of toDate) so "to" is inclusive
    const from = fromDate ? new Date(fromDate) : null;
    if (from) { from.setHours(0,0,0,0); }
    const to = toDate ? new Date(toDate) : null;
    if (to) { to.setHours(23,59,59,999); }

    const filteredInvoices = stats?.invoices?.filter((inv: any) => {
      const createdAt = new Date(inv.createdAt);
      if (from && to) {
        return createdAt >= from && createdAt <= to;
      } else if (from) {
        return createdAt >= from;
      } else if (to) {
        return createdAt <= to;
      }
      return true;
    }) ?? [];
    const groupedInvoices = groupInvoicesByProforma(filteredInvoices);
    const paid = paidInvs(groupedInvoices);
    const unpaid = unpaidInvs(groupedInvoices);
    if (paid) setPaidInvoices(paid);
    if (unpaid) setUnpaidInvoices(unpaid);

    // Let's do the same for businesses and restaurants
    const filteredBusinesses = stats?.totalBusinesses?.filter((biz: any) => {
      const createdAt = new Date(biz.createdAt);
      if (from && to) {
        return createdAt >= from && createdAt <= to;
      } else if (from) {
        return createdAt >= from;
      } else if (to) {
        return createdAt <= to;
      }
      return true;
    }) ?? [];
    const filteredRestaurants = stats?.totalRestaurants?.filter((rest: any) => {
      const createdAt = new Date(rest.createdAt);
      if (from && to) {
        return createdAt >= from && createdAt <= to;
      } else if (from) {
        return createdAt >= from;
      } else if (to) {
        return createdAt <= to;
      }
      return true;
    }) ?? [];
    setStats({
      ...stats,
      totalBusinesses: filteredBusinesses,
      totalRestaurants: filteredRestaurants,
    });
  };

  useEffect(() => {
    const URL = process.env.NEXT_PUBLIC_API_URL;
    axios.get(`${URL}/dashboard/stats`).then(res => {
      setStats(res.data);
      const groupedInvoices = groupInvoicesByProforma(res.data?.invoices ?? []);
      const paid = paidInvs(groupedInvoices);
      const unpaid = unpaidInvs(groupedInvoices);
      if (paid) setPaidInvoices(paid);
      if (unpaid) setUnpaidInvoices(unpaid);
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("dashboardView");
    if (saved) setDisplay(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardView", display);
    }
  }, [display]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <div className="flex">

        {/* SIDEBAR */}
        <aside className="w-28 sm:w-36 md:w-48 lg:w-56 bg-white border-r border-gray-200 py-6 sticky top-0 h-screen shadow-sm">
          <h2 className="text-lg font-semibold mb-6 px-6 text-gray-800">Invoice</h2>

          <nav className="space-y-1 text-sm">
            {[
              "Dashboard", "Customers", "Invoice List", "Create Customer", "Add Business", "Add Brand", "Add Restaurant", "Plan Listing", "Pricing plan setup", "Add Product", "Create Proforma", "Create Invoice", "Pending Invoices", "MRR / ARR", "Churn"].map((item) => (
              <a
                key={item}
                onClick={() => setDisplay(item)}
                className={`${display === item && "bg-gray-100"} block px-4 md:pl-6 lg:pl-10 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer`}
              >
                {item}
              </a>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 md:p-6">

          {display === "Dashboard" && (
            <div>
              {/* HEADER */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-white p-4 border rounded-lg shadow-sm">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard</h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                  <label className="text-sm font-medium text-gray-600">Select date:</label>

                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <input
                      type="date"
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-white text-sm flex-1 sm:flex-none w-full sm:w-auto focus:ring-2 focus:ring-sky-400 outline-none"
                    />
                    <span className="text-sm text-gray-400">to</span>
                    <input
                      type="date"
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setToDate(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-white text-sm flex-1 sm:flex-none w-full sm:w-auto focus:ring-2 focus:ring-sky-400 outline-none"
                    />
                  </div>

                  <button
                    onClick={applyDateFilter}
                    className="bg-sky-600 text-white px-4 py-2 text-sm rounded-md shadow hover:bg-sky-700 transition w-full sm:w-auto"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* TOP CARDS */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statsTop.map((s) => (
                  <div
                    key={s.title}
                    className="bg-white border rounded-lg p-5 shadow-md hover:shadow-lg transition flex flex-col justify-between"
                  >
                    <div className="text-sm font-medium text-gray-500">{s.title}</div>
                    <div className="mt-3 text-3xl font-bold text-gray-800">{s.value}</div>
                  </div>
                ))}
              </section>

              {/* THREE-COLUMN BLOCK */}
              <section className="grid grid-cols-1 gap-4">

                {/* <div className="bg-white border rounded-lg p-6 shadow-md hover:shadow-lg transition">
                  <div className="text-sm text-gray-500 font-medium">MRR</div>
                  <div className="mt-4 text-4xl font-bold text-gray-800">
                    {}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Monthly recurring revenue</div>
                </div>

                <div className="bg-white border rounded-lg p-6 shadow-md hover:shadow-lg transition">
                  <div className="text-sm text-gray-500 font-medium">ARR</div>
                  <div className="mt-4 text-4xl font-bold text-gray-800">
                    {}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Annual recurring revenue</div>
                </div> */}

                <div className="bg-white border rounded-lg p-6 shadow-md hover:shadow-lg transition">
                  <div className="text-sm text-gray-500 font-medium">Overview</div>

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex justify-between text-sm">
                      <span>Pending invoices</span>
                      <span className="font-semibold">
                        {unpaidInvoices?.length ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Paid invoices</span>
                      <span className="font-semibold">
                        {paidInvoices?.length ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Business</span>
                      <span className="font-semibold">
                        {stats?.totalBusinesses?.length ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Outlets</span>
                      <span className="font-semibold">
                        {stats?.totalRestaurants?.length ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>

              </section>
            </div>
          )}

          {display === "Customers" && (
            <Customers/>
          )}
          
          {display === "Invoice List" && (
            <InvoiceList/>
          )}

          {display === "Create Customer" && (
            <CustomerWizard onDone={() => setDisplay("Customers")} />
          )}

          {display === "Add Business" && (
            <AddBusiness onDone={() => setDisplay("Add Brand")}/>
          )}
          
          {display === "Add Brand" && (
            <AddBrand onDone={() => setDisplay("Add Restaurant")} />
          )}
          
          {display === "Add Restaurant" && (
            <AddRestaurant onDone={() => setDisplay("Customers")} />
          )}
          
          {display === "Plan Listing" && (
            <PlanListing/>
          )}

          {display === "Pricing plan setup" && (
            <Pricing/>
          )}

          {display === "Add Product" && (
            <AddProduct/>
          )}
          
          {display === "Create Invoice" && (
            <CreateInvoice/>
          )}

        </main>
      </div>
    </div>
  );
}