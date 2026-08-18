import { z } from "zod";
import { DIFFICULTIES, REPEAT_RESULTS } from "./types";

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.");

export const platformNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a platform name.")
  .max(60, "Platform names are limited to 60 characters.");

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a tag name.")
  .max(60, "Tag names are limited to 60 characters.");

export const problemInputSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(200, "Titles are limited to 200 characters."),
  url: z
    .string()
    .trim()
    .max(2000)
    .refine(
      (value) => value.length === 0 || /^https?:\/\/\S+$/i.test(value),
      "Enter a URL starting with http or https.",
    ),
  platformId: z.coerce.number().int().positive("Choose a platform."),
  difficulty: z.enum(DIFFICULTIES).nullable(),
  completedDate: isoDate,
  summary: z.string().max(20000),
  notes: z.string().max(20000),
  tagIds: z.array(z.coerce.number().int().positive()),
});

export type ProblemInput = z.infer<typeof problemInputSchema>;

export const repeatInputSchema = z.object({
  problemId: z.coerce.number().int().positive(),
  date: isoDate,
  notes: z.string().max(20000),
  result: z.enum(REPEAT_RESULTS).nullable(),
  durationMinutes: z
    .number()
    .int()
    .min(0, "Minutes cannot be negative.")
    .max(100000)
    .nullable(),
});

export type RepeatInput = z.infer<typeof repeatInputSchema>;

export const goalInputSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a goal name.").max(200),
    targetCount: z.coerce
      .number()
      .int()
      .min(1, "Target must be at least 1.")
      .max(1000000),
    startDate: isoDate,
    endDate: isoDate,
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "The deadline must fall on or after the start date.",
    path: ["endDate"],
  });

export type GoalInput = z.infer<typeof goalInputSchema>;
