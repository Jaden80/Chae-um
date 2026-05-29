import { Document } from '@/types';

/**
 * Document 객체를 K-에듀파인 기안문 본문에 붙여넣기 적합한 HTML 문자열로 변환합니다.
 */
export function generateEdufineHtml(doc: Document): string {
  if (!doc.content) return '';

  let html = `<div style="font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 15pt; color: #000; line-height: 1.6;">`;
  
  // 제목
  html += `<h2 style="font-size: 18pt; text-align: center; font-weight: bold; margin-bottom: 20px;">${doc.content.title}</h2>`;

  // 섹션 반복
  doc.content.sections.forEach((sec, idx) => {
    html += `<div style="margin-bottom: 15px;">`;
    html += `<h3 style="font-size: 15pt; font-weight: bold; margin-bottom: 8px;">${idx + 1}. ${sec.heading}</h3>`;
    
    if (sec.body) {
      const formattedBody = sec.body.replace(/\n/g, '<br/>');
      html += `<p style="font-size: 14pt; margin-bottom: 10px;">${formattedBody}</p>`;
    }

    if (sec.tableData && sec.tableData.length > 0) {
      html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 13pt;">`;
      sec.tableData.forEach((row, rowIdx) => {
        html += `<tr>`;
        row.forEach((cell) => {
          const isHeader = rowIdx === 0;
          const bgStyle = isHeader ? 'background-color: #f1f5f9; font-weight: bold; text-align: center;' : '';
          const tag = isHeader ? 'th' : 'td';
          html += `<${tag} style="border: 1px solid #000; padding: 6px 8px; ${bgStyle}">${cell}</${tag}>`;
        });
        html += `</tr>`;
      });
      html += `</table>`;
    }
    
    html += `</div>`;
  });

  html += `</div>`;
  return html;
}

/**
 * K-에듀파인 등 웹 에디터에서 테이블이나 서식이 깨지지 않도록 지원합니다.
 */
export async function copyHtmlToClipboard(htmlString: string): Promise<boolean> {
  try {
    const clipboardItem = new ClipboardItem({
      "text/html": new Blob([htmlString], { type: "text/html" }),
      "text/plain": new Blob([htmlString.replace(/<[^>]+>/g, '')], { type: "text/plain" }),
    });
    
    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    console.error("클립보드 복사 실패:", err);
    
    // Fallback for older browsers
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    document.body.appendChild(tempDiv);
    
    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    try {
      document.execCommand("copy");
      selection?.removeAllRanges();
      document.body.removeChild(tempDiv);
      return true;
    } catch (fallbackErr) {
      console.error("Fallback 클립보드 복사 실패:", fallbackErr);
      document.body.removeChild(tempDiv);
      return false;
    }
  }
}
