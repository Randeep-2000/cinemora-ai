import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
});

export const loginSchema = z.object({
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const projectSchema = z.object({
  title: z.string().trim().min(2).max(120),
  prompt: z.string().trim().min(10).max(6000),
  projectType: z.string().trim().min(1).max(40),
  durationMinutes: z.number().int().min(1).max(180),
  language: z.string().trim().min(2).max(60),
  visualStyle: z.string().trim().min(2).max(80),
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:3", "2.39:1"]),
  platform: z.string().trim().min(2).max(60),
  audience: z.string().trim().min(2).max(100),
});

export const screenplaySchema = z.object({
  title: z.string().min(1).max(200),
  logline: z.string().min(1).max(600),
  characters: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(1500),
    personality: z.string().max(1000),
    appearance: z.string().max(1000),
    clothing: z.string().max(1000),
    voicePreferences: z.string().max(300),
  })).min(1).max(20),
  scenes: z.array(z.object({
    number: z.number().int().min(1),
    title: z.string().min(1).max(160),
    description: z.string().min(1).max(3000),
    location: z.string().max(500),
    durationSec: z.number().int().min(1).max(3600),
    shots: z.array(z.object({
      number: z.number().int().min(1),
      title: z.string().min(1).max(160),
      prompt: z.string().min(1).max(2500),
      camera: z.string().max(1000),
      action: z.string().max(1000),
      dialogue: z.string().max(2000),
      durationSec: z.number().int().min(1).max(600),
    })).min(1).max(20),
  })).min(1).max(40),
});

export type Screenplay = z.infer<typeof screenplaySchema>;
