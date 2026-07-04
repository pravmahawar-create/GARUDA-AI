const detectIntent = (queryProfile = {}) => {
  const normalized = queryProfile.normalized || "";

  if (/what is|define|meaning|means|kya hai|matlab/.test(normalized)) {
    return { ...queryProfile, intent: "definition" };
  }

  if (/benefit|features|coverage/.test(normalized)) {
    return { ...queryProfile, intent: "benefit" };
  }

  if (/premium|cost|payment|pay/.test(normalized)) {
    return { ...queryProfile, intent: "premium" };
  }

  if (/claim|death|nominee|settlement/.test(normalized)) {
    return { ...queryProfile, intent: "claim" };
  }

  return { ...queryProfile, intent: "general" };
};

module.exports = {
  detectIntent
};
