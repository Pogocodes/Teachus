import { config } from "dotenv";
config();

import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Creating session_recordings table...");
  await client`
    CREATE TABLE IF NOT EXISTS session_recordings (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES live_sessions(id),
      tutor_id INTEGER NOT NULL REFERENCES instructors(id),
      student_id INTEGER NOT NULL REFERENCES users(id),
      booking_id INTEGER NOT NULL REFERENCES bookings(id),
      status TEXT DEFAULT 'recording',
      file_path TEXT,
      file_size INTEGER,
      duration INTEGER,
      started_at TIMESTAMP DEFAULT NOW(),
      ended_at TIMESTAMP,
      error_message TEXT
    )
  `;
  console.log("✓ session_recordings table created");

  console.log("Creating session_issues table...");
  await client`
    CREATE TABLE IF NOT EXISTS session_issues (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES live_sessions(id),
      reported_by INTEGER NOT NULL REFERENCES users(id),
      role TEXT NOT NULL,
      issue_type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✓ session_issues table created");

  console.log("Migration complete!");
  await client.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
