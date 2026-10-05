/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - REUSABLE ANNOTATION ENGINE
 * 
 * Injects minimalist, high-contrast, premium UI annotations into the live browser DOM:
 * 1. Subtle pulsing ring around target element
 * 2. Precision indicator arrow
 * 3. Minimal high-contrast label badge
 * 4. Clean fade-in / fade-out animations
 */

class AnnotationEngine {
  constructor() {
    this.injected = false;
  }

  /**
   * Injects CSS and helper functions into the page
   */
  async inject(page, isMobile = false) {
    await page.evaluate((mobile) => {
      if (document.getElementById('garuda-proof-annotations-css')) return;

      const style = document.createElement('style');
      style.id = 'garuda-proof-annotations-css';
      style.textContent = `
        ${mobile ? `
        /* Sovereign Mobile Presentation Framing (70-85% useful occupancy) */
        .app { max-width: 960px !important; margin: 0 auto !important; }
        body { font-size: 24px !important; }
        .screen { padding: 0 32px 140px !important; }
        input, select, button { font-size: 24px !important; min-height: 64px !important; border-radius: 14px !important; }
        .card { padding: 28px !important; border-radius: 22px !important; margin-bottom: 26px !important; }
        .chip { font-size: 22px !important; padding: 14px 24px !important; border-radius: 12px !important; }
        .topbar { height: 85px !important; }
        .top-title { font-size: 30px !important; }
        .billtype-chip { font-size: 20px !important; padding: 12px 20px !important; }
        .total-line { font-size: 24px !important; }
        .total-line.grand { font-size: 34px !important; }
        .btn.big, button.primary.big { font-size: 26px !important; padding: 22px !important; border-radius: 16px !important; }
        .invoice-paper { font-size: 24px !important; padding: 32px !important; border-radius: 20px !important; line-height: 1.6 !important; }
        .invoice-paper pre, .invoice-paper .tp-table { font-size: 22px !important; }
        .tp-table th, .tp-table td { font-size: 22px !important; padding: 14px 10px !important; }
        .pay-total { font-size: 42px !important; }
        .pay-bal { font-size: 26px !important; }
        .pay-row { font-size: 28px !important; }
        .actions button { font-size: 24px !important; min-height: 62px !important; }
        .modal { font-size: 22px !important; }
        ` : `
        /* Sovereign 16:9 Landscape Master Presentation Framing (Intelligent Scaling) */
        .app { max-width: 1200px !important; margin: 0 auto !important; width: 100% !important; }
        body { font-size: 20px !important; background: #060913 !important; }
        .screen { padding: 0 40px 120px !important; max-width: 1100px !important; margin: 0 auto !important; }
        input, select, button { font-size: 20px !important; min-height: 54px !important; border-radius: 12px !important; }
        .card { padding: 26px 32px !important; border-radius: 18px !important; margin-bottom: 22px !important; }
        .chip { font-size: 18px !important; padding: 10px 22px !important; border-radius: 10px !important; }
        .topbar { height: 76px !important; }
        .top-title { font-size: 28px !important; }
        .billtype-chip { font-size: 20px !important; padding: 12px 24px !important; }
        .total-line { font-size: 22px !important; }
        .total-line.grand { font-size: 32px !important; font-weight: 800 !important; color: #10b981 !important; }
        .btn.big, button.primary.big { font-size: 24px !important; padding: 20px !important; border-radius: 14px !important; }
        .invoice-paper { font-size: 22px !important; padding: 36px 48px !important; border-radius: 20px !important; max-width: 960px !important; margin: 0 auto !important; box-shadow: 0 16px 40px rgba(0,0,0,0.6) !important; background: #ffffff !important; color: #0b0f19 !important; }
        .tp-table th, .tp-table td { font-size: 20px !important; padding: 14px 12px !important; }
        .tp-grand { font-size: 32px !important; font-weight: 800 !important; color: #059669 !important; }
        .tp-totals { font-size: 22px !important; }
        .pay-total { font-size: 38px !important; }
        .pay-card { max-width: 960px !important; margin: 16px auto !important; }
        .actions { max-width: 960px !important; margin: 16px auto !important; }
        .actions button { font-size: 20px !important; min-height: 56px !important; }
        `}
        @keyframes garuda-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
            border-color: rgba(16, 185, 129, 0.9);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(16, 185, 129, 0);
            border-color: rgba(16, 185, 129, 0.4);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            border-color: rgba(16, 185, 129, 0.9);
          }
        }

        @keyframes garuda-fade-in {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .garuda-annotation-ring {
          position: fixed;
          pointer-events: none;
          z-index: 999990;
          border: 2px solid #10b981;
          border-radius: 8px;
          animation: garuda-pulse 1.8s infinite cubic-bezier(0.4, 0, 0.2, 1);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        .garuda-annotation-badge {
          position: fixed;
          pointer-events: none;
          z-index: 999995;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #090d16;
          border: 1px solid rgba(16, 185, 129, 0.7);
          box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(16, 185, 129, 0.25);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 20px;
          animation: garuda-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          white-space: nowrap;
        }

        .garuda-annotation-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .garuda-cursor {
          position: fixed;
          pointer-events: none;
          z-index: 999999;
          width: 24px;
          height: 24px;
          transition: transform 0.15s ease-out, opacity 0.2s ease;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
        }
      `;
      document.head.appendChild(style);

      window.__garuda = {
        activeElements: [],

        highlight: function(selector, labelText, position = 'top') {
          this.clear();
          const target = document.querySelector(selector);
          if (!target) return null;

          const rect = target.getBoundingClientRect();
          const padding = 4;

          // 1. Ring
          const ring = document.createElement('div');
          ring.className = 'garuda-annotation-ring';
          ring.style.top = Math.max(0, rect.top - padding) + 'px';
          ring.style.left = Math.max(0, rect.left - padding) + 'px';
          ring.style.width = (rect.width + padding * 2) + 'px';
          ring.style.height = (rect.height + padding * 2) + 'px';
          document.body.appendChild(ring);
          this.activeElements.push(ring);

          // 2. Badge
          if (labelText) {
            const badge = document.createElement('div');
            badge.className = 'garuda-annotation-badge';
            badge.innerHTML = `<span class="garuda-annotation-dot"></span><span>${labelText}</span>`;
            document.body.appendChild(badge);

            const badgeRect = badge.getBoundingClientRect();
            let bTop, bLeft;

            if (position === 'bottom') {
              bTop = rect.bottom + 12;
              bLeft = rect.left + (rect.width / 2) - (badgeRect.width / 2);
            } else { // top default
              bTop = rect.top - badgeRect.height - 12;
              bLeft = rect.left + (rect.width / 2) - (badgeRect.width / 2);
              if (bTop < 10) bTop = rect.bottom + 12;
            }

            // Keep within viewport boundaries
            bLeft = Math.max(10, Math.min(window.innerWidth - badgeRect.width - 10, bLeft));

            badge.style.top = bTop + 'px';
            badge.style.left = bLeft + 'px';
            this.activeElements.push(badge);
          }

          return { rect, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        },

        clear: function() {
          for (const el of this.activeElements) {
            if (el && el.parentNode) {
              el.style.opacity = '0';
              setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
              }, 200);
            }
          }
          this.activeElements = [];
        }
      };
    }, isMobile);
    this.injected = true;
  }

  /**
   * Highlights target element on page with label
   */
  async showAnnotation(page, selector, text, position = 'top') {
    if (!this.injected) await this.inject(page);
    return await page.evaluate(({ sel, txt, pos }) => {
      if (window.__garuda) {
        return window.__garuda.highlight(sel, txt, pos);
      }
      return null;
    }, { sel: selector, txt: text, pos: position });
  }

  /**
   * Clears all active annotations smoothly
   */
  async clear(page) {
    await page.evaluate(() => {
      if (window.__garuda) window.__garuda.clear();
    });
  }
}

module.exports = new AnnotationEngine();
