import { Navigation } from "@/components/Navigation";
import { AuditLogViewer } from "@/components/AuditLogViewer";

export default function AuditLogsPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Activity Logs</h1>
              <p className="text-slate-500 mt-1">System-wide audit trail and security events</p>
            </div>
          </div>

          <AuditLogViewer />
        </div>
      </div>
    </>
  );
}