import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import { Asset } from './asset';

@Info({
  title: 'AssetTransfer',
  description: 'Smart contract for storing and fetching Temperature and Humidity level data',
})
export class AssetTransferContract extends Contract {
  @Transaction()
  public async InitLedger(ctx: Context): Promise<void> {
    const assets: Asset[] = [
      {
        ID: '000beb5b-ed35-40f0-943c-7dce0c795909',
        Timestamp: '01/01/2023, 00:00:00',
        Temperature: '0',
        Humidity: '0',
        sensor_id: '0',
      },
    ];

    for (const asset of assets) {
      asset.docType = 'asset';
      await ctx.stub.putState(
        asset.ID,
        Buffer.from(stringify(sortKeysRecursive(asset)))
      );
      console.info(`Asset ${asset.ID} initialized`);
    }
  }

  @Transaction()
  public async CreateAsset(
    ctx: Context,
    id: string,
    timestamp: string,
    temperature: string,
    humidity: string,
    sensor_id: string,
  ): Promise<string> {
    const asset = {
      ID: id,
      Timestamp: timestamp,
      Temperature: temperature,
      Humidity: humidity,
      sensor_id: sensor_id,
      docType: 'asset'
    };

    await ctx.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(asset)))
    );

    return id;
  }

  @Transaction(false)
  public async ReadAsset(ctx: Context, id: string): Promise<string> {
    const assetJSON = await ctx.stub.getState(id);
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`Asset ${id} does not exist`);
    }
    return assetJSON.toString();
  }

  @Transaction()
  public async UpdateAsset(
    ctx: Context,
    id: string,
    timestamp: string,
    temperature: string,
    humidity: string,
    sensor_id: string,
  ): Promise<void> {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`Asset ${id} does not exist`);
    }

    const updatedAsset = {
      ID: id,
      Timestamp: timestamp,
      Temperature: temperature,
      Humidity: humidity,
      sensor_id: sensor_id,
      docType: 'asset'
    };

    return ctx.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(updatedAsset)))
    );
  }

  @Transaction()
  public async DeleteAsset(ctx: Context, id: string): Promise<void> {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`Asset ${id} does not exist`);
    }
    return ctx.stub.deleteState(id);
  }

  @Transaction(false)
  @Returns('boolean')
  public async AssetExists(ctx: Context, id: string): Promise<boolean> {
    const assetJSON = await ctx.stub.getState(id);
    return assetJSON && assetJSON.length > 0;
  }

  @Transaction(false)
  @Returns('string')
  public async GetAllAssets(ctx: Context): Promise<string> {
    const allResults = [];
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      allResults.push(record);
      result = await iterator.next();
    }
    return JSON.stringify(allResults);
  }
}