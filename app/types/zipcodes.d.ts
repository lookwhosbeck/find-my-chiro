declare module 'zipcodes' {
  export interface ZipCodeRecord {
    zip: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
  }

  export function lookup(zip: string | undefined | null): ZipCodeRecord | undefined;

  const zipcodes: { lookup: typeof lookup };
  export default zipcodes;
}
