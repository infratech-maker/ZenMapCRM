"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getScrapingJobs } from "./actions";

type Job = {
  id: string;
  url: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  createdAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
};

function getStatusBadgeVariant(status: Job["status"]) {
  switch (status) {
    case "pending":
      return "secondary";
    case "running":
      return "default";
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: Job["status"]) {
  switch (status) {
    case "pending":
      return "Pending";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("ja-JP");
}

export function ScrapingJobList({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState(initialJobs);

  useEffect(() => {
    // 定期的にジョブ一覧を更新（5秒ごと）
    const interval = setInterval(async () => {
      try {
        const updatedJobs = await getScrapingJobs();
        setJobs(updatedJobs);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (jobs.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        スクレイピングジョブがありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              URL
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Created At
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Error
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">
                {job.id.slice(0, 8)}...
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {job.url}
                </a>
              </td>
              <td className="px-4 py-3">
                <Badge variant={getStatusBadgeVariant(job.status)}>
                  {getStatusLabel(job.status)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {formatDate(job.createdAt)}
              </td>
              <td className="px-4 py-3 text-sm text-red-600">
                {job.error || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

