const { describe, test, expect, beforeEach } = require('@jest/globals');
const VesselService = require('../../../src/services/vesselService');

describe('VesselService Tests', () => {
    let vesselService;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            collection: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            get: jest.fn()
        };
        vesselService = new VesselService(mockDb);
    });

    test('testGetActiveVesselVisits', async () => {
        const mockVisits = [
            {
                id: '1',
                vesselName: 'Vessel 1',
                status: 'confirmed',
                eta: new Date(Date.now() + 86400000).toISOString(),
                etd: new Date(Date.now() + 172800000).toISOString()
            }
        ];

        mockDb.get.mockResolvedValue({
            docs: mockVisits.map(visit => ({
                id: visit.id,
                data: () => visit
            }))
        });

        const result = await vesselService.fetchActiveVesselVisits();

        expect(result).not.toBeNull();
        expect(result.length).toBe(1);
        expect(result[0].vesselName).toBe('Vessel 1');
    });
});