import { useEffect, useMemo, useRef, useState } from "react";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import { useUnsplash } from "../../utils/useUnsplash";
import { identifyFood } from "../../utils/identifyFood";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { Images, Visit } from "../../utils/models";
import {
  Plus,
  ArrowUpDown,
  Filter,
  Check,
  Move,
  X,
  Share,
  Search,
} from "lucide-react";
import LocationDialog from "../../components/LocationDialog";
import {
  getBoundingBox,
  getMapCenter,
  getGoogleMapsLink,
  getWazeLink,
} from "../../utils/mapUtils";
import LocationCard from "../../components/LocationCard";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import Loader from "../../components/Loader";
import FilterRadio from "../../components/FilterRadio";
import SearchSuggestions from "../../components/SearchSuggestions";

interface LocationListProps {
  initialSelectedLocation?: any;
  clearSelectedLocation?: () => void;
}

const slideUpAnimation = `
  @keyframes slideUp {
    0% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0); }
  }
`;

const slideDownAnimation = `
  @keyframes slideDown {
    0% { transform: translateY(0); }
    50% { transform: translateY(10px); }
    100% { transform: translateY(0); }
  }
`;

// SortableLocationCard component that wraps LocationCard with drag functionality
// Update the SortableLocationCard component to merge custom styles with transform styles
const SortableLocationCard = ({
  location,
  image,
  isMobile,
  onClick,
  id,
  isDraggingDisabled,
  className = "",
  style = {}, // Add style prop with default empty object
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: isDraggingDisabled,
  });

  // Combine the DnD styles with any custom styles
  const mergedStyle = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    ...style, // Merge with custom style
  };

  return (
    <div
      ref={setNodeRef}
      style={mergedStyle}
      className={`relative ${className}`}
    >
      <LocationCard
        location={location}
        image={image}
        isMobile={isMobile}
        onClick={onClick}
        draggable={!isDraggingDisabled}
        isDragging={isDragging}
        dragHandleProps={
          isDraggingDisabled ? {} : { ...attributes, ...listeners }
        }
      />
    </div>
  );
};
// Sort options enum
type SortOption = "custom" | "mostRecent" | "leastRecent" | "mostVisited";

