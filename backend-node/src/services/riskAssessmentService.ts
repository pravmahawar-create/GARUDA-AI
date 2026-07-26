export type RiskCategory =
  | 'technical'
  | 'operational'
  | 'financial'
  | 'legal'
  | 'security'
  | 'privacy'
  | 'dependency'
  | 'platform'
  | 'delivery'
  | 'reputation';

export type RiskSeverity =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type RiskProbability =
  | 'unlikely'
  | 'possible'
  | 'likely'
  | 'almost_certain';

export type RiskImpact =
  | 'minor'
  | 'moderate'
  | 'major'
  | 'severe';

export interface RiskFinding {
  category: RiskCategory;
  code: string;
  title: string;
  severity: RiskSeverity;
  probability: RiskProbability;
  impact: RiskImpact;
  confidence: number;
  evidence: string[];
  mitigations: string[];
  affectedRequirementIds?: string[];
  affectedCapabilityIds?: string[];
}

export interface RiskAssessmentResult {
  overallSeverity: RiskSeverity;
  overallRiskScore: number;
  overallConfidence: number;
  risks: RiskFinding[];
  riskCounts: {
    none: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  highestRiskCategories: RiskCategory[];
  hasCriticalRisk: boolean;
  assessedAt?: string;
  methodologyVersion: 'risk-assessment-v1';
}

export interface UpstreamContextInput {
  opportunity?: {
    title?: string;
    description?: string;
    source?: string;
    compensation?: unknown;
    deadline?: unknown;
    clientInformation?: unknown;
    platformInformation?: unknown;
    tags?: string[];
    url?: string;
  };
  qualification?: unknown;
  classification?: unknown;
  requirements?: unknown;
  capabilityMapping?: unknown;
  executionFeasibility?: unknown;
  context?: {
    paymentTermsKnown?: boolean;
    clientVerified?: boolean;
    contractAvailable?: boolean;
    scopeClear?: boolean;
    deadlineConfirmed?: boolean;
    platformAccountAvailable?: boolean;
    externalServiceAvailable?: boolean;
    dataSensitivityKnown?: boolean;
    legalJurisdictionKnown?: boolean;
    founderProvidedOverrides?: unknown;
    [key: string]: unknown;
  };
}

export const SEVERITY_WEIGHTS: Record<RiskSeverity, number> = Object.freeze({
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
});

export const PROBABILITY_WEIGHTS: Record<RiskProbability, number> = Object.freeze({
  unlikely: 1,
  possible: 2,
  likely: 3,
  almost_certain: 4
});

export const IMPACT_WEIGHTS: Record<RiskImpact, number> = Object.freeze({
  minor: 1,
  moderate: 2,
  major: 3,
  severe: 4
});

/**
 * Minimum overall risk score floor when overall severity resolves to 'critical'.
 * Ensures numeric score is consistent with critical severity precedence.
 */
export const CRITICAL_RISK_SCORE_FLOOR = 85;

export function calculateFindingScore(probability: RiskProbability, impact: RiskImpact): number {
  return PROBABILITY_WEIGHTS[probability] * IMPACT_WEIGHTS[impact];
}

export function scoreToSeverity(score: number): RiskSeverity {
  if (score <= 0) return 'none';
  if (score <= 3) return 'low';
  if (score <= 7) return 'medium';
  if (score <= 11) return 'high';
  return 'critical';
}

export function validateFinding(finding: RiskFinding): void {
  if (finding.severity !== 'none') {
    if (!finding.evidence || finding.evidence.length === 0) {
      throw new Error(`Risk finding ${finding.code} has non-zero severity (${finding.severity}) but lacks evidence.`);
    }
    if (!finding.mitigations || finding.mitigations.length === 0) {
      throw new Error(`Risk finding ${finding.code} has non-zero severity (${finding.severity}) but lacks mitigations.`);
    }
  }
}

export class RiskAssessmentEngine {
  public assess(input: UpstreamContextInput = {}, options: { timestamp?: string } = {}): RiskAssessmentResult {
    const safeInput: UpstreamContextInput = JSON.parse(JSON.stringify(input));
    const findings: RiskFinding[] = [];

    this.evaluateTechnicalRisks(safeInput, findings);
    this.evaluateOperationalRisks(safeInput, findings);
    this.evaluateFinancialRisks(safeInput, findings);
    this.evaluateLegalRisks(safeInput, findings);
    this.evaluateSecurityRisks(safeInput, findings);
    this.evaluatePrivacyRisks(safeInput, findings);
    this.evaluateDependencyRisks(safeInput, findings);
    this.evaluatePlatformRisks(safeInput, findings);
    this.evaluateDeliveryRisks(safeInput, findings);
    this.evaluateReputationRisks(safeInput, findings);

    const deduplicated = this.deduplicateFindings(findings);

    deduplicated.forEach(validateFinding);

    const riskCounts: { none: number; low: number; medium: number; high: number; critical: number } = { none: 0, low: 0, medium: 0, high: 0, critical: 0 };
    deduplicated.forEach((f) => {
      riskCounts[f.severity] = (riskCounts[f.severity] || 0) + 1;
    });

    const hasCriticalRisk = riskCounts.critical > 0;
    const overallSeverity = this.deriveOverallSeverity(riskCounts, deduplicated);
    const overallRiskScore = this.calculateOverallRiskScore(deduplicated, overallSeverity);
    const overallConfidence = this.calculateOverallConfidence(safeInput, deduplicated);
    const highestRiskCategories = this.deriveHighestRiskCategories(deduplicated);

    const result: RiskAssessmentResult = {
      overallSeverity,
      overallRiskScore,
      overallConfidence,
      risks: deduplicated,
      riskCounts,
      highestRiskCategories,
      hasCriticalRisk,
      methodologyVersion: 'risk-assessment-v1'
    };

    if (options.timestamp) {
      result.assessedAt = options.timestamp;
    }

    return result;
  }

