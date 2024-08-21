import EmailListServer from "../components/EmailListServer";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-grow overflow-hidden">
        <EmailListServer />
      </main>
    </div>
  );
}
