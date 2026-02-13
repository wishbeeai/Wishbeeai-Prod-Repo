"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

type ReceiptData = {
  transactionId: string
  charityName: string
  ein: string | null
  netAmount: number
  feeAmount: number
  totalCharged: number
  date: string
  donorName: string
  disposition: "charity" | "tip" | "bonus"
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [id, setId] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    const fetchReceipt = async () => {
      try {
        const res = await fetch(`/api/receipt/${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Receipt not found")
        }
        const data = await res.json()
        setReceipt(data.receipt)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load receipt")
      } finally {
        setLoading(false)
      }
    }
    fetchReceipt()
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  if (loading || !id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F1E8] to-[#EDE6D9] flex items-center justify-center p-6 print:bg-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-2 border-[#DAA520]/30 border-t-[#8B5A3C] rounded-full mx-auto mb-5" />
          <p className="text-[#654321] font-semibold">Loading receipt...</p>
          <p className="text-sm text-[#8B5A3C]/80 mt-1">Just a moment</p>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F1E8] to-[#EDE6D9] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-[#E8E0D5] max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#DAA520]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#8B5A3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-[#654321] font-semibold mb-1">{error || "Receipt not found"}</p>
          <p className="text-sm text-[#8B5A3C]/80 mb-6">This link may have expired or the receipt is no longer available.</p>
          <a
            href="/gifts/active"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DAA520] text-[#3B2F0F] font-semibold hover:bg-[#C49420] transition-colors"
          >
            Back to Active Gifts
          </a>
        </div>
      </div>
    )
  }

  const dateStr = receipt.date
    ? new Date(receipt.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : ""

  const isTip = receipt.disposition === "tip"

  const taxDisclosure = isTip
    ? "Thank you for supporting Wishbee! Please note that tips to the platform are used to maintain our AI tools and services and are generally not considered tax-deductible charitable contributions."
    : receipt.ein
      ? `No goods or services were provided in exchange for this contribution. ${receipt.charityName} is a 501(c)(3) tax-exempt organization (EIN: ${receipt.ein}). Please retain this receipt for your tax records.`
      : "No goods or services were provided in exchange for this contribution. Please retain this receipt for your tax records."

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .receipt-print-area, .receipt-print-area * { visibility: visible; }
          .receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          /* Force background colors/gradients to print (header, total box, table rows) */
          .receipt-print-area,
          .receipt-print-header,
          .receipt-print-total-box,
          .receipt-print-table-header,
          .receipt-print-table-total {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .receipt-print-header {
            background: linear-gradient(to right, #6B4423, #8B5A3C, #6B4423) !important;
            color: #fff !important;
          }
          .receipt-print-header span,
          .receipt-print-header p { color: #F5DEB3 !important; }
          .receipt-print-header h1 { color: #fff !important; }
          .receipt-print-table-total { background: #FFFBEB !important; }
        }
      `}} />
      <div className="min-h-screen bg-gradient-to-b from-[#F5F1E8] to-[#EDE6D9] py-12 px-4 print:bg-white print:py-0 print:px-0 receipt-print-area">
        <div className="relative max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#E8E0D5] print:shadow-none print:rounded-lg print:border print:border-gray-300">
          {/* Print/Download button - hidden when printing */}
          <div className="no-print px-6 py-4 flex justify-end border-b border-[#E8E0D5] bg-gradient-to-r from-[#FFFBEB] to-[#FDFBF7]">
            <button
              type="button"
              onClick={handlePrint}
              className="no-print inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DAA520] text-[#3B2F0F] font-semibold hover:bg-[#C49420] transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download / Print
            </button>
          </div>

          {/* Header strip with brand + receipt type */}
          <div className="receipt-print-header bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-8 py-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/LogoBee-V1.png"
                  alt="Wishbee.ai"
                  width={64}
                  height={64}
                  className="h-12 w-auto object-contain drop-shadow-sm print:h-10"
                />
                <div>
                  <span className="text-lg font-bold text-[#F5DEB3]">Wishbee.ai</span>
                  <p className="text-xs text-[#F5DEB3]/80 mt-0.5">Gift Together. Give Better.</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium uppercase tracking-wider text-[#F5DEB3]/90">
                  {isTip ? "Tip" : "Donation"} Receipt
                </span>
                <h1 className="text-xl font-bold text-white mt-0.5">
                  {isTip ? "Tip Receipt" : "Donation Receipt"}
                </h1>
              </div>
            </div>
          </div>

          {/* Donor + Charity cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-8 py-6 border-b border-[#E8E0D5] bg-[#FAF8F5]">
            <div className="rounded-xl border border-[#E8E0D5] bg-white p-5 shadow-sm">
              <h2 className="text-xs font-semibold text-[#8B5A3C] uppercase tracking-wider mb-3">Donor</h2>
              <p className="font-semibold text-[#654321]">{receipt.donorName}</p>
              <p className="text-sm text-[#8B5A3C]/90 mt-1">Date: {dateStr}</p>
              <p className="text-xs text-[#8B5A3C]/70 font-mono mt-1 break-all">{receipt.transactionId}</p>
            </div>
            <div className="rounded-xl border border-[#E8E0D5] bg-white p-5 shadow-sm">
              <h2 className="text-xs font-semibold text-[#8B5A3C] uppercase tracking-wider mb-3">Charity</h2>
              <p className="font-semibold text-[#654321]">{receipt.charityName}</p>
              <p className="text-sm text-[#8B5A3C]/90 mt-1">EIN: {receipt.ein ?? "N/A"}</p>
            </div>
          </div>

          {/* Total amount - hero block */}
          <div className="px-8 py-8 flex justify-center bg-white">
            <div className="receipt-print-total-box rounded-2xl border-2 border-[#DAA520] bg-gradient-to-br from-[#FFFBEB] to-[#F5F1E8] px-10 py-6 text-center shadow-inner min-w-[200px]">
              <p className="text-xs font-semibold text-[#8B5A3C] uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-[#654321] tabular-nums">{formatMoney(receipt.totalCharged)}</p>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="px-8 py-6 bg-white">
            <table className="w-full text-left border-collapse rounded-xl overflow-hidden border border-[#E8E0D5]">
              <tbody>
                <tr className="receipt-print-table-header border-b border-[#E8E0D5] bg-[#FAF8F5]">
                  <td className="px-5 py-3.5 text-[#8B5A3C]">Net Donation</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-[#654321] tabular-nums">{formatMoney(receipt.netAmount)}</td>
                </tr>
                <tr className="border-b border-[#E8E0D5]">
                  <td className="px-5 py-3.5 text-[#8B5A3C]">Processing Fee</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-[#654321] tabular-nums">{formatMoney(receipt.feeAmount)}</td>
                </tr>
                <tr className="receipt-print-table-total bg-[#FFFBEB]/50">
                  <td className="px-5 py-3.5 font-bold text-[#654321]">Total Paid</td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#654321] tabular-nums">{formatMoney(receipt.totalCharged)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Disclosure */}
          <div className="px-8 py-6 border-t border-[#E8E0D5] bg-[#FAF8F5]">
            <p className="text-xs leading-relaxed text-[#8B5A3C]" style={{ lineHeight: 1.65 }}>
              {taxDisclosure}
            </p>
          </div>

          {/* Watermark */}
          <div className="absolute bottom-4 right-4 opacity-20 print:opacity-30" aria-hidden>
            <Image
              src="/images/LogoBee-V1.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-auto object-contain grayscale"
            />
          </div>
        </div>
      </div>
    </>
  )
}
