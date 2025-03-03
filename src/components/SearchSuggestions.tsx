import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

interface SearchSuggestionsProps {
  locations: any[];
  onClose: () => void;
  setSelectedLocation: (location: any) => void;
  setOpen: (open: boolean) => void;
}

const SearchSuggestions = ({
  locations,
  onClose,
  setSelectedLocation,
  setOpen,
}: SearchSuggestionsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { darkMode } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);

  // Extract categories from locations
  useEffect(() => {
    if (locations.length > 0) {
      const foodTypes = new Set<string>();

      locations.forEach((location) => {
        const name = location.location.toLowerCase();

        // Extract categories based on common food types
        if (name.includes("burger")) foodTypes.add("burger");
        if (name.includes("pizza")) foodTypes.add("pizza");
        if (name.includes("sushi") || name.includes("japanese"))
          foodTypes.add("japanese");
        if (name.includes("thai")) foodTypes.add("thai");
        if (name.includes("indian")) foodTypes.add("indian");
        if (name.includes("chinese")) foodTypes.add("chinese");
        if (name.includes("pasta") || name.includes("italian"))
          foodTypes.add("italian");
        if (name.includes("cafe") || name.includes("coffee"))
          foodTypes.add("cafe");
        if (name.includes("dessert") || name.includes("bakery"))
          foodTypes.add("dessert");
      });

      setCategories(Array.from(foodTypes));
    }
  }, [locations]);

  const handleLocationClick = (location) => {
    console.log("CLICKED");
    setSelectedLocation(location);
    setOpen(true); // Open the dialog
    onClose(); // Close the search modal
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setSuggestions([]);
      return;
    }

    // Filter locations by name and category
    const filtered = locations.filter((location) =>
      location.location.toLowerCase().includes(term.toLowerCase())
    );

    // Get unique locations to avoid duplicates
    const uniqueLocations = filtered.reduce((acc: any[], loc) => {
      if (!acc.some((item) => item.location === loc.location)) {
        acc.push(loc);
      }
      return acc;
    }, []);

    setSuggestions(uniqueLocations.slice(0, 5));
  };

  const handleCategorySelect = (category: string) => {
    setSearchTerm(category);

    // Filter locations by selected category
    const filtered = locations.filter((location) =>
      location.location.toLowerCase().includes(category.toLowerCase())
    );

    setSuggestions(filtered.slice(0, 5));
  };

  const handleAddNew = () => {
    navigate("/add", { state: { suggestedName: searchTerm } });
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : prev));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleLocationClick(suggestions[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, suggestions, selectedIndex]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl shadow-xl ${
          darkMode ? "bg-gray-800" : "bg-white"
        } p-5 relative`}
        style={{ maxHeight: "80vh", overflow: "auto" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 hover:cursor-pointer"
          aria-label="Close"
        >
          <X
            size={20}
            className={darkMode ? "text-gray-400" : "text-gray-500"}
          />
        </button>

        <h2
          className={`text-xl font-semibold mb-4 ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          Search Food Places
        </h2>

        <div className="relative mb-4">
          <Search
            size={18}
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or type"
            className={`w-full pl-10 pr-4 py-3 rounded-xl ${
              darkMode
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-gray-50 text-gray-800 border-gray-200"
            } border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
          />
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors duration-300 hover:cursor-pointer ${
                  searchTerm === category
                    ? "bg-gradient-to-r from-green-500 to-blue-500 text-white"
                    : darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Results list */}
        <div
          className={`mb-4 divide-y ${
            darkMode ? "divide-gray-700" : "divide-gray-100"
          }`}
        >
          {suggestions.length > 0 ? (
            suggestions.map((location, index) => (
              <div
                key={location.id}
                className={`py-3 px-2 ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                } rounded-lg cursor-pointer transition-all duration-300 ${
                  index === selectedIndex
                    ? darkMode
                      ? "bg-gray-700 ring-2 ring-blue-500"
                      : "bg-gray-50 ring-2 ring-blue-500"
                    : ""
                }`}
                onClick={() => handleLocationClick(location)}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseLeave={() => setSelectedIndex(-1)}
              >
                <p
                  className={`font-medium ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {location.location}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Last visit:{" "}
                  {new Date(
                    location.visits[location.visits.length - 1].date.seconds *
                      1000
                  ).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : searchTerm ? (
            <div
              className={`py-4 text-center ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <p>No matches found</p>
              <button
                onClick={handleAddNew}
                className="mt-2 px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-all duration-300 hover:cursor-pointer"
              >
                Add "{searchTerm}" as new place
              </button>
            </div>
          ) : null}
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/add")}
            className="px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-all duration-300 hover:cursor-pointer"
          >
            Add New Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchSuggestions;
