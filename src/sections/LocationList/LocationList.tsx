import { useEffect, useState } from "react";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import { useUnsplash } from "../../utils/useUnsplash";
import { identifyFood } from "../../utils/identifyFood";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { Images, Visit } from "../../utils/models";
import { Clock, User, Plus, ArrowUpDown, Filter } from "lucide-react";
import LocationDialog from "../../components/LocationDialog";
import {
  getBoundingBox,
  getMapCenter,
  getGoogleMapsLink,
  getWazeLink,
} from "../../utils/mapUtils";
import { getTimeAgo } from "../../utils/timeUtil";
import analyzeLocation from "../../utils/analyzeLocation";
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
import { useNavigate } from "react-router-dom";

interface LocationListProps {
  initialSelectedLocation?: any;
  clearSelectedLocation?: () => void;
}

// SortableLocationCard component that wraps LocationCard with drag functionality
const SortableLocationCard = ({
  location,
  image,
  isMobile,
  onClick,
  id,
  isDraggingDisabled,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
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
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const { currentUser } = useAuth();
  const [sortOption, setSortOption] = useState<SortOption>("custom");
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Add useEffect for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      const filteredLocations = locationsData.filter(
        (location) => location.userId === currentUser.uid
      );
      setLocations(getSortedLocations(filteredLocations));
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
      setSelectedLocation(initialSelectedLocation);
      setOpen(true);
      clearSelectedLocation?.();
    }
  }, [initialSelectedLocation, clearSelectedLocation]);

  // Save order to Firestore
  useEffect(() => {
    if (hasOrderChanged) {
      // Save the new order to Firestore
      const saveOrderToFirestore = async () => {
        try {
          // Update each document with its new index
          const updatePromises = locations.map((location, index) => {
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

  // Add this loading animation component within your LocationList component
  const LoadingAnimation = () => (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 mb-8">
        {/* Circular spinner */}
        <div className="absolute inset-0 rounded-full border-t-4 border-green-400 animate-spin"></div>
        <div className="absolute inset-0 rounded-full border-r-4 border-t-4 border-blue-500 animate-spin-slow"></div>

        {/* Food icon in the middle */}
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          🍽️
        </div>
      </div>
      <p className="text-gray-600 font-medium animate-pulse">
        Loading your food journey...
      </p>
    </div>
  );

  const handleClickOpen = async (location: any) => {
    setSelectedLocation(location);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedLocation(null);
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

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocations((items) => {
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
    setSortOption(option);
    setShowSortOptions(false);
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
      {locationLoading ? (
        <LoadingAnimation />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-4">
                Your Food Journey 🌟
              </h1>
              <p className="text-gray-600">
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
                  className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
                >
                  <Filter size={16} className="text-gray-600" />
                  <span className="font-medium text-gray-700">
                    Sort by: {sortOption === "custom" && "Custom Order"}
                    {sortOption === "mostRecent" && "Most Recent Visit"}
                    {sortOption === "leastRecent" && "Least Recent Visit"}
                    {sortOption === "mostVisited" && "Most Visited"}
                  </span>
                  <ArrowUpDown size={16} className="text-gray-600" />
                </button>

                {showSortOptions && (
                  <div className="absolute z-10 mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => handleSortChange("custom")}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          sortOption === "custom"
                            ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Custom Order {sortOption === "custom" && "✓"}
                        {sortOption === "custom" && (
                          <span className="block text-xs text-gray-500 mt-1">
                            Drag to reorder
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleSortChange("mostRecent")}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          sortOption === "mostRecent"
                            ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Most Recent Visit {sortOption === "mostRecent" && "✓"}
                      </button>

                      <button
                        onClick={() => handleSortChange("leastRecent")}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          sortOption === "leastRecent"
                            ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Least Recent Visit {sortOption === "leastRecent" && "✓"}
                      </button>

                      <button
                        onClick={() => handleSortChange("mostVisited")}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          sortOption === "mostVisited"
                            ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700 font-medium"
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

            {/* Location Grid */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {/* Add New Location Card */}
                <div
                  className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 cursor-pointer group hover:transform hover:scale-105 transition-all duration-300 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[330px]"
                  onClick={() => navigate("add")}
                >
                  <div className="text-gray-400 group-hover:text-green-500 transition-colors duration-300">
                    <Plus size={48} />
                  </div>
                  <p className="mt-4 text-gray-500 group-hover:text-green-600 font-medium">
                    Add New Location
                  </p>
                </div>

                <LocationDialog
                  open={open}
                  onClose={handleClose}
                  selectedFood={selectedLocation}
                  images={images}
                  getBoundingBox={getBoundingBox}
                  getMapCenter={getMapCenter}
                  getGoogleMapsLink={getGoogleMapsLink}
                  getWazeLink={getWazeLink}
                  onAddNewVisit={handleAddNewVisit}
                />

                {/* Sortable Location Cards */}
                <SortableContext
                  items={locations.map((loc) => loc.id)}
                  strategy={rectSortingStrategy}
                >
                  {locations.map((location) => (
                    <SortableLocationCard
                      key={location.id}
                      id={location.id}
                      location={location}
                      image={images[location.id]}
                      isMobile={isMobile}
                      onClick={() => handleClickOpen(location)}
                      isDraggingDisabled={sortOption !== "custom"}
                    />
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

            {/* Drag hint for custom sort */}
            {sortOption === "custom" && locations.length > 1 && (
              <div className="text-center mt-6 text-sm text-gray-500 animate-pulse">
                <p>Drag cards to reorder your food places</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LocationList;
