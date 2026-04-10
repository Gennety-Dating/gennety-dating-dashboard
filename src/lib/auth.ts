export function getApiKey(): string | null {
  return sessionStorage.getItem("admin_api_key");
}

export function setApiKey(key: string): void {
  sessionStorage.setItem("admin_api_key", key);
}

export function clearApiKey(): void {
  sessionStorage.removeItem("admin_api_key");
}

export function isAuthenticated(): boolean {
  return !!getApiKey();
}
