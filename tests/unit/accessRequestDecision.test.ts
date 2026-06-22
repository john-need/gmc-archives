import { validateAccessRequestSubmission } from "@/lib/access/accessRequestDecision";

describe("validateAccessRequestSubmission", () => {
  it("is valid with all required fields present and a valid email", () => {
    expect(validateAccessRequestSubmission({ name: "A", email: "a@example.org", reason: "research" })).toEqual({
      valid: true
    });
  });

  it("flags a missing name", () => {
    const result = validateAccessRequestSubmission({ email: "a@example.org", reason: "research" });
    expect(result).toEqual({ valid: false, missingFields: ["name"] });
  });

  it("flags a missing or invalid email", () => {
    expect(validateAccessRequestSubmission({ name: "A", reason: "research" })).toEqual({
      valid: false,
      missingFields: ["email"]
    });
    expect(validateAccessRequestSubmission({ name: "A", email: "not-an-email", reason: "research" })).toEqual({
      valid: false,
      missingFields: ["email"]
    });
  });

  it("flags a missing reason", () => {
    const result = validateAccessRequestSubmission({ name: "A", email: "a@example.org" });
    expect(result).toEqual({ valid: false, missingFields: ["reason"] });
  });

  it("flags all three when everything is missing", () => {
    const result = validateAccessRequestSubmission({});
    expect(result).toEqual({ valid: false, missingFields: ["name", "email", "reason"] });
  });
});
