import React from "react";
import { formatDate } from "@/lib";
import Link from "next/link";
export default function ProjectCard({ project, sort }) {
  const { title, description, lastActivityAt, createdAt, id } = project;

  return (
    <Link href={`/project/${id}`}>
      <div className="flex flex-col gap-4 max-w-md border p-4 rounded-xl border-neutral-500/20 hover:border-neutral-500/50 cursor-pointer bg-neutral-950/10 hover:bg-neutral-950 shadow-lg shadow-neutral-950/10 hover:shadow-neutral-950/50">
        <div>
          <span className="font-medium">{title}</span>
          <p className="max-h-24 overflow-hidden mt-2 text-neutral-400">
            {description}
          </p>
        </div>
        <div className="flex justify-between items-center text-sm text-neutral-500">
          {sort === "date" ? (
            <span>Created: {formatDate(createdAt)}</span>
          ) : (
            <span>Updated: {formatDate(lastActivityAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
