import requests

def get_public_ip():
    url = 'https://api.ipify.org?format=json'
    response = requests.get(url)
    response.raise_for_status()
    ip_data = response.json()
    return ip_data

if __name__ == "__main__":
    public_ip = get_public_ip()
    print(f"Public IP Address: {public_ip}")
