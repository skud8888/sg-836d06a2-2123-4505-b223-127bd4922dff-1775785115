import { supabase } from "@/integrations/supabase/client";

export const certificateService = {
  /**
   * Generate unique certificate number
   */
  generateCertificateNumber: (): string => {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `CERT-${year}-${random}`;
  },

  /**
   * Generate verification code
   */
  generateVerificationCode: (): string => {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  },

  /**
   * Create certificate for course completion
   */
  createCertificate: async (studentId: string, courseTemplateId: string) => {
    try {
      // Get student and course details
      const { data: student } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", studentId)
        .single();

      const { data: course } = await supabase
        .from("course_templates")
        .select("name, duration_hours")
        .eq("id", courseTemplateId)
        .single();

      if (!student || !course) {
        throw new Error("Student or course not found");
      }

      // Get default certificate template
      const { data: template } = await supabase
        .from("certificate_templates")
        .select("*")
        .eq("is_default", true)
        .single();

      const certificateNumber = certificateService.generateCertificateNumber();
      const verificationCode = certificateService.generateVerificationCode();

      // Create certificate record
      const { data: certificate, error } = await supabase
        .from("certificates")
        .insert({
          student_id: studentId,
          course_template_id: courseTemplateId,
          certificate_number: certificateNumber,
          completion_date: new Date().toISOString().split('T')[0],
          verification_code: verificationCode,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Generate PDF (simplified - would use jsPDF or similar in production)
      // For now, we'll create a simple HTML certificate
      const certificateHTML = certificateService.generateCertificateHTML({
        studentName: student.full_name || student.email,
        courseName: course.name,
        completionDate: new Date().toLocaleDateString(),
        certificateNumber: certificateNumber,
        duration: course.duration_hours,
        template: template
      });

      return {
        certificate,
        html: certificateHTML
      };

    } catch (error) {
      console.error("Error creating certificate:", error);
      throw error;
    }
  },

  /**
   * Generate certificate HTML
   */
  generateCertificateHTML: (data: {
    studentName: string;
    courseName: string;
    completionDate: string;
    certificateNumber: string;
    duration: number;
    template: any;
  }): string => {
    const { studentName, courseName, completionDate, certificateNumber, duration, template } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: landscape; margin: 0; }
          body { 
            font-family: ${template?.font_family || 'serif'}; 
            margin: 0; 
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .certificate {
            background: white;
            border: 20px solid ${template?.color_scheme?.primary || '#1a365d'};
            padding: 60px;
            text-align: center;
            box-shadow: 0 0 30px rgba(0,0,0,0.3);
            max-width: 1000px;
            margin: 0 auto;
          }
          .header {
            color: ${template?.color_scheme?.primary || '#1a365d'};
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 4px;
          }
          .presented-to {
            font-size: 20px;
            color: #666;
            margin-bottom: 15px;
            font-style: italic;
          }
          .student-name {
            font-size: 56px;
            color: ${template?.color_scheme?.accent || '#d4af37'};
            font-weight: bold;
            margin: 30px 0;
            border-bottom: 3px solid ${template?.color_scheme?.secondary || '#2c5282'};
            padding-bottom: 20px;
          }
          .body-text {
            font-size: 20px;
            line-height: 1.8;
            color: #333;
            margin: 40px 0;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }
          .course-name {
            font-weight: bold;
            color: ${template?.color_scheme?.primary || '#1a365d'};
            font-size: 24px;
          }
          .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid ${template?.color_scheme?.secondary || '#2c5282'};
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .signature {
            text-align: left;
          }
          .signature-line {
            border-top: 2px solid #333;
            width: 200px;
            margin-top: 40px;
            padding-top: 10px;
            font-size: 14px;
          }
          .certificate-number {
            text-align: right;
            font-size: 14px;
            color: #666;
          }
          .seal {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: ${template?.color_scheme?.accent || '#d4af37'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 14px;
            margin: 0 auto 20px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="seal">CERTIFIED</div>
          
          <div class="header">
            ${template?.header_text || 'Certificate of Completion'}
          </div>
          
          <div class="presented-to">
            This certificate is proudly presented to
          </div>
          
          <div class="student-name">
            ${studentName}
          </div>
          
          <div class="body-text">
            For successfully completing the course
            <div class="course-name">${courseName}</div>
            consisting of ${duration} hours of comprehensive training,
            demonstrating dedication, skill, and professional excellence.
          </div>
          
          <div class="body-text" style="font-size: 18px; color: #666;">
            Completed on ${completionDate}
          </div>
          
          <div class="footer">
            <div class="signature">
              <div class="signature-line">
                Authorized Signature
              </div>
            </div>
            
            <div class="certificate-number">
              Certificate #${certificateNumber}
              <br/>
              ${template?.footer_text || 'Issued by Training Centre'}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Get student certificates
   */
  getStudentCertificates: async (studentId: string) => {
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        *,
        course_templates (
          name,
          duration_hours
        )
      `)
      .eq("student_id", studentId)
      .order("issue_date", { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Verify certificate by number
   */
  verifyCertificate: async (certificateNumber: string) => {
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        course_templates (
          name,
          duration_hours
        )
      `)
      .eq("certificate_number", certificateNumber)
      .eq("status", "active")
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Revoke certificate
   */
  revokeCertificate: async (certificateId: string) => {
    const { error } = await supabase
      .from("certificates")
      .update({ status: "revoked" })
      .eq("id", certificateId);

    if (error) throw error;
  }
};