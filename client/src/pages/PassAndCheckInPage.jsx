import React, { useState, useEffect } from 'react';
import { QrCode, ScanLine, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import BoardingPassView from '../components/BoardingPassView';
import CheckInView from '../components/CheckInView';

export default function PassAndCheckInPage() {
  const [activeTab, setActiveTab] = useState('rider');
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const loadData = async () => {
    try {
      const [tripsRes, bookingsRes] = await Promise.all([
        fetch('/api/boarding-pass/trips').then((r) => r.json()),
        fetch('/api/boarding-pass/bookings').then((r) => r.json()),
      ]);

      if (tripsRes.success && tripsRes.trips.length > 0) {
        setTrips(tripsRes.trips);
        if (!selectedTripId) setSelectedTripId(tripsRes.trips[0].id);
      }

      if (bookingsRes.success && bookingsRes.bookings.length > 0) {
        setBookings(bookingsRes.bookings);
        if (!selectedBookingId) setSelectedBookingId(bookingsRes.bookings[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetData = async () => {
    if (!window.confirm('Reset all check-in mock statuses?')) return;
    setIsResetting(true);
    try {
      await fetch('/api/check-in/reset', { method: 'POST' });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background glow subtleties */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[10%] w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Top Control Bar */}
        <header className="no-print mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          {/* Identity */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 text-xs tracking-wider">
              CoU
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-tight text-white">Seat Allocation</span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Boarding & Verification Terminal</p>
            </div>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            <button
              onClick={() => setActiveTab('rider')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === 'rider'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Digital Pass</span>
            </button>
            <button
              onClick={() => setActiveTab('checker')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === 'checker'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Conductor Desk</span>
            </button>
          </div>

          {/* Offline / Reset Actions */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isOfflineMode
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white hover:border-white/20'
              }`}
            >
              {isOfflineMode ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isOfflineMode ? 'Offline Mode' : 'Online'}</span>
            </button>

            <button
              onClick={handleResetData}
              disabled={isResetting}
              title="Reset mock session state"
              className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content View */}
        <main>
          {activeTab === 'rider' ? (
            <BoardingPassView
              bookings={bookings}
              selectedBookingId={selectedBookingId}
              setSelectedBookingId={setSelectedBookingId}
              onRefresh={loadData}
            />
          ) : (
            <CheckInView
              trips={trips}
              selectedTripId={selectedTripId}
              setSelectedTripId={setSelectedTripId}
              isOfflineMode={isOfflineMode}
              onBookingUpdated={loadData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
