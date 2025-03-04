import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Users, Crown } from "lucide-react";

const GroupCard = ({ group }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();

  const isAdmin = group.createdBy === currentUser.uid;
  const memberCount = group.members ? group.members.length : 0;

  const handleCardClick = () => {
    navigate(`/groups/${group.id}/members`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-xl shadow-md overflow-hidden ${
        darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-50"
      } transition-all cursor-pointer`}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold">{group.name}</h3>
          {isAdmin && (
            <div className="flex items-center bg-amber-100 text-amber-600 px-2 py-1 rounded-full">
              <Crown size={14} className="mr-1" />
              <span className="text-xs font-medium">Admin</span>
            </div>
          )}
        </div>

        <p
          className={`mb-4 text-sm ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {group.description || "No description provided."}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users
              size={16}
              className={`mr-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            />
            <span
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </div>

          <div
            className={`text-xs px-2 py-1 rounded ${
              isAdmin
                ? "bg-green-100 text-green-600"
                : darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isAdmin ? "Created by you" : "Member"}
          </div>
        </div>

        <div className="mt-4 flex">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/groups/${group.id}/members`);
            }}
            className={`text-sm px-4 py-2 rounded-lg ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            } transition-all hover:cursor-pointer`}
          >
            View Members
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
