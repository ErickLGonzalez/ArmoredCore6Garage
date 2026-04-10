import { z } from "zod";

import { THEME_VALUES } from "@/lib/auth/themes";

export const AuthRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80).optional(),
});

export const AuthLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const ThemeUpdateSchema = z.object({
  theme: z.enum(THEME_VALUES),
});
