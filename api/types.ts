import { verify } from "../validators/api";
import type { z } from "zod";

export type FetchTerm = z.infer<typeof verify.terms>;
export type FetchDepartment = z.infer<typeof verify.departments>;
export type FetchCourses = z.infer<typeof verify.courses>;

export type APITerm = FetchTerm[number];
export type APIDepartment = FetchDepartment[number];
export type APICourse = Exclude<
  FetchCourses["OfferedCourses"]["course"],
  null | undefined
>[number];
export type APISection = APICourse["CourseData"]["SectionData"][number];