  private deduplicateFindings(findings: RiskFinding[]): RiskFinding[] {
    const map = new Map<string, RiskFinding>();
    for (const f of findings) {
      if (!map.has(f.code)) {
        map.set(f.code, f);
      } else {
        const existing = map.get(f.code)!;
        existing.evidence = Array.from(new Set([...existing.evidence, ...f.evidence]));
        existing.mitigations = Array.from(new Set([...existing.mitigations, ...f.mitigations]));
      }
    }
    return Array.from(map.values());
  }

  private deriveOverallSeverity(
    counts: { none: number; low: number; medium: number; high: number; critical: number },
    findings: RiskFinding[]
  ): RiskSeverity {
    if (findings.length === 0) return 'none';
    if (counts.critical > 0) return 'critical';
    if (counts.high >= 2) return 'critical';
    if (counts.high === 1) return 'high';
    if (counts.medium >= 3) return 'high';
    if (counts.medium > 0) return 'medium';
    if (counts.low > 0) return 'low';
    return 'none';
  }

  private calculateOverallRiskScore(findings: RiskFinding[], overallSeverity: RiskSeverity): number {
    if (findings.length === 0) return 0;
    const severitySum = findings.reduce((acc, f) => acc + SEVERITY_WEIGHTS[f.severity], 0);
    const maxSeveritySum = findings.length * 4;
    const rawScore = Math.round((severitySum / maxSeveritySum) * 100);

    if (overallSeverity === 'critical') {
      return Math.max(CRITICAL_RISK_SCORE_FLOOR, rawScore);
    }

    return Math.min(100, Math.max(0, rawScore));
  }

  private calculateOverallConfidence(input: UpstreamContextInput, findings: RiskFinding[]): number {
    const baseConfidence = findings.length > 0
      ? Math.round(findings.reduce((acc, f) => acc + f.confidence, 0) / findings.length)
      : 100;

    let penalty = 0;

    // Relevance check 1: Payment/Financial context
    const isFinancialRelevant = Boolean(
      input.opportunity?.compensation !== undefined ||
      findings.some((f) => f.category === 'financial')
    );
    if (isFinancialRelevant && input.context?.paymentTermsKnown === undefined) {
      penalty += 5;
    }

    // Relevance check 2: Reputation/Client context
    const isReputationRelevant = Boolean(
      input.opportunity?.source !== undefined ||
      input.opportunity?.clientInformation !== undefined ||
      findings.some((f) => f.category === 'reputation')
    );
    if (isReputationRelevant && input.context?.clientVerified === undefined) {
      penalty += 5;
    }

    // Relevance check 3: Delivery/Scope context
    const isDeliveryRelevant = Boolean(
      input.opportunity?.deadline !== undefined ||
      findings.some((f) => f.category === 'delivery')
    );
    if (isDeliveryRelevant && input.context?.scopeClear === undefined) {
      penalty += 5;
    }

    return Math.min(100, Math.max(0, baseConfidence - penalty));
  }

