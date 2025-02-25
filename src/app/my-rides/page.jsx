"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Users,
  DollarSign,
  Car,
  Loader2,
  AlertCircle,
  Clock,
  Wifi,
  Wind,
  ChevronRight,
} from "lucide-react";

const statusColors = {
  not_started: "bg-yellow-100 text-black",
  waiting_for_customer: "bg-blue-100 text-black",
  started: "bg-green-100 text-black",
  finished: "bg-gray-100 text-black",
  cancelled: "bg-red-100 text-black",
};

const formatDateTime = (dateTimeStr) => {
  return new Date(dateTimeStr).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const ridesRef = collection(db, "rides");
    const q = query(ridesRef, where("ownerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedRides = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRides(fetchedRides);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching rides:", err);
        setError("Failed to load rides. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const currentStatuses = ["not_started", "waiting_for_customer", "started"];
  const previousStatuses = ["finished", "cancelled"];

  const currentRides = rides.filter((ride) =>
    currentStatuses.includes(ride.status)
  );
  const previousRides = rides.filter((ride) =>
    previousStatuses.includes(ride.status)
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <Car className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Driver Access Required
          </h2>
          <p className="text-black mb-4">
            Please log in as a driver to view your dashboard.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8163e9] mx-auto mb-4" />
          <p className="text-black">Loading your rides...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">Error</h2>
          <p className="text-black">{error}</p>
        </div>
      </div>
    );
  }

  const RideCard = ({ ride }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[ride.status]
            }`}
          >
            {ride.status.replace(/_/g, " ").charAt(0).toUpperCase() +
              ride.status.slice(1).replace(/_/g, " ")}
          </span>
          <div className="flex items-center text-sm text-black">
            <Clock className="h-4 w-4 mr-1 text-[#8163e9]" />
            <span>{formatDateTime(ride.startDateTime)}</span>
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-[#8163e9] mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">From</p>
              <p className="font-medium text-black">{ride.pickupLocation}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-[#8163e9] mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">To</p>
              <p className="font-medium text-black">
                {ride.destinationLocation}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-[#8163e9]" />
            <span className="text-black">
              {ride.availableSeats} seats available
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-[#8163e9]" />
            <span className="text-black">${ride.pricePerSeat} per seat</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex items-center space-x-4 mb-4">
          {ride.wifiAvailable && (
            <div className="flex items-center space-x-1">
              <Wifi className="h-4 w-4 text-[#8163e9]" />
              <span className="text-sm text-black">WiFi</span>
            </div>
          )}
          {ride.airConditioning && (
            <div className="flex items-center space-x-1">
              <Wind className="h-4 w-4 text-[#8163e9]" />
              <span className="text-sm text-black">AC</span>
            </div>
          )}
          {ride.tollsIncluded && (
            <div className="flex items-center space-x-1">
              <Car className="h-4 w-4 text-[#8163e9]" />
              <span className="text-sm text-black">
                Toll included (${ride.tollPrice})
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link
          href={`/my-rides/${ride.id}`}
          className="inline-flex items-center justify-center w-full bg-[#8163e9] text-white px-4 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
        >
          View Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              Driver Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your rides and track your trips
            </p>
          </div>
          <Link
            href="/publish-ride"
            className="bg-[#8163e9] text-white px-4 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
          >
            Create New Ride
          </Link>
        </div>

        <div className="space-y-8">
          {/* Current Rides */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4">
              Current Rides
            </h2>
            {currentRides.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No Current Rides
                </h3>
                <p className="text-gray-500">
                  You don't have any active rides at the moment.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {currentRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            )}
          </section>

          {/* Previous Rides */}
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-4">
              Previous Rides
            </h2>
            {previousRides.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No Previous Rides
                </h3>
                <p className="text-gray-500">
                  Your completed rides will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {previousRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
