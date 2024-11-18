import React, { useState, useEffect } from "react";
import { HSCodeCategories } from "./HSCodeCategories";
import { db } from "./firebaseConfig";
import EmptyLayout from "./layout/EmptyLayout";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getBookings, uploadBookingDocument } from "./services/api";

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

  // Fetch bookings using api.js
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const bookingsData = await getBookings();
        // Filter bookings for explosives based on HS code
        const explosivesBookings = bookingsData.filter((booking) => {
          // Check if any cargo in the booking has an HS code starting with '36'
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
    console.log(
      "asdfasfd" + JSON.stringify(agencyDoc.requiresDocuments, null, 2)
    );
    console.log(typeof agencyDoc.requiresDocuments);
    return agencyDoc ? agencyDoc.requiresDocuments : [];
  };

  // Check document prerequisites
  const checkDocumentPrerequisites = (cargoData, documentName) => {
    const requiredDocs = getDocumentRequirements(documentName);
    console.log("required documents are " + requiredDocs);
    if (!requiredDocs.length) return { isValid: true, missingDocs: [] };

    const missingDocs = requiredDocs.filter((docName) => {
      const docStatus = cargoData.documentStatus?.[docName];
      console.log("sd: " + docStatus + " " + docStatus.status);
      return (
        !docStatus ||
        (docStatus.status !== "COMPLETED" && docStatus.status !== "APPROVED")
      );
    });
    console.log(missingDocs);
    console.log(missingDocs.length === 0);

    return {
      isValid: missingDocs.length === 0,
      missingDocs,
    };
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Update document status in Firebase
  const updateDocumentStatus = async () => {
    if (
      !selectedAgency ||
      !selectedBooking ||
      !selectedCargo ||
      !selectedDocument
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      // Get current booking data
      const bookingRef = doc(db, "bookings", selectedBooking);
      const bookingDoc = await getDoc(bookingRef);

      if (!bookingDoc.exists()) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingDoc.data();
      const cargoData = bookingData.cargo[selectedCargo];

      // Check if document type is allowed for this agency
      if (
        !agencies[selectedAgency].allowedDocuments.includes(selectedDocument)
      ) {
        throw new Error("Agency not authorized to update this document type");
      }
      console.log("document status is " + documentStatus);
      // If trying to approve, check prerequisites
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

      // Upload the agency document
      const uploadResult = await uploadBookingDocument(
        selectedBooking,
        selectedCargo,
        selectedDocument,
        selectedFile
      );

      // Prepare update data
      const updateData = {
        [`cargo.${selectedCargo}.documentStatus.${selectedDocument}`]: {
          status: documentStatus || "APPROVED",
          lastUpdated: serverTimestamp(),
          updatedBy: agencies[selectedAgency].name,
          agencyType: agencies[selectedAgency].type,
          comments: comments,
        },
      };

      // Update document status
      await updateDoc(bookingRef, updateData);

      // If approved and this is Customs Clearance Certificate, update customs cleared status
      if (
        documentStatus === "APPROVED" &&
        selectedDocument === "Customs_Clearance_Certificate"
      ) {
        await updateDoc(bookingRef, {
          [`cargo.${selectedCargo}.isCustomsCleared`]: true,
        });
      }

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
            (HS Code 36){" "}
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
            <div className="mb-6 p-4 bg-red-50 border border-red-400 rounded-md text-red-700">
              {error}
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-400 rounded-md text-green-700">
              {success}
            </div>
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
            onClick={updateDocumentStatus}
          >
            {isLoading ? "Updating..." : "Update Document Status"}
          </button>
        </div>
      </div>
    </EmptyLayout>
  );
};

export default AgencySimulator;
