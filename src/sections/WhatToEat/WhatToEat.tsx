import React, { useState, useEffect, useMemo } from "react";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import { useUnsplash } from "../../utils/useUnsplash";
import { identifyFood } from "../../utils/identifyFood";
import { Images, Visit } from "../../utils/models";
import { Clock, User, Shuffle, Map } from "lucide-react";
import LocationDialog from "../../components/LocationDialog";
import {
  getBoundingBox,
  getMapCenter,
  getGoogleMapsLink,
  getWazeLink,
} from "../../utils/mapUtils";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

const WhatToEat = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  // Replace the current locations fetching with filtered data
  const { data: allLocations, loading } = useFirestoreCollection("locations");

  const locations = useMemo(() => {
    if (!allLocations || !currentUser) return [];

    return allLocations.filter(
      (location) =>
        location.userId === currentUser.uid ||
        (location.sharedWith && location.sharedWith.includes(currentUser.uid))
    );
  }, [allLocations, currentUser]);

  const [images, setImages] = useState<Images>({});
  const { fetchUnsplashImage } = useUnsplash();
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Animation states
  const [animationStage, setAnimationStage] = useState("initial"); // "initial", "collecting", "stacked", "shuffling", "shuffled"
  const [animationProgress, setAnimationProgress] = useState(0); // 0-100 for transition animations
  const [drawnCard, setDrawnCard] = useState<any>(null);
  const [remainingCards, setRemainingCards] = useState<any[]>([]);
  const [_shuffledLocations, setShuffledLocations] = useState<any[]>([]);
  const [cardPositions, setCardPositions] = useState<any[]>([]); // To track card positions during animations
  // Add a responsive state based on window width
  const [isMobile, setIsMobile] = useState(false);

  const { darkMode } = useTheme();

  // Handle responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      const newImages: Images = {};
      for (const location of locations) {
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
      // Initialize cardPositions with initial locations
      setCardPositions(
        locations.map((loc, index) => ({
          ...loc,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          zIndex: locations.length - index,
          opacity: 1,
        }))
      );
      setRemainingCards([...locations]);
      setShuffledLocations([...locations]);
    }
  }, [locations]);

  // Initial animation to stack the cards
  useEffect(() => {
    if (animationStage === "initial" && locations.length > 0) {
      // Start the collecting animation after a brief delay
      const collectTimer = setTimeout(() => {
        setAnimationStage("collecting");

        // Animation to move cards to the center
        let progress = 0;
        const animateCollection = setInterval(() => {
          progress += 2;
          setAnimationProgress(progress);

          if (progress >= 100) {
            clearInterval(animateCollection);
            setAnimationStage("stacked");
          }
        }, 16); // ~60fps

        return () => {
          clearTimeout(collectTimer);
          clearInterval(animateCollection);
        };
      }, 1500);

      return () => clearTimeout(collectTimer);
    }
  }, [animationStage, locations]);

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedLocation(null);
  };

  const handleShuffleClick = () => {
    if (animationStage === "stacked") {
      // Start shuffle animation
      setAnimationStage("shuffling");

      // Create a copy for shuffling
      const shuffled = [...locations].sort(() => Math.random() - 0.5);

      // Animate the shuffle
      let progress = 0;
      const animateShuffle = setInterval(() => {
        progress += 2;

        // Update card positions with random movements during shuffle
        setCardPositions((prev) =>
          prev.map((card, index) => ({
            ...card,
            x: Math.sin(progress / 10 + index) * 20,
            y: Math.cos(progress / 15 + index) * 10,
            rotation: Math.sin(progress / 5 + index) * 15,
            scale: 0.95 + Math.sin(progress / 20) * 0.05,
          }))
        );

        setAnimationProgress(progress);

        if (progress >= 100) {
          clearInterval(animateShuffle);
          setShuffledLocations(shuffled);
          setRemainingCards(shuffled);
          setAnimationStage("shuffled");

          // Reset card positions to stacked formation
          setCardPositions(
            shuffled.map((loc, index) => ({
              ...loc,
              x: 0,
              y: 0,
              rotation: (index - Math.floor(shuffled.length / 2)) * 2,
              scale: 1,
              zIndex: shuffled.length - index,
              opacity: 1,
            }))
          );
        }
      }, 16);

      return () => clearInterval(animateShuffle);
    } else if (animationStage === "shuffled") {
      // Reshuffle
      setAnimationStage("shuffling");

      const shuffled = [...remainingCards].sort(() => Math.random() - 0.5);

      // Animate the reshuffle
      let progress = 0;
      const animateReshuffle = setInterval(() => {
        progress += 3;

        // Update card positions with random movements during shuffle
        setCardPositions((prev) =>
          prev.map((card, index) => ({
            ...card,
            x: Math.sin(progress / 10 + index) * 15,
            y: Math.cos(progress / 15 + index) * 8,
            rotation: Math.sin(progress / 5 + index) * 10,
            scale: 0.95 + Math.sin(progress / 20) * 0.05,
          }))
        );

        setAnimationProgress(progress);

        if (progress >= 100) {
          clearInterval(animateReshuffle);
          setRemainingCards(shuffled);
          setAnimationStage("shuffled");

          // Reset card positions to stacked formation
          setCardPositions(
            shuffled.map((loc, index) => ({
              ...loc,
              x: 0,
              y: 0,
              rotation: (index - Math.floor(shuffled.length / 2)) * 2,
              scale: 1,
              zIndex: shuffled.length - index,
              opacity: 1,
            }))
          );
        }
      }, 16);

      return () => clearInterval(animateReshuffle);
    }
  };

  const handleDrawCard = () => {
    if (remainingCards.length > 0) {
      const nextCard = remainingCards[0];
      setAnimationStage("drawing");

      // First, reset the drawn card position
      setDrawnCard(null);

      // Setup initial positions for animation
      setCardPositions(
        remainingCards.map((loc, index) => ({
          ...loc,
          x: 0,
          y: 0,
          rotation: (index - Math.floor(remainingCards.length / 2)) * 2,
          scale: 1,
          zIndex: remainingCards.length - index,
          opacity: 1,
        }))
      );

      let progress = 0;
      const animateDraw = setInterval(() => {
        progress += 2; // Slower animation
        setAnimationProgress(progress);

        // Animate the top card
        setCardPositions((prev) =>
          prev.map((card, index) => {
            if (index === 0) {
              // Top card flies up and grows slightly
              return {
                ...card,
                y: -(progress * 3), // Move up
                x: Math.sin(progress / 10) * 20, // Slight horizontal swing
                rotation: Math.sin(progress / 5) * 10, // Rotation animation
                scale: 1 + (progress / 100) * 0.1, // Slight grow effect
                opacity: 1 - (progress / 100) * 0.5, // Fade out effect
              };
            } else {
              // Other cards shift up slightly
              return {
                ...card,
                y: -(progress / 10),
                rotation: (index - 1 - Math.floor((prev.length - 1) / 2)) * 2,
                scale: 1,
                opacity: 1,
              };
            }
          })
        );

        if (progress >= 100) {
          clearInterval(animateDraw);
          setDrawnCard(nextCard);
          setRemainingCards(remainingCards.slice(1));
          setAnimationStage("drawn");
        }
      }, 16);

      return () => clearInterval(animateDraw);
    }
  };

  const handleReset = () => {
    setAnimationStage("resetting");

    // Animate the reset
    let progress = 0;
    const animateReset = setInterval(() => {
      progress += 5;
      setAnimationProgress(progress);

      if (progress >= 100) {
        clearInterval(animateReset);
        setAnimationStage("initial");
        setAnimationProgress(0);
        setDrawnCard(null);
        setRemainingCards([...locations]);
        setShuffledLocations([...locations]);
        setCardPositions(
          locations.map((loc, index) => ({
            ...loc,
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            zIndex: locations.length - index,
            opacity: 1,
          }))
        );
      }
    }, 16);

    return () => clearInterval(animateReset);
  };

  const handleAddNewVisit = async (foodId: string, newVisit: Visit) => {
    try {
      const locationRef = doc(db, "locations", foodId);
      const locationDoc = await getDoc(locationRef);

      if (locationDoc.exists()) {
        const currentData = locationDoc.data();
        const updatedVisit = Array.isArray(currentData.visits)
          ? [...currentData.visits, newVisit]
          : [currentData.visits, newVisit];

        await updateDoc(locationRef, {
          visits: updatedVisit,
        });
      }
    } catch (error) {
      console.error("Error adding new visit:", error);
    }
  };

  // Helper function to calculate card style based on animation stage
  const getCardStyle = (_card: any, index: number) => {
    if (animationStage === "initial") {
      // Grid layout styles will be handled by grid container
      return {};
    }

    if (animationStage === "collecting") {
      // Calculate position for each card moving from grid to center
      const gridCols =
        window.innerWidth >= 1280
          ? 4
          : window.innerWidth >= 1024
          ? 3
          : window.innerWidth >= 640
          ? 2
          : 1;
      const row = Math.floor(index / gridCols);
      const col = index % gridCols;

      // Start position (grid)
      const startX = (col - (gridCols - 1) / 2) * (isMobile ? 280 : 320);
      const startY =
        (row - Math.floor(locations.length / gridCols) / 2) *
        (isMobile ? 360 : 400);

      // End position (stacked)
      const endX = 0;
      const endY = 0;
      const endRotation = (index - Math.floor(locations.length / 2)) * 2;

      // Interpolate based on animation progress
      const progress = animationProgress / 100;
      const x = startX + (endX - startX) * progress;
      const y = startY + (endY - startY) * progress;
      const rotation = endRotation * progress;
      const scale = 1 - 0.15 * progress * (index > 2 ? 1 : 0);

      return {
        position: "absolute" as const,
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
        zIndex: locations.length - index,
        transition: "box-shadow 0.5s ease",
        boxShadow: `0px ${2 + index * 2}px ${4 + index * 2}px rgba(0,0,0,0.1)`,
      };
    }

    if (["stacked", "shuffled"].includes(animationStage)) {
      // For stacked cards, apply offset and rotation
      const card = cardPositions[index] || {};
      return {
        position: "absolute" as const,
        transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotation}deg) scale(${card.scale})`,
        zIndex: card.zIndex,
        opacity: card.opacity,
        transition:
          index > 2 ? "none" : "transform 0.3s ease, opacity 0.3s ease",
        boxShadow: `0px ${2 + index * 2}px ${4 + index * 2}px rgba(0,0,0,0.1)`,
      };
    }

    if (animationStage === "shuffling") {
      // During shuffling, positions come from cardPositions state
      const card = cardPositions[index] || {};
      return {
        position: "absolute" as const,
        transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotation}deg) scale(${card.scale})`,
        zIndex: locations.length - index,
        transition: "transform 0.1s ease", // Quick transitions during shuffle
        boxShadow: `0px ${2 + index * 2}px ${4 + index * 2}px rgba(0,0,0,0.1)`,
      };
    }

    if (animationStage === "drawing") {
      // Card drawing animation is handled in the event handler
      const card = cardPositions[index] || {};
      return {
        position: "absolute" as const,
        transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotation}deg) scale(${card.scale})`,
        zIndex: locations.length - index,
        opacity: card.opacity,
        transition: "transform 0.5s ease, opacity 0.5s ease",
        boxShadow: `0px ${2 + index * 2}px ${4 + index * 2}px rgba(0,0,0,0.1)`,
      };
    }

    return {};
  };

  useEffect(() => {
    console.log(animationStage);
  }, [animationStage]);

  // Get card dimensions based on screen size
  const getCardDimensions = () => {
    if (isMobile) {
      return { width: "w-72", height: "h-80" };
    }
    return { width: "w-80", height: "h-96" };
  };

  const cardDimensions = getCardDimensions();

  // Add a loading state
  if (loading) {
    return (
      <div
        className={`min-h-screen ${
          darkMode
            ? "bg-gradient-to-br from-gray-900 to-gray-800"
            : "bg-gradient-to-br from-green-100 to-blue-100"
        } flex items-center justify-center transition-colors duration-300`}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Loading your food options...
          </p>
        </div>
      </div>
    );
  }

  // Add an empty state if no locations are available
  if (locations.length === 0 && !loading) {
    return (
      <div
        className={`min-h-screen ${
          darkMode
            ? "bg-gradient-to-br from-gray-900 to-gray-800"
            : "bg-gradient-to-br from-green-100 to-blue-100"
        } py-4 sm:py-8 px-2 sm:px-4 overflow-hidden flex items-center justify-center transition-colors duration-300`}
      >
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🍽️</div>
          <h2
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-800"
            } mb-4`}
          >
            No Food Places Yet
          </h2>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mb-6`}>
            You haven't added any food places to your collection. Add some
            locations to start tracking your food journey!
          </p>
          <button
            onClick={() => navigate("/add")}
            className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity hover:cursor-pointer"
          >
            Add New Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-green-100 to-blue-100"
      } py-4 sm:py-8 px-2 sm:px-4 overflow-hidden transition-colors duration-300`}
    >
      {" "}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2 sm:mb-4">
            What To Eat Today? 🍽️
          </h1>
          <p
            className={`${
              darkMode ? "text-gray-300" : "text-gray-600"
            } mb-4 sm:mb-8 text-sm sm:text-base transition-colors duration-300`}
          >
            Shuffle your favorite places and let fate decide!
          </p>

          {/* Control buttons */}
          <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-8">
            <button
              onClick={handleShuffleClick}
              disabled={
                animationStage === "initial" ||
                animationStage === "collecting" ||
                animationStage === "shuffling" ||
                animationStage === "drawing"
              }
              className={`px-4 mb-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-2 text-sm sm:text-base font-medium transition-all hover:cursor-pointer ${
                animationStage === "initial" ||
                animationStage === "collecting" ||
                animationStage === "shuffling" ||
                animationStage === "drawing" ||
                animationStage === "drawn"
                  ? darkMode
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:opacity-90"
              }`}
            >
              <Shuffle size={isMobile ? 16 : 20} />
              {animationStage === "shuffled" ? "Reshuffle" : "Shuffle Cards"}
            </button>
          </div>
        </div>

        {/* Cards container */}
        <div className="relative h-[60vh] sm:h-[70vh] flex justify-center items-center">
          {/* Initial grid of all cards */}
          {animationStage === "initial" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full overflow-y-auto max-h-[70vh] pb-4 px-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } rounded-3xl p-4 sm:p-6 shadow-xl hover:transform hover:scale-105 transition-all duration-300`}
                >
                  {/* Location Image */}
                  <div
                    className={`h-36 sm:h-48 rounded-2xl ${
                      darkMode ? "bg-gray-700" : "bg-gray-100"
                    } mb-3 sm:mb-4 overflow-hidden`}
                  >
                    <img
                      src={images[location.id] || "/api/placeholder/400/320"}
                      alt={location.location}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/api/placeholder/400/320";
                      }}
                    />
                  </div>

                  {/* Location Details */}
                  <div className="space-y-2 sm:space-y-3">
                    <h3
                      className={`text-lg sm:text-xl font-semibold ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {location.location}
                    </h3>

                    <div
                      className={`flex items-center gap-2 ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      <User size={isMobile ? 14 : 16} />
                      <span className="text-xs sm:text-sm">
                        {location.name}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-2 ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      <Clock size={isMobile ? 14 : 16} />
                      <span className="text-xs sm:text-sm">
                        Previously visited
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Animating/Stacked cards */}
          {(animationStage === "collecting" ||
            animationStage === "stacked" ||
            animationStage === "shuffling" ||
            animationStage === "shuffled" ||
            animationStage === "drawing") &&
            !drawnCard && (
              <div
                className={`relative ${cardDimensions.width} ${cardDimensions.height} cursor-pointer`}
                onClick={
                  animationStage === "shuffled"
                    ? handleDrawCard
                    : animationStage === "stacked"
                    ? handleShuffleClick
                    : undefined
                }
              >
                {/* Render cards with animation */}
                {(animationStage === "collecting"
                  ? locations
                  : animationStage === "shuffling" ||
                    animationStage === "drawing"
                  ? cardPositions
                  : remainingCards
                )
                  .slice(
                    0,
                    animationStage === "collecting" ? locations.length : 5
                  )
                  .map((card, index) => (
                    <div
                      key={card.id}
                      style={getCardStyle(card, index)}
                      className={`${cardDimensions.width} ${
                        cardDimensions.height
                      } ${
                        darkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-100"
                      } rounded-3xl p-4 sm:p-6 shadow-xl transition-all border-2
                          ${
                            animationStage === "collecting"
                              ? "duration-500"
                              : animationStage === "shuffling"
                              ? "duration-100"
                              : "duration-300"
                          }`}
                    >
                      {/* Card back design */}
                      <div className="h-full w-full flex flex-col items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl mb-3 sm:mb-4 mx-auto">
                            {animationStage === "shuffled" ? (
                              <Map size={isMobile ? 32 : 40} />
                            ) : (
                              <Shuffle size={isMobile ? 32 : 40} />
                            )}
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                            {animationStage === "shuffled"
                              ? "Click to Draw"
                              : animationStage === "stacked"
                              ? "Click to Shuffle"
                              : animationStage === "shuffling"
                              ? "Shuffling..."
                              : "Organizing..."}
                          </h3>
                          {remainingCards.length > 0 &&
                            animationStage === "shuffled" && (
                              <p
                                className={`${
                                  darkMode ? "text-gray-400" : "text-gray-500"
                                } mt-2 text-sm`}
                              >
                                {remainingCards.length} places remaining
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

          {/* Drawn card */}
          {drawnCard && (
            <div className="flex flex-col items-center">
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-3xl p-4 sm:p-6 shadow-xl hover-gradient-shadow transition-all duration-300 hover:cursor-pointer ${
                  cardDimensions.width
                }`}
                onClick={() => handleLocationClick(drawnCard)}
                style={{
                  animation: "cardAppear 0.7s ease-out",
                  minWidth: isMobile ? "18rem" : "20rem", // Add minimum width
                }}
              >
                {/* Location Image */}
                <div
                  className={`h-36 sm:h-48 rounded-2xl ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  } mb-3 sm:mb-4 overflow-hidden`}
                >
                  <img
                    src={images[drawnCard.id] || "/api/placeholder/400/320"}
                    alt={drawnCard.location}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/api/placeholder/400/320";
                    }}
                  />
                </div>

                {/* Location Details */}
                <div className="space-y-2 sm:space-y-3">
                  <h3
                    className={`text-lg sm:text-xl font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {drawnCard.location}
                  </h3>
                  <div
                    className={`flex items-center gap-2 ${
                      darkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    <User size={isMobile ? 14 : 16} />
                    <span className="text-xs sm:text-sm">{drawnCard.name}</span>
                  </div>

                  {/* Visit Summary */}
                  <div
                    className={`mt-2 sm:mt-4 p-2 sm:p-3 ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    } rounded-xl`}
                  >
                    <div
                      className={`text-xs sm:text-sm ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Last order:
                      {Object.entries(drawnCard.visits[0].food).map(
                        ([item, quantity]: [string, string | number]) => (
                          <span
                            key={item}
                            className={`block mt-1 text-xs sm:text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-700"
                            }`}
                          >
                            {quantity}x {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Fullness Indicator */}
                  <div
                    className={`mt-2 inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm
                  ${
                    drawnCard.visits[0].fullness === "perfect"
                      ? darkMode
                        ? "bg-green-900/50 text-green-400"
                        : "bg-green-100 text-green-600"
                      : drawnCard.visits[0].fullness === "too much"
                      ? darkMode
                        ? "bg-red-900/50 text-red-400"
                        : "bg-red-100 text-red-600"
                      : darkMode
                      ? "bg-yellow-900/50 text-yellow-400"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                  >
                    {drawnCard.visits[0].fullness === "perfect"
                      ? "😊 Just Right"
                      : drawnCard.visits[0].fullness === "too much"
                      ? "😅 Too Full"
                      : "😋 Not Enough"}
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex gap-2 sm:gap-4 mb-8">
                <button
                  onClick={handleDrawCard}
                  disabled={remainingCards.length === 0}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-2 text-xs sm:text-base font-medium transition-all ${
                    remainingCards.length === 0
                      ? darkMode
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:opacity-90 hover:cursor-pointer"
                  }`}
                >
                  Draw Next Card
                </button>
                <button
                  onClick={handleReset}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl border-2 ${
                    darkMode
                      ? "border-gray-700 text-gray-300 hover:border-red-900/70 hover:text-red-400"
                      : "border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500"
                  } flex items-center gap-2 text-xs sm:text-base font-medium transition-all hover:cursor-pointer`}
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Location Dialog */}
      <LocationDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        selectedFood={selectedLocation}
        setSelectedFood={setSelectedLocation}
        images={images}
        getBoundingBox={getBoundingBox}
        getMapCenter={getMapCenter}
        getGoogleMapsLink={getGoogleMapsLink}
        getWazeLink={getWazeLink}
        onAddNewVisit={handleAddNewVisit}
      />
      {/* Add CSS animation for card appearance */}
      {/* Add CSS animation for card appearance with dark mode support */}
      <style>{`
      @keyframes cardAppear {
        0% {
          opacity: 0;
          transform: translateY(-50px) scale(0.8);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Add this hover style for the green-blue gradient shadow */
      .hover-gradient-shadow {
        transition: transform 0.3s ease, box-shadow 0.4s ease;
      }
      
      .hover-gradient-shadow:hover {
        transform: scale(1.05);
        box-shadow: ${
          darkMode
            ? "rgba(74, 222, 128, 0.25) -8px -8px 32px 8px, rgba(56, 189, 248, 0.25) 8px 8px 32px 8px"
            : "rgba(22, 163, 74, 0.35) -8px -8px 32px 8px, rgba(2, 132, 199, 0.35) 8px 8px 32px 8px"
        };
      }

      /* Improve scrolling on mobile */
      .overflow-y-auto {
        -webkit-overflow-scrolling: touch;
      }
    `}</style>
    </div>
  );
};

export default WhatToEat;
