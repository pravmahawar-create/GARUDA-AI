const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🦅 Launching browser to render ChatGPT shared conversation...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1000']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    const url = 'https://chatgpt.com/share/6aae71a1-3ffc-83ee-aefb-6e17884a59f8';
    console.log(`▶ Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    // Scroll down to load all messages if long
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 3000));

    await page.screenshot({ path: 'output/chatgpt_rendered_page.png', fullPage: true });
    console.log('✔ Full page screenshot saved to output/chatgpt_rendered_page.png');

    // Extract conversation turns
    const conversation = await page.evaluate(() => {
      const turns = [];
      // ChatGPT messages usually have data-message-author-role or .text-message or article
      const articles = document.querySelectorAll('article, [data-testid^="conversation-turn-"], div[data-message-author-role]');
      
      if (articles.length > 0) {
        articles.forEach((art, i) => {
          const role = art.getAttribute('data-message-author-role') || (art.querySelector('[data-message-author-role]')?.getAttribute('data-message-author-role')) || (i % 2 === 0 ? 'user' : 'assistant');
          const text = art.innerText.trim();
          turns.push({ turnIndex: i, role, text });
        });
      } else {
        // Fallback: entire main content
        const main = document.querySelector('main') || document.body;
        turns.push({ turnIndex: 0, role: 'all', text: main.innerText.trim() });
      }
      return turns;
    });

    console.log(`✔ Extracted ${conversation.length} conversation blocks.`);
    fs.writeFileSync('output/chatgpt_conversation_extracted.json', JSON.stringify(conversation, null, 2), 'utf8');

    // Also format as readable markdown
    let md = '# ChatGPT Shared Conversation: Google जानकारी की समीक्षा\n\n';
    conversation.forEach(t => {
      md += `### Role: ${t.role.toUpperCase()} (Block ${t.turnIndex})\n\n${t.text}\n\n---\n\n`;
    });
    fs.writeFileSync('output/chatgpt_conversation_readable.md', md, 'utf8');
    console.log('✔ Saved readable markdown to output/chatgpt_conversation_readable.md');

  } catch (err) {
    console.error('❌ Error rendering ChatGPT:', err.message);
  } finally {
    await browser.close();
  }
})();
