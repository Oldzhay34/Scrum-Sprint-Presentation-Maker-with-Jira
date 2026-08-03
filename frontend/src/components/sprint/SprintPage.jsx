import { SECTION_KEYS, sectionDefs } from "../../lib/geometry";
import BandEditorPanel from "./BandEditorPanel";
import SectionEditor from "./SectionEditor";
import PreviewPane from "./PreviewPane";
import ErrorBanner from "../shared/ErrorBanner";

const SECTION_TITLES_TR = {
  done: "İçerik — her satır bir madde",
};

/**
 * Sprint Sunumu modu: sol tarafta icerik formu (hedef bandi + 4 bolum),
 * sagda canli onizleme. Orijinal HTML'deki <main id="sprintMode"> ile birebir aynidir.
 */
export default function SprintPage({ visible, form, band, excel, assets, curTab, onTabChange, onZoom, onExpandSection }) {
  const SEC = sectionDefs(assets);

  return (
    <main className={visible ? "" : "hidden"}>
      <section>
        <BandEditorPanel band={band} />
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
          />
        ))}
      </section>
      <PreviewPane data={form.data} assets={assets} curTab={curTab} onTabChange={onTabChange} onZoom={onZoom} />
    </main>
  );
}
