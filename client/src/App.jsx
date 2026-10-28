import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PassAndCheckInPage from './pages/PassAndCheckInPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dedicated Route for Digital Pass & QR Check-in */}
        <Route path="/pass-checkin" element={<PassAndCheckInPage />} />

        {/* Other groups will register their routes here:
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/bookings" element={<BookingPage />} />
        */}
      </Routes>
    </BrowserRouter>
  );
}
