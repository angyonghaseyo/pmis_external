import React, { useState, useEffect } from "react";
import {
  getAgencies,
  verifyAgencyAccess,
  updateDocumentStatus,
  getBookings,
  uploadBookingDocument,
} from "./services/api";
import EmptyLayout from "./layout/EmptyLayout";
import { Alert } from '@mui/material';
import { InfoOutlined as AlertCircle } from '@mui/icons-material';

const HSCodeCategories = {
  EXPLOSIVES_AND_PYROTECHNICS: {
    documents: {
      agency: [
        {
          name: "Dangerous_Goods_Declaration",
          requiresDocuments: ["Safety_Data_Sheet"],
        },
        {
          name: "UN_Classification_Sheet",
          requiresDocuments: ["Dangerous_Goods_Declaration"],
        },
        {
          name: "Packaging_Certification",
          requiresDocuments: ["Dangerous_Goods_Declaration"],
        },
        {
          name: "Transport_Safety_Permit",
          requiresDocuments: ["Packaging_Certification"],
        },
        {
          name: "Customs_Clearance_Certificate",
          requiresDocuments: [
            "Dangerous_Goods_Declaration",
            "UN_Classification_Sheet",
            "Transport_Safety_Permit",
          ],
        },
      ],
    },
  },
};

const AgencySimulator = () => {
  // State management
  const [agencies, setAgencies] = useState({
    "dangerous-goods-key-123": {
      name: "Dangerous Goods Safety Authority",
      type: "DANGEROUS_GOODS_AUTHORITY",
      allowedDocuments: [
        "Dangerous_Goods_Declaration",
        "UN_Classification_Sheet",
      ],
    },
    "transport-safety-key-456": {
      name: "Transport Safety Board",
      type: "TRANSPORT_SAFETY_BOARD",
      allowedDocuments: ["Packaging_Certification", "Transport_Safety_Permit"],
    },
    "customs-key-789": {
      name: "Customs Authority",
      type: "CUSTOMS",
      allowedDocuments: ["Customs_Clearance_Certificate"],
    },
  });
  const [bookings, setBookings] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [selectedBooking, setSelectedBooking] = useState("");
  const [selectedCargo, setSelectedCargo] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("");
  const [documentStatus, setDocumentStatus] = useState("");
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prerequisites, setPrerequisites] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const bookingsData = await getBookings();
        // Filter bookings for explosives based on HS code
        const explosivesBookings = bookingsData.filter((booking) => {
          return Object.values(booking.cargo || {}).some((cargo) =>
            cargo.hsCode?.startsWith("36")
          );
        });
        setBookings(explosivesBookings);
      } catch (error) {
        setError("Error fetching bookings: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Get document requirements from HSCodeCategories
  const getDocumentRequirements = (documentName) => {
    const explosivesCategory = HSCodeCategories.EXPLOSIVES_AND_PYROTECHNICS;
    const agencyDoc = explosivesCategory.documents.agency.find(
      (doc) => doc.name === documentName
    );
    return agencyDoc ? agencyDoc.requiresDocuments : [];
  };

  // Check document prerequisites
  const checkDocumentPrerequisites = (cargoData, documentName) => {
    const requiredDocs = getDocumentRequirements(documentName);
    if (!requiredDocs.length) return { isValid: true, missingDocs: [] };

    const missingDocs = requiredDocs.filter((docName) => {
      const docStatus = cargoData.documentStatus?.[docName];
      return (
        !docStatus ||
        (docStatus.status !== "COMPLETED" && docStatus.status !== "APPROVED")
      );
    });

    return {
      isValid: missingDocs.length === 0,
      missingDocs,
    };
  };

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Update document status
  const updateDocumentStatusHandler = async () => {
    if (
      !selectedAgency ||
      !selectedBooking ||
      !selectedCargo ||
      !selectedDocument ||
      !selectedFile
    ) {
      setError("Please fill in all required fields and upload a document");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      // Get current booking data
      const selectedBookingData = bookings.find(
        (b) => b.bookingId === selectedBooking
      );
      if (!selectedBookingData) {
        throw new Error("Selected booking not found");
      }

      const cargoData = selectedBookingData.cargo[selectedCargo];

      // Check agency authorization
      const verifyResult = await verifyAgencyAccess(
        selectedAgency,
        selectedDocument
      );
      if (!verifyResult.isValid) {
        throw new Error(verifyResult.error);
      }

      // Check prerequisites for approval
      if (documentStatus === "APPROVED") {
        const { isValid, missingDocs } = checkDocumentPrerequisites(
          cargoData,
          selectedDocument
        );
        if (!isValid) {
          throw new Error(
            `Missing required documents: ${missingDocs.join(", ")}`
          );
        }
      }

      // Upload the document
      await uploadBookingDocument(
        selectedBooking,
        selectedCargo,
        selectedDocument,
        selectedFile
      );

      // Update the document status
      await updateDocumentStatus(
        selectedAgency,
        selectedBooking,
        selectedCargo,
        selectedDocument,
        documentStatus,
        comments
      );

      setSuccess("Document status updated successfully");
      setComments("");
      setSelectedFile(null);

      // Reset form except agency selection
      setSelectedDocument("");
      setDocumentStatus("PENDING");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update prerequisites when document is selected
  useEffect(() => {
    if (selectedDocument) {
      const reqs = getDocumentRequirements(selectedDocument);
      setPrerequisites(reqs);
    } else {
      setPrerequisites([]);
    }
  }, [selectedDocument]);

  return (
    <EmptyLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">
            TradeNet Portal for Agencies that handle Explosives and Pyrotechnics
            (HS Code 36)
          </h1>

          {/* Agency Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Agency
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={selectedAgency}
              onChange={(e) => {
                setSelectedAgency(e.target.value);
                setSelectedDocument("");
              }}
            >
              <option value="">Select an agency...</option>
              {Object.entries(agencies).map(([key, agency]) => (
                <option key={key} value={key}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Booking and Cargo Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Booking
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={selectedBooking}
                onChange={(e) => {
                  setSelectedBooking(e.target.value);
                  setSelectedCargo("");
                }}
              >
                <option value="">Select a booking...</option>
                {bookings.map((booking) => (
                  <option key={booking.bookingId} value={booking.bookingId}>
                    {booking.bookingId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Cargo
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={selectedCargo}
                onChange={(e) => setSelectedCargo(e.target.value)}
                disabled={!selectedBooking}
              >
                <option value="">Select cargo...</option>
                {selectedBooking &&
                  bookings.find((b) => b.bookingId === selectedBooking)
                    ?.cargo &&
                  Object.keys(
                    bookings.find((b) => b.bookingId === selectedBooking).cargo
                  )
                    .filter((cargoId) => {
                      const cargo = bookings.find(
                        (b) => b.bookingId === selectedBooking
                      ).cargo[cargoId];
                      return cargo.hsCode?.startsWith("36");
                    })
                    .map((cargoId) => (
                      <option key={cargoId} value={cargoId}>
                        Cargo {cargoId} (HS:{" "}
                        {
                          bookings.find((b) => b.bookingId === selectedBooking)
                            .cargo[cargoId].hsCode
                        }
                        )
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Document Selection and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={selectedDocument}
                onChange={(e) => setSelectedDocument(e.target.value)}
                disabled={!selectedAgency}
              >
                <option value="">Select document...</option>
                {selectedAgency &&
                  agencies[selectedAgency]?.allowedDocuments.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc.replace(/_/g, " ")}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={documentStatus}
                onChange={(e) => setDocumentStatus(e.target.value)}
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md p-2"
              accept=".pdf,.doc,.docx"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-500">
                Selected file: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Prerequisites Display */}
          {prerequisites.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">
                Required Prerequisites:
              </h3>
              <ul className="list-disc list-inside text-blue-700">
                {prerequisites.map((doc) => (
                  <li key={doc}>{doc.replace(/_/g, " ")}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Comments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows="4"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter review comments..."
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert severity="error" className="mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            </Alert>
          )}

          {/* Success Display */}
          {success && (
            <Alert severity="success" className="mb-6">
              {success}
            </Alert>
          )}

          {/* Submit Button */}
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:bg-gray-400"
            disabled={
              isLoading ||
              !selectedAgency ||
              !selectedBooking ||
              !selectedCargo ||
              !selectedDocument ||
              !selectedFile
            }
            onClick={updateDocumentStatusHandler}
          >
            {isLoading ? "Updating..." : "Update Document Status"}
          </button>
        </div>
      </div>
    </EmptyLayout>
  );
};

export default AgencySimulator;