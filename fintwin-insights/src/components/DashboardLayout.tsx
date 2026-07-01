import AppSidebar from './AppSidebar';
import AppNavbar from './AppNavbar';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppNavbar />
        <main className="relative flex-1 p-8 overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(70rem_30rem_at_15%_-10%,hsl(239_84%_67%/.16),transparent_60%),radial-gradient(55rem_24rem_at_90%_5%,hsl(160_84%_39%/.10),transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(210_20%_98%),hsl(210_20%_97%))]" />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
