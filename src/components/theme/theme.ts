/** Préférence de thème (stockée dans le navigateur uniquement). */
export type ThemePref = "dark" | "light" | "system";
export const THEME_STORAGE_KEY = "parkquest.theme";
export const THEME_COLORS = { dark: "#031711", light: "#f3f8f5" } as const;

/**
 * Script exécuté avant le premier rendu (dans <head>) : applique la préférence
 * sans flash. Sans préférence enregistrée → "default" (app sombre, pages de lecture claires).
 */
export const themeInitScript = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)},p=localStorage.getItem(k);
if(p!=="dark"&&p!=="light"&&p!=="system")p="default";
var r=p==="light"||(p==="system"&&matchMedia("(prefers-color-scheme: light)").matches)?"light":"dark";
var d=document.documentElement;d.dataset.themePref=p;d.dataset.theme=r;d.style.colorScheme=r;
var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",r==="light"?${JSON.stringify(THEME_COLORS.light)}:${JSON.stringify(THEME_COLORS.dark)});
}catch(e){}})();`;
