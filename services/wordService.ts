
/**
 * Xuất file Word hỗ trợ bảng biểu phức tạp và định dạng chuẩn văn bản hành chính
 */
export const downloadAsFile = (content: string, filename: string) => {
  const isHtml = content.trim().startsWith('<table') || content.trim().startsWith('<div');
  
  const htmlHeader = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${filename}</title>
    <style>
      body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.3; text-align: justify; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
      th, td { border: 1px solid black; padding: 5px; text-align: center; font-size: 11pt; }
      .text-left { text-align: left; }
      .bold { font-weight: bold; }
      .center { text-align: center; }
      .uppercase { text-transform: uppercase; }
      @page { size: 21cm 29.7cm; margin: 2cm 2cm 2cm 2.5cm; }
    </style>
    </head><body>
  `;
  const htmlFooter = "</body></html>";
  
  let bodyContent = content;

  if (!isHtml) {
    // Dọn dẹp Markdown và các tiêu đề không mong muốn
    bodyContent = bodyContent
      .replace(/[\*\#]+/g, '') // Xóa sạch dấu * và #
      .split('\n')
      .filter(line => {
        const upperLine = line.toUpperCase();
        return !upperLine.includes('UBND HUYỆN') && !upperLine.includes('PHÒNG GIÁO DỤC');
      })
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '<br/>';
        
        // Giả định các dòng viết hoa toàn bộ là tiêu đề
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 5) {
          return `<p class="center bold uppercase">${trimmed}</p>`;
        }
        return `<p>${trimmed}</p>`;
      })
      .join('');
  }

  const fullHtml = htmlHeader + bodyContent + htmlFooter;
  
  const blob = new Blob(['\ufeff', fullHtml], {
    type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
