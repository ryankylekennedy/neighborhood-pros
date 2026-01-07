import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for test helpers
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Helper function to generate a test invite
async function generateTestInvite(neighborhoodId) {
  const { data, error } = await supabase.rpc('generate_invite_code', {
    p_neighborhood_id: neighborhoodId
  })

  if (error) throw error

  // Insert the invite
  const { data: invite, error: insertError } = await supabase
    .from('neighborhood_invites')
    .insert({
      code: data,
      neighborhood_id: neighborhoodId
    })
    .select()
    .single()

  if (insertError) throw insertError

  return invite.code
}

// Helper function to get a test neighborhood
async function getTestNeighborhood() {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .limit(1)
    .single()

  if (error) throw error
  return data
}

// Helper function to cleanup test user
async function cleanupTestUser(email) {
  // This would need admin privileges
  // For now, we'll leave test users (they can be cleaned up manually)
  console.log(`Test user created with email: ${email}`)
}

test.describe('Invite Flow', () => {
  let testInviteCode
  let testNeighborhood

  test.beforeAll(async () => {
    // Get a test neighborhood
    testNeighborhood = await getTestNeighborhood()
    console.log('Test neighborhood:', testNeighborhood.name)
  })

  test.beforeEach(async () => {
    // Generate a fresh invite code for each test
    testInviteCode = await generateTestInvite(testNeighborhood.id)
    console.log('Generated test invite:', testInviteCode)
  })

  test('Complete invite flow - happy path', async ({ page }) => {
    // 1. Navigate to invite page
    await page.goto(`/invite/${testInviteCode}`)

    // 2. Verify welcome page shows correct neighborhood name
    await expect(page.getByRole('heading', { name: new RegExp(testNeighborhood.name) })).toBeVisible()

    // 3. Verify invite code is displayed
    await expect(page.getByText(testInviteCode)).toBeVisible()

    // 4. Click "Get Started"
    await page.getByRole('button', { name: /get started/i }).click()

    // 5. Should be on onboarding page
    await expect(page).toHaveURL(/\/onboarding/)

    // 6. Fill out Step 1: Account
    const uniqueEmail = `test-${Date.now()}@example.com`
    await page.getByPlaceholder(/email/i).fill(uniqueEmail)
    await page.getByPlaceholder(/password/i).fill('testpassword123')
    await page.getByRole('button', { name: /next/i }).click()

    // 7. Fill out Step 2: Personal Info
    await page.getByPlaceholder(/name/i).fill('Test User')
    await page.getByRole('button', { name: /next/i }).click()

    // 8. Fill out Step 3: Address
    await page.getByPlaceholder(/address/i).fill('123 Test Street')
    await page.getByRole('button', { name: /complete signup/i }).click()

    // 9. Wait for signup to complete and redirect
    await page.waitForURL('/', { timeout: 10000 })

    // 10. Verify user is on home page and authenticated
    await expect(page).toHaveURL('/')

    // 11. Verify user profile shows in header (might take a moment)
    await page.waitForSelector('text=Test User', { timeout: 5000 })

    // Cleanup
    await cleanupTestUser(uniqueEmail)
  })

  test('Invalid invite code shows error', async ({ page }) => {
    // Navigate to invite page with invalid code
    await page.goto('/invite/INVALID-CODE-12345')

    // Should show error message
    await expect(page.getByText(/invalid invite/i)).toBeVisible()

    // Should show "Go Home" button
    await expect(page.getByRole('button', { name: /go home/i })).toBeVisible()
  })

  test('Already redeemed invite shows error', async ({ page }) => {
    // First, redeem the invite
    const uniqueEmail = `test-${Date.now()}@example.com`

    await page.goto(`/invite/${testInviteCode}`)
    await page.getByRole('button', { name: /get started/i }).click()

    await page.getByPlaceholder(/email/i).fill(uniqueEmail)
    await page.getByPlaceholder(/password/i).fill('testpassword123')
    await page.getByRole('button', { name: /next/i }).click()

    await page.getByPlaceholder(/name/i).fill('Test User')
    await page.getByRole('button', { name: /next/i }).click()

    await page.getByPlaceholder(/address/i).fill('123 Test Street')
    await page.getByRole('button', { name: /complete signup/i }).click()

    await page.waitForURL('/')

    // Sign out
    await page.getByRole('button', { name: /log.*out/i }).click()

    // Now try to use the same code again
    await page.goto(`/invite/${testInviteCode}`)

    // Should show "already been used" error
    await expect(page.getByText(/already been used/i)).toBeVisible()

    await cleanupTestUser(uniqueEmail)
  })

  test('Form validation works correctly', async ({ page }) => {
    await page.goto(`/invite/${testInviteCode}`)
    await page.getByRole('button', { name: /get started/i }).click()

    // Try to proceed without filling email
    await page.getByRole('button', { name: /next/i }).click()

    // Should show validation error
    await expect(page.getByText(/email is required/i)).toBeVisible()

    // Fill email but with invalid format
    await page.getByPlaceholder(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /next/i }).click()

    // Should show validation error
    await expect(page.getByText(/valid email/i)).toBeVisible()

    // Fill valid email but short password
    await page.getByPlaceholder(/email/i).fill('test@example.com')
    await page.getByPlaceholder(/password/i).fill('12345')
    await page.getByRole('button', { name: /next/i }).click()

    // Should show password length error
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible()
  })

  test('Progress stepper shows correct step', async ({ page }) => {
    await page.goto(`/invite/${testInviteCode}`)
    await page.getByRole('button', { name: /get started/i }).click()

    // Step 1 should be highlighted
    const step1 = page.locator('text=Account').first()
    await expect(step1).toBeVisible()

    // Fill and proceed to step 2
    await page.getByPlaceholder(/email/i).fill(`test-${Date.now()}@example.com`)
    await page.getByPlaceholder(/password/i).fill('testpassword123')
    await page.getByRole('button', { name: /next/i }).click()

    // Step 2 should be visible
    const step2 = page.locator('text=Personal Info').first()
    await expect(step2).toBeVisible()

    // Can go back
    await page.getByRole('button', { name: /back/i }).click()

    // Should be back on step 1
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
  })
})

test.describe('Security Tests', () => {
  test('Cannot access onboarding without invite code', async ({ page }) => {
    // Try to access onboarding directly
    await page.goto('/onboarding')

    // Should redirect to home or show error
    await page.waitForTimeout(2000)

    // Should either be on home page or see error
    const url = page.url()
    expect(url).toMatch(/\/$/)
  })
})
