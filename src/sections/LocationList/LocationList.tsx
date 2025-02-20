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
import LocationDialog from "../../components/LocationDialog";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { Images, Visit } from "../../utils/models";
import {
  getBoundingBox,
  getMapCenter,
  getGoogleMapsLink,
  getWazeLink,
} from "../../utils/mapUtils";

const LocationList = () => {
  const { data: locations, loading: locationLoading } =
    useFirestoreCollection("locations");
  const [images, setImages] = useState<Images>({});
  const { fetchUnsplashImage } = useUnsplash();
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      const newImages: Images = {};
      for (const location of locations) {
        if (!images[location.id]) {
          const mainFood = identifyFood(location.location);
          const imageUrl = await fetchUnsplashImage(mainFood);
          newImages[location.id] = imageUrl;
        }
      }
      setImages((prevImages) => ({ ...prevImages, ...newImages }));
    };

    if (locations.length > 0) {
      fetchImages();
    }
  }, [locations]);

  const handleClickOpen = (location: any) => {
    setSelectedLocation(location);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedLocation(null);
  };

  const handleAddNewVisit = async (foodId: string, newVisit: Visit) => {
    try {
      const locationRef = doc(db, "locations", foodId);
      const locationDoc = await getDoc(locationRef);

      if (locationDoc.exists()) {
        const currentData = locationDoc.data();
        const updatedVisit = Array.isArray(currentData.visits)
          ? [...currentData.visits, newVisit]
          : [currentData.visits, newVisit];

        await updateDoc(locationRef, {
          visits: updatedVisit,
        });
      }
    } catch (error) {
      console.error("Error adding new visit:", error);
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
          Location List
        </Typography>
        {locationLoading ? (
          <CircularProgress />
        ) : (
          <Grid container spacing={3}>
            {locations.map((food) => (
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
                        food.visits[food.visits.length - 1].date.seconds * 1000
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

      <LocationDialog
        open={open}
        onClose={handleClose}
        selectedFood={selectedLocation}
        images={images}
        getBoundingBox={getBoundingBox}
        getMapCenter={getMapCenter}
        getGoogleMapsLink={getGoogleMapsLink}
        getWazeLink={getWazeLink}
        onAddNewVisit={handleAddNewVisit}
      />
    </div>
  );
};

export default LocationList;
