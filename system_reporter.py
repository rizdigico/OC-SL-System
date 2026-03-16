import requests

# This points to your Next.js dashboard
DASHBOARD_URL = "https://oc-sl-system.vercel.app/api/webhooks/openclaw"
SECRET_KEY = "AarizScorpio18112009"

def report_to_system(agent_id: str, status: str, progress: int, current_task: str):
    """Sends live updates from the Python agent to the Next.js Dashboard."""
    headers = {
        "Authorization": f"Bearer {SECRET_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "agentId": agent_id,
        "status": status,
        "progress": progress,
        "currentTask": current_task
    }

    try:
        response = requests.post(DASHBOARD_URL, json=payload, headers=headers, timeout=5)

        if response.status_code == 200:
            print(f"[SYSTEM] {agent_id.upper()} transmitted: {progress}% ({current_task})")
        else:
            print(f"[ERROR] Dashboard rejected transmission. Status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("[ERROR] Could not find the Dashboard. Is localhost:3000 running?")
    except Exception as e:
        print(f"[ERROR] System transmission failed: {e}")
