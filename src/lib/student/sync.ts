import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { EMPTY_STUDENT, type StudentPayload } from "@/lib/student/types";

export const loadStudentState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string; updated_at: string }>`
      select payload, updated_at from student_state where user_id = ${context.userId} limit 1
    `;
    const row = rows[0];
    if (!row) return { ok: true as const, payload: EMPTY_STUDENT };
    try {
      const parsed = JSON.parse(row.payload) as StudentPayload;
      return { ok: true as const, payload: { ...EMPTY_STUDENT, ...parsed, v: 1 as const } };
    } catch {
      return { ok: true as const, payload: EMPTY_STUDENT };
    }
  });

export const saveStudentState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { payload: StudentPayload }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const payload = JSON.stringify(data.payload);
    await sql`
      insert into student_state (user_id, payload, updated_at)
      values (${context.userId}, ${payload}, now())
      on conflict (user_id) do update set payload = excluded.payload, updated_at = now()
    `;
    return { ok: true as const };
  });
