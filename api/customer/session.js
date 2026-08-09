const { currentCustomer, issueSession } = require("./_auth");

module.exports = async function session(req, res) {
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });
  try {
    const result = await currentCustomer(req);
    if (!result || !result.customer) return res.status(200).json({ authenticated: false });
    if (result.refreshedSession) {
      issueSession(res, {
        accessToken: result.refreshedSession.access_token,
        refreshToken: result.refreshedSession.refresh_token
      });
    }
    return res.status(200).json({ authenticated: true, customer: { email: result.customer.email } });
  } catch (error) {
    return res.status(200).json({ authenticated: false });
  }
};