"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Ticket,
  Loader2,
  ShieldAlert,
  CalendarCheck,
  CalendarX,
  Clock,
  Ban,
  ParkingCircle,
  Car,
  Hourglass,
  Zap,
} from "lucide-react";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function HistoryPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}`;

  useEffect(() => {
    const userDataString = localStorage.getItem("user");
    if (!userDataString) {
      router.push("/auth");
      return;
    }
    const userData = JSON.parse(userDataString);
    setCurrentUser(userData);

    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch booking history.");
        }
        const data = await response.json();
        const sortedData = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setBookings(sortedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [router, API_BASE_URL]);

  const categorizedBookings = useMemo(() => {
    const now = new Date();
    const active = [];
    const upcoming = [];
    const past = [];

    bookings.forEach((booking) => {
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);

      if (booking.status.toUpperCase() !== "BOOKED") {
        past.push(booking);
      } else {
        if (now >= startTime && now <= endTime) {
          active.push(booking);
        } else if (now < startTime) {
          upcoming.push(booking);
        } else {
          past.push(booking);
        }
      }
    });

    return { active, upcoming, past };
  }, [bookings]);

  const handleCancelClick = (booking) => {
    setBookingToCancel(booking);
    setCancelModalOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel || !currentUser?.token) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingToCancel._id}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to cancel booking.");
      }

      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b._id === bookingToCancel._id ? { ...b, status: "CANCELLED" } : b
        )
      );

      setCancelModalOpen(false);
      setBookingToCancel(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBookingCard = (booking) => {
    const isCancellable = booking.status.toUpperCase() === "BOOKED";

    const statusStyles = {
      ACTIVE:
        "bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300",
      COMPLETED:
        "bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300",
      CANCELED:
        "bg-danger-100 text-danger-800 dark:bg-danger-900/50 dark:text-danger-300",
    };

    const statusIcons = {
      ACTIVE: <Clock className="h-4 w-4" />,
      COMPLETED: <CalendarCheck className="h-4 w-4" />,
      CANCELED: <CalendarX className="h-4 w-4" />,
    };

    return (
      <div
        key={booking._id}
        className="bg-white dark:bg-slate-800/50 rounded-xl shadow-md overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
      >
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                SLOT {booking.parkingSlot.slotNumber}
              </p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {formatDate(booking.startTime)}
              </p>
            </div>
            <div
              className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${
                statusStyles[booking.status.toUpperCase()] ||
                "bg-slate-100 text-slate-800"
              }`}
            >
              {statusIcons[booking.status.toUpperCase()]}
              {booking.status}
            </div>
          </div>

          <div className="mt-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg flex justify-around text-center text-sm">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Starts
              </p>
              <p className="font-semibold">{formatTime(booking.startTime)}</p>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-600"></div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ends</p>
              <p className="font-semibold">{formatTime(booking.endTime)}</p>
            </div>
          </div>

          {isCancellable && (
            <div className="mt-4">
              <button
                onClick={() => handleCancelClick(booking)}
                className="w-full flex justify-center items-center gap-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800/60 text-red-600 dark:text-red-400 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                <Ban className="h-4 w-4" />
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <header className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-lg shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <Ticket className="h-6 w-6 text-blue-600" />
            Booking History
          </h1>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
            <p className="mt-4 text-lg font-semibold">Loading History...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 bg-red-500/10 rounded-lg p-8">
            <ShieldAlert className="mx-auto h-12 w-12 mb-4" />
            <p className="font-semibold text-lg">Could not load history.</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <Car className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
            <h2 className="text-2xl font-bold">No Bookings Yet</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Your booking history is empty. Find a spot to get started!
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105"
            >
              <ParkingCircle className="h-5 w-5" />
              Book a Slot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg sticky top-24">
                <h2 className="text-lg font-bold">Your Activity</h2>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-6 w-6 text-blue-500" />
                      <span className="font-semibold">Active Now</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {categorizedBookings.active.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Hourglass className="h-6 w-6 text-amber-500" />
                      <span className="font-semibold">Upcoming</span>
                    </div>
                    <span className="text-2xl font-bold text-amber-600">
                      {categorizedBookings.upcoming.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="h-6 w-6 text-slate-500" />
                      <span className="font-semibold">Total Bookings</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-600 dark:text-slate-300">
                      {bookings.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {categorizedBookings.active.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Zap className="text-blue-500" /> Active Now
                  </h3>
                  <div className="space-y-4">
                    {categorizedBookings.active.map(renderBookingCard)}
                  </div>
                </div>
              )}

              {categorizedBookings.upcoming.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold my-4 border-t border-slate-200 dark:border-slate-700 pt-6 flex items-center gap-2">
                    <Hourglass className="text-amber-500" /> Upcoming
                  </h3>
                  <div className="space-y-4">
                    {categorizedBookings.upcoming.map(renderBookingCard)}
                  </div>
                </div>
              )}

              {categorizedBookings.past.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold my-4 border-t border-slate-200 dark:border-slate-700 pt-6 flex items-center gap-2">
                    <CalendarCheck className="text-slate-500" /> Past Bookings
                  </h3>
                  <div className="space-y-4">
                    {categorizedBookings.past.map(renderBookingCard)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {isCancelModalOpen && bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <Ban className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold">Are you sure?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Do you really want to cancel your booking for slot{" "}
              <span className="font-semibold">
                {bookingToCancel.parkingSlot.slotNumber}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-6 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg"
              >
                Nevermind
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 disabled:bg-red-400"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