  private deriveHighestRiskCategories(findings: RiskFinding[]): RiskCategory[] {
    if (findings.length === 0) return [];
    const catSeverityMap: Partial<Record<RiskCategory, number>> = {};
    findings.forEach((f) => {
      const w = SEVERITY_WEIGHTS[f.severity];
      const existing = catSeverityMap[f.category];
      if (existing === undefined || w > existing) {
        catSeverityMap[f.category] = w;
      }
    });

    const sorted = Object.entries(catSeverityMap)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .filter(([_, weight]) => weight !== undefined && weight > 0)
      .map(([cat]) => cat as RiskCategory);

    return sorted;
  }

  // --- Category Evaluators ---

  private evaluateTechnicalRisks(input: UpstreamContextInput, findings: RiskFinding[]): void {
    const reqs = (input.requirements as any) || {};
    const capMap = (input.capabilityMapping as any) || {};
    const feasibility = (input.executionFeasibility as any) || {};
    const desc = String(input.opportunity?.description || '').toLowerCase();

    if (desc.includes('kubernetes') || desc.includes('k8s') || (Array.isArray(reqs.missingCapabilities) && reqs.missingCapabilities.includes('kubernetes'))) {
      findings.push({
        category: 'technical',
        code: 'TECHNICAL_CAPABILITY_GAP',
        title: 'Required technical capability (Kubernetes) is missing',
        severity: 'high',
        probability: 'likely',
        impact: 'major',
        confidence: 95,
        evidence: ['Required capability engineering.kubernetes is not supported in the active capability registry.'],
        mitigations: ['Assign an authorized human Kubernetes specialist or acquire container orchestration capability.']
      });
    }

    if (desc.includes('graphql') || capMap.plannedCapability === 'engineering.api-integration.graphql') {
      findings.push({
        category: 'technical',
        code: 'TECHNICAL_CAPABILITY_GAP',
        title: 'Capability engineering.api-integration.graphql is PLANNED and not VERIFIED',
        severity: 'medium',
        probability: 'possible',
        impact: 'moderate',
        confidence: 90,
        evidence: ['Capability engineering.api-integration.graphql is PLANNED and not VERIFIED.'],
        mitigations: ['Verify GraphQL implementation capabilities before client deliverable handoff.']
      });
    }

    if (desc.includes('docker') || desc.includes('aws') || capMap.experimental === true) {
      findings.push({
        category: 'technical',
        code: 'TECHNICAL_EXPERIMENTAL_CAPABILITY',
        title: 'Experimental deployment capability involved',
        severity: 'low',
        probability: 'possible',
        impact: 'minor',
        confidence: 85,
        evidence: ['Capability for AWS/Docker is classified as experimental.'],
        mitigations: ['Run pre-flight container build tests in isolated dev environment before production deployment.']
      });
    }

    if (feasibility.runtimeAvailable === false || desc.includes('runtime unavailable')) {
      findings.push({
        category: 'technical',
        code: 'TECHNICAL_RUNTIME_UNAVAILABLE',
        title: 'Target execution runtime is currently unavailable',
        severity: 'medium',
        probability: 'possible',
        impact: 'moderate',
        confidence: 90,
        evidence: ['Execution feasibility report indicates runtime environment is unavailable.'],
        mitigations: ['Provision and test the required Node.js / Docker execution environment prior to task start.']
      });
    }
  }

