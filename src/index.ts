import './utils/libsignal-logs.ts';
import { createApp } from './app.ts';
import { env } from './config/env.ts';
import { closeDb, verifyDbConnection } from './db/client.ts';
import { runMigrations } from './db/migrations/runner.ts';

const app = createApp();

async function bootstrap() {
    try {
        await verifyDbConnection();
        await runMigrations();
        console.log('Migrations applied successfully.');
    } catch (error) {
        console.error('Database connection failed:', error);
        await closeDb();
        process.exit(1);
    }

    Bun.serve({
        port: env.port,
        fetch: app.fetch,
    });

    console.log(`WhatsApp API running on port ${env.port}...`);
}

bootstrap().catch(async (error) => {
    console.error('Failed to start application:', error);
    await closeDb();
    process.exit(1);
});
