import Layout from "@/components/kokonutui/layout"
import CollegesTable from "@/components/admin/colleges-table"

export default function CollegesPage() {
  return (
    <Layout>
      <div className="p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-semibold text-balance">Colleges Management</h1>
        </div>

        <div className="mb-3">
          <p className="text-sm text-muted-foreground">Manage college information, logos, and content</p>
        </div>

        <CollegesTable />
      </div>
    </Layout>
  )
}
