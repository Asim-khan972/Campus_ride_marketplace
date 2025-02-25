"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useParams, useRouter, notFound } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Car,
  Loader2,
  AlertCircle,
  Clock,
  Wifi,
  Wind,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
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

export default function RideDetailsPage() {
  const { rideId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const statuses = [
    { value: "not_started", label: "Not Started" },
    { value: "waiting_for_customer", label: "Waiting for Customer" },
    { value: "started", label: "Started" },
    { value: "finished", label: "Finished" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    if (!rideId) return;
    const rideRef = doc(db, "rides", rideId);
    const unsubscribe = onSnapshot(
      rideRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const rideData = { id: docSnap.id, ...docSnap.data() };
          setRide(rideData);
          setNewStatus(rideData.status || "not_started");
        } else {
          notFound();
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching ride:", err);
        setError("Failed to load ride details.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [rideId]);

  const handleStatusUpdate = async () => {
    if (!ride) return;
    setUpdating(true);
    try {
      const rideRef = doc(db, "rides", rideId);
      await updateDoc(rideRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setUpdating(false);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status. Please try again.");
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8163e9] mx-auto mb-4" />
          <p className="text-black">Loading ride details...</p>
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

  if (!ride) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Ride Not Found
          </h2>
          <p className="text-black mb-4">
            This ride doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-[#8163e9] hover:underline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              Ride Details
            </h1>
            <span
              className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[ride.status]
              }`}
            >
              {ride.status.replace(/_/g, " ").charAt(0).toUpperCase() +
                ride.status.slice(1).replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Main Details */}
          <div className="p-6 space-y-6">
            {/* Locations */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#8163e9] mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Pickup Location</p>
                  <p className="font-medium text-black">
                    {ride.pickupLocation}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(ride.startDateTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#8163e9] mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium text-black">
                    {ride.destinationLocation}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(ride.endDateTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Ride Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-[#8163e9]" />
                <div>
                  <p className="text-sm text-gray-500">Available Seats</p>
                  <p className="font-medium text-black">
                    {ride.availableSeats}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-[#8163e9]" />
                <div>
                  <p className="text-sm text-gray-500">Price per Seat</p>
                  <p className="font-medium text-black">${ride.pricePerSeat}</p>
                </div>
              </div>
              {ride.tollsIncluded && (
                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5 text-[#8163e9]" />
                  <div>
                    <p className="text-sm text-gray-500">Toll Price</p>
                    <p className="font-medium text-black">${ride.tollPrice}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-4">
              {ride.airConditioning && (
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-full">
                  <Wind className="h-4 w-4 text-[#8163e9]" />
                  <span className="text-sm text-black">AC Available</span>
                </div>
              )}
              {ride.wifiAvailable && (
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-full">
                  <Wifi className="h-4 w-4 text-[#8163e9]" />
                  <span className="text-sm text-black">WiFi Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Update Section (visible only to the driver) */}
          {user && ride.ownerId === user.uid && (
            <div className="border-t p-6 bg-gray-50">
              <h2 className="text-lg font-semibold text-black mb-4">
                Update Ride Status
              </h2>
              <div className="space-y-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors text-black bg-white"
                >
                  {statuses.map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                      className="text-black"
                    >
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="w-full bg-[#8163e9] text-white py-3 px-4 rounded-lg hover:bg-[#8163e9]/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
