class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(eventName, listener) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(listener);
    return () => this.unsubscribe(eventName, listener);
  }

  unsubscribe(eventName, listener) {
    const listeners = this.listeners.get(eventName) || [];
    this.listeners.set(
      eventName,
      listeners.filter((item) => item !== listener)
    );
  }

  publish(eventName, payload) {
    const listeners = this.listeners.get(eventName) || [];
    listeners.forEach((listener) => listener(payload));
    return payload;
  }
}

const eventBus = new EventBus();

export { EventBus, eventBus };
export default eventBus;
