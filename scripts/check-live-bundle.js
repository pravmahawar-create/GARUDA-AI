(async () => {
  try {
    const res = await fetch("https://www.garudaos.in/dost?_v=" + Date.now());
    const html = await res.text();
    const scriptMatch = html.match(/src="\/assets\/(index-[^"]+\.js)"/);
    if (scriptMatch) {
      const scriptUrl = "https://www.garudaos.in/assets/" + scriptMatch[1];
      console.log("Live Bundle URL:", scriptUrl);
      const bundleRes = await fetch(scriptUrl);
      const bundleText = await bundleRes.text();
      console.log("Bundle has garuda_dost_leads:", bundleText.includes("garuda_dost_leads"));
      console.log("Bundle has garuda_pawan_chat_messages:", bundleText.includes("garuda_pawan_chat_messages"));
      console.log("Bundle has showFounderPasskeyModal:", bundleText.includes("showFounderPasskeyModal") || bundleText.includes("praveen_garuda_core"));
    } else {
      console.log("No bundle match found in HTML");
    }
  } catch (e) {
    console.error(e.message);
  }
})();
