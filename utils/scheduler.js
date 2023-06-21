const delay = (s) => {
  return new Promise((resolve, reject) => setTimeout(resolve, s));
};

function quickestAndIndex(a, keys) {
  var lowest_ind = 0;
  var lowest;
  for (var i = 0; i < a.length; i++) {
    if (
      lowest == undefined ||
      a[i] + keys[i].wait < a[lowest_ind] + keys[lowest_ind].wait
    ) {
      lowest_ind = i;
      lowest = a[i];
    }
  }
  return [lowest_ind, lowest];
}

export default class Scheduler {
  constructor(keys, waitOffset) {
    this.waiting = false;
    this.waitOffset = waitOffset;
    this.pendingRequests = [];

    this.keysObjects = keys;
    this.lastRequests = new Array(this.keysObjects.length).fill(0);
    this.previousRequest = Date.now();
  }

  addRequest(request, resolve, reject) {
    this.pendingRequests.push({ func: request, resolve, reject });
    if (!this.waiting) this.run();
  }

  async run() {
    if (this.waiting) return;
    if (this.pendingRequests.length == 0) return;

    this.waiting = true;
    while (true) {
      const [earliestRequestInd, earliestReq] = quickestAndIndex(
        this.lastRequests,
        this.keysObjects
      );

      if (
        earliestReq +
          this.keysObjects[earliestRequestInd].wait +
          this.waitOffset >
        Date.now()
      ) {
        await delay(
          earliestReq +
            this.keysObjects[earliestRequestInd].wait +
            this.waitOffset -
            Date.now()
        );
      }

      console.log(
        `Since last request request: ${this.previousRequest - Date.now()}`
      );
      const currElement = this.pendingRequests.shift();
      const request = currElement.func;
      const response = await request(this.keysObjects[earliestRequestInd].key);
      this.lastRequests[earliestRequestInd] = Date.now();
      this.previousRequest = Date.now();
      currElement.resolve(response);

      if (this.pendingRequests.length == 0) {
        this.waiting = false;
        return;
      }
    }
  }
}
