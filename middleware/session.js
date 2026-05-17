const crypto = require("crypto");

const sessions = new Map();

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, part) => {
    const [rawName, ...rawValueParts] = part.trim().split("=");

    if (!rawName) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValueParts.join("="));
    return cookies;
  }, {});
}

function setCookie(res, name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || "/"}`);

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (Number.isInteger(options.maxAge)) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  res.append("Set-Cookie", parts.join("; "));
}

function sessionMiddleware(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  let sessionId = cookies.sid;

  if (!sessionId || !sessions.has(sessionId)) {
    sessionId = crypto.randomUUID();
    sessions.set(sessionId, {});
    setCookie(res, "sid", sessionId, {
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  req.sessionId = sessionId;
  req.session = sessions.get(sessionId);
  next();
}

function destroySession(req, res) {
  sessions.delete(req.sessionId);
  setCookie(res, "sid", "", {
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 0,
  });
}

module.exports = {
  sessionMiddleware,
  destroySession,
};
