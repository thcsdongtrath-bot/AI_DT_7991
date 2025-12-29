
import { GoogleGenAI, Type } from "@google/genai";
import { ExamConfig, ExamResult, ScopeType } from "../types";

export const generateExamContent = async (config: ExamConfig): Promise<ExamResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const prompt = `
    Bạn là chuyên gia khảo thí tại Trường THCS Đông Trà. Hãy soạn bộ hồ sơ đề kiểm tra bám sát 100% MẪU HÌNH ẢNH (4 tầng header) cho:
    - Môn: ${config.subject}, Lớp: ${config.grade}
    - Phạm vi: ${config.scopeType === ScopeType.TOPIC ? config.specificTopic : config.scopeType}
    - Thời gian: ${config.duration}, Thang điểm: ${config.scale}

    YÊU CẦU CẤU TRÚC HTML CHO MA TRẬN (18 CỘT - 4 TẦNG HEADER):
    Header phải có cấu trúc rowspan/colspan như sau:
    - Tầng 1: TT (rowspan=4), Chủ đề (rowspan=4), Nội dung (rowspan=4), Mức độ đánh giá (colspan=12), Tổng (colspan=3, rowspan=2), Tỉ lệ % điểm (rowspan=4).
    - Tầng 2: TNKQ (colspan=9), Tự luận (colspan=3).
    - Tầng 3 (Dưới TNKQ): Nhiều lựa chọn (colspan=3), Đúng-Sai (colspan=3), Trả lời ngắn (colspan=3). 
    - Tầng 3 (Dưới Tự luận): Biết (rowspan=2), Hiểu (rowspan=2), Vận dụng (rowspan=2).
    - Tầng 3 (Dưới Tổng): Biết (rowspan=2), Hiểu (rowspan=2), Vận dụng (rowspan=2).
    - Tầng 4 (Dưới Nhiều lựa chọn/Đúng-sai/Trả lời ngắn): Biết, Hiểu, Vận dụng (mỗi loại 3 cột).

    DÒNG TỔNG KẾT MA TRẬN:
    1. Tổng số câu: Thống kê cho từng cột mức độ.
    2. Tổng số điểm: Thống kê điểm cho từng cột mức độ.
    3. Tỉ lệ %: Tính % cho từng mức độ.

    YÊU CẦU BẢNG ĐẶC TẢ:
    - Header tương tự như ma trận nhưng thêm cột "Yêu cầu cần đạt" (rowspan=4).
    - Nội dung bám sát chương trình GDPT 2018.

    YÊU CẦU ĐỀ THI & ĐÁP ÁN:
    - Trình bày sạch sẽ, font Times New Roman, không có các ký tự Markdown (*, #).
    - Không có tiêu đề hành chính "UBND...", chỉ bắt đầu bằng "TRƯỜNG THCS ĐÔNG TRÀ".

    ĐỊNH DẠNG TRẢ VỀ:
    - Trả về JSON với các thuộc tính: matrix (HTML), specTable (HTML), examPaper (Text), answerKey (Text).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    if (!response.text) throw new Error("AI không phản hồi.");

    let text = response.text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    }

    return JSON.parse(text) as ExamResult;
  } catch (e: any) {
    console.error("Gemini Error:", e);
    const msg = e.message || "";
    if (msg.includes("404") || msg.includes("entity was not found")) throw new Error("AUTH_REQUIRED");
    throw new Error(`Lỗi kỹ thuật: ${msg.substring(0, 60)}`);
  }
};
