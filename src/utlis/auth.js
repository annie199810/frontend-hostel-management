
export function saveToken(token) {
  localStorage.setItem("hm_token", token);
}
export function getToken() {
  return localStorage.getItem("hm_token");
}
export function clearToken() {
  localStorage.removeItem("hm_token");
}
