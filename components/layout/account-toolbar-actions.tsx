'use client';

import { Button } from '@/components/ui/button';

/** Edit / Save toolbar for account section headers (`MovynSiteHeader` actions slot). */
export function accountToolbarActions(opts: {
  onEdit: () => void;
  onSave: () => void;
  editDisabled: boolean;
  saveDisabled: boolean;
  saving: boolean;
}) {
  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={opts.editDisabled} onClick={opts.onEdit}>
        Edit
      </Button>
      <Button type="button" size="sm" disabled={opts.saveDisabled} onClick={opts.onSave}>
        {opts.saving ? 'Saving…' : 'Save'}
      </Button>
    </>
  );
}
