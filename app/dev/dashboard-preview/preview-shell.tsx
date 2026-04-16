'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  ShieldCheck,
} from 'lucide-react';

import { MovynSiteHeader } from '@/components/layout/header/movyn-site-header';
import { getMovynDashboardProviderStyle } from '@/components/layout/movyn-dashboard-layout';
import { MovynAppSidebar } from '@/components/layout/sidebar/movyn-app-sidebar';
import type { MovynNavMainGroup } from '@/components/layout/sidebar/movyn-nav-main';
import { MovynNavUser } from '@/components/layout/sidebar/movyn-nav-user';
import {
  AccountFormCard,
  AccountFormField,
  AccountFormPage,
  AccountGridPage,
} from '@/components/layout/account-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  accountPageTitle,
  buildAccountSettingsNavGroups,
  type AccountNavKey,
} from '@/lib/movyn-account-nav';
import {
  ACCOUNT_SETTINGS_BASE,
} from '@/lib/movyn-account-routes';

import { DASHBOARD_PREVIEW_BASE, previewSectionHref } from './preview-routes';

const CHIRO_NAV: { key: AccountNavKey; label: string }[] = [
  { key: 'welcome', label: 'Getting started' },
  { key: 'practice', label: 'Your practice' },
  { key: 'profile', label: 'Your profile' },
  { key: 'specialties', label: 'Specialties' },
  { key: 'membership', label: 'Membership' },
  { key: 'referrals', label: 'Referrals' },
];

const COMING_SOON_NAV: { key: AccountNavKey; label: string }[] = [
  { key: 'messages', label: 'Messages' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'groups', label: 'Groups' },
];

/** Rewrite `/account/settings/*` hrefs to `/dev/dashboard-preview/*` so active state matches this preview tree. */
function rewriteNavGroupsForPreview(groups: MovynNavMainGroup[]): MovynNavMainGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      href: item.href.startsWith(ACCOUNT_SETTINGS_BASE)
        ? DASHBOARD_PREVIEW_BASE + item.href.slice(ACCOUNT_SETTINGS_BASE.length)
        : item.href,
    })),
  }));
}

