type VietnamCityDefinition = {
  value: string;
  label: string;
  aliases?: string[];
};

export const VIETNAM_CITIES: ReadonlyArray<VietnamCityDefinition> = [
  {
    value: 'Ho Chi Minh City',
    label: 'TP. Hồ Chí Minh',
    aliases: ['tphcm', 'tp hcm', 'hcm', 'sai gon', 'saigon', 'ho chi minh'],
  },
  {
    value: 'Hanoi',
    label: 'Hà Nội',
    aliases: ['ha noi', 'ha-noi', 'hn'],
  },
  {
    value: 'Da Nang',
    label: 'Đà Nẵng',
    aliases: ['danang', 'tp da nang'],
  },
  {
    value: 'Hai Phong',
    label: 'Hải Phòng',
    aliases: ['haiphong'],
  },
  {
    value: 'Can Tho',
    label: 'Cần Thơ',
    aliases: ['cantho'],
  },
  { value: 'An Giang', label: 'An Giang' },
  {
    value: 'Ba Ria - Vung Tau',
    label: 'Bà Rịa - Vũng Tàu',
    aliases: ['ba ria', 'vung tau', 'ba ria vung tau'],
  },
  { value: 'Bac Giang', label: 'Bắc Giang' },
  { value: 'Bac Kan', label: 'Bắc Kạn' },
  { value: 'Bac Lieu', label: 'Bạc Liêu' },
  { value: 'Bac Ninh', label: 'Bắc Ninh' },
  { value: 'Ben Tre', label: 'Bến Tre' },
  { value: 'Binh Dinh', label: 'Bình Định' },
  { value: 'Binh Duong', label: 'Bình Dương' },
  { value: 'Binh Phuoc', label: 'Bình Phước' },
  { value: 'Binh Thuan', label: 'Bình Thuận' },
  { value: 'Ca Mau', label: 'Cà Mau' },
  { value: 'Cao Bang', label: 'Cao Bằng' },
  { value: 'Dak Lak', label: 'Đắk Lắk' },
  { value: 'Dak Nong', label: 'Đắk Nông' },
  { value: 'Dien Bien', label: 'Điện Biên' },
  { value: 'Dong Nai', label: 'Đồng Nai' },
  { value: 'Dong Thap', label: 'Đồng Tháp' },
  { value: 'Gia Lai', label: 'Gia Lai' },
  { value: 'Ha Giang', label: 'Hà Giang' },
  { value: 'Ha Nam', label: 'Hà Nam' },
  { value: 'Ha Tinh', label: 'Hà Tĩnh' },
  { value: 'Hai Duong', label: 'Hải Dương' },
  { value: 'Hau Giang', label: 'Hậu Giang' },
  { value: 'Hoa Binh', label: 'Hòa Bình' },
  { value: 'Hung Yen', label: 'Hưng Yên' },
  { value: 'Khanh Hoa', label: 'Khánh Hòa' },
  { value: 'Kien Giang', label: 'Kiên Giang' },
  { value: 'Kon Tum', label: 'Kon Tum' },
  { value: 'Lai Chau', label: 'Lai Châu' },
  { value: 'Lam Dong', label: 'Lâm Đồng' },
  { value: 'Lang Son', label: 'Lạng Sơn' },
  { value: 'Lao Cai', label: 'Lào Cai' },
  { value: 'Long An', label: 'Long An' },
  { value: 'Nam Dinh', label: 'Nam Định' },
  { value: 'Nghe An', label: 'Nghệ An' },
  { value: 'Ninh Binh', label: 'Ninh Bình' },
  { value: 'Ninh Thuan', label: 'Ninh Thuận' },
  { value: 'Phu Tho', label: 'Phú Thọ' },
  { value: 'Phu Yen', label: 'Phú Yên' },
  { value: 'Quang Binh', label: 'Quảng Bình' },
  { value: 'Quang Nam', label: 'Quảng Nam' },
  { value: 'Quang Ngai', label: 'Quảng Ngãi' },
  { value: 'Quang Ninh', label: 'Quảng Ninh' },
  { value: 'Quang Tri', label: 'Quảng Trị' },
  { value: 'Soc Trang', label: 'Sóc Trăng' },
  { value: 'Son La', label: 'Sơn La' },
  { value: 'Tay Ninh', label: 'Tây Ninh' },
  { value: 'Thai Binh', label: 'Thái Bình' },
  { value: 'Thai Nguyen', label: 'Thái Nguyên' },
  { value: 'Thanh Hoa', label: 'Thanh Hóa' },
  {
    value: 'Thua Thien Hue',
    label: 'Thừa Thiên Huế',
    aliases: ['hue'],
  },
  { value: 'Tien Giang', label: 'Tiền Giang' },
  { value: 'Tra Vinh', label: 'Trà Vinh' },
  { value: 'Tuyen Quang', label: 'Tuyên Quang' },
  { value: 'Vinh Long', label: 'Vĩnh Long' },
  { value: 'Vinh Phuc', label: 'Vĩnh Phúc' },
  { value: 'Yen Bai', label: 'Yên Bái' },
];

export const VIETNAM_CITY_VALUES = VIETNAM_CITIES.map((city) => city.value);

export const normalizeVietnamese = (value: string): string =>
  value
    ? value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '')
    : '';

const CITY_TOKEN_MAP = VIETNAM_CITIES.map((city) => ({
  value: city.value,
  tokens: Array.from(
    new Set(
      [city.value, city.label, ...(city.aliases ?? [])]
        .map(normalizeVietnamese)
        .filter(Boolean),
    ),
  ),
}));

export const detectVietnamCity = (input?: string): string | undefined => {
  if (!input) {
    return undefined;
  }

  const normalizedInput = normalizeVietnamese(input);
  if (!normalizedInput) {
    return undefined;
  }

  const match = CITY_TOKEN_MAP.find((city) =>
    city.tokens.some((token) => normalizedInput.includes(token)),
  );

  return match?.value;
};

