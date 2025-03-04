import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  doc,
  getDoc,
} from "firebase/firestore";
import { X } from "lucide-react";

const JoinGroup = ({ onClose, onGroupJoined }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [groupCode, setGroupCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!groupCode.trim()) {
      setError("Group code is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Find the group with the provided code
      const groupsQuery = query(
        collection(db, "groups"),
        where("code", "==", groupCode.trim().toUpperCase())
      );

      const groupSnapshot = await getDocs(groupsQuery);

      if (groupSnapshot.empty) {
        setError("Invalid group code. Please check and try again.");
        return;
      }

      const groupDoc = groupSnapshot.docs[0];
      const groupData = groupDoc.data();

      // Check if user is already a member
      if (groupData.members && groupData.members.includes(currentUser.uid)) {
        setError("You are already a member of this group.");
        return;
      }

      // Add user to the group's members
      await updateDoc(doc(db, "groups", groupDoc.id), {
        members: arrayUnion(currentUser.uid),
      });

      // Add group to user's groups
      await updateDoc(doc(db, "users", currentUser.uid), {
        groups: arrayUnion(groupDoc.id),
      });

      // Get the complete group data to return
      const updatedGroupDoc = await getDoc(doc(db, "groups", groupDoc.id));
      const updatedGroupData = updatedGroupDoc.data();

      // Call the callback with the joined group
      onGroupJoined({
        id: groupDoc.id,
        ...updatedGroupData,
      });
    } catch (error) {
      console.error("Error joining group:", error);
      setError("Failed to join group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div
        className={`w-full max-w-md rounded-xl shadow-lg ${
          darkMode ? "bg-gray-800" : "bg-white"
        } overflow-hidden`}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold">Join a Group</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            } transition-all hover:cursor-pointer`}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="groupCode"
              className="block mb-2 text-sm font-medium"
            >
              Group Code
            </label>
            <input
              type="text"
              id="groupCode"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
              className={`w-full p-3 rounded-lg uppercase ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-700"
              } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
              placeholder="Enter 6-letter group code"
              maxLength={6}
              required
            />
            <p
              className={`mt-2 text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Enter the 6-letter code provided by the group creator
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`mr-3 px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-100 hover:bg-gray-200"
              } font-medium transition-all hover:cursor-pointer`}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium transition-all hover:opacity-90 hover:cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Joining..." : "Join Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroup;
