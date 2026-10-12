import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Plus, Save, Trash2, WandSparkles, X } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
  Textarea,
} from '@/components/common';
import { AdminCard, IconAction, PageTitle } from '@/components/admin';
import { useAsync, useDocumentTitle } from '@/hooks';
import { productService } from '@/services';
import { toast } from '@/store';
import type { Product, ProductView } from '@/types';
import { cn, round2, uid } from '@/utils';
import { storefrontUrl } from '@/config/storefront';
import { uploadProductImage, mediaUrl } from '@/services/mediaService';
import { imageColor } from '@/utils/productImages';

/* --------------------------------- Schema -------------------------------- */

const VIEWS: ProductView[] = ['hero', 'front', 'angle', 'display', 'detail', 'pack', 'lifestyle'];

const num = (msg: string) => z.number({ error: msg });

const variantSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, 'Required'),
  sku: z.string().trim().min(1, 'Required').max(60),
  color: z.string().trim().min(1, 'Required').max(40),
  pack: z.string().trim().min(1, 'Required').max(40),
  price: num('Enter a price').positive('Must be above 0').max(100000),
  compareAt: num('Enter a number').min(0, 'Cannot be negative').optional(),
  stock: num('Enter stock').int('Whole number').min(0, 'Cannot be negative'),
  weightGrams: num('Enter weight').min(0, 'Cannot be negative'),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour'),
  units: num('Enter units').int('Whole number').min(1, 'At least 1'),
});

const imageSchema = z.object({
  id: z.string(),
  color: z.string().trim().max(60).optional(),
  view: z.enum(['hero', 'front', 'angle', 'display', 'detail', 'pack', 'lifestyle']),
  alt: z.string().trim().min(1, 'Alt text is required for accessibility').max(200),
  src: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => v === '' || /^(https?:\/\/|\/)/.test(v), 'Use a full URL (https://…) or a path starting with /'),
});

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and single hyphens only'),
  tagline: z.string().trim().max(160),
  category: z.string().trim().min(1, 'Category is required').max(80),
  shortDescription: z.string().trim().max(400),
  description: z.string().trim().max(6000),
  status: z.enum(['active', 'draft']),
  features: z.array(z.object({ value: z.string().trim().min(1, 'Enter a feature or remove the row').max(200) })),
  specifications: z.array(
    z.object({ label: z.string().trim().min(1, 'Required').max(80), value: z.string().trim().min(1, 'Required').max(200) }),
  ),
  specsNote: z.string().trim().max(800),
  variants: z.array(variantSchema).min(1, 'Add at least one variant'),
  images: z.array(imageSchema),
});

type FormValues = z.infer<typeof schema>;
type VariantValues = FormValues['variants'][number];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

const newVariant = (n = 1): VariantValues => ({
  id: uid('var'),
  title: 'Black / Single',
  sku: `KSC-NEW-${n}`,
  color: 'Black',
  pack: 'Single',
  price: 18.99,
  compareAt: undefined,
  stock: 0,
  weightGrams: 120,
  colorHex: '#2b2f2c',
  units: 1,
});

function toFormValues(p?: Product): FormValues {
  if (!p) {
    return {
      name: '',
      slug: '',
      tagline: '',
      category: 'Kitchen Accessories',
      shortDescription: '',
      description: '',
      status: 'draft',
      features: [],
      specifications: [],
      specsNote: '',
      variants: [newVariant()],
      images: [],
    };
  }
  return {
    name: p.name,
    slug: p.slug,
    tagline: p.tagline,
    category: p.category,
    shortDescription: p.shortDescription,
    description: p.description,
    status: p.status,
    features: p.features.map((value) => ({ value })),
    specifications: p.specifications.map((s) => ({ ...s })),
    specsNote: p.specsNote ?? '',
    variants: p.variants.map((v) => ({
      id: v.id,
      title: v.title,
      sku: v.sku,
      color: v.options.Color ?? Object.values(v.options)[0] ?? '',
      pack: v.options.Pack ?? Object.values(v.options)[1] ?? 'Single',
      price: v.price,
      compareAt: v.compareAtPrice,
      stock: v.stock,
      weightGrams: v.weightGrams,
      colorHex: v.colorHex,
      units: v.units,
    })),
    images: p.images.map((i) => ({ id: i.id, view: i.view, alt: i.alt, src: i.src ?? '', color: imageColor(i) ?? '' })),
  };
}

const uniq = (arr: string[]) => [...new Set(arr)];

