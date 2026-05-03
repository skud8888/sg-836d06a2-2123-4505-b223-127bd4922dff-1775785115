/**
 * Automated Smoke Tests
 * 
 * Critical user flows that must work for the app to be functional
 * Run with: npm run test:smoke
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('Smoke Tests - Critical Flows', () => {
  
  test('Homepage loads successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check page title
    await expect(page).toHaveTitle(/Training Hub/);
    
    // Check key elements are visible
    await expect(page.locator('text=The Training Hub')).toBeVisible();
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('Navigation menu works', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Test desktop navigation
    await page.click('text=Courses');
    await expect(page).toHaveURL(/\/courses/);
    
    await page.click('text=About');
    await expect(page).toHaveURL(/\/about/);
    
    await page.click('text=Contact');
    await expect(page).toHaveURL(/\/contact/);
  });

  test('Admin login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('Theme toggle works', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Find theme toggle button
    const themeButton = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"]');
    await expect(themeButton).toBeVisible();
    
    // Toggle theme
    await themeButton.click();
    
    // Wait for theme change
    await page.waitForTimeout(500);
  });

  test('Course listing page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/courses`);
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Classes page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/classes`);
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Contact form elements exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    
    // Check form fields
    await expect(page.locator('input[name="name"], input[placeholder*="name" i]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('Help page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/help`);
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('404 page works', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist`);
    
    // Should show 404 page
    await expect(page.locator('text=/404|not found/i')).toBeVisible();
  });

  test('Command palette opens with Cmd+K', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Press Cmd+K (or Ctrl+K on Windows)
    await page.keyboard.press('Meta+K');
    
    // Wait for command palette to appear
    await page.waitForTimeout(500);
    
    // Check if dialog/modal opened
    const dialog = page.locator('[role="dialog"], [role="combobox"]');
    await expect(dialog).toBeVisible();
  });

  test('Mobile menu works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    // Open mobile menu
    const menuButton = page.locator('button[aria-label*="menu" i]').first();
    await menuButton.click();
    
    // Check mobile menu is visible
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Courses')).toBeVisible();
  });

  test('SEO meta tags present', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check essential meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
  });

  test('Favicon loads', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const faviconResponse = await page.goto(`${BASE_URL}/favicon.ico`);
    expect(faviconResponse?.status()).toBe(200);
  });

  test('Manifest file exists', async ({ page }) => {
    const manifestResponse = await page.goto(`${BASE_URL}/manifest.json`);
    expect(manifestResponse?.status()).toBe(200);
  });
});

test.describe('Admin Area - Smoke Tests', () => {
  // Mock login function
  async function login(page: any) {
    await page.goto(`${BASE_URL}/admin/login`);
    
    // Fill in test credentials
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'SimplePass123!');
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect
    await page.waitForURL(/\/admin/, { timeout: 5000 });
  }

  test('Admin dashboard loads after login', async ({ page }) => {
    await login(page);
    
    // Check dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Active Bookings')).toBeVisible();
  });

  test('Admin navigation works', async ({ page }) => {
    await login(page);
    
    // Navigate to different admin pages
    await page.click('text=Bookings');
    await expect(page).toHaveURL(/\/admin\/bookings/);
    
    await page.click('text=Calendar');
    await expect(page).toHaveURL(/\/admin\/calendar/);
  });

  test('Logout works', async ({ page }) => {
    await login(page);
    
    // Find and click logout
    await page.click('button[aria-label*="menu" i], button:has-text("Sign Out")');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});