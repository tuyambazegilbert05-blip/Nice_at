-- Migration: 001_initial_schema.sql
-- Description: Sets up the core tables for users, sessions, and attendance

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(32) NOT NULL DEFAULT 'member',
    student_id VARCHAR(64) UNIQUE,
    department VARCHAR(128),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(64) NOT NULL DEFAULT 'workshop',
    status VARCHAR(32) NOT NULL DEFAULT 'scheduled',
    venue VARCHAR(255) NOT NULL,
    is_virtual BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    check_in_opens_at TIMESTAMP WITH TIME ZONE NOT NULL,
    check_in_closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    participant_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    participant_name VARCHAR(255) NOT NULL,
    participant_email VARCHAR(255) NOT NULL,
    student_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'present',
    method VARCHAR(32) NOT NULL DEFAULT 'manual_staff',
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_session_email UNIQUE (session_id, participant_email)
);
