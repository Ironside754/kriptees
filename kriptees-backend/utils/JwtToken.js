// This method creates and sends tokens in HttpOnly cookies
const sendJWtToken = (user, statusCode, res) => {
  const accessToken = user.getJWTToken();      // valid for 15 mins
  const refreshToken = user.getRefreshToken(); // valid for days

  // Send Refresh Token in HttpOnly Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true in production
    sameSite: "lax",
    path: "/api/v1/refresh", // only sent to /refresh
    maxAge: process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000, // days to ms
  });

  // Send user and accessToken in the response body for Redux
  // Access token is NOT sent as a cookie
  res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

module.exports = sendJWtToken;
