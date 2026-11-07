'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Download, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getAuthUser } from '@/lib/api/auth-storage';

/*
 * "Share your streak", Duolingo-style: draws a branded card (deep navy and
 * mint, the logo, the streak and level) in the browser and lets the learner
 * share it to WhatsApp, Instagram and others, or download it. Nothing is
 * uploaded: the image is made on the device.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dolearnn.com';
const W = 1080;
const H = 1350;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawCard(input: { days: number; firstName: string; level: string; xp: number }) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');

  // Deep navy background with a soft mint glow, as on the site.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#022a49');
  bg.addColorStop(1, '#044272');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W - 120, 140, 10, W - 120, 140, 520);
  glow.addColorStop(0, 'rgba(84, 205, 152, 0.35)');
  glow.addColorStop(1, 'rgba(84, 205, 152, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Logo: mark on a white tile, then the wordmark.
  const mark = await loadImage('/logo-mark.png');
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 90, 90, 96, 96, 20);
  ctx.fill();
  ctx.drawImage(mark, 102, 103, 72, 68);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 56px Montserrat, "Segoe UI", Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('DoLearnn', 214, 140);

  // The streak.
  ctx.textAlign = 'center';
  ctx.font = '220px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.fillText('🔥', W / 2, 470);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 260px "Segoe UI", Arial, sans-serif';
  ctx.fillText(String(input.days), W / 2, 720);
  ctx.fillStyle = '#54cd98';
  ctx.font = '700 64px "Segoe UI", Arial, sans-serif';
  ctx.fillText(input.days === 1 ? 'day streak' : 'day streak!', W / 2, 870);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '500 44px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`${input.firstName} is practising every day`, W / 2, 980);

  // Level pill.
  const pill = `${input.level} · ${input.xp.toLocaleString()} XP`;
  ctx.font = '600 38px "Segoe UI", Arial, sans-serif';
  const pillW = ctx.measureText(pill).width + 80;
  ctx.fillStyle = 'rgba(84, 205, 152, 0.18)';
  roundRect(ctx, (W - pillW) / 2, 1040, pillW, 76, 38);
  ctx.fill();
  ctx.fillStyle = '#9fe3c4';
  ctx.fillText(pill, W / 2, 1079);

  // Footer.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '500 34px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Exam practice that shows you what to fix', W / 2, 1210);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 36px "Segoe UI", Arial, sans-serif';
  ctx.fillText(SITE_URL.replace(/^https?:\/\//, ''), W / 2, 1265);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create image'))), 'image/png'),
  );
}

export default function ShareStreak({ days, level, xp }: { days: number; level: string; xp: number }) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const message = `I'm on a ${days}-day practice streak on DoLearnn 🔥 Join me: ${SITE_URL}`;

  useEffect(() => {
    if (!open) return;
    let url = '';
    const firstName = getAuthUser()?.name?.split(' ')[0] || 'I';
    setFailed(false);
    drawCard({ days, firstName, level, xp })
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setImage({ blob, url });
      })
      .catch(() => setFailed(true));
    return () => {
      if (url) URL.revokeObjectURL(url);
      setImage(null);
    };
  }, [open, days, level, xp]);

  const file = image ? new File([image.blob], `dolearnn-${days}-day-streak.png`, { type: 'image/png' }) : null;
  const canShareFile =
    typeof navigator !== 'undefined' && !!file && !!navigator.canShare && navigator.canShare({ files: [file] });

  async function shareNative() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], text: message });
    } catch {
      // Cancelled by the learner, or not supported: nothing to do.
    }
  }

  function download() {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `dolearnn-${days}-day-streak.png`;
    link.click();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs">
          <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share your streak</DialogTitle>
          <DialogDescription>Show friends you are practising every day.</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-[#022a49] dark:border-border">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt={`${days}-day streak card`} className="block w-full" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center text-sm text-white/70">
              {failed ? 'Could not create the image.' : 'Creating your card…'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {canShareFile && (
            <Button className="col-span-2" onClick={shareNative}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          )}
          <Button asChild variant="outline">
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </a>
          </Button>
          <Button variant="outline" onClick={download} disabled={!image}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button variant="ghost" className="col-span-2" onClick={copyLink}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copied' : 'Copy message'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
