# Cloud Computing Group Project - Local Development Guide

This repository contains the microservices and frontend for our Apartment Booking Application.

## Setup & Installation

To run the local environment, you must have the following directory structure:

```text
Project-Root/
├── start_local_env.sh
├── seed_data.py
├── apartment-listings/       <-- Clone of apartment-listings repo
├── bookings-microservice/    <-- Clone of bookings-microservice repo
├── frontend/                 <-- Clone of frontend repo (this repo)
├── preferences-microservice/ <-- Clone of preferences-microservice repo
└── users-microservice/       <-- Clone of users-microservice repo
```

### 1. Clone the Repositories
Run these commands in your project root:

```bash
git clone git@github-columbia:CC-F25/apartment-listings.git
git clone git@github-columbia:CC-F25/bookings-microservice.git
git clone git@github-columbia:CC-F25/frontend.git
git clone git@github-columbia:CC-F25/preferences-microservice.git
git clone git@github-columbia:CC-F25/users-microservice.git
```

### 2. Copy Helper Scripts
Ensure `start_local_env.sh` and `seed_data.py` are present in the root directory (at the same level as the cloned folders).

## Quick Start (One-Click Setup)

We have packaged the entire local environment (all 4 microservices + frontend + mock data) into a single script.

### 1. Run the Environment
In your terminal, run:

```bash
./start_local_env.sh
```

This script will:
*   Start **Users Service** (Port 8001)
*   Start **Bookings Service** (Port 8002)
*   Start **Preferences Service** (Port 8003)
*   Start **Listings Service** (Port 8004)
*   Start **Frontend** (Port 8080)
*   **Seed the Database** with mock users and apartments.

### 2. Access the App
Open your browser to: **[http://localhost:8080](http://localhost:8080)**

---

## How to Test Features

### 1. View Listings
1.  Go to the **Listings** tab.
2.  You should see seeded apartments (e.g., "Modern Downtown Studio", "Cozy 2-Bedroom").
3.  Use the **Search** filters (Min Rent/Max Rent) to filter the results.

### 2. Create a Booking
To make a booking, you need a valid **User ID**. The seed script creates seeded users for you.

1.  **Copy this Test User ID**: `ffc25615-9dbb-4b11-a1c6-a4bd3b7d9336` 
    *(Note: If you re-ran the seed script, check the terminal output for "Created User" IDs).*
2.  On the **Listings** page, click the **Book** button on any apartment.
3.  Paste the User ID into the prompt and click **OK**.
4.  You should see an alert: `Booking Successful!`.

### 3. View My Bookings
1.  Go to the **My Bookings** tab.
2.  Paste the same **User ID** (`ffc25615-9dbb-4b11-a1c6-a4bd3b7d9336`) into the input box.
3.  Click **Load Bookings**.
4.  You will see your active reservations.

---

## Troubleshooting

### Stopping the Environment
To stop all running services, press `Ctrl+C` in the terminal where you ran the script.

If processes remain running (e.g., "Address in use" errors), run this command to force-kill them:

```bash
pkill -f python3
```

### Database Reset
The setup uses local SQLite files (`users.db`, `bookings.db`, etc.). To completely reset the data:
1.  Stop the services.
2.  Delete the `.db` files: `rm *.db`
3.  Run `./start_local_env.sh` again.



# Firebase deployment

Use either function inside the project folder
`firebase deploy`
OR

`firebase deploy --only hosting`