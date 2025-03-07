import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
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
    notes: "",
  });

  const { enqueueSnackbar } = useSnackbar();

  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeInput, setActiveInput] = useState<number | null>(null);

  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [sharingEmail, setSharingEmail] = useState("");
  const [sharedUsers, setSharedUsers] = useState([]);

  const [shareType, setShareType] = useState("user"); // 'user' or 'group'
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const [showGroupRemoveDialog, setShowGroupRemoveDialog] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [affectedGroups, setAffectedGroups] = useState([]);

  // Add these state variables
  const [isEditingVisit, setIsEditingVisit] = useState(false);
  const [editingVisitIndex, setEditingVisitIndex] = useState<number | null>(
    null
  );
  const [editVisitData, setEditVisitData] = useState<Visit | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) return;

        const groupIds = userDoc.data().groups || [];
        const groupsData = await Promise.all(
          groupIds.map(async (groupId) => {
            try {
              const groupDoc = await getDoc(doc(db, "groups", groupId));
              // Only return groups that exist and have required fields
              if (groupDoc.exists() && groupDoc.data().displayName) {
                return { id: groupDoc.id, ...groupDoc.data() };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching group ${groupId}:`, error);
              return null;
            }
          })
        );

        // Filter out any null values from failed or invalid groups
        const validGroups = groupsData.filter((group) => group !== null);
        setUserGroups(validGroups);
      } catch (error) {
        console.error("Error fetching user groups:", error);
      }
    };

    fetchUserGroups();
  }, [currentUser]);

  const handleStartEditVisit = (visit: Visit, index: number) => {
    console.log("START");
    setEditVisitData({
      ...visit,
      // Ensure date is properly handled with timestamp format
      date:
        visit.date instanceof Timestamp
          ? visit.date
          : Timestamp.fromDate(new Date(visit.date)),
    });
    setEditingVisitIndex(index);
    setIsEditingVisit(true);
    setIsAddingFood(false); // Close add form if open
  };

  const handleSaveEditedVisit = async () => {
    if (!editVisitData || editingVisitIndex === null) return;

    try {
      // Create a copy of visits array
      const updatedVisits = [...localVisits];
      updatedVisits[editingVisitIndex] = editVisitData;

      // Update local state first for immediate feedback
      setLocalVisits(updatedVisits);

      // Update Firestore
      const locationRef = doc(db, "locations", selectedFood.id);
      await updateDoc(locationRef, {
        visits: updatedVisits,
      });

      // Update selected food state
      setSelectedFood({
        ...selectedFood,
        visits: updatedVisits,
      });

      // Reset edit state
      setIsEditingVisit(false);
      setEditingVisitIndex(null);
      setEditVisitData(null);

      enqueueSnackbar("Visit updated successfully", {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
    } catch (error) {
      console.error("Error updating visit:", error);
      enqueueSnackbar("Failed to update visit", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
    }
  };

  const handleEditFoodChange = (
    key: string,
    value: string | number,
    type: "name" | "quantity"
  ) => {
    if (!editVisitData) return;

    const updatedFood = { ...editVisitData.food };

    if (type === "name") {
      const oldValue = updatedFood[key];
      delete updatedFood[key];
      updatedFood[value as string] = oldValue;
    } else {
      updatedFood[key] = Number(value);
    }

    setEditVisitData({
      ...editVisitData,
      food: updatedFood,
    });
  };

  const handleAddEditFoodItem = () => {
    if (!editVisitData) return;

    setEditVisitData({
      ...editVisitData,
      food: { ...editVisitData.food, "": 1 },
    });
  };

  const handleDeleteLocation = async () => {
    try {
      // Reference to location document
      const locationRef = doc(db, "locations", selectedFood.id);

      // If location is shared with groups, remove it from those groups
      if (selectedFood.sharedWith && selectedFood.sharedWith.length > 0) {
        // Get all groups
        const groupsQuery = query(collection(db, "groups"));
        const groupsSnapshot = await getDocs(groupsQuery);

        // Create an array of promises for group updates
        const groupUpdates = [];

        groupsSnapshot.forEach((groupDoc) => {
          const groupData = groupDoc.data();
          const sharedLocations = groupData.sharedLocations || [];

          // Check if this location is in the group's shared locations
          const hasSharedLocation = sharedLocations.some(
            (loc) => loc.locationId === selectedFood.id
          );

          if (hasSharedLocation) {
            // Filter out this location from the group's sharedLocations
            const updatedSharedLocations = sharedLocations.filter(
              (item) => item.locationId !== selectedFood.id
            );

            // Add update promise to array
            groupUpdates.push(
              updateDoc(doc(db, "groups", groupDoc.id), {
                sharedLocations: updatedSharedLocations,
              })
            );
          }
        });

        // Execute all group updates in parallel
        await Promise.all(groupUpdates);
      }

      // Delete the location document
      await deleteDoc(locationRef);

      // Show success message and close dialog
      enqueueSnackbar("Location deleted successfully", {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });

      // Close the dialog
      onClose();
    } catch (error) {
      console.error("Error deleting location:", error);
      enqueueSnackbar("Failed to delete location", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleRemoveSharingClick = async (userId) => {
    try {
      // Check if the user is part of any groups that have this location shared
      // With this more effective approach
      const groupsQuery = query(collection(db, "groups"));

      const groupsSnapshot = await getDocs(groupsQuery);
      const userGroups = [];

      // Filter manually in JavaScript
      groupsSnapshot.forEach((groupDoc) => {
        const groupData = groupDoc.data();
        const sharedLocations = groupData.sharedLocations || [];

        // Check if any location in this group matches our criteria
        const hasSharedLocation = sharedLocations.some(
          (loc) =>
            loc.locationId === selectedFood.id &&
            loc.sharedBy === currentUser.uid
        );

        if (
          hasSharedLocation &&
          groupData.members &&
          groupData.members.includes(userId)
        ) {
          userGroups.push({
            id: groupDoc.id,
            displayName: groupData.displayName,
          });
        }
      });

      if (userGroups.length > 0) {
        // Show dialog for confirmation
        setUserToRemove(userId);
        setAffectedGroups(userGroups);
        setShowGroupRemoveDialog(true);
      } else {
        // If not in any groups, proceed with normal removal
        await removeSharing(userId, false);
      }
    } catch (error) {
      console.error("Error checking group membership:", error);
      enqueueSnackbar("Failed to remove sharing", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
    }
  };

  // Update the removeSharing function to handle group removal
  const removeSharing = async (userId, removeFromGroups = false) => {
    try {
      const locationRef = doc(db, "locations", selectedFood.id);
      const locationDoc = await getDoc(locationRef);

      if (!locationDoc.exists()) {
        console.error("Location document not found");
        return;
      }

      const currentData = locationDoc.data();
      const updatedSharedWith = (currentData.sharedWith || []).filter(
        (id) => id !== userId
      );

      // Group updates handling
      const groupUpdates = [];

      if (removeFromGroups) {
        // Get all groups that have this location shared
        const groupsQuery = query(collection(db, "groups"));
        const groupsSnapshot = await getDocs(groupsQuery);

        groupsSnapshot.forEach((groupDoc) => {
          const groupData = groupDoc.data();
          const sharedLocations = groupData.sharedLocations || [];

          // Check if this group has the location shared
          const hasSharedLocation = sharedLocations.some(
            (loc) =>
              loc.locationId === selectedFood.id &&
              loc.sharedBy === currentUser.uid
          );

          // Only update groups that have the location shared AND the user is a member
          if (
            hasSharedLocation &&
            groupData.members &&
            groupData.members.includes(userId)
          ) {
            const updatedSharedLocations = sharedLocations.filter(
              (item) => item.locationId !== selectedFood.id
            );

            groupUpdates.push(
              updateDoc(doc(db, "groups", groupDoc.id), {
                sharedLocations: updatedSharedLocations,
              })
            );
          }
        });
      }

      // Update Firestore
      await Promise.all([
        updateDoc(locationRef, {
          sharedWith: updatedSharedWith,
        }),
        ...groupUpdates,
      ]);

      // Update local states
      setSelectedFood((prev) => ({
        ...prev,
        sharedWith: updatedSharedWith,
      }));

      setSharedUsers((prev) => prev.filter((user) => user.id !== userId));

      // Reset dialog state
      setShowGroupRemoveDialog(false);
      setUserToRemove(null);
      setAffectedGroups([]);

      // Show success message
      const removedUser = sharedUsers.find((user) => user.id === userId);
      enqueueSnackbar(
        removeFromGroups
          ? `Sharing removed for ${
              removedUser?.email || "user"
            } including group access`
          : `Sharing removed for ${removedUser?.email || "user"}`,
        {
          variant: "success",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        }
      );

      // Close dialog if no more shared users
      if (updatedSharedWith.length === 0) {
        setTimeout(() => onClose(), 100);
      }
    } catch (error) {
      console.error("Error removing shared user:", error);
      enqueueSnackbar("Failed to remove user sharing", {
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
    if (
      (!sharingEmail && shareType === "user") ||
      (!selectedGroupId && shareType === "group")
    )
      return;

    try {
      if (shareType === "user") {
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
      } else {
        // Group sharing logic
        const groupRef = doc(db, "groups", selectedGroupId);
        const groupDoc = await getDoc(groupRef);

        if (!groupDoc.exists()) {
          enqueueSnackbar("Group not found", { variant: "error" });
          return;
        }

        // Update location's sharedWith array
        const locationRef = doc(db, "locations", selectedFood.id);
        const locationDoc = await getDoc(locationRef);

        if (locationDoc.exists()) {
          const currentData = locationDoc.data();
          const currentSharedWith = currentData.sharedWith || [];
          const groupData = groupDoc.data();

          // Add filtered group members who aren't already shared with
          const memberIds = groupData.members.filter(
            (id) => id !== currentUser.uid
          );
          const newSharedWith = [
            ...new Set([...currentSharedWith, ...memberIds]),
          ];

          // Update both the location and the group
          await Promise.all([
            // Update location's sharedWith array
            updateDoc(locationRef, {
              sharedWith: newSharedWith,
            }),
            // Add location to group's sharedLocations array
            updateDoc(groupRef, {
              sharedLocations: arrayUnion({
                locationId: selectedFood.id,
                sharedBy: currentUser.uid,
                sharedAt: new Date(),
              }),
            }),
          ]);

          setIsShareMenuOpen(false);
          setSelectedGroupId("");

          enqueueSnackbar(
            `Location shared with group ${groupData.displayName}`,
            {
              variant: "success",
            }
          );
        }
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              {selectedFood?.location}
            </h2>
            <div className="flex items-center">
              {/* Only show delete button if user owns the location */}
              {selectedFood && selectedFood.userId === currentUser.uid && (
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className={`mr-4 ${
                    darkMode
                      ? "text-red-400 hover:text-red-300"
                      : "text-red-500 hover:text-red-700"
                  } transition-colors hover:cursor-pointer`}
                  title="Delete location"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className={`${
                  darkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-400 hover:text-gray-600"
                } transition-colors hover:cursor-pointer`}
              >
                <X size={24} />
              </button>
            </div>
          </div>
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
            {selectedFood?.selectedLocation ? (
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
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                No location data available
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4 md:mb-6">
            {selectedFood?.selectedLocation && (
              <>
                <a
                  href={getGoogleMapsLink(
                    selectedFood.selectedLocation.boundingBox
                  )}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                    darkMode
                      ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  } transition-colors hover:cursor-pointer`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon icon="simple-icons:googlemaps" width="20" height="20" />
                  Google Maps
                </a>
                <a
                  href={getWazeLink(selectedFood.selectedLocation.boundingBox)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                    darkMode
                      ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  } transition-colors hover:cursor-pointer`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon icon="mdi:waze" width="24" height="24" />
                  Waze
                </a>
              </>
            )}
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

              {/* Notes Input */}
              <div className="mt-4">
                <label
                  htmlFor="visit-notes"
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Notes (optional)
                </label>
                <textarea
                  id="visit-notes"
                  placeholder="Add any additional notes about your experience..."
                  value={newFood.notes || ""}
                  onChange={(e) =>
                    setNewFood({
                      ...newFood,
                      notes: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-xl border-2 min-h-[100px] ${
                    darkMode
                      ? "border-gray-700 bg-gray-800 text-white focus:border-green-600"
                      : "border-gray-200 focus:border-green-400"
                  } focus:outline-none`}
                />
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

            {isEditingVisit && editVisitData && (
              <div className="mb-6 p-4 rounded-xl border-2 border-blue-500/50 space-y-4">
                <h3
                  className={`text-lg font-semibold ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  Edit Visit
                </h3>

                {/* Food Input Fields */}
                {Object.entries(editVisitData.food).map(
                  ([name, quantity], index) => (
                    <div key={index} className="flex gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Food name"
                          value={name}
                          onChange={(e) =>
                            handleEditFoodChange(name, e.target.value, "name")
                          }
                          onFocus={() => {
                            setActiveInput(index + 100); // Use offset to differentiate from add form
                            setShowSuggestions(true);
                            setSuggestions(
                              foodSuggestions.filter((s) =>
                                s.name
                                  .toLowerCase()
                                  .includes(name.toLowerCase())
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
                              ? "border-gray-700 bg-gray-800 text-white focus:border-blue-600"
                              : "border-gray-200 focus:border-blue-400"
                          } focus:outline-none`}
                        />
                        {showSuggestions &&
                          activeInput === index + 100 &&
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
                                    handleEditFoodChange(
                                      name,
                                      suggestion.name,
                                      "name"
                                    );
                                    setShowSuggestions(false);
                                  }}
                                >
                                  <div className="font-medium">
                                    {suggestion.name}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      darkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
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
                          handleEditFoodChange(name, e.target.value, "quantity")
                        }
                        className={`w-24 px-4 py-2 rounded-xl border-2 ${
                          darkMode
                            ? "border-gray-700 bg-gray-800 text-white focus:border-blue-600"
                            : "border-gray-200 focus:border-blue-400"
                        } focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedFood = { ...editVisitData.food };
                          delete updatedFood[name];
                          if (Object.keys(updatedFood).length === 0) {
                            updatedFood[""] = 1;
                          }
                          setEditVisitData({
                            ...editVisitData,
                            food: updatedFood,
                          });
                        }}
                        className={`p-2 ${
                          darkMode
                            ? "text-red-400 hover:bg-red-900/30"
                            : "text-red-400 hover:bg-red-50"
                        } rounded-lg transition-colors hover:cursor-pointer`}
                        disabled={Object.keys(editVisitData.food).length <= 1}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )
                )}

                {/* Fullness Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {["not enough", "perfect", "too much"].map((level) => (
                    <button
                      key={level}
                      onClick={() =>
                        setEditVisitData({
                          ...editVisitData,
                          fullness: level as Fullness,
                        })
                      }
                      className={`py-2 px-4 rounded-xl border-2 transition-all hover:cursor-pointer ${
                        editVisitData.fullness === level
                          ? darkMode
                            ? "border-blue-600 bg-blue-900/30 text-blue-400"
                            : "border-blue-400 bg-blue-50 text-blue-600"
                          : darkMode
                          ? "border-gray-700 hover:border-blue-700"
                          : "border-gray-200 hover:border-blue-200"
                      }`}
                    >
                      {level === "not enough" && "😋 Still Hungry"}
                      {level === "perfect" && "😊 Just Right"}
                      {level === "too much" && "😅 Too Full"}
                    </button>
                  ))}
                </div>

                {/* Notes Input */}
                <div className="mt-4">
                  <label
                    htmlFor="edit-visit-notes"
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    id="edit-visit-notes"
                    placeholder="Add any additional notes about your experience..."
                    value={editVisitData.notes || ""}
                    onChange={(e) =>
                      setEditVisitData({
                        ...editVisitData,
                        notes: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2 rounded-xl border-2 min-h-[100px] ${
                      darkMode
                        ? "border-gray-700 bg-gray-800 text-white focus:border-blue-600"
                        : "border-gray-200 focus:border-blue-400"
                    } focus:outline-none`}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
                  <button
                    onClick={handleAddEditFoodItem}
                    className={`flex-1 py-2 rounded-xl border-2 ${
                      darkMode
                        ? "border-gray-700 hover:border-blue-600 text-gray-300"
                        : "border-gray-200 hover:border-blue-400"
                    } transition-colors hover:cursor-pointer`}
                  >
                    Add Item
                  </button>
                  <button
                    onClick={handleSaveEditedVisit}
                    className="flex-1 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors hover:cursor-pointer"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingVisit(false);
                      setEditingVisitIndex(null);
                      setEditVisitData(null);
                    }}
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
                  <div className="flex justify-between items-start">
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

                    {/* Edit button */}
                    {selectedFood &&
                      selectedFood.userId === currentUser.uid && (
                        <button
                          onClick={() => handleStartEditVisit(visit, index)}
                          className={`p-2 rounded-full ${
                            darkMode
                              ? "text-blue-400 hover:bg-blue-900/30"
                              : "text-blue-500 hover:bg-blue-50"
                          } transition-colors hover:cursor-pointer`}
                          title="Edit visit"
                        >
                          <Icon icon="lucide:edit" width="16" height="16" />
                        </button>
                      )}
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
                    {visit.notes && (
                      <div
                        className={`mt-2 pt-2 border-t ${
                          darkMode ? "border-gray-600" : "border-gray-200"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          <span className="font-medium">Notes:</span>{" "}
                          {visit.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {selectedFood && selectedFood.userId === currentUser.uid && (
              <div className="mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                {selectedFood && selectedFood.userId === currentUser.uid && (
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={() => setIsShareMenuOpen((prev) => !prev)}
                      className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl 
              bg-gradient-to-r from-purple-500 to-indigo-600 text-white 
              shadow-md hover:shadow-lg transform hover:-translate-y-0.5 
              transition-all duration-300 hover:scale-105 font-medium"
                    >
                      <Share size={16} className="animate-pulse" />
                      Share
                    </button>
                  </div>
                )}
                {/* Share Dialog */}
                {isShareMenuOpen && (
                  <div className="mb-4">
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => setShareType("user")}
                        className={`flex-1 py-2 px-4 rounded-xl transition-all duration-200 hover:cursor-pointer ${
                          shareType === "user"
                            ? darkMode
                              ? "bg-blue-500/20 text-blue-400 border-2 border-blue-500/50"
                              : "bg-blue-50 text-blue-600 border-2 border-blue-200"
                            : darkMode
                            ? "bg-gray-800 text-gray-400 border-2 border-gray-700"
                            : "bg-gray-50 text-gray-600 border-2 border-gray-200"
                        }`}
                      >
                        Share with User
                      </button>
                      <button
                        onClick={() => setShareType("group")}
                        className={`flex-1 py-2 px-4 rounded-xl transition-all duration-200 hover:cursor-pointer ${
                          shareType === "group"
                            ? darkMode
                              ? "bg-green-500/20 text-green-400 border-2 border-green-500/50"
                              : "bg-green-50 text-green-600 border-2 border-green-200"
                            : darkMode
                            ? "bg-gray-800 text-gray-400 border-2 border-gray-700"
                            : "bg-gray-50 text-gray-600 border-2 border-gray-200"
                        }`}
                      >
                        Share with Group
                      </button>
                    </div>

                    {shareType === "user" ? (
                      <div>
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
                    ) : (
                      <div>
                        <label
                          htmlFor="share-group"
                          className={`block text-sm font-medium mb-2 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Select group to share with
                        </label>
                        <select
                          id="share-group"
                          value={selectedGroupId}
                          onChange={(e) => setSelectedGroupId(e.target.value)}
                          className={`w-full px-4 py-2 rounded-lg ${
                            darkMode
                              ? "bg-gray-700 text-white border-gray-600"
                              : "bg-white text-gray-800 border-gray-300"
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500 hover:cursor-pointer`}
                          required
                        >
                          <option value="" disabled>
                            Select a group
                          </option>
                          {userGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => setIsShareMenuOpen(false)}
                        className={`flex-1 py-2 px-4 rounded-lg ${
                          darkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                        } transition-all duration-200 hover:cursor-pointer`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleShareLocation}
                        className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 
    text-white font-medium hover:opacity-90 transition-all duration-200 hover:cursor-pointer"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                )}
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
                          onClick={() => handleRemoveSharingClick(user.id)}
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
          </div>
        </div>
        <div>
          {showGroupRemoveDialog && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl p-6 max-w-md w-full shadow-xl`}
              >
                <h3 className="text-lg font-semibold mb-2">
                  Remove user from shared location
                </h3>
                <p className="mb-4 text-sm">
                  This user is part of{" "}
                  {affectedGroups.length === 1
                    ? "a group"
                    : `${affectedGroups.length} groups`}{" "}
                  that
                  {affectedGroups.length === 1 ? " has" : " have"} access to
                  this location. Would you like to remove just this user or
                  remove the location from the entire
                  {affectedGroups.length === 1 ? " group" : " groups"}?
                </p>

                <p className="mb-4 text-sm font-medium">
                  Affected {affectedGroups.length === 1 ? "group" : "groups"}:
                  {affectedGroups.map((group) => (
                    <span
                      key={group.id}
                      className={`inline-block px-3 py-1 mx-1 my-1 rounded-full text-xs ${
                        darkMode
                          ? "bg-blue-900/30 text-blue-300"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {group.displayName}
                    </span>
                  ))}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => removeSharing(userToRemove, false)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all duration-200 hover:cursor-pointer ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
                        : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    Remove just this user
                  </button>
                  <button
                    onClick={() => removeSharing(userToRemove, true)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all duration-200 hover:cursor-pointer ${
                      darkMode
                        ? "bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800"
                        : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300"
                    }`}
                  >
                    Remove from entire{" "}
                    {affectedGroups.length === 1 ? "group" : "groups"}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowGroupRemoveDialog(false);
                    setUserToRemove(null);
                    setAffectedGroups([]);
                  }}
                  className={`w-full mt-3 py-2 px-4 text-sm rounded-lg transition-all duration-200 hover:cursor-pointer ${
                    darkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {/* Delete Location Confirmation Dialog */}
          {showDeleteDialog && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
              <div
                className={`${
                  darkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl p-6 max-w-md w-full shadow-xl`}
              >
                <h3 className="text-lg font-semibold mb-2">Delete Location</h3>
                <p className="mb-4">
                  Are you sure you want to delete "{selectedFood?.location}"?
                  This action cannot be undone.
                </p>

                {selectedFood?.sharedWith?.length > 0 && (
                  <div
                    className={`p-3 mb-4 rounded-lg ${
                      darkMode
                        ? "bg-amber-900/20 border border-amber-800"
                        : "bg-amber-50 border border-amber-200"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        darkMode ? "text-amber-300" : "text-amber-700"
                      }`}
                    >
                      <strong>Note:</strong> This location is shared with{" "}
                      {selectedFood.sharedWith.length}
                      {selectedFood.sharedWith.length === 1
                        ? " person"
                        : " people"}
                      . Deleting it will remove access for all shared users.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:cursor-pointer ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
                        : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteLocation}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:cursor-pointer ${
                      darkMode
                        ? "bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800"
                        : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300"
                    }`}
                  >
                    Delete Location
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationDialog;
