class ContainerMenuController {
  constructor(containerMenuService) {
    this.containerMenuService = containerMenuService;
  }

  async getContainerTypes(req, res) {
    try {
      const containerTypes = await this.containerMenuService.getContainerTypes();
      res.status(200).json(containerTypes);
    } catch (error) {
      console.error('Error in getContainerTypes:', error);
      res.status(500).json({ error: 'Error fetching container types' });
    }
  }

  async getContainerTypesForCompany(req, res) {
    try {
      const { company } = req.query;
      if (!company) {
        return res.status(400).send('Company parameter is required');
      }

      const containerTypes = await this.containerMenuService.getContainerTypesForCompany(company);
      res.status(200).json(containerTypes);
    } catch (error) {
      console.error('Error in getContainerTypesForCompany:', error);
      res.status(500).json({ error: 'Error fetching container types' });
    }
  }

  async addContainerType(req, res) {
    try {
      const { company, size, price, name, consolidationPrice } = req.body;
      const imageFile = req.file;

      if (!company || !size || !price || !name || !consolidationPrice) {
        return res.status(400).send('Missing required fields');
      }

      const containerType = await this.containerMenuService.addContainerType({
        company,
        size: parseInt(size),
        price: parseFloat(price),
        name,
        imageFile,
        consolidationPrice: parseFloat(consolidationPrice)
      });

      res.status(201).json(containerType);
    } catch (error) {
      console.error('Error in addContainerType:', error);
      res.status(500).json({ error: 'Error adding container type' });
    }
  }
}

module.exports = ContainerMenuController;