export function DashboardPreviewShell({ activeNav }: { activeNav: AccountNavKey }) {
  const navGroups = rewriteNavGroupsForPreview(
    buildAccountSettingsNavGroups(CHIRO_NAV, COMING_SOON_NAV),
  );

  const title = accountPageTitle(activeNav);

  return (
    <SidebarProvider defaultOpen style={getMovynDashboardProviderStyle()}>
      <MovynAppSidebar
        navGroups={navGroups}
        footer={
          <MovynNavUser
            displayName="Preview User"
            email="preview@movyn.local"
            firstName="Preview"
            lastName="User"
            showAdminLink
            onSignOut={() => {
              /* no-op in preview */
            }}
          />
        }
      />
      <SidebarInset>
        <div className="flex min-h-svh flex-1 flex-col">
          <MovynSiteHeader
            title={title}
            breadcrumbParent={{ label: 'Account', href: previewSectionHref('profile') }}
            actions={
              <>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  Preview mode
                </Badge>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/">Exit preview</Link>
                </Button>
              </>
            }
          />
          <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-[--content-padding]">
            <PreviewPanel activeNav={activeNav} />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function PreviewPanel({ activeNav }: { activeNav: AccountNavKey }) {
  switch (activeNav) {
    case 'welcome':
      return <WelcomePreview />;
    case 'profile':
      return <ProfilePreview />;
    case 'practice':
      return <PracticePreview />;
    case 'specialties':
      return <SpecialtiesPreview />;
    case 'preferences':
      return <PreferencesPreview />;
    case 'membership':
      return <MembershipPreview />;
    case 'referrals':
      return <ReferralsPreview />;
    default:
      return (
        <AccountFormPage
          title={accountPageTitle(activeNav)}
          description="This section is coming soon."
        >
          <AccountFormCard>
            <p className="text-sm text-muted-foreground">
              We're building this area next. Nothing to do here yet.
            </p>
          </AccountFormCard>
        </AccountFormPage>
      );
  }
}

const MOCK_CHECKLIST = [
  { key: 'address', label: 'Add your practice address', complete: true },
  { key: 'modalities', label: 'Add your techniques and modalities', complete: true },
  { key: 'philosophy', label: 'Philosophy', complete: true },
  { key: 'focusAreas', label: 'Specialties and focus areas', complete: false },
  { key: 'businessModel', label: 'Business model and insurance', complete: false },
];

function WelcomePreview() {
  const score = Math.round(
    (MOCK_CHECKLIST.filter((i) => i.complete).length / MOCK_CHECKLIST.length) * 100,
  );
  return (
    <AccountFormPage
      title="Getting Started with Movyn"
      description="Your profile will be published as a public listing when our team verifies your license."
    >
      <AccountFormCard>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">License status</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-10 gap-y-1 text-sm text-muted-foreground">
              <span>License Issued: 10/7/2026</span>
              <span>License Expires: 10/7/2026</span>
            </div>
            <Badge
              variant="outline"
              className="h-9 gap-2 rounded-md border-blue-600/20 bg-blue-600/5 px-3 text-sm font-medium text-foreground"
            >
              <ShieldCheck className="size-4 text-blue-600" />
              License Verified
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Your profile is {score}% complete</p>
          <p className="text-sm text-muted-foreground">
            Complete your profile to show up in search results and get better match scores
          </p>
          <div className="flex items-center gap-2 pl-2">
            <div
              className="relative h-2 flex-1 overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-foreground"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="w-8 text-right text-sm text-muted-foreground">{score}%</span>
          </div>
          <ul className="mt-1 flex flex-col gap-1">
            {MOCK_CHECKLIST.map((item) => (
              <li key={item.key} className="flex items-center gap-2 py-1.5">
                <span className="flex size-8 items-center justify-center pl-2" aria-hidden>
                  {item.complete ? (
                    <CheckCircle2 className="size-4 text-emerald-600 opacity-90" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground/60" />
                  )}
                </span>
                <span className="text-sm text-foreground">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button">Update practice info</Button>
          <Button type="button">Update specialties</Button>
        </div>
      </AccountFormCard>
    </AccountFormPage>
  );
}

function ProfilePreview() {
  return (
    <AccountFormPage
      title="Update your profile"
      description="Your profile will be published as a public listing when our team verifies your license."
    >
      <AccountFormCard>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">License status</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">License Issued: 10/7/2026</p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary">
                Edit
              </Button>
              <Button type="button">Save</Button>
            </div>
          </div>
        </div>

        <AccountFormField
          id="pv-user"
          label="Username"
          description="This is your public display name. It can be your real name or a pseudonym. You can only change this once every 30 days."
        >
          <Input id="pv-user" defaultValue="shadcn" />
        </AccountFormField>

        <AccountFormField
          id="pv-email"
          label="Email"
          description="You can manage verified email addresses in your email settings."
        >
          <NativeSelect id="pv-email" defaultValue="">
            <option value="">Select a verified email to display</option>
            <option value="a">alex@movyn.local</option>
            <option value="b">alex.chen@movyn.local</option>
          </NativeSelect>
        </AccountFormField>

        <AccountFormField
          id="pv-bio"
          label="Bio"
          description="You can @mention other users and organizations to link to them."
        >
          <Textarea id="pv-bio" rows={3} defaultValue="I own a computer." />
        </AccountFormField>

        <AccountFormField
          id="pv-url-1"
          label="URLs"
          description="Add links to your website, blog, or social media profiles."
          descriptionPosition="above"
        >
          <div className="flex flex-col gap-2">
            <Input id="pv-url-1" defaultValue="https://shadcn.com" />
            <Input defaultValue="http://twitter.com/shadcn" />
            <Button type="button" variant="outline" size="sm" className="self-start">
              Add URL
            </Button>
          </div>
        </AccountFormField>
      </AccountFormCard>
    </AccountFormPage>
  );
}

function PracticePreview() {
  return (
    <AccountFormPage
      title="Your practice"
      description="Where you see patients and how you present your professional profile."
    >
      <AccountFormCard>
        <AccountFormField id="pv-clinic" label="Practice / clinic name">
          <Input id="pv-clinic" defaultValue="Atlas Chiropractic" />
        </AccountFormField>
        <AccountFormField id="pv-addr" label="Street address">
          <Input id="pv-addr" defaultValue="123 Main St" />
        </AccountFormField>
        <div className="grid grid-cols-2 gap-3">
          <AccountFormField id="pv-city" label="City">
            <Input id="pv-city" defaultValue="Austin" />
          </AccountFormField>
          <AccountFormField id="pv-state" label="State">
            <Input id="pv-state" defaultValue="TX" />
          </AccountFormField>
        </div>
        <AccountFormField
          id="pv-bio"
          label="Professional bio"
          description="Patients will read this on your public profile."
        >
          <Textarea id="pv-bio" rows={4} defaultValue="Gentle, evidence-based care…" />
        </AccountFormField>
      </AccountFormCard>
    </AccountFormPage>
  );
}

const MOCK_MODALITIES = ['Gonstead', 'Diversified', 'Activator', 'Thompson', 'Webster', 'Cox'];
const MOCK_SPECIALTIES = ['Sports', 'Pediatric', 'Prenatal', 'Geriatric', 'Wellness', 'Auto injury'];
const MOCK_PHILOSOPHIES = ['Evidence-based', 'Subluxation-based', 'Wellness', 'Holistic'];

function SpecialtiesPreview() {
  const column = (title: string, options: string[]) => (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <h4 className="text-sm font-semibold leading-5 text-foreground">{title}</h4>
      <div className="flex flex-col gap-2">
        {options.map((m, idx) => (
          <label key={m} className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox defaultChecked={idx < 2} />
            {m}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <AccountGridPage
      title="Specialties"
      description="How patients will filter and match to you in search. Choose all that apply."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {column('Techniques', MOCK_MODALITIES)}
        {column('Specialties', MOCK_SPECIALTIES)}
        {column('Philosophy', MOCK_PHILOSOPHIES)}
        {column('Business model', ['Cash', 'Insurance', 'Hybrid'])}
        {column('Insurance', ['BCBS', 'Aetna', 'Cigna', 'UnitedHealthcare'])}
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
          <h4 className="text-sm font-semibold leading-5 text-foreground">Budget range</h4>
          <NativeSelect defaultValue="">
            <option value="">No preference</option>
            <option value="low">Under $75</option>
            <option value="mid">$75 – $150</option>
            <option value="high">Over $150</option>
          </NativeSelect>
        </div>
      </div>
    </AccountGridPage>
  );
}

function PreferencesPreview() {
  return (
    <AccountFormPage
      title="Your preferences"
      description="Personal info and what you're looking for; used to tailor your chiropractor matches."
    >
      <AccountFormCard>
        <div className="grid grid-cols-2 gap-3">
          <AccountFormField id="pv-phone" label="Phone">
            <Input id="pv-phone" defaultValue="(555) 123-4567" />
          </AccountFormField>
          <AccountFormField id="pv-dob" label="Date of birth">
            <Input id="pv-dob" type="date" defaultValue="1990-01-01" />
          </AccountFormField>
        </div>
        <AccountFormField id="pv-bm" label="Preferred business model">
          <NativeSelect id="pv-bm" defaultValue="hybrid">
            <option value="">No preference</option>
            <option value="cash">Cash-based</option>
            <option value="insurance">Insurance-based</option>
            <option value="hybrid">Hybrid</option>
          </NativeSelect>
        </AccountFormField>
      </AccountFormCard>
    </AccountFormPage>
  );
}

function MembershipPreview() {
  return (
    <AccountFormPage
      title="Membership"
      description="Your Movyn plan. Premium unlocks referrals and extra discovery features."
    >
      <AccountFormCard>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Current plan</p>
          <p className="text-sm text-muted-foreground">
            Free — status: free. Upgrade for premium features as they launch.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button">Subscribe monthly</Button>
          <Button type="button" variant="secondary">
            Subscribe annual
          </Button>
        </div>
      </AccountFormCard>
    </AccountFormPage>
  );
}

function ReferralsPreview() {
  return (
    <AccountFormPage
      title="Referrals"
      description="Send and receive patient referrals from colleagues."
    >
      <AccountFormCard>
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No pending referrals.</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600" />
          <p className="text-sm text-muted-foreground">
            This preview shows the empty state. Real data is loaded on the authenticated route.
          </p>
        </div>
      </AccountFormCard>
    </AccountFormPage>
  );
}
