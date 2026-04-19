import { config } from "dotenv";
config();

import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Dropping existing session_recordings table...");
  await client`DROP TABLE IF EXISTS session_recordings CASCADE`;
  
  console.log("Creating session_recordings table...");
  await client`
    CREATE TABLE session_recordings (
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

  console.log("Migration complete!");
  await client.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
