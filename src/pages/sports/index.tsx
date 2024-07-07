import { Box } from "@mui/material"
import Layout from "~/components/Layout"

export default function SportsList() {
  const offices: number[] = [1, 2, 3, 4, 5, 6]

  return (
    <Box>
      {offices.map(office => {
        return (
          <div>asdf</div>
        )
      })}
    </Box>
  )
}

SportsList.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

SportsList.auth = true