import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Copy, Loader2, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { api, getApiError } from "../api/client";
import { useAuth } from "../api/auth";
import type { Payment, User } from "../types/domain";
import copolaoLogo from "../assets/copolao-logo-transparent.png";

type PaymentStatusResponse = {
  payment: Payment;
  auth: {
    token: string;
    user: User;
  } | null;
};

export function PaymentPage() {
  const { paymentId } = useParams();
  const { token, user, persistSession } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [generatedQrCode, setGeneratedQrCode] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(true);
  const qrImageSrc = payment?.qrCodeBase64 ? normalizeQrImage(payment.qrCodeBase64) : generatedQrCode;

  async function loadStatus() {
    if (!paymentId) return;

    try {
      const { data } = await api.get<PaymentStatusResponse>(`/payments/${paymentId}/status`);
      setPayment(data.payment);

      if (data.auth) {
        await persistSession(data.auth);
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void loadStatus();
    const timer = window.setInterval(() => void loadStatus(), 5000);
    return () => window.clearInterval(timer);
  }, [paymentId]);

  useEffect(() => {
    let cancelled = false;
    setGeneratedQrCode("");

    if (!payment?.qrCode || payment.qrCodeBase64 || payment.qrCode.startsWith("PIX MOCK")) return;

    QRCode.toDataURL(payment.qrCode, {
      width: 360,
      margin: 2,
      color: {
        dark: "#07111f",
        light: "#ffffff"
      }
    }).then((dataUrl) => {
      if (!cancelled) setGeneratedQrCode(dataUrl);
    }).catch(() => {
      if (!cancelled) setMessage("Pix copia e cola gerado. Nao foi possivel renderizar o QR Code.");
    });

    return () => {
      cancelled = true;
    };
  }, [payment?.qrCode, payment?.qrCodeBase64]);

  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function copyPix() {
    if (!payment?.qrCode) return;
    await navigator.clipboard.writeText(payment.qrCode);
    setMessage("Pix copia e cola copiado.");
  }

  async function simulatePaid() {
    if (!paymentId) return;
    setChecking(true);
    setMessage("");
    try {
      const { data } = await api.post<PaymentStatusResponse>(`/payments/${paymentId}/mock-paid`);
      if (data.auth) {
        await persistSession(data.auth);
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center">
        <img className="mb-5 h-24 w-24 object-contain drop-shadow-[0_0_18px_rgba(33,247,102,0.28)]" src={copolaoLogo} alt="Copolão" />
        <h1 className="text-3xl font-bold">Pagamento Pix</h1>
        <p className="mt-2 text-sm leading-6 text-steel">Pague a inscrição de R$ 20 para liberar seu acesso automaticamente.</p>

        <section className="mt-6 rounded-lg border border-white/10 bg-felt p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Inscrição Copolão</p>
              <p className="text-xs text-steel">{payment ? formatMoney(payment.amountCents) : "R$ 20,00"}</p>
            </div>
            <span className="rounded-full border border-limebet/25 bg-limebet/10 px-2.5 py-1 text-xs font-bold text-limebet">
              {paymentStatusLabel(payment?.status)}
            </span>
          </div>

          <div className="mt-5 grid place-items-center rounded-lg border border-white/10 bg-white p-3">
            {qrImageSrc ? (
              <img className="h-56 w-56" src={qrImageSrc} alt="QR Code Pix" />
            ) : (
              <div className="grid h-56 w-56 place-items-center rounded-lg bg-slate-100 text-slate-900">
                <QrCode size={88} />
              </div>
            )}
          </div>

          <button
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-limebet font-black text-ink disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!payment?.qrCode}
            type="button"
            onClick={copyPix}
          >
            <Copy size={17} />
            Copiar Pix copia e cola
          </button>

          {payment?.ticketUrl ? (
            <a className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/10 text-sm font-bold text-white" href={payment.ticketUrl} rel="noreferrer" target="_blank">
              Abrir página do Pix
            </a>
          ) : null}

          {payment?.qrCode?.startsWith("PIX MOCK") ? (
            <button className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-limebet/30 text-sm font-black text-limebet" type="button" onClick={simulatePaid}>
              <CheckCircle2 size={17} />
              Simular Pix pago
            </button>
          ) : null}

          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-steel">
            {checking ? <Loader2 size={14} className="animate-spin" /> : null}
            Verificando pagamento automaticamente
          </div>

          {message ? <p className="mt-4 rounded-lg border border-limebet/25 bg-limebet/10 px-3 py-2 text-sm font-semibold text-limebet">{message}</p> : null}
        </section>

        <Link className="mt-4 text-center text-sm font-semibold text-limebet" to="/cadastro">
          Voltar ao cadastro
        </Link>
      </div>
    </main>
  );
}

function formatMoney(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(amountCents / 100);
}

function paymentStatusLabel(status?: Payment["status"]) {
  if (status === "PAID") return "Pago";
  if (status === "EXPIRED") return "Expirado";
  if (status === "FAILED") return "Falhou";
  if (status === "CANCELLED") return "Cancelado";
  return "Aguardando";
}

function normalizeQrImage(value: string) {
  return value.startsWith("data:image") ? value : `data:image/png;base64,${value}`;
}
