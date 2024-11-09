module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: [
        "**/__tests__/**/*.js",
        "**/?(*.)+(spec|test).js"
    ],
    moduleDirectories: ['node_modules', 'src'],
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/setup.js'
    ]
};