import React, { useState, useCallback } from "react";
import { SelectChangeEvent } from "@mui/material";
import debounce from "lodash.debounce";
import Fuse from "fuse.js";
import useFirestoreWrite from "../../firebase/useFirestoreWrite";
import { useSnackbar } from "notistack";
import { Fullness, Location, LocationFormProp } from "../../utils/models";
import { Search, Camera, Trash2, PlusCircle, Send } from "lucide-react";

const LocationForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState<LocationFormProp>({
    name: "",
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

  // For handling changes in form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "location") {
      debouncedHandleLocationSearch(value);
    }
  };

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

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await writeData("locations", formData);
      enqueueSnackbar("Location added successfully! 🎉", {
        variant: "success",
        autoHideDuration: 3000,
      });
      // Reset form
      setFormData({
        name: "",
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

      // Use fuse.js for fuzzy searching
      const fuse = new Fuse(data, {
        keys: ["display_name"],
        threshold: 0.2, // Adjust the threshold for more or less fuzzy matching
      });
      const fuzzyResults = fuse.search(location).map((result) => result.item);

      setSearchResults(fuzzyResults as Location[]);
      console.log(fuzzyResults);
    } catch (error) {
      console.error("Error fetching location data:", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedHandleLocationSearch = useCallback(
    debounce((location: string) => handleLocationSearch(location), 300),
    []
  );

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
    const filteredLocation = filterLocationAttributes(location);
    console.log(location.display_name);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100 p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Food Waste Hero 🌱
          </h1>
          <p className="text-gray-600 mt-2">
            Track your portions, save the planet!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="relative">
            <input
              name="name"
              type="text"
              placeholder="Your Name"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none transition-colors"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          {/* Location Input */}
          <div className="relative">
            <input
              name="location"
              type="text"
              autoComplete="off"
              placeholder="Restaurant Location"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none transition-colors"
              value={formData.location}
              onChange={handleChange}
            />
            <Search
              className="absolute right-3 top-3 text-gray-400"
              size={20}
            />

            {/* Add this section for search results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading...
                  </div>
                ) : (
                  searchResults.map((location) => (
                    <div
                      key={location.place_id}
                      onClick={() => handleLocationSelect(location)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-700">
                        {location.display_name.split(",")[0]}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {location.display_name.split(",").slice(1).join(",")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {/* Food Items Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Camera className="text-green-400" size={24} />
              What are you ordering?
            </h2>

            {Object.entries(formData.visits[0].food).map(
              ([foodName, quantity], index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Food name"
                    value={foodName}
                    onChange={(e) => handleFoodChange(e, index, "name")}
                    className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) => handleFoodChange(e, index, "quantity")}
                    className="w-20 px-2 py-2 rounded-lg border-2 border-gray-200 focus:border-green-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteFood(index)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
                    disabled={Object.keys(formData.visits[0].food).length <= 1}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )
            )}
          </div>
          {/* Fullness Level */}
          <div className="space-y-2">
            <label className="text-gray-700 font-medium">
              How full are you?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["not enough", "perfect", "too much"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    handleFullnessChange({
                      target: { value: level as Fullness, name: "fullness" },
                    } as SelectChangeEvent<Fullness>)
                  }
                  className={`py-2 px-4 rounded-xl border-2 transition-all hover:cursor-pointer ${
                    formData.visits[0].fullness === level
                      ? "border-green-400 bg-green-50 text-green-600"
                      : "border-gray-200 hover:border-green-200"
                  }`}
                >
                  {level === "not enough" && "😋 Still Hungry"}
                  {level === "perfect" && "😊 Just Right"}
                  {level === "too much" && "😅 Too Full"}
                </button>
              ))}
            </div>
          </div>
          {/* Add Food Button */}
          <button
            type="button"
            onClick={handleAddFood}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-500 transition-colors flex items-center justify-center gap-2 hover:cursor-pointer"
          >
            <PlusCircle size={20} />
            Add Another Item
          </button>
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium hover:cursor-pointer"
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
