import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CheckCircle2,
  XCircle,
  Search,
  Users,
  ArrowRight,
  CloudUpload,
  AlertTriangle,
} from 'lucide-react';

export default function CheckInView({
  trips,
  selectedTripId,
  setSelectedTripId,
  isOfflineMode,
  onBookingUpdated,
}) {
  const [rosterData, setRosterData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const html5QrCodeRef = useRef(null);

  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('cou_offline_checkins');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const fetchRoster = () => {
    if (!selectedTripId) return;
    fetch(`/api/check-in/roster/${selectedTripId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRosterData(data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedTripId]);

  useEffect(() => {
    try {
      localStorage.setItem('cou_offline_checkins', JSON.stringify(offlineQueue));
    } catch (e) {}
  }, [offlineQueue]);

  const startScanner = async () => {
    setScanResult(null);
    setIsCameraActive(true);
    setTimeout(async () => {
      try {
        const qrCodeScanner = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = qrCodeScanner;
        await qrCodeScanner.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: { width: 220, height: 220 } },
          (decodedText) => handleVerification(decodedText),
          () => {}
        );
      } catch (err) {
        setIsCameraActive(false);
        setScanResult({ success: false, message: 'Camera permission denied or camera device not found.' });
      }
    }, 250);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleVerification = async (token) => {
    const trimmed = token.trim();
    if (!trimmed) return;

    if (isOfflineMode) {
      setOfflineQueue((prev) => [...prev, { qrToken: trimmed, tripId: selectedTripId }]);
      setScanResult({
        success: true,
        message: 'Pass cached in device storage. Will sync when back online.',
      });
      return;
    }

    try {
      const res = await fetch('/api/check-in/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: trimmed,
          tripId: selectedTripId,
          checkerName: 'Checker Staff',
        }),
      });
      const data = await res.json();
      setScanResult(data);
      if (data.success) {
        fetchRoster();
        onBookingUpdated();
      }
    } catch (err) {
      setScanResult({ success: false, message: 'Server unreachable.' });
    }
  };

  const syncOfflineQueue = async () => {
    if (!offlineQueue.length) return;
    try {
      const res = await fetch('/api/check-in/sync-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: offlineQueue, tripId: selectedTripId }),
      });
      const data = await res.json();
      if (data.success) {
        setOfflineQueue([]);
        fetchRoster();
        onBookingUpdated();
        setScanResult({ success: true, message: `Synced ${data.processed} offline records.` });
      }
    } catch (e) {
      alert('Sync failed.');
    }
  };

  const handleManualCheckIn = async (val) => {
    const q = (val || manualQuery).trim();
    if (!q) return;

    try {
      const res = await fetch('/api/check-in/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, tripId: selectedTripId }),
      });
      const data = await res.json();
      setScanResult(data);
      if (data.success) {
        setManualQuery('');
        fetchRoster();
        onBookingUpdated();
      }
    } catch (err) {
      setScanResult({ success: false, message: 'Connection error.' });
    }
  };

  const filteredRoster = (rosterData?.roster || []).filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.studentId.includes(q) ||
      r.seatNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Active Trip Header Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">Active Trip:</span>
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
          >
            {trips.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                {t.route} ({t.departureTime}) • {t.busNumber}
              </option>
            ))}
          </select>
        </div>

        {rosterData && (
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-slate-500">Boarded:</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              {rosterData.stats.boarded} / {rosterData.stats.total}
            </span>
          </div>
        )}
      </div>

      {/* Offline sync alert */}
      {offlineQueue.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <span>{offlineQueue.length} pass(es) awaiting offline sync</span>
          <button
            onClick={syncOfflineQueue}
            className="flex items-center space-x-1 px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      )}

      {/* Two Column Layout: Scanner / Verification & Manifest Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Verification Terminal (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Scanner Card */}
          <div className="rounded-[24px] bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Camera Scanner</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Point camera at student boarding pass</p>
              </div>

              {!isCameraActive ? (
                <button
                  onClick={startScanner}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan</span>
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold hover:bg-rose-500/20 transition"
                >
                  Stop
                </button>
              )}
            </div>

            {/* Camera viewport container */}
            {isCameraActive && (
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-square max-h-60 mx-auto">
                <div id="qr-reader" className="w-full h-full"></div>
              </div>
            )}

            {/* Verdict Display */}
            {scanResult && (
              <div
                className={`p-3.5 rounded-2xl text-xs border transition-all ${
                  scanResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  {scanResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{scanResult.message}</div>
                    {scanResult.booking && (
                      <div className="mt-1 text-[11px] opacity-80 font-mono">
                        Seat {scanResult.booking.seatNumber} • {scanResult.booking.studentName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Manual Token input simulation */}
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <span className="text-[11px] font-mono text-slate-500 block uppercase">Manual Token Input:</span>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  placeholder="Paste token string..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full text-xs font-mono bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => {
                    handleVerification(tokenInput);
                    setTokenInput('');
                  }}
                  className="px-3.5 py-2 bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold rounded-xl transition shrink-0"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Manual ID Check-in Fallback */}
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <span className="text-[11px] font-mono text-slate-500 block uppercase">Manual Roll Check-in:</span>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  placeholder="Student Roll (e.g. 12208019)"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleManualCheckIn()}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl transition shrink-0 flex items-center space-x-1"
                >
                  <span>Board</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Roster (7 cols) */}
        <div className="lg:col-span-7 rounded-[24px] bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Passenger Roster</h3>
            </div>
            <div className="relative w-40">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-black/40 border border-white/[0.08] rounded-lg pl-8 pr-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="divide-y divide-white/[0.06] max-h-[440px] overflow-y-auto pr-1">
            {filteredRoster.map((rider) => (
              <div key={rider.id} className="py-3 flex items-center justify-between text-xs group hover:bg-white/[0.02] px-2 rounded-xl transition">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {rider.seatNumber}
                  </span>
                  <div>
                    <div className="font-semibold text-white tracking-tight">{rider.studentName}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {rider.studentId} • {rider.department}
                    </div>
                  </div>
                </div>

                <div>
                  {rider.status === 'BOARDED' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      BOARDED
                    </span>
                  ) : (
                    <button
                      onClick={() => handleManualCheckIn(rider.studentId)}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/20 transition"
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
