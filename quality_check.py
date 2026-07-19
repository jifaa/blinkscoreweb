"""Quality check script for BlinkScore web app"""
import asyncio
import sys
import os
sys.path.insert(0, '.')

from browser_use import Agent
from browser_use.browser import BrowserSession
from browser_use.llm.openai.chat import ChatOpenAI

async def quality_check():
    print("Starting Quality Check...")

    # Set up OpenAI LLM
    llm = ChatOpenAI(model="gpt-4o")

    # Configure browser session with CDP URL for remote Chrome
    browser = BrowserSession(
        cdp_url="http://localhost:9222",
        headless=False,
    )

    try:
        agent = Agent(
            task="""Navigate to http://localhost:3000 and perform a comprehensive quality check. Report:
1. Page title and URL
2. Main heading (H1 text)
3. All H2 headings found
4. Count of: buttons, links, images, input fields
5. Any accessibility issues (images without alt text, buttons without text, inputs without labels)
6. Whether the page loaded without JavaScript errors
7. Description of the main content/sections visible
8. Any broken elements or loading issues

Provide a summary of the overall quality assessment.""",
            llm=llm,
            browser=browser,
            max_failures=3,
        )

        result = await agent.run()
        print(f"\n=== QUALITY CHECK RESULTS ===")
        print(result)

        await browser.close()
        return True

    except Exception as e:
        print(f"Error during quality check: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(quality_check())
    sys.exit(0 if result else 1)
