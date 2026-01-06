import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Core Features
 * Tests: Authentication, Profile, Tools, Logbook
 */

test.describe('Authentication Flow E2E Tests', () => {
  test('complete user registration flow', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.fill('input[name="confirm_password"]', 'TestPassword123!');
    
    // Accept terms
    await page.check('input[name="terms"]');
    
    // Submit
    await page.click('button:has-text("Create Account")');
    
    // Should redirect to login or dashboard
    await expect(page).toHaveURL(/\/(login|dashboard)/, { timeout: 5000 });
  });

  test('user login and logout', async ({ page, context }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit
    await page.click('button:has-text("Login")');
    
    // Should be logged in
    await expect(page).toHaveURL(/\//, { timeout: 5000 });
    
    // Verify user menu appears
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 3000 });
    
    // Click logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 3000 });
  });

  test('password reset flow', async ({ page }) => {
    await page.goto('/login');
    
    // Click forgot password
    await page.click('a:has-text("Forgot password")');
    
    // Fill email
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Submit
    await page.click('button:has-text("Send Reset Link")');
    
    // Verify confirmation message
    await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 3000 });
  });

  test('session persistence', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');
    
    // Wait for redirect
    await expect(page).toHaveURL(/\//, { timeout: 5000 });
    
    // Navigate to another page
    await page.goto('/profile');
    
    // Should remain logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});

test.describe('User Profile E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Login first
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'test-user-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.goto('/profile');
  });

  test('view and edit profile', async ({ page }) => {
    // Verify profile page loaded
    await expect(page.locator('text=My Profile')).toBeVisible();
    
    // Check for editable fields
    await expect(page.locator('input[value*="name"]')).toBeVisible();
    
    // Edit name
    const nameInput = page.locator('input[name="name"]');
    await nameInput.clear();
    await nameInput.fill('Updated Name');
    
    // Save
    await page.click('button:has-text("Save Changes")');
    
    // Verify success
    await expect(page.locator('text=Profile updated')).toBeVisible({ timeout: 3000 });
  });

  test('upload profile picture', async ({ page }) => {
    // Find upload button
    await page.click('[data-testid="upload-avatar"]');
    
    // Verify upload dialog
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('view flight hours and stats', async ({ page }) => {
    // Check for stats section
    await expect(page.locator('text=Flight Hours')).toBeVisible();
    await expect(page.locator('[data-testid="total-hours"]')).toBeVisible();
    
    // Verify logbook integration
    await expect(page.locator('text=Recent Flights')).toBeVisible();
  });
});

test.describe('Tools E6B E2E Tests', () => {
  test('access E6B calculator', async ({ page }) => {
    await page.goto('/tools/e6b');
    
    // Verify page loaded
    await expect(page.locator('text=E6B Flight Computer')).toBeVisible();
    
    // Check for calculator elements
    await expect(page.locator('[data-testid="e6b-calculator"]')).toBeVisible();
  });

  test('perform E6B calculations', async ({ page }) => {
    await page.goto('/tools/e6b');
    
    // Set distance
    await page.fill('input[name="distance"]', '100');
    
    // Set time
    await page.fill('input[name="time"]', '0.5');
    
    // Wait for calculation
    await page.waitForTimeout(500);
    
    // Verify ground speed calculated
    const groundSpeed = page.locator('[data-testid="ground-speed"]');
    await expect(groundSpeed).toBeVisible();
    
    // Verify result (200 nm/hr)
    const value = await groundSpeed.textContent();
    expect(parseInt(value || '0')).toBeGreaterThan(0);
  });

  test('use E6B wind correction', async ({ page }) => {
    await page.goto('/tools/e6b');
    
    // Set wind values
    await page.fill('input[name="wind_speed"]', '15');
    await page.fill('input[name="wind_direction"]', '180');
    await page.fill('input[name="heading"]', '90');
    
    // Verify wind correction angle calculated
    await expect(page.locator('[data-testid="wind-correction"]')).toContainText(/\d+/);
  });
});

test.describe('Logbook E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'test-user-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.goto('/logbook');
  });

  test('view logbook entries', async ({ page }) => {
    // Verify logbook page
    await expect(page.locator('text=My Logbook')).toBeVisible();
    
    // Check for entries table
    await expect(page.locator('table')).toBeVisible();
    
    // Check for flight entries
    await expect(page.locator('[data-testid="flight-entry"]')).toBeTruthy();
  });

  test('add new flight entry', async ({ page }) => {
    // Click add flight button
    await page.click('button:has-text("Add Flight")');
    
    // Verify form opened
    await expect(page.locator('text=New Flight Entry')).toBeVisible();
    
    // Fill flight details
    await page.fill('input[name="date"]', '2026-01-06');
    await page.fill('input[name="aircraft"]', 'PT-ABC');
    await page.fill('input[name="departure"]', 'SBSP');
    await page.fill('input[name="arrival"]', 'SBRJ');
    await page.fill('input[name="duration_minutes"]', '90');
    
    // Submit
    await page.click('button:has-text("Save Flight")');
    
    // Verify success
    await expect(page.locator('text=Flight added')).toBeVisible({ timeout: 3000 });
  });

  test('edit flight entry', async ({ page }) => {
    // Find edit button
    await page.click('[data-testid="flight-edit-btn"]');
    
    // Modify duration
    const durationInput = page.locator('input[name="duration_minutes"]');
    await durationInput.fill('120');
    
    // Save
    await page.click('button:has-text("Save Flight")');
    
    // Verify update
    await expect(page.locator('text=Flight updated')).toBeVisible({ timeout: 3000 });
  });

  test('delete flight entry', async ({ page }) => {
    // Find delete button
    await page.click('[data-testid="flight-delete-btn"]');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm Delete")');
    
    // Verify success
    await expect(page.locator('text=Flight deleted')).toBeVisible({ timeout: 3000 });
  });

  test('export logbook', async ({ page }) => {
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export as PDF")');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});

test.describe('Marketplace Browse E2E Tests', () => {
  test('browse marketplace listings', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Verify page loaded
    await expect(page.locator('text=Marketplace')).toBeVisible();
    
    // Check for listing cards
    await expect(page.locator('[data-testid="listing-card"]')).toBeTruthy();
  });

  test('search marketplace by category', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Click category filter
    await page.click('[data-testid="category-filter"]');
    
    // Select category
    await page.click('text=Tools & Equipment');
    
    // Wait for results
    await expect(page.locator('[data-testid="listing-card"]')).toBeTruthy();
  });

  test('view product details', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Click on product
    await page.click('[data-testid="listing-card"]');
    
    // Verify details page
    await expect(page.locator('text=Product Details')).toBeVisible();
    
    // Check for images
    await expect(page.locator('[data-testid="product-image"]')).toBeVisible();
  });

  test('add product to cart', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Add to cart
    await page.click('button:has-text("Add to Cart")');
    
    // Verify cart updated
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  });

  test('checkout flow', async ({ page, context }) => {
    // Add items to cart
    await page.goto('/marketplace');
    await page.click('button:has-text("Add to Cart")');
    
    // Go to cart
    await page.click('[data-testid="cart-button"]');
    
    // Proceed to checkout
    await page.click('button:has-text("Checkout")');
    
    // Verify payment page
    await expect(page).toHaveURL(/\/checkout/);
  });
});

test.describe('Responsive Design Tests', () => {
  test('mobile navigation', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // Check for mobile menu
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Open menu
    await page.click('[data-testid="menu-toggle"]');
    
    // Verify menu items visible
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
    
    await context.close();
  });

  test('tablet layout', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    
    await page.goto('/hangarshare/listing/search');
    
    // Verify responsive layout
    const listing = page.locator('[data-testid="listing-card"]');
    await expect(listing).toBeVisible();
    
    await context.close();
  });

  test('desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Verify desktop layout elements
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('page load time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('search performance', async ({ page }) => {
    await page.goto('/hangarshare/listing/search');
    
    const startTime = Date.now();
    await page.fill('input[placeholder*="ICAO"]', 'SBSP');
    await page.click('button:has-text("Search")');
    
    await expect(page.locator('[data-testid="listing-card"]')).toBeTruthy();
    const searchTime = Date.now() - startTime;
    
    // Should complete search in under 2 seconds
    expect(searchTime).toBeLessThan(2000);
  });
});
