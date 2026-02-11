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
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6 print:bg-white">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-[#DAA520] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#8B5A3C] font-medium">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <p className="text-[#8B5A3C] mb-4">{error || "Receipt not found"}</p>
          <a
            href="/gifts/active"
            className="inline-flex items-center gap-2 text-[#DAA520] font-semibold hover:text-[#B8860B]"
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
        }
      `}} />
      <div className="min-h-screen bg-[#F5F1E8] py-12 px-4 print:bg-white print:py-0 print:px-0 receipt-print-area">
        <div className="relative max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-[#E8E0D5] print:shadow-none print:border print:border-gray-300">
          {/* Print/Download button - hidden when printing */}
          <div className="no-print p-4 flex justify-end border-b border-[#E8E0D5] bg-[#FDFBF7]">
            <button
              type="button"
              onClick={handlePrint}
              className="no-print inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#DAA520] text-[#3B2F0F] font-semibold hover:bg-[#C49420] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download/Print Receipt
            </button>
          </div>

          {/* Top: Wishbee Logo (Black/White) + Donation Receipt title */}
          <div className="flex justify-between items-center px-8 py-6 border-b-2 border-gray-200">
            <div className="flex items-center gap-2">
              <Image
                src="/images/LogoBee-V1.png"
                alt="Wishbee.ai"
                width={64}
                height={64}
                className="h-14 w-auto object-contain grayscale"
              />
              <span className="text-lg font-bold text-gray-900">Wishbee.ai</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Donation Receipt</h1>
          </div>

          {/* Middle: Two columns - Donor Details | Charity Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-8 py-6 border-b border-gray-200">
            <div>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Donor Details</h2>
              <p className="font-medium text-gray-900">{receipt.donorName}</p>
              <p className="text-sm text-gray-500 mt-1">Date: {dateStr}</p>
              <p className="text-sm text-gray-500 font-mono">{receipt.transactionId}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Charity Details</h2>
              <p className="font-medium text-gray-900">{receipt.charityName}</p>
              <p className="text-sm text-gray-500 mt-1">EIN: {receipt.ein ?? "N/A"}</p>
            </div>
          </div>

          {/* Center: Bold Total Amount box */}
          <div className="px-8 py-6 flex justify-center">
            <div className="rounded-lg border-2 border-gray-900 bg-gray-50 px-8 py-4 text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{formatMoney(receipt.totalCharged)}</p>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="px-8 py-6">
            <table className="w-full text-left border-collapse border border-gray-200">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 text-gray-600">Net Donation</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">{formatMoney(receipt.netAmount)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 text-gray-600">Processing Fee</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">{formatMoney(receipt.feeAmount)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-gray-900">Total Paid</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">{formatMoney(receipt.totalCharged)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Disclosure block */}
          <div className="px-8 py-6 border-t-2 border-gray-200 bg-gray-50">
            <p className="text-sm leading-relaxed text-gray-600" style={{ fontSize: "12px", lineHeight: 1.6 }}>
              {taxDisclosure}
            </p>
          </div>

          {/* Wishbee watermark/logo - corner branding */}
          <div className="absolute bottom-4 right-4 opacity-25" aria-hidden>
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
