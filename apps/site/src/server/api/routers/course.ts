import { z } from "zod";
import { eq } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { courses } from "@ofc/schema/usc";

export const uscRouter = createTRPCRouter({
  courses: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(courses)
      .where(eq(courses.term, "SP24"))
      .limit(100);
  }),
});
