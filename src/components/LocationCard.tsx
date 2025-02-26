import React, { forwardRef } from "react";
import { Clock, User, GripVertical } from "lucide-react";
import { Visit } from "../utils/models";
import { getTimeAgo } from "../utils/timeUtil";

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

    return (
      <div
        ref={ref}
        className={`bg-white rounded-3xl p-4 md:p-6 shadow-xl transition-all duration-300 cursor-pointer
        ${
          isDragging
            ? "shadow-2xl ring-2 ring-blue-400 opacity-90 scale-105"
            : "hover:transform hover:scale-105"
        }
        ${isDragging ? "z-50" : "z-10"}`}
        onClick={(e) => {
          // Only trigger onClick if we're not dragging
          if (!isDragging) onClick();
        }}
      >
        {/* Location Image */}
        <div className="relative h-36 sm:h-48 rounded-2xl bg-gray-100 mb-3 sm:mb-4 overflow-hidden">
          {draggable && (
            <div
              {...dragHandleProps}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()} // Prevent card click when using drag handle
            >
              <GripVertical
                size={isMobile ? 16 : 20}
                className="text-gray-500"
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
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
            {location.location}
          </h3>

          <div className="flex items-center gap-2 text-gray-500">
            <User size={isMobile ? 14 : 16} />
            <span className="text-xs sm:text-sm">{location.name}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={isMobile ? 14 : 16} />
            <span className="text-xs sm:text-sm">
              Last {getTimeAgo(lastVisit.date)}
            </span>
          </div>

          {/* Visit Summary */}
          <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-xl">
            <div className="text-xs sm:text-sm text-gray-600">
              Last order:
              {Object.entries(lastVisit.food).map(
                ([item, quantity]: [string, string | number]) => (
                  <span
                    key={item}
                    className="block mt-1 text-xs sm:text-sm text-gray-700"
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
                ? "bg-green-100 text-green-600"
                : lastVisit.fullness === "too much"
                ? "bg-red-100 text-red-600"
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
