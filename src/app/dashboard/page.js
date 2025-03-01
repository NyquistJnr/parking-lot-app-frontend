"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

// Fetch all slots from the backend
async function getSlots() {
  const response = await fetch("http://localhost:5000/api/slots", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch slots");
  return response.json();
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [slots, setSlots] = useState([]);
  const [slotNumber, setSlotNumber] = useState("");
  const [editingSlot, setEditingSlot] = useState(null);
  const [updatedSlotNumber, setUpdatedSlotNumber] = useState("");

  // Fetch slots on component mount
  useEffect(() => {
    getSlots()
      .then(setSlots)
      .catch((error) => toast.error(error.message));
  }, []);

  // Create a new slot
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ slotNumber }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSlots([...slots, data]);
      setSlotNumber("");
      toast.success("Slot created successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Update an existing slot
  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5000/api/slots/${editingSlot._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ slotNumber: updatedSlotNumber }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error("data.message");
      setSlots(
        slots.map((slot) => (slot._id === editingSlot._id ? data : slot))
      );
      setEditingSlot(null);
      setUpdatedSlotNumber("");
      toast.success("Slot updated successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Delete a slot
  const handleDeleteSlot = async (slotId) => {
    console.log(slotId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/slots/${slotId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // const data = await response.json();
      // console.log(data);
      if (!response.ok) throw new Error("Failed to delete slot");
      setSlots(slots.filter((slot) => slot._id !== slotId));
      toast.success("Slot deleted successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <Navbar />
      <ToastContainer />
      <h1 className="text-2xl font-bold text-center my-4">Admin Dashboard</h1>

      {/* Create New Slot Form */}
      <form
        onSubmit={handleCreateSlot}
        className="mb-4 p-4 bg-gray-100 rounded"
      >
        <h2 className="text-xl font-bold mb-2">Create New Slot</h2>
        <input
          type="text"
          placeholder="Slot Number"
          value={slotNumber}
          onChange={(e) => setSlotNumber(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Create Slot
        </button>
      </form>

      {/* List of Slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {slots.map((slot) => (
          <div key={slot._id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">{slot.slotNumber}</h3>
            <p>{slot.isAvailable ? "Available" : "Booked"}</p>

            {/* Edit Slot Form */}
            {editingSlot?._id === slot._id ? (
              <form onSubmit={handleUpdateSlot} className="mt-2">
                <input
                  type="text"
                  placeholder="Slot Number"
                  value={updatedSlotNumber}
                  onChange={(e) => setUpdatedSlotNumber(e.target.value)}
                  className="w-full p-2 mb-2 border rounded"
                />
                <button
                  type="submit"
                  className="bg-green-500 text-white p-2 rounded"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="bg-gray-500 text-white p-2 rounded ml-2"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setEditingSlot(slot);
                  setUpdatedSlotNumber(slot.slotNumber);
                }}
                className="mt-2 bg-yellow-500 text-white p-2 rounded w-full"
              >
                Edit
              </button>
            )}

            {/* Delete Slot Button */}
            <button
              onClick={() => handleDeleteSlot(slot._id)}
              className="mt-2 bg-red-500 text-white p-2 rounded w-full"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
