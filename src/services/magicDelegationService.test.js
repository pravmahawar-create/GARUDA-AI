const test = require("node:test");
const assert = require("node:assert/strict");
const magicDelegation = require("./magicDelegationService");

test("MagicDelegationService — zero-password client delegation", async (t) => {
  await t.test("creates delegation record with valid token and expiration", () => {
    const record = magicDelegation.createDelegation({
      clientName: "Rohan",
      clientEmail: "rohan@test.com",
      clientPhone: "+919876543210",
      videoTitle: "Summer Beats 2026",
      videoUrl: "https://www.youtube.com/watch?v=mock123"
    });

    assert.ok(record.delegationId.startsWith("del_"));
    assert.equal(typeof record.token, "string");
    assert.equal(record.token.length, 32);
    assert.equal(record.clientName, "Rohan");
    assert.equal(record.status, "INVITE_PENDING");
    assert.ok(new Date(record.expiresAt).getTime() > Date.now());
  });

  await t.test("retrieves and updates status of delegation", () => {
    const record = magicDelegation.createDelegation({
      clientName: "Priya",
      clientEmail: "priya@test.com",
      videoTitle: "Fitness Transformation"
    });

    const found = magicDelegation.getDelegationByToken(record.token);
    assert.ok(found);
    assert.equal(found.clientName, "Priya");

    const opened = magicDelegation.updateStatus(record.token, "OPENED");
    assert.equal(opened.status, "OPENED");

    const approved = magicDelegation.updateStatus(record.token, "APPROVED");
    assert.equal(approved.status, "APPROVED");
    assert.ok(approved.authorizedAt);
  });

  await t.test("generates WhatsApp share link and handles invitation dispatch", async () => {
    const record = magicDelegation.createDelegation({
      clientName: "Aman",
      clientPhone: "+91 99999 88888",
      videoTitle: "Acoustic Pop"
    });

    const result = await magicDelegation.dispatchInvitation(record, "https://www.garudaos.in");
    assert.ok(result.success);
    assert.ok(result.magicUrl.includes(`/delegate?token=${record.token}`));
    assert.ok(result.whatsappUrl.includes("api.whatsapp.com"));
    assert.ok(result.whatsappUrl.includes("919999988888"));
  });
});
