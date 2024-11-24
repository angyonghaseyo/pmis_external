class WarehouseController {
    constructor(warehouseService) {
        this.warehouseService = warehouseService;
    }

    async getWarehouses(req, res) {
        try {
            const warehouses = await this.warehouseService.fetchWarehouses();
            res.status(200).json(warehouses);
        } catch (error) {
            console.error('Error getting warehouses:', error);
            res.status(500).json({ error: 'Error fetching warehouses' });
        }
    }

    async getWarehouseById(req, res) {
        try {
            const { id } = req.params;
            const warehouse = await this.warehouseService.fetchWarehouseById(id);
            if (!warehouse) {
                return res.status(404).json({ error: 'Warehouse not found' });
            }
            res.status(200).json(warehouse);
        } catch (error) {
            console.error('Error getting warehouse:', error);
            res.status(500).json({ error: 'Error fetching warehouse' });
        }
    }
}

module.exports = WarehouseController;