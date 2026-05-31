import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Plus, Trash2, Sparkles, FileDown, Check, X, Paperclip, Image as ImageIcon, FileText, Unlink, Pencil } from 'lucide-react';
import { aiApi, dictApi, exportApi, portfolioApi, positionsApi, resumesApi, skillsApi } from '@/api';
import type {
  Discipline,
  EducationalProgram,
  ExperienceType,
  Language,
  PortfolioItem,
  Position,
  ProfessionalField,
  ResumeDetail,
  ResumeStatus,
  Skill,
  SkillCategory,
} from '@/types/api';
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
  Textarea,
} from '@/components/ui/index';

type Tab = 'basic' | 'education' | 'experience' | 'skills' | 'languages' | 'export';

const SKILL_LEVELS = ['Базовый', 'Средний', 'Высокий', 'Эксперт'];
const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function ResumeEditorPage() {
  const { id } = useParams();
  const resumeId = Number(id);

  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('basic');

  const [programs, setPrograms] = useState<EducationalProgram[]>([]);
  const [expTypes, setExpTypes] = useState<ExperienceType[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [languagesCatalog, setLanguagesCatalog] = useState<Language[]>([]);
  const [statuses, setStatuses] = useState<ResumeStatus[]>([]);

  const reload = async () => {
    const r = await resumesApi.get(resumeId);
    setResume(r);
  };

  useEffect(() => {
    Promise.all([
      resumesApi.get(resumeId),
      dictApi.programs(),
      dictApi.experienceTypes(),
      dictApi.disciplines(),
      skillsApi.list(),
      dictApi.skillCategories(),
      dictApi.languages(),
      dictApi.resumeStatuses(),
    ])
      .then(([r, p, e, d, s, sc, lg, st]) => {
        setResume(r);
        setPrograms(p);
        setExpTypes(e);
        setDisciplines(d);
        setSkillsCatalog(s);
        setSkillCategories(sc);
        setLanguagesCatalog(lg);
        setStatuses(st);
      })
      .finally(() => setLoading(false));
  }, [resumeId]);

  if (loading || !resume) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'basic', label: 'Основное' },
    { key: 'education', label: 'Образование' },
    { key: 'experience', label: 'Опыт' },
    { key: 'skills', label: 'Навыки' },
    { key: 'languages', label: 'Языки' },
    { key: 'export', label: 'Экспорт' },
  ];

  const changeStatus = async (statusId: number) => {
    await resumesApi.update(resumeId, { status_id: statusId });
    reload();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base truncate">{resume.title}</CardTitle>
            <CardDescription>{resume.position.position_name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Заполнено</span>
                <span>{resume.progress}%</span>
              </div>
              <Progress value={resume.progress} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Статус резюме</Label>
              <Select
                value={resume.status_id}
                onChange={(e) => changeStatus(Number(e.target.value))}
              >
                {statuses.map((s) => (
                  <option key={s.status_id} value={s.status_id}>
                    {s.status_name}
                  </option>
                ))}
              </Select>
            </div>
            <Badge
              variant={resume.status_name === 'Готово' ? 'success' : 'secondary'}
              className="w-full justify-center"
            >
              {resume.status_name}
            </Badge>
          </CardContent>
        </Card>

        <nav className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                tab === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <div>
        {tab === 'basic' && <BasicTab resume={resume} onUpdate={reload} />}
        {tab === 'education' && (
          <EducationTab resume={resume} programs={programs} onUpdate={reload} />
        )}
        {tab === 'experience' && (
          <ExperienceTab
            resume={resume}
            expTypes={expTypes}
            disciplines={disciplines}
            onUpdate={reload}
          />
        )}
        {tab === 'skills' && (
          <SkillsTab
            resume={resume}
            skills={skillsCatalog}
            categories={skillCategories}
            onUpdate={reload}
            onCatalogRefresh={async () => {
              const updated = await skillsApi.list();
              setSkillsCatalog(updated);
            }}
          />
        )}
        {tab === 'languages' && (
          <LanguagesTab resume={resume} catalog={languagesCatalog} onUpdate={reload} />
        )}
        {tab === 'export' && <ExportTab resume={resume} />}
      </div>
    </div>
  );
}

// Вкладка «Основное»

