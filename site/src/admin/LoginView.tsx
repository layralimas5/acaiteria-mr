import { useState } from 'react'
import { signIn } from '../auth/useSession'
import { Logo } from '../components/Logo'
import { business } from '../config/business'
import { errorMessage, isSupabaseConfigured } from '../lib/supabase'

/** Entrada do painel. Sem login, nenhum dado da loja sai do banco. */
export function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (sending) return

    setSending(true)
    setError(null)

    void signIn(email, password)
      .catch((cause: unknown) => {
        const message = errorMessage(cause)
        // O Supabase responde em inglês; aqui a loja lê o que aconteceu.
        setError(
          message.toLowerCase().includes('invalid login')
            ? 'E-mail ou senha incorretos.'
            : message,
        )
      })
      .finally(() => setSending(false))
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-acai-50 px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo className="h-12 w-auto" />
        </div>

        <form
          onSubmit={submit}
          className="mt-6 rounded-card border border-acai-100 bg-white p-6 shadow-sm"
        >
          <h1 className="text-lg font-extrabold text-ink">Painel da {business.name}</h1>
          <p className="mt-1 text-sm text-muted">Entre para ver os pedidos.</p>

          <label className="mt-5 block">
            <span className="text-xs font-bold text-acai-700">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
              className="mt-1 w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-xs font-bold text-acai-700">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-xl border border-acai-200 px-3 py-2.5 text-sm text-ink outline-none focus:border-acai-700"
            />
          </label>

          {error && (
            <p role="alert" className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending || !isSupabaseConfigured}
            className="mt-5 w-full rounded-full bg-acai-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-acai-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? 'Entrando...' : 'Entrar'}
          </button>

          {!isSupabaseConfigured && (
            <p className="mt-3 text-xs font-semibold text-red-700">
              Banco não configurado. Preencha o arquivo .env com as credenciais do Supabase.
            </p>
          )}
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Esqueceu a senha? Ela é trocada no painel do Supabase, em Authentication.
        </p>
      </div>
    </main>
  )
}
