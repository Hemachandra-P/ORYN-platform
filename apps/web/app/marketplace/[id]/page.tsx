import ListingDetail from "./ListingDetail";

// The site is exported as static files, so one placeholder page is built and
// served for every listing; the client reads the real id from the URL.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function Page() {
  return <ListingDetail />;
}
