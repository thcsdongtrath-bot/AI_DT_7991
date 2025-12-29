
export enum Subject {
  TOAN = 'Toán',
  VAN = 'Ngữ văn',
  ANH = 'Tiếng Anh',
  TIN = 'Tin học',
  KHTN = 'Khoa học tự nhiên',
  LICH_SU = 'Lịch sử',
  DIA_LI = 'Địa lí',
  GDCD = 'Giáo dục công dân',
  CONG_NGHE = 'Công nghệ',
  NGHE_THUAT = 'Âm nhạc & Mỹ thuật',
  GDTC = 'Giáo dục thể chất'
}

export enum Grade {
  G6 = 'Lớp 6',
  G7 = 'Lớp 7',
  G8 = 'Lớp 8',
  G9 = 'Lớp 9'
}

export enum Duration {
  M45 = '45 phút',
  M60 = '60 phút',
  M90 = '90 phút'
}

export enum Scale {
  S10 = '10 điểm',
  S5 = '5 điểm'
}

export enum ScopeType {
  HK1 = 'Học kì I',
  HK2 = 'Học kì II',
  TOPIC = 'Theo chủ đề'
}

export enum SchoolYear {
  Y24_25 = '2024 - 2025',
  Y25_26 = '2025 - 2026'
}

export interface ExamConfig {
  subject: string;
  grade: string;
  school: string;
  duration: string;
  scale: string;
  scopeType: ScopeType;
  schoolYear: SchoolYear;
  specificTopic?: string;
}

export interface ExamResult {
  matrix: string;
  specTable: string;
  examPaper: string;
  answerKey: string;
}
