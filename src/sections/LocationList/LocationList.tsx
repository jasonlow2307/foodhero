import { useEffect, useState } from "react";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import { useUnsplash } from "../../utils/useUnsplash";
import { identifyFood } from "../../utils/identifyFood";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { Images, Visit } from "../../utils/models";
import { Clock, User, Plus } from "lucide-react";
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
interface LocationListProps {
  initialSelectedLocation?: any;
  clearSelectedLocation?: () => void;
  setPage;
}

const LocationList: React.FC<LocationListProps> = ({
  initialSelectedLocation,
  clearSelectedLocation,
  setPage,
}) => {
  const { data: locations } = useFirestoreCollection("locations");
  const [images, setImages] = useState<Images>({});
  const { fetchUnsplashImage } = useUnsplash();
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Add useEffect for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  const handleClickOpen = async (location: any) => {
    setSelectedLocation(location);
    setOpen(true);
    // try {
    //   const foodItems = location.visits.flatMap((visit: any) =>
    //     Object.keys(visit.food)
    //   );
    //   const analysis = await analyzeLocation(location.location, foodItems);
    //   console.log("Analysis", analysis);
    // } catch (error) {
    //   console.error("Failed to analyze location:", error);
    // }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-4">
            Your Food Journey 🌟
          </h1>
          <p className="text-gray-600">
            Tracking your favorite places and portions
          </p>
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Add New Location Card */}
          <div
            className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 cursor-pointer group hover:transform hover:scale-105 transition-all duration-300 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[330px]"
            onClick={() => setPage("add")}
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

          {/* Location Cards */}
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              image={images[location.id]}
              isMobile={isMobile}
              onClick={() => handleClickOpen(location)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationList;
