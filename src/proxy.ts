import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** reservierung.cafe-doa.de serves the staff dashboard. */
const STAFF_SUBDOMAIN = "reservierung";
const STAFF_PATH = `/${STAFF_SUBDOMAIN}`;

export async function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const { pathname } = request.nextUrl;
  const isStaffHost = host.startsWith(`${STAFF_SUBDOMAIN}.`);

  let response: NextResponse;
  if (isStaffHost && !pathname.startsWith(STAFF_PATH)) {
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = pathname === "/" ? STAFF_PATH : `${STAFF_PATH}${pathname}`;
    response = NextResponse.rewrite(rewritten, { request });
  } else {
    response = NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  // Refreshing here keeps staff signed in: Server Components cannot write
  // cookies, so without this the session would expire mid-shift.
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image optimization.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
