const path = require('path');
const { Storage } = require('@google-cloud/storage');
const { db, admin } = require('../config/firebase');

class AgencyService {
  constructor(db) {
    this.db = db;
    this.storage = new Storage({
      projectId: 'your-project-id',
      keyFilename: path.join(__dirname, '../../config/serviceAccountKey.json')
    });
    this.bucket = this.storage.bucket('pmis-47493.appspot.com');

    // Define agencies and their permissions
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

    // Define document requirements and their dependencies
    this.documentRequirements = {
      'Dangerous_Goods_Declaration': [],
      'UN_Classification_Sheet': ['Dangerous_Goods_Declaration'],
      'Packaging_Certification': ['Dangerous_Goods_Declaration'],
      'Transport_Safety_Permit': ['Packaging_Certification'],
      'Customs_Clearance_Certificate': [
        'Dangerous_Goods_Declaration',
        'UN_Classification_Sheet',
        'Transport_Safety_Permit'
      ]
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

      // Verify prerequisites if status is being set to APPROVED
      if (status === "APPROVED") {
        const prerequisites = this.documentRequirements[documentType] || [];
        for (const prereq of prerequisites) {
          const prereqStatus = bookingData.cargo[cargoId]?.documentStatus?.[prereq]?.status;
          if (prereqStatus !== "APPROVED") {
            throw new Error(`Required document ${prereq} is not approved yet`);
          }
        }
      }

      const updateData = {
        [`cargo.${cargoId}.documentStatus.${documentType}`]: {
          status: status,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: agency.name,
          agencyType: agency.type,
          comments: comments,
        },
      };

      await bookingRef.update(updateData);

      // Check if all required documents are approved for customs clearance
      if (this.shouldUpdateCustomsClearance(bookingData.cargo[cargoId], agency.category)) {
        await bookingRef.update({
          [`cargo.${cargoId}.isCustomsCleared`]: true,
        });
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

  shouldUpdateCustomsClearance(cargoData, category) {
    const requiredDocs = {
      EXPLOSIVES_AND_PYROTECHNICS: [
        "Dangerous_Goods_Declaration",
        "UN_Classification_Sheet",
        "Transport_Safety_Permit",
        "Customs_Clearance_Certificate"
      ],
      FRESH_FRUITS: [
        "phytosanitaryCertificate",
        "pesticideTestReport"
      ],
      PHARMACEUTICALS: [
        "gmpCertificate",
        "drugRegistrationCertificate"
      ]
    };

    const required = requiredDocs[category] || [];
    return required.every(doc => 
      cargoData.documentStatus?.[doc]?.status === "APPROVED"
    );
  }

  async getDocumentRequirements(agencyKey, documentType) {
    try {
      const agency = this.agencies[agencyKey];
      if (!agency) {
        throw new Error('Agency not found');
      }

      if (!agency.allowedDocuments.includes(documentType)) {
        throw new Error('Document type not supported by this agency');
      }

      return {
        documentType,
        requiredDocuments: this.documentRequirements[documentType] || [],
        agency: agency.name,
        category: agency.category,
        processingTimeInDays: this.getProcessingTime(documentType),
        fees: this.getDocumentFees(documentType)
      };
    } catch (error) {
      console.error('Error in getDocumentRequirements:', error);
      throw error;
    }
  }

  getProcessingTime(documentType) {
    const processingTimes = {
      'Dangerous_Goods_Declaration': 2,
      'UN_Classification_Sheet': 3,
      'Packaging_Certification': 2,
      'Transport_Safety_Permit': 4,
      'Customs_Clearance_Certificate': 5
    };
    return processingTimes[documentType] || 3; // Default processing time
  }

  getDocumentFees(documentType) {
    const fees = {
      'Dangerous_Goods_Declaration': 150,
      'UN_Classification_Sheet': 200,
      'Packaging_Certification': 175,
      'Transport_Safety_Permit': 250,
      'Customs_Clearance_Certificate': 300
    };
    return fees[documentType] || 100; // Default fee
  }

  async uploadDocument(bookingId, cargoId, documentType, file) {
    try {
      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = `documents/${bookingId}/${cargoId}/${documentType}/${fileName}`;
      const fileRef = this.bucket.file(filePath);
      
      await fileRef.save(file.buffer, {
        metadata: { contentType: file.mimetype }
      });

      await fileRef.makePublic();
      const downloadURL = `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;

      const bookingRef = this.db.collection('bookings').doc(bookingId);
      await bookingRef.update({
        [`cargo.${cargoId}.documents.${documentType}`]: downloadURL,
        [`cargo.${cargoId}.documentStatus.${documentType}`]: {
          status: 'PENDING',
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          uploadedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });

      return { url: downloadURL };
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      throw error;
    }
  }

  async getAgencyByKey(agencyKey) {
    try {
      const agency = this.agencies[agencyKey];
      if (!agency) {
        return null;
      }
      return {
        key: agencyKey,
        ...agency,
        active: true,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error in getAgencyByKey:', error);
      throw error;
    }
  }

  getHSCodeCategory(hsCode) {
    const chapter = hsCode.substring(0, 2);
    const categories = {
      '36': 'EXPLOSIVES_AND_PYROTECHNICS',
      '08': 'FRESH_FRUITS',
      '30': 'PHARMACEUTICALS'
    };
    return categories[chapter] || null;
  }

  async validateDocument(bookingId, cargoId, documentType, content) {
    try {
      const bookingRef = this.db.collection('bookings').doc(bookingId);
      const booking = await bookingRef.get();

      if (!booking.exists) {
        throw new Error('Booking not found');
      }

      const cargoData = booking.data().cargo[cargoId];
      if (!cargoData) {
        throw new Error('Cargo not found');
      }

      const hsCodeCategory = this.getHSCodeCategory(cargoData.hsCode);
      if (!hsCodeCategory) {
        throw new Error('Invalid HS code category');
      }

      // Perform document-specific validation
      const validationResult = this.performDocumentValidation(documentType, content, hsCodeCategory);
      
      return validationResult;
    } catch (error) {
      console.error('Error in validateDocument:', error);
      throw error;
    }
  }

  performDocumentValidation(documentType, content, category) {
    // Implement specific validation logic for each document type
    const validationRules = {
      'Dangerous_Goods_Declaration': {
        requiredFields: ['unNumber', 'properShippingName', 'class', 'packingGroup'],
        validateContent: (content) => {
          // Add specific validation logic
          return { isValid: true, message: 'Document validated successfully' };
        }
      },
      // Add validation rules for other document types
    };

    const rules = validationRules[documentType];
    if (!rules) {
      return { isValid: true, message: 'No specific validation rules for this document type' };
    }

    return rules.validateContent(content);
  }
}

module.exports = AgencyService;