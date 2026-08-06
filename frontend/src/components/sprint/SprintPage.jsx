import { SECTION_KEYS, sectionDefs } from "../../lib/geometry";
import BandEditorPanel from "./BandEditorPanel";
import SectionEditor from "./SectionEditor";
import ErrorBanner from "../shared/ErrorBanner";
import { hasFteTracking } from "../../lib/teamTypes";

const SECTION_TITLES_TR = {
  done: "İçerik — her satır bir madde",
};

/**
 * Sihirbazin 1. adimi: Sprint Sunumu icerik formu (hedef bandi + 4 bolum).
 * Onizleme artik UnifiedPreviewPane icinde ayri olarak yonetiliyor.
 */
export default function SprintPage({ form, band, excel, assets, onExpandSection }) {
  const SEC = sectionDefs(assets);

  return (
    <section>
      {excel.info && <div className="excelinfo" style={{ marginBottom: 10 }}>{excel.info}</div>}
      <BandEditorPanel band={band} hasFte={hasFteTracking(form.teamType)} />
      <p className="panelttl">{SECTION_TITLES_TR.done}</p>
      {excel.error && <ErrorBanner error={excel.error} onDismiss={() => {}} />}
      {SECTION_KEYS.map((key) => (
        <SectionEditor
          key={key}
          sectionKey={key}
          def={SEC[key]}
          text={form.sections[key]}
          onTextChange={(text) => form.setSectionText(key, text)}
          count={form.counts[key]}
          chips={excel.suggestions[key]}
          onChipUse={(text) => {
            form.appendToSection(key, text);
            excel.removeSuggestion(key, text);
          }}
          onExpand={() => onExpandSection(key)}
          teamType={form.teamType}
        />
      ))}
    </section>
  );
}
