export const HSCodeCategories = {
  EXPLOSIVES_AND_PYROTECHNICS: {
    chapter: "36",
    description: "Explosives and Pyrotechnics",
    documents: {
      // Documents that exporter must submit first
      exporter: [
        {
          name: "Safety Data Sheet",
          description:
            "Technical document containing chemical composition, safety protocols and handling instructions",
          reviewedBy: "DANGEROUS_GOODS_AUTHORITY",
          required: true,
        },
        {
          name: "Explosives Handling License",
          description:
            "Company license authorizing handling of explosive materials",
          reviewedBy: "DANGEROUS_GOODS_AUTHORITY",
          required: true,
        },
        {
          name: "UN Packaging Specification",
          description: "Documentation of UN-approved packaging compliance",
          reviewedBy: "TRANSPORT_SAFETY_BOARD",
          required: true,
        },
        {
          name: "Export License",
          description: "License to export controlled goods",
          reviewedBy: "CUSTOMS",
          required: true,
        },
        {
          name: "Commercial Invoice",
          description: "Commercial value and transaction details",
          reviewedBy: "CUSTOMS",
          required: true,
        },
        {
          name: "Packing List",
          description: "Detailed list of packaged items",
          reviewedBy: "CUSTOMS",
          required: true,
        },
      ],
      // Documents that agencies will issue after review
      agency: [
        {
          name: "Dangerous Goods Declaration",
          issuedBy: "DANGEROUS_GOODS_AUTHORITY",
          description:
            "Official classification and declaration of dangerous goods",
          requiresDocuments: [
            "Safety Data Sheet",
            "Explosives Handling License",
          ],
        },
        {
          name: "UN Classification Certificate",
          issuedBy: "DANGEROUS_GOODS_AUTHORITY",
          description: "Official UN classification for the explosive materials",
          requiresDocuments: ["Safety Data Sheet"],
        },
        {
          name: "Packaging Certification",
          issuedBy: "TRANSPORT_SAFETY_BOARD",
          description: "Certification of packaging meeting UN standards",
          requiresDocuments: ["UN Packaging Specification"],
        },
        {
          name: "Transport Safety Permit",
          issuedBy: "TRANSPORT_SAFETY_BOARD",
          description: "Authorization for safe transport of dangerous goods",
          requiresDocuments: [
            "Packaging Certification",
            "Dangerous Goods Declaration",
          ],
        },
        {
          name: "Customs Clearance Certificate",
          issuedBy: "CUSTOMS",
          description: "Final customs clearance approval",
          requiresDocuments: [
            "Export License",
            "Commercial Invoice",
            "Packing List",
            "Dangerous Goods Declaration",
            "Transport Safety Permit",
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
      "Phytosanitary Certificate",
      "Pesticide Residue Test Report",
      "Cold Chain Compliance Certificate",
      "Packaging Declaration",
      "Export License",
      "Certificate of Origin",
      "Commercial Invoice",
      "Packing List",
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
      "GMP Certificate",
      "Drug Registration Certificate",
      "Export License for Pharmaceuticals",
      "Certificate of Pharmaceutical Product (CPP)",
      "Batch Analysis Certificate",
      "Stability Study Report",
      "Commercial Invoice",
      "Packing List",
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
