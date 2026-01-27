const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend folder
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function confirmUser(email) {
    console.log(`🚀 Attempting to confirm: ${email}`);

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return console.error('Error listing users:', listError.message);

    const user = users.find(u => u.email === email);
    if (!user) return console.error('User not found!');

    const { error: confirmError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    );

    if (confirmError) console.error('Error confirming:', confirmError.message);
    else console.log(`✅ Success! User ${email} is now confirmed.`);
}

confirmUser('y220890@gmail.com');
