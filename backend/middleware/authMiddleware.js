import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token)
    return res.status(401).json({ success: false, error: "No token provided" });

  try {
    const secret = process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret); 
    // payload = { id, username, role }

    req.user = payload;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token expired" });
    }
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}
