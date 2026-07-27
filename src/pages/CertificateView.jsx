import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getCertificateTier } from '../data/certificateTiers';
import NotFound from './NotFound';

export default function CertificateView() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (authLoading || !user || !isSupabaseConfigured) return;
    let cancelled = false;
    supabase
      .from('certificates')
      .select('id, tier, student_name, issued_at, revoked')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setCert(data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  useEffect(() => {
    if (!cert) return;
    const verifyUrl = `${window.location.origin}/verify/${cert.id}`;
    QRCode.toDataURL(verifyUrl, { width: 160, margin: 1, color: { dark: '#1A1333', light: '#00000000' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [cert]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24 text-body gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (!user || !cert) return <NotFound />;

  const tier = getCertificateTier(cert.tier);
  const isProficiency = cert.tier === 'proficiency';
  const verifyUrl = `${window.location.origin}/verify/${cert.id}`;

  return (
    <div id="certificate-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="no-print flex items-center justify-between mb-6">
        <Link to="/certificates" className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-brand transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to my certificates
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Certificate */}
      <div
        id="certificate"
        className={`relative rounded-[24px] border-[6px] bg-white dark:bg-white px-10 sm:px-16 py-14 text-center overflow-hidden ${isProficiency ? 'border-amber-400' : 'border-brand'}`}
        style={{ background: isProficiency ? 'linear-gradient(160deg, #FFFCF3, #FFFFFF 40%)' : 'linear-gradient(160deg, #FBFAFF, #FFFFFF 40%)' }}
      >
        <div
          className="absolute top-6 right-8 w-24 h-24 opacity-[0.08] pointer-events-none"
          style={{ background: isProficiency ? '#D9A406' : '#7C3AED', borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' }}
        />
        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isProficiency ? 'text-amber-600' : 'text-brand'}`}>Social Dev Technologies</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink dark:text-[#1A1333] mt-4">
          {isProficiency ? 'Certificate of Proficiency' : 'Certificate of Completion'}
        </h1>
        <p className="text-body dark:text-[#5A5473] mt-6 text-sm">This certifies that</p>
        <p className={`font-display font-extrabold text-2xl sm:text-3xl mt-2 ${isProficiency ? 'text-amber-600' : 'text-brand'}`}>{cert.student_name}</p>
        <p className="text-body dark:text-[#5A5473] mt-4 max-w-lg mx-auto leading-relaxed">
          {tier?.body || `has successfully completed the ${cert.tier} track.`}
        </p>
        <p className="text-sm text-body dark:text-[#5A5473] mt-8">
          Issued {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {cert.revoked && (
          <p className="mt-4 text-sm font-bold text-rose">This certificate has been revoked.</p>
        )}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border-soft dark:border-[#EEE6FB]">
          <div className="text-left">
            <p className="text-[11px] text-gray-400">Verify this certificate at</p>
            <p className="text-xs font-semibold text-body-strong dark:text-[#3A3358] break-all">{verifyUrl}</p>
          </div>
          {qrDataUrl && <img src={qrDataUrl} alt="Verification QR code" className="w-20 h-20 flex-shrink-0" />}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: landscape; margin: 0.4in; }
          body { background: white !important; }
          #certificate-page {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #certificate {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
