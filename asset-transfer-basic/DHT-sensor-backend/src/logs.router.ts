/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This sample is intended to work with the basic asset transfer
 * chaincode which imposes some constraints on what is possible here.
 *
 * For example,
 *  - There is no validation for Asset IDs
 *  - There are no error codes from the chaincode
 *
 * To avoid timeouts, long running tasks should be decoupled from HTTP request
 * processing
 *
 * Submit transactions can potentially be very long running, especially if the
 * transaction fails and needs to be retried one or more times
 *
 * To allow requests to respond quickly enough, this sample queues submit
 * requests for processing asynchronously and immediately returns 202 Accepted
 */

import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { logger } from './logger';
import { exec } from 'child_process';
import { Gateway, Wallets } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';

const {
    ACCEPTED,
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    // NOT_FOUND, OK
} = StatusCodes;

export const logsRouter = express.Router();

// '{"Args":["updateVotes", "HF_POLL-a8923v", "{\"Peter Obi\": 1, \"Atiku Abubakar\": 0, \"Bola Ahmed Tinubu\": 6}"]}';

logsRouter.post(
    '/',
    body('payload', 'must be a number').isNumeric(),
    body('humidity', 'must be a number').isNumeric(),
    body('timestamp', 'must be a valid date string').isString(),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(BAD_REQUEST).json({
                status: getReasonPhrase(BAD_REQUEST),
                reason: 'VALIDATION_ERROR',
                message: 'Invalid request body',
                timestamp: new Date().toISOString(),
                errors: errors.array(),
            });
        }

        try {
            // load the network configuration
            const ccpPath = path.resolve(
                __dirname,
                '..',
                'config',
                'connection.json'
            );
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await Wallets.newFileSystemWallet(walletPath);

            // Check to see if we've already enrolled the user.
            const identity = await wallet.get('user1');
            if (!identity) {
                console.log(
                    'An identity for the user "user1" does not exist in the wallet'
                );
                console.log(
                    'Run the registerUser.js application before retrying'
                );
                return;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet,
                identity: 'user1',
                discovery: { enabled: true, asLocalhost: true },
            });

            const network = await gateway.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('basic');

            await contract.submitTransaction(
                'CreateAsset',
                req.body.timestamp,
                req.body.payload,
                req.body.humidity
            );
            console.log('Transaction has been submitted');

            await gateway.disconnect();

            res.status(200).json({ message: 'New record added successfully' });
        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            res.status(500).json({ error: 'Failed to add new record' });
        }
    }
);

logsRouter.put(
    '/:assetId',
    body().isObject().withMessage('body must contain an asset object'),
    body('ID', 'must be a string').notEmpty(),
    body('Votes', 'must be an object').isObject(),
    async (req: Request, res: Response) => {
        logger.debug(req.body, 'Update votes request received');

        const errors = validationResult(req);

        logger.info(errors, req.body);
        if (!errors.isEmpty()) {
            return res.status(BAD_REQUEST).json({
                status: getReasonPhrase(BAD_REQUEST),
                reason: 'VALIDATION_ERROR',
                message: 'Invalid request body',
                timestamp: new Date().toISOString(),
                errors: errors.array(),
            });
        }

        if (req.params.assetId != req.body.ID) {
            return res.status(BAD_REQUEST).json({
                status: getReasonPhrase(BAD_REQUEST),
                reason: 'ASSET_ID_MISMATCH',
                message: 'Asset IDs must match',
                timestamp: new Date().toISOString(),
            });
        }

        // const mspId = req.user as string;
        // const assetId = req.params.assetId;
        // const vote = req.body.Votes;

        const command = `./updateVotesScript.sh '{"Args":["updateVotes", "HF_POLL-a8923v", "{\\"Peter Obi\\": ${req.body.Votes['Peter Obi']}, \\"Atiku Abubakar\\": ${req.body.Votes['Atiku Abubakar']}, \\"Bola Ahmed Tinubu\\": ${req.body.Votes['Bola Ahmed Tinubu']}}"]}'`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error}, ${stderr}`);
                // res.status(500).send(`Error updating votes: ${error} ${stderr}`);
                return res.status(INTERNAL_SERVER_ERROR).json({
                    status: getReasonPhrase(INTERNAL_SERVER_ERROR),
                    reason: 'INTERNAL_SERVER_ERROR',
                    timestamp: new Date().toISOString(),
                });
            } else {
                console.log(`Command executed successfully: ${stdout}`);
                // res.send('Votes updated successfully');
                return res.status(ACCEPTED).json({
                    status: getReasonPhrase(ACCEPTED),
                    message: 'Votes updated successfully',
                    timestamp: new Date().toISOString(),
                });
            }
        });
    }
);
