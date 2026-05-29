import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import type { Document as TripDocument } from '@/types';

const PAGE_W = 595.28, PAGE_H = 841.89, ML = 60, MR = 60, MT = 60;
const CW = PAGE_W - ML - MR;

const C = {
  primary: rgb(0.145, 0.388, 0.922), text: rgb(0.067, 0.094, 0.153),
  sub:     rgb(0.420, 0.447, 0.502), border: rgb(0.820, 0.835, 0.859),
  bg:      rgb(0.937, 0.965, 1.000), white: rgb(1, 1, 1),
};

const buildPdf = async (tripDoc: TripDocument, schoolName: string): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const bold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const reg    = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MT;

  const addPage = () => { page = pdfDoc.addPage([PAGE_W, PAGE_H]); y = PAGE_H - MT; };
  const ensureSpace = (n: number) => { if (y - n < 60) addPage(); };

  const drawText = (text: string, x: number, size: number, font = reg, color = C.text) => {
    page.drawText(text.substring(0, 80), { x, y, size, font, color });
  };

  // 헤더
  page.drawText(schoolName, { x: PAGE_W - MR - reg.widthOfTextAtSize(schoolName, 8), y: PAGE_H - 30, size: 8, font: reg, color: C.sub });

  const content = tripDoc.content;
  if (!content) return pdfDoc.save();

  // 제목
  ensureSpace(40);
  const tw = bold.widthOfTextAtSize(content.title || tripDoc.meta.title, 16);
  page.drawText(content.title || tripDoc.meta.title, { x: (PAGE_W - tw) / 2, y, size: 16, font: bold, color: C.text });
  y -= 32;

  // 섹션
  for (const section of content.sections) {
    if (section.heading) {
      ensureSpace(28);
      page.drawRectangle({ x: ML, y: y - 2, width: CW, height: 22, color: C.bg });
      page.drawText(section.heading.substring(0, 50), { x: ML + 6, y: y + 4, size: 11, font: bold, color: C.primary });
      y -= 22;
    }
    if (section.tableData && section.tableData.length > 0) {
      for (let ri = 0; ri < section.tableData.length; ri++) {
        ensureSpace(20);
        const row  = section.tableData[ri];
        const colW = CW / row.length;
        page.drawRectangle({ x: ML, y: y - 14, width: CW, height: 18, color: ri === 0 ? C.bg : C.white });
        row.forEach((cell, ci) => {
          page.drawRectangle({ x: ML + ci * colW, y: y - 14, width: colW, height: 18, borderColor: C.border, borderWidth: 0.5 });
          page.drawText(cell.substring(0, 15), { x: ML + ci * colW + 4, y: y - 9, size: 8, font: ri === 0 ? bold : reg, color: ri === 0 ? C.primary : C.text });
        });
        y -= 18;
      }
      y -= 8;
    } else if (section.body) {
      const lines = section.body.split('\n');
      for (const line of lines) {
        ensureSpace(14);
        if (line.trim()) page.drawText(line.substring(0, 90), { x: ML, y, size: 9, font: reg, color: C.text });
        y -= 13;
      }
      y -= 4;
    }
  }
  return pdfDoc.save();
};

export const exportSinglePdf = async (tripDoc: TripDocument, schoolName: string): Promise<void> => {
  const bytes = await buildPdf(tripDoc, schoolName);
  saveAs(new Blob([bytes.buffer], { type: 'application/pdf' }), `${tripDoc.meta.title.replace(/[\\/:*?"<>|]/g, '_')}.pdf`);
};

export const exportAllPdf = async (tripDocs: TripDocument[], schoolName: string, zipName?: string): Promise<void> => {
  const JSZip = (await import('jszip')).default;
  const zip   = new JSZip();
  const folder = zip.folder('현장체험학습_서류') ?? zip;
  for (const d of tripDocs) {
    if (d.status !== 'done' || !d.content) continue;
    const bytes = await buildPdf(d, schoolName);
    folder.file(`${String(d.meta.order).padStart(2,'0')}_${d.meta.title.replace(/[\\/:*?"<>|]/g, '_')}.pdf`, bytes);
  }
  saveAs(await zip.generateAsync({ type: 'blob' }), zipName ?? `현장체험학습_서류_${Date.now()}.zip`);
};

export const exportDocuments = async (tripDocs: TripDocument[], format: 'pdf' | 'docx', schoolName: string, single?: TripDocument): Promise<void> => {
  const { exportSingleDocx, exportAllDocx } = await import('./docxExporter');
  const done = tripDocs.filter((d) => d.status === 'done');
  if (single) {
    if (format === 'pdf')  return exportSinglePdf(single, schoolName);
    if (format === 'docx') return exportSingleDocx(single, schoolName);
  }
  if (format === 'pdf')  return exportAllPdf(done, schoolName);
  if (format === 'docx') return exportAllDocx(done, schoolName);
};
