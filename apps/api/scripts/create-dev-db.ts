import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://neondb_owner:npg_afnCuo3mziF6@ep-proud-fire-atselmc3.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const client = new Client({
    connectionString,
  });

  console.log("Connecting to default neondb...");
  await client.connect();
  console.log("Connected successfully!");

  try {
    console.log("Checking if carry_dev database exists...");
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='carry_dev'");
    
    if (res.rowCount === 0) {
      console.log("Creating database carry_dev...");
      await client.query("CREATE DATABASE carry_dev");
      console.log("Database carry_dev created successfully!");
    } else {
      console.log("Database carry_dev already exists!");
    }
  } catch (error) {
    console.error("Error creating database:", error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
