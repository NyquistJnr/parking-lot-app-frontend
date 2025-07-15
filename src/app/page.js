"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  ParkingCircle,
  LogOut,
  Loader2,
  QrCode,
  ShieldCheck,
  X,
  Ticket,
  ShieldAlert,
  CalendarClock,
  Ban,
  CheckCircle,
  Info,
  History,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotToCancel, setSlotToCancel] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingHours, setBookingHours] = useState(1);

  const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}`;

  const fetchSlots = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/slots/status`);
      if (!response.ok) {
        throw new Error("Failed to fetch parking slot status.");
      }
      const data = await response.json();

      const sortedData = data.sort((a, b) => {
        const [aLetter, aNum] = a.slotNumber.match(/[A-Z]+|\d+/g) || ["", "0"];
        const [bLetter, bNum] = b.slotNumber.match(/[A-Z]+|\d+/g) || ["", "0"];
        if (aLetter < bLetter) return -1;
        if (aLetter > bLetter) return 1;
        return parseInt(aNum) - parseInt(bNum);
      });

      setSlots(sortedData);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userDataString = localStorage.getItem("user");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setCurrentUser(userData);
      setIsLoggedIn(true);
    }
    fetchSlots();
  }, []);

  const stats = useMemo(() => {
    const occupied = slots.filter((s) => s.isOccupied).length;
    const total = slots.length;
    const available = total - occupied;
    return { available, occupied, total };
  }, [slots]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    setIsLoggedIn(false);
    router.push("/auth");
  };

  const handleSlotClick = (slot) => {
    if (slot.isOccupied && slot.occupiedBy?._id === currentUser?._id) {
      setSlotToCancel(slot);
      setBookingError(null);
      setCancelModalOpen(true);
      return;
    }

    if (slot.isOccupied) {
      return;
    }

    if (!isLoggedIn) {
      setLoginModalOpen(true);
    } else {
      setSelectedSlot(slot);
      setBookingHours(1);
      setBookingError(null);
      setBookingModalOpen(true);
    }
  };

  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !currentUser?.token) return;

    setIsSubmitting(true);
    setBookingError(null);

    const startTime = new Date().toISOString();
    const endTime = new Date(
      Date.now() + bookingHours * 60 * 60 * 1000
    ).toISOString();

    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          parkingSlotId: selectedSlot._id,
          startTime,
          endTime,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create booking.");
      }

      setBookingDetails(data);
      setBookingModalOpen(false);
      setSuccessModalOpen(true);
      fetchSlots();
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBookingFromSlot = async () => {
    if (!slotToCancel || !currentUser?.token) return;

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      if (!response.ok) throw new Error("Could not retrieve your bookings.");

      const userBookings = await response.json();

      const activeBooking = userBookings.find(
        (b) => b.parkingSlot?._id === slotToCancel._id && b.status === "booked"
      );

      if (!activeBooking) {
        throw new Error("Could not find an active booking for this slot.");
      }

      const cancelResponse = await fetch(
        `${API_BASE_URL}/bookings/${activeBooking._id}/cancel`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${currentUser.token}` },
        }
      );

      if (!cancelResponse.ok) {
        const data = await cancelResponse.json();
        throw new Error(data.message || "Failed to cancel booking.");
      }

      setCancelModalOpen(false);
      setSlotToCancel(null);
      alert("Booking cancelled successfully!");
      fetchSlots();
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <header className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-lg shadow-sm sticky top-0 z-40">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <ParkingCircle className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold tracking-tight">Parking Status</h1>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser?.role === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
              >
                <ShieldCheck className="h-5 w-5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            <button
              onClick={() => router.push("/history")}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
            >
              <History className="h-5 w-5" />
              <span className="hidden sm:inline">History</span>
            </button>
            {isLoggedIn && currentUser ? (
              <>
                <span className="text-sm hidden sm:block">
                  Welcome,{" "}
                  <span className="font-semibold">{currentUser.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-500/10 border-l-4 border-green-500 rounded-r-lg p-4 flex items-center space-x-4">
            <div className="bg-green-500/20 p-3 rounded-full">
              <ParkingCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Available
              </h2>
              <p className="text-3xl font-bold">
                {loading ? "..." : stats.available}
              </p>
            </div>
          </div>
          <div className="bg-red-500/10 border-l-4 border-red-500 rounded-r-lg p-4 flex items-center space-x-4">
            <div className="bg-red-500/20 p-3 rounded-full">
              <Car className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Occupied
              </h2>
              <p className="text-3xl font-bold">
                {loading ? "..." : stats.occupied}
              </p>
            </div>
          </div>
          <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg p-4 flex items-center space-x-4">
            <div className="bg-blue-500/20 p-3 rounded-full">
              <Ticket className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total
              </h2>
              <p className="text-3xl font-bold">
                {loading ? "..." : stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          ) : apiError ? (
            <div className="text-center py-10 text-red-500">
              <ShieldAlert className="mx-auto h-12 w-12 mb-4" />
              <p className="font-semibold">Could not load parking data.</p>
              <p className="text-sm">{apiError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {slots.map((slot) => {
                const isMySlot =
                  slot.isOccupied && slot.occupiedBy?._id === currentUser?._id;

                return (
                  <button
                    key={slot._id}
                    onClick={() => handleSlotClick(slot)}
                    disabled={slot.isOccupied && !isMySlot}
                    className={`p-2 h-24 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 border-2
                      ${
                        isMySlot
                          ? "bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800/60 hover:shadow-lg hover:-translate-y-1"
                          : slot.isOccupied
                          ? "bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-800 cursor-not-allowed"
                          : "bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-800/60 hover:shadow-lg hover:-translate-y-1"
                      }`}
                  >
                    <span className="font-bold text-lg">{slot.slotNumber}</span>
                    {slot.isOccupied ? (
                      <>
                        <Car
                          className={`h-5 w-5 mt-1 ${
                            isMySlot
                              ? "text-purple-500 dark:text-purple-400"
                              : "text-red-500 dark:text-red-400"
                          }`}
                        />
                        {isMySlot && (
                          <span className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-semibold">
                            My Booking
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Available
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-bold">Authentication Required</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                You need to be logged in to book a parking slot.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => setLoginModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => router.push("/auth")}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isBookingModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setBookingModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-center mb-1">
              Book Slot{" "}
              <span className="text-blue-600">{selectedSlot.slotNumber}</span>
            </h3>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
              Select your booking duration and confirm.
            </p>
            <form onSubmit={handleBookSlot}>
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <label
                    htmlFor="duration"
                    className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center"
                  >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Booking Duration (max 6 hours)
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <input
                      id="duration"
                      type="range"
                      min="1"
                      max="6"
                      step="1"
                      value={bookingHours}
                      onChange={(e) =>
                        setBookingHours(parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="font-semibold text-blue-600 w-24 text-center bg-blue-100 dark:bg-blue-900/50 py-1 rounded-md">
                      {bookingHours} Hour{bookingHours > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-sm">
                  <p className="font-semibold">
                    Start:{" "}
                    <span className="font-normal">
                      {formatDate(new Date().toISOString())}
                    </span>
                  </p>
                  <p className="font-semibold mt-1">
                    End:{" "}
                    <span className="font-normal">
                      {formatDate(
                        new Date(
                          Date.now() + bookingHours * 60 * 60 * 1000
                        ).toISOString()
                      )}
                    </span>
                  </p>
                </div>

                {bookingError && (
                  <p className="text-sm text-red-500 text-center">
                    {bookingError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-blue-400"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Confirm & Book"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCancelModalOpen && slotToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <Info className="mx-auto h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-lg font-bold">Manage Your Booking</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                You have booked slot{" "}
                <span className="font-bold text-purple-500">
                  {slotToCancel.slotNumber}
                </span>
                . Do you want to cancel it?
              </p>

              {bookingError && (
                <p className="mt-4 text-sm text-red-500">{`Error: ${bookingError}`}</p>
              )}

              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="px-6 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg"
                >
                  Keep It
                </button>
                <button
                  onClick={handleCancelBookingFromSlot}
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 disabled:bg-red-400"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      <Ban className="h-4 w-4" /> Cancel Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSuccessModalOpen && bookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold">Booking Confirmed!</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Your QR code is ready.
            </p>
            <p>Please take a screenshot</p>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 my-6">
              <img
                src={bookingDetails.qrCode}
                alt="Booking QR Code"
                className="w-48 h-48 mx-auto rounded-lg bg-white p-2 shadow-inner"
              />
            </div>
            <div className="text-left space-y-2 text-sm bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
              <p>
                <strong>Slot:</strong>
                <span className="font-mono text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                  {bookingDetails.parkingSlot.slotNumber}
                </span>
              </p>
              <p>
                <strong>Start Time:</strong>
                {formatDate(bookingDetails.startTime)}
              </p>
              <p>
                <strong>End Time:</strong> {formatDate(bookingDetails.endTime)}
              </p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => setSuccessModalOpen(false)}
                className="w-full px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
