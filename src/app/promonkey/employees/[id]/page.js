import EmployeeDetailPage from "@/pages/employees/EmployeeDetailPage";

export default async function EmployeeDetail({ params }) {
    const { id } = await params;
    return <EmployeeDetailPage id={id} />;
}