import type { OrderingState, OrderingStateRepository } from "./ordering-state.repository.js";

export class InMemoryOrderingStateRepository implements OrderingStateRepository {
  private readonly states = new Map<string, OrderingState>();

  find(deviceId: string) {
    return this.states.get(deviceId);
  }

  save(state: OrderingState) {
    this.states.set(state.deviceId, state);
    return state;
  }
}
