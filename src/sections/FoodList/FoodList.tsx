import { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  CardMedia,
} from "@mui/material";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import { useUnsplash } from "../../utils/useUnsplash";
import { identifyFood } from "../../utils/identifyFood";
import FoodDialog, { Visit } from "../../components/FoodDialog";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const FoodList = () => {
  const { data: foods, loading: foodsLoading } =
    useFirestoreCollection("foods");
  const [images, setImages] = useState<{ [key: string]: string | null }>({});
  const { fetchUnsplashImage } = useUnsplash();
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      const newImages: { [key: string]: string | null } = {};
      for (const food of foods) {
        if (!images[food.id]) {
          const mainFood = await identifyFood(food.location);
          const imageUrl = await fetchUnsplashImage(mainFood);
          newImages[food.id] = imageUrl;
        }
      }
      setImages((prevImages) => ({ ...prevImages, ...newImages }));
    };

    if (foods.length > 0) {
      fetchImages();
    }
  }, [foods]);

  const handleClickOpen = (food: any) => {
    setSelectedFood(food);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFood(null);
  };

  const getBoundingBox = (boundingBox: number[]) => {
    const [minLat, maxLat, minLon, maxLon] = boundingBox;
    return `${minLon},${minLat},${maxLon},${maxLat}`;
  };

  const getMapCenter = (boundingBox: number[]) => {
    const [minLat, maxLat, minLon, maxLon] = boundingBox.map(Number);
    const centerLat =
      Number.isFinite(minLat) && Number.isFinite(maxLat)
        ? (minLat + maxLat) / 2
        : 0;
    const centerLon =
      Number.isFinite(minLon) && Number.isFinite(maxLon)
        ? (minLon + maxLon) / 2
        : 0;
    return `${centerLat},${centerLon}`;
  };

  const getGoogleMapsLink = (boundingBox: number[]) => {
    const [minLat, maxLat, minLon, maxLon] = boundingBox.map(Number);
    const centerLat =
      Number.isFinite(minLat) && Number.isFinite(maxLat)
        ? (minLat + maxLat) / 2
        : 0;
    const centerLon =
      Number.isFinite(minLon) && Number.isFinite(maxLon)
        ? (minLon + maxLon) / 2
        : 0;
    return `https://www.google.com/maps/dir/?api=1&destination=${centerLat},${centerLon}`;
  };

  const getWazeLink = (boundingBox: number[]) => {
    const [minLat, maxLat, minLon, maxLon] = boundingBox.map(Number);
    const centerLat =
      Number.isFinite(minLat) && Number.isFinite(maxLat)
        ? (minLat + maxLat) / 2
        : 0;
    const centerLon =
      Number.isFinite(minLon) && Number.isFinite(maxLon)
        ? (minLon + maxLon) / 2
        : 0;
    return `https://waze.com/ul?ll=${centerLat},${centerLon}&navigate=yes`;
  };

  const handleAddNewFood = async (foodId: string, newFood: Visit) => {
    try {
      const foodRef = doc(db, "foods", foodId);
      const foodDoc = await getDoc(foodRef);

      if (foodDoc.exists()) {
        const currentData = foodDoc.data();
        const updatedFood = Array.isArray(currentData.visits)
          ? [...currentData.visits, newFood]
          : [currentData.visits, newFood];

        await updateDoc(foodRef, {
          visits: updatedFood,
        });
      }
    } catch (error) {
      console.error("Error adding new food:", error);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Container maxWidth="lg" style={{ marginTop: "40px" }}>
        <Typography variant="h4" gutterBottom mb={3}>
          Food List
        </Typography>
        {foodsLoading ? (
          <CircularProgress />
        ) : (
          <Grid container spacing={3}>
            {foods.map((food) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                key={food.id}
                pb={3}
                pt={0}
              >
                <Card
                  sx={{
                    borderRadius: "15px",
                    textAlign: "center",
                    padding: "20px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                    },
                    cursor: "pointer",
                    height: "330px",
                  }}
                  onClick={() => handleClickOpen(food)}
                >
                  {images[food.id] && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={images[food.id] || undefined}
                      alt={food.location}
                      sx={{ borderRadius: 3 }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3 }}>
                      {food.location}
                    </Typography>
                    <Typography variant="body2">{food.name}</Typography>
                    <Typography variant="body2">
                      {new Date(
                        food.visits[0].date.seconds * 1000
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <FoodDialog
        open={open}
        onClose={handleClose}
        selectedFood={selectedFood}
        images={images}
        getBoundingBox={getBoundingBox}
        getMapCenter={getMapCenter}
        getGoogleMapsLink={getGoogleMapsLink}
        getWazeLink={getWazeLink}
        onAddNewFood={handleAddNewFood}
      />
    </div>
  );
};

export default FoodList;
