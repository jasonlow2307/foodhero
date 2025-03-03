import React, { useState, useCallback, useEffect } from "react";
import { SelectChangeEvent } from "@mui/material";
import debounce from "lodash.debounce";
import Fuse from "fuse.js";
import useFirestoreWrite from "../../firebase/useFirestoreWrite";
import { useSnackbar } from "notistack";
import { Fullness, Location, LocationFormProp } from "../../utils/models";
import { Search, Camera, Trash2, PlusCircle, Send } from "lucide-react";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

interface Coordinates {
  latitude: number;
  longitude: number;
}

const LocationForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<LocationFormProp>({
    index: -1,
    name: "",
    userId: "",
    location: "",
    visits: [
      {
        food: { "": 1 },
        date: new Date(),
        fullness: "perfect",
      },
    ],
    selectedLocation: null,
  });
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const { writeData } = useFirestoreWrite();
  const { data: locationsData } = useFirestoreCollection("locations");

  const { darkMode } = useTheme();

  // Add new state for coordinates
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(
    null
  );

  // Update the handleFoodChange function to handle empty keys better
  const handleFoodChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    field: "name" | "quantity"
  ) => {
    const { value } = e.target;
    const updatedFood = { ...formData.visits[0].food };
    const foodKeys = Object.keys(updatedFood);
    const foodKey = foodKeys[index];

    if (field === "name") {
      const newKey = value;
      const currentValue = updatedFood[foodKey] || 1;
      delete updatedFood[foodKey];
      updatedFood[newKey] = currentValue;
    } else {
      const validValue = parseInt(value, 10);
      if (!isNaN(validValue) && validValue > 0) {
        updatedFood[foodKey] = validValue;
      }
    }

    setFormData({
      ...formData,
      visits: [
        {
          ...formData.visits[0],
          food: updatedFood,
        },
      ],
    });
  };

  const handleFullnessChange = (e: SelectChangeEvent<Fullness>) => {
    setFormData({
      ...formData,
      visits: [
        {
          ...formData.visits[0],
          fullness: e.target.value as Fullness,
        },
      ],
    });
  };

  // Update the handleAddFood function to handle empty keys
  const handleAddFood = () => {
    const currentVisit = formData?.visits[0];
    setFormData({
      ...formData,
      visits: [
        {
          food: {
            ...currentVisit.food,
            "": 1,
          },
          date: currentVisit.date,
          fullness: currentVisit.fullness,
        },
      ],
    });
  };

  // Add a handler for deleting food items
  const handleDeleteFood = (indexToDelete: number) => {
    const currentFood = { ...formData?.visits[0].food };
    const foodKeys = Object.keys(currentFood);

    if (foodKeys.length <= 1) return;

    delete currentFood[foodKeys[indexToDelete]];

    setFormData({
      ...formData,
      visits: [
        {
          food: currentFood,
          date: formData?.visits[0].date,
          fullness: formData?.visits[0].fullness,
        },
      ],
    });
  };

  function getNextIndex() {
    let maxIndex = -9999;
    locationsData
      .filter((location) => location.user == currentUser.uid)
      .map((location) => {
        if (location.index > maxIndex) {
          maxIndex = location.index;
        }
      });
    return maxIndex + 1;
  }

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formDataWithIndex: LocationFormProp = {
        ...formData,
        index: getNextIndex(),
        name: currentUser.displayName,
        userId: currentUser.uid,
      };
      await writeData("locations", formDataWithIndex);
      enqueueSnackbar("Location added successfully! 🎉", {
        variant: "success",
        autoHideDuration: 3000,
      });
      // Reset form
      setFormData({
        index: -1,
        name: "",
        userId: "",
        location: "",
        visits: [
          {
            food: { "": 1 },
            date: new Date(),
            fullness: "perfect",
          },
        ],
        selectedLocation: null,
      });
    } catch (error) {
      enqueueSnackbar("Failed to add food 😕", {
        variant: "error",
        autoHideDuration: 3000,
      });
      console.error("Error submitting form:", error);
    }
  };

  // Add useEffect for geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          enqueueSnackbar(
            "Location access denied. Results won't be sorted by distance.",
            {
              variant: "warning",
            }
          );
        }
      );
    }
  }, []);

  // Add distance calculation function
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Modify the handleLocationSearch function
  const handleLocationSearch = async (location: string) => {
    if (!location) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          location
        )}`
      );
      const data = await response.json();

      // Add distance to each location if user coordinates are available
      const resultsWithDistance = data.map((loc: any) => ({
        ...loc,
        distance: userCoordinates
          ? calculateDistance(
              userCoordinates.latitude,
              userCoordinates.longitude,
              parseFloat(loc.lat),
              parseFloat(loc.lon)
            )
          : null,
      }));

      // Sort by distance if available
      const sortedResults = resultsWithDistance.sort((a: any, b: any) => {
        // If either location has no distance, move it to the end
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        // Sort by ascending distance
        return a.distance - b.distance;
      });

      // Replace the fuzzy search section with this
      const fuzzyResults = sortedResults.filter((result) => {
        // Split location names into words
        const searchWords = location.toLowerCase().split(/[\s,]+/);
        const locationWords = result.display_name.toLowerCase().split(/[\s,]+/);

        // Check if any search word matches any part of the location name
        return searchWords.some((searchWord) =>
          locationWords.some(
            (locationWord) =>
              locationWord.includes(searchWord) ||
              searchWord.includes(locationWord)
          )
        );
      });

      // If no matches found, use Fuse.js with more flexible options
      if (fuzzyResults.length === 0) {
        const fuse = new Fuse(sortedResults, {
          keys: ["display_name"],
          threshold: 0.4, // More lenient matching
          distance: 100, // Allow matches to be further apart
          minMatchCharLength: 2, // Require at least 2 characters to match
        });
        const fuseResults = fuse.search(location).map((result) => result.item);
        setSearchResults(fuseResults as Location[]);
      } else {
        setSearchResults(fuzzyResults as Location[]);
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedHandleLocationSearch = useCallback(
    debounce((location: string) => handleLocationSearch(location), 300),
    [userCoordinates]
  );

  // For handling changes in form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "location") {
      debouncedHandleLocationSearch(value);
    }
  };

  const filterLocationAttributes = (location: any): Location => {
    return {
      place_id: location.place_id,
      display_name: location.display_name,
      boundingBox: location.boundingbox,
      lon: location.lon,
      lat: location.lat,
    };
  };

  const handleLocationSelect = (location: any) => {
    console.log("LOCATION", location);
    const filteredLocation = filterLocationAttributes(location);
    const displayName = location.display_name.includes(",")
      ? location.display_name.split(",")[0]
      : location.display_name.location;
    setFormData({
      ...formData,
      location: displayName,
      selectedLocation: filteredLocation,
    });
    setSearchResults([]);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-green-100 to-blue-100"
      } p-4`}
    >
      <div
        className={`w-full max-w-xl ${
          darkMode ? "bg-gray-800" : "bg-white"
        } rounded-3xl shadow-xl p-4 md:p-8 transition-all duration-300`}
        style={{
          boxShadow: darkMode
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.6)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Food Waste Hero 🌱
          </h1>
          <p
            className={`text-sm md:text-base ${
              darkMode ? "text-gray-300" : "text-gray-600"
            } mt-2`}
          >
            Track your portions, save the planet!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Name Input */}
          {/* <div className="relative">
            <input
              name="name"
              type="text"
              placeholder="Your Name"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none transition-colors"
              value={formData.name}
              onChange={handleChange}
            />
          </div> */}
          {/* Location Input */}
          <div className="relative">
            <input
              name="location"
              type="text"
              autoComplete="off"
              placeholder="Restaurant Location"
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                darkMode
                  ? "border-gray-700 bg-gray-700 text-white placeholder-gray-400"
                  : "border-gray-200 focus:border-green-400"
              } focus:outline-none transition-colors`}
              value={formData.location}
              onChange={handleChange}
            />
            <Search
              className={`absolute right-3 top-3 ${
                darkMode ? "text-gray-300" : "text-gray-400"
              }`}
              size={20}
            />
            {/* Add this section for search results */}
            {searchResults.length > 0 && formData.location && (
              <div
                className={`absolute z-10 w-full mt-1 ${
                  darkMode ? "bg-gray-700" : "bg-white"
                } rounded-xl shadow-lg border ${
                  darkMode ? "border-gray-600" : "border-gray-200"
                } max-h-60 overflow-y-auto`}
              >
                {" "}
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading...
                  </div>
                ) : (
                  searchResults.map((location) => (
                    <div
                      key={location.place_id}
                      onClick={() => handleLocationSelect(location)}
                      className={`px-4 py-3 ${
                        darkMode ? "hover:bg-gray-600" : "hover:bg-gray-50"
                      } cursor-pointer border-b last:border-b-0 transition-colors`}
                    >
                      <div
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {location.display_name.split(",")[0]}
                      </div>
                      <div className="flex justify-between items-center">
                        <div
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-500"
                          } truncate max-w-[80%]`}
                        >
                          {location.display_name.split(",").slice(1).join(",")}
                        </div>
                        {location.distance !== null && (
                          <div className="text-xs text-green-600 font-medium">
                            {location.distance < 1
                              ? `${Math.round(location.distance * 1000)}m`
                              : `${location.distance.toFixed(1)}km`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {/* Food Items Section */}
          <div className="space-y-2">
            <h2
              className={`text-xl font-semibold ${
                darkMode ? "text-white" : "text-gray-700"
              } flex items-center gap-2`}
            >
              <Camera className="text-green-400" size={24} />
              What are you ordering?
            </h2>

            {Object.entries(formData.visits[0].food).map(
              ([foodName, quantity], index) => (
                <div key={index} className="flex items-center gap-2 min-w-0">
                  <input
                    type="text"
                    placeholder="Food name"
                    value={foodName}
                    onChange={(e) => handleFoodChange(e, index, "name")}
                    className={`flex-1 min-w-0 px-3 py-2 text-sm md:text-base md:px-4 rounded-lg border-2 ${
                      darkMode
                        ? "border-gray-700 bg-gray-700 text-white placeholder-gray-400"
                        : "border-gray-200 focus:border-green-400"
                    } focus:outline-none`}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) => handleFoodChange(e, index, "quantity")}
                    className={`w-16 md:w-20 px-2 py-2 text-sm md:text-base rounded-lg border-2 ${
                      darkMode
                        ? "border-gray-700 bg-gray-700 text-white placeholder-gray-400"
                        : "border-gray-200 focus:border-green-400"
                    } focus:outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteFood(index)}
                    className={`p-1.5 md:p-2 text-red-400 ${
                      darkMode ? "hover:bg-red-900/50" : "hover:bg-red-50"
                    } rounded-lg transition-colors hover:cursor-pointer flex-shrink-0`}
                    disabled={Object.keys(formData.visits[0].food).length <= 1}
                  >
                    <Trash2 size={18} className="md:w-5 md:h-5" />
                  </button>
                </div>
              )
            )}
          </div>
          {/* Add Food Button */}
          <button
            type="button"
            onClick={handleAddFood}
            className={`w-full py-3 rounded-xl border-2 border-dashed ${
              darkMode
                ? "border-gray-700 text-gray-300 hover:border-green-600 hover:text-green-400"
                : "border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-500"
            } transition-colors flex items-center justify-center gap-2 hover:cursor-pointer`}
          >
            <PlusCircle size={20} />
            Add Another Item
          </button>
          {/* Fullness Level */}
          <div className="space-y-2">
            <label
              className={`${
                darkMode ? "text-white" : "text-gray-700"
              } font-medium`}
            >
              How full are you?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-2">
              {[
                {
                  value: "not enough",
                  label: "😋 Still Hungry",
                  color: "yellow",
                },
                { value: "perfect", label: "😊 Just Right", color: "green" },
                { value: "too much", label: "😅 Too Full", color: "red" },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    handleFullnessChange({
                      target: { value: value as Fullness, name: "fullness" },
                    } as SelectChangeEvent<Fullness>)
                  }
                  className={`py-2 px-4 rounded-xl border-2 transition-all hover:cursor-pointer ${
                    formData.visits[0].fullness === value
                      ? darkMode
                        ? color === "green"
                          ? "border-green-600 bg-green-900/30 text-green-400"
                          : color === "red"
                          ? "border-red-600 bg-red-900/30 text-red-400"
                          : "border-yellow-600 bg-yellow-900/30 text-yellow-400"
                        : color === "green"
                        ? "border-green-400 bg-green-50 text-green-600"
                        : color === "red"
                        ? "border-red-400 bg-red-50 text-red-600"
                        : "border-yellow-400 bg-yellow-50 text-yellow-600"
                      : darkMode
                      ? "border-gray-700 hover:border-gray-600 text-gray-300"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-3 md:py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 font-medium hover:cursor-pointer`}
            style={{
              boxShadow: darkMode
                ? "0 4px 12px rgba(74, 222, 128, 0.25)"
                : "0 4px 12px rgba(74, 222, 128, 0.15)",
            }}
          >
            <Send size={20} />
            Save My Order
          </button>
        </form>
      </div>
    </div>
  );
};

export default LocationForm;
