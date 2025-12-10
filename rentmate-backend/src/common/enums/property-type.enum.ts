export enum PropertyType {
  Apartment = 'apartment',
  Condo = 'condo',
  House = 'house',
  Studio = 'studio',
  Office = 'office',
}

export const propertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.Apartment]: 'Apartment',
  [PropertyType.Condo]: 'Condominium',
  [PropertyType.House]: 'Single-family House',
  [PropertyType.Studio]: 'Studio',
  [PropertyType.Office]: 'Office Space',
};
