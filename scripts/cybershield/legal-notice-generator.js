/**
 * GARUDA CYBERSHIELD™ — Autonomous Legal Notice & Cyber Crime Generator
 * Formats statutory takedown notices under IT Rules 2021 and FIR drafts.
 */

class LegalNoticeGenerator {
  /**
   * Generates a digital Cease & Desist deterrence notice for the troll
   */
  generateTrollWarning(dossier) {
    const { incidentId, sha256Hash, rawPayload, classification } = dossier;
    const sections = (classification && classification.legalSectionsTriggered.length > 0)
      ? classification.legalSectionsTriggered.join(', ')
      : 'BNS Section 351 / Section 79 & IT Act Section 67';

    return `⚠️ LEGAL NOTICE OF FORENSIC PRESERVATION & CEASE AND DESIST
Case ID: #${incidentId}
Perpetrator Handle: @${rawPayload.perpetratorHandle}
Platform: ${rawPayload.platform.toUpperCase()}

Your content: "${rawPayload.rawText}"
Has been cryptographically hashed and permanently locked in the GARUDA Forensic Evidence Vault under Section 65B of the Indian Evidence Act.
Evidence SHA-256: ${sha256Hash}

VIOLATIONS RECORDED:
${sections}

TAKE NOTICE:
You are hereby instructed to immediately cease and desist from targeting @${rawPayload.targetHandle}. Deleting your comment or disabling your handle will NOT erase this verified cryptographic record. Continued harassment will trigger immediate submission to the National Cyber Crime Reporting Portal (cybercrime.gov.in) and Platform Grievance Redressal.`;
  }

  /**
   * Generates a formal statutory Notice under IT (Intermediary Guidelines) Rules 2021
   */
  generateGrievanceNotice(dossier, platformOfficerEmail = 'grievance-officer-india@platform.com') {
    const { incidentId, sha256Hash, rawPayload, classification, captureTimestamp } = dossier;
    const sections = classification ? classification.legalSectionsTriggered.join('\n- ') : '- Information Technology Act, 2000';

    return `FORMAL STATUTORY NOTICE UNDER RULE 3(2) OF THE INFORMATION TECHNOLOGY (INTERMEDIARY GUIDELINES AND DIGITAL MEDIA ETHICS CODE) RULES, 2021

To:
The Resident Grievance Officer,
${rawPayload.platform.toUpperCase()} India

Subject: Urgent Takedown and Forensic Preservation Demand for Criminal / Harassing Content (Incident #${incidentId})

Dear Grievance Officer,

Under Rule 3(1)(b) and Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, notice is hereby served regarding unlawful content hosted on your platform:

1. INCIDENT DETAILS:
   - Incident Reference ID: ${incidentId}
   - Target User Profile: @${rawPayload.targetHandle}
   - Perpetrator Account: @${rawPayload.perpetratorHandle} (ID: ${rawPayload.perpetratorId})
   - Post / Content URL: ${rawPayload.postUrl}
   - Specific Comment ID: ${rawPayload.commentId}
   - Timestamp (UTC): ${captureTimestamp}

2. UNLAWFUL MATERIAL / TEXT:
   "${rawPayload.rawText}"

3. STATUTORY PROVISIONS VIOLATED:
- ${sections}

4. CRYPTOGRAPHIC INTEGRITY & EVIDENTIARY RECORD:
   The complete digital payload has been cryptographically fingerprinted and hashed under Section 65B of the Indian Evidence Act, 1872 / Section 63 BSA 2023 for evidentiary preservation.
   Cryptographic SHA-256 Digest:
   ${sha256Hash}

5. STATUTORY DEMAND:
   You are required by law to acknowledge this grievance within twenty-four (24) hours and effectuate complete takedown / disablement of the offensive material within the statutory window, preserving all server-side IP logs, device identifiers, and registration details for lawful submission to Law Enforcement Agencies.

Authorized Representative / System Custodian:
GARUDA Automated Cyber Forensics Custodian`;
  }

  /**
   * Generates a pre-filled Cyber Crime Reporting Portal complaint
   */
  generateCyberCrimeDraft(dossier) {
    const { incidentId, sha256Hash, rawPayload, classification, captureTimestamp } = dossier;
    return {
      portal: 'https://cybercrime.gov.in',
      incidentCategory: classification && classification.severityLevel === 5 ? 'Cyber Threats & Intimidation' : 'Online Cyber Bullying & Harassment',
      incidentSubCategory: 'Harassment / Defamation / Obscene Slurs',
      complaintDraft: {
        dateOfIncident: captureTimestamp,
        platformName: rawPayload.platform,
        suspectUsername: rawPayload.perpetratorHandle,
        suspectPlatformId: rawPayload.perpetratorId,
        contentUrl: rawPayload.postUrl,
        commentText: rawPayload.rawText,
        evidenceCertificateHash: sha256Hash,
        briefFacts: `On ${captureTimestamp}, suspect user @${rawPayload.perpetratorHandle} targeted @${rawPayload.targetHandle} on ${rawPayload.platform} with the following criminal content: "${rawPayload.rawText}". The evidence has been locked with SHA-256 checksum (${sha256Hash}) and Section 65B Certificate under Incident ID ${incidentId}. Immediate investigation and registration of FIR under relevant sections of BNS / IT Act is requested.`
      }
    };
  }
}

module.exports = new LegalNoticeGenerator();
