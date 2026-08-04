const STEPS = [
  { key: "sprint", no: 1, label: "İçerik Slaytı Parametreleri" },
  { key: "dash", no: 2, label: "Kapasite Dashboard Parametreleri" },
];

/**
 * Parametreleri sayfali (wizard) hale getiren adim gostergesi: once icerik
 * slaytinin parametreleri, sonra kapasite dashboard'unkiler doldurulur.
 * Adimlara dogrudan tiklayarak da atlanabilir.
 */
export default function WizardSteps({ step, onStepChange }) {
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
    </div>
  );
}
