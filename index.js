import express from "express";
import cors from "cors";
const port = 3000;
const app = express();

import {
  unsafe_url_filter,
  unsafe_image_filter,
  unsafe_text_filter,
  spam_filter,
} from "./filters.js";

app.use(express.json({ limit: "50mb" }));
app.use(cors());

app.post("/", async (req, res) => {
  try {
    let alerts = { unsafeURL: 0, unsafeText: 0, unsafeImage: 0, spam: 0 };
    let promises = [];

    if (req.body.text) {
      let text = req.body.text;

      // remove unceccesart html tags
      text = text.replace(/<[^>]*>?/gm, "");

      promises.push(
        unsafe_url_filter(text).then((res) => {
          alerts.unsafeURL += res;
        })
      );
      promises.push(
        unsafe_text_filter(text).then((res) => {
          alerts.unsafeText += res;
        })
      );
      //alerts.spam += spam_filter(text);
    }

    if (req.body.image) {
      let image = req.body.image;
      promises.push(
        unsafe_image_filter(image).then((res) => {
          alerts.unsafeImage += res;
        })
      );
    }

    await Promise.all(promises);

    // if (
    //   alerts.unsafeURL > 0 ||
    //   alerts.unsafeText > 0 ||
    //   alerts.unsafeImage > 0 ||
    //   alerts.spam > 0
    // ) {
    // }

    res.status(200);
    res.send(alerts);
  } catch {
    res.status(500);
    res.send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
