import React, { useState, useCallback } from "react";
import {
  TextField,
  Button,
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { Icon } from "@iconify/react";
import debounce from "lodash.debounce";
import Fuse from "fuse.js";
import useFirestoreWrite from "../../firebase/useFirestoreWrite";

interface Location {
  place_id: number;
  display_name: string;
  boundingBox: number[];
  lon: number;
  lat: number;
}

const FoodForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    food: [{ "": 1 }] as { [key: string]: number }[], // Initialize with an empty food item
    selectedLocation: null as Location | null,
  });
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const { writeData } = useFirestoreWrite();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "location") {
      debouncedHandleLocationSearch(value);
    }
  };

  // Update the handleFoodChange function to handle empty keys better
  const handleFoodChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    field: "name" | "quantity"
  ) => {
    const { value } = e.target;
    const updatedFood = { ...formData.food[0] };
    const foodKeys = Object.keys(updatedFood);
    const foodKey = foodKeys[index];

    if (field === "name") {
      const newKey = value;
      const currentValue = updatedFood[foodKey] || 1; // Keep the current quantity or default to 1
      delete updatedFood[foodKey];
      updatedFood[newKey] = currentValue;
    } else {
      const validValue = parseInt(value, 10);
      if (!isNaN(validValue) && validValue > 0) {
        updatedFood[foodKey] = validValue;
      }
    }

    setFormData({
      ...formData,
      food: [updatedFood],
    });
  };

  // Update the handleAddFood function to handle empty keys
  const handleAddFood = () => {
    const currentFood = formData.food[0];
    setFormData({
      ...formData,
      food: [
        {
          ...currentFood,
          "": 1, // Add new empty food item with quantity 1
        },
      ],
    });
  };

  // Add a handler for deleting food items
  const handleDeleteFood = (indexToDelete: number) => {
    const currentFood = { ...formData.food[0] };
    const foodKeys = Object.keys(currentFood);

    // Don't delete if it's the last item
    if (foodKeys.length <= 1) return;

    delete currentFood[foodKeys[indexToDelete]];

    setFormData({
      ...formData,
      food: [currentFood],
    });
  };

  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    writeData("foods", formData);
  };

  const handleLocationSearch = async (location: string) => {
    if (!location) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          location
        )}`
      );
      const data = await response.json();

      // Use fuse.js for fuzzy searching
      const fuse = new Fuse(data, {
        keys: ["display_name"],
        threshold: 0.2, // Adjust the threshold for more or less fuzzy matching
      });
      const fuzzyResults = fuse.search(location).map((result) => result.item);

      setSearchResults(fuzzyResults as Location[]);
      console.log(fuzzyResults);
    } catch (error) {
      console.error("Error fetching location data:", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedHandleLocationSearch = useCallback(
    debounce((location: string) => handleLocationSearch(location), 300),
    []
  );

  const filterLocationAttributes = (location: any): Location => {
    return {
      place_id: location.place_id,
      display_name: location.display_name,
      boundingBox: location.boundingbox,
      lon: location.lon,
      lat: location.lat,
    };
  };

  const handleLocationSelect = (location: any) => {
    const filteredLocation = filterLocationAttributes(location);
    console.log(location.display_name);
    const displayName = location.display_name.includes(",")
      ? location.display_name.split(",")[0]
      : location.display_name.location;
    setFormData({
      ...formData,
      location: displayName,
      selectedLocation: filteredLocation,
    });
    setSearchResults([]);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          style={{
            padding: "20px",
            textAlign: "center",
            borderRadius: "25px",
          }}
        >
          <Typography variant="h5" gutterBottom marginBottom={3}>
            Food
          </Typography>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <TextField
              variant="outlined"
              label="Your Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              variant="outlined"
              label="Your Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <>
                    <Icon
                      icon="material-symbols:search-rounded"
                      onClick={() => handleLocationSearch(formData.location)}
                      fontSize={30}
                      fontWeight="bold"
                      style={{ cursor: "pointer" }}
                    />
                    {loading && (
                      <CircularProgress
                        size={24}
                        style={{ marginLeft: "10px" }}
                      />
                    )}
                  </>
                ),
              }}
            />
            {formData.location && searchResults.length > 0 && (
              <List style={{ maxHeight: "150px", overflowY: "auto" }}>
                {searchResults.map((location, index) => (
                  <ListItem
                    key={index}
                    onClick={() => handleLocationSelect(location)}
                  >
                    <ListItemText primary={location.display_name} />
                  </ListItem>
                ))}
              </List>
            )}
            <Typography variant="h6" gutterBottom>
              What are you craving?
            </Typography>
            {Object.keys(formData.food[0]).map((foodKey, index) => (
              <div
                key={index}
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <TextField
                  variant="outlined"
                  label="Food Name"
                  value={foodKey}
                  onChange={(e) => handleFoodChange(e, index, "name")}
                  fullWidth
                  required
                />
                <TextField
                  variant="outlined"
                  label="Quantity"
                  type="number"
                  value={formData.food[0][foodKey]}
                  onChange={(e) => handleFoodChange(e, index, "quantity")}
                  sx={{ width: "150px" }}
                  required
                />
                <IconButton
                  onClick={() => handleDeleteFood(index)}
                  color="error"
                  disabled={Object.keys(formData.food[0]).length <= 1}
                >
                  <Icon icon="mdi:delete" />
                </IconButton>
              </div>
            ))}
            <Button
              variant="outlined"
              color="primary"
              onClick={handleAddFood}
              style={{ marginTop: "10px" }}
            >
              Add Food Item
            </Button>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Submit 🍽️
            </Button>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export default FoodForm;
