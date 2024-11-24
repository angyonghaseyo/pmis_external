import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Snackbar,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import { registerTruckForCargo, getBookings } from "./services/api";

const TruckRegistration = () => {
  const [cargoId, setCargoId] = useState("");
  const [truckLicense, setTruckLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [availableCargo, setAvailableCargo] = useState([]);
  const { user } = useAuth();


  useEffect(() => {
    const fetchBookings = async () => {
      const bookingsData = await getBookings();
      const userBookings = bookingsData.filter(booking => booking.userEmail === user.email);
      const eligibleCargo = [];
      userBookings.forEach((booking) => {
        Object.entries(booking.cargo || {}).forEach(([cargoId, cargo]) => {
          if (cargo.isContainerRented === true) {
            eligibleCargo.push({
              cargoId: cargoId,
              bookingId: booking.bookingId,
              name: cargo.name,
              hsCode: cargo.hsCode,
            });
          }
        });
      });
      setAvailableCargo(eligibleCargo);
    };
    fetchBookings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await registerTruckForCargo(cargoId, truckLicense);
      setSuccess(true);
      setCargoId("");
      setTruckLicense("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card elevation={4}>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <LocalShippingIcon
              sx={{ fontSize: 40, color: "primary.main", mb: 2 }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              Truck Registration
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Assign a truck to cargo shipment
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <InventoryIcon sx={{ color: "action.active" }} />
                  </Grid>
                  <Grid item xs>
                    <FormControl fullWidth required sx={{ mb: 2 }}>
                      <InputLabel>Select Cargo</InputLabel>
                      <Select
                        value={cargoId}
                        onChange={(e) => setCargoId(e.target.value)}
                        label="Select Cargo"
                        disabled={loading}
                      >
                        {availableCargo.map((cargo) => (
                          <MenuItem key={cargo.cargoId} value={cargo.cargoId}>
                            Booking {cargo.bookingId} - Cargo {cargo.cargoId} -{" "}
                            {cargo.name} (HS: {cargo.hsCode})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <LocalShippingIcon sx={{ color: "action.active" }} />
                  </Grid>
                  <Grid item xs>
                    <TextField
                      label="Truck License Plate"
                      variant="outlined"
                      fullWidth
                      value={truckLicense}
                      onChange={(e) => setTruckLicense(e.target.value)}
                      required
                      disabled={loading}
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: "bold",
                textTransform: "none",
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Register Truck"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{ width: "100%" }}
        >
          Truck successfully registered to cargo!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TruckRegistration;
