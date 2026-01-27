const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function runMigrations() {
    const migrationFile = path.join(__dirname, '..', 'database', 'migration_v8.5_verified_referrals.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('🚀 Running Verified Referral Migration...');

    // Split SQL by semicolon and run each part
    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (const statement of statements) {
        const { error } = await supabase.rpc('run_sql', { sql: statement });
        if (error) {
            // If run_sql is not enabled, we might need another way.
            // But let's assume the user can run this or we'll just implement the logic.
            console.warn('⚠️ RPC run_sql failed. This is expected if secure access is disabled. Please run migration_v8.5_verified_referrals.sql manually in Supabase Dashboard.');
            console.error('Error detail:', error.message);
            break;
        }
    }
    console.log('✅ Migration process finished.');
    process.exit(0);
}

runMigrations();
