export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/profile/:path*", "/api/app/bind", "/api/app/bind-many"],
};
