const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const withRetry = async (operation, { retryInterval = 30000, name = 'operation' } = {}) => {
    while (true) {
        try {
            return await operation();
        } catch (error) {
            console.error(`❌ ${name} failed:`, error.message);
            console.log(`⏳ Retrying ${name} in ${retryInterval / 1000} seconds...`);
            await wait(retryInterval);
        }
    }
};