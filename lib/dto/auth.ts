import { z } from "zod";

import { THEME_VALUES } from "@/lib/auth/themes";

export const AuthRegisterSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().optional(),
  password: z.string().min(4).max(128),
  displayName: z.string().min(1).max(80).optional(),
});

export const AuthLoginSchema = z.object({
  username: z.string().min(3).max(32).optional(),
  email: z.string().email().optional(),
  password: z.string().min(4).max(128),
}).refine((v) => Boolean(v.username || v.email), {
  message: "username or email is required",
  path: ["username"],
});

export const ThemeUpdateSchema = z.object({
  theme: z.enum(THEME_VALUES),
});
