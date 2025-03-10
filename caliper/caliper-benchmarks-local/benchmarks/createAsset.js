'use strict';
const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const { v4: uuidv4 } = require('uuid');
const sharedState = require('./sharedState');

class CreateAssetWorkload extends WorkloadModuleBase {
    constructor() {
        super();
    }

    async submitTransaction() {
        const asset = {
            ID: uuidv4(), // Generate a unique ID (UUID)
            Timestamp: new Date().toISOString(),
            Temperature: Math.floor(Math.random() * 500), // Random Temperature
            Humidity: Math.floor(Math.random() * 4000),   // Random Humidity
            sensor_id: Math.floor(Math.random() * 1000),  // Random sensor ID
        };

        try {
            const args = {
                contractId: 'basic',
                contractFunction: 'CreateAsset',
                contractArguments: [
                    asset.ID,               // Add ID as the first argument
                    asset.Timestamp,
                    asset.Temperature.toString(),
                    asset.Humidity.toString(),
                    asset.sensor_id.toString(),
                ],
                timeout: 1000
            };

            const result = await this.sutAdapter.sendRequests(args);

            // Add the asset ID to shared state after successful creation
            if (result && result[0] && result[0].status === 'success') {
                sharedState.addAssetId(asset.ID);
                console.log(`Asset created with ID: ${asset.ID}`);
            } else {
                console.error('Asset creation failed', result);
            }
        } catch (error) {
            console.error('Error creating asset:', error);
        }
    }
}

function createWorkloadModule() {
    return new CreateAssetWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
