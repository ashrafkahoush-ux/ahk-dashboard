import fetch from "node-fetch";

const API_KEY = "AIzaSyD_3VlTwKtpg2PUkKv3EnRh4Oj5BQQaabw";
const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

const body = {
  contents: [
    {
      parts: [{ text: "Test message from EMMA Command Center. Please respond with: FUSION PIPELINE CLEAR" }],
    },
  ],
};

(async () => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  if (data.candidates && data.candidates[0]) {
    const text = data.candidates[0].content.parts[0].text;
    console.log("\n✅ GEMINI API KEY VALIDATED\n");
    console.log("Response:", text);
    console.log("\n🎯 Pipeline Status: OPERATIONAL");
  } else {
    console.log("API Response:", JSON.stringify(data, null, 2));
  }
})();
