import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import UserWorkspace from './components/UserWorkspace';
import SettingsUsers from './components/SettingsUsers';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import EditProfile from './EditProfile';
import InquiryFeedback from './InquiryFeedback';
import TrainingProgram from './TrainingProgram';
import CompanyInfo from './CompanyInfo';
import OperatorRequisition from './OperatorRequisition';
import VesselVisits from './VesselVisits';
import CargoManifest from './CargoManifest'; // Add this import
import { Box, CssBaseline, CircularProgress } from '@mui/material';
import ContainerRequest from './ContainerRequest';
import ContainerPricingManager from './ContainerPricingManager';
import BookingForm from './BookingForm';
import AdHocResourceRequest from './AdHocResourceRequest';
import ContainerMenu from './ContainerMenu';
import TruckRegistration from './TruckRegistration';
import ContainerRequestsList from './ContainerRequestsList';
import FacilityandSpaceRental from './FacilityandSpaceRental';
import CargoSampling from './CargoSampling';
import CargoRepacking from './CargoRepacking';
import { useAuth } from './AuthContext';
import { jwtDecode } from "jwt-decode";

const drawerWidth = 240;

function App() {
  const { user, login, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const decodedToken = jwtDecode(token);
      setLoading(false);

    } else {
      setLoading(false);
    }
  }, [login]);

  const hasAccessRights = (requiredRights) => {
    // console.log('User access rights:', user?.accessRights);
    // console.log('Required rights:', requiredRights);
    if (!user || !user.accessRights) return false;
    const hasRights = requiredRights.some(right => user.accessRights.includes(right));
    // console.log('Has required rights:', hasRights);
    return hasRights;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {user && <Header user={user} />}
      {user && <Sidebar user={user} />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: user ? `calc(100% - ${drawerWidth}px)` : '100%',
          mt: user ? '80px' : 0,
          minHeight: '100vh',
        }}
      >
        <Routes>
          {user ? (
            <>
              <Route path="/" element={<UserWorkspace user={user} />} />
              {hasAccessRights(['View Inquiries and Feedbacks', 'Create Inquiries and Feedback']) && (
                <Route path="/manpower/inquiries-and-feedback" element={<InquiryFeedback user={user} />} />
              )}
              {hasAccessRights(['Enrol Training Program']) && (
                <Route path="/manpower/training-program" element={<TrainingProgram />} />
              )}
              {hasAccessRights(['View Operator Requisitions', 'Create Operator Requisition']) && (
                <Route path="/manpower/operator-requisition" element={<OperatorRequisition user={user} />} />
              )}
              <Route path="/settings/profile" element={<EditProfile user={user} />} />
              {hasAccessRights(['View Users List', 'Delete User', 'Invite User', 'Delete User Invitations', 'View Invitations List']) && (
                <Route path="/settings/users" element={<SettingsUsers user={user} />} />
              )}
              {hasAccessRights(['View Company Information', 'Edit Company Information']) && (
                <Route path="/settings/company" element={<CompanyInfo user={user} />} />
              )}
              {hasAccessRights(['View Vessel Visit Requests', 'Create Vessel Visit Request', 'Edit Vessel Visit Requests', 'Delete Vessel Visit Requests']) && (
                <Route path="/vessels/vessel-visit-request" element={<VesselVisits user={user} />} />
              )}
              {hasAccessRights(['Create Container Request', 'View Container Request']) && (
                <Route path="/cargos/container-request" element={<ContainerRequest user={user} />} />
              )}
              {hasAccessRights(['Create Container Pricings', 'View Container Pricings']) && (
                <Route path="/cargos/container-pricing-manager" element={<ContainerPricingManager user={user} />} />
              )}
              {hasAccessRights(['Create Container Menu', 'View Container Menu']) && (
                <Route path="/cargos/container-menu" element={<ContainerMenu user={user} />} />
              )}
              {hasAccessRights(['View Cargo Manifests', 'Submit Cargo Manifest', 'Update Cargo Manifest', 'Delete Cargo Manifest']) && (
                <Route path="/cargos/cargo-manifest" element={<CargoManifest user={user} />} />
              )}
              {hasAccessRights(['View Cargo Manifests', 'Submit Cargo Manifest', 'Update Cargo Manifest', 'Delete Cargo Manifest']) && (
                <Route path="/cargos/cargo-manifest" element={<CargoManifest user={user} />} />
              )}
              {hasAccessRights(['Create Cargo Booking']) && (
                <Route path="/cargos/booking-form" element={<BookingForm user={user} />} />
              )}
              <Route path="/vessels/ad-hoc-resource-request" element={<AdHocResourceRequest />} />
              {hasAccessRights(['Register Truck', 'View Truck Registrations']) && (
                <Route path="/cargos/truck-registration" element={<TruckRegistration user={user} />} />
              )}
              {hasAccessRights(['View Container Requests', 'Approve Container Requests']) && (
                <Route path="/cargos/container-requests-list" element={<ContainerRequestsList user={user} />} />
              )}
              {hasAccessRights(['Create Facility Rental']) && (
                <Route path="/cargos/facility-rental" element={<FacilityandSpaceRental />} />
              )}
              {hasAccessRights(['Create Sampling Request']) && (
                <Route path="/cargos/cargo-sampling" element={<CargoSampling />} />
              )}
              {hasAccessRights(['Create Repacking Request']) && (
                <Route path="/cargos/cargo-repacking" element={<CargoRepacking />} />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignUpForm />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
        </Routes>
      </Box>
    </Box>
  );
}

export default App;