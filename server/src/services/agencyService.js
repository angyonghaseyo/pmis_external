class AgencyService {
  constructor(db) {
    this.db = db;
    this.agencies = {
      "dangerous-goods-key-123": {
        name: "Dangerous Goods Safety Authority",
        type: "DANGEROUS_GOODS_AUTHORITY",
        allowedDocuments: [
          "Dangerous_Goods_Declaration",
          "UN_Classification_Sheet",
        ],
        category: "EXPLOSIVES_AND_PYROTECHNICS",
        description: "Authority for dangerous goods classification and safety",
      },
      "transport-safety-key-456": {
        name: "Transport Safety Board",
        type: "TRANSPORT_SAFETY_BOARD",
        allowedDocuments: [
          "Packaging_Certification",
          "Transport_Safety_Permit",
        ],
        category: "EXPLOSIVES_AND_PYROTECHNICS",
        description: "Authority for transport safety compliance",
      },
      "customs-key-789": {
        name: "Customs Authority",
        type: "CUSTOMS",
        allowedDocuments: ["Customs_Clearance_Certificate"],
        category: "EXPLOSIVES_AND_PYROTECHNICS",
        description: "Authority for customs clearance and control",
      },
      "phyto-agency-key-789": {
        name: "Phytosanitary Department",
        type: "PHYTOSANITARY",
        allowedDocuments: ["phytosanitaryCertificate", "pesticideTestReport"],
        category: "FRESH_FRUITS",
        description: "Authority for plant health certifications",
      },
      "pharma-agency-key-101": {
        name: "Pharmaceutical Control Board",
        type: "PHARMA",
        allowedDocuments: ["gmpCertificate", "drugRegistrationCertificate"],
        category: "PHARMACEUTICALS",
        description: "Authority for pharmaceutical regulations",
      },
    };
  }

  async getAgencies() {
    try {
      return Object.entries(this.agencies).map(([key, data]) => ({
        key,
        ...data,
        active: true,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error("Error in getAgencies:", error);
      throw error;
    }
  }

  async verifyAgencyAccess(agencyKey, documentType) {
    try {
      const agency = this.agencies[agencyKey];

      if (!agency) {
        return { isValid: false, error: "Invalid agency key" };
      }

      if (!agency.allowedDocuments.includes(documentType)) {
        return {
          isValid: false,
          error: `${agency.name} is not authorized to update ${documentType}`,
        };
      }

      return {
        isValid: true,
        agency,
      };
    } catch (error) {
      console.error("Error in verifyAgencyAccess:", error);
      throw error;
    }
  }

  async updateDocumentStatus(
    agencyKey,
    bookingId,
    cargoId,
    documentType,
    status,
    comments = ""
  ) {
    try {
      const verificationResult = await this.verifyAgencyAccess(
        agencyKey,
        documentType
      );
      if (!verificationResult.isValid) {
        throw new Error(verificationResult.error);
      }

      const { agency } = verificationResult;
      const bookingRef = this.db.collection("bookings").doc(bookingId);
      const booking = await bookingRef.get();

      if (!booking.exists) {
        throw new Error("Booking not found");
      }

      const bookingData = booking.data();
      if (!bookingData.cargo || !bookingData.cargo[cargoId]) {
        throw new Error("Cargo not found");
      }

      const updateData = {
        [`cargo.${cargoId}.documentStatus.${documentType}`]: {
          status: status,
          lastUpdated: new Date(),
          updatedBy: agency.name,
          agencyType: agency.type,
          comments: comments,
        },
      };

      await bookingRef.update(updateData);

      // Check if all required documents are approved
      const updatedBooking = await bookingRef.get();
      const cargoData = updatedBooking.data().cargo[cargoId];
      const category = this.getHSCodeCategory(cargoData.hsCode);

      if (category) {
        const allDocumentsApproved = this.checkAllDocumentsApproved(
          cargoData,
          category
        );
        if (allDocumentsApproved) {
          await bookingRef.update({
            [`cargo.${cargoId}.isCustomsCleared`]: true,
          });
        }
      }

      return {
        success: true,
        message: "Document status updated successfully",
        updatedBy: agency.name,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error in updateDocumentStatus:", error);
      throw error;
    }
  }

  getHSCodeCategory(hsCode) {
    const chapter = hsCode.substring(0, 2);
    switch (chapter) {
      case "01":
        return "LIVE_ANIMALS";
      case "08":
        return "FRESH_FRUITS";
      case "30":
        return "PHARMACEUTICALS";
      default:
        return null;
    }
  }

  checkAllDocumentsApproved(cargoData, category) {
    const requiredDocs = {
      LIVE_ANIMALS: [
        "veterinaryHealthCertificate",
        "animalWelfareCertification",
        "quarantineClearance",
      ],
      FRESH_FRUITS: ["phytosanitaryCertificate", "pesticideTestReport"],
      PHARMACEUTICALS: ["gmpCertificate", "drugRegistrationCertificate"],
    };

    return requiredDocs[category].every((doc) => {
      const docStatus = cargoData.documentStatus[doc];
      return docStatus && docStatus.status === "APPROVED";
    });
  }
}

module.exports = AgencyService;
