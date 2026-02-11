import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Create a directory for screenshots
        os.makedirs('verification', exist_ok=True)

        page = await browser.new_page(viewport={'width': 1280, 'height': 720})

        # Open the local index.html
        path = os.path.abspath('index.html')
        await page.goto(f'file://{path}')

        # Wait for Ace editors to initialize
        await page.wait_for_timeout(2000)

        # Toggle settings popover
        await page.click('#settings-toggle')
        await page.wait_for_timeout(500)

        # Take screenshot of settings aligned
        await page.screenshot(path='verification/settings_final.png')

        # Check coordinates (by default they are 1:1)
        # Move cursor to trigger update
        await page.click('#inputEditor .ace_content')
        await page.keyboard.press('End')
        await page.wait_for_timeout(500)
        await page.screenshot(path='verification/coords_final.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
