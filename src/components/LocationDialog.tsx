import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Fullness, Visit } from "../utils/models";
import { Icon } from "@iconify/react";
import { X, Plus, Clock, Trash2, Share, User } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { db } from "../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "notistack";

interface LocationDialogProps {
  open: boolean;
  onClose: () => void;
  selectedFood: any;
  setSelectedFood: (food: any) => void;
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
  setSelectedFood,
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

  const { enqueueSnackbar } = useSnackbar();

  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeInput, setActiveInput] = useState<number | null>(null);

  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [sharingEmail, setSharingEmail] = useState("");
  const [sharedUsers, setSharedUsers] = useState([]);

  const { currentUser } = useAuth();

  const { darkMode } = useTheme();

  // Add effect to load user details for shared users
  useEffect(() => {
    if (
      selectedFood &&
      selectedFood.sharedWith &&
      selectedFood.sharedWith.length > 0
    ) {
      const loadSharedUsers = async () => {
        try {
          const users = [];
          for (const userId of selectedFood.sharedWith) {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              users.push({
                id: userDoc.id,
                email: userDoc.data().email,
                displayName: userDoc.data().displayName,
                photoURL: userDoc.data().photoURL,
              });
            }
          }
          setSharedUsers(users);
        } catch (err) {
          console.error("Error loading shared users:", err);
        }
      };

      loadSharedUsers();
    } else {
      setSharedUsers([]);
    }
  }, [selectedFood]);

  // Function to remove sharing permission
  const removeSharing = async (userId) => {
    if (!selectedFood) return;

    try {
      const userToRemove = sharedUsers.find((user) => user.id === userId);
      const userEmail = userToRemove ? userToRemove.email : "user";

      const locationRef = doc(db, "locations", selectedFood.id);
      const locationDoc = await getDoc(locationRef);

      if (locationDoc.exists()) {
        const currentData = locationDoc.data();
        const updatedSharedWith = (currentData.sharedWith || []).filter(
          (id) => id !== userId
        );

        await updateDoc(locationRef, {
          sharedWith: updatedSharedWith,
        });

        // Update the local state
        setSharedUsers((prev) => prev.filter((user) => user.id !== userId));

        // Optional: Update the selected food object
        setSelectedFood((prev) => ({
          ...prev,
          sharedWith: updatedSharedWith,
        }));

        // Show success message
        enqueueSnackbar(`Sharing removed for ${userEmail}`, {
          variant: "success",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        });
      }
    } catch (error) {
      console.error("Error removing shared user:", error);
      enqueueSnackbar("Failed to remove user sharing. Please try again.", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
    }
  };

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

  // Add this function to handle the sharing logic
  const handleShareLocation = async () => {
    if (!sharingEmail || !selectedFood) return;

    try {
      // Check if user is trying to share with themselves
      if (sharingEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        enqueueSnackbar("You can't share a location with yourself", {
          variant: "warning",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        });
        return;
      }

      // First, find the user by email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", sharingEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No user found with that email
        enqueueSnackbar("No user found with that email address", {
          variant: "error",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        });
        return;
      }

      // Get the user ID
      const targetUserId = querySnapshot.docs[0].id;

      // Double-check we're not sharing with ourselves (by ID)
      if (targetUserId === currentUser.uid) {
        enqueueSnackbar("You can't share a location with yourself", {
          variant: "warning",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        });
        return;
      }

      // Update the location document
      const locationRef = doc(db, "locations", selectedFood.id);
      const locationDoc = await getDoc(locationRef);

      if (locationDoc.exists()) {
        const currentData = locationDoc.data();
        const currentSharedWith = currentData.sharedWith || [];

        // Prevent duplicate sharing
        if (currentSharedWith.includes(targetUserId)) {
          // already shared
          enqueueSnackbar(`Location already shared with ${sharingEmail}`, {
            variant: "info",
            anchorOrigin: { vertical: "bottom", horizontal: "center" },
          });
          setIsShareMenuOpen(false);
          setSharingEmail("");
          return;
        }

        // Add the new user to sharedWith array
        const updatedSharedWith = [...currentSharedWith, targetUserId];

        await updateDoc(locationRef, {
          sharedWith: updatedSharedWith,
        });

        setIsShareMenuOpen(false);
        setSharingEmail("");

        // Show success message
        enqueueSnackbar(`Location shared successfully with ${sharingEmail}`, {
          variant: "success",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        });
      }
    } catch (error) {
      console.error("Error sharing location:", error);
      enqueueSnackbar("Failed to share location. Please try again.", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
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
        <div
          className={`relative p-4 md:p-6 border-b ${
            darkMode ? "border-gray-700" : "border-gray-100"
          }`}
        >
          <button
            onClick={onClose}
            className={`absolute right-4 md:right-6 top-4 md:top-6 ${
              darkMode
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-400 hover:text-gray-600"
            } transition-colors hover:cursor-pointer`}
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
          <h2 className="text-xl md:text-2xl font-bold text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-4">
            Map
          </h2>
          <div className="mb-4 md:mb-6 rounded-2xl overflow-hidden h-48 md:h-64 bg-gray-100 dark:bg-gray-700">
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
              style={{
                filter: darkMode
                  ? "invert(0.85) hue-rotate(180deg) contrast(0.9) brightness(0.9)"
                  : "none",
              }}
            ></iframe>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4 md:mb-6">
            {selectedFood && selectedFood.userId === currentUser.uid && (
              <button
                onClick={() => setIsShareMenuOpen(true)}
                className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl 
      bg-gradient-to-r from-purple-500 to-indigo-600 text-white 
      shadow-md hover:shadow-lg transform hover:-translate-y-0.5 
      transition-all duration-300 hover:scale-105 font-medium"
              >
                <Share size={16} className="animate-pulse" />
                Share
              </button>
            )}
            <a
              href={getGoogleMapsLink(
                selectedFood.selectedLocation.boundingBox
              )}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                darkMode
                  ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              } transition-colors`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon
                icon="simple-icons:googlemaps"
                width="20"
                height="20"
                className={darkMode ? "text-blue-400" : "text-blue-600"}
              />
              Google Maps
            </a>
            <a
              href={getWazeLink(selectedFood.selectedLocation.boundingBox)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                darkMode
                  ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              } transition-colors`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon
                icon="mdi:waze"
                width="24"
                height="24"
                className={darkMode ? "text-blue-400" : "text-blue-600"}
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
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Add New Food Items
              </h3>

              {/* Food Input Fields */}
              {Object.entries(newFood.food).map(([name, quantity], index) => (
                <div key={index} className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Food name"
                      value={name}
                      onChange={(e) =>
                        handleFoodChange(name, e.target.value, "name")
                      }
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
                        setTimeout(() => {
                          setShowSuggestions(false);
                          setActiveInput(null);
                        }, 200);
                      }}
                      className={`w-full px-4 py-2 rounded-xl border-2 ${
                        darkMode
                          ? "border-gray-700 bg-gray-800 text-white focus:border-green-600"
                          : "border-gray-200 focus:border-green-400"
                      } focus:outline-none`}
                    />
                    {showSuggestions &&
                      activeInput === index &&
                      suggestions.length > 0 && (
                        <div
                          className={`absolute z-10 w-full mt-1 ${
                            darkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          } rounded-xl shadow-lg border max-h-48 overflow-y-auto`}
                        >
                          {suggestions.map((suggestion) => (
                            <div
                              key={suggestion.name}
                              className={`px-4 py-2 ${
                                darkMode
                                  ? "hover:bg-gray-700 text-white"
                                  : "hover:bg-gray-50 text-gray-800"
                              } cursor-pointer`}
                              onClick={() => {
                                handleFoodChange(name, suggestion.name, "name");
                                setShowSuggestions(false);
                              }}
                            >
                              <div className="font-medium">
                                {suggestion.name}
                              </div>
                              <div
                                className={`text-xs ${
                                  darkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Ordered {suggestion.count} time
                                {suggestion.count > 1 ? "s" : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) =>
                      handleFoodChange(name, e.target.value, "quantity")
                    }
                    className={`w-24 px-4 py-2 rounded-xl border-2 ${
                      darkMode
                        ? "border-gray-700 bg-gray-800 text-white focus:border-green-600"
                        : "border-gray-200 focus:border-green-400"
                    } focus:outline-none`}
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
                    className={`p-2 ${
                      darkMode
                        ? "text-red-400 hover:bg-red-900/30"
                        : "text-red-400 hover:bg-red-50"
                    } rounded-lg transition-colors hover:cursor-pointer`}
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
                        ? darkMode
                          ? "border-green-600 bg-green-900/30 text-green-400"
                          : "border-green-400 bg-green-50 text-green-600"
                        : darkMode
                        ? "border-gray-700 hover:border-green-700"
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
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-10">
                <button
                  onClick={handleAddFoodItem}
                  className={`flex-1 py-2 rounded-xl border-2 ${
                    darkMode
                      ? "border-gray-700 hover:border-green-600 text-gray-300"
                      : "border-gray-200 hover:border-green-400"
                  } transition-colors hover:cursor-pointer`}
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
                  className={`flex-1 py-2 rounded-xl border-2 ${
                    darkMode
                      ? "border-red-900/50 text-red-400 hover:border-red-700"
                      : "border-red-200 text-red-500 hover:border-red-400"
                  } transition-colors hover:cursor-pointer`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {/* Visit History */}
          <div className="mt-8 space-y-4">
            <h3
              className={`text-lg font-semibold ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
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
                  className={`p-4 rounded-xl ${
                    darkMode ? "bg-gray-700" : "bg-gray-50"
                  } space-y-2`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
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
              ? darkMode
                ? "bg-green-900/50 text-green-400"
                : "bg-green-100 text-green-600"
              : visit.fullness === "too much"
              ? darkMode
                ? "bg-red-900/50 text-red-400"
                : "bg-red-100 text-red-600"
              : darkMode
              ? "bg-yellow-900/50 text-yellow-400"
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
                        className={`flex justify-between ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <span>{foodName}</span>
                        <span>×{quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {selectedFood && selectedFood.userId === currentUser.uid && (
              <div className="mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                <h3
                  className={`text-sm font-medium mb-4 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Shared with
                </h3>

                {selectedFood.sharedWith &&
                selectedFood.sharedWith.length > 0 ? (
                  <div className="space-y-2">
                    {sharedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.email}
                              className="w-8 h-8 rounded-full object-cover border-2 border-white hover:shadow-md transition-shadow duration-300"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white hover:shadow-md transition-all duration-300">
                              <User size={16} />
                            </div>
                          )}
                          <span
                            className={`ml-2 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {user.email}
                          </span>
                        </div>
                        <button
                          onClick={() => removeSharing(user.id)}
                          className="text-red-500 hover:text-red-700 cursor-pointer p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          aria-label="Remove sharing"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Not shared with anyone yet
                  </p>
                )}
              </div>
            )}

            {/* Share Dialog */}
            {isShareMenuOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div
                  className={`m-4 p-6 rounded-2xl shadow-lg ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } max-w-md w-full`}
                >
                  <h3
                    className={`text-xl font-bold mb-4 ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Share this location
                  </h3>

                  {/* User email input */}
                  <div className="mb-4">
                    <label
                      htmlFor="share-email"
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Enter email to share with
                    </label>
                    <input
                      id="share-email"
                      type="email"
                      value={sharingEmail}
                      onChange={(e) => setSharingEmail(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg ${
                        darkMode
                          ? "bg-gray-700 text-white border-gray-600"
                          : "bg-white text-gray-800 border-gray-300"
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="friend@example.com"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsShareMenuOpen(false);
                        setSharingEmail("");
                      }}
                      className={`px-4 py-2 rounded-xl transition-colors hover:cursor-pointer ${
                        darkMode
                          ? "border border-gray-700 text-gray-300 hover:bg-gray-700"
                          : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleShareLocation}
                      disabled={!sharingEmail}
                      className={`px-4 py-2 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 text-white hover:opacity-90 transition-opacity hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDialog;
