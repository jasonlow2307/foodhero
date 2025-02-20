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
    food: "",
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

      setSearchResults(fuzzyResults);
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
    setFormData({
      ...formData,
      location: filteredLocation.display_name,
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
            borderRadius: "25pxx",
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
            <TextField
              variant="outlined"
              label="What are you craving?"
              name="food"
              value={formData.food}
              onChange={handleChange}
              fullWidth
              required
            />
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
