// app/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          res.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // ─── ПУБЛИЧНЫЕ СТРАНИЦЫ (ДОСТУПНЫ БЕЗ ВХОДА) ───
  const publicPaths = [
    '/login',
    '/register', 
    '/mileage-add',
    '/forgot-password',
    '/reset-password'
  ]
  const isPublic = publicPaths.some(p => path === p)

  // ─── ЕСЛИ НЕТ СЕССИИ И СТРАНИЦА НЕ ПУБЛИЧНАЯ → НА ЛОГИН ───
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // ─── ЕСЛИ ЕСТЬ СЕССИЯ И СТРАНИЦА ЛОГИН → НА ГЛАВНУЮ ───
  if (session && path === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg).*)'],
}