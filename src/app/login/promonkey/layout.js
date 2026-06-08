import Sidebar from "@/components/Sidebar";
import Topbar  from "@/components/Topbar";

export default function PromonkeyLayout({ children }) {
    return (
        <div className="flex h-auto w-full overflow-hidden bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6 bg-background">
                    {children}
                </main>
            </div>
        </div>
    );
}