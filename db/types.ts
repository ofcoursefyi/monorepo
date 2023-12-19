import { verify } from "../validators/db";
import type { z } from "zod";

export type Department = z.infer<typeof verify.dept>;
export type Course = z.infer<typeof verify.course>;
export type Instructor = z.infer<typeof verify.instr>;
export type Section = z.infer<typeof verify.section>;
export type SDetail = z.infer<typeof verify.s_detail>;
export type SInstructor = z.infer<typeof verify.s_instr>;
