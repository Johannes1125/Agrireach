import React from "react";
import ProducersPageClient from "../../components/producers/ProducersPage.client";

export const dynamic = "force-dynamic";

export default async function ProducersPage() {
  // In the future, you can fetch server data here and pass as props.
  return <ProducersPageClient />;
}
