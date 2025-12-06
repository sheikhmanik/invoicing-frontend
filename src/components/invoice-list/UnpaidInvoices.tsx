import Link from "next/link";

export default function UnpaidInvoices({ unpaidInvoices }: { unpaidInvoices: any[] }) {
  console.log("Paid Invoices Component:", unpaidInvoices);

  return (
    <div className="overflow-x-auto bg-white shadow-xl rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-linear-to-r from-blue-50 to-blue-100 text-gray-700 border-b">
          <tr>
            <th className="p-4 border-r text-center font-semibold">Business</th>
            <th className="p-4 border-r text-center font-semibold">Store</th>
            <th className="p-4 border-r text-center font-semibold">Proforma Number</th>
            <th className="p-4 border-r text-center font-semibold">Invoice Number</th>
            <th className="p-4 border-r text-center font-semibold">Total Amount</th>
            <th className="p-4 border-r text-center font-semibold">Due Date</th>
            <th className="p-4 border-r text-center font-semibold">Status</th>
            <th className="p-4 text-center font-semibold">Update Payment</th>
          </tr>
        </thead>

        <tbody className="text-gray-800">
          {unpaidInvoices?.length > 0 ? (
            unpaidInvoices.map((invoice) => {
              const businessName =
                invoice?.restaurant?.brand?.business?.name ?? "N/A";
              const storeName = invoice?.restaurant?.name ?? "N/A";
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
                  : "bg-gray-200 text-gray-700";

              return (
                <tr
                  key={invoice.id}
                  className="border-b last:border-0 hover:bg-blue-50 transition-all"
                >
                  <td className="p-4 border-r text-center font-medium">
                    {businessName}
                  </td>
                  <td className="p-4 border-r text-center">
                    {storeName}
                  </td>
                  <td className="p-4 border-r text-center ">
                    <span>{proformaNumber}</span>
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
                  <td className="p-4 border-r text-center font-semibold text-gray-900">
                    {totalAmount}
                  </td>
                  <td className="p-4 border-r text-center text-sm">
                    {dueDate}
                  </td>
                  <td className="p-4 border-r text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                      {status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      className="px-4 py-1.5 text-xs rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                    >
                      Update
                    </button>
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