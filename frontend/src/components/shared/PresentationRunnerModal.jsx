import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import SlideCanvas from "../sprint/SlideCanvas";
import { useCanvasFit } from "../../hooks/useCanvasFit";
import { useCountdown, formatMmSs } from "../../hooks/useCountdown";

// PO bir takimin sunumu icin sure girmemisse (Kapak adiminda "Sunum süresi"
// bos/0 birakilmissa) bu takim aninda atlanmasin diye kullanilan varsayilan.
const DEFAULT_TEAM_SECONDS = 5 * 60;

function teamSeconds(item) {
  const minutes = item?.content?.timerMinutes;
  return minutes != null && Number(minutes) > 0 ? Number(minutes) * 60 : DEFAULT_TEAM_SECONDS;
}

/**
 * Ortak Sunum ekraninin "Sunumu Başlat" modu: secilen takimlarin (bkz.
 * JointPresentationPage `results`) sunumlarini SIRAYLA, her birinin kendi
 * (Kapak adiminda PO'nun girdigi) suresi kadar tam ekran gosterir. Bir
 * takimin suresi dolunca otomatik siradaki takima gecer ve toplam kalan
 * sureyi gunceller (bkz. useCountdown). Son takimin suresi de dolunca
 * "Sunum tamamlandı" durumunda kalir - otomatik kapanmaz, kullanici "Kapat"
 * ile cikar.
 */
export default function PresentationRunnerModal({ open, onClose, queue, assets }) {
  const { boxRef, scale } = useCanvasFit();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  // Her acilista bastan basla - onceki bir "Sunumu Baslat" turundan kalan
  // durum (hangi takimda kalindigi, tamamlandi mi) tasinmaz.
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setFinished(false);
    }
  }, [open]);

  const current = queue?.[currentIndex] || null;
  const currentSeconds = current ? teamSeconds(current) : 0;
  const active = open && !finished && !!current;

  const advance = () => {
    setCurrentIndex((i) => {
      const next = i + 1;
      if (!queue || next >= queue.length) {
        setFinished(true);
        return i;
      }
      return next;
    });
  };

  const remaining = useCountdown(currentSeconds, active, advance);
  const critical = active && remaining <= 15;

  const totalRemaining = useMemo(() => {
    if (!queue) return 0;
    const restTeams = queue.slice(currentIndex + 1).reduce((sum, item) => sum + teamSeconds(item), 0);
    return (finished ? 0 : remaining) + restTeams;
  }, [queue, currentIndex, remaining, finished]);

  return (
    <Modal open={open} onClose={onClose} boxClassName="zoombox">
      <div className="zoombar presentation-runner-bar">
        <div className={`presentation-runner-status${critical ? " timer-critical" : ""}`}>
          {finished ? (
            <span className="presentation-runner-team">🎉 Sunum tamamlandı</span>
          ) : (
            <>
              <span className="presentation-runner-team">{current?.teamName}</span>
              <span className="timer-badge">{formatMmSs(remaining)}</span>
            </>
          )}
        </div>
        <div className="presentation-runner-total">Toplam kalan: {formatMmSs(totalRemaining)}</div>
        <Button variant="close" className="zoom-close" onClick={onClose} style={{ marginLeft: "auto" }}>
          Kapat
        </Button>
      </div>
      <div className="zoomstagewrap">
        <div className="zoomstage" ref={boxRef}>
          {open && current && <SlideCanvas data={current.sprintData} tab="content" assets={assets} scale={scale} />}
          {open && finished && (
            <div className="presentation-runner-done-overlay">
              <span>Sunum tamamlandı</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
