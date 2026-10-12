import { useState } from "react";
import {
  Button,
  Select,
  Input,
  StarRating,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/common";
import { PageTitle } from "@/components/admin";
import { useAsync } from "@/hooks";
import { reviewService } from "@/services";
import { toast } from "@/store";
import type { ReviewStatus } from "@/types";
export default function AdminReviewsPage() {
  const result = useAsync(() => reviewService.list(), []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState(false);
  const change = async (id: string, status: ReviewStatus) => {
    setBusy(true);
    try {
      await reviewService.setStatus(id, status);
      result.reload();
      toast.success("Review status updated.");
    } catch {
      toast.error("Could not update review.");
    } finally {
      setBusy(false);
    }
  };
  const list = (result.data ?? []).filter(
    (r) =>
      (status === "all" || r.status === status) &&
      `${r.author} ${r.title} ${r.body}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Reviews"
        description="Moderate local submissions and clearly labelled demonstration reviews."
        demo
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Input
          label="Search reviews"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={["all", "pending", "approved", "rejected"].map((value) => ({
            value,
            label: value,
          }))}
        />
      </div>
      {result.loading ? (
        <LoadingState />
      ) : result.error ? (
        <ErrorState onRetry={result.reload} />
      ) : !list.length ? (
        <EmptyState title="No matching reviews" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {list.map((r) => (
            <article key={r.id} className="card p-6">
              <div className="flex flex-wrap justify-between gap-3">
                <StarRating value={r.rating} />
                <span className="text-sm text-muted">
                  {r.status} ?{" "}
                  {r.isDemo ? "Demonstration review" : "Local submission"}
                </span>
              </div>
              <h2 className="mt-4 text-xl">{r.title}</h2>
              <p className="my-3 text-muted">{r.body}</p>
              <p className="text-sm">
                {r.author} {r.location && `? ${r.location}`}
              </p>
              <div className="mt-5 flex gap-3">
                <Button
                  size="sm"
                  disabled={busy || r.status === "approved"}
                  onClick={() => change(r.id, "approved")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || r.status === "rejected"}
                  onClick={() => change(r.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
