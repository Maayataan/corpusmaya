import { useCallback } from 'react';

type BadgeType = 'speaker' | 'ally';

interface CommunityBadgeProps {
  name: string;
  type: BadgeType;
}

const SITE_URL = 'https://maayataan.org';

const COPY = {
  speaker: {
    heroMaya: "In t'aane'\nk'a'abéet",
    heroEs: 'Mi voz importa',
    roleMaya: 'Jach t\'aan maaya',
    roleEs: 'Hablante de maya yucateco',
    ctaMaya: "Ko'ox t'anik Maayáaj",
    ctaEs: 'Hablemos maya juntos',
    invite: 'Ayúdanos a registrar la voz de nuestro pueblo maya, súmate en:',
    accent: '#1B6B5A',
    accentBottom: '#C4603C',
    shareText: (name: string) =>
      `${name} se registró como hablante en maayataan — plataforma de corpus abierto de maya yucateco. ¿Hablas maya? Súmate: ${SITE_URL}/sumate`,
  },
  ally: {
    heroMaya: "Ko'one'ex",
    heroEs: 'Vamos juntos',
    roleMaya: '',
    roleEs: 'Aliado de maayataan',
    ctaMaya: "Páajtalil",
    ctaEs: 'Construyamos juntos',
    invite: '¿Quieres contribuir a preservar el maya yucateco? Súmate en:',
    accent: '#C4603C',
    accentBottom: '#1B6B5A',
    shareText: (name: string) =>
      `${name} se sumó como aliado a maayataan — plataforma de corpus abierto de maya yucateco. ¿Quieres ayudar? Únete: ${SITE_URL}/sumate`,
  },
};

