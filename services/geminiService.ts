import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AuditStandard, AuditQuestion, AuditSession } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

// Static Questions for Permendiktisaintek No. 39/2025
const PERMENDIKTI_QUESTIONS = [
  // A. Kebijakan dan Tata Pamong
  { id: 'A.1', category: 'A. Kebijakan & Tata Pamong', questionText: 'Apakah kebijakan SPMI telah diperbarui sesuai Permendiktisaintek No. 39/2025?' },
  { id: 'A.2', category: 'A. Kebijakan & Tata Pamong', questionText: 'Apakah visi, misi, tujuan, dan sasaran unit selaras dengan strategi universitas?' },
  { id: 'A.3', category: 'A. Kebijakan & Tata Pamong', questionText: 'Apakah struktur organisasi unit mencerminkan akuntabilitas dan fungsi yang efektif?' },
  { id: 'A.4', category: 'A. Kebijakan & Tata Pamong', questionText: 'Apakah keputusan penting unit terdokumentasi dan mengikuti SOP yang berlaku?' },
  { id: 'A.5', category: 'A. Kebijakan & Tata Pamong', questionText: 'Bagaimana mekanisme evaluasi kinerja unit dilakukan setiap tahun?' },
  { id: 'A.6', category: 'A. Kebijakan & Tata Pamong', questionText: 'Apakah unit memiliki risk register dan mekanisme mitigasi risiko mutu?' },

  // B. Kurikulum dan Pembelajaran
  { id: 'B.1', category: 'B. Kurikulum & Pembelajaran', questionText: 'Apakah kurikulum disusun/review mengacu pada SN-Dikti dan fleksibilitas regulasi terbaru?' },
  { id: 'B.2', category: 'B. Kurikulum & Pembelajaran', questionText: 'Apakah standar kompetensi lulusan (CPL) jelas, terukur, dan dikaitkan dengan kebutuhan industri?' },
  { id: 'B.3', category: 'B. Kurikulum & Pembelajaran', questionText: 'Apakah RPS tersedia untuk semua mata kuliah dan diperbarui secara berkala?' },
  { id: 'B.4', category: 'B. Kurikulum & Pembelajaran', questionText: 'Apakah dosen melaksanakan perkuliahan sesuai rencana pembelajaran yang ditetapkan?' },
  { id: 'B.5', category: 'B. Kurikulum & Pembelajaran', questionText: 'Apakah kehadiran dan aktivitas pembelajaran tercatat dan terdokumentasi (termasuk daring)?' },
  { id: 'B.6', category: 'B. Kurikulum & Pembelajaran', questionText: 'Apakah evaluasi hasil pembelajaran (assessment) sesuai dengan CPL dan rubrik yang jelas?' },
  { id: 'B.7', category: 'B. Kurikulum & Pembelajaran', questionText: 'Apakah mahasiswa memperoleh pengalaman belajar di luar kelas (magang, proyek, RPL) sesuai standar?' },
  { id: 'B.8', category: 'B. Kurikulum & Pembelajaran', questionText: 'Apakah monitoring perkuliahan dilakukan secara rutin (awal–tengah–akhir semester)?' },
  { id: 'B.9', category: 'B. Kurikulum & Pembelajaran', questionText: 'Bagaimana sistem penjaminan integritas akademik (plagiarisme, kehadiran, penilaian) dijalankan?' },
  { id: 'B.10', category: 'B. Kurikulum & Pembelajaran', questionText: 'Apakah hasil evaluasi perkuliahan mahasiswa (EPM/Evaluasi Dosen) ditindaklanjuti?' },

  // C. Penelitian
  { id: 'C.1', category: 'C. Penelitian', questionText: 'Apakah roadmap penelitian dosen jelas dan selaras dengan fokus keilmuan prodi/unit?' },
  { id: 'C.2', category: 'C. Penelitian', questionText: 'Apakah pengajuan proposal penelitian mengikuti pedoman yang berlaku?' },
  { id: 'C.3', category: 'C. Penelitian', questionText: 'Apakah jumlah dan mutu penelitian dosen memenuhi target kinerja unit?' },
  { id: 'C.4', category: 'C. Penelitian', questionText: 'Apakah proses monitoring penelitian terdokumentasi (progres, laporan, luaran)?' },
  { id: 'C.5', category: 'C. Penelitian', questionText: 'Apakah publikasi ilmiah, HKI, atau paten dosen terdokumentasi sebagai bukti luaran?' },
  { id: 'C.6', category: 'C. Penelitian', questionText: 'Apakah tersedia pendanaan internal atau dukungan eksternal untuk kegiatan penelitian?' },

  // D. Pengabdian kepada Masyarakat
  { id: 'D.1', category: 'D. PkM', questionText: 'Apakah roadmap PkM tersedia dan selaras dengan kompetensi keilmuan prodi?' },
  { id: 'D.2', category: 'D. PkM', questionText: 'Apakah kegiatan PkM dosen sesuai target kinerja tahunan?' },
  { id: 'D.3', category: 'D. PkM', questionText: 'Apakah dokumentasi PkM (proposal, laporan, luaran) lengkap dan terdigitalisasi?' },
  { id: 'D.4', category: 'D. PkM', questionText: 'Apakah ada kolaborasi PkM dengan mitra eksternal?' },
  { id: 'D.5', category: 'D. PkM', questionText: 'Bagaimana evaluasi dampak PkM dilakukan dan ditindaklanjuti?' },

  // E. Mahasiswa dan Alumni
  { id: 'E.1', category: 'E. Mahasiswa & Alumni', questionText: 'Apakah mekanisme layanan kemahasiswaan (akademik dan non-akademik) berjalan efektif?' },
  { id: 'E.2', category: 'E. Mahasiswa & Alumni', questionText: 'Apakah kegiatan minat dan bakat mahasiswa difasilitasi dengan baik?' },
  { id: 'E.3', category: 'E. Mahasiswa & Alumni', questionText: 'Apakah ada layanan konseling akademik/karir yang terukur efektivitasnya?' },
  { id: 'E.4', category: 'E. Mahasiswa & Alumni', questionText: 'Apakah data tracer study alumni diperbarui setiap tahun?' },
  { id: 'E.5', category: 'E. Mahasiswa & Alumni', questionText: 'Apakah tingkat kelulusan tepat waktu sesuai target dan dianalisis?' },
  { id: 'E.6', category: 'E. Mahasiswa & Alumni', questionText: 'Apakah ada pelibatan alumni dalam pengembangan kurikulum atau kegiatan unit?' },

  // F. Sumber Daya Manusia (Dosen & Tendik)
  { id: 'F.1', category: 'F. SDM', questionText: 'Apakah kualifikasi akademik dosen memenuhi ketentuan DIKTI?' },
  { id: 'F.2', category: 'F. SDM', questionText: 'Apakah beban kerja dosen (BKD/EWMP) sesuai aturan dan terdokumentasi?' },
  { id: 'F.3', category: 'F. SDM', questionText: 'Apakah dosen dan tendik memperoleh pelatihan peningkatan kompetensi secara rutin?' },
  { id: 'F.4', category: 'F. SDM', questionText: 'Apakah penilaian kinerja dosen dilakukan secara sistematis per semester/tahun?' },
  { id: 'F.5', category: 'F. SDM', questionText: 'Apakah jumlah dosen dan tendik mencukupi kebutuhan operasional unit?' },
  { id: 'F.6', category: 'F. SDM', questionText: 'Apakah proses rekrutmen dosen/tendik mengikuti standar mutu dan aturan DIKTI?' },

  // G. Sarana, Prasarana, dan Keuangan
  { id: 'G.1', category: 'G. Sarpras & Keuangan', questionText: 'Apakah sarana dan prasarana pembelajaran (kelas, lab, IT) memenuhi standar minimal?' },
  { id: 'G.2', category: 'G. Sarpras & Keuangan', questionText: 'Apakah sarana penelitian dan PkM memadai untuk menunjang kegiatan akademik?' },
  { id: 'G.3', category: 'G. Sarpras & Keuangan', questionText: 'Apakah perencanaan anggaran (RBA/RKAT) sesuai prioritas mutu unit?' },
  { id: 'G.4', category: 'G. Sarpras & Keuangan', questionText: 'Apakah realisasi anggaran dimonitor secara berkala dan akuntabel?' },
  { id: 'G.5', category: 'G. Sarpras & Keuangan', questionText: 'Apakah pemeliharaan sarpras dilaksanakan dan didokumentasikan secara rutin?' },
  { id: 'G.6', category: 'G. Sarpras & Keuangan', questionText: 'Apakah inventaris aset unit lengkap, diperbarui, dan diverifikasi secara berkala?' },

  // H. SPMI (Penjaminan Mutu Internal) – PPEPP
  { id: 'H.1', category: 'H. SPMI (PPEPP)', questionText: 'Apakah semua standar SPMI (pendidikan, penelitian, PkM, SDM, keuangan, sarpras) telah ditetapkan secara resmi?' },
  { id: 'H.2', category: 'H. SPMI (PPEPP)', questionText: 'Apakah pelaksanaan standar SPMI dijalankan sesuai SOP masing-masing proses?' },
  { id: 'H.3', category: 'H. SPMI (PPEPP)', questionText: 'Apakah unit secara rutin melakukan evaluasi pelaksanaan standar (monev internal)?' },
  { id: 'H.4', category: 'H. SPMI (PPEPP)', questionText: 'Apakah hasil evaluasi dianalisis dan menghasilkan rekomendasi peningkatan mutu?' },
  { id: 'H.5', category: 'H. SPMI (PPEPP)', questionText: 'Apakah tindak lanjut hasil audit sebelumnya (temuan minor/major/OFI) telah diselesaikan?' },
];

