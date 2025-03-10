'use strict';
const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const sharedState = require('./sharedState');

class QueryAssetWorkload extends WorkloadModuleBase {
    constructor() {
        super();
    }

    async submitTransaction() {
        const assetIds = sharedState.getAssetIds();
        if (assetIds.length === 0) {
            console.error('No assets to query');
            return;
        }

        const randomIndex = Math.floor(Math.random() * assetIds.length);
        const assetId = assetIds[randomIndex];

        try {
            const args = {
                contractId: 'basic',
                contractFunction: 'ReadAsset',
                contractArguments: [assetId],
                timeout: 30,
                readOnly: true
            };

            const result = await this.sutAdapter.sendRequests(args);
            if (result && result[0] && result[0].status === 'success') {
                console.log(`Successfully queried asset: ${assetId}`);
            } else {
                console.error(`Failed to query asset: ${assetId}`, result);
            }
        } catch (error) {
            console.error('Error querying asset:', error);
        }
    }
}

function createWorkloadModule() {
    return new QueryAssetWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
