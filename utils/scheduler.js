const delay = (s) => {
  return new Promise((resolve, reject) => setTimeout(resolve, s));
};

export default class Scheduler {
  constructor(initialWaitingValue, waitBetweenRequests) {
    this.lastRequest = 0;
    this.waiting = initialWaitingValue;
    this.pendingRequests = [];
    this.waitBetweenRequests = waitBetweenRequests;
  }

  addRequest(request, resolve, reject) {
    this.pendingRequests.push({ func: request, resolve, reject });
    if (!this.waiting) this.run();
  }

  async run() {
    if (this.waiting) return;
    if (this.pendingRequests.length == 0) return;

    if (this.lastRequest + this.waitBetweenRequests > Date.now()) {
      await delay(this.lastRequest + this.waitBetweenRequests - Date.now());
    }

    this.waiting = true;
    while (true) {
      const currElement = this.pendingRequests.shift();
      const request = currElement.func;
      const response = await request();
      currElement.resolve(response);

      if (this.pendingRequests.length == 0) {
        this.waiting = false;
        return;
      }
      await delay(this.waitBetweenRequests);
    }
  }
}
