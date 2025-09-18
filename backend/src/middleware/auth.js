const { createRemoteJWKSet, jwtVerify } = require("jose");

const region = "us-east-1";
const userPoolId = "us-east-1_0T8LoEjmQ"; // your pool ID
const clientId = "13nv4ai8cbg027cksfn4651qn9"; // your app client ID

const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { payload } = await jwtVerify(token, jwks, { issuer });

    // Make sure this is an ACCESS token for *your* app client
    if (payload.token_use !== "access") {
      return res.status(401).json({ error: "Invalid token type" });
    }
    if (payload.client_id !== clientId) {
      return res.status(401).json({ error: "Invalid client_id" });
    }

    // (optional) you can also check scopes here if you want
    // e.g., ensure payload.scope includes 'email' etc.

    req.user = payload;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