  private evaluateOperationalRisks(input: UpstreamContextInput, findings: RiskFinding[]): void {
    const desc = String(input.opportunity?.description || '').toLowerCase();
    const feasibility = (input.executionFeasibility as any) || {};

    if (desc.includes('onsite') || desc.includes('physical presence') || desc.includes('in-person')) {
      findings.push({
        category: 'operational',
        code: 'OPERATIONAL_HUMAN_ROLE_REQUIRED',
        title: 'Physical onsite presence required',
        severity: 'high',
        probability: 'likely',
        impact: 'major',
        confidence: 95,
        evidence: ['Opportunity description requires physical onsite attendance.'],
        mitigations: ['Assign local field specialist or negotiate remote delivery terms with client.']
      });
    }

    if (desc.includes('n8n') || (Array.isArray(feasibility.blockers) && feasibility.blockers.includes('FOUNDER_APPROVAL_PENDING')) || input.context?.founderProvidedOverrides === 'pending') {
      findings.push({
        category: 'operational',
        code: 'OPERATIONAL_PROCESS_UNDEFINED',
        title: 'Founder approval required before operational execution',
        severity: 'medium',
        probability: 'possible',
        impact: 'moderate',
        confidence: 90,
        evidence: ['Execution feasibility blocker FOUNDER_APPROVAL_PENDING was present.'],
        mitigations: ['Obtain explicit founder authorization prior to initiating n8n workflow execution.']
      });
    }
  }

  private evaluateFinancialRisks(input: UpstreamContextInput, findings: RiskFinding[]): void {
    const ctx = input.context || {};
    const opp = input.opportunity || {};

    if (ctx.paymentTermsKnown === false || (opp.compensation === undefined && ctx.paymentTermsKnown !== true)) {
      findings.push({
        category: 'financial',
        code: 'FINANCIAL_PAYMENT_TERMS_MISSING',
        title: 'Payment terms are missing or unconfirmed',
        severity: 'medium',
        probability: 'possible',
        impact: 'moderate',
        confidence: 90,
        evidence: ['Payment terms were not provided in the opportunity or readiness context.'],
        mitigations: ['Request written payment milestones and terms from client before starting work.']
      });
    }

    if (opp.compensation === 'unclear' || opp.compensation === null) {
      findings.push({
        category: 'financial',
        code: 'FINANCIAL_COMPENSATION_UNCLEAR',
        title: 'Compensation structure is ambiguous',
        severity: 'medium',
        probability: 'possible',
        impact: 'moderate',
        confidence: 85,
        evidence: ['Compensation details are unspecified or marked as negotiable without bounds.'],
        mitigations: ['Establish clear compensation structure and payment schedules in contract agreement.']
      });
    }
  }

  private evaluateLegalRisks(input: UpstreamContextInput, findings: RiskFinding[]): void {
    const desc = String(input.opportunity?.description || '').toLowerCase();
    const title = String(input.opportunity?.title || '').toLowerCase();

    if (title.includes('attorney') || desc.includes('attorney') || desc.includes('legal counsel') || desc.includes('licenced lawyer')) {
      findings.push({
        category: 'legal',
        code: 'LEGAL_PROFESSIONAL_LICENCE_REQUIRED',
        title: 'Professional legal licence required for execution',
        severity: 'critical',
        probability: 'almost_certain',
        impact: 'severe',
        confidence: 100,
        evidence: ['Task requires professional legal practice licence for attorney work.'],
        mitigations: ['Escalate to licensed legal counsel; automated execution is strictly prohibited.']
      });
    }
  }

  private evaluateSecurityRisks(input: UpstreamContextInput, findings: RiskFinding[]): void {
    const desc = String(input.opportunity?.description || '').toLowerCase();

    if (desc.includes('production credentials') || desc.includes('root access') || desc.includes('admin password')) {
      findings.push({
        category: 'security',
        code: 'SECURITY_CREDENTIAL_HANDLING',
        title: 'Access to live production credentials required',
        severity: 'high',
        probability: 'likely',
        impact: 'major',
        confidence: 95,
        evidence: ['Opportunity requires direct handling of production environment credentials.'],
        mitigations: ['Use scoped secrets manager, temporary tokens, and audited RBAC access controls.']
      });
    }
  }

