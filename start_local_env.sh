pkill -f "python.*8001"
pkill -f "python.*8002"
pkill -f "python.*8003"
pkill -f "python.*8004"
pkill -f "http.server 8080"

echo "Starting Local Microservices Environment..."

echo "Starting Users Service (8001)..."
cd users-microservice
DATABASE_URL="sqlite:///users.db" FASTAPIPORT=8001 python3 main.py > ../users.log 2>&1 &
cd ..

echo "Starting Bookings Service (8002)..."
cd bookings-microservice
DATABASE_URL="sqlite:///bookings.db" FASTAPIPORT=8002 USERS_SERVICE_URL="http://localhost:8001" LISTINGS_SERVICE_URL="http://localhost:8004" PREFERENCES_SERVICE_URL="http://localhost:8003" python3 main.py > ../bookings.log 2>&1 &
cd ..

echo "Starting Preferences Service (8003)..."
cd preferences-microservice
DATABASE_URL="sqlite:///preferences.db" PORT=8003 python3 main.py > ../preferences.log 2>&1 &
cd ..

echo "Starting Listings Service (8004)..."
cd apartment-listings
DATABASE_URL="sqlite:///listings.db" FASTAPIPORT=8004 python3 main.py > ../listings.log 2>&1 &
cd ..

echo "Starting Frontend (8080)..."
cd frontend/public
python3 -m http.server 8080 > ../../frontend.log 2>&1 &
cd ../..

echo "Waiting for services to spin up (5s)..."
sleep 5

echo "Seeding Data..."
python3 seed_data.py

echo "---------------------------------------------------"
echo "Environment Running!"
echo "Frontend: http://localhost:8080"
echo "Logs are in *.log files in this directory."
echo "To stop everything, run: pkill -f python3"
echo "---------------------------------------------------"
