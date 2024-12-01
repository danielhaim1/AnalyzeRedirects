console.log("Jest is running from:", process.cwd());

export default {
    transform: {
        '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@babel/preset-env'] }],
    },
    testEnvironment: 'node',
};
