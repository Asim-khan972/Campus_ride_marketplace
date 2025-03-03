"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  MapPin,
  Car,
  Search,
  Wind,
  Wifi,
  DollarSign,
  Users,
  Loader2,
  AlertCircle,
  X,
  Filter,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const extractCity = (address) => {
  const parts = address.split(",").map((part) => part.trim());
  return parts[parts.length > 2 ? parts.length - 2 : parts.length - 1];
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export default function Home() {
  const router = useRouter();
  const [searchForm, setSearchForm] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
  });
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyRides, setNearbyRides] = useState([]);
  const [profile, setProfile] = useState(null);
  // Filter states
  const [maxPrice, setMaxPrice] = useState("");
  const [minSeats, setMinSeats] = useState("");
  const [filterAirCond, setFilterAirCond] = useState(false);
  const [filterWifi, setFilterWifi] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsTO, setSuggestionsTO] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState("distance");
  const { user, loading: authLoading } = useAuth();

  const fromSuggestionsRef = useRef(null);
  const toSuggestionsRef = useRef(null);

  const fetchProfile = async () => {
    if (authLoading) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("No authenticated user found. Exiting...");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", currentUser.uid));

      if (userDoc.exists()) {
        const userProfile = { id: userDoc.id, ...userDoc.data() };

        setProfile(userProfile);

        if (userProfile.location) {
          fetchRidesForLocation(userProfile.location);
        } else {
          console.log("User has no saved location.");
        }
      } else {
        console.log("No profile found, redirecting to profile creation.");
        router.push("/profileform");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Error loading profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [authLoading, router]);

  const fetchRidesForLocation = async (location) => {
    console.log("location ", location);
    setLoading(true);
    try {
      const ridesRef = collection(db, "rides");
      const q = query(ridesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const fetchedRides = [];
      const cityName = extractCity(location).toLowerCase();

      querySnapshot.forEach((doc) => {
        const ride = { id: doc.id, ...doc.data() };
        // Only include rides not created by the current user
        if (ride.ownerId !== user?.uid) {
          const rideFromCity = extractCity(ride.pickupLocation).toLowerCase();
          if (
            rideFromCity.includes(cityName) ||
            cityName.includes(rideFromCity)
          ) {
            fetchedRides.push(ride);
          }
        }
      });

      setRides(fetchedRides);
      setFilteredRides(fetchedRides);
    } catch (err) {
      console.error("Error fetching rides:", err);
      setError("Failed to fetch rides. Please try again.");
    }
    setLoading(false);
  };

  const fetchNearbyRides = async () => {
    setLoading(true);
    try {
      const ridesRef = collection(db, "rides");
      const q = query(ridesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const fetchedRides = [];
      querySnapshot.forEach((doc) => {
        const ride = { id: doc.id, ...doc.data() };
        // Only include rides not created by the current user
        if (ride.ownerId !== user?.uid) {
          fetchedRides.push(ride);
        }
      });

      setRides(fetchedRides);
      setFilteredRides(fetchedRides);
    } catch (err) {
      console.error("Error fetching rides:", err);
      setError("Failed to fetch rides. Please try again.");
    }
    setLoading(false);
  };
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchForm.from === searchForm.to) {
      setError("Pickup and destination locations cannot be the same.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const fromCity = extractCity(searchForm.from);
      const toCity = extractCity(searchForm.to);

      const ridesRef = collection(db, "rides");
      const querySnapshot = await getDocs(ridesRef);

      const matchingRides = [];
      querySnapshot.forEach((doc) => {
        const ride = { id: doc.id, ...doc.data() };
        const rideFromCity = extractCity(ride.pickupLocation);
        const rideToCity = extractCity(ride.destinationLocation);

        if (
          rideFromCity.toLowerCase().includes(fromCity.toLowerCase()) &&
          rideToCity.toLowerCase().includes(toCity.toLowerCase())
        ) {
          matchingRides.push(ride);
        }
      });

      // Sort rides by proximity to exact pickup/dropoff locations if coordinates are available
      if (userLocation) {
        matchingRides.sort((a, b) => {
          const distanceA = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            a.pickupLat || 0,
            a.pickupLng || 0
          );
          const distanceB = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            b.pickupLat || 0,
            b.pickupLng || 0
          );
          return distanceA - distanceB;
        });
      }

      setRides(matchingRides);
      setFilteredRides(matchingRides);
    } catch (err) {
      console.error("Error searching rides:", err);
      setError("Failed to search rides. Please try again.");
    }
    setLoading(false);
  };

  const handleFilter = () => {
    let tempRides = [...rides];

    // Apply filters
    if (maxPrice) {
      tempRides = tempRides.filter(
        (ride) => Number(ride.pricePerSeat) <= Number(maxPrice)
      );
    }
    if (minSeats) {
      tempRides = tempRides.filter(
        (ride) => Number(ride.availableSeats) >= Number(minSeats)
      );
    }
    if (filterAirCond) {
      tempRides = tempRides.filter((ride) => ride.airConditioning === true);
    }
    if (filterWifi) {
      tempRides = tempRides.filter((ride) => ride.wifiAvailable === true);
    }

    // Apply sorting
    switch (sortBy) {
      case "price":
        tempRides.sort(
          (a, b) => Number(a.pricePerSeat) - Number(b.pricePerSeat)
        );
        break;
      case "date":
        tempRides.sort(
          (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
        );
        break;
      case "distance":
        if (userLocation) {
          tempRides.sort((a, b) => {
            const distanceA = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              a.pickupLat || 0,
              a.pickupLng || 0
            );
            const distanceB = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              b.pickupLat || 0,
              b.pickupLng || 0
            );
            return distanceA - distanceB;
          });
        }
        break;
    }

    setFilteredRides(tempRides);
    if (window.innerWidth < 768) {
      setIsFilterOpen(false);
    }
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

  const fetchSuggestions = async (input) => {
    if (!input) return setSuggestions([]);
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${input}&apiKey=a2564e175403446795b3090484ca787e`
      );
      const data = await response.json();
      console.log("data ", data);
      setSuggestions(
        data.features.map((feature) => feature.properties.formatted)
      );
      setShowFromSuggestions(true);
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
    }
  };

  const fetchSuggestionsTO = async (input) => {
    if (!input) return setSuggestionsTO([]);
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${input}&apiKey=a2564e175403446795b3090484ca787e`
      );
      const data = await response.json();
      setSuggestionsTO(
        data.features.map((feature) => feature.properties.formatted)
      );
      setShowToSuggestions(true);
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section */}
      <section className="bg-[#8163e9] py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={fromSuggestionsRef}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Leaving from..."
                    value={searchForm.from}
                    onChange={(e) => {
                      setSearchForm({ ...searchForm, from: e.target.value });
                      fetchSuggestions(e.target.value);
                    }}
                    className="w-full pl-10 pr-3 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white/50 bg-white/10 text-white placeholder-white/60"
                  />

                  {showFromSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setSearchForm({
                              ...searchForm,
                              from: suggestion,
                            });
                            setShowFromSuggestions(false);
                            setSuggestions([]);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900 text-sm"
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="relative" ref={toSuggestionsRef}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Going to..."
                    value={searchForm.to}
                    onChange={(e) => {
                      setSearchForm({ ...searchForm, to: e.target.value });
                      fetchSuggestionsTO(e.target.value);
                    }}
                    className="w-full pl-10 pr-3 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white/50 bg-white/10 text-white placeholder-white/60"
                  />
                  {showToSuggestions && suggestionsTO.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {suggestionsTO.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setSearchForm({ ...searchForm, to: suggestion });
                            setShowToSuggestions(false);
                            setSuggestionsTO([]);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900 text-sm"
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-white text-[#8163e9] py-3 px-6 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  Search Rides
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="bg-white/10 text-white py-3 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <Filter className="h-5 w-5" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters Sidebar */}
            <div
              className={`
              md:w-64 bg-white rounded-lg shadow-sm border border-gray-200
              ${
                isFilterOpen ? "fixed inset-0 z-50 p-6" : "hidden"
              } md:block md:static md:p-4
            `}
            >
              <div className="flex items-center justify-between mb-6 md:hidden">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#8163e9] text-black focus:border-transparent"
                  >
                    <option value="distance" className="text-black">
                      Distance
                    </option>
                    <option value="price" className="text-black">
                      Price
                    </option>
                    <option value="date" className="text-black">
                      Date
                    </option>
                  </select>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#8163e9] focus:border-transparent"
                      placeholder="No limit"
                    />
                  </div>
                </div>

                {/* Seats Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Seats
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={minSeats}
                      onChange={(e) => setMinSeats(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#8163e9] focus:border-transparent"
                      placeholder="Any"
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filterAirCond}
                        onChange={(e) => setFilterAirCond(e.target.checked)}
                        className="w-4 h-4 text-[#8163e9] border-gray-300 rounded focus:ring-[#8163e9]"
                      />
                      <span className="text-sm text-gray-600">
                        Air Conditioning
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filterWifi}
                        onChange={(e) => setFilterWifi(e.target.checked)}
                        className="w-4 h-4 text-[#8163e9] border-gray-300 rounded focus:ring-[#8163e9]"
                      />
                      <span className="text-sm text-gray-600">WiFi</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleFilter}
                  className="w-full bg-[#8163e9] text-white py-2 px-4 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Rides List */}
            <div className="flex-1">
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {searchForm.from && searchForm.to
                        ? "Search Results"
                        : "Available Rides"}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {filteredRides.length}{" "}
                      {filteredRides.length === 1 ? "ride" : "rides"} found
                    </span>
                  </div>

                  {filteredRides.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                      <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No rides found
                      </h3>
                      <p className="text-gray-500">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredRides.map((ride) => (
                        <Link key={ride.id} href={`/home/rides/${ride.id}`}>
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-[#8163e9] hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-[#8163e9]" />
                                  <span className="font-medium text-black">
                                    {ride.pickupLocation}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-[#8163e9]" />
                                  <span className="font-medium text-black">
                                    {ride.destinationLocation}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-[#8163e9]">
                                  ${ride.pricePerSeat}
                                </div>
                                <div className="text-sm text-gray-500">
                                  per seat
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {formatDateTime(ride.startDateTime)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{ride.availableSeats} seats left</span>
                              </div>
                              {ride.airConditioning && (
                                <div className="flex items-center gap-1">
                                  <Wind className="h-4 w-4" />
                                  <span>AC</span>
                                </div>
                              )}
                              {ride.wifiAvailable && (
                                <div className="flex items-center gap-1">
                                  <Wifi className="h-4 w-4" />
                                  <span>WiFi</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
