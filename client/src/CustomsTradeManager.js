import { db } from "./firebaseConfig";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { HSCodeCategories, ProcessStatus } from './HSCodeCategories.js';


export const initializeAgencies = async () => {
  // Define agencies with their API keys and permissions
  const agencies = {
    "dangerous-goods-key-123": {
      name: "Dangerous Goods Safety Authority",
      type: "DANGEROUS_GOODS",
      allowedDocuments: [
        "dangerousGoodsDeclaration",
        "safetyDataSheet",
        "explosivesLicense",
      ],
      category: "EXPLOSIVES_AND_PYROTECHNICS",
      description: "National authority for dangerous goods regulation",
    },
    "safety-agency-key-456": {
      name: "Transport Safety Board",
      type: "SAFETY",
      allowedDocuments: ["transportSafetyPermit", "packagingCertification"],
      category: "EXPLOSIVES_AND_PYROTECHNICS",
      description: "Authority for transport safety compliance",
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

  try {
    const agenciesRef = collection(db, "agencies");
    for (const [key, data] of Object.entries(agencies)) {
      await setDoc(doc(agenciesRef, key), {
        ...data,
        createdAt: new Date(),
        active: true,
      });
    }
    console.log("Agencies initialized successfully");
  } catch (error) {
    console.error("Error initializing agencies:", error);
  }
};

// Verify agency API key and permissions
export const verifyAgencyAccess = async (agencyKey, documentType) => {
  try {
    const agencyRef = doc(db, "agencies", agencyKey);
    const agencyDoc = await getDoc(agencyRef);

    if (!agencyDoc.exists()) {
      return { isValid: false, error: "Invalid agency key" };
    }

    const agencyData = agencyDoc.data();
    if (!agencyData.allowedDocuments.includes(documentType)) {
      return {
        isValid: false,
        error: `${agencyData.name} is not authorized to update ${documentType}`,
      };
    }

    return {
      isValid: true,
      agency: agencyData,
    };
  } catch (error) {
    console.error("Error verifying agency:", error);
    return { isValid: false, error: error.message };
  }
};

// Update document status
export const updateDocumentStatus = async (
  // rectangle
  agencyKey,
  bookingId,
  cargoId,
  documentType,
  status,
  comments = ""
) => {
  try {
    // First verify agency access
    const verificationResult = await verifyAgencyAccess(
      agencyKey,
      documentType
    );
    if (!verificationResult.isValid) {
      throw new Error(verificationResult.error);
    }

    const { agency } = verificationResult;

    // Get current booking data
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingDoc = await getDoc(bookingRef);

    // Format document name to match the display format
    const formattedDocumentName = documentType
      .split(/(?=[A-Z])/)
      .join(" ")
      .replace(/^\w/, (c) => c.toUpperCase());

    const updateData = {
      [`cargo.${cargoId}.documentStatus.${formattedDocumentName}`]: {
        status: ProcessStatus[status],
        lastUpdated: new Date(),
        updatedBy: agency.name,
        agencyType: agency.type,
        comments: comments,
      },
    };

    await updateDoc(bookingRef, updateData);

    const cargoData = bookingDoc.data().cargo[cargoId];
    const hsCode = cargoData.hsCode;
    const category = Object.values(HSCodeCategories).find((cat) =>
      hsCode.startsWith(cat.chapter)
    );

    if (category) {
      const allDocumentsApproved = category.requiredDocuments.every((doc) => {
        const docStatus = cargoData.documentStatus[doc]?.status;
        return docStatus && docStatus.status === "APPROVED";
      });

      if (allDocumentsApproved) {
        await updateDoc(bookingRef, {
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
    console.error("Error updating document status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};


class CustomsTradeManager {
  constructor() {
    this.currentCategory = null;
    this.processStatus = {};
  }

  determineCategory(hsCode) {
    const chapter = hsCode.substring(0, 2);

    if (chapter === "36") return "EXPLOSIVES_AND_PYROTECHNICS";
    if (chapter === "08") return "FRESH_FRUITS";
    if (chapter === "30") return "PHARMACEUTICALS";

    throw new Error("Unsupported HS Code category");
  }

  async initializeExportProcess(hsCode, exportData) {
    try {
      this.currentCategory = this.determineCategory(hsCode);
      const category = HSCodeCategories[this.currentCategory];

      // Initialize process status
      this.processStatus = {
        category: this.currentCategory,
        hsCode,
        currentStep: 0,
        steps: category.processingOrder.map((step) => ({
          name: step,
          status: ProcessStatus.NOT_STARTED,
          validations: {},
          documents: [],
        })),
      };

      // Add category-specific initialization
      switch (this.currentCategory) {
        case "EXPLOSIVES_AND_PYROTECHNICS":
          await this.initializeDangerousGoodsExport(exportData);
          break;
        case "FRESH_FRUITS":
          await this.initializeFruitExport(exportData);
          break;
        case "PHARMACEUTICALS":
          await this.initializePharmaceuticalExport(exportData);
          break;
      }

      return this.processStatus;
    } catch (error) {
      console.error("Error initializing export process:", error);
      throw error;
    }
  }

  async initializeDangerousGoodsExport(exportData) {
    return {
      hazardClass: this.validateHazardClassification(exportData.hazardClass),
      safetyData: this.validateSafetyDataSheet(exportData.safetyData),
      packagingCertification: this.validatePackaging(exportData.packaging),
      emergencyProcedures: this.validateEmergencyProcedures(
        exportData.emergency
      ),
    };
  }

  async initializeFruitExport(exportData) {
    return {
      temperatureRange: this.validateTemperatureRequirements(
        exportData.temperature
      ),
      humidityControl: this.validateHumidityRequirements(exportData.humidity),
      storageFacilities: this.validateStorageFacilities(exportData.storage),
      transportConditions: this.validateTransportConditions(
        exportData.transport
      ),
    };
  }

  async initializePharmaceuticalExport(exportData) {
    return {
      substanceSchedule: this.checkSubstanceSchedule(exportData.substance),
      exportAuthorization: this.validateExportAuthorization(
        exportData.authorization
      ),
      securityMeasures: this.validateSecurityProtocols(exportData.security),
      trackingSystem: this.validateTrackingSystem(exportData.tracking),
    };
  }

  // Validation methods
  validateHazardClassification(hazardClass) {
    // Implement hazard classification validation
    return { isValid: true, classification: {} };
  }

  validateSafetyDataSheet(safetyData) {
    // Implement safety data sheet validation
    return { isValid: true, safetyInfo: {} };
  }

  validatePackaging(packaging) {
    // Implement packaging validation for dangerous goods
    return { isValid: true, certification: {} };
  }

  validateEmergencyProcedures(procedures) {
    // Implement emergency procedures validation
    return { isValid: true, procedures: [] };
  }

  validateTemperatureRequirements(temperature) {
    // Implement temperature validation
    return { isValid: true, range: {} };
  }

  validateHumidityRequirements(humidity) {
    // Implement humidity validation
    return { isValid: true, range: {} };
  }

  validateStorageFacilities(storage) {
    // Implement storage facility validation
    return { isValid: true, facilities: [] };
  }

  checkSubstanceSchedule(substance) {
    // Implement substance schedule check
    return { isValid: true, schedule: "" };
  }

  validateExportAuthorization(authorization) {
    // Implement export authorization validation
    return { isValid: true, authorization: {} };
  }

  validateSecurityProtocols(security) {
    // Implement security protocol validation
    return { isValid: true, protocols: [] };
  }

  validateTrackingSystem(tracking) {
    // Implement tracking system validation
    return { isValid: true, system: {} };
  }

  // Progress management
  async progressToNextStep() {
    const currentStep =
      this.processStatus.steps[this.processStatus.currentStep];

    if (currentStep.status !== ProcessStatus.COMPLETED) {
      throw new Error("Current step must be completed before progressing");
    }

    this.processStatus.currentStep++;
    if (this.processStatus.currentStep < this.processStatus.steps.length) {
      const nextStep = this.processStatus.steps[this.processStatus.currentStep];
      nextStep.status = ProcessStatus.IN_PROGRESS;
    }

    return this.processStatus;
  }

  // Get current process requirements
  getCurrentRequirements() {
    const category = HSCodeCategories[this.currentCategory];
    const currentStep =
      this.processStatus.steps[this.processStatus.currentStep];

    return {
      step: currentStep.name,
      documents: category.requiredDocuments,
      validations: category.validations,
    };
  }

  // Validate current step
  validateCurrentStep() {
    const currentStep =
      this.processStatus.steps[this.processStatus.currentStep];
    const category = HSCodeCategories[this.currentCategory];

    // Implement step-specific validation logic
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Update step status based on validation results
    if (validationResults.isValid) {
      currentStep.status = ProcessStatus.COMPLETED;
    } else {
      currentStep.status = ProcessStatus.REJECTED;
    }

    return validationResults;
  }

  // Get process summary
  getProcessSummary() {
    return {
      category: this.currentCategory,
      currentStep: this.processStatus.currentStep,
      totalSteps: this.processStatus.steps.length,
      completedSteps: this.processStatus.steps.filter(
        (step) => step.status === ProcessStatus.COMPLETED
      ).length,
      status: this.processStatus.steps[this.processStatus.currentStep].status,
    };
  }

  // Check if process is complete
  isProcessComplete() {
    return this.processStatus.steps.every(
      (step) => step.status === ProcessStatus.COMPLETED
    );
  }
}

export default CustomsTradeManager;
