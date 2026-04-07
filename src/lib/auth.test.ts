import { describe, it, expect, beforeEach } from "vitest";
import { getToken, setToken, clearToken, isAuthenticated } from "./auth";

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no token is set", () => {
    expect(getToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("stores and retrieves a token", () => {
    setToken("ghp_test123");
    expect(getToken()).toBe("ghp_test123");
    expect(isAuthenticated()).toBe(true);
  });

  it("clears the token", () => {
    setToken("ghp_test123");
    clearToken();
    expect(getToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });
});
