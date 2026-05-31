import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Plus, FileText, Trash2, Loader2, AlertCircle, Filter, X, Briefcase } from 'lucide-react';
import { dictApi, positionsApi, profileApi, resumesApi, templatesApi } from '@/api';
import type { Position, Profile, ProfessionalField, ResumeListItem, Template } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
  Select,
} from '@/components/ui/index';

const statusVariant: Record<string, 'default' | 'success' | 'secondary'> = {
  Черновик: 'secondary',
  Готово: 'success',
};

export function DashboardPage() {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Фильтры
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProgressMin, setFilterProgressMin] = useState<number>(0);
  const [filterProgressMax, setFilterProgressMax] = useState<number>(100);
  const [filterPosition, setFilterPosition] = useState<string>('all');

  const positionOptions = useMemo(() => {
    const set = new Set<string>();
    resumes.forEach((r) => {
      if (r.position_name) set.add(r.position_name);
    });
    return Array.from(set).sort();
  }, [resumes]);

  const filteredResumes = useMemo(() => {
    return resumes.filter((r) => {
      if (filterStatus !== 'all' && r.status_name !== filterStatus) return false;
      if (r.progress < filterProgressMin || r.progress > filterProgressMax) return false;
      if (filterPosition !== 'all' && r.position_name !== filterPosition) return false;
      return true;
    });
  }, [resumes, filterStatus, filterProgressMin, filterProgressMax, filterPosition]);

  const filtersActive =
    filterStatus !== 'all' ||
    filterProgressMin !== 0 ||
    filterProgressMax !== 100 ||
    filterPosition !== 'all';

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterProgressMin(0);
    setFilterProgressMax(100);
    setFilterPosition('all');
  };

  const refresh = () => {
    setLoading(true);
    Promise.all([resumesApi.list(), profileApi.get()])
      .then(([list, p]) => {
        setResumes(list);
        setProfile(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это резюме без возможности восстановления?')) return;
    await resumesApi.delete(id);
    refresh();
  };

  const canCreate = profile?.is_complete ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Мои резюме</h1>
          <p className="text-sm text-muted-foreground">
            Создавайте отдельное резюме под каждую целевую должность
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="gap-2"
          disabled={!canCreate}
          title={canCreate ? '' : 'Сначала заполните профиль'}
        >
          <Plus className="h-4 w-4" />
          Новое резюме
        </Button>
      </div>

      {!canCreate && profile && (
        <div className="flex items-center gap-3 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            Чтобы создать резюме, сначала заполните профиль (ФИО, телефон, email и фото).
          </div>
          <Link
            to="/profile"
            className="font-medium underline whitespace-nowrap hover:text-amber-700"
          >
            Заполнить →
          </Link>
        </div>
      )}

      {!loading && resumes.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium">
              <Filter className="h-4 w-4" />
              <span>Фильтры</span>
              {filtersActive && (
                <button
                  onClick={resetFilters}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  Сбросить
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Статус</Label>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Все</option>
                  <option value="Черновик">Черновик</option>
                  <option value="Готово">Готово</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Должность</Label>
                <Select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                >
                  <option value="all">Все</option>
                  {positionOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Прогресс от, %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={filterProgressMin}
                  onChange={(e) =>
                    setFilterProgressMin(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Прогресс до, %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={filterProgressMax}
                  onChange={(e) =>
                    setFilterProgressMax(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                  }
                />
              </div>
            </div>
            {filtersActive && (
              <div className="mt-3 text-xs text-muted-foreground">
                Показано: {filteredResumes.length} из {resumes.length}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : resumes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">У вас пока нет резюме</p>
            <Button onClick={() => setShowCreate(true)} className="mt-4" disabled={!canCreate}>
              Создать первое
            </Button>
          </CardContent>
        </Card>
      ) : filteredResumes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">
              Под текущие фильтры ничего не подходит
            </p>
            <Button variant="outline" onClick={resetFilters} className="mt-4">
              Сбросить фильтры
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredResumes.map((r) => (
            <Card key={r.resume_id} className="flex flex-col">
              <CardHeader className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{r.title}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1.5 text-xs">
                      <Briefcase className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        Должность: {r.position_name || '—'}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={statusVariant[r.status_name] || 'secondary'}>
                    {r.status_name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Заполнено</span>
                    <span>{r.progress}%</span>
                  </div>
                  <Progress value={r.progress} />
                </div>
                <div className="text-xs text-muted-foreground">
                  Шаблон: {r.template_name}
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/resumes/${r.resume_id}`}
                    className="flex-1 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Открыть
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(r.resume_id)}
                    className="h-9 w-9"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && profile && (
        <CreateResumeModal
          profile={profile}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function CreateResumeModal({
  profile,
  onClose,
  onCreated,
}: {
  profile: Profile;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [fields, setFields] = useState<ProfessionalField[]>([]);

  const [title, setTitle] = useState('');
  const [ownerFullName, setOwnerFullName] = useState(profile.full_name);
  const [ownerEmail, setOwnerEmail] = useState(profile.email);
  const [positionId, setPositionId] = useState<number | 'new'>('new');
  const [templateId, setTemplateId] = useState<number>(0);
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionField, setNewPositionField] = useState(0);
  const [newPositionCompany, setNewPositionCompany] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([positionsApi.list(), templatesApi.list(), dictApi.fields()]).then(
      ([p, t, f]) => {
        setPositions(p);
        setTemplates(t);
        setFields(f);
        if (t[0]) setTemplateId(t[0].template_id);
        if (f[0]) setNewPositionField(f[0].field_id);
      }
    );
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let finalPositionId: number;
      if (positionId === 'new') {
        const created = await positionsApi.create({
          position_name: newPositionName,
          field_id: newPositionField,
          company: newPositionCompany || undefined,
        });
        finalPositionId = created.position_id;
      } else {
        finalPositionId = positionId;
      }
      const resume = await resumesApi.create({
        title,
        owner_full_name: ownerFullName,
        owner_email: ownerEmail,
        position_id: finalPositionId,
        template_id: templateId,
      });
      onCreated();
      window.location.assign(`/resumes/${resume.resume_id}`);
    } catch (err: any) {
      setError(err.detail || 'Не удалось создать резюме');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle>Новое резюме</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Название резюме</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Junior Frontend в Yandex"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner_name">Ваше ФИО</Label>
              <Input
                id="owner_name"
                value={ownerFullName}
                onChange={(e) => setOwnerFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner_email">Ваш email</Label>
              <Input
                id="owner_email"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="ivanov@example.ru"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="position">Целевая должность</Label>
              <Select
                id="position"
                value={positionId}
                onChange={(e) =>
                  setPositionId(e.target.value === 'new' ? 'new' : Number(e.target.value))
                }
              >
                <option value="new">+ Создать новую должность</option>
                {positions.map((p) => (
                  <option key={p.position_id} value={p.position_id}>
                    {p.position_name}
                    {p.company && ` (${p.company})`}
                  </option>
                ))}
              </Select>
            </div>

            {positionId === 'new' && (
              <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                <div className="space-y-1.5">
                  <Label>Название должности</Label>
                  <Input
                    value={newPositionName}
                    onChange={(e) => setNewPositionName(e.target.value)}
                    placeholder="Junior Backend Developer"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Сфера</Label>
                  <Select
                    value={newPositionField}
                    onChange={(e) => setNewPositionField(Number(e.target.value))}
                  >
                    {fields.map((f) => (
                      <option key={f.field_id} value={f.field_id}>
                        {f.field_name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Компания (необязательно)</Label>
                  <Input
                    value={newPositionCompany}
                    onChange={(e) => setNewPositionCompany(e.target.value)}
                    placeholder="Yandex"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="template">Шаблон оформления</Label>
              <Select
                id="template"
                value={templateId}
                onChange={(e) => setTemplateId(Number(e.target.value))}
              >
                {templates.map((t) => (
                  <option key={t.template_id} value={t.template_id}>
                    {t.template_name}
                  </option>
                ))}
              </Select>
            </div>

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
                {loading ? 'Создаю...' : 'Создать'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}
