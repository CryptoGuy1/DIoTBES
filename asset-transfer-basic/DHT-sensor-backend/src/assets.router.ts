import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Contract } from 'fabric-network';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { Queue } from 'bullmq';
import { AssetNotFoundError } from './errors';
import { evatuateTransaction } from './fabric';
import { addSubmitTransactionJob } from './jobs';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

const { ACCEPTED, BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } =
    StatusCodes;

export const assetsRouter = express.Router();

assetsRouter.get('/', async (req: Request, res: Response) => {
    logger.debug('Get all assets request received');
    try {
        const mspId = req.user as string;
        const contract = req.app.locals[mspId]?.assetContract as Contract;

        const data = await evatuateTransaction(contract, 'GetAllAssets');
        let assets = [];
        if (data.length > 0) {
            assets = JSON.parse(data.toString());
        }

        return res.status(OK).json(assets);
    } catch (err) {
        logger.error({ err }, 'Error processing get all assets request');
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: getReasonPhrase(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});

assetsRouter.post(
    '/',
    body().isObject().withMessage('body must contain an asset object'),
    body('temperature', 'must be a string').isString(),
    body('humidity', 'must be a string').isString(),
    body('sensor_id', 'must be a string').isString(),
    async (req: Request, res: Response) => {
        logger.debug(req.body, 'Create asset request received');

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

        const mspId = req.user as string;

        const utcDate = new Date();
        const options = {
            timeZone: 'America/Denver',
            hour12: false,
        };
        // Convert to Mountain Standard Time
        const timestamp = utcDate.toLocaleString('en-US', options);
        const assetId = uuidv4();

        try {
            const submitQueue = req.app.locals.jobq as Queue;
            const jobId = await addSubmitTransactionJob(
                submitQueue,
                mspId,
                'CreateAsset',
                assetId,
                timestamp,
                req.body.temperature,
                req.body.humidity,
                req.body.sensor_id
            );

            return res.status(ACCEPTED).json({
                status: getReasonPhrase(ACCEPTED),
                jobId: jobId,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            logger.error(
                { err },
                'Error processing create asset request for asset with timestamp %s',
                timestamp
            );

            return res.status(INTERNAL_SERVER_ERROR).json({
                status: getReasonPhrase(INTERNAL_SERVER_ERROR),
                timestamp: new Date().toISOString(),
            });
        }
    }
);

assetsRouter.get('/:assetId', async (req: Request, res: Response) => {
    const assetId = req.params.assetId;
    logger.debug('Read asset request received for asset ID %s', assetId);

    try {
        const mspId = req.user as string;
        const contract = req.app.locals[mspId]?.assetContract as Contract;

        const data = await evatuateTransaction(contract, 'ReadAsset', assetId);
        const asset = JSON.parse(data.toString());

        return res.status(OK).json(asset);
    } catch (err) {
        logger.error(
            { err },
            'Error processing read asset request for asset ID %s',
            assetId
        );

        if (err instanceof AssetNotFoundError) {
            return res.status(NOT_FOUND).json({
                status: getReasonPhrase(NOT_FOUND),
                timestamp: new Date().toISOString(),
            });
        }

        return res.status(INTERNAL_SERVER_ERROR).json({
            status: getReasonPhrase(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});

assetsRouter.put(
    '/:assetId',
    body().isObject().withMessage('body must contain an asset object'),
    body('id', 'must be a string').notEmpty(),
    body('temperature', 'must be a string').isString(),
    body('humidity', 'must be a string').isString(),
    body('sensor_id', 'must be a string').isString(),
    async (req: Request, res: Response) => {
        logger.debug(req.body, 'Update asset request received');

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

        if (req.params.assetId !== req.body.id) {
            return res.status(BAD_REQUEST).json({
                status: getReasonPhrase(BAD_REQUEST),
                reason: 'ASSET_ID_MISMATCH',
                message: 'Asset IDs must match',
                timestamp: new Date().toISOString(),
            });
        }

        const mspId = req.user as string;
        const assetId = req.params.assetId;
        const utcDate = new Date();
        const options = {
            timeZone: 'America/Denver',
            hour12: false,
        };
        const timestamp = utcDate.toLocaleString('en-US', options);

        try {
            const submitQueue = req.app.locals.jobq as Queue;
            const jobId = await addSubmitTransactionJob(
                submitQueue,
                mspId,
                'UpdateAsset',
                assetId,
                timestamp,
                req.body.temperature,
                req.body.humidity,
                req.body.sensor_id
            );

            return res.status(ACCEPTED).json({
                status: getReasonPhrase(ACCEPTED),
                jobId: jobId,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            logger.error(
                { err },
                'Error processing update asset request for asset ID %s',
                assetId
            );

            return res.status(INTERNAL_SERVER_ERROR).json({
                status: getReasonPhrase(INTERNAL_SERVER_ERROR),
                timestamp: new Date().toISOString(),
            });
        }
    }
);

assetsRouter.delete('/:assetId', async (req: Request, res: Response) => {
    logger.debug(req.body, 'Delete asset request received');

    const mspId = req.user as string;
    const assetId = req.params.assetId;

    try {
        const submitQueue = req.app.locals.jobq as Queue;
        const jobId = await addSubmitTransactionJob(
            submitQueue,
            mspId,
            'DeleteAsset',
            assetId
        );

        return res.status(ACCEPTED).json({
            status: getReasonPhrase(ACCEPTED),
            jobId: jobId,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        logger.error(
            { err },
            'Error processing delete asset request for asset ID %s',
            assetId
        );

        return res.status(INTERNAL_SERVER_ERROR).json({
            status: getReasonPhrase(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});

assetsRouter.options('/:assetId', async (req: Request, res: Response) => {
    const assetId = req.params.assetId;
    logger.debug('Asset options request received for asset ID %s', assetId);

    try {
        const mspId = req.user as string;
        const contract = req.app.locals[mspId]?.assetContract as Contract;

        const data = await evatuateTransaction(
            contract,
            'AssetExists',
            assetId
        );
        const exists = data.toString() === 'true';

        if (exists) {
            return res
                .status(OK)
                .set({
                    Allow: 'DELETE,GET,OPTIONS,PUT',
                })
                .json({
                    status: getReasonPhrase(OK),
                    timestamp: new Date().toISOString(),
                });
        } else {
            return res.status(NOT_FOUND).json({
                status: getReasonPhrase(NOT_FOUND),
                timestamp: new Date().toISOString(),
            });
        }
    } catch (err) {
        logger.error(
            { err },
            'Error processing asset options request for asset ID %s',
            assetId
        );
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: getReasonPhrase(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    }
});
