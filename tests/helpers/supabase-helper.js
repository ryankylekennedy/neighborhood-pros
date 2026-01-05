import { createClient } from '@supabase/supabase-js';

// Admin client for test setup/cleanup
export const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Regular client (same as frontend uses)
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Clean up test data after tests
 */
export async function cleanupTestData(email) {
  // Delete test user
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const testUser = users.users.find(u => u.email === email);

  if (testUser) {
    await supabaseAdmin.auth.admin.deleteUser(testUser.id);
  }
}

/**
 * Create a test user
 */
export async function createTestUser(email, password, fullName = 'Test User') {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName
    }
  });

  if (error) {
    console.error('Error creating test user:', error);
    throw error;
  }

  // Give the database triggers time to complete
  await new Promise(resolve => setTimeout(resolve, 1000));

  return data.user;
}

/**
 * Seed test data in a table
 */
export async function seedTestData(table, data) {
  const { error } = await supabaseAdmin.from(table).insert(data);
  if (error) throw error;
}

/**
 * Clear test data from a table
 */
export async function clearTestData(table, condition = {}) {
  const { error } = await supabaseAdmin.from(table).delete().match(condition);
  if (error) throw error;
}
