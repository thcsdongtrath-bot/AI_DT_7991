
// Ensure the GoogleGenAI instance is created right before making the API call
import { GoogleGenAI, Type } from "@google/genai";
import { ExamConfig, ExamResult, ScopeType } from "../types";

export const generateExamContent = async (config: ExamConfig): Promise<ExamResult> => {
  // Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) directly before making a request.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
    1. Dòng: TỔNG SỐ CÂU (Thống kê số câu).
    2. Dòng: TỔNG SỐ ĐIỂM (Thống kê điểm số, ngay dưới dòng Tổng số câu).
    3. Dòng: TỈ LỆ % (Thống kê tỉ lệ %).

    ĐỊNH DẠNG TRẢ VỀ PHẢI LÀ JSON CHUẨN.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matrix: { type: Type.STRING },
            specTable: { type: Type.STRING },
            examPaper: { type: Type.STRING },
            answerKey: { type: Type.STRING },
          },
          required: ["matrix", "specTable", "examPaper", "answerKey"],
        },
      },
    });

    let text = response.text || '';
    
    // Xử lý trường hợp AI bọc JSON trong Markdown ```json ... ```
    if (text.includes('```')) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const result = JSON.parse(text);
    return result as ExamResult;
  } catch (e: any) {
    console.error("Gemini Error:", e);
    
    // Check for "Requested entity was not found" error as specified in the guidelines
    if (e.message?.includes("Requested entity was not found") || e.message?.includes("404")) {
      throw new Error("AUTH_REQUIRED");
    }
    
    throw new Error("Không thể tạo nội dung. Vui lòng kiểm tra kết nối hoặc thử lại.");
  }
};
