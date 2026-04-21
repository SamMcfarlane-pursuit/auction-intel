import React, { useEffect } from 'react';

// Street-view-style imagery via Mapillary's public embed endpoint.
// No API key required for the iframe; falls back to a "no imagery" message if none exists at the location.
// https://www.mapillary.com/developer/api-documentation

export default function StreetViewModal({ lat, lng, label, onClose }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    // Mapillary embed URL: opens the nearest available image to the given coordinates.
    const mapillaryUrl =
        `https://www.mapillary.com/embed?image_key=&map_style=Mapillary+light` +
        `&x=${lng}&y=${lat}&z=17&style=photo`;

    return (
        <div className="sv-backdrop" role="dialog" aria-modal="true" aria-label="Street view">
            <div className="sv-modal">
                <div className="sv-header">
                    <div className="sv-title">
                        <span className="sv-dot" />
                        <div>
                            <div className="sv-label">Street-Level Imagery</div>
                            <div className="sv-coords">
                                {label ? `${label} · ` : ''}
                                {lat.toFixed(4)}°, {lng.toFixed(4)}°
                            </div>
                        </div>
                    </div>
                    <div className="sv-actions">
                        <a
                            className="sv-ext-link"
                            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open in Google Street View ↗
                        </a>
                        <button type="button" className="sv-close" onClick={onClose} aria-label="Close">×</button>
                    </div>
                </div>
                <div className="sv-body">
                    <iframe
                        title="Mapillary street view"
                        src={mapillaryUrl}
                        frameBorder="0"
                        allowFullScreen
                        loading="lazy"
                    />
                    <div className="sv-footnote">
                        Imagery via Mapillary (community-contributed).
                        If no panorama appears, use the Google Street View link above.
                    </div>
                </div>
            </div>
        </div>
    );
}
