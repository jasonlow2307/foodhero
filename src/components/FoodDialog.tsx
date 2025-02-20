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
import { useState } from "react";

interface FoodDialogProps {
  open: boolean;
  onClose: () => void;
  selectedFood: any;
  images: { [key: string]: string | null };
  getBoundingBox: (boundingBox: number[]) => string;
  getMapCenter: (boundingBox: number[]) => string;
  getGoogleMapsLink: (boundingBox: number[]) => string;
  getWazeLink: (boundingBox: number[]) => string;
  onAddNewFood: (
    foodId: string,
    newFood: { [key: string]: number }
  ) => Promise<void>;
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
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [newFood, setNewFood] = useState<{ [key: string]: number }>({});

  const handleAddFood = () => {
    setIsAddingFood(true);
    setNewFood({});
  };

  const handleNewFoodSubmit = async () => {
    if (Object.keys(newFood).length > 0) {
      await onAddNewFood(selectedFood.id, newFood);
      setIsAddingFood(false);
      setNewFood({});
    }
  };

  const handleAddFoodItem = () => {
    setNewFood({ ...newFood, "": 1 });
  };

  const handleFoodChange = (
    key: string,
    value: string | number,
    type: "name" | "quantity"
  ) => {
    const updatedFood = { ...newFood };
    if (type === "name") {
      const oldValue = updatedFood[key];
      delete updatedFood[key];
      updatedFood[value as string] = oldValue;
    } else {
      const foodName = key || Object.keys(updatedFood)[0];
      updatedFood[foodName] = Number(value);
    }
    setNewFood(updatedFood);
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
                  sx={{ mt: 2, mb: 2 }}
                >
                  Add New Visit
                </Button>
              </>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Add New Food Items
                </Typography>
                {Object.entries(newFood).map(([name, quantity], index) => (
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
                {Array.isArray(selectedFood.food) ? (
                  selectedFood.food.map((visit, index) => (
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
                        Visit #{index + 1}
                      </Typography>
                      {Object.entries(visit).map(([foodName, quantity]) => (
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
                      ))}
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
