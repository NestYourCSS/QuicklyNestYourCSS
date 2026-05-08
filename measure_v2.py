
import asyncio
from playwright.async_api import async_playwright
import os

async def measure():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load the local file
        url = 'file://' + os.path.abspath('index.html')
        await page.goto(url)

        # Measure Desktop
        await page.set_viewport_size({"width": 1280, "height": 800})
        await asyncio.sleep(1) # wait for layout

        controls = await page.locator('.header-controls').bounding_box()
        editor = await page.locator('#code-editor').bounding_box()

        print(f"Desktop:")
        print(f"  Controls: {controls}")
        print(f"  Editor: {editor}")
        if controls and editor:
            print(f"  Gap: {editor['y'] - (controls['y'] + controls['height'])}")
            print(f"  Editor Top: {editor['y']}")

        # Measure Mobile
        await page.set_viewport_size({"width": 375, "height": 667})
        await asyncio.sleep(1)

        controls_m = await page.locator('.header-controls').bounding_box()
        editor_m = await page.locator('#code-editor').bounding_box()

        print(f"Mobile:")
        print(f"  Controls: {controls_m}")
        print(f"  Editor: {editor_m}")
        if controls_m and editor_m:
            print(f"  Gap: {editor_m['y'] - (controls_m['y'] + controls_m['height'])}")
            print(f"  Editor Top: {editor_m['y']}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(measure())
