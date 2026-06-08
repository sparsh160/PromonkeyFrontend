import ClientDetailPage from "@/pages/clients/ClientDetailPage";
export default async function ClientDetail({ params }) {
    const { id } = await params;
    return <ClientDetailPage id={id} />;
}