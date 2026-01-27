const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load env from current folder
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function confirmUser(email) {
    console.log(`🚀 Attempting to confirm: ${email}`);

    // Using admin to list and update
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return console.error('Error listing users:', listError.message);

    const user = users.find(u => u.email === email);
    if (!user) return console.error('User not found!');

    const { error: confirmError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    );

    if (confirmError) console.error('Error confirming:', confirmError.message);
    else {
        console.log(`✅ Success! User ${email} is now confirmed.`);
        // Also ensure they have a profile
        const { error: profileError } = await supabase.from('users').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User'
        });
        if (profileError) console.warn('Profile upsert warning:', profileError.message);
    }
    process.exit(0);
}

confirmUser('mohamebarkia0834@gmail.com');
