import { useRef, useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileUp, Clock } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useUpload } from '../../hooks';

interface UploadButtonProps {
  onUploadSuccess?: () => void;
}

const ACCEPTED_TYPES = '.pdf,.xml,.csv,.xlsx';
const MAX_FILE_SIZE = 52_428_800; // 50 MB

/**
 * Upload button that opens a Radix Dialog, lets the user pick a file, then
 * orchestrates the ephemeral-token upload flow (POST -> signed URL -> PUT -> confirm).
 * Phones get the dialog as a bottom sheet; wider screens get it centred.
 */
export function UploadButton({ onUploadSuccess }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, progress, error, upload, retryUpload, reset } = useUpload(onUploadSuccess);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Picked and dropped files share one path, so the size check runs before any upload/backend call either way.
  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        setValidationError('Arquivo muito grande (máx. 50 MB)');
        return;
      }
      setValidationError(null);
      await upload(file);
    },
    [upload]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleFile(file);
      // Reset the file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFile]
  );

  const openPicker = () => fileInputRef.current?.click();

  const isLoading = status === 'requesting' || status === 'uploading' || status === 'confirming';
  const isDone = status === 'success' || status === 'error' || status === 'ttl-expired';

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) {
          reset();
          setValidationError(null);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button id="upload-report-btn" type="button" className="btn-primary text-[15px]" aria-label="Enviar relatório">
          <Upload size={18} aria-hidden="true" />
          Enviar Relatório
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40 animate-fade-in" />

        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-card px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]
                     pt-6 shadow-dialog focus:outline-none max-sm:animate-sheet-in
                     sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md
                     sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7 sm:animate-dialog-in"
          aria-describedby="upload-dialog-description"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-extrabold text-ink">Enviar Relatório</Dialog.Title>
              <Dialog.Description id="upload-dialog-description" className="mt-1 text-sm text-ink-soft">
                Selecione um arquivo PDF, XML, CSV ou XLSX para enviar.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="btn-ghost -mr-2 -mt-1 h-10 w-10 shrink-0 p-0"
                disabled={isLoading}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {status === 'idle' && !validationError && (
            <DropZone onPickFile={openPicker} onDropFile={(file) => void handleFile(file)} />
          )}

          {status === 'idle' && validationError && (
            <ValidationErrorState message={validationError} onRetry={() => setValidationError(null)} />
          )}

          {(status === 'requesting' || status === 'uploading' || status === 'confirming') && (
            <ProgressState status={status} progress={progress} />
          )}

          {status === 'success' && <SuccessState />}

          {status === 'error' && <ErrorState message={error} onRetry={reset} />}

          {status === 'ttl-expired' && <TtlExpiredState onRetry={retryUpload} />}

          <input
            ref={fileInputRef}
            id="upload-file-input"
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={handleFileChange}
            aria-hidden="true"
          />

          <div className="mt-6 flex justify-end gap-3 border-t border-line pt-5">
            <Dialog.Close asChild>
              <button type="button" className="btn-secondary text-sm" disabled={isLoading}>
                {isDone ? 'Fechar' : 'Cancelar'}
              </button>
            </Dialog.Close>

            {status === 'idle' && (
              <button id="upload-select-btn" type="button" className="btn-primary text-sm" onClick={openPicker}>
                <FileUp size={16} aria-hidden="true" />
                Selecionar Arquivo
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* --- Sub-components --- */

function DropZone({ onPickFile, onDropFile }: { onPickFile: () => void; onDropFile: (file: File) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <button
      type="button"
      onClick={onPickFile}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) onDropFile(file);
      }}
      className={`group flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10
                  transition-colors duration-200 ease-out-expo hover:border-action hover:bg-action-soft/50 ${
                    isDragOver ? 'border-action bg-action-soft/60' : 'border-line bg-ground'
                  }`}
      aria-label="Clique para selecionar um arquivo"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-action shadow-card">
        <Upload size={24} aria-hidden="true" />
      </span>
      <span className="text-center">
        <span className="block text-[15px] font-bold text-ink">Clique para selecionar</span>
        {/* Touch browsers offer no file drag, so the hint only shows with a fine pointer. */}
        <span className="mt-1 hidden text-xs text-ink-soft [@media(pointer:fine)]:block">ou arraste o arquivo para cá</span>
        <span className="mt-2 block text-xs font-semibold text-ink-soft">PDF, XML, CSV, XLSX &middot; máx. 50 MB</span>
      </span>
    </button>
  );
}

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Upload progress drawn as a filling ring; requesting spins a short arc because no percentage exists yet. */
function ProgressRing({ status, progress }: { status: 'requesting' | 'uploading' | 'confirming'; progress: number }) {
  const filled = status === 'confirming' ? 100 : status === 'uploading' ? progress : 22;
  const offset = RING_CIRCUMFERENCE * (1 - filled / 100);

  return (
    <div
      className="relative h-28 w-28"
      role="progressbar"
      aria-label="Progresso do envio"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={status === 'requesting' ? undefined : filled}
    >
      <svg
        viewBox="0 0 112 112"
        className={`h-full w-full -rotate-90 ${status === 'requesting' ? 'animate-spin-slow' : ''}`}
        aria-hidden="true"
      >
        <circle cx="56" cy="56" r={RING_RADIUS} fill="none" strokeWidth="10" className="stroke-tile" />
        <circle
          cx="56"
          cy="56"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="stroke-action transition-[stroke-dashoffset] duration-500 ease-out-expo"
        />
      </svg>
      {status === 'uploading' && (
        <span
          className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold tabular-nums text-ink"
          aria-hidden="true"
        >
          {progress}
          <span className="text-sm">%</span>
        </span>
      )}
    </div>
  );
}

