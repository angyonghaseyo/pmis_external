import { db } from './firebaseConfig';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export const initializeAgencies = async () => {
  // Define agencies with their API keys and permissions
  const agencies = {
    'vet-agency-key-123': {
      name: 'National Veterinary Authority',
      type: 'VETERINARY',
      allowedDocuments: ['veterinaryHealthCertificate', 'quarantineClearance'],
      category: 'LIVE_ANIMALS',
      description: 'National authority for animal health certifications'
    },
    'welfare-agency-key-456': {
      name: 'Animal Welfare Board',
      type: 'WELFARE',
      allowedDocuments: ['animalWelfareCertification'],
      category: 'LIVE_ANIMALS',
      description: 'Authority for animal welfare compliance'
    },
    'phyto-agency-key-789': {
      name: 'Phytosanitary Department',
      type: 'PHYTOSANITARY',
      allowedDocuments: ['phytosanitaryCertificate', 'pesticideTestReport'],
      category: 'FRESH_FRUITS',
      description: 'Authority for plant health certifications'
    },
    'pharma-agency-key-101': {
      name: 'Pharmaceutical Control Board',
      type: 'PHARMA',
      allowedDocuments: ['gmpCertificate', 'drugRegistrationCertificate'],
      category: 'PHARMACEUTICALS',
      description: 'Authority for pharmaceutical regulations'
    }
  };

  try {
    const agenciesRef = collection(db, 'agencies');
    for (const [key, data] of Object.entries(agencies)) {
      await setDoc(doc(agenciesRef, key), {
        ...data,
        createdAt: new Date(),
        active: true
      });
    }
    console.log('Agencies initialized successfully');
  } catch (error) {
    console.error('Error initializing agencies:', error);
  }
};

// Verify agency API key and permissions
export const verifyAgencyAccess = async (agencyKey, documentType) => {
  try {
    const agencyRef = doc(db, 'agencies', agencyKey);
    const agencyDoc = await getDoc(agencyRef);

    if (!agencyDoc.exists()) {
      return { isValid: false, error: 'Invalid agency key' };
    }

    const agencyData = agencyDoc.data();
    if (!agencyData.allowedDocuments.includes(documentType)) {
      return {
        isValid: false,
        error: `${agencyData.name} is not authorized to update ${documentType}`
      };
    }

    return {
      isValid: true,
      agency: agencyData
    };
  } catch (error) {
    console.error('Error verifying agency:', error);
    return { isValid: false, error: error.message };
  }
};

