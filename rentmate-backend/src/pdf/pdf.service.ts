import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'contracts');

  constructor() {
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Tạo hợp đồng PDF sau khi thanh toán thành công
   */
  async generateDepositContract(data: {
    contractCode: string;
    tenant: {
      id: number;
      fullName: string;
      email: string;
      phone: string;
      idNumber?: string;
      address?: string;
    };
    landlord: {
      id: number;
      fullName: string;
      email: string;
      phone: string;
      bankAccount?: string;
      bankName?: string;
    };
    property: {
      id: number;
      title: string;
      address: string;
      city: string;
      district: string;
      ward: string;
      area: number;
      bedrooms: number;
      bathrooms: number;
      price: number;
    };
    depositAmount: number;
    paymentMethod: 'momo' | 'vnpay' | 'bank_transfer';
    transactionId: string;
    paidAt: Date;
  }): Promise<{ filePath: string; fileName: string; url: string }> {
    try {
      this.logger.log(`Generating PDF contract: ${data.contractCode}`);

      // 1. Tạo HTML content
      const htmlContent = this.generateContractHTML(data);

      // 2. Tạo file path
      const fileName = `hop-dong-dat-coc-${data.contractCode}.pdf`;
      const filePath = path.join(this.uploadDir, fileName);

      // 3. Tạo PDF từ HTML
      await this.generatePDF(htmlContent, filePath);

      // 4. Trả về thông tin file
      return {
        filePath,
        fileName,
        url: `/api/contracts/download/${fileName}`
      };

    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Tạo HTML template cho hợp đồng
   */
  private generateContractHTML(data: any): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi });
    };

    const amountInWords = this.convertNumberToWords(data.depositAmount);

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hợp Đồng Đặt Cọc - ${data.contractCode}</title>
    <style>
        /* Reset và base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.5;
            color: #000;
            background: #fff;
            padding: 0;
            margin: 0;
            font-size: 13pt;
        }

        /* Page setup cho A4 */
        @page {
            size: A4;
            margin: 2cm;
        }

        .page {
            width: 21cm;
            min-height: 29.7cm;
            padding: 2cm;
            margin: 0 auto;
            position: relative;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px double #000;
        }

        .title {
            font-size: 18pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 14pt;
            font-style: italic;
            margin-bottom: 10px;
        }

        .contract-code {
            font-size: 12pt;
            font-weight: bold;
            color: #2c5282;
        }

        /* Content sections */
        .section {
            margin-bottom: 25px;
        }

        .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            text-transform: uppercase;
        }

        /* Parties info */
        .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        .party {
            border: 1px solid #ccc;
            padding: 20px;
            border-radius: 5px;
            background: #f9f9f9;
        }

        .party-title {
            font-weight: bold;
            font-size: 13pt;
            margin-bottom: 15px;
            color: #2d3748;
            text-align: center;
        }

        .info-item {
            margin-bottom: 8px;
            display: flex;
        }

        .info-label {
            min-width: 150px;
            font-weight: bold;
        }

        .info-value {
            flex: 1;
        }

        /* Property info */
        .property-info {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 30px;
        }

        /* Payment info */
        .payment-info {
            background: #f0fff4;
            border: 1px solid #9ae6b4;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .amount-highlight {
            font-size: 14pt;
            font-weight: bold;
            color: #2b6cb0;
            text-align: center;
            margin: 10px 0;
        }

        .amount-in-words {
            font-style: italic;
            color: #4a5568;
            text-align: center;
            margin-bottom: 15px;
        }

        /* Terms and conditions */
        .terms {
            margin-bottom: 30px;
        }

        .term-item {
            margin-bottom: 12px;
            text-align: justify;
        }

        .term-number {
            font-weight: bold;
            margin-right: 5px;
        }

        /* Signatures */
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 60px;
        }

        .signature-box {
            text-align: center;
        }

        .signature-title {
            font-weight: bold;
            margin-bottom: 40px;
            font-size: 13pt;
        }

        .signature-line {
            border-top: 1px solid #000;
            margin: 60px 0 15px;
        }

        .signature-name {
            font-weight: bold;
            margin-top: 5px;
        }

        /* Footer */
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10pt;
            color: #718096;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
        }

        /* Watermark */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            color: rgba(0, 0, 0, 0.05);
            z-index: -1;
            font-weight: bold;
            white-space: nowrap;
        }

        /* Verification */
        .verification {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #f7fafc;
            border: 1px dashed #cbd5e0;
            border-radius: 5px;
        }

        /* Responsive cho in ấn */
        @media print {
            body {
                font-size: 12pt;
            }

            .page {
                padding: 0;
                margin: 0;
                width: 100%;
                height: 100%;
            }

            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Watermark -->
        <div class="watermark">RENTMATE</div>

        <!-- Header -->
        <div class="header">
            <div class="title">HỢP ĐỒNG ĐẶT CỌC THUÊ NHÀ</div>
            <div class="subtitle">(Hợp đồng điện tử có giá trị pháp lý)</div>
            <div class="contract-code">Mã hợp đồng: ${data.contractCode}</div>
            <div>Ngày lập: ${formatDate(data.paidAt)}</div>
        </div>

        <!-- Các bên tham gia -->
        <div class="section">
            <div class="section-title">THÔNG TIN CÁC BÊN</div>
            <div class="parties">
                <!-- Bên cho thuê -->
                <div class="party">
                    <div class="party-title">BÊN CHO THUÊ (BÊN A)</div>
                    <div class="info-item">
                        <div class="info-label">Họ và tên:</div>
                        <div class="info-value">${data.landlord.fullName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Số điện thoại:</div>
                        <div class="info-value">${data.landlord.phone}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email:</div>
                        <div class="info-value">${data.landlord.email}</div>
                    </div>
                    ${data.landlord.bankAccount ? `
                    <div class="info-item">
                        <div class="info-label">Tài khoản ngân hàng:</div>
                        <div class="info-value">${data.landlord.bankAccount} - ${data.landlord.bankName}</div>
                    </div>
                    ` : ''}
                </div>

                <!-- Bên thuê -->
                <div class="party">
                    <div class="party-title">BÊN THUÊ (BÊN B)</div>
                    <div class="info-item">
                        <div class="info-label">Họ và tên:</div>
                        <div class="info-value">${data.tenant.fullName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Số điện thoại:</div>
                        <div class="info-value">${data.tenant.phone}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email:</div>
                        <div class="info-value">${data.tenant.email}</div>
                    </div>
                    ${data.tenant.idNumber ? `
                    <div class="info-item">
                        <div class="info-label">CMND/CCCD:</div>
                        <div class="info-value">${data.tenant.idNumber}</div>
                    </div>
                    ` : ''}
                    ${data.tenant.address ? `
                    <div class="info-item">
                        <div class="info-label">Địa chỉ:</div>
                        <div class="info-value">${data.tenant.address}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <!-- Thông tin tài sản -->
        <div class="property-info">
            <div class="section-title" style="margin-top: 0;">THÔNG TIN TÀI SẢN CHO THUÊ</div>
            <div class="info-item">
                <div class="info-label">Địa chỉ:</div>
                <div class="info-value">${data.property.address}, ${data.property.ward}, ${data.property.district}, ${data.property.city}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Loại tài sản:</div>
                <div class="info-value">${data.property.title}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Diện tích:</div>
                <div class="info-value">${data.property.area} m²</div>
            </div>
            <div class="info-item">
                <div class="info-label">Số phòng ngủ:</div>
                <div class="info-value">${data.property.bedrooms}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Số phòng tắm:</div>
                <div class="info-value">${data.property.bathrooms}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Giá thuê/tháng:</div>
                <div class="info-value">${formatCurrency(data.property.price)}</div>
            </div>
        </div>

        <!-- Thông tin thanh toán -->
        <div class="payment-info">
            <div class="section-title" style="margin-top: 0;">THÔNG TIN ĐẶT CỌC</div>

            <div class="amount-highlight">
                Số tiền đặt cọc: ${formatCurrency(data.depositAmount)}
            </div>

            <div class="amount-in-words">
                (Bằng chữ: ${amountInWords})
            </div>

            <div class="info-item">
                <div class="info-label">Phương thức thanh toán:</div>
                <div class="info-value">
                    ${data.paymentMethod === 'momo' ? 'Ví điện tử MoMo' :
                      data.paymentMethod === 'vnpay' ? 'VNPay' :
                      'Chuyển khoản ngân hàng'}
                </div>
            </div>

            <div class="info-item">
                <div class="info-label">Mã giao dịch:</div>
                <div class="info-value">${data.transactionId}</div>
            </div>

            <div class="info-item">
                <div class="info-label">Thời gian thanh toán:</div>
                <div class="info-value">${formatDate(data.paidAt)}</div>
            </div>

            <div class="info-item">
                <div class="info-label">Trạng thái:</div>
                <div class="info-value" style="color: #38a169; font-weight: bold;">
                    ✓ Đã thanh toán thành công
                </div>
            </div>
        </div>

        <!-- Điều khoản và điều kiện -->
        <div class="terms">
            <div class="section-title">ĐIỀU KHOẢN VÀ ĐIỀU KIỆN</div>

            <div class="term-item">
                <span class="term-number">Điều 1:</span>
                Bên B đồng ý đặt cọc số tiền ${formatCurrency(data.depositAmount)} để giữ chỗ thuê tài sản nêu trên
                trong thời hạn 07 (bảy) ngày làm việc kể từ ngày ký hợp đồng này.
            </div>

            <div class="term-item">
                <span class="term-number">Điều 2:</span>
                Bên A cam kết không cho người khác thuê, chuyển nhượng hoặc thực hiện bất kỳ giao dịch nào liên quan đến tài sản
                trong thời gian Bên B đặt cọc.
            </div>

            <div class="term-item">
                <span class="term-number">Điều 3:</span>
                Điều kiện hoàn trả tiền cọc:
                <div style="margin-left: 20px; margin-top: 5px;">
                    <div>a) Nếu Bên B hủy đặt cọc trước 24 giờ: Hoàn 100% tiền cọc.</div>
                    <div>b) Nếu Bên B hủy đặt cọc sau 24 giờ: Hoàn 50% tiền cọc.</div>
                    <div>c) Nếu đã ký hợp đồng thuê chính thức: Tiền cọc được chuyển thành tiền cọc theo hợp đồng thuê.</div>
                </div>
            </div>

            <div class="term-item">
                <span class="term-number">Điều 4:</span>
                Nếu Bên A vi phạm điều 2 và không thể giao tài sản cho Bên B:
                Bên A phải hoàn trả 200% số tiền đặt cọc cho Bên B.
            </div>

            <div class="term-item">
                <span class="term-number">Điều 5:</span>
                Tiền cọc sẽ được khấu trừ vào tiền thuê tháng đầu tiên khi ký hợp đồng thuê chính thức.
            </div>

            <div class="term-item">
                <span class="term-number">Điều 6:</span>
                Hợp đồng này có hiệu lực kể từ thời điểm thanh toán thành công và có giá trị pháp lý như hợp đồng giấy.
            </div>

            <div class="term-item">
                <span class="term-number">Điều 7:</span>
                Mọi tranh chấp phát sinh từ hợp đồng này sẽ được giải quyết thông qua thương lượng.
                Nếu không thương lượng được, sẽ đưa ra Tòa án có thẩm quyền tại nơi có tài sản.
            </div>
        </div>

        <!-- Xác thực -->
        <div class="verification">
            <div style="font-weight: bold; margin-bottom: 10px;">MÃ XÁC THỰC HỢP ĐỒNG</div>
            <div style="font-family: monospace; font-size: 11pt; letter-spacing: 1px; margin: 10px 0;">
                ${this.generateVerificationCode(data)}
            </div>
            <div style="font-size: 10pt; color: #718096;">
                Sử dụng mã này để xác thực hợp đồng trên hệ thống RentMate
            </div>
        </div>

        <!-- Chữ ký -->
        <div class="signatures">
            <div class="signature-box">
                <div class="signature-title">BÊN CHO THUÊ<br>(BÊN A)</div>
                <div class="signature-line"></div>
                <div style="margin-top: 5px; font-size: 11pt;">(Ký, ghi rõ họ tên)</div>
                <div class="signature-name">${data.landlord.fullName}</div>
            </div>

            <div class="signature-box">
                <div class="signature-title">BÊN THUÊ<br>(BÊN B)</div>
                <div class="signature-line"></div>
                <div style="margin-top: 5px; font-size: 11pt;">(Ký, ghi rõ họ tên)</div>
                <div class="signature-name">${data.tenant.fullName}</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div>Hợp đồng được tạo tự động bởi hệ thống RentMate</div>
            <div>Địa chỉ hệ thống: https://rentmate.example.com</div>
            <div>Hotline: 1900 1234 • Email: support@rentmate.com</div>
            <div style="margin-top: 10px; font-size: 9pt;">
                Hợp đồng điện tử được ký số có giá trị pháp lý theo Luật Giao dịch điện tử 2005
            </div>
        </div>
    </div>

    <!-- Nút in (chỉ hiện trên web) -->
    <div class="no-print" style="position: fixed; bottom: 20px; right: 20px;">
        <button onclick="window.print()" style="
            background: #2b6cb0;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12pt;
        ">
            🖨️ In hợp đồng
        </button>
    </div>

    <script>
        // Thêm số trang nếu cần
        window.onload = function() {
            if (window.location.href.includes('print')) {
                window.print();
            }
        };
    </script>
</body>
</html>`;
  }

  /**
   * Tạo PDF từ HTML sử dụng Puppeteer
   */
  private async generatePDF(htmlContent: string, outputPath: string): Promise<void> {
    let browser;

    try {
      // Launch browser với các options
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote'
          ],
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        });

      const page = await browser.newPage();

      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Set viewport
      await page.setViewport({
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height
        deviceScaleFactor: 2 // Higher quality
      });

      // Generate PDF
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '40px',
          right: '40px',
          bottom: '40px',
          left: '40px'
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true
      });

      this.logger.log(`PDF generated successfully: ${outputPath}`);

    } catch (error) {
      this.logger.error('Error generating PDF with Puppeteer:', error);

      // Fallback: Ghi HTML ra file nếu không tạo được PDF
      const htmlPath = outputPath.replace('.pdf', '.html');
      fs.writeFileSync(htmlPath, htmlContent);
      this.logger.log(`Fallback: HTML saved to ${htmlPath}`);

      throw error;

    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Chuyển số thành chữ (Tiếng Việt)
   */
  private convertNumberToWords(num: number): string {
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
    const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    const thousands = ['', 'nghìn', 'triệu', 'tỷ'];

    if (num === 0) return 'không đồng';

    let result = '';
    let number = Math.abs(num);
    let groupIndex = 0;

    while (number > 0) {
      const group = number % 1000;
      if (group > 0) {
        let groupWords = '';
        const hundreds = Math.floor(group / 100);
        const remainder = group % 100;

        if (hundreds > 0) {
          groupWords += ones[hundreds] + ' trăm ';
        }

        if (remainder > 0) {
          if (hundreds > 0 && remainder < 10) {
            groupWords += 'lẻ ';
          }

          if (remainder < 10) {
            groupWords += ones[remainder];
          } else if (remainder < 20) {
            groupWords += teens[remainder - 10];
          } else {
            const ten = Math.floor(remainder / 10);
            const one = remainder % 10;
            groupWords += tens[ten];
            if (one > 0) {
              groupWords += ' ' + (one === 1 ? 'mốt' : one === 5 ? 'lăm' : ones[one]);
            }
          }
        }

        groupWords = groupWords.trim();
        if (thousands[groupIndex]) {
          groupWords += ' ' + thousands[groupIndex];
        }

        result = groupWords + ' ' + result;
      }

      number = Math.floor(number / 1000);
      groupIndex++;
    }

    result = result.trim();

    // Xử lý số âm
    if (num < 0) {
      result = 'âm ' + result;
    }

    return result + ' đồng';
  }

  /**
   * Tạo mã xác thực
   */
  private generateVerificationCode(data: any): string {
    const str = `${data.contractCode}-${data.transactionId}-${data.paidAt.getTime()}`;
    const hash = Buffer.from(str).toString('base64');
    return hash.substring(0, 16).toUpperCase();
  }

  /**
   * Xóa file PDF cũ
   */
  async deleteContractFile(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`Deleted contract file: ${filePath}`);
    }
  }

  /**
   * Lấy danh sách contract files
   */
  listContractFiles(): string[] {
    if (!fs.existsSync(this.uploadDir)) {
      return [];
    }
    return fs.readdirSync(this.uploadDir).filter(file => file.endsWith('.pdf'));
  }
}