/* ---------------------------------- Page --------------------------------- */

export default function AdminProductEditPage() {
  const { id } = useParams();
  const isNew = !id;
  useDocumentTitle(isNew ? 'New product · Admin' : 'Edit product · Admin');
  const { data, loading, error, reload } = useAsync(
    () => (id ? productService.getById(id) : Promise.resolve(undefined)),
    [id],
  );

  if (loading) return <LoadingState className="min-h-[50vh]" />;
  if (error) return <ErrorState onRetry={reload} />;
  if (!isNew && !data) {
    return (
      <EmptyState
        title="Product not found"
        text="It may have been deleted."
        action={
          <Link to="/admin/products" className="font-medium text-primary underline">
            Back to products
          </Link>
        }
      />
    );
  }
  return <ProductForm key={id ?? 'new'} initial={data} />;
}

/* ---------------------------------- Form --------------------------------- */

const compact = 'py-2.5 text-sm';

function ProductForm({ initial }: { initial?: Product }) {
  const navigate = useNavigate();
  const [slugEdited, setSlugEdited] = useState(!!initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(initial), mode: 'onTouched' });

  const features = useFieldArray({ control, name: 'features' });
  const specs = useFieldArray({ control, name: 'specifications' });
  const variants = useFieldArray({ control, name: 'variants', keyName: 'key' });
  const images = useFieldArray({ control, name: 'images', keyName: 'key' });

  const status = useWatch({ control, name: 'status' });
  const slug = useWatch({ control, name: 'slug' });
  const watchedVariants = useWatch({ control, name: 'variants' }) ?? [];
  const photoColors = [...new Set(watchedVariants.map(v => v.color.trim()).filter(Boolean))];
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true); setUploadError('');
    try {
      if (getValues('images').filter(image => image.src?.trim()).length + files.length > 30) throw new Error('You can add up to 30 photos.');
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose JPG, PNG, or WebP images.');
        if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} is too large. Choose images under 8 MB.`);
        const { src } = await uploadProductImage(file);
        const current = getValues('images');
        const empty = current.findIndex(image => !image.src?.trim());
        const photo = { id: uid('img'), view: (current.length ? 'front' : 'hero') as ProductView, alt: getValues('name') || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), src };
        if (empty >= 0) images.update(empty, photo); else images.append(photo);
      }
      toast.success('Photos uploaded. Save the product to apply your changes.');
    } catch (e) { setUploadError(e instanceof Error ? e.message : 'Could not upload the photos.'); }
    finally { setUploading(false); }
  };

  const onSubmit = async (v: FormValues) => {
    if (uploading) return;
    const clash = productService.snapshot().find((p) => p.slug === v.slug && p.id !== initial?.id);
    if (clash) {
      setError('slug', { message: `“${clash.name}” already uses this slug` });
      return;
    }
    const skus = v.variants.map((x) => x.sku.toUpperCase());
    const dupe = skus.findIndex((s, i) => skus.indexOf(s) !== i);
    if (dupe >= 0) {
      setError(`variants.${dupe}.sku`, { message: 'SKU must be unique' });
      return;
    }
    const now = new Date().toISOString();
    const product: Product = {
      id: initial?.id ?? uid('prod'),
      slug: v.slug,
      name: v.name,
      tagline: v.tagline,
      category: v.category,
      shortDescription: v.shortDescription,
      description: v.description,
      features: v.features.map((f) => f.value),
      specifications: v.specifications,
      specsNote: v.specsNote || undefined,
      options: [
        { name: 'Color', values: uniq(v.variants.map((x) => x.color)) },
        { name: 'Pack', values: uniq(v.variants.map((x) => x.pack)) },
      ],
      variants: v.variants.map((x) => ({
        id: x.id,
        sku: x.sku,
        title: x.title,
        options: { Color: x.color, Pack: x.pack },
        price: round2(x.price),
        compareAtPrice: x.compareAt && x.compareAt > x.price ? round2(x.compareAt) : undefined,
        stock: x.stock,
        weightGrams: x.weightGrams,
        colorHex: x.colorHex,
        units: x.units,
      })),
      images: v.images.map((i) => ({ id: i.id, view: i.view, alt: i.alt, src: i.src || undefined, color: i.color?.trim() ?? '' })),
      status: v.status,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      if (initial) {
        await productService.update(initial.id, product);
        toast.success(v.status === 'active' ? 'Product saved and visible in the shop.' : 'Draft saved. Publish this product to show it in the shop.');
        navigate('/admin/products');
      } else {
        await productService.create(product);
        toast.success(v.status === 'active' ? 'Product created and visible in the shop.' : 'Draft created. Publish this product to show it in the shop.');
        navigate(`/admin/products/${product.id}`, { replace: true });
      }
    } catch {
      toast.error('Could not save the product. Please try again.');
    }
  };

  const onInvalid = () => toast.error('Please fix the highlighted fields.');

  const remove = async () => {
    if (!initial) return;
    setDeleting(true);
    try {
      await productService.remove(initial.id);
      toast.success('Product deleted.');
      navigate('/admin/products');
    } catch {
      toast.error('Could not delete the product.');
      setDeleting(false);
    }
  };

  const nameReg = register('name', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!slugEdited) setValue('slug', slugify(e.target.value), { shouldValidate: !!errors.slug });
    },
  });
  const slugReg = register('slug', { onChange: () => setSlugEdited(true) });
  const numOpt = { valueAsNumber: true } as const;
  const optNum = { setValueAs: (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v)) };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <PageTitle
        back={{ to: '/admin/products', label: 'Products' }}
        title={initial ? `Edit ${initial.name}` : 'New product'}
        description={initial ? `Last updated ${new Date(initial.updatedAt).toLocaleString('en')}` : 'Create a product with variants and images.'}
        actions={
          <>
            {initial && status === 'active' && (
              <a
                href={storefrontUrl(`/products/${slug}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-primary hover:bg-primary/5"
              >
                View in store <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {initial && (
              <Button variant="ghost" size="sm" className="text-danger" onClick={() => setConfirmDelete(true)} leftIcon={<Trash2 className="h-4 w-4" />}>
                Delete
              </Button>
            )}
            <Button type="submit" size="sm" disabled={uploading} loading={isSubmitting} leftIcon={<Save className="h-4 w-4" />}>
              {initial ? 'Save changes' : 'Create product'}
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          {/* Images */}
          <AdminCard
            title="Product photos"
            description="Upload photos from your computer or add an image link. The first photo is the main product image."
            actions={
              <Button
                size="sm"
                variant="secondary"
                disabled={uploading || images.fields.length >= 30}
                onClick={() => images.append({ id: uid('img'), view: 'front', alt: '', src: '' })}
                leftIcon={<ImagePlus className="h-4 w-4" />}
              >
                Add image link
              </Button>
            }
          >
            <label className={cn('relative mb-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-5 py-8 text-center transition hover:border-primary hover:bg-primary/10', uploading && 'pointer-events-none opacity-60')}>
              <ImagePlus className="h-8 w-8 text-primary" aria-hidden />
              <span className="font-semibold text-primary">{uploading ? 'Uploading photos…' : 'Click to upload product photos'}</span>
              <span className="text-sm text-muted">JPG, PNG or WebP · up to 8 MB each · select multiple photos</span>
              <input type="file" aria-label="Upload product photos" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={e => { void upload(e.target.files); e.target.value = ''; }} />
            </label>
            {uploading && <p role="status" className="mb-4 text-sm text-primary">Uploading photos. Please wait before saving.</p>}
            {uploadError && <p role="alert" className="mb-4 rounded-xl bg-danger/10 p-3 text-sm text-danger">{uploadError}</p>}
            {images.fields.length === 0 ? (
              <p className="text-sm text-muted">Your uploaded photos will appear here. Add your main photo first.</p>
            ) : (
              <ul className="space-y-3">
                {images.fields.map((f, i) => {
                  const e = errors.images?.[i];
                  return (
                    <li key={f.key} className="flex flex-col gap-4 rounded-2xl border border-line/80 bg-cream/40 p-4 sm:flex-row">
                      <ImagePreview control={control} index={i} />
                      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                        <Select
                          label="Image type"
                          className={compact}
                          options={VIEWS.map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))}
                          {...register(`images.${i}.view`)}
                        />
                        <Input label="Alt text" required className={compact} error={e?.alt?.message} {...register(`images.${i}.alt`)} />
                        <Select
                          label="Photo colour"
                          className={compact}
                          options={[{ value: '', label: 'All colours (shared photo)' }, ...[...new Set([...photoColors, f.color].filter((value): value is string => !!value))].map(value => ({ value, label: value }))]}
                          hint="Select the colour shown in this photo."
                          {...register(`images.${i}.color`)}
                        />
                        <Input
                          label="Image URL"
                          placeholder="https://… (optional)"
                          containerClassName="sm:col-span-2"
                          className={compact}
                          hint="Paste a photo URL, or use the upload area above."
                          error={e?.src?.message}
                          {...register(`images.${i}.src`)}
                        />
                      </div>
                      <div className="flex shrink-0 gap-1 sm:flex-col">
                        <IconAction label="Move image up" disabled={uploading || i === 0} onClick={() => images.move(i, i - 1)}>
                          <ArrowUp className="h-4 w-4" />
                        </IconAction>
                        <IconAction label="Move image down" disabled={uploading || i === images.fields.length - 1} onClick={() => images.move(i, i + 1)}>
                          <ArrowDown className="h-4 w-4" />
                        </IconAction>
                        <IconAction label="Remove image" disabled={uploading} tone="danger" onClick={() => images.remove(i)}>
                          <Trash2 className="h-4 w-4" />
                        </IconAction>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>

          {/* Details */}
          <AdminCard title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" required error={errors.name?.message} className={compact} {...nameReg} />
              <Input
                label="Slug"
                required
                error={errors.slug?.message}
                hint={`URL: /products/${slug || '…'}`}
                className={compact}
                {...slugReg}
              />
              <Input label="Tagline" error={errors.tagline?.message} className={compact} {...register('tagline')} />
              <Input label="Category" required error={errors.category?.message} className={compact} {...register('category')} />
              <Textarea
                label="Short description"
                rows={2}
                containerClassName="sm:col-span-2"
                error={errors.shortDescription?.message}
                className="text-sm"
                {...register('shortDescription')}
              />
              <Textarea
                label="Description"
                rows={5}
                containerClassName="sm:col-span-2"
                error={errors.description?.message}
                className="text-sm"
                {...register('description')}
              />
            </div>
          </AdminCard>

          {/* Features */}
          <AdminCard
            title="Features"
            description="Short benefit bullets. Avoid unverified claims."
            actions={
              <Button size="sm" variant="secondary" onClick={() => features.append({ value: '' })} leftIcon={<Plus className="h-4 w-4" />}>
                Add feature
              </Button>
            }
          >
            {features.fields.length === 0 ? (
              <p className="text-sm text-muted">No features yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {features.fields.map((f, i) => (
                  <li key={f.id} className="flex items-start gap-2">
                    <Input
                      aria-label={`Feature ${i + 1}`}
                      containerClassName="flex-1"
                      className={compact}
                      error={errors.features?.[i]?.value?.message}
                      {...register(`features.${i}.value`)}
                    />
                    <IconAction label={`Remove feature ${i + 1}`} tone="danger" onClick={() => features.remove(i)}>
                      <X className="h-4 w-4" />
                    </IconAction>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          {/* Specifications */}
          <AdminCard
            title="Specifications"
            description="Label / value rows shown in the product spec table."
            actions={
              <Button size="sm" variant="secondary" onClick={() => specs.append({ label: '', value: '' })} leftIcon={<Plus className="h-4 w-4" />}>
                Add row
              </Button>
            }
          >
            {specs.fields.length === 0 ? (
              <p className="text-sm text-muted">No specifications yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {specs.fields.map((f, i) => (
                  <li key={f.id} className="grid grid-cols-[1fr_auto] items-start gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]">
                    <Input
                      aria-label={`Specification ${i + 1} label`}
                      placeholder="Label"
                      className={compact}
                      containerClassName="col-span-1"
                      error={errors.specifications?.[i]?.label?.message}
                      {...register(`specifications.${i}.label`)}
                    />
                    <div className="row-start-2 sm:row-start-auto">
                      <Input
                        aria-label={`Specification ${i + 1} value`}
                        placeholder="Value"
                        className={compact}
                        error={errors.specifications?.[i]?.value?.message}
                        {...register(`specifications.${i}.value`)}
                      />
                    </div>
                    <IconAction label={`Remove specification ${i + 1}`} tone="danger" onClick={() => specs.remove(i)}>
                      <X className="h-4 w-4" />
                    </IconAction>
                  </li>
                ))}
              </ul>
            )}
            <Textarea
              label="Specifications note"
              hint="Disclaimer shown under the spec table (e.g. supplier-listed values pending verification)."
              rows={2}
              containerClassName="mt-5"
              className="text-sm"
              error={errors.specsNote?.message}
              {...register('specsNote')}
            />
          </AdminCard>

          {/* Variants */}
          <AdminCard
            title="Options & variants"
            description="Set the price, stock, and shipping weight for each colour and pack option. Prices are in USD."
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => variants.append(newVariant(variants.fields.length + 1))}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add variant
              </Button>
            }
          >
            {errors.variants?.root?.message || errors.variants?.message ? (
              <p className="field-error mb-3">{errors.variants?.root?.message ?? errors.variants?.message}</p>
            ) : null}
            <OptionsSummary control={control} />
            <ul className="mt-4 space-y-4">
              {variants.fields.map((f, i) => {
                const e = errors.variants?.[i];
                return (
                  <li key={f.key} className="rounded-2xl border border-line/80 bg-cream/40 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <VariantHeading control={control} index={i} />
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs"
                          leftIcon={<WandSparkles className="h-3.5 w-3.5" />}
                          onClick={() => {
                            const v = getValues(`variants.${i}`);
                            setValue(`variants.${i}.title`, `${v.color} / ${v.pack}`, { shouldDirty: true, shouldValidate: true });
                          }}
                        >
                          Auto title
                        </Button>
                        <IconAction
                          label={`Remove variant ${i + 1}`}
                          tone="danger"
                          disabled={variants.fields.length <= 1}
                          onClick={() => variants.remove(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconAction>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Input label="Title" className={compact} containerClassName="col-span-2" error={e?.title?.message} {...register(`variants.${i}.title`)} />
                      <Input label="SKU" className={compact} containerClassName="col-span-2" error={e?.sku?.message} {...register(`variants.${i}.sku`)} />
                      <Input label="Color" className={compact} error={e?.color?.message} {...register(`variants.${i}.color`)} />
                      <Input label="Pack" className={compact} error={e?.pack?.message} {...register(`variants.${i}.pack`)} />
                      <Input
                        label="Price (USD)"
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        className={compact}
                        error={e?.price?.message}
                        {...register(`variants.${i}.price`, numOpt)}
                      />
                      <Input
                        label="Compare at (USD)"
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        className={compact}
                        hint="Optional"
                        error={e?.compareAt?.message}
                        {...register(`variants.${i}.compareAt`, optNum)}
                      />
                      <Input
                        label="Stock"
                        type="number"
                        step="1"
                        min="0"
                        inputMode="numeric"
                        className={compact}
                        error={e?.stock?.message}
                        {...register(`variants.${i}.stock`, numOpt)}
                      />
                      <Input
                        label="Weight (g)"
                        type="number"
                        step="1"
                        min="0"
                        inputMode="numeric"
                        className={compact}
                        error={e?.weightGrams?.message}
                        {...register(`variants.${i}.weightGrams`, numOpt)}
                      />
                      <Input
                        label="Units in pack"
                        type="number"
                        step="1"
                        min="1"
                        inputMode="numeric"
                        className={compact}
                        error={e?.units?.message}
                        {...register(`variants.${i}.units`, numOpt)}
                      />
                      <div>
                        <label htmlFor={`variant-color-${f.key}`} className="field-label">
                          Body colour
                        </label>
                        <div className="flex h-[42px] items-center gap-2 rounded-xl border border-line bg-surface px-2">
                          <input
                            id={`variant-color-${f.key}`}
                            type="color"
                            className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                            {...register(`variants.${i}.colorHex`)}
                          />
                          <HexLabel control={control} index={i} />
                        </div>
                        {e?.colorHex?.message && <p className="field-error">{e.colorHex.message}</p>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </AdminCard>


        </div>

        {/* Sidebar */}
        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <AdminCard title="Status">
            <Select
              label="Visibility"
              hint={status === 'draft' ? 'This product will not appear in the shop until you choose Active and save.' : 'This product appears in the shop after you save.'}
              className={compact}
              options={[
                { value: 'active', label: 'Active — visible in the store' },
                { value: 'draft', label: 'Draft — hidden from the store' },
              ]}
              {...register('status')}
            />
          </AdminCard>
          <AdminCard title="Preview">
            <StorefrontPreview control={control} />
          </AdminCard>
          <div className="rounded-2xl border border-line/80 bg-surface p-5 text-sm text-muted">
            <p>Changes are saved to the database and appear on the storefront immediately.</p>
            {isDirty && <p className="mt-2 font-medium text-warning">You have unsaved changes.</p>}
            <Button type="submit" fullWidth className="mt-4" disabled={uploading} loading={isSubmitting} leftIcon={<Save className="h-4 w-4" />}>
              {initial ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        loading={deleting}
        title="Delete product?"
        message="This permanently removes the product and its variants from the catalogue."
      />
    </form>
  );
}

/* ------------------------------ Sub-components --------------------------- */

function VariantHeading({ control, index }: { control: Control<FormValues>; index: number }) {
  const title = useWatch({ control, name: `variants.${index}.title` });
  const hex = useWatch({ control, name: `variants.${index}.colorHex` });
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
      <span className="h-4 w-4 shrink-0 rounded-full border border-line" style={{ background: hex }} aria-hidden />
      <span className="truncate">{title || `Variant ${index + 1}`}</span>
    </p>
  );
}

function HexLabel({ control, index }: { control: Control<FormValues>; index: number }) {
  const hex = useWatch({ control, name: `variants.${index}.colorHex` });
  return <span className="font-mono text-xs text-muted uppercase">{hex}</span>;
}

function OptionsSummary({ control }: { control: Control<FormValues> }) {
  const vs = useWatch({ control, name: 'variants' }) ?? [];
  const colors = uniq(vs.map((v) => v?.color?.trim()).filter(Boolean) as string[]);
  const packs = uniq(vs.map((v) => v?.pack?.trim()).filter(Boolean) as string[]);
  return (
    <div className="grid gap-3 rounded-xl bg-sand/60 p-3 text-sm sm:grid-cols-2">
      {[
        { name: 'Color', values: colors },
        { name: 'Pack', values: packs },
      ].map((o) => (
        <div key={o.name}>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{o.name} values</p>
          <div className="flex flex-wrap gap-1.5">
            {o.values.length ? (
              o.values.map((v) => (
                <span key={v} className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium">
                  {v}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted">—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ImagePreview({ control, index }: { control: Control<FormValues>; index: number }) {
  const img = useWatch({ control, name: `images.${index}` });
  const [broken, setBroken] = useState<string | null>(null);
  const src = img?.src?.trim();
  const validSrc = src && /^(https?:\/\/|\/)/.test(src) ? src : undefined;
  return (
    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-line/70 bg-surface">
      {validSrc && broken !== validSrc ? (
        <img src={mediaUrl(validSrc)} alt={img?.alt ?? ''} className="h-full w-full object-contain" onError={() => setBroken(validSrc)} />
      ) : (
        <div className="flex h-full items-center justify-center text-muted"><ImagePlus className="h-8 w-8" aria-label="No photo selected" /></div>
      )}
      {index === 0 && (
        <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-cream">Main</span>
      )}
      {validSrc && broken === validSrc && (
        <span className="absolute inset-x-0 bottom-0 bg-danger/90 px-1 py-0.5 text-center text-[10px] text-white">URL failed to load</span>
      )}
    </div>
  );
}

function StorefrontPreview({ control }: { control: Control<FormValues> }) {
  const name = useWatch({ control, name: 'name' });
  const tagline = useWatch({ control, name: 'tagline' });
  const first = useWatch({ control, name: 'images.0' });
  const vs = useWatch({ control, name: 'variants' }) ?? [];
  const prices = vs.map((v) => Number(v?.price)).filter((n) => Number.isFinite(n) && n > 0);
  const from = prices.length ? Math.min(...prices) : undefined;
  const src = first?.src?.trim();
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-xl border border-line/60">
        {src && /^(https?:\/\/|\/)/.test(src) ? <img src={mediaUrl(src)} alt={first?.alt || name || 'Product photo'} className="h-full w-full object-contain" /> : <div className="flex h-full flex-col items-center justify-center gap-3 bg-sand/40 px-5 text-center text-muted"><ImagePlus className="h-10 w-10" aria-hidden /><p className="text-sm">Upload a photo to preview your product</p></div>}
      </div>
      <p className="mt-3 font-display text-lg font-semibold">{name || 'Product name'}</p>
      {tagline && <p className="text-sm text-muted">{tagline}</p>}
      <p className={cn('mt-1 text-sm font-semibold', !from && 'text-muted')}>
        {from ? `From $${from.toFixed(2)} USD` : 'No price yet'}
      </p>
      <div className="mt-2 flex gap-1.5">
        {uniq(vs.map((v) => v?.colorHex).filter(Boolean) as string[]).map((hex) => (
          <span key={hex} className="h-5 w-5 rounded-full border border-line" style={{ background: hex }} aria-hidden />
        ))}
      </div>
    </div>
  );
}
