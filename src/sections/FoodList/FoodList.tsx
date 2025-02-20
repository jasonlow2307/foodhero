import { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import { useUnsplash } from "../../utils/useUnsplash";
import { identifyFood } from "../../utils/identifyFood";

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
    console.log(food.selectedLocation.boundingBox);
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
              <Grid item xs={12} sm={6} md={4} lg={3} key={food.id}>
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
                  }}
                  onClick={() => handleClickOpen(food)}
                >
                  {images[food.id] && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={images[food.id] || undefined}
                      alt={food.location}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6">{food.location}</Typography>
                    <Typography color="textSecondary">{food.food}</Typography>
                    <Typography variant="body2">{food.name}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedFood?.location}</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
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
              <Typography variant="h6" gutterBottom>
                {selectedFood.location}
              </Typography>
              <Typography variant="body2">{selectedFood.name}</Typography>
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FoodList;
