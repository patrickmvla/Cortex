import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

type Env = {
  Variables: {
    userId: string;
  };
};

interface JwtPayload {
  sub?: string;
  exp?: number;
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET!;

  try {
    const payload = (await verify(token, secret)) as JwtPayload;
    if (!payload.sub) {
      throw new Error("Invalid payload");
    }
    c.set("userId", payload.sub);
  } catch (error) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  await next();
});
