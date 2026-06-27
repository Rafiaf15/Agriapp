import { redirect } from "next/navigation";

export default function Home() {
  // Default landing -> dashboard (allow public access)
  redirect("/dashboard");
}
