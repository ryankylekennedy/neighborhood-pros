import { test, expect } from '@playwright/test'

test.describe('AI Chat Widget', () => {
  const TEST_EMAIL = 'chattest@example.com'
  const TEST_PASSWORD = 'ChatTest123!'
  const TEST_NAME = 'Chat Test User'

  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/')
  })

  test('chat widget does not appear for logged-out users', async ({ page }) => {
    // Verify chat widget button is not visible when logged out
    await expect(page.locator('[data-testid="chat-widget-button"]')).not.toBeVisible()
  })

  test('chat widget appears for logged-in users', async ({ page }) => {
    // Sign up a new user
    await page.click('[data-testid="get-started-button"]')

    const timestamp = Date.now()
    const email = `chattest-${timestamp}@example.com`

    await page.fill('[data-testid="fullname-input"]', TEST_NAME)
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD)
    await page.click('[data-testid="auth-submit-button"]')

    // Wait for auth to complete
    await page.waitForTimeout(2000)

    // Verify chat widget button appears
    await expect(page.locator('[data-testid="chat-widget-button"]')).toBeVisible()
  })

  test('user can open and close chat widget', async ({ page }) => {
    // Sign up and login
    await page.click('[data-testid="get-started-button"]')

    const timestamp = Date.now()
    const email = `chattest-${timestamp}@example.com`

    await page.fill('[data-testid="fullname-input"]', TEST_NAME)
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD)
    await page.click('[data-testid="auth-submit-button"]')

    await page.waitForTimeout(2000)

    // Click to open chat
    await page.click('[data-testid="chat-widget-button"]')
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()

    // Verify chat interface is visible
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible()

    // Close chat
    await page.click('[data-testid="chat-close-button"]')
    await expect(page.locator('[data-testid="chat-panel"]')).not.toBeVisible()
  })

  test('chat shows appropriate welcome message for homeowner', async ({ page }) => {
    // Sign up as homeowner (no business)
    await page.click('[data-testid="get-started-button"]')

    const timestamp = Date.now()
    const email = `homeowner-${timestamp}@example.com`

    await page.fill('[data-testid="fullname-input"]', 'Homeowner User')
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD)
    await page.click('[data-testid="auth-submit-button"]')

    await page.waitForTimeout(2000)

    // Open chat
    await page.click('[data-testid="chat-widget-button"]')
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()

    // Should show service assistant welcome message
    await expect(page.locator('text=/How can I help you today?/i')).toBeVisible()
  })

  test('user can type and send message', async ({ page }) => {
    // Sign up and login
    await page.click('[data-testid="get-started-button"]')

    const timestamp = Date.now()
    const email = `chattest-${timestamp}@example.com`

    await page.fill('[data-testid="fullname-input"]', TEST_NAME)
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD)
    await page.click('[data-testid="auth-submit-button"]')

    await page.waitForTimeout(2000)

    // Open chat
    await page.click('[data-testid="chat-widget-button"]')
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()

    // Type a message
    const testMessage = 'Hello, this is a test message'
    await page.fill('[data-testid="chat-input"]', testMessage)

    // Verify send button is enabled
    const sendButton = page.locator('[data-testid="chat-send-button"]')
    await expect(sendButton).toBeEnabled()

    // Send the message
    await sendButton.click()

    // Verify message appears in chat
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible()

    // Verify input is cleared
    await expect(page.locator('[data-testid="chat-input"]')).toHaveValue('')
  })

  test('send button is disabled when input is empty', async ({ page }) => {
    // Sign up and login
    await page.click('[data-testid="get-started-button"]')

    const timestamp = Date.now()
    const email = `chattest-${timestamp}@example.com`

    await page.fill('[data-testid="fullname-input"]', TEST_NAME)
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD)
    await page.click('[data-testid="auth-submit-button"]')

    await page.waitForTimeout(2000)

    // Open chat
    await page.click('[data-testid="chat-widget-button"]')

    // Send button should be disabled when input is empty
    const sendButton = page.locator('[data-testid="chat-send-button"]')
    await expect(sendButton).toBeDisabled()

    // Type something
    await page.fill('[data-testid="chat-input"]', 'Test')
    await expect(sendButton).toBeEnabled()

    // Clear input
    await page.fill('[data-testid="chat-input"]', '')
    await expect(sendButton).toBeDisabled()
  })

  test('chat persists across navigation', async ({ page }) => {
    // Sign up and login
    await page.click('[data-testid="get-started-button"]')

    const timestamp = Date.now()
    const email = `chattest-${timestamp}@example.com`

    await page.fill('[data-testid="fullname-input"]', TEST_NAME)
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD)
    await page.click('[data-testid="auth-submit-button"]')

    await page.waitForTimeout(2000)

    // Open chat and send message
    await page.click('[data-testid="chat-widget-button"]')
    const testMessage = 'Navigation test message'
    await page.fill('[data-testid="chat-input"]', testMessage)
    await page.click('[data-testid="chat-send-button"]')

    // Close chat
    await page.click('[data-testid="chat-close-button"]')

    // Navigate to another page
    await page.click('[data-testid="favorites-link"]')
    await page.waitForTimeout(500)

    // Open chat again
    await page.click('[data-testid="chat-widget-button"]')

    // Message should still be there
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible()
  })

  test('user can use Enter key to send message', async ({ page }) => {
    // Sign up and login
    await page.click('[data-testid="get-started-button"]')

    const timestamp = Date.now()
    const email = `chattest-${timestamp}@example.com`

    await page.fill('[data-testid="fullname-input"]', TEST_NAME)
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD)
    await page.click('[data-testid="auth-submit-button"]')

    await page.waitForTimeout(2000)

    // Open chat
    await page.click('[data-testid="chat-widget-button"]')

    // Type message and press Enter
    const input = page.locator('[data-testid="chat-input"]')
    await input.fill('Enter key test')
    await input.press('Enter')

    // Verify message was sent
    await expect(page.locator('text="Enter key test"')).toBeVisible()
    await expect(input).toHaveValue('')
  })

  test('mobile: chat is responsive on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Sign up and login
    await page.click('[data-testid="get-started-button"]')

    const timestamp = Date.now()
    const email = `mobile-${timestamp}@example.com`

    await page.fill('[data-testid="fullname-input"]', TEST_NAME)
    await page.fill('[data-testid="email-input"]', email)
    await page.fill('[data-testid="password-input"]', TEST_PASSWORD)
    await page.click('[data-testid="auth-submit-button"]')

    await page.waitForTimeout(2000)

    // Chat widget should be visible
    await expect(page.locator('[data-testid="chat-widget-button"]')).toBeVisible()

    // Open chat
    await page.click('[data-testid="chat-widget-button"]')

    // Chat panel should take most of the screen
    const chatPanel = page.locator('[data-testid="chat-panel"]')
    await expect(chatPanel).toBeVisible()

    // Verify input is usable on mobile
    await page.fill('[data-testid="chat-input"]', 'Mobile test')
    await expect(page.locator('[data-testid="chat-send-button"]')).toBeEnabled()
  })
})
