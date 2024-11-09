import React from "react";
import { Stepper, Step, StepLabel, Typography, Box } from "@mui/material";
import { CheckCircle, Error, HourglassEmpty } from "@mui/icons-material";

const getStepIcon = (status) => {
  switch (status) {
    case true:
      return <CheckCircle sx={{ color: 'success.main' }} />;
    case false:
      return <Error sx={{ color: 'error.main' }} />;
    default:
      return <HourglassEmpty sx={{ color: 'grey.500' }} />;
  }
};

const BookingSteps = ({ isContainerRented, isTruckBooked, isCustomsCleared, isDocumentsChecked }) => {
  const steps = [
    {
      label: "Rent Containers",
      status: isContainerRented,
    },
    {
      label: "Book Truck",
      status: isTruckBooked,
    },
    {
      label: "Customs Clearance",
      status: isCustomsCleared,
      // Add tooltip or helper text
      helperText: isCustomsCleared ? 
        "Customs declaration approved" : 
        "Pending customs clearance"
    },
    {
      label: "Document Check",
      status: isDocumentsChecked,
    },
  ];

  return (
    <Box sx={{ width: "100%", p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Booking Process Status
      </Typography>
      <Stepper activeStep={-1} alternativeLabel>
        {steps.map((step, index) => (
          <Step key={index} completed={step.status === true}>
            <StepLabel
              error={step.status === false}
              icon={getStepIcon(step.status)}
              optional={
                step.status === false ? (
                  <Typography variant="caption" color="error">
                    Not Complete
                  </Typography>
                ) : null
              }
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