/**
 * Generates a specific checklist based on the accreditation standard.
 */
export const generateChecklist = async (standard: AuditStandard, department: string): Promise<AuditQuestion[]> => {
  
  // If the standard is Permendiktisaintek 2025, use the static list directly
  if (standard === AuditStandard.PERMENDIKTISAINTEK_2025) {
    return PERMENDIKTI_QUESTIONS.map(q => ({
      ...q,
      compliance: null,
      evidence: "",
      auditorNotes: ""
    }));
  }

  const prompt = `
    You are a Senior Quality Assurance Auditor for Higher Education in Indonesia.
    Generate a specialized Audit Checklist for a study program in the department of "${department}".
    The checklist must be strictly based on the "${standard}" accreditation framework.
    
    Generate exactly 5 high-impact, specific audit questions/indicators that are critical for this standard.
    Focus on "Outcome Based Education" (OBE) and recent quality trends.
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "A unique short code for the question (e.g., C.1.a)" },
        category: { type: Type.STRING, description: "The criteria or standard dimension (e.g., Kurikulum, SDM, Sarana)" },
        questionText: { type: Type.STRING, description: "The specific audit question or indicator to check." },
      },
      required: ["id", "category", "questionText"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a helpful, professional, and strict academic auditor."
      },
    });

    const rawData = JSON.parse(response.text || "[]");
    
    // Hydrate with default empty fields for the app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rawData.map((item: any) => ({
      ...item,
      compliance: null,
      evidence: "",
      auditorNotes: ""
    }));

  } catch (error) {
    console.error("Error generating checklist:", error);
    throw new Error("Failed to generate audit checklist from Gemini.");
  }
};

/**
 * Analyzes the audit results and produces a report.
 */
export const generateAuditReport = async (audit: AuditSession): Promise<{ summary: string; recommendations: string[] }> => {
  
  // Filter relevant data to send to LLM to save tokens
  const auditContext = {
    standard: audit.standard,
    department: audit.department,
    findings: audit.questions.map(q => ({
      category: q.category,
      question: q.questionText,
      result: q.compliance,
      notes: q.auditorNotes,
      evidence: q.evidence
    }))
  };

  const prompt = `
    Analyze the following Internal Quality Audit (AMI) results for the "${audit.department}" department using standard "${audit.standard}".
    
    Data: ${JSON.stringify(auditContext)}
    
    Please provide:
    1. An executive summary of the audit performance (max 100 words).
    2. A list of 3 specific, actionable strategic recommendations to improve their accreditation score.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "Executive summary of findings." },
      recommendations: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of strategic recommendations." 
      }
    },
    required: ["summary", "recommendations"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Use flash for speed on analysis
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      summary: result.summary || "No summary generated.",
      recommendations: result.recommendations || []
    };

  } catch (error) {
    console.error("Error generating report:", error);
    throw new Error("Failed to analyze audit results.");
  }
};