function BasicTab({ resume, onUpdate }: { resume: ResumeDetail; onUpdate: () => void }) {
  const [title, setTitle] = useState(resume.title);
  const [fullName, setFullName] = useState(resume.owner_full_name);
  const [email, setEmail] = useState(resume.owner_email);
  const [saving, setSaving] = useState(false);

  // Редактирование должности
  const [positions, setPositions] = useState<Position[]>([]);
  const [fields, setFields] = useState<ProfessionalField[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<number | 'new'>(
    resume.position.position_id
  );

  // Форма новой должности
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionField, setNewPositionField] = useState(0);
  const [newPositionCompany, setNewPositionCompany] = useState('');

  // Форма редактирования существующей
  const [editingPosition, setEditingPosition] = useState(false);
  const [editPositionName, setEditPositionName] = useState(resume.position.position_name);
  const [editPositionField, setEditPositionField] = useState(resume.position.field_id);
  const [editPositionCompany, setEditPositionCompany] = useState(resume.position.company || '');

  useEffect(() => {
    Promise.all([positionsApi.list(), dictApi.fields()]).then(([p, f]) => {
      setPositions(p);
      setFields(f);
      if (f[0]) setNewPositionField(f[0].field_id);
    });
  }, []);

  useEffect(() => {
    setSelectedPositionId(resume.position.position_id);
    setEditPositionName(resume.position.position_name);
    setEditPositionField(resume.position.field_id);
    setEditPositionCompany(resume.position.company || '');
  }, [resume.position.position_id, resume.position.position_name, resume.position.field_id, resume.position.company]);

  const refreshPositions = async () => {
    const list = await positionsApi.list();
    setPositions(list);
  };

  const saveEditedPosition = async () => {
    if (!editPositionName.trim()) return;
    await positionsApi.update(resume.position.position_id, {
      position_name: editPositionName.trim(),
      field_id: editPositionField,
      company: editPositionCompany.trim() || null,
    });
    await refreshPositions();
    setEditingPosition(false);
    onUpdate();
  };

  const save = async () => {
    setSaving(true);
    try {
      let positionIdToUse: number;

      if (selectedPositionId === 'new') {
        const created = await positionsApi.create({
          position_name: newPositionName.trim(),
          field_id: newPositionField,
          company: newPositionCompany.trim() || undefined,
        });
        positionIdToUse = created.position_id;
        await refreshPositions();
        setNewPositionName('');
        setNewPositionCompany('');
      } else {
        positionIdToUse = selectedPositionId;
      }

      await resumesApi.update(resume.resume_id, {
        title,
        owner_full_name: fullName,
        owner_email: email,
        position_id: positionIdToUse,
      });
      await onUpdate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Основная информация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Название резюме</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>ФИО владельца</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Email для контактов</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {/* Должность — селектор + редактирование */}
        <div className="border-t pt-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Целевая должность</Label>
              {selectedPositionId !== 'new' && !editingPosition && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const pos = positions.find((p) => p.position_id === selectedPositionId);
                    if (pos) {
                      setEditPositionName(pos.position_name);
                      setEditPositionField(pos.field_id);
                      setEditPositionCompany(pos.company || '');
                    }
                    setEditingPosition(true);
                  }}
                  className="text-xs gap-1 h-7"
                >
                  Редактировать должность
                </Button>
              )}
            </div>
            <Select
              value={selectedPositionId}
              onChange={(e) => {
                setSelectedPositionId(e.target.value === 'new' ? 'new' : Number(e.target.value));
                setEditingPosition(false);
              }}
              disabled={editingPosition}
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

          {/* Форма редактирования существующей должности */}
          {editingPosition && (
            <div className="space-y-3 rounded-md border-2 border-primary/30 bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">
                Изменения отразятся во всех резюме с этой должностью.
              </div>
              <div className="space-y-1.5">
                <Label>Название должности</Label>
                <Input
                  value={editPositionName}
                  onChange={(e) => setEditPositionName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Сфера</Label>
                <Select
                  value={editPositionField}
                  onChange={(e) => setEditPositionField(Number(e.target.value))}
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
                  value={editPositionCompany}
                  onChange={(e) => setEditPositionCompany(e.target.value)}
                  placeholder="Yandex"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPosition(false)}
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  onClick={saveEditedPosition}
                  disabled={!editPositionName.trim()}
                  className="flex-1"
                >
                  Сохранить должность
                </Button>
              </div>
            </div>
          )}

          {/* Форма создания новой должности */}
          {selectedPositionId === 'new' && !editingPosition && (
            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
              <div className="space-y-1.5">
                <Label>Название должности</Label>
                <Input
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  placeholder="Junior Backend Developer"
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
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm border-t pt-4">
          <div>
            <div className="text-muted-foreground">Шаблон</div>
            <div className="font-medium">{resume.template.template_name}</div>
          </div>
        </div>

        <Button
          onClick={save}
          disabled={saving || (selectedPositionId === 'new' && !newPositionName.trim())}
        >
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Вкладка «Образование»

function EducationTab({
  resume,
  programs,
  onUpdate,
}: {
  resume: ResumeDetail;
  programs: EducationalProgram[];
  onUpdate: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEdu, setNewEdu] = useState({
    institution: 'НИУ ВШЭ',
    program_id: programs[0]?.program_id || 0,
    start_year: currentYear - 3,
    graduation_year: currentYear + 1,
  });

  const add = async () => {
    await resumesApi.addEducation(resume.resume_id, newEdu);
    setAdding(false);
    setNewEdu({
      institution: 'НИУ ВШЭ',
      program_id: programs[0]?.program_id || 0,
      start_year: currentYear - 3,
      graduation_year: currentYear + 1,
    });
    onUpdate();
  };

  const remove = async (eduId: number) => {
    if (!confirm('Удалить?')) return;
    await resumesApi.deleteEducation(resume.resume_id, eduId);
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Образование</CardTitle>
          <Button size="sm" onClick={() => setAdding(true)} className="gap-2" disabled={adding}>
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {resume.educations.map((edu) => {
          const program = programs.find((p) => p.program_id === edu.program_id);

          if (editingId === edu.education_id) {
            return (
              <EducationForm
                key={edu.education_id}
                programs={programs}
                initial={edu}
                onSave={async (data) => {
                  await resumesApi.updateEducation(resume.resume_id, edu.education_id, data);
                  setEditingId(null);
                  onUpdate();
                }}
                onCancel={() => setEditingId(null)}
              />
            );
          }

          const yearsText = edu.start_year
            ? `${edu.start_year} — ${edu.graduation_year}`
            : `окончание в ${edu.graduation_year}`;

          return (
            <div
              key={edu.education_id}
              className="flex items-start justify-between gap-2 rounded-md border p-3 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setEditingId(edu.education_id)}
            >
              <div>
                <div className="font-medium">{edu.institution}</div>
                <div className="text-sm text-muted-foreground">
                  {program?.program_name || '—'} · {yearsText}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(edu.education_id);
                }}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        {adding && (
          <EducationForm
            programs={programs}
            initial={newEdu}
            onSave={async (data) => {
              await resumesApi.addEducation(resume.resume_id, {
                institution: data.institution ?? 'НИУ ВШЭ',
                program_id: data.program_id!,
                start_year: data.start_year ?? null,
                graduation_year: data.graduation_year!,
              });
              setAdding(false);
              onUpdate();
            }}
            onCancel={() => setAdding(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Форма образования
function EducationForm({
  programs,
  initial,
  onSave,
  onCancel,
}: {
  programs: EducationalProgram[];
  initial: {
    institution: string;
    program_id: number;
    start_year: number | null;
    graduation_year: number;
  };
  onSave: (data: {
    institution: string;
    program_id: number;
    start_year: number | null;
    graduation_year: number;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border-2 border-primary/30 bg-muted/30 p-3">
      <div className="space-y-1.5">
        <Label>Учебное заведение</Label>
        <Input
          value={form.institution}
          onChange={(e) => setForm({ ...form, institution: e.target.value })}
          placeholder="Учебное заведение"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Программа</Label>
        <Select
          value={form.program_id}
          onChange={(e) => setForm({ ...form, program_id: Number(e.target.value) })}
        >
          {programs.map((p) => (
            <option key={p.program_id} value={p.program_id}>
              {p.faculty} — {p.program_name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Начало обучения</Label>
          <Input
            type="number"
            min={1990}
            max={2100}
            value={form.start_year ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                start_year: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="например, 2023"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Конец обучения</Label>
          <Input
            type="number"
            min={1990}
            max={2100}
            value={form.graduation_year}
            onChange={(e) =>
              setForm({ ...form, graduation_year: Number(e.target.value) })
            }
            placeholder="например, 2027"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Отмена
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
}

// Вкладка «Опыт»

function ExperienceTab({
  resume,
  expTypes,
  disciplines,
  onUpdate,
}: {
  resume: ResumeDetail;
  expTypes: ExperienceType[];
  disciplines: Discipline[];
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [allPortfolio, setAllPortfolio] = useState<PortfolioItem[]>([]);

  const reloadPortfolio = () => {
    portfolioApi.list().then(setAllPortfolio);
  };
  useEffect(() => {
    reloadPortfolio();
  }, [resume.resume_id]);

  const getAttachments = (expId: number) =>
    allPortfolio.filter((f) => f.experience_id === expId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Опыт и проекты</CardTitle>
          <Button size="sm" onClick={() => setEditing('new')} className="gap-2">
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {resume.experiences.map((exp) => {
          const type = expTypes.find((t) => t.type_id === exp.type_id);
          const disc = disciplines.find((d) => d.discipline_id === exp.discipline_id);
          if (editing === exp.experience_id) {
            return (
              <ExperienceForm
                key={exp.experience_id}
                resumeId={resume.resume_id}
                positionName={resume.position.position_name}
                expTypes={expTypes}
                disciplines={disciplines}
                initial={exp}
                allPortfolio={allPortfolio}
                onPortfolioChanged={reloadPortfolio}
                onSaved={() => {
                  setEditing(null);
                  onUpdate();
                }}
                onCancel={() => setEditing(null)}
              />
            );
          }
          const attachments = getAttachments(exp.experience_id);
          return (
            <div
              key={exp.experience_id}
              className="rounded-md border p-3 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setEditing(exp.experience_id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium">{exp.project_name}</div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {type?.type_name}
                    {disc && ` · ${disc.discipline_name}`}
                  </div>
                  {exp.description && (
                    <div className="text-sm text-foreground/80 line-clamp-2">
                      {exp.description}
                    </div>
                  )}
                  {attachments.length > 0 && (
                    <AttachmentsPreview
                      attachments={attachments}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm('Удалить этот опыт?')) return;
                    await resumesApi.deleteExperience(resume.resume_id, exp.experience_id);
                    onUpdate();
                    reloadPortfolio();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {editing === 'new' && (
          <ExperienceForm
            resumeId={resume.resume_id}
            positionName={resume.position.position_name}
            expTypes={expTypes}
            disciplines={disciplines}
            allPortfolio={allPortfolio}
            onPortfolioChanged={reloadPortfolio}
            onSaved={() => {
              setEditing(null);
              onUpdate();
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

function isImage(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function AttachmentsPreview({
  attachments,
  onClick,
}: {
  attachments: PortfolioItem[];
  onClick?: (e: React.MouseEvent) => void;
}) {
  const images = attachments.filter((a) => isImage(a.file_name));
  const others = attachments.filter((a) => !isImage(a.file_name));

  return (
    <div className="mt-2 space-y-1.5 pt-2 border-t border-dashed" onClick={onClick}>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {images.map((img) => (
            <a
              key={img.portfolio_item_id}
              href={img.storage_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block w-14 h-14 rounded border overflow-hidden bg-muted hover:border-primary transition-colors"
              title={img.file_name}
            >
              <img src={img.storage_url} alt={img.file_name} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {others.map((f) => (
            <a
              key={f.portfolio_item_id}
              href={f.storage_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border bg-muted hover:bg-accent transition-colors"
              title={f.file_name}
            >
              <FileText className="h-3 w-3" />
              <span className="max-w-[120px] truncate">{f.file_name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperienceForm({
  resumeId,
  positionName,
  expTypes,
  disciplines,
  initial,
  onSaved,
  onCancel,
  allPortfolio,
  onPortfolioChanged,
}: {
  resumeId: number;
  positionName: string;
  expTypes: ExperienceType[];
  disciplines: Discipline[];
  initial?: {
    experience_id: number;
    project_name: string;
    description: string | null;
    type_id: number;
    discipline_id: number | null;
  };
  onSaved: () => void;
  onCancel: () => void;
  allPortfolio: PortfolioItem[];
  onPortfolioChanged: () => void;
}) {
  const [form, setForm] = useState({
    project_name: initial?.project_name || '',
    description: initial?.description || '',
    type_id: initial?.type_id || expTypes[0]?.type_id || 0,
    discipline_id: initial?.discipline_id ?? null,
  });
  const [aiVariants, setAiVariants] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const askAi = async () => {
    if (!form.description.trim()) return;
    setAiLoading(true);
    try {
      const res = await aiApi.improve({
        text: form.description,
        field_type: 'experience_description',
        target_position: positionName,
      });
      setAiVariants(res.variants);
    } catch (err: any) {
      alert('Ошибка ИИ: ' + (err.detail || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = {
        project_name: form.project_name,
        description: form.description || null,
        type_id: form.type_id,
        discipline_id: form.discipline_id,
      };
      if (initial) {
        await resumesApi.updateExperience(resumeId, initial.experience_id, data);
      } else {
        await resumesApi.addExperience(resumeId, data);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border-2 border-primary/30 bg-muted/30 p-3">
      <div className="space-y-1.5">
        <Label>Название проекта</Label>
        <Input
          value={form.project_name}
          onChange={(e) => setForm({ ...form, project_name: e.target.value })}
          placeholder="Курсовая работа — REST API на FastAPI"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Тип</Label>
          <Select
            value={form.type_id}
            onChange={(e) => setForm({ ...form, type_id: Number(e.target.value) })}
          >
            {expTypes.map((t) => (
              <option key={t.type_id} value={t.type_id}>
                {t.type_name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Дисциплина (необязательно)</Label>
          <Select
            value={form.discipline_id || ''}
            onChange={(e) =>
              setForm({
                ...form,
                discipline_id: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">— не указано —</option>
            {disciplines.map((d) => (
              <option key={d.discipline_id} value={d.discipline_id}>
                {d.discipline_name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Описание</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={askAi}
            disabled={aiLoading || !form.description.trim()}
            className="gap-1.5 text-xs"
          >
            {aiLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Помощь ИИ
          </Button>
        </div>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Опишите, что вы делали, какие технологии использовали, какой результат получили..."
          className="min-h-[100px]"
        />
      </div>

      {aiVariants && (
        <div className="space-y-2 rounded-md border bg-background p-3">
          <div className="text-xs font-medium text-muted-foreground">
            Варианты от ИИ — кликните, чтобы вставить:
          </div>
          {aiVariants.map((v, i) => (
            <button
              type="button"
              key={i}
              onClick={() => {
                setForm({ ...form, description: v });
                setAiVariants(null);
              }}
              className="block w-full text-left text-sm rounded p-2 hover:bg-accent border"
            >
              {v}
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAiVariants(null)}
            className="w-full text-xs"
          >
            Закрыть
          </Button>
        </div>
      )}

      {initial && (
        <AttachmentsEditor
          experienceId={initial.experience_id}
          allPortfolio={allPortfolio}
          onChanged={onPortfolioChanged}
        />
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Отмена
        </Button>
        <Button onClick={save} disabled={saving || !form.project_name} className="flex-1">
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
}

// Блок управления прикреплёнными файлами

function AttachmentsEditor({
  experienceId,
  allPortfolio,
  onChanged,
}: {
  experienceId: number;
  allPortfolio: PortfolioItem[];
  onChanged: () => void;
}) {
  const [picking, setPicking] = useState(false);

  const attached = allPortfolio.filter((f) => f.experience_id === experienceId);
  const available = allPortfolio.filter((f) => f.experience_id === null);

  const attach = async (itemId: number) => {
    await portfolioApi.attach(itemId, experienceId);
    setPicking(false);
    onChanged();
  };

  const detach = async (itemId: number) => {
    await portfolioApi.attach(itemId, null);
    onChanged();
  };

  return (
    <div className="rounded-md border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-xs font-medium">
          <Paperclip className="h-3.5 w-3.5" />
          Прикреплённые файлы из портфолио ({attached.length})
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPicking((p) => !p)}
          className="text-xs gap-1"
          disabled={available.length === 0}
        >
          <Plus className="h-3.5 w-3.5" />
          {picking ? 'Скрыть' : 'Прикрепить'}
        </Button>
      </div>

      {attached.length === 0 && !picking && (
        <div className="text-xs text-muted-foreground">
          Ни одного файла не прикреплено. Нажмите «Прикрепить», чтобы выбрать из портфолио.
          {available.length === 0 && (
            <span className="block mt-1 text-muted-foreground/70">
              Сначала загрузите файлы на странице «Портфолио».
            </span>
          )}
        </div>
      )}

      {attached.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attached.map((f) => (
            <div key={f.portfolio_item_id} className="relative group">
              {isImage(f.file_name) ? (
                <a
                  href={f.storage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-video rounded border overflow-hidden bg-muted"
                >
                  <img
                    src={f.storage_url}
                    alt={f.file_name}
                    className="w-full h-full object-cover"
                  />
                </a>
              ) : (
                <a
                  href={f.storage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-video rounded border bg-muted items-center justify-center px-2"
                >
                  <div className="flex flex-col items-center gap-1 text-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] truncate max-w-full">{f.file_name}</span>
                  </div>
                </a>
              )}
              <button
                type="button"
                onClick={() => detach(f.portfolio_item_id)}
                className="absolute top-1 right-1 bg-background/90 border rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Открепить"
              >
                <Unlink className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {picking && available.length > 0 && (
        <div className="border-t pt-2 mt-2">
          <div className="text-xs text-muted-foreground mb-1.5">
            Выберите файл из неприкреплённых:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {available.map((f) => (
              <button
                type="button"
                key={f.portfolio_item_id}
                onClick={() => attach(f.portfolio_item_id)}
                className="relative aspect-video rounded border bg-muted hover:border-primary transition-colors overflow-hidden"
                title={`Прикрепить ${f.file_name}`}
              >
                {isImage(f.file_name) ? (
                  <img src={f.storage_url} alt={f.file_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full px-2 gap-1">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] truncate max-w-full">{f.file_name}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Вкладка «Навыки»

function SkillsTab({
  resume,
  skills,
  categories,
  onUpdate,
  onCatalogRefresh,
}: {
  resume: ResumeDetail;
  skills: Skill[];
  categories: SkillCategory[];
  onUpdate: () => void;
  onCatalogRefresh: () => Promise<void>;
}) {
  const [selected, setSelected] = useState(
    resume.skills.map((s) => ({ skill_id: s.skill_id, skill_level: s.skill_level }))
  );
  const [saving, setSaving] = useState(false);

  // Форма «Добавить свой навык»
  const [customName, setCustomName] = useState('');
  const [customCategoryId, setCustomCategoryId] = useState<number>(
    categories[0]?.category_id || 0
  );
  const [customLevel, setCustomLevel] = useState('Средний');
  const [addingCustom, setAddingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number>(0);
  const [editError, setEditError] = useState<string | null>(null);

  const toggle = (skillId: number) => {
    if (selected.find((s) => s.skill_id === skillId)) {
      setSelected(selected.filter((s) => s.skill_id !== skillId));
    } else {
      setSelected([...selected, { skill_id: skillId, skill_level: 'Средний' }]);
    }
  };

  const setLevel = (skillId: number, level: string) => {
    setSelected(
      selected.map((s) => (s.skill_id === skillId ? { ...s, skill_level: level } : s))
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await resumesApi.setSkills(resume.resume_id, selected);
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const addCustomSkill = async () => {
    const name = customName.trim();
    if (!name) return;
    setCustomError(null);
    setAddingCustom(true);
    try {
      const newSkill = await skillsApi.create(name, customCategoryId);
      await onCatalogRefresh();
      const alreadySelected = selected.find((s) => s.skill_id === newSkill.skill_id);
      const updated = alreadySelected
        ? selected.map((s) =>
            s.skill_id === newSkill.skill_id ? { ...s, skill_level: customLevel } : s
          )
        : [...selected, { skill_id: newSkill.skill_id, skill_level: customLevel }];
      setSelected(updated);
      await resumesApi.setSkills(resume.resume_id, updated);
      onUpdate();
      setCustomName('');
    } catch (err: any) {
      setCustomError(err.detail || 'Не удалось добавить навык');
    } finally {
      setAddingCustom(false);
    }
  };

  // Открываем форму редактирования своего навыка
  const startEdit = (skill: Skill) => {
    setEditingSkillId(skill.skill_id);
    setEditName(skill.skill_name);
    setEditCategoryId(skill.category_id);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingSkillId(null);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (editingSkillId === null) return;
    const name = editName.trim();
    if (!name) {
      setEditError('Название не может быть пустым');
      return;
    }
    try {
      await skillsApi.update(editingSkillId, {
        skill_name: name,
        category_id: editCategoryId,
      });
      await onCatalogRefresh();
      onUpdate();
      setEditingSkillId(null);
    } catch (err: any) {
      setEditError(err.detail || 'Не удалось сохранить');
    }
  };

  const deleteCustom = async (skill: Skill) => {
    if (!confirm(`Удалить навык «${skill.skill_name}»? Он также удалится из всех ваших резюме.`)) {
      return;
    }
    try {
      await skillsApi.delete(skill.skill_id);
      setSelected((prev) => prev.filter((s) => s.skill_id !== skill.skill_id));
      await onCatalogRefresh();
      onUpdate();
    } catch (err: any) {
      alert(err.detail || 'Не удалось удалить');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Навыки</CardTitle>
          <Button size="sm" onClick={save} disabled={saving} className="gap-2">
            <Check className="h-4 w-4" />
            {saving ? 'Сохраняю...' : 'Сохранить'}
          </Button>
        </div>
        <CardDescription>
          Кликайте по навыкам, чтобы выбрать. Уровень — справа. Свои навыки помечены и
          их можно редактировать или удалить.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {categories.map((cat) => {
          const catSkills = skills.filter((s) => s.category_id === cat.category_id);
          if (catSkills.length === 0) return null;
          return (
            <div key={cat.category_id}>
              <div className="text-sm font-medium text-primary mb-2">{cat.category_name}</div>
              <div className="flex flex-wrap gap-1.5">
                {catSkills.map((skill) => {
                  const sel = selected.find((s) => s.skill_id === skill.skill_id);
                  const isEditing = editingSkillId === skill.skill_id;

                  if (isEditing) {
                    return (
                      <div
                        key={skill.skill_id}
                        className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 p-1"
                      >
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-sm w-44"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <Select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(Number(e.target.value))}
                          className="h-7 text-xs w-32"
                        >
                          {categories.map((c) => (
                            <option key={c.category_id} value={c.category_id}>
                              {c.category_name}
                            </option>
                          ))}
                        </Select>
                        <button
                          onClick={saveEdit}
                          className="p-1 rounded text-emerald-700 hover:bg-emerald-100"
                          title="Сохранить"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 rounded text-muted-foreground hover:bg-muted"
                          title="Отмена"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {editError && (
                          <span className="text-xs text-destructive ml-1">{editError}</span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={skill.skill_id} className="inline-flex items-center">
                      <button
                        onClick={() => toggle(skill.skill_id)}
                        className={`px-3 py-1 text-sm border transition-colors ${
                          skill.is_custom ? 'rounded-l-md' : 'rounded-l-md'
                        } ${
                          sel
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent border-border'
                        }`}
                        title={skill.is_custom ? 'Ваш навык' : undefined}
                      >
                        {skill.skill_name}
                        {skill.is_custom && (
                          <span
                            className={`ml-1.5 text-[10px] uppercase tracking-wide ${
                              sel ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            свой
                          </span>
                        )}
                      </button>
                      {sel && (
                        <select
                          value={sel.skill_level}
                          onChange={(e) => setLevel(skill.skill_id, e.target.value)}
                          className={`text-xs border-l-0 border h-[30px] px-1.5 bg-background ${
                            skill.is_custom ? '' : 'rounded-r-md'
                          }`}
                        >
                          {SKILL_LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      )}
                      {skill.is_custom && (
                        <>
                          <button
                            onClick={() => startEdit(skill)}
                            className="border border-l-0 h-[30px] px-1.5 bg-background hover:bg-accent text-muted-foreground"
                            title="Редактировать"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCustom(skill)}
                            className="border border-l-0 h-[30px] px-1.5 rounded-r-md bg-background hover:bg-destructive/10 text-destructive"
                            title="Удалить"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Блок «Добавить свой навык» */}
        <div className="border-t pt-4 space-y-2">
          <Label className="flex items-center gap-1.5 text-sm">
            <Plus className="h-3.5 w-3.5" />
            Добавить свой навык
          </Label>
          <div className="text-xs text-muted-foreground mb-2">
            Нет нужного навыка в списке? Добавьте его — появится в каталоге и сразу попадёт в резюме.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_140px_auto] gap-2">
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Название (например, Adobe Photoshop)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customName.trim() && !addingCustom) {
                  addCustomSkill();
                }
              }}
            />
            <Select
              value={customCategoryId}
              onChange={(e) => setCustomCategoryId(Number(e.target.value))}
            >
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </Select>
            <Select value={customLevel} onChange={(e) => setCustomLevel(e.target.value)}>
              {SKILL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
            <Button
              onClick={addCustomSkill}
              disabled={addingCustom || !customName.trim()}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {addingCustom ? 'Добавляю...' : 'Добавить'}
            </Button>
          </div>
          {customError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {customError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


function LanguagesTab({
  resume,
  catalog,
  onUpdate,
}: {
  resume: ResumeDetail;
  catalog: Language[];
  onUpdate: () => void;
}) {
  const [selected, setSelected] = useState(
    resume.languages.map((l) => ({ language_id: l.language_id, proficiency: l.proficiency }))
  );
  const [saving, setSaving] = useState(false);

  const addLanguage = (languageId: number) => {
    if (selected.find((l) => l.language_id === languageId)) return;
    setSelected([...selected, { language_id: languageId, proficiency: 'B2' }]);
  };

  const removeLanguage = (languageId: number) => {
    setSelected(selected.filter((l) => l.language_id !== languageId));
  };

  const setProficiency = (languageId: number, prof: string) => {
    setSelected(
      selected.map((l) => (l.language_id === languageId ? { ...l, proficiency: prof } : l))
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await resumesApi.setLanguages(resume.resume_id, selected);
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const available = catalog.filter((c) => !selected.find((s) => s.language_id === c.language_id));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Иностранные языки</CardTitle>
          <Button size="sm" onClick={save} disabled={saving} className="gap-2">
            <Check className="h-4 w-4" />
            {saving ? 'Сохраняю...' : 'Сохранить'}
          </Button>
        </div>
        <CardDescription>Выберите язык и уровень владения (A1–C2)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selected.length > 0 && (
          <div className="space-y-2">
            {selected.map((s) => {
              const lang = catalog.find((c) => c.language_id === s.language_id);
              return (
                <div
                  key={s.language_id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <div className="flex-1 font-medium">{lang?.language_name || '?'}</div>
                  <Select
                    value={s.proficiency}
                    onChange={(e) => setProficiency(s.language_id, e.target.value)}
                    className="w-24"
                  >
                    {LANGUAGE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLanguage(s.language_id)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {available.length > 0 ? (
          <div>
            <Label className="text-xs text-muted-foreground">Добавить язык:</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {available.map((lang) => (
                <button
                  key={lang.language_id}
                  onClick={() => addLanguage(lang.language_id)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-md border bg-background hover:bg-accent transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  {lang.language_name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          selected.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-6">
              Справочник языков пуст
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}


function ExportTab({ resume }: { resume: ResumeDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Экспорт резюме</CardTitle>
        <CardDescription>Скачайте готовый файл в нужном формате</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {(['pdf', 'docx'] as const).map((fmt) => {
          const url = fmt === 'pdf'
            ? exportApi.pdfUrl(resume.resume_id)
            : exportApi.docxUrl(resume.resume_id);
          return (
            <div
              key={fmt}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <div className="font-medium uppercase">{fmt}</div>
                <div className="text-xs text-muted-foreground">
                  {fmt === 'pdf'
                    ? 'Готовый PDF с оформлением и стилями'
                    : 'Редактируемый Word-документ'}
                </div>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <FileDown className="h-4 w-4" />
                Скачать
              </a>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
