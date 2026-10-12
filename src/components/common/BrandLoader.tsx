import { useTranslation } from 'react-i18next';

/** Shown only while a storefront page is being downloaded. */
export function BrandLoader() {
  const { t } = useTranslation();
  return (
    <div className="brand-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="brand-loader-content">
        <div className="brand-loader-logo">
          <img src="/images/client/kitchenscaleco-logo.png" alt="KitchenScaleCo" width="626" height="417" />
        </div>
        <p className="brand-loader-tagline">Measure better. Cook better.</p>
        <div className="brand-loader-track" aria-hidden="true"><span /></div>
        <p>{t('states.loading')}</p>
      </div>
    </div>
  );
}
