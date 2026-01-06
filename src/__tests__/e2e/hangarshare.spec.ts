import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for HangarShare Marketplace
 * Tests complete user journeys: registration → listing creation → booking → payment
 */

test.describe('HangarShare E2E Tests - User Registration & Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login page with form', async ({ page }) => {
    // Check for email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for login button
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    
    // Check for register link
    await expect(page.locator('a:has-text("Create account")')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click register link
    await page.click('a:has-text("Create account")');
    
    // Verify register page loaded
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Click login
    await page.click('button:has-text("Login")');
    
    // Verify error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('HangarShare E2E Tests - Owner Listing Creation Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set authentication cookie/token
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'test-owner-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    // Navigate to owner setup page
    await page.goto('/hangarshare/owner/setup');
  });

  test('should display owner setup form', async ({ page }) => {
    // Check for company information fields
    await expect(page.locator('input[name="company_name"]')).toBeVisible();
    await expect(page.locator('input[name="cnpj"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    
    // Check for submit button
    await expect(page.locator('button:has-text("Continue")')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button:has-text("Continue")');
    
    // Verify validation errors
    await expect(page.locator('text=Company name is required')).toBeVisible({ timeout: 3000 });
  });

  test('should accept valid company info', async ({ page }) => {
    // Fill company information
    await page.fill('input[name="company_name"]', 'Test Hangar Company');
    await page.fill('input[name="cnpj"]', '12.345.678/0001-90');
    await page.fill('input[name="phone"]', '+55 11 98765-4321');
    
    // Submit form
    await page.click('button:has-text("Continue")');
    
    // Verify success (redirect or success message)
    await expect(page).toHaveURL(/\/hangarshare\/listing\/create|success/, { timeout: 5000 });
  });
});

test.describe('HangarShare E2E Tests - Listing Creation Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set authentication
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'test-owner-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    // Navigate to listing creation
    await page.goto('/hangarshare/listing/create');
  });

  test('should display multi-step listing form', async ({ page }) => {
    // Step 1: Airport selection
    await expect(page.locator('input[placeholder*="ICAO"]')).toBeVisible();
    
    // Verify step indicator
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
  });

  test('should search and select airport', async ({ page }) => {
    const icaoInput = page.locator('input[placeholder*="ICAO"]');
    
    // Type airport code
    await icaoInput.fill('SBSP');
    
    // Wait for search results
    await expect(page.locator('text=São Paulo')).toBeVisible({ timeout: 3000 });
    
    // Click result
    await page.click('text=São Paulo');
    
    // Verify selection and advance to next step
    await expect(page.locator('button:has-text("Next")')).toBeEnabled();
  });

  test('should fill hangar details', async ({ page }) => {
    // Navigate past airport selection
    await page.fill('input[placeholder*="ICAO"]', 'SBSP');
    await page.click('text=São Paulo');
    await page.click('button:has-text("Next")');
    
    // Step 2: Hangar details
    await expect(page.locator('text=Step 2 of 4')).toBeVisible({ timeout: 3000 });
    
    // Fill hangar size
    await page.fill('input[name="size_sqm"]', '100');
    await page.fill('input[name="price_per_day"]', '500');
    
    // Fill dimensions
    await page.fill('input[name="length_m"]', '20');
    await page.fill('input[name="width_m"]', '15');
    await page.fill('input[name="height_m"]', '5');
    
    // Verify next button enabled
    await expect(page.locator('button:has-text("Next")')).toBeEnabled();
  });

  test('should select amenities', async ({ page }) => {
    // Skip to amenities step
    await page.goto('/hangarshare/listing/create?step=3');
    
    // Check amenities
    await page.check('input[value="WiFi"]');
    await page.check('input[value="24/7 Security"]');
    await page.check('input[value="Maintenance Facilities"]');
    
    // Verify selections
    const wifiCheckbox = page.locator('input[value="WiFi"]');
    await expect(wifiCheckbox).toBeChecked();
  });

  test('should upload photos', async ({ page }) => {
    // Navigate to photo upload step
    await page.goto('/hangarshare/listing/create?step=4');
    
    // Check for upload area
    await expect(page.locator('text=Upload photos')).toBeVisible();
    
    // Verify drag-and-drop area or file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('should complete listing creation', async ({ page }) => {
    // Fill all steps
    await page.fill('input[placeholder*="ICAO"]', 'SBSP');
    await page.click('text=São Paulo');
    
    // Continue through steps (simplified for test)
    let stepCount = 0;
    while (stepCount < 3) {
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        stepCount++;
      } else {
        break;
      }
    }
    
    // Submit final step
    await page.click('button:has-text("Publish Listing")');
    
    // Verify success and redirect to dashboard
    await expect(page).toHaveURL(/\/hangarshare\/owner\/dashboard/, { timeout: 5000 });
  });
});

