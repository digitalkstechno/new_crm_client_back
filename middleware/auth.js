const jwt = require("jsonwebtoken");
const STAFF = require("../model/staff");

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let staffVerify = await STAFF.findById(decoded.id).populate("role");
    if (!staffVerify) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = staffVerify;
    req.permissions = staffVerify.role.allowedStatuses;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}
module.exports = authMiddleware;
