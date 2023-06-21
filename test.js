// import { unsafe_url_filter } from "./filters.js";
// import Scheduler from "./utils/scheduler.js";

// const keys = [
//   { key: "123", wait: 10 },
//   { key: "321", wait: 1000 },
//   { key: "111", wait: 100 },
// ];

// const s = new Scheduler(keys, 1);

// s.lastRequests = [Date.now(), Date.now(), Date.now()];

// const req = new Promise((resolve, reject) => {
//   s.addRequest(
//     (key) => {
//       console.log(key);
//       return 1;
//     },
//     resolve,
//     reject
//   );
// });

function quickestAndIndex(a, keys) {
  var lowest_ind = 0;
  var lowest;
  for (var i = 0; i < a.length; i++) {
    console.log(
      a[i] + keys[i].wait,
      a[lowest_ind] + keys[lowest_ind].wait,
      lowest,
      a[i] + keys[i].wait < a[lowest_ind] + keys[lowest_ind].wait,
      !lowest
    );
    if (
      lowest == undefined ||
      a[i] + keys[i].wait < a[lowest_ind] + keys[lowest_ind].wait
    ) {
      console.log("setting lowest");
      lowest_ind = i;
      lowest = a[i];
    }
  }
  return [lowest_ind, lowest];
}

console.log(
  quickestAndIndex(
    [0, 0, 1686730008884],
    [
      { key: "14294381ff584b6ab1832eec6f26cd12", wait: 1000 },
      { key: "04a42bbfe55b45c08659ac3f597133ce", wait: 1000 },
      { key: "3c736b4156054f2cbf9d07e31c78adef", wait: 1000 },
    ]
  )
);
