/**
 * Script to create or upgrade a Supabase user to Admin
 * Usage: node scripts/create-admin-user.js <email> <password>
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local not found.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);

if (!urlMatch || !keyMatch) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local.');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const serviceRoleKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const args = process.argv.slice(2);
  const targetEmail = (args[0] || '').trim().toLowerCase();
  const targetPassword = (args[1] || '').trim();

  if (!targetEmail || !targetPassword) {
    console.log('\nUsage: node scripts/create-admin-user.js <email> <password>');
    console.log('Example: node scripts/create-admin-user.js callmedhanush777@gmail.com MyStrongPassword123\n');
    process.exit(1);
  }

  if (targetPassword.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  console.log(`\nConfiguring administrator account for: ${targetEmail}...`);

  // 1. Check if user already exists in auth.users
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }

  let authUser = userList.users.find((u) => (u.email || '').toLowerCase() === targetEmail);

  if (!authUser) {
    console.log('Creating new user in Supabase Auth...');
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: targetEmail,
      password: targetPassword,
      email_confirm: true,
      user_metadata: {
        full_name: targetEmail.split('@')[0],
      },
    });

    if (createError) {
      console.error('Failed to create user:', createError.message);
      process.exit(1);
    }
    authUser = created.user;
    console.log('User created successfully in auth.users.');
  } else {
    console.log('User already exists in Supabase Auth. Updating password and confirming email...');
    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: targetPassword,
      email_confirm: true,
    });
    if (updateError) {
      console.error('Failed to update password:', updateError.message);
      process.exit(1);
    }
    authUser = updated.user;
    console.log('Password updated and email confirmed.');
  }

  // 2. Ensure public.profiles has role = 'admin'
  console.log('Setting role = "admin" in public.profiles...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authUser.id,
      full_name: targetEmail.split('@')[0],
      role: 'admin',
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    console.error('Failed to update profile role:', profileError.message);
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('SUCCESS! Admin user is ready:');
  console.log(`- Email:    ${targetEmail}`);
  console.log(`- Role:     admin`);
  console.log('- Status:   Active & Email Confirmed');
  console.log('======================================================');
  console.log('\nYou can now navigate to http://localhost:3000/admin/login');
  console.log('and log in using the Password tab!\n');
}

main();
