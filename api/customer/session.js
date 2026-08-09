const { currentCustomer } = require("./_auth");

module.exports = async function session(req, res) {
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });
  try {
    const customer = await currentCustomer(req);
    if (!customer) return res.status(200).json({ authenticated: false });
    return res.status(200).json({ authenticated: true, customer: { email: customer.email } });
  } catch (error) {
    return res.status(200).json({ authenticated: false });
  }
};