import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { db } from "../firebase/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { ArrowLeft, User, Crown, LogOut, Trash2 } from "lucide-react";
import Loader from "./Loader";
import ConfirmDialog from "./ConfirmDialog";
import { useSnackbar } from "notistack";
import { formatDistance } from "date-fns";

interface SharedLocation {
  locationId: string;
  sharedBy: string;
  sharedAt: Timestamp;
}

const GroupMembers = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [sharedLocations, setSharedLocations] = useState<SharedLocation[]>([]);
  const [locationDetails, setLocationDetails] = useState<Map<string, any>>(
    new Map()
  );

  useEffect(() => {
    const fetchSharedLocations = async () => {
      if (!groupId) return;

      try {
        const groupDoc = await getDoc(doc(db, "groups", groupId));
        if (!groupDoc.exists()) return;

        const groupData = groupDoc.data();
        const sharedLocs = groupData.sharedLocations || [];
        setSharedLocations(sharedLocs);

        // Fetch details for each shared location
        const locationPromises = sharedLocs.map(async (shared) => {
          const locationDoc = await getDoc(
            doc(db, "locations", shared.locationId)
          );
          if (locationDoc.exists()) {
            return [
              shared.locationId,
              { id: locationDoc.id, ...locationDoc.data() },
            ];
          }
          return null;
        });

        const locationResults = await Promise.all(locationPromises);
        const locationMap = new Map(
          locationResults.filter(Boolean) as [string, any][]
        );
        setLocationDetails(locationMap);
      } catch (error) {
        console.error("Error fetching shared locations:", error);
      }
    };

    fetchSharedLocations();
  }, [groupId]);

  useEffect(() => {
    const fetchGroupAndMembers = async () => {
      try {
        setIsLoading(true);

        // Get the group document
        const groupDoc = await getDoc(doc(db, "groups", groupId));
        if (!groupDoc.exists()) {
          setError("Group not found");
          return;
        }

        const groupData = groupDoc.data();
        setGroup({
          id: groupDoc.id,
          ...groupData,
        });

        // Fetch data for all members
        const memberPromises = groupData.members.map(async (memberId) => {
          const memberDoc = await getDoc(doc(db, "users", memberId));
          if (memberDoc.exists()) {
            return {
              id: memberDoc.id,
              ...memberDoc.data(),
            };
          }
          return { id: memberId, displayName: "Unknown User" };
        });

        const memberData = await Promise.all(memberPromises);
        setMembers(memberData);
      } catch (error) {
        console.error("Error fetching group members:", error);
        setError("Failed to load group members");
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupAndMembers();
    }
  }, [groupId]);

  const handleLeaveGroup = async () => {
    try {
      // Remove user from the group's members
      await updateDoc(doc(db, "groups", groupId), {
        members: arrayRemove(currentUser.uid),
      });

      // Remove group from user's groups
      await updateDoc(doc(db, "users", currentUser.uid), {
        groups: arrayRemove(groupId),
      });

      enqueueSnackbar("Successfully left the group", {
        variant: "success",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "center",
        },
      });

      navigate("/groups");
    } catch (error) {
      console.error("Error leaving group:", error);
      enqueueSnackbar("Failed to leave group", {
        variant: "error",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "center",
        },
      });
      setError("Failed to leave group");
    }
  };

  const handleDeleteGroup = async () => {
    try {
      // Remove group from all members' groups array
      const removePromises = members.map((member) =>
        updateDoc(doc(db, "users", member.id), {
          groups: arrayRemove(groupId),
        })
      );

      await Promise.all(removePromises);
      await deleteDoc(doc(db, "groups", groupId));
      navigate("/groups");
    } catch (error) {
      console.error("Error deleting group:", error);
      setError("Failed to delete group");
    }
  };

  const handleDeleteSharedLocation = async (locationId) => {
    try {
      // 1. Remove the location from group's sharedLocations array
      const groupRef = doc(db, "groups", groupId);
      const groupDoc = await getDoc(groupRef);

      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        const updatedSharedLocations = (groupData.sharedLocations || []).filter(
          (item) => item.locationId !== locationId
        );

        await updateDoc(groupRef, {
          sharedLocations: updatedSharedLocations,
        });

        // 2. Remove all group members from location's sharedWith array
        const locationRef = doc(db, "locations", locationId);
        const locationDoc = await getDoc(locationRef);

        if (locationDoc.exists()) {
          const locationData = locationDoc.data();
          const groupMemberIds = members.map((member) => member.id);

          // Filter out all group members from sharedWith
          const updatedSharedWith = (locationData.sharedWith || []).filter(
            (id) => !groupMemberIds.includes(id)
          );

          await updateDoc(locationRef, {
            sharedWith: updatedSharedWith,
          });
        }

        // 3. Update local state
        setSharedLocations((prev) =>
          prev.filter((item) => item.locationId !== locationId)
        );

        enqueueSnackbar("Location sharing removed successfully", {
          variant: "success",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        });
      }
    } catch (error) {
      console.error("Error removing shared location:", error);
      enqueueSnackbar("Failed to remove shared location", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
    }
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${
          darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-600"
        }`}
      >
        <Loader />
        <p className={`mt-6 font-medium animate-pulse`}>
          Loading group members...
        </p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div
        className={`min-h-screen ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
        } p-4`}
      >
        <div className="max-w-xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error || "Group not found"}</p>
          <button
            onClick={() => navigate("/groups")}
            className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium transition-all hover:opacity-90 hover:cursor-pointer"
          >
            Go Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pb-20 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      <div className="w-full px-8 py-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/groups")}
            className={`p-2 mr-4 rounded-full ${
              darkMode
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            } transition-all duration-200 hover:cursor-pointer shadow-sm`}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">{group.displayName} - Members</h1>
        </div>

        {/* Group Code Section */}
        <div className="mb-8 max-w-7xl">
          <div
            className={`p-6 rounded-xl ${
              darkMode
                ? "bg-gray-800/50 shadow-xl shadow-black/10"
                : "bg-white shadow-xl shadow-gray-200/50"
            } backdrop-blur-sm`}
          >
            <div className="flex flex-col items-center text-center">
              <h3
                className={`text-sm font-medium ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                } mb-2`}
              >
                Share this code with others to join the group
              </h3>
              <div
                className={`text-3xl font-mono font-bold tracking-wider mb-4 ${
                  darkMode ? "text-green-400" : "text-green-600"
                }`}
              >
                {group.code}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(group.code);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
                }}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  copySuccess
                    ? darkMode
                      ? "bg-green-500/20 text-green-300"
                      : "bg-green-100 text-green-600"
                    : darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                } transition-all duration-300 hover:cursor-pointer`}
                disabled={copySuccess}
              >
                {copySuccess ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              darkMode
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-red-100 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        <div className="mb-8 max-w-7xl">
          <div
            className={`rounded-xl ${
              darkMode
                ? "bg-gray-800/50 shadow-xl shadow-black/10"
                : "bg-white shadow-xl shadow-gray-200/50"
            } backdrop-blur-sm`}
          >
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-4 ${
                    member.id === currentUser.uid
                      ? darkMode
                        ? "bg-gray-700/50 border-l-4 border-green-500"
                        : "bg-green-50 border-l-4 border-green-500"
                      : darkMode
                      ? "hover:bg-gray-700/30"
                      : "hover:bg-gray-50"
                  } transition-all duration-200`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white mr-3">
                      {member.photoURL ? (
                        <img
                          src={member.photoURL}
                          alt={member.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-medium ${
                          member.id === currentUser.uid ? "font-bold" : ""
                        }`}
                      >
                        {member.displayName || member.email || "Unknown User"}
                        {member.id === currentUser.uid && " (You)"}
                      </p>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {group.createdBy === member.id && (
                    <div
                      className={`flex items-center px-3 py-1 rounded-full ${
                        darkMode
                          ? "bg-amber-500/10 text-amber-300"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <Crown size={14} className="mr-1" />
                      <span className="text-xs font-medium">Admin</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="my-8">
          <h3
            className={`text-lg font-semibold mb-4 ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Shared Locations
          </h3>
          {sharedLocations.length === 0 ? (
            <p
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              No locations have been shared in this group yet
            </p>
          ) : (
            <div className="space-y-4">
              {sharedLocations.map((shared) => {
                const location = locationDetails.get(shared.locationId);
                if (!location) return null;

                return (
                  <div
                    key={shared.locationId}
                    className={`p-4 rounded-xl ${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex justify-between items-start">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() =>
                          navigate(`/list?id=${shared.locationId}`)
                        }
                      >
                        <h4
                          className={`font-medium ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {location.location}
                        </h4>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Shared by{" "}
                          {members.find((m) => m.id === shared.sharedBy)
                            ?.displayName ||
                            members.find((m) => m.id === shared.sharedBy)
                              ?.email ||
                            "Unknown"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {formatDistance(
                            shared.sharedAt.toDate(),
                            new Date(),
                            {
                              addSuffix: true,
                            }
                          )}
                        </span>
                        {(currentUser.uid === group.createdBy ||
                          currentUser.uid === shared.sharedBy) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSharedLocation(shared.locationId);
                            }}
                            className={`p-2 rounded-full ${
                              darkMode
                                ? "text-red-400 hover:bg-red-900/30"
                                : "text-red-500 hover:bg-red-50"
                            } transition-all duration-200 hover:cursor-pointer`}
                            title="Remove shared location"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="max-w-7xl">
          {currentUser.uid === group.createdBy ? (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className={`w-full p-3 rounded-xl border ${
                darkMode
                  ? "border-red-500/50 text-red-400 hover:bg-red-500/10"
                  : "border-red-500 text-red-500 hover:bg-red-50"
              } font-medium transition-all duration-200 hover:cursor-pointer flex items-center justify-center`}
            >
              <Trash2 size={18} className="mr-2" />
              Delete Group
            </button>
          ) : (
            <button
              onClick={() => setShowLeaveDialog(true)}
              className="w-full p-3 rounded-xl border border-red-500 text-red-500 font-medium hover:bg-red-50 transition-all hover:cursor-pointer flex items-center justify-center"
            >
              <LogOut size={18} className="mr-2" />
              Leave Group
            </button>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={handleLeaveGroup}
        title="Leave Group"
        message="Are you sure you want to leave this group? You'll need a new invitation code to rejoin."
        confirmText="Leave Group"
        cancelText="Cancel"
        type="warning"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone and all members will be removed."
        confirmText="Delete Group"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default GroupMembers;
