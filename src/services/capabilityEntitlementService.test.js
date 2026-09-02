const assert = require("assert");
const capabilityEntitlementService = require("./capabilityEntitlementService");
const capabilityRegistryService = require("./capabilityRegistryService");

async function runTests() {
  console.log("🦅 Running Capability Entitlement Service Test Suite...\n");

  // 1. Canonical Tiers & Roles
  const tiers = capabilityEntitlementService.getCanonicalTiers();
  assert.deepStrictEqual(tiers, ["personal", "creator", "sme", "enterprise"]);
  console.log("✔ Test 1: Canonical tiers correctly defined (personal, creator, sme, enterprise)");

  const roles = capabilityEntitlementService.getCanonicalRoles();
  assert(roles.includes("platform_founder"));
  assert(roles.includes("tenant_admin"));
  assert(roles.includes("tenant_member"));
  assert(roles.includes("tenant_viewer"));
  assert(roles.includes("anonymous_guest"));
  console.log("✔ Test 2: Canonical roles correctly defined");

  // 2. Founder Wildcard Entitlement
  const founderCaps = capabilityEntitlementService.resolveCapabilities("enterprise", "platform_founder");
  assert.deepStrictEqual(founderCaps, ["*"]);

  const founderContext = {
    actorType: "founder",
    role: "platform_founder",
    plan: "enterprise",
    capabilities: ["*"],
    isFounderApproved: true
  };
  assert.strictEqual(capabilityEntitlementService.hasCapability(founderContext, "anything.custom"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(founderContext, "creative.generate_cinematic"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(founderContext, "enterprise.custom_brain_models"), true);
  console.log("✔ Test 3: Platform Founder receives sovereign wildcard [*] capability");

  // 3. Anonymous Guest Restrictions
  const anonCaps = capabilityEntitlementService.resolveCapabilities("personal", "anonymous_guest");
  assert(anonCaps.includes("public.chat"));
  assert(anonCaps.includes("capability.list"));
  assert(!anonCaps.includes("creative.generate_standard"));
  assert(!anonCaps.includes("creative.generate_cinematic"));

  const anonContext = {
    actorType: "anonymous",
    role: "anonymous_guest",
    plan: "personal",
    capabilities: anonCaps,
    isFounderApproved: false
  };
  assert.strictEqual(capabilityEntitlementService.hasCapability(anonContext, "public.chat"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(anonContext, "creative.generate_standard"), false);
  assert.strictEqual(capabilityEntitlementService.hasCapability(anonContext, "creative.generate_cinematic"), false);
  console.log("✔ Test 4: Anonymous guest is strictly restricted to public capabilities");

  // 4. Personal Tier Entitlement Boundaries
  const personalCaps = capabilityEntitlementService.resolveCapabilities("personal", "tenant_member");
  assert(personalCaps.includes("knowledge.query"));
  assert(personalCaps.includes("creative.generate_dry_run"));
  assert(personalCaps.includes("repository.read_audit"));
  assert(!personalCaps.includes("creative.generate_standard"));
  assert(!personalCaps.includes("creative.generate_cinematic"));
  assert(!personalCaps.includes("enterprise.custom_brain_models"));

  const personalContext = {
    actorType: "tenant_member",
    role: "tenant_member",
    plan: "personal",
    capabilities: personalCaps
  };
  assert.strictEqual(capabilityEntitlementService.hasCapability(personalContext, "creative.generate_dry_run"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(personalContext, "creative.generate_standard"), false);
  assert.strictEqual(capabilityEntitlementService.hasCapability(personalContext, "creative.generate_cinematic"), false);
  console.log("✔ Test 5: Personal tier correctly grants dry-run & audit but blocks creator/sme capabilities");

  // 5. Creator Tier Entitlement Boundaries
  const creatorCaps = capabilityEntitlementService.resolveCapabilities("creator", "tenant_member");
  assert(creatorCaps.includes("creative.generate_dry_run"));
  assert(creatorCaps.includes("creative.generate_standard"));
  assert(creatorCaps.includes("brand.identity_lock_basic"));
  assert(creatorCaps.includes("digital_marketing.content_calendar"));
  assert(!creatorCaps.includes("creative.generate_cinematic"));
  assert(!creatorCaps.includes("real_estate.growth_os"));

  const creatorContext = {
    actorType: "tenant_member",
    role: "tenant_member",
    plan: "creator",
    capabilities: creatorCaps
  };
  assert.strictEqual(capabilityEntitlementService.hasCapability(creatorContext, "creative.generate_standard"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(creatorContext, "brand.identity_lock_basic"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(creatorContext, "creative.generate_cinematic"), false);
  console.log("✔ Test 6: Creator tier correctly grants standard creative & brand tools but blocks SME/enterprise");

  // 6. SME Tier Entitlement Boundaries
  const smeCaps = capabilityEntitlementService.resolveCapabilities("sme", "tenant_member");
  assert(smeCaps.includes("creative.generate_cinematic"));
  assert(smeCaps.includes("real_estate.growth_os"));
  assert(smeCaps.includes("automation.workflow_pipelines"));
  assert(smeCaps.includes("billing.invoice_management"));
  assert(!smeCaps.includes("enterprise.custom_brain_models"));
  assert(!smeCaps.includes("deployment.air_gapped_profile"));

  const smeContext = {
    actorType: "tenant_member",
    role: "tenant_member",
    plan: "sme",
    capabilities: smeCaps
  };
  assert.strictEqual(capabilityEntitlementService.hasCapability(smeContext, "creative.generate_cinematic"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(smeContext, "real_estate.growth_os"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(smeContext, "enterprise.custom_brain_models"), false);
  console.log("✔ Test 7: SME tier correctly grants cinematic creative & real estate OS but blocks enterprise");

  // 7. Enterprise Tier Entitlement
  const enterpriseCaps = capabilityEntitlementService.resolveCapabilities("enterprise", "tenant_member");
  assert(enterpriseCaps.includes("enterprise.custom_brain_models"));
  assert(enterpriseCaps.includes("governance.multi_tenant_isolation"));
  assert(enterpriseCaps.includes("deployment.air_gapped_profile"));

  const enterpriseContext = {
    actorType: "tenant_member",
    role: "tenant_member",
    plan: "enterprise",
    capabilities: enterpriseCaps
  };
  assert.strictEqual(capabilityEntitlementService.hasCapability(enterpriseContext, "enterprise.custom_brain_models"), true);
  console.log("✔ Test 8: Enterprise tier grants full sovereign capability stack");

  // 8. Namespace Wildcard Matching
  const namespaceContext = {
    actorType: "tenant_member",
    role: "tenant_member",
    plan: "custom",
    capabilities: ["creative.*", "automation.workflow_pipelines"]
  };
  assert.strictEqual(capabilityEntitlementService.hasCapability(namespaceContext, "creative.generate_cinematic"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(namespaceContext, "creative.generate_dry_run"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(namespaceContext, "automation.workflow_pipelines"), true);
  assert.strictEqual(capabilityEntitlementService.hasCapability(namespaceContext, "automation.custom_other"), false);
  console.log("✔ Test 9: Namespace wildcard matching (e.g. creative.*) functions correctly");

  // 9. Structured Validation & Error Reasoning
  const deniedValidation = capabilityEntitlementService.validateCapabilityAccess(personalContext, "creative.generate_cinematic");
  assert.strictEqual(deniedValidation.granted, false);
  assert.strictEqual(deniedValidation.code, "CAPABILITY_ENTITLEMENT_REQUIRED");
  assert(deniedValidation.message.includes("[personal]"));
  assert(deniedValidation.message.includes("[creative.generate_cinematic]"));

  const grantedValidation = capabilityEntitlementService.validateCapabilityAccess(smeContext, "creative.generate_cinematic");
  assert.strictEqual(grantedValidation.granted, true);
  console.log("✔ Test 10: validateCapabilityAccess produces structured denial reason");

  // 10. Capability Registry Service Tier Metadata Integration
  const softwareImplTier = capabilityRegistryService.getCapabilityTier("engineering.software-implementation");
  assert.strictEqual(softwareImplTier, "personal");

  const warRoomTier = capabilityRegistryService.getCapabilityTier("entertainment.campaign_war_room");
  assert.strictEqual(warRoomTier, "enterprise");

  const listedPersonal = capabilityRegistryService.listCapabilities({ tier: "personal" });
  assert(listedPersonal.length > 0);
  assert(listedPersonal.every((c) => c.tier === "personal"));
  console.log("✔ Test 11: capabilityRegistryService tier mapping & tier filtering integrated cleanly");

  console.log("\n=======================================================");
  console.log("🎉 All 11 Capability Entitlement tests PASSED cleanly.");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Capability Entitlement Service Test Failure:", err);
  process.exit(1);
});
