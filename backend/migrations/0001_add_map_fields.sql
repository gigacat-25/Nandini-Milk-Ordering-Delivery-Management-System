-- Add latitude and longitude to users for delivery address pinpointing
ALTER TABLE users ADD COLUMN latitude REAL;
ALTER TABLE users ADD COLUMN longitude REAL;

-- Add latitude and longitude to delivery_sessions for live tracking
ALTER TABLE delivery_sessions ADD COLUMN current_lat REAL;
ALTER TABLE delivery_sessions ADD COLUMN current_lng REAL;
