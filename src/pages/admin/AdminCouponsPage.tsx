import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Coupon } from "@/types";
import {
  Button,
  Input,
  Select,
  Checkbox,
  Modal,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/common";
import { PageTitle } from "@/components/admin";
import { useAsync } from "@/hooks";
import { couponService } from "@/services";
import { toast } from "@/store";
import { uid } from "@/utils";
const schema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1)
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Use letters, numbers, underscores or hyphens.",
      ),
    description: z.string().trim().min(1),
    type: z.enum(["percent", "fixed"]),
    value: z.number().positive(),
    minSubtotal: z.number().min(0),
    active: z.boolean(),
    expiresAt: z.string(),
  })
  .refine((v) => v.type !== "percent" || v.value <= 100, {
    path: ["value"],
    message: "Percentage must be 100 or less.",
  });
type Values = z.infer<typeof schema>;
export default function AdminCouponsPage() {
  const result = useAsync(() => couponService.list(), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon>();
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  const edit = (c?: Coupon) => {
    setEditing(c);
    reset(
      c
        ? { ...c, expiresAt: c.expiresAt?.slice(0, 10) ?? "" }
        : {
            code: "",
            description: "",
            type: "percent",
            value: 10,
            minSubtotal: 0,
            active: true,
            expiresAt: "",
          },
    );
    setOpen(true);
  };
  const mutate = async (work: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await work();
      result.reload();
    } catch {
      toast.error("Could not update this demo coupon.");
    } finally {
      setBusy(false);
    }
  };
  const save = async (v: Values) => {
    try {
      const code = v.code.toUpperCase();
      if (
        result.data?.some(
          (c) => c.id !== editing?.id && c.code.toUpperCase() === code,
        )
      ) {
        toast.error("This coupon code already exists.");
        return;
      }
      const patch = {
        ...v,
        code,
        expiresAt: v.expiresAt
          ? new Date(v.expiresAt + "T23:59:59").toISOString()
          : undefined,
      };
      if (editing) await couponService.update(editing.id, patch);
      else
        await couponService.create({
          ...patch,
          id: uid("cpn"),
          usageCount: 0,
          createdAt: new Date().toISOString(),
        });
      setOpen(false);
      result.reload();
      toast.success("Demo coupon saved.");
    } catch {
      toast.error("Could not save this demo coupon.");
    }
  };
  return (
    <>
      <PageTitle
        title="Coupons"
        description="Manage sample discount codes. All discounts and usage counts are demonstration values."
        demo
        actions={<Button onClick={() => edit()}>Add coupon</Button>}
      />
      {result.loading ? (
        <LoadingState />
      ) : result.error ? (
        <ErrorState onRetry={result.reload} />
      ) : !result.data?.length ? (
        <EmptyState title="No coupons yet" />
      ) : (
        <div className="card relative overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                {[
                  "Code",
                  "Discount",
                  "Minimum (USD)",
                  "Uses",
                  "Status",
                  "Actions",
                ].map((s) => (
                  <th key={s} className="p-4">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.data.map((c) => (
                <tr key={c.id} className="border-b border-line">
                  <td className="p-4">
                    <strong>{c.code}</strong>
                    <p className="text-muted">{c.description}</p>
                  </td>
                  <td className="p-4">
                    {c.type === "percent" ? `${c.value}%` : `$${c.value}`}
                  </td>
                  <td className="p-4">${c.minSubtotal}</td>
                  <td className="p-4">{c.usageCount}</td>
                  <td className="p-4">{c.active ? "Enabled" : "Disabled"}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => edit(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          mutate(() =>
                            couponService.update(c.id, { active: !c.active }),
                          )
                        }
                      >
                        {c.active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => mutate(() => couponService.remove(c.id))}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit coupon" : "Add coupon"}
      >
        <form onSubmit={handleSubmit(save)} className="space-y-4">
          <Input
            label="Code"
            {...register("code")}
            error={errors.code?.message}
          />
          <Input
            label="Description"
            {...register("description")}
            error={errors.description?.message}
          />
          <Select
            label="Discount type"
            options={[
              { value: "percent", label: "Percentage" },
              { value: "fixed", label: "Fixed USD amount" },
            ]}
            {...register("type")}
          />
          <Input
            type="number"
            min="0.01"
            step="0.01"
            label="Value"
            {...register("value", { valueAsNumber: true })}
            error={errors.value?.message}
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            label="Minimum subtotal (USD)"
            {...register("minSubtotal", { valueAsNumber: true })}
            error={errors.minSubtotal?.message}
          />
          <Input
            type="date"
            label="Expiry date (optional)"
            {...register("expiresAt")}
          />
          <Checkbox label="Enabled" {...register("active")} />
          <Button type="submit" disabled={isSubmitting}>
            Save demo coupon
          </Button>
        </form>
      </Modal>
    </>
  );
}
