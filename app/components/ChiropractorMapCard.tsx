'use client';

import Link from 'next/link';
import { buildChiropractorSpecialtyLine } from '../lib/chiropractor-specialty-line';
import type { Chiropractor } from '../lib/queries';

function MapLocationPin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path
        d="M0.00312419 5.85942C0.00312419 2.62214 2.68992 0 6.00156 0C9.3132 0 12 2.62214 12 5.85942C12 9.56583 8.24473 14.0085 6.67639 15.7017C6.30773 16.0994 5.69227 16.0994 5.32361 15.7017C3.75527 14.0085 0 9.56583 0 5.85942H0.00312419ZM6.00156 7.9534C6.53186 7.9534 7.04043 7.74391 7.41541 7.37102C7.79038 6.99814 8.00104 6.49239 8.00104 5.96505C8.00104 5.43771 7.79038 4.93196 7.41541 4.55907C7.04043 4.18619 6.53186 3.9767 6.00156 3.9767C5.47127 3.9767 4.96269 4.18619 4.58772 4.55907C4.21274 4.93196 4.00208 5.43771 4.00208 5.96505C4.00208 6.49239 4.21274 6.99814 4.58772 7.37102C4.96269 7.74391 5.47127 7.9534 6.00156 7.9534Z"
        fill="currentColor"
      />
    </svg>
  );
}

function mapListMatchPercent(chiropractor: Chiropractor): number | null {
  const s = chiropractor.matchScore;
  if (typeof s === 'number' && Number.isFinite(s)) {
    return Math.round(Math.max(0, Math.min(100, s)));
  }
  return null;
}

export interface ChiropractorMapCardProps {
  chiropractor: Chiropractor;
  profileHref?: string;
  /** Logged-in referring chiropractor: show low-friction refer icon (does not navigate to profile). */
  showReferralIcon?: boolean;
  onReferPatient?: () => void;
}

/**
 * Map search list / mobile carousel card — layout and type from Figma 84:3608
 * (desktop: avatar left; mobile: avatar right; footer: location + distance).
 */
/** User + plus — Figma 84:3608 referral control icon */
function ReferPatientGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 12h-6M19 9v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChiropractorMapCard({
  chiropractor,
  profileHref,
  showReferralIcon,
  onReferPatient,
}: ChiropractorMapCardProps) {
  const href = profileHref ?? `/chiropractor/${chiropractor.id}`;
  const initials = `${chiropractor.firstName?.[0] || ''}${chiropractor.lastName?.[0] || ''}`.toUpperCase();
  const displayName = `Dr. ${chiropractor.firstName} ${chiropractor.lastName}`.trim();
  const specialtyLine = buildChiropractorSpecialtyLine(chiropractor);
  const locationLine = [chiropractor.city, chiropractor.state].filter(Boolean).join(', ');
  const distanceMiles =
    chiropractor.distanceMiles != null && Number.isFinite(chiropractor.distanceMiles)
      ? chiropractor.distanceMiles
      : null;
  const distanceText = distanceMiles != null ? `${distanceMiles.toFixed(1)} miles away` : '';

  const matchPercent = mapListMatchPercent(chiropractor);
  const showMatch = matchPercent !== null;
  const showReferral = Boolean(showReferralIcon && onReferPatient);
  const showMatchRow = showMatch || showReferral;

  const matchRowClass = [
    'chiropractor-map-card__match-row',
    showMatch && showReferral ? 'chiropractor-map-card__match-row--split' : '',
    showMatch && !showReferral ? 'chiropractor-map-card__match-row--match-only' : '',
    !showMatch && showReferral ? 'chiropractor-map-card__match-row--refer-only' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const showFooter = Boolean(locationLine || distanceText);

  return (
    <div className="chiropractor-map-card__outer" onClick={(e) => e.stopPropagation()}>
      <div className="mapview-card chiropractor-map-card__root" data-variant="map">
        <Link
          href={href}
          prefetch={false}
          className="mapview-card-link chiropractor-map-card__hit"
          onClick={(e) => e.stopPropagation()}
          aria-label={`View profile: ${displayName}`}
        />
        <div className="chiropractor-map-card__profile">
          <div className="chiropractor-map-card__avatar">
            {chiropractor.avatarUrl ? (
              <img src={chiropractor.avatarUrl} alt="" className="chiropractor-map-card__avatar-img" />
            ) : (
              <span className="chiropractor-map-card__avatar-initials">{initials}</span>
            )}
          </div>

          <div className="chiropractor-map-card__body">
            {showMatchRow ? (
              <div className={matchRowClass}>
                {showMatch ? (
                  <span className="chiropractor-map-card__match">
                    {matchPercent}% Match
                  </span>
                ) : null}
                {showReferral ? (
                  <button
                    type="button"
                    className="chiropractor-map-card__refer-btn"
                    aria-label={`Refer a patient to ${displayName}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onReferPatient?.();
                    }}
                  >
                    <ReferPatientGlyph />
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="chiropractor-map-card__identity">
              <p className="chiropractor-map-card__name">{displayName}</p>
              {specialtyLine ? <p className="chiropractor-map-card__specialty">{specialtyLine}</p> : null}
            </div>
          </div>
        </div>

        {showFooter ? (
          <div className="chiropractor-map-card__footer">
            {locationLine ? (
              <div className="chiropractor-map-card__location">
                <MapLocationPin className="chiropractor-map-card__pin" />
                <p className="chiropractor-map-card__location-text">{locationLine}</p>
              </div>
            ) : null}
            {distanceText ? (
              <p
                className={`chiropractor-map-card__distance${locationLine ? '' : ' chiropractor-map-card__distance--solo'}`}
              >
                {distanceText}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
