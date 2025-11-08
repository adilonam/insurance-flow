import { auth } from "@/auth";
import { UserDropdown } from "./user-dropdown";

export async function UserDropdownWrapper() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return <UserDropdown user={session.user} />;
}

