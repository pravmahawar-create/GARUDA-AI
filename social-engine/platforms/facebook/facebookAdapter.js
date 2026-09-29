/**
 * GARUDA Social Engine - Facebook Platform Adapter
 */

const FacebookExtractor = require('./facebookExtractor');
const SecurityChallengeDetector = require('../../core/securityChallengeDetector');

class FacebookAdapter {
  constructor(sessionManager, healthMonitor) {
    this.sessionManager = sessionManager;
    this.healthMonitor = healthMonitor;
  }

  async verifyAuthentication(page) {
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    this.healthMonitor.recordNavigation('https://www.facebook.com/');

    const challenge = await SecurityChallengeDetector.evaluatePage(page, 'facebook');
    if (challenge.detected) {
      this.healthMonitor.setSecurityChallenge(true);
      return { authenticated: false, challenge };
    }

    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint/')) {
      this.healthMonitor.setAuthStatus('AUTH_EXPIRED');
      return { authenticated: false, reason: 'LOGIN_REQUIRED' };
    }

    this.healthMonitor.setAuthStatus('VERIFIED');
    return { authenticated: true };
  }

  async searchPosts(page, query) {
    const searchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(query)}&filters=eyJyZWNlbnRfcG9zdHM6MCI6IntcIm5hbWVcIjpcInJlY2VudF9wb3N0c1wiLFwiYXJnc1wiOlwiXCJ9In0%3D`;
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });
    this.healthMonitor.recordNavigation(searchUrl);

    const challenge = await SecurityChallengeDetector.evaluatePage(page, 'facebook');
    if (challenge.detected) {
      return { leads: [], challenge };
    }

    // Gentle scroll to populate dynamic feed
    await page.evaluate(() => window.scrollBy(0, 800));
    await new Promise(r => setTimeout(r, 3000));

    const leads = await FacebookExtractor.extractSearchResults(page);
    return { leads, challenge: null };
  }

  async sendDirectMessage(page, profileUrl, messageText) {
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    this.healthMonitor.recordNavigation(profileUrl);

    const challenge = await SecurityChallengeDetector.evaluatePage(page, 'facebook');
    if (challenge.detected) {
      return { success: false, status: 'SECURITY_BLOCKED', challenge };
    }

    await new Promise(r => setTimeout(r, 4000));

    // 1. Locate "Message" button on profile
    const messageBtnClicked = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll("div[role='button'], a[role='button'], div[aria-label*='Message' i], a[aria-label*='Message' i]"));
      for (const btn of candidates) {
        const text = (btn.textContent || '').trim().toLowerCase();
        const aria = (btn.getAttribute('aria-label') || '').trim().toLowerCase();
        if (text === 'message' || aria === 'message' || aria.includes('message')) {
          btn.scrollIntoView({ behavior: 'instant', block: 'center' });
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (!messageBtnClicked) {
      return {
        success: false,
        status: 'FAILED',
        reason: 'NO_MESSAGE_BUTTON_OR_PROFILE_RESTRICTED'
      };
    }

    await new Promise(r => setTimeout(r, 4000));

    // 2. Look for active messenger textbox
    const chatInput = await page.$("div[role='textbox'][contenteditable='true'], div[aria-label*='Message' i][role='textbox']");
    if (!chatInput) {
      return {
        success: false,
        status: 'FAILED',
        reason: 'MESSENGER_INPUT_BOX_NOT_FOUND'
      };
    }

    await chatInput.click();
    await new Promise(r => setTimeout(r, 1000));

    // 3. Type the exact approved message
    await page.keyboard.type(messageText, { delay: 25 });
    await new Promise(r => setTimeout(r, 1500));

    // 4. Submit via Enter key
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 4000));

    // 5. Verify submission on page
    const verifiedSent = await page.evaluate((sampleText) => {
      const threadText = document.body.innerText || '';
      return threadText.includes(sampleText);
    }, messageText.slice(0, 30));

    if (!verifiedSent) {
      return {
        success: false,
        status: 'DISPATCH_UNKNOWN',
        reason: 'SENT_CONFIRMATION_UNCERTAIN'
      };
    }

    return {
      success: true,
      status: 'SENT',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = FacebookAdapter;
