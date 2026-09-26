const SENSITIVE_PATTERNS = [
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]+['"]/gi, label: 'API_KEY' },
  { pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/gi, label: 'SECRET' },
  { pattern: /(?:token|bearer)\s*[:=]\s*['"][^'"]+['"]/gi, label: 'TOKEN' },
  { pattern: /(?:Bearer|Authorization:\s*Bearer)\s+[A-Za-z0-9_\-\.]{20,}/gi, label: 'TOKEN' },
  { pattern: /mongodb(?:\+srv)?:\/\/[^\s'"]+/gi, label: 'MONGO_URI' },
  { pattern: /(?:sk|pk|rk)[-_][A-Za-z0-9]{20,}/g, label: 'STRIPE_KEY' },
  { pattern: /ghp_[A-Za-z0-9]{36}/g, label: 'GITHUB_PAT' },
  { pattern: /(?:xox[bpsa]-[A-Za-z0-9-]+|slack_api_token\s*[:=]\s*['"][^'"]+['"])/gi, label: 'SLACK_TOKEN' },
  { pattern: /(?:AKIA|ASIA)[A-Z0-9]{16}/g, label: 'AWS_KEY' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, label: 'CREDIT_CARD' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: 'EMAIL' },
  { pattern: /(?:phone|mobile|tel)\s*[:=]\s*['"]?\+?[\d\s-]{8,15}/gi, label: 'PHONE' },
  { pattern: /(?:password|passwd|pwd)\s*[:=]\s*\S+/gi, label: 'PASSWORD_ASSIGNMENT' },
  { pattern: /BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY/gi, label: 'PRIVATE_KEY' },
  { pattern: /(?:jdbc|mysql|postgres):\/\/[^\s'"]+/gi, label: 'DB_CONNECTION_STRING' }
];

const SAFE_GENERALIZABLE_PATTERNS = [
  'When X configuration exists, check Y before build',
  'MongoDB connection timeout can occur when',
  'Build failed because',
  'Before Android release build, verify',
  'Always use',
  'Never deploy without',
  'The correct approach is',
  'Pattern: ',
  'Rule: ',
  'Lesson: '
];

class IntelligenceFirewall {
  constructor() {
    this.blockedItems = [];
    this.sanitizedItems = [];
  }

  scanForSecrets(text) {
    if (!text || typeof text !== 'string') return [];
    const findings = [];
    for (const { pattern, label } of SENSITIVE_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        findings.push({
          label,
          match: match[0].substring(0, 20) + '...',
          index: match.index,
          length: match[0].length
        });
      }
    }
    return findings;
  }

  sanitizeContent(text) {
    if (!text || typeof text !== 'string') return { sanitized: text, wasModified: false, findings: [] };
    const findings = this.scanForSecrets(text);
    if (findings.length === 0) return { sanitized: text, wasModified: false, findings };
    let sanitized = text;
    const sortedFindings = [...findings].sort((a, b) => b.index - a.index);
    for (const finding of sortedFindings) {
      sanitized = sanitized.substring(0, finding.index) +
        `[REDACTED_${finding.label}]` +
        sanitized.substring(finding.index + finding.length);
    }
    return { sanitized, wasModified: true, findings };
  }

  filterIntelligence(item) {
    const contentToScan = [
      item.content,
      item.lesson,
      item.pattern,
      JSON.stringify(item.metadata || {})
    ].filter(Boolean).join(' ');

    const { sanitized, wasModified, findings } = this.sanitizeContent(contentToScan);

    if (wasModified) {
      const filtered = {
        ...item,
        content: sanitized,
        metadata: {
          ...item.metadata,
          firewallApplied: true,
          firewallTimestamp: new Date().toISOString(),
          redactedCount: findings.length,
          redactedTypes: findings.map(f => f.label)
        }
      };
      this.sanitizedItems.push({ id: item.id, findings });
      return { allowed: true, item: filtered, sanitized: true, findings };
    }

    return { allowed: true, item, sanitized: false, findings: [] };
  }

  isProjectSpecific(item) {
    const projectIndicators = [
      /client\s+\w+\s+(?:password|key|secret)/i,
      /production\s+(?:database|db)\s+(?:password|credentials)/i,
      /(?:staging|prod)\.(?:api|app)\.\w+\.\w+/i
    ];
    const text = [item.content, JSON.stringify(item.metadata)].filter(Boolean).join(' ');
    return projectIndicators.some(p => p.test(text));
  }

  evaluatePropagation(item) {
    if (this.isProjectSpecific(item)) {
      return {
        propagate: false,
        reason: 'PROJECT_SPECIFIC',
        scope: item.scope
      };
    }
    const secretScan = this.scanForSecrets(item.content);
    if (secretScan.length > 0) {
      return {
        propagate: false,
        reason: 'SENSITIVE_CONTENT',
        findings: secretScan
      };
    }
    return { propagate: true, reason: 'CLEAN', scope: item.scope };
  }

  getStats() {
    return {
      blockedItems: this.blockedItems.length,
      sanitizedItems: this.sanitizedItems.length,
      totalScanned: this.blockedItems.length + this.sanitizedItems.length
    };
  }
}

module.exports = { IntelligenceFirewall, SENSITIVE_PATTERNS, SAFE_GENERALIZABLE_PATTERNS };
