import GlassCockpit from '@/components/tools/GlassCockpit';
import GoogleAd from '@/components/ads/GoogleAd';

export default function GlassCockpitPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="text-xs text-slate-400 mb-2">Patrocínio</div>
          <div className="flex justify-center">
            <GoogleAd slot="5734627033" format="auto" />
          </div>
        </div>
        <GlassCockpit />
      </div>
    </div>
  );
}
