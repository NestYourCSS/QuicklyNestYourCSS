import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        # Load the index.html file
        await page.goto(f'file://{os.getcwd()}/index.html')

        # Wait for fonts to load
        await page.wait_for_timeout(2000)

        # Click the settings toggle
        await page.click('#settings-toggle')

        # Wait for popover to be visible
        await page.wait_for_selector('#settings-popover:not(.hidden)')

        # Take a screenshot of the whole page to see the layout
        await page.screenshot(path='verification/popover_high_fidelity.png')

        # Take a screenshot of just the popover
        popover = await page.query_selector('#settings-popover')
        await popover.screenshot(path='verification/popover_only.png')

        await browser.close()

if __name__ == '__main__':
    if not os.path.exists('verification'):
        os.makedirs('verification')
    asyncio.run(main())
