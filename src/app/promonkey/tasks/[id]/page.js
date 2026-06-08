import TaskDetailPage from "@/pages/tasks/TaskDetailPage";
export default async function TaskDetail({ params }) {
    const { id } = await params;
    return <TaskDetailPage id={id} />;
}