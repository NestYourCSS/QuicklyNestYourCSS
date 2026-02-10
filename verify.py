import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1280, "height": 800})

        try:
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(3000)

            # Screenshot of body
            await page.screenshot(path='/home/jules/verification/final_look.png')

            # Click coordinates "Both" (it should be already selected but let's click to be sure)
            await page.click("label:has-text('Both')")
            await page.wait_for_timeout(500)
            await page.screenshot(path='/home/jules/verification/final_coords.png')

            # Get text from output editor to see if nest worked
            output_text = await page.evaluate("window.outputEditor.getValue()")
            print(f"Output text: {output_text[:100]}...")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
