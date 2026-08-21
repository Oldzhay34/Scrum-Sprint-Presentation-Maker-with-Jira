const STEPS = [
  { key: "cover", no: 1, label: "Kapak Sayfası Parametreleri" },
  { key: "sprint", no: 2, label: "İçerik Slaytı Parametreleri" },
  { key: "dash", no: 3, label: "Kapasite Dashboard Parametreleri" },
  // 4. adim - kullanici bildirimi 2026-08-20: "3 kapasite dashboard
  // parametrelerinin yanına 4. sayfa geliyor velocity chart & burndown
  // graph parametreleri kısmı".
  { key: "velocity", no: 4, label: "Velocity & Burndown Parametreleri" },
];

/**
 * Parametreleri sayfali (wizard) hale getiren adim gostergesi: once kapak,
 * sonra icerik slayti, en son kapasite dashboard'unkiler doldurulur.
 * Adimlara dogrudan tiklayarak da atlanabilir.
 */
export default function WizardSteps({ step, onStepChange, onBack }) {
  return (
    <div className="wizard-steps">
      {STEPS.map((s, i) => (
        <div className="wizard-step-wrap" key={s.key}>
          <button
            type="button"
            className={`wizard-step${step === s.key ? " active" : ""}${STEPS.findIndex((x) => x.key === step) > i ? " done" : ""}`}
            onClick={() => onStepChange(s.key)}
          >
            <span className="wizard-step-no">{s.no}</span>
            <span className="wizard-step-label">{s.label}</span>
          </button>
          {i < STEPS.length - 1 && <span className="wizard-step-line" />}
        </div>
      ))}
      {onBack && (
        <button type="button" className="btn soft wizard-steps-back" onClick={onBack}>
          ← Geri
        </button>
      )}
    </div>
  );
}
