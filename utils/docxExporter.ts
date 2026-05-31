import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, NumberFormat, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';
import type { Document as TripDocument } from '@/types';

const FONT = '맑은 고딕';

const makeTitleParagraph = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text, font: FONT, size: 28, bold: true, color: '111827' })],
  });

const makeHeadingParagraph = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: '2563EB' })],
  });

const makeBodyParagraphs = (text: string): Paragraph[] =>
  text.split('\n').map((line) =>
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: line.replace(/\*\*/g, ''), font: FONT, size: 20, color: '111827', bold: line.includes('**') })],
    })
  );

const makeTable = (rows: string[][]): Table => {
  const colCount = Math.max(...rows.map(r => r.length), 1);
  // A4 본문 폭 기준 (여백 제외) ≈ 9360 twip. 각 열에 균등 배분
  const TABLE_WIDTH_DXA = 9360;
  const cellWidthDxa = Math.floor(TABLE_WIDTH_DXA / colCount);
  return new Table({
    width: { size: TABLE_WIDTH_DXA, type: WidthType.DXA },
    rows: rows.map((cells, ri) =>
      new TableRow({
        tableHeader: ri === 0,
        children: cells.map((cell) =>
          new TableCell({
            width: { size: cellWidthDxa, type: WidthType.DXA },
            shading: ri === 0 ? { type: ShadingType.CLEAR, fill: 'DBEAFE' } : { type: ShadingType.CLEAR, fill: 'FFFFFF' },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left:   { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right:  { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            children: [new Paragraph({
              alignment: ri === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
              children: [new TextRun({ text: cell.replace(/\*\*/g, ''), font: FONT, size: 18,
                bold: ri === 0 || cell.includes('**'), color: ri === 0 ? '1D4ED8' : '111827' })],
            })],
          })
        ),
      })
    ),
  });
};

const emptyLine = () => new Paragraph({ spacing: { after: 80 }, children: [] });

const buildChildren = (doc: TripDocument): (Paragraph | Table)[] => {
  const children: (Paragraph | Table)[] = [];
  const content = doc.content;
  if (!content) return children;
  children.push(makeTitleParagraph(content.title || doc.meta.title), emptyLine());
  content.sections.forEach((section) => {
    if (section.heading) children.push(makeHeadingParagraph(section.heading));

    if (section.tableData && section.tableData.length > 0) {
      children.push(makeTable(section.tableData), emptyLine());
    }

    if (section.body) {
      const lines = section.body.split('\n');
      let tableRows: string[][] = [];
      let textBuffer: string[] = [];

      const flushText = () => {
        if (textBuffer.length > 0) {
          children.push(...makeBodyParagraphs(textBuffer.join('\n')));
          textBuffer = [];
        }
      };

      const flushTable = () => {
        if (tableRows.length > 0) {
          children.push(makeTable(tableRows), emptyLine());
          tableRows = [];
        }
      };

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          flushText();
          if (trimmed.replace(/[|:\-\s]/g, '').length === 0) {
            continue; // separator line
          }
          tableRows.push(trimmed.split('|').slice(1, -1).map(c => c.trim()));
        } else {
          flushTable();
          textBuffer.push(line);
        }
      }
      flushText();
      flushTable();
      children.push(emptyLine());
    }
  });
  return children;
};

const makeHeader = (schoolName: string) =>
  new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: schoolName, font: FONT, size: 16, color: '6B7280' })] })] });

const makeFooter = () =>
  new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT] })] })] });

const pageMargins = { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1),
  left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) };

export const exportSingleDocx = async (tripDoc: TripDocument, schoolName: string): Promise<void> => {
  const doc = new Document({ sections: [{ properties: { page: { margin: pageMargins } },
    headers: { default: makeHeader(schoolName) }, footers: { default: makeFooter() },
    children: buildChildren(tripDoc) }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${tripDoc.meta.title.replace(/[\\/:*?"<>|]/g, '_')}.docx`);
};

export const exportAllDocx = async (tripDocs: TripDocument[], schoolName: string, zipName?: string): Promise<void> => {
  const JSZip = (await import('jszip')).default;
  const zip   = new JSZip();
  const folder = zip.folder('현장체험학습_서류') ?? zip;
  for (const tripDoc of tripDocs) {
    if (tripDoc.status !== 'done' || !tripDoc.content) continue;
    const doc = new Document({ sections: [{ properties: { page: { margin: pageMargins } },
      headers: { default: makeHeader(schoolName) }, footers: { default: makeFooter() },
      children: buildChildren(tripDoc) }] });
    const blob = await Packer.toBlob(doc);
    folder.file(`${String(tripDoc.meta.order).padStart(2,'0')}_${tripDoc.meta.title.replace(/[\\/:*?"<>|]/g, '_')}.docx`, blob);
  }
  saveAs(await zip.generateAsync({ type: 'blob' }), zipName ?? `현장체험학습_서류_${Date.now()}.zip`);
};
