import { useRef, useCallback, useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileUp, Clock } from 'lucide-react';
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
 */
export function UploadButton({ onUploadSuccess }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, progress, error, upload, retryUpload, reset } = useUpload(onUploadSuccess);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reject oversized files locally, before any upload/backend call
      if (file.size > MAX_FILE_SIZE) {
        setValidationError('Arquivo muito grande (máx. 50 MB)');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setValidationError(null);
      await upload(file);
      // Reset the file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [upload]
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
      {/* Trigger Button */}
      <Dialog.Trigger asChild>
        <button
          id="upload-report-btn"
          className="btn-primary gap-2 text-sm"
          aria-label="Enviar relatório"
        >
          <Upload size={16} />
          Enviar Relatório
        </button>
      </Dialog.Trigger>

      {/* Modal */}
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" />

        {/* Content */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     w-full max-w-md glass-card p-6 shadow-2xl animate-slide-up
                     focus:outline-none"
          aria-describedby="upload-dialog-description"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">
                Enviar Relatório
              </Dialog.Title>
              <Dialog.Description
                id="upload-dialog-description"
                className="text-sm text-surface-400 mt-1"
              >
                Selecione um arquivo PDF, XML, CSV ou XLSX para enviar.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="btn-ghost p-1.5 -mt-1 -mr-1"
                disabled={isLoading}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Upload Zone / Status */}
          {status === 'idle' && !validationError && (
            <DropZone onPickFile={openPicker} />
          )}

          {status === 'idle' && validationError && (
            <ValidationErrorState message={validationError} onRetry={() => setValidationError(null)} />
          )}

          {(status === 'requesting' || status === 'uploading' || status === 'confirming') && (
            <ProgressState status={status} progress={progress} />
          )}

          {status === 'success' && (
            <SuccessState />
          )}

          {status === 'error' && (
            <ErrorState message={error} onRetry={reset} />
          )}

          {status === 'ttl-expired' && (
            <TtlExpiredState onRetry={retryUpload} />
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            id="upload-file-input"
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={handleFileChange}
            aria-hidden="true"
          />

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-700/30">
            <Dialog.Close asChild>
              <button
                className="btn-ghost text-sm px-4"
                disabled={isLoading}
              >
                {isDone ? 'Fechar' : 'Cancelar'}
              </button>
            </Dialog.Close>

            {status === 'idle' && (
              <button
                id="upload-select-btn"
                className="btn-primary text-sm"
                onClick={openPicker}
              >
                <FileUp size={16} />
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

function DropZone({ onPickFile }: { onPickFile: () => void }) {
  return (
    <button
      onClick={onPickFile}
      className="w-full border-2 border-dashed border-surface-600/60 rounded-xl p-10
                 flex flex-col items-center gap-3 cursor-pointer
                 hover:border-brand-500/50 hover:bg-brand-500/5
                 transition-all duration-300 group"
      aria-label="Clique para selecionar um arquivo"
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center
                      group-hover:bg-brand-500/20 transition-colors duration-300">
        <Upload size={26} className="text-brand-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-surface-300 group-hover:text-white transition-colors">
          Clique para selecionar
        </p>
        <p className="text-xs text-surface-500 mt-1">PDF, XML, CSV, XLSX &middot; máx. 50 MB</p>
      </div>
    </button>
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
    <div className="flex flex-col items-center gap-5 py-6">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center">
        <Loader2 size={26} className="text-brand-400 animate-spin" />
      </div>
      <div className="w-full space-y-2">
        <p className="text-sm text-surface-300 text-center">{label}</p>
        {status === 'uploading' && (
          <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle size={26} className="text-emerald-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">Upload concluído!</p>
        <p className="text-xs text-surface-400 mt-1">Arquivo enviado com sucesso.</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <AlertCircle size={26} className="text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">Falha no upload</p>
        {message && (
          <p className="text-xs text-red-400/80 mt-1 max-w-xs">{message}</p>
        )}
      </div>
      <button onClick={onRetry} className="btn-primary text-sm mt-1">
        <Upload size={15} />
        Tentar novamente
      </button>
    </div>
  );
}

function ValidationErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <AlertCircle size={26} className="text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">Arquivo inválido</p>
        <p className="text-xs text-red-400/80 mt-1 max-w-xs">{message}</p>
      </div>
      <button onClick={onRetry} className="btn-primary text-sm mt-1">
        <Upload size={15} />
        Tentar novamente
      </button>
    </div>
  );
}

function TtlExpiredState({ onRetry }: { onRetry: () => Promise<void> }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <Clock size={26} className="text-amber-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-amber-300">Tempo expirado — Tentar novamente</p>
        <p className="text-xs text-amber-400/80 mt-1 max-w-xs">
          O tempo para envio expirou. Tente novamente.
        </p>
      </div>
      <button
        id="upload-retry-btn"
        onClick={() => void onRetry()}
        className="btn-primary text-sm mt-1 border-amber-500/30 text-amber-300 hover:text-white"
      >
        <Clock size={15} />
        Tentar novamente
      </button>
    </div>
  );
}
