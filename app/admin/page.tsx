import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import Layout from "@/components/kokonutui/layout"

// Sections split into components for clarity and reuse
import PhoneLoginsTable from "@/components/admin/phone-logins-table"
import UsersTable from "@/components/admin/users-table"
import ApplicationsTable from "@/components/admin/applications-table"
import SupportPanel from "@/components/admin/support-panel"
import PoliciesAndPush from "@/components/admin/policies-and-push"

type Section = "phones" | "users" | "applications" | "support" | "policies"

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string }>
}) {
  const params = await searchParams
  const allowed: Section[] = ["phones", "users", "applications", "support", "policies"]
  const raw = (params?.section || "phones").toLowerCase()
  const section: Section = allowed.includes(raw as Section) ? (raw as Section) : "phones"

  const title =
    section === "phones"
      ? "Logged-in Phones"
      : section === "users"
        ? "Users"
        : section === "applications"
          ? "Applications"
          : section === "support"
            ? "Support & Chat"
            : "Policies & Push"

  return (
    <Layout>
      <div className="p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-semibold text-balance">Admin Panel</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8 w-[200px] md:w-[280px]" placeholder="Search admin data..." />
            </div>
            <Link href="/" className="text-sm underline underline-offset-4">
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-sm text-muted-foreground">Section: {title}</p>
        </div>

        {section === "phones" && <PhoneLoginsTable />}
        {section === "users" && <UsersTable />}
        {section === "applications" && <ApplicationsTable />}
        {section === "support" && <SupportPanel />}
        {section === "policies" && <PoliciesAndPush />}
        {/* </CHANGE> */}
      </div>
    </Layout>
  )
}
