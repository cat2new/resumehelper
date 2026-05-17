import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, ExternalLink, Loader2, FileText } from 'lucide-react';
import { portfolioApi } from '@/api';
import type { PortfolioItem } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/index';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
function isImage(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setLoading(true);
    portfolioApi
      .list()
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      await portfolioApi.upload(file);
      refresh();
    } catch (err: any) {
      setError(err.detail || 'Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить файл?')) return;
    await portfolioApi.delete(id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Цифровое портфолио</h1>
          <p className="text-sm text-muted-foreground">
            Все файлы в одном месте; их можно прикреплять к опыту в резюме
          </p>
        </div>
        <Button onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-2">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Загрузить файл
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">Загрузите файлы — они появятся здесь</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.portfolio_item_id} className="overflow-hidden flex flex-col">
              {/* Превью — большое, по всей ширине карточки */}
              <a
                href={item.storage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-muted/50 border-b hover:opacity-90 transition-opacity"
                title="Открыть в новой вкладке"
              >
                {isImage(item.file_name) ? (
                  <img
                    src={item.storage_url}
                    alt={item.file_name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FileText className="h-16 w-16 opacity-40" />
                    <span className="text-xs font-medium uppercase">
                      {item.file_name.split('.').pop() || 'файл'}
                    </span>
                  </div>
                )}
              </a>

              <CardContent className="flex-1 p-4 space-y-3">
                <div>
                  <div className="font-medium text-sm break-words leading-tight">
                    {item.file_name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatSize(item.file_size)}
                    {item.experience_id && (
                      <span className="ml-2 inline-flex items-center gap-1 text-primary">
                        · прикреплён к опыту
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={item.storage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Просмотр файла
                  </a>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(item.portfolio_item_id)}
                    className="h-9 w-9 flex-shrink-0"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Явный URL под кнопкой — на случай, если ссылка понадобится скопировать */}
                <div className="text-[10px] text-muted-foreground break-all leading-tight font-mono bg-muted/40 px-2 py-1 rounded">
                  {item.storage_url}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
