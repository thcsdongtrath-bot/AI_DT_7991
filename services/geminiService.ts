
import { GoogleGenAI, Type } from "@google/genai";
import { ExamConfig, ExamResult, ScopeType } from "../types";

export const generateExamContent = async (config: ExamConfig): Promise<ExamResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("AUTH_REQUIRED");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Bạn là chuyên gia khảo thí của TRƯỜNG THCS ĐÔNG TRÀ. Hãy soạn bộ hồ sơ đề kiểm tra CHUẨN 100% THEO CÔNG VAV 7991 cho:
    - Môn: ${config.subject}, Lớp: ${config.grade}
    - Năm học: ${config.schoolYear}
    - Phạm vi: ${config.scopeType === ScopeType.TOPIC ? config.specificTopic : config.scopeType}
    - Thời gian: ${config.duration}, Thang điểm: ${config.scale}

    YÊU CẦU CHI TIẾT CHO TỪNG PHẦN:

    1. MA TRẬN (HTML):
    - Cấu trúc 4 tầng header, 19 cột. 
    - Phải có 3 dòng cuối: Tổng số câu, Tổng số điểm, Tỉ lệ %.
    - Phân bổ: Nhận biết (~40%), Thông hiểu (~30%), Vận dụng (~20%), Vận dụng cao (~10%).

    2. BẢNG ĐẶC TẢ (HTML):
    - Khớp hoàn toàn với Ma trận về số câu và nội dung kiến thức.
    - Cột "Yêu cầu cần đạt" phải chi tiết theo chương trình 2018.

    3. ĐỀ KIỂM TRA (Text):
    - Tiêu đề: TRƯỜNG THCS ĐÔNG TRÀ - ĐỀ KIỂM TRA ${config.scopeType.toUpperCase()} - NĂM HỌC ${config.schoolYear}.
    - Cấu trúc: 
        + Phần I. Trắc nghiệm (Nhiều lựa chọn, Đúng-Sai, Trả lời ngắn).
        + Phần II. Tự luận.
    - Không sử dụng Markdown (*, #).

    4. ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM (Text):
    - PHẢI CÓ ĐỦ 2 PHẦN:
        + A. ĐÁP ÁN TRẮC NGHIỆM: Trình bày dạng bảng (Câu - Đáp án - Điểm).
        + B. HƯỚNG DẪN CHẤM TỰ LUẬN: Chia theo từng bước giải, mỗi bước tương ứng với số điểm cụ thể (0.25đ, 0.5đ...).
    - Khớp 100% với đề thi đã ra.

    YÊU CẦU ĐỊNH DẠNG TRẢ VỀ:
    - Trả về JSON với các thuộc tính: matrix, specTable, examPaper, answerKey.
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

    const parsed = JSON.parse(text);
    if (!parsed.answerKey || parsed.answerKey.length < 10) {
      throw new Error("Phần đáp án bị thiếu hoặc quá ngắn. Vui lòng thử lại.");
    }

    return parsed as ExamResult;
  } catch (e: any) {
    console.error("Gemini Error:", e);
    if (e.message === "AUTH_REQUIRED") throw e;
    throw new Error(`Lỗi hệ thống: ${e.message.substring(0, 150)}`);
  }
};
