
import { GoogleGenAI, Type } from "@google/genai";
import { ExamConfig, ExamResult, ScopeType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateExamContent = async (config: ExamConfig): Promise<ExamResult> => {
  const prompt = `
    Bạn là chuyên gia khảo thí tại Trường THCS Đông Trà. Hãy soạn bộ hồ sơ đề kiểm tra chuẩn mực cho:
    - Môn: ${config.subject}, Lớp: ${config.grade}
    - Phạm vi: ${config.scopeType === ScopeType.TOPIC ? config.specificTopic : config.scopeType}
    - Thời gian: ${config.duration}, Thang điểm: ${config.scale}
    - Đơn vị: ${config.school}

    YÊU CẦU QUAN TRỌNG VỀ ĐỊNH DẠNG: 
    1. TUYỆT ĐỐI KHÔNG ghi các dòng tiêu đề hành chính cấp trên như "UBND HUYỆN...", "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO...". 
    2. Phần đầu đề thi và đáp án chỉ bắt đầu trực tiếp từ tên trường: "${config.school.toUpperCase()}".
    3. KHÔNG sử dụng các ký tự Markdown (*, #). Sử dụng văn bản hành chính thuần túy.

    YÊU CẦU CẤU TRÚC MA TRẬN (STRICT TEMPLATE):
    Bảng ma trận phải có cấu trúc header tầng nấc như sau:
    - Hàng 1: TT, Chủ đề/chương, Nội dung/đơn vị kiến thức, Mức độ đánh giá (colspan=12), Tổng (colspan=3), Tỉ lệ % điểm.
    - Hàng 2 (dưới Mức độ đánh giá): TNKQ (colspan=9), Tự luận (colspan=3), Biết (dưới Tổng), Hiểu (dưới Tổng), Vận dụng (dưới Tổng).
    - Hàng 3 (dưới TNKQ): Nhiều lựa chọn (colspan=3), Đúng-Sai (colspan=3), Trả lời ngắn (colspan=3), Biết (dưới Tự luận), Hiểu (dưới Tự luận), Vận dụng (dưới Tự luận).
    - Hàng 4 (dưới cùng): Biết, Hiểu, Vận dụng (lặp lại cho từng cột Nhiều lựa chọn, Đúng-Sai, Trả lời ngắn).

    YÊU CẦU CÁC DÒNG TỔNG KẾT (CUỐI BẢNG MA TRẬN):
    Bắt buộc phải có đủ 3 dòng cuối cùng:
    1. Dòng: TỔNG SỐ CÂU (Thống kê số câu theo từng cột mức độ).
    2. Dòng: TỔNG SỐ ĐIỂM (Thống kê điểm số theo từng cột mức độ, ngay dưới dòng Tổng số câu).
    3. Dòng: TỈ LỆ % (Thống kê tỉ lệ % theo các mức độ nhận thức Biết/Hiểu/Vận dụng).

    YÊU CẦU CẤU TRÚC BẢNG ĐẶC TẢ:
    - Các cột: TT, Chủ đề/chương, Nội dung/đơn vị kiến thức, Yêu cầu cần đạt, Mức độ đánh giá (Cấu trúc cột Mức độ đánh giá giống hệt Ma trận bên trên, cũng phải có 3 dòng tổng kết ở cuối).

    CẤU TRÚC ĐỀ THI:
    - 70% Trắc nghiệm - 30% Tự luận.
    - Phải có đủ 3 dạng TN: MCQ (A/B/C/D), Đúng-Sai (4 ý), Trả lời ngắn.
    - Tự luận tập trung vận dụng thực tiễn.

    ĐỊNH DẠNG TRẢ VỀ:
    - 'matrix' và 'specTable': Mã HTML <table> với border="1", sử dụng rowspan và colspan chính xác để khớp mẫu.
    - 'examPaper': Đề thi thuần văn bản.
    - 'answerKey': Đáp án thuần văn bản.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matrix: { type: Type.STRING, description: "HTML table for matrix with Total Questions and Total Score rows" },
          specTable: { type: Type.STRING, description: "HTML table for specification with Total Questions and Total Score rows" },
          examPaper: { type: Type.STRING },
          answerKey: { type: Type.STRING },
        },
        required: ["matrix", "specTable", "examPaper", "answerKey"],
      },
    },
  });

  try {
    const text = response.text || '{}';
    const result = JSON.parse(text);
    return result as ExamResult;
  } catch (e) {
    console.error("Lỗi parse JSON:", e);
    throw new Error("Không thể tạo nội dung đề thi. Vui lòng thử lại.");
  }
};
