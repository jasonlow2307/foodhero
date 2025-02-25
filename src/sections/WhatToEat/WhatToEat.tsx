import React, { useState, useEffect } from "react";
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

interface WhatToEatProps {
  setPage: (page: string) => void;
}

const WhatToEat: React.FC<WhatToEatProps> = ({ setPage }) => {
  const { data: locations, loading: locationLoading } =
    useFirestoreCollection("locations");
  const [images, setImages] = useState<Images>({});
  const { fetchUnsplashImage } = useUnsplash();
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Animation states
  const [animationStage, setAnimationStage] = useState("initial"); // "initial", "collecting", "stacked", "shuffling", "shuffled"
  const [animationProgress, setAnimationProgress] = useState(0); // 0-100 for transition animations
  const [drawnCard, setDrawnCard] = useState<any>(null);
  const [remainingCards, setRemainingCards] = useState<any[]>([]);
  const [shuffledLocations, setShuffledLocations] = useState<any[]>([]);
  const [cardPositions, setCardPositions] = useState<any[]>([]); // To track card positions during animations

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
    if (remainingCards.length > 0 && animationStage === "shuffled") {
      const card = remainingCards[0];

      // Animate drawing the card
      setAnimationStage("drawing");

      let progress = 0;
      const animateDraw = setInterval(() => {
        progress += 3;
        setAnimationProgress(progress);

        // Update the drawn card position
        setCardPositions((prev) =>
          prev.map((c, index) => {
            if (index === 0) {
              // Top card animation
              return {
                ...c,
                y: -(progress * 2),
                rotation: 0,
                scale: 1 + (progress / 100) * 0.1,
                opacity: 1,
              };
            } else {
              // Other cards subtle adjustment
              return {
                ...c,
                y: 0,
                rotation: (index - 1 - Math.floor((prev.length - 1) / 2)) * 2,
                scale: 1,
                opacity: 1,
              };
            }
          })
        );

        if (progress >= 100) {
          clearInterval(animateDraw);
          setDrawnCard(card);
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
  const getCardStyle = (card: any, index: number) => {
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
      const startX = (col - (gridCols - 1) / 2) * 320;
      const startY = (row - Math.floor(locations.length / gridCols) / 2) * 400;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-4">
            What To Eat Today? 🍽️
          </h1>
          <p className="text-gray-600 mb-8">
            Shuffle your favorite places and let fate decide!
          </p>

          {/* Control buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={handleShuffleClick}
              disabled={
                animationStage === "initial" ||
                animationStage === "collecting" ||
                animationStage === "shuffling" ||
                animationStage === "drawing"
              }
              className={`px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all hover: cursor-pointer ${
                animationStage === "initial" ||
                animationStage === "collecting" ||
                animationStage === "shuffling" ||
                animationStage === "drawing" ||
                animationStage === "drawn"
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:opacity-90"
              }`}
            >
              <Shuffle size={20} />
              {animationStage === "shuffled" ? "Reshuffle" : "Shuffle Cards"}
            </button>

            {/* {(animationStage === "shuffled" || animationStage === "drawn") && (
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500 flex items-center hover: cursor-pointer gap-2 font-medium transition-all"
              >
                Reset
              </button>
            )} */}
          </div>
        </div>

        {/* Cards container */}
        <div className="relative h-[70vh] flex justify-center items-center">
          {/* Initial grid of all cards */}
          {animationStage === "initial" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              {locations.map((location, index) => (
                <div
                  key={location.id}
                  className="bg-white rounded-3xl p-6 shadow-xl hover:transform hover:scale-105 transition-all duration-300"
                >
                  {/* Location Image */}
                  <div className="h-48 rounded-2xl bg-gray-100 mb-4 overflow-hidden">
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
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {location.location}
                    </h3>

                    <div className="flex items-center gap-2 text-gray-500">
                      <User size={16} />
                      <span className="text-sm">{location.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock size={16} />
                      <span className="text-sm">Previously visited</span>
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
                className={`relative w-80 h-96 cursor-pointer`}
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
                      className={`w-80 h-96 bg-white rounded-3xl p-6 shadow-xl transition-all border-2 border-gray-100
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
                          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl mb-4 mx-auto">
                            {animationStage === "shuffled" ? (
                              <Map size={40} />
                            ) : (
                              <Shuffle size={40} />
                            )}
                          </div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
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
                              <p className="text-gray-500 mt-2">
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
                className="bg-white rounded-3xl p-6 shadow-xl w-80 transform transition-all duration-500 hover:scale-105"
                onClick={() => handleLocationClick(drawnCard)}
              >
                {/* Location Image */}
                <div className="h-48 rounded-2xl bg-gray-100 mb-4 overflow-hidden">
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
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {drawnCard.location}
                  </h3>

                  <div className="flex items-center gap-2 text-gray-500">
                    <User size={16} />
                    <span className="text-sm">{drawnCard.name}</span>
                  </div>

                  {/* Visit Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-600">
                      Last order:
                      {Object.entries(drawnCard.visits[0].food).map(
                        ([item, quantity]: [string, string | number]) => (
                          <span key={item} className="block mt-1 text-gray-700">
                            {quantity}x {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Fullness Indicator */}
                  <div
                    className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm
                    ${
                      drawnCard.visits[0].fullness === "perfect"
                        ? "bg-green-100 text-green-600"
                        : drawnCard.visits[0].fullness === "too much"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {drawnCard.visits[0].fullness === "perfect"
                      ? "😊 Just Right"
                      : drawnCard.visits[0].fullness === "too much"
                      ? "😅 Too Much"
                      : "😋 Not Enough"}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleDrawCard}
                  disabled={remainingCards.length === 0}
                  className={`px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${
                    remainingCards.length === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:opacity-90"
                  }`}
                >
                  Draw Next Card
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500 flex items-center gap-2 font-medium transition-all"
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
        images={images}
        getBoundingBox={getBoundingBox}
        getMapCenter={getMapCenter}
        getGoogleMapsLink={getGoogleMapsLink}
        getWazeLink={getWazeLink}
        onAddNewVisit={handleAddNewVisit}
      />
    </div>
  );
};

export default WhatToEat;
