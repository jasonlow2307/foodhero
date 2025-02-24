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
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { Icon } from "@iconify/react";
import debounce from "lodash.debounce";
import Fuse from "fuse.js";
import useFirestoreWrite from "../../firebase/useFirestoreWrite";
import { useSnackbar } from "notistack";
import { Fullness, Location, LocationFormProp } from "../../utils/models";

const LocationForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState<LocationFormProp>({
    name: "",
    location: "",
    visits: [
      {
        food: { "": 1 },
        date: new Date(),
        fullness: "perfect",
      },
    ],
    selectedLocation: null,
  });
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const { writeData } = useFirestoreWrite();

  // For handling changes in form fields
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
    const updatedFood = { ...formData.visits[0].food };
    const foodKeys = Object.keys(updatedFood);
    const foodKey = foodKeys[index];

    if (field === "name") {
      const newKey = value;
      const currentValue = updatedFood[foodKey] || 1;
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
      visits: [
        {
          ...formData.visits[0],
          food: updatedFood,
        },
      ],
    });
  };

  const handleFullnessChange = (e: SelectChangeEvent<Fullness>) => {
    setFormData({
      ...formData,
      visits: [
        {
          ...formData.visits[0],
          fullness: e.target.value as Fullness,
        },
      ],
    });
  };

  // Update the handleAddFood function to handle empty keys
  const handleAddFood = () => {
    const currentVisit = formData?.visits[0];
    setFormData({
      ...formData,
      visits: [
        {
          food: {
            ...currentVisit.food,
            "": 1,
          },
          date: currentVisit.date,
          fullness: currentVisit.fullness,
        },
      ],
    });
  };

  // Add a handler for deleting food items
  const handleDeleteFood = (indexToDelete: number) => {
    const currentFood = { ...formData?.visits[0].food };
    const foodKeys = Object.keys(currentFood);

    if (foodKeys.length <= 1) return;

    delete currentFood[foodKeys[indexToDelete]];

    setFormData({
      ...formData,
      visits: [
        {
          food: currentFood,
          date: formData?.visits[0].date,
          fullness: formData?.visits[0].fullness,
        },
      ],
    });
  };

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await writeData("locations", formData);
      enqueueSnackbar("Location added successfully! 🎉", {
        variant: "success",
        autoHideDuration: 3000,
      });
      // Reset form
      setFormData({
        name: "",
        location: "",
        visits: [
          {
            food: { "": 1 },
            date: new Date(),
            fullness: "perfect",
          },
        ],
        selectedLocation: null,
      });
    } catch (error) {
      enqueueSnackbar("Failed to add food 😕", {
        variant: "error",
        autoHideDuration: 3000,
      });
      console.error("Error submitting form:", error);
    }
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
              value={formData?.name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              variant="outlined"
              label="Your Location"
              name="location"
              value={formData?.location}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <>
                    <Icon
                      icon="material-symbols:search-rounded"
                      onClick={() => handleLocationSearch(formData?.location)}
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
            {formData?.location && searchResults.length > 0 && (
              <List style={{ maxHeight: "150px", overflowY: "auto" }}>
                {searchResults.map((location, index) => (
                  <ListItem
                    key={index}
                    onClick={() => handleLocationSelect(location)}
                    sx={{ cursor: "pointer" }}
                  >
                    <ListItemText primary={location.display_name} />
                  </ListItem>
                ))}
              </List>
            )}
            <Typography variant="h6" gutterBottom>
              What are you craving?
            </Typography>
            {Object.keys(formData?.visits[0].food).map((foodKey, index) => (
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
                  value={formData?.visits[0][foodKey]}
                  onChange={(e) => handleFoodChange(e, index, "quantity")}
                  sx={{ width: "150px" }}
                  required
                />
                <IconButton
                  onClick={() => handleDeleteFood(index)}
                  color="error"
                  disabled={Object.keys(formData?.visits[0]).length <= 1}
                >
                  <Icon icon="mdi:delete" />
                </IconButton>
              </div>
            ))}
            <Box sx={{ mt: 2, mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Fullness Level</InputLabel>
                <Select
                  value={formData.visits[0].fullness}
                  label="Fullness Level"
                  onChange={handleFullnessChange}
                >
                  <MenuItem value="not enough">Not Enough</MenuItem>
                  <MenuItem value="perfect">Perfect</MenuItem>
                  <MenuItem value="too much">Too Much</MenuItem>
                </Select>
              </FormControl>
            </Box>
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

export default LocationForm;
