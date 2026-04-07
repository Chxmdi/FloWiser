export type OrderingState = {
  deviceId: string;
  lastSequenceNo?: number;
  lastMeterTimestamp?: string;
};

export interface OrderingStateRepository {
  find(deviceId: string): OrderingState | undefined;
  save(state: OrderingState): OrderingState;
}
