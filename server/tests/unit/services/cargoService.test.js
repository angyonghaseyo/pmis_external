const { describe, test, expect, beforeEach } = require('@jest/globals');
const CargoService = require('../../../src/services/cargoService');

describe('CargoService Tests', () => {
    let cargoService;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            collection: jest.fn().mockReturnThis(),
            get: jest.fn(),
            add: jest.fn(),
            doc: jest.fn().mockReturnThis(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        cargoService = new CargoService(mockDb);
    });

    test('testGetCargoManifests', async () => {
        const mockManifests = [
            { id: '1', vesselName: 'Vessel 1', cargo: 'Container' },
            { id: '2', vesselName: 'Vessel 2', cargo: 'Bulk' }
        ];

        mockDb.get.mockResolvedValue({
            docs: mockManifests.map(manifest => ({
                id: manifest.id,
                data: () => manifest
            }))
        });

        const result = await cargoService.fetchCargoManifests();

        expect(result).not.toBeNull();
        expect(result.length).toBe(2);
        expect(result[0].vesselName).toBe('Vessel 1');
    });
});