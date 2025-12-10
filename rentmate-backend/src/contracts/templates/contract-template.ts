type PartyInfo = {
  name: string;
  email?: string;
  phone?: string;
};

type ListingInfo = {
  title: string;
  address: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  price?: number;
};

type FinancialInfo = {
  depositAmount?: number;
  monthlyRent?: number;
  startDate?: string;
  endDate?: string;
};

type PlatformInfo = PartyInfo & {
  website?: string;
  role?: string;
};

export type ContractTemplateData = {
  contractNumber: string;
  landlord: PartyInfo;
  tenant: PartyInfo;
  listing: ListingInfo;
  financial: FinancialInfo;
  platform?: PlatformInfo;
  generatedAt?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('vi-VN');
};

export const buildContractHtml = (data: ContractTemplateData) => {
  const issuedAt =
    data.generatedAt ||
    new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });

  const landlordName = escapeHtml(data.landlord.name || 'Bên A');
  const tenantName = escapeHtml(data.tenant.name || 'Bên B');
  const platform = {
    name: escapeHtml(data.platform?.name || 'RentMate'),
    website: escapeHtml(data.platform?.website || process.env.APP_BASE_URL || 'https://rentmate.vn'),
    email: escapeHtml(
      data.platform?.email ||
        process.env.MAIL_FROM?.replace(/.*<(.+)>/, '$1') ||
        'support@rentmate.vn',
    ),
    phone: escapeHtml(data.platform?.phone || '—'),
    role: escapeHtml(
      data.platform?.role || 'Nền tảng RentMate giữ tiền cọc làm trung gian cho hai bên',
    ),
  };

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <title>Hợp đồng thuê ${escapeHtml(data.listing.title || '')}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', 'DejaVu Sans', Arial, sans-serif;
        margin: 0;
        padding: 28px;
        color: #0f172a;
        background: #f8fafc;
        line-height: 1.6;
      }
      h1, h2, h3 { margin: 0; }
      .paper {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      }
      .heading {
        text-align: center;
        margin-bottom: 18px;
      }
      .heading h1 {
        font-size: 22px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .muted { color: #475569; font-size: 13px; }
      .badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 999px;
        background: #e0f2fe;
        color: #075985;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.05em;
      }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
      .section {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px 16px;
        margin-top: 14px;
        background: linear-gradient(180deg, #fff, #fbfdff);
      }
      .section-title {
        font-size: 13px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #0f172a;
        margin-bottom: 10px;
      }
      .pair { display: flex; align-items: baseline; gap: 8px; margin: 6px 0; }
      .pair-label { min-width: 110px; font-weight: 700; color: #0f172a; }
      .pair-value { color: #1e293b; }
      .clauses { padding-left: 16px; margin: 0; color: #0f172a; }
      .clauses li { margin-bottom: 8px; }
      .footer {
        margin-top: 18px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        text-align: center;
      }
      .sign-box {
        border: 1px dashed #cbd5e1;
        border-radius: 12px;
        padding: 16px;
        min-height: 140px;
        background: #f8fafc;
      }
      .sign-title { font-weight: 800; letter-spacing: 0.06em; }
      .hint { font-size: 12px; color: #475569; margin-top: 8px; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      th, td {
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        font-size: 13px;
      }
      th { background: #f1f5f9; text-transform: uppercase; letter-spacing: 0.04em; }
    </style>
  </head>
  <body>
    <div class="paper">
      <div class="heading">
        <div class="badge">HỢP ĐỒNG THUÊ NHÀ / CĂN HỘ</div>
        <h1>${escapeHtml(data.listing.title || 'Hợp đồng thuê')}</h1>
        <p class="muted">Số hợp đồng: ${escapeHtml(data.contractNumber)}</p>
        <p class="muted">Ngày phát hành: ${escapeHtml(issuedAt)}</p>
      </div>

      <div class="grid">
        <div class="section">
          <div class="section-title">Bên A - Bên cho thuê</div>
          <div class="pair"><span class="pair-label">Họ và tên</span><span class="pair-value">${landlordName}</span></div>
          <div class="pair"><span class="pair-label">Email</span><span class="pair-value">${escapeHtml(data.landlord.email || '—')}</span></div>
          <div class="pair"><span class="pair-label">Số điện thoại</span><span class="pair-value">${escapeHtml(data.landlord.phone || '—')}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Bên B - Bên thuê</div>
          <div class="pair"><span class="pair-label">Họ và tên</span><span class="pair-value">${tenantName}</span></div>
          <div class="pair"><span class="pair-label">Email</span><span class="pair-value">${escapeHtml(data.tenant.email || '—')}</span></div>
          <div class="pair"><span class="pair-label">Số điện thoại</span><span class="pair-value">${escapeHtml(data.tenant.phone || '—')}</span></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Bên C - Nền tảng giữ cọc</div>
        <div class="pair"><span class="pair-label">Tên nền tảng</span><span class="pair-value">${platform.name}</span></div>
        <div class="pair"><span class="pair-label">Website</span><span class="pair-value">${platform.website}</span></div>
        <div class="pair"><span class="pair-label">Email</span><span class="pair-value">${platform.email}</span></div>
        <div class="pair"><span class="pair-label">Số điện thoại</span><span class="pair-value">${platform.phone}</span></div>
        <div class="pair"><span class="pair-label">Vai trò</span><span class="pair-value">${platform.role}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Thông tin bất động sản</div>
        <table>
          <tr>
            <th>Địa chỉ</th>
            <th>Diện tích</th>
            <th>Phòng ngủ</th>
            <th>Phòng tắm</th>
            <th>Giá chào thuê</th>
          </tr>
          <tr>
            <td>${escapeHtml(data.listing.address || '—')}</td>
            <td>${data.listing.area ? `${data.listing.area} m²` : '—'}</td>
            <td>${data.listing.bedrooms ?? '—'}</td>
            <td>${data.listing.bathrooms ?? '—'}</td>
            <td>${formatCurrency(data.listing.price)}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Điều khoản tài chính</div>
        <div class="grid">
          <div>
            <div class="pair"><span class="pair-label">Tiền cọc</span><span class="pair-value">${formatCurrency(data.financial.depositAmount)}</span></div>
            <div class="pair"><span class="pair-label">Tiền thuê</span><span class="pair-value">${formatCurrency(data.financial.monthlyRent)} / tháng</span></div>
          </div>
          <div>
            <div class="pair"><span class="pair-label">Bắt đầu</span><span class="pair-value">${formatDate(data.financial.startDate)}</span></div>
            <div class="pair"><span class="pair-label">Kết thúc</span><span class="pair-value">${formatDate(data.financial.endDate)}</span></div>
          </div>
        </div>
        <p class="muted" style="margin-top:8px;">
          Tiền cọc được chuyển vào Bên C (nền tảng) để giữ hộ và chỉ giải ngân khi Bên A và Bên B xác nhận bàn giao.
        </p>
      </div>

      <div class="section">
        <div class="section-title">Điều khoản và cam kết chính</div>
        <ol class="clauses">
          <li>Bên B thanh toán đầy đủ và đúng hạn tiền thuê, tiền cọc theo thỏa thuận trên. Mọi khoản chậm thanh toán trên 05 ngày sẽ chịu lãi phạt 0.05%/ngày.</li>
          <li>Tiền cọc của Bên B được chuyển vào Bên C (nền tảng) giữ hộ và chỉ giải ngân cho Bên A khi hai bên xác nhận bàn giao; nếu giao dịch hủy theo điều kiện thỏa thuận, Bên C hoàn trả cho bên có quyền nhận lại.</li>
          <li>Bên A bàn giao nhà/ căn hộ đúng tình trạng, đầy đủ trang thiết bị như mô tả và hỗ trợ đăng ký tạm trú theo quy định.</li>
          <li>Thời hạn hợp đồng được tính từ ngày bắt đầu đến ngày kết thúc. Hai bên có thể gia hạn bằng phụ lục hợp đồng trước ít nhất 30 ngày.</li>
          <li>Bên B không tự ý sửa chữa, thay đổi kết cấu, chuyển nhượng hoặc cho thuê lại nếu không có văn bản đồng ý của Bên A.</li>
          <li>Bên A chịu trách nhiệm bảo trì kết cấu chính (tường, sàn, hệ thống điện nước âm tường). Bên B chịu chi phí hư hỏng do sử dụng sai hoặc bất cẩn.</li>
          <li>Trường hợp chấm dứt hợp đồng sớm, bên vi phạm phải thông báo trước 30 ngày và bồi hoàn tối thiểu 01 tháng tiền thuê, trừ khi có thỏa thuận khác.</li>
          <li>Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết bằng thương lượng. Nếu không đạt thỏa thuận, các bên có quyền khởi kiện tại Tòa án có thẩm quyền.</li>
        </ol>
      </div>

      <div class="section">
        <div class="section-title">Cam kết</div>
        <p class="muted">
          Hai bên đã đọc lại toàn bộ hợp đồng, hiểu rõ quyền và nghĩa vụ của mình, đồng ý thực hiện đúng các điều khoản đã nêu và cùng chịu trách nhiệm trước pháp luật.
        </p>
      </div>

      <div class="footer">
        <div class="sign-box">
          <div class="sign-title">ĐẠI DIỆN BÊN A</div>
          <div class="hint">(Ký, ghi rõ họ tên)</div>
          <div style="margin-top:42px;font-weight:700;color:#0f172a;">${landlordName}</div>
        </div>
        <div class="sign-box">
          <div class="sign-title">ĐẠI DIỆN BÊN B</div>
          <div class="hint">(Ký, ghi rõ họ tên)</div>
          <div style="margin-top:42px;font-weight:700;color:#0f172a;">${tenantName}</div>
        </div>
        <div class="sign-box">
          <div class="sign-title">ĐẠI DIỆN BÊN C</div>
          <div class="hint">(Ký, ghi rõ tên hoặc đóng dấu nền tảng)</div>
          <div style="margin-top:42px;font-weight:700;color:#0f172a;">${platform.name}</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
};
