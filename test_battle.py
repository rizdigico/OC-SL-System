import time
from system_reporter import report_to_system

def simulate_telegram_agent():
    print("🚀 Initiating simulated KiloClaw Agent...")

    # 1. Start the task (10%)
    report_to_system("beru", "EXECUTING", 10, "Telegram command received: Starting data scrape...")
    time.sleep(3) # Wait 3 seconds

    # 2. Mid-way progress (50%)
    report_to_system("beru", "EXECUTING", 50, "Bypassing captchas, extracting 500 rows...")
    time.sleep(3)

    # 3. TRIGGER THE BOSS FIGHT (80%)
    report_to_system("beru", "EXECUTING", 80, "WARNING: Final target localized. Boss spawning...")
    time.sleep(4) # Let you watch the fight for 4 seconds

    # 4. Dungeon Cleared (100%)
    report_to_system("beru", "COMPLETED", 100, "Scrape complete. Sending CSV to Telegram.")
    print("✅ Simulation complete!")

if __name__ == "__main__":
    simulate_telegram_agent()
