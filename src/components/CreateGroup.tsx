import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  doc,
} from "firebase/firestore";
import { X } from "lucide-react";
import { generateGroupCode } from "../utils/groupUtils";

const CreateGroup = ({ onClose, onGroupCreated }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [createdGroupCode, setCreatedGroupCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Generate a unique 6-letter code for the group
      const groupCode = generateGroupCode();

      // Create the group document
      const groupRef = await addDoc(collection(db, "groups"), {
        name: name.trim(),
        description: description.trim(),
        code: groupCode,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        members: [currentUser.uid],
      });

      // Add the group to the user's groups array
      await updateDoc(doc(db, "users", currentUser.uid), {
        groups: arrayUnion(groupRef.id),
      });

      // Get the created group with its ID
      const newGroup = {
        id: groupRef.id,
        name: name.trim(),
        description: description.trim(),
        code: groupCode,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        members: [currentUser.uid],
      };

      setCreatedGroupCode(groupCode);
      setShowSuccessDialog(true);
      // Call the callback with the new group
      onGroupCreated(newGroup);
    } catch (error) {
      console.error("Error creating group:", error);
      setError("Failed to create group. Please try again.");
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
          <h3 className="text-xl font-semibold">Create New Group</h3>
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

          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 text-sm font-medium">
              Group Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-3 rounded-lg ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-700"
              } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
              placeholder="Enter group name"
              maxLength={50}
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="description"
              className="block mb-2 text-sm font-medium"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full p-3 rounded-lg ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-700"
              } border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
              placeholder="Describe your group"
              maxLength={200}
            />
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
              {isLoading ? "Creating..." : "Create Group"}
            </button>
          </div>
          {showSuccessDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60] p-4">
              <div
                className={`w-full max-w-sm rounded-xl shadow-lg ${
                  darkMode ? "bg-gray-800" : "bg-white"
                } overflow-hidden p-6 text-center`}
              >
                <div className="mb-4">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${
                      darkMode ? "bg-green-500/20" : "bg-green-100"
                    } mb-4`}
                  >
                    <svg
                      className={`w-6 h-6 ${
                        darkMode ? "text-green-400" : "text-green-600"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Group Created!</h3>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    } mb-4`}
                  >
                    Share this code with others to join your group
                  </p>
                  <div
                    className={`text-3xl font-mono font-bold tracking-wider mb-4 ${
                      darkMode ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {createdGroupCode}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdGroupCode);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    className={`px-4 py-2 rounded-lg flex items-center mx-auto ${
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
                <button
                  onClick={() => {
                    setShowSuccessDialog(false);
                    onClose();
                  }}
                  className={`w-full px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium 
        transition-all hover:opacity-90 hover:cursor-pointer`}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;
