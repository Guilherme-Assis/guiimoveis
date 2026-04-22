import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "/logo-korretora.png";

interface KorretoraLoaderProps {
  /** Real progress 0-100. If omitted, an indeterminate animation runs. */
  progress?: number;
  /** Status text under the progress bar */
  status?: string;
  /** Compact = inline (no fullscreen). Default = fullscreen splash */
  compact?: boolean;
  /** Override stats (otherwise fetched from backend) */
  brokers?: number;
  properties?: number;
}

/**
 * Splash de carregamento oficial da KORRETORA.
 * Reaproveitado em toda a aplicação. Aceita % real, # de corretores ativos e # de imóveis cadastrados.
 */
const KorretoraLoader = ({
  progress,
  status = "Conectando corretores e imóveis...",
  compact = false,
  brokers: brokersProp,
  properties: propertiesProp,
}: KorretoraLoaderProps) => {
  const [stats, setStats] = useState<{ brokers: number; properties: number }>({
    brokers: brokersProp ?? 0,
    properties: propertiesProp ?? 0,
  });

  useEffect(() => {
    if (brokersProp !== undefined && propertiesProp !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const [bRes, pRes] = await Promise.all([
          supabase.from("brokers").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("db_properties").select("id", { count: "exact", head: true }).eq("availability", "available"),
        ]);
        if (cancelled) return;
        setStats({
          brokers: brokersProp ?? bRes.count ?? 0,
          properties: propertiesProp ?? pRes.count ?? 0,
        });
      } catch {
        /* silencioso — splash ainda funciona */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brokersProp, propertiesProp]);

  const hasProgress = typeof progress === "number";
  const pct = hasProgress ? Math.max(0, Math.min(100, progress!)) : undefined;

  return (
    <div
      className={
        compact
          ? "kload kload--compact"
          : "kload kload--full"
      }
      role="status"
      aria-live="polite"
      aria-label="Carregando KORRETORA"
    >
      <style>{css}</style>

      {/* skyline */}
      <svg className="kload-skyline" viewBox="0 0 1440 180" preserveAspectRatio="xMidYMax meet" aria-hidden>
        <g fill="#c9a227">
          <rect x="0" y="80" width="40" height="100" /><rect x="5" y="60" width="30" height="20" />
          <rect x="50" y="50" width="60" height="130" /><rect x="55" y="30" width="50" height="22" /><rect x="60" y="20" width="10" height="12" />
          <rect x="120" y="90" width="35" height="90" />
          <rect x="165" y="40" width="70" height="140" /><rect x="170" y="20" width="60" height="22" /><rect x="178" y="8" width="8" height="14" />
          <rect x="245" y="70" width="45" height="110" />
          <rect x="300" y="55" width="55" height="125" /><rect x="305" y="35" width="45" height="22" />
          <rect x="365" y="90" width="30" height="90" />
          <rect x="405" y="45" width="65" height="135" /><rect x="410" y="28" width="55" height="19" /><rect x="416" y="14" width="9" height="16" />
          <rect x="480" y="75" width="40" height="105" />
          <rect x="530" y="60" width="50" height="120" />
          <rect x="590" y="42" width="75" height="138" /><rect x="595" y="22" width="65" height="22" /><rect x="602" y="10" width="10" height="14" />
          <rect x="675" y="80" width="38" height="100" />
          <rect x="723" y="55" width="58" height="125" /><rect x="728" y="34" width="48" height="23" />
          <rect x="791" y="65" width="44" height="115" />
          <rect x="845" y="48" width="62" height="132" /><rect x="850" y="28" width="52" height="22" /><rect x="857" y="14" width="9" height="16" />
          <rect x="917" y="78" width="36" height="102" />
          <rect x="963" y="52" width="56" height="128" /><rect x="968" y="32" width="46" height="22" />
          <rect x="1029" y="70" width="42" height="110" />
          <rect x="1081" y="44" width="68" height="136" /><rect x="1086" y="24" width="58" height="22" /><rect x="1092" y="10" width="10" height="16" />
          <rect x="1159" y="82" width="37" height="98" />
          <rect x="1206" y="58" width="52" height="122" />
          <rect x="1268" y="46" width="66" height="134" /><rect x="1273" y="26" width="56" height="22" /><rect x="1280" y="12" width="9" height="16" />
          <rect x="1344" y="75" width="40" height="105" />
          <rect x="1394" y="55" width="46" height="125" />
        </g>
      </svg>

      {/* logo central */}
      <div className="kload-center">
        <div className="kload-stage">
          <svg className="kload-orbit kload-orbit-1" viewBox="0 0 148 148" aria-hidden>
            <circle cx="74" cy="74" r="68" stroke="rgba(201,162,39,0.07)" strokeWidth="1" fill="none" />
            <circle cx="74" cy="74" r="68" stroke="#c9a227" strokeWidth="1.5" strokeDasharray="50 380" strokeLinecap="round" opacity=".7" fill="none" />
            <circle cx="74" cy="6" r="4" fill="#c9a227" opacity=".9" />
          </svg>
          <svg className="kload-orbit kload-orbit-2" viewBox="0 0 128 128" aria-hidden>
            <circle cx="64" cy="64" r="58" stroke="rgba(201,162,39,0.05)" strokeWidth="1" fill="none" />
            <circle cx="64" cy="64" r="58" stroke="#c9a227" strokeWidth="1" strokeDasharray="24 340" strokeLinecap="round" opacity=".35" fill="none" />
            <circle cx="64" cy="6" r="3" fill="#c9a227" opacity=".5" />
          </svg>
          <img className="kload-logo" src={logo} alt="KORRETORA" />
        </div>
        <div className="kload-brand">KO<em>RR</em>ETORA</div>
        <div className="kload-tagline">COMUNIDADE DE CORRETORES</div>
      </div>

      {/* progress real */}
      <div className="kload-progress">
        <div className="kload-p-labels">
          <span className="kload-p-lbl">CARREGANDO</span>
          <span className="kload-p-lbl">{hasProgress ? `${Math.round(pct!)}%` : ""}</span>
        </div>
        <div className="kload-p-track">
          <div
            className={hasProgress ? "kload-p-fill" : "kload-p-fill kload-p-fill--indet"}
            style={hasProgress ? { width: `${pct}%` } : undefined}
          />
        </div>
        <div className="kload-p-status">{status}</div>
      </div>

      {/* badges com stats reais */}
      <div className="kload-badges">
        <div className="kload-bdg">
          <span className="kload-bdg-dot kload-bdg-dot--gold" />
          <span className="kload-bdg-txt">
            {stats.brokers} corretor{stats.brokers === 1 ? "" : "es"} ativo{stats.brokers === 1 ? "" : "s"}
          </span>
        </div>
        <div className="kload-bdg">
          <span className="kload-bdg-dot kload-bdg-dot--blue" />
          <span className="kload-bdg-txt">
            {stats.properties} imóve{stats.properties === 1 ? "l" : "is"} cadastrado{stats.properties === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
};

const css = `
.kload{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0b0e14;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden}
.kload--full{position:fixed;inset:0;z-index:9999;width:100%;height:100vh;min-height:480px}
.kload--compact{width:100%;min-height:320px;border-radius:12px}
.kload-skyline{position:absolute;bottom:0;left:0;right:0;height:140px;opacity:.06;pointer-events:none}
.kload-center{position:relative;z-index:5;display:flex;flex-direction:column;align-items:center}
.kload-stage{position:relative;width:148px;height:148px;display:flex;align-items:center;justify-content:center;margin-bottom:18px}
.kload-orbit{position:absolute;inset:0;width:100%;height:100%;animation:kload-spin 7s linear infinite}
.kload-orbit-2{inset:10px;width:calc(100% - 20px);height:calc(100% - 20px);animation:kload-spin 11s linear infinite reverse}
@keyframes kload-spin{to{transform:rotate(360deg)}}
.kload-logo{width:88px;height:88px;object-fit:contain;position:relative;z-index:3;animation:kload-pop .7s cubic-bezier(.34,1.56,.64,1) .2s both}
@keyframes kload-pop{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}
.kload-brand{font-size:26px;font-weight:700;letter-spacing:-.5px;color:#fff;animation:kload-fade .5s .7s ease both}
.kload-brand em{color:#c9a227;font-style:normal}
.kload-tagline{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.32);margin-top:5px;animation:kload-fade .5s .9s ease both}
@keyframes kload-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.kload-progress{margin-top:32px;z-index:5;width:260px;display:flex;flex-direction:column;gap:8px;animation:kload-fade .4s 1.1s ease both}
.kload-p-labels{display:flex;justify-content:space-between}
.kload-p-lbl{font-size:10px;color:rgba(201,162,39,.6);letter-spacing:1px;font-weight:600}
.kload-p-track{width:100%;height:2px;background:rgba(255,255,255,.06);border-radius:99px;overflow:hidden;position:relative}
.kload-p-fill{height:100%;background:#c9a227;border-radius:99px;transition:width .4s ease}
.kload-p-fill--indet{width:35%;animation:kload-indet 1.4s ease-in-out infinite}
@keyframes kload-indet{0%{margin-left:-35%}100%{margin-left:100%}}
.kload-p-status{font-size:11px;color:rgba(255,255,255,.32);letter-spacing:.3px;text-align:center;margin-top:2px}
.kload-badges{display:flex;gap:10px;margin-top:22px;z-index:5;animation:kload-fade .4s 1.3s ease both;flex-wrap:wrap;justify-content:center;padding:0 16px}
.kload-bdg{background:rgba(255,255,255,.03);border:.5px solid rgba(255,255,255,.08);border-radius:20px;padding:6px 14px;display:flex;align-items:center;gap:7px}
.kload-bdg-dot{width:6px;height:6px;border-radius:50%;animation:kload-blink 2s ease-in-out infinite}
.kload-bdg-dot--gold{background:#c9a227}
.kload-bdg-dot--blue{background:#4a9eff;animation-delay:.9s}
@keyframes kload-blink{0%,100%{opacity:1}50%{opacity:.2}}
.kload-bdg-txt{font-size:11px;color:rgba(255,255,255,.55);font-weight:500}
`;

export default KorretoraLoader;
