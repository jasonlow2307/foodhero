import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";

interface FoodDialogProps {
  open: boolean;
  onClose: () => void;
  selectedFood: any;
  images: { [key: string]: string | null };
  getBoundingBox: (boundingBox: number[]) => string;
  getMapCenter: (boundingBox: number[]) => string;
  getGoogleMapsLink: (boundingBox: number[]) => string;
  getWazeLink: (boundingBox: number[]) => string;
  onAddNewFood: (foodId: string, newFood: Visit) => Promise<void>;
}

export interface Visit {
  food: { [key: string]: number };
  date: Timestamp;
}

const FoodDialog = ({
  open,
  onClose,
  selectedFood,
  images,
  getBoundingBox,
  getMapCenter,
  getGoogleMapsLink,
  getWazeLink,
  onAddNewFood,
}: FoodDialogProps) => {
  const [localVisits, setLocalVisits] = useState<Visit[]>([]);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [newFood, setNewFood] = useState<Visit>({
    food: {},
    date: Timestamp.now(),
  });

  // Update useEffect to initialize localVisits when selectedFood changes
  useEffect(() => {
    if (selectedFood?.visits) {
      setLocalVisits(selectedFood.visits);
      console.log(selectedFood.visits);
    }
  }, [selectedFood]);

  const handleAddFood = () => {
    setIsAddingFood(true);
    setNewFood({
      food: {},
      date: Timestamp.now(),
    });
  };
  const handleNewFoodSubmit = async () => {
    if (Object.keys(newFood.food).length > 0) {
      // Optimistically update the UI
      setLocalVisits([...localVisits, newFood]);
      setIsAddingFood(false);

      try {
        // Attempt to update the backend
        await onAddNewFood(selectedFood.id, newFood);
        setNewFood({
          food: {},
          date: Timestamp.now(),
        });
      } catch (error) {
        // If the backend update fails, revert the optimistic update
        setLocalVisits(localVisits);
        console.error("Failed to add new food:", error);
      }
    }
  };

  const handleAddFoodItem = () => {
    setNewFood({
      ...newFood,
      food: { ...newFood.food, "": 1 },
    });
  };
  // Update handleFoodChange
  const handleFoodChange = (
    key: string,
    value: string | number,
    type: "name" | "quantity"
  ) => {
    const updatedFood = { ...newFood.food };
    if (type === "name") {
      const oldValue = updatedFood[key];
      delete updatedFood[key];
      updatedFood[value as string] = oldValue;
    } else {
      const foodName = key || Object.keys(updatedFood)[0];
      updatedFood[foodName] = Number(value);
    }
    setNewFood({
      ...newFood,
      food: updatedFood,
    });
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem" }}
      >
        {selectedFood?.location}
      </DialogTitle>
      <DialogContent
        sx={{
          textAlign: "center",
          padding: "20px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {selectedFood && (
          <>
            {images[selectedFood.id] && (
              <img
                src={images[selectedFood.id] || undefined}
                alt={selectedFood.location}
                style={{
                  maxWidth: "80%",
                  maxHeight: "300px",
                  borderRadius: "15px",
                  margin: "0 auto",
                  display: "block",
                  marginBottom: "20px",
                }}
              />
            )}
            <div style={{ height: "300px", marginTop: "20px" }}>
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${getBoundingBox(
                  selectedFood.selectedLocation.boundingBox
                )}&layer=mapnik&marker=${getMapCenter(
                  selectedFood.selectedLocation.boundingBox
                )}`}
                style={{ borderRadius: "10px" }}
              ></iframe>
            </div>
            {!isAddingFood ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddFood}
                  sx={{ mt: 3, mb: 1 }}
                >
                  Add New Visit
                </Button>
              </>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Add New Food Items
                </Typography>
                {Object.entries(newFood.food).map(([name, quantity], index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 2,
                      justifyContent: "center",
                    }}
                  >
                    <TextField
                      label="Food Name"
                      value={name}
                      onChange={(e) =>
                        handleFoodChange(name, e.target.value, "name")
                      }
                      size="small"
                    />
                    <TextField
                      label="Quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        handleFoodChange(name, e.target.value, "quantity")
                      }
                      size="small"
                      sx={{ width: "100px" }}
                    />
                  </Box>
                ))}
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                  }}
                >
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleAddFoodItem}
                  >
                    Add Item
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNewFoodSubmit}
                  >
                    Save Visit
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setIsAddingFood(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
            <Typography variant="h6" gutterBottom>
              <Box sx={{ mt: 2 }}>
                {Array.isArray(localVisits) && localVisits.length > 0 ? (
                  localVisits.map((visit, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "primary.main",
                        }}
                      >
                        Visit {index + 1}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "primary.main",
                        }}
                      >
                        {visit.date
                          ? new Date(
                              visit.date.seconds * 1000
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No Date Found"}
                      </Typography>

                      {Object.entries(visit.food).map(
                        ([foodName, quantity]) => (
                          <Typography
                            key={foodName}
                            color="textSecondary"
                            component="div"
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              maxWidth: "300px",
                              margin: "0 auto",
                              py: 0.5,
                            }}
                          >
                            <span>{foodName}</span>
                            <span>× {String(quantity)}</span>
                          </Typography>
                        )
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">
                    No food records available
                  </Typography>
                )}
              </Box>
            </Typography>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              <a
                href={getGoogleMapsLink(
                  selectedFood.selectedLocation.boundingBox
                )}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                }}
              >
                <Icon
                  icon="logos:google-maps"
                  style={{ fontSize: "40px", color: "#4285F4" }}
                />
              </a>
              <a
                href={getWazeLink(selectedFood.selectedLocation.boundingBox)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                }}
              >
                <Icon
                  icon="mdi:waze"
                  style={{ fontSize: "40px", color: "#4285F4" }}
                />
              </a>
            </div>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", padding: "20px" }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FoodDialog;
