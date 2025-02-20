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

const FoodList = () => {
  const { data: foods, loading: foodsLoading } =
    useFirestoreCollection("foods");
  const [images, setImages] = useState<{ [key: string]: string | null }>({});
  const { fetchUnsplashImage } = useUnsplash();

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
                  }}
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
    </div>
  );
};

export default FoodList;
