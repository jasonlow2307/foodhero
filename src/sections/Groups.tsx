import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Users, PlusCircle, LogIn } from "lucide-react";
import GroupCard from "../components/GroupCard";
import CreateGroup from "../components/CreateGroup";
import JoinGroup from "../components/JoinGroup";
import Loader from "../components/Loader";

const Groups = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [userGroups, setUserGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        setIsLoading(true);

        // Get the user document to find the groups they're a member of
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (!userDoc.exists()) {
          return;
        }

        const userData = userDoc.data();
        const groupIds = userData.groups || [];

        if (groupIds.length === 0) {
          setUserGroups([]);
          setIsLoading(false);
          return;
        }

        // Fetch all groups the user is a member of
        const groupsData = await Promise.all(
          groupIds.map(async (groupId) => {
            const groupDoc = await getDoc(doc(db, "groups", groupId));
            if (groupDoc.exists()) {
              return { id: groupDoc.id, ...groupDoc.data() };
            }
            return null;
          })
        );

        // Filter out any null values (groups that might have been deleted)
        setUserGroups(groupsData.filter((group) => group !== null));
      } catch (error) {
        console.error("Error fetching user groups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserGroups();
  }, [currentUser.uid]);

  return (
    <div
      className={`min-h-screen pb-20 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Groups</h1>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Create or join groups to share your food journey with others
            </p>
          </div>
          <div className="flex mt-4 md:mt-0 space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium transition-all hover:opacity-90 hover:cursor-pointer"
            >
              <PlusCircle size={18} className="mr-2" />
              Create Group
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className={`flex items-center justify-center px-4 py-2 rounded-xl border ${
                darkMode
                  ? "border-gray-600 hover:bg-gray-800"
                  : "border-gray-300 hover:bg-gray-100"
              } font-medium transition-all hover:cursor-pointer`}
            >
              <LogIn size={18} className="mr-2" />
              Join Group
            </button>
          </div>
        </div>

        {isLoading ? (
          <div
            className={`min-h-screen flex flex-col items-center justify-center ${
              darkMode ? "bg-gray-900" : "bg-white"
            }`}
          >
            <Loader />
            <p
              className={`mt-6 font-medium animate-pulse ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Loading your groups...
            </p>
          </div>
        ) : userGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div
            className={`text-center py-16 rounded-xl ${
              darkMode ? "bg-gray-800" : "bg-white"
            } shadow-sm`}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Groups Yet</h2>
            <p
              className={`max-w-md mx-auto mb-6 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Create a new group or join an existing one to start sharing your
              food journey with friends and family.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium transition-all hover:opacity-90 hover:cursor-pointer"
              >
                Create a Group
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-100 hover:bg-gray-200"
                } font-medium transition-all hover:cursor-pointer`}
              >
                Join a Group
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateGroup
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={(newGroup) => {
            setUserGroups((prev) => [...prev, newGroup]);
          }}
        />
      )}

      {showJoinModal && (
        <JoinGroup
          onClose={() => setShowJoinModal(false)}
          onGroupJoined={(newGroup) => {
            setUserGroups((prev) => [...prev, newGroup]);
            setShowJoinModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Groups;
