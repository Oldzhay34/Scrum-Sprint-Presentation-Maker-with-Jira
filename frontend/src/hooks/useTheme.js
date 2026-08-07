import { useLayoutEffect, useState } from "react";

const STORAGE_KEY = "aksa-capacity-planner-theme";

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Light/dark tema tercihini yonetir, secimi localStorage'da kalici tutar.
 * useLayoutEffect KULLANILIYOR (useEffect degil): boylece "theme-dark" class'i
 * tarayici bir sonraki frame'i boyamadan ONCE eklenir/kaldirilir. useEffect ile
 * bu, paint'ten SONRA calisiyordu ve buton gibi background-color transition'i
 * olan elemanlarda goze carpan bir "yanlis renkte kal, sonra gec" flash'ina
 * yol aciyordu (orn. profil sayfasindaki Cikis Yap butonu).
 */
export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}