export default function CommunityBadge({ name, type }: CommunityBadgeProps) {
  const c = COPY[type];

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const w = 1080;
    const h = 1920;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background
    ctx.fillStyle = '#F5EDE0';
    ctx.fillRect(0, 0, w, h);

    // Top accent
    ctx.fillStyle = c.accent;
    ctx.fillRect(0, 0, w, 12);

    // Hero text
    ctx.fillStyle = '#1A1A18';
    ctx.font = 'bold 72px serif';
    ctx.textAlign = 'center';
    const heroLines = c.heroMaya.split('\n');
    let heroY = 320;
    for (const line of heroLines) {
      ctx.fillText(line, w / 2, heroY);
      heroY += 85;
    }

    ctx.fillStyle = '#6B6560';
    ctx.font = '32px sans-serif';
    ctx.fillText(c.heroEs, w / 2, heroY + 20);

    // Card
    const cardY = 560;
    const cardH = 600;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(80, cardY, w - 160, cardH);
    ctx.strokeStyle = '#EDE3D0';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, cardY, w - 160, cardH);

    // Card top accent
    ctx.fillStyle = c.accent;
    ctx.fillRect(80, cardY, w - 160, 8);

    // Name
    ctx.fillStyle = '#1A1A18';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(name, w / 2, cardY + 140);

    // Role maya
    if (c.roleMaya) {
      ctx.fillStyle = c.accent;
      ctx.font = 'bold 36px serif';
      ctx.fillText(c.roleMaya, w / 2, cardY + 240);
    }

    // Role es
    ctx.fillStyle = '#6B6560';
    ctx.font = '28px sans-serif';
    ctx.fillText(c.roleEs, w / 2, c.roleMaya ? cardY + 290 : cardY + 240);

    // Date
    const dateStr = new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    ctx.fillStyle = '#6B6560';
    ctx.font = '24px sans-serif';
    ctx.fillText(dateStr, w / 2, cardY + 420);

    // URL in card
    ctx.fillText('maayataan.org', w / 2, cardY + 460);

    // Card bottom accent
    ctx.fillStyle = c.accentBottom;
    ctx.fillRect(80, cardY + cardH - 8, w - 160, 8);

    // CTA below card
    ctx.fillStyle = '#1A1A18';
    ctx.font = 'bold 36px serif';
    ctx.fillText(c.ctaMaya, w / 2, cardY + cardH + 100);

    ctx.fillStyle = '#6B6560';
    ctx.font = '28px sans-serif';
    ctx.fillText(c.ctaEs, w / 2, cardY + cardH + 150);

    // Invite text — wrap long lines
    ctx.fillStyle = '#6B6560';
    ctx.font = '24px sans-serif';
    const maxTextW = w - 200;
    const inviteWords = c.invite.split(' ');
    const inviteLines: string[] = [];
    let currentLine = '';
    for (const word of inviteWords) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width > maxTextW) {
        inviteLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) inviteLines.push(currentLine);
    let inviteY = cardY + cardH + 220;
    for (const line of inviteLines) {
      ctx.fillText(line, w / 2, inviteY);
      inviteY += 34;
    }

    ctx.fillStyle = c.accent;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('maayataan.org/sumate', w / 2, inviteY + 15);

    // Bottom accent
    ctx.fillStyle = c.accentBottom;
    ctx.fillRect(0, h - 12, w, 12);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }, [name, type]);

  async function shareWithImage() {
    const blob = await generateImage();
    if (!blob) return;

    const file = new File([blob], `maayataan-${type}.png`, { type: 'image/png' });
    const text = c.shareText(name);

    if (navigator.share && navigator.canShare) {
      const shareData = { files: [file], title: "Ko'one'ex — maayataan", text };
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch { /* cancelled */ }
      }
    }

    downloadBlob(blob);
  }

  async function downloadBadge() {
    const blob = await generateImage();
    if (blob) downloadBlob(blob);
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maayataan-${type}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const dateStr = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="badge-wrapper">
      <div className={`community-badge badge-${type}`}>
        <div className="badge-accent-top" />
        <div className="badge-body">
          <p className="badge-name">{name}</p>
          {c.roleMaya && <p className="badge-role-maya">{c.roleMaya}</p>}
          <p className="badge-role-es">{c.roleEs}</p>
          <p className="badge-date">{dateStr}</p>
          <p className="badge-url">maayataan.org</p>
        </div>
        <div className="badge-accent-bottom" />
      </div>

      <div className="badge-share">
        <p className="badge-share-label">Tsol a t'aan <span className="badge-share-label-es">Comparte</span></p>
        <div className="badge-share-row">
          <button type="button" className="share-btn share-primary" onClick={shareWithImage}>
            <span className="share-icon">↗</span>
            <span className="share-name">Compartir</span>
          </button>
          <button type="button" className="share-btn" onClick={downloadBadge}>
            <span className="share-icon">↓</span>
            <span className="share-name">Descargar</span>
          </button>
        </div>
      </div>

      <style>{`
        .badge-wrapper {
          max-width: 400px;
          margin: var(--space-4) auto;
        }
        .community-badge {
          border: 1px solid var(--surface);
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--card-bg);
        }
        .badge-accent-top, .badge-accent-bottom {
          height: 4px;
        }
        .badge-speaker .badge-accent-top { background: var(--primary); }
        .badge-speaker .badge-accent-bottom { background: var(--accent); }
        .badge-ally .badge-accent-top { background: var(--accent); }
        .badge-ally .badge-accent-bottom { background: var(--primary); }
        .badge-body {
          padding: var(--space-5) var(--space-4);
          text-align: center;
        }
        .badge-name {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--space-2);
        }
        .badge-role-maya {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1rem;
          color: var(--accent);
        }
        .badge-ally .badge-role-maya {
          color: var(--primary);
        }
        .badge-role-es {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: var(--space-4);
        }
        .badge-date, .badge-url {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .badge-share {
          margin-top: var(--space-3);
          text-align: center;
        }
        .badge-share-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: var(--space-2);
        }
        .badge-share-label-es {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 400;
          margin-left: var(--space-2);
        }
        .badge-share-row {
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
