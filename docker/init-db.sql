-- ThreadCast PostgreSQL Initialization Script
-- This runs automatically when the container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE threadcast TO threadcast;

-- Create schemas if needed (optional)
-- CREATE SCHEMA IF NOT EXISTS threadcast;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'ThreadCast database initialized successfully!';
END $$;
