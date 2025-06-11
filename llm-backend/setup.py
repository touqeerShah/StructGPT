import requests
import json
import time

def fetch_data(url, token):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        "Authorization": f"Token {token}"
    }
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print("Error:", response.status_code)
            return None
    except requests.exceptions.RequestException as e:
        print("Error fetching data:", e)
        return None

def save_response_to_file(response, filename):
    with open(filename, 'a') as file:
        json.dump(response['results'], file)
        file.write('\n')

api_base_url = "https://solodit.xyz/api/issues/rest/?bookmarked=False&finder=&general_scores=&impact=HIGH%2CMEDIUM%2CLOW%2CGAS&keyword=&markasread=All&min_finders=1&pcategories=&protocol=&protocol_forked_from=&quality_scores=&report_date=&source=&tags="

# Extracting token from the provided string
persist_auth = '{"user":"{\\"id\\":4653,\\"username\\":\\"auditor#4653\\",\\"slug\\":\\"auditor4653\\",\\"email\\":\\"touqeershah32@gmail.com\\",\\"useravatar\\":null,\\"role\\":\\"NORMAL\\",\\"c4user\\":null,\\"sherlockuser\\":null,\\"score\\":0,\\"rank\\":0,\\"isStaff\\":false,\\"isStaging\\":false}","token":"\\"b094270efb163a8d3ca64567a9b0907a9b4e6a53\\"","_persist":"{\\"version\\":-1,\\"rehydrated\\":true}"}'
persist_auth_dict = json.loads(persist_auth)
token = persist_auth_dict["token"].strip('"')

# Initial request to get total pages
initial_response = fetch_data(api_base_url, token)
if initial_response:
    total_pages = initial_response['total_pages']
    print(f"Total Pages: {total_pages}")

    # Loop through all pages
    for page_num in range(1, total_pages + 1):
        page_url = f"{api_base_url}&page={page_num}"
        response = fetch_data(page_url, token)
        if response:
            save_response_to_file(response, 'api_responses.json')
            print(f"Page {page_num} processed")
            time.sleep(2)  # Wait for 2 seconds before making the next request
        else:
            print(f"Failed to fetch data for page {page_num}")

    print("All pages processed and responses saved to 'api_responses.json' file.")
else:
    print("Failed to fetch initial data.")
