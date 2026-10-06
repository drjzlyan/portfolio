import type { Status } from './model';

const LABEL: Record<Status, string> = {
  live: 'Live',
  building: 'Building',
  'open-source': 'Open source',
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span className="chip">
      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
