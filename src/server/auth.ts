import { GetServerSidePropsContext } from "next"
import { Session, getServerSession } from "next-auth"
import { authOptions } from "../pages/api/auth/[...nextauth]"

export const getServerAuthSession = async (ctx: {
  req: GetServerSidePropsContext['req'],
  res: GetServerSidePropsContext['res']
}) => {
  return await getServerSession<any, Session>(ctx.req, ctx.res, authOptions)
}