function ProgressState({
  status,
  progress,
}: {
  status: 'requesting' | 'uploading' | 'confirming';
  progress: number;
}) {
  const label =
    status === 'requesting'
      ? 'Obtendo token de upload...'
      : status === 'confirming'
      ? 'Confirmando upload...'
      : `Enviando arquivo... ${progress}%`;

  return (
    <div className="flex flex-col items-center gap-4 py-4" aria-live="polite">
      <ProgressRing status={status} progress={progress} />
      <p className="text-center text-sm font-bold text-ink">{label}</p>
    </div>
  );
}

function StateLayout({
  tone,
  icon,
  children,
}: {
  tone: 'ok' | 'danger' | 'warn';
  icon: ReactNode;
  children: ReactNode;
}) {
  const toneClasses = {
    ok: 'bg-ok-soft text-ok',
    danger: 'bg-danger-soft text-danger',
    warn: 'bg-warn-soft text-warn',
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center animate-fade-in" aria-live="polite">
      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${toneClasses[tone]}`} aria-hidden="true">
        {icon}
      </span>
      {children}
    </div>
  );
}

function SuccessState() {
  return (
    <StateLayout tone="ok" icon={<CheckCircle size={26} />}>
      <div>
        <p className="text-[15px] font-extrabold text-ink">Upload concluído!</p>
        <p className="mt-1 text-sm text-ink-soft">Arquivo enviado com sucesso.</p>
      </div>
    </StateLayout>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <StateLayout tone="danger" icon={<AlertCircle size={26} />}>
      <div>
        <p className="text-[15px] font-extrabold text-ink">Falha no upload</p>
        {message && <p className="mt-1 max-w-xs text-sm text-danger">{message}</p>}
      </div>
      <button type="button" onClick={onRetry} className="btn-primary text-sm">
        <Upload size={15} aria-hidden="true" />
        Tentar novamente
      </button>
    </StateLayout>
  );
}

function ValidationErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <StateLayout tone="danger" icon={<AlertCircle size={26} />}>
      <div>
        <p className="text-[15px] font-extrabold text-ink">Arquivo inválido</p>
        <p className="mt-1 max-w-xs text-sm text-danger">{message}</p>
      </div>
      <button type="button" onClick={onRetry} className="btn-primary text-sm">
        <Upload size={15} aria-hidden="true" />
        Tentar novamente
      </button>
    </StateLayout>
  );
}

function TtlExpiredState({ onRetry }: { onRetry: () => Promise<void> }) {
  return (
    <StateLayout tone="warn" icon={<Clock size={26} />}>
      <div>
        <p className="text-[15px] font-extrabold text-ink">Tempo expirado — Tentar novamente</p>
        <p className="mt-1 max-w-xs text-sm text-warn">O tempo para envio expirou. Tente novamente.</p>
      </div>
      <button id="upload-retry-btn" type="button" onClick={() => void onRetry()} className="btn-primary text-sm">
        <Clock size={15} aria-hidden="true" />
        Tentar novamente
      </button>
    </StateLayout>
  );
}
