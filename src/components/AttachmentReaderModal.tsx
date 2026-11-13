import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, FileSpreadsheet, FileText, X } from 'lucide-react';
import {
  formatFileSize,
  getFileBlob,
  type DisciplineAttachment,
} from '../utils/customContentStore';

interface AttachmentReaderModalProps {
  attachment: DisciplineAttachment | null;
  onClose: () => void;
}

export const AttachmentReaderModal: React.FC<AttachmentReaderModalProps> = ({
  attachment,
  onClose,
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'conteudo' | 'pdf-embed'>('conteudo');

  useEffect(() => {
    setActiveSheetIdx(0);
    setViewMode('conteudo');
    if (!attachment) {
      setObjectUrl(null);
      return;
    }

    let revoked = false;
    let createdUrl: string | null = null;
    getFileBlob(attachment.id).then((blob) => {
      if (!blob || revoked) return;
      createdUrl = URL.createObjectURL(blob);
      setObjectUrl(createdUrl);
    });

    return () => {
      revoked = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [attachment]);

  if (!attachment) return null;

  const isSpreadsheet = attachment.format === 'xls' || attachment.format === 'xlsx';
  const activeSheet = attachment.sheets?.[activeSheetIdx];

  const handleDownload = async () => {
    const blob = await getFileBlob(attachment.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attachment-reader-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white border border-[#E3E7DF] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E3E7DF] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono text-[#157A42]">
              <span className="uppercase font-bold">{attachment.format}</span>
              <span>·</span>
              <span>{formatFileSize(attachment.sizeBytes)}</span>
              {attachment.pageCount ? (
                <>
                  <span>·</span>
                  <span>{attachment.pageCount} páginas</span>
                </>
              ) : null}
            </div>
            <h2
              id="attachment-reader-title"
              className="mt-1 text-lg sm:text-xl font-bold text-[#1A241B] truncate"
            >
              {attachment.fileName}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {attachment.format === 'pdf' && objectUrl && (
              <button
                type="button"
                onClick={() =>
                  setViewMode((prev) => (prev === 'conteudo' ? 'pdf-embed' : 'conteudo'))
                }
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#F1F4EE] hover:bg-[#E4EAE0] text-xs font-semibold text-[#1A241B] cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#157A42]" aria-hidden="true" />
                <span>{viewMode === 'conteudo' ? 'Ver PDF Visual' : 'Ver Texto Extraído'}</span>
              </button>
            )}

            {objectUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#157A42] hover:bg-[#106134] text-xs font-semibold text-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Baixar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar leitor de arquivo"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#525B50] hover:bg-[#F1F4EE] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {attachment.format === 'pdf' && viewMode === 'pdf-embed' && objectUrl ? (
            <iframe
              title={`Visualizador PDF: ${attachment.fileName}`}
              src={objectUrl}
              className="w-full h-[65vh] rounded-xl border border-[#E3E7DF]"
            />
          ) : isSpreadsheet && attachment.sheets && attachment.sheets.length > 0 ? (
            <div className="space-y-4">
              {attachment.sheets.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {attachment.sheets.map((sheet, idx) => (
                    <button
                      key={sheet.sheetName}
                      type="button"
                      onClick={() => setActiveSheetIdx(idx)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        idx === activeSheetIdx
                          ? 'bg-[#157A42] text-white'
                          : 'bg-[#F1F4EE] text-[#4C564A] hover:text-[#1A241B]'
                      }`}
                    >
                      {sheet.sheetName}
                    </button>
                  ))}
                </div>
              )}

              {activeSheet && (
                <div className="overflow-x-auto border border-[#E3E7DF] rounded-xl">
                  <table className="w-full text-xs sm:text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F7F8F5] border-b border-[#E3E7DF]">
                        {activeSheet.rows[0]?.map((cell, colIdx) => (
                          <th
                            key={`h-${colIdx}`}
                            className="py-2.5 px-3 font-semibold text-[#1A241B] whitespace-nowrap"
                          >
                            {cell || `Coluna ${colIdx + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF1EB]">
                      {activeSheet.rows.slice(1).map((row, rIdx) => (
                        <tr key={`r-${rIdx}`} className="hover:bg-[#FAFBF9]">
                          {row.map((cell, cIdx) => (
                            <td key={`c-${rIdx}-${cIdx}`} className="py-2 px-3 text-[#2B362C]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#525B50]">
                {isSpreadsheet ? (
                  <FileSpreadsheet className="w-4 h-4 text-[#157A42]" aria-hidden="true" />
                ) : (
                  <FileText className="w-4 h-4 text-[#157A42]" aria-hidden="true" />
                )}
                <span>Conteúdo extraído do documento</span>
              </div>
              {attachment.extractedText ? (
                <pre className="whitespace-pre-wrap font-sans text-sm text-[#2B362C] leading-relaxed bg-[#F7F8F5] border border-[#E3E7DF] rounded-xl p-4 sm:p-5">
                  {attachment.extractedText}
                </pre>
              ) : (
                <p className="text-sm text-[#525B50]">
                  Não foi possível extrair texto automático deste arquivo (ele pode conter apenas imagens digitalizadas). Use o botão <strong>Baixar</strong> para abrir o original.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
