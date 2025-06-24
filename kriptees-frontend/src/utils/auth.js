let accessToken = "";

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function removeAccessToken() {
  accessToken = ""; // Or set to null, depending on preference
}
