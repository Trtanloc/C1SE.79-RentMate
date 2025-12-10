import { Controller, Get, Param, Res, HttpStatus, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { PdfService } from './pdf.service';
import * as fs from 'fs';

@Controller('api/contracts')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * Tải hợp đồng PDF
   */
  @Get('download/:filename')
  downloadContract(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response
  ): StreamableFile {
    const filePath = join(process.cwd(), 'uploads', 'contracts', filename);

    if (!fs.existsSync(filePath)) {
      res.status(HttpStatus.NOT_FOUND).json({ error: 'File not found' });
      return;
    }

    // Set headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': fs.statSync(filePath).size.toString()
    });

    const file = createReadStream(filePath);
    return new StreamableFile(file);
  }

  /**
   * Xem trực tiếp PDF trong trình duyệt
   */
  @Get('view/:filename')
  viewContract(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response
  ): StreamableFile {
    const filePath = join(process.cwd(), 'uploads', 'contracts', filename);

    if (!fs.existsSync(filePath)) {
      res.status(HttpStatus.NOT_FOUND).json({ error: 'File not found' });
      return;
    }

    // Set headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': fs.statSync(filePath).size.toString()
    });

    const file = createReadStream(filePath);
    return new StreamableFile(file);
  }

  /**
   * Kiểm tra file tồn tại
   */
  @Get('check/:contractCode')
  checkContractExists(@Param('contractCode') contractCode: string) {
    const fileName = `hop-dong-dat-coc-${contractCode}.pdf`;
    const filePath = join(process.cwd(), 'uploads', 'contracts', fileName);

    const exists = fs.existsSync(filePath);

    return {
      exists,
      fileName: exists ? fileName : null,
      url: exists ? `/api/contracts/download/${fileName}` : null,
      viewUrl: exists ? `/api/contracts/view/${fileName}` : null
    };
  }
}
