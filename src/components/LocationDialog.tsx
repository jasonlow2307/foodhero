import { useCallback, useEffect, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { Fullness, Visit } from "../utils/models";
import { Icon } from "@iconify/react";
import { X, Plus, Clock, Trash2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface LocationDialogProps {
  open: boolean;
  onClose: () => void;
  selectedFood: any;
  images: { [key: string]: string | null };
  getBoundingBox: (boundingBox: number[]) => string;
  getMapCenter: (boundingBox: number[]) => string;
  getGoogleMapsLink: (boundingBox: number[]) => string;
  getWazeLink: (boundingBox: number[]) => string;
  onAddNewVisit: (foodId: string, newFood: Visit) => Promise<void>;
}

interface FoodSuggestion {
  name: string;
  count: number;
}

const LocationDialog = ({
  open,
  onClose,
  selectedFood,
  images,
  getBoundingBox,
  getMapCenter,
  getGoogleMapsLink,
  getWazeLink,
  onAddNewVisit: onAddNewFood,
}: LocationDialogProps) => {
  const [localVisits, setLocalVisits] = useState<Visit[]>([]);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [newFood, setNewFood] = useState<Visit>({
    food: { "": 1 },
    date: Timestamp.now(),
    fullness: "perfect",
  });

  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeInput, setActiveInput] = useState<number | null>(null);

  const { darkMode } = useTheme();

  // Create memoized food suggestions from previous visits
  const foodSuggestions = useMemo(() => {
    if (!selectedFood?.visits) return [];

    const foodCounts = new Map<string, number>();

    selectedFood.visits.forEach((visit: Visit) => {
      Object.keys(visit.food).forEach((foodName) => {
        if (foodName.trim()) {
          foodCounts.set(foodName, (foodCounts.get(foodName) || 0) + 1);
        }
      });
    });

    return Array.from(foodCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [selectedFood?.visits]);

  // Update the food input field to include suggestions
  const renderFoodInputWithSuggestions = (name: string, index: number) => (
    <div className="relative flex-1">
      <input
        type="text"
        placeholder="Food name"
        value={name}
        onChange={(e) => handleFoodChange(name, e.target.value, "name")}
        onFocus={() => {
          setActiveInput(index);
          setShowSuggestions(true);
          setSuggestions(
            foodSuggestions.filter((s) =>
              s.name.toLowerCase().includes(name.toLowerCase())
            )
          );
        }}
        onBlur={() => {
          // Delay hiding suggestions to allow clicks to register
          setTimeout(() => {
            setShowSuggestions(false);
            setActiveInput(null);
          }, 200);
        }}
        className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
      />
      {showSuggestions && activeInput === index && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.name}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                handleFoodChange(name, suggestion.name, "name");
                setShowSuggestions(false);
              }}
            >
              <div className="font-medium">{suggestion.name}</div>
              <div className="text-xs text-gray-500">
                Ordered {suggestion.count} time{suggestion.count > 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Update useEffect to initialize localVisits when selectedFood changes
  useEffect(() => {
    if (selectedFood?.visits) {
      setLocalVisits(selectedFood.visits);
      console.log(selectedFood.visits);
    }
  }, [selectedFood]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  // Add click outside handler
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleNewFoodSubmit = async () => {
    if (Object.keys(newFood.food).length > 0) {
      // Optimistically update the UI
      setLocalVisits([...localVisits, newFood]);
      setIsAddingFood(false);

      try {
        // Attempt to update the backend
        await onAddNewFood(selectedFood.id, newFood);
        setNewFood({
          food: {},
          date: Timestamp.now(),
          fullness: "perfect",
        });
      } catch (error) {
        // If the backend update fails, revert the optimistic update
        setLocalVisits(localVisits);
        console.error("Failed to add new food:", error);
      }
    }
  };

  const handleAddFoodItem = () => {
    setNewFood({
      ...newFood,
      food: { ...newFood.food, "": 1 },
    });
  };
  // Update handleFoodChange
  const handleFoodChange = (
    key: string,
    value: string | number,
    type: "name" | "quantity"
  ) => {
    const updatedFood = { ...newFood.food };
    if (type === "name") {
      const oldValue = updatedFood[key];
      delete updatedFood[key];
      updatedFood[value as string] = oldValue;
    } else {
      const foodName = key || Object.keys(updatedFood)[0];
      updatedFood[foodName] = Number(value);
    }
    setNewFood({
      ...newFood,
      food: updatedFood,
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 md:p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        } rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="relative p-4 md:p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute right-4 md:right-6 top-4 md:top-6 text-gray-400 hover:text-gray-600 transition-colors hover:cursor-pointer"
          >
            <X size={24} />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            {selectedFood?.location}
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Image */}
          {images[selectedFood?.id] && (
            <div className="mb-4 md:mb-6 rounded-2xl overflow-hidden">
              <img
                src={images[selectedFood.id]}
                alt={selectedFood.location}
                className="w-full h-48 md:h-64 object-cover"
              />
            </div>
          )}

          {/* Map */}
          <h2 className="text-xl md:text-2xl font-bold text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
            Map
          </h2>
          <div className="mb-4 md:mb-6 rounded-2xl overflow-hidden h-48 md:h-64 bg-gray-100">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${getBoundingBox(
                selectedFood.selectedLocation.boundingBox
              )}&layer=mapnik&marker=${getMapCenter(
                selectedFood.selectedLocation.boundingBox
              )}`}
              className="w-full h-full"
            ></iframe>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4 md:mb-6">
            <a
              href={getGoogleMapsLink(
                selectedFood.selectedLocation.boundingBox
              )}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Icon
                icon="simple-icons:googlemaps"
                width="20"
                height="20"
                className="text-blue-600"
              />
              Google Maps
            </a>
            <a
              href={getWazeLink(selectedFood.selectedLocation.boundingBox)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Icon
                icon="mdi:waze"
                width="24"
                height="24"
                className="text-blue-600"
              />
              Waze
            </a>
          </div>

          {/* Add New Visit Button */}
          {!isAddingFood ? (
            <button
              onClick={() => setIsAddingFood(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 hover:cursor-pointer"
            >
              <Plus size={20} />
              Add New Visit
            </button>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Add New Food Items
              </h3>

              {/* Food Input Fields */}
              {Object.entries(newFood.food).map(([name, quantity], index) => (
                <div key={index} className="flex gap-3">
                  {renderFoodInputWithSuggestions(name, index)}
                  <input
                    type="number"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) =>
                      handleFoodChange(name, e.target.value, "quantity")
                    }
                    className="w-24 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updatedFood = { ...newFood.food };
                      delete updatedFood[name];
                      if (Object.keys(updatedFood).length === 0) {
                        updatedFood[""] = 1;
                      }
                      setNewFood({
                        ...newFood,
                        food: updatedFood,
                      });
                    }}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
                    disabled={Object.keys(newFood.food).length <= 1}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}

              {/* Fullness Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {["not enough", "perfect", "too much"].map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setNewFood({ ...newFood, fullness: level as Fullness })
                    }
                    className={`py-2 px-4 rounded-xl border-2 transition-all hover:cursor-pointer ${
                      newFood.fullness === level
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm: mt-10">
                <button
                  onClick={handleAddFoodItem}
                  className="flex-1 py-2 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-colors hover:cursor-pointer"
                >
                  Add Item
                </button>
                <button
                  onClick={handleNewFoodSubmit}
                  className="flex-1 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors hover:cursor-pointer"
                >
                  Save Visit
                </button>
                <button
                  onClick={() => setIsAddingFood(false)}
                  className="flex-1 py-2 rounded-xl border-2 border-red-200 text-red-500 hover:border-red-400 transition-colors hover:cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Visit History */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Previous Visits
            </h3>
            {[...localVisits]
              .sort((a, b) => {
                const dateA =
                  a.date instanceof Timestamp
                    ? a.date.seconds
                    : a.date.getTime() / 1000;
                const dateB =
                  b.date instanceof Timestamp
                    ? b.date.seconds
                    : b.date.getTime() / 1000;
                return dateB - dateA; // descending order
              })
              .map((visit, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-gray-50 space-y-2"
                >
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} />
                    <span>
                      {(visit.date instanceof Timestamp
                        ? new Date(visit.date.seconds * 1000)
                        : visit.date
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm
                  ${
                    visit.fullness === "perfect"
                      ? "bg-green-100 text-green-600"
                      : visit.fullness === "too much"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                  >
                    {visit.fullness === "perfect"
                      ? "😊 Just Right"
                      : visit.fullness === "too much"
                      ? "😅 Too Much"
                      : "😋 Not Enough"}
                  </div>

                  <div className="space-y-1">
                    {Object.entries(visit.food).map(([foodName, quantity]) => (
                      <div
                        key={foodName}
                        className="flex justify-between text-gray-600"
                      >
                        <span>{foodName}</span>
                        <span>×{quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDialog;
