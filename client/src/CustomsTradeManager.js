// Import Firebase configuration
import { db } from "./firebaseConfig";
import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';

// Data Models
const shipmentStatus = {
  DOCUMENTS_PREPARATION: 'DOCUMENTS_PREPARATION',
  CUSTOMS_CLEARANCE: 'CUSTOMS_CLEARANCE',
  PORT_HANDLING: 'PORT_HANDLING',
  DELIVERY: 'DELIVERY',
  COMPLETED: 'COMPLETED'
};

// Main Shipment Management Class
export class CustomsTradeManager {
  constructor() {
    this.shipmentsRef = collection(db, 'shipments');
    this.documentsRef = collection(db, 'documents');
    this.customsDeclarationsRef = collection(db, 'customsDeclarations');
  }

  // Create new shipment
  async createShipment(shipmentData) {
    try {
      const shipment = {
        ...shipmentData,
        status: shipmentStatus.DOCUMENTS_PREPARATION,
        createdAt: new Date(),
        updatedAt: new Date(),
        timeline: [{
          status: shipmentStatus.DOCUMENTS_PREPARATION,
          timestamp: new Date(),
          note: 'Shipment created'
        }]
      };
      
      const docRef = await addDoc(this.shipmentsRef, shipment);
      return docRef.id;
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  }

  // Upload required documents
  async uploadDocument(shipmentId, documentType, documentData) {
    try {
      const document = {
        shipmentId,
        documentType,
        ...documentData,
        uploadedAt: new Date(),
        status: 'PENDING_VERIFICATION'
      };

      const docRef = await addDoc(this.documentsRef, document);
      
      // Update timeline after document upload
      await this.updateShipmentStatus(
        shipmentId, 
        shipmentStatus.DOCUMENTS_PREPARATION, 
        `Uploaded ${documentType} document`
      );

      return docRef.id;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  // Submit customs declaration
  async submitCustomsDeclaration(shipmentId, declarationData) {
    try {
      const declaration = {
        shipmentId,
        ...declarationData,
        submittedAt: new Date(),
        status: 'PENDING_APPROVAL',
        hsCode: declarationData.hsCode,
        dutyAmount: this.calculateDuty(declarationData)
      };

      const docRef = await addDoc(this.customsDeclarationsRef, declaration);
      
      // Update shipment status
      await this.updateShipmentStatus(
        shipmentId, 
        shipmentStatus.CUSTOMS_CLEARANCE,
        'Customs declaration submitted'
      );
      
      return docRef.id;
    } catch (error) {
      console.error('Error submitting customs declaration:', error);
      throw error;
    }
  }

  // Calculate duty (simplified example)
  calculateDuty(declarationData) {
    // This would normally involve complex duty calculations based on HS code
    const { value, hsCode } = declarationData;
    // Simplified calculation - in reality, would need to lookup rates based on HS code
    return value * 0.05; // Example 5% duty rate
  }

  // Update shipment status with timeline
  async updateShipmentStatus(shipmentId, newStatus, note = '') {
    try {
      const shipmentRef = doc(this.shipmentsRef, shipmentId);
      const shipmentSnap = await getDoc(shipmentRef);
      
      if (!shipmentSnap.exists()) {
        throw new Error('Shipment not found');
      }

      const timelineEntry = {
        status: newStatus,
        timestamp: new Date(),
        note
      };

      const currentTimeline = shipmentSnap.data().timeline || [];

      await updateDoc(shipmentRef, {
        status: newStatus,
        updatedAt: new Date(),
        timeline: [...currentTimeline, timelineEntry]
      });
    } catch (error) {
      console.error('Error updating shipment status:', error);
      throw error;
    }
  }

  // Verify documents
  async verifyDocuments(shipmentId) {
    try {
      const q = query(this.documentsRef, where('shipmentId', '==', shipmentId));
      const querySnapshot = await getDocs(q);
      
      let allVerified = true;
      querySnapshot.forEach((doc) => {
        if (doc.data().status !== 'VERIFIED') {
          allVerified = false;
        }
      });

      return allVerified;
    } catch (error) {
      console.error('Error verifying documents:', error);
      throw error;
    }
  }

  // Process container arrival
  async processContainerArrival(shipmentId, containerData) {
    try {
      const shipmentRef = doc(this.shipmentsRef, shipmentId);
      
      await updateDoc(shipmentRef, {
        containerDetails: containerData,
        status: shipmentStatus.PORT_HANDLING,
        updatedAt: new Date()
      });

      // Add timeline entry for container arrival
      await this.updateShipmentStatus(
        shipmentId, 
        shipmentStatus.PORT_HANDLING,
        `Container arrived at ${containerData.location}`
      );

      return true;
    } catch (error) {
      console.error('Error processing container arrival:', error);
      throw error;
    }
  }

  // Complete delivery
  async completeDelivery(shipmentId, deliveryDetails) {
    try {
      await this.updateShipmentStatus(
        shipmentId, 
        shipmentStatus.COMPLETED, 
        `Delivered by ${deliveryDetails.driver} at ${deliveryDetails.timestamp}`
      );
      
      const shipmentRef = doc(this.shipmentsRef, shipmentId);
      await updateDoc(shipmentRef, {
        deliveryDetails,
        completedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error completing delivery:', error);
      throw error;
    }
  }

  // Get shipment timeline
  async getShipmentTimeline(shipmentId) {
    try {
      const shipmentRef = doc(this.shipmentsRef, shipmentId);
      const shipmentSnap = await getDoc(shipmentRef);
      
      if (!shipmentSnap.exists()) {
        throw new Error('Shipment not found');
      }

      return shipmentSnap.data().timeline || [];
    } catch (error) {
      console.error('Error getting shipment timeline:', error);
      throw error;
    }
  }
}

export default CustomsTradeManager;