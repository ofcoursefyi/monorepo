"use client";

import { DataTableColumnHeader } from "@/ui/components/data-table-column-header";
import type { Course } from "@ofc/schema/usc";
import type { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "term",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Term" />
    ),
  },
  {
    accessorKey: "dept",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dept" />
    ),
  },
  {
    accessorKey: "course",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Course" />
    ),
  },
  {
    accessorKey: "prefix",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prefix" />
    ),
  },
  {
    accessorKey: "number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Number" />
    ),
  },
  {
    accessorKey: "sequence",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sequence" />
    ),
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
  },
  {
    accessorKey: "desc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Desc" />
    ),
  },
  {
    id: "units",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Units" />
    ),
    cell: ({ row: { original } }) => (
      <div>
        {original.units_high
          ? `${original.units_low}-${original.units_high}`
          : `${original.units_low}`}
      </div>
    ),
    accessorFn: (original) => {
      return original.units_high
        ? `${original.units_low}-${original.units_high}`
        : `${original.units_low}`;
    },
  },
  {
    accessorKey: "restr_class",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="RestrClass" />
    ),
  },
  {
    accessorKey: "restr_major",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="RestrMajor" />
    ),
  },
  {
    accessorKey: "restr_school",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="RestrSchool" />
    ),
  },
  {
    accessorKey: "prereq",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prereq" />
    ),
  },
  {
    accessorKey: "coreq",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Coreq" />
    ),
  },
];
