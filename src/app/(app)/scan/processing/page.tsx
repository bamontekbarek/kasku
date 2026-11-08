import type { Metadata } from "next";
import { Processing } from "./Processing";

export const metadata: Metadata = { title: "Membaca Struk" };

export default function ProcessingPage() {
  return <Processing />;
}
