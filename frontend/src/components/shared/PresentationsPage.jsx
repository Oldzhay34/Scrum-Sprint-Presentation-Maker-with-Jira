import { useEffect, useState } from "react";
import TopBar from "./TopBar";
import PresentationListPanel from "./PresentationListPanel";
import { fetchTeams } from "../../lib/apiClient";

/**
 * PO'nun kendi takiminin kayitli sprint sunumlarini gordugu tek panelli
 * sayfa (/presentations) - AdminHomePage'in sag panelindeki ayni
 * PresentationListPanel'i, takim secici olmadan, dogrudan personnel.teamId
 * ile kullanir.
 */
export default function PresentationsPage({ personnel, theme, onToggleTheme }) {
  const [teamName, setTeamName] = useState(personnel?.department || "");

  useEffect(() => {
    if (!personnel?.teamId) return;
    fetchTeams()
      .then((teams) => {
        const match = teams.find((t) => t.id === personnel.teamId);
        if (match) setTeamName(match.name);
      })
      .catch(() => {
        // takim adi cekilemezse department etiketiyle devam edilir
      });
  }, [personnel]);

  return (
    <>
      <TopBar theme={theme} onToggleTheme={onToggleTheme} personnel={personnel} />
      <main className="presentations-page">
        {personnel?.teamId ? (
          <PresentationListPanel teamId={personnel.teamId} teamName={teamName} canManage showNewButton={false} />
        ) : (
          <div className="presentation-list-empty">Takımınız belirlenemedi, lütfen yöneticinizle iletişime geçin.</div>
        )}
      </main>
    </>
  );
}
