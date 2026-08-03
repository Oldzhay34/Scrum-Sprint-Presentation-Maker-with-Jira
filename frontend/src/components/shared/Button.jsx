/**
 * Ortak buton bileseni.
 *
 * Pressman - System Response Time: `loading` true iken buton disable olur ve
 * etiket `loadingLabel` ile degisir (orn. "Hazırlanıyor…") - kullanicinin
 * ne kadar surecegini bilmese de bir islemin devam ettigini anlamasi saglanir.
 * Pressman - Command/Menu Labeling: etiket her zaman eylem bildiren bir fiil
 * icermeli (children) - tek basina "Tamam" gibi belirsiz etiketler kullanilmamali.
 */
export default function Button({
  variant = "soft",
  loading = false,
  loadingLabel = "İşleniyor…",
  disabled = false,
  title,
  className = "",
  children,
  ...rest
}) {
  const variantClass = variant === "close" ? "btn close" : `btn ${variant}`;
  return (
    <button
      className={`${variantClass} ${className}`.trim()}
      disabled={disabled || loading}
      title={title}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
