import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export type WardDefinition = {
  code: string;
  name: string;
};

export type DistrictDefinition = {
  code: string;
  name: string;
  wards: WardDefinition[];
};

export type ProvinceDefinition = {
  code: string;
  name: string;
  districts: DistrictDefinition[];
};

type RawWard = { Id: string; Name: string };
type RawDistrict = { Id: string; Name: string; Wards?: RawWard[] };
type RawProvince = { Id: string; Name: string; Districts?: RawDistrict[] };

const loadRawLocations = (): RawProvince[] => {
  const candidatePaths = [
    join(__dirname, 'vietnam-locations.json'),
    join(process.cwd(), 'src', 'common', 'constants', 'vietnam-locations.json'),
  ];
  for (const path of candidatePaths) {
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      return JSON.parse(content) as RawProvince[];
    }
  }
  return [];
};

const normalizeProvince = (province: RawProvince): ProvinceDefinition => ({
  code: province.Id,
  name: province.Name,
  districts: (province.Districts ?? []).map((district) => ({
    code: district.Id,
    name: district.Name,
    wards: (district.Wards ?? []).map((ward) => ({
      code: ward.Id,
      name: ward.Name,
    })),
  })),
});

export const VIETNAM_PROVINCES: ProvinceDefinition[] = loadRawLocations().map(normalizeProvince);

export const findProvinceByCode = (code: string | undefined) =>
  VIETNAM_PROVINCES.find((province) => province.code === code);

export const findDistrictByCode = (code: string | undefined) => {
  for (const province of VIETNAM_PROVINCES) {
    const district = province.districts.find((item) => item.code === code);
    if (district) return district;
  }
  return undefined;
};
