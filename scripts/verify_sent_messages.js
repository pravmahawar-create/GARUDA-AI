require('dotenv').config();
const fs = require('fs');
const { createAuthenticatedRedditSession } = require('./reddit_dm_dispatcher');

async function checkSent() {
  console.log('🔍 [Sent Verification] Initializing authenticated session...');
  const { browser, page } = await createAuthenticatedRedditSession();

  try {
    console.log('[Sent Verification] Navigating to https://www.reddit.com/message/messages/...');
    await page.goto('https://www.reddit.com/message/messages/', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: 'data/reddit_inbox_messages.png' });
    console.log('[Sent Verification] Saved data/reddit_inbox_messages.png');

    console.log('[Sent Verification] Navigating to https://www.reddit.com/message/sent/...');
    await page.goto('https://www.reddit.com/message/sent/', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: 'data/reddit_sent_box.png' });
    console.log('[Sent Verification] Saved data/reddit_sent_box.png');

    // Extract any message cards/items
    const details = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyTextSnippet: document.body.innerText.slice(0, 1000)
      };
    });

    console.log('[Sent Verification] Details:', JSON.stringify(details, null, 2));
    fs.writeFileSync('data/reddit_sent_details.json', JSON.stringify(details, null, 2));

  } catch (err) {
    console.error('Error during sent verification:', err.message);
  } finally {
    await browser.close();
  }
}

checkSent();
