export type AccountShellProfileSummary = {
  id: string;
  role: 'patient' | 'chiropractor' | 'admin';
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};
