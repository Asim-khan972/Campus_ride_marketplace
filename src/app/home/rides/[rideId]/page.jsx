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
  updateDoc,
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
  User,
  Calendar,
  CheckCircle,
  ChevronLeft,
  X,
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
        status: "active",
      };
      await addDoc(bookingsRef, bookingData);

      // Create notification for ride owner
      const notificationsRef = collection(db, "notifications");
      await addDoc(notificationsRef, {
        userId: rideData.ownerId,
        type: "booking",
        message: `Someone booked ${seatsToBook} seat(s) on your ride from ${rideData.pickupCity} to ${rideData.destinationCity}`,
        read: false,
        createdAt: serverTimestamp(),
        rideId: rideId,
      });
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
  const [carDetails, setCarDetails] = useState(null);
  const [ownerDetails, setOwnerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingSeats, setBookingSeats] = useState(1);
  const [bookingMessage, setBookingMessage] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [hasBooking, setHasBooking] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchRideAndRelatedData() {
      try {
        const docRef = doc(db, "rides", rideId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          notFound();
        }

        const rideData = docSnap.data();
        setRide(rideData);

        // Fetch car details
        if (rideData.carId) {
          const carRef = doc(db, "cars", rideData.carId);
          const carSnap = await getDoc(carRef);
          if (carSnap.exists()) {
            setCarDetails(carSnap.data());
          }
        }

        // Fetch owner details
        if (rideData.ownerId) {
          const ownerRef = doc(db, "users", rideData.ownerId);
          const ownerSnap = await getDoc(ownerRef);
          if (ownerSnap.exists()) {
            setOwnerDetails(ownerSnap.data());
          }
        }

        // Check if user has already booked this ride
        if (user) {
          const bookingsRef = collection(db, "bookings");
          const q = query(
            bookingsRef,
            where("rideId", "==", rideId),
            where("riderId", "==", user.uid),
            where("status", "==", "active")
          );
          const bookingSnap = await getDocs(q);
          if (!bookingSnap.empty) {
            setHasBooking(true);
            setBookingId(bookingSnap.docs[0].id);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load ride details. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchRideAndRelatedData();
  }, [rideId, user]);

  const handleStartChat = async () => {
    if (!user) {
      setError("Please log in to start a chat.");
      return;
    }

    if (!ride) return;

    // Check if user has booked this ride
    if (!hasBooking && user.uid !== ride.ownerId) {
      setError("You need to book this ride before chatting with the owner.");
      return;
    }

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

    // Don't allow booking if user is the ride owner
    if (user.uid === ride.ownerId) {
      setBookingMessage("You cannot book your own ride.");
      setIsBooking(false);
      return;
    }

    // Don't allow booking if user already has a booking
    if (hasBooking) {
      setBookingMessage("You already have an active booking for this ride.");
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
      setHasBooking(true);
      const updatedDoc = await getDoc(doc(db, "rides", rideId));
      setRide(updatedDoc.data());

      // Refresh to get the booking ID
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef,
        where("rideId", "==", rideId),
        where("riderId", "==", user.uid),
        where("status", "==", "active")
      );
      const bookingSnap = await getDocs(q);
      if (!bookingSnap.empty) {
        setBookingId(bookingSnap.docs[0].id);
      }
    } else {
      setBookingMessage("Booking failed: " + result.message);
    }
    setIsBooking(false);
  };

  const handleCancelBooking = async () => {
    if (!bookingId || !user || !ride) return;

    setIsCancelling(true);
    try {
      // Get the booking to find out how many seats to return
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingSnap.data();
      const seatsToReturn = bookingData.seatsBooked;

      // Update the booking status
      await updateDoc(bookingRef, {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
      });

      // Return the seats to the ride
      const rideRef = doc(db, "rides", rideId);
      const rideSnap = await getDoc(rideRef);
      const rideData = rideSnap.data();

      await updateDoc(rideRef, {
        availableSeats: rideData.availableSeats + seatsToReturn,
      });

      // Create notification for ride owner
      const notificationsRef = collection(db, "notifications");
      await addDoc(notificationsRef, {
        userId: ride.ownerId,
        type: "cancellation",
        message: `A booking for ${seatsToReturn} seat(s) on your ride from ${ride.pickupCity} to ${ride.destinationCity} has been cancelled`,
        read: false,
        createdAt: serverTimestamp(),
        rideId: rideId,
      });

      // Update local state
      setHasBooking(false);
      setBookingId(null);
      setBookingMessage("Booking cancelled successfully");

      // Update ride data
      const updatedRideSnap = await getDoc(rideRef);
      setRide(updatedRideSnap.data());
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setBookingMessage("Failed to cancel booking: " + error.message);
    } finally {
      setIsCancelling(false);
    }
  };

  // Check if ride has ended
  const isRideEnded = ride && ["finished", "cancelled"].includes(ride.status);

  // Check if current date is past the end date
  const isRideExpired = ride && new Date() > new Date(ride.endDateTime);

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
        {/* Go Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center text-gray-600"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Back</span>
        </button>

        {(isRideEnded || isRideExpired) && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              This ride has {isRideEnded ? "ended" : "expired"} and is no longer
              available for booking.
            </p>
          </div>
        )}

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
              <div className="flex items-center text-black">
                <Calendar className="h-5 w-5 text-[#8163e9] mr-2" />
                <span>End: {new Date(ride.endDateTime).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Car and Owner Details */}
          {(carDetails || ownerDetails) && (
            <div className="border-b border-gray-200 p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {carDetails && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-black flex items-center">
                      <Car className="h-5 w-5 text-[#8163e9] mr-2" />
                      Car Details
                    </h2>
                    <div className="flex gap-4">
                      {carDetails.imageURLs &&
                        carDetails.imageURLs.length > 0 && (
                          <div className="w-24 h-24 relative rounded-lg overflow-hidden">
                            <img
                              src={
                                carDetails.imageURLs[0] || "/placeholder.svg"
                              }
                              alt={carDetails.carName}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                      <div>
                        <p className="font-medium text-black">
                          {carDetails.carName}
                        </p>
                        <p className="text-gray-600">{carDetails.model}</p>
                        <p className="text-gray-600">
                          License: {carDetails.carNumber}
                        </p>
                        <p className="text-gray-600">
                          Capacity: {carDetails.maxCapacity} seats
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {ownerDetails && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-black flex items-center">
                      <User className="h-5 w-5 text-[#8163e9] mr-2" />
                      Driver Details
                    </h2>
                    <div className="flex gap-4">
                      {ownerDetails.profilePicURL ? (
                        <div className="w-16 h-16 relative rounded-full overflow-hidden">
                          <img
                            src={
                              ownerDetails.profilePicURL || "/placeholder.svg"
                            }
                            alt={ownerDetails.name || "Driver"}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-black">
                          {ownerDetails.fullName || "Driver"}
                        </p>
                        {ownerDetails.university && (
                          <p className="text-gray-600">
                            {ownerDetails.university}
                          </p>
                        )}
                        {ownerDetails.location && (
                          <p className="text-gray-600">
                            {ownerDetails.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  {ride.pickupCity && (
                    <p className="text-sm text-gray-500">
                      City: {ride.pickupCity}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#8163e9] mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="text-lg font-medium text-black">
                    {ride.destinationLocation}
                  </p>
                  {ride.destinationCity && (
                    <p className="text-sm text-gray-500">
                      City: {ride.destinationCity}
                    </p>
                  )}
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

            {/* Booking Form - Only show if ride is not ended/expired and user is not the owner */}
            {!isRideEnded &&
              !isRideExpired &&
              user &&
              user.uid !== ride.ownerId && (
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold text-black mb-4">
                    Book Your Seats
                  </h2>
                  {hasBooking ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <p className="text-green-800">
                            you have booked this ride
                          </p>
                        </div>
                        <button
                          onClick={handleCancelBooking}
                          disabled={isCancelling}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <X className="h-4 w-4 mr-1" />
                          )}
                          Cancel Booking
                        </button>
                      </div>
                      {bookingMessage && (
                        <p
                          className={`text-sm ${
                            bookingMessage.includes("success") ||
                            bookingMessage.includes("cancelled successfully")
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {bookingMessage}
                        </p>
                      )}
                    </div>
                  ) : (
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
                            onChange={(e) =>
                              setBookingSeats(Number(e.target.value))
                            }
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#8163e9] focus:border-transparent text-black"
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
                  )}
                </div>
              )}

            {/* Chat Button - Only show if user has booked or is the owner */}
            {user &&
              (hasBooking || user.uid === ride.ownerId) &&
              !isRideEnded &&
              !isRideExpired && (
                <div className="border-t pt-6">
                  <button
                    onClick={handleStartChat}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-[#8163e9] text-[#8163e9] px-6 py-2 rounded-lg hover:bg-[#8163e9] hover:text-white transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Chat with {user.uid === ride.ownerId ? "Rider" : "Owner"}
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
