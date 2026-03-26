import RegisterForm from "@/components/auth/RegisterForm";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireAuth";

export default async function RegisterPage() {
  const user = await requireUser();
  if (user) redirect("/");
  return (
    <div className="mx-auto flex min-h-[78vh] w-full max-w-6xl items-center justify-center px-4 py-10">
      <RegisterForm />
    </div>
  );
}

