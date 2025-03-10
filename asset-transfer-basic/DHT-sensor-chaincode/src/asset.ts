/*
  SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Asset {
  @Property()
  public docType?: string;

  @Property()
  public ID: string;

  @Property()
  public Timestamp: string;

  @Property()
  public Temperature: string;

  @Property()
  public Humidity: string;
  
  @Property()
  public sensor_id: string;
}
