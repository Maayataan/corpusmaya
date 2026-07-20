import { useRef, useCallback } from 'react';

interface CertificateProps {
  contributorName: string;
  entryNumber: number;
  totalCount: number;
}

const SITE_URL = 'https://maayataan.org';

function getShareText(entry: number) {
  return `Contribuí al corpus abierto de maya yucateco — entrada #${entry}. ¿Sabes maya? Contribuye en: ${SITE_URL}`;
}

export default function Certificate({ contributorName, entryNumber, totalCount }: CertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const w = 1080;
    const h = 1920;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background — sascab
    ctx.fillStyle = '#F5EDE0';
    ctx.fillRect(0, 0, w, h);

    // Top accent — terracotta
    ctx.fillStyle = '#C4603C';
    ctx.fillRect(0, 0, w, 12);

    // Certificate card area
    const cardY = 520;
    const cardH = 700;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(80, cardY, w - 160, cardH);
    ctx.strokeStyle = '#EDE3D0';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, cardY, w - 160, cardH);

    // Card top accent
    ctx.fillStyle = '#C4603C';
    ctx.fillRect(80, cardY, w - 160, 8);

    // "Ma'alob meyaj"
    ctx.fillStyle = '#1A1A18';
    ctx.font = 'bold 56px serif';
    ctx.textAlign = 'center';
    ctx.fillText("Ma'alob meyaj", w / 2, cardY + 100);

    // "Buen trabajo"
    ctx.fillStyle = '#6B6560';
    ctx.font = '28px sans-serif';
    ctx.fillText('Buen trabajo', w / 2, cardY + 145);

    // Contributor name
    ctx.fillStyle = '#1A1A18';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(contributorName, w / 2, cardY + 280);

    // Detail
    ctx.fillStyle = '#6B6560';
    ctx.font = '28px sans-serif';
    ctx.fillText('contribuyó al corpus maya', w / 2, cardY + 330);

    // Entry number
    ctx.fillStyle = '#1B6B5A';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`Entrada #${entryNumber} de ${totalCount}`, w / 2, cardY + 420);

    // Date
    const dateStr = new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    ctx.fillStyle = '#6B6560';
    ctx.font = '24px sans-serif';
    ctx.fillText(dateStr, w / 2, cardY + 520);

    // URL
    ctx.fillText('maayataan.org', w / 2, cardY + 560);

    // Card bottom accent
    ctx.fillStyle = '#1B6B5A';
    ctx.fillRect(80, cardY + cardH - 8, w - 160, 8);

    // Hero text above card
    ctx.fillStyle = '#1A1A18';
    ctx.font = 'bold 72px serif';
    ctx.fillText("Ko'ox t'anik", w / 2, 300);
    ctx.fillText("Maayáaj", w / 2, 385);

    ctx.fillStyle = '#6B6560';
    ctx.font = '32px sans-serif';
    ctx.fillText('Hablemos maya', w / 2, 440);

    // CTA below card
    ctx.fillStyle = '#1A1A18';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText("Ts'áaj a T'aan", w / 2, cardY + cardH + 100);

    ctx.fillStyle = '#6B6560';
    ctx.font = '28px sans-serif';
    ctx.fillText('Comparte tu voz', w / 2, cardY + cardH + 150);

    ctx.fillStyle = '#6B6560';
    ctx.font = '24px sans-serif';
    ctx.fillText('¿Sabes maya? Contribuye en:', w / 2, cardY + cardH + 210);

    ctx.fillStyle = '#1B6B5A';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('maayataan.org', w / 2, cardY + cardH + 255);

    // Bottom accent
    ctx.fillStyle = '#1B6B5A';
    ctx.fillRect(0, h - 12, w, 12);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }, [contributorName, entryNumber, totalCount]);

  async function shareWithImage() {
    const blob = await generateImage();
    if (!blob) return;

    const file = new File([blob], 'maayataan-contribucion.png', { type: 'image/png' });
    const text = getShareText(entryNumber);

    // Web Share API with file — works on mobile (WhatsApp, IG, FB, etc.)
    if (navigator.share && navigator.canShare) {
      const shareData = { files: [file], title: "Ko'ox t'anik Maayáaj", text };
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch {
          // User cancelled — fall through to download
        }
      }
    }

    // Fallback: download the image
    downloadBlob(blob);
  }

  async function downloadCertificate() {
    const blob = await generateImage();
    if (blob) downloadBlob(blob);
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maayataan-contribucion.png';
    a.click();
    URL.revokeObjectURL(url);
  }

  const dateStr = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="certificate-wrapper">
      <div className="certificate" ref={certRef}>
        <div className="cert-accent cert-accent-top" />
        <div className="cert-body">
          <p className="cert-heading-maya">Ma'alob meyaj</p>
          <p className="cert-heading-es">Buen trabajo</p>

          <p className="cert-name">{contributorName}</p>
          <p className="cert-detail">contribuyó al corpus maya</p>
          <p className="cert-entry">
            Entrada #{entryNumber} de {totalCount}
          </p>

          <p className="cert-date">{dateStr}</p>
          <p className="cert-url">maayataan.org</p>
        </div>
        <div className="cert-accent cert-accent-bottom" />
      </div>

      <div className="share-buttons">
        <p className="share-label">Tsol a t'aan <span className="share-label-es">Comparte</span></p>
        <div className="share-row">
          <button type="button" className="share-btn share-primary" onClick={shareWithImage} aria-label="Compartir imagen">
            <span className="share-icon">↗</span>
            <span className="share-name">Compartir</span>
          </button>
          <button type="button" className="share-btn" onClick={downloadCertificate} aria-label="Descargar imagen">
            <span className="share-icon">↓</span>
            <span className="share-name">Descargar</span>
          </button>
        </div>
      </div>

      <style>{`
        .certificate-wrapper {
          max-width: 400px;
          margin: var(--space-4) auto;
        }
        .certificate {
          border: 1px solid var(--surface);
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--card-bg);
        }
        .cert-accent {
          height: 4px;
        }
        .cert-accent-top {
          background: var(--accent);
        }
        .cert-accent-bottom {
          background: var(--primary);
        }
        .cert-body {
          padding: var(--space-5) var(--space-4);
          text-align: center;
        }
        .cert-heading-maya {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
        }
        .cert-heading-es {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: var(--space-4);
        }
        .cert-name {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--space-1);
        }
        .cert-detail {
          color: var(--text-muted);
          margin-bottom: var(--space-2);
        }
        .cert-entry {
          font-weight: 600;
          color: var(--primary);
          margin-bottom: var(--space-4);
        }
        .cert-date {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .cert-url {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .share-buttons {
          margin-top: var(--space-3);
          text-align: center;
        }
        .share-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: var(--space-2);
        }
        .share-label-es {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 400;
          margin-left: var(--space-2);
        }
        .share-row {
          display: flex;
          gap: var(--space-2);
          justify-content: center;
        }
        .share-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--surface);
          border-radius: var(--radius);
          background: var(--card-bg);
          cursor: pointer;
          min-height: 48px;
          min-width: 80px;
          transition: border-color 150ms ease-out;
        }
        .share-btn:hover {
          border-color: var(--text-muted);
        }
        .share-icon {
          font-family: var(--font-mono);
          font-weight: 600;
          font-size: 0.85rem;
        }
        .share-name {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .share-primary {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        .share-primary .share-icon { color: white; }
        .share-primary .share-name { color: rgba(255,255,255,0.8); }
        .share-primary:hover { border-color: var(--primary-hover); background: var(--primary-hover); }
      `}</style>
    </div>
  );
}
