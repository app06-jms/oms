import { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Employee } from '@/features/schedule/scheduleRules';
import { parseScheduleWorkbook, type ScheduleImportResult } from '@/features/schedule/scheduleExcel';
import { upsertShiftAssignments } from '@/features/schedule/scheduleService';

interface ImportScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onImported: (importedCount: number) => Promise<void>;
}

export function ImportScheduleDialog({ open, onOpenChange, employees, onImported }: ImportScheduleDialogProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ScheduleImportResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canImport = result !== null && result.assignments.length > 0 && result.errors.length === 0 && !isImporting;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setFileName(null);
      setResult(null);
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    setIsParsing(true);
    try {
      setResult(await parseScheduleWorkbook(file, employees));
    } catch {
      setError('Không đọc được file. Vui lòng chọn file Excel (.xlsx) đúng định dạng.');
    } finally {
      setIsParsing(false);
    }
  }

  async function handleImport() {
    if (!result || !canImport) return;
    setIsImporting(true);
    setError(null);
    try {
      await upsertShiftAssignments(result.assignments);
      await onImported(result.assignments.length);
      handleOpenChange(false);
    } catch {
      setError('Không thể lưu lịch làm việc. Vui lòng thử lại.');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import lịch làm việc</DialogTitle>
          <DialogDescription>
            Chọn file Excel theo mẫu. Các ô để trống sẽ được giữ nguyên.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="schedule-file" className="text-sm font-medium text-foreground">
              File Excel (.xlsx)
            </Label>
            <label
              htmlFor="schedule-file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center transition-colors hover:border-primary hover:bg-muted"
            >
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {fileName ?? 'Nhấn để chọn file .xlsx'}
              </span>
              <span className="text-xs text-muted-foreground">Dùng file mẫu để đảm bảo đúng định dạng</span>
            </label>
            <input
              id="schedule-file"
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={(event) => void handleFileChange(event.target.files?.[0])}
            />
          </div>

          {isParsing && <p className="text-sm text-muted-foreground">Đang đọc file...</p>}

          {result && result.errors.length === 0 && result.assignments.length > 0 && (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Sẵn sàng nhập {result.assignments.length} ô lịch làm việc.
            </p>
          )}

          {result && result.assignments.length === 0 && result.errors.length === 0 && (
            <p className="text-sm text-muted-foreground">File không có ô ca nào để nhập.</p>
          )}

          {result && result.errors.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-error/40 bg-error/5 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-error">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Cần sửa {result.errors.length} lỗi trong file trước khi nhập.
              </p>
              <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-xs text-foreground">
                {result.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-md border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => void handleImport()} disabled={!canImport}>
            {isImporting ? 'Đang nhập...' : 'Nhập lịch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
