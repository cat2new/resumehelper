import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2, Upload, Trash2, User, Check, AlertCircle } from 'lucide-react';
import { profileApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import type { Profile } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui/index';

export function ProfilePage() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Локальные значения формы
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const refresh = () => {
    setLoading(true);
    profileApi
      .get()
      .then((p) => {
        setProfile(p);
        setFullName(p.full_name);
        setPhone(p.phone);
        setEmail(p.email);
      })
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await profileApi.update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      setProfile(updated);
      updateUser({
        user_id: updated.user_id,
        email: updated.email,
        full_name: updated.full_name,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.detail || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setError(null);
    setUploadingPhoto(true);
    try {
      const updated = await profileApi.uploadPhoto(file);
      setProfile(updated);
    } catch (err: any) {
      setError(err.detail || 'Не удалось загрузить фото');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm('Удалить фото?')) return;
    try {
      const updated = await profileApi.deletePhoto();
      setProfile(updated);
    } catch (err: any) {
      setError(err.detail || 'Не удалось удалить фото');
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Мой профиль</h1>
        <p className="text-sm text-muted-foreground">
          Эти данные будут отображаться в шапке всех ваших резюме.
        </p>
      </div>

      {!profile.is_complete && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Профиль не заполнен полностью.</strong> Без всех обязательных полей и фото
            создание новых резюме будет недоступно.
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* Левая колонка — фото */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Фотография</CardTitle>
            <CardDescription>JPEG / PNG / WebP, до 5 МБ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="aspect-[3/4] w-full rounded-md border bg-muted/40 overflow-hidden flex items-center justify-center">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt="Фото профиля"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-20 w-20 text-muted-foreground/40" />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="gap-2"
                variant={profile.photo_url ? 'outline' : 'default'}
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {profile.photo_url ? 'Заменить фото' : 'Загрузить фото'}
              </Button>
              {profile.photo_url && (
                <Button onClick={handlePhotoDelete} variant="ghost" className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Удалить фото
                </Button>
              )}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoUpload(f);
                e.target.value = '';
              }}
            />
          </CardContent>
        </Card>

        {/* Правая колонка — личные данные */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Личные данные</CardTitle>
            <CardDescription>Все поля обязательны</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">ФИО</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 999 123-45-67"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ivanov@example.ru"
                  required
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                  <Check className="h-4 w-4" />
                  Профиль сохранён
                </div>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
