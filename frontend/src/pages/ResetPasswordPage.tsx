import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api, getApiError } from "../api/client";
import copolaoLogo from "../assets/copolao-logo-transparent.png";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Este link de redefinição está incompleto.");
      return;
    }

    if (password !== confirmation) {
      setMessage("As senhas informadas não são iguais.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/password-reset", {
        token,
        password
      });
      setSuccess(true);
      setMessage("Senha redefinida com sucesso.");
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center">
        <div className="mb-8">
          <img className="mb-5 h-24 w-24 object-contain drop-shadow-[0_0_18px_rgba(33,247,102,0.28)]" src={copolaoLogo} alt="Copolão" />
          <h1 className="text-3xl font-bold">Redefinir senha</h1>
          <p className="mt-2 text-sm leading-6 text-steel">Escolha uma nova senha para voltar ao Copolão.</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-felt p-5 shadow-sm">
          {success ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto text-limebet" size={42} />
              <p className="mt-4 text-lg font-black">Senha atualizada</p>
              <p className="mt-2 text-sm text-steel">As sessões antigas foram encerradas. Entre novamente com sua nova senha.</p>
              <Link className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-limebet font-black text-ink" to="/login">
                Ir para o login
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <label className="block">
                <span className="text-sm font-medium text-white/80">Nova senha</span>
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-white/10 bg-ink px-3 text-white outline-none focus:border-limebet focus:ring-2 focus:ring-limebet/25"
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-white/80">Confirmar nova senha</span>
                <input
                  className="mt-1 h-12 w-full rounded-lg border border-white/10 bg-ink px-3 text-white outline-none focus:border-limebet focus:ring-2 focus:ring-limebet/25"
                  minLength={6}
                  type="password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                />
              </label>

              {message ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p> : null}

              <button
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-limebet font-black text-ink shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                <KeyRound size={18} />
                {loading ? "Atualizando..." : "Criar nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
