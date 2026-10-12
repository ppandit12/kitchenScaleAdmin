import { useEffect, useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { Button, Input } from '@/components/common';
import { useAuthStore, toast } from '@/store';
import { authService } from '@/services/authService';
import { mediaUrl, uploadProductImage } from '@/services/mediaService';

export function AdminProfileSettings() {
  const admin = useAuthStore(s => s.admin);
  const setAdmin = useAuthStore(s => s.setAdmin);
  const [name, setName] = useState(admin?.name ?? '');
  const [avatar, setAvatar] = useState(admin?.avatarUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setName(admin?.name ?? '');
    setAvatar(admin?.avatarUrl ?? '');
  }, [admin?.name, admin?.avatarUrl]);
  if (!admin) return null;
  const initials = name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'A';
  return (
    <form id="profile" className="card my-6 scroll-mt-28 space-y-5 p-6" onSubmit={async event => {
      event.preventDefault();
      setSaving(true);
      try {
        setAdmin(await authService.updateAdminProfile(name.trim(), avatar));
        toast.success('Admin profile saved.');
      } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save profile.'); }
      finally { setSaving(false); }
    }}>
      <section aria-labelledby="profile-picture-heading" className="rounded-2xl border border-dashed border-primary/25 bg-cream/70 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative w-fit shrink-0">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary text-3xl font-semibold text-cream shadow-sm">
            {avatar ? <img src={mediaUrl(avatar)} alt="Profile photo preview" className="h-full w-full object-cover" /> : initials}
          </div>
          <span className="absolute right-0 bottom-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-white"><Camera size={17} aria-hidden="true" /></span>
        </div>
        <div className="min-w-0 space-y-3">
          <div><h2 id="profile-picture-heading" className="text-xl font-medium">Profile picture</h2><p className="mt-1 text-sm text-muted">Upload a photo to personalise your admin account.</p></div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={uploading} disabled={saving} leftIcon={<Upload size={16} />} onClick={() => photoInput.current?.click()}>{avatar ? 'Change picture' : 'Upload picture'}</Button>
            {avatar && <Button size="sm" variant="outline" disabled={uploading || saving} onClick={() => setAvatar('')}>Remove photo</Button>}
          </div>
          <label className="sr-only" htmlFor="admin-profile-photo">Upload profile photo</label>
          <input ref={photoInput} id="admin-profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || saving} className="sr-only" tabIndex={-1} onChange={async event => {
            const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
            if (!file) return;
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
              toast.error('Choose a JPG, PNG, or WebP image up to 8 MB.'); return;
            }
            setUploading(true);
            try { setAvatar((await uploadProductImage(file)).src); }
            catch (error) { toast.error(error instanceof Error ? error.message : 'Could not upload photo.'); }
            finally { setUploading(false); }
          }} />
          <p className="text-xs text-muted" role="status">{uploading ? 'Uploading photo...' : 'JPG, PNG or WebP, up to 8 MB. A square photo works best.'}</p>
          {avatar !== (admin.avatarUrl ?? '') && <p className="text-xs font-medium text-primary">Click Save profile to keep your picture changes.</p>}
        </div>
      </div>
      </section>
      <h2 className="text-xl font-medium">Profile details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Your name" value={name} required maxLength={120} disabled={saving} onChange={event => setName(event.target.value)} />
        <Input label="Account email" value={admin.email} readOnly />
      </div>
      <Button type="submit" loading={saving} disabled={uploading || !name.trim()}>Save profile</Button>
    </form>
  );
}
