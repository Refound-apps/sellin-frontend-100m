import {
  getProdejomatOrganizationSchema,
  getProdejomatSoftwareSchema,
  getProdejomatWebsiteSchema,
  getProdejomatFaqSchema,
  getProdejomatBreadcrumbSchema,
} from '@/lib/prodejomat/seo';

export default function ProdejomatSchema({ host }: { host?: string | null }) {
  const schemas = [
    getProdejomatOrganizationSchema(host),
    getProdejomatSoftwareSchema(host),
    getProdejomatWebsiteSchema(host),
    getProdejomatFaqSchema(host),
    getProdejomatBreadcrumbSchema(host),
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
