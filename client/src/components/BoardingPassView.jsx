import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Printer, ArrowRight, ShieldCheck } from 'lucide-react';

export default function BoardingPassView({ bookings, selectedBookingId, setSelectedBookingId, onRefresh }) {
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!selectedBookingId) return;

    setLoading(true);
    fetch(`/api/boarding-pass/${selectedBookingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPassData(data.pass);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedBookingId]);

  const handleCopyToken = () => {
    if (passData?.qrToken) {
      navigator.clipboard.writeText(passData.qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Selector Row */}
      <div className="no-print flex items-center justify-between gap-3 text-xs bg-white/[0.03] border border-white/[0.08] p-2.5 rounded-2xl">
        <div className="flex items-center space-x-2 w-full">
          <span className="text-slate-400 text-[11px] shrink-0 font-medium">Passenger:</span>
          <select
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            className="w-full bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                {b.studentName} — Seat {b.seatNumber} ({b.status})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => window.print()}
          className="shrink-0 p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition"
          title="Print Pass"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading || !passData ? (
        <div className="h-96 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* The Physical Ticket Card */
        <div className="relative rounded-[28px] bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.01] border border-white/[0.12] p-7 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Subtle noise / glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Ticket Header */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-5">
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-cyan-400 font-semibold">
                Boarding Authorization
              </span>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                Comilla University
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">{passData.trip?.busNumber || 'CoU Bus'}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Reference</span>
              <span className="text-xs font-mono font-bold text-slate-300">{passData.bookingRef}</span>
              <div className="mt-1.5">
                {passData.status === 'BOARDED' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    BOARDED
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    CONFIRMED
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Route & Seat Section */}
          <div className="py-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 font-medium">Route</span>
              <div className="text-lg font-bold text-white tracking-tight mt-0.5">
                {passData.trip?.route}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Departs at <span className="font-semibold text-white">{passData.trip?.departureTime}</span> • {passData.trip?.date}
              </p>
            </div>

            <div className="text-center pl-4 border-l border-white/[0.08]">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-medium block">Seat</span>
              <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
                {passData.seatNumber}
              </span>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative my-2 py-3 flex items-center">
            <div className="absolute -left-10 w-6 h-6 rounded-full bg-[#090b10] border border-white/[0.12]" />
            <div className="w-full border-t border-dashed border-white/[0.15]" />
            <div className="absolute -right-10 w-6 h-6 rounded-full bg-[#090b10] border border-white/[0.12]" />
          </div>

          {/* QR Code Presentation */}
          <div className="pt-4 flex flex-col items-center">
            <div className="p-4 rounded-2xl bg-white shadow-md border-4 border-white/20">
              <QRCodeSVG
                value={passData.qrToken}
                size={170}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Passenger Info & Verification status */}
            <div className="mt-5 text-center w-full">
              <div className="text-sm font-bold text-white">{passData.studentName}</div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                {passData.studentId} • {passData.department}
              </div>

              {passData.boardedAt ? (
                <div className="mt-3 text-[11px] font-mono text-emerald-400 flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified at {new Date(passData.boardedAt).toLocaleTimeString()}</span>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-slate-500 font-medium">
                  Scan at front door terminal to record boarding
                </p>
              )}
            </div>

            {/* Dev / Test helper */}
            <div className="no-print mt-5 pt-4 border-t border-white/[0.06] w-full text-center">
              <button
                onClick={handleCopyToken}
                className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 inline-flex items-center space-x-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied token payload' : 'Copy test token for scanner'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
