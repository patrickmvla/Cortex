import { Hono } from 'hono';
import { db } from '../db';
import { users } from 'drizzle-schema';
import { hash, compare } from 'bcryptjs';
import { sign } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// User Registration
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const hashedPassword = await hash(password, 12);
  const userId = crypto.randomUUID();

  try {
    await db.insert(users).values({
      id: userId,
      email,
      hashedPassword,
    });
  } catch (error) {
    return c.json({ error: 'User already exists' }, 409);
  }

  return c.json({ message: 'User registered successfully' }, 201);
});

// User Login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.hashedPassword) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const isPasswordValid = await compare(password, user.hashedPassword);

  if (!isPasswordValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const payload = {
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // Expires in 24 hours
  };
  const secret = process.env.JWT_SECRET!;
  const token = await sign(payload, secret);

  return c.json({ token });
});

export default auth;
