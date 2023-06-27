import Layout from "~/components/Layout"

export default function Page() {
  return <div>
    hi
  </div>
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>
    {page}
  </Layout>
}