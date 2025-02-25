"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  runTransaction,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useRouter, notFound } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Users,
  DollarSign,
  Car,
  MessageCircle,
  Loader2,
  AlertCircle,
  Wind,
  Wifi,
  Clock,
} from "lucide-react";

// Helper functions remain unchanged
async function getOrCreateChat(ownerId, riderId) {
  try {
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("participants", "array-contains", riderId));
    const querySnapshot = await getDocs(q);
    let existingChat = null;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(ownerId)) {
        existingChat = { id: doc.id, ...data };
      }
    });

    if (existingChat) {
      return existingChat.id;
    } else {
      const newChatDoc = await addDoc(chatsRef, {
        participants: [ownerId, riderId],
        lastMessage: "",
        updatedAt: serverTimestamp(),
      });
      return newChatDoc.id;
    }
  } catch (error) {
    console.error("Failed to get or create chat:", error);
    return null;
  }
}

async function bookSeats(rideId, riderId, seatsToBook) {
  const rideRef = doc(db, "rides", rideId);
  const bookingsRef = collection(db, "bookings");
  try {
    await runTransaction(db, async (transaction) => {
      const rideDoc = await transaction.get(rideRef);
      if (!rideDoc.exists()) {
        throw new Error("Ride does not exist");
      }
      const rideData = rideDoc.data();
      const currentSeats = rideData.availableSeats;
      if (currentSeats < seatsToBook) {
        throw new Error("Not enough available seats");
      }
      transaction.update(rideRef, {
        availableSeats: currentSeats - seatsToBook,
      });
      const bookingData = {
        rideId,
        riderId,
        seatsBooked: seatsToBook,
        bookingTime: serverTimestamp(),
      };
      await addDoc(bookingsRef, bookingData);
    });
    return { success: true };
  } catch (error) {
    console.error("Booking failed:", error);
    return { success: false, message: error.message };
  }
}

export default function RidePage({ params }) {
  const { rideId } = params;
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingMessage, setBookingMessage] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchRide() {
      try {
        const docRef = doc(db, "rides", rideId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          notFound();
        }
        setRide(docSnap.data());
      } catch (err) {
        console.error(err);
        setError("Failed to load ride details. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchRide();
  }, [rideId]);

  const handleStartChat = async () => {
    if (!user) {
      setError("Please log in to start a chat.");
      return;
    }
    if (!ride) return;
    const chatId = await getOrCreateChat(ride.ownerId, user.uid);
    if (chatId) {
      router.push(`/chat/${chatId}`);
    } else {
      setError("Failed to initiate chat.");
    }
  };

  const handleBookSeats = async (e) => {
    e.preventDefault();
    setBookingMessage("");
    setIsBooking(true);

    if (!user) {
      setBookingMessage("Please log in to book seats.");
      setIsBooking(false);
      return;
    }

    const seatsToBook = Number(bookingSeats);
    if (isNaN(seatsToBook) || seatsToBook <= 0) {
      setBookingMessage("Enter a valid number of seats to book.");
      setIsBooking(false);
      return;
    }

    const result = await bookSeats(rideId, user.uid, seatsToBook);
    if (result.success) {
      setBookingMessage("Booking successful!");
      const updatedDoc = await getDoc(doc(db, "rides", rideId));
      setRide(updatedDoc.data());
    } else {
      setBookingMessage("Booking failed: " + result.message);
    }
    setIsBooking(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Ride Header */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-4">
              Ride Details
            </h1>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center text-black">
                <Clock className="h-5 w-5 text-[#8163e9] mr-2" />
                <span>{new Date(ride.startDateTime).toLocaleString()}</span>
              </div>
              <div className="flex items-center text-black">
                <Users className="h-5 w-5 text-[#8163e9] mr-2" />
                <span>{ride.availableSeats} seats available</span>
              </div>
            </div>
          </div>

          {/* Ride Details */}
          <div className="p-6 space-y-6">
            {/* Locations */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#8163e9] mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Pickup Location</p>
                  <p className="text-lg font-medium text-black">
                    {ride.pickupLocation}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#8163e9] mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="text-lg font-medium text-black">
                    {ride.destinationLocation}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-[#8163e9]" />
                  <span className="text-black">Price per seat</span>
                </div>
                <span className="font-medium text-black">
                  ${ride.pricePerSeat}
                </span>
              </div>
              {ride.tollsIncluded && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-[#8163e9]" />
                    <span className="text-black">Toll price</span>
                  </div>
                  <span className="font-medium text-black">
                    ${ride.tollPrice}
                  </span>
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="flex items-center space-x-6">
              {ride.airConditioning && (
                <div className="flex items-center space-x-2">
                  <Wind className="h-5 w-5 text-[#8163e9]" />
                  <span className="text-black">AC</span>
                </div>
              )}
              {ride.wifiAvailable && (
                <div className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5 text-[#8163e9]" />
                  <span className="text-black">WiFi</span>
                </div>
              )}
            </div>

            {/* Booking Form */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                Book Your Seats
              </h2>
              <form onSubmit={handleBookSeats} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Number of Seats
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={ride.availableSeats}
                      value={bookingSeats}
                      onChange={(e) => setBookingSeats(Number(e.target.value))}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8163e9] focus:border-transparent text-black"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isBooking}
                      className="bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                    >
                      {isBooking ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Book Seats"
                      )}
                    </button>
                  </div>
                </div>
                {bookingMessage && (
                  <p
                    className={`text-sm ${
                      bookingMessage.includes("successful")
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {bookingMessage}
                  </p>
                )}
              </form>
            </div>

            {/* Chat Button */}
            <div className="border-t pt-6">
              <button
                onClick={handleStartChat}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-[#8163e9] text-[#8163e9] px-6 py-2 rounded-lg hover:bg-[#8163e9] hover:text-white transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Chat with Owner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
