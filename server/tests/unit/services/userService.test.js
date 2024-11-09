const { describe, test, expect, beforeEach } = require('@jest/globals');
const UserService = require('../../../src/services/userService');
const admin = require('firebase-admin');

jest.mock('firebase-admin', () => ({
    firestore: () => ({
        collection: jest.fn(),
    }),
    credential: {
        cert: jest.fn(),
    },
    initializeApp: jest.fn(),
}));

describe('UserService Tests', () => {
    let userService;
    let mockDb;
    let mockCollection;
    let mockWhere;
    let mockGet;

    beforeEach(() => {
        mockGet = jest.fn();
        mockWhere = jest.fn().mockReturnThis();
        mockCollection = jest.fn().mockReturnThis();
        mockDb = {
            collection: mockCollection,
            where: mockWhere,
            get: mockGet,
        };
        userService = new UserService(mockDb);
    });

    test('testGetUserProfile', async () => {
        const testEmail = "test@example.com";
        const mockUserData = {
            email: testEmail,
            firstName: "Test",
            lastName: "User"
        };

        mockGet.mockResolvedValue({
            empty: false,
            docs: [{
                data: () => mockUserData
            }]
        });

        const result = await userService.fetchUserProfile(testEmail);

        expect(result).not.toBeNull();
        expect(result).toEqual(mockUserData);
    });

    test('testGetUserProfileNotFound', async () => {
        const testEmail = "nonexistent@example.com";

        mockGet.mockResolvedValue({
            empty: true,
            docs: []
        });

        const result = await userService.fetchUserProfile(testEmail);

        expect(result).toBeNull();
    });
});