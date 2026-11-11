import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Sparkles,
  Sun,
  Moon,
  Edit3,
  Clock,
  Share2,
} from 'lucide-react';
import { ReceiptRecord, UserProfile } from '../../types';
import {
  getReceiptExpirationInfo,
  isRootOwner,
  isAnyOwner,
  formatRoleLabel,
} from '../../lib/dataService';

interface ReceiptDocumentModalProps {
  receipt: ReceiptRecord | null;
  currentUser: UserProfile;
  onClose: () => void;
  onCorrectReceiptMetadata?: (
    receipt: ReceiptRecord,
    updatedTitle: string,
    updatedDescription: string,
    updatedNotes: string,
    correctionReason: string
  ) => Promise<void>;
}

export const ReceiptDocumentModal: React.FC<ReceiptDocumentModalProps> = ({
  receipt,
  currentUser,
  onClose,
  onCorrectReceiptMetadata,
}) => {
  const [printWhiteMode, setPrintWhiteMode] = useState(false);
  const [isDuplicateWatermark, setIsDuplicateWatermark] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  const [editTitle, setEditTitle] = useState(receipt?.title || '');
  const [editDesc, setEditDesc] = useState(receipt?.description || '');
  const [editNotes, setEditNotes] = useState(receipt?.notes || '');
  const [correctionReason, setCorrectionReason] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);

  if (!receipt) return null;

  const canEditReceipt =
    isRootOwner(currentUser) ||
    (isAnyOwner(currentUser) &&
      (currentUser.secondaryOwnerPermissions?.canManageReceipts ?? true));

  const expInfo = getReceiptExpirationInfo(receipt.serviceExpiryDate);
  const canonicalReceiptUrl = `https://doomcord.com/receipt/${receipt.receiptNumber}?token=${receipt.accessToken}`;
  const liveAppReceiptUrl = `${window.location.origin}/?receipt=${encodeURIComponent(
    receipt.receiptNumber
  )}&token=${encodeURIComponent(receipt.accessToken)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveAppReceiptUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyDetails = () => {
    const summary = [
      `DOOMCORD OFFICIAL RECEIPT — ${receipt.receiptNumber}`,
      `Type: ${receipt.receiptType}`,
      `Customer: ${receipt.customerDisplayName} (@${receipt.customerUsername} / ${receipt.customerEmail})`,
      `Status: ${
        receipt.paymentStatus === 'Complimentary'
          ? 'COMPLIMENTARY — ₹0 PAID'
          : `${receipt.paymentStatus} (₹${receipt.totalAmountINR} INR)`
      }`,
      `Duration: ${
        receipt.serviceExpiryDate === null
          ? 'LIFETIME — NO EXPIRATION'
          : `${receipt.serviceDurationLabel} (Expires ${new Date(
              receipt.serviceExpiryDate
            ).toLocaleDateString()})`
      }`,
      `Transaction Ref: ${receipt.transactionId}`,
      `Canonical URL: ${canonicalReceiptUrl}`,
    ].join('\n');
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handlePrintOrPdf = () => {
    window.print();
  };

  const handleDownloadPrintableHtml = () => {
    const itemsRows = receipt.items
      .map(
        (item) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">
            <strong>${item.productName}</strong><br/>
            <span style="font-size:11px;color:#64748b;">${item.category}</span>
          </td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">
            ${
              item.serviceExpiryDate === null
                ? 'LIFETIME — NO EXPIRATION'
                : `${item.durationLabel}<br/><small>Exp: ${new Date(
                    item.serviceExpiryDate
                  ).toLocaleDateString()}</small>`
            }
          </td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${item.unitPriceINR}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${item.discountINR}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">₹${item.finalAmountINR}</td>
        </tr>`
      )
      .join('');

    const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Doomcord Receipt ${receipt.receiptNumber}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 40px; max-width: 820px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; background: #ecfdf5; color: #047857; border: 1px solid #10b981; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    th { text-align: left; padding: 10px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
    .totals { margin-left: auto; width: 280px; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .grand { border-top: 2px solid #0f172a; font-weight: 800; font-size: 16px; padding-top: 10px; }
  </style>
</head>
<body>
  ${
    isDuplicateWatermark
      ? '<div style="text-align:center;color:#dc2626;font-weight:900;letter-spacing:4px;border:2px dashed #dc2626;padding:6px;margin-bottom:16px;">DUPLICATE COPY</div>'
      : ''
  }
  <div class="header">
    <div>
      <h1 style="margin:0;color:#064e3b;letter-spacing:-0.5px;">DOOMCORD APEX</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#475569;">RISE ABOVE. STAND APART. · Official Finance Receipt</p>
    </div>
    <div style="text-align:right;">
      <div style="font-family:monospace;font-size:18px;font-weight:800;">${receipt.receiptNumber}</div>
      <div style="font-size:12px;color:#64748b;">Issued: ${new Date(receipt.issueDate).toLocaleString()}</div>
      <div style="margin-top:6px;"><span class="badge">${
        receipt.paymentStatus === 'Complimentary'
          ? 'COMPLIMENTARY — ₹0 PAID'
          : receipt.paymentStatus.toUpperCase()
      }</span></div>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:20px;">
    <div>
      <strong>Billed To Customer:</strong><br/>
      ${receipt.customerDisplayName} (@${receipt.customerUsername})<br/>
      Email: ${receipt.customerEmail}<br/>
      UUID: <span style="font-family:monospace;font-size:11px;">${receipt.customerUid}</span>
    </div>
    <div style="text-align:right;">
      <strong>Service & Entitlement Period:</strong><br/>
      Start: ${new Date(receipt.serviceStartDate).toLocaleDateString()}<br/>
      Expiry: <strong>${
        receipt.serviceExpiryDate === null
          ? 'LIFETIME — NO EXPIRATION'
          : new Date(receipt.serviceExpiryDate).toLocaleDateString()
      }</strong><br/>
      Status: ${expInfo.remainingLabel}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Product / Service</th>
        <th>Duration</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Discount</th>
        <th style="text-align:right;">Final (INR)</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal:</span><span>₹${receipt.subtotalINR} INR</span></div>
    <div><span>Discount:</span><span>-₹${receipt.discountTotalINR} INR</span></div>
    <div><span>Tax (Included):</span><span>₹${receipt.taxINR} INR</span></div>
    <div class="grand"><span>Total Paid:</span><span>${
      receipt.paymentStatus === 'Complimentary'
        ? 'COMPLIMENTARY — ₹0 PAID'
        : `₹${receipt.totalAmountINR} INR`
    }</span></div>
  </div>
  <div style="margin-top:30px;padding-top:16px;border-top:1px solid #cbd5e1;font-size:12px;color:#475569;">
    <p><strong>Payment Method:</strong> ${receipt.paymentMethod} · <strong>Transaction Ref:</strong> ${receipt.transactionId}</p>
    <p><strong>Notes:</strong> ${receipt.notes || 'Official Doomcord APEX record.'}</p>
    <p><strong>Authorized Issuer:</strong> ${receipt.issuerName} (${receipt.issuerEmail})</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receipt.receiptNumber}${isDuplicateWatermark ? '_DUPLICATE' : ''}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCorrectReceiptMetadata || !correctionReason.trim()) return;
    setSavingCorrection(true);
    try {
      await onCorrectReceiptMetadata(
        receipt,
        editTitle.trim() || receipt.title,
        editDesc.trim() || receipt.description,
        editNotes.trim(),
        correctionReason.trim()
      );
      setIsEditingMetadata(false);
      setCorrectionReason('');
    } finally {
      setSavingCorrection(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl my-8 rounded-3xl bg-[oklch(0.14_0.025_162)] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Action Toolbar (Hidden when printing) */}
        <div className="px-6 py-3.5 bg-[oklch(0.17_0.028_161)] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
            <span className="text-xs font-bold text-white font-mono">
              Receipt {receipt.receiptNumber}
            </span>
            <span className="text-[11px] font-mono text-[oklch(0.7_0.03_155)]">
              · {receipt.receiptType}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Theme Switcher: Dark Forest vs Print White */}
            <button
              onClick={() => setPrintWhiteMode(!printWhiteMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[oklch(0.235_0.032_158)] hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors"
            >
              {printWhiteMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
                  <span>Dark Forest View</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[oklch(0.84_0.14_85)]" />
                  <span>Print-Friendly White</span>
                </>
              )}
            </button>

            {/* Toggle Duplicate Copy Watermark */}
            <button
              onClick={() => setIsDuplicateWatermark(!isDuplicateWatermark)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                isDuplicateWatermark
                  ? 'bg-[oklch(0.84_0.14_85)]/20 border-[oklch(0.84_0.14_85)]/40 text-[oklch(0.84_0.14_85)]'
                  : 'bg-[oklch(0.235_0.032_158)] border-white/10 text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              {isDuplicateWatermark ? '✓ Marked DUPLICATE' : 'Mark Duplicate'}
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[oklch(0.235_0.032_158)] hover:bg-white/10 text-xs font-semibold text-white border border-white/10"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
                  <span>Copied URL</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Link</span>
                </>
              )}
            </button>

            {/* Copy Details */}
            <button
              onClick={handleCopyDetails}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[oklch(0.235_0.032_158)] hover:bg-white/10 text-xs font-semibold text-white border border-white/10"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Details</span>
                </>
              )}
            </button>

            {/* Print / Save as PDF */}
            <button
              onClick={handlePrintOrPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[oklch(0.235_0.032_158)] hover:bg-white/10 text-xs font-semibold text-white border border-white/10"
            >
              <Printer className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
              <span>Print / PDF</span>
            </button>

            {/* Download Printable Invoice */}
            <button
              onClick={handleDownloadPrintableHtml}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-xs font-semibold text-white shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {canEditReceipt && onCorrectReceiptMetadata && (
              <button
                onClick={() => {
                  setEditTitle(receipt.title);
                  setEditDesc(receipt.description);
                  setEditNotes(receipt.notes);
                  setIsEditingMetadata(!isEditingMetadata);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[oklch(0.235_0.032_158)] hover:bg-white/10 text-xs font-semibold text-[oklch(0.85_0.12_165)] border border-[oklch(0.85_0.12_165)]/30"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Correct Metadata</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-[oklch(0.7_0.03_155)] hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata Correction Drawer (Financial amounts strictly locked) */}
        {isEditingMetadata && canEditReceipt && (
          <form
            onSubmit={handleSaveCorrection}
            className="p-5 bg-[oklch(0.17_0.028_161)] border-b border-white/10 space-y-3 print:hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[oklch(0.85_0.12_165)] uppercase tracking-wider">
                Correct Non-Financial Receipt Metadata (Recorded in Immutable Audit History)
              </span>
              <span className="text-[11px] font-mono text-[oklch(0.7_0.03_155)]">
                Financial amounts (₹{receipt.totalAmountINR} INR) are permanently locked
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase block mb-1">
                  Receipt Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[oklch(0.235_0.032_158)] text-xs text-white px-3 py-2 rounded-xl border border-white/10 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-[oklch(0.235_0.032_158)] text-xs text-white px-3 py-2 rounded-xl border border-white/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase block mb-1">
                  Additional Notes
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[oklch(0.235_0.032_158)] text-xs text-white px-3 py-2 rounded-xl border border-white/10 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[oklch(0.84_0.14_85)] uppercase block mb-1">
                  Mandatory Reason for Correction (Audit Log)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Updated customer billing note"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-[oklch(0.235_0.032_158)] text-xs text-white px-3 py-2 rounded-xl border border-[oklch(0.84_0.14_85)]/40 outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingMetadata(false)}
                className="px-3 py-1.5 rounded-xl bg-white/5 text-xs text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCorrection}
                className="px-4 py-1.5 rounded-xl bg-[oklch(0.85_0.12_165)] text-black text-xs font-bold"
              >
                {savingCorrection ? 'Recording Correction...' : 'Save Correction & Append Audit Log'}
              </button>
            </div>
          </form>
        )}

        {/* Receipt Document Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div
            className={`rounded-3xl p-8 border transition-colors ${
              printWhiteMode
                ? 'bg-white text-slate-900 border-slate-200 shadow-xl'
                : 'bg-[oklch(0.17_0.028_161)] text-[oklch(0.95_0.015_150)] border-white/10 shadow-2xl'
            }`}
          >
            {/* Optional DUPLICATE Watermark Banner */}
            {isDuplicateWatermark && (
              <div className="mb-6 py-2 px-4 rounded-xl border-2 border-dashed border-[oklch(0.72_0.16_32)] text-center font-mono text-xs font-bold tracking-[0.25em] text-[oklch(0.72_0.16_32)] uppercase">
                DUPLICATE RECEIPT COPY — ORIGINAL ISSUED ON{' '}
                {new Date(receipt.issueDate).toLocaleDateString()}
              </div>
            )}

            {/* Header: Brand Logo + Receipt Number & Status */}
            <div
              className={`flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 mb-6 border-b ${
                printWhiteMode ? 'border-slate-200' : 'border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white font-black text-lg tracking-tighter shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>DOOMCORD APEX</span>
                  </div>
                  <span
                    className={`text-xs font-mono uppercase tracking-widest ${
                      printWhiteMode ? 'text-emerald-700 font-bold' : 'text-[oklch(0.85_0.12_165)]'
                    }`}
                  >
                    RISE ABOVE. STAND APART.
                  </span>
                </div>
                <h2
                  className={`text-lg font-bold ${
                    printWhiteMode ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {receipt.title}
                </h2>
                <p
                  className={`text-xs ${
                    printWhiteMode ? 'text-slate-600' : 'text-[oklch(0.7_0.03_155)]'
                  }`}
                >
                  {receipt.description}
                </p>
              </div>

              <div className="md:text-right">
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                  Official Receipt Number
                </div>
                <div
                  className={`text-xl font-black font-mono tabular-nums ${
                    printWhiteMode ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {receipt.receiptNumber}
                </div>
                <div
                  className={`text-xs font-mono mt-0.5 ${
                    printWhiteMode ? 'text-slate-600' : 'text-[oklch(0.7_0.03_155)]'
                  }`}
                >
                  Issued: {new Date(receipt.issueDate).toLocaleString()}
                </div>

                {/* Payment Status Indicator */}
                <div className="mt-2 inline-block">
                  {receipt.paymentStatus === 'Complimentary' ? (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold">
                      COMPLIMENTARY — ₹0 PAID
                    </span>
                  ) : receipt.paymentStatus === 'Paid' ? (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold">
                      VERIFIED PAID · ₹{receipt.totalAmountINR} INR
                    </span>
                  ) : receipt.paymentStatus === 'Refunded' ? (
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold">
                      REFUNDED · ₹{receipt.totalAmountINR} INR
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-xs font-bold">
                      {receipt.paymentStatus.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Details & Service Duration Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div
                className={`p-4 rounded-2xl border ${
                  printWhiteMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[oklch(0.235_0.032_158)]/60 border-white/5'
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-70 block mb-1.5">
                  Customer Account Details
                </span>
                <div
                  className={`text-sm font-bold ${
                    printWhiteMode ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {receipt.customerDisplayName}{' '}
                  <span className="font-mono text-xs opacity-75">
                    (@{receipt.customerUsername})
                  </span>
                </div>
                <div className="text-xs font-mono opacity-80 mt-0.5">
                  Email: {receipt.customerEmail}
                </div>
                <div className="text-[11px] font-mono opacity-70 mt-0.5 break-all">
                  UUID: {receipt.customerUid}
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  printWhiteMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[oklch(0.235_0.032_158)]/60 border-white/5'
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-70 block mb-1.5">
                  Service Duration & Expiration Status
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
                  <span
                    className={`text-sm font-bold font-mono ${
                      receipt.serviceExpiryDate === null
                        ? 'text-emerald-500'
                        : printWhiteMode
                        ? 'text-slate-900'
                        : 'text-white'
                    }`}
                  >
                    {receipt.serviceExpiryDate === null
                      ? 'LIFETIME — NO EXPIRATION'
                      : receipt.serviceDurationLabel}
                  </span>
                </div>
                <div className="text-xs font-mono opacity-80 mt-1">
                  Start Date: {new Date(receipt.serviceStartDate).toLocaleString()}
                </div>
                <div className="text-xs font-mono opacity-80 mt-0.5">
                  Expiry Date:{' '}
                  <strong>
                    {receipt.serviceExpiryDate === null
                      ? 'LIFETIME — NO EXPIRATION'
                      : new Date(receipt.serviceExpiryDate).toLocaleString()}
                  </strong>{' '}
                  ({expInfo.remainingLabel})
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div
              className={`rounded-2xl border overflow-hidden mb-6 ${
                printWhiteMode ? 'border-slate-200' : 'border-white/10'
              }`}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className={`text-[10px] font-mono uppercase tracking-wider border-b ${
                      printWhiteMode
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-[oklch(0.14_0.025_162)] text-[oklch(0.7_0.03_155)] border-white/10'
                    }`}
                  >
                    <th className="py-3 px-4">Product / Service</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit (INR)</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">Final (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {receipt.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3.5 px-4 font-bold">{item.productName}</td>
                      <td className="py-3.5 px-4 opacity-80">{item.category}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {item.serviceExpiryDate === null
                          ? 'LIFETIME — NO EXPIRATION'
                          : item.durationLabel}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        ₹{item.unitPriceINR}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        -₹{item.discountINR}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                        ₹{item.finalAmountINR}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Payment Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="opacity-70">Receipt Type: </span>
                  <strong className="font-mono">{receipt.receiptType}</strong>
                </div>
                {receipt.purchaseNature && (
                  <div>
                    <span className="opacity-70">Purchase Classification: </span>
                    <strong className="font-mono text-[oklch(0.85_0.12_165)]">
                      {receipt.purchaseNature === 'self_purchase'
                        ? 'PURCHASED FOR SELF'
                        : receipt.purchaseNature === 'gift_purchase'
                        ? 'PURCHASED AS A GIFT'
                        : receipt.purchaseNature === 'complimentary_owner_gift'
                        ? 'COMPLIMENTARY OWNER-ISSUED GIFT'
                        : 'REDEEMED GIFT'}
                    </strong>
                  </div>
                )}
                {receipt.giftRecipientInfo && (
                  <div>
                    <span className="opacity-70">Intended Gift Recipient: </span>
                    <strong className="font-mono">{receipt.giftRecipientInfo}</strong>
                  </div>
                )}
                {receipt.linkedGiftId && (
                  <div>
                    <span className="opacity-70">Linked Gift ID: </span>
                    <strong className="font-mono">{receipt.linkedGiftId}</strong>
                    {receipt.giftRedemptionStatus && (
                      <span className="ml-2 font-mono uppercase text-[11px] text-[oklch(0.84_0.14_85)]">
                        [{receipt.giftRedemptionStatus}]
                      </span>
                    )}
                  </div>
                )}
                <div>
                  <span className="opacity-70">Payment Method: </span>
                  <strong className="font-mono">{receipt.paymentMethod}</strong>
                </div>
                <div>
                  <span className="opacity-70">Verified Transaction Reference: </span>
                  <strong className="font-mono">{receipt.transactionId}</strong>
                </div>
                <div>
                  <span className="opacity-70">Authorized Issuer: </span>
                  <strong>
                    {receipt.issuerName} ({formatRoleLabel(receipt.issuerRole, receipt.issuerUid)})
                  </strong>
                </div>
                <div>
                  <span className="opacity-70">Secure Receipt URL: </span>
                  <span className="font-mono text-[11px] break-all opacity-80">
                    {canonicalReceiptUrl}
                  </span>
                </div>
                {receipt.notes && (
                  <div className="pt-2">
                    <span className="opacity-70 block mb-0.5">Additional Notes:</span>
                    <p className="italic opacity-90">{receipt.notes}</p>
                  </div>
                )}
              </div>

              <div
                className={`p-5 rounded-2xl border space-y-2 text-xs ${
                  printWhiteMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[oklch(0.14_0.025_162)] border-white/10'
                }`}
              >
                <div className="flex justify-between">
                  <span className="opacity-75">Subtotal</span>
                  <span className="font-mono tabular-nums">₹{receipt.subtotalINR} INR</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Discount</span>
                  <span className="font-mono tabular-nums text-emerald-400">
                    -₹{receipt.discountTotalINR} INR
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Taxes (Included)</span>
                  <span className="font-mono tabular-nums">₹{receipt.taxINR} INR</span>
                </div>
                <div className="h-[1px] bg-white/10 my-2" />
                <div className="flex justify-between items-center text-sm font-black">
                  <span>Final Total</span>
                  <span className="font-mono tabular-nums text-[oklch(0.85_0.12_165)]">
                    {receipt.paymentStatus === 'Complimentary'
                      ? 'COMPLIMENTARY — ₹0 PAID'
                      : `₹${receipt.totalAmountINR} INR`}
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt Audit History Trail */}
            {receipt.auditHistory && receipt.auditHistory.length > 0 && (
              <div
                className={`mt-6 pt-4 border-t text-[11px] ${
                  printWhiteMode ? 'border-slate-200' : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 font-mono uppercase tracking-wider opacity-70 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Immutable Receipt Audit Trail ({receipt.auditHistory.length})</span>
                </div>
                <div className="space-y-1 font-mono">
                  {receipt.auditHistory.map((ev) => (
                    <div key={ev.id} className="opacity-80">
                      [{new Date(ev.timestamp).toLocaleString()}] {ev.action} by {ev.actorEmail} —{' '}
                      {ev.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