// Update document status
export const updateDocumentStatus = async ( // rectangle
  agencyKey,
  bookingId,
  cargoId,
  documentType,
  status,
  comments = ''
) => {
  try {
    // First verify agency access
    const verificationResult = await verifyAgencyAccess(agencyKey, documentType);
    if (!verificationResult.isValid) {
      throw new Error(verificationResult.error);
    }

    const { agency } = verificationResult;

       // Get current booking data
       const bookingRef = doc(db, 'bookings', bookingId);
       const bookingDoc = await getDoc(bookingRef);
   
       // Format document name to match the display format
       const formattedDocumentName = documentType
         .split(/(?=[A-Z])/)
         .join(' ')
         .replace(/^\w/, c => c.toUpperCase());

   
    const updateData = {
      [`cargo.${cargoId}.documentStatus.${formattedDocumentName}`]: {
        status: ProcessStatus[status],
        lastUpdated: new Date(),
        updatedBy: agency.name,
        agencyType: agency.type,
        comments: comments
      }
    };

    await updateDoc(bookingRef, updateData);

    
    const cargoData = bookingDoc.data().cargo[cargoId];
    const hsCode = cargoData.hsCode;
    const category = Object.values(HSCodeCategories).find(
      cat => hsCode.startsWith(cat.chapter)
    );

    
    if (category) {
      const allDocumentsApproved = category.requiredDocuments.every(doc => {
        const docStatus = cargoData.documentStatus[doc]?.status;
        return docStatus && docStatus.status === 'APPROVED';
      });

      if (allDocumentsApproved) {
        await updateDoc(bookingRef, {
          [`cargo.${cargoId}.isCustomsCleared`]: true
        });
      }
    }

    return {
      success: true,
      message: 'Document status updated successfully',
      updatedBy: agency.name,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('Error updating document status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// HS Code Categories and their specific requirements
export const HSCodeCategories = {
  LIVE_ANIMALS: {
    chapter: '01',
    description: 'Live Animals',
    processingOrder: [
      'VETERINARY_INSPECTION',
      'HEALTH_CERTIFICATION',
      'CITES_CHECK',
      'QUARANTINE_CLEARANCE',
      'TRANSPORT_APPROVAL',
      'CUSTOMS_DECLARATION',
      'FINAL_VETERINARY_CHECK'
    ],
    requiredDocuments: [
      'Veterinary Health Certificate',
      'Animal Welfare Certification',
      'CITES Permit (if applicable)',
      'Quarantine Clearance Certificate',
      'Live Animal Transport Declaration',
      'Export License',
      'Commercial Invoice',
      'Packing List'
    ],
    validations: {
      transportConditions: true,
      healthStatus: true,
      speciesRestrictions: true,
      quarantinePeriod: true
    }
  },

  FRESH_FRUITS: {
    chapter: '08',
    description: 'Fresh Fruits',
    processingOrder: [
      'PHYTOSANITARY_INSPECTION',
      'PESTICIDE_TESTING',
      'COLD_CHAIN_VERIFICATION',
      'PACKAGING_INSPECTION',
      'CUSTOMS_DECLARATION',
      'FINAL_QUALITY_CHECK'
    ],
    requiredDocuments: [
      'Phytosanitary Certificate',
      'Pesticide Residue Test Report',
      'Cold Chain Compliance Certificate',
      'Packaging Declaration',
      'Export License',
      'Certificate of Origin',
      'Commercial Invoice',
      'Packing List'
    ],
    validations: {
      pesticideLevel: true,
      coldChainMaintenance: true,
      packagingStandards: true,
      shelfLife: true
    }
  },

  PHARMACEUTICALS: {
    chapter: '30',
    description: 'Pharmaceutical Products',
    processingOrder: [
      'GMP_VERIFICATION',
      'DRUG_REGISTRATION_CHECK',
      'CONTROLLED_SUBSTANCE_CHECK',
      'STABILITY_VERIFICATION',
      'CUSTOMS_DECLARATION',
      'FINAL_QUALITY_ASSURANCE'
    ],
    requiredDocuments: [
      'GMP Certificate',
      'Drug Registration Certificate',
      'Export License for Pharmaceuticals',
      'Certificate of Pharmaceutical Product (CPP)',
      'Batch Analysis Certificate',
      'Stability Study Report',
      'Commercial Invoice',
      'Packing List'
    ],
    validations: {
      controlledSubstance: true,
      storageConditions: true,
      expiryDates: true,
      batchTracking: true
    }
  }
};

export const ProcessStatus = {
  PENDING: 'IN_PROGRESS',
  APPROVED: 'COMPLETED',
  REJECTED: 'REJECTED',
  NOT_STARTED: 'NOT_STARTED'
};

class CustomsTradeManager {
  constructor() {
    this.currentCategory = null;
    this.processStatus = {};
  }

  determineCategory(hsCode) {
    const chapter = hsCode.substring(0, 2);
    
    if (chapter === '01') return 'LIVE_ANIMALS';
    if (chapter === '08') return 'FRESH_FRUITS';
    if (chapter === '30') return 'PHARMACEUTICALS';
    
    throw new Error('Unsupported HS Code category');
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
        steps: category.processingOrder.map(step => ({
          name: step,
          status: ProcessStatus.NOT_STARTED,
          validations: {},
          documents: []
        }))
      };

      // Add category-specific initialization
      switch (this.currentCategory) {
        case 'LIVE_ANIMALS':
          await this.initializeAnimalExport(exportData);
          break;
        case 'FRESH_FRUITS':
          await this.initializeFruitExport(exportData);
          break;
        case 'PHARMACEUTICALS':
          await this.initializePharmaceuticalExport(exportData);
          break;
      }

      return this.processStatus;
    } catch (error) {
      console.error('Error initializing export process:', error);
      throw error;
    }
  }

  async initializeAnimalExport(exportData) {
    return {
      speciesAllowed: this.checkSpeciesRestrictions(exportData.species),
      healthStatus: this.validateHealthCertificates(exportData.healthCerts),
      transportConditions: this.validateTransportConditions(exportData.transport),
      quarantineCompliance: this.checkQuarantineRequirements(exportData)
    };
  }

  async initializeFruitExport(exportData) {
    return {
      temperatureRange: this.validateTemperatureRequirements(exportData.temperature),
      humidityControl: this.validateHumidityRequirements(exportData.humidity),
      storageFacilities: this.validateStorageFacilities(exportData.storage),
      transportConditions: this.validateTransportConditions(exportData.transport)
    };
  }

  async initializePharmaceuticalExport(exportData) {
    return {
      substanceSchedule: this.checkSubstanceSchedule(exportData.substance),
      exportAuthorization: this.validateExportAuthorization(exportData.authorization),
      securityMeasures: this.validateSecurityProtocols(exportData.security),
      trackingSystem: this.validateTrackingSystem(exportData.tracking)
    };
  }

  // Validation methods
  checkSpeciesRestrictions(species) {
    // Implement species restriction checks
    return { isValid: true, restrictions: [] };
  }

  validateHealthCertificates(certificates) {
    // Implement health certificate validation
    return { isValid: true, issues: [] };
  }

  validateTransportConditions(transport) {
    // Implement transport conditions validation
    return { isValid: true, conditions: [] };
  }

  checkQuarantineRequirements(data) {
    // Implement quarantine requirements check
    return { isValid: true, requirements: [] };
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
    return { isValid: true, schedule: '' };
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
    const currentStep = this.processStatus.steps[this.processStatus.currentStep];
    
    if (currentStep.status !== ProcessStatus.COMPLETED) {
      throw new Error('Current step must be completed before progressing');
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
    const currentStep = this.processStatus.steps[this.processStatus.currentStep];

    return {
      step: currentStep.name,
      documents: category.requiredDocuments,
      validations: category.validations
    };
  }

  // Validate current step
  validateCurrentStep() {
    const currentStep = this.processStatus.steps[this.processStatus.currentStep];
    const category = HSCodeCategories[this.currentCategory];

    // Implement step-specific validation logic
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: []
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
        step => step.status === ProcessStatus.COMPLETED
      ).length,
      status: this.processStatus.steps[this.processStatus.currentStep].status
    };
  }

  // Check if process is complete
  isProcessComplete() {
    return this.processStatus.steps.every(
      step => step.status === ProcessStatus.COMPLETED
    );
  }
}

export default CustomsTradeManager;