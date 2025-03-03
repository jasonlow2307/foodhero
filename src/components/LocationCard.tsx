import React, { forwardRef } from "react";
import { Clock, User, GripVertical } from "lucide-react";
import { Visit } from "../utils/models";
import { getTimeAgo } from "../utils/timeUtil";
import { useTheme } from "../contexts/ThemeContext";

interface LocationCardProps {
  location: any;
  image: string | null;
  isMobile: boolean;
  onClick: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const LocationCard = forwardRef<HTMLDivElement, LocationCardProps>(
  (
    {
      location,
      image,
      isMobile,
      onClick,
      draggable = false,
      isDragging = false,
      dragHandleProps,
    },
    ref
  ) => {
    const lastVisit = location.visits[location.visits.length - 1];

    const { darkMode } = useTheme();

    const handleMouseEnter = (e) => {
      if (!isDragging) {
        e.currentTarget.style.transform = "scale(1.05)";

        // Different shadow styles based on dark mode
        if (darkMode) {
          e.currentTarget.style.boxShadow =
            "rgba(34, 197, 94, 0.4) -8px -8px 32px 8px, rgba(14, 165, 233, 0.4) 8px 8px 32px 8px";
        } else {
          e.currentTarget.style.boxShadow =
            "rgba(22, 163, 74, 0.35) -8px -8px 32px 8px, rgba(2, 132, 199, 0.35) 8px 8px 32px 8px";
        }
      }
    };

    const handleMouseLeave = (e) => {
      if (!isDragging) {
        e.currentTarget.style.transform = "scale(1)";

        // Different shadow styles based on dark mode
        if (darkMode) {
          e.currentTarget.style.boxShadow =
            "0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.6)";
        } else {
          e.currentTarget.style.boxShadow =
            "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)";
        }
      }
    };

    return (
      <div
        className={`${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
        } rounded-3xl p-5 sm:p-6 shadow-lg cursor-pointer transition-all duration-300 ${
          isDragging ? "opacity-60" : ""
        }`}
        style={{
          boxShadow: darkMode
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.6)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          transform: "scale(1)",
          transition: "transform 0.3s ease, box-shadow 0.4s ease",
        }}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Location Image */}
        <div
          className={`relative h-36 sm:h-48 rounded-2xl ${
            darkMode ? "bg-gray-700" : "bg-gray-100"
          } mb-3 sm:mb-4 overflow-hidden`}
        >
          {" "}
          {draggable && (
            <div
              {...dragHandleProps}
              className={`absolute top-2 right-2 p-1 rounded-full ${
                darkMode
                  ? "bg-gray-700/80 hover:bg-gray-600"
                  : "bg-white/80 hover:bg-white"
              } cursor-grab active:cursor-grabbing`}
              onClick={(e) => e.stopPropagation()} // Prevent card click when using drag handle
            >
              <GripVertical
                size={isMobile ? 16 : 20}
                className={darkMode ? "text-gray-400" : "text-gray-500"}
              />
            </div>
          )}
          <img
            src={image || "/api/placeholder/400/320"}
            alt={location.location}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/api/placeholder/400/320";
            }}
          />
        </div>

        {/* Location Details */}
        <div className="space-y-2 sm:space-y-3">
          <h3
            className={`text-lg sm:text-xl font-semibold ${
              darkMode ? "text-white" : "text-gray-800"
            } mb-2 truncate`}
          >
            {location.location}
          </h3>

          <div
            className={`flex items-center gap-2 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <User size={isMobile ? 14 : 16} />
            <span
              className={`text-xs sm:text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {location.name}
            </span>
          </div>

          <div
            className={`flex items-center gap-2 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <Clock size={isMobile ? 14 : 16} />
            <span
              className={`text-xs sm:text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Last {getTimeAgo(lastVisit.date)}
            </span>
          </div>

          {/* Visit Summary */}
          <div
            className={`mt-2 sm:mt-4 p-2 sm:p-3 ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            } rounded-xl`}
          >
            <div
              className={`text-xs sm:text-sm ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Last order:
              {Object.entries(lastVisit.food).map(
                ([item, quantity]: [string, string | number]) => (
                  <span
                    key={item}
                    className={`block mt-1 text-xs sm:text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-700"
                    }`}
                  >
                    {quantity}x {item}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Fullness Indicator */}
          <div
            className={`mt-2 inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm
  ${
    lastVisit.fullness === "perfect"
      ? darkMode
        ? "bg-green-900/50 text-green-400"
        : "bg-green-100 text-green-600"
      : lastVisit.fullness === "too much"
      ? darkMode
        ? "bg-red-900/50 text-red-400"
        : "bg-red-100 text-red-600"
      : darkMode
      ? "bg-yellow-900/50 text-yellow-400"
      : "bg-yellow-100 text-yellow-600"
  }`}
          >
            {lastVisit.fullness === "perfect"
              ? "😊 Just Right"
              : lastVisit.fullness === "too much"
              ? "😅 Too Much"
              : "😋 Not Enough"}
          </div>
        </div>
      </div>
    );
  }
);

LocationCard.displayName = "LocationCard";

export default LocationCard;
