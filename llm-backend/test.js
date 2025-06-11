const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const API_URL = "https://localhost:4000/api";
const FILE_PATH = "./The_Renal_Drug_Handbook_The_Ultimate.pdf";
const CHUNK_SIZE = 1024 * 1024; // 0.5MB
const TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjY1NGNlODI2N2ZjMzVjZDA4ODk4MzJhYiIsImlkIjo5LCJlbWFpbCI6Im91dGFsZWIuY29uc3VsdGluZ0BnbWFpbC5jb20iLCJ1c2VybmFtZSI6ImFkbWluIiwiZmlyc3ROYW1lIjoiYWRtaW4iLCJsYXN0TmFtZSI6ImFkbWluIiwidXNlckFjY2VzcyI6WyI2NTI3ZTE3ZDllMmYxZTU2MDZmNzdiYWYiLCI2NTI3ZTE4NDllMmYxZTU2MDZmNzdiYjAiXSwiYXZhdGFyIjoiIiwiaXNBY3RpdmF0ZWQiOnRydWUsInNhbHQiOiJhN2VhOGE0ZWFlY2VhM2E0MTM3NmI5ZTcwN2NiYWExZDVhNzRjZjc0ODIyNTU5NDg5NGFmZGYwZjZmMzhkNWJhIiwiaGFzaCI6ImVlOTFmNjdmNGQwNTFmNGMzNjUzNDlmOTc1ZmRiYzZkYzI0M2EyYTY2MmVhOTBmZGVhYWFiYzkzOGYxMTVlY2IxOWRmMDYzZDE4YjBlNWQ2ZjIxMmZkYjliNzRjMjM0NDAxNjEyZTk1MWRiNmViMWIwMWU4YTY3ZmVjYzQ0NjZiYjJlMGIwNjcyYWEyZmExOGQ3ZTI0YzZhYTlkYjUzMzE1Yzk4YThiZTgxNzVjNDExNzk3MzMwZGQ4NDQzMDAxMTY0OGUyYzE3ZmVlNDdjYTUxMTIyOTdlZTljNTI3YjdmN2NlOTQyNGZiNGM0OWZiNzhjOGFlZDllMDFhYThmZjdiMmVmNGNjYjc3NTgyYzlmYmIxOGNiMTBhM2FjYmRiNTliZjk5ZjQ2ZmIzNjA2ZGM0ZTc4YzVjYWY1YzVhOTAwMzU2MjI3ZjhkY2JjYmM0ODMwNTVkODRhZTI4Mjg4ZWMyODhlODY2NWRiZTE0OTIwMmRhNjI4ZmY3NGE5MzQ0OTg3MmM2MmIyM2NmY2VhODI2ZmMxMmMxOWQ4MWI2MTBlMTFkZWE0YjRmZWU2ZjAwODBlMmYwOTMxMzg1YmQyZDM3ZTFjMWNlZGFlMzllNTY3YmFhM2I2OGEwMGE2N2FjNDZmM2Q1ODJhYzA0ZjkxYTg2N2E4YWFkYWUxOWYwYTdjZDE5ZWVjNDkwZTE2ZTY4ZWIwYWU1YmNiYjM2YzE3M2VjODE1NTJjZGI3M2Q1OGZlMzRmMWNjMjRkNGRiZmIzZmVjZDhlY2JiM2I2ODUxYTk1ZjU2MjU1ODQ0NzA2ZWNjZjEwYjA5MWMxODA0NGQ2MmQyMDQyMmRjZTFjZGUyNTU1NzdjNjhiMmY5Y2FkZmM2YjRkODQ1MDk3MTQyMDllMTFlNGZhODk4MzkyNzhiODY1YmUyMzcxNDZiMmJlZTQwNDc4Nzg4NjFkOGQyM2Y1ODkzZGQwMGIzZWU3OGQ0OTVkMzNlNTc3YjAwY2ZhNzgzYTBiNzBmMjM4MGFkZGI2ZTM2ZjIwNDViNjdlMDY1MTI1NDI5OGJmNGJlMWU5NTMzOTRhNTkxZTM3YTFmMzQ1ZjA1Njk1MGE5YzI2MDVjMDhlYjRjNWYwNWZmNmJkNWIwODY0NTFjYzg5N2ViNjA4ZWNlNjg1MmQ2OGJjZGVhM2U3OTY5MTIzYzQxMTYzNjQwYWY1ZDQ1ZmJiYTI5NTViNzMxZTRlYjlkY2I4MTQ2NmFjZjg2MDNjNjEyMjJmMTMyZjhkOTA2YmYxYTNkYTkyZDkyMGYzOGFlM2RhNWI1ZmQ3OWNmNTAxODc3YmNiYzU0MWY5YmZiOTU3ZGNhNmEzYTI5MzBjYjdkYmUzOTUwZWQiLCJjcmVhdGVkQXQiOiIyMDIzLTExLTA5VDE0OjA5OjQzLjM0NloiLCJ1cGRhdGVkQXQiOiIyMDI1LTAzLTE4VDEwOjU0OjE3LjMzNVoiLCJfX3YiOjAsInJvbGUiOiI4YzY5NzZlNWI1NDEwNDE1YmRlOTA4YmQ0ZGVlMTVkZmIxNjdhOWM4NzNmYzRiYjhhODFmNmYyYWI0NDhhOTE4In0sInNlc3Npb24iOiJvRzFhYUtRUzVNSm9ZSUFvTVlxVlM1QkV0eGhaN2dGOSIsImlhdCI6MTc0NjY5ODAyOH0.bYao5IhnIetnNrClterqGGFUnkCW9Wcubg98KUvkj5M"; // Replace with your actual JWT token
const MAX_CONCURRENT_UPLOADS = 5; // Control the number of parallel uploads

