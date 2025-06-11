import asyncio
import websockets
import requests
from requests_toolbelt.multipart.encoder import MultipartEncoder
import json
import os

# The WebSocket URL (adjust to your server's WebSocket endpoint)
WEBSOCKET_URL = "ws://localhost:4000/ws"
auth_token = "Bearer YOUR_AUTH_TOKEN_HERE"  # Replace with a valid token

# The upload URL (adjust to your server's upload endpoint)
UPLOAD_URL = "http://localhost:4000/api/upload"

# The file path to upload (dummy file for testing)
FILE_PATH = "./KW24Abstracts-1-20.pdf"  # Adjust to the correct path

# WebSocket client to receive progress with authorization headers
async def websocket_listener():
    async with websockets.connect(
        WEBSOCKET_URL,
        extra_headers={"Authorization": auth_token}
    ) as websocket:
        while True:
            try:
                response = await websocket.recv()
                data = json.loads(response)
                print(f"Received progress: {data}")
            except websockets.ConnectionClosed:
                print("WebSocket connection closed")
                break

# Function to upload file via HTTP POST
def upload_file():
    if not os.path.exists(FILE_PATH):
        print(f"File {FILE_PATH} not found!")
        return

    # Prepare the file upload
    with open(FILE_PATH, 'rb') as f:
        multipart_data = MultipartEncoder(
            fields={
                'files': (os.path.basename(FILE_PATH), f, 'application/pdf')
            }
        )
        headers = {
            'Content-Type': multipart_data.content_type,
            'Authorization': auth_token
        }

        # Make the POST request
        response = requests.post(UPLOAD_URL, data=multipart_data, headers=headers)
        
        # Print the server's response
        if response.status_code == 200:
            print(f"Upload response: {response.json()}")
        else:
            print(f"Failed to upload: {response.status_code}, {response.text}")

# Combine WebSocket listening and file upload
async def main():
    # Start the WebSocket listener in the background
    listener_task = asyncio.create_task(websocket_listener())

    # Upload the file via HTTP POST
    upload_file()

    # Wait for the WebSocket listener to finish
    await listener_task

# Start the test
asyncio.run(main())
