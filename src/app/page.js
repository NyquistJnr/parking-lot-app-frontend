// app/page.js
import SlotCard from "@/components/SlotCard";
import Navbar from "@/components/Navbar";

async function getSlots() {
  const response = await fetch("http://localhost:5000/api/slots", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch slots");
  return response.json();
}

export default async function Home() {
  const slots = await getSlots();

  return (
    <div>
      <Navbar />
      <h1 className="text-2xl font-bold text-center my-4">
        Available Parking Slots
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {slots.map((slot) => (
          <SlotCard key={slot._id} slot={slot} />
        ))}
      </div>
    </div>
  );
}
