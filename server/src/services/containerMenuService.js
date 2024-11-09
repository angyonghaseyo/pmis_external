const { Storage } = require('@google-cloud/storage');
const path = require('path');

class ContainerMenuService {
  constructor(db) {
    this.db = db;
    this.storage = new Storage({
      projectId: 'your-project-id',
      keyFilename: path.join(__dirname, '../../config/serviceAccountKey.json')
    });
    this.bucket = this.storage.bucket('pmis-47493.appspot.com');
  }

  async getContainerTypes() {
    try {
      const menuCollectionRef = this.db.collection('container_menu');
      const snapshot = await menuCollectionRef.get();
      const containerData = {};

      snapshot.forEach(doc => {
        const containerTypes = doc.data().container_types || [];
        containerData[doc.id] = containerTypes;
      });

      return containerData;
    } catch (error) {
      console.error('Error in getContainerTypes:', error);
      throw error;
    }
  }

  async getContainerTypesForCompany(company) {
    try {
      const menuCollectionRef = this.db.collection('container_menu');
      const companyDocRef = menuCollectionRef.doc(company);
      const companyDoc = await companyDocRef.get();

      if (companyDoc.exists) {
        return companyDoc.data().container_types || [];
      }
      return [];
    } catch (error) {
      console.error('Error in getContainerTypesForCompany:', error);
      throw error;
    }
  }

  async addContainerType({ company, size, price, name, imageFile }) {
    try {
      const menuCollectionRef = this.db.collection('container_menu');
      const companyDocRef = menuCollectionRef.doc(company);
      const companyDoc = await companyDocRef.get();

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await this.uploadImage(company, imageFile);
      }

      const existingContainers = companyDoc.exists ? companyDoc.data().container_types : [];
      const isDuplicate = existingContainers.some(
        container => container.size === size && container.price === price
      );

      if (isDuplicate) {
        throw new Error('A container with this size and price combination already exists.');
      }

      const newContainer = {
        size,
        price,
        name,
        imageUrl
      };

      await companyDocRef.set({
        container_types: [...existingContainers, newContainer]
      }, { merge: true });

      return newContainer;
    } catch (error) {
      console.error('Error in addContainerType:', error);
      throw error;
    }
  }

  async uploadImage(company, file) {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${company}_${Date.now()}.${fileExtension}`;
      const fileRef = this.bucket.file(`container_images/${fileName}`);

      await fileRef.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });

      await fileRef.makePublic();
      return `https://storage.googleapis.com/${this.bucket.name}/container_images/${fileName}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}

module.exports = ContainerMenuService;
