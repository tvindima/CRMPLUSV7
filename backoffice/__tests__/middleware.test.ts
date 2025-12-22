import { SignJWT } from "jose";
import { __test } from "../middleware";

const SECRET = "test-secret";

describe("middleware verifyStaffToken", () => {
  it("aceita token válido com role staff", async () => {
    const token = await new SignJWT({ email: "user@test.com", role: "staff" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));

    process.env.CRMPLUS_AUTH_SECRET = SECRET;
    const payload = await __test.verifyStaffToken(token);
    expect(payload.email).toBe("user@test.com");
  });

  it("rejeita token sem role permitido", async () => {
    const token = await new SignJWT({ email: "user@test.com", role: "guest" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));

    process.env.CRMPLUS_AUTH_SECRET = SECRET;
    await expect(__test.verifyStaffToken(token)).rejects.toThrow();
  });
});
