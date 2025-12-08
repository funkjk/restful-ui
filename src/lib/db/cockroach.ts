import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

let pool: Pool | null = null;

/**
 * Get or create a database connection pool
 */
export function getPool(): Pool {
    if (!pool) {
        const databaseUrl = env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        pool = new Pool({
            connectionString: databaseUrl,
            ssl: {
                rejectUnauthorized: false, // Required for CockroachDB Serverless
            },
        });

        // Handle pool errors
        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    return pool;
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

