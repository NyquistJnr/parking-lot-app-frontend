"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ParkingSquare,
  Ticket,
  Loader2,
  ChevronLeft,
  XCircle,
  CheckCircle2,
  Car,
  ParkingCircle as ParkingIcon,
  Eye,
  EyeOff,
  Trash2,
  ShieldQuestion,
} from "lucide-react";

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
    <div className={`p-3 rounded-full ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  </div>
);

const FullScreenLoader = ({ text }) => (
  <div className="fixed inset-0 bg-white dark:bg-slate-900 flex flex-col items-center justify-center z-50">
    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
    <p className="mt-4 text-lg font-semibold">{text}</p>
  </div>
);

export default function AdminPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState("all");

  const [newAdmin, setNewAdmin] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [singleSlot, setSingleSlot] = useState({ slotNumber: "" });
  const [bulkSlots, setBulkSlots] = useState({
    prefix: "",
    startNumber: 1,
    count: 10,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [loading, setLoading] = useState({ page: true, action: false });
  const [error, setError] = useState({ source: "", message: "" });
  const [success, setSuccess] = useState({ source: "", message: "" });

  const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}`;

  useEffect(() => {
    const userDataString = localStorage.getItem("user");
    if (!userDataString) {
      router.replace("/auth");
      return;
    }
    const userData = JSON.parse(userDataString);
    if (userData.role !== "admin") {
      router.replace("/");
      return;
    }
    setCurrentUser(userData);
    setIsAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!isAuthChecked || !currentUser) return;

    const fetchAllData = async () => {
      setLoading({ ...loading, page: true });
      try {
        const [slotsRes, bookingsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/slots`, {
            headers: { Authorization: `Bearer ${currentUser.token}` },
          }),
          fetch(`${API_BASE_URL}/admin/bookings`, {
            headers: { Authorization: `Bearer ${currentUser.token}` },
          }),
          fetch(`${API_BASE_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${currentUser.token}` },
          }),
        ]);

        if (!slotsRes.ok || !bookingsRes.ok || !usersRes.ok)
          throw new Error("Failed to fetch critical admin data.");

        const slotsData = await slotsRes.json();
        const bookingsData = await bookingsRes.json();
        const usersData = await usersRes.json();

        const sortedSlots = slotsData.sort((a, b) =>
          a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true })
        );

        setSlots(sortedSlots);
        setBookings(
          bookingsData.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
        setUsers(usersData);
      } catch (err) {
        setError({ source: "data", message: err.message });
      } finally {
        setLoading({ ...loading, page: false });
      }
    };
    fetchAllData();
  }, [isAuthChecked, currentUser, API_BASE_URL]);

  const stats = useMemo(() => {
    const occupiedCount = slots.filter((s) => s.isOccupied).length;
    return {
      total: slots.length,
      occupied: occupiedCount,
      available: slots.length - occupiedCount,
      totalBookings: bookings.length,
    };
  }, [slots, bookings]);

  const filteredUsers = useMemo(() => {
    if (userFilter === "all") return users;
    return users.filter((user) => user.role === userFilter);
  }, [users, userFilter]);

  const clearMessages = () => {
    setError({ source: "", message: "" });
    setSuccess({ source: "", message: "" });
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, action: true });
    clearMessages();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAdmin, role: "admin" }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to create admin.");
      setSuccess({
        source: "admin",
        message: `Admin "${data.username}" created successfully!`,
      });
      setUsers((prev) => [...prev, data]);
      setNewAdmin({ username: "", email: "", password: "" });
    } catch (err) {
      setError({ source: "admin", message: err.message });
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  const handleCreateSingleSlot = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, action: true });
    clearMessages();
    try {
      const response = await fetch(`${API_BASE_URL}/admin/slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(singleSlot),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to create slot.");
      setSuccess({
        source: "single_slot",
        message: `Slot "${data.slotNumber}" created!`,
      });
      setSlots((prev) =>
        [...prev, data].sort((a, b) =>
          a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true })
        )
      );
      setSingleSlot({ slotNumber: "" });
    } catch (err) {
      setError({ source: "single_slot", message: err.message });
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  const handleCreateBulkSlots = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, action: true });
    clearMessages();
    try {
      const response = await fetch(`${API_BASE_URL}/admin/slots/bulk-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          ...bulkSlots,
          startNumber: Number(bulkSlots.startNumber),
          count: Number(bulkSlots.count),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to create slots.");
      setSuccess({
        source: "bulk_slots",
        message: `${data.created.length} slots created successfully.`,
      });
      setBulkSlots({ prefix: "", startNumber: 1, count: 10 });

      const slotsRes = await fetch(`${API_BASE_URL}/admin/slots`, {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      const slotsData = await slotsRes.json();
      setSlots(
        slotsData.sort((a, b) =>
          a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true })
        )
      );
    } catch (err) {
      setError({ source: "bulk_slots", message: err.message });
    } finally {
      setLoading({ ...loading, action: false });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setLoading({ ...loading, action: true });
    clearMessages();

    const { type, data } = itemToDelete;
    const url =
      type === "slot"
        ? `${API_BASE_URL}/admin/slots/${data._id}`
        : `${API_BASE_URL}/admin/users/${data._id}`;

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      if (!response.ok) {
        const resData = await response.json().catch(() => ({}));
        throw new Error(resData.message || `Failed to delete ${type}.`);
      }

      if (type === "slot") {
        setSlots((prev) => prev.filter((s) => s._id !== data._id));
        setSuccess({
          source: "delete",
          message: `Slot ${data.slotNumber} has been deleted.`,
        });
      } else {
        setUsers((prev) => prev.filter((u) => u._id !== data._id));
        setSuccess({
          source: "delete",
          message: `User ${data.username} has been deleted.`,
        });
      }
    } catch (err) {
      setError({ source: "delete", message: err.message });
    } finally {
      setLoading({ ...loading, action: false });
      setItemToDelete(null);
    }
  };

  if (!isAuthChecked)
    return <FullScreenLoader text="Verifying credentials..." />;

  return (
    <>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <header className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-lg shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              Admin Dashboard
            </h1>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Site</span>
            </button>
          </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8 border-b border-slate-200 dark:border-slate-700">
            <nav
              className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px"
              aria-label="Tabs"
            >
              {["dashboard", "slots", "bookings", "users"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`capitalize shrink-0 px-3 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-blue-600 text-blue-600 bg-blue-500/10"
                      : "text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  }`}
                >
                  {tab === "slots"
                    ? "Slot Mgmt"
                    : tab === "users"
                    ? "User Mgmt"
                    : tab}
                </button>
              ))}
            </nav>
          </div>

          {loading.page ? (
            <FullScreenLoader text={`Loading data...`} />
          ) : (
            <div>
              {activeTab === "dashboard" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <StatCard
                    title="Total Slots"
                    value={stats.total}
                    icon={<ParkingSquare className="h-6 w-6 text-blue-500" />}
                    colorClass="bg-blue-500/20"
                  />
                  <StatCard
                    title="Occupied"
                    value={stats.occupied}
                    icon={<Car className="h-6 w-6 text-red-500" />}
                    colorClass="bg-red-500/20"
                  />
                  <StatCard
                    title="Available"
                    value={stats.available}
                    icon={<ParkingIcon className="h-6 w-6 text-green-500" />}
                    colorClass="bg-green-500/20"
                  />
                  <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    icon={<Ticket className="h-6 w-6 text-amber-500" />}
                    colorClass="bg-amber-500/20"
                  />
                </div>
              )}

              {activeTab === "slots" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                      <h3 className="text-lg font-bold mb-4">
                        Create Single Slot
                      </h3>
                      <form
                        onSubmit={handleCreateSingleSlot}
                        className="space-y-4"
                      >
                        <div>
                          <label
                            htmlFor="slotNumber"
                            className="block text-sm font-medium text-slate-600 dark:text-slate-300"
                          >
                            Slot Number
                          </label>
                          <input
                            type="text"
                            id="slotNumber"
                            value={singleSlot.slotNumber}
                            onChange={(e) =>
                              setSingleSlot({ slotNumber: e.target.value })
                            }
                            required
                            className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading.action}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
                        >
                          {loading.action ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                          ) : (
                            "Create Slot"
                          )}
                        </button>
                        {error.source === "single_slot" && (
                          <p className="text-red-500 text-sm mt-2">
                            {error.message}
                          </p>
                        )}
                        {success.source === "single_slot" && (
                          <p className="text-green-500 text-sm mt-2">
                            {success.message}
                          </p>
                        )}
                      </form>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                      <h3 className="text-lg font-bold mb-4">
                        Create Bulk Slots
                      </h3>
                      <form
                        onSubmit={handleCreateBulkSlots}
                        className="space-y-4"
                      >
                        <div>
                          <label htmlFor="prefix">Prefix (e.g., B)</label>
                          <input
                            type="text"
                            id="prefix"
                            value={bulkSlots.prefix}
                            onChange={(e) =>
                              setBulkSlots({
                                ...bulkSlots,
                                prefix: e.target.value.toUpperCase(),
                              })
                            }
                            required
                            className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="startNumber">Start No.</label>
                            <input
                              type="number"
                              id="startNumber"
                              min="1"
                              value={bulkSlots.startNumber}
                              onChange={(e) =>
                                setBulkSlots({
                                  ...bulkSlots,
                                  startNumber: e.target.value,
                                })
                              }
                              required
                              className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="count">Count</label>
                            <input
                              type="number"
                              id="count"
                              min="1"
                              value={bulkSlots.count}
                              onChange={(e) =>
                                setBulkSlots({
                                  ...bulkSlots,
                                  count: e.target.value,
                                })
                              }
                              required
                              className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={loading.action}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
                        >
                          {loading.action ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                          ) : (
                            "Create Slots"
                          )}
                        </button>
                        {error.source === "bulk_slots" && (
                          <p className="text-red-500 text-sm mt-2">
                            {error.message}
                          </p>
                        )}
                        {success.source === "bulk_slots" && (
                          <p className="text-green-500 text-sm mt-2">
                            {success.message}
                          </p>
                        )}
                      </form>
                    </div>
                  </div>
                  <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold mb-4">
                      All Slots ({slots.length})
                    </h3>
                    <div className="overflow-x-auto max-h-[600px] sm:max-h-[700px]">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 sticky top-0">
                          <tr>
                            <th className="px-4 py-3">Slot No.</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 hidden md:table-cell">
                              Created At
                            </th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {slots.map((slot) => (
                            <tr
                              key={slot._id}
                              className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50"
                            >
                              <td className="px-4 py-4 font-medium">
                                {slot.slotNumber}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    slot.isOccupied
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                                      : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                  }`}
                                >
                                  {slot.isOccupied ? "Occupied" : "Available"}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                                {new Date(slot.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() =>
                                    setItemToDelete({
                                      type: "slot",
                                      data: slot,
                                    })
                                  }
                                  className="text-red-500 hover:text-red-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                                  title={
                                    slot.isOccupied
                                      ? "Cannot delete an occupied slot"
                                      : "Delete Slot"
                                  }
                                  disabled={slot.isOccupied}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "bookings" && (
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-bold mb-4">
                    All System Bookings ({bookings.length})
                  </h3>
                  <div className="overflow-x-auto max-h-[700px]">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 sticky top-0">
                        <tr>
                          <th scope="col" className="px-4 py-3">
                            User / Slot
                          </th>
                          <th scope="col" className="px-4 py-3">
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 hidden md:table-cell"
                          >
                            Start Time
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 hidden md:table-cell"
                          >
                            End Time
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr
                            key={booking._id}
                            className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50"
                          >
                            <td className="px-4 py-4 font-medium">
                              <div className="font-semibold">
                                {booking.user.username}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Slot {booking.parkingSlot.slotNumber}
                              </div>
                            </td>
                            <td className="px-4 py-4 capitalize">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  booking.status === "booked"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              {new Date(booking.startTime).toLocaleString()}
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              {new Date(booking.endTime).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                      <h3 className="text-lg font-bold mb-4">
                        Create New Admin
                      </h3>
                      <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div>
                          <label htmlFor="admin_username">Username</label>
                          <input
                            type="text"
                            id="admin_username"
                            value={newAdmin.username}
                            onChange={(e) =>
                              setNewAdmin({
                                ...newAdmin,
                                username: e.target.value,
                              })
                            }
                            required
                            className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="admin_email">Email</label>
                          <input
                            type="email"
                            id="admin_email"
                            value={newAdmin.email}
                            onChange={(e) =>
                              setNewAdmin({
                                ...newAdmin,
                                email: e.target.value,
                              })
                            }
                            required
                            className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent"
                          />
                        </div>
                        <div className="relative">
                          <label htmlFor="admin_password">Password</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            id="admin_password"
                            value={newAdmin.password}
                            onChange={(e) =>
                              setNewAdmin({
                                ...newAdmin,
                                password: e.target.value,
                              })
                            }
                            required
                            className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-slate-500" />
                            ) : (
                              <Eye className="h-5 w-5 text-slate-500" />
                            )}
                          </button>
                        </div>
                        <button
                          type="submit"
                          disabled={loading.action}
                          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2 font-semibold"
                        >
                          {loading.action ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                          ) : (
                            "Create Admin Account"
                          )}
                        </button>
                        {error.source === "admin" && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                            <XCircle className="h-4 w-4" /> {error.message}
                          </p>
                        )}
                        {success.source === "admin" && (
                          <p className="text-green-500 text-sm mt-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />{" "}
                            {success.message}
                          </p>
                        )}
                      </form>
                    </div>
                  </div>
                  <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
                    <div className="sm:flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold mb-2 sm:mb-0">
                        System Users ({filteredUsers.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        {["all", "admin", "user"].map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setUserFilter(filter)}
                            className={`capitalize px-3 py-1 text-sm font-semibold rounded-full ${
                              userFilter === filter
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                            }`}
                          >
                            {filter}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] sm:max-h-[700px]">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 sticky top-0">
                          <tr>
                            <th className="px-4 py-3">Username</th>
                            <th className="px-4 py-3 hidden sm:table-cell">
                              Email
                            </th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr
                              key={user._id}
                              className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50"
                            >
                              <td className="px-4 py-4 font-medium">
                                {user.username}
                              </td>
                              <td className="px-4 py-4 text-slate-500 hidden sm:table-cell">
                                {user.email}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`capitalize px-2 py-1 rounded-full text-xs font-semibold ${
                                    user.role === "admin"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-sky-100 text-sky-800"
                                  }`}
                                >
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() =>
                                    setItemToDelete({
                                      type: "user",
                                      data: user,
                                    })
                                  }
                                  className="text-red-500 hover:text-red-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                                  title={
                                    user._id === currentUser._id
                                      ? "You cannot delete your own account"
                                      : "Delete User"
                                  }
                                  disabled={user._id === currentUser._id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-auto">
            <div className="text-center">
              <ShieldQuestion className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {itemToDelete.type === "slot"
                    ? `slot ${itemToDelete.data.slotNumber}`
                    : `user ${itemToDelete.data.username}`}
                  ?
                </span>
                <br />
                This action cannot be undone.
              </p>
              {error.source === "delete" && (
                <p className="text-red-500 text-sm mt-2">{error.message}</p>
              )}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-6 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading.action}
                  className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 disabled:bg-red-400"
                >
                  {loading.action ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
