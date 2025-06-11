const { EventSource } = require("eventsource");

async function pollStream(chatId, lastId = "0") {
    const url = `http://localhost:4000/llm/stream/${chatId}?last_id=${lastId}`;
    const evtSource = new EventSource(url);

    evtSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📨 Message:", data);

        // if (data.isFinished) {
        //     console.log("✅ Task complete. Closing stream.");
        //     evtSource.close();
        // }
    };

    evtSource.onerror = (err) => {
        console.error("❌ Stream error", err);
        evtSource.close();
        // Retry on error
        setTimeout(() => pollStream(chatId, lastId), 2000);
    };
}

// 🚀 Start streaming
pollStream("demo-ui-upload");
