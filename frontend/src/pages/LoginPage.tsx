import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../api/auth";
import { getApiError } from "../api/client";
import copolaoLogo from "../assets/copolao-logo-transparent.png";

export function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Entrar no bolao" subtitle="Acesse seus palpites, jogos e ranking.">
      <form className="space-y-4" onSubmit={submit}>
        <Field label="E-mail" type="email" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" value={password} onChange={setPassword} />
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <button className="h-12 w-full rounded-lg bg-limebet font-black text-ink shadow-glow" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-center text-sm text-steel">
          Nao tem conta?{" "}
          <Link className="font-semibold text-limebet" to="/cadastro">
            Cadastrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
    inviteCode: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Criar conta" subtitle="O codigo de convite libera sua entrada no bolao.">
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Nome" value={form.name} onChange={(name) => setForm((old) => ({ ...old, name }))} />
        <Field label="Apelido" value={form.nickname} onChange={(nickname) => setForm((old) => ({ ...old, nickname }))} />
        <Field label="E-mail" type="email" value={form.email} onChange={(email) => setForm((old) => ({ ...old, email }))} />
        <Field label="Senha" type="password" value={form.password} onChange={(password) => setForm((old) => ({ ...old, password }))} />
        <Field label="Codigo de convite" value={form.inviteCode} onChange={(inviteCode) => setForm((old) => ({ ...old, inviteCode }))} />
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <button className="h-12 w-full rounded-lg bg-limebet font-black text-ink shadow-glow" disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </button>
        <p className="text-center text-sm text-steel">
          Ja tem conta?{" "}
          <Link className="font-semibold text-limebet" to="/login">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center">
        <div className="mb-8">
          <img className="mb-5 h-24 w-24 object-contain drop-shadow-[0_0_18px_rgba(33,247,102,0.28)]" src={copolaoLogo} alt="Copolão" />
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-steel">{subtitle}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-felt p-5 shadow-sm">{children}</div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/80">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-lg border border-white/10 bg-ink px-3 text-white outline-none focus:border-limebet focus:ring-2 focus:ring-limebet/25"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={label !== "Apelido"}
      />
    </label>
  );
}
