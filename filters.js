import axios from "axios";
import dotenv from "dotenv";
import Scheduler from "./utils/scheduler.js";

dotenv.config();
const keys = [];
let key;
let i = 1;
let currentKey = process.env[`ACM_${i}`];
while (currentKey) {
  keys.push({ key: currentKey, wait: 1000 });
  i++;
  currentKey = process.env[`ACM_${i}`];
}

const urlSafety = {};

const SafetyRequestScheduler = new Scheduler(keys, 10);

export const unsafe_url_filter = async (text) => {
  const urls = text.match(
    /^[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
  );
  if (!urls) return 0;
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      if (urlSafety[url]) {
        return urlSafety[url];
      } else {
        const base = Buffer.from(url).toString("base64").replaceAll("=", "");
        try {
          const result = await axios.get(
            `https://www.virustotal.com/api/v3/urls/${base}`,
            {
              headers: {
                "Content-Type": "application/json",
                "x-apikey": process.env.VT,
              },
            }
          );
          // console.log(result.data.data.attributes.last_analysis_stats);
          const stats = result.data.data.attributes.last_analysis_stats;

          let score = 0;
          if (
            stats.suspicious > 2 ||
            (stats.malicious > 1 && stats.malicious <= 3) ||
            stats.undetected + stats.suspicious > stats.harmless ||
            stats.undetected + stats.malicious > stats.harmless
          ) {
            score = 2;
          } else if (stats.malicious > 3) {
            score = 3;
          }
          return score;
        } catch (e) {
          console.log(e.data.error);
          if (e.response.status == 404) return 1;
          if (e.response.status == 401) return 1;
          return 0;
        }
      }
    })
  );
  return Math.max(results.map((result) => result.value));
};

export const unsafe_text_filter = async (text) => {
  // If text is empty, return as safe
  if (text.trim().length == 0) return 0;

  const finalResponse = await new Promise((resolve, reject) => {
    const reqFunc = async (key) => {
      const response = await axios.post(
        "https://eastasia.api.cognitive.microsoft.com/contentmoderator/moderate/v1.0/ProcessText/Screen?autocorrect=false&PII=false&classify=True&language=eng",
        text,
        {
          headers: {
            "Content-Type": "text/plain",
            "Ocp-Apim-Subscription-Key": key,
          },
        }
      );
      return response;
    };
    SafetyRequestScheduler.addRequest(reqFunc, resolve, reject);
  });

  if (finalResponse.data.Classification.ReviewRecommended) {
    return 3;
  } else {
    return 0;
  }
};

export const unsafe_image_filter = async (RawImage) => {
  const image = RawImage.replace("data:image/jpeg;base64,", "");
  const finalResponse = await new Promise((resolve, reject) => {
    const reqFunc = async (key) => {
      const response = await axios.post(
        "https://eastasia.api.cognitive.microsoft.com/contentmoderator/moderate/v1.0/ProcessImage/Evaluate",
        {
          DataRepresentation: "Inline",
          Value: image,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": key,
          },
        }
      );
      return response;
    };
    SafetyRequestScheduler.addRequest(reqFunc, resolve, reject);
  });

  if (
    finalResponse.data.IsImageAdultClassified ||
    finalResponse.data.IsImageRacyClassified
  ) {
    return 3;
  } else {
    return 0;
  }
};

export const spam_filter = async (text) => {
  // to be implemented
  return 0;
};
