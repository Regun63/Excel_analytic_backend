import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  try {
    const response = await axios.post(
      "https://api.apyhub.com/generate/text/summary",
      {
        content: "Explain AI in simple terms." // 👈 Text you want to summarize
      },
      {
        headers: {
          "apy-token": process.env.APYHUB_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("ApyHub Summary:", response.data.data);
  } catch (error) {
    console.error("ApyHub Error:", error.response?.data || error.message);
  }
}

run();