const LocationList: React.FC<LocationListProps> = ({
  initialSelectedLocation,
  clearSelectedLocation,
}) => {
  const navigate = useNavigate();
  const { data: locationsData, loading: locationLoading } =
    useFirestoreCollection("locations");
  const [locations, setLocations] = useState<any[]>([]);
  const [images, setImages] = useState<Images>({});
  const { fetchUnsplashImage } = useUnsplash();
  const [isMobile, setIsMobile] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const { currentUser } = useAuth();
  const [sortOption, setSortOption] = useState<SortOption>("custom");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [isMobileReorderMode, setIsMobileReorderMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animatingItems, setAnimatingItems] = useState({});
  const [filterMode, setFilterMode] = useState<"all" | "owned" | "shared">(
    "all"
  );
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const [prevFilterMode, setPrevFilterMode] = useState(filterMode);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const { darkMode } = useTheme();

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  const nodeRefs = useRef(new Map());

  // Make sure the map has a ref for each location
  locations.forEach((location) => {
    if (!nodeRefs.current.has(location.id)) {
      nodeRefs.current.set(location.id, React.createRef());
    }
  });

  const locationId = searchParams.get("id");
  const selectedLocation = useMemo(() => {
    if (!locationId) return null;
    return locations.find((loc) => loc.id === locationId);
  }, [locationId, locations]);

  // Add useEffect for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Add this useEffect near your other effects
  useEffect(() => {
    // Clear animation flags after animation completes
    const timer = setTimeout(() => {
      setLocations((locs) =>
        locs.map((loc) => ({
          ...loc,
          animateUp: false,
          animateDown: false,
        }))
      );
    }, 300); // Match this to your animation duration

    return () => clearTimeout(timer);
  }, [locations]);

  useEffect(() => {
    if (!isFilterTransitioning && !isTransitioning) {
      // Only update the filtered locations when we're not transitioning
      // This prevents the list from jumping during animations
      const newFilteredLocations = filterLocations(filterMode);
      // No need to setFilteredLocations here since we're using useMemo
    }
  }, [filterMode, isFilterTransitioning, isTransitioning]);

  const handleFilterChange = (newMode) => {
    if (newMode === filterMode) return;

    // Mark all items as "exiting"
    const allExiting = {};
    filteredLocations.forEach((location) => {
      allExiting[location.id] = "exiting";
    });
    setAnimatingItems(allExiting);

    // Start transition
    setIsFilterTransitioning(true);
    setPrevFilterMode(filterMode);

    // Give the browser a moment to process the exit animations
    setTimeout(() => {
      // Apply the new filter mode
      setFilterMode(newMode);

      // Mark all items as "entering" after filter applied
      setTimeout(() => {
        const allEntering = {};
        // We need to use the newly filtered locations here
        const newlyFilteredLocations = filterLocations(newMode);
        newlyFilteredLocations.forEach((location) => {
          allEntering[location.id] = "entering";
        });
        setAnimatingItems(allEntering);

        // Reset transition state after animations complete
        setTimeout(() => {
          setIsFilterTransitioning(false);
          setAnimatingItems({});
        }, 600);
      }, 50);
    }, 300);
  };

  const filterLocations = (mode) => {
    if (mode === "all") {
      return locations;
    } else if (mode === "owned") {
      return locations.filter(
        (location) => location.userId === currentUser.uid
      );
    } else {
      // Shared with me
      return locations.filter((location) => location.isShared);
    }
  };

  // Mobile reorder mode handlers
  const enableMobileReorderMode = () => {
    if (isMobile && sortOption === "custom") {
      setIsMobileReorderMode(true);
    }
  };

  const saveMobileReorder = () => {
    setIsMobileReorderMode(false);
    setHasOrderChanged(true);
  };

  const cancelMobileReorder = () => {
    // Reload original order from Firestore data
    if (locationsData.length > 0) {
      const filteredLocations = locationsData.filter(
        (location) => location.userId === currentUser.uid
      );
      setLocations(getSortedLocations(filteredLocations));
    }
    setIsMobileReorderMode(false);
  };

  const moveLocationUp = (index) => {
    if (index > 0) {
      setLocations((items) => {
        const newArray = [...items];
        [newArray[index], newArray[index - 1]] = [
          newArray[index - 1],
          newArray[index],
        ];
        // Re-assign indices and add animation flags
        return newArray.map((item, i) => ({
          ...item,
          index: i,
          animateUp: i === index - 1,
          animateDown: i === index,
          animationKey: Date.now(), // Add a unique key for animation tracking
        }));
      });
    }
  };

  const moveLocationDown = (index) => {
    if (index < locations.length - 1) {
      setLocations((items) => {
        const newArray = [...items];
        [newArray[index], newArray[index + 1]] = [
          newArray[index + 1],
          newArray[index],
        ];
        // Re-assign indices and add animation flags
        return newArray.map((item, i) => ({
          ...item,
          index: i,
          animateUp: i === index + 1,
          animateDown: i === index,
          animationKey: Date.now(), // Add a unique key for animation tracking
        }));
      });
    }
  };

  // Helper function to get the most recent visit date from a location
  const getMostRecentVisitDate = (location) => {
    if (!location.visits || location.visits.length === 0) return new Date(0);

    // Process dates properly, handling Firebase Timestamp format
    const dates = Array.isArray(location.visits)
      ? location.visits.map((visit) => {
          // Check if date is a Firebase Timestamp (has seconds and nanoseconds)
          if (visit.date && visit.date.seconds) {
            return new Date(visit.date.seconds * 1000);
          }
          // Otherwise try to parse as regular date
          return new Date(visit.date);
        })
      : [
          location.visits.date && location.visits.date.seconds
            ? new Date(location.visits.date.seconds * 1000)
            : new Date(location.visits.date),
        ];

    // Remove invalid dates (in case parsing failed)
    const validDates = dates.filter((date) => !isNaN(date.getTime()));

    // If no valid dates, return epoch
    if (validDates.length === 0) return new Date(0);

    return new Date(Math.max(...validDates.map((date) => date.getTime())));
  };

  // Helper function to get the visit count
  const getVisitCount = (location) => {
    if (!location.visits) return 0;
    return Array.isArray(location.visits) ? location.visits.length : 1;
  };

  // Apply sorting based on selected option
  const getSortedLocations = (locs) => {
    switch (sortOption) {
      case "mostRecent":
        return [...locs].sort(
          (a, b) =>
            getMostRecentVisitDate(b).getTime() -
            getMostRecentVisitDate(a).getTime()
        );
      case "leastRecent":
        return [...locs].sort(
          (a, b) =>
            getMostRecentVisitDate(a).getTime() -
            getMostRecentVisitDate(b).getTime()
        );
      case "mostVisited":
        return [...locs].sort((a, b) => getVisitCount(b) - getVisitCount(a));
      case "custom":
      default:
        return [...locs].sort((a, b) => {
          if (a.index !== undefined && b.index !== undefined) {
            return a.index - b.index;
          }
          if (a.index !== undefined) return -1;
          if (b.index !== undefined) return 1;
          return 0;
        });
    }
  };

  // Initialize locations from Firestore data
  useEffect(() => {
    if (locationsData.length > 0) {
      // Get locations owned by the current user
      const ownedLocations = locationsData.filter(
        (location) => location.userId === currentUser.uid
      );

      // Get locations shared with the current user
      const sharedLocations = locationsData
        .filter(
          (location) =>
            location.userId !== currentUser.uid &&
            location.sharedWith &&
            location.sharedWith.includes(currentUser.uid)
        )
        .map((location) => ({
          ...location,
          isShared: true, // Mark as shared for UI differentiation
        }));

      // Combine and sort
      const allLocations = [...ownedLocations, ...sharedLocations];
      setLocations(getSortedLocations(allLocations));
    }
  }, [locationsData, sortOption]);

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
    }
  }, [locations]);

  // Add effect to handle initial selected location
  useEffect(() => {
    if (initialSelectedLocation) {
      clearSelectedLocation?.();
    }
  }, [initialSelectedLocation, clearSelectedLocation]);

  // Save order to Firestore
  useEffect(() => {
    if (hasOrderChanged) {
      // Save the new order to Firestore
      const saveOrderToFirestore = async () => {
        try {
          // Filter to only update locations owned by the current user
          const ownedLocations = locations.filter(
            (location) => location.userId === currentUser.uid
          );

          // Update each owned document with its new index
          const updatePromises = ownedLocations.map((location, index) => {
            const locationRef = doc(db, "locations", location.id);
            return updateDoc(locationRef, { index });
          });

          await Promise.all(updatePromises);
          console.log("Order saved to Firestore");
        } catch (error) {
          console.error("Error saving order:", error);
        }
      };

      saveOrderToFirestore();
      setHasOrderChanged(false);
    }
  }, [hasOrderChanged, locations]);

  // Modify the rendering of locations to apply filtering
  const filteredLocations = useMemo(() => {
    if (filterMode === "all") {
      return locations;
    } else if (filterMode === "owned") {
      return locations.filter(
        (location) => location.userId === currentUser.uid
      );
    } else {
      // Shared with me
      return locations.filter((location) => location.isShared);
    }
  }, [locations, filterMode, currentUser.uid]);

  // Add this loading animation component within your LocationList component
  const LoadingAnimation = () => (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        darkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      <Loader />
      <p
        className={`mt-6 font-medium animate-pulse ${
          darkMode ? "text-gray-300" : "text-gray-600"
        }`}
      >
        Loading your food journey...
      </p>
    </div>
  );

  const handleClickOpen = (location: any) => {
    setSearchParams({ id: location.id });
  };

  // Update handleClose to use URL
  const handleClose = () => {
    setSearchParams({});
  };

  const handleAddNewVisit = async (foodId: string, newVisit: Visit) => {
    try {
      const locationRef = doc(db, "locations", foodId);
      const locationDoc = await getDoc(locationRef);

      // Sanitize the visit data to remove undefined values
      const sanitizedVisit = Object.fromEntries(
        Object.entries(newVisit).filter(([_, v]) => v !== undefined)
      );

      console.log("NEW", sanitizedVisit);

      if (locationDoc.exists()) {
        const currentData = locationDoc.data();
        const updatedVisit = Array.isArray(currentData.visits)
          ? [...currentData.visits, sanitizedVisit]
          : [currentData.visits, sanitizedVisit];

        await updateDoc(locationRef, {
          visits: updatedVisit,
        });
      }
    } catch (error) {
      console.error("Error adding new visit:", error);
    }
  };

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocations((items) => {
        // Find the locations being dragged and dropped
        const activeLocation = items.find((item) => item.id === active.id);
        const overLocation = items.find((item) => item.id === over.id);

        // Only allow reordering if both locations are owned by the current user
        if (
          !activeLocation?.userId ||
          !overLocation?.userId ||
          activeLocation.userId !== currentUser.uid ||
          overLocation.userId !== currentUser.uid
        ) {
          return items;
        }

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newArray = arrayMove(items, oldIndex, newIndex);

        // Assign new indices to all items
        const indexedArray = newArray.map((item, i) => ({
          ...item,
          index: i,
        }));

        setHasOrderChanged(true);
        return indexedArray;
      });
    }

    setActiveId(null);
  };

  // Find the active location
  const activeLocation = activeId
    ? locations.find((loc) => loc.id === activeId)
    : null;

  // Handle sort option change
  const handleSortChange = (option: SortOption) => {
    if (option === sortOption) {
      setShowSortOptions(false);
      return;
    }

    // Mark all items as "exiting"
    const allExiting = {};
    filteredLocations.forEach((location) => {
      allExiting[location.id] = "exiting";
    });
    setAnimatingItems(allExiting);

    // Close dropdown and start transition
    setShowSortOptions(false);
    setIsTransitioning(true);

    // Give the browser a moment to process the exit animations
    setTimeout(() => {
      // Apply the new sorting option
      setSortOption(option);

      // Mark all items as "entering" after sort applied
      setTimeout(() => {
        const allEntering = {};
        // We need to get the newly sorted and filtered locations
        const newlyFilteredLocations = filterLocations(filterMode);
        newlyFilteredLocations.forEach((location) => {
          allEntering[location.id] = "entering";
        });
        setAnimatingItems(allEntering);

        // Reset isTransitioning after animations complete
        setTimeout(() => {
          setIsTransitioning(false);
          setAnimatingItems({});
        }, 600);
      }, 50);
    }, 300);
  };

  // Add an empty state if no locations are available
  if (locations.length === 0 && !locationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 py-8 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            No Food Places Yet
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't added any food places to your collection. Add some
            locations to start tracking your food journey!
          </p>
          <button
            onClick={() => navigate("/add")}
            className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity hover: cursor-pointer"
          >
            Add New Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {slideUpAnimation}
        {slideDownAnimation}
        {`
  .sort-entering {
    animation: enterAnimation 0.5s forwards;
  }
  
  .sort-exiting {
    animation: exitAnimation 0.5s forwards;
  }
  
  @keyframes enterAnimation {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes exitAnimation {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
  }
  
  /* Add filter fade animation */
  .filter-fade-enter {
    opacity: 0;
    transform: translateY(10px);
  }
  
  .filter-fade-enter-active {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.3s ease-out, transform 0.3s ease-out;
  }
  
  .filter-fade-exit {
    opacity: 1;
  }
  
  .filter-fade-exit-active {
    opacity: 0;
    transition: opacity 0.3s ease-in;
  }
  `}
      </style>
      {locationLoading ? (
        <LoadingAnimation />
      ) : (
        <div
          className={`min-h-screen ${
            darkMode
              ? "bg-gray-900"
              : "bg-gradient-to-br from-green-100 to-blue-100"
          } py-8 px-4`}
        >
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-4">
                Your Food Journey 🌟
              </h1>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Tracking your favorite places and portions
              </p>
              {hasOrderChanged && (
                <p className="text-sm text-green-600 mt-2 animate-pulse">
                  Order updated! ✓
                </p>
              )}
            </div>

            {/* Sort Controls */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <button
                  onClick={() => setShowSortOptions(!showSortOptions)}
                  className={`flex items-center hover: cursor-pointer gap-2 px-4 py-2 ${
                    darkMode ? "bg-gray-800/70" : "bg-white/70"
                  } backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all duration-200 border ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <Filter
                    size={16}
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Sort by: {sortOption === "custom" && "Custom Order"}
                    {sortOption === "mostRecent" && "Most Recent Visit"}
                    {sortOption === "leastRecent" && "Least Recent Visit"}
                    {sortOption === "mostVisited" && "Most Visited"}
                  </span>
                  <ArrowUpDown
                    size={16}
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  />
                </button>

                {showSortOptions && (
                  <div
                    className={`absolute z-10 mt-2 w-56 rounded-xl ${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } shadow-lg border ${
                      darkMode ? "border-gray-700" : "border-gray-100"
                    } overflow-hidden`}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => handleSortChange("mostRecent")}
                        className={`hover: cursor-pointer w-full text-left px-4 py-2 text-sm ${
                          sortOption === "mostRecent"
                            ? darkMode
                              ? "bg-gradient-to-r from-green-900/70 to-blue-900/70 text-blue-400 font-medium"
                              : "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700 font-medium"
                            : darkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Most Recent {sortOption === "mostRecent" && "✓"}
                      </button>

                      <button
                        onClick={() => handleSortChange("leastRecent")}
                        className={`hover: cursor-pointer w-full text-left px-4 py-2 text-sm ${
                          sortOption === "leastRecent"
                            ? darkMode
                              ? "bg-gradient-to-r from-green-900/70 to-blue-900/70 text-blue-400 font-medium"
                              : "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700 font-medium"
                            : darkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Least Recent {sortOption === "leastRecent" && "✓"}
                      </button>

                      <button
                        onClick={() => handleSortChange("custom")}
                        className={`hover: cursor-pointer w-full text-left px-4 py-2 text-sm ${
                          sortOption === "custom"
                            ? darkMode
                              ? "bg-gradient-to-r from-green-900/70 to-blue-900/70 text-blue-400 font-medium"
                              : "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700 font-medium"
                            : darkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Custom Order {sortOption === "custom" && "✓"}
                      </button>

                      <button
                        onClick={() => handleSortChange("mostVisited")}
                        className={`hover: cursor-pointer w-full text-left px-4 py-2 text-sm ${
                          sortOption === "mostVisited"
                            ? darkMode
                              ? "bg-gradient-to-r from-green-900/70 to-blue-900/70 text-blue-400 font-medium"
                              : "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700 font-medium"
                            : darkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Most Visited {sortOption === "mostVisited" && "✓"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Reorder Controls - Only show for mobile + custom sort */}
            {isMobile &&
              sortOption === "custom" &&
              locations.length > 1 &&
              !isMobileReorderMode && (
                <div className="mb-4 flex justify-center">
                  <button
                    onClick={enableMobileReorderMode}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-blue-200"
                  >
                    <Move size={16} className="text-blue-600" />
                    <span className="font-medium text-blue-700">
                      Reorder Places
                    </span>
                  </button>
                </div>
              )}

            {/* Mobile Reorder Mode Controls */}
            {isMobileReorderMode && (
              <div className="mb-6">
                <div className="flex justify-center gap-3 mb-4">
                  <button
                    onClick={saveMobileReorder}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full shadow-md"
                  >
                    <Check size={16} />
                    <span>Save Order</span>
                  </button>
                  <button
                    onClick={cancelMobileReorder}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full shadow-md"
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                </div>
                <p className="text-center text-sm text-blue-600 font-medium">
                  Reorder Mode: Tap the arrows to reposition items
                </p>
              </div>
            )}

            <div className="flex justify-center mb-6">
              <FilterRadio value={filterMode} onChange={handleFilterChange} />
            </div>
            <div className="flex justify-center mb-6">
              <div className="ml-3">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:cursor-pointer"
                >
                  <Search size={16} className="text-gray-600" />
                  <span className="font-medium text-gray-700">Search</span>
                </button>
              </div>
            </div>

            {/* Search modal */}
            {isSearchOpen && (
              <SearchSuggestions
                locations={locations}
                onClose={() => setIsSearchOpen(false)}
              />
            )}

            {/* Location Grid */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 location-grid ${
                  isTransitioning || isFilterTransitioning ? "is-sorting" : ""
                }`}
              >
                {" "}
                {/* Add New Location Card */}
                {!isMobile && filterMode != "shared" && (
                  <div
                    className={`bg-white/50 backdrop-blur-sm rounded-3xl p-6 cursor-pointer group hover:transform hover:scale-105 transition-all duration-300 border-2 border-dashed ${
                      darkMode
                        ? "bg-gray-800/50 border-gray-700"
                        : "bg-white/50 border-gray-200"
                    } flex flex-col items-center justify-center min-h-[330px]`}
                    onClick={() => navigate("add")}
                  >
                    <div
                      className={`text-gray-400 group-hover:text-green-500 transition-colors duration-300`}
                    >
                      <Plus size={48} />
                    </div>
                    <p
                      className={`mt-4 ${
                        darkMode
                          ? "text-gray-300 group-hover:text-green-400"
                          : "text-gray-500 group-hover:text-green-600"
                      } font-medium`}
                    >
                      Add New Location
                    </p>
                  </div>
                )}
                {filterMode === "shared" && filteredLocations.length === 0 && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-center">
                    <div
                      className={`${
                        darkMode ? "bg-gray-800/70" : "bg-white/70"
                      } backdrop-blur-sm rounded-3xl p-8 max-w-md w-full text-center shadow-md`}
                    >
                      <div className="mb-4 flex justify-center">
                        <div
                          className={`p-4 rounded-full ${
                            darkMode ? "bg-blue-900/30" : "bg-blue-100"
                          }`}
                        >
                          <Share
                            size={32}
                            className={`${
                              darkMode ? "text-blue-400" : "text-blue-600"
                            }`}
                          />
                        </div>
                      </div>
                      <h3
                        className={`text-xl font-bold mb-2 ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        No Shared Locations Yet
                      </h3>
                      <p
                        className={`mb-6 ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Nobody has shared any food locations with you yet. When
                        someone shares a location, it will appear here.
                      </p>
                      <div className="flex flex-col items-center gap-4">
                        <button
                          onClick={() => handleFilterChange("owned")}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2 hover: cursor-pointer"
                        >
                          <span>View My Locations</span>
                        </button>
                        <button
                          onClick={() => handleFilterChange("all")}
                          className={`px-4 py-2 rounded-xl ${
                            darkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          } font-medium transition-colors hover: cursor-pointer`}
                        >
                          Show All Places
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {filterMode === "owned" &&
                  filteredLocations.length === 0 &&
                  !isMobile && (
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-center">
                      <div
                        className={`${
                          darkMode ? "bg-gray-800/70" : "bg-white/70"
                        } backdrop-blur-sm rounded-3xl p-8 max-w-md w-full text-center shadow-md`}
                      >
                        <div className="mb-4 flex justify-center">
                          <div
                            className={`p-4 rounded-full ${
                              darkMode ? "bg-green-900/30" : "bg-green-100"
                            }`}
                          >
                            <Plus
                              size={32}
                              className={`${
                                darkMode ? "text-green-400" : "text-green-600"
                              }`}
                            />
                          </div>
                        </div>
                        <h3
                          className={`text-xl font-bold mb-2 ${
                            darkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          No Food Places Yet
                        </h3>
                        <p
                          className={`mb-6 ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          You haven't added any food places to your collection.
                          Add some locations to start tracking your food
                          journey!
                        </p>
                        <button
                          onClick={() => navigate("add")}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                          <Plus size={18} />
                          <span>Add New Location</span>
                        </button>
                      </div>
                    </div>
                  )}
                <LocationDialog
                  open={!!locationId} // Dialog is open when there's an ID in URL
                  onClose={handleClose}
                  selectedFood={selectedLocation}
                  setSelectedFood={(location) => {
                    if (location) {
                      setSearchParams({ id: location.id });
                    } else {
                      setSearchParams({});
                    }
                  }}
                  images={images}
                  getBoundingBox={getBoundingBox}
                  getMapCenter={getMapCenter}
                  getGoogleMapsLink={getGoogleMapsLink}
                  getWazeLink={getWazeLink}
                  onAddNewVisit={handleAddNewVisit}
                />
                {/* Sortable Location Cards with TransitionGroup */}
                <SortableContext
                  items={filteredLocations.map((loc) => loc.id)}
                  strategy={rectSortingStrategy}
                >
                  {filteredLocations.map((location, index) => (
                    <div
                      key={`${location.id}-${sortOption}`}
                      className={`location-item ${
                        animatingItems[location.id] === "entering"
                          ? "sort-entering"
                          : animatingItems[location.id] === "exiting"
                          ? "sort-exiting"
                          : ""
                      }`}
                    >
                      <div className="relative">
                        {isMobileReorderMode && (
                          <div className="absolute -top-2 inset-x-0 flex justify-center z-10 gap-2">
                            <button
                              onClick={() => moveLocationUp(index)}
                              disabled={index === 0}
                              className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center ${
                                index === 0
                                  ? "bg-gray-200 text-gray-400"
                                  : "bg-blue-500 text-white"
                              }`}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveLocationDown(index)}
                              disabled={index === locations.length - 1}
                              className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center ${
                                index === locations.length - 1
                                  ? "bg-gray-200 text-gray-400"
                                  : "bg-blue-500 text-white"
                              }`}
                            >
                              ↓
                            </button>
                          </div>
                        )}
                        <SortableLocationCard
                          id={location.id}
                          location={location}
                          image={images[location.id]}
                          isMobile={isMobile}
                          onClick={() =>
                            !isMobileReorderMode && handleClickOpen(location)
                          }
                          isDraggingDisabled={
                            sortOption !== "custom" ||
                            (isMobile && isMobileReorderMode) ||
                            location.userId !== currentUser.uid // Disable dragging for shared locations
                          }
                          className={`transition-transform duration-300 ${
                            location.userId !== currentUser.uid
                              ? "shared-card"
                              : ""
                          }`}
                          style={{
                            animation: location.animateUp
                              ? "slideUp 0.3s ease-in-out"
                              : location.animateDown
                              ? "slideDown 0.3s ease-in-out"
                              : "",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </SortableContext>
              </div>

              {/* Drag Overlay - Shows the card while dragging */}
              <DragOverlay adjustScale={true}>
                {activeId && activeLocation ? (
                  <LocationCard
                    location={activeLocation}
                    image={images[activeId]}
                    isMobile={isMobile}
                    onClick={() => {}}
                    isDragging={true}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* Drag hint for custom sort - modified to account for mobile */}
            {sortOption === "custom" &&
              locations.length > 1 &&
              !isMobileReorderMode && (
                <div className="text-center mt-6 text-sm text-gray-500 animate-pulse">
                  <p>
                    {isMobile
                      ? "Tap 'Reorder Places' to arrange your food places"
                      : "Drag cards to reorder your food places"}
                  </p>
                </div>
              )}
          </div>
        </div>
      )}
    </>
  );
};

export default LocationList;
