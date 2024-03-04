import { unstable_noStore as noStore } from "next/cache";

import { CreatePost } from "@/app/_components/create-post";
import { api } from "@/trpc/server";
import { DataTable } from "@/ui/components/data-table";
import { columns } from "./_components/columns";

export default async function Home() {
  noStore();
  const data = await api.usc.courses.query();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center px-4 py-16 ">
        <div className="flex flex-col items-center gap-2">
          <p className="text-2xl"></p>
        </div>
        {data ? (
          <DataTable
            columns={columns}
            data={data.map((c) => ({
              ...c,
              units: c.units_high
                ? `${c.units_low}-${c.units_high}`
                : `${c.units_low}`,
            }))}
            initialState={{
              columnVisibility: {
                term: false,
                dept: false,
                prefix: false,
                number: false,
                sequence: false,
                restr_class: false,
                restr_major: false,
                restr_school: false,
                coreq: false,
                prereq: false,
              },
            }}
          />
        ) : (
          "no courses"
        )}
        <CreatePost />
      </div>
    </main>
  );
}
