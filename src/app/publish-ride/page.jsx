"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const PublishRide = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);

  // Form fields
  const [selectedCarId, setSelectedCarId] = useState("");
  const [availableSeats, setAvailableSeats] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [tollsIncluded, setTollsIncluded] = useState(false);
  const [tollPrice, setTollPrice] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [airConditioning, setAirConditioning] = useState(false);
  const [wifiAvailable, setWifiAvailable] = useState(false);
  const [status, setStatus] = useState("not_started"); // default status
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Optionally, you might later allow the driver to change the status via a select input.
  // For example, available statuses:
  // const statuses = [
  //   { value: "not_started", label: "Not Started" },
  //   { value: "waiting_for_customer", label: "Waiting for Customer" },
  //   { value: "started", label: "Started" },
  //   { value: "finished", label: "Finished" },
  //   { value: "cancelled", label: "Cancelled" },
  // ];

  // Fetch the user's cars
  useEffect(() => {
    if (!user) {
      setLoadingCars(false);
      // router.push("/login");
      return;
    }
    const q = query(collection(db, "cars"), where("ownerId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedCars = [];
        snapshot.forEach((doc) => {
          fetchedCars.push({ id: doc.id, ...doc.data() });
        });
        setCars(fetchedCars);
        setLoadingCars(false);
      },
      (error) => {
        console.error("Error fetching cars:", error);
        setLoadingCars(false);
      },
    );

    return () => unsubscribe();
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedCarId) {
      setMessage("Please select a car for your ride.");
      return;
    }
    if (!pickupLocation || !destinationLocation) {
      setMessage("Please fill in both pickup and destination locations.");
      return;
    }
    if (!startDateTime || !endDateTime) {
      setMessage("Please select both start and end date/time for the ride.");
      return;
    }

    const seats = Number(availableSeats);
    const price = Number(pricePerSeat);
    const toll = tollsIncluded ? Number(tollPrice) : 0;

    const selectedCar = cars.find((car) => car.id === selectedCarId);
    if (!selectedCar) {
      setMessage("Selected car not found.");
      return;
    }

    if (seats > Number(selectedCar.maxCapacity)) {
      setMessage(
        `Available seats cannot exceed car capacity of ${selectedCar.maxCapacity}.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const rideData = {
        ownerId: user.uid,
        carId: selectedCarId,
        availableSeats: seats,
        pricePerSeat: price,
        tollsIncluded,
        tollPrice: toll,
        pickupLocation,
        destinationLocation,
        startDateTime, // you may later convert this to a Firestore Timestamp if needed
        endDateTime, // you may later convert this to a Firestore Timestamp if needed
        airConditioning,
        wifiAvailable,
        status, // new status field
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "rides"), rideData);
      setMessage("Ride published successfully!");
      // Reset form fields
      setSelectedCarId("");
      setAvailableSeats("");
      setPricePerSeat("");
      setTollsIncluded(false);
      setTollPrice("");
      setPickupLocation("");
      setDestinationLocation("");
      setStartDateTime("");
      setEndDateTime("");
      setAirConditioning(false);
      setWifiAvailable(false);
      setStatus("not_started");
    } catch (error) {
      console.error("Error publishing ride:", error);
      setMessage("Error publishing ride. Please try again.");
    }
    setSubmitting(false);
  };

  if (authLoading || loadingCars) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8163e9]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-lg text-gray-600">
          Please log in to publish a ride.
        </p>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-lg text-gray-600">
          You must add a car before publishing a ride.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-[#8163e9] py-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
            Publish a Ride
          </h2>
        </div>

        <div className="p-6 md:p-8">
          {message && (
            <div
              className={`mb-6 text-center p-4 rounded-lg ${
                message.includes("success")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Select Car */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  Select Car
                </label>
                <select
                  value={selectedCarId}
                  onChange={(e) => setSelectedCarId(e.target.value)}
                  className="w-full p-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                  required
                >
                  <option value="">-- Choose a car --</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.carName} (Capacity: {car.maxCapacity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Available Seats */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Available Seats
                </label>
                <input
                  type="number"
                  value={availableSeats}
                  onChange={(e) => setAvailableSeats(e.target.value)}
                  className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                  required
                />
              </div>

              {/* Price Per Seat */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Price Per Seat
                </label>
                <input
                  type="number"
                  value={pricePerSeat}
                  onChange={(e) => setPricePerSeat(e.target.value)}
                  className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                  required
                />
              </div>

              {/* Tolls Section */}
              <div className="col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="tollsIncluded"
                    checked={tollsIncluded}
                    onChange={(e) => setTollsIncluded(e.target.checked)}
                    className="w-4 h-4 text-[#8163e9] border-gray-300 rounded focus:ring-[#8163e9]"
                  />
                  <label
                    htmlFor="tollsIncluded"
                    className="text-sm font-medium text-black"
                  >
                    Include Toll Price?
                  </label>
                </div>

                {tollsIncluded && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      Toll Price
                    </label>
                    <input
                      type="number"
                      value={tollPrice}
                      onChange={(e) => setTollPrice(e.target.value)}
                      className="w-full p-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Locations */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  Destination Location
                </label>
                <input
                  type="text"
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                  required
                />
              </div>

              {/* Start Date & Time */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                  required
                />
              </div>

              {/* End Date & Time */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8163e9] focus:border-transparent transition-colors"
                  required
                />
              </div>

              {/* Air Conditioning */}
              <div className="col-span-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="airConditioning"
                    checked={airConditioning}
                    onChange={(e) => setAirConditioning(e.target.checked)}
                    className="w-4 h-4 text-[#8163e9] border-gray-300 rounded focus:ring-[#8163e9]"
                  />
                  <label
                    htmlFor="airConditioning"
                    className="text-sm font-medium text-black"
                  >
                    Air Conditioning Available?
                  </label>
                </div>
              </div>

              {/* WiFi Available */}
              <div className="col-span-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="wifiAvailable"
                    checked={wifiAvailable}
                    onChange={(e) => setWifiAvailable(e.target.checked)}
                    className="w-4 h-4 text-[#8163e9] border-gray-300 rounded focus:ring-[#8163e9]"
                  />
                  <label
                    htmlFor="wifiAvailable"
                    className="text-sm font-medium text-black"
                  >
                    WiFi Available?
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#8163e9] hover:bg-[#6f51d9] text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Publishing Ride...
                </>
              ) : (
                "Publish Ride"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublishRide;
