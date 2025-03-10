'use strict';

class SharedState {
    constructor() {
        this.assetIDs = [];
        this.lock = false;
    }

    addAssetId(id) {
        if (!this.lock) {
            this.assetIDs.push(id);
        }
    }

    getAssetIds() {
        return this.assetIDs;
    }

    // Method to lock the state (prevent further additions)
    lockState() {
        this.lock = true;
    }

    // Method to check if state is empty
    isEmpty() {
        return this.assetIDs.length === 0;
    }
}

module.exports = new SharedState();
