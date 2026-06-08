import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
export default async function ProjectDetail({ params }) {
    const { id } = await params;
    return <ProjectDetailPage id={id} />;
}