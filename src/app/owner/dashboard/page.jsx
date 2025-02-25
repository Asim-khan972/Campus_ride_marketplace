"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, where("ownerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBookings(fetchedBookings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return <p>Please log in as an owner to view your dashboard.</p>;
  }
  if (loading) {
    return <p>Loading bookings...</p>;
  }

  console.log("boookings", bookings);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Owner Dashboard</h1>
      <h2 className="text-2xl mb-2">Bookings Received</h2>
      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <ul>
          {bookings.map((booking) => (
            <li key={booking.id} className="p-4 border rounded mb-2 bg-white">
              <p>
                <strong>Ride ID:</strong> {booking.rideId}
              </p>
              <p>
                <strong>Rider ID:</strong> {booking.riderId}
              </p>
              <p>
                <strong>Seats Booked:</strong> {booking.seatsBooked}
              </p>
              <p>
                <strong>Booked At:</strong>{" "}
                {new Date(booking.bookingTime?.seconds * 1000).toLocaleString()}
              </p>
              {/* Optionally, provide a link to view ride details */}
              <Link href={`/rides/${booking.rideId}`}>
                <a className="text-blue-600 hover:underline">
                  View Ride Details
                </a>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
