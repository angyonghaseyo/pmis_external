export const HSCodeCategories = {
  EXPLOSIVES_AND_PYROTECHNICS: {
    chapter: "36",
    description: "Explosives and Pyrotechnics",
    documents: {
      // Documents that exporter must submit first
      exporter: [
        {
          name: "Safety_Data_Sheet",
          description:
            "Technical document containing chemical composition, safety protocols and handling instructions",
          reviewedBy: "DANGEROUS_GOODS_AUTHORITY",
          required: true,
        },
        {
          name: "Explosives_Handling_License",
          description:
            "Company license authorizing handling of explosive materials",
          reviewedBy: "DANGEROUS_GOODS_AUTHORITY",
          required: true,
        },
        {
          name: "UN_Packaging_Specification",
          description: "Documentation of UN-approved packaging compliance",
          reviewedBy: "TRANSPORT_SAFETY_BOARD",
          required: true,
        },
        {
          name: "Export_License",
          description: "License to export controlled goods",
          reviewedBy: "CUSTOMS",
          required: true,
        },
        {
          name: "Commercial_Invoice",
          description: "Commercial value and transaction details",
          reviewedBy: "CUSTOMS",
          required: true,
        },
        {
          name: "Packing_List",
          description: "Detailed list of packaged items",
          reviewedBy: "CUSTOMS",
          required: true,
        },
      ],
      // Documents that agencies will issue after review
      agency: [
        {
          name: "Dangerous_Goods_Declaration",
          issuedBy: "DANGEROUS_GOODS_AUTHORITY",
          description:
            "Official classification and declaration of dangerous goods",
          requiresDocuments: [
            "Safety_Data_Sheet",
            "Explosives_Handling_License",
          ],
        },
        {
          name: "UN_Classification_Sheet",
          issuedBy: "DANGEROUS_GOODS_AUTHORITY",
          description: "Official UN classification for the explosive materials",
          requiresDocuments: ["Safety_Data_Sheet"],
        },
        {
          name: "Packaging_Certification",
          issuedBy: "TRANSPORT_SAFETY_BOARD",
          description: "Certification of packaging meeting UN standards",
          requiresDocuments: ["UN_Packaging_Specification"],
        },
        {
          name: "Transport_Safety_Permit",
          issuedBy: "TRANSPORT_SAFETY_BOARD",
          description: "Authorization for safe transport of dangerous goods",
          requiresDocuments: [
            "Packaging_Certification",
            "Dangerous_Goods_Declaration",
          ],
        },
        {
          name: "Customs_Clearance_Certificate",
          issuedBy: "CUSTOMS",
          description: "Final customs clearance approval",
          requiresDocuments: [
            "Export_License",
            "Commercial_Invoice",
            "Packing_List",
            "Dangerous_Goods_Declaration",
            "Transport_Safety_Permit",
          ],
        },
      ],
    },
    processingOrder: [
      {
        phase: "INITIAL_SUBMISSION",
        description: "Submit all required exporter documents",
        responsible: "EXPORTER",
      },
      {
        phase: "DANGEROUS_GOODS_REVIEW",
        description: "DG Authority review and certification",
        responsible: "DANGEROUS_GOODS_AUTHORITY",
        requiredBefore: "TRANSPORT_SAFETY_REVIEW",
      },
      {
        phase: "TRANSPORT_SAFETY_REVIEW",
        description: "Transport safety verification and certification",
        responsible: "TRANSPORT_SAFETY_BOARD",
        requiredBefore: "CUSTOMS_CLEARANCE",
      },
      {
        phase: "CUSTOMS_CLEARANCE",
        description: "Final customs review and clearance",
        responsible: "CUSTOMS",
        requiresAllPreviousPhases: true,
      },
    ],
    validations: {
      hazardClassification: true,
      packagingCompliance: true,
      handlingInstructions: true,
      emergencyProcedures: true,
    },
  },

  FRESH_FRUITS: {
    chapter: "08",
    description: "Fresh Fruits",
    processingOrder: [
      "PHYTOSANITARY_INSPECTION",
      "PESTICIDE_TESTING",
      "COLD_CHAIN_VERIFICATION",
      "PACKAGING_INSPECTION",
      "CUSTOMS_DECLARATION",
      "FINAL_QUALITY_CHECK",
    ],
    requiredDocuments: [
      "Phytosanitary_Certificate",
      "Pesticide_Residue_Test_Report",
      "Cold_Chain_Compliance_Certificate",
      "Packaging_Declaration",
      "Export_License",
      "Certificate_of_Origin",
      "Commercial_Invoice",
      "Packing_List",
    ],
    validations: {
      pesticideLevel: true,
      coldChainMaintenance: true,
      packagingStandards: true,
      shelfLife: true,
    },
  },

  PHARMACEUTICALS: {
    chapter: "30",
    description: "Pharmaceutical Products",
    processingOrder: [
      "GMP_VERIFICATION",
      "DRUG_REGISTRATION_CHECK",
      "CONTROLLED_SUBSTANCE_CHECK",
      "STABILITY_VERIFICATION",
      "CUSTOMS_DECLARATION",
      "FINAL_QUALITY_ASSURANCE",
    ],
    requiredDocuments: [
      "GMP_Certificate",
      "Drug_Registration_Certificate",
      "Export_License_for_Pharmaceuticals",
      "Certificate_of_Pharmaceutical_Product",
      "Batch_Analysis_Certificate",
      "Stability_Study_Report",
      "Commercial_Invoice",
      "Packing_List",
    ],
    validations: {
      controlledSubstance: true,
      storageConditions: true,
      expiryDates: true,
      batchTracking: true,
    },
  },
};

export const ProcessStatus = {
  PENDING: "PENDING",
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
};