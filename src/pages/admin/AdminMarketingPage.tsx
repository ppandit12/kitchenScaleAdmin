import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Campaign } from "@/types";
import {
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  LoadingState,
  ErrorState,
  EmptyState,
  DemoNotice,
} from "@/components/common";
import { PageTitle } from "@/components/admin";
import { useAsync } from "@/hooks";
import { campaignService, newsletterService } from "@/services";
import { toast } from "@/store";
const schema = z.object({
  name: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  previewText: z.string(),
  body: z.string().trim().min(1),
  audience: z.enum(["all", "customers", "subscribers"]),
  scheduledAt: z.string(),
});
type Values = z.infer<typeof schema>;
export default function AdminMarketingPage() {
  const campaigns = useAsync(() => campaignService.list(), []);
  const subscribers = useAsync(() => newsletterService.list(), []);
  const [editing, setEditing] = useState<Campaign>();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  const edit = (c?: Campaign) => {
    setEditing(c);
    reset(
      c
        ? { ...c, scheduledAt: c.scheduledAt?.slice(0, 16) ?? "" }
        : {
            name: "",
            subject: "",
            previewText: "",
            body: "",
            audience: "subscribers",
            scheduledAt: "",
          },
    );
    setOpen(true);
  };
  const mutate = async (work: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await work();
      campaigns.reload();
      subscribers.reload();
    } catch {
      toast.error("Could not update demo marketing data.");
    } finally {
      setBusy(false);
    }
  };
  const save = async (v: Values) => {
    try {
      if (v.scheduledAt && new Date(v.scheduledAt).getTime() <= Date.now()) {
        toast.error("Choose a future date for a demo schedule.");
        return;
      }
      const patch = {
        ...v,
        status: v.scheduledAt ? ("scheduled" as const) : ("draft" as const),
        scheduledAt: v.scheduledAt
          ? new Date(v.scheduledAt).toISOString()
          : undefined,
      };
      if (editing) await campaignService.update(editing.id, patch);
      else await campaignService.create(patch);
      setOpen(false);
      campaigns.reload();
    } catch {
      toast.error("Could not save campaign.");
    }
  };
  return (
    <>
      <PageTitle
        title="Marketing"
        description="Newsletter subscribers and email campaigns."
        demo
        actions={<Button onClick={() => edit()}>Create campaign</Button>}
      />
      <DemoNotice>
        No email provider is connected yet, so nothing is sent and schedules don’t run automatically.
        “Send” records the real audience size; opens and clicks stay at 0 until an email provider is connected.
      </DemoNotice>
      <section className="mt-8">
        <h2 className="mb-5 text-2xl">Campaigns</h2>
        {campaigns.loading ? (
          <LoadingState />
        ) : campaigns.error ? (
          <ErrorState onRetry={campaigns.reload} />
        ) : !campaigns.data?.length ? (
          <EmptyState title="No campaigns yet" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {campaigns.data.map((c) => (
              <article key={c.id} className="card p-6">
                <div className="flex justify-between gap-4">
                  <h3 className="text-xl">{c.name}</h3>
                  <span className="text-sm text-muted">{c.status}</span>
                </div>
                <p className="mt-2 font-medium">{c.subject}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                  {c.body}
                </p>
                {c.scheduledAt && (
                  <p className="mt-3 text-sm">
                    Demo schedule: {new Date(c.scheduledAt).toLocaleString()}
                  </p>
                )}
                <p className="my-4 text-sm">
                  Demo metrics: {c.metrics.recipients} recipients ?{" "}
                  {c.metrics.opens} opens ? {c.metrics.clicks} clicks
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => edit(c)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy || c.status === "sent"}
                    onClick={() =>
                      mutate(() => campaignService.simulateSend(c.id))
                    }
                  >
                    Simulate send
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => mutate(() => campaignService.remove(c.id))}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="mt-10">
        <h2 className="mb-5 text-2xl">Subscribers</h2>
        {subscribers.loading ? (
          <LoadingState />
        ) : subscribers.error ? (
          <ErrorState onRetry={subscribers.reload} />
        ) : !subscribers.data?.length ? (
          <EmptyState title="No subscribers" />
        ) : (
          <div className="card relative overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr>
                  {["Email", "Source", "Consent", "Status", "Action"].map(
                    (s) => (
                      <th key={s} className="p-4">
                        {s}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {subscribers.data.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="p-4">{s.email}</td>
                    <td className="p-4">{s.source}</td>
                    <td className="p-4">{s.consent ? "Yes" : "No"}</td>
                    <td className="p-4">{s.status}</td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          mutate(() =>
                            newsletterService.update(s.id, {
                              status:
                                s.status === "subscribed"
                                  ? "unsubscribed"
                                  : "subscribed",
                            }),
                          )
                        }
                      >
                        {s.status === "subscribed"
                          ? "Unsubscribe"
                          : "Resubscribe"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit campaign" : "Create campaign"}
      >
        <form onSubmit={handleSubmit(save)} className="space-y-4">
          <Input
            label="Campaign name"
            {...register("name")}
            error={errors.name?.message}
          />
          <Input
            label="Subject"
            {...register("subject")}
            error={errors.subject?.message}
          />
          <Input label="Preview text" {...register("previewText")} />
          <Textarea
            label="Message"
            rows={5}
            {...register("body")}
            error={errors.body?.message}
          />
          <Select
            label="Audience"
            options={["all", "customers", "subscribers"].map((value) => ({
              value,
              label: value,
            }))}
            {...register("audience")}
          />
          <Input
            type="datetime-local"
            label="Demo schedule (optional)"
            {...register("scheduledAt")}
          />
          <Button type="submit" disabled={isSubmitting}>
            Save campaign
          </Button>
        </form>
      </Modal>
    </>
  );
}
