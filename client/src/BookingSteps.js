import React from "react";
import { Stepper, Step, StepLabel, Typography, Box } from "@mui/material";
import { CheckCircle, Error, HourglassEmpty } from "@mui/icons-material";

// Function to determine the color based on status
const getColor = (status) => {
  switch (status) {
    case "complete":
      return "green";
    case "failed":
      return "red";
    case "incomplete":
    default:
      return "grey";
  }
};

// Function to determine the icon based on status
const getIcon = (status) => {
  switch (status) {
    case "complete":
      return <CheckCircle />;
    case "failed":
      return <Error />;
    case "incomplete":
    default:
      return <HourglassEmpty />;
  }
};

const BookingSteps = ({ containerRented, truckBooked, customsCleared, documentsChecked }) => {
  const stepStatuses = [
    { label: "Rent Containers", status: containerRented },
    { label: "Book Truck", status: truckBooked },
    { label: "Customs Clearance", status: customsCleared },
    { label: "Document Check", status: documentsChecked },
  ];

  return (
    <Box sx={{ width: "100%", mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Booking Process Status
      </Typography>
      <Stepper alternativeLabel>
        {stepStatuses.map((step, index) => (
          <Step key={index} active>
            <StepLabel
              icon={getIcon(step.status)}
              StepIconProps={{
                sx: {
                  color: getColor(step.status), // Custom color for the icon
                },
              }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default BookingSteps;
