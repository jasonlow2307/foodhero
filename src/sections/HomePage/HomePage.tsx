import React, { useState, useEffect } from "react";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import { useUnsplash } from "../../utils/useUnsplash";
import { identifyFood } from "../../utils/identifyFood";
import {
  ArrowRight,
  Utensils,
  Leaf,
  MapPin,
  CalendarCheck,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Images } from "../../utils/models";

const HomePage = ({ setPage }) => {
  const { data: locations, loading } = useFirestoreCollection("locations");
  const [images, setImages] = useState<Images>({});
  const { fetchUnsplashImage } = useUnsplash();
  const [stats, setStats] = useState({
    totalLocations: 0,
    perfectPortions: 0,
    savedMeals: 0,
    topLocation: "",
    averageFullness: "",
  });
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrollIndicatorVisible, setIsScrollIndicatorVisible] =
    useState(true);

  // Update the Recent Places Section
  useEffect(() => {
    const fetchImages = async () => {
      // First, sort locations by most recent visit
      const sortedLocations = [...locations].sort((a, b) => {
        // Get the latest visit date from each location
        const getLatestVisitTimestamp = (loc) => {
          if (!loc.visits || loc.visits.length === 0) return 0;

          // Find the visit with the latest timestamp
          return Math.max(
            ...loc.visits.map((visit) =>
              visit.date && visit.date.seconds ? visit.date.seconds : 0
            )
          );
        };

        const aLatest = getLatestVisitTimestamp(a);
        const bLatest = getLatestVisitTimestamp(b);

        // Sort in descending order (newest first)
        return bLatest - aLatest;
      });

      // Now fetch images for the most recent locations
      const newImages: Images = {};
      for (const location of sortedLocations.slice(0, 4)) {
        if (!images[location.id]) {
          const mainFood = identifyFood(location.location);
          const imageUrl = await fetchUnsplashImage(mainFood);
          newImages[location.id] = imageUrl;
        }
      }
      setImages((prevImages) => ({ ...prevImages, ...newImages }));
    };

    if (locations.length > 0) {
      fetchImages();
    }
  }, [locations]);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);

      // Hide scroll indicator after user has scrolled a bit
      if (position > 100) {
        setIsScrollIndicatorVisible(false);
      } else {
        setIsScrollIndicatorVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch hero image
  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        const image = await fetchUnsplashImage("healthy food plate");
        setHeroImage(image);
      } catch (error) {
        console.error("Error fetching hero image:", error);
      }
    };
    fetchHeroImage();
  }, []);

  // Calculate stats
  useEffect(() => {
    if (locations.length > 0) {
      let perfectCount = 0;
      let totalVisits = 0;
      let locationVisits = new Map();
      let fullnessValues = { perfect: 0, "too much": 0, "not enough": 0 };

      // Process all locations and visits
      locations.forEach((loc) => {
        if (loc.visits && loc.visits.length > 0) {
          totalVisits += loc.visits.length;
          locationVisits.set(
            loc.location,
            (locationVisits.get(loc.location) || 0) + loc.visits.length
          );

          loc.visits.forEach((visit) => {
            if (visit.fullness === "perfect") perfectCount++;
            fullnessValues[visit.fullness] =
              (fullnessValues[visit.fullness] || 0) + 1;
          });
        }
      });

      // Find top location
      let topLocation = "";
      let maxVisits = 0;
      locationVisits.forEach((visits, location) => {
        if (visits > maxVisits) {
          maxVisits = visits;
          topLocation = location;
        }
      });

      // Calculate average fullness
      let averageFullness = "perfect";
      if (totalVisits > 0) {
        const max = Math.max(
          fullnessValues["perfect"],
          fullnessValues["too much"],
          fullnessValues["not enough"]
        );
        averageFullness =
          Object.keys(fullnessValues).find(
            (key) => fullnessValues[key] === max
          ) || "perfect";
      }

      // Estimate saved meals (simplified calculation)
      const savedMeals = Math.floor(perfectCount * 0.5);

      setStats({
        totalLocations: locations.length,
        perfectPortions: perfectCount,
        savedMeals,
        topLocation,
        averageFullness,
      });
    }
  }, [locations]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border-t-4 border-green-400 animate-spin"></div>
        <div className="absolute inset-0 rounded-full border-r-4 border-transparent border-t-4 border-blue-500 animate-spin-slow"></div>
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          🍽️
        </div>
      </div>
      <p className="text-gray-600 font-medium animate-pulse">
        Loading your food journey...
      </p>
    </div>
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Parallax Effect - Optimized for mobile */}
      <div
        className="relative h-[100vh] sm:h-[90vh] flex items-center justify-center overflow-hidden"
        style={{
          background: heroImage
            ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url(${heroImage})`
            : "linear-gradient(to right, #22c55e, #0ea5e9)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Floating food emojis - hidden on very small screens */}
        <div className="absolute inset-0 pointer-events-none hidden xs:block">
          <div
            className="absolute text-4xl sm:text-5xl"
            style={{
              top: `${10 + scrollPosition * 0.05}%`,
              left: "10%",
              opacity: 0.7,
              transform: `translateY(${scrollPosition * -0.2}px)`,
            }}
          >
            🥗
          </div>
          <div
            className="absolute text-4xl sm:text-5xl"
            style={{
              top: `${20 + scrollPosition * 0.03}%`,
              right: "15%",
              opacity: 0.6,
              transform: `translateY(${scrollPosition * -0.3}px)`,
            }}
          >
            🍲
          </div>
          <div
            className="absolute text-4xl sm:text-5xl"
            style={{
              top: `${60 - scrollPosition * 0.04}%`,
              left: "20%",
              opacity: 0.8,
              transform: `translateY(${scrollPosition * -0.1}px)`,
            }}
          >
            🍱
          </div>
          <div
            className="absolute text-4xl sm:text-5xl"
            style={{
              top: `${50 - scrollPosition * 0.02}%`,
              right: "25%",
              opacity: 0.7,
              transform: `translateY(${scrollPosition * -0.25}px)`,
            }}
          >
            🥑
          </div>
        </div>

        <div className="container mx-auto px-4 z-10 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl xs:text-4xl md:text-6xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg">
              Reduce Food Waste, One Meal at a Time
            </h1>
            <p className="text-lg xs:text-xl md:text-2xl text-white mb-6 sm:mb-8 drop-shadow-md">
              Track your portions, save the planet, and never order too much
              again.
            </p>
            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => setPage("list")}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-white text-green-600 font-bold text-base sm:text-lg hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:cursor-pointer"
              >
                View Your Places
              </button>
              <button
                onClick={() => setPage("add")}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-base sm:text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:cursor-pointer"
              >
                Add New Visit
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator - only shown when near top of page */}
        {isScrollIndicatorVisible && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce text-white">
            <div className="flex flex-col items-center">
              <ChevronDown size={28} strokeWidth={2.5} />
              <span className="text-xs mt-1">Scroll</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Section - Mobile optimized */}
      <div className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl xs:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
            Your Food Waste Impact
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {/* Stat Cards - Made smaller on mobile */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 duration-300">
              <div className="mb-3 sm:mb-4 bg-green-100 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center">
                <MapPin className="text-green-500" size={20} />
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
                {stats.totalLocations}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Places Tracked
              </p>
            </div>

            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 duration-300">
              <div className="mb-3 sm:mb-4 bg-blue-100 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center">
                <Utensils className="text-blue-500" size={20} />
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
                {stats.perfectPortions}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Perfect Portions
              </p>
            </div>

            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 duration-300">
              <div className="mb-3 sm:mb-4 bg-green-100 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center">
                <Leaf className="text-green-500" size={20} />
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
                {stats.savedMeals}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">Meals Saved</p>
            </div>

            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 duration-300">
              <div className="mb-3 sm:mb-4 bg-blue-100 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center">
                <TrendingUp className="text-blue-500" size={20} />
              </div>
              <div className="flex items-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">
                  {stats.averageFullness === "perfect"
                    ? "😊 Just Right"
                    : stats.averageFullness === "too much"
                    ? "😅 Too Full"
                    : "😋 Not Enough"}
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                Average Fullness
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Places Section - Mobile optimized */}
      <div className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-8 sm:mb-12 gap-4 xs:gap-0">
            <h2 className="text-2xl xs:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              Recent Places
            </h2>
            <button
              onClick={() => setPage("list")}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-green-400 to-blue-400 text-white font-medium hover:opacity-90 transition-all hover:cursor-pointer"
            >
              View All <ArrowRight size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Horizontal scrolling on mobile, grid on larger screens */}
          <div className="flex overflow-x-auto pb-6 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 hide-scrollbar snap-x snap-mandatory">
            {locations
              .sort((a, b) => {
                // Get latest visit date
                const aLatestVisit = a.visits.reduce(
                  (latest, visit) =>
                    visit.date.seconds > latest ? visit.date.seconds : latest,
                  0
                );

                const bLatestVisit = b.visits.reduce(
                  (latest, visit) =>
                    visit.date.seconds > latest ? visit.date.seconds : latest,
                  0
                );

                return bLatestVisit - aLatestVisit;
              })
              .slice(0, 4)
              .map((location) => (
                <div
                  key={location.id}
                  className="flex-shrink-0 w-[280px] sm:w-auto snap-start sm:snap-align-none bg-white rounded-3xl p-4 sm:p-5 shadow-xl border border-gray-100 hover:transform hover:scale-105 transition-all duration-300 cursor-pointer mr-4 sm:mr-0"
                  onClick={() => setPage("list")}
                >
                  <div className="h-36 sm:h-48 rounded-2xl bg-gray-100 mb-3 sm:mb-4 overflow-hidden">
                    <img
                      src={images[location.id] || "/api/placeholder/400/320"}
                      alt={location.location}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 truncate">
                    {location.location}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-500 mb-2 sm:mb-3">
                    <Clock size={14} className="sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">
                      Last visit:{" "}
                      {new Date(
                        location.visits[location.visits.length - 1].date
                          .seconds * 1000
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm
                  ${
                    location.visits[location.visits.length - 1].fullness ===
                    "perfect"
                      ? "bg-green-100 text-green-600"
                      : location.visits[location.visits.length - 1].fullness ===
                        "too much"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                  >
                    {location.visits[location.visits.length - 1].fullness ===
                    "perfect"
                      ? "😊 Just Right"
                      : location.visits[location.visits.length - 1].fullness ===
                        "too much"
                      ? "😅 Too Full"
                      : "😋 Not Enough"}
                  </div>
                </div>
              ))}
          </div>

          {/* Scroll indicator for the horizontal scroll (mobile only) */}
          <div className="flex justify-center mt-4 sm:hidden">
            <div className="flex space-x-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full ${
                    i === 0 ? "w-6 bg-blue-500" : "w-2 bg-gray-300"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Mobile optimized */}
      <div className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-green-100 to-blue-100">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl xs:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-16 bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
            Why Use Food Waste Hero?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 duration-300">
              <div className="mb-4 sm:mb-6 bg-green-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center">
                <CalendarCheck className="text-green-500" size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
                Track Your Meals
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Keep a record of every restaurant visit and meal, so you'll
                always remember what and how much to order.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 duration-300">
              <div className="mb-4 sm:mb-6 bg-blue-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center">
                <BarChart3 className="text-blue-500" size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
                Optimize Portions
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Rate your fullness after each meal to help you order the perfect
                amount next time, reducing waste and saving money.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 duration-300">
              <div className="mb-4 sm:mb-6 bg-green-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center">
                <Users className="text-green-500" size={24} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
                Environmental Impact
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                By ordering just the right amount, you're helping reduce food
                waste and making a positive environmental impact.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - Mobile optimized */}
      <div className="py-12 sm:py-16 md:py-24 bg-gradient-to-r from-green-500 to-blue-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl xs:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Reduce Food Waste?
          </h2>
          <p className="text-base sm:text-xl text-white mb-6 sm:mb-10 max-w-2xl mx-auto">
            Join thousands of eco-conscious diners who are making a difference
            with every meal.
          </p>
          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => setPage("whatToEat")}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-white text-green-600 font-bold text-base sm:text-lg hover:bg-opacity-90 transition-all shadow-lg hover:cursor-pointer"
            >
              What To Eat Today?
            </button>
            <button
              onClick={() => setPage("add")}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-white/20 text-white border-2 border-white font-bold text-base sm:text-lg hover:bg-white/30 transition-all shadow-lg hover:cursor-pointer"
            >
              Add New Location
            </button>
          </div>
        </div>
      </div>

      {/* Footer - Mobile optimized */}
      <footer className="py-8 sm:py-10 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                Food Waste Hero 🌱
              </h2>
              <p className="text-sm sm:text-base text-gray-400">
                Track your portions, save the planet!
              </p>
            </div>
            <div className="flex gap-6 sm:gap-8">
              <a
                href="#"
                className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors"
              >
                About
              </a>
              <a
                href="#"
                className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            <p>
              © {new Date().getFullYear()} Food Waste Hero. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Add styles for animations and mobile optimization */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @keyframes spin-slow {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        /* Hide scrollbar but maintain functionality */
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        /* Extra small screens */
        @media (min-width: 475px) {
          .xs\\:flex-row {
            flex-direction: row;
          }
          .xs\\:items-center {
            align-items: center;
          }
          .xs\\:text-3xl {
            font-size: 1.875rem;
            line-height: 2.25rem;
          }
          .xs\\:text-4xl {
            font-size: 2.25rem;
            line-height: 2.5rem;
          }
          .xs\\:text-xl {
            font-size: 1.25rem;
            line-height: 1.75rem;
          }
          .xs\\:block {
            display: block;
          }
          .xs\\:gap-0 {
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