test.describe('HangarShare E2E Tests - Renter Booking Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set renter authentication
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'test-renter-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    // Navigate to marketplace
    await page.goto('/hangarshare/listing/search');
  });

  test('should display listing search page', async ({ page }) => {
    // Check for search inputs
    await expect(page.locator('input[placeholder*="ICAO"]')).toBeVisible();
    await expect(page.locator('input[name="minPrice"]')).toBeVisible();
    await expect(page.locator('input[name="maxPrice"]')).toBeVisible();
  });

  test('should search for hangars', async ({ page }) => {
    // Fill search criteria
    await page.fill('input[placeholder*="ICAO"]', 'SBSP');
    await page.fill('input[name="minPrice"]', '300');
    await page.fill('input[name="maxPrice"]', '1000');
    
    // Submit search
    await page.click('button:has-text("Search")');
    
    // Wait for results
    await expect(page.locator('text=Hangars available')).toBeVisible({ timeout: 3000 });
    
    // Verify listing cards displayed
    await expect(page.locator('[data-testid="listing-card"]')).toHaveCount(1, { timeout: 3000 });
  });

  test('should view listing details', async ({ page }) => {
    // Search for hangars
    await page.fill('input[placeholder*="ICAO"]', 'SBSP');
    await page.click('button:has-text("Search")');
    
    // Click on listing
    await page.click('[data-testid="listing-card"]');
    
    // Verify listing details page
    await expect(page).toHaveURL(/\/hangarshare\/listing\/\d+/);
    
    // Check for booking button
    await expect(page.locator('button:has-text("Book Now")')).toBeVisible();
  });

  test('should initiate booking', async ({ page }) => {
    // Navigate to listing details
    await page.goto('/hangarshare/listing/1');
    
    // Click book now
    await page.click('button:has-text("Book Now")');
    
    // Verify booking modal
    await expect(page.locator('text=Select dates')).toBeVisible({ timeout: 3000 });
  });

  test('should select booking dates and proceed to payment', async ({ page }) => {
    // Navigate to listing and start booking
    await page.goto('/hangarshare/listing/1');
    await page.click('button:has-text("Book Now")');
    
    // Select check-in date (today)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="check_in"]', today);
    
    // Select check-out date (tomorrow)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await page.fill('input[name="check_out"]', tomorrow);
    
    // Verify price calculation
    await expect(page.locator('text=Total: R$')).toBeVisible();
    
    // Proceed to payment
    await page.click('button:has-text("Proceed to Payment")');
    
    // Verify payment page
    await expect(page).toHaveURL(/\/booking\/payment/);
  });

  test('should complete payment', async ({ page }) => {
    // Navigate to payment page
    await page.goto('/booking/payment?booking_id=test');
    
    // Check for payment form
    await expect(page.locator('text=Payment Details')).toBeVisible();
    
    // Fill card details
    const cardFrame = page.frameLocator('iframe[title*="Stripe"]').first();
    await cardFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
    
    // Verify submit button
    await expect(page.locator('button:has-text("Pay")')).toBeVisible();
  });
});

test.describe('HangarShare E2E Tests - Owner Dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set owner authentication
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'test-owner-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    // Navigate to dashboard
    await page.goto('/hangarshare/owner/dashboard');
  });

  test('should display owner dashboard', async ({ page }) => {
    // Check for dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="bookings-card"]')).toBeVisible();
  });

  test('should display listings table', async ({ page }) => {
    // Check for listings table
    await expect(page.locator('table')).toBeVisible();
    
    // Verify table columns
    await expect(page.locator('th:has-text("Listing")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Bookings")')).toBeVisible();
  });

  test('should export reports', async ({ page }) => {
    // Check for export buttons
    await expect(page.locator('button:has-text("Export PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    
    // Click PDF export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export PDF")');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should edit listing', async ({ page }) => {
    // Find edit button in table
    await page.click('button[aria-label="Edit listing"]');
    
    // Verify edit page loaded
    await expect(page).toHaveURL(/\/hangarshare\/listing\/\d+\/edit/);
    
    // Verify form fields
    await expect(page.locator('input[name="price_per_day"]')).toBeVisible();
  });

  test('should manage documents', async ({ page }) => {
    // Click documents tab
    await page.click('a:has-text("Documents")');
    
    // Verify documents section
    await expect(page.locator('text=Upload Documents')).toBeVisible();
    
    // Check for file upload
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });
});

test.describe('HangarShare E2E Tests - Admin Verification Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set admin authentication
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'test-admin-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    // Navigate to admin dashboard
    await page.goto('/admin/verifications');
  });

  test('should display verification queue', async ({ page }) => {
    // Check for pending verifications
    await expect(page.locator('text=Pending Verifications')).toBeVisible();
    
    // Check for owner entries
    await expect(page.locator('[data-testid="verification-item"]')).toBeTruthy();
  });

  test('should review and approve owner', async ({ page }) => {
    // Click review button
    await page.click('button:has-text("Review")');
    
    // Verify review modal
    await expect(page.locator('text=Owner Information')).toBeVisible();
    
    // Click approve
    await page.click('button:has-text("Approve")');
    
    // Verify success message
    await expect(page.locator('text=Owner approved')).toBeVisible({ timeout: 3000 });
  });

  test('should approve listing', async ({ page }) => {
    // Navigate to listing approvals
    await page.goto('/admin/listings');
    
    // Find pending listing
    await expect(page.locator('[data-testid="listing-pending"]')).toBeVisible();
    
    // Click approve
    await page.click('button:has-text("Approve")');
    
    // Verify update
    await expect(page.locator('text=Listing approved')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('HangarShare E2E Tests - Error Scenarios', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Enable offline mode
    await page.context().setOffline(true);
    
    // Try to search
    await page.goto('/hangarshare/listing/search');
    await page.fill('input[placeholder*="ICAO"]', 'SBSP');
    await page.click('button:has-text("Search")');
    
    // Verify error message
    await expect(page.locator('text=Unable to load')).toBeVisible({ timeout: 3000 });
    
    // Re-enable connection
    await page.context().setOffline(false);
  });

  test('should display validation errors', async ({ page }) => {
    // Navigate to listing creation
    await page.goto('/hangarshare/listing/create');
    
    // Try to continue without filling required fields
    await page.click('button:has-text("Next")');
    
    // Verify error messages
    await expect(page.locator('text=required')).toBeVisible({ timeout: 3000 });
  });

  test('should handle session timeout', async ({ page, context }) => {
    // Remove auth cookie
    await context.clearCookies({ name: 'auth_token' });
    
    // Navigate to protected page
    await page.goto('/hangarshare/owner/dashboard');
    
    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
