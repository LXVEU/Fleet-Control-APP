/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ключ eslint УДАЛЕН, так как он больше не поддерживается в Next.js 16
  // Для игнорирования ошибок линтера при сборке используйте:
  // npm run build -- --no-lint
  // или добавьте скрипт в package.json: "build": "next build --no-lint"
}

module.exports = nextConfig