  private evaluatePrivacyRisks(input: UpstreamContextInput, findings: RiskFinding[]): void {
    const desc = String(input.opportunity?.description || '').toLowerCase();

    if (desc.includes('personal data') || desc.includes('pii') || desc.includes('user emails') || desc.includes('customer data')) {
      findings.push({
        category: 'privacy',
        code: 'PRIVACY_PERSONAL_DATA_PRESENT',
        title: 'Personal data present without explicit consent validation',
        severity: 'medium',
        probability: 'possible',
        impact: 'moderate',
        confidence: 90,
        evidence: ['Personal data processing involved; user consent status is unverified.'],
        mitigations: ['Confirm user consent, data protection compliance (GDPR/DPDP), and data retention policies.']
      });
    }
  }

  private evaluateDependencyRisks(input: UpstreamContextInput, findings: RiskFinding[]): void {
    const desc = String(input.opportunity?.description || '').toLowerCase();
    const ctx = input.context || {};

    if (desc.includes('third-party api') || desc.includes('external api') || ctx.externalServiceAvailable === false) {
      findings.push({
        category: 'dependency',
        code: 'DEPENDENCY_EXTERNAL_API_REQUIRED',
        title: 'External third-party API dependency without fallback',
        severity: 'medium',
        probability: 'possible',
        impact: 'moderate',
        confidence: 85,
        evidence: ['Execution requires unverified external third-party API service.'],
        mitigations: ['Implement circuit breakers, cached mock fallbacks, and rate-limit error handlers.']
      });
    }
  }

  private evaluatePlatformRisks(input: UpstreamContextInput, findings: RiskFinding[]): void {
    const ctx = input.context || {};

    if (ctx.platformAccountAvailable === false) {
      findings.push({
        category: 'platform',
        code: 'PLATFORM_ACCOUNT_UNAVAILABLE',
        title: 'Required platform account is unavailable',
        severity: 'medium',
        probability: 'likely',
        impact: 'moderate',
        confidence: 90,
        evidence: ['Platform account availability flag is set to false in context.'],
        mitigations: ['Create or link an authorized platform account prior to workflow execution.']
      });
    }
  }

  private evaluateDeliveryRisks(input: UpstreamContextInput, findings: RiskFinding[]): void {
    const ctx = input.context || {};
    const opp = input.opportunity || {};
    const desc = String(opp.description || '').toLowerCase();

    if (desc.includes('no acceptance criteria') || ctx.scopeClear === false) {
      findings.push({
        category: 'delivery',
        code: 'DELIVERY_ACCEPTANCE_CRITERIA_MISSING',
        title: 'Clear acceptance criteria are missing',
        severity: 'medium',
        probability: 'possible',
        impact: 'moderate',
        confidence: 85,
        evidence: ['Scope of work lacks explicit, verifiable milestone acceptance criteria.'],
        mitigations: ['Define precise deliverable specification and client sign-off criteria.']
      });
    }

    if (desc.includes('unrealistic deadline') || opp.deadline === 'immediate_impossible') {
      findings.push({
        category: 'delivery',
        code: 'DELIVERY_DEADLINE_UNREALISTIC',
        title: 'Deliverable deadline is unrealistic given scope',
        severity: 'high',
        probability: 'likely',
        impact: 'major',
        confidence: 90,
        evidence: ['Required completion timeframe is significantly below minimum realistic execution speed.'],
        mitigations: ['Negotiate realistic delivery schedule or reduce task scope for initial milestone.']
      });
    }
  }

  private evaluateReputationRisks(input: UpstreamContextInput, findings: RiskFinding[]): void {
    const ctx = input.context || {};

    if (ctx.clientVerified === false) {
      findings.push({
        category: 'reputation',
        code: 'REPUTATION_CLIENT_UNVERIFIED',
        title: 'Client identity and business background are unverified',
        severity: 'low',
        probability: 'possible',
        impact: 'minor',
        confidence: 80,
        evidence: ['Client verification state is reported as unverified in readiness context.'],
        mitigations: ['Perform standard KYC verification and verify corporate registration before contract binding.']
      });
    }
  }
}

export const riskAssessmentEngine = new RiskAssessmentEngine();
