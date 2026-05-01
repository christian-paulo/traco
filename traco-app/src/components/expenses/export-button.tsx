'use client';

import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  generateFinancialReportExcel,
  generateFinancialReportPDF,
} from '@/server/actions/exports';

type Props = {
  from: string;
  to: string;
};

function downloadBase64File(base64: string, filename: string, mimeType: string) {
  const byteCharacters = atob(base64);
  const bytes = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    bytes[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ from, to }: Props) {
  const [pending, startTransition] = useTransition();

  function handlePdf() {
    startTransition(async () => {
      const r = await generateFinancialReportPDF({ from, to });
      if (r.success) {
        downloadBase64File(r.data.base64, r.data.filename, 'application/pdf');
        toast.success('PDF gerado.');
      } else {
        toast.error(r.error);
      }
    });
  }

  function handleExcel() {
    startTransition(async () => {
      const r = await generateFinancialReportExcel({ from, to });
      if (r.success) {
        downloadBase64File(
          r.data.base64,
          r.data.filename,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        toast.success('Planilha gerada.');
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="h-11" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Exportar
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={handlePdf} disabled={pending}>
          <FileText className="size-4" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExcel} disabled={pending}>
          <FileSpreadsheet className="size-4" />
          Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
