"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

async function getUserBookings(token) {
  const response = await fetch("http://localhost:5000/api/bookings", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch bookings");
  return response.json();
}

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      getUserBookings(token).then(setBookings).catch(console.error);
    }
  }, [user]);

  return (
    <div>
      <Navbar />
      <h1 className="text-2xl font-bold text-center my-4">My Bookings</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {bookings.map((booking) => (
          <div key={booking._id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">{booking.slotId.slotNumber}</h3>
            <p>Booked on: {new Date(booking.bookingTime).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
