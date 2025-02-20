import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";

const FoodList = () => {
  const { data: foods, loading: foodsLoading } =
    useFirestoreCollection("foods");
  console.log("Foods", foods);

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
        <Typography variant="h4" gutterBottom>
          Food List
        </Typography>
        {foodsLoading ? (
          <CircularProgress />
        ) : (
          <Grid container spacing={3}>
            {foods.map((food) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={food.id}>
                <Card
                  style={{
                    borderRadius: "15px",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  <CardContent>
                    <Typography variant="h6">{food.name}</Typography>
                    <Typography color="textSecondary">
                      {food.location}
                    </Typography>
                    <Typography variant="body2">{food.food}</Typography>
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
