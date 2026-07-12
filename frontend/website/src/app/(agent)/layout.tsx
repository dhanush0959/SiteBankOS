import { AgentHeader } from '@/components/shared/agent-header';
import { AgentBottomNav } from '@/components/shared/agent-bottom-nav';
import { AuthGate } from '@/components/shared/auth-gate';
import { AgentSidebar } from '@/components/shared/agent-sidebar';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex h-screen overflow-hidden bg-background">
        <AgentSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
          <AgentHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar pb-24 md:pb-8">
            {children}
          </main>
          <AgentBottomNav />
        </div>
      </div>
    </AuthGate>
  );
}
