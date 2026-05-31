import { useEffect, useState } from 'react';
import { Loader2, Search, KeyRound, Copy, Check, ShieldCheck, X } from 'lucide-react';
import { adminApi } from '@/api';
import type { UserSearchItem, ResetPasswordResponse } from '@/types/api';
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

export function AdminPage() {
  const [users, setUsers] = useState<UserSearchItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserSearchItem | null>(null);

  const loadUsers = async (q: string = '') => {
    setLoading(true);
    try {
      const list = await adminApi.searchUsers(q);
      setUsers(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(search);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold">Управление пользователями</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Поиск пользователей и сброс паролей по запросу
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по email или ФИО..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading}>
              Найти
            </Button>
            {search && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  loadUsers('');
                }}
              >
                Сбросить
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? `Пользователи по запросу «${search}» не найдены` : 'Пользователей пока нет'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.user_id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.full_name || '(ФИО не заполнено)'}</div>
                  <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                  {u.phone && (
                    <div className="text-xs text-muted-foreground">тел.: {u.phone}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-shrink-0"
                  onClick={() => setSelected(u)}
                >
                  <KeyRound className="h-4 w-4" />
                  Сменить пароль
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <ResetPasswordModal
          user={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
}: {
  user: UserSearchItem;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResetPasswordResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const generateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 10; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    setNewPassword(out);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    setLoading(true);
    try {
      const res = await adminApi.resetPassword(user.user_id, newPassword);
      setResult(res);
    } catch (err: any) {
      setError(err.detail || 'Не удалось сменить пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.new_password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Сменить пароль</CardTitle>
              <CardDescription className="mt-1">
                {user.full_name || user.email}
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new_password">Новый пароль</Label>
                <Input
                  id="new_password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="не менее 6 символов"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={generateRandom}
                  className="text-xs text-primary hover:underline"
                >
                  Сгенерировать случайный
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                После смены пароля текущая сессия пользователя будет завершена.
                Передайте ему новый пароль любым удобным способом.
              </p>
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Отмена
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Сохраняю...' : 'Сменить'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-900">
                Пароль успешно сменён. Передайте его пользователю.
              </div>
              <div className="space-y-1.5">
                <Label>Новый пароль</Label>
                <div className="flex gap-2">
                  <Input
                    value={result.new_password}
                    readOnly
                    className="font-mono text-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    title="Скопировать"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={onClose} className="w-full">
                Готово
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
