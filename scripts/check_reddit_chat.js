require('dotenv').config();
const fs = require('fs');
const { createAuthenticatedRedditSession } = require('./reddit_dm_dispatcher');

async function checkChat() {
  console.log('🔍 [Reddit Chat] Initializing authenticated session...');
  const { browser, page } = await createAuthenticatedRedditSession();

  try {
    console.log('[Reddit Chat] Navigating to https://chat.reddit.com/...');
    await page.goto('https://chat.reddit.com/', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 6000));
    await page.screenshot({ path: 'data/reddit_chat_screen.png' });
    console.log('[Reddit Chat] Saved data/reddit_chat_screen.png');

    const chatData = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyTextSnippet: document.body.innerText.slice(0, 1500)
      };
    });

    console.log('[Reddit Chat] Extracted data:', JSON.stringify(chatData, null, 2));
    fs.writeFileSync('data/reddit_chat_details.json', JSON.stringify(chatData, null, 2));

  } catch (err) {
    console.error('Error during chat check:', err.message);
  } finally {
    await browser.close();
  }
}

checkChat();
