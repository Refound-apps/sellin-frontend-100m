import {
  getProdejomatOrganizationSchema,
  getProdejomatSoftwareSchema,
  getProdejomatWebsiteSchema,
} from '@/lib/prodejomat/seo';

export default function ProdejomatSchema({ host }: { host?: string | null }) {
  const schemas = [
    getProdejomatOrganizationSchema(host),
    getProdejomatSoftwareSchema(host),
    getProdejomatWebsiteSchema(host),
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