async function uploadFile(filePath) {
    try {
        const fileStat = fs.statSync(filePath);
        const totalSize = fileStat.size;
        const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
        const fileId = "demo1"; // Generate unique file ID
        const fileName = path.basename(filePath);

        console.log(`Uploading ${fileName} in ${totalChunks} chunks...`);

        // Create a queue of all chunk indices
        const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);

        const MAX_RETRIES = 3;
        const RETRY_DELAY_MS = 1000; // initial delay (will be doubled each retry)
        
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        
        const uploadChunk = async (chunkIndex, attempt = 1) => {
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalSize);
        
            if (start >= totalSize) {
                console.warn(`Skipping empty chunk at index ${chunkIndex}`);
                return;
            }
        
            const chunk = fs.createReadStream(filePath, { start, end: end - 1 });
            const formData = new FormData();
            formData.append("file", chunk, fileName);
            formData.append("file_id", fileId);
            formData.append("chunk_index", String(chunkIndex));
            formData.append("total_chunks", String(totalChunks));
            formData.append("chat_id", String(fileId));
        
            const headers = {
                ...formData.getHeaders(),
                Authorization: TOKEN,
            };
        
            try {
                const response = await axios.post(`${API_URL}/upload_chunk_s3`, formData, {
                    headers,
                    maxBodyLength: Infinity,
                });
                console.log(`✅ Uploaded chunk ${chunkIndex + 1}/${totalChunks}:`, response.data);
            } catch (error) {
                console.error(`❌ Chunk ${chunkIndex + 1} failed (Attempt ${attempt}):`, error.message);
        
                if (attempt < MAX_RETRIES) {
                    const wait = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                    console.log(`🔁 Retrying in ${wait}ms...`);
                    await delay(wait);
                    return uploadChunk(chunkIndex, attempt + 1);
                } else {
                    throw new Error(`❌ Failed to upload chunk ${chunkIndex + 1} after ${MAX_RETRIES} attempts.`);
                }
            }
        };
        
        // Control the parallelism
        const batchUploadChunks = async () => {
            while (chunkIndices.length > 0) {
                const batch = chunkIndices.splice(0, MAX_CONCURRENT_UPLOADS);
                await Promise.all(batch.map((index) => uploadChunk(index)));
            }
        };

        await batchUploadChunks();

        console.log(`Upload complete for ${fileName}! Starting processing...`);
        // await processFile(fileId, fileName);
    } catch (error) {
        console.error("Error loading file:", error.message);
    }
}

// Start the upload process
uploadFile(FILE_PATH);
