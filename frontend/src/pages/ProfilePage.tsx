import { FormEvent, useState } from "react";
import { KeyRound, Save, UserRound } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { api, getApiError } from "../api/client";
import { useAuth } from "../api/auth";
import type { User } from "../types/domain";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    try {
      const { data } = await api.patch<{ user: User }>("/users/me", {
        name,
        nickname,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });
      updateUser(data.user);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Perfil atualizado.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  return (
    <section>
      <PageHeader title="Perfil" description="Ajuste seus dados de participante e sua senha de acesso." />

      <form className="rounded-lg border border-white/10 bg-felt p-4 text-white shadow-sm" onSubmit={submit}>
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-limebet text-ink">
            <UserRound size={22} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user?.email}</p>
            <p className="text-xs uppercase text-steel">{user?.role}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium text-white/80">Nome</span>
            <input
              className="mt-1 h-12 w-full rounded-lg border border-white/10 bg-ink px-3 text-white outline-none focus:border-limebet"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label>
            <span className="text-sm font-medium text-white/80">Apelido</span>
            <input
              className="mt-1 h-12 w-full rounded-lg border border-white/10 bg-ink px-3 text-white outline-none focus:border-limebet"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-ink p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <KeyRound size={17} className="text-limebet" />
            Alterar senha
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-white/80">Senha atual</span>
              <input
                className="mt-1 h-12 w-full rounded-lg border border-white/10 bg-felt px-3 text-white outline-none focus:border-limebet"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>
            <label>
              <span className="text-sm font-medium text-white/80">Nova senha</span>
              <input
                className="mt-1 h-12 w-full rounded-lg border border-white/10 bg-felt px-3 text-white outline-none focus:border-limebet"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>
          </div>
        </div>

        {message ? <p className="mt-4 rounded-lg border border-limebet/25 bg-limebet/10 px-3 py-2 text-sm font-semibold text-limebet">{message}</p> : null}

        <button className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-limebet font-black text-ink md:w-auto md:px-5" type="submit">
          <Save size={18} />
          Salvar perfil
        </button>
      </form>
    </section>
  );
}
