"use client";

import { useAuth } from "@/context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import { useState } from "react";
import { Car, CheckCircle, XCircle } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

export default function SlotCard({ slot, onSlotBooked }) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [localSlot, setLocalSlot] = useState(slot);

  const handleAction = async (action) => {
    if (!user) {
      toast.error("Please log in to proceed.");
      return;
    }

    setIsProcessing(true);
    const url =
      action === "book"
        ? "http://localhost:5000/api/bookings"
        : `http://localhost:5000/api/bookings/${localSlot.bookingId || ""}`;
    const method = action === "book" ? "POST" : "DELETE";
    const body =
      action === "book" ? JSON.stringify({ slotId: localSlot._id }) : null;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      toast.success(
        `Slot ${action === "book" ? "booked" : "canceled"} successfully!`
      );
      setLocalSlot((prevSlot) => ({
        ...prevSlot,
        isAvailable: action !== "book",
        bookingId: action === "book" ? data.bookingId : null,
        bookedBy: action === "book" ? user.id : null,
      }));

      if (onSlotBooked) onSlotBooked(localSlot._id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 transition-transform transform hover:scale-105 relative">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Car className="text-gray-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-800">
            Slot {localSlot.slotNumber}
          </h3>
        </div>

        <span
          className={`flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${
            localSlot.isAvailable
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {localSlot.isAvailable ? (
            <>
              <CheckCircle size={16} /> Available
            </>
          ) : (
            <>
              <XCircle size={16} /> Booked
            </>
          )}
        </span>
      </div>

      <div className="flex justify-center my-4">
        <div
          className={`w-24 h-14 rounded-lg flex items-center justify-center ${
            localSlot.isAvailable ? "bg-green-200" : "bg-red-300"
          }`}
        >
          <Car size={32} className="text-gray-700" />
        </div>
      </div>

      {localSlot.isAvailable ? (
        <button
          onClick={() => handleAction("book")}
          disabled={isProcessing}
          className={`mt-4 w-full px-4 py-2 text-white font-medium rounded-lg transition ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          } flex items-center justify-center gap-2`}
        >
          {isProcessing ? "Processing..." : "Book Slot"}
        </button>
      ) : localSlot.bookedBy === user?.id ? (
        <button
          onClick={() => handleAction("cancel")}
          disabled={isProcessing || !localSlot.bookingId}
          className={`mt-4 w-full px-4 py-2 text-white font-medium rounded-lg transition ${
            isProcessing || !localSlot.bookingId
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600"
          } flex items-center justify-center gap-2`}
        >
          {isProcessing ? "Processing..." : "Cancel Booking"}
        </button>
      ) : (
        <p className="mt-4 text-center text-red-500 font-medium">
          Slot booked by another user
        </p>
      )}
    </div>
  );
}
