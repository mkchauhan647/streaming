import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
 
// 1. Specify protected and public routes
const protectedRoutes = ['/admin']
const publicRoutes = ['/login', '/signup', '/']
 
export default async function middleware(req: NextRequest) {

  console.log("HEllo I am middelware")
  console.log(req.nextUrl.pathname);

  // if (req.nextUrl.pathname == '/admin') {
  //   console.log("Helo not ")
  //   // return new Response(JSON.stringify({ msg: "Unauthorized" }), { status: 403 });
  //   // return new Response("You are not authorized !")
  //   return NextResponse.redirect(req.nextUrl.origin)
  // }
 
  return NextResponse.next();
}
 
// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}