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
export const updateDocumentStatus = async (
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

    // Update the document status
    const bookingRef = doc(db, 'bookings', bookingId);
    const updateData = {
      [`cargo.${cargoId}.documentStatus.${documentType}`]: {
        status: status,
        lastUpdated: new Date(),
        updatedBy: agency.name,
        agencyType: agency.type,
        comments: comments
      }
    };

    await updateDoc(bookingRef, updateData);

    // Check if all required documents are approved
    const bookingDoc = await getDoc(bookingRef);
    const cargoData = bookingDoc.data().cargo[cargoId];

    // Get the category and required documents
    const category = HSCodeCategories[agency.category];
    if (category) {
      const allDocumentsApproved = category.requiredDocuments.every(doc => {
        const docStatus = cargoData.documentStatus[doc];
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
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
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
    // Specific validations for live animals
    this.validateLiveAnimalRequirements(exportData);
    // Setup quarantine monitoring
    this.setupQuarantineMonitoring(exportData);
    // Initialize veterinary inspection schedule
    this.scheduleVeterinaryInspections(exportData);
  }

  async initializeFruitExport(exportData) {
    // Initialize cold chain monitoring
    this.setupColdChainMonitoring(exportData);
    // Schedule phytosanitary inspections
    this.schedulePestInspections(exportData);
    // Setup quality control checkpoints
    this.initializeQualityControl(exportData);
  }

  async initializePharmaceuticalExport(exportData) {
    // Verify controlled substance compliance
    this.verifyControlledSubstanceCompliance(exportData);
    // Setup stability monitoring
    this.initializeStabilityMonitoring(exportData);
    // Verify GMP compliance
    this.verifyGMPCompliance(exportData);
  }

  validateLiveAnimalRequirements(exportData) {
    const validations = {
      speciesAllowed: this.checkSpeciesRestrictions(exportData.species),
      healthStatus: this.validateHealthCertificates(exportData.healthCerts),
      transportConditions: this.validateTransportConditions(exportData.transport),
      quarantineCompliance: this.checkQuarantineRequirements(exportData)
    };

    return validations;
  }

  setupColdChainMonitoring(exportData) {
    const monitoring = {
      temperatureRange: this.validateTemperatureRequirements(exportData.temperature),
      humidityControl: this.validateHumidityRequirements(exportData.humidity),
      storageFacilities: this.validateStorageFacilities(exportData.storage),
      transportConditions: this.validateTransportConditions(exportData.transport)
    };

    return monitoring;
  }

  verifyControlledSubstanceCompliance(exportData) {
    const compliance = {
      substanceSchedule: this.checkSubstanceSchedule(exportData.substance),
      exportAuthorization: this.validateExportAuthorization(exportData.authorization),
      securityMeasures: this.validateSecurityProtocols(exportData.security),
      trackingSystem: this.validateTrackingSystem(exportData.tracking)
    };

    return compliance;
  }

  // Example of a step progression method
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
}

export default CustomsTradeManager;