import requests

# Configuration - Local Ports
USERS_API = "http://localhost:8001"
BOOKINGS_API = "http://localhost:8002"
PREFERENCES_API = "http://localhost:8003"
LISTINGS_API = "http://localhost:8004"

def seed_users():
    print("\n--- Seeding Users ---")
    users = [
        {"name": "Alice Johnson", "email": "alice@example.com", "phone_number": "+15550101", "housing_preference": "apartment", "listing_group": "facebook"},
        {"name": "Bob Smith", "email": "bob@example.com", "phone_number": "+15550102", "housing_preference": "single family home", "listing_group": "zillow"},
        {"name": "Charlie Brown", "email": "charlie@example.com", "phone_number": "+15550103", "housing_preference": "apartment", "listing_group": "other"},
    ]
    created_users = []
    for u in users:
        try:
            # Check if exists first to avoid duplicate errors if run multiple times
            # (Simplified check by expecting error or just trying creation)
            res = requests.post(f"{USERS_API}/users", json=u)
            if res.status_code in [200, 201]:
                data = res.json()
                print(f"Created User: {data['name']} (ID: {data['id']})")
                created_users.append(data)
            else:
                print(f"Failed to create {u['name']}: {res.text}")
        except Exception as e:
            print(f"Error connecting to Users API: {e}")
    return created_users

def seed_listings():
    print("\n--- Seeding Listings ---")
    listings = [
        {
            "title": "Modern Downtown Studio",
            "description": "Heart of the city, close to metro.",
            "monthly_rent": 1500.0,
            "num_bedrooms": 0,
            "num_bathrooms": 1,
            "square_feet": 500,
            "amenities": ["Gym", "Doorman"],
            "is_available": True,
            "address": {
                "street": "123 Main St",
                "city": "New York",
                "state": "NY",
                "postal_code": "10001",
                "country": "USA"
            }
        },
        {
            "title": "Cozy 2-Bedroom in Brooklyn",
            "description": "Quiet neighborhood, exposed brick.",
            "monthly_rent": 2800.0,
            "num_bedrooms": 2,
            "num_bathrooms": 1,
            "square_feet": 950,
            "amenities": ["Garden", "Dishwasher"],
            "is_available": True,
            "address": {
                "street": "456 Park Slope",
                "city": "Brooklyn",
                "state": "NY",
                "postal_code": "11215",
                "country": "USA"
            }
        },
        {
            "title": "Luxury Penthouse",
            "description": "Amazing views, private terrace.",
            "monthly_rent": 5000.0,
            "num_bedrooms": 3,
            "num_bathrooms": 2,
            "square_feet": 1800,
            "amenities": ["Pool", "Gym", "Parking"],
            "is_available": True,
            "address": {
                "street": "789 Highline",
                "city": "New York",
                "state": "NY",
                "postal_code": "10011",
                "country": "USA"
            }
        }
    ]
    created_listings = []
    for l in listings:
        try:
            res = requests.post(f"{LISTINGS_API}/listings", json=l)
            if res.status_code in [200, 201]:
                data = res.json()
                print(f"Created Listing: {data['title']} (ID: {data['id']})")
                created_listings.append(data)
            else:
                print(f"Failed to create listing {l['title']}: {res.text}")
        except Exception as e:
            print(f"Error connecting to Listings API: {e}")
    return created_listings

def seed_preferences(users):
    print("\n--- Seeding Preferences ---")
    for user in users:
        try:
            prefs = {
                "user_id": user['id'],
                "max_budget": 3000.0,
                "min_size": 400,
                "location_area": ["New York", "Brooklyn"],
                "rooms": 1
            }
            res = requests.post(f"{PREFERENCES_API}/", json=prefs)
            if res.status_code in [200, 201]:
                print(f"Created Preferences for {user['name']}")
            else:
                print(f"Failed to create preferences for {user['name']}: {res.text}")
        except Exception as e:
            print(f"Error connecting to Preferences API: {e}")

def seed_bookings(users, listings):
    print("\n--- Seeding Bookings ---")
    # Book the first listing for the first user
    if not users or not listings:
        print("Skipping bookings (missing users or listings)")
        return

    try:
        user_id = users[0]['id']
        listing_id = listings[0]['id']
        
        booking_data = {
            "user_id": user_id,
            "listing_id": listing_id
        }
        res = requests.post(f"{BOOKINGS_API}/bookings", json=booking_data)
        if res.status_code in [200, 201]:
            print(f"Created Booking: User {users[0]['name']} -> Listing {listings[0]['title']}")
        else:
            print(f"Failed to create booking: {res.text}")
            
    except Exception as e:
        print(f"Error connecting to Bookings API: {e}")

if __name__ == "__main__":
    print("Starting Data Seeding...")
    print("Ensure all 4 microservices are running on ports 8001, 8002, 8003, 8004.")
    
    users = seed_users()
    listings = seed_listings()
    
    if users:
        seed_preferences(users)
    
    if users and listings:
        seed_bookings(users, listings)
        
    print("\nSeeding Completed.")
