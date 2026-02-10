const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Responsive Layout Verification', () => {
  const url = `file://${path.join(process.cwd(), 'index.html')}`;

  test('Desktop layout should have side-by-side editors', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url);

    // Wait for editors to be initialized
    await page.waitForSelector('.editorGroup');

    const editorGroups = await page.locator('.editorGroup').all();
    expect(editorGroups.length).toBe(2);

    const box1 = await editorGroups[0].boundingBox();
    const box2 = await editorGroups[1].boundingBox();

    // Check if they are side-by-side (same y, different x)
    // Allow for some margin of error in y alignment
    expect(Math.abs(box1.y - box2.y)).toBeLessThan(10);
    expect(box2.x).toBeGreaterThan(box1.x);
  });

  test('Mobile layout should have stacked editors', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(url);

    // Wait for editors to be initialized
    await page.waitForSelector('.editorGroup');

    const editorGroups = await page.locator('.editorGroup').all();
    expect(editorGroups.length).toBe(2);

    const box1 = await editorGroups[0].boundingBox();
    const box2 = await editorGroups[1].boundingBox();

    // Check if they are stacked (same x, different y)
    expect(Math.abs(box1.x - box2.x)).toBeLessThan(10);
    expect(box2.y).toBeGreaterThan(box1.y);

    // Check if they take full width (roughly)
    const bodyBox = await page.locator('body').boundingBox();
    expect(box1.width).toBeGreaterThan(bodyBox.width * 0.8);
  });

  test('Nest button should be positioned in top right', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url);

    const button = page.locator('#code-editor-wrapper > button');
    await expect(button).toBeVisible();

    const box = await button.boundingBox();
    const viewport = page.viewportSize();

    // Should be on the right half
    expect(box.x).toBeGreaterThan(viewport.width / 2);
    // Should be near the top
    expect(box.y).toBeLessThan(100);

    // Check fixed position by simulating scroll if possible (though body is overflow:hidden)
    // We can at least check it has position: fixed
    const position = await button.evaluate(el => window.getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });
});
