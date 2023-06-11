import axios from "axios";
import dotenv from "dotenv";
import Scheduler from "./utils/scheduler.js";

dotenv.config();

const urlSafety = {};

const SafetyRequestScheduler = new Scheduler(false, 1010);

export const unsafe_url_filter = async (text) => {
  const urls = text.match(
    /\b((https?|ftp|file):\/\/|(www|ftp)\.)[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/gi
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

          const stats = result.data.data.attributes.last_analysis_stats;

          let score = 0;
          if (
            stats.suspicious > 2 ||
            (stats.malicious > 1 && stats.malicious < 3) ||
            stats.undetected > stats.harmless * 1.5
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
    const reqFunc = async () => {
      const response = await axios.post(
        "https://eastasia.api.cognitive.microsoft.com/contentmoderator/moderate/v1.0/ProcessText/Screen?autocorrect=false&PII=false&classify=True&language=eng",
        text,
        {
          headers: {
            "Content-Type": "text/plain",
            "Ocp-Apim-Subscription-Key": process.env.AZURE_CONTENT_MODERATOR,
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
  console.log("image filter");
  const image = RawImage.replace("data:image/jpeg;base64,", "");
  const finalResponse = await new Promise((resolve, reject) => {
    const reqFunc = async () => {
      const response = await axios.post(
        "https://eastasia.api.cognitive.microsoft.com/contentmoderator/moderate/v1.0/ProcessImage/Evaluate",
        {
          DataRepresentation: "Inline",
          Value: image,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": process.env.AZURE_CONTENT_MODERATOR,
          },
        }
      );
      return response;
    };
    SafetyRequestScheduler.addRequest(reqFunc, resolve, reject);
  });

  console.log(finalResponse.data);

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
