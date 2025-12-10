"use client";

import Link from "next/link";

interface Restaurant {
  id: string;
  name: string;
  invoices: any[];
}

interface Invoice {
  id: string;
  createdAt: string;
  proformaNumber: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
  status: string;
  pricingPlan: {
    planName: string;
  };
  paidAmount: number;
  remainingAmount: number;
  restaurant: Restaurant;
}

export default function PaidInvoices({ allInvoices }: { allInvoices: any[] }) {

  function groupInvoicesByProforma(allInvoices: any[]) {
    const groups: Record<string, any[]> = {};
  
    for (const inv of allInvoices) {
      if (!inv.proformaNumber) continue;
      const key = inv.proformaNumber;
      if (!groups[key]) groups[key] = [];
      groups[key].push(inv);
    }
  
    return groups;
  }

  function getLatestPaidInvoices(groups: Record<string, any[]>) {
    return Object.values(groups)
      .map((list) =>
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      )
      .filter((inv) => inv.status === "paid" || inv.status === "partially paid");
  }

  const proformaGroups = groupInvoicesByProforma(allInvoices);
  const latestPaidInvoices = getLatestPaidInvoices(proformaGroups);
  console.log("Latest Paid Invoices:", latestPaidInvoices);

  const paymentHistoryMap = new Map(
    latestPaidInvoices.map((latestInv) => {
      const related = proformaGroups[latestInv.proformaNumber] || [];
  
      const paymentsOnly = related.filter(
        (inv) =>
          (inv.status === "paid" || inv.status === "partially paid") &&
          (
            inv.partialAmount > 0 ||
            inv.paidAmount > 0 ||
            inv.paymentDate ||
            inv.paymentFileUrl
          )
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // oldest to newest
  
      return [latestInv.id, paymentsOnly];
    })
  );

  return (
    <div className="overflow-x-auto bg-white shadow-xl rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-linear-to-r from-blue-50 to-blue-100 text-gray-700 border-b">
          <tr>
            <th className="p-4 border-r text-center font-semibold">Business</th>
            <th className="p-4 border-r text-center font-semibold">Store</th>
            <th className="p-4 border-r text-center font-semibold">Proforma Number</th>
            <th className="p-4 border-r text-center font-semibold">Invoice Number</th>
            <th className="p-4 border-r text-center font-semibold">Due Date</th>
            <th className="p-4 border-r text-center font-semibold">Total Amount</th>
            <th className="p-4 border-r text-center font-semibold">Payment Docs</th>
            <th className="p-4 border-r text-center font-semibold">Status</th>
          </tr>
        </thead>

        <tbody className="text-gray-800">
          {latestPaidInvoices?.length > 0 ? (
            latestPaidInvoices.map((invoice) => {
              const businessName =
                invoice?.restaurant?.brand?.business?.name ?? "N/A";
              const businessLocation =
                invoice?.restaurant?.brand?.business?.location ?? "N/A";
              const storeName = invoice?.restaurant?.name ?? "N/A";
              const storeAddress = invoice?.restaurant?.address ?? "N/A";
              const proformaNumber = invoice?.proformaNumber ?? "N/A";
              const invoiceNumber = invoice?.invoiceNumber ?? "N/A";
              const totalAmount =
                typeof invoice?.totalAmount === "number"
                  ? invoice.totalAmount.toLocaleString("en-IN")
                  : invoice?.totalAmount ?? "N/A";
              const dueDate = invoice?.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString("en-IN")
                : "N/A";
              const status = invoice?.status ?? "N/A";

              const statusColor =
                status === "paid"
                  ? "bg-green-100 text-green-700"
                  : status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-200 text-gray-700"
              ;

              const proformaInvoices = allInvoices.filter((inv) => inv.status === "pending");
              const proformaInvoice = proformaInvoices.find((inv) => 
                inv.proformaNumber === invoice.proformaNumber &&
                inv.totalAmount === invoice.totalAmount
              );

              const payments = paymentHistoryMap.get(invoice.id);
              console.log("Payments for invoice", invoice.id, payments);

              return (
                <tr
                  key={invoice.id}
                  className="border-b last:border-0 hover:bg-blue-50 transition-all"
                >
                  <td className="p-4 border-r text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-gray-900">{businessName}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {businessLocation}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 border-r text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-gray-900">{storeName}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {storeAddress}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 border-r text-center text-blue-700 font-semibold">
                    <div className="flex flex-col gap-1">
                      <p>{proformaNumber}</p>
                      <Link
                        href={`/invoice/${invoice.restaurant.id}/specific/${proformaInvoice.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex items-center justify-center gap-1 px-2 py-1 rounded
                          bg-blue-500 text-white text-[10px] font-medium
                          hover:bg-blue-600 shadow-sm hover:shadow transition-all
                        "
                      >
                        Proforma Invoice →
                      </Link>
                      <Link
                        href={`/invoice/${invoice.restaurant.id}/specific/${proformaInvoice.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex items-center justify-center gap-1 px-2 py-1 rounded
                          bg-blue-500 text-white text-[10px] font-medium
                          hover:bg-blue-600 shadow-sm hover:shadow transition-all
                        "
                      >
                        Download
                      </Link>
                    </div>
                  </td>
                  <td className="p-4 border-r text-center text-blue-700 font-semibold">
                    <div className="flex flex-col gap-1">
                      <p>{invoiceNumber}</p>
                      <Link
                        href={`/invoice/${invoice.restaurant.id}/specific/${invoice.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex items-center justify-center gap-1 px-2 py-1 rounded
                          bg-blue-500 text-white text-[10px] font-medium
                          hover:bg-blue-600 shadow-sm hover:shadow transition-all
                        "
                      >
                        Invoice →
                      </Link>
                      <Link
                        href={`/invoice/${invoice.restaurant.id}/specific/${invoice.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex items-center justify-center gap-1 px-2 py-1 rounded
                          bg-blue-500 text-white text-[10px] font-medium
                          hover:bg-blue-600 shadow-sm hover:shadow transition-all
                        "
                      >
                        Download Invoice
                      </Link>
                    </div>
                  </td>
                  <td className="p-4 border-r text-center text-sm">
                    {dueDate}
                  </td>
                  <td className="p-4 border-r text-center font-semibold text-gray-900">
                    {totalAmount}
                  </td>
                  <td className="p-4 border-r text-center flex flex-col gap-2">
                    {payments?.map((invoice) => {
                      const paymentDate = new Date(invoice?.paymentDate).toLocaleDateString("en-IN") || "—";
                      return (
                        <div key={invoice.id} className="bg-gray-50 border border-gray-300 rounded-lg p-2 text-left text-xs space-y-1 shadow-sm">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">
                              Paid: {invoice?.partialAmount ?? 0}/-
                            </span>
                            <span className="text-gray-500">
                              {paymentDate}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="font-medium text-red-700">
                              Due: {invoice?.remainingAmount ?? 0}/-
                            </span>
                          </div>
  
                          {/* Notes */}
                          {invoice?.paymentNotes && (
                            <div className="text-gray-600 italic">
                              {invoice?.paymentNotes}
                            </div>
                          )}
  
                          {/* Document */}
                          <div className="flex flex-col gap-1">
                            {invoice?.paymentFileUrl && (
                              <Link
                                href={invoice?.paymentFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800"
                              >
                                📄 View Receipt
                              </Link>
                            )}
                            <Link
                              href={`/invoice/${invoice?.restaurant?.id}/specific/${invoice?.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="
                                inline-flex items-center gap-1 px-2 py-1 rounded
                                bg-blue-500 text-white text-[10px] font-medium
                                hover:bg-blue-600 shadow-sm hover:shadow transition-all
                              "
                            >
                              Invoice →
                            </Link>
                          </div>
                        </div>
                      );                      
                    })}
                  </td>
                  <td className="p-4 border-r text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} className="p-6 text-center text-gray-500 italic">
                No paid invoices found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}