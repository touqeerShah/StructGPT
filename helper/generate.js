const axios = require("axios");

async function callDataGenerationAPI({
  fields,
  keywords,
  query,
  chat_id,
  collection_name,
  is_memory = false,
  token,
}) {
  try {
    const payload = {
      fields,
      keywords,
      query, // should be an array of strings
      chat_id,
      is_memory,
      collection_name, // should be a list of collection names
    };

    const response = await axios.post(
      "http://localhost:4001/llm/data_generation",
      payload,
      {
        headers: {
          Authorization: token, // e.g., "Bearer <JWT_TOKEN>"
          "Content-Type": "application/json",
        },
        responseType: "stream", // Since you're returning StreamingResponse (SSE)
      }
    );

    // Handle streamed response
    response.data.on("data", (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text); // Or handle text in your frontend/app
    });

    response.data.on("end", () => {
      console.log("\n✅ Stream complete.");
    });

    response.data.on("error", (err) => {
      console.error("❌ Stream error:", err);
    });
  } catch (error) {
    console.error("❌ API call failed:", error.message);
  }
}

callDataGenerationAPI({
  fields: ["abstruct_number", "Background  ", "Method", "Results", "Funding", "Conclusions"],
  keywords: [],
  query: "need abstruct_number start with two char then - then four more character example th-or12 or fr-1234 it have,Background  ,Method,Results,Funding, Conclusions ",
  chat_id: "demo1",
  collection_name: "kw24abstracts-1-20-1",
  token: "TOKEN", // Your Bearer token
});


