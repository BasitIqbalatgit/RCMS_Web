import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  console.log("Middleware running for path:", request.nextUrl.pathname);
  
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  console.log("Token received:", token ? "Yes" : "No");
  
  const path = request.nextUrl.pathname;
  // Add reset-password to public routes
  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(`${route}?`));
  const isAuthRoute = path.startsWith('/api/auth');
  
  if (isPublicRoute || isAuthRoute) {
    return NextResponse.next();
  }
  
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(loginUrl);
  }
  
  const userRole = token.role as string;
  
  if (path.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (path.startsWith('/operator') && userRole !== 'operator') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  if ((path.startsWith('/saas') || path.startsWith('/saas_provider')) && 
      userRole !== 'saas_provider') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// Configure the paths that should be checked by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    '/',
  ],
};