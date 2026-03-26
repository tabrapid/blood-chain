import LoginForm from "@/components/auth/LoginForm";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireAuth";

const roleToPath = (role: string | null | undefined) => {
  switch (role) {
    case "donor":
      return "/donor";
    case "hospital":
      return "/hospital";
    case "blood_center":
      return "/blood-center";
    default:
      return "/";
  }
};

export default async function LoginPage() {
  const user = await requireUser();
  if (user) redirect(roleToPath(user.role));
  return (
    <div className="mx-auto flex min-h-[78vh] w-full max-w-6xl items-center justify-center px-4 py-10">
      <LoginForm />
    </div>
